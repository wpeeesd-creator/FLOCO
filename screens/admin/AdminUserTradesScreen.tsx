/**
 * 관리자 — 사용자 거래 내역 (사용자 리스트)
 * 카드 누르면 AdminUserDetailScreen으로 이동
 */

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

type SortKey = 'trades' | 'asset' | 'recent' | 'name';

interface UserRow {
  uid: string;
  name: string;
  totalAsset: number;
  buyCount: number;
  sellCount: number;
  total: number;
  lastTradeAt: number;
}

function relativeTime(ts: number): string {
  if (!ts) return '거래 없음';
  const diff = Date.now() - ts;
  if (diff < 60_000) return '방금 전';
  const min = Math.floor(diff / 60_000);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const month = Math.floor(day / 30);
  return `${month}개월 전`;
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

  const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.bg },
    header: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    headerTitle: { fontSize: 20, fontWeight: '700', color: theme.text },
    headerMeta: { fontSize: 12, color: theme.textSecondary, fontWeight: '600', marginTop: 4 },
    sortRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: theme.bgCard,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    sortPill: {
      flex: 1,
      paddingVertical: 8,
      paddingHorizontal: 4,
      borderRadius: 10,
      backgroundColor: theme.bgInput,
      alignItems: 'center',
    },
    sortPillActive: { backgroundColor: theme.primary },
    sortText: { fontSize: 12, color: theme.textSecondary, fontWeight: '600' },
    sortTextActive: { color: '#fff', fontWeight: '700' },
    listContent: { padding: 16, paddingBottom: 40 },
    card: {
      backgroundColor: theme.bgCard,
      borderRadius: 14,
      padding: 16,
      marginBottom: 12,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: theme.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 1,
    },
    cardMain: { flex: 1, gap: 4 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    avatar: { fontSize: 18 },
    userName: { fontSize: 18, fontWeight: '700', color: theme.text },
    asset: { fontSize: 22, fontWeight: '800', color: theme.text },
    statsLine: { fontSize: 14, color: theme.text, fontWeight: '500' },
    statBuy: { color: '#FF3B30', fontWeight: '700' },
    statSell: { color: '#0066FF', fontWeight: '700' },
    statTotal: { color: theme.textSecondary },
    timeLine: { fontSize: 13, color: theme.textSecondary },
    chevron: { paddingLeft: 8 },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyTitle: { fontSize: 15, color: theme.textSecondary, marginTop: 8 },
    emptyState: { paddingVertical: 60, alignItems: 'center', gap: 8 },
  });

  if (!loaded) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={styles.emptyTitle}>거래내역 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'trades', label: '거래 많은순' },
    { key: 'asset', label: '자산 많은순' },
    { key: 'recent', label: '최근 거래순' },
    { key: 'name', label: '이름순' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>사용자 거래 내역</Text>
        <Text style={styles.headerMeta}>
          총 {sorted.length}명 · 총 거래 {totalTrades.toLocaleString()}건
        </Text>
      </View>

      <View style={styles.sortRow}>
        {SORT_OPTIONS.map(opt => (
          <TouchableOpacity
            key={opt.key}
            onPress={() => setSortKey(opt.key)}
            style={[styles.sortPill, sortKey === opt.key && styles.sortPillActive]}
          >
            <Text style={[styles.sortText, sortKey === opt.key && styles.sortTextActive]}>
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={sorted}
        keyExtractor={(u) => u.uid}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={styles.emptyTitle}>등록된 사용자가 없어요</Text>
          </View>
        }
        renderItem={({ item: u }) => (
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => navigation.navigate('사용자거래상세', { uid: u.uid, name: u.name })}
            style={styles.card}
          >
            <View style={styles.cardMain}>
              <View style={styles.nameRow}>
                <Text style={styles.avatar}>👤</Text>
                <Text style={styles.userName} numberOfLines={1}>{u.name}</Text>
              </View>
              <Text style={styles.asset}>₩{Math.round(u.totalAsset).toLocaleString()}</Text>
              <Text style={styles.statsLine}>
                <Text style={styles.statBuy}>매수 {u.buyCount}</Text>
                <Text> / </Text>
                <Text style={styles.statSell}>매도 {u.sellCount}</Text>
                <Text style={styles.statTotal}> ({u.total}건)</Text>
              </Text>
              <Text style={styles.timeLine}>최근: {relativeTime(u.lastTradeAt)}</Text>
            </View>
            <View style={styles.chevron}>
              <Ionicons name="chevron-forward" size={22} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        )}
        initialNumToRender={12}
        windowSize={11}
        ListFooterComponent={
          <TouchableOpacity
            onPress={handleLogout}
            style={{
              marginHorizontal: 0,
              marginTop: 32,
              marginBottom: 32,
              padding: 16,
              backgroundColor: '#FF3B30',
              borderRadius: 12,
              alignItems: 'center',
            }}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
              로그아웃
            </Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}
