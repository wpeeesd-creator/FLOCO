/**
 * 관리자 — 단일 사용자 거래내역 풀스크린
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import {
  type School,
  type SchoolType,
  SCHOOL_TYPE_LABELS,
  getSchoolDisplayType,
  buildClassId,
  formatSchoolLabel,
} from '../../lib/school';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import StockLogo from '../../components/StockLogo';
import { STOCKS, useAppStore } from '../../store/appStore';
import { calculateTotalAsset } from '../../utils/assetCalculator';

const BUY_BG = '#FF3B30';
const SELL_BG = '#3478F6';

interface TradeItem {
  id: string;
  ticker: string;
  type: 'buy' | 'sell';
  price: number;
  qty: number;
  timestamp: number;
  reason: string;
  krw: boolean;
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

function formatDateTime(ts: number): string {
  if (!ts) return '-';
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

export default function AdminUserDetailScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { uid, name: paramName } = (route.params ?? {}) as { uid: string; name?: string };

  const [userDoc, setUserDoc] = useState<any | null>(null);
  const [loaded, setLoaded] = useState(false);
  const { livePrices, exchangeRate, refreshPrices, refreshExchangeRate } = useAppStore();

  // ── 학교 정보 수정 폼 상태 ──
  const [editingSchool, setEditingSchool] = useState(false);
  const [formType, setFormType] = useState<SchoolType>('alternative');
  const [formName, setFormName] = useState('');
  const [formCohort, setFormCohort] = useState('');
  const [formGrade, setFormGrade] = useState<number | null>(null);
  const [formClassNum, setFormClassNum] = useState<number | null>(null);
  const [savingSchool, setSavingSchool] = useState(false);

  const openSchoolEditor = () => {
    const school = userDoc?.school;
    setFormType(school ? getSchoolDisplayType(school) : 'alternative');
    setFormName(school?.name ?? '');
    setFormCohort(school?.cohort ?? '');
    setFormGrade(typeof school?.grade === 'number' ? school.grade : null);
    setFormClassNum(typeof school?.classNum === 'number' ? school.classNum : null);
    setEditingSchool(true);
  };

  const handleAdminSchoolUpdate = async () => {
    if (!uid) return;
    const trimmedName = formName.trim();
    if (!trimmedName) {
      Alert.alert('알림', '학교명을 입력해주세요');
      return;
    }
    const newSchool: School = { name: trimmedName, type: formType, classId: '' };
    if (formType === 'alternative') {
      if (!formCohort) {
        Alert.alert('알림', '기수를 선택해주세요');
        return;
      }
      newSchool.cohort = formCohort;
      newSchool.classId = buildClassId(trimmedName, formType, { cohort: formCohort });
    } else {
      if (!formGrade || !formClassNum) {
        Alert.alert('알림', '학년과 반을 입력해주세요');
        return;
      }
      newSchool.grade = formGrade;
      newSchool.classNum = formClassNum;
      newSchool.classId = buildClassId(trimmedName, formType, { grade: formGrade, classNum: formClassNum });
    }
    setSavingSchool(true);
    try {
      await updateDoc(doc(db, 'users', uid), { school: newSchool });
      setEditingSchool(false);
      Alert.alert('완료', '학교 정보가 수정됐어요.');
    } catch {
      Alert.alert('오류', '학교 정보 수정에 실패했어요.');
    } finally {
      setSavingSchool(false);
    }
  };

  useEffect(() => {
    if (!uid) {
      setLoaded(true);
      return;
    }
    const unsub = onSnapshot(
      doc(db, 'users', uid),
      (snap) => {
        setUserDoc(snap.exists() ? { uid: snap.id, ...(snap.data() as any) } : null);
        setLoaded(true);
      },
      (err) => {
        console.error('AdminUserDetail 구독 오류:', err);
        setLoaded(true);
      },
    );
    return () => unsub();
  }, [uid]);

  // ── 시세 / 환율 (store) — 진입 시 1회만 fetch (관리자 화면이라 폴링 불필요) ──
  useEffect(() => {
    refreshExchangeRate();
    const portfolio = (userDoc?.portfolio ?? []) as Array<any>;
    const tickers = portfolio.map((p: any) => p?.ticker).filter(Boolean);
    if (tickers.length > 0) refreshPrices(tickers);
  }, [userDoc?.portfolio, refreshPrices, refreshExchangeRate]);

  const displayName = userDoc?.nickname ?? userDoc?.name ?? userDoc?.displayName ?? paramName ?? '익명';

  const trades = useMemo<TradeItem[]>(() => {
    if (!userDoc) return [];
    const txs: any[] = userDoc.transactions ?? [];
    return txs
      .map((t: any, idx: number) => {
        const ts = toMs(t.createdAt);
        const stockMeta = STOCKS.find(s => s.ticker === t.ticker);
        return {
          id: `${uid}-${ts}-${idx}`,
          ticker: t.ticker,
          type: (t.type === 'sell' ? 'sell' : 'buy') as 'buy' | 'sell',
          price: Number(t.price ?? 0),
          qty: Number(t.quantity ?? t.qty ?? 0),
          timestamp: ts,
          reason: t.reason ?? '',
          krw: stockMeta?.krw ?? true,
        };
      })
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [userDoc, uid]);

  const summary = useMemo(() => {
    const buyCount = trades.filter(t => t.type === 'buy').length;
    const sellCount = trades.filter(t => t.type === 'sell').length;

    const balance = Number(userDoc?.balance ?? 10_000_000);
    const portfolio = (userDoc?.portfolio ?? []) as Array<any>;
    // store.livePrices(PriceData) → calculateTotalAsset가 요구하는 number map으로 평탄화
    const livePriceMap: Record<string, number> = {};
    for (const [k, v] of Object.entries(livePrices)) {
      if (typeof v?.price === 'number') livePriceMap[k] = v.price;
    }
    const { totalAsset } = calculateTotalAsset({
      balance,
      portfolio,
      livePrices: livePriceMap,
      exchangeRate,
    });

    return {
      total: trades.length,
      buyCount,
      sellCount,
      totalAsset,
    };
  }, [trades, userDoc, livePrices, exchangeRate]);

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 12,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backBtn: { padding: 8 },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: theme.text,
      flex: 1,
      textAlign: 'center',
      marginRight: 40,
    },
    listContent: { padding: 16, paddingBottom: 40, gap: 12 },
    summaryCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 18,
      gap: 8,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    sumName: { fontSize: 18, fontWeight: '700', color: theme.text },
    sumLabel: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    sumAsset: { fontSize: 26, fontWeight: '800', color: theme.text, marginTop: 2 },
    sumStatsRow: { flexDirection: 'row', gap: 16, marginTop: 8, alignItems: 'center' },
    sumStatLine: { fontSize: 13, color: theme.text, fontWeight: '600' },
    sumBuyText: { color: BUY_BG, fontWeight: '700' },
    sumSellText: { color: SELL_BG, fontWeight: '700' },
    tradeCard: {
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      padding: 14,
      gap: 10,
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
      elevation: 1,
    },
    tradeTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    tradeBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
    },
    tradeBadgeText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    tradeName: { fontSize: 16, fontWeight: '700', color: theme.text },
    tradeTicker: { fontSize: 12, color: theme.textSecondary, marginTop: 1 },
    qtyLine: { fontSize: 15, color: theme.text, fontWeight: '600' },
    totalLine: { fontSize: 18, fontWeight: '800', color: theme.text },
    timeLine: { fontSize: 13, color: theme.textSecondary },
    reasonBox: {
      backgroundColor: theme.bgInput,
      borderRadius: 10,
      padding: 12,
      gap: 6,
    },
    reasonHeader: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    reasonText: { fontSize: 16, color: theme.text, lineHeight: 22 },
    reasonEmpty: { fontSize: 16, color: theme.textTertiary, fontStyle: 'italic' },
    // 학교 정보 행 + 수정 모달
    schoolRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    schoolLabel: { fontSize: 13, color: theme.textSecondary, fontWeight: '600', flexShrink: 1 },
    schoolEditBtn: {
      backgroundColor: theme.primaryLight,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
    },
    schoolEditBtnText: { fontSize: 12, fontWeight: '700', color: theme.primary },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.5)',
      justifyContent: 'center',
      padding: 24,
    },
    modalBox: {
      backgroundColor: theme.bgCard,
      borderRadius: 16,
      padding: 20,
      gap: 12,
    },
    modalTitle: { fontSize: 16, fontWeight: '700', color: theme.text },
    formLabel: { fontSize: 12, fontWeight: '700', color: theme.textSecondary },
    chipRow: { flexDirection: 'row', gap: 8 },
    chip: {
      flex: 1,
      paddingVertical: 10,
      borderRadius: 10,
      borderWidth: 1.5,
      borderColor: theme.border,
      alignItems: 'center',
      backgroundColor: theme.bgCard,
    },
    chipActive: { borderColor: theme.primary, backgroundColor: theme.primaryLight },
    chipText: { fontSize: 13, color: theme.textSecondary, fontWeight: '600' },
    chipTextActive: { color: theme.primary, fontWeight: '700' },
    formInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      padding: 12,
      fontSize: 14,
      color: theme.text,
    },
    modalBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
    modalBtn: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      alignItems: 'center',
    },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 15, color: theme.textSecondary, marginTop: 8 },
    emptyState: {
      paddingVertical: 60,
      alignItems: 'center',
      gap: 8,
    },
  });

  const renderHeader = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.sumName}>{displayName}</Text>
      <Text style={styles.sumLabel}>현재 자산</Text>
      <Text style={styles.sumAsset}>₩{Math.round(summary.totalAsset).toLocaleString()}</Text>
      <View style={styles.sumStatsRow}>
        <Text style={styles.sumStatLine}>총 거래 {summary.total}건</Text>
        <Text style={styles.sumStatLine}>
          <Text style={styles.sumBuyText}>매수 {summary.buyCount}</Text>
          {'  '}
          <Text style={styles.sumSellText}>매도 {summary.sellCount}</Text>
        </Text>
      </View>
      {/* 학교 정보 + 관리자 수정 */}
      <View style={styles.schoolRow}>
        <Text style={styles.schoolLabel} numberOfLines={1}>
          🏫 {formatSchoolLabel(userDoc?.school)}
        </Text>
        <TouchableOpacity onPress={openSchoolEditor} style={styles.schoolEditBtn} activeOpacity={0.8}>
          <Text style={styles.schoolEditBtnText}>학교 수정</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderItem = ({ item }: { item: TradeItem }) => {
    const stock = STOCKS.find(s => s.ticker === item.ticker);
    const isBuy = item.type === 'buy';
    const lineTotal = item.price * item.qty;
    const priceText = item.krw
      ? `${Math.round(item.price).toLocaleString()}원`
      : `$${item.price.toFixed(2)}`;
    const totalText = item.krw
      ? `₩${Math.round(lineTotal).toLocaleString()}`
      : `$${lineTotal.toFixed(2)}`;
    const hasReason = item.reason && item.reason.trim() !== '' && item.reason !== '미입력';

    return (
      <View style={styles.tradeCard}>
        <View style={styles.tradeTopRow}>
          <View style={[styles.tradeBadge, { backgroundColor: isBuy ? BUY_BG : SELL_BG }]}>
            <Text style={styles.tradeBadgeText}>{isBuy ? '매수' : '매도'}</Text>
          </View>
          <StockLogo ticker={item.ticker} size={28} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.tradeName} numberOfLines={1}>
              {stock?.name ?? item.ticker}
            </Text>
            <Text style={styles.tradeTicker}>{item.ticker}</Text>
          </View>
        </View>

        <View>
          <Text style={styles.qtyLine}>
            {item.qty}주 × {priceText}
          </Text>
          <Text style={styles.totalLine}>= {totalText}</Text>
        </View>

        <Text style={styles.timeLine}>📅 {formatDateTime(item.timestamp)}</Text>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonHeader}>💬 이유</Text>
          {hasReason ? (
            <Text style={styles.reasonText}>{item.reason}</Text>
          ) : (
            <Text style={styles.reasonEmpty}>(입력 안 함)</Text>
          )}
        </View>
      </View>
    );
  };

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{paramName ? `${paramName}의 거래내역` : '거래내역'}</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.emptyTitle}>불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 학교 정보 수정 모달 (관리자) */}
      <Modal
        visible={editingSchool}
        transparent
        animationType="fade"
        onRequestClose={() => setEditingSchool(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>🏫 학교 정보 수정</Text>

            <Text style={styles.formLabel}>학교 유형</Text>
            <View style={styles.chipRow}>
              {(Object.keys(SCHOOL_TYPE_LABELS) as SchoolType[]).map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setFormType(t)}
                  style={[styles.chip, formType === t && styles.chipActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.chipText, formType === t && styles.chipTextActive]}>
                    {SCHOOL_TYPE_LABELS[t]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>학교명</Text>
            <TextInput
              value={formName}
              onChangeText={setFormName}
              placeholder="학교명"
              placeholderTextColor={theme.textTertiary}
              style={styles.formInput}
            />

            {formType === 'alternative' ? (
              <>
                <Text style={styles.formLabel}>기수</Text>
                <View style={styles.chipRow}>
                  {['1기', '2기', '3기'].map(c => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setFormCohort(c)}
                      style={[styles.chip, formCohort === c && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, formCohort === c && styles.chipTextActive]}>{c}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <Text style={styles.formLabel}>학년</Text>
                <View style={styles.chipRow}>
                  {[1, 2, 3].map(g => (
                    <TouchableOpacity
                      key={g}
                      onPress={() => setFormGrade(g)}
                      style={[styles.chip, formGrade === g && styles.chipActive]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, formGrade === g && styles.chipTextActive]}>{g}학년</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.formLabel}>반</Text>
                <TextInput
                  value={formClassNum != null ? String(formClassNum) : ''}
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    setFormClassNum(Number.isFinite(n) && n > 0 ? n : null);
                  }}
                  placeholder="예) 3"
                  placeholderTextColor={theme.textTertiary}
                  keyboardType="numeric"
                  maxLength={2}
                  style={styles.formInput}
                />
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                onPress={() => setEditingSchool(false)}
                style={[styles.modalBtn, { backgroundColor: theme.bgInput }]}
                disabled={savingSchool}
              >
                <Text style={{ color: theme.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdminSchoolUpdate}
                style={[styles.modalBtn, { backgroundColor: theme.primary }]}
                disabled={savingSchool}
              >
                {savingSchool ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={{ color: '#fff', fontWeight: '700' }}>저장</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {displayName}의 거래내역
        </Text>
      </View>

      <FlatList
        data={trades}
        keyExtractor={(t) => t.id}
        renderItem={renderItem}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 36 }}>📭</Text>
            <Text style={styles.emptyTitle}>거래 내역이 없어요</Text>
          </View>
        }
        initialNumToRender={10}
        windowSize={11}
      />
    </SafeAreaView>
  );
}
