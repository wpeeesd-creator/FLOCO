/**
 * 관리자 — 투자 이유 품질 분석 화면
 * 작성률/길이/검증 통과율/분석형 비율 + 주간 추이 + 사용자 순위 + 우수 사례 인용
 * 학습 키워드 매칭률은 베이스라인(≈0%) 기록용 — 개선 추이 추적 지표
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
import {
  ChevronLeft,
  TrendingUp,
  Users,
  Star,
  ClipboardList,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import { validateReason } from '../../utils/reasonValidator';
import { formatSchoolLabel } from '../../lib/school';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// 감정 vs 분석 2분류 — 기업/산업 키워드 1개 이상이면 분석형
const ANALYTICAL_KEYWORDS = [
  '실적', '매출', '영업이익', '신제품', '출시', '경쟁사', '시장',
  '점유율', '배당', '성장', '확장', '인수', '발표', '계약', '전략',
  'AI', '반도체', '클라우드', '플랫폼', '글로벌',
];

export function detectAnalytical(reason: string): boolean {
  return ANALYTICAL_KEYWORDS.some(kw => reason.includes(kw));
}

// 학습 키워드 (data/learningContent.ts 용어 기반) — 베이스라인 ≈0%, 추이 추적용
const LEARNING_KEYWORDS = [
  'PER', 'PBR', 'EPS', 'ROE', 'ROA', '배당수익률', '시가총액',
  '분산투자', '장기투자', '복리', '리스크', '포트폴리오',
  '가치투자', '성장주', '저평가', '고평가',
];

export function detectLearningKeyword(reason: string): boolean {
  const lower = reason.toLowerCase();
  return LEARNING_KEYWORDS.some(kw => lower.includes(kw.toLowerCase()));
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

interface ReasonTx {
  user: any;
  tx: any;
  reason: string;
  length: number;
  valid: boolean;
  isAnalytical: boolean;
  hasLearningKeyword: boolean;
  createdMs: number;
}

interface WeekStat {
  weekStart: string;
  count: number;
  avgLength: number;
  validRate: number;
  analyticalRate: number;
}

interface UserScore {
  uid: string;
  name: string;
  school: string;
  reasonCount: number;
  avgLength: number;
  validRate: number;
  analyticalRate: number;
  totalScore: number;
}

// ── 주간 추이 ─────────────────────────────────
function computeWeeklyTrend(txs: ReasonTx[]): WeekStat[] {
  const dated = txs.filter(t => t.createdMs > 0);
  if (dated.length === 0) return [];

  const earliest = Math.min(...dated.map(t => t.createdMs));
  const now = Date.now();
  const weeks: WeekStat[] = [];

  let cursor = earliest;
  while (cursor < now) {
    const weekEnd = cursor + WEEK_MS;
    const inWeek = dated.filter(t => t.createdMs >= cursor && t.createdMs < weekEnd);
    if (inWeek.length > 0) {
      const date = new Date(cursor);
      weeks.push({
        weekStart: `${date.getMonth() + 1}/${date.getDate()}`,
        count: inWeek.length,
        avgLength: inWeek.reduce((s, t) => s + t.length, 0) / inWeek.length,
        validRate: (inWeek.filter(t => t.valid).length / inWeek.length) * 100,
        analyticalRate: (inWeek.filter(t => t.isAnalytical).length / inWeek.length) * 100,
      });
    }
    cursor += WEEK_MS;
  }

  return weeks;
}

// ── 사용자별 품질 점수 ─────────────────────────
function computeUserScores(txs: ReasonTx[]): UserScore[] {
  const grouped: Record<string, ReasonTx[]> = {};
  for (const t of txs) {
    const uid: string = t.user.uid ?? t.user.id ?? 'unknown';
    (grouped[uid] ??= []).push(t);
  }

  return Object.entries(grouped).map(([uid, userTxs]) => {
    const avgLength = userTxs.reduce((s, t) => s + t.length, 0) / userTxs.length;
    const validRate = (userTxs.filter(t => t.valid).length / userTxs.length) * 100;
    const analyticalRate = (userTxs.filter(t => t.isAnalytical).length / userTxs.length) * 100;

    // 품질 점수 = 길이 정규화(40) + 검증 통과율(30) + 분석형 비율(30)
    const lengthScore = Math.min(avgLength / 30, 1) * 40;
    const validScore = validRate * 0.3;
    const analyticalScore = analyticalRate * 0.3;
    const totalScore = Math.round(lengthScore + validScore + analyticalScore);

    const user = userTxs[0].user;
    return {
      uid,
      name: user.nickname ?? user.name ?? '익명',
      school: user.school ? formatSchoolLabel(user.school) : '학교 미설정',
      reasonCount: userTxs.length,
      avgLength,
      validRate,
      analyticalRate,
      totalScore,
    };
  }).sort((a, b) => b.totalScore - a.totalScore);
}

// ── 전체 집계 ─────────────────────────────────
export function computeReasonQuality(users: any[]) {
  const txsWithReason: ReasonTx[] = [];
  let totalTxs = 0;

  for (const user of users) {
    if (user.role === 'admin') continue;

    const txs: any[] = user.transactions ?? [];
    totalTxs += txs.length;

    for (const tx of txs) {
      if (!tx.reason || typeof tx.reason !== 'string') continue;
      const reason = tx.reason.trim();
      if (reason.length === 0 || reason === '미입력') continue;

      const validation = validateReason(reason);

      txsWithReason.push({
        user,
        tx,
        reason,
        length: reason.length,
        valid: validation.valid,
        isAnalytical: detectAnalytical(reason),
        hasLearningKeyword: detectLearningKeyword(reason),
        createdMs: toMs(tx.createdAt),
      });
    }
  }

  const totalReasons = txsWithReason.length;
  const pct = (n: number) => (totalReasons > 0 ? (n / totalReasons) * 100 : 0);

  return {
    totalTxs,
    totalReasons,
    writingRate: totalTxs > 0 ? (totalReasons / totalTxs) * 100 : 0,
    avgLength: totalReasons > 0
      ? txsWithReason.reduce((s, t) => s + t.length, 0) / totalReasons
      : 0,
    validRate: pct(txsWithReason.filter(t => t.valid).length),
    analyticalRate: pct(txsWithReason.filter(t => t.isAnalytical).length),
    learningKeywordRate: pct(txsWithReason.filter(t => t.hasLearningKeyword).length),
    weeklyTrend: computeWeeklyTrend(txsWithReason),
    userScores: computeUserScores(txsWithReason),
    // 우수 사례 = 50자 이상 + 검증 통과, 길이순 TOP 5
    featuredReasons: txsWithReason
      .filter(t => t.length >= 50 && t.valid)
      .sort((a, b) => b.length - a.length)
      .slice(0, 5),
  };
}

export default function AdminReasonQualityScreen() {
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

  const loadData = async () => {
    try {
      const all = await fetchAllUsersForAdmin();
      setUsers(all.filter((u: any) => u.role !== 'admin'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const data = useMemo(() => computeReasonQuality(users), [users]);

  // ── 사업계획서용 복사 ──
  const copyToClipboard = () => {
    const copyText = `[FLOCO 투자 이유 품질 분석]

[개요]
총 거래: ${data.totalTxs}건
이유 작성: ${data.totalReasons}건 (작성률 ${data.writingRate.toFixed(1)}%)
평균 길이: ${data.avgLength.toFixed(1)}자
검증 통과율: ${data.validRate.toFixed(1)}%

[품질 분포]
분석형 이유 (기업/산업 키워드 포함): ${data.analyticalRate.toFixed(1)}%
학습 키워드 적용: ${data.learningKeywordRate.toFixed(1)}% (베이스라인 — 개선 추적용)

[주간 추이]
${data.weeklyTrend.map(w =>
  `${w.weekStart}: ${w.count}건 / 평균 ${w.avgLength.toFixed(1)}자 / 분석형 ${w.analyticalRate.toFixed(0)}%`,
).join('\n')}

[품질 상위 5명]
${data.userScores.slice(0, 5).map((u, i) =>
  `${i + 1}. ${u.name} - ${u.totalScore}점 (${u.reasonCount}건, 평균 ${u.avgLength.toFixed(1)}자)`,
).join('\n')}

[우수 작성 사례]
${data.featuredReasons.map((t, i) =>
  `${i + 1}. [${t.tx.stockName ?? t.tx.ticker} ${t.tx.type === 'buy' ? '매수' : '매도'}] "${t.reason}"`,
).join('\n\n')}

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
    scrollContent: { padding: 16, paddingBottom: 100 }, // 탭바 가림 방지
    // BigKPI
    bigCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
    },
    bigLabel: { fontSize: 13, color: DS.textSub, fontWeight: '500', marginBottom: 8 },
    bigNumber: { fontSize: 36, fontWeight: '700', color: DS.text, lineHeight: 42 },
    bigSub: { fontSize: 12, color: DS.textMuted, fontWeight: '500', marginTop: 6 },
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
    smallNote: { fontSize: 10, color: DS.textMuted, marginTop: 2 },
    // 섹션
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    // 차트 카드
    chartCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    weekRowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    weekLabel: { fontSize: 13, fontWeight: '600', color: DS.text },
    weekMeta: { fontSize: 12, color: DS.textSub },
    barBg: { height: 10, backgroundColor: DS.border, borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 5, minWidth: 3 },
    // 사용자 순위
    userListCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    rankText: { fontSize: 13, fontWeight: '700' },
    userName: { fontSize: 14, fontWeight: '600', color: DS.text },
    userMeta: { fontSize: 12, color: DS.textSub, marginTop: 1 },
    scoreBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
    scoreBadgeText: { fontSize: 13, fontWeight: '700' },
    // 우수 사례 카드
    featuredCard: {
      backgroundColor: DS.cardBg,
      padding: 16,
      borderRadius: 16,
      marginBottom: 8,
      borderLeftWidth: 3,
      borderLeftColor: DS.primary,
    },
    featuredHeader: { flexDirection: 'row', marginBottom: 8 },
    featuredUser: { fontSize: 14, fontWeight: '700', color: DS.text },
    featuredMeta: { fontSize: 12, color: DS.textSub, marginTop: 2 },
    featuredReason: { fontSize: 14, color: DS.text, lineHeight: 22 },
    analyticalBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      backgroundColor: DS.primary + '15',
      borderRadius: 6,
      alignSelf: 'flex-start',
    },
    analyticalBadgeText: { fontSize: 11, color: DS.primary, fontWeight: '700' },
    emptyCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyText: { fontSize: 14, color: DS.textSub },
    // 복사 버튼
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      backgroundColor: DS.primary,
      borderRadius: 14,
      paddingVertical: 16,
      marginTop: 8,
    },
    copyBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    noteText: { fontSize: 11, color: DS.textMuted, lineHeight: 16, marginTop: 12, paddingHorizontal: 4 },
  });

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={DS.text} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  const SmallKPI = ({ label, value, note }: { label: string; value: string; note?: string }) => (
    <View style={styles.smallCard}>
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.smallNumber}>{value}</Text>
      {note ? <Text style={styles.smallNote}>{note}</Text> : null}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>이유 품질 분석 중...</Text>
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
        <Text style={styles.headerTitle}>이유 품질 분석</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 메인 KPI — 작성률 */}
        <View style={styles.bigCard}>
          <Text style={styles.bigLabel}>이유 작성률</Text>
          <Text style={styles.bigNumber}>{data.writingRate.toFixed(1)}%</Text>
          <Text style={styles.bigSub}>
            {data.totalReasons}건 / 전체 {data.totalTxs}건 (이유 기록은 빌드 8 도입 — 이전 거래는 필드 없음)
          </Text>
        </View>

        {/* 보조 KPI */}
        <View style={styles.kpiGrid}>
          <SmallKPI label="평균 길이" value={`${data.avgLength.toFixed(1)}자`} />
          <SmallKPI label="검증 통과율" value={`${data.validRate.toFixed(1)}%`} note="현행 기준(10자+) 소급 적용" />
          <SmallKPI label="분석형 비율" value={`${data.analyticalRate.toFixed(1)}%`} note="기업/산업 키워드 포함" />
          <SmallKPI label="학습 키워드" value={`${data.learningKeywordRate.toFixed(1)}%`} note="베이스라인 — 개선 추적용" />
        </View>

        {/* 주간 품질 추이 */}
        <SectionHeader icon={TrendingUp} title="주간 품질 추이" />
        <View style={styles.chartCard}>
          {data.weeklyTrend.length === 0 ? (
            <Text style={styles.emptyText}>추이 데이터가 없어요</Text>
          ) : (
            data.weeklyTrend.map((week, idx) => (
              <View key={idx} style={{ marginBottom: 12 }}>
                <View style={styles.weekRowHead}>
                  <Text style={styles.weekLabel}>{week.weekStart} ({week.count}건)</Text>
                  <Text style={styles.weekMeta}>
                    평균 {week.avgLength.toFixed(1)}자 · 분석 {week.analyticalRate.toFixed(0)}%
                  </Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, {
                    width: `${Math.min((week.avgLength / 50) * 100, 100)}%`,
                    backgroundColor: DS.primary,
                  }]} />
                </View>
              </View>
            ))
          )}
        </View>

        {/* 사용자별 품질 순위 */}
        <SectionHeader icon={Users} title="사용자별 이유 품질 (TOP 10)" />
        <View style={styles.userListCard}>
          {data.userScores.length === 0 ? (
            <Text style={styles.emptyText}>작성된 이유가 없어요</Text>
          ) : (
            data.userScores.slice(0, 10).map((u, idx) => (
              <View key={u.uid} style={styles.userRow}>
                <View style={{ width: 24, alignItems: 'center' }}>
                  <Text style={[styles.rankText, { color: idx < 3 ? DS.primary : DS.textSub }]}>
                    {idx + 1}
                  </Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
                  <Text style={styles.userMeta}>
                    {u.reasonCount}건 · 평균 {u.avgLength.toFixed(1)}자 · {u.school}
                  </Text>
                </View>
                <View style={[styles.scoreBadge, {
                  backgroundColor: u.totalScore >= 70 ? DS.positive + '20'
                    : u.totalScore >= 40 ? DS.primary + '20'
                    : DS.textMuted + '20',
                }]}>
                  <Text style={[styles.scoreBadgeText, {
                    color: u.totalScore >= 70 ? DS.positive
                      : u.totalScore >= 40 ? DS.primary
                      : DS.textSub,
                  }]}>
                    {u.totalScore}점
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* 우수 작성 사례 (PPT 직접 활용) */}
        <SectionHeader icon={Star} title="우수 작성 사례" />
        {data.featuredReasons.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>아직 우수 사례가 없어요 (50자 이상 + 검증 통과)</Text>
          </View>
        ) : (
          data.featuredReasons.map((t, idx) => (
            <View key={idx} style={styles.featuredCard}>
              <View style={styles.featuredHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featuredUser}>
                    {t.user.nickname ?? t.user.name ?? '익명'}
                  </Text>
                  <Text style={styles.featuredMeta}>
                    {t.tx.stockName ?? t.tx.ticker} · {t.tx.type === 'buy' ? '매수' : '매도'} · {t.length}자
                  </Text>
                </View>
                {t.isAnalytical && (
                  <View style={styles.analyticalBadge}>
                    <Text style={styles.analyticalBadgeText}>분석</Text>
                  </View>
                )}
              </View>
              <Text style={styles.featuredReason}>{t.reason}</Text>
            </View>
          ))
        )}

        <Text style={styles.noteText}>
          품질 점수 = 길이 정규화 40점(30자 만점) + 검증 통과율 30점 + 분석형 비율 30점.
          검증 기준은 현행 reasonValidator(10자+)를 과거 데이터에 소급 적용한 값.
        </Text>

        {/* 복사 버튼 */}
        <TouchableOpacity onPress={copyToClipboard} style={styles.copyBtn} activeOpacity={0.85}>
          <ClipboardList size={16} color="#fff" />
          <Text style={styles.copyBtnText}>사업계획서용 복사</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
