/**
 * 관리자 종합 대시보드 — 사용자/거래/학습/자산/커뮤니티 핵심 지표 한 화면
 * 토스 톤 라이트 디자인 — 사업계획서 PPT 캡처용
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Rect, Line } from 'react-native-svg';
import {
  ChevronLeft,
  ChevronRight,
  Users,
  Wallet,
  BookOpen,
  Briefcase,
  MessageCircle,
  TrendingUp,
  ClipboardList,
} from 'lucide-react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';

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
  const navigation = useNavigation<any>();

  // ── 디자인 토큰 (PPT 캡처용 고정 라이트 톤) ──
  const DS = {
    bg: '#F9FAFB',
    cardBg: '#FFFFFF',
    text: '#1F2937',
    textSub: '#6B7280',
    textMuted: '#9CA3AF',
    primary: theme.primary ?? '#0066FF',
    border: '#F3F4F6',
    positive: '#22C55E',
    negative: '#EF4444',
  };

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
    const week = startOfWeek();
    let todayCount = 0;
    let todayAmount = 0;
    let weekAmount = 0;
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
        if (ts >= week) weekAmount += amount;
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

    return { todayCount, todayAmount, weekAmount, buyCount, sellCount, top10Tickers, top10Reasons };
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

  // 헤더 우측 날짜 범위 (최근 30일)
  const dateRange = useMemo(() => {
    const end = new Date();
    const start = new Date(Date.now() - 29 * DAY_MS);
    return `${start.getFullYear()}.${start.getMonth() + 1}.${start.getDate()} - ${end.getMonth() + 1}.${end.getDate()}`;
  }, []);

  const activeRate = userMetrics.total > 0
    ? Math.round((userMetrics.dau / userMetrics.total) * 1000) / 10
    : 0;

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: DS.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: DS.cardBg,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    backBtn: { width: 36, alignItems: 'flex-start' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: DS.text, flex: 1 },
    headerDate: { fontSize: 12, color: DS.textMuted, fontWeight: '500' },
    scrollContent: { padding: 16, paddingBottom: 100 }, // 탭바 가림 방지
    // BigKPICard
    bigCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
    },
    bigLabel: { fontSize: 13, color: DS.textSub, fontWeight: '500', marginBottom: 8 },
    bigNumber: { fontSize: 36, fontWeight: '700', color: DS.text, lineHeight: 42 },
    bigChangeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
    bigChangeText: { fontSize: 12, color: DS.positive, fontWeight: '600' },
    // SmallKPI grid
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    smallCard: {
      backgroundColor: DS.cardBg,
      padding: 16,
      borderRadius: 12,
      flex: 1,
      minWidth: '47%',
    },
    smallLabel: { fontSize: 12, color: DS.textSub, fontWeight: '500', marginBottom: 4 },
    smallNumber: { fontSize: 22, fontWeight: '700', color: DS.text },
    // ChartCard
    chartCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
    },
    chartHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    chartTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    chartSubtitle: { fontSize: 12, color: DS.textMuted, fontWeight: '500' },
    chartLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 6,
    },
    chartLabelText: { fontSize: 10, color: DS.textMuted },
    // SectionHeader
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 24,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    // 가로 막대 (TOP 리스트)
    barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
    barLabel: { fontSize: 12, color: DS.text, width: 60, fontWeight: '500' },
    barTrack: { flex: 1, height: 8, backgroundColor: DS.border, borderRadius: 4, overflow: 'hidden' },
    barFill: { height: '100%', backgroundColor: DS.primary, borderRadius: 4 },
    barValue: { fontSize: 11, color: DS.textSub, width: 36, textAlign: 'right', fontWeight: '600' },
    // 매수/매도 비율 (스택 바)
    ratioBar: {
      flexDirection: 'row',
      height: 12,
      borderRadius: 6,
      overflow: 'hidden',
      backgroundColor: DS.border,
      marginTop: 10,
    },
    ratioLegend: { flexDirection: 'row', gap: 16, marginTop: 8 },
    ratioLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    ratioDot: { width: 8, height: 8, borderRadius: 4 },
    ratioText: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    // 리스트 행
    listRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    listText: { fontSize: 13, color: DS.text, flex: 1 },
    listMeta: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    // 키워드 필
    pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 10 },
    pill: {
      backgroundColor: DS.bg,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
    },
    pillText: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    // 하단 진입 카드
    navCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginTop: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    navCardTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    navCardSub: { fontSize: 12, color: DS.textSub, fontWeight: '500', marginTop: 3 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });

  // ── 컴포넌트: BigKPICard ──
  const BigKPICard = ({ label, value, change }: { label: string; value: string; change?: string }) => (
    <View style={styles.bigCard}>
      <Text style={styles.bigLabel}>{label}</Text>
      <Text style={styles.bigNumber}>{value}</Text>
      {change ? (
        <View style={styles.bigChangeRow}>
          <TrendingUp size={14} color={DS.positive} />
          <Text style={styles.bigChangeText}>{change}</Text>
        </View>
      ) : null}
    </View>
  );

  // ── 컴포넌트: SmallKPI ──
  const SmallKPI = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.smallCard}>
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.smallNumber}>{value}</Text>
    </View>
  );

  // ── 컴포넌트: SectionHeader ──
  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={DS.text} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // ── 컴포넌트: BarChart (SVG 막대 차트) ──
  const BarChart = ({ values, labels, color }: { values: number[]; labels: string[]; color?: string }) => {
    const maxValue = Math.max(...values, 1);
    const W = 320;
    const H = 140;
    const CHART_TOP = 16;
    const CHART_BOTTOM = 124;
    const CHART_H = CHART_BOTTOM - CHART_TOP;
    const gap = 2;
    const barWidth = W / values.length - gap;
    const visibleLabels = labels.filter(l => l !== '');

    return (
      <View style={{ marginTop: 14 }}>
        <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* 가로 기준선 3개 */}
          {[0, 1, 2].map(i => (
            <Line
              key={i}
              x1={0}
              x2={W}
              y1={CHART_TOP + i * (CHART_H / 2)}
              y2={CHART_TOP + i * (CHART_H / 2)}
              stroke={DS.border}
              strokeWidth={1}
            />
          ))}
          {/* 막대 */}
          {values.map((v, i) => {
            const barHeight = Math.max((v / maxValue) * CHART_H, v > 0 ? 3 : 0);
            const x = i * (barWidth + gap);
            const y = CHART_BOTTOM - barHeight;
            return (
              <Rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={color ?? DS.primary}
                rx={2}
              />
            );
          })}
        </Svg>
        {/* X축 라벨 */}
        {visibleLabels.length > 0 && (
          <View style={styles.chartLabelRow}>
            {visibleLabels.map((l, i) => (
              <Text key={`${l}-${i}`} style={styles.chartLabelText}>{l}</Text>
            ))}
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>대시보드 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── 파생 표시값 ──
  const maxBucket = Math.max(...assetMetrics.buckets, 1);
  const maxCategory = Math.max(...learningMetrics.categoryStats.map(c => c.count), 1);
  const maxTicker = tradeMetrics.top10Tickers[0]?.[1] ?? 1;
  const buyTotal = tradeMetrics.buyCount + tradeMetrics.sellCount;
  const buyPct = buyTotal > 0 ? Math.round((tradeMetrics.buyCount / buyTotal) * 100) : 0;
  const BUCKET_LABELS = ['50만 미만', '50~100만', '100~200만', '200~500만', '500만 이상'];

  return (
    <SafeAreaView style={styles.safe}>
      {/* 헤더 */}
      <View style={styles.header}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ChevronLeft size={24} color={DS.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.backBtn} />
        )}
        <Text style={styles.headerTitle}>대시보드</Text>
        <Text style={styles.headerDate}>{dateRange}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── 사용자 ── */}
        <SectionHeader icon={Users} title="사용자" />

        <BigKPICard
          label="전체 가입자"
          value={`${userMetrics.total.toLocaleString()}명`}
          change={userMetrics.weekSignups > 0 ? `+${userMetrics.weekSignups} 이번 주` : undefined}
        />

        <View style={styles.kpiGrid}>
          <SmallKPI label="오늘 가입" value={`${userMetrics.todaySignups}`} />
          <SmallKPI label="DAU" value={`${userMetrics.dau}`} />
          <SmallKPI label="WAU" value={`${userMetrics.wau}`} />
          <SmallKPI label="활성 비율" value={`${activeRate}%`} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>최근 30일 신규 가입</Text>
            <Text style={styles.chartSubtitle}>일별</Text>
          </View>
          <BarChart
            values={userMetrics.signupTrend.counts}
            labels={userMetrics.signupTrend.labels}
          />
        </View>

        {/* ── 거래 ── */}
        <SectionHeader icon={Wallet} title="거래 현황" />

        <BigKPICard
          label="총 누적 거래"
          value={`${totalTrades.toLocaleString()}회`}
          change={tradeMetrics.todayCount > 0 ? `+${tradeMetrics.todayCount} 오늘` : undefined}
        />

        <View style={styles.kpiGrid}>
          <SmallKPI
            label="오늘 거래대금"
            value={`${Math.round(tradeMetrics.todayAmount / 10_000).toLocaleString()}만원`}
          />
          <SmallKPI
            label="이번 주 거래대금"
            value={`${Math.round(tradeMetrics.weekAmount / 10_000).toLocaleString()}만원`}
          />
        </View>

        {buyTotal > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>매수 / 매도 비율</Text>
              <Text style={styles.chartSubtitle}>누적</Text>
            </View>
            <View style={styles.ratioBar}>
              <View style={{ flex: tradeMetrics.buyCount, backgroundColor: DS.primary }} />
              <View style={{ flex: Math.max(tradeMetrics.sellCount, 0.001), backgroundColor: DS.negative }} />
            </View>
            <View style={styles.ratioLegend}>
              <View style={styles.ratioLegendItem}>
                <View style={[styles.ratioDot, { backgroundColor: DS.primary }]} />
                <Text style={styles.ratioText}>매수 {tradeMetrics.buyCount.toLocaleString()} ({buyPct}%)</Text>
              </View>
              <View style={styles.ratioLegendItem}>
                <View style={[styles.ratioDot, { backgroundColor: DS.negative }]} />
                <Text style={styles.ratioText}>매도 {tradeMetrics.sellCount.toLocaleString()} ({100 - buyPct}%)</Text>
              </View>
            </View>
          </View>
        )}

        {tradeMetrics.top10Tickers.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>거래 빈도 TOP 10</Text>
              <Text style={styles.chartSubtitle}>종목</Text>
            </View>
            <View style={{ marginTop: 10 }}>
              {tradeMetrics.top10Tickers.map(([ticker, count]) => (
                <View key={ticker} style={styles.barRow}>
                  <Text style={styles.barLabel} numberOfLines={1}>{ticker}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${(count / maxTicker) * 100}%` }]} />
                  </View>
                  <Text style={styles.barValue}>{count}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {tradeMetrics.top10Reasons.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>매매 이유 키워드</Text>
              <Text style={styles.chartSubtitle}>TOP 10</Text>
            </View>
            <View style={styles.pillRow}>
              {tradeMetrics.top10Reasons.map(([word, n]) => (
                <View key={word} style={styles.pill}>
                  <Text style={styles.pillText}>{word} · {n}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 학습 ── */}
        <SectionHeader icon={BookOpen} title="학습" />

        <View style={styles.kpiGrid}>
          <SmallKPI label="유저당 평균 완료 레슨" value={`${learningMetrics.avgPerUser}개`} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>최근 14일 학습량</Text>
            <Text style={styles.chartSubtitle}>일별</Text>
          </View>
          <BarChart
            values={learningMetrics.dailyTrend.counts}
            labels={learningMetrics.dailyTrend.labels}
            color={DS.positive}
          />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>카테고리별 학습량</Text>
          </View>
          <View style={{ marginTop: 10 }}>
            {learningMetrics.categoryStats.map(c => (
              <View key={c.label} style={styles.barRow}>
                <Text style={styles.barLabel}>{c.label}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, {
                    width: `${(c.count / maxCategory) * 100}%`,
                    backgroundColor: DS.positive,
                  }]} />
                </View>
                <Text style={styles.barValue}>{c.count}</Text>
              </View>
            ))}
          </View>
        </View>

        {learningMetrics.top5Lessons.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>가장 많이 풀린 레슨</Text>
              <Text style={styles.chartSubtitle}>TOP 5</Text>
            </View>
            <View style={{ marginTop: 4 }}>
              {learningMetrics.top5Lessons.map(([id, n], i) => (
                <View key={id} style={styles.listRow}>
                  <Text style={styles.listText}>{i + 1}. 레슨 #{id}</Text>
                  <Text style={styles.listMeta}>{n}회</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── 자산 ── */}
        <SectionHeader icon={Briefcase} title="자산" />

        <View style={styles.kpiGrid}>
          <SmallKPI label="평균 총 자산" value={`${Math.round(assetMetrics.avg / 10_000).toLocaleString()}만원`} />
          <SmallKPI label="중앙값" value={`${Math.round(assetMetrics.med / 10_000).toLocaleString()}만원`} />
        </View>

        <View style={styles.chartCard}>
          <View style={styles.chartHeaderRow}>
            <Text style={styles.chartTitle}>자산 구간별 사용자</Text>
            <Text style={styles.chartSubtitle}>명</Text>
          </View>
          <View style={{ marginTop: 10 }}>
            {assetMetrics.buckets.map((count, i) => (
              <View key={BUCKET_LABELS[i]} style={styles.barRow}>
                <Text style={[styles.barLabel, { width: 76 }]}>{BUCKET_LABELS[i]}</Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${(count / maxBucket) * 100}%` }]} />
                </View>
                <Text style={styles.barValue}>{count}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── 커뮤니티 ── */}
        <SectionHeader icon={MessageCircle} title="커뮤니티" />

        <BigKPICard
          label="총 게시글"
          value={`${communityMetrics.total.toLocaleString()}개`}
          change={communityMetrics.weekPosts > 0 ? `+${communityMetrics.weekPosts} 이번 주` : undefined}
        />

        <View style={styles.kpiGrid}>
          <SmallKPI label="오늘 게시글" value={`${communityMetrics.todayPosts}`} />
          <SmallKPI label="이번 주" value={`${communityMetrics.weekPosts}`} />
        </View>

        {communityMetrics.popular.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>인기 글</Text>
              <Text style={styles.chartSubtitle}>좋아요순 TOP 5</Text>
            </View>
            <View style={{ marginTop: 4 }}>
              {communityMetrics.popular.map((p, i) => (
                <View key={p.id} style={styles.listRow}>
                  <Text style={styles.listText} numberOfLines={1}>
                    {i + 1}. {p.content?.slice(0, 30) ?? '(내용 없음)'}
                  </Text>
                  <Text style={styles.listMeta}>{p.likes?.length ?? 0}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {communityMetrics.topAuthors.length > 0 && (
          <View style={styles.chartCard}>
            <View style={styles.chartHeaderRow}>
              <Text style={styles.chartTitle}>활성 작성자</Text>
              <Text style={styles.chartSubtitle}>TOP 10</Text>
            </View>
            <View style={{ marginTop: 4 }}>
              {communityMetrics.topAuthors.map((a, i) => (
                <TouchableOpacity
                  key={a.uid}
                  style={styles.listRow}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate('유저게시글', { uid: a.uid, name: a.nickname })}
                >
                  <Text style={styles.listText}>{i + 1}. {a.nickname}</Text>
                  <Text style={styles.listMeta}>{a.count}건</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ── 사용자별 거래내역 진입 ── */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            const parent = navigation.getParent();
            if (parent) parent.navigate('거래내역Tab');
          }}
          style={styles.navCard}
        >
          <ClipboardList size={20} color={DS.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.navCardTitle}>전체 사용자 거래내역</Text>
            <Text style={styles.navCardSub}>
              {userMetrics.total.toLocaleString()}명 · 총 {totalTrades.toLocaleString()}건 · reason 분석
            </Text>
          </View>
          <ChevronRight size={20} color={DS.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
