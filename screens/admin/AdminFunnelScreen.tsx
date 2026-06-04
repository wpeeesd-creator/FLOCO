/**
 * 관리자 — 가입→첫거래 퍼널 화면
 * 가입 후 시간대별 첫 거래 전환율 측정 (사업계획서용 복사 기능 포함)
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
  Filter,
  TrendingUp,
  Clock,
  ClipboardList,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
import { type SchoolType, SCHOOL_TYPE_LABELS, getSchoolDisplayType } from '../../lib/school';

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

type FilterType = 'all' | SchoolType;

interface FunnelData {
  total: number;
  firstTradeEver: number;
  neverTraded: number;
  firstTradeWithin1Day: number;
  firstTradeWithin1Week: number;
  firstTradeWithin1Month: number;
  medianHours: number;
  avgHours: number;
  conversionRate: number;
  conversionRate1Day: number;
  conversionRate1Week: number;
  conversionRate1Month: number;
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

// ── 퍼널 집계 ─────────────────────────────────
export function computeFunnel(users: any[]): FunnelData {
  const total = users.length;
  let firstTradeWithin1Day = 0;
  let firstTradeWithin1Week = 0;
  let firstTradeWithin1Month = 0;
  let firstTradeEver = 0;
  let neverTraded = 0;

  const conversionTimes: number[] = []; // 가입→첫거래 시간 (시간 단위)

  for (const user of users) {
    const createdAt = toMs(user.createdAt);
    const txs: any[] = user.transactions ?? [];

    if (txs.length === 0) {
      neverTraded += 1;
      continue;
    }

    firstTradeEver += 1;
    if (!createdAt) continue; // 가입시각 없으면 전환 시간 계산 불가

    // 첫 거래 = 거래 중 가장 이른 시각 (arrayUnion 순서가 깨진 경우 방어)
    let firstTxTime = 0;
    for (const t of txs) {
      const ts = toMs(t.createdAt) || toMs(t.timestamp);
      if (ts && (firstTxTime === 0 || ts < firstTxTime)) firstTxTime = ts;
    }
    if (!firstTxTime) continue;

    // 리셋 등으로 거래가 가입보다 빠르게 기록된 경우 0으로 클램프
    const diffMs = Math.max(0, firstTxTime - createdAt);
    const diffHours = diffMs / HOUR_MS;
    const diffDays = diffMs / DAY_MS;

    conversionTimes.push(diffHours);

    if (diffDays <= 1) firstTradeWithin1Day += 1;
    if (diffDays <= 7) firstTradeWithin1Week += 1;
    if (diffDays <= 30) firstTradeWithin1Month += 1;
  }

  conversionTimes.sort((a, b) => a - b);
  const medianHours = conversionTimes.length > 0
    ? conversionTimes[Math.floor(conversionTimes.length / 2)]
    : 0;
  const avgHours = conversionTimes.length > 0
    ? conversionTimes.reduce((s, t) => s + t, 0) / conversionTimes.length
    : 0;

  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return {
    total,
    firstTradeEver,
    neverTraded,
    firstTradeWithin1Day,
    firstTradeWithin1Week,
    firstTradeWithin1Month,
    medianHours,
    avgHours,
    conversionRate: pct(firstTradeEver),
    conversionRate1Day: pct(firstTradeWithin1Day),
    conversionRate1Week: pct(firstTradeWithin1Week),
    conversionRate1Month: pct(firstTradeWithin1Month),
  };
}

const FILTER_OPTIONS: { key: FilterType; label: string }[] = [
  { key: 'all', label: '전체' },
  { key: 'alternative', label: SCHOOL_TYPE_LABELS.alternative },
  { key: 'middle', label: SCHOOL_TYPE_LABELS.middle },
  { key: 'high', label: SCHOOL_TYPE_LABELS.high },
];

export default function AdminFunnelScreen() {
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
  const [filterType, setFilterType] = useState<FilterType>('all');

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

  // ── 학교 유형 필터 ──
  const filteredUsers = useMemo(() => {
    if (filterType === 'all') return users;
    // 학교 미설정 유저는 type 필터에서 제외 (fallback이 alternative로 오인 분류되는 것 방어)
    return users.filter(u => u.school?.classId && getSchoolDisplayType(u.school) === filterType);
  }, [users, filterType]);

  const data = useMemo(() => computeFunnel(filteredUsers), [filteredUsers]);

  // ── 사업계획서용 복사 ──
  const copyToClipboard = () => {
    const filterLabel = filterType === 'all' ? '전체' : SCHOOL_TYPE_LABELS[filterType];
    const copyText = `[FLOCO 사용자 전환 퍼널 — ${filterLabel}]
총 가입자: ${data.total}명
첫 거래 완료: ${data.firstTradeEver}명 (${data.conversionRate.toFixed(1)}%)
미거래: ${data.neverTraded}명

[전환 속도]
1일 내 첫 거래: ${data.firstTradeWithin1Day}명 (${data.conversionRate1Day.toFixed(1)}%)
1주 내 첫 거래: ${data.firstTradeWithin1Week}명 (${data.conversionRate1Week.toFixed(1)}%)
1개월 내 첫 거래: ${data.firstTradeWithin1Month}명 (${data.conversionRate1Month.toFixed(1)}%)

평균 전환 시간: ${Math.round(data.avgHours)}시간
중간값 전환 시간: ${Math.round(data.medianHours)}시간

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
    // 필터 칩 (토스 스타일 — AdminUserTradesScreen과 동일)
    filterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
    },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: DS.border,
      backgroundColor: DS.cardBg,
    },
    chipActive: { backgroundColor: DS.text, borderColor: DS.text },
    chipText: { fontSize: 13, color: DS.textSub, fontWeight: '500' },
    chipTextActive: { color: '#fff', fontWeight: '700' },
    // BigKPI (핵심 전환율)
    bigCard: {
      backgroundColor: DS.cardBg,
      padding: 20,
      borderRadius: 16,
      marginBottom: 12,
    },
    bigLabel: { fontSize: 13, color: DS.textSub, fontWeight: '500', marginBottom: 8 },
    bigNumber: { fontSize: 36, fontWeight: '700', color: DS.text, lineHeight: 42 },
    bigSub: { fontSize: 12, color: DS.textMuted, fontWeight: '500', marginTop: 6 },
    // 카드 공통
    card: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 20,
      marginBottom: 12,
      gap: 12,
    },
    cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    cardTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    // 퍼널 막대
    funnelStep: { marginBottom: 4 },
    funnelLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    funnelLabel: { fontSize: 13, fontWeight: '600', color: DS.text },
    funnelValue: { fontSize: 13, fontWeight: '700', color: DS.textSub },
    funnelTrack: {
      height: 24,
      backgroundColor: DS.border,
      borderRadius: 12,
      overflow: 'hidden',
    },
    funnelFill: { height: '100%', borderRadius: 12, minWidth: 4 },
    // 통계 행
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: DS.border,
    },
    statLabel: { fontSize: 14, color: DS.textSub },
    statValue: { fontSize: 15, fontWeight: '700', color: DS.text },
    // 복사 버튼 (풀폭 primary)
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

  const FunnelStep = ({ label, count, percent, color }: {
    label: string;
    count: number;
    percent: number;
    color: string;
  }) => (
    <View style={styles.funnelStep}>
      <View style={styles.funnelLabelRow}>
        <Text style={styles.funnelLabel}>{label}</Text>
        <Text style={styles.funnelValue}>{count}명 ({percent.toFixed(1)}%)</Text>
      </View>
      <View style={styles.funnelTrack}>
        <View style={[styles.funnelFill, { width: `${Math.min(100, percent)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );

  const StatRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.statRow}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>퍼널 데이터 불러오는 중...</Text>
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
        <Text style={styles.headerTitle}>가입 전환 퍼널</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* 학교 유형 필터 */}
        <View style={styles.filterRow}>
          <Filter size={15} color={DS.textMuted} strokeWidth={2} />
          {FILTER_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              onPress={() => setFilterType(opt.key)}
              style={[styles.chip, filterType === opt.key && styles.chipActive]}
            >
              <Text style={[styles.chipText, filterType === opt.key && styles.chipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {data.total === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>
              {filterType === 'all' ? '사용자가 없어요' : `${SCHOOL_TYPE_LABELS[filterType]} 사용자가 없어요`}
            </Text>
          </View>
        ) : (
          <>
            {/* 핵심 전환율 — BigKPI */}
            <View style={styles.bigCard}>
              <Text style={styles.bigLabel}>가입 → 첫 거래 전환율</Text>
              <Text style={styles.bigNumber}>{data.conversionRate.toFixed(1)}%</Text>
              <Text style={styles.bigSub}>
                {data.firstTradeEver}명 / 총 {data.total}명 · 미거래 {data.neverTraded}명
              </Text>
            </View>

            {/* 퍼널 카드 */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <TrendingUp size={18} color={DS.text} strokeWidth={2} />
                <Text style={styles.cardTitle}>가입 → 첫 거래 퍼널</Text>
              </View>
              <FunnelStep
                label="총 가입자"
                count={data.total}
                percent={100}
                color={DS.primary}
              />
              <FunnelStep
                label="첫 거래 완료"
                count={data.firstTradeEver}
                percent={data.conversionRate}
                color={DS.positive}
              />
              <FunnelStep
                label="1일 내 첫 거래"
                count={data.firstTradeWithin1Day}
                percent={data.conversionRate1Day}
                color={DS.primary}
              />
              <FunnelStep
                label="1주 내 첫 거래"
                count={data.firstTradeWithin1Week}
                percent={data.conversionRate1Week}
                color={DS.primary}
              />
            </View>

            {/* 전환 시간 통계 카드 */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Clock size={18} color={DS.text} strokeWidth={2} />
                <Text style={styles.cardTitle}>전환 시간 분포</Text>
              </View>
              <View>
                <StatRow label="평균 전환 시간" value={`${Math.round(data.avgHours)}시간`} />
                <StatRow label="중간값 전환 시간" value={`${Math.round(data.medianHours)}시간`} />
                <StatRow
                  label="1개월 내 첫 거래"
                  value={`${data.firstTradeWithin1Month}명 (${data.conversionRate1Month.toFixed(1)}%)`}
                />
                <StatRow
                  label="미거래 사용자"
                  value={`${data.neverTraded}명 (${data.total > 0 ? Math.round((data.neverTraded / data.total) * 100) : 0}%)`}
                />
              </View>
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
