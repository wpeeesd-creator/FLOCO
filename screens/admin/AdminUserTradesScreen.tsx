/**
 * 관리자 — 사용자 거래 내역 (사용자 리스트)
 * 카드 누르면 AdminUserDetailScreen으로 이동
 * 토스 톤 라이트 디자인 (DS 토큰 — AdminDashboardScreen과 동일)
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

type SortKey = 'trades' | 'asset' | 'recent' | 'name';

const DAY_MS = 24 * 60 * 60 * 1000;

interface UserRow {
  uid: string;
  name: string;
  totalAsset: number;
  buyCount: number;
  sellCount: number;
  total: number;
  lastTradeAt: number;
}

// ── 헬퍼 ─────────────────────────────────────
function getInitial(name: string): string {
  return name?.[0] ?? '?';
}

const AVATAR_COLORS = [
  '#3478F6', '#22C55E', '#EAB308', '#A855F7',
  '#EC4899', '#06B6D4', '#F97316', '#10B981',
];

function getAvatarColor(name: string): string {
  const hash = (name ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function formatRelativeDate(ms: number): string {
  if (!ms) return '거래 없음';
  const diffDays = Math.floor((Date.now() - ms) / DAY_MS);
  if (diffDays === 0) return '오늘';
  if (diffDays === 1) return '어제';
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
  return `${Math.floor(diffDays / 30)}개월 전`;
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

export default function AdminUserTradesScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { logout } = useAuth();

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
    buy: '#EF4444',  // 매수 (한국 빨강)
    sell: '#3478F6', // 매도 (한국 파랑)
  };

  const [rows, setRows] = useState<UserRow[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('trades');

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  };

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'users'),
      (snap) => {
        const list: UserRow[] = snap.docs
          .map(d => ({ uid: d.id, ...(d.data() as any) }))
          .filter((u: any) => u.role !== 'admin')
          .map((u: any) => {
            const txs: any[] = u.transactions ?? [];
            let buyCount = 0;
            let sellCount = 0;
            let lastTradeAt = 0;
            txs.forEach((t: any) => {
              if (t.type === 'sell') sellCount++;
              else buyCount++;
              const ts = toMs(t.createdAt);
              if (ts > lastTradeAt) lastTradeAt = ts;
            });
            return {
              uid: u.uid,
              name: u.nickname ?? u.name ?? u.displayName ?? '익명',
              totalAsset: Number(u.totalAsset ?? u.balance ?? 10_000_000),
              buyCount,
              sellCount,
              total: buyCount + sellCount,
              lastTradeAt,
            };
          });
        setRows(list);
        setLoaded(true);
      },
      (err) => {
        console.error('AdminUserTrades 구독 오류:', err);
        setLoaded(true);
      },
    );
    return () => unsub();
  }, []);

  const sorted = useMemo(() => {
    const copy = [...rows];
    if (sortKey === 'trades') {
      copy.sort((a, b) => b.total - a.total);
    } else if (sortKey === 'asset') {
      copy.sort((a, b) => b.totalAsset - a.totalAsset);
    } else if (sortKey === 'recent') {
      copy.sort((a, b) => b.lastTradeAt - a.lastTradeAt);
    } else {
      copy.sort((a, b) => a.name.localeCompare(b.name, 'ko'));
    }
    return copy;
  }, [rows, sortKey]);

  const totalTrades = useMemo(
    () => rows.reduce((sum, r) => sum + r.total, 0),
    [rows],
  );

  const avgTrades = rows.length > 0 ? (totalTrades / rows.length).toFixed(1) : '0';

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'trades', label: '거래 많은순' },
    { key: 'asset', label: '자산 많은순' },
    { key: 'recent', label: '최근 거래순' },
    { key: 'name', label: '이름순' },
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
    headerTitleWrap: { flex: 1, alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: DS.text },
    // 요약 카드
    summaryCard: {
      backgroundColor: DS.cardBg,
      borderRadius: 16,
      paddingVertical: 16,
      paddingHorizontal: 8,
      marginBottom: 12,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center' },
    summaryItem: { alignItems: 'center', flex: 1 },
    summaryLabel: { fontSize: 11, color: DS.textSub, marginBottom: 2, fontWeight: '500' },
    summaryValue: { fontSize: 17, fontWeight: '700', color: DS.text },
    summaryDivider: { width: 1, height: 28, backgroundColor: DS.border },
    // 정렬 칩
    chipRow: { paddingBottom: 12 },
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
    // 사용자 카드
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: DS.cardBg,
      padding: 16,
      borderRadius: 16,
      marginBottom: 8,
      gap: 14,
    },
    avatar: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    userName: { fontSize: 15, fontWeight: '700', color: DS.text, flexShrink: 1 },
    activeBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: DS.positive + '20',
      borderRadius: 4,
    },
    activeBadgeText: { fontSize: 10, color: DS.positive, fontWeight: '700' },
    userAsset: { fontSize: 18, fontWeight: '700', color: DS.text },
    statsRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    statValue: { fontSize: 12, fontWeight: '600' },
    statDivider: { fontSize: 12, color: DS.textMuted },
    statTotal: { fontSize: 12, color: DS.textSub, fontWeight: '500' },
    recentText: { fontSize: 11, color: DS.textMuted },
    listContent: { padding: 16, paddingBottom: 100 }, // 탭바 가림 방지
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyState: { paddingVertical: 60, alignItems: 'center', gap: 8 },
    emptyTitle: { fontSize: 15, color: DS.textSub, marginTop: 8 },
    logoutBtn: {
      marginTop: 24,
      marginBottom: 8,
      padding: 16,
      backgroundColor: DS.negative,
      borderRadius: 14,
      alignItems: 'center',
    },
    logoutBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  });

  const SummaryItem = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={DS.primary} />
          <Text style={styles.emptyTitle}>거래내역 불러오는 중...</Text>
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
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>거래 내역</Text>
        </View>
        <View style={styles.backBtn} />
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* 요약 카드 */}
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <SummaryItem label="전체 사용자" value={`${rows.length}명`} />
                <View style={styles.summaryDivider} />
                <SummaryItem label="총 거래" value={`${totalTrades.toLocaleString()}건`} />
                <View style={styles.summaryDivider} />
                <SummaryItem label="평균" value={`${avgTrades}회/명`} />
              </View>
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>등록된 사용자가 없어요</Text>
          </View>
        }
        renderItem={({ item: u }) => {
          const isActive = u.lastTradeAt > 0 && Date.now() - u.lastTradeAt <= DAY_MS;
          return (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => navigation.navigate('사용자거래상세', { uid: u.uid, name: u.name })}
              style={styles.userCard}
            >
              {/* 좌측: 이니셜 아바타 */}
              <View style={[styles.avatar, { backgroundColor: getAvatarColor(u.name) }]}>
                <Text style={styles.avatarText}>{getInitial(u.name)}</Text>
              </View>

              {/* 중앙: 정보 */}
              <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
                  {isActive && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>활성</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.userAsset}>₩{Math.round(u.totalAsset).toLocaleString()}</Text>

                <View style={styles.statsRow}>
                  <Text style={[styles.statValue, { color: DS.buy }]}>매수 {u.buyCount}</Text>
                  <Text style={styles.statDivider}>·</Text>
                  <Text style={[styles.statValue, { color: DS.sell }]}>매도 {u.sellCount}</Text>
                  <Text style={styles.statDivider}>·</Text>
                  <Text style={styles.statTotal}>총 {u.total}건</Text>
                </View>

                <Text style={styles.recentText}>최근 {formatRelativeDate(u.lastTradeAt)}</Text>
              </View>

              {/* 우측: 화살표 */}
              <ChevronRight size={20} color={DS.textMuted} />
            </TouchableOpacity>
          );
        }}
        initialNumToRender={12}
        windowSize={11}
        ListFooterComponent={
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} activeOpacity={0.85}>
            <Text style={styles.logoutBtnText}>로그아웃</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}
