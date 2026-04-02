import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllPortfolios, getAllUserProfiles, type PortfolioSnapshot } from '../lib/firestoreService';
import { useAppStore, STOCKS } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

const BG = '#F2F4F6';
const CARD = '#FFFFFF';
const PRIMARY = '#0066FF';
const RISE = '#F04452';
const FALL = '#2175F3';
const TEXT = '#191F28';
const TEXT_SUB = '#8B95A1';
const BORDER = '#E5E8EB';

const INITIAL_FUND = 1_000_000;
const MEDALS = ['🥇', '🥈', '🥉'];

function calcTotal(snap: PortfolioSnapshot): number {
  const safeHoldings = snap.holdings ?? [];
  return safeHoldings.reduce((sum, h) => {
    const s = STOCKS.find(st => st.ticker === h.ticker);
    return sum + (s ? (s.price ?? 0) * (h.qty ?? 0) : 0);
  }, snap.cash ?? 0);
}

interface RankEntry {
  uid: string;
  name: string;
  totalValue: number;
  returnRate: number;
  tradeCount: number;
  investEmoji?: string;
}

export default function RankingScreen() {
  const { user: currentUser } = useAuth();
  const { userId } = useAppStore();

  const [ranked, setRanked] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt] = useState(new Date());

  const load = useCallback(async () => {
    try {
      const [all, users] = await Promise.all([getAllPortfolios(), getAllUserProfiles()]);
      const emojiMap: Record<string, string> = {};
      users.forEach((u: any) => {
        if (u.investmentType?.emoji) {
          emojiMap[u.uid] = u.investmentType.emoji;
        }
      });

      const entries: RankEntry[] = all.map(snap => {
        const totalValue = calcTotal(snap);
        return {
          uid: snap.uid ?? '',
          name: snap.name ?? '알 수 없음',
          totalValue,
          returnRate: ((totalValue - INITIAL_FUND) / INITIAL_FUND) * 100,
          tradeCount: (snap.trades ?? []).length,
          investEmoji: emojiMap[snap.uid] ?? undefined,
        };
      }).sort((a, b) => b.returnRate - a.returnRate);
      setRanked(entries);
    } catch {
      setRanked([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, []);

  const onRefresh = () => { setRefreshing(true); load(); };
  const myRank = ranked.findIndex(r => r.uid === userId) + 1;

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={PRIMARY} />
          <Text style={styles.loadingText}>순위 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: BG }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>전체 랭킹</Text>
            <Text style={styles.headerSub}>
              {updatedAt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
            </Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{ranked.length}명 참가</Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PRIMARY} />
          }
        >
          {/* Top 3 포디움 + 내 순위 카드 */}
          {ranked.length >= 3 && (
            <TopThreePodium ranked={ranked} />
          )}
          {myRank > 0 && (
            <MyRankCard rank={myRank} total={ranked.length} name={currentUser?.name ?? ''} />
          )}

          {/* 전체 랭킹 리스트 */}
          <View style={styles.listCard}>
            {ranked.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>🏆</Text>
                <Text style={styles.emptyTitle}>아직 참가자가 없어요</Text>
                <Text style={styles.emptySub}>거래를 시작하면 랭킹에 표시돼요</Text>
              </View>
            ) : (
              ranked.map((item, idx) => {
                const isMe = item.uid === userId;
                const isPositive = item.returnRate >= 0;
                return (
                  <View
                    key={item.uid}
                    style={[
                      styles.row,
                      isMe && styles.rowMe,
                      idx < ranked.length - 1 && styles.rowBorder,
                    ]}
                  >
                    <Text style={styles.rowRank}>
                      {idx < 3 ? MEDALS[idx] : `${idx + 1}`}
                    </Text>
                    <View style={[styles.avatar, { backgroundColor: isMe ? PRIMARY : '#EEF2F6' }]}>
                      <Text style={[styles.avatarText, { color: isMe ? '#fff' : TEXT }]}>
                        {item.name[0]?.toUpperCase() ?? '?'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={[styles.rowName, isMe && { color: PRIMARY }]}>
                          {item.name}{isMe ? ' (나)' : ''}
                        </Text>
                        {item.investEmoji ? (
                          <Text style={{ fontSize: 14 }}>{item.investEmoji}</Text>
                        ) : null}
                      </View>
                      <Text style={styles.rowSub}>총 자산 ₩{Math.round(item.totalValue).toLocaleString()}</Text>
                    </View>
                    <Text style={[styles.rowRate, { color: isPositive ? RISE : FALL }]}>
                      {isPositive ? '+' : ''}{item.returnRate.toFixed(2)}%
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function TopThreePodium({ ranked }: { ranked: RankEntry[] }) {
  const first = ranked[0];
  const second = ranked[1];
  const third = ranked[2];

  const PodiumSlot = ({ entry, rank, barHeight }: { entry: RankEntry; rank: number; barHeight: number }) => {
    const isPositive = entry.returnRate >= 0;
    const medal = MEDALS[rank - 1];
    return (
      <View style={styles.podiumSlot}>
        {rank === 1 && <Text style={styles.podiumCrown}>👑</Text>}
        <Text style={styles.podiumSlotMedal}>{medal}</Text>
        <View style={styles.podiumSlotAvatarWrap}>
          <Text style={[styles.podiumSlotAvatarText, rank === 1 && { fontSize: 26 }]}>
            {entry.investEmoji ?? entry.name[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.podiumSlotName} numberOfLines={1}>{entry.name}</Text>
        <Text style={[styles.podiumSlotRate, { color: isPositive ? RISE : FALL }]}>
          {isPositive ? '+' : ''}{entry.returnRate.toFixed(1)}%
        </Text>
        <View style={[styles.podiumBar, { height: barHeight }]} />
        <Text style={styles.podiumBarLabel}>{rank}위</Text>
      </View>
    );
  };

  return (
    <View style={styles.topThreePodium}>
      <PodiumSlot entry={second} rank={2} barHeight={60} />
      <PodiumSlot entry={first} rank={1} barHeight={80} />
      <PodiumSlot entry={third} rank={3} barHeight={40} />
    </View>
  );
}

function MyRankCard({ rank, total, name }: { rank: number; total: number; name: string }) {
  return (
    <View style={styles.myRankCard}>
      <View>
        <Text style={styles.myRankCardLabel}>내 순위</Text>
        <Text style={styles.myRankCardName}>{name}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={styles.myRankCardRank}>{rank}위</Text>
        <Text style={styles.myRankCardTotal}>/ {total}명</Text>
      </View>
    </View>
  );
}

function PodiumCard({ entry, rank, isFirst }: { entry: RankEntry; rank: number; isFirst?: boolean }) {
  const isPositive = entry.returnRate >= 0;
  return (
    <View style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
      <Text style={styles.podiumMedal}>{MEDALS[rank - 1]}</Text>
      <View
        style={[
          styles.podiumAvatar,
          isFirst && { width: 52, height: 52, borderRadius: 26 },
        ]}
      >
        <Text style={[styles.podiumAvatarText, isFirst && { fontSize: 18 }]}>
          {entry.name[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
      <Text style={[styles.podiumRate, { color: isPositive ? RISE : FALL }]}>
        {isPositive ? '+' : ''}{entry.returnRate.toFixed(1)}%
      </Text>
      <Text style={styles.podiumValue}>₩{Math.round(entry.totalValue / 10000)}만</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { fontSize: 13, color: TEXT_SUB, marginTop: 12 },

  // Header
  header: {
    backgroundColor: CARD,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: TEXT },
  headerSub: { fontSize: 12, color: TEXT_SUB, marginTop: 2 },
  countBadge: {
    backgroundColor: '#EBF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: { fontSize: 12, fontWeight: '600', color: PRIMARY },

  // 내 순위 카드
  myBanner: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  myBannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  myBannerName: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2 },
  myBannerRank: { color: '#fff', fontSize: 28, fontWeight: '800' },
  myBannerTotal: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  // 포디움
  podium: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 8,
  },
  podiumItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 12,
    paddingTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  podiumFirst: {
    paddingTop: 20,
    paddingBottom: 16,
    shadowOpacity: 0.08,
  },
  podiumMedal: { fontSize: 24, marginBottom: 4 },
  podiumAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumAvatarText: { fontSize: 14, fontWeight: '700', color: TEXT },
  podiumName: { fontSize: 12, fontWeight: '600', color: TEXT, textAlign: 'center' },
  podiumRate: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  podiumValue: { fontSize: 11, color: TEXT_SUB, marginTop: 2 },

  // 전체 랭킹 리스트 카드
  listCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 64,
    gap: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: BORDER },
  rowMe: { backgroundColor: '#EBF2FF' },
  rowRank: { width: 28, fontSize: 15, fontWeight: '700', textAlign: 'center', color: TEXT },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: 14 },
  rowName: { fontSize: 14, fontWeight: '600', color: TEXT },
  rowSub: { fontSize: 11, color: TEXT_SUB, marginTop: 2 },
  rowRate: { fontSize: 17, fontWeight: '800' },

  // Top 3 포디움 (다크)
  topThreePodium: {
    backgroundColor: '#191F28',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingTop: 20,
    paddingHorizontal: 8,
    paddingBottom: 0,
    gap: 4,
    overflow: 'hidden',
  },
  podiumSlot: {
    flex: 1,
    alignItems: 'center',
  },
  podiumCrown: {
    fontSize: 18,
    marginBottom: 2,
  },
  podiumSlotMedal: {
    fontSize: 20,
    marginBottom: 4,
  },
  podiumSlotAvatarWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  podiumSlotAvatarText: {
    fontSize: 20,
  },
  podiumSlotName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  podiumSlotRate: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  podiumBar: {
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  podiumBarLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    paddingVertical: 4,
  },

  // 내 순위 카드
  myRankCard: {
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  myRankCardLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  myRankCardName: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2 },
  myRankCardRank: { color: '#fff', fontSize: 28, fontWeight: '800' },
  myRankCardTotal: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  // 빈 상태
  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: TEXT, marginTop: 8 },
  emptySub: { fontSize: 13, color: TEXT_SUB, marginTop: 4 },
});
