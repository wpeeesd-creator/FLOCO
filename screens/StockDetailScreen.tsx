/**
 * 종목 상세 화면 — 토스증권 디자인 시스템
 * 실시간 가격 조회 + 매수/매도 Bottom Sheet
 */

import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  TouchableOpacity, ActivityIndicator, Alert, Linking, Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, updateDoc, arrayUnion, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useAppStore, STOCKS } from '../store/appStore';
import { Colors, Typography, Button, Badge, ReturnBadge, Card } from '../components/ui';
import { getCacheAge } from '../lib/priceService';
import { useStockPrice } from '../hooks/useStockPrice';
import { TERM_TO_COURSE } from '../data/learningContent';
import { StockChart } from '../components/StockChart';
import StockLogo from '../components/StockLogo';
import { fetchStockNews, formatNewsTime, type NewsItem } from '../lib/newsService';

// ── 디자인 토큰 ──────────────────────────────────
const DS = {
  bg: '#F2F4F6',
  card: '#FFFFFF',
  primary: '#0066FF',
  rise: '#F04452',   // 상승 = 빨강
  fall: '#2175F3',   // 하락 = 파랑
  text: '#191F28',
  textSub: '#8B95A1',
  border: '#E5E8EB',
  radius: 12,
};

// ── userData 타입 ──────────────────────────────────
interface UserData {
  balance?: number;
  totalAsset?: number;
  portfolio?: Array<{
    ticker: string;
    name: string;
    quantity: number;
    avgPrice: number;
    price: number;
    sector?: string;
    change?: number;
    bg?: string;
    logo?: string;
  }>;
  transactions?: Array<Record<string, any>>;
}

export default function StockDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const ticker = route.params?.ticker ?? 'AAPL';
  const { cash, holdings, trades } = useAppStore();

  const stock = STOCKS.find(s => s.ticker === ticker);

  if (!stock) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>😢</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: DS.text }}>종목 정보를 불러올 수 없어요</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: DS.primary, fontSize: 15, fontWeight: '600' }}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  const safeHoldings = holdings ?? [];
  const safeTrades = trades ?? [];
  const holding = safeHoldings.find(h => h.ticker === ticker);
  const recentTrades = safeTrades.filter(t => t.ticker === ticker).slice(-5).reverse();

  // ── 실시간 가격 (TanStack Query — 10분 캐시) ──
  const { data: priceData, isLoading: priceLoading, refetch: loadPrice } =
    useStockPrice(ticker, stock?.krw ?? false);

  // ── 주문 상태 ──────────────────────────────────
  const [sheetTicker, setSheetTicker] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [screenLoading, setScreenLoading] = useState(true);
  const [stockNews, setStockNews] = useState<NewsItem[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

  // ── Firestore users/{uid} 실시간 리스너 ──────────
  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setUserData({
          balance: data.balance ?? 1_000_000,
          totalAsset: data.totalAsset ?? 1_000_000,
          portfolio: Array.isArray(data.portfolio) ? data.portfolio : [],
          transactions: Array.isArray(data.transactions) ? data.transactions : [],
        });
      }
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    try {
      setScreenLoading(false);
    } catch (error) {
      setScreenLoading(false);
    }
  }, []);

  useEffect(() => {
    if (stock) {
      fetchStockNews(ticker, stock.name)
        .then(news => setStockNews(news.slice(0, 3)))
        .catch(() => setStockNews([]));
    }
  }, [ticker]);

  if (screenLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DS.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={DS.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!stock) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DS.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16 }}>
          <Text style={Typography.h2}>종목을 찾을 수 없어요</Text>
          <Button title="돌아가기" onPress={() => navigation.goBack()} />
        </View>
      </SafeAreaView>
    );
  }

  const livePrice = priceData?.price ?? stock?.price ?? 0;
  const liveChange = priceData?.change ?? stock?.change ?? 0;

  const sheetStock = sheetTicker ? STOCKS.find(s => s.ticker === sheetTicker) ?? null : null;
  const price = livePrice || (sheetStock?.price ?? 0);
  const totalAmt = price * qty;
  const fee = Math.round(totalAmt * 0.001);
  const remainingBalance = cash - (totalAmt + fee);
  const holdingQty = holding?.qty ?? 0;

  const subtotal = livePrice * qty;
  const totalBuy = subtotal + fee;
  const totalSell = subtotal - fee;

  const gainRate = holding ? ((livePrice - holding.avgPrice) / holding.avgPrice * 100) : 0;
  const gainAmt = holding ? (livePrice - holding.avgPrice) * holding.qty : 0;
  const fmt = (n: number) => stock.krw ? `₩${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;
  const fmtPrice = (n: number) => stock.krw ? `₩${Math.round(n).toLocaleString()}` : `$${n.toFixed(2)}`;

  const isRise = liveChange >= 0;
  const changeColor = isRise ? DS.rise : DS.fall;

  function showErrorToast(msg: string) {
    setToast(msg);
    setToastType('error');
    setTimeout(() => setToast(''), 2500);
  }

  function openSheet(type: 'buy' | 'sell') {
    if (type === 'sell' && (!holding || holding.qty === 0)) {
      showErrorToast('보유 수량이 없어요. 공매도는 불가합니다.');
      return;
    }
    setTradeType(type);
    setQty(1);
    setSheetTicker(ticker);
  }

  async function handleBuy() {
    if (!user?.id) return;
    try {
      const currentPrice = livePrice;
      const quantity = qty;
      const totalCost = Math.floor(currentPrice * quantity * 1.001);

      if ((userData?.balance ?? 0) < totalCost) {
        Alert.alert(
          '잔액 부족',
          `필요 금액: ${totalCost.toLocaleString()}원\n보유 현금: ${(userData?.balance ?? 0).toLocaleString()}원\n\n학습을 완료하고 자산을 늘려보세요!`
        );
        return;
      }

      const existingStock = userData?.portfolio?.find(
        p => p.ticker === stock.ticker
      );

      const newPortfolio = existingStock
        ? (userData?.portfolio ?? []).map(p =>
            p.ticker === stock.ticker
              ? {
                  ...p,
                  quantity: p.quantity + quantity,
                  avgPrice: Math.floor(
                    (p.avgPrice * p.quantity + currentPrice * quantity) /
                    (p.quantity + quantity)
                  ),
                  price: currentPrice,
                }
              : p
          )
        : [
            ...(userData?.portfolio ?? []),
            {
              ticker: stock.ticker,
              name: stock.name,
              quantity,
              avgPrice: currentPrice,
              price: currentPrice,
              sector: stock.sector ?? '기타',
              change: stock.change ?? 0,
              bg: '#8E8E93',
              logo: stock.logo ?? '',
            },
          ];

      const newBalance = (userData?.balance ?? 0) - totalCost;
      const portfolioValue = newPortfolio.reduce(
        (sum, p) => sum + (p.price ?? p.avgPrice) * p.quantity, 0
      );
      const newTotalAsset = newBalance + portfolioValue;

      // Firestore users/{uid} 직접 업데이트 → HomeScreen onSnapshot 자동 반영
      await updateDoc(doc(db, 'users', user.id), {
        balance: newBalance,
        totalAsset: newTotalAsset,
        portfolio: newPortfolio,
        transactions: arrayUnion({
          type: 'buy',
          ticker: stock.ticker,
          stockName: stock.name,
          quantity,
          price: currentPrice,
          total: totalCost,
          fee: Math.floor(currentPrice * quantity * 0.001),
          createdAt: new Date().toISOString(),
        }),
      });

      // appStore 동기화 (Zustand 상태도 최신으로 유지)
      const newHoldings = newPortfolio.map(p => ({
        ticker: p.ticker,
        qty: p.quantity,
        avgPrice: p.avgPrice,
      }));
      useAppStore.setState({ cash: newBalance, holdings: newHoldings });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheetTicker(null);
      setQty(1);
      setToastMessage(`${stock.name} ${quantity}주 매수 완료!`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error('매수 오류:', error);
      Alert.alert('오류', '매수 중 오류가 발생했어요');
    }
  }

  async function handleSell() {
    if (!user?.id) return;
    try {
      const currentPrice = livePrice;
      const quantity = qty;

      const ownedStock = userData?.portfolio?.find(
        p => p.ticker === stock.ticker
      );

      if (!ownedStock || ownedStock.quantity < quantity) {
        Alert.alert(
          '보유 수량 부족',
          `보유 수량: ${ownedStock?.quantity ?? 0}주\n매도 요청: ${quantity}주`
        );
        return;
      }

      const sellAmount = Math.floor(currentPrice * quantity * 0.999);
      const profit = Math.floor(
        (currentPrice - ownedStock.avgPrice) * quantity
      );

      const newPortfolio = ownedStock.quantity === quantity
        ? (userData?.portfolio ?? []).filter(
            p => p.ticker !== stock.ticker
          )
        : (userData?.portfolio ?? []).map(p =>
            p.ticker === stock.ticker
              ? { ...p, quantity: p.quantity - quantity }
              : p
          );

      const newBalance = (userData?.balance ?? 0) + sellAmount;
      const portfolioValue = newPortfolio.reduce(
        (sum, p) => sum + (p.price ?? p.avgPrice) * p.quantity, 0
      );
      const newTotalAsset = newBalance + portfolioValue;

      await updateDoc(doc(db, 'users', user.id), {
        balance: newBalance,
        totalAsset: newTotalAsset,
        portfolio: newPortfolio,
        transactions: arrayUnion({
          type: 'sell',
          ticker: stock.ticker,
          stockName: stock.name,
          quantity,
          price: currentPrice,
          avgPrice: ownedStock.avgPrice,
          total: sellAmount,
          profit,
          fee: Math.floor(currentPrice * quantity * 0.001),
          createdAt: new Date().toISOString(),
        }),
      });

      // appStore 동기화
      const newHoldings = newPortfolio.map(p => ({
        ticker: p.ticker,
        qty: p.quantity,
        avgPrice: p.avgPrice,
      }));
      useAppStore.setState({ cash: newBalance, holdings: newHoldings });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSheetTicker(null);
      setQty(1);
      setToastMessage(
        `${stock.name} ${quantity}주 매도 완료!\n${profit >= 0 ? '▲' : '▼'} ${Math.abs(profit).toLocaleString()}원`
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2500);
    } catch (error) {
      console.error('매도 오류:', error);
      Alert.alert('오류', '매도 중 오류가 발생했어요');
    }
  }

  // 투자자 의견 (더미 데이터)
  const opinion = { buy: 62, hold: 25, sell: 13 };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: DS.bg }}>
      <View style={styles.container}>

        {/* ── 헤더 ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerName}>{stock.name}</Text>
            <Text style={styles.headerSub}>{stock.ticker} · {stock.market}</Text>
          </View>

          <TouchableOpacity
            onPress={() => setIsFavorite(v => !v)}
            style={styles.favoriteBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={{ fontSize: 22, color: isFavorite ? '#F04452' : DS.border }}>
              {isFavorite ? '❤️' : '🤍'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* ── 현재가 카드 ── */}
          <View style={styles.priceCard}>
            <View style={styles.priceCardTop}>
              <View style={styles.priceLogoRow}>
                <StockLogo ticker={ticker} size={40} />
                <View style={{ gap: 2 }}>
                  <Text style={styles.priceCardName}>{stock.name}</Text>
                  <Text style={styles.priceCardSub}>{stock.ticker}</Text>
                </View>
              </View>
              {priceLoading ? (
                <ActivityIndicator size="small" color={DS.textSub} />
              ) : (
                <TouchableOpacity onPress={() => loadPrice()} style={styles.refreshBtn}>
                  <Text style={styles.refreshText}>
                    {priceData ? `${getCacheAge(priceData.updatedAt)} 갱신` : '새로고침'} ↺
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.priceValue}>{fmt(livePrice)}</Text>

            <View style={styles.priceRow}>
              <View style={[styles.changeBadge, { backgroundColor: isRise ? '#FFF0F1' : '#EBF2FF' }]}>
                <Text style={[styles.changeBadgeText, { color: changeColor }]}>
                  {isRise ? '▲' : '▼'} {Math.abs(liveChange).toFixed(2)}%
                </Text>
              </View>
              {priceData && !priceData.fromCache && (
                <Text style={styles.delayText}>5~15분 지연</Text>
              )}
            </View>
          </View>

          {/* ── 차트 ── */}
          {livePrice > 0 && (
            <View style={styles.chartWrapper}>
              <StockChart basePrice={livePrice} isKrw={stock.krw} />
            </View>
          )}

          {/* ── AI 분석 버튼 (머니몽) ── */}
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={() => navigation.navigate('AI분석', { ticker })}
              activeOpacity={0.8}
            >
              <Text style={styles.aiBtnIcon}>🐾</Text>
              <View>
                <Text style={styles.aiBtnTitle}>AI 종목 분석</Text>
                <Text style={styles.aiBtnSub}>머니몽에게 이 종목 물어보기</Text>
              </View>
              <Text style={styles.aiBtnChevron}>›</Text>
            </TouchableOpacity>
          </View>

          {/* ── 보유 현황 ── */}
          {holding && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>내 보유 현황</Text>
              <View style={styles.card}>
                <View style={styles.holdingGrid}>
                  {[
                    { label: '보유 수량', value: `${holding.qty}주` },
                    { label: '평균 단가', value: fmt(holding.avgPrice) },
                    { label: '평가 수익', value: `${gainAmt >= 0 ? '+' : ''}${fmt(gainAmt)}`, color: gainAmt >= 0 ? DS.rise : DS.fall },
                    { label: '수익률', value: `${gainRate >= 0 ? '+' : ''}${gainRate.toFixed(2)}%`, color: gainRate >= 0 ? DS.rise : DS.fall },
                  ].map(item => (
                    <View key={item.label} style={styles.holdingItem}>
                      <Text style={styles.holdingLabel}>{item.label}</Text>
                      <Text style={[styles.holdingValue, item.color ? { color: item.color } : {}]}>
                        {item.value}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* ── 투자 정보 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>투자 정보</Text>
            <View style={styles.card}>
              {[
                { label: '시가총액', value: 'N/A' },
                { label: 'PER (주가수익비율)', value: 'N/A', term: 'PER' },
                { label: 'PBR (주가순자산비율)', value: 'N/A', term: 'PBR' },
                { label: 'ROE (자기자본이익률)', value: 'N/A', term: 'ROE' },
                { label: '등락률', value: `${isRise ? '+' : ''}${liveChange.toFixed(2)}%`, valueColor: changeColor },
                { label: '수수료', value: '0.1% (시장가)' },
              ].map((item, idx, arr) => (
                <View
                  key={item.label}
                  style={[styles.infoRow, idx < arr.length - 1 && styles.infoRowBorder]}
                >
                  <View style={styles.infoLabelRow}>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                    {item.term && (
                      <TouchableOpacity
                        style={styles.helpBtn}
                        onPress={() => navigation.navigate('홈Tab', {
                          screen: '레슨',
                          params: { courseId: TERM_TO_COURSE[item.term!] },
                        })}
                      >
                        <Text style={styles.helpBtnText}>?</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <Text style={[styles.infoValue, item.valueColor ? { color: item.valueColor } : {}]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── 투자자 의견 ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>투자자 의견</Text>
            <View style={styles.card}>
              {/* 비율 바 */}
              <View style={styles.opinionBarRow}>
                <View style={[styles.opinionBar, { flex: opinion.buy, backgroundColor: DS.rise, borderTopLeftRadius: 4, borderBottomLeftRadius: 4 }]} />
                <View style={[styles.opinionBar, { flex: opinion.hold, backgroundColor: '#E5E8EB' }]} />
                <View style={[styles.opinionBar, { flex: opinion.sell, backgroundColor: DS.fall, borderTopRightRadius: 4, borderBottomRightRadius: 4 }]} />
              </View>
              <View style={styles.opinionLabels}>
                <View style={styles.opinionLabelItem}>
                  <View style={[styles.opinionDot, { backgroundColor: DS.rise }]} />
                  <Text style={styles.opinionLabel}>매수 {opinion.buy}%</Text>
                </View>
                <View style={styles.opinionLabelItem}>
                  <View style={[styles.opinionDot, { backgroundColor: '#E5E8EB' }]} />
                  <Text style={styles.opinionLabel}>보유 {opinion.hold}%</Text>
                </View>
                <View style={styles.opinionLabelItem}>
                  <View style={[styles.opinionDot, { backgroundColor: DS.fall }]} />
                  <Text style={styles.opinionLabel}>매도 {opinion.sell}%</Text>
                </View>
              </View>
            </View>
          </View>

          {/* ── 관련 뉴스 ── */}
          {stockNews.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>관련 뉴스</Text>
              <View style={styles.card}>
                {stockNews.map((news, idx) => (
                  <TouchableOpacity
                    key={news.id + idx}
                    onPress={() => news.url ? Linking.openURL(news.url) : null}
                    style={[styles.newsRow, idx < stockNews.length - 1 && styles.newsRowBorder]}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.newsTitle} numberOfLines={2}>{news.title}</Text>
                    <Text style={styles.newsMeta}>{news.source} · {formatNewsTime(news.publishedAt)}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* ── 최근 거래 내역 ── */}
          {recentTrades.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>내 거래 내역</Text>
              <View style={styles.card}>
                {recentTrades.map((t, idx) => (
                  <View
                    key={t.id}
                    style={[styles.tradeRow, idx < recentTrades.length - 1 && styles.infoRowBorder]}
                  >
                    <View style={[
                      styles.tradeBadge,
                      { backgroundColor: t.type === 'buy' ? '#FFF0F1' : '#EBF2FF' },
                    ]}>
                      <Text style={[
                        styles.tradeBadgeText,
                        { color: t.type === 'buy' ? DS.rise : DS.fall },
                      ]}>
                        {t.type === 'buy' ? '매수' : '매도'}
                      </Text>
                    </View>
                    <Text style={styles.tradeDetail}>{t.qty}주 · {fmt(t.price)}</Text>
                    <Text style={styles.tradeDate}>
                      {new Date(t.timestamp).toLocaleDateString('ko-KR')}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

        </ScrollView>

        {/* ── 하단 고정 버튼 ── */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: DS.rise }]}
            onPress={() => openSheet('buy')}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomBtnText}>매수</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bottomBtn, { backgroundColor: DS.fall }]}
            onPress={() => openSheet('sell')}
            activeOpacity={0.85}
          >
            <Text style={styles.bottomBtnText}>매도</Text>
          </TouchableOpacity>
        </View>

        {/* ── 오류 토스트 ── */}
        {toast !== '' && (
          <View style={[styles.errorToast, { backgroundColor: toastType === 'error' ? DS.fall : DS.rise }]}>
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        {/* ── 거래 완료 토스트 ── */}
        {showToast && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        )}

        {/* ── 매수/매도 Modal ── */}
        <Modal visible={!!sheetTicker} transparent animationType="slide" onRequestClose={() => setSheetTicker(null)}>
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setSheetTicker(null)} />
          <View style={styles.modalSheet}>
            {/* Handle bar */}
            <View style={styles.modalHandle} />

            {sheetStock && (
              <View style={{ gap: 16 }}>
                {/* Stock info row */}
                <View style={styles.sheetStockRow}>
                  <StockLogo ticker={sheetTicker!} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetStockName}>{sheetStock.name}</Text>
                    <Text style={styles.sheetStockTicker}>{sheetTicker}</Text>
                  </View>
                  <Text style={styles.sheetStockPrice}>{fmtPrice(livePrice || sheetStock.price)}</Text>
                </View>

                {/* Buy/Sell toggle */}
                <View style={styles.tradeToggle}>
                  {(['buy', 'sell'] as const).map(t => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.toggleBtn, tradeType === t && { backgroundColor: t === 'buy' ? '#F04452' : '#2175F3' }]}
                      onPress={() => setTradeType(t)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.toggleText, tradeType === t && { color: '#fff' }]}>
                        {t === 'buy' ? '매수' : '매도'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Quantity input - circular buttons */}
                <View style={styles.qtySection}>
                  <Text style={styles.qtyLabel}>수량</Text>
                  <View style={styles.qtyRow}>
                    <TouchableOpacity style={styles.qtyCircleBtn} onPress={() => setQty(q => Math.max(1, q - 1))} activeOpacity={0.8}>
                      <Text style={styles.qtyCircleBtnText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyValue}>{qty}주</Text>
                    <TouchableOpacity style={styles.qtyCircleBtn} onPress={() => setQty(q => q + 1)} activeOpacity={0.8}>
                      <Text style={styles.qtyCircleBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Order summary */}
                <View style={styles.summaryBox}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>주문금액</Text>
                    <Text style={styles.summaryValue}>{fmtPrice(totalAmt)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabelSub}>수수료 (0.1%)</Text>
                    <Text style={styles.summaryValueSub}>{fmtPrice(fee)}</Text>
                  </View>
                  <View style={styles.summaryDivider} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryTotalLabel}>총 {tradeType === 'buy' ? '결제' : '수령'}금액</Text>
                    <Text style={[styles.summaryTotalValue, { color: tradeType === 'buy' ? '#F04452' : '#2175F3' }]}>
                      {fmtPrice(tradeType === 'buy' ? totalAmt + fee : totalAmt - fee)}
                    </Text>
                  </View>
                </View>

                {/* Remaining balance */}
                <View style={[styles.balanceInfo, {
                  backgroundColor: remainingBalance < 0 ? '#FFF0F0' : '#F0F8FF',
                  borderColor: remainingBalance < 0 ? '#FF3B30' : '#0066FF',
                }]}>
                  <Text style={styles.balanceInfoLabel}>
                    {tradeType === 'buy' ? '구매 후 남은 현금' : `보유: ${holdingQty}주`}
                  </Text>
                  <Text style={[styles.balanceInfoValue, { color: remainingBalance < 0 ? '#F04452' : '#0066FF' }]}>
                    {tradeType === 'buy' ? `${Math.round(remainingBalance).toLocaleString()}원` : `${holdingQty}주`}
                  </Text>
                </View>

                {/* Insufficient balance warning */}
                {tradeType === 'buy' && remainingBalance < 0 && (
                  <Text style={styles.warningText}>
                    잔액이 부족해요. 학습을 완료하고 자산을 늘려보세요!
                  </Text>
                )}

                {/* Sell insufficient warning */}
                {tradeType === 'sell' && holdingQty < qty && (
                  <Text style={styles.warningText}>
                    보유 수량이 부족해요.
                  </Text>
                )}

                {/* Buy/Sell buttons */}
                <View style={styles.tradeBtnRow}>
                  <TouchableOpacity
                    style={[styles.tradeActionBtn, { backgroundColor: '#2175F3' }]}
                    onPress={() => handleSell()}
                    disabled={tradeType === 'sell' && holdingQty < qty}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.tradeActionBtnText}>매도</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.tradeActionBtn, {
                      backgroundColor: (tradeType === 'buy' && remainingBalance < 0) ? '#E5E8EB' : '#F04452'
                    }]}
                    onPress={() => handleBuy()}
                    disabled={tradeType === 'buy' && remainingBalance < 0}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tradeActionBtnText,
                      (tradeType === 'buy' && remainingBalance < 0) && { color: '#8B95A1' }
                    ]}>매수</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </Modal>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: DS.bg },

  // 헤더
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: DS.card,
    borderBottomWidth: 1, borderBottomColor: DS.border,
  },
  backBtn: { paddingRight: 8 },
  backArrow: { fontSize: 22, color: DS.text, fontWeight: '600' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerName: { fontSize: 17, fontWeight: '700', color: DS.text },
  headerSub: { fontSize: 12, color: DS.textSub, marginTop: 1 },
  favoriteBtn: { paddingLeft: 8 },

  scrollContent: { paddingTop: 16, paddingBottom: 120, gap: 8 },

  // 현재가 카드
  priceCard: {
    backgroundColor: DS.card,
    marginHorizontal: 16,
    borderRadius: DS.radius,
    padding: 20,
    gap: 12,
  },
  priceCardTop: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  priceLogoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceCardName: { fontSize: 15, fontWeight: '600', color: DS.text },
  priceCardSub: { fontSize: 12, color: DS.textSub },
  refreshBtn: { paddingTop: 2 },
  refreshText: { fontSize: 11, color: DS.textSub },
  priceValue: {
    fontSize: 34, fontWeight: '700', color: DS.text,
    fontFamily: 'Courier', letterSpacing: -1,
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  changeBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  changeBadgeText: { fontSize: 13, fontWeight: '700' },
  delayText: { fontSize: 11, color: DS.textSub },

  // 차트
  chartWrapper: { marginHorizontal: 16 },

  // 섹션
  section: { paddingHorizontal: 16, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: DS.text, paddingLeft: 2 },
  card: {
    backgroundColor: DS.card, borderRadius: DS.radius, padding: 16,
  },

  // 보유 현황 그리드
  holdingGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  holdingItem: { width: '45%', gap: 4 },
  holdingLabel: { fontSize: 12, color: DS.textSub },
  holdingValue: { fontSize: 15, fontWeight: '700', color: DS.text },

  // 정보 행
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 11,
  },
  infoRowBorder: { borderBottomWidth: 1, borderBottomColor: DS.border },
  infoLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  infoLabel: { fontSize: 14, color: DS.textSub },
  infoValue: { fontSize: 14, fontWeight: '600', color: DS.text },
  helpBtn: {
    width: 17, height: 17, borderRadius: 9,
    backgroundColor: DS.primary, alignItems: 'center', justifyContent: 'center',
  },
  helpBtnText: { color: '#fff', fontSize: 10, fontWeight: '800' },

  // 투자자 의견
  opinionBarRow: {
    flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 12,
  },
  opinionBar: { height: 8 },
  opinionLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  opinionLabelItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  opinionDot: { width: 8, height: 8, borderRadius: 4 },
  opinionLabel: { fontSize: 12, color: DS.textSub, fontWeight: '600' },

  // 뉴스
  newsRow: { paddingVertical: 12 },
  newsRowBorder: { borderBottomWidth: 1, borderBottomColor: DS.border },
  newsTitle: { fontSize: 14, fontWeight: '600', color: DS.text, lineHeight: 20 },
  newsMeta: { fontSize: 12, color: DS.textSub, marginTop: 4 },

  // 거래 내역
  tradeRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10,
  },
  tradeBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  tradeBadgeText: { fontSize: 12, fontWeight: '700' },
  tradeDetail: { fontSize: 14, color: DS.text, flex: 1 },
  tradeDate: { fontSize: 12, color: DS.textSub },

  // AI 버튼
  aiBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: DS.card, borderRadius: DS.radius,
    padding: 16, marginBottom: 8,
  },
  aiBtnIcon: { fontSize: 28 },
  aiBtnTitle: { fontSize: 15, fontWeight: '700', color: DS.text },
  aiBtnSub: { fontSize: 12, color: DS.textSub, marginTop: 2 },
  aiBtnChevron: { marginLeft: 'auto' as any, fontSize: 22, color: DS.textSub },

  // 하단 버튼
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 28,
    backgroundColor: DS.card, borderTopWidth: 1, borderTopColor: DS.border,
  },
  bottomBtn: {
    flex: 1, paddingVertical: 16, borderRadius: DS.radius,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  // 오류 토스트 (기존 에러용)
  errorToast: {
    position: 'absolute', bottom: 96, left: 20, right: 20,
    borderRadius: 10, padding: 14, alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  // 거래 완료 토스트
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#191F28',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    zIndex: 999,
  },

  // 트레이드 Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E8EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sheetStockName: { fontSize: 16, fontWeight: '700', color: '#191F28' },
  sheetStockTicker: { fontSize: 13, color: '#8B95A1', marginTop: 2 },
  sheetStockPrice: { fontSize: 18, fontWeight: '700', color: '#191F28', fontFamily: 'Courier' },
  tradeToggle: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F6',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleText: { fontSize: 15, fontWeight: '600', color: '#8B95A1' },
  qtySection: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    padding: 20,
  },
  qtyLabel: { color: '#8B95A1', fontSize: 13, marginBottom: 12 },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  qtyCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyCircleBtnText: { fontSize: 24, fontWeight: '700', color: '#191F28' },
  qtyValue: { fontSize: 32, fontWeight: '700', color: '#191F28' },
  summaryBox: {
    backgroundColor: '#F2F4F6',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14, color: '#8B95A1' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#191F28', fontFamily: 'Courier' },
  summaryLabelSub: { fontSize: 12, color: '#ADB5BD' },
  summaryValueSub: { fontSize: 12, color: '#ADB5BD', fontFamily: 'Courier' },
  summaryDivider: { height: 1, backgroundColor: '#E5E8EB', marginVertical: 4 },
  summaryTotalLabel: { fontSize: 15, fontWeight: '700', color: '#191F28' },
  summaryTotalValue: { fontSize: 18, fontWeight: '700', fontFamily: 'Courier' },
  balanceInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  balanceInfoLabel: { fontSize: 14, color: '#8B95A1' },
  balanceInfoValue: { fontSize: 16, fontWeight: '700' },
  warningText: { color: '#F04452', textAlign: 'center', fontSize: 13 },
  tradeBtnRow: { flexDirection: 'row', gap: 12 },
  tradeActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tradeActionBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
});
