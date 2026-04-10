/**
 * 관리자 실시간 통계 화면
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Colors } from '../../components/ui';
import { useTheme } from '../../context/ThemeContext';
import { getAllUserProfiles, getAllPortfolios } from '../../lib/firestoreService';

interface AdminUser {
  uid: string;
  email: string;
  name: string;
  balance: number;
  totalAsset: number;
}

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
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [userCount, setUserCount] = useState(0);
  const [tradeCount, setTradeCount] = useState(0);
  const [tradeAmount, setTradeAmount] = useState(0);
  const [avgTrades, setAvgTrades] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<AdminUser[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [userProfiles, portfolios] = await Promise.all([
        getAllUserProfiles(),
        getAllPortfolios(),
      ]);
      const allTrades = portfolios.flatMap(p => p.trades ?? []);
      setUserCount(userProfiles.length);
      setTradeCount(allTrades.length);
      setTradeAmount(allTrades.reduce((sum, t) => sum + (t.price * t.qty), 0));
      setAvgTrades(userProfiles.length > 0 ? Math.round(allTrades.length / userProfiles.length) : 0);
      setUsers(userProfiles.map((u: any) => ({
        uid: u.uid,
        email: u.email ?? '',
        name: u.name ?? u.displayName ?? u.email ?? '알 수 없음',
        balance: u.balance ?? 1_000_000,
        totalAsset: u.totalAsset ?? 1_000_000,
      })));
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const handleEditBalance = (user: AdminUser) => {
    Alert.prompt(
      '잔액 수정',
      `${user.email} 새 잔액 입력`,
      async (value) => {
        if (!value || isNaN(Number(value))) return;
        await updateDoc(doc(db, 'users', user.uid), { balance: Number(value) });
        setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, balance: Number(value) } : u));
        Alert.alert('완료', '잔액이 수정됐습니다.');
      },
      'plain-text',
      String(user.balance),
      'numeric',
    );
  };

  const handleResetAll = () => {
    Alert.alert('전체 초기화', '모든 유저 데이터를 초기화합니다. 계속할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '초기화',
        style: 'destructive',
        onPress: async () => {
          for (const user of users) {
            await updateDoc(doc(db, 'users', user.uid), {
              balance: 1_000_000,
              totalAsset: 1_000_000,
              portfolio: [],
              transactions: [],
            });
          }
          setUsers(prev => prev.map(u => ({ ...u, balance: 1_000_000, totalAsset: 1_000_000 })));
          Alert.alert('완료', '전체 초기화가 완료됐습니다.');
        },
      },
    ]);
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const mainStats = [
    { label: '전체 유저', value: `${userCount}명`, color: theme.primary, emoji: '👥' },
    { label: '총 거래 건수', value: `${tradeCount}건`, color: '#FF9500', emoji: '📈' },
    { label: '총 거래금액', value: `₩${Math.round(tradeAmount / 10000)}만`, color: '#5856D6', emoji: '💰' },
    { label: '유저당 평균 거래', value: `${avgTrades}건`, color: theme.green, emoji: '📊' },
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
      <View style={[styles.header, { backgroundColor: theme.bgCard }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>실시간 통계</Text>
        <TouchableOpacity
          onPress={handleResetAll}
          style={styles.resetBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.resetBtnText}>전체 초기화</Text>
        </TouchableOpacity>
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
            <View key={s.label} style={[styles.statCard, { borderLeftColor: s.color, backgroundColor: theme.bgCard, shadowColor: theme.text }]}>
              <Text style={styles.statEmoji}>{s.emoji}</Text>
              <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* 최근 7일 가입자 차트 */}
        <Text style={styles.sectionTitle}>📅 최근 7일 가입자</Text>
        <View style={[styles.chartCard, { backgroundColor: theme.bgCard, shadowColor: theme.text }]}>
          <BarChart data={WEEKLY_SIGNUPS} color={theme.primary} />
        </View>

        {/* 최근 7일 거래량 차트 */}
        <Text style={styles.sectionTitle}>📈 최근 7일 거래량</Text>
        <View style={[styles.chartCard, { backgroundColor: theme.bgCard, shadowColor: theme.text }]}>
          <BarChart data={WEEKLY_TRADES} color="#FF9500" />
        </View>

        {/* 유저 활동 요약 */}
        <Text style={styles.sectionTitle}>유저 활동 요약</Text>
        <View style={[styles.summaryCard, { backgroundColor: theme.bgCard, shadowColor: theme.text }]}>
          <SummaryRow label="전체 가입자" value={`${userCount}명`} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="오늘 활성 유저" value={`${Math.floor(userCount * 0.3)}명`} sub="(추정)" />
          <View style={styles.summaryDivider} />
          <SummaryRow label="유저당 평균 거래" value={`${avgTrades}건`} />
          <View style={styles.summaryDivider} />
          <SummaryRow label="총 거래 금액" value={`₩${Math.round(tradeAmount).toLocaleString()}`} />
        </View>

        {/* 전체 유저 리스트 */}
        <Text style={styles.sectionTitle}>👤 전체 유저 ({users.length}명)</Text>
        {users.map((user) => {
          const returnRate = ((user.totalAsset - 1_000_000) / 1_000_000) * 100;
          const isUp = returnRate >= 0;
          return (
            <View key={user.uid} style={[styles.userCard, { backgroundColor: theme.bgCard, shadowColor: theme.text }]}>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.userEmail} numberOfLines={1}>{user.email}</Text>
                <View style={styles.userStatsRow}>
                  <Text style={styles.userStatLabel}>총 자산</Text>
                  <Text style={styles.userStatValue}>₩{Math.round(user.totalAsset).toLocaleString()}</Text>
                  <Text style={[styles.userReturnRate, { color: isUp ? '#34C759' : '#FF3B30' }]}>
                    {isUp ? '+' : ''}{returnRate.toFixed(2)}%
                  </Text>
                </View>
                <View style={styles.userStatsRow}>
                  <Text style={styles.userStatLabel}>현금 잔액</Text>
                  <Text style={styles.userStatValue}>₩{Math.round(user.balance).toLocaleString()}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => handleEditBalance(user)}
                activeOpacity={0.7}
              >
                <Text style={styles.editBtnText}>잔액{'\n'}수정</Text>
              </TouchableOpacity>
            </View>
          );
        })}
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
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
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
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    borderRadius: 16,
    overflow: 'hidden',
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
  // Reset button
  resetBtn: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  // User list
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  userEmail: { fontSize: 12, color: Colors.textSub },
  userStatsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  userStatLabel: { fontSize: 12, color: Colors.textSub, width: 48 },
  userStatValue: { fontSize: 13, fontWeight: '600', color: Colors.text },
  userReturnRate: { fontSize: 12, fontWeight: '700' },
  editBtn: {
    backgroundColor: '#EAF4FF',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginLeft: 10,
  },
  editBtnText: { fontSize: 11, fontWeight: '700', color: Colors.primary, textAlign: 'center' },
});
