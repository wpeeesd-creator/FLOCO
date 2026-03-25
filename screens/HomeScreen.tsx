import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, RefreshControl, TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore, STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';

type TopTab = '보유' | '국내' | '해외';
type MarketFilter = '전체' | '한국' | '미국';
type SortType = 'value' | 'return';

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { holdings, cash, getTotalValue, getReturnRate } = useAppStore();
  const [isLoading, setIsLoading] = useState(true);
  const [topTab, setTopTab] = useState<TopTab>('보유');
  const [marketFilter, setMarketFilter] = useState<MarketFilter>('전체');
  const [sortType, setSortType] = useState<SortType>('value');
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    console.log('HomeScreen 마운트');
    try {
      console.log('holdings:', holdings);
      console.log('cash:', cash);
      setIsLoading(false);
    } catch (error) {
      console.error('HomeScreen 초기화 오류:', error);
      setIsLoading(false);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#0066FF" />
        </View>
      </SafeAreaView>
    );
  }

  console.log('HomeScreen 렌더링 시작');

  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch (error) {
    console.error('HomeScreen 자산 계산 오류:', error);
  }
  const profit = totalValue - 1_000_000;
  const stockValue = totalValue - (cash ?? 0);
  const isUp = profit >= 0;

  // Holdings with stock data
  const safeHoldings = holdings ?? [];
  const holdingsData = safeHoldings.map(h => {
    const stock = STOCKS.find(s => s.ticker === h.ticker);
    if (!stock) return null;
    const evalAmt = (stock.price ?? 0) * (h.qty ?? 0);
    const pnlAmt = ((stock.price ?? 0) - (h.avgPrice ?? 0)) * (h.qty ?? 0);
    const pnlRate = (h.avgPrice ?? 0) > 0 ? (((stock.price ?? 0) - (h.avgPrice ?? 0)) / (h.avgPrice ?? 0)) * 100 : 0;
    return { ...h, stock, evalAmt, pnlAmt, pnlRate };
  }).filter(Boolean) as Array<{ ticker: string; qty: number; avgPrice: number; stock: typeof STOCKS[0]; evalAmt: number; pnlAmt: number; pnlRate: number }>;

  // Filter by market
  const filteredHoldings = holdingsData.filter(h => {
    if (marketFilter === '전체') return true;
    return h.stock.market === marketFilter;
  });

  // Sort
  const sortedHoldings = [...filteredHoldings].sort((a, b) => {
    if (sortType === 'value') return b.evalAmt - a.evalAmt;
    return b.pnlRate - a.pnlRate;
  });

  // Apply search filter
  const displayHoldings = search.trim()
    ? sortedHoldings.filter(h =>
        h.stock.name.includes(search) ||
        h.stock.ticker.toUpperCase().includes(search.toUpperCase())
      )
    : sortedHoldings;

  // For 국내/해외 tabs: show all stocks in that market
  const marketStocks = STOCKS.filter(s => {
    if (topTab === '국내') return s.market === '한국';
    if (topTab === '해외') return s.market === '미국';
    return false;
  });

  const displayMarketStocks = search.trim()
    ? marketStocks.filter(s =>
        s.name.includes(search) ||
        s.ticker.toUpperCase().includes(search.toUpperCase())
      )
    : marketStocks;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <Text style={styles.logoText}>FLOCO</Text>
          <View style={styles.topIcons}>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="search-outline" size={22} color="#191919" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color="#191919" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Top Tabs */}
        <View style={styles.topTabs}>
          {(['보유', '국내', '해외'] as TopTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.topTabBtn, topTab === t && styles.topTabBtnActive]}
              onPress={() => setTopTab(t)}
            >
              <Text style={[styles.topTabText, topTab === t && styles.topTabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0066FF" />}
        >
          {topTab === '보유' ? (
            <>
              {/* Asset Overview Card */}
              <View style={styles.assetCard}>
                <Text style={styles.assetCardTitle}>총 자산</Text>
                <Text style={styles.assetMainValue}>
                  {Math.round(totalValue).toLocaleString()}원
                </Text>
                <Text style={[styles.assetProfitText, { color: isUp ? '#FFD700' : '#FF6B6B' }]}>
                  {isUp ? '+' : ''}{Math.round(profit).toLocaleString()}원
                  {' '}({isUp ? '+' : ''}{Math.abs(returnRate).toFixed(2)}%)
                </Text>

                <View style={styles.assetSubRow}>
                  <View style={styles.assetSubCard}>
                    <Text style={styles.assetSubLabel}>남은 현금</Text>
                    <Text style={styles.assetSubValue}>
                      {Math.round(cash ?? 0).toLocaleString()}원
                    </Text>
                  </View>
                  <View style={styles.assetSubCard}>
                    <Text style={styles.assetSubLabel}>투자 중</Text>
                    <Text style={styles.assetSubValue}>
                      {Math.round(stockValue).toLocaleString()}원
                    </Text>
                  </View>
                </View>
              </View>

              {/* Cash Highlight Card */}
              <View style={styles.cashCard}>
                <Text style={styles.cashLabel}>💰 투자 가능한 현금</Text>
                <Text style={styles.cashValue}>
                  {Math.round(cash ?? 0).toLocaleString()}원
                </Text>
                <Text style={styles.cashPercent}>
                  전체 자산의 {totalValue > 0 ? (((cash ?? 0) / totalValue) * 100).toFixed(1) : '0.0'}%
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>총자산</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => navigation.navigate('거래내역')}
                >
                  <Text style={styles.actionBtnText}>거래내역</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]}>
                  <Text style={styles.actionBtnTextPrimary}>학습하기</Text>
                </TouchableOpacity>
              </View>

              {/* Search */}
              <View style={styles.searchRow}>
                <Text style={{ fontSize: 16, color: '#B0B8C1' }}>🔍</Text>
                <TextInput
                  style={styles.searchInput}
                  placeholder="종목명 또는 티커 검색"
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor="#B0B8C1"
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={{ color: '#B0B8C1', fontSize: 16 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Market Filter */}
              <View style={styles.marketFilter}>
                {(['전체', '한국', '미국'] as MarketFilter[]).map(m => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.marketBtn, marketFilter === m && styles.marketBtnActive]}
                    onPress={() => setMarketFilter(m)}
                  >
                    <Text style={[styles.marketText, marketFilter === m && styles.marketTextActive]}>{m}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort */}
              <View style={styles.sortRow}>
                <Text style={styles.sortLabel}>보유 {displayHoldings.length}종목</Text>
                <View style={styles.sortBtns}>
                  {(['value', 'return'] as SortType[]).map(s => (
                    <TouchableOpacity
                      key={s}
                      onPress={() => setSortType(s)}
                      style={[styles.sortBtn, sortType === s && styles.sortBtnActive]}
                    >
                      <Text style={[styles.sortBtnText, sortType === s && styles.sortBtnTextActive]}>
                        {s === 'value' ? '평가금액순' : '수익률순'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Holdings List */}
              {displayHoldings.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyEmoji}>📈</Text>
                  <Text style={styles.emptyTitle}>
                    아직 보유 종목이 없어요{'\n'}첫 투자를 시작해보세요!
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyBtn}
                    onPress={() => navigation.getParent()?.navigate('투자Tab')}
                  >
                    <Text style={styles.emptyBtnText}>투자하러 가기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.holdingList}>
                  {displayHoldings.map((h, i) => {
                    const hUp = h.pnlRate >= 0;
                    const evalAmt = h.evalAmt;
                    return (
                      <TouchableOpacity
                        key={h.ticker}
                        style={[styles.holdingRow, i < displayHoldings.length - 1 && styles.holdingBorder]}
                        onPress={() => navigation.getParent()?.navigate('투자Tab', {
                          screen: '종목상세', params: { ticker: h.ticker }
                        })}
                        activeOpacity={0.7}
                      >
                        <StockLogo ticker={h.ticker} size={44} />
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <Text style={styles.holdingName}>{h.stock.name}</Text>
                          <Text style={styles.holdingQty}>
                            {h.qty}주 · 평균 {h.stock.krw ? `${Math.round(h.avgPrice).toLocaleString()}원` : `$${h.avgPrice.toFixed(2)}`}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.holdingEval}>
                            {h.stock.krw ? `${Math.round(evalAmt).toLocaleString()}원` : `$${evalAmt.toFixed(2)}`}
                          </Text>
                          <Text style={[styles.holdingPnl, { color: hUp ? '#FF3B30' : '#0066FF' }]}>
                            {hUp ? '+' : ''}{h.stock.krw ? `${Math.round(h.pnlAmt).toLocaleString()}원` : `$${h.pnlAmt.toFixed(2)}`}
                            {' '}({hUp ? '+' : ''}{h.pnlRate.toFixed(2)}%)
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            /* 국내/해외 Tab - Stock List */
            <>
              <View style={styles.marketListHeader}>
                <Text style={styles.marketListTitle}>
                  {topTab === '국내' ? '국내 주식' : '해외 주식'} {displayMarketStocks.length}종목
                </Text>
              </View>
              <View style={styles.holdingList}>
                {displayMarketStocks.map((s, i) => {
                  const sUp = s.change >= 0;
                  const holding = safeHoldings.find(h => h.ticker === s.ticker);
                  return (
                    <TouchableOpacity
                      key={s.ticker}
                      style={[styles.holdingRow, i < displayMarketStocks.length - 1 && styles.holdingBorder]}
                      onPress={() => navigation.getParent()?.navigate('투자Tab', {
                        screen: '종목상세', params: { ticker: s.ticker }
                      })}
                      activeOpacity={0.7}
                    >
                      <StockLogo ticker={s.ticker} size={44} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.holdingName}>{s.name}</Text>
                        <Text style={styles.holdingQty}>{s.ticker}{holding ? ` · ${holding.qty}주 보유` : ''}</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.holdingEval}>
                          {s.krw ? `₩${s.price.toLocaleString()}` : `$${s.price.toFixed(2)}`}
                        </Text>
                        <Text style={[styles.holdingPnl, { color: sUp ? '#FF3B30' : '#3182F6' }]}>
                          {sUp ? '+' : ''}{s.change.toFixed(2)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  topHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 10,
  },
  logoText: { fontSize: 20, fontWeight: '800', color: '#0066FF', letterSpacing: -0.5 },
  topIcons: { flexDirection: 'row', gap: 4 },
  iconBtn: { padding: 8 },

  topTabs: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 0,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  topTabBtn: {
    paddingVertical: 12, paddingHorizontal: 16,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  topTabBtnActive: { borderBottomColor: '#191919' },
  topTabText: { fontSize: 15, color: '#8E8E93', fontWeight: '500' },
  topTabTextActive: { color: '#191919', fontWeight: '700' },

  assetCard: {
    backgroundColor: '#0066FF', margin: 16, borderRadius: 20, padding: 20,
    shadowColor: '#0066FF', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  assetCardTitle: { fontSize: 13, color: '#FFFFFF80', marginBottom: 4 },
  assetMainValue: {
    fontSize: 32, fontWeight: '700', color: '#FFFFFF',
    fontFamily: 'Courier', letterSpacing: -1,
  },
  assetProfitText: { fontSize: 16, fontWeight: '600', marginTop: 4 },
  cashCard: {
    backgroundColor: '#FF6B35', borderRadius: 16, padding: 16,
    marginHorizontal: 16, marginTop: 8,
  },
  cashLabel: { color: '#FFFFFF80', fontSize: 12 },
  cashValue: { color: '#FFFFFF', fontSize: 28, fontWeight: '700', marginTop: 4, fontFamily: 'Courier' },
  cashPercent: { color: '#FFFFFF80', fontSize: 12, marginTop: 4 },
  assetSubRow: { flexDirection: 'row', marginTop: 16, gap: 12 },
  assetSubCard: {
    flex: 1, backgroundColor: '#FFFFFF20', borderRadius: 12, padding: 12,
  },
  assetSubLabel: { fontSize: 12, color: '#FFFFFF80' },
  assetSubValue: {
    fontSize: 16, fontWeight: '700', color: '#FFFFFF', marginTop: 4,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8F9FA', marginHorizontal: 16, marginTop: 12,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#191919' },

  actionRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  actionBtn: {
    flex: 1, backgroundColor: '#F8F9FA', borderRadius: 10,
    paddingVertical: 10, alignItems: 'center',
  },
  actionBtnPrimary: { backgroundColor: '#0066FF' },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#191919' },
  actionBtnTextPrimary: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },

  marketFilter: {
    flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 16,
  },
  marketBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  marketBtnActive: { backgroundColor: '#191919' },
  marketText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  marketTextActive: { color: '#FFFFFF', fontWeight: '600' },

  sortRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 16, marginBottom: 8,
  },
  sortLabel: { fontSize: 13, fontWeight: '600', color: '#191919' },
  sortBtns: { flexDirection: 'row', gap: 4 },
  sortBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sortBtnActive: { backgroundColor: '#F2F2F7' },
  sortBtnText: { fontSize: 12, color: '#B0B8C1' },
  sortBtnTextActive: { color: '#191919', fontWeight: '600' },

  holdingList: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 12, overflow: 'hidden',
  },
  holdingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 4,
  },
  holdingBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  holdingName: { fontSize: 15, fontWeight: '700', color: '#191919' },
  holdingQty: { fontSize: 13, color: '#8E8E93', marginTop: 2 },
  holdingEval: { fontSize: 15, fontWeight: '700', color: '#191919' },
  holdingPnl: { fontSize: 13, fontWeight: '600', marginTop: 2 },

  emptyBox: {
    alignItems: 'center', marginHorizontal: 16, marginTop: 24,
    backgroundColor: '#F8F9FA', borderRadius: 16, padding: 24,
  },
  emptyEmoji: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 14, color: '#8E8E93', textAlign: 'center', lineHeight: 20 },
  emptyBtn: {
    marginTop: 16, backgroundColor: '#0066FF', borderRadius: 12,
    paddingHorizontal: 24, height: 44, justifyContent: 'center',
  },
  emptyBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },

  marketListHeader: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  marketListTitle: { fontSize: 15, fontWeight: '700', color: '#191919' },
});
