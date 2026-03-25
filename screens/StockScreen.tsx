import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppStore, STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';
import { BottomSheet, Button, Toast } from '../components/ui';

type StockTab = '보유' | '관심';
type MarketFilter = '전체' | '한국' | '미국';

// 관심 종목 더미
const WATCHLIST_TICKERS = ['AAPL', 'NVDA', 'TSLA', 'MSFT', '005930', '000660', '035720', 'META', 'AMZN', 'GOOGL'];

export default function StockScreen() {
  const navigation = useNavigation<any>();
  const { holdings, cash, getTotalValue, getReturnRate, buyStock, sellStock } = useAppStore();
  const [tab, setTab] = useState<StockTab>('보유');
  const [market, setMarket] = useState<MarketFilter>('전체');
  const [sheetTicker, setSheetTicker] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState({ visible: false, message: '', type: 'info' as 'success' | 'error' | 'info' });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('StockScreen 마운트');
    try {
      console.log('holdings:', holdings);
      console.log('cash:', cash);
      setIsLoading(false);
    } catch (error) {
      console.error('StockScreen 초기화 오류:', error);
      setIsLoading(false);
    }
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

  console.log('StockScreen 렌더링 시작');

  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch (error) {
    console.error('StockScreen 자산 계산 오류:', error);
  }
  const profit = totalValue - 1_000_000;
  const stockValue = totalValue - (cash ?? 0);
  const isUp = profit >= 0;

  const safeHoldings = holdings ?? [];
  const holdingsData = safeHoldings.map(h => {
    const stock = STOCKS.find(s => s.ticker === h.ticker);
    if (!stock) return null;
    const evalAmt = (stock.price ?? 0) * (h.qty ?? 0);
    const pnlAmt = ((stock.price ?? 0) - (h.avgPrice ?? 0)) * (h.qty ?? 0);
    const pnlRate = (h.avgPrice ?? 0) > 0 ? (((stock.price ?? 0) - (h.avgPrice ?? 0)) / (h.avgPrice ?? 0)) * 100 : 0;
    return { ...h, stock, evalAmt, pnlAmt, pnlRate };
  }).filter(Boolean) as Array<{ ticker: string; qty: number; avgPrice: number; stock: typeof STOCKS[0]; evalAmt: number; pnlAmt: number; pnlRate: number }>;

  const filteredHoldings = holdingsData.filter(h => {
    if (market === '전체') return true;
    return h.stock.market === market;
  });

  const watchlist = WATCHLIST_TICKERS.map(t => STOCKS.find(s => s.ticker === t)).filter((s): s is typeof STOCKS[0] => !!s);

  const sheetStock = sheetTicker ? STOCKS.find(s => s.ticker === sheetTicker) : null;
  const sheetHolding = sheetTicker ? safeHoldings.find(h => h.ticker === sheetTicker) : null;
  const totalAmt = sheetStock ? sheetStock.price * qty : 0;
  const fee = Math.round(totalAmt * 0.001);
  const fmtPrice = (v: number) => sheetStock?.krw ? `₩${Math.round(v).toLocaleString()}` : `$${v.toFixed(2)}`;

  const openSheet = (ticker: string, type: 'buy' | 'sell') => {
    setSheetTicker(ticker); setTradeType(type); setQty(1);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast(t => ({ ...t, visible: false })), 2500);
  };

  const handleConfirm = async () => {
    if (!sheetTicker || !sheetStock) return;
    // 공매도 방지
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
        tradeType === 'buy' ? '✅ 매수 완료' : '✅ 매도 완료',
        `${sheetStock.name} ${qty}주를 ${tradeType === 'buy' ? '매수' : '매도'}했습니다!`,
      );
    } else {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast(result.message, 'error');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>증권</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['보유', '관심'] as StockTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
          {tab === '보유' ? (
            <>
              {/* Total Asset Card */}
              <View style={styles.assetCard}>
                <Text style={styles.assetLabel}>총 평가금액</Text>
                <Text style={styles.assetValue}>₩{Math.round(totalValue).toLocaleString()}</Text>
                <View style={styles.assetRow}>
                  <Text style={[styles.assetPnl, { color: isUp ? '#FF3B30' : '#3182F6' }]}>
                    {isUp ? '+' : ''}₩{Math.round(profit).toLocaleString()}
                  </Text>
                  <View style={[styles.assetBadge, { backgroundColor: isUp ? '#FFF0F1' : '#EBF2FF' }]}>
                    <Text style={[styles.assetBadgeText, { color: isUp ? '#FF3B30' : '#3182F6' }]}>
                      {isUp ? '▲' : '▼'} {Math.abs(returnRate).toFixed(2)}%
                    </Text>
                  </View>
                </View>

                {/* Market Filter */}
                <View style={styles.marketRow}>
                  {(['전체', '한국', '미국'] as MarketFilter[]).map(m => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.marketBtn, market === m && styles.marketBtnActive]}
                      onPress={() => setMarket(m)}
                    >
                      <Text style={[styles.marketText, market === m && styles.marketTextActive]}>{m}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Holdings List */}
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
                        style={[styles.stockRow, i < filteredHoldings.length - 1 && styles.stockBorder]}
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
                            {h.stock.krw ? `₩${Math.round(h.evalAmt).toLocaleString()}` : `$${h.evalAmt.toFixed(2)}`}
                          </Text>
                          <View style={{ flexDirection: 'row', gap: 6, marginTop: 2 }}>
                            <Text style={[styles.stockPnl, { color: hUp ? '#FF3B30' : '#3182F6' }]}>
                              {hUp ? '+' : ''}{h.pnlRate.toFixed(2)}%
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={styles.quickBtn}
                          onPress={() => openSheet(h.ticker, 'sell')}
                        >
                          <Text style={styles.quickBtnText}>매도</Text>
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            /* 관심 탭 */
            <View style={styles.listCard}>
              {watchlist.map((s, i) => {
                const sUp = s.change >= 0;
                return (
                  <TouchableOpacity
                    key={s.ticker}
                    style={[styles.stockRow, i < watchlist.length - 1 && styles.stockBorder]}
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
                      <View style={[styles.changeBadge, { backgroundColor: sUp ? '#FFF0F1' : '#EBF2FF' }]}>
                        <Text style={[styles.changeText, { color: sUp ? '#FF3B30' : '#3182F6' }]}>
                          {sUp ? '+' : ''}{s.change.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.quickBtn, { backgroundColor: '#FF3B30' }]}
                      onPress={() => openSheet(s.ticker, 'buy')}
                    >
                      <Text style={styles.quickBtnText}>매수</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Trade Bottom Sheet */}
        <BottomSheet
          visible={!!sheetTicker}
          onClose={() => setSheetTicker(null)}
          title={tradeType === 'buy' ? '매수 주문' : '매도 주문'}
        >
          {sheetStock && (
            <View style={{ gap: 14 }}>
              <View style={styles.sheetRow}>
                <Text style={{ fontSize: 15, fontWeight: '600' }}>{sheetStock.name}</Text>
                <Text style={{ fontSize: 15, fontWeight: '700', fontFamily: 'Courier' }}>{fmtPrice(sheetStock.price)}</Text>
              </View>
              <View style={styles.tradeToggle}>
                {(['buy', 'sell'] as const).map(t => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.toggleBtn, tradeType === t && (t === 'buy' ? { backgroundColor: '#FF3B30' } : { backgroundColor: '#3182F6' })]}
                    onPress={() => setTradeType(t)}
                  >
                    <Text style={[styles.toggleText, tradeType === t && { color: '#fff' }]}>
                      {t === 'buy' ? '매수' : '매도'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.qtyRow}>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => Math.max(1, q - 1))}>
                  <Text style={styles.qtyBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', flex: 1, textAlign: 'center' }}>{qty}주</Text>
                <TouchableOpacity style={styles.qtyBtn} onPress={() => setQty(q => q + 1)}>
                  <Text style={styles.qtyBtnText}>+</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.summaryBox}>
                <View style={styles.sheetRow}>
                  <Text style={{ fontSize: 13, color: '#8E8E93' }}>주문 금액</Text>
                  <Text style={{ fontSize: 14, fontFamily: 'Courier' }}>{fmtPrice(totalAmt)}</Text>
                </View>
                <View style={styles.sheetRow}>
                  <Text style={{ fontSize: 12, color: '#B0B8C1' }}>수수료 (0.1%)</Text>
                  <Text style={{ fontSize: 12, color: '#B0B8C1', fontFamily: 'Courier' }}>{fmtPrice(fee)}</Text>
                </View>
                <View style={[styles.sheetRow, { borderTopWidth: 1, borderTopColor: '#F2F2F7', paddingTop: 10, marginTop: 4 }]}>
                  <Text style={{ fontSize: 15, fontWeight: '700' }}>총 {tradeType === 'buy' ? '결제' : '수령'} 금액</Text>
                  <Text style={{ fontSize: 16, fontWeight: '700', fontFamily: 'Courier', color: tradeType === 'buy' ? '#FF3B30' : '#3182F6' }}>
                    {fmtPrice(tradeType === 'buy' ? totalAmt + fee : totalAmt - fee)}
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: '#8E8E93', textAlign: 'center' }}>
                {tradeType === 'buy'
                  ? `사용 가능: ₩${Math.round(cash).toLocaleString()}`
                  : `보유: ${sheetHolding?.qty ?? 0}주`}
              </Text>
              <Button
                title="응, 결정했어!"
                onPress={handleConfirm}
                variant={tradeType === 'buy' ? 'primary' : 'danger'}
                fullWidth size="lg"
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#191919' },

  tabRow: {
    flexDirection: 'row', paddingHorizontal: 16,
    borderBottomWidth: 1, borderBottomColor: '#F2F2F7',
  },
  tabBtn: {
    paddingVertical: 12, paddingHorizontal: 20,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#191919' },
  tabText: { fontSize: 15, color: '#8E8E93', fontWeight: '500' },
  tabTextActive: { color: '#191919', fontWeight: '700' },

  assetCard: {
    marginHorizontal: 16, marginTop: 16,
    backgroundColor: '#F8F9FA', borderRadius: 16, padding: 20,
  },
  assetLabel: { fontSize: 13, color: '#8E8E93' },
  assetValue: {
    fontSize: 28, fontWeight: '700', color: '#191919',
    fontFamily: 'Courier', letterSpacing: -1, marginTop: 4,
  },
  assetRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  assetPnl: { fontSize: 14, fontWeight: '600' },
  assetBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  assetBadgeText: { fontSize: 13, fontWeight: '700' },
  marketRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  marketBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#FFFFFF' },
  marketBtnActive: { backgroundColor: '#191919' },
  marketText: { fontSize: 13, color: '#8E8E93', fontWeight: '500' },
  marketTextActive: { color: '#FFFFFF', fontWeight: '600' },

  listCard: {
    marginHorizontal: 16, marginTop: 12, backgroundColor: '#FFFFFF',
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F2F2F7',
  },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  stockBorder: { borderBottomWidth: 1, borderBottomColor: '#F2F2F7' },
  stockName: { fontSize: 15, fontWeight: '600', color: '#191919' },
  stockSub: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  stockPrice: { fontSize: 15, fontWeight: '600', color: '#191919', fontFamily: 'Courier' },
  stockPnl: { fontSize: 12, fontWeight: '700' },
  changeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 2 },
  changeText: { fontSize: 11, fontWeight: '700' },

  emptyBox: {
    alignItems: 'center', marginHorizontal: 16, marginTop: 40,
    backgroundColor: '#F8F9FA', borderRadius: 16, padding: 40,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#191919' },
  emptyDesc: { fontSize: 13, color: '#8E8E93', marginTop: 4 },

  quickBtn: {
    backgroundColor: '#3182F6', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, marginLeft: 8,
  },
  quickBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  sheetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tradeToggle: { flexDirection: 'row', backgroundColor: '#F2F2F7', borderRadius: 10, padding: 3, gap: 3 },
  toggleBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  qtyRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#F2F2F7', borderRadius: 12, overflow: 'hidden',
  },
  qtyBtn: { width: 52, height: 48, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F9FA' },
  qtyBtnText: { fontSize: 22, fontWeight: '700', color: '#0066FF' },
  summaryBox: { backgroundColor: '#F8F9FA', borderRadius: 12, padding: 14, gap: 8 },
});
