/**
 * 투자 탭 — 전체/보유/관심/발견
 * Yahoo Finance 실시간 가격 + Firestore 포트폴리오/관심종목
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  ActivityIndicator, TextInput, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useAppStore, STOCKS, type Stock } from '../store/appStore';
import { Colors } from '../components/ui';
import { fetchMultiplePrices } from '../utils/priceService';

// ── 타입 ──────────────────────────────────────────
type InvestTab = '전체' | '보유' | '관심' | '발견';
type MarketFilter = 'KR' | 'US';

// ── 종목 분류 ─────────────────────────────────────
const KR_STOCKS = STOCKS.filter(s => s.krw);
const US_STOCKS = STOCKS.filter(s => !s.krw);

const KR_SECTORS = ['전체', ...Array.from(new Set(KR_STOCKS.map(s => s.sector)))];
const US_SECTORS = ['전체', ...Array.from(new Set(US_STOCKS.map(s => s.sector)))];

// ══════════════════════════════════════════════════
//  InvestScreen
// ══════════════════════════════════════════════════
export default function InvestScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { holdings, cash } = useAppStore();

  const [selectedTab, setSelectedTab] = useState<InvestTab>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<MarketFilter>('KR');
  const [selectedSector, setSelectedSector] = useState('전체');
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        await updateDoc(doc(db, 'users', user.id), {
          wishlist: arrayUnion(stockInfo),
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

      {/* ── 메인 탭 ── */}
      <View style={s.tabBar}>
        {(['전체', '보유', '관심', '발견'] as InvestTab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[s.tabChip, selectedTab === tab && s.tabChipActive]}
          >
            <Text style={[s.tabChipText, selectedTab === tab && s.tabChipTextActive]}>
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
                <Text style={[s.marketBtnText, selectedMarket === market && s.marketBtnTextActive]}>
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
              <View style={[s.statusDot, { backgroundColor: isLoadingPrices ? '#FF9500' : '#34C759' }]} />
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
                  <View style={[s.stockLogo, { backgroundColor: (item as any).bg ?? '#8E8E93' }]}>
                    <Text style={s.stockLogoText}>{item.logo || item.ticker.slice(0, 2)}</Text>
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
                <Text style={s.emptyBtnText}>종목 둘러보기</Text>
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
                      <View style={[s.stockLogo, { backgroundColor: (stock as any).bg ?? '#8E8E93' }]}>
                        <Text style={s.stockLogoText}>{stock.logo || stock.ticker.slice(0, 2)}</Text>
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
                    <View style={[s.stockLogo, { backgroundColor: (stock as any).bg ?? '#8E8E93' }]}>
                      <Text style={s.stockLogoText}>{stock.logo || stock.ticker.slice(0, 2)}</Text>
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
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
          {/* 급등 종목 */}
          <Text style={s.discoverTitle}>급등 종목</Text>
          {[...KR_STOCKS, ...US_STOCKS]
            .filter(st => prices[st.ticker])
            .sort((a, b) => (prices[b.ticker]?.change ?? 0) - (prices[a.ticker]?.change ?? 0))
            .slice(0, 5)
            .map(stock => {
              const priceData = prices[stock.ticker];
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
                    });
                  }}
                  style={s.discoverCard}
                  activeOpacity={0.7}
                >
                  <View style={[s.stockLogoSm, { backgroundColor: (stock as any).bg ?? '#8E8E93' }]}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>
                      {stock.logo || stock.ticker.slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.stockName}>{stock.name}</Text>
                    <Text style={s.stockSub}>{stock.sector}</Text>
                  </View>
                  <Text style={{ color: Colors.green, fontWeight: 'bold', fontSize: 16 }}>
                    +{priceData?.change?.toFixed(2)}%
                  </Text>
                </TouchableOpacity>
              );
            })}

          {/* 급락 종목 */}
          <Text style={[s.discoverTitle, { marginTop: 20 }]}>급락 종목</Text>
          {[...KR_STOCKS, ...US_STOCKS]
            .filter(st => prices[st.ticker])
            .sort((a, b) => (prices[a.ticker]?.change ?? 0) - (prices[b.ticker]?.change ?? 0))
            .slice(0, 5)
            .map(stock => {
              const priceData = prices[stock.ticker];
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
                    });
                  }}
                  style={s.discoverCard}
                  activeOpacity={0.7}
                >
                  <View style={[s.stockLogoSm, { backgroundColor: (stock as any).bg ?? '#8E8E93' }]}>
                    <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 11 }}>
                      {stock.logo || stock.ticker.slice(0, 2)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.stockName}>{stock.name}</Text>
                    <Text style={s.stockSub}>{stock.sector}</Text>
                  </View>
                  <Text style={{ color: Colors.red, fontWeight: 'bold', fontSize: 16 }}>
                    {priceData?.change?.toFixed(2)}%
                  </Text>
                </TouchableOpacity>
              );
            })}
          <View style={{ height: 100 }} />
        </ScrollView>
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
  tabChipTextActive: {
    color: '#FFFFFF',
  },

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
  marketBtnTextActive: {
    color: '#FFFFFF',
  },

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
    color: '#FFFFFF',
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
    color: '#FFFFFF',
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
