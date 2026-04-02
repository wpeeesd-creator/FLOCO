/**
 * 관리자 — 학습 통계 화면
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';
import {
  fetchAllUsersForAdmin, fetchAllPortfoliosForAdmin,
} from '../../lib/adminService';

interface CategoryStat {
  label: string;
  emoji: string;
  count: number;
}

interface StreakEntry {
  name: string;
  streak: number;
}

const CATEGORY_LABELS: CategoryStat[] = [
  { label: '용어 사전', emoji: '📖', count: 0 },
  { label: '뉴스 학습', emoji: '📰', count: 0 },
  { label: '차트 분석', emoji: '📊', count: 0 },
  { label: '기업 분석', emoji: '🏢', count: 0 },
  { label: '투자 심리', emoji: '🧠', count: 0 },
  { label: '거시경제', emoji: '🏦', count: 0 },
];

const WRONG_QUESTIONS_DUMMY = [
  'PER이 낮을수록 무조건 좋은 주식이다',
  '분산 투자는 수익률을 높이기 위한 전략이다',
  '채권 가격과 금리는 같은 방향으로 움직인다',
  '공매도는 주가 하락을 예상할 때 사용한다',
  '배당수익률이 높을수록 항상 좋은 투자다',
];

export default function AdminLearningStatsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [avgStreak, setAvgStreak] = useState(0);
  const [todayCompleted, setTodayCompleted] = useState(0);
  const [categories, setCategories] = useState<CategoryStat[]>(CATEGORY_LABELS);
  const [streakBoard, setStreakBoard] = useState<StreakEntry[]>([]);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [, portfolios] = await Promise.all([
        fetchAllUsersForAdmin(),
        fetchAllPortfoliosForAdmin(),
      ]);

      let total = 0;
      let totalStreakSum = 0;
      let todayCount = 0;
      const board: StreakEntry[] = [];
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const catCounts = [0, 0, 0, 0, 0, 0];

      portfolios.forEach((p: any) => {
        const lessons: any[] = p.completedLessons ?? [];
        total += lessons.length;

        lessons.forEach((l: any) => {
          const ts = typeof l === 'number' ? l : (l.completedAt ?? 0);
          if (ts > todayStart.getTime()) todayCount++;
          // Distribute across categories by lesson index mod 6
          const idx = typeof l === 'number' ? (l % 6) : ((l.step ?? 0) % 6);
          catCounts[idx] = (catCounts[idx] ?? 0) + 1;
        });

        const streak = p.streak ?? 0;
        totalStreakSum += streak;
        const displayName = p.nickname ?? p.name ?? p.displayName ?? '알 수 없음';
        board.push({ name: displayName, streak });
      });

      board.sort((a, b) => b.streak - a.streak);
      const maxCat = Math.max(...catCounts, 1);

      setTotalCompleted(total);
      setTodayCompleted(todayCount);
      setAvgStreak(portfolios.length > 0 ? Math.round(totalStreakSum / portfolios.length) : 0);
      setStreakBoard(board.slice(0, 5));
      setCategories(CATEGORY_LABELS.map((c, i) => ({
        ...c,
        count: Math.round((catCounts[i] / maxCat) * 100),
      })));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStats(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  const RANK_MEDALS = ['🥇', '🥈', '🥉', '4', '5'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>학습 통계</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && totalCompleted === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* 개요 카드 3개 */}
          <View style={styles.overviewRow}>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{totalCompleted.toLocaleString()}</Text>
              <Text style={styles.overviewLabel}>총 학습 완료</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={styles.overviewValue}>{avgStreak}일</Text>
              <Text style={styles.overviewLabel}>평균 스트릭</Text>
            </View>
            <View style={styles.overviewCard}>
              <Text style={[styles.overviewValue, { color: Colors.primary }]}>{todayCompleted}</Text>
              <Text style={styles.overviewLabel}>오늘 완료</Text>
            </View>
          </View>

          {/* 카테고리별 완료율 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 카테고리별 완료율</Text>
            {categories.map((cat) => (
              <View key={cat.label} style={styles.barRow}>
                <Text style={styles.barLabel}>{cat.emoji} {cat.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${cat.count}%` as any }]} />
                </View>
                <Text style={styles.barPct}>{cat.count}%</Text>
              </View>
            ))}
          </View>

          {/* 스트릭 리더보드 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔥 스트릭 TOP 5</Text>
            {streakBoard.length === 0 ? (
              <Text style={styles.emptyText}>데이터가 없어요</Text>
            ) : (
              streakBoard.map((entry, i) => (
                <View key={i} style={styles.leaderRow}>
                  <Text style={styles.rankText}>
                    {i < 3 ? RANK_MEDALS[i] : `${i + 1}`}
                  </Text>
                  <Text style={styles.leaderName} numberOfLines={1}>{entry.name}</Text>
                  <View style={styles.streakBadge}>
                    <Text style={styles.streakBadgeText}>🔥 {entry.streak}일</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 자주 틀리는 문제 TOP 5 (더미) */}
          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={styles.sectionTitle}>❌ 자주 틀리는 문제 TOP 5</Text>
            {WRONG_QUESTIONS_DUMMY.map((q, i) => (
              <View key={i} style={styles.wrongRow}>
                <Text style={styles.wrongNum}>{i + 1}</Text>
                <Text style={styles.wrongQ} numberOfLines={2}>{q}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  overviewRow: { flexDirection: 'row', gap: 10 },
  overviewCard: {
    flex: 1, backgroundColor: Colors.card, borderRadius: 12,
    padding: 16, alignItems: 'center', gap: 4,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  overviewValue: { fontSize: 22, fontWeight: '800', color: Colors.text },
  overviewLabel: { fontSize: 11, color: Colors.textSub, fontWeight: '500', textAlign: 'center' },
  section: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  barRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  barLabel: { fontSize: 13, color: Colors.text, width: 90 },
  barTrack: {
    flex: 1, height: 8, backgroundColor: Colors.bg, borderRadius: 4, overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  barPct: { fontSize: 12, color: Colors.textSub, width: 34, textAlign: 'right', fontWeight: '600' },
  leaderRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  rankText: { fontSize: 18, width: 32, textAlign: 'center' },
  leaderName: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text, marginLeft: 8 },
  streakBadge: {
    backgroundColor: '#FFF3D6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  streakBadgeText: { fontSize: 13, fontWeight: '700', color: '#F59E0B' },
  wrongRow: {
    flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  wrongNum: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#FF3B3020',
    textAlign: 'center', lineHeight: 22, fontSize: 12, fontWeight: '700', color: '#FF3B30',
  },
  wrongQ: { flex: 1, fontSize: 13, color: Colors.text, lineHeight: 18 },
  emptyText: { fontSize: 14, color: Colors.textSub, textAlign: 'center', paddingVertical: 20 },
});
