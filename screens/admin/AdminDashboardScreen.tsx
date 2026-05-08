/**
 * 관리자 종합 대시보드 — 사용자/거래/학습/자산/커뮤니티 핵심 지표 한 화면
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 32;

const DAY_MS = 24 * 60 * 60 * 1000;
const WEEK_MS = 7 * DAY_MS;

// 단어 빈도 분석에서 제외할 한국어 불용어
const STOP_WORDS = new Set([
  '그', '이', '저', '것', '수', '및', '또는', '그리고', '하지만',
  '있다', '없다', '한다', '한', '함', '됨', '입니다', '이다',
  '에서', '에게', '으로', '에', '를', '을', '이', '가', '의',
  '는', '도', '와', '과', '만', '미입력', '없음', '함께',
]);

// ── 유틸 ─────────────────────────────────────
const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};
const startOfWeek = () => startOfToday() - 6 * DAY_MS;

function toMs(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const t = new Date(value).getTime();
    return Number.isFinite(t) ? t : 0;
  }
  if (value?.seconds) return value.seconds * 1000;
  if (value?.toMillis) return value.toMillis();
  return 0;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export default function AdminDashboardScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const [users, setUsers] = useState<any[]>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [postsLoaded, setPostsLoaded] = useState(false);

  // ── 실시간 구독: users + posts ──
  useEffect(() => {
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list = snap.docs
          .map(d => ({ uid: d.id, ...(d.data() as any) }))
          .filter((u: any) => u.role !== 'admin');
        setUsers(list);
        setUsersLoaded(true);
      },
      (err) => { console.error('users 구독 오류:', err); setUsersLoaded(true); },
    );
    const unsubPosts = onSnapshot(
      collection(db, 'posts'),
      (snap) => {
        setPosts(snap.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        setPostsLoaded(true);
      },
      (err) => { console.error('posts 구독 오류:', err); setPostsLoaded(true); },
    );
    return () => { unsubUsers(); unsubPosts(); };
  }, []);

  // ── Section 1: 사용자 지표 ──
  const userMetrics = useMemo(() => {
    const today = startOfToday();
    const week = startOfWeek();
    let todaySignups = 0, weekSignups = 0, dau = 0, wau = 0;
    users.forEach(u => {
      const created = toMs(u.createdAt);
      const last = toMs(u.lastLoginAt);
      if (created >= today) todaySignups++;
      if (created >= week) weekSignups++;
      if (last >= today) dau++;
      if (last >= week) wau++;
    });

    // 최근 30일 일별 신규 가입
    const labels: string[] = [];
    const counts: number[] = [];
    for (let i = 29; i >= 0; i--) {
      const dayStart = today - i * DAY_MS;
      const dayEnd = dayStart + DAY_MS;
      const c = users.filter(u => {
        const t = toMs(u.createdAt);
        return t >= dayStart && t < dayEnd;
      }).length;
      counts.push(c);
      const d = new Date(dayStart);
      labels.push(i % 5 === 0 ? `${d.getMonth() + 1}/${d.getDate()}` : '');
    }

    return {
      total: users.length,
      todaySignups,
      weekSignups,
      dau,
      wau,
      signupTrend: { labels, counts },
    };
  }, [users]);

  // ── Section 2: 거래 지표 ──
  const tradeMetrics = useMemo(() => {
    const today = startOfToday();
    let todayCount = 0;
    let todayAmount = 0;
    let buyCount = 0;
    let sellCount = 0;
    const tickerCounts: Record<string, number> = {};
    const wordCounts: Record<string, number> = {};

    users.forEach(u => {
      const txs: any[] = u.transactions ?? [];
      txs.forEach(t => {
        const ts = toMs(t.createdAt);
        const qty = t.quantity ?? t.qty ?? 0;
        const amount = (t.price ?? 0) * qty;
        if (ts >= today) {
          todayCount++;
          todayAmount += amount;
        }
        if (t.type === 'buy') buyCount++;
        else if (t.type === 'sell') sellCount++;
        if (t.ticker) tickerCounts[t.ticker] = (tickerCounts[t.ticker] ?? 0) + 1;

        const reason: string = t.reason ?? '';
        if (reason && reason !== '미입력') {
          reason.split(/\s+/).forEach(w => {
            const word = w.replace(/[^\w가-힣]/g, '');
            if (word.length >= 2 && !STOP_WORDS.has(word)) {
              wordCounts[word] = (wordCounts[word] ?? 0) + 1;
            }
          });
        }
      });
    });

    const top10Tickers = Object.entries(tickerCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const top10Reasons = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return { todayCount, todayAmount, buyCount, sellCount, top10Tickers, top10Reasons };
  }, [users]);

  // ── Section 3: 학습 지표 ──
  const learningMetrics = useMemo(() => {
    const CATEGORIES = ['용어', '뉴스', '차트', '기업', '심리', '거시'];
    const catCounts = new Array(CATEGORIES.length).fill(0);
    const lessonCounts: Record<string, number> = {};
    let totalLessons = 0;

    // 최근 14일 일별 학습량
    const today = startOfToday();
    const dailyLabels: string[] = [];
    const dailyCounts: number[] = new Array(14).fill(0);
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today - i * DAY_MS);
      dailyLabels.push(i % 3 === 0 ? `${d.getMonth() + 1}/${d.getDate()}` : '');
    }

    users.forEach(u => {
      const lessons: any[] = u.learning?.completedLessons ?? [];
      totalLessons += lessons.length;
      lessons.forEach((l: any, idx: number) => {
        const ts = typeof l === 'number' ? l : toMs(l?.completedAt);
        const lessonId = String(l?.lessonId ?? l?.id ?? l?.step ?? idx);
        lessonCounts[lessonId] = (lessonCounts[lessonId] ?? 0) + 1;
        const catIdx = typeof l === 'number'
          ? (l % CATEGORIES.length)
          : ((l?.step ?? idx) % CATEGORIES.length);
        catCounts[catIdx]++;
        const dayIdx = 13 - Math.floor((today - ts) / DAY_MS);
        if (dayIdx >= 0 && dayIdx < 14) dailyCounts[dayIdx]++;
      });
    });

    const top5Lessons = Object.entries(lessonCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const avgPerUser = users.length > 0 ? Math.round(totalLessons / users.length) : 0;

    return {
      categoryStats: CATEGORIES.map((c, i) => ({ label: c, count: catCounts[i] })),
      top5Lessons,
      dailyTrend: { labels: dailyLabels, counts: dailyCounts },
      avgPerUser,
    };
  }, [users]);

  // ── Section 4: 자산 지표 ──
  const assetMetrics = useMemo(() => {
    const assets = users.map(u => Number(u.totalAsset ?? u.balance ?? 10_000_000));
    const total = assets.reduce((a, b) => a + b, 0);
    const avg = assets.length > 0 ? total / assets.length : 0;
    const med = median(assets);
    const buckets = [0, 0, 0, 0, 0]; // <50만, 50~100, 100~200, 200~500, 500↑
    assets.forEach(a => {
      const m = a / 10_000;
      if (m < 50) buckets[0]++;
      else if (m < 100) buckets[1]++;
      else if (m < 200) buckets[2]++;
      else if (m < 500) buckets[3]++;
      else buckets[4]++;
    });
    return { avg, med, buckets };
  }, [users]);

  // ── Section 5: 커뮤니티 지표 ──
  const totalTrades = useMemo(
    () => users.reduce((sum, u) => sum + ((u.transactions?.length) ?? 0), 0),
    [users],
  );

  const communityMetrics = useMemo(() => {
    const today = startOfToday();
    const week = startOfWeek();
    let todayPosts = 0;
    let weekPosts = 0;
    posts.forEach(p => {
      const t = toMs(p.createdAt);
      if (t >= today) todayPosts++;
      if (t >= week) weekPosts++;
    });
    const popular = [...posts]
      .sort((a, b) => (b.likes?.length ?? 0) - (a.likes?.length ?? 0))
      .slice(0, 5);

    const authorCounts: Record<string, { uid: string; nickname: string; count: number }> = {};
    posts.forEach(p => {
      const key = p.uid ?? 'unknown';
      if (!authorCounts[key]) {
        authorCounts[key] = { uid: key, nickname: p.nickname ?? '익명', count: 0 };
      }
      authorCounts[key].count++;
    });
    const topAuthors = Object.values(authorCounts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { total: posts.length, todayPosts, weekPosts, popular, topAuthors };
  }, [posts]);

  const loading = !usersLoaded || !postsLoaded;

  // ── 차트 공통 설정 ──
  const chartConfig = {
    backgroundColor: theme.bgCard,
    backgroundGradientFrom: theme.bgCard,
    backgroundGradientTo: theme.bgCard,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(0, 102, 255, ${opacity})`,
    labelColor: () => theme.textSecondary,
    propsForBackgroundLines: { stroke: theme.border },
  };

  const PIE_COLORS = ['#F04452', '#2175F3'];

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: { width: 40, alignItems: 'flex-start' },
    headerTitle: { fontSize: 17, fontWeight: '700', color: theme.text },
    scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
    section: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 16,
      gap: 12,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    metricCard: {
      flexBasis: '48%',
      flexGrow: 1,
      backgroundColor: theme.bgInput,
      borderRadius: 12,
      padding: 12,
    },
    metricBig: {
      flexBasis: '100%',
      backgroundColor: theme.primaryLight,
      borderRadius: 12,
      padding: 14,
    },
    metricLabel: { fontSize: 11, color: theme.textSecondary, fontWeight: '600' },
    metricValue: { fontSize: 22, fontWeight: '800', color: theme.text, marginTop: 4 },
    metricValueBig: { fontSize: 32, fontWeight: '800', color: theme.primary, marginTop: 4 },
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
    barLabel: { fontSize: 12, color: theme.text, width: 60 },
    barTrack: { flex: 1, height: 8, backgroundColor: theme.border, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: theme.primary, borderRadius: 4 },
    barValue: { fontSize: 11, color: theme.textSecondary, width: 40, textAlign: 'right' },
    listRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    listText: { fontSize: 13, color: theme.text, flex: 1 },
    listMeta: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    pill: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    pillText: { fontSize: 12, color: theme.primary, fontWeight: '700' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={{ marginTop: 12, color: theme.textSecondary }}>대시보드 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── 차트 데이터 가공 ──
  const maxBucket = Math.max(...assetMetrics.buckets, 1);
  const maxCategory = Math.max(...learningMetrics.categoryStats.map(c => c.count), 1);
  const maxTicker = tradeMetrics.top10Tickers[0]?.[1] ?? 1;

  const buyTotal = tradeMetrics.buyCount + tradeMetrics.sellCount;
  const pieData = buyTotal > 0 ? [
    {
      name: '매수',
      population: tradeMetrics.buyCount,
      color: PIE_COLORS[0],
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
    {
      name: '매도',
      population: tradeMetrics.sellCount,
      color: PIE_COLORS[1],
      legendFontColor: theme.text,
      legendFontSize: 12,
    },
  ] : [];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📊 종합 대시보드</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* ── Section 1: 사용자 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👥 사용자</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricBig}>
              <Text style={styles.metricLabel}>총 가입자</Text>
              <Text style={styles.metricValueBig}>{userMetrics.total.toLocaleString()}명</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>오늘 가입</Text>
              <Text style={styles.metricValue}>{userMetrics.todaySignups}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>이번 주 가입</Text>
              <Text style={styles.metricValue}>{userMetrics.weekSignups}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>DAU (오늘)</Text>
              <Text style={styles.metricValue}>{userMetrics.dau}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>WAU (이번 주)</Text>
              <Text style={styles.metricValue}>{userMetrics.wau}</Text>
            </View>
          </View>
          <Text style={[styles.metricLabel, { marginTop: 8 }]}>최근 30일 신규 가입 추이</Text>
          <LineChart
            data={{
              labels: userMetrics.signupTrend.labels,
              datasets: [{ data: userMetrics.signupTrend.counts }],
            }}
            width={CHART_W - 32}
            height={160}
            chartConfig={chartConfig}
            bezier
            withDots={false}
            withInnerLines={false}
            style={{ borderRadius: 8, marginLeft: -16 }}
          />
        </View>

        {/* ── Section 2: 거래 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 거래</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>오늘 거래 횟수</Text>
              <Text style={styles.metricValue}>{tradeMetrics.todayCount}건</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>오늘 거래대금</Text>
              <Text style={styles.metricValue}>
                ₩{Math.round(tradeMetrics.todayAmount / 10_000).toLocaleString()}만
              </Text>
            </View>
          </View>

          {pieData.length > 0 && (
            <>
              <Text style={[styles.metricLabel, { marginTop: 8 }]}>매수/매도 비율</Text>
              <PieChart
                data={pieData}
                width={CHART_W - 32}
                height={160}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="16"
              />
            </>
          )}

          {tradeMetrics.top10Tickers.length > 0 && (
            <>
              <Text style={[styles.metricLabel, { marginTop: 8 }]}>거래 빈도 TOP 10 종목</Text>
              {tradeMetrics.top10Tickers.map(([ticker, count]) => (
                <View key={ticker} style={styles.barRow}>
                  <Text style={styles.barLabel}>{ticker}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(count / maxTicker) * 100}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              ))}
            </>
          )}

          {tradeMetrics.top10Reasons.length > 0 && (
            <>
              <Text style={[styles.metricLabel, { marginTop: 8 }]}>매매 이유 키워드 TOP 10</Text>
              <View style={styles.pillRow}>
                {tradeMetrics.top10Reasons.map(([word, n]) => (
                  <View key={word} style={styles.pill}>
                    <Text style={styles.pillText}>{word} · {n}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* ── Section 3: 학습 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📚 학습</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>유저당 평균 완료 레슨</Text>
              <Text style={styles.metricValue}>{learningMetrics.avgPerUser}</Text>
            </View>
          </View>

          <Text style={[styles.metricLabel, { marginTop: 8 }]}>카테고리별 학습량</Text>
          {learningMetrics.categoryStats.map(c => (
            <View key={c.label} style={styles.barRow}>
              <Text style={styles.barLabel}>{c.label}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, {
                  width: `${(c.count / maxCategory) * 100}%`,
                  backgroundColor: theme.green,
                }]} />
              </View>
              <Text style={styles.barValue}>{c.count}</Text>
            </View>
          ))}

          {learningMetrics.top5Lessons.length > 0 && (
            <>
              <Text style={[styles.metricLabel, { marginTop: 8 }]}>가장 많이 풀린 레슨 TOP 5</Text>
              {learningMetrics.top5Lessons.map(([id, n], i) => (
                <View key={id} style={styles.listRow}>
                  <Text style={styles.listText}>{i + 1}. 레슨 #{id}</Text>
                  <Text style={styles.listMeta}>{n}회</Text>
                </View>
              ))}
            </>
          )}

          <Text style={[styles.metricLabel, { marginTop: 8 }]}>최근 14일 일별 학습량</Text>
          <LineChart
            data={{
              labels: learningMetrics.dailyTrend.labels,
              datasets: [{
                data: learningMetrics.dailyTrend.counts,
                color: () => theme.green,
              }],
            }}
            width={CHART_W - 32}
            height={160}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(52, 199, 89, ${opacity})`,
            }}
            bezier
            withDots={false}
            withInnerLines={false}
            style={{ borderRadius: 8, marginLeft: -16 }}
          />
        </View>

        {/* ── Section 4: 자산 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💼 자산</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>평균 총 자산</Text>
              <Text style={styles.metricValue}>
                ₩{Math.round(assetMetrics.avg).toLocaleString()}
              </Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>중앙값</Text>
              <Text style={styles.metricValue}>
                ₩{Math.round(assetMetrics.med).toLocaleString()}
              </Text>
            </View>
          </View>

          <Text style={[styles.metricLabel, { marginTop: 8 }]}>자산 구간별 사용자 수</Text>
          <BarChart
            data={{
              labels: ['<50만', '50~100', '100~200', '200~500', '500↑'],
              datasets: [{ data: assetMetrics.buckets }],
            }}
            width={CHART_W - 32}
            height={180}
            yAxisLabel=""
            yAxisSuffix="명"
            chartConfig={{
              ...chartConfig,
              barPercentage: 0.7,
            }}
            fromZero
            withInnerLines={false}
            style={{ borderRadius: 8, marginLeft: -16 }}
          />
        </View>

        {/* ── Section 5: 커뮤니티 ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💬 커뮤니티</Text>
          <View style={styles.metricGrid}>
            <View style={styles.metricBig}>
              <Text style={styles.metricLabel}>총 게시글</Text>
              <Text style={styles.metricValueBig}>{communityMetrics.total.toLocaleString()}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>오늘 게시글</Text>
              <Text style={styles.metricValue}>{communityMetrics.todayPosts}</Text>
            </View>
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>이번 주</Text>
              <Text style={styles.metricValue}>{communityMetrics.weekPosts}</Text>
            </View>
          </View>

          {communityMetrics.popular.length > 0 && (
            <>
              <Text style={[styles.metricLabel, { marginTop: 8 }]}>인기 글 TOP 5 (좋아요)</Text>
              {communityMetrics.popular.map((p, i) => (
                <View key={p.id} style={styles.listRow}>
                  <Text style={styles.listText} numberOfLines={1}>
                    {i + 1}. {p.content?.slice(0, 30) ?? '(내용 없음)'}
                  </Text>
                  <Text style={styles.listMeta}>♥ {p.likes?.length ?? 0}</Text>
                </View>
              ))}
            </>
          )}

          {communityMetrics.topAuthors.length > 0 && (
            <>
              <Text style={[styles.metricLabel, { marginTop: 8 }]}>활성 작성자 TOP 10</Text>
              {communityMetrics.topAuthors.map((a, i) => (
                <View key={a.uid} style={styles.listRow}>
                  <Text style={styles.listText}>{i + 1}. {a.nickname}</Text>
                  <Text style={styles.listMeta}>{a.count}건</Text>
                </View>
              ))}
            </>
          )}
        </View>

        {/* ── Section 6: 사용자별 거래내역 진입 ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const parent = navigation.getParent<any>();
            if (parent) parent.navigate('거래내역Tab');
          }}
          style={[styles.section, { flexDirection: 'row', alignItems: 'center' }]}
        >
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={styles.sectionTitle}>📋 전체 사용자 거래내역</Text>
            <Text style={{ fontSize: 13, color: theme.textSecondary, fontWeight: '600' }}>
              {userMetrics.total.toLocaleString()}명 · 총 {totalTrades.toLocaleString()}건 · reason 분석
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color={theme.primary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
