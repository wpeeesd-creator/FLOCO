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
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { useTheme } from '../context/ThemeContext';
import { calculateTotalAsset } from '../utils/assetCalculator';
import { updateMissionProgress } from '../lib/missionService';
import { useAppStore } from '../store/appStore';
import { Medal, Trophy, Globe, School } from 'lucide-react-native';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

interface RankEntry {
  uid: string;
  nickname: string;
  investmentType?: { emoji: string; name: string };
  totalAsset: number;
  initialBalance: number;
  portfolio: any[];
  school?: { name: string; grade?: string };
  realNameVerified: boolean;
  rank: number;
}

// 자산 증가율 — 한국 주식 관행: 양수 빨강, 음수 파랑
function formatAssetGrowth(totalAsset: number, initialBalance: number): { text: string; color: string } {
  const base = initialBalance > 0 ? initialBalance : 10_000_000;
  const rate = ((totalAsset - base) / base) * 100;
  const sign = rate > 0 ? '+' : '';
  const text = `${sign}${rate.toFixed(1)}%`;
  const color = rate > 0 ? '#FF3B30' : rate < 0 ? '#2175F3' : '#888888';
  return { text, color };
}

export default function RankingScreen() {
  const { theme, isDark } = useTheme();
  const { user } = useAuth();

  const [rawUsers, setRawUsers] = useState<Array<{ uid: string; data: any }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'전체' | '우리반'>('전체');
  const { livePrices, exchangeRate, refreshPrices, refreshExchangeRate } = useAppStore();

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
      limit(100),
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        // backend rankingTracker.ts와 동일 기준: admin만 제외
        const users = snapshot.docs
          .filter(d => d.data()?.role !== 'admin')
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

  // ── 시세 / 환율 (store 단일 source) ─────────────
  // rawUsers 전체 portfolio ticker union을 30초 간격으로 store에 refresh.
  // rawUsers가 비어있으면 가격 refresh는 skip, 환율만 갱신.
  useEffect(() => {
    const allTickers = new Set<string>();
    rawUsers.forEach(({ data }) => {
      (data.portfolio ?? []).forEach((p: any) => {
        if (p?.ticker) allTickers.add(p.ticker);
      });
    });
    const tickers = Array.from(allTickers);
    refreshExchangeRate();
    if (tickers.length > 0) refreshPrices(tickers);
    const interval = setInterval(() => {
      refreshExchangeRate();
      if (tickers.length > 0) refreshPrices(tickers);
    }, 30000);
    return () => clearInterval(interval);
  }, [rawUsers.length, rawUsers.map(u => u.uid).join(','), refreshPrices, refreshExchangeRate]);

  // ── 랭킹 계산 (raw + livePrices + exchangeRate) ─────────
  // 모든 사용자에게 동일한 공식 적용 — 홈/자산현황과 일치하는 실시간 시세·환율 반영
  const ranking = useMemo<RankEntry[]>(() => {
    // store.livePrices(PriceData) → calculateTotalAsset가 요구하는 number map으로 평탄화
    const livePriceMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(livePrices)) {
      if (typeof v?.price === 'number') livePriceMap[k] = v.price;
    }

    const entries: RankEntry[] = rawUsers.map(({ uid, data }) => {
      const balance = data.balance ?? 10_000_000;
      const initialBalance = data.initialBalance ?? 10_000_000;
      const portfolio = (data.portfolio ?? []) as Array<any>;
      const { totalAsset } = calculateTotalAsset({
        balance,
        portfolio,
        livePrices: livePriceMap,
        exchangeRate,
      });

      if (uid === user?.id) {
        console.log('ranking totalAsset:', totalAsset);
      }

      return {
        uid,
        nickname: data.nickname ?? data.name ?? '익명',
        investmentType: data.investmentType,
        totalAsset,
        initialBalance,
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
    rowGrowth: { fontSize: 11, fontWeight: '600', marginTop: 2, textAlign: 'right' },
    myCardGrowth: { fontSize: 12, fontWeight: '700', marginTop: 2 },
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
      {myRank > 0 && myData && (() => {
        const myGrowth = formatAssetGrowth(myData.totalAsset, myData.initialBalance);
        return (
          <View style={s.myCard}>
            <Text style={s.myCardRank}>{myRank}위</Text>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={s.myCardName}>{myData.nickname}</Text>
              <Text style={s.myCardAsset}>
                총자산 {Math.round(myData.totalAsset).toLocaleString()}원
              </Text>
              <Text style={[s.myCardGrowth, { color: myGrowth.color }]}>
                {myGrowth.text}
              </Text>
            </View>
          </View>
        );
      })()}

      {/* ── 탭 ── */}
      <View style={s.tabRow}>
        {(['전체', '우리반'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[s.tabBtn, selectedTab === tab && s.tabBtnActive]}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              {tab === '전체'
                ? <Globe size={16} color={selectedTab === tab ? '#fff' : theme.text} />
                : <School size={16} color={selectedTab === tab ? '#fff' : theme.text} />}
              <Text style={[s.tabBtnText, selectedTab === tab && s.tabBtnTextActive]}>
                {tab === '전체' ? '전체' : '우리반'}
              </Text>
            </View>
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
            <Trophy size={48} color="#EAB308" strokeWidth={1.8} />
            <Text style={s.emptyTitle}>아직 참가자가 없어요</Text>
            <Text style={s.emptyText}>거래를 시작하면 랭킹에 표시돼요</Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.uid === user?.id;
          const isTop3 = index < 3;
          const growth = formatAssetGrowth(item.totalAsset, item.initialBalance);

          return (
            <View style={[s.row, isMe && s.rowMe]}>
              {/* 순위 */}
              {isTop3 ? (
                <View style={[s.rowRank, { alignItems: 'center', justifyContent: 'center' }]}>
                  <Medal size={26} color={MEDAL_COLORS[index]} strokeWidth={2} />
                </View>
              ) : (
                <Text style={s.rowRank}>{item.rank}</Text>
              )}

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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <School size={11} color={theme.textSecondary} />
                    <Text style={s.rowSub}>{item.school.name}</Text>
                  </View>
                )}
              </View>

              {/* 총자산 + 자산 증가율 */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.rowAsset}>
                  {Math.round(item.totalAsset).toLocaleString()}원
                </Text>
                <Text style={[s.rowGrowth, { color: growth.color }]}>
                  {growth.text}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

