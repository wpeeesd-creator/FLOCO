/**
 * 투자 탭 — 전체/보유/관심/발견
 * Yahoo Finance 실시간 가격 + Firestore 포트폴리오/관심종목
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  FlatList,
} from 'react-native';
import { Text } from '../components/ui/Text';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useAppStore, STOCKS, type Stock } from '../store/appStore';
import { Colors } from '../components/ui';
import StockLogo from '../components/StockLogo';
import { useTheme } from '../context/ThemeContext';
import { fetchMultiplePrices, type PriceData } from '../utils/priceService';
import { MARKET_INDICES } from '../data/marketIndices';

// ── 타입 ──────────────────────────────────────────
type InvestTab = '전체' | '보유' | '관심' | '발견';
type MarketFilter = 'KR' | 'US';

// ── 종목 분류 ─────────────────────────────────────
const KR_STOCKS = STOCKS.filter(s => s.krw);
const US_STOCKS = STOCKS.filter(s => !s.krw);

const KR_SECTORS = ['전체', ...Array.from(new Set(KR_STOCKS.map(s => s.sector)))];
const US_SECTORS = ['전체', ...Array.from(new Set(US_STOCKS.map(s => s.sector)))];

const SECTOR_EMOJI: Record<string, string> = {
  '반도체': '💾', 'IT': '💻', '바이오': '🧬', '자동차': '🚗', '2차전지': '🔋',
  '금융': '🏦', '게임': '🎮', '엔터': '🎤', '방산': '🛡️', '화학': '⚗️',
  '식품': '🍽️', '건설': '🏗️', '유통': '🛒', '에너지': '⚡',
  '기술': '💻', '헬스케어': '⚕️', '산업재': '🏭', '소비재': '🛍️',
  '항공우주': '✈️', '부동산': '🏢', '유틸리티': '💡', '식음료': '🍔',
  'ETF': '📊', '미디어': '🎬', '여행': '🛫', '리츠': '🏘️', '원자재': '🪨',
  '통신': '📡', '클라우드': '☁️', '핀테크': '💳',
};

// ══════════════════════════════════════════════════
//  InvestScreen
// ══════════════════════════════════════════════════
export default function InvestScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { holdings, cash } = useAppStore();

  const [selectedTab, setSelectedTab] = useState<InvestTab>('전체');
  const [discoverSubTab, setDiscoverSubTab] = useState<'realtime' | 'trending' | 'investor'>('realtime');
  const [realtimeSortBy, setRealtimeSortBy] = useState<'value' | 'volume' | 'change'>('value');
  const [realtimeMarket, setRealtimeMarket] = useState<'all' | 'kr' | 'us'>('all');
  const [trendingMarket, setTrendingMarket] = useState<'kr' | 'us'>('kr');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<MarketFilter>('KR');
  const [selectedSector, setSelectedSector] = useState('전체');
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [indexPrices, setIndexPrices] = useState<Record<string, PriceData>>({});
  const exchangeRate = useAppStore(s => s.exchangeRate);

  // 인덱스 30초 폴링
  useEffect(() => {
    const fetchIndices = async () => {
      const stocks = MARKET_INDICES.map(idx => ({
        ticker: idx.ticker,
        isKR: idx.isKR,
        type: 'index' as const,
      }));
      const result = await fetchMultiplePrices(stocks);
      setIndexPrices(result);
    };
    fetchIndices();
    const interval = setInterval(fetchIndices, 30_000);
    return () => clearInterval(interval);
  }, []);

  // 섹터별 평균 등락률 (시장 분리 + riseCount + sampleTickers)
  const trendingSectorsByMarket = useMemo(() => {
    const sectorMap: Record<string, {
      total: number;
      count: number;
      riseCount: number;
      sampleTickers: string[];
    }> = {};
    for (const stock of STOCKS) {
      if (!stock.sector) continue;
      if (stock.type === 'crypto' || stock.type === 'index') continue;
      if (trendingMarket === 'kr' && !stock.krw) continue;
      if (trendingMarket === 'us' && stock.krw) continue;
      const pd = prices[stock.ticker];
      if (!pd) continue;
      if (!sectorMap[stock.sector]) {
        sectorMap[stock.sector] = { total: 0, count: 0, riseCount: 0, sampleTickers: [] };
      }
      sectorMap[stock.sector].total += pd.change ?? 0;
      sectorMap[stock.sector].count += 1;
      if ((pd.change ?? 0) > 0) sectorMap[stock.sector].riseCount += 1;
      if (sectorMap[stock.sector].sampleTickers.length < 3) {
        sectorMap[stock.sector].sampleTickers.push(stock.ticker);
      }
    }
    return Object.entries(sectorMap)
      .filter(([, v]) => v.count >= 3)
      .map(([sector, { total, count, riseCount, sampleTickers }]) => ({
        sector,
        avgChange: total / count,
        count,
        riseCount,
        sampleTickers,
      }))
      .sort((a, b) => Math.abs(b.avgChange) - Math.abs(a.avgChange));
  }, [prices, trendingMarket]);

  // 실시간 차트 TOP 20 (정렬 기준별)
  const realtimeTop20 = useMemo(() => {
    const items = STOCKS
      .filter(s => s.type !== 'crypto' && s.type !== 'index')
      .filter(s => {
        if (realtimeMarket === 'kr') return s.krw === true;
        if (realtimeMarket === 'us') return s.krw === false;
        return true;
      })
      .map(stock => {
        const pd = prices[stock.ticker];
        if (!pd || !pd.price) return null;
        const value = pd.price * (pd.volume ?? 0) * (stock.krw ? 1 : exchangeRate);
        return {
          stock,
          price: pd.price,
          change: pd.change ?? 0,
          volume: pd.volume ?? 0,
          value,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    if (realtimeSortBy === 'value') items.sort((a, b) => b.value - a.value);
    else if (realtimeSortBy === 'volume') items.sort((a, b) => b.volume - a.volume);
    else items.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

    return items.slice(0, 20);
  }, [prices, exchangeRate, realtimeSortBy, realtimeMarket]);

  // 거래대금 TOP 5 (KRW 환산)
  const top5ByValue = useMemo(() => {
    return STOCKS
      .filter(s => s.type !== 'crypto' && s.type !== 'index')
      .map(stock => {
        const pd = prices[stock.ticker];
        if (!pd || !pd.price || !pd.volume) return null;
        const value = pd.price * pd.volume * (stock.krw ? 1 : exchangeRate);
        return { stock, value, change: pd.change ?? 0, price: pd.price };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [prices, exchangeRate]);

  // ── Firestore 사용자 데이터 ─────────────────────
  const [userData, setUserData] = useState<any>(null);

  useEffect(() => {
    if (!user?.id) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.id), (snap) => {
      if (snap.exists()) setUserData(snap.data());
    });
    return () => unsubscribe();
  }, [user?.id]);

  const portfolio = userData?.portfolio ?? [];
  const wishlist = userData?.wishlist ?? [];

  // ── Yahoo Finance 가격 로드 (공통 priceService 사용) ──
  const loadPrices = useCallback(async () => {
    try {
      setIsLoadingPrices(true);
      const allStocks = selectedMarket === 'KR'
        ? KR_STOCKS.map(s => ({ ticker: s.ticker, isKR: true }))
        : US_STOCKS.map(s => ({ ticker: s.ticker, isKR: false }));
      const data = await fetchMultiplePrices(allStocks);
      setPrices(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('투자탭 가격 오류:', error);
    } finally {
      setIsLoadingPrices(false);
    }
  }, [selectedMarket]);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(loadPrices, 30000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  // ── 보유 종목 가격 로드 (공통 priceService 사용) ──
  const loadPortfolioPrices = useCallback(async () => {
    if (portfolio.length === 0) return;
    try {
      const stockList = portfolio.map((s: any) => ({
        ticker: s.ticker,
        isKR: s.ticker.length === 6 && /^\d+$/.test(s.ticker),
      }));
      const newPrices = await fetchMultiplePrices(stockList);
      setPrices(prev => ({ ...prev, ...newPrices }));
    } catch (error) {
      console.error('보유 가격 로드 오류:', error);
    }
  }, [portfolio.length]);

  useEffect(() => {
    if (selectedTab === '보유') {
      loadPortfolioPrices();
    }
  }, [selectedTab, loadPortfolioPrices]);

  // ── 필터 ────────────────────────────────────────
  const allStocks = selectedMarket === 'KR' ? KR_STOCKS : US_STOCKS;
  const sectors = selectedMarket === 'KR' ? KR_SECTORS : US_SECTORS;

  const filteredStocks = allStocks.filter(s => {
    const matchSearch = searchQuery === '' ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ticker.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSector = selectedSector === '전체' || s.sector === selectedSector;
    return matchSearch && matchSector;
  });

  // ── 관심종목 토글 ───────────────────────────────
  const toggleWishlist = async (stock: any, isKR: boolean) => {
    if (!user?.id) return;
    const stockInfo = {
      ticker: stock.ticker,
      name: stock.name,
      sector: stock.sector,
      bg: (stock as any).bg,
      logo: stock.logo,
      isKR,
    };
    const isWished = wishlist.some((w: any) => w.ticker === stock.ticker);
    try {
      if (isWished) {
        const existingItem = wishlist.find((w: any) => w.ticker === stock.ticker);
        if (!existingItem) return;
        await updateDoc(doc(db, 'users', user.id), {
          wishlist: arrayRemove(existingItem),
        });
      } else {
        const cleanItem = Object.fromEntries(
          Object.entries(stockInfo).filter(([_, v]) => v !== undefined)
        );
        await updateDoc(doc(db, 'users', user.id), {
          wishlist: arrayUnion(cleanItem),
        });
      }
    } catch (error) {
      console.error('관심종목 오류:', error);
    }
  };

  // ══════════════════════════════════════════════════
  //  RENDER
  // ══════════════════════════════════════════════════
  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      {/* ── 헤더 ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>투자</Text>
      </View>

      {/* ── 인덱스 띠 ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{
          backgroundColor: theme.bgCard,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
          flexGrow: 0,
          flexShrink: 0,
        }}
        contentContainerStyle={{
          paddingVertical: 10,
          paddingHorizontal: 16,
          gap: 18,
          alignItems: 'center',
        }}
      >
        {MARKET_INDICES.map(idx => {
          const data = indexPrices[idx.ticker];
          if (!data) {
            return (
              <View key={idx.ticker} style={{ minWidth: 90 }}>
                <Text style={{ fontSize: 11, color: Colors.textSub }}>{idx.name}</Text>
                <Text style={{ fontSize: 13, color: Colors.textSub, marginTop: 2 }}>—</Text>
              </View>
            );
          }
          const isUp = (data.change ?? 0) >= 0;
          return (
            <View key={idx.ticker} style={{ minWidth: 90 }}>
              <Text style={{ fontSize: 11, color: Colors.textSub }}>{idx.name}</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text, marginTop: 2 }}>
                {idx.ticker === 'KRW=X'
                  ? `₩${data.price.toFixed(2)}`
                  : data.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </Text>
              <Text style={{ fontSize: 11, color: isUp ? theme.red : theme.blue, marginTop: 1 }}>
                {isUp ? '▲' : '▼'} {Math.abs(data.change).toFixed(2)}%
              </Text>
            </View>
          );
        })}
      </ScrollView>

      {/* ── 메인 탭 ── */}
      <View style={s.tabBar}>
        {(['전체', '보유', '관심', '발견'] as InvestTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[s.tabChip, selectedTab === tab && s.tabChipActive]}
          >
            <Text style={[s.tabChipText, selectedTab === tab && s.tabChipTextActive, selectedTab === tab && { color: theme.bgCard }]}>
              {tab}
              {tab === '보유' && portfolio.length > 0 ? ` ${portfolio.length}` : ''}
              {tab === '관심' && wishlist.length > 0 ? ` ${wishlist.length}` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ════════════════ 전체 탭 ════════════════ */}
      {selectedTab === '전체' && (
        <View style={{ flex: 1 }}>
          {/* 검색 */}
          <View style={s.searchWrap}>
            <View style={s.searchBox}>
              <Ionicons name="search" size={18} color={Colors.textSub} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="종목명 또는 티커 검색"
                placeholderTextColor={Colors.textSub}
                style={s.searchInput}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.textSub} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* 국내/미국 */}
          <View style={s.marketRow}>
            {(['KR', 'US'] as MarketFilter[]).map(market => (
              <TouchableOpacity
                key={market}
                onPress={() => { setSelectedMarket(market); setSelectedSector('전체'); }}
                style={[s.marketBtn, selectedMarket === market && s.marketBtnActive]}
              >
                <Text style={[s.marketBtnText, selectedMarket === market && s.marketBtnTextActive, selectedMarket === market && { color: theme.bgCard }]}>
                  {market === 'KR' ? '🇰🇷 국내' : '🇺🇸 미국'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* 섹터 필터 — FlatList로 터치 씹힘 방지 */}
          <View style={s.sectorScroll}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={sectors}
              keyExtractor={item => item}
              contentContainerStyle={s.sectorContainer}
              renderItem={({ item: sector }) => (
                <TouchableOpacity
                  onPress={() => setSelectedSector(sector)}
                  style={[s.sectorChip, selectedSector === sector && s.sectorChipActive]}
                >
                  <Text style={[s.sectorChipText, selectedSector === sector && s.sectorChipTextActive]}>
                    {sector}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>

          {/* 업데이트 상태 */}
          <View style={s.statusRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[s.statusDot, { backgroundColor: isLoadingPrices ? '#FF9500' : theme.green }]} />
              <Text style={s.statusText}>
                {isLoadingPrices
                  ? '업데이트 중...'
                  : lastUpdated
                    ? `${lastUpdated.toLocaleTimeString('ko-KR')} 업데이트`
                    : '로딩 중...'}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={s.statusText}>{filteredStocks.length}개</Text>
              <TouchableOpacity onPress={loadPrices}>
                <Ionicons name="refresh" size={16} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* 종목 리스트 */}
          <FlatList
            data={filteredStocks}
            keyExtractor={item => item.ticker}
            renderItem={({ item }) => {
              const priceData = prices[item.ticker];
              const isPositive = (priceData?.change ?? item.change ?? 0) >= 0;
              const isKR = selectedMarket === 'KR';
              const displayPrice = priceData?.price ?? item.price;
              const displayChange = priceData?.change ?? item.change ?? 0;

              return (
                <TouchableOpacity
                  onPress={() => {
                    const pd = prices[item.ticker];
                    console.log(`투자탭 가격 (${item.ticker}):`, pd?.price);
                    navigation.navigate('종목상세', {
                      ticker: item.ticker,
                      price: pd?.price ?? item.price ?? 0,
                      change: pd?.change ?? item.change ?? 0,
                      changeAmount: pd?.changeAmount,
                      high: pd?.high,
                      low: pd?.low,
                      open: pd?.open,
                      volume: pd?.volume,
                      previousClose: pd?.previousClose,
                      week52High: pd?.week52High,
                      week52Low: pd?.week52Low,
                      per: pd?.per,
                      pbr: pd?.pbr,
                      marketState: pd?.marketState,
                    });
                  }}
                  style={s.stockRow}
                  activeOpacity={0.7}
                >
                  <View style={{ marginRight: 12 }}>
                    <StockLogo ticker={item.ticker} size={44} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.stockName}>{item.name}</Text>
                    <Text style={s.stockSub}>{item.ticker} · {item.sector}</Text>
                  </View>
                  {displayPrice ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={s.stockPrice}>
                        {isKR ? `${Math.round(displayPrice).toLocaleString()}원` : `$${displayPrice.toFixed(2)}`}
                      </Text>
                      <Text style={[s.stockChange, { color: isPositive ? Colors.green : Colors.red }]}>
                        {isPositive ? '+' : ''}{displayChange.toFixed(2)}%
                      </Text>
                    </View>
                  ) : (
                    <ActivityIndicator size="small" color={Colors.textSub} />
                  )}
                  <TouchableOpacity
                    onPress={() => toggleWishlist(item, isKR)}
                    style={{ marginLeft: 12 }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={wishlist.some((w: any) => w.ticker === item.ticker) ? 'heart' : 'heart-outline'}
                      size={22}
                      color={wishlist.some((w: any) => w.ticker === item.ticker) ? Colors.green : Colors.textSub}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      )}

      {/* ════════════════ 보유 탭 ════════════════ */}
      {selectedTab === '보유' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {portfolio.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 48 }}>📭</Text>
              <Text style={s.emptyText}>
                보유 종목이 없어요{'\n'}전체 탭에서 투자를 시작해보세요!
              </Text>
              <TouchableOpacity onPress={() => setSelectedTab('전체')} style={s.emptyBtn}>
                <Text style={[s.emptyBtnText, { color: theme.bgCard }]}>종목 둘러보기</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View>
              {/* 보유 요약 */}
              <View style={s.summaryCard}>
                <Text style={s.summaryLabel}>보유 종목 {portfolio.length}개</Text>
                <Text style={s.summaryValue}>
                  {Math.round(
                    portfolio.reduce((sum: number, st: any) => {
                      const p = prices[st.ticker]?.price ?? st.avgPrice;
                      return sum + p * st.quantity;
                    }, 0),
                  ).toLocaleString()}원
                </Text>
                {(() => {
                  const totalProfit = portfolio.reduce((sum: number, st: any) => {
                    const p = prices[st.ticker]?.price ?? st.avgPrice;
                    return sum + (p - st.avgPrice) * st.quantity;
                  }, 0);
                  const isUp = totalProfit >= 0;
                  return (
                    <Text style={[s.summaryProfit, { color: isUp ? Colors.green : Colors.red }]}>
                      {isUp ? '+' : ''}{Math.round(totalProfit).toLocaleString()}원
                    </Text>
                  );
                })()}
              </View>

              {/* 보유 종목 리스트 */}
              {portfolio.map((stock: any) => {
                const isKR = stock.ticker.length === 6 && /^\d+$/.test(stock.ticker);
                const priceData = prices[stock.ticker];
                const currentPrice = priceData?.price ?? stock.avgPrice;
                const profit = (currentPrice - stock.avgPrice) * stock.quantity;
                const profitRate = stock.avgPrice > 0
                  ? ((currentPrice - stock.avgPrice) / stock.avgPrice * 100).toFixed(2)
                  : '0.00';
                const isPositive = profit >= 0;

                return (
                  <TouchableOpacity
                    key={stock.ticker}
                    onPress={() => {
                      const pd = prices[stock.ticker];
                      navigation.navigate('종목상세', {
                        ticker: stock.ticker,
                        price: pd?.price,
                        change: pd?.change,
                        changeAmount: pd?.changeAmount,
                        high: pd?.high,
                        low: pd?.low,
                        open: pd?.open,
                        volume: pd?.volume,
                        previousClose: pd?.previousClose,
                        week52High: pd?.week52High,
                        week52Low: pd?.week52Low,
                        per: pd?.per,
                        pbr: pd?.pbr,
                        marketState: pd?.marketState,
                      });
                    }}
                    style={s.holdingCard}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{ marginRight: 12 }}>
                        <StockLogo ticker={stock.ticker} size={44} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={s.stockName}>{stock.name}</Text>
                        <Text style={s.stockSub}>
                          {stock.quantity}주 · 평균{' '}
                          {isKR
                            ? `${Math.round(stock.avgPrice).toLocaleString()}원`
                            : `$${stock.avgPrice.toFixed(2)}`}
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.stockPrice}>
                          {isKR
                            ? `${Math.round(currentPrice * stock.quantity).toLocaleString()}원`
                            : `$${(currentPrice * stock.quantity).toFixed(2)}`}
                        </Text>
                        <Text style={[s.stockChange, { color: isPositive ? Colors.green : Colors.red }]}>
                          {isPositive ? '+' : ''}
                          {isKR
                            ? `${Math.round(profit).toLocaleString()}원`
                            : `$${profit.toFixed(2)}`}
                          {' '}({profitRate}%)
                        </Text>
                      </View>
                    </View>

                    {/* 수익률 바 */}
                    <View style={s.profitBarBg}>
                      <View style={[
                        s.profitBarFill,
                        {
                          backgroundColor: isPositive ? Colors.green : Colors.red,
                          width: `${Math.min(Math.abs(parseFloat(profitRate)) * 5, 100)}%`,
                        },
                      ]} />
                    </View>

                    {/* 현재가 */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
                      <Text style={s.stockSub}>
                        현재가{' '}
                        {isKR
                          ? `${Math.round(currentPrice).toLocaleString()}원`
                          : `$${currentPrice.toFixed(2)}`}
                      </Text>
                      <Text style={[s.stockChange, {
                        color: (priceData?.change ?? 0) >= 0 ? Colors.green : Colors.red,
                        fontSize: 12,
                      }]}>
                        {(priceData?.change ?? 0) >= 0 ? '+' : ''}
                        {(priceData?.change ?? 0).toFixed(2)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 100 }} />
            </View>
          )}
        </ScrollView>
      )}

      {/* ════════════════ 관심 탭 ════════════════ */}
      {selectedTab === '관심' && (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {wishlist.length === 0 ? (
            <View style={s.emptyWrap}>
              <Text style={{ fontSize: 48 }}>🤍</Text>
              <Text style={s.emptyText}>
                관심 종목이 없어요{'\n'}종목 옆 하트를 눌러 추가해보세요!
              </Text>
            </View>
          ) : (
            <View>
              {wishlist.map((stock: any) => {
                const priceData = prices[stock.ticker];
                const isKR = stock.isKR ?? (stock.ticker.length === 6 && /^\d+$/.test(stock.ticker));
                const displayPrice = priceData?.price ?? 0;
                const isPositive = (priceData?.change ?? 0) >= 0;

                return (
                  <TouchableOpacity
                    key={stock.ticker}
                    onPress={() => {
                      const pd = prices[stock.ticker];
                      navigation.navigate('종목상세', {
                        ticker: stock.ticker,
                        price: pd?.price,
                        change: pd?.change,
                        changeAmount: pd?.changeAmount,
                        high: pd?.high,
                        low: pd?.low,
                        open: pd?.open,
                        volume: pd?.volume,
                        previousClose: pd?.previousClose,
                        week52High: pd?.week52High,
                        week52Low: pd?.week52Low,
                        per: pd?.per,
                        pbr: pd?.pbr,
                        marketState: pd?.marketState,
                      });
                    }}
                    style={s.stockRow}
                    activeOpacity={0.7}
                  >
                    <View style={{ marginRight: 12 }}>
                      <StockLogo ticker={stock.ticker} size={44} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.stockName}>{stock.name}</Text>
                      <Text style={s.stockSub}>{stock.ticker} · {stock.sector}</Text>
                    </View>
                    {displayPrice > 0 ? (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={s.stockPrice}>
                          {isKR
                            ? `${Math.round(displayPrice).toLocaleString()}원`
                            : `$${displayPrice.toFixed(2)}`}
                        </Text>
                        <Text style={[s.stockChange, { color: isPositive ? Colors.green : Colors.red }]}>
                          {isPositive ? '+' : ''}{(priceData?.change ?? 0).toFixed(2)}%
                        </Text>
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color={Colors.textSub} />
                    )}
                    <TouchableOpacity
                      onPress={async () => {
                        if (!user?.id) return;
                        await updateDoc(doc(db, 'users', user.id), {
                          wishlist: arrayRemove(stock),
                        });
                      }}
                      style={{ marginLeft: 12 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Ionicons name="heart" size={22} color={Colors.green} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 100 }} />
            </View>
          )}
        </ScrollView>
      )}

      {/* ════════════════ 발견 탭 ════════════════ */}
      {selectedTab === '발견' && (
        <View style={{ flex: 1 }}>
          {/* 하위 탭 바 */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: Colors.border, backgroundColor: theme.bgCard }}>
            {[
              { id: 'realtime', label: '실시간 차트' },
              { id: 'trending', label: '지금 뜨는 카테고리' },
              { id: 'investor', label: '국내 투자자 동향' },
            ].map(tab => (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setDiscoverSubTab(tab.id as 'realtime' | 'trending' | 'investor')}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  alignItems: 'center',
                  borderBottomWidth: discoverSubTab === tab.id ? 2 : 0,
                  borderBottomColor: Colors.text,
                }}
              >
                <Text style={{
                  color: discoverSubTab === tab.id ? Colors.text : Colors.textSub,
                  fontWeight: discoverSubTab === tab.id ? '700' : '400',
                  fontSize: 13,
                }}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {discoverSubTab === 'realtime' && (
            <View style={{ flex: 1 }}>
              {/* 시장 토글 */}
              <View style={{
                flexDirection: 'row',
                padding: 12,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
                gap: 8,
              }}>
                {([
                  { id: 'all', label: '전체' },
                  { id: 'kr', label: '국내' },
                  { id: 'us', label: '미국' },
                ] as const).map(m => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setRealtimeMarket(m.id)}
                    style={{
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      borderRadius: 16,
                      backgroundColor: realtimeMarket === m.id ? Colors.text : theme.bgCard,
                      borderWidth: 1,
                      borderColor: realtimeMarket === m.id ? Colors.text : Colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 12,
                      color: realtimeMarket === m.id ? '#fff' : Colors.text,
                      fontWeight: '600',
                    }}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 정렬 옵션 */}
              <View style={{
                flexDirection: 'row',
                paddingHorizontal: 12,
                paddingVertical: 10,
                gap: 16,
              }}>
                {([
                  { id: 'value', label: '거래대금' },
                  { id: 'volume', label: '거래량' },
                  { id: 'change', label: '등락률' },
                ] as const).map(sort => (
                  <TouchableOpacity key={sort.id} onPress={() => setRealtimeSortBy(sort.id)}>
                    <Text style={{
                      fontSize: 13,
                      color: realtimeSortBy === sort.id ? Colors.text : Colors.textSub,
                      fontWeight: realtimeSortBy === sort.id ? '700' : '400',
                    }}>
                      {sort.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 종목 리스트 */}
              <ScrollView style={{ flex: 1 }}>
                <Text style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  fontSize: 11,
                  color: Colors.textSub,
                }}>
                  순위 · {new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })} 기준
                </Text>

                {realtimeTop20.map((item, idx) => (
                  <TouchableOpacity
                    key={item.stock.ticker}
                    onPress={() => navigation.navigate('종목상세', { ticker: item.stock.ticker })}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      paddingHorizontal: 16,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: Colors.border,
                    }}
                  >
                    <Text style={{ width: 28, fontSize: 14, color: Colors.textSub, fontWeight: '600' }}>
                      {idx + 1}
                    </Text>
                    <StockLogo ticker={item.stock.ticker} size={36} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>
                        {item.stock.name}
                      </Text>
                      {realtimeSortBy === 'value' && (
                        <Text style={{ fontSize: 11, color: Colors.textSub, marginTop: 2 }}>
                          거래대금 {Math.round(item.value / 100_000_000).toLocaleString()}억
                        </Text>
                      )}
                      {realtimeSortBy === 'volume' && (
                        <Text style={{ fontSize: 11, color: Colors.textSub, marginTop: 2 }}>
                          거래량 {item.volume.toLocaleString()}
                        </Text>
                      )}
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.text }}>
                        {item.stock.krw
                          ? `${Math.round(item.price).toLocaleString()}원`
                          : `$${item.price.toFixed(2)}`}
                      </Text>
                      <Text style={{
                        fontSize: 12,
                        color: item.change >= 0 ? theme.red : theme.blue,
                        marginTop: 2,
                      }}>
                        {item.change >= 0 ? '+' : ''}{item.change.toFixed(2)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {realtimeTop20.length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: Colors.textSub }}>데이터 로딩 중...</Text>
                  </View>
                )}
                <View style={{ height: 80 }} />
              </ScrollView>
            </View>
          )}

          {discoverSubTab === 'trending' && (
            <View style={{ flex: 1 }}>
              {/* 국내/미국 토글 */}
              <View style={{
                flexDirection: 'row',
                padding: 12,
                gap: 8,
                borderBottomWidth: 1,
                borderBottomColor: Colors.border,
              }}>
                {([
                  { id: 'kr', label: '국내' },
                  { id: 'us', label: '미국' },
                ] as const).map(m => (
                  <TouchableOpacity
                    key={m.id}
                    onPress={() => setTrendingMarket(m.id)}
                    style={{
                      paddingVertical: 8,
                      paddingHorizontal: 20,
                      borderRadius: 20,
                      backgroundColor: trendingMarket === m.id ? Colors.text : theme.bgCard,
                      borderWidth: 1,
                      borderColor: trendingMarket === m.id ? Colors.text : Colors.border,
                    }}
                  >
                    <Text style={{
                      fontSize: 13,
                      color: trendingMarket === m.id ? '#fff' : Colors.text,
                      fontWeight: '600',
                    }}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 시간 기준 */}
              <View style={{
                paddingHorizontal: 16,
                paddingVertical: 10,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
              }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: Colors.text }}>
                  {trendingMarket === 'kr' ? '국내' : '미국'}
                </Text>
                <Text style={{ fontSize: 11, color: Colors.textSub }}>
                  {new Date().toLocaleString('ko-KR', {
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })} 기준
                </Text>
              </View>

              {/* 섹터 리스트 */}
              <ScrollView style={{ flex: 1 }}>
                {trendingSectorsByMarket.map((ts, idx) => {
                  const isUp = ts.avgChange >= 0;
                  const emoji = SECTOR_EMOJI[ts.sector] ?? '📈';
                  return (
                    <TouchableOpacity
                      key={ts.sector}
                      onPress={() => {
                        setSelectedTab('전체');
                        setSelectedSector(ts.sector);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingHorizontal: 16,
                        paddingVertical: 14,
                        borderBottomWidth: 1,
                        borderBottomColor: Colors.border,
                      }}
                    >
                      <Text style={{
                        width: 28,
                        fontSize: 16,
                        color: isUp ? theme.red : theme.blue,
                        fontWeight: '600',
                      }}>
                        {idx + 1}
                      </Text>
                      <Text style={{ fontSize: 24, marginRight: 12 }}>{emoji}</Text>
                      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: Colors.text }}>
                        {ts.sector}
                      </Text>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ fontSize: 12, color: Colors.textSub }}>
                          {ts.count}개 중 {ts.riseCount}개
                        </Text>
                        <Text style={{
                          fontSize: 13,
                          color: isUp ? theme.red : theme.blue,
                          fontWeight: '600',
                          marginTop: 2,
                        }}>
                          {isUp ? '+' : ''}{ts.avgChange.toFixed(2)}%
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {trendingSectorsByMarket.length === 0 && (
                  <View style={{ padding: 40, alignItems: 'center' }}>
                    <Text style={{ color: Colors.textSub }}>데이터 로딩 중...</Text>
                  </View>
                )}
                <View style={{ height: 80 }} />
              </ScrollView>
            </View>
          )}

          {discoverSubTab === 'investor' && (
            <View style={{ flex: 1, padding: 16 }}>
              <Text style={{ color: Colors.textSub }}>국내 투자자 동향 - 작업 중</Text>
            </View>
          )}
        </View>
      )}
    </SafeAreaView>
  );
}

// ══════════════════════════════════════════════════
//  스타일
// ══════════════════════════════════════════════════
const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },

  // 헤더
  header: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
  },

  // 탭
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.bg,
  },
  tabChipActive: {
    backgroundColor: Colors.primary,
  },
  tabChipText: {
    color: Colors.textSub,
    fontWeight: 'bold',
    fontSize: 14,
  },
  tabChipTextActive: {},

  // 검색
  searchWrap: {
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: Colors.text,
  },

  // 마켓 필터
  marketRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
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
    fontWeight: 'bold',
    fontSize: 14,
  },
  marketBtnTextActive: {},

  // 섹터
  sectorScroll: {
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectorContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    alignItems: 'center',
  },
  sectorChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.bg,
  },
  sectorChipActive: {
    backgroundColor: Colors.text,
  },
  sectorChipText: {
    color: Colors.textSub,
    fontSize: 13,
  },
  sectorChipTextActive: {
    color: Colors.card,
    fontWeight: 'bold',
  },

  // 상태바
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    color: Colors.textSub,
    fontSize: 12,
  },

  // 종목 행
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stockLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stockLogoSm: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stockLogoText: {
    fontWeight: 'bold',
    fontSize: 12,
  },
  stockName: {
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.text,
  },
  stockSub: {
    color: Colors.textSub,
    fontSize: 12,
    marginTop: 2,
  },
  stockPrice: {
    fontWeight: 'bold',
    fontSize: 15,
    color: Colors.text,
  },
  stockChange: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },

  // 보유 카드
  holdingCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },

  // 수익률 바
  profitBarBg: {
    marginTop: 12,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  profitBarFill: {
    height: 4,
    borderRadius: 2,
  },

  // 보유 요약
  summaryCard: {
    backgroundColor: Colors.card,
    margin: 16,
    borderRadius: 20,
    padding: 20,
  },
  summaryLabel: {
    color: Colors.textSub,
    fontSize: 13,
  },
  summaryValue: {
    color: Colors.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  summaryProfit: {
    fontSize: 14,
    marginTop: 4,
  },

  // 빈 상태
  emptyWrap: {
    alignItems: 'center',
    padding: 60,
  },
  emptyText: {
    color: Colors.textSub,
    marginTop: 12,
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
  },
  emptyBtn: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    height: 48,
    justifyContent: 'center',
  },
  emptyBtnText: {
    fontWeight: 'bold',
    fontSize: 15,
  },

  // 발견
  discoverTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  discoverCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
  },
});
