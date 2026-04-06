import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  ActivityIndicator, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../components/ui';
import { calculateProfit } from '../utils/priceService';

const MEDALS = ['🥇', '🥈', '🥉'];

interface RankEntry {
  uid: string;
  nickname: string;
  investmentType?: { emoji: string; name: string };
  totalAsset: number;
  initialBalance: number;
  profit: number;
  profitRate: number;
  portfolio: any[];
  school?: { name: string; grade?: string };
  realNameVerified: boolean;
  rank: number;
}

export default function RankingScreen() {
  const { user } = useAuth();

  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myRank, setMyRank] = useState(0);
  const [myData, setMyData] = useState<RankEntry | null>(null);
  const [selectedTab, setSelectedTab] = useState<'전체' | '우리반'>('전체');

  // ── Firestore 실시간 랭킹 (onSnapshot) ──────────
  useEffect(() => {
    setIsLoading(true);

    // 인덱스 없이도 작동하는 단순 쿼리
    const q = query(
      collection(db, 'users'),
      limit(100),
    );

    const unsubscribe = onSnapshot(q,
      (snapshot) => {
        const users = snapshot.docs
          .map(doc => {
            const data = doc.data();
            if (data.role !== 'user') return null;

            const totalAsset = data.totalAsset ?? 1_000_000;
            const initialBalance = data.initialBalance ?? 1_000_000;
            const { profit, profitRate } = calculateProfit(totalAsset, initialBalance);

            return {
              uid: doc.id,
              nickname: data.nickname ?? data.name ?? '익명',
              investmentType: data.investmentType,
              totalAsset,
              initialBalance,
              profit,
              profitRate,
              portfolio: data.portfolio ?? [],
              school: data.school,
              realNameVerified: data.realNameVerified ?? false,
              rank: 0,
            };
          })
          .filter(Boolean) as RankEntry[];

        // 수익률 기준 정렬
        const sorted = users
          .sort((a, b) => b.profitRate - a.profitRate)
          .map((u, i) => ({ ...u, rank: i + 1 }));

        setRanking(sorted);

        const myIndex = sorted.findIndex(u => u.uid === user?.id);
        setMyRank(myIndex >= 0 ? myIndex + 1 : 0);
        if (myIndex >= 0) setMyData(sorted[myIndex]);
        setIsLoading(false);
      },
      (error) => {
        console.error('랭킹 오류:', error);
        setIsLoading(false);
      },
    );

    return () => unsubscribe();
  }, [user?.id]);

  const displayRanking = selectedTab === '전체'
    ? ranking
    : ranking.filter(u =>
        u.school?.name && myData?.school?.name &&
        u.school.name === myData.school.name,
      );

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  if (isLoading) {
    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
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
            <Text style={s.myCardSub}>
              수익률 {myData.profitRate >= 0 ? '+' : ''}{myData.profitRate}%
            </Text>
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
                  <Text style={[s.rowName, isMe && { color: Colors.primary }]}>
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
                <Text style={s.rowSub}>총자산 {Math.round(item.totalAsset).toLocaleString()}원</Text>
              </View>

              {/* 수익률 */}
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[s.rowRate, { color: item.profitRate >= 0 ? Colors.green : Colors.red }]}>
                  {item.profitRate >= 0 ? '+' : ''}{item.profitRate}%
                </Text>
                <Text style={[s.rowProfit, { color: item.profit >= 0 ? Colors.green : Colors.red }]}>
                  {item.profit >= 0 ? '+' : ''}{Math.round(item.profit).toLocaleString()}원
                </Text>
              </View>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════
//  스타일
// ══════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  loadingText: { fontSize: 13, color: Colors.textSub, marginTop: 12 },

  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: Colors.text },
  countBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 12, fontWeight: '600', color: Colors.primary },

  // 내 순위 카드
  myCard: {
    backgroundColor: Colors.primary,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  myCardRank: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF' },
  myCardName: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  myCardSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 4 },
  myCardAsset: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  // 탭
  tabRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.card,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  tabBtnText: { fontWeight: 'bold', color: Colors.textSub },
  tabBtnTextActive: { color: Colors.text },

  // 랭킹 행
  row: {
    backgroundColor: Colors.card,
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
    borderColor: Colors.primary,
  },
  rowRank: { fontSize: 16, width: 44, textAlign: 'center', fontWeight: 'bold', color: Colors.text },
  rowName: { fontSize: 15, fontWeight: 'bold', color: Colors.text },
  rowSub: { color: Colors.textSub, fontSize: 12, marginTop: 2 },
  rowRate: { fontSize: 18, fontWeight: 'bold' },
  rowProfit: { fontSize: 12, marginTop: 2 },

  verifiedBadge: {
    backgroundColor: '#E8F5E9',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 4,
  },
  verifiedText: { color: '#4CAF50', fontSize: 10, fontWeight: 'bold' },

  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 8 },
  emptyText: { fontSize: 13, color: Colors.textSub, marginTop: 4 },
});
