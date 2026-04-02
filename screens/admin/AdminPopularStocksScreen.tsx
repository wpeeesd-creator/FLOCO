/**
 * 관리자 — 인기 종목 화면
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../components/ui';
import { fetchAllPortfoliosForAdmin } from '../../lib/adminService';
import { STOCKS } from '../../store/appStore';
import StockLogo from '../../components/StockLogo';

interface PopularStock {
  ticker: string;
  name: string;
  market: string;
  holdCount: number;
  trades: number;
}

interface ReturnEntry {
  ticker: string;
  name: string;
  avgReturn: number;
}

export default function AdminPopularStocksScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [popular, setPopular] = useState<PopularStock[]>([]);
  const [krPct, setKrPct] = useState(50);
  const [usPct, setUsPct] = useState(50);
  const [topReturns, setTopReturns] = useState<ReturnEntry[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const portfolios = await fetchAllPortfoliosForAdmin();

      const holdingCount: Record<string, number> = {};
      const tradeCount: Record<string, number> = {};
      const returnSum: Record<string, number> = {};
      const returnCnt: Record<string, number> = {};
      let krTrades = 0;
      let usTrades = 0;

      portfolios.forEach((p: any) => {
        (p.holdings ?? []).forEach((h: any) => {
          if (!h?.ticker) return;
          holdingCount[h.ticker] = (holdingCount[h.ticker] ?? 0) + 1;
          // Compute unrealized return if available
          if (h.avgPrice && h.avgPrice > 0) {
            const stock = STOCKS.find(s => s.ticker === h.ticker);
            if (stock) {
              const ret = ((stock.price - h.avgPrice) / h.avgPrice) * 100;
              returnSum[h.ticker] = (returnSum[h.ticker] ?? 0) + ret;
              returnCnt[h.ticker] = (returnCnt[h.ticker] ?? 0) + 1;
            }
          }
        });

        (p.trades ?? []).forEach((t: any) => {
          if (!t?.ticker) return;
          tradeCount[t.ticker] = (tradeCount[t.ticker] ?? 0) + 1;
          const stock = STOCKS.find(s => s.ticker === t.ticker);
          if (stock?.market === '한국') krTrades++;
          else usTrades++;
        });
      });

      const totalTrades = krTrades + usTrades || 1;
      setKrPct(Math.round((krTrades / totalTrades) * 100));
      setUsPct(Math.round((usTrades / totalTrades) * 100));

      const popularList = Object.entries(holdingCount)
        .map(([ticker, count]) => {
          const stock = STOCKS.find(s => s.ticker === ticker);
          return stock
            ? {
                ticker,
                name: stock.name,
                market: stock.market,
                holdCount: count,
                trades: tradeCount[ticker] ?? 0,
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.holdCount - a.holdCount)
        .slice(0, 10);

      const returnsList = Object.entries(returnSum)
        .map(([ticker, sum]) => {
          const stock = STOCKS.find(s => s.ticker === ticker);
          return stock
            ? {
                ticker,
                name: stock.name,
                avgReturn: sum / (returnCnt[ticker] ?? 1),
              }
            : null;
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)
        .sort((a, b) => b.avgReturn - a.avgReturn)
        .slice(0, 5);

      setPopular(popularList);
      setTopReturns(returnsList);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const RANK_COLORS = [Colors.primary, '#FF9500', '#34C759'];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>인기 종목</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && popular.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          showsVerticalScrollIndicator={false}
        >
          {/* TOP 10 인기 종목 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏆 인기 종목 TOP 10</Text>
            {popular.length === 0 ? (
              <Text style={styles.emptyText}>데이터가 없어요</Text>
            ) : (
              popular.map((item, i) => (
                <View key={item.ticker} style={styles.stockRow}>
                  <Text style={[styles.rankNum, { color: i < 3 ? RANK_COLORS[i] : Colors.textSub }]}>
                    {i + 1}
                  </Text>
                  <StockLogo ticker={item.ticker} size={40} />
                  <View style={styles.stockInfo}>
                    <Text style={styles.stockName} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.stockTicker}>{item.ticker}</Text>
                  </View>
                  <View style={styles.stockMeta}>
                    <Text style={styles.stockMetaLabel}>보유 유저</Text>
                    <Text style={styles.stockMetaValue}>{item.holdCount}명</Text>
                    <Text style={styles.stockMetaLabel}>총 거래</Text>
                    <Text style={styles.stockMetaValue}>{item.trades}회</Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* 국내 vs 미국 비율 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🇰🇷 국내 vs 🇺🇸 미국</Text>
            <View style={styles.marketBarWrap}>
              <View style={styles.marketBar}>
                <View style={[styles.marketBarKr, { flex: krPct }]} />
                <View style={[styles.marketBarUs, { flex: usPct }]} />
              </View>
            </View>
            <View style={styles.marketLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.legendText}>국내 {krPct}%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#FF9500' }]} />
                <Text style={styles.legendText}>미국 {usPct}%</Text>
              </View>
            </View>
          </View>

          {/* 종목별 평균 수익률 TOP 5 */}
          <View style={[styles.section, { marginBottom: 32 }]}>
            <Text style={styles.sectionTitle}>📈 종목별 평균 수익률 TOP 5</Text>
            {topReturns.length === 0 ? (
              <Text style={styles.emptyText}>데이터가 없어요</Text>
            ) : (
              topReturns.map((item, i) => {
                const isUp = item.avgReturn >= 0;
                return (
                  <View key={item.ticker} style={styles.returnRow}>
                    <Text style={[styles.rankNum, { color: i < 3 ? RANK_COLORS[i] : Colors.textSub }]}>
                      {i + 1}
                    </Text>
                    <View style={styles.returnInfo}>
                      <Text style={styles.stockName}>{item.name}</Text>
                      <Text style={styles.stockTicker}>{item.ticker}</Text>
                    </View>
                    <Text style={[styles.returnPct, { color: isUp ? Colors.green : Colors.red }]}>
                      {isUp ? '▲ +' : '▼ '}{item.avgReturn.toFixed(2)}%
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.card,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.text },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  section: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, marginBottom: 14 },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  rankNum: { fontSize: 16, fontWeight: '800', width: 24, textAlign: 'center' },
  stockInfo: { flex: 1 },
  stockName: { fontSize: 14, fontWeight: '600', color: Colors.text },
  stockTicker: { fontSize: 12, color: Colors.textSub, marginTop: 2 },
  stockMeta: { alignItems: 'flex-end', gap: 2 },
  stockMetaLabel: { fontSize: 10, color: Colors.textSub },
  stockMetaValue: { fontSize: 13, fontWeight: '700', color: Colors.text },
  marketBarWrap: { marginBottom: 12 },
  marketBar: {
    flexDirection: 'row', height: 20, borderRadius: 10, overflow: 'hidden', backgroundColor: Colors.bg,
  },
  marketBarKr: { backgroundColor: Colors.primary },
  marketBarUs: { backgroundColor: '#FF9500' },
  marketLegend: { flexDirection: 'row', gap: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 13, color: Colors.text, fontWeight: '600' },
  returnRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 10,
  },
  returnInfo: { flex: 1 },
  returnPct: { fontSize: 14, fontWeight: '800' },
  emptyText: { fontSize: 14, color: Colors.textSub, textAlign: 'center', paddingVertical: 20 },
});
