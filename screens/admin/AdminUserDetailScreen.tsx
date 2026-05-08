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
} from 'react-native';
import { Text } from '../../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useTheme } from '../../context/ThemeContext';
import StockLogo from '../../components/StockLogo';
import { STOCKS } from '../../store/appStore';
import { calculateTotalAsset } from '../../utils/assetCalculator';

const BUY_BG = '#FF3B30';
const SELL_BG = '#0066FF';

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
    const { totalAsset } = calculateTotalAsset({
      balance,
      portfolio,
      livePrices: {},
      exchangeRate: 1380,
    });

    return {
      total: trades.length,
      buyCount,
      sellCount,
      totalAsset,
    };
  }, [trades, userDoc]);

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
