/**
 * 관리자 — 청소년 위험 행동 모니터링 화면
 * 잦은 매매/큰 손실/학습 없이 거래/과다 거래 사용자 식별 (표시 전용, 자동 조치 없음)
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
  AlertTriangle,
  Users,
  Activity,
  TrendingDown,
  BookOpen,
  Repeat,
  ClipboardList,
} from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import { formatSchoolLabel } from '../../lib/school';

const INITIAL_BALANCE = 10_000_000;
const DAY_MS = 24 * 60 * 60 * 1000;

// 위험 플래그 4종 — 계산·표시 모두 이 4종 기준
export type RiskFlag =
  | 'frequent_trading'  // 잦은 매매 (7일 10회+)
  | 'heavy_loss'        // 큰 손실 (수익률 -20% 이하)
  | 'no_learning'       // 학습 0 + 거래 5회+
  | 'overtrading';      // 거래 50회+ + 수익률 음수

export interface RiskUser {
  uid: string;
  name: string;
  school: string;
  totalAsset: number;
  returnRate: number;
  tradesCount: number;
  tradesLast7Days: number;
  lessonsCount: number;
  riskFlags: RiskFlag[];
  riskScore: number; // 0~100
}

export interface RiskMonitorData {
  riskUsers: RiskUser[];
  totalRiskUsers: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  flagCounts: Record<RiskFlag, number>;
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

// ── 위험 지표 계산 ─────────────────────────────
export function computeRiskMonitor(
  users: any[],
  lessonCounts: Record<string, number>,
): RiskMonitorData {
  const now = Date.now();
  const sevenDaysAgo = now - 7 * DAY_MS;

  const riskUsers: RiskUser[] = [];

  for (const user of users) {
    if (user.role === 'admin') continue;
    const uid: string = user.uid ?? user.id ?? '';

    const txs: any[] = user.transactions ?? [];
    const initialBalance = Number(user.initialBalance ?? INITIAL_BALANCE) || INITIAL_BALANCE;
    const totalAsset = Number(user.totalAsset ?? initialBalance);
    const returnRate = ((totalAsset - initialBalance) / initialBalance) * 100;
    const lessonsCount = lessonCounts[uid] ?? 0;

    const tradesLast7Days = txs.filter(tx => {
      const ms = toMs(tx.createdAt);
      return ms && ms >= sevenDaysAgo;
    }).length;

    const flags: RiskFlag[] = [];
    let score = 0;

    // 1. 잦은 매매 (7일 10회+)
    if (tradesLast7Days >= 10) {
      flags.push('frequent_trading');
      score += 25;
    }

    // 2. 큰 손실 (-20% 이하)
    if (returnRate <= -20) {
      flags.push('heavy_loss');
      score += 30;
    }

    // 3. 학습 없이 거래 (학습 0 + 거래 5회+)
    if (lessonsCount === 0 && txs.length >= 5) {
      flags.push('no_learning');
      score += 20;
    }

    // 4. 과도한 거래 + 손실
    if (txs.length >= 50 && returnRate < 0) {
      flags.push('overtrading');
      score += 25;
    }

    if (score > 0) {
      riskUsers.push({
        uid,
        name: user.nickname ?? user.name ?? '익명',
        school: user.school ? formatSchoolLabel(user.school) : '학교 미설정',
        totalAsset,
        returnRate,
        tradesCount: txs.length,
        tradesLast7Days,
        lessonsCount,
        riskFlags: flags,
        riskScore: Math.min(score, 100),
      });
    }
  }

  riskUsers.sort((a, b) => b.riskScore - a.riskScore);

  const flagCounts: Record<RiskFlag, number> = {
    frequent_trading: riskUsers.filter(u => u.riskFlags.includes('frequent_trading')).length,
    heavy_loss: riskUsers.filter(u => u.riskFlags.includes('heavy_loss')).length,
    no_learning: riskUsers.filter(u => u.riskFlags.includes('no_learning')).length,
    overtrading: riskUsers.filter(u => u.riskFlags.includes('overtrading')).length,
  };

  return {
    riskUsers,
    totalRiskUsers: riskUsers.length,
    highRisk: riskUsers.filter(u => u.riskScore >= 50).length,
    mediumRisk: riskUsers.filter(u => u.riskScore >= 25 && u.riskScore < 50).length,
    lowRisk: riskUsers.filter(u => u.riskScore < 25).length,
    flagCounts,
  };
}

// ── 학습 카운트 fetch (서브컬렉션 우선 + 임베디드 fallback) ──
export async function fetchLessonCounts(users: any[]): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  await Promise.all(
    users.map(async (u: any) => {
      const uid: string = u.uid ?? u.id ?? '';
      if (!uid) return;
      try {
        const snap = await getDoc(doc(db, 'users', uid, 'learning', 'data'));
        if (snap.exists()) {
          const sub = snap.data()?.completedLessons;
          counts[uid] = Array.isArray(sub) ? sub.length : 0;
        } else {
          counts[uid] = (u.learning?.completedLessons ?? []).length;
        }
      } catch {
        counts[uid] = (u.learning?.completedLessons ?? []).length;
      }
    }),
  );

  return counts;
}

export default function AdminRiskMonitorScreen() {
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

  // 위험 플래그 라벨/색상/아이콘
  const FLAG_INFO: Record<RiskFlag, { label: string; color: string; icon: any }> = {
    frequent_trading: { label: '잦은 매매', color: '#F97316', icon: Activity },
    heavy_loss: { label: '큰 손실', color: '#EF4444', icon: TrendingDown },
    no_learning: { label: '학습 없이 거래', color: '#F59E0B', icon: BookOpen },
    overtrading: { label: '과다 거래', color: '#EF4444', icon: Repeat },
  };

  const [users, setUsers] = useState<any[]>([]);
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const all = await fetchAllUsersForAdmin();
      const nonAdmin = all.filter((u: any) => u.role !== 'admin');
      const counts = await fetchLessonCounts(nonAdmin);
      setUsers(nonAdmin);
      setLessonCounts(counts);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const data = useMemo(() => computeRiskMonitor(users, lessonCounts), [users, lessonCounts]);
  const totalUsers = users.length;
  const riskRate = totalUsers > 0 ? (data.totalRiskUsers / totalUsers) * 100 : 0;

  const getRiskBadgeStyle = (score: number) => {
    if (score >= 50) return { backgroundColor: '#FEE2E2' }; // 고위험
    if (score >= 25) return { backgroundColor: '#FED7AA' }; // 중위험
    return { backgroundColor: '#FEF3C7' };                  // 저위험
  };
  const getRiskTextColor = (score: number) => {
    if (score >= 50) return '#DC2626';
    if (score >= 25) return '#EA580C';
    return '#B45309';
  };

  // ── 사업계획서용 복사 ──
  const copyToClipboard = () => {
    const copyText = `[FLOCO 청소년 위험 행동 모니터링]

위험 감지 사용자: ${data.totalRiskUsers}명 (전체 ${totalUsers}명 중 ${riskRate.toFixed(1)}%)

위험 등급:
- 고위험 (50+): ${data.highRisk}명
- 중위험 (25-49): ${data.mediumRisk}명
- 저위험 (1-24): ${data.lowRisk}명

위험 유형 분포:
- 잦은 매매 (7일 10회+): ${data.flagCounts.frequent_trading}명
- 큰 손실 (-20% 이하): ${data.flagCounts.heavy_loss}명
- 학습 없이 거래: ${data.flagCounts.no_learning}명
- 과다 거래 + 손실: ${data.flagCounts.overtrading}명

[모니터링 기준]
모의투자 앱 운영 책임의 일환으로 청소년 사용자 행동을 다음 지표로 추적:
1. 잦은 매매: 단타 행동 (7일 10회 초과)
2. 큰 손실: -20% 이상 자산 손실
3. 학습 없이 거래: 교육 콘텐츠 미이용 + 거래만 5회 이상
4. 과다 거래 + 손실: 50회 이상 거래 + 음수 수익률

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
    kpiGrid: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    smallCard: {
      backgroundColor: DS.cardBg,
      padding: 14,
      borderRadius: 12,
      flex: 1,
    },
    smallLabel: { fontSize: 11, color: DS.textSub, fontWeight: '500', marginBottom: 4 },
    smallNumber: { fontSize: 20, fontWeight: '700', color: DS.text },
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
    // 위험 유형 분포
    flagCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    flagRowHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
    flagLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    flagLabel: { fontSize: 13, fontWeight: '600', color: DS.text },
    flagCount: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    barBg: { height: 10, backgroundColor: DS.border, borderRadius: 5, overflow: 'hidden' },
    barFill: { height: '100%', borderRadius: 5, minWidth: 3 },
    // 사용자 카드
    userCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
      gap: 10,
    },
    userHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    userName: { fontSize: 15, fontWeight: '700', color: DS.text },
    userSchool: { fontSize: 12, color: DS.textSub, marginTop: 2 },
    riskBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
    riskBadgeText: { fontSize: 12, fontWeight: '800' },
    userStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    userStat: { fontSize: 12, color: DS.textSub },
    flagChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    flagChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    flagChipText: { fontSize: 11, fontWeight: '700' },
    // 기타
    emptyCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
    },
    emptyText: { fontSize: 14, color: DS.textSub },
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

  const SmallKPI = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.smallCard}>
      <Text style={styles.smallLabel}>{label}</Text>
      <Text style={styles.smallNumber}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>위험 행동 분석 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const maxFlagCount = Math.max(...Object.values(data.flagCounts), 1);

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
        <Text style={styles.headerTitle}>위험 행동 모니터링</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 메인 KPI */}
        <View style={styles.bigCard}>
          <Text style={styles.bigLabel}>위험 행동 감지 사용자</Text>
          <Text style={styles.bigNumber}>{data.totalRiskUsers}명</Text>
          <Text style={styles.bigSub}>
            전체 {totalUsers}명 중 {riskRate.toFixed(1)}%
          </Text>
        </View>

        {/* 위험 등급별 분포 */}
        <View style={styles.kpiGrid}>
          <SmallKPI label="고위험 (50+)" value={`${data.highRisk}명`} />
          <SmallKPI label="중위험 (25-49)" value={`${data.mediumRisk}명`} />
          <SmallKPI label="저위험 (1-24)" value={`${data.lowRisk}명`} />
        </View>

        {/* 위험 유형별 분포 */}
        <SectionHeader icon={AlertTriangle} title="위험 유형 분포" />
        <View style={styles.flagCard}>
          {(Object.keys(data.flagCounts) as RiskFlag[]).map(flag => {
            const info = FLAG_INFO[flag];
            const Icon = info.icon;
            const count = data.flagCounts[flag];
            const percent = (count / maxFlagCount) * 100;
            return (
              <View key={flag} style={{ marginBottom: 12 }}>
                <View style={styles.flagRowHead}>
                  <View style={styles.flagLabelWrap}>
                    <Icon size={14} color={info.color} />
                    <Text style={styles.flagLabel}>{info.label}</Text>
                  </View>
                  <Text style={styles.flagCount}>{count}명</Text>
                </View>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${percent}%`, backgroundColor: info.color }]} />
                </View>
              </View>
            );
          })}
        </View>

        {/* 위험 사용자 목록 */}
        <SectionHeader icon={Users} title={`위험 사용자 목록 (${data.totalRiskUsers}명)`} />

        {data.riskUsers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>위험 행동이 감지된 사용자가 없어요.</Text>
          </View>
        ) : (
          data.riskUsers.map(user => (
            <View key={user.uid} style={styles.userCard}>
              <View style={styles.userHeader}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.userName} numberOfLines={1}>{user.name}</Text>
                  <Text style={styles.userSchool} numberOfLines={1}>{user.school}</Text>
                </View>
                <View style={[styles.riskBadge, getRiskBadgeStyle(user.riskScore)]}>
                  <Text style={[styles.riskBadgeText, { color: getRiskTextColor(user.riskScore) }]}>
                    위험도 {user.riskScore}
                  </Text>
                </View>
              </View>

              <View style={styles.userStats}>
                <Text style={styles.userStat}>
                  수익률{' '}
                  <Text style={{
                    color: user.returnRate >= 0 ? DS.positive : DS.negative,
                    fontWeight: '700',
                  }}>
                    {user.returnRate >= 0 ? '+' : ''}{user.returnRate.toFixed(1)}%
                  </Text>
                </Text>
                <Text style={styles.userStat}>
                  총거래 {user.tradesCount}회 (7일 {user.tradesLast7Days}회)
                </Text>
                <Text style={styles.userStat}>학습 {user.lessonsCount}개</Text>
              </View>

              <View style={styles.flagChipRow}>
                {user.riskFlags.map(flag => {
                  const info = FLAG_INFO[flag];
                  return (
                    <View key={flag} style={[styles.flagChip, { backgroundColor: info.color + '20' }]}>
                      <Text style={[styles.flagChipText, { color: info.color }]}>{info.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}

        <Text style={styles.noteText}>
          표시 전용 모니터링 — 자동 경고·제재 없음. 수익률 기준: 유저별 initialBalance(학습 보상 포함) 대비.
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
