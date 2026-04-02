/**
 * 관리자 거래 로그 화면 — 필터 + 요약 + 전체 목록
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, ListRenderItemInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';
import StockLogo from '../../components/StockLogo';
import { getAllUserProfiles, getAllPortfolios } from '../../lib/firestoreService';
import { STOCKS } from '../../store/appStore';

type TradeType = 'all' | 'buy' | 'sell';

interface EnrichedTrade {
  id: string;
  uid: string;
  userName: string;
  ticker: string;
  type: 'buy' | 'sell';
  price: number;
  qty: number;
  timestamp: number;
}

// ── 상대 시간 ───────────────────────────────────
function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return '방금 전';
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  return `${day}일 전`;
}

export default function AdminTradeLogScreen() {
  const navigation = useNavigation();
  const [trades, setTrades] = useState<EnrichedTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<TradeType>('all');
  const [search, setSearch] = useState('');

  const loadTrades = useCallback(async () => {
    try {
      const [portfolios, users] = await Promise.all([
        getAllPortfolios(),
        getAllUserProfiles(),
      ]);
      const nameMap = new Map(users.map(u => [u.uid, u.name]));
      const allTrades: EnrichedTrade[] = portfolios.flatMap(p =>
        (p.trades ?? []).map(t => ({
          id: t.id ?? `${p.uid}-${t.timestamp}`,
          uid: p.uid,
          userName: nameMap.get(p.uid) ?? p.name ?? '알 수 없음',
          ticker: t.ticker,
          type: t.type as 'buy' | 'sell',
          price: t.price,
          qty: t.qty,
          timestamp: t.timestamp,
        }))
      );
      allTrades.sort((a, b) => b.timestamp - a.timestamp);
      setTrades(allTrades);
    } catch {
      setTrades([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTrades(); }, []);

  // ── 필터 적용 ─────────────────────────────────
  const filtered = useMemo(() => {
    let result = trades;
    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      result = result.filter(t =>
        t.ticker.toUpperCase().includes(q) ||
        t.userName.includes(search.trim())
      );
    }
    return result;
  }, [trades, typeFilter, search]);

  // ── 요약 통계 ─────────────────────────────────
  const totalAmount = useMemo(
    () => filtered.reduce((sum, t) => sum + t.price * t.qty, 0),
    [filtered],
  );

  const top5Tickers = useMemo(() => {
    const counts: Record<string, number> = {};
    trades.forEach(t => { counts[t.ticker] = (counts[t.ticker] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([ticker]) => ticker);
  }, [trades]);

  // ── 행 렌더 ───────────────────────────────────
  const renderItem = ({ item }: ListRenderItemInfo<EnrichedTrade>) => {
    const stock = STOCKS.find(s => s.ticker === item.ticker);
    const total = item.price * item.qty;
    const isBuy = item.type === 'buy';

    return (
      <View style={styles.tradeRow}>
        <StockLogo ticker={item.ticker} size={36} />
        <View style={styles.tradeInfo}>
          <Text style={styles.tradeName} numberOfLines={1}>
            {item.userName}
          </Text>
          <Text style={styles.tradeTicker} numberOfLines={1}>
            {stock?.name ?? item.ticker} · {item.ticker}
          </Text>
        </View>
        <View style={[styles.tradeBadge, { backgroundColor: isBuy ? '#FFF0F1' : '#EBF2FF' }]}>
          <Text style={[styles.tradeBadgeText, { color: isBuy ? Colors.green : Colors.red }]}>
            {isBuy ? '매수' : '매도'}
          </Text>
        </View>
        <View style={styles.tradeAmountCol}>
          <Text style={[styles.tradeAmount, { color: isBuy ? Colors.green : Colors.red }]}>
            {isBuy ? '-' : '+'}
            {stock?.krw
              ? `₩${Math.round(total).toLocaleString()}`
              : `$${total.toFixed(2)}`}
          </Text>
          <Text style={styles.tradeDetail}>
            {item.qty}주 · {stock?.krw ? `₩${item.price.toLocaleString()}` : `$${item.price.toFixed(2)}`}
          </Text>
          <Text style={styles.tradeTime}>{relativeTime(item.timestamp)}</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>거래 로그</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* 필터 영역 */}
      <View style={styles.filterSection}>
        {/* 타입 필 */}
        <View style={styles.typePills}>
          {(['all', 'buy', 'sell'] as TradeType[]).map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.pill, typeFilter === type && styles.pillActive]}
              onPress={() => setTypeFilter(type)}
            >
              <Text style={[styles.pillText, typeFilter === type && styles.pillTextActive]}>
                {type === 'all' ? '전체' : type === 'buy' ? '매수' : '매도'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 검색 */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textSub} />
          <TextInput
            style={styles.searchInput}
            placeholder="종목명 / 티커 / 유저명 검색"
            placeholderTextColor={Colors.textSub}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textSub} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 요약 카드 */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatVal}>{filtered.length}건</Text>
            <Text style={styles.summaryStatLabel}>총 거래</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryStatVal}>
              ₩{Math.round(totalAmount).toLocaleString()}
            </Text>
            <Text style={styles.summaryStatLabel}>총 거래금액</Text>
          </View>
        </View>
        {top5Tickers.length > 0 && (
          <View style={styles.top5Row}>
            <Text style={styles.top5Label}>TOP 5</Text>
            {top5Tickers.map(ticker => (
              <View key={ticker} style={styles.top5Pill}>
                <Text style={styles.top5PillText}>{ticker}</Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 거래 목록 */}
      <FlatList
        data={filtered}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>거래 내역이 없어요</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.text },
  // Filters
  filterSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  typePills: { flexDirection: 'row', gap: 8, paddingTop: 12 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.bg,
  },
  pillActive: { backgroundColor: Colors.primary },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textSub },
  pillTextActive: { color: '#fff' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.text, padding: 0 },
  // Summary
  summaryCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 4,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryStat: { flex: 1, alignItems: 'center' },
  summaryStatVal: { fontSize: 16, fontWeight: '700', color: Colors.text },
  summaryStatLabel: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  summaryDivider: { width: 1, height: 32, backgroundColor: Colors.border },
  top5Row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
    flexWrap: 'wrap',
  },
  top5Label: { fontSize: 11, fontWeight: '700', color: Colors.textSub },
  top5Pill: {
    backgroundColor: '#EAF4FF',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  top5PillText: { fontSize: 11, fontWeight: '700', color: Colors.primary },
  // List
  listContent: { padding: 16, paddingBottom: 40 },
  separator: { height: 1, backgroundColor: Colors.border },
  tradeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderRadius: 12,
  },
  tradeInfo: { flex: 1, minWidth: 0 },
  tradeName: { fontSize: 13, fontWeight: '700', color: Colors.text },
  tradeTicker: { fontSize: 11, color: Colors.textSub, marginTop: 2 },
  tradeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tradeBadgeText: { fontSize: 11, fontWeight: '700' },
  tradeAmountCol: { alignItems: 'flex-end', gap: 2 },
  tradeAmount: { fontSize: 13, fontWeight: '700' },
  tradeDetail: { fontSize: 10, color: Colors.textSub },
  tradeTime: { fontSize: 10, color: Colors.textMuted ?? Colors.textSub },
  // Empty
  empty: { alignItems: 'center', paddingVertical: 60, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: Colors.textSub, fontWeight: '500' },
});
