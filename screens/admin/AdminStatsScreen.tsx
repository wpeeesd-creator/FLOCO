/**
 * 관리자 실시간 통계 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';
import { getAllUserProfiles, getAllPortfolios } from '../../lib/firestoreService';

// ── 더미 주간 데이터 생성 ──────────────────────
function generateWeeklyDummy(maxVal: number): { date: string; count: number }[] {
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    result.push({ date: label, count: Math.floor(Math.random() * maxVal) + 1 });
  }
  return result;
}

const WEEKLY_SIGNUPS = generateWeeklyDummy(20);
const WEEKLY_TRADES = generateWeeklyDummy(50);

export default function AdminStatsScreen() {
  const navigation = useNavigation();
  const [userCount, setUserCount] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [tradeAmount, setTradeAmount] = useState(0);
  const [avgTrades, setAvgTrades] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [users, portfolios] = await Promise.all([
        getAllUserProfiles(),
        getAllPortfolios(),
      ]);
      const allTrades = portfolios.flatMap(p => p.trades ?? []);
      setUserCount(users.length);
      setTradeCount(allTrades.length);
      setTradeAmount(allTrades.reduce((sum, t) => sum + (t.price * t.qty), 0));
      setAvgTrades(users.length > 0 ? Math.round(allTrades.length / users.length) : 0);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const mainStats = [
    { label: '전체 유저', value: `${userCount}명`, color: '#0066FF', emoji: '👥' },
    { label: '총 거래 건수', value: `${tradeCount}건`, color: '#FF9500', emoji: '📈' },
    { label: '총 거래금액', value: `₩${Math.round(tradeAmount / 10000)}만`, color: '#5856D6', emoji: '💰' },
    { label: '유저당 평균 거래', value: `${avgTrades}건`, color: '#34C759', emoji: '📊' },
  ];

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>실시간 통계</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* 주요 통계 카드 2x2 */}
        <Text style={styles.sectionTitle}>주요 지표</Text>
        <View style={styles.statsGrid}>
          {mainStats.map((s) => (
            <View key={s.label} style={[styles.statCard, { borderLeftColor: s.color }]}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* 최근 7일 가입자 차트 */}
        <Text style={styles.sectionTitle}>📅 최근 7일 가입자</Text>
        <View style={styles.chartCard}>
          <BarChart data={WEEKLY_SIGNUPS} color="#0066FF" />
        </View>

        {/* 최근 7일 거래량 차트 */}
        <Text style={styles.sectionTitle}>📈 최근 7일 거래량</Text>
        <View style={styles.chartCard}>
          <BarChart data={WEEKLY_TRADES} color="#FF9500" />
        </View>

        {/* 유저 활동 요약 */}
        <Text style={styles.sectionTitle}>유저 활동 요약</Text>
        <View style={styles.summaryCard}>
          <SummaryRow label="전체 가입자" value={`${userCount}명`} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="오늘 활성 유저" value={`${Math.floor(userCount * 0.3)}명`} sub="(추정)" />
          <View style={styles.summaryDivider} />
          <SummaryRow label="유저당 평균 거래" value={`${avgTrades}건`} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="총 거래 금액" value={`₩${Math.round(tradeAmount).toLocaleString()}`} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── 가로 막대 차트 ──────────────────────────────
function BarChart({ data, color }: { data: { date: string; count: number }[]; color: string }) {
  const maxCount = Math.max(...data.map(d => d.count), 1);
  return (
    <View style={{ gap: 8 }}>
      {data.map((item) => {
        const pct = (item.count / maxCount) * 100;
        return (
          <View key={item.date} style={styles.barRow}>
            <Text style={styles.barDate}>{item.date}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: color }]} />
            </View>
            <Text style={styles.barCount}>{item.count}</Text>
          </View>
        );
      })}
    </View>
  );
}

// ── 요약 행 ────────────────────────────────────
function SummaryRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
        {sub && <Text style={styles.summarySub}>{sub}</Text>}
        <Text style={styles.summaryValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  scrollContent: { padding: 16, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
    marginTop: 8,
  },
  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statEmoji: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '700', marginBottom: 2 },
  statLabel: { fontSize: 11, color: Colors.textSub, fontWeight: '500' },
  // Chart
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barDate: { width: 40, fontSize: 11, color: Colors.textSub, textAlign: 'right' },
  barTrack: {
    flex: 1,
    height: 20,
    backgroundColor: Colors.bg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: 4, minWidth: 4 },
  barCount: { width: 28, fontSize: 12, fontWeight: '700', color: Colors.text, textAlign: 'right' },
  // Summary
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryDivider: { height: 1, backgroundColor: Colors.border, marginHorizontal: 16 },
  summaryLabel: { fontSize: 14, color: Colors.textSub },
  summaryValue: { fontSize: 15, fontWeight: '700', color: Colors.text },
  summarySub: { fontSize: 11, color: Colors.textSub },
});
