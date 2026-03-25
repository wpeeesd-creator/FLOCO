import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAllPortfolios, type PortfolioSnapshot } from '../lib/firestoreService';
import { useAppStore, STOCKS } from '../store/appStore';
import { useAuth } from '../context/AuthContext';

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
      const all = await getAllPortfolios();
      const entries: RankEntry[] = all.map(snap => {
        const totalValue = calcTotal(snap);
        return {
          uid: snap.uid ?? '',
          name: snap.name ?? '알 수 없음',
          totalValue,
          returnRate: ((totalValue - INITIAL_FUND) / INITIAL_FUND) * 100,
          tradeCount: (snap.trades ?? []).length,
        };
      }).sort((a, b) => b.returnRate - a.returnRate);
      console.log('RankingScreen 로드 완료:', entries.length, '명');
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#0066FF" />
          <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 12 }}>순위 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FA' }}>
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
          contentContainerStyle={{ paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
        >
          {/* My Rank Banner */}
          {myRank > 0 && (
            <View style={styles.myBanner}>
              <View>
                <Text style={styles.myBannerLabel}>내 순위</Text>
                <Text style={styles.myBannerName}>{currentUser?.name}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.myBannerRank}>{myRank}위</Text>
                <Text style={styles.myBannerTotal}>/ {ranked.length}명</Text>
              </View>
            </View>
          )}

          {/* Top 3 Podium */}
          {ranked.length >= 3 && (
            <View style={styles.podium}>
              <PodiumCard entry={ranked[1]} rank={2} />
              <PodiumCard entry={ranked[0]} rank={1} isFirst />
              <PodiumCard entry={ranked[2]} rank={3} />
            </View>
          )}

          {/* Full List */}
          <View style={styles.listCard}>
            {ranked.map((item, idx) => {
              const isMe = item.uid === userId;
              const isPositive = item.returnRate >= 0;
              return (
                <View key={item.uid} style={[styles.row, isMe && styles.rowMe, idx < ranked.length - 1 && styles.rowBorder]}>
                  <Text style={styles.rowRank}>
                    {idx < 3 ? MEDALS[idx] : `${idx + 1}`}
                  </Text>
                  <View style={[styles.avatar, { backgroundColor: isMe ? '#0066FF' : '#E8ECF0' }]}>
                    <Text style={[styles.avatarText, { color: isMe ? '#fff' : '#191919' }]}>
                      {item.name[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowName, isMe && { color: '#0066FF' }]}>
                      {item.name}{isMe ? ' (나)' : ''}
                    </Text>
                    <Text style={styles.rowSub}>거래 {item.tradeCount}건</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.rowRate, { color: isPositive ? '#FF3B30' : '#0066FF' }]}>
                      {isPositive ? '+' : ''}{item.returnRate.toFixed(2)}%
                    </Text>
                    <Text style={styles.rowValue}>₩{Math.round(item.totalValue).toLocaleString()}</Text>
                  </View>
                </View>
              );
            })}

            {ranked.length === 0 && (
              <View style={styles.empty}>
                <Text style={{ fontSize: 48 }}>🏆</Text>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#191919', marginTop: 8 }}>아직 참가자가 없어요</Text>
                <Text style={{ fontSize: 13, color: '#8E8E93', marginTop: 4 }}>거래를 시작하면 랭킹에 표시돼요</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function PodiumCard({ entry, rank, isFirst }: { entry: RankEntry; rank: number; isFirst?: boolean }) {
  const isPositive = entry.returnRate >= 0;
  return (
    <View style={[styles.podiumItem, isFirst && styles.podiumFirst]}>
      <Text style={styles.podiumMedal}>{MEDALS[rank - 1]}</Text>
      <View style={[styles.podiumAvatar, isFirst && { width: 52, height: 52, borderRadius: 26 }]}>
        <Text style={[styles.podiumAvatarText, isFirst && { fontSize: 18 }]}>
          {entry.name[0]?.toUpperCase() ?? '?'}
        </Text>
      </View>
      <Text style={styles.podiumName} numberOfLines={1}>{entry.name}</Text>
      <Text style={[styles.podiumRate, { color: isPositive ? '#FF3B30' : '#0066FF' }]}>
        {isPositive ? '+' : ''}{entry.returnRate.toFixed(1)}%
      </Text>
      <Text style={styles.podiumValue}>₩{Math.round(entry.totalValue / 10000)}만</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },
  headerSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  countBadge: { backgroundColor: '#EBF5FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: '600', color: '#0066FF' },

  myBanner: {
    marginHorizontal: 16, marginTop: 16, backgroundColor: '#0066FF',
    borderRadius: 16, padding: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    shadowColor: '#0066FF', shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  myBannerLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  myBannerName: { color: '#fff', fontSize: 17, fontWeight: '700', marginTop: 2 },
  myBannerRank: { color: '#fff', fontSize: 28, fontWeight: '800', fontFamily: 'Courier' },
  myBannerTotal: { color: 'rgba(255,255,255,0.6)', fontSize: 12, marginTop: 2 },

  podium: {
    flexDirection: 'row', alignItems: 'flex-end',
    justifyContent: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 8,
  },
  podiumItem: {
    flex: 1, alignItems: 'center', backgroundColor: '#FFFFFF',
    borderRadius: 16, padding: 12, paddingTop: 16,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
  },
  podiumFirst: {
    paddingTop: 20, paddingBottom: 16,
    shadowOpacity: 0.08,
  },
  podiumMedal: { fontSize: 24, marginBottom: 4 },
  podiumAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#E8ECF0', alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  podiumAvatarText: { fontSize: 14, fontWeight: '700', color: '#191919' },
  podiumName: { fontSize: 12, fontWeight: '600', color: '#191919', textAlign: 'center' },
  podiumRate: { fontSize: 16, fontWeight: '800', fontFamily: 'Courier', marginTop: 4 },
  podiumValue: { fontSize: 11, color: '#8E8E93', marginTop: 2 },

  listCard: {
    backgroundColor: '#FFFFFF', marginHorizontal: 16, marginTop: 12,
    borderRadius: 16, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 12, elevation: 2,
  },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, gap: 10,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  rowMe: { backgroundColor: '#EBF5FF' },
  rowRank: { width: 28, fontSize: 15, fontWeight: '800', textAlign: 'center', color: '#191919' },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: 14 },
  rowName: { fontSize: 14, fontWeight: '600', color: '#191919' },
  rowSub: { fontSize: 11, color: '#8E8E93', marginTop: 2 },
  rowRate: { fontSize: 15, fontWeight: '800', fontFamily: 'Courier' },
  rowValue: { fontSize: 11, color: '#8E8E93', marginTop: 2 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 4 },
});
