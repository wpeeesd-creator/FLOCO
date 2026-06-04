/**
 * 관리자 — 누적 성장 곡선 화면
 * 일별 신규 가입 + 누적 가입자 시계열 (사업계획서 "성장 추이" 슬라이드용)
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminDashboardScreen과 동일)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Clipboard,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path, Line, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { ChevronLeft, TrendingUp, ClipboardList, Users } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import { formatSchoolLabel } from '../../lib/school';

const DAY_MS = 24 * 60 * 60 * 1000;

type Period = 7 | 30 | 90 | 0; // 0 = 전체

interface GrowthPoint {
  date: string; // YYYY-MM-DD (로컬 기준)
  daily: number;
  cumulative: number;
}

interface GrowthData {
  series: GrowthPoint[];
  totalUsers: number;
  baseCount: number;
  newInPeriod: number;
  avgDaily: number;
  weeklyGrowthRate: number;
  earliestDate: string | null;
}

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

// 로컬 날짜 키 (YYYY-MM-DD) — toISOString은 UTC라 KST 오전 9시 이전이 전날로 새는 문제 방지
function toDateKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function computeWeeklyGrowth(series: { cumulative: number }[]): number {
  if (series.length < 7) return 0;
  const lastWeek = series[series.length - 1].cumulative;
  const prevWeek = series[Math.max(0, series.length - 8)].cumulative;
  if (prevWeek === 0) return 0;
  return ((lastWeek - prevWeek) / prevWeek) * 100;
}

// ── 시계열 집계 ───────────────────────────────
export function computeGrowthSeries(users: any[], days: Period): GrowthData {
  const validUsers = users
    .filter(u => u.role !== 'admin' && u.createdAt)
    .map(u => ({ createdMs: toMs(u.createdAt) }))
    .filter(u => u.createdMs > 0);

  if (validUsers.length === 0) {
    return {
      series: [], totalUsers: 0, baseCount: 0,
      newInPeriod: 0, avgDaily: 0, weeklyGrowthRate: 0, earliestDate: null,
    };
  }

  const earliest = Math.min(...validUsers.map(u => u.createdMs));
  const now = Date.now();
  const startMs = days === 0 ? earliest : now - days * DAY_MS;

  // 일별 버킷 생성 (로컬 자정 기준)
  const dailyBuckets: Record<string, number> = {};
  const startDate = new Date(Math.min(startMs, now));
  startDate.setHours(0, 0, 0, 0);
  const cursor = new Date(startDate);
  const endDate = new Date(now);
  while (cursor <= endDate) {
    dailyBuckets[toDateKey(cursor.getTime())] = 0;
    cursor.setDate(cursor.getDate() + 1);
  }

  // 가입 카운트 + 시작점 이전 누적 base
  let baseCount = 0;
  for (const u of validUsers) {
    const key = toDateKey(u.createdMs);
    if (key in dailyBuckets) {
      dailyBuckets[key] += 1;
    } else {
      baseCount += 1; // 기간 시작 이전 가입 → 누적 base
    }
  }

  // 누적 시계열
  const sortedDates = Object.keys(dailyBuckets).sort();
  let cumulative = baseCount;
  const series: GrowthPoint[] = sortedDates.map(date => {
    cumulative += dailyBuckets[date];
    return { date, daily: dailyBuckets[date], cumulative };
  });

  return {
    series,
    totalUsers: cumulative,
    baseCount,
    newInPeriod: cumulative - baseCount,
    avgDaily: sortedDates.length > 0 ? (cumulative - baseCount) / sortedDates.length : 0,
    weeklyGrowthRate: computeWeeklyGrowth(series),
    earliestDate: toDateKey(earliest),
  };
}

// ── 기간 내 가입자 목록 (시계열과 별도 계산 — computeGrowthSeries 무변경) ──
export function computePeriodUsers(users: any[], days: Period): any[] {
  const now = Date.now();
  const startMs = days === 0 ? 0 : now - days * DAY_MS;

  return users
    .filter(u => u.role !== 'admin')
    .map(u => ({ ...u, createdMs: toMs(u.createdAt) }))
    .filter(u => u.createdMs && u.createdMs >= startMs)
    .sort((a, b) => b.createdMs - a.createdMs); // 최신순
}

// 상대 날짜 표시 (오늘/어제/N일 전/MM.DD)
function formatRelativeDate(ms: number): string {
  const diffDays = Math.floor((Date.now() - ms) / DAY_MS);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  const date = new Date(ms);
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

const PERIOD_OPTIONS: { id: Period; label: string }[] = [
  { id: 7, label: '7일' },
  { id: 30, label: '30일' },
  { id: 90, label: '90일' },
  { id: 0, label: '전체' },
];

export default function AdminGrowthScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation();

  // 디자인 토큰 — AdminDashboardScreen과 동일 (PPT 캡처용 고정 라이트 톤)
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<Period>(30);

  const loadData = async () => {
    try {
      const all = await fetchAllUsersForAdmin();
      setUsers(all);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const data = useMemo(() => computeGrowthSeries(users, period), [users, period]);
  const periodUsers = useMemo(() => computePeriodUsers(users, period), [users, period]);
  const periodLabel = PERIOD_OPTIONS.find(o => o.id === period)?.label ?? '';

  // ── 사업계획서용 복사 ──
  const copyToClipboard = () => {
    const copyText = `[FLOCO 사용자 성장 추이 - ${periodLabel}]

기간 내 신규 가입: ${data.newInPeriod}명
주간 성장률: ${data.weeklyGrowthRate.toFixed(1)}%
일평균 신규: ${data.avgDaily.toFixed(1)}명
총 누적 가입자: ${data.totalUsers}명

[일별 신규 가입]
${data.series.filter(s => s.daily > 0).map(s =>
  `${s.date}: ${s.daily}명 (누적 ${s.cumulative}명)`,
).join('\n')}

[기간 내 가입자]
${periodUsers.map(u =>
  `- ${u.nickname ?? u.name ?? '익명'} (${u.school ? formatSchoolLabel(u.school) : '학교 미설정'}) - ${new Date(u.createdMs).toLocaleDateString('ko-KR')}`,
).join('\n')}

기준일: ${new Date().toLocaleDateString('ko-KR')}`;
    Clipboard.setString(copyText);
    Alert.alert('복사 완료', '사업계획서용 텍스트가 복사됐어요.');
  };

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
    periodRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
    chip: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: 10,
      backgroundColor: DS.cardBg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: DS.border,
    },
    chipActive: { backgroundColor: DS.primary, borderColor: DS.primary },
    chipText: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    chipTextActive: { color: '#fff', fontWeight: '700' },
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
    // SmallKPI
    kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
    smallCard: {
      backgroundColor: DS.cardBg,
      padding: 16,
      borderRadius: 12,
      flex: 1,
      minWidth: '47%',
    },
    smallLabel: { fontSize: 12, color: DS.textSub, fontWeight: '500', marginBottom: 4 },
    smallNumber: { fontSize: 22, fontWeight: '700', color: DS.text },
    // Chart card
    chartCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
    },
    chartHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
    chartTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    chartSubtitle: { fontSize: 12, color: DS.textMuted, fontWeight: '500' },
    // 기간 내 가입자 목록
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    userListCard: {
      backgroundColor: DS.cardBg,
      padding: 16,
      borderRadius: 16,
      marginBottom: 16,
    },
    userRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    userName: { fontSize: 15, fontWeight: '600', color: DS.text, marginBottom: 2 },
    userSchool: { fontSize: 12, color: DS.textSub },
    userDate: { fontSize: 13, color: DS.textSub, fontWeight: '500' },
    userEmptyText: { textAlign: 'center', color: DS.textSub, paddingVertical: 24 },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: DS.primary,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 4,
    },
    copyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
    },
    emptyText: { fontSize: 14, color: DS.textSub },
  });

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

  const SmallKPI = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.smallCard}>
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.smallNumber}>{value}</Text>
    </View>
  );

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={DS.text} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  // ── SVG 누적 선 차트 ──
  const LineChart = ({ points }: { points: GrowthPoint[] }) => {
    if (points.length === 0) return null;

    const width = 320;
    const height = 160;
    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const maxValue = Math.max(...points.map(d => d.cumulative));
    const minValue = Math.min(...points.map(d => d.cumulative));
    const range = maxValue - minValue || 1;
    const denom = Math.max(points.length - 1, 1); // 데이터 1개 방어

    const coords = points.map((d, i) => ({
      x: padding.left + (i / denom) * chartWidth,
      y: padding.top + chartHeight - ((d.cumulative - minValue) / range) * chartHeight,
    }));

    const pathD = coords.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
    const areaD = `${pathD} L${coords[coords.length - 1].x},${padding.top + chartHeight} L${coords[0].x},${padding.top + chartHeight} Z`;

    const xLabelIdxs = points.length >= 3
      ? [0, Math.floor(points.length / 2), points.length - 1]
      : points.map((_, i) => i);

    return (
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        {/* Y축 가로선 + 라벨 */}
        {[0, 0.5, 1].map(ratio => (
          <React.Fragment key={ratio}>
            <Line
              x1={padding.left}
              x2={width - padding.right}
              y1={padding.top + chartHeight * (1 - ratio)}
              y2={padding.top + chartHeight * (1 - ratio)}
              stroke={DS.border}
              strokeWidth={1}
            />
            <SvgText
              x={padding.left - 8}
              y={padding.top + chartHeight * (1 - ratio) + 4}
              fontSize={10}
              fill={DS.textMuted}
              textAnchor="end"
            >
              {Math.round(minValue + range * ratio)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* 영역 + 선 */}
        <Path d={areaD} fill={DS.primary} fillOpacity={0.1} />
        <Path d={pathD} stroke={DS.primary} strokeWidth={2} fill="none" />

        {/* 시작/끝 점 */}
        <Circle cx={coords[0].x} cy={coords[0].y} r={3} fill={DS.primary} />
        <Circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r={3} fill={DS.primary} />

        {/* X축 라벨 */}
        {xLabelIdxs.map(idx => (
          <SvgText
            key={idx}
            x={padding.left + (idx / denom) * chartWidth}
            y={height - 8}
            fontSize={10}
            fill={DS.textMuted}
            textAnchor="middle"
          >
            {points[idx].date.slice(5)}
          </SvgText>
        ))}
      </Svg>
    );
  };

  // ── SVG 일별 막대 차트 (AdminDashboardScreen 패턴 인라인) ──
  const BarChart = ({ points }: { points: GrowthPoint[] }) => {
    if (points.length === 0) return null;

    const W = 320;
    const H = 140;
    const CHART_TOP = 16;
    const CHART_BOTTOM = 110;
    const CHART_H = CHART_BOTTOM - CHART_TOP;
    const maxValue = Math.max(...points.map(d => d.daily), 1);
    const gap = points.length > 60 ? 0.5 : 2;
    const barWidth = Math.max(W / points.length - gap, 0.5);

    const xLabelIdxs = points.length >= 3
      ? [0, Math.floor(points.length / 2), points.length - 1]
      : points.map((_, i) => i);

    return (
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
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
        {points.map((d, i) => {
          const barHeight = Math.max((d.daily / maxValue) * CHART_H, d.daily > 0 ? 3 : 0);
          return (
            <Rect
              key={i}
              x={i * (barWidth + gap)}
              y={CHART_BOTTOM - barHeight}
              width={barWidth}
              height={barHeight}
              fill={DS.primary}
              rx={points.length > 60 ? 0 : 2}
            />
          );
        })}
        {xLabelIdxs.map(idx => (
          <SvgText
            key={idx}
            x={Math.min(Math.max(idx * (barWidth + gap) + barWidth / 2, 14), W - 14)}
            y={H - 8}
            fontSize={10}
            fill={DS.textMuted}
            textAnchor="middle"
          >
            {points[idx].date.slice(5)}
          </SvgText>
        ))}
      </Svg>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>성장 추이 분석 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
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
        <Text style={styles.headerTitle}>성장 추이</Text>
        {data.earliestDate ? (
          <Text style={styles.headerDate}>첫 가입 {data.earliestDate}</Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 기간 칩 */}
        <View style={styles.periodRow}>
          {PERIOD_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.id}
              onPress={() => setPeriod(opt.id)}
              style={[styles.chip, period === opt.id && styles.chipActive]}
            >
              <Text style={[styles.chipText, period === opt.id && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {data.series.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>가입 데이터가 없어요</Text>
          </View>
        ) : (
          <>
            {/* 메인 KPI */}
            <BigKPICard
              label={`기간 내 신규 가입 (${periodLabel})`}
              value={`${data.newInPeriod.toLocaleString()}명`}
              change={data.weeklyGrowthRate > 0 ? `+${data.weeklyGrowthRate.toFixed(1)}% 주간` : undefined}
            />

            {/* 보조 KPI */}
            <View style={styles.kpiGrid}>
              <SmallKPI label="총 누적 가입자" value={`${data.totalUsers.toLocaleString()}명`} />
              <SmallKPI label="일평균 신규" value={`${data.avgDaily.toFixed(1)}명`} />
            </View>

            {/* 누적 가입 선 차트 */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.chartTitle}>누적 가입자 추이</Text>
                <Text style={styles.chartSubtitle}>{periodLabel}</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <LineChart points={data.series} />
              </View>
            </View>

            {/* 일별 신규 가입 막대 차트 */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeaderRow}>
                <Text style={styles.chartTitle}>일별 신규 가입</Text>
                <Text style={styles.chartSubtitle}>일별</Text>
              </View>
              <View style={{ marginTop: 12 }}>
                <BarChart points={data.series} />
              </View>
            </View>

            {/* 기간 내 가입자 목록 */}
            <SectionHeader icon={Users} title={`기간 내 가입자 (${periodUsers.length}명)`} />
            <View style={styles.userListCard}>
              {periodUsers.length === 0 ? (
                <Text style={styles.userEmptyText}>이 기간에 가입한 사용자가 없어요.</Text>
              ) : (
                periodUsers.map(user => (
                  <View key={user.uid ?? user.id} style={styles.userRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.userName} numberOfLines={1}>
                        {user.nickname ?? user.name ?? '익명'}
                      </Text>
                      <Text style={styles.userSchool} numberOfLines={1}>
                        {user.school ? formatSchoolLabel(user.school) : '학교 미설정'}
                      </Text>
                    </View>
                    <Text style={styles.userDate}>{formatRelativeDate(user.createdMs)}</Text>
                  </View>
                ))
              )}
            </View>

            {/* 복사 버튼 */}
            <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn} activeOpacity={0.85}>
              <ClipboardList size={16} color="#fff" />
              <Text style={styles.copyBtnText}>사업계획서용 복사</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
