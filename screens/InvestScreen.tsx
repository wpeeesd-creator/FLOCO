import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, TextInput, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { useAppStore, STOCKS } from '../store/appStore';
import StockLogo from '../components/StockLogo';
import { BottomSheet, Button, Toast, Colors } from '../components/ui';
import { useWishlist } from '../hooks/useWishlist';
import { fetchKRNews as fetchKRNewsImported, formatNewsTime, type NewsItem } from '../lib/newsService';

// ─── Types ────────────────────────────────────────────────────────────────────
type InvestTab = '전체' | '보유' | '관심' | '발견';
type MarketFilter = '전체' | '국내' | '미국';
type ChartTab = '거래대금' | '거래량' | '급상승' | '급하락' | '인기';
type FeedTab = '추천' | '팔로잉' | '뉴스' | '콘텐츠';

// NewsItem imported from ../lib/newsService

// ─── Constants ────────────────────────────────────────────────────────────────
const WATCHLIST_TICKERS = [
  'AAPL', 'NVDA', 'TSLA', 'MSFT', '005930', '000660', '035720', 'META', 'AMZN', 'GOOGL',
];

const ISSUES = [
  '🔴 유가 100달러 돌파',
  '📈 나스닥 신고가 경신',
  '💰 삼성전자 배당 발표',
  '⚡ NVIDIA 실적 서프라이즈',
];

const CATEGORIES = [
  { emoji: '🇺🇸', label: '해외주식', screen: 'USStock' },
  { emoji: '🇰🇷', label: '국내주식', screen: 'KRStock' },
  { emoji: '📜', label: '채권', screen: 'Bond' },
  { emoji: '📊', label: 'ETF', screen: 'ETF' },
];

const KR_SECTORS = ['전체', '반도체', 'IT', '바이오', '자동차', '금융', '게임', '에너지', '방산', '통신', '소재'] as const;
const US_SECTORS = ['전체', '기술', '반도체', '금융', '헬스케어', '소비재', 'AI', '전기차', 'ETF'] as const;

const DUMMY_NEWS: NewsItem[] = [
  { id: 'kr1', title: '미 증시, AI 랠리에 나스닥 사상 최고치 경신', description: '', source: '네이버금융', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr2', title: '삼성전자, 반도체 실적 호전 기대감에 외국인 순매수', description: '', source: '네이버금융', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr3', title: 'SK하이닉스, HBM 수주 확대로 목표가 상향', description: '', source: '네이버금융', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr4', title: '테슬라, 자율주행 업데이트 발표...주가 3% 상승', description: '', source: '네이버금융', publishedAt: new Date(Date.now() - 18000000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr5', title: '엔비디아, 차세대 GPU 로드맵 공개', description: '', source: '네이버금융', publishedAt: new Date(Date.now() - 21600000).toISOString(), url: '', imageUrl: null, country: 'KR' },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function InvestScreen() {
  const navigation = useNavigation<any>();
  const { holdings, cash, getTotalValue, getReturnRate, buyStock, sellStock } = useAppStore();
  const { wishlist, toggleWishlist, isWishlisted } = useWishlist();

  // Tab state
  const [tab, setTab] = useState<InvestTab>('전체');

  // Holdings / Watchlist shared state
  const [market, setMarket] = useState<MarketFilter>('전체');
  const [search, setSearch] = useState('');

  // Trade Bottom Sheet state
  const [sheetTicker, setSheetTicker] = useState<string | null>(null);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState(1);

  // Toast state
  const [toast, setToast] = useState({
    visible: false,
    message: '',
    type: 'info' as 'success' | 'error' | 'info',
  });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // 전체 tab state
  const [stockMarket, setStockMarket] = useState<'한국' | '미국'>('한국');
  const [selectedSector, setSelectedSector] = useState('전체');
  const [sortBy, setSortBy] = useState<'change' | 'price' | 'name'>('change');

  // Discover tab state
  const [chartTab, setChartTab] = useState<ChartTab>('거래대금');
  const [feedTab, setFeedTab] = useState<FeedTab>('뉴스');
  const [news, setNews] = useState<NewsItem[]>(DUMMY_NEWS);
  const [newsLoading, setNewsLoading] = useState(false);
  const [issueIdx, setIssueIdx] = useState(0);

  // Init
  useEffect(() => {
    setIsLoading(false);
  }, []);

  // Auto-scroll issues banner
  useEffect(() => {
    const timer = setInterval(() => {
      setIssueIdx(prev => (prev + 1) % ISSUES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Fetch news on mount
  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const data = await fetchKRNewsImported();
      if (data && data.length > 0) {
        setNews(data.slice(0, 10));
      }
    } catch (error) {
      console.error('뉴스 로드 오류:', error);
      // Keep dummy news on error
    } finally {
      setNewsLoading(false);
    }
  };

  // ─── Holdings data ─────────────────────────────────────────────────────────
  let totalValue = 0;
  let returnRate = 0;
  try {
    totalValue = getTotalValue() ?? 0;
    returnRate = getReturnRate() ?? 0;
  } catch {
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

  // ─── Watchlist data (Firestore 관심 종목) ────────────────────────────────────
  const watchlistStocks = (wishlist.length > 0 ? wishlist : WATCHLIST_TICKERS)
    .map(t => STOCKS.find(s => s.ticker === t))
    .filter((s): s is typeof STOCKS[0] => !!s);

  const filteredWatchlist = watchlistStocks.filter(s => {
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

  // ─── All stocks (전체 tab) ───────────────────────────────────────────────────
  const allStocksFiltered = STOCKS
    .filter(s => s.market === stockMarket)
    .filter(s => selectedSector === '전체' || s.sector === selectedSector)
    .sort((a, b) => {
      if (sortBy === 'change') return Math.abs(b.change) - Math.abs(a.change);
      if (sortBy === 'price') return b.price - a.price;
      return a.name.localeCompare(b.name);
    });

  // ─── Discover chart data ────────────────────────────────────────────────────
  const getChartStocks = () => {
    const all = [...STOCKS];
    switch (chartTab) {
      case '거래대금': return all.sort((a, b) => b.price - a.price).slice(0, 10);
      case '거래량': return all.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 10);
      case '급상승': return all.filter(s => s.change > 0).sort((a, b) => b.change - a.change).slice(0, 10);
      case '급하락': return all.filter(s => s.change < 0).sort((a, b) => a.change - b.change).slice(0, 10);
      case '인기': return all.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)).slice(0, 10);
      default: return all.slice(0, 10);
    }
  };
  const chartStocks = getChartStocks();

  // ─── Trade sheet helpers ────────────────────────────────────────────────────
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

  // ─── Loading guard ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={{ fontSize: 14, color: Colors.textSub, marginTop: 12 }}>종목 정보를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.bg }}>
      <View style={styles.container}>

        {/* ── Header ──────────────────────────────────────── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>투자</Text>
          {tab === '발견' && (
            <View style={styles.indexBadge}>
              <Text style={styles.indexLabel}>나스닥</Text>
              <Text style={[styles.indexValue, { color: Colors.green }]}>17,932 ▲1.24%</Text>
            </View>
          )}
        </View>

        {/* ── Sub-tab bar: 보유 | 관심 | 발견 ───────────── */}
        <View style={styles.tabRow}>
          {(['전체', '보유', '관심', '발견'] as InvestTab[]).map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => {
                setTab(t);
                // Reset search/market when switching between holding/watchlist tabs
                if (t !== '발견' && t !== '전체') {
                  setSearch('');
                  setMarket('전체');
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Content ─────────────────────────────────────── */}
        {tab === '발견' ? (

          /* ════════ 발견 탭 ════════ */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Issue Banner */}
            <View style={styles.issueBanner}>
              <View style={styles.issueDot} />
              <Text style={styles.issueText}>{ISSUES[issueIdx]}</Text>
            </View>

            {/* Categories */}
            <View style={styles.categoryRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c.label}
                  style={styles.categoryBtn}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate(c.screen)}
                >
                  <View style={styles.categoryIcon}>
                    <Text style={{ fontSize: 22 }}>{c.emoji}</Text>
                  </View>
                  <Text style={styles.categoryLabel}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Event & Index Cards */}
            <View style={styles.cardRow}>
              <View style={[styles.eventCard, { backgroundColor: '#FFF8E6' }]}>
                <Text style={styles.eventLabel}>📅 내일 이벤트</Text>
                <Text style={styles.eventTitle}>美 FOMC 금리 결정</Text>
                <Text style={styles.eventDesc}>한국시간 목요일 새벽 3시</Text>
              </View>
              <View style={[styles.eventCard, { backgroundColor: Colors.redBg }]}>
                <Text style={styles.eventLabel}>📊 나스닥</Text>
                <Text style={[styles.eventTitle, { color: Colors.green }]}>17,932.15</Text>
                <Text style={[styles.eventDesc, { color: Colors.green }]}>▲ 219.76 (+1.24%)</Text>
              </View>
            </View>

            {/* Chart Section */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>실시간 차트</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillTabsRow}
            >
              {(['거래대금', '거래량', '급상승', '급하락', '인기'] as ChartTab[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pillTab, chartTab === t && styles.pillTabActive]}
                  onPress={() => setChartTab(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillTabText, chartTab === t && styles.pillTabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Stock Rank List */}
            <View style={styles.discoverListCard}>
              {chartStocks.map((s, i) => {
                const sUp = s.change >= 0;
                const isFav = isWishlisted(s.ticker);
                return (
                  <TouchableOpacity
                    key={s.ticker}
                    style={[styles.discoverStockRow, i < chartStocks.length - 1 && styles.stockBorder]}
                    onPress={() => navigation.navigate('종목상세', { ticker: s.ticker })}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.rankNum}>{i + 1}</Text>
                    <StockLogo ticker={s.ticker} size={40} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.discoverStockName}>{s.name}</Text>
                      <Text style={styles.discoverStockTicker}>{s.ticker}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.discoverStockPrice}>
                        {s.krw ? `₩${s.price.toLocaleString()}` : `$${s.price.toFixed(2)}`}
                      </Text>
                      <View style={[styles.changeBadge, { backgroundColor: sUp ? Colors.greenBg : Colors.redBg }]}>
                        <Text style={[styles.changeText, { color: sUp ? Colors.green : Colors.red }]}>
                          {sUp ? '+' : ''}{s.change.toFixed(2)}%
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleWishlist(s.ticker)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 4 }}
                    >
                      <Text style={{ fontSize: 18, color: isFav ? Colors.green : Colors.border }}>
                        {isFav ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* News Section */}
            <View style={[styles.sectionHeader, { marginTop: 24 }]}>
              <Text style={styles.sectionTitle}>뉴스 / 피드</Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillTabsRow}
            >
              {(['추천', '팔로잉', '뉴스', '콘텐츠'] as FeedTab[]).map(t => (
                <TouchableOpacity
                  key={t}
                  style={[styles.pillTab, feedTab === t && styles.pillTabActive]}
                  onPress={() => setFeedTab(t)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.pillTabText, feedTab === t && styles.pillTabTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {newsLoading ? (
              <View style={{ alignItems: 'center', marginTop: 20 }}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={{ fontSize: 13, color: Colors.textSub, marginTop: 8 }}>뉴스를 불러오는 중...</Text>
              </View>
            ) : (
              <View style={styles.newsList}>
                {news.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[styles.newsCard, i < news.length - 1 && styles.newsCardBorder]}
                    onPress={() => item.url && Linking.openURL(item.url).catch(() => {})}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
                    <View style={styles.newsMeta}>
                      <Text style={styles.newsSource}>{item.source}</Text>
                      <Text style={styles.newsDate}>{formatNewsTime(item.publishedAt)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

        ) : tab === '전체' ? (

          /* ════════ 전체 탭 ════════ */
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Market toggle */}
            <View style={styles.marketToggle}>
              {(['한국', '미국'] as const).map(m => (
                <TouchableOpacity
                  key={m}
                  onPress={() => { setStockMarket(m); setSelectedSector('전체'); }}
                  style={[styles.marketBtn, stockMarket === m && styles.marketBtnActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.marketBtnText, stockMarket === m && styles.marketBtnTextActive]}>
                    {m === '한국' ? '🇰🇷 국내' : '🇺🇸 미국'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Sector filter pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.sectorRow}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 6 }}
            >
              {(stockMarket === '한국' ? KR_SECTORS : US_SECTORS).map(sector => (
                <TouchableOpacity
                  key={sector}
                  onPress={() => setSelectedSector(sector)}
                  style={[styles.sectorPill, selectedSector === sector && styles.sectorPillActive]}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sectorPillText, selectedSector === sector && styles.sectorPillTextActive]}>
                    {sector}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Sort row */}
            <View style={styles.sortRow}>
              <Text style={styles.sortLabel}>정렬:</Text>
              {([
                { key: 'change' as const, label: '등락률순' },
                { key: 'price' as const, label: '가격순' },
                { key: 'name' as const, label: '이름순' },
              ]).map(s => (
                <TouchableOpacity key={s.key} onPress={() => setSortBy(s.key)}>
                  <Text style={[styles.sortOption, sortBy === s.key && styles.sortOptionActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
              <Text style={styles.sortCount}>{allStocksFiltered.length}개</Text>
            </View>

            {/* Stock list */}
            <View style={styles.listCard}>
              {allStocksFiltered.map((s, i) => {
                const sUp = s.change >= 0;
                const wishlisted = isWishlisted(s.ticker);
                return (
                  <TouchableOpacity
                    key={s.ticker}
                    style={[styles.stockRow, i < allStocksFiltered.length - 1 && styles.stockDivider]}
                    onPress={() => navigation.navigate('종목상세', { ticker: s.ticker })}
                    activeOpacity={0.7}
                  >
                    <StockLogo ticker={s.ticker} size={40} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.stockName}>{s.name}</Text>
                      <Text style={styles.stockSub}>{s.ticker}{s.sector ? ` · ${s.sector}` : ''}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.stockPrice}>
                        {s.krw ? `₩${s.price.toLocaleString()}` : `$${s.price.toFixed(2)}`}
                      </Text>
                      <Text style={[styles.stockChange, { color: sUp ? '#F04452' : '#2175F3' }]}>
                        {sUp ? '+' : ''}{s.change.toFixed(2)}%
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => toggleWishlist(s.ticker)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      style={{ marginLeft: 6 }}
                    >
                      <Text style={{ fontSize: 18, color: wishlisted ? '#F04452' : '#E5E8EB' }}>
                        {wishlisted ? '♥' : '♡'}
                      </Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

        ) : (

          /* ════════ 보유 / 관심 탭 ════════ */
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 32 }}
          >
            {/* Search bar */}
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

            {/* Market filter pills */}
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
                {/* Total evaluation card */}
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

                {/* Holdings list */}
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
                              {hUp ? '+' : ''}{h.pnlRate.toFixed(2)}%
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
              /* Watchlist */
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
                                {sUp ? '+' : ''}{s.change.toFixed(2)}%
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
        )}

        {/* ── Trade Bottom Sheet ─────────────────────────── */}
        <BottomSheet
          visible={!!sheetTicker}
          onClose={() => setSheetTicker(null)}
          title={tradeType === 'buy' ? '매수 주문' : '매도 주문'}
        >
          {sheetStock && (
            <View style={{ gap: 14 }}>
              {/* Stock name + price */}
              <View style={styles.sheetRow}>
                <Text style={styles.sheetStockName}>{sheetStock.name}</Text>
                <Text style={styles.sheetStockPrice}>{fmtPrice(sheetStock.price)}</Text>
              </View>

              {/* Buy / Sell toggle */}
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

              {/* Quantity adjuster */}
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

              {/* Order summary */}
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

              {/* Available balance hint */}
              <Text style={styles.sheetHint}>
                {tradeType === 'buy'
                  ? `사용 가능: ₩${Math.round(cash).toLocaleString()}`
                  : `보유: ${sheetHolding?.qty ?? 0}주`}
              </Text>

              {/* Confirm button */}
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

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.bg,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  indexBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  indexLabel: {
    fontSize: 12,
    color: Colors.textSub,
  },
  indexValue: {
    fontSize: 13,
    fontWeight: '700',
  },

  // Sub-tab bar (underline style)
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

  // Search bar
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

  // Market filter pills
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

  // Total evaluation card
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

  // Holdings/Watchlist list card
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

  // Trade button
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

  // Empty state
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

  // Bottom Sheet internals
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

  // ── 전체 tab styles ─────────────────────────────────────────────────────────
  marketToggle: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: Colors.card,
  },
  marketBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bg,
    alignItems: 'center',
  },
  marketBtnActive: {
    backgroundColor: Colors.primary,
  },
  marketBtnText: {
    color: Colors.textSub,
    fontWeight: '600',
    fontSize: 14,
  },
  marketBtnTextActive: {
    color: '#FFFFFF',
  },
  sectorRow: {
    backgroundColor: Colors.card,
    paddingVertical: 8,
  },
  sectorPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bg,
  },
  sectorPillActive: {
    backgroundColor: '#191F28',
  },
  sectorPillText: {
    color: Colors.textSub,
    fontSize: 13,
  },
  sectorPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.bg,
    gap: 8,
  },
  sortLabel: {
    color: Colors.textSub,
    fontSize: 13,
  },
  sortOption: {
    color: Colors.textSub,
    fontSize: 13,
  },
  sortOptionActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  sortCount: {
    color: Colors.textSub,
    fontSize: 13,
    marginLeft: 'auto',
  },

  // ── Discover tab styles ─────────────────────────────────────────────────────

  // Issue banner
  issueBanner: {
    backgroundColor: '#191F28',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  issueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.green,
  },
  issueText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },

  // Categories
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  categoryBtn: {
    alignItems: 'center',
    gap: 7,
  },
  categoryIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  categoryLabel: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },

  // Event cards
  cardRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  eventCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  eventLabel: {
    fontSize: 12,
    color: Colors.textSub,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  eventDesc: {
    fontSize: 12,
    color: Colors.textSub,
  },

  // Section header
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },

  // Pill tabs (discover)
  pillTabsRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  pillTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillTabActive: {
    backgroundColor: Colors.text,
    borderColor: Colors.text,
  },
  pillTabText: {
    fontSize: 13,
    color: Colors.textSub,
    fontWeight: '500',
  },
  pillTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Discover stock rank list
  discoverListCard: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  discoverStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stockBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rankNum: {
    width: 22,
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    textAlign: 'center',
  },
  discoverStockName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  discoverStockTicker: {
    fontSize: 11,
    color: Colors.textSub,
    marginTop: 1,
  },
  discoverStockPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    fontFamily: 'Courier',
  },

  // News list
  newsList: {
    marginHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  newsCard: {
    padding: 16,
  },
  newsCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  newsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  newsMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  newsSource: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  newsDate: {
    fontSize: 12,
    color: Colors.textSub,
  },
});
