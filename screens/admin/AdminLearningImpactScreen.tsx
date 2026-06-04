/**
 * 관리자 — 학습→거래 효과 분석 화면
 * 학습량 그룹별 수익률/거래패턴 비교 — "교육이 투자 성과를 높인다" 가설 검증
 * 토스 톤 라이트 디자인 (AdminDashboardScreen DS 토큰과 동일)
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
  BookOpen,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ClipboardList,
} from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import { validateReason } from '../../utils/reasonValidator';

// 수익률 기준점 — 유저별 initialBalance(기본 1,000만원).
// 학습 보상이 initialBalance에도 가산되므로(LessonPlayerScreen), 이 기준을 쓰면
// "보상 지급으로 자산이 늘어난 효과"가 수익률에서 제거되고 순수 투자 성과만 비교됨.
const DEFAULT_INITIAL_ASSET = 10_000_000;

interface GroupStats {
  label: string;
  range: string;
  userCount: number;
  avgTotalAsset: number;
  avgReturnRate: number;
  avgTradesCount: number;
  avgReasonRate: number;
  positiveReturnRate: number;
}

interface LearningImpact {
  noLesson: GroupStats;
  lowLesson: GroupStats;
  midLesson: GroupStats;
  highLesson: GroupStats;
}

type GroupKey = keyof LearningImpact;

const GROUP_ORDER: GroupKey[] = ['noLesson', 'lowLesson', 'midLesson', 'highLesson'];

// ── 학습량 그룹별 집계 ─────────────────────────
export function computeLearningImpact(users: any[]): LearningImpact {
  const buckets: Record<GroupKey, { label: string; range: string; users: any[] }> = {
    noLesson: { label: '미학습', range: '0개', users: [] },
    lowLesson: { label: '입문', range: '1-5개', users: [] },
    midLesson: { label: '활발', range: '6-15개', users: [] },
    highLesson: { label: '몰입', range: '16개 이상', users: [] },
  };

  for (const user of users) {
    if (user.role === 'admin') continue;
    const count: number = user.lessonCount ?? user.learning?.completedLessons?.length ?? 0;
    if (count === 0) buckets.noLesson.users.push(user);
    else if (count <= 5) buckets.lowLesson.users.push(user);
    else if (count <= 15) buckets.midLesson.users.push(user);
    else buckets.highLesson.users.push(user);
  }

  const analyzeGroup = (groupUsers: any[]): Omit<GroupStats, 'label' | 'range'> => {
    if (groupUsers.length === 0) {
      return {
        userCount: 0,
        avgTotalAsset: 0,
        avgReturnRate: 0,
        avgTradesCount: 0,
        avgReasonRate: 0,
        positiveReturnRate: 0,
      };
    }

    let totalAsset = 0;
    let totalReturn = 0;
    let totalTrades = 0;
    let totalReasonWithText = 0;
    let totalReasonCount = 0;
    let positiveCount = 0;

    for (const u of groupUsers) {
      const baseline = Number(u.initialBalance ?? DEFAULT_INITIAL_ASSET) || DEFAULT_INITIAL_ASSET;
      const asset = Number(u.totalAsset ?? baseline);
      totalAsset += asset;

      const returnRate = ((asset - baseline) / baseline) * 100;
      totalReturn += returnRate;
      if (returnRate > 0) positiveCount += 1;

      const txs: any[] = u.transactions ?? [];
      totalTrades += txs.length;

      // 투자 이유 작성 비율 — reasonValidator 기준 통과한 이유만 "작성"으로 카운트
      for (const tx of txs) {
        if (tx.reason !== undefined) {
          totalReasonCount += 1;
          const reason = String(tx.reason ?? '');
          if (reason && reason !== '미입력' && validateReason(reason).valid) {
            totalReasonWithText += 1;
          }
        }
      }
    }

    const n = groupUsers.length;
    return {
      userCount: n,
      avgTotalAsset: Math.round(totalAsset / n),
      avgReturnRate: totalReturn / n,
      avgTradesCount: Math.round((totalTrades / n) * 10) / 10,
      avgReasonRate: totalReasonCount > 0 ? (totalReasonWithText / totalReasonCount) * 100 : 0,
      positiveReturnRate: (positiveCount / n) * 100,
    };
  };

  return {
    noLesson: { label: buckets.noLesson.label, range: buckets.noLesson.range, ...analyzeGroup(buckets.noLesson.users) },
    lowLesson: { label: buckets.lowLesson.label, range: buckets.lowLesson.range, ...analyzeGroup(buckets.lowLesson.users) },
    midLesson: { label: buckets.midLesson.label, range: buckets.midLesson.range, ...analyzeGroup(buckets.midLesson.users) },
    highLesson: { label: buckets.highLesson.label, range: buckets.highLesson.range, ...analyzeGroup(buckets.highLesson.users) },
  };
}

// ── 핵심 인사이트 자동 계산 ───────────────────
export function computeKeyInsight(impact: LearningImpact) {
  const highReturn = impact.highLesson.avgReturnRate;
  const noReturn = impact.noLesson.avgReturnRate;
  const diff = highReturn - noReturn;

  return {
    diff: diff.toFixed(1),
    diffPositive: diff > 0,
    summary: diff > 0
      ? `학습 16개 이상 사용자가 미학습자보다 평균 수익률 ${diff.toFixed(1)}%p 높음`
      : `학습 16개 이상 사용자가 미학습자보다 평균 수익률 ${Math.abs(diff).toFixed(1)}%p 낮음`,
  };
}

export default function AdminLearningImpactScreen() {
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
      const nonAdmin = all.filter((u: any) => u.role !== 'admin');
      // 실제 학습 데이터는 서브컬렉션(users/{uid}/learning/data)에 있음 —
      // 임베디드 learning 필드는 가입 후 갱신되지 않으므로 서브컬렉션 우선, 실패 시 임베디드 fallback
      const withLessons = await Promise.all(
        nonAdmin.map(async (u: any) => {
          try {
            const snap = await getDoc(doc(db, 'users', u.uid, 'learning', 'data'));
            const sub = snap.exists() ? snap.data()?.completedLessons : null;
            const lessonCount = Array.isArray(sub)
              ? sub.length
              : (u.learning?.completedLessons?.length ?? 0);
            return { ...u, lessonCount };
          } catch {
            return { ...u, lessonCount: u.learning?.completedLessons?.length ?? 0 };
          }
        }),
      );
      setUsers(withLessons);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const impact = useMemo(() => computeLearningImpact(users), [users]);
  const insight = useMemo(() => computeKeyInsight(impact), [impact]);

  // ── 사업계획서용 복사 ──
  const copyToClipboard = () => {
    const copyText = `[FLOCO 학습 효과 분석]

핵심 인사이트:
${insight.summary}

학습량별 비교:
- 미학습 (0개): ${impact.noLesson.userCount}명, 평균 수익률 ${impact.noLesson.avgReturnRate.toFixed(1)}%
- 입문 (1-5개): ${impact.lowLesson.userCount}명, 평균 수익률 ${impact.lowLesson.avgReturnRate.toFixed(1)}%
- 활발 (6-15개): ${impact.midLesson.userCount}명, 평균 수익률 ${impact.midLesson.avgReturnRate.toFixed(1)}%
- 몰입 (16개+): ${impact.highLesson.userCount}명, 평균 수익률 ${impact.highLesson.avgReturnRate.toFixed(1)}%

거래 활성도:
- 미학습 평균 거래: ${impact.noLesson.avgTradesCount}회
- 몰입 평균 거래: ${impact.highLesson.avgTradesCount}회

투자 이유 작성률:
- 미학습: ${impact.noLesson.avgReasonRate.toFixed(0)}%
- 몰입: ${impact.highLesson.avgReasonRate.toFixed(0)}%

수익 달성률 (수익률 0% 초과):
- 미학습: ${impact.noLesson.positiveReturnRate.toFixed(0)}%
- 몰입: ${impact.highLesson.positiveReturnRate.toFixed(0)}%

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
    // 핵심 인사이트
    insightCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginBottom: 16,
    },
    insightLabel: { fontSize: 13, color: DS.textSub, marginBottom: 8, fontWeight: '500' },
    insightSummary: { fontSize: 22, fontWeight: '700', color: DS.text, lineHeight: 30 },
    insightDiffRow: { flexDirection: 'row', gap: 6, marginTop: 8, alignItems: 'center' },
    insightDiffText: { fontSize: 14, fontWeight: '700' },
    // 섹션 헤더
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 8,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    // 테이블
    tableCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    tableHeader: {
      flexDirection: 'row',
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    tableHeaderText: { fontSize: 11, color: DS.textMuted, fontWeight: '600', flex: 1, textAlign: 'center' },
    tableRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    col: { fontSize: 12, color: DS.text, flex: 1, textAlign: 'center' },
    groupLabel: { fontSize: 13, fontWeight: '600', color: DS.text },
    groupRange: { fontSize: 11, color: DS.textSub, marginTop: 1 },
    // 차트 카드
    chartCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    chartRowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    chartRowLabel: { fontSize: 13, fontWeight: '600', color: DS.text },
    chartRowValue: { fontSize: 13, fontWeight: '700' },
    chartTrack: { height: 16, backgroundColor: DS.border, borderRadius: 8, overflow: 'hidden' },
    chartFill: { height: '100%', borderRadius: 8, minWidth: 3 },
    chartMeta: { fontSize: 11, color: DS.textMuted, marginTop: 3 },
    // 복사 버튼
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
    noteText: { fontSize: 11, color: DS.textMuted, lineHeight: 16, marginBottom: 16, paddingHorizontal: 4 },
  });

  const SectionHeader = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <View style={styles.sectionHeader}>
      <Icon size={18} color={DS.text} strokeWidth={2} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>학습 효과 분석 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxAbsReturn = Math.max(
    ...GROUP_ORDER.map(k => Math.abs(impact[k].avgReturnRate)),
    1,
  );

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
        <Text style={styles.headerTitle}>학습 효과 분석</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 핵심 인사이트 */}
        <View style={styles.insightCard}>
          <Text style={styles.insightLabel}>FLOCO 핵심 인사이트</Text>
          <Text style={styles.insightSummary}>{insight.summary}</Text>
          <View style={styles.insightDiffRow}>
            {insight.diffPositive ? (
              <TrendingUp size={16} color={DS.positive} />
            ) : (
              <TrendingDown size={16} color={DS.negative} />
            )}
            <Text style={[styles.insightDiffText, { color: insight.diffPositive ? DS.positive : DS.negative }]}>
              {insight.diffPositive ? '+' : ''}{insight.diff}%p 차이
            </Text>
          </View>
        </View>

        {/* 비교 테이블 */}
        <SectionHeader icon={BookOpen} title="학습량 vs 투자 성과" />
        <View style={styles.tableCard}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 1.3, textAlign: 'left' }]}>그룹</Text>
            <Text style={styles.tableHeaderText}>인원</Text>
            <Text style={styles.tableHeaderText}>평균 수익률</Text>
            <Text style={styles.tableHeaderText}>거래 수</Text>
            <Text style={styles.tableHeaderText}>이유 작성</Text>
          </View>
          {GROUP_ORDER.map(key => {
            const data = impact[key];
            return (
              <View key={key} style={styles.tableRow}>
                <View style={{ flex: 1.3 }}>
                  <Text style={styles.groupLabel}>{data.label}</Text>
                  <Text style={styles.groupRange}>{data.range}</Text>
                </View>
                <Text style={styles.col}>{data.userCount}명</Text>
                <Text style={[styles.col, {
                  color: data.avgReturnRate >= 0 ? DS.positive : DS.negative,
                  fontWeight: '600',
                }]}>
                  {data.avgReturnRate >= 0 ? '+' : ''}{data.avgReturnRate.toFixed(1)}%
                </Text>
                <Text style={styles.col}>{data.avgTradesCount}회</Text>
                <Text style={styles.col}>{data.avgReasonRate.toFixed(0)}%</Text>
              </View>
            );
          })}
        </View>

        {/* 평균 수익률 막대 차트 */}
        <SectionHeader icon={BarChart3} title="평균 수익률 비교" />
        <View style={styles.chartCard}>
          {GROUP_ORDER.map(key => {
            const data = impact[key];
            const widthPercent = (Math.abs(data.avgReturnRate) / maxAbsReturn) * 100;
            const isPositive = data.avgReturnRate >= 0;
            return (
              <View key={key} style={{ marginBottom: 14 }}>
                <View style={styles.chartRowHead}>
                  <Text style={styles.chartRowLabel}>{data.label} ({data.range})</Text>
                  <Text style={[styles.chartRowValue, { color: isPositive ? DS.positive : DS.negative }]}>
                    {isPositive ? '+' : ''}{data.avgReturnRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.chartTrack}>
                  <View style={[styles.chartFill, {
                    width: `${widthPercent}%`,
                    backgroundColor: isPositive ? DS.positive : DS.negative,
                  }]} />
                </View>
                <Text style={styles.chartMeta}>
                  {data.userCount}명 · 수익 달성률 {data.positiveReturnRate.toFixed(0)}%
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.noteText}>
          수익률 기준: 유저별 initialBalance(학습 보상 포함) 대비 — 보상 지급 효과를 제거한 순수 투자 성과 비교.
          이유 작성률: 검증 기준(5자 이상·유의미 문자)을 통과한 거래 비율.
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
