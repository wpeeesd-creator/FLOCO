import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppStore, STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';
import { BottomSheet, Button, Toast, Colors } from '../components/ui';

type StockTab = '보유' | '관심';
type MarketFilter = '전체' | '국내' | '미국';

// 관심 종목 더미
const WATCHLIST_TICKERS = [
  'AAPL', 'NVDA', 'TSLA', 'MSFT', '005930', '000660', '035720', 'META', 'AMZN', 'GOOGL',
];

export default function StockScreen() {
  const navigation = useNavigation<any>();
  const { holdings, cash, getTotalValue, getReturnRate, buyStock, sellStock } = useAppStore();

  const [tab, setTab] = useState<StockTab>('보유');
  const [market, setMarket] = useState<MarketFilter>('전체');
  const [search, setSearch] = useState('');
  const [sheetTicker, setSheetTicker] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
    }
  }, []);

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch (error) {
    // ignore
  }
  const profit = totalValue - 1_000_000;
  const isUp = profit >= 0;

  const safeHoldings = holdings ?? [];
  const holdingsData = safeHoldings
    .map(h => {
      const stock = STOCKS.find(s => s.ticker === h.ticker);
      if (!stock) return null;
      const evalAmt = (stock.price ?? 0) * (h.qty ?? 0);
      const pnlAmt = ((stock.price ?? 0) - (h.avgPrice ?? 0)) * (h.qty ?? 0);
      const pnlRate =
        (h.avgPrice ?? 0) > 0
          ? (((stock.price ?? 0) - (h.avgPrice ?? 0)) / (h.avgPrice ?? 0)) * 100
          : 0;
      return { ...h, stock, evalAmt, pnlAmt, pnlRate };
    })
    .filter(Boolean) as Array<{
      ticker: string;
      qty: number;
      avgPrice: number;
      stock: typeof STOCKS[0];
      evalAmt: number;
      pnlAmt: number;
      pnlRate: number;
    }>;

  const filteredHoldings = holdingsData.filter(h => {
    const matchesMarket =
      market === '전체' ||
      (market === '국내' && h.stock.market === '한국') ||
      (market === '미국' && h.stock.market === '미국');
    const matchesSearch =
      search.trim() === '' ||
      h.stock.name.toLowerCase().includes(search.toLowerCase()) ||
      h.ticker.toLowerCase().includes(search.toLowerCase());
    return matchesMarket && matchesSearch;
  });

  const watchlist = WATCHLIST_TICKERS.map(t => STOCKS.find(s => s.ticker === t)).filter(
    (s): s is typeof STOCKS[0] => !!s,
  );

  const filteredWatchlist = watchlist.filter(s => {
    const matchesMarket =
      market === '전체' ||
      (market === '국내' && s.market === '한국') ||
      (market === '미국' && s.market === '미국');
    const matchesSearch =
      search.trim() === '' ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ticker.toLowerCase().includes(search.toLowerCase());
    return matchesMarket && matchesSearch;
  });

  const sheetStock = sheetTicker ? STOCKS.find(s => s.ticker === sheetTicker) : null;
  const sheetHolding = sheetTicker ? safeHoldings.find(h => h.ticker === sheetTicker) : null;
  const totalAmt = sheetStock ? sheetStock.price * qty : 0;
  const fee = Math.round(totalAmt * 0.001);
  const fmtPrice = (v: number) =>
    sheetStock?.krw ? `₩${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`;

  const openSheet = (ticker: string, type: 'buy' | 'sell') => {
    setSheetTicker(ticker);
    setTradeType(type);
    setQty(1);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleConfirm = async () => {
    if (!sheetTicker || !sheetStock) return;
    if (tradeType === 'sell' && (!sheetHolding || sheetHolding.qty < qty)) {
      showToast('보유 수량을 초과할 수 없습니다', 'error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setSheetTicker(null);
    const result = await (tradeType === 'buy'
      ? buyStock(sheetTicker, qty, sheetStock.price)
      : sellStock(sheetTicker, qty, sheetStock.price));
    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        tradeType === 'buy' ? '매수 완료' : '매도 완료',
        `${sheetStock.name} ${qty}주를 ${tradeType === 'buy' ? '매수' : '매도'}했습니다!`,
      );
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(result.message, 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>

        {/* ── Header ─────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>증권</Text>
        </View>

        {/* ── 보유 | 관심 탭 ──────────────────────────── */}
        <View style={styles.tabRow}>
          {(['보유', '관심'] as StockTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 32 }}
        >

          {/* ── 검색창 ──────────────────────────────── */}
          <View style={styles.searchWrapper}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="종목명 또는 티커 검색"
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>

          {/* ── 국내 / 미국 필터 (pill) ─────────────── */}
          <View style={styles.pillRow}>
            {(['전체', '국내', '미국'] as MarketFilter[]).map(m => (
              <TouchableOpacity
                key={m}
                style={[styles.pill, market === m && styles.pillActive]}
                onPress={() => setMarket(m)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pillText, market === m && styles.pillTextActive]}>{m}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === '보유' ? (
            <>
              {/* ── 총 평가금액 카드 ──────────────────── */}
              <View style={styles.assetCard}>
                <Text style={styles.assetLabel}>총 평가금액</Text>
                <Text style={styles.assetValue}>
                  ₩{Math.round(totalValue).toLocaleString()}
                </Text>
                <View style={styles.assetRow}>
                  <Text style={[styles.assetPnl, { color: isUp ? Colors.green : Colors.red }]}>
                    {isUp ? '+' : ''}₩{Math.round(profit).toLocaleString()}
                  </Text>
                  <View
                    style={[
                      styles.assetBadge,
                      { backgroundColor: isUp ? Colors.greenBg : Colors.redBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.assetBadgeText,
                        { color: isUp ? Colors.green : Colors.red },
                      ]}
                    >
                      {isUp ? '▲' : '▼'} {Math.abs(returnRate).toFixed(2)}%
                    </Text>
                  </View>
                </View>
              </View>

              {/* ── 보유 종목 리스트 ─────────────────── */}
              {filteredHoldings.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>📊</Text>
                  <Text style={styles.emptyTitle}>보유 종목이 없어요</Text>
                  <Text style={styles.emptyDesc}>종목을 검색해서 매수해보세요</Text>
                </View>
              ) : (
                <View style={styles.listCard}>
                  {filteredHoldings.map((h, i) => {
                    const hUp = h.pnlRate >= 0;
                    return (
                      <TouchableOpacity
                        key={h.ticker}
                        style={[
                          styles.stockRow,
                          i < filteredHoldings.length - 1 && styles.stockDivider,
                        ]}
                        onPress={() => navigation.navigate('종목상세', { ticker: h.ticker })}
                        activeOpacity={0.7}
                      >
                        <StockLogo ticker={h.ticker} size={44} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.stockName}>{h.stock.name}</Text>
                          <Text style={styles.stockSub}>{h.qty}주</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.stockPrice}>
                            {h.stock.krw
                              ? `₩${Math.round(h.evalAmt).toLocaleString()}`
                              : `$${h.evalAmt.toFixed(2)}`}
                          </Text>
                          <Text
                            style={[
                              styles.stockChange,
                              { color: hUp ? Colors.green : Colors.red },
                            ]}
                          >
                            {hUp ? '+' : ''}
                            {h.pnlRate.toFixed(2)}%
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.tradeBtn, { backgroundColor: Colors.red }]}
                          onPress={() => openSheet(h.ticker, 'sell')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tradeBtnText}>매도</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            /* ── 관심 종목 리스트 ─────────────────────── */
            <>
              {filteredWatchlist.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={{ fontSize: 40, marginBottom: 8 }}>⭐</Text>
                  <Text style={styles.emptyTitle}>관심 종목이 없어요</Text>
                  <Text style={styles.emptyDesc}>검색 결과가 없습니다</Text>
                </View>
              ) : (
                <View style={styles.listCard}>
                  {filteredWatchlist.map((s, i) => {
                    const sUp = s.change >= 0;
                    return (
                      <TouchableOpacity
                        key={s.ticker}
                        style={[
                          styles.stockRow,
                          i < filteredWatchlist.length - 1 && styles.stockDivider,
                        ]}
                        onPress={() => navigation.navigate('종목상세', { ticker: s.ticker })}
                        activeOpacity={0.7}
                      >
                        <StockLogo ticker={s.ticker} size={44} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.stockName}>{s.name}</Text>
                          <Text style={styles.stockSub}>{s.ticker}</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.stockPrice}>
                            {s.krw ? `₩${s.price.toLocaleString()}` : `$${s.price.toFixed(2)}`}
                          </Text>
                          <View
                            style={[
                              styles.changeBadge,
                              { backgroundColor: sUp ? Colors.greenBg : Colors.redBg },
                            ]}
                          >
                            <Text
                              style={[
                                styles.changeText,
                                { color: sUp ? Colors.green : Colors.red },
                              ]}
                            >
                              {sUp ? '+' : ''}
                              {s.change.toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={[styles.tradeBtn, { backgroundColor: Colors.green }]}
                          onPress={() => openSheet(s.ticker, 'buy')}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.tradeBtnText}>매수</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* ── Trade Bottom Sheet ──────────────────────── */}
        <BottomSheet
          visible={!!sheetTicker}
          onClose={() => setSheetTicker(null)}
          title={tradeType === 'buy' ? '매수 주문' : '매도 주문'}
        >
          {sheetStock && (
            <View style={{ gap: 14 }}>
              {/* 종목명 + 현재가 */}
              <View style={styles.sheetRow}>
                <Text style={styles.sheetStockName}>{sheetStock.name}</Text>
                <Text style={styles.sheetStockPrice}>{fmtPrice(sheetStock.price)}</Text>
              </View>

              {/* 매수 / 매도 토글 */}
              <View style={styles.tradeToggle}>
                {(['buy', 'sell'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.toggleBtn,
                      tradeType === t && {
                        backgroundColor: t === 'buy' ? Colors.green : Colors.red,
                      },
                    ]}
                    onPress={() => setTradeType(t)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.toggleText,
                        tradeType === t && { color: '#fff' },
                      ]}
                    >
                      {t === 'buy' ? '매수' : '매도'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 수량 조절 */}
              <View style={styles.qtyRow}>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(q => Math.max(1, q - 1))}
                  activeOpacity={0.8}
                >
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.qtyValue}>{qty}주</Text>
                <TouchableOpacity
                  style={styles.qtyBtn}
                  onPress={() => setQty(q => q + 1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>

              {/* 주문 요약 */}
              <View style={styles.summaryBox}>
                <View style={styles.sheetRow}>
                  <Text style={styles.summaryLabel}>주문 금액</Text>
                  <Text style={styles.summaryValue}>{fmtPrice(totalAmt)}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={styles.summaryLabelSub}>수수료 (0.1%)</Text>
                  <Text style={styles.summaryValueSub}>{fmtPrice(fee)}</Text>
                </View>
                <View style={[styles.sheetRow, styles.summaryTotal]}>
                  <Text style={styles.summaryTotalLabel}>
                    총 {tradeType === 'buy' ? '결제' : '수령'} 금액
                  </Text>
                  <Text
                    style={[
                      styles.summaryTotalValue,
                      { color: tradeType === 'buy' ? Colors.green : Colors.red },
                    ]}
                  >
                    {fmtPrice(tradeType === 'buy' ? totalAmt + fee : totalAmt - fee)}
                  </Text>
                </View>
              </View>

              <Text style={styles.sheetHint}>
                {tradeType === 'buy'
                  ? `사용 가능: ₩${Math.round(cash).toLocaleString()}`
                  : `보유: ${sheetHolding?.qty ?? 0}주`}
              </Text>

              <Button
                title="응, 결정했어!"
                onPress={handleConfirm}
                variant={tradeType === 'buy' ? 'primary' : 'danger'}
                fullWidth
                size="lg"
              />
            </View>
          )}
        </BottomSheet>

        <Toast message={toast.message} type={toast.type} visible={toast.visible} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.bg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },

  // 보유 | 관심 탭 (underline style)
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  tabBtn: {
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textSub,
  },
  tabTextActive: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },

  // 검색창
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
  },

  // 국내 / 미국 pill 필터
  pillRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 16,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSub,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // 총 평가금액 카드
  assetCard: {
    marginHorizontal: 20,
    marginBottom: 12,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
  },
  assetLabel: {
    fontSize: 13,
    color: Colors.textSub,
  },
  assetValue: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    fontFamily: 'Courier',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  assetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  assetPnl: {
    fontSize: 14,
    fontWeight: '600',
  },
  assetBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  assetBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // 종목 리스트 카드
  listCard: {
    marginHorizontal: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    height: 64,
  },
  stockDivider: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stockName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  stockSub: {
    fontSize: 12,
    color: Colors.textSub,
    marginTop: 2,
  },
  stockPrice: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Courier',
  },
  stockChange: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  changeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  changeText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 빠른 매수/매도 버튼
  tradeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    marginLeft: 4,
  },
  tradeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // 빈 상태
  emptyBox: {
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 48,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyDesc: {
    fontSize: 13,
    color: Colors.textSub,
    marginTop: 4,
  },

  // Bottom Sheet 내부
  sheetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sheetStockName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  sheetStockPrice: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Courier',
    color: Colors.text,
  },
  tradeToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.bg,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSub,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  qtyBtn: {
    width: 52,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  qtyBtnText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.primary,
  },
  qtyValue: {
    fontSize: 20,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
    color: Colors.text,
  },
  summaryBox: {
    backgroundColor: Colors.bg,
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSub,
  },
  summaryValue: {
    fontSize: 14,
    fontFamily: 'Courier',
    color: Colors.text,
  },
  summaryLabelSub: {
    fontSize: 12,
    color: Colors.inactive,
  },
  summaryValueSub: {
    fontSize: 12,
    color: Colors.inactive,
    fontFamily: 'Courier',
  },
  summaryTotal: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 10,
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Courier',
  },
  sheetHint: {
    fontSize: 12,
    color: Colors.textSub,
    textAlign: 'center',
  },
});
