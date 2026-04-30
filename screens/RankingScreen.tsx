import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, where, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { fetchMultiplePrices, getExchangeRate } from '../utils/priceService';
import { calculateTotalAsset } from '../utils/assetCalculator';
import { updateMissionProgress } from '../lib/missionService';

const MEDALS = ['🥇', '🥈', '🥉'];

interface RankEntry {
  uid: string;
  nickname: string;
  investmentType?: { emoji: string; name: string };
  totalAsset: number;
  portfolio: any[];
  school?: { name: string; grade?: string };
  realNameVerified: boolean;
  rank: number;
}

export default function RankingScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [rawUsers, setRawUsers] = useState<Array<{ uid: string; data: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'전체' | '우리반'>('전체');
  const [livePrices, setLivePrices] = useState<Record<string, any>>({});
  const [exchangeRate, setExchangeRate] = useState(1380);

  // ── 랭킹 화면 진입 시 데일리 미션 진행 (실패해도 화면은 정상) ──
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        await updateMissionProgress(user.id, 'ranking');
      } catch (e) {
        console.warn('데일리 미션 진행 업데이트 실패 (랭킹):', e);
      }
    })();
  }, [user?.id]);

  // ── Firestore 실시간 랭킹 (onSnapshot) — raw 데이터만 보관 ──────────
  useEffect(() => {
    setIsLoading(true);

    const q = query(
      collection(db, 'users'),
      where('role', '==', 'user'),
      limit(100),
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const users = snapshot.docs
          .filter(d => d.data()?.role === 'user')
          .map(d => ({ uid: d.id, data: d.data() }));
        setRawUsers(users);
        setIsLoading(false);
      },
      (error) => {
        console.error('랭킹 오류:', error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  // ── 환율 (USD→KRW) ──────────────────────────
  useEffect(() => {
    getExchangeRate().then(setExchangeRate).catch(() => {});
  }, []);

  // ── 시세 폴링: rawUsers 전체의 portfolio ticker, 30초 ──────
  useEffect(() => {
    const allTickers = new Set<string>();
    rawUsers.forEach(({ data }) => {
      (data.portfolio ?? []).forEach((p: any) => {
        if (p?.ticker) allTickers.add(p.ticker);
      });
    });
    if (allTickers.size === 0) return;
    const stocks = Array.from(allTickers).map(t => ({
      ticker: t,
      isKR: t.length === 6 && /^\d+$/.test(t),
    }));
    fetchMultiplePrices(stocks).then(setLivePrices).catch(() => {});
    const interval = setInterval(() => {
      fetchMultiplePrices(stocks).then(setLivePrices).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [rawUsers.length, rawUsers.map(u => u.uid).join(',')]);

  // ── 랭킹 계산 (raw + livePrices + exchangeRate) ─────────
  // 모든 사용자에게 동일한 공식 적용 — 홈/자산현황과 일치하는 실시간 시세·환율 반영
  const ranking = useMemo<RankEntry[]>(() => {
    const livePriceMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(livePrices)) {
      if (typeof (v as any)?.price === 'number') livePriceMap[k] = (v as any).price;
    }

    const entries: RankEntry[] = rawUsers.map(({ uid, data }) => {
      const balance = data.balance ?? 10_000_000;
      const portfolio = (data.portfolio ?? []) as Array<any>;
      const { totalAsset } = calculateTotalAsset({
        balance,
        portfolio,
        livePrices: livePriceMap,
        exchangeRate,
      });

      if (uid === user?.id) {
        console.log('🏆 ranking totalAsset:', totalAsset);
      }

      return {
        uid,
        nickname: data.nickname ?? data.name ?? '익명',
        investmentType: data.investmentType,
        totalAsset,
        portfolio,
        school: data.school,
        realNameVerified: data.realNameVerified ?? false,
        rank: 0,
      };
    });
    return entries
      .sort((a, b) => b.totalAsset - a.totalAsset)
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }, [rawUsers, livePrices, exchangeRate, user?.id]);

  const { myRank, myData } = useMemo(() => {
    const idx = ranking.findIndex(u => u.uid === user?.id);
    return {
      myRank: idx >= 0 ? idx + 1 : 0,
      myData: idx >= 0 ? ranking[idx] : null,
    };
  }, [ranking, user?.id]);

  const displayRanking = selectedTab === '전체'
    ? ranking
    : ranking.filter(u =>
        u.school?.name && myData?.school?.name &&
        u.school.name === myData.school.name,
      );

  // ══════════════════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════════════════
  const s = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    loadingText: { fontSize: 13, color: theme.textSecondary, marginTop: 12 },
    header: {
      backgroundColor: theme.bgCard,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: theme.text },
    countBadge: {
      backgroundColor: '#EBF2FF',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
    },
    countText: { fontSize: 12, fontWeight: '600', color: theme.primary },
    myCard: {
      backgroundColor: theme.primary,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      alignItems: 'center',
    },
    myCardRank: { fontSize: 36, fontWeight: 'bold', color: theme.bgCard },
    myCardName: { color: theme.bgCard, fontSize: 16, fontWeight: 'bold' },
    myCardAsset: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
    tabRow: {
      flexDirection: 'row',
      marginHorizontal: 16,
      marginTop: 16,
      backgroundColor: theme.bg,
      borderRadius: 12,
      padding: 4,
      borderWidth: 1,
      borderColor: theme.border,
    },
    tabBtn: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      alignItems: 'center',
    },
    tabBtnActive: {
      backgroundColor: theme.bgCard,
      elevation: 2,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    tabBtnText: { fontWeight: 'bold', color: theme.textSecondary },
    tabBtnTextActive: { color: theme.text },
    row: {
      backgroundColor: theme.bgCard,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      marginBottom: 8,
      borderRadius: 16,
      elevation: 1,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 1 },
    },
    rowMe: {
      backgroundColor: '#EBF2FF',
      borderWidth: 2,
      borderColor: theme.primary,
    },
    rowRank: { fontSize: 16, width: 44, textAlign: 'center', fontWeight: 'bold', color: theme.text },
    rowName: { fontSize: 15, fontWeight: 'bold', color: theme.text },
    rowSub: { color: theme.textSecondary, fontSize: 12, marginTop: 2 },
    rowAsset: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    verifiedBadge: {
      backgroundColor: '#E8F5E9',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      marginLeft: 4,
    },
    verifiedText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 8 },
    emptyText: { fontSize: 13, color: theme.textSecondary, marginTop: 4 },
  });

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={s.loadingText}>랭킹 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── 헤더 ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>랭킹</Text>
        <View style={s.countBadge}>
          <Text style={s.countText}>{ranking.length}명 참가</Text>
        </View>
      </View>

      {/* ── 내 순위 카드 ── */}
      {myRank > 0 && myData && (
        <View style={s.myCard}>
          <Text style={s.myCardRank}>{myRank}위</Text>
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={s.myCardName}>{myData.nickname}</Text>
            <Text style={s.myCardAsset}>
              총자산 {Math.round(myData.totalAsset).toLocaleString()}원
            </Text>
          </View>
          <Text style={{ fontSize: 40 }}>
            {myData.investmentType?.emoji ?? '📊'}
          </Text>
        </View>
      )}

      {/* ── 탭 ── */}
      <View style={s.tabRow}>
        {(['전체', '우리반'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[s.tabBtn, selectedTab === tab && s.tabBtnActive]}
          >
            <Text style={[s.tabBtnText, selectedTab === tab && s.tabBtnTextActive]}>
              {tab === '전체' ? '🌍 전체' : '🏫 우리반'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── 랭킹 리스트 ── */}
      <FlatList
        data={displayRanking}
        keyExtractor={item => item.uid}
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <View style={s.center}>
            <Text style={{ fontSize: 48 }}>🏆</Text>
            <Text style={s.emptyTitle}>아직 참가자가 없어요</Text>
            <Text style={s.emptyText}>거래를 시작하면 랭킹에 표시돼요</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.uid === user?.id;
          const isTop3 = index < 3;

          return (
            <View style={[s.row, isMe && s.rowMe]}>
              {/* 순위 */}
              <Text style={[s.rowRank, isTop3 && { fontSize: 24 }]}>
                {index === 0 ? '🥇' :
                 index === 1 ? '🥈' :
                 index === 2 ? '🥉' :
                 `${item.rank}`}
              </Text>

              {/* 투자유형 이모지 */}
              <Text style={{ fontSize: 28, marginHorizontal: 8 }}>
                {item.investmentType?.emoji ?? '📊'}
              </Text>

              {/* 닉네임 */}
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[s.rowName, isMe && { color: theme.primary }]}>
                    {item.nickname}{isMe ? ' 👈' : ''}
                  </Text>
                  {item.realNameVerified && (
                    <View style={s.verifiedBadge}>
                      <Text style={s.verifiedText}>✓인증</Text>
                    </View>
                  )}
                </View>
                {item.school?.name && (
                  <Text style={s.rowSub}>🏫 {item.school.name}</Text>
                )}
              </View>

              {/* 총자산 */}
              <Text style={s.rowAsset}>
                {Math.round(item.totalAsset).toLocaleString()}원
              </Text>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

