/**
 * 관리자 — CSV 데이터 내보내기 화면
 * 사용자/거래/학교/종목/학습효과 5종 CSV → 공유 시트 (Excel/PPT 자료용)
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminDashboardScreen과 동일)
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// SDK 54: expo-file-system v19는 새 File API가 기본 — documentDirectory/writeAsStringAsync는 legacy 엔트리
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { ChevronLeft, Download } from 'lucide-react-native';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import { fetchAllUsersForAdmin } from '../../lib/adminService';
// 기존 화면의 export 함수 재사용 (해당 화면 무변경)
import { groupBySchool } from './AdminSchoolStatsScreen';
import { computeTopStocks } from './AdminTopStocksScreen';
import { computeLearningImpact } from './AdminLearningImpactScreen';

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

// ── CSV 유틸 ──────────────────────────────────
function escapeCSV(val: any): string {
  const s = String(val ?? '');
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function arrayToCSV(headers: string[], rows: any[][]): string {
  const headerLine = headers.map(escapeCSV).join(',');
  const rowLines = rows.map(row => row.map(escapeCSV).join(','));
  return [headerLine, ...rowLines].join('\n');
}

// ── 5종 CSV 생성 ──────────────────────────────

// 1. 사용자 목록
export function generateUsersCSV(users: any[]): string {
  const headers = [
    'uid', '이름', '닉네임', '학교명', '학교유형', '학년/기수', '반',
    '가입일', '마지막 로그인', '총자산', '잔액', '거래 수', '학습 완료 수',
  ];
  const rows = users
    .filter(u => u.role !== 'admin')
    .map(u => [
      u.uid ?? u.id ?? '',
      u.name ?? '',
      u.nickname ?? '',
      u.school?.name ?? '',
      u.school?.type ?? (u.school?.cohort ? 'alternative' : ''),
      u.school?.cohort ?? u.school?.grade ?? '',
      u.school?.classNum ?? '',
      u.createdAt ? new Date(toMs(u.createdAt)).toISOString() : '',
      u.lastLoginAt ? new Date(toMs(u.lastLoginAt)).toISOString() : '',
      u.totalAsset ?? 0,
      u.balance ?? 0,
      (u.transactions ?? []).length,
      // 서브컬렉션 기반 lessonCount 우선 (임베디드 learning은 갱신 안 되는 필드)
      u.lessonCount ?? (u.learning?.completedLessons ?? []).length,
    ]);
  return arrayToCSV(headers, rows);
}

// 2. 거래 내역
export function generateTransactionsCSV(users: any[]): string {
  const headers = [
    'uid', '사용자명', 'ticker', '종목명', '거래유형', '수량', '가격',
    '거래대금', '이유', '거래일',
  ];
  const rows: any[][] = [];
  for (const u of users) {
    if (u.role === 'admin') continue;
    const txs: any[] = u.transactions ?? [];
    for (const tx of txs) {
      const qty = tx.quantity ?? tx.qty ?? 0;
      rows.push([
        u.uid ?? u.id ?? '',
        u.nickname ?? u.name ?? '',
        tx.ticker ?? '',
        tx.stockName ?? tx.name ?? '',
        tx.type ?? '',
        qty,
        tx.price ?? 0,
        qty * (tx.price ?? 0),
        tx.reason ?? '',
        tx.createdAt ? new Date(toMs(tx.createdAt)).toISOString() : '',
      ]);
    }
  }
  return arrayToCSV(headers, rows);
}

// 3. 학교별 집계 (AdminSchoolStatsScreen.groupBySchool 재사용)
export function generateSchoolStatsCSV(users: any[]): string {
  const groups = groupBySchool(users);
  const headers = [
    '학교명', '학교유형', '기수/학년', 'classId', '가입자수',
    '평균자산', '평균거래수', '평균학습완료', '주간활성', '활성률(%)',
  ];
  const rows = groups.map(g => [
    g.schoolName,
    g.typeLabel,
    g.cohortOrGrade,
    g.classId,
    g.userCount,
    g.avgTotalAsset,
    g.avgTradesCount,
    g.avgLessonsCompleted,
    g.activeWeekly,
    g.activeRate,
  ]);
  return arrayToCSV(headers, rows);
}

// 4. 종목별 집계 (AdminTopStocksScreen.computeTopStocks 재사용)
export function generateTopStocksCSV(users: any[]): string {
  const stocks = computeTopStocks(users).sort((a, b) => b.totalTrades - a.totalTrades);
  const headers = [
    'ticker', '종목명', '시장', '총거래수', '매수', '매도', '거래대금(KRW)', '거래자수',
  ];
  const MARKET_LABELS: Record<string, string> = {
    KR: '국내', US: '미국', CRYPTO: '코인', unknown: '기타',
  };
  const rows = stocks.map(s => [
    s.ticker,
    s.name,
    MARKET_LABELS[s.market] ?? s.market,
    s.totalTrades,
    s.totalBuys,
    s.totalSells,
    Math.round(s.totalVolumeKRW),
    s.uniqueTraders,
  ]);
  return arrayToCSV(headers, rows);
}

// 5. 학습 효과 분석 (AdminLearningImpactScreen.computeLearningImpact 재사용)
export function generateLearningImpactCSV(users: any[]): string {
  const impact = computeLearningImpact(users);
  const headers = [
    '그룹', '학습량', '인원', '평균총자산', '평균수익률(%)',
    '평균거래수', '이유작성률(%)', '수익달성률(%)',
  ];
  const rows = (['noLesson', 'lowLesson', 'midLesson', 'highLesson'] as const).map(key => {
    const g = impact[key];
    return [
      g.label,
      g.range,
      g.userCount,
      g.avgTotalAsset,
      g.avgReturnRate.toFixed(2),
      g.avgTradesCount,
      g.avgReasonRate.toFixed(1),
      g.positiveReturnRate.toFixed(1),
    ];
  });
  return arrayToCSV(headers, rows);
}

export default function AdminExportScreen() {
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
  const [exporting, setExporting] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const all = await fetchAllUsersForAdmin();
      const nonAdmin = all.filter((u: any) => u.role !== 'admin');
      // 학습 완료 수는 서브컬렉션이 실데이터 — 사용자/학습효과 CSV 공용으로 미리 로드
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

  // ── 파일 저장 + 공유 시트 ──
  const exportCSV = async (filename: string, content: string) => {
    try {
      const uri = `${FileSystem.documentDirectory}${filename}`;
      // BOM 추가 (Excel 한글 깨짐 방지)
      const BOM = '\uFEFF';
      await FileSystem.writeAsStringAsync(uri, BOM + content, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: 'text/csv',
          dialogTitle: filename,
        });
      } else {
        Alert.alert('공유 불가', '이 기기에서 공유 기능을 사용할 수 없어요.');
      }
    } catch (e) {
      console.error('CSV export failed:', e);
      Alert.alert('내보내기 실패', String(e));
    }
  };

  const today = new Date();
  const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;

  const EXPORT_ITEMS = [
    {
      label: '사용자 목록',
      desc: '모든 사용자 정보 (학교, 자산, 거래수, 학습수)',
      filename: `floco_users_${dateStr}.csv`,
      generate: () => generateUsersCSV(users),
    },
    {
      label: '거래 내역',
      desc: '모든 거래 (종목, 수량, 이유 포함)',
      filename: `floco_transactions_${dateStr}.csv`,
      generate: () => generateTransactionsCSV(users),
    },
    {
      label: '학교별 통계',
      desc: '학교/반별 집계 (가입자, 평균 자산, 활성률)',
      filename: `floco_schools_${dateStr}.csv`,
      generate: () => generateSchoolStatsCSV(users),
    },
    {
      label: '종목별 통계',
      desc: '종목별 거래수, 거래대금, 거래자수',
      filename: `floco_stocks_${dateStr}.csv`,
      generate: () => generateTopStocksCSV(users),
    },
    {
      label: '학습 효과',
      desc: '4그룹 비교 (미학습/입문/활발/몰입)',
      filename: `floco_learning_impact_${dateStr}.csv`,
      generate: () => generateLearningImpactCSV(users),
    },
  ];

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
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 12,
      paddingHorizontal: 4,
    },
    sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
    infoCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    infoText: { fontSize: 13, color: DS.textSub, lineHeight: 20 },
    exportCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: DS.cardBg,
      borderRadius: 14,
      padding: 16,
      marginBottom: 10,
    },
    exportLabel: { fontSize: 15, fontWeight: '700', color: DS.text },
    exportDesc: { fontSize: 12, color: DS.textSub, marginTop: 3, lineHeight: 17 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    metaText: { fontSize: 11, color: DS.textMuted, paddingHorizontal: 4, marginTop: 4 },
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={{ marginTop: 12, color: DS.textSub }}>데이터 불러오는 중...</Text>
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
        <Text style={styles.headerTitle}>CSV 내보내기</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DS.primary} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Download size={18} color={DS.text} strokeWidth={2} />
          <Text style={styles.sectionTitle}>데이터 내보내기</Text>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            Excel에서 열 수 있는 CSV 파일로 내보내요.{'\n'}
            파일은 공유 시트에서 메일/드라이브/메시지로 보낼 수 있어요.
          </Text>
        </View>

        {EXPORT_ITEMS.map(item => (
          <TouchableOpacity
            key={item.filename}
            style={styles.exportCard}
            activeOpacity={0.75}
            disabled={exporting !== null}
            onPress={async () => {
              setExporting(item.filename);
              try {
                await exportCSV(item.filename, item.generate());
              } finally {
                setExporting(null);
              }
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.exportLabel}>{item.label}</Text>
              <Text style={styles.exportDesc}>{item.desc}</Text>
            </View>
            {exporting === item.filename ? (
              <ActivityIndicator size="small" color={DS.primary} />
            ) : (
              <Download size={20} color={DS.primary} />
            )}
          </TouchableOpacity>
        ))}

        <Text style={styles.metaText}>
          기준: {users.length}명 · {today.toLocaleDateString('ko-KR')} · 한글 호환 BOM 포함
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
