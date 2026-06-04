/**
 * 관리자 — 학교별 현황 화면
 * users/{uid}.school.classId 기준 groupBy 집계 (사업계획서용 복사 기능 포함)
 * 학교 유형(대안학교/중학교/고등학교)별 섹션 표시
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminDashboardScreen과 동일)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
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
import { ChevronLeft, School, ClipboardList } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import {
  type SchoolType,
  SCHOOL_TYPE_LABELS,
  getSchoolDisplayType,
  formatCohortOrGrade,
} from '../../lib/school';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type SortKey = 'users' | 'asset' | 'active';
type GroupType = SchoolType | 'unknown';

interface SchoolGroup {
  schoolName: string;
  classId: string;
  type: GroupType;
  typeLabel: string;
  cohortOrGrade: string; // "1기" 또는 "1학년 3반"
  userCount: number;
  avgTotalAsset: number;
  avgTradesCount: number;
  avgLessonsCompleted: number;
  activeWeekly: number;
  activeRate: number;
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

// ── 집계: school.classId 기준 groupBy ─────────────
export function groupBySchool(users: any[]): SchoolGroup[] {
  const groups: Record<string, Omit<SchoolGroup, 'activeRate'>> = {};

  for (const user of users) {
    if (user.role === 'admin') continue;
    const school = user.school;
    const classId: string = school?.classId ?? 'unknown';
    if (!groups[classId]) {
      // type 없는 기존 데이터는 cohort 기반 대안학교로 간주 (getSchoolDisplayType)
      const type: GroupType = school?.classId ? getSchoolDisplayType(school) : 'unknown';
      groups[classId] = {
        schoolName: school?.name ?? '학교 미설정',
        classId,
        type,
        typeLabel: type === 'unknown' ? '학교 미설정' : SCHOOL_TYPE_LABELS[type],
        cohortOrGrade: formatCohortOrGrade(school),
        userCount: 0,
        avgTotalAsset: 0,
        avgTradesCount: 0,
        avgLessonsCompleted: 0,
        activeWeekly: 0,
      };
    }

    const g = groups[classId];
    g.userCount += 1;
    g.avgTotalAsset += Number(user.totalAsset ?? user.balance ?? 0);
    g.avgTradesCount += (user.transactions?.length ?? 0);
    // ⚠️ 임베디드 learning 필드 기준 — Phase 2에서 서브컬렉션 소스로 교체 예정
    g.avgLessonsCompleted += (user.learning?.completedLessons?.length ?? 0);

    const lastLogin = toMs(user.lastLoginAt);
    if (lastLogin && Date.now() - lastLogin < WEEK_MS) {
      g.activeWeekly += 1;
    }
  }

  return Object.values(groups).map(g => ({
    ...g,
    avgTotalAsset: g.userCount > 0 ? Math.round(g.avgTotalAsset / g.userCount) : 0,
    avgTradesCount: g.userCount > 0 ? Math.round((g.avgTradesCount / g.userCount) * 10) / 10 : 0,
    avgLessonsCompleted: g.userCount > 0 ? Math.round((g.avgLessonsCompleted / g.userCount) * 10) / 10 : 0,
    activeRate: g.userCount > 0 ? Math.round((g.activeWeekly / g.userCount) * 100) : 0,
  }));
}

// 섹션 표시 순서
const SECTION_ORDER: GroupType[] = ['alternative', 'middle', 'high', 'unknown'];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'users', label: '가입자 많은순' },
  { key: 'asset', label: '평균 자산순' },
  { key: 'active', label: '활성률순' },
];

export default function AdminSchoolStatsScreen() {
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

  const [groups, setGroups] = useState<SchoolGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('users');

  const loadData = async () => {
    try {
      const users = await fetchAllUsersForAdmin();
      setGroups(groupBySchool(users));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  // ── 유형별 섹션 + 섹션 내 정렬 ──
  const sections = useMemo(() => {
    const sortFn = (a: SchoolGroup, b: SchoolGroup) => {
      if (sortKey === 'users') return b.userCount - a.userCount;
      if (sortKey === 'asset') return b.avgTotalAsset - a.avgTotalAsset;
      return b.activeRate - a.activeRate;
    };
    return SECTION_ORDER
      .map(type => ({
        type,
        title: type === 'unknown' ? '학교 미설정' : SCHOOL_TYPE_LABELS[type],
        data: groups.filter(g => g.type === type).sort(sortFn),
      }))
      .filter(s => s.data.length > 0);
  }, [groups, sortKey]);

  // ── 전체 요약 ──
  const summary = useMemo(() => {
    const real = groups.filter(g => g.type !== 'unknown');
    const countByType = (t: SchoolType) => real.filter(g => g.type === t).length;
    return {
      schoolCount: real.length,
      totalUsers: groups.reduce((sum, g) => sum + g.userCount, 0),
      alternative: countByType('alternative'),
      middle: countByType('middle'),
      high: countByType('high'),
    };
  }, [groups]);

  // ── 사업계획서용 복사 (카드별 — 의도된 차이) ──
  const copyToClipboard = (group: SchoolGroup) => {
    const title = group.cohortOrGrade
      ? `${group.schoolName} ${group.cohortOrGrade}`
      : group.schoolName;
    const text = `[${title}]
학교 유형: ${group.typeLabel}
가입자: ${group.userCount}명
평균 자산: ${group.avgTotalAsset.toLocaleString()}원
평균 거래: ${group.avgTradesCount}회
평균 학습 완료: ${group.avgLessonsCompleted}개
주간 활성: ${group.activeWeekly}명 (${group.activeRate}%)
classId: ${group.classId}`;
    Clipboard.setString(text);
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
    listContent: { paddingHorizontal: 16, paddingBottom: 100 }, // 탭바 가림 방지
    // 요약
    summaryRow: { flexDirection: 'row', gap: 8, paddingTop: 16 },
    summaryCard: {
      flex: 1,
      backgroundColor: DS.cardBg,
      borderRadius: 12,
      padding: 14,
      alignItems: 'center',
      gap: 4,
    },
    summaryValue: { fontSize: 20, fontWeight: '800', color: DS.text },
    summaryLabel: { fontSize: 11, color: DS.textSub, fontWeight: '600', textAlign: 'center' },
    typeBreakdown: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 14,
      backgroundColor: DS.cardBg,
      borderRadius: 12,
      paddingVertical: 10,
      marginTop: 8,
    },
    typeBreakdownText: { fontSize: 12, color: DS.textSub, fontWeight: '600' },
    // 정렬 칩 (토스 스타일 — AdminUserTradesScreen과 동일)
    chipRow: { paddingVertical: 12 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: DS.border,
      backgroundColor: DS.cardBg,
      marginRight: 8,
    },
    chipActive: { backgroundColor: DS.text, borderColor: DS.text },
    chipText: { fontSize: 13, color: DS.textSub, fontWeight: '500' },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    // 섹션 헤더
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: DS.bg,
      paddingTop: 14,
      paddingBottom: 10,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    // 학교 카드
    card: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 8,
      gap: 10,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    schoolName: { fontSize: 16, fontWeight: '700', color: DS.text, flexShrink: 1 },
    typeBadge: {
      backgroundColor: DS.primary + '15',
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    typeBadgeText: { fontSize: 10, fontWeight: '700', color: DS.primary },
    classId: { fontSize: 11, color: DS.textMuted, marginTop: 2 },
    statRow: { flexDirection: 'row', gap: 8 },
    statItem: {
      flex: 1,
      backgroundColor: DS.bg,
      borderRadius: 10,
      padding: 10,
    },
    statLabel: { fontSize: 11, color: DS.textSub, fontWeight: '600' },
    statValue: { fontSize: 15, fontWeight: '700', color: DS.text, marginTop: 2 },
    copyBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: DS.primary + '15',
      borderRadius: 10,
      paddingVertical: 10,
    },
    copyBtnText: { fontSize: 13, fontWeight: '700', color: DS.primary },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyState: { paddingVertical: 60, alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 15, color: DS.textSub, fontWeight: '500' },
  });

  const StatItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.statItem}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>학교별 현황 불러오는 중...</Text>
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
        <Text style={styles.headerTitle}>학교별 현황</Text>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={g => g.classId}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        ListHeaderComponent={
          <>
            {/* 전체 요약 */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryValue}>{summary.schoolCount}</Text>
                <Text style={styles.summaryLabel}>전체 학교·반</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={[styles.summaryValue, { color: DS.primary }]}>
                  {summary.totalUsers.toLocaleString()}
                </Text>
                <Text style={styles.summaryLabel}>전체 가입자</Text>
              </View>
            </View>

            {/* 유형별 분포 */}
            <View style={styles.typeBreakdown}>
              <Text style={styles.typeBreakdownText}>대안학교 {summary.alternative}</Text>
              <Text style={styles.typeBreakdownText}>중학교 {summary.middle}</Text>
              <Text style={styles.typeBreakdownText}>고등학교 {summary.high}</Text>
            </View>

            {/* 정렬 칩 */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {SORT_OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt.key}
                  onPress={() => setSortKey(opt.key)}
                  style={[styles.chip, sortKey === opt.key && styles.chipActive]}
                >
                  <Text style={[styles.chipText, sortKey === opt.key && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </>
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <School size={18} color={DS.text} strokeWidth={2} />
            <Text style={styles.sectionTitle}>
              {section.title} ({section.data.length})
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <School size={36} color={DS.textMuted} strokeWidth={1.5} />
            <Text style={styles.emptyText}>학교를 설정한 사용자가 없어요</Text>
          </View>
        }
        renderItem={({ item: group }) => (
          <View style={styles.card}>
            <View>
              <View style={styles.cardTitleRow}>
                <Text style={styles.schoolName} numberOfLines={1}>
                  {group.schoolName}{group.cohortOrGrade ? ` ${group.cohortOrGrade}` : ''}
                </Text>
                {group.type !== 'unknown' && (
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{group.typeLabel}</Text>
                  </View>
                )}
              </View>
              {group.classId !== 'unknown' && (
                <Text style={styles.classId}>classId: {group.classId}</Text>
              )}
            </View>

            <View style={styles.statRow}>
              <StatItem label="가입자" value={`${group.userCount}명`} />
              <StatItem label="평균 자산" value={`${group.avgTotalAsset.toLocaleString()}원`} />
            </View>
            <View style={styles.statRow}>
              <StatItem label="평균 거래" value={`${group.avgTradesCount}회`} />
              <StatItem label="평균 학습" value={`${group.avgLessonsCompleted}개`} />
            </View>
            <StatItem
              label="주간 활성 (7일)"
              value={`${group.activeWeekly}명 (${group.activeRate}%)`}
            />

            <TouchableOpacity onPress={() => copyToClipboard(group)} style={styles.copyBtn} activeOpacity={0.8}>
              <ClipboardList size={15} color={DS.primary} />
              <Text style={styles.copyBtnText}>복사 (사업계획서용)</Text>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
