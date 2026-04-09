/**
 * 종목 상세 화면 — 다크/라이트 테마
 * Yahoo Finance 실시간 연동 + 캔들/라인 차트 + 매수/매도 시트
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Modal,
  Dimensions, Platform, StatusBar, Keyboard,
  TouchableWithoutFeedback, KeyboardAvoidingView, BackHandler,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppStore, STOCKS } from '../store/appStore';
import { fetchStockNews } from '../lib/newsService';
import StockLogo from '../components/StockLogo';
import Svg, { Line as SvgLine, Rect, Path, Text as SvgText, G } from 'react-native-svg';
import {
  fetchSinglePrice, fetchChartData,
  CHART_PERIODS,
  type CandleData, type ChartPeriod, type PriceData,
} from '../utils/priceService';
import { saveNotif } from '../utils/notificationService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── 디자인 토큰 (테마 적응형) ──────────────────────────
function useDS() {
  const { theme } = useTheme();
  return useMemo(() => ({
    bg: theme.stockBg,
    card: theme.stockCard,
    cardAlt: theme.bgInput,
    rise: theme.red,
    fall: theme.blue,
    riseLight: theme.redLight,
    fallLight: theme.blueLight,
    text: theme.stockText,
    textSub: theme.textSecondary,
    textMuted: theme.textTertiary,
    textDim: theme.mode === 'dark' ? '#444444' : '#B0B8C1',
    border: theme.stockBorder,
    borderLight: theme.borderStrong,
    overlay: theme.overlay,
    radius: 12,
  }), [theme]);
}


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
  notifications?: Array<Record<string, any>>;
}

type TabName = '차트' | '호가' | '내 주식' | '종목정보';

// ══════════════════════════════════════════════════
//  KISChart (캔들 + 라인) — react-native-svg
// ══════════════════════════════════════════════════
const CHART_PAD = { top: 16, bottom: 28, left: 56, right: 12 };

interface KISChartProps {
  data: CandleData[];
  width: number;
  height: number;
  type: 'candle' | 'line';
  period: ChartPeriod;
  isKR: boolean;
  riseColor: string;
  fallColor: string;
  gridColor: string;
  labelColor: string;
}

function KISChart({ data, width, height, type, period, isKR, riseColor, fallColor, gridColor, labelColor }: KISChartProps) {
  if (data.length === 0) return null;

  const drawW = width - CHART_PAD.left - CHART_PAD.right;
  const drawH = height - CHART_PAD.top - CHART_PAD.bottom;

  const allHigh = Math.max(...data.map(d => d.high));
  const allLow = Math.min(...data.map(d => d.low));
  const range = allHigh - allLow || 1;

  const toY = (v: number) => CHART_PAD.top + drawH * (1 - (v - allLow) / range);
  const toX = (i: number) => CHART_PAD.left + (drawW / Math.max(data.length - 1, 1)) * i;
  const barW = Math.max(1, Math.min(8, drawW / data.length * 0.6));

  // Y축 눈금 (5개)
  const yTicks: number[] = [];
  for (let i = 0; i < 5; i++) {
    yTicks.push(allLow + (range * i) / 4);
  }

  // X축 라벨 (5개)
  const xStep = Math.max(1, Math.floor(data.length / 4));
  const xTicks: { idx: number; label: string }[] = [];
  for (let i = 0; i < data.length; i += xStep) {
    const d = data[i].date;
    const dateStr = d.length === 8
      ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      : d;
    const dt = new Date(dateStr);
    let label: string;
    if (period === '1d' || period === '5d') label = `${dt.getMonth() + 1}/${dt.getDate()}`;
    else if (period === '1mo' || period === '3mo') label = `${dt.getMonth() + 1}/${dt.getDate()}`;
    else label = `${dt.getFullYear()}.${dt.getMonth() + 1}`;
    xTicks.push({ idx: i, label });
  }

  // 라인 path
  const linePath = data
    .map((d, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(d.close).toFixed(1)}`)
    .join(' ');

  const lastClose = data[data.length - 1]?.close ?? 0;
  const firstClose = data[0]?.close ?? 0;
  const lineColor = lastClose >= firstClose ? riseColor : fallColor;

  const fmtTick = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1000) return isKR ? `${(v / 1000).toFixed(0)}K` : v.toFixed(2);
    return isKR ? Math.round(v).toString() : v.toFixed(2);
  };

  return (
    <Svg width={width} height={height}>
      {/* 그리드 + Y축 */}
      {yTicks.map((v, i) => (
        <G key={`y-${i}`}>
          <SvgLine
            x1={CHART_PAD.left} y1={toY(v)}
            x2={width - CHART_PAD.right} y2={toY(v)}
            stroke={gridColor} strokeWidth={1}
          />
          <SvgText
            x={CHART_PAD.left - 6} y={toY(v) + 4}
            fill={labelColor} fontSize={10} textAnchor="end"
          >
            {fmtTick(v)}
          </SvgText>
        </G>
      ))}

      {/* X축 */}
      {xTicks.map(({ idx, label }) => (
        <SvgText
          key={`x-${idx}`}
          x={toX(idx)} y={height - 6}
          fill={labelColor} fontSize={10} textAnchor="middle"
        >
          {label}
        </SvgText>
      ))}

      {/* 캔들 or 라인 */}
      {type === 'candle'
        ? data.map((d, i) => {
            const x = toX(i);
            const color = d.close >= d.open ? riseColor : fallColor;
            const bodyTop = toY(Math.max(d.open, d.close));
            const bodyBot = toY(Math.min(d.open, d.close));
            const bodyH = Math.max(1, bodyBot - bodyTop);
            return (
              <G key={`c-${i}`}>
                {/* 꼬리 (wick) */}
                <SvgLine
                  x1={x} y1={toY(d.high)}
                  x2={x} y2={toY(d.low)}
                  stroke={color} strokeWidth={1}
                />
                {/* 몸통 */}
                <Rect
                  x={x - barW / 2} y={bodyTop}
                  width={barW} height={bodyH}
                  fill={color}
                />
              </G>
            );
          })
        : (
          <Path d={linePath} stroke={lineColor} strokeWidth={2} fill="none" />
        )}
    </Svg>
  );
}

// ══════════════════════════════════════════════════
//  StockDetailScreen
// ══════════════════════════════════════════════════
export default function StockDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user } = useAuth();
  const { theme, isDark } = useTheme();
  const ticker = route.params?.ticker ?? 'AAPL';
  const { cash, holdings } = useAppStore();
  const DS = useDS();
  const s = useMemo(() => createMainStyles(DS), [DS]);

  const stock = STOCKS.find(s => s.ticker === ticker);

  if (!stock) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: DS.bg, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>😢</Text>
        <Text style={{ fontSize: 16, fontWeight: '700', color: DS.text }}>종목 정보를 불러올 수 없어요</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: DS.fall, fontSize: 15, fontWeight: '600' }}>돌아가기</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const isKR = stock.krw;
  const holding = (holdings ?? []).find(h => h.ticker === ticker);

  // ── Firestore 사용자 데이터 ──────────────────────
  const [userData, setUserData] = useState<UserData | null>(null);
  const [wishlist, setWishlist] = useState<any[]>([]);

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
        if (Array.isArray(data.wishlist)) setWishlist(data.wishlist);
      }
    });
    return () => unsubscribe();
  }, [user?.id]);

  useEffect(() => {
    const back = BackHandler.addEventListener(
      'hardwareBackPress',
      () => { navigation.goBack(); return true; }
    );
    return () => back.remove();
  }, []);

  // ── 전달받은 가격으로 초기값 설정 ──────────────────
  const passedPrice = route.params?.price;
  const initialQuote = passedPrice ? {
    price: passedPrice,
    change: route.params?.change ?? 0,
    changeAmount: route.params?.changeAmount ?? 0,
    high: route.params?.high ?? 0,
    low: route.params?.low ?? 0,
    open: route.params?.open ?? 0,
    volume: route.params?.volume ?? 0,
    previousClose: route.params?.previousClose ?? 0,
    week52High: route.params?.week52High ?? 0,
    week52Low: route.params?.week52Low ?? 0,
    per: route.params?.per ?? '-',
    pbr: route.params?.pbr ?? '-',
    marketState: route.params?.marketState ?? 'CLOSED',
    isKR,
  } : null;

  const [quote, setQuote] = useState<any>(initialQuote);
  const [priceLoading, setPriceLoading] = useState(!passedPrice);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabName>('차트');
  const [chartData, setChartData] = useState<CandleData[]>([]);
  const [financialData, setFinancialData] = useState<any>(null);
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('3mo');
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [showTradeSheet, setShowTradeSheet] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const isFavorite = wishlist.some((w: any) => w.ticker === ticker);
  const [showChartModal, setShowChartModal] = useState(false);

  // 현재가 (Yahoo Finance)
  const livePrice = quote?.price ?? 0;
  const liveChange = quote?.change ?? 0;
  const liveChangeAmount = quote?.changeAmount ?? 0;
  const isPositive = liveChange >= 0;
  const changeColor = isPositive ? DS.rise : DS.fall;
  const hasPrice = quote !== null && livePrice > 0;

  const fmt = (n: number) => isKR
    ? `${Math.round(n).toLocaleString()}원`
    : `$${n.toFixed(2)}`;
  const fmtOrDash = (n: number | undefined | null) =>
    n != null && n > 0 ? (isKR ? n.toLocaleString() : n.toFixed(2)) : '-';

  // ── Yahoo Finance 주가 로드 (v7 quote API — priceService 통일) ──
  const loadStockData = useCallback(async () => {
    try {
      setPriceLoading(true);
      setPriceError(null);
      const data = await fetchSinglePrice(ticker, isKR);
      if (data) {
        setQuote(data);
        console.log(`✅ 상세화면 가격 (${ticker}): ${data.price}`);
      } else {
        setPriceError('주가 데이터 없음');
      }
    } catch (error: any) {
      console.error('Yahoo 주가 로드 오류:', error);
      setPriceError(error.message ?? '주가 로드 실패');
    } finally {
      setPriceLoading(false);
    }
  }, [ticker, isKR]);

  useEffect(() => {
    loadStockData();
    const interval = setInterval(loadStockData, 30000);
    return () => clearInterval(interval);
  }, [loadStockData]);

  // ── 차트 로드 ──────────────────────────────────
  const loadChartData = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);
    try {
      const data = await fetchChartData(ticker, stock.krw, chartPeriod);
      setChartData(data);
    } catch (error: any) {
      console.error('차트 로드 오류:', error);
      setChartError(error.message ?? '차트 로드 실패');
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, [ticker, chartPeriod]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // ── 재무 데이터 로드 ──────────────────────────────
  useEffect(() => {
    const loadFinancial = async () => {
      try {
        const yt = isKR ? `${ticker}.KS` : ticker;
        const res = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yt}&fields=trailingPE,forwardPE,priceToBook,priceToSalesTrailing12Months,trailingEps,bookValue,marketCap,dividendYield,beta,averageVolume`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' } },
        );
        const data = await res.json();
        const item = data.quoteResponse?.result?.[0];
        if (item) {
          setFinancialData({
            per: item.trailingPE?.toFixed(2) ?? '-',
            forwardPER: item.forwardPE?.toFixed(2) ?? '-',
            pbr: item.priceToBook?.toFixed(2) ?? '-',
            psr: item.priceToSalesTrailing12Months?.toFixed(2) ?? '-',
            eps: item.trailingEps ? (isKR ? `${Math.round(item.trailingEps).toLocaleString()}원` : `$${item.trailingEps.toFixed(2)}`) : '-',
            bps: item.bookValue ? (isKR ? `${Math.round(item.bookValue).toLocaleString()}원` : `$${item.bookValue.toFixed(2)}`) : '-',
            marketCap: item.marketCap ? (isKR ? `${(item.marketCap / 1e12).toFixed(2)}조원` : `$${(item.marketCap / 1e9).toFixed(2)}B`) : '-',
            dividendYield: item.dividendYield ? `${(item.dividendYield * 100).toFixed(2)}%` : '-',
            beta: item.beta?.toFixed(2) ?? '-',
            avgVolume: item.averageVolume?.toLocaleString() ?? '-',
          });
        }
      } catch (e) {
        console.error('재무 데이터 오류:', e);
      }
    };
    loadFinancial();
  }, [ticker, isKR]);

  // ── 보유 주식 정보 ──────────────────────────────
  const ownedStock = userData?.portfolio?.find(p => p.ticker === ticker);

  // ── 매수/매도 핸들러 ──────────────────────────────
  function openSheet(type: 'buy' | 'sell') {
    if (!hasPrice) {
      Alert.alert('알림', '실시간 가격을 불러오지 못했어요. 잠시 후 다시 시도해주세요.');
      return;
    }
    if (type === 'sell' && !ownedStock) {
      Alert.alert('알림', '보유 수량이 없어요.');
      return;
    }
    setTradeType(type);
    setShowTradeSheet(true);
  }

  // ──────────────────────────────────────────────
  //  RENDER
  // ──────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: DS.bg, paddingTop: 59 }}>
      {/* ── 상단 헤더 ── */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 22, color: DS.text }}>←</Text>
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={s.headerName}>{stock.name}</Text>
        </View>

        <TouchableOpacity
          onPress={async () => {
            if (!user?.id) return;
            if (isFavorite) {
              const existing = wishlist.find((w: any) => w.ticker === ticker);
              if (existing) {
                await updateDoc(doc(db, 'users', user.id), {
                  wishlist: arrayRemove(existing),
                });
              }
            } else {
              await updateDoc(doc(db, 'users', user.id), {
                wishlist: arrayUnion({
                  ticker: stock.ticker,
                  name: stock.name,
                  sector: stock.sector ?? '',
                  bg: (stock as any).bg ?? '#8E8E93',
                  logo: stock.logo ?? '',
                  isKR,
                }),
              });
            }
          }}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 22, color: isFavorite ? DS.rise : DS.text }}>
            {isFavorite ? '❤️' : '🤍'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => Alert.alert('준비 중', '주가 알림 기능은 다음 업데이트에서 제공될 예정이에요! 🔔')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={{ fontSize: 20, color: DS.text }}>🔔</Text>
        </TouchableOpacity>
      </View>

      {/* 헤더 아래 가격 표시 */}
      <View style={{ alignItems: 'center', paddingVertical: 4, backgroundColor: theme.bgCard }}>
        {priceLoading ? (
          <ActivityIndicator size="small" />
        ) : hasPrice ? (
          <Text style={{ color: changeColor, fontSize: 13 }}>
            {fmt(livePrice)} {isPositive ? '+' : ''}{liveChange.toFixed(2)}%
          </Text>
        ) : null}
      </View>

      {/* ── 탭 메뉴 ── */}
      <View style={s.tabBar}>
        {(['차트', '호가', '내 주식', '종목정보'] as TabName[]).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setSelectedTab(tab)}
            style={[s.tabItem, selectedTab === tab && s.tabItemActive]}
          >
            <Text style={[
              s.tabText,
              selectedTab === tab && s.tabTextActive,
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>

        {/* ════════════════ 차트 탭 ════════════════ */}
        {selectedTab === '차트' && (
          <View>
            {/* 현재가 */}
            <View style={{ padding: 16 }}>
              {priceLoading ? (
                <ActivityIndicator color={DS.text} size="large" />
              ) : priceError ? (
                <View>
                  <Text style={{ color: DS.rise, fontSize: 14 }}>가격 로드 실패</Text>
                  <Text style={{ color: DS.textMuted, fontSize: 12, marginTop: 4 }}>{priceError}</Text>
                  <TouchableOpacity onPress={loadStockData} style={{ marginTop: 8 }}>
                    <Text style={{ color: DS.fall, fontSize: 13, fontWeight: 'bold' }}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              ) : hasPrice ? (
                <>
                  <Text style={{ color: changeColor, fontSize: 32, fontWeight: 'bold' }}>
                    {fmt(livePrice)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                    <Text style={{ color: changeColor, fontSize: 16 }}>
                      {isPositive ? '▲' : '▼'}{' '}
                      {Math.abs(liveChangeAmount).toLocaleString()}
                      {'  '}{isPositive ? '+' : ''}{liveChange.toFixed(2)}%
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={{ color: DS.textMuted, fontSize: 18 }}>데이터 없음</Text>
              )}
            </View>

            {/* 차트 타입 + 기간 선택 */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 }}>
              {[
                { key: 'candle' as const, label: '봉' },
                { key: 'line' as const, label: '라인' },
              ].map(t => (
                <TouchableOpacity
                  key={t.key}
                  onPress={() => setChartType(t.key)}
                  style={[s.chipBtn, chartType === t.key && s.chipBtnActive]}
                >
                  <Text style={[s.chipText, chartType === t.key && s.chipTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 }}>
              {CHART_PERIODS.map(p => (
                <TouchableOpacity
                  key={p.key}
                  onPress={() => setChartPeriod(p.key)}
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 6,
                    backgroundColor: chartPeriod === p.key ? DS.text : 'transparent',
                  }}
                >
                  <Text style={{
                    color: chartPeriod === p.key ? DS.bg : DS.textMuted,
                    fontWeight: chartPeriod === p.key ? 'bold' : 'normal',
                    fontSize: 14,
                  }}>
                    {p.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* SVG 차트 */}
            <View style={{ position: 'relative' }}>
              {chartLoading ? (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={DS.text} />
                </View>
              ) : chartError ? (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: DS.textMuted, marginBottom: 8 }}>차트 로드 실패</Text>
                  <TouchableOpacity onPress={loadChartData}>
                    <Text style={{ color: DS.fall, fontSize: 13, fontWeight: 'bold' }}>다시 시도</Text>
                  </TouchableOpacity>
                </View>
              ) : chartData.length > 0 ? (
                <KISChart
                  data={chartData}
                  width={SCREEN_WIDTH}
                  height={300}
                  type={chartType}
                  period={chartPeriod}
                  isKR={isKR}
                  riseColor={DS.rise}
                  fallColor={DS.fall}
                  gridColor={DS.border}
                  labelColor={DS.textSub}
                />
              ) : (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: DS.textMuted }}>차트 데이터 없음</Text>
                </View>
              )}

              {/* 차트 확대 버튼 */}
              {chartData.length > 0 && !chartLoading && (
                <TouchableOpacity
                  onPress={() => setShowChartModal(true)}
                  style={{
                    position: 'absolute', right: 16, bottom: 8,
                    backgroundColor: DS.cardAlt, borderRadius: 8, padding: 6,
                    borderWidth: 1, borderColor: DS.borderLight,
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ color: DS.text, fontSize: 16 }}>⛶</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* 머니몽 AI 버튼 — 차트 바로 아래 */}
            <TouchableOpacity
              onPress={() => navigation.navigate('AI분석', {
                ticker,
                stock: { ...stock, price: livePrice, change: liveChange },
              })}
              style={{
                marginHorizontal: 16, marginTop: 12, marginBottom: 4,
                backgroundColor: DS.cardAlt, borderRadius: 14, height: 52,
                justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
                borderWidth: 1, borderColor: DS.borderLight,
              }}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>🤖</Text>
              <View>
                <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 14 }}>
                  머니몽에게 물어보기
                </Text>
                <Text style={{ color: DS.textMuted, fontSize: 11 }}>
                  {stock.name} 실시간 분석
                </Text>
              </View>
            </TouchableOpacity>

            {/* 시세 정보 */}
            <View style={s.infoCard}>
              {[
                { label: '시가', value: fmtOrDash(quote?.open) },
                { label: '고가', value: fmtOrDash(quote?.high), color: DS.rise },
                { label: '저가', value: fmtOrDash(quote?.low), color: DS.fall },
                { label: '전일 종가', value: fmtOrDash(quote?.previousClose) },
                { label: '거래량', value: quote?.volume ? quote.volume.toLocaleString() : '-' },
                { label: '52주 최고', value: fmtOrDash(quote?.week52High), color: DS.rise },
                { label: '52주 최저', value: fmtOrDash(quote?.week52Low), color: DS.fall },
                { label: 'PER', value: quote?.per && quote.per !== '-' ? `${quote.per}배` : '-' },
                { label: 'PBR', value: quote?.pbr && quote.pbr !== '-' ? `${quote.pbr}배` : '-' },
              ].map((item, i, arr) => (
                <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                  <Text style={s.infoLabel}>{item.label}</Text>
                  <Text style={[s.infoValue, item.color ? { color: item.color } : {}]}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ════════════════ 호가 탭 ════════════════ */}
        {selectedTab === '호가' && (
          <OrderbookTab
            ticker={ticker}
            isKR={isKR}
            livePrice={livePrice}
            isPositive={isPositive}
            changeColor={changeColor}
            liveChange={liveChange}
            fmt={fmt}
            hasPrice={hasPrice}
            onBuy={() => openSheet('buy')}
            onSell={() => openSheet('sell')}
          />
        )}

        {/* ════════════════ 내 주식 탭 ════════════════ */}
        {selectedTab === '내 주식' && (
          <View style={{ padding: 16 }}>
            {ownedStock ? (
              <View>
                <View style={[s.infoCard, { padding: 20, marginHorizontal: 0 }]}>
                  <Text style={{ color: DS.textSub, fontSize: 13 }}>내 주식</Text>
                  <Text style={{ color: DS.text, fontSize: 28, fontWeight: 'bold', marginTop: 4 }}>
                    {hasPrice ? fmt(livePrice * ownedStock.quantity) : '-'}
                  </Text>
                  {(() => {
                    if (!hasPrice) return <Text style={{ color: DS.textMuted, fontSize: 16, marginTop: 4 }}>가격 로딩 중...</Text>;
                    const profitAmt = (livePrice - ownedStock.avgPrice) * ownedStock.quantity;
                    const profitRate = ((livePrice - ownedStock.avgPrice) / ownedStock.avgPrice * 100);
                    const profitColor = profitAmt >= 0 ? DS.rise : DS.fall;
                    return (
                      <Text style={{ color: profitColor, fontSize: 16, marginTop: 4 }}>
                        {profitAmt >= 0 ? '+' : ''}{Math.round(profitAmt).toLocaleString()}원
                        {' '}({profitRate.toFixed(2)}%)
                      </Text>
                    );
                  })()}
                </View>

                <View style={{ marginTop: 16 }}>
                  {[
                    { label: '보유수량', value: `${ownedStock.quantity}주` },
                    { label: '평균매수가', value: fmt(ownedStock.avgPrice) },
                    { label: '현재가', value: hasPrice ? fmt(livePrice) : '-' },
                    { label: '평가금액', value: hasPrice ? fmt(livePrice * ownedStock.quantity) : '-' },
                    { label: '매입금액', value: fmt(ownedStock.avgPrice * ownedStock.quantity) },
                  ].map((item, i) => (
                    <View key={i} style={[s.infoRow, { borderBottomWidth: 1, borderBottomColor: DS.border }]}>
                      <Text style={s.infoLabel}>{item.label}</Text>
                      <Text style={s.infoValue}>{item.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <View style={{ alignItems: 'center', padding: 40 }}>
                <Text style={{ fontSize: 48 }}>📭</Text>
                <Text style={{ color: DS.textMuted, marginTop: 12, textAlign: 'center' }}>
                  보유하지 않은 종목이에요{'\n'}매수하고 자산을 늘려보세요!
                </Text>
              </View>
            )}
          </View>
        )}

        {/* ════════════════ 종목정보 탭 ════════════════ */}
        {selectedTab === '종목정보' && (
          <View style={{ padding: 16 }}>
            {/* 기본 정보 */}
            <View style={[s.infoCard, { marginHorizontal: 0 }]}>
              <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>📋 기본 정보</Text>
              {[
                { label: '종목명', value: stock.name },
                { label: '티커', value: stock.ticker },
                { label: '섹터', value: stock.sector ?? '—' },
                { label: '시장', value: isKR ? '🇰🇷 한국 코스피/코스닥' : '🇺🇸 미국 나스닥/NYSE' },
                { label: '시가총액', value: financialData?.marketCap ?? '-' },
              ].map((item, i, arr) => (
                <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                  <Text style={s.infoLabel}>{item.label}</Text>
                  <Text style={s.infoValue}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* 밸류에이션 */}
            <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
              <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>📊 밸류에이션</Text>
              {[
                { label: 'PER (주가수익비율)', value: financialData?.per ? `${financialData.per}배` : '-', desc: 'PER이 낮을수록 저평가' },
                { label: 'Forward PER', value: financialData?.forwardPER ? `${financialData.forwardPER}배` : '-', desc: '예상 실적 기준 PER' },
                { label: 'PBR (주가순자산비율)', value: financialData?.pbr ? `${financialData.pbr}배` : '-', desc: '1 미만이면 청산가치 이하' },
                { label: 'PSR (주가매출비율)', value: financialData?.psr ? `${financialData.psr}배` : '-', desc: '낮을수록 저평가' },
                { label: 'EPS (주당순이익)', value: financialData?.eps ?? '-', desc: '높을수록 수익성 좋음' },
                { label: 'BPS (주당순자산)', value: financialData?.bps ?? '-', desc: '기업의 청산 가치' },
              ].map((item, i, arr) => (
                <View key={i} style={{ paddingVertical: 10, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: DS.border }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={s.infoLabel}>{item.label}</Text>
                    <Text style={[s.infoValue, { fontWeight: 'bold' }]}>{item.value}</Text>
                  </View>
                  <Text style={{ color: DS.textDim, fontSize: 11, marginTop: 2 }}>{item.desc}</Text>
                </View>
              ))}
            </View>

            {/* 투자 지표 */}
            <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
              <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>📈 투자 지표</Text>
              {([
                { label: '배당수익률', value: financialData?.dividendYield ?? '-' },
                { label: '베타 (변동성)', value: financialData?.beta ? `${financialData.beta} (${parseFloat(financialData.beta) > 1.2 ? '고위험' : parseFloat(financialData.beta) < 0.8 ? '저위험' : '중간'})` : '-' },
                { label: '52주 최고', value: fmtOrDash(quote?.week52High), color: DS.rise },
                { label: '52주 최저', value: fmtOrDash(quote?.week52Low), color: DS.fall },
                { label: '평균 거래량', value: financialData?.avgVolume ?? '-' },
              ] as Array<{ label: string; value: string; color?: string }>).map((item, i, arr) => (
                <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                  <Text style={s.infoLabel}>{item.label}</Text>
                  <Text style={[s.infoValue, item.color ? { color: item.color } : {}]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* AI 분석 버튼 */}
            <TouchableOpacity
              onPress={() => navigation.navigate('AI분석', {
                ticker,
                stock: { ...stock, price: livePrice, change: liveChange },
              })}
              style={[s.aiBtn, { marginTop: 12 }]}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 20, marginRight: 8 }}>🤖</Text>
              <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15 }}>
                AI에게 {stock.name} 분석 물어보기
              </Text>
            </TouchableOpacity>

            {/* 관련 뉴스 */}
            <StockNewsSection ticker={ticker} name={stock.name} isKR={isKR} />

          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── 하단 매수/매도 버튼 ── */}
      <View style={s.bottomBar}>
        <TouchableOpacity
          onPress={() => openSheet('sell')}
          style={[s.bottomBtn, { backgroundColor: DS.fallLight }]}
          activeOpacity={0.85}
        >
          <Text style={{ color: DS.fall, fontSize: 16, fontWeight: 'bold' }}>매도</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => openSheet('buy')}
          style={[s.bottomBtn, { backgroundColor: DS.riseLight }]}
          activeOpacity={0.85}
        >
          <Text style={{ color: DS.rise, fontSize: 16, fontWeight: 'bold' }}>매수</Text>
        </TouchableOpacity>
      </View>

      {/* ── 차트 확대 모달 ── */}
      {showChartModal && (
        <Modal
          visible={showChartModal}
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setShowChartModal(false)}
        >
          <View style={{ flex: 1, backgroundColor: DS.bg }}>
            <View style={{ flex: 1, paddingTop: 59 }}>
              {/* 헤더 */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 16,
                paddingVertical: 10
              }}>
                <TouchableOpacity onPress={() => setShowChartModal(false)}>
                  <Ionicons name="chevron-back" size={24} color={DS.text} />
                </TouchableOpacity>
                <Text style={{
                  flex: 1,
                  color: DS.text,
                  fontSize: 16,
                  fontWeight: 'bold',
                  marginLeft: 8
                }}>
                  {stock.name}
                </Text>
                <Text style={{
                  color: isPositive ? DS.rise : DS.fall,
                  fontSize: 16,
                  fontWeight: 'bold'
                }}>
                  {isKR
                    ? `${Math.round(stock.price ?? 0).toLocaleString()}원`
                    : `$${(stock.price ?? 0).toFixed(2)}`
                  }
                  {'  '}
                  {isPositive ? '+' : ''}{stock.change?.toFixed(2)}%
                </Text>
              </View>

              {/* 시작/최고/최저/거래량 */}
              <View style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingBottom: 8,
                borderBottomWidth: 1,
                borderBottomColor: DS.border
              }}>
                {[
                  { label: '시가', value: isKR ? `${Math.round(quote?.open ?? 0).toLocaleString()}` : `$${(quote?.open ?? 0).toFixed(2)}` },
                  { label: '최고', value: isKR ? `${Math.round(quote?.high ?? 0).toLocaleString()}` : `$${(quote?.high ?? 0).toFixed(2)}`, color: DS.rise },
                  { label: '최저', value: isKR ? `${Math.round(quote?.low ?? 0).toLocaleString()}` : `$${(quote?.low ?? 0).toFixed(2)}`, color: DS.fall },
                  { label: '거래량', value: quote?.volume ? `${(quote.volume/1000).toFixed(0)}K` : '-' }
                ].map((item: any, i) => (
                  <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: DS.textSub, fontSize: 11 }}>{item.label}</Text>
                    <Text style={{ color: item.color ?? DS.text, fontSize: 12, fontWeight: 'bold', marginTop: 2 }}>
                      {item.value}
                    </Text>
                  </View>
                ))}
              </View>

              {/* 도구 버튼 */}
              <View style={{
                flexDirection: 'row',
                paddingHorizontal: 16,
                paddingVertical: 8,
                gap: 8,
                borderBottomWidth: 1,
                borderBottomColor: DS.border
              }}>
                {['✏️ 선 그리기', '🔔 가격알림'].map(btn => (
                  <TouchableOpacity
                    key={btn}
                    onPress={btn === '🔔 가격알림' ? () => {
                      if (!user?.id) return;
                      if (Platform.OS === 'android') {
                        Alert.alert('안내', '가격 알림은 곧 안드로이드에서도 지원될 예정이에요! 🔔');
                        return;
                      }
                      Alert.prompt(
                        '목표 주가 설정',
                        `${stock.name} 목표 주가를 입력해주세요 (현재가: ${livePrice?.toLocaleString()}원)`,
                        async (targetPrice) => {
                          if (!targetPrice || isNaN(Number(targetPrice))) return;
                          const notif = {
                            id: Date.now().toString(),
                            type: 'price_alert',
                            title: '📈 가격 알림 설정',
                            body: `${stock.name} 목표가 ${Number(targetPrice).toLocaleString()}원 설정됨`,
                            ticker: ticker,
                            stockName: stock.name,
                            targetPrice: Number(targetPrice),
                            createdAt: new Date().toISOString(),
                            read: false,
                          };
                          const userRef = doc(db, 'users', user.id);
                          const snap = await getDoc(userRef);
                          const existing = snap.data()?.notifications ?? [];
                          await updateDoc(userRef, {
                            notifications: [notif, ...existing].slice(0, 50),
                          });
                          Alert.alert('✅ 설정 완료', `${stock.name} 목표가 ${Number(targetPrice).toLocaleString()}원이 설정됐어요!`);
                        },
                        'plain-text'
                      );
                    } : undefined}
                    style={{
                      backgroundColor: DS.card,
                      borderRadius: 20,
                      paddingHorizontal: 14,
                      paddingVertical: 7,
                      borderWidth: 1,
                      borderColor: DS.border
                    }}
                  >
                    <Text style={{ color: DS.text, fontSize: 12 }}>{btn}</Text>
                  </TouchableOpacity>
                ))}
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                  onPress={() => setShowChartModal(false)}
                  style={{
                    backgroundColor: DS.card,
                    borderRadius: 8,
                    padding: 8,
                    borderWidth: 1,
                    borderColor: DS.border
                  }}
                >
                  <Ionicons name="contract-outline" size={16} color={DS.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* 차트 */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
              {chartData.length > 0 ? (
                <LineChart
                  data={{
                    labels: [],
                    datasets: [{
                      data: chartData.map((d: any) => d.close),
                      color: () => isPositive ? DS.rise : DS.fall,
                      strokeWidth: 2
                    }]
                  }}
                  width={Dimensions.get('window').width}
                  height={Dimensions.get('window').height * 0.4}
                  withDots={false}
                  withInnerLines={true}
                  withOuterLines={false}
                  withVerticalLabels={false}
                  withHorizontalLabels={true}
                  chartConfig={{
                    backgroundColor: DS.bg,
                    backgroundGradientFrom: DS.bg,
                    backgroundGradientTo: DS.bg,
                    decimalPlaces: isKR ? 0 : 2,
                    color: () => isPositive ? DS.rise : DS.fall,
                    labelColor: () => DS.textMuted,
                    propsForBackgroundLines: { stroke: DS.card }
                  }}
                  bezier
                  style={{ paddingRight: 0 }}
                />
              ) : (
                <View style={{ alignItems: 'center', padding: 40 }}>
                  <ActivityIndicator color={DS.fall} size="large" />
                  <Text style={{ color: DS.textSub, marginTop: 12 }}>차트 로딩 중...</Text>
                </View>
              )}

              {/* 거래량 바 */}
              {chartData.length > 0 && (
                <View style={{ height: 60, flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 16, gap: 1, marginTop: 4 }}>
                  {chartData.slice(-40).map((d: any, i: number) => {
                    const maxV = Math.max(...chartData.slice(-40).map((x: any) => x.volume ?? 1))
                    return (
                      <View
                        key={i}
                        style={{
                          flex: 1,
                          height: Math.max(2, (d.volume / maxV) * 50),
                          backgroundColor: d.close >= d.open ? `${DS.rise}60` : `${DS.fall}60`,
                          borderRadius: 1
                        }}
                      />
                    )
                  })}
                </View>
              )}
            </View>

            {/* 기간 선택 + 매수매도 버튼 */}
            <SafeAreaView style={{ borderTopWidth: 1, borderTopColor: DS.border }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10 }}>
                {([
                  { key: '1d', label: '일' },
                  { key: '5d', label: '주' },
                  { key: '1mo', label: '월' },
                  { key: '1y', label: '년' }
                ] as const).map(p => (
                  <TouchableOpacity
                    key={p.key}
                    onPress={() => setChartPeriod(p.key)}
                    style={{
                      flex: 1,
                      paddingVertical: 8,
                      borderRadius: 8,
                      backgroundColor: chartPeriod === p.key ? DS.border : 'transparent',
                      alignItems: 'center'
                    }}
                  >
                    <Text style={{
                      color: chartPeriod === p.key ? DS.text : DS.textSub,
                      fontSize: 15,
                      fontWeight: chartPeriod === p.key ? 'bold' : 'normal'
                    }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setShowChartModal(false)
                    setTradeType('sell')
                    setShowTradeSheet(true)
                  }}
                  style={{
                    flex: 1, height: 52,
                    borderRadius: 30,
                    backgroundColor: DS.fall,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.bgCard, fontSize: 17, fontWeight: 'bold' }}>
                    판매하기
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setShowChartModal(false)
                    setTradeType('buy')
                    setShowTradeSheet(true)
                  }}
                  style={{
                    flex: 1, height: 52,
                    borderRadius: 30,
                    backgroundColor: DS.rise,
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  <Text style={{ color: theme.bgCard, fontSize: 17, fontWeight: 'bold' }}>
                    구매하기
                  </Text>
                </TouchableOpacity>
              </View>
            </SafeAreaView>
          </View>
        </Modal>
      )}

      {/* ── 매수/매도 시트 ── */}
      {showTradeSheet && (
        <TradeSheet
          stock={stock}
          livePrice={livePrice}
          liveChange={liveChange}
          isKR={isKR}
          type={tradeType}
          userData={userData}
          cash={cash}
          userId={user?.id}
          onClose={() => setShowTradeSheet(false)}
        />
      )}
    </View>
  );
}

// ══════════════════════════════════════════════════
//  TradeSheet (주문창)
// ══════════════════════════════════════════════════
interface TradeSheetProps {
  stock: { ticker: string; name: string; price: number; change: number; sector?: string; logo: string; krw: boolean };
  livePrice: number;
  liveChange: number;
  isKR: boolean;
  type: 'buy' | 'sell';
  userData: UserData | null;
  cash: number;
  userId?: string;
  onClose: () => void;
}

function TradeSheet({
  stock, livePrice, liveChange, isKR, type: initialType,
  userData, cash, userId, onClose,
}: TradeSheetProps) {
  const { theme } = useTheme();
  const DS = useDS();
  const [tradeType, setTradeType] = useState(initialType);
  const [fixedPrice] = useState(livePrice);
  const [quantity, setQuantity] = useState(0);
  const [quantityText, setQuantityText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const ownedStock = userData?.portfolio?.find(p => p.ticker === stock.ticker);
  const balance = userData?.balance ?? cash;
  const maxSellQty = ownedStock?.quantity ?? 0;
  const maxBuyQty = fixedPrice > 0
    ? (isKR ? Math.floor(balance / (fixedPrice * 1.001)) : parseFloat((balance / (fixedPrice * 1.001)).toFixed(4)))
    : 0;
  const maxQty = tradeType === 'buy' ? maxBuyQty : maxSellQty;
  const totalCost = fixedPrice * quantity * 1.001;
  const totalReceive = fixedPrice * quantity * 0.999;

  const isSellDisabled = tradeType === 'sell' && (quantity <= 0 || quantity > maxSellQty || maxSellQty === 0);
  const isBuyDisabled = tradeType === 'buy' && (quantity <= 0 || balance < fixedPrice * quantity * 1.001);
  const isButtonDisabled = isSellDisabled || isBuyDisabled || isLoading;

  const fmtP = (n: number) => {
    if (!n) return '-';
    return isKR ? `${Math.round(n).toLocaleString()}원` : `$${n.toFixed(2)}`;
  };

  const handleQuantityChange = (text: string) => {
    setQuantityText(text);
    if (isKR) {
      const num = parseInt(text.replace(/[^0-9]/g, '')) || 0;
      if (tradeType === 'sell' && num > maxSellQty) {
        setQuantity(maxSellQty);
        setQuantityText(maxSellQty.toString());
        return;
      }
      if (tradeType === 'buy' && num > maxBuyQty) {
        setQuantity(maxBuyQty);
        setQuantityText(maxBuyQty.toString());
        return;
      }
      setQuantity(Math.max(0, num));
    } else {
      const num = parseFloat(text.replace(/[^0-9.]/g, '')) || 0;
      if (tradeType === 'sell' && num > maxSellQty) {
        setQuantity(maxSellQty);
        setQuantityText(maxSellQty.toFixed(4));
        return;
      }
      if (tradeType === 'buy' && num > maxBuyQty) {
        setQuantity(maxBuyQty);
        setQuantityText(maxBuyQty.toFixed(4));
        return;
      }
      setQuantity(Math.max(0, num));
    }
  };

  const handleIncrease = () => {
    const step = isKR ? 1 : 0.1;
    const newQ = parseFloat((quantity + step).toFixed(4));
    if (newQ > maxQty) return;
    setQuantity(newQ);
    setQuantityText(isKR ? newQ.toString() : newQ.toFixed(1));
  };

  const handleDecrease = () => {
    const step = isKR ? 1 : 0.1;
    const newQ = Math.max(0, parseFloat((quantity - step).toFixed(4)));
    setQuantity(newQ);
    setQuantityText(newQ > 0 ? (isKR ? newQ.toString() : newQ.toFixed(1)) : '');
  };

  const handlePercentSelect = (pct: number) => {
    const base = tradeType === 'buy' ? maxBuyQty : maxSellQty;
    const newQty = isKR ? Math.floor(base * pct / 100) : parseFloat((base * pct / 100).toFixed(4));
    const safeQty = Math.max(0, newQty);
    setQuantity(safeQty);
    setQuantityText(safeQty > 0 ? (isKR ? safeQty.toString() : safeQty.toFixed(4)) : '');
  };

  const handleTrade = async () => {
    console.log('handleTrade 호출:', tradeType, quantity, fixedPrice);
    console.log('user.uid:', userId);
    if (!userId || quantity <= 0) {
      if (quantity <= 0) Alert.alert('알림', '수량을 입력해주세요');
      return;
    }

    try {
      setIsLoading(true);
      const tradePrice = fixedPrice;

      if (tradeType === 'buy') {
        const cost = isKR ? Math.floor(tradePrice * quantity * 1.001) : tradePrice * quantity * 1.001;
        if (balance < cost) {
          Alert.alert('잔액 부족', `필요: ${fmtP(cost)}\n보유: ${fmtP(balance)}`);
          return;
        }

        const existingStock = userData?.portfolio?.find(p => p.ticker === stock.ticker);
        const newPortfolio = existingStock
          ? (userData?.portfolio ?? []).map(p =>
              p.ticker === stock.ticker
                ? {
                    ...p,
                    quantity: p.quantity + quantity,
                    avgPrice: isKR
                      ? Math.round((p.avgPrice * p.quantity + tradePrice * quantity) / (p.quantity + quantity))
                      : parseFloat(((p.avgPrice * p.quantity + tradePrice * quantity) / (p.quantity + quantity)).toFixed(4)),
                    price: tradePrice,
                  }
                : p,
            )
          : [
              ...(userData?.portfolio ?? []),
              {
                ticker: stock.ticker, name: stock.name, quantity,
                avgPrice: tradePrice, price: tradePrice,
                sector: stock.sector ?? '기타', change: stock.change ?? 0,
                bg: '#8E8E93', logo: stock.logo ?? '',
              },
            ];

        const newBalance = balance - cost;
        const portfolioValue = newPortfolio.reduce((sum, p) => sum + (p.price ?? p.avgPrice) * p.quantity, 0);

        await updateDoc(doc(db, 'users', userId), {
          balance: newBalance,
          totalAsset: newBalance + portfolioValue,
          portfolio: newPortfolio,
          transactions: arrayUnion({
            type: 'buy', ticker: stock.ticker, stockName: stock.name,
            quantity, price: tradePrice, total: cost,
            fee: isKR ? Math.floor(tradePrice * quantity * 0.001) : tradePrice * quantity * 0.001,
            createdAt: new Date().toISOString(),
          }),
        });
        useAppStore.setState({ cash: newBalance, holdings: newPortfolio.map(p => ({ ticker: p.ticker, qty: p.quantity, avgPrice: p.avgPrice })) });

        const currentNotifs = Array.isArray(userData?.notifications)
          ? userData.notifications : [];

        await saveNotif(userId!, currentNotifs, {
          type: 'trade',
          title: '✅ 매수 완료',
          body: `${stock.name} ${isKR ? quantity : quantity.toFixed(4)}주 @ ${isKR ? `${Math.round(fixedPrice).toLocaleString()}원` : `$${fixedPrice.toFixed(2)}`}`,
          ticker: stock.ticker,
          stockName: stock.name,
          quantity,
          price: fixedPrice,
          total: totalCost,
          tradeType: 'buy'
        });

      } else {
        if (!ownedStock || ownedStock.quantity < quantity) {
          Alert.alert('보유 수량 부족', `보유: ${isKR ? (ownedStock?.quantity ?? 0) : (ownedStock?.quantity ?? 0).toFixed(4)}주`);
          return;
        }

        const sellAmount = isKR ? Math.floor(tradePrice * quantity * 0.999) : tradePrice * quantity * 0.999;
        const profit = isKR
          ? Math.floor((tradePrice - ownedStock.avgPrice) * quantity)
          : (tradePrice - ownedStock.avgPrice) * quantity;

        const newPortfolio = Math.abs(ownedStock.quantity - quantity) < 0.0001
          ? (userData?.portfolio ?? []).filter(p => p.ticker !== stock.ticker)
          : (userData?.portfolio ?? []).map(p =>
              p.ticker === stock.ticker ? { ...p, quantity: parseFloat((p.quantity - quantity).toFixed(4)) } : p,
            );

        const newBalance = balance + sellAmount;
        const portfolioValue = newPortfolio.reduce((sum, p) => sum + (p.price ?? p.avgPrice) * p.quantity, 0);

        await updateDoc(doc(db, 'users', userId), {
          balance: newBalance,
          totalAsset: newBalance + portfolioValue,
          portfolio: newPortfolio,
          transactions: arrayUnion({
            type: 'sell', ticker: stock.ticker, stockName: stock.name,
            quantity, price: tradePrice, avgPrice: ownedStock.avgPrice,
            total: sellAmount, profit,
            fee: isKR ? Math.floor(tradePrice * quantity * 0.001) : tradePrice * quantity * 0.001,
            createdAt: new Date().toISOString(),
          }),
        });
        useAppStore.setState({ cash: newBalance, holdings: newPortfolio.map(p => ({ ticker: p.ticker, qty: p.quantity, avgPrice: p.avgPrice })) });

        const currentNotifs = Array.isArray(userData?.notifications)
          ? userData.notifications : [];

        await saveNotif(userId!, currentNotifs, {
          type: 'trade',
          title: '✅ 매도 완료',
          body: `${stock.name} ${isKR ? quantity : quantity.toFixed(4)}주 @ ${isKR ? `${Math.round(fixedPrice).toLocaleString()}원` : `$${fixedPrice.toFixed(2)}`}`,
          ticker: stock.ticker,
          stockName: stock.name,
          quantity,
          price: fixedPrice,
          total: totalReceive,
          tradeType: 'sell'
        });
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      const qtyStr = isKR ? `${quantity}` : `${quantity.toFixed(4)}`;
      Alert.alert(
        tradeType === 'buy' ? '매수 완료' : '매도 완료',
        `${stock.name} ${qtyStr}주 ${tradeType === 'buy' ? '매수' : '매도'} 완료!\n체결가: ${fmtP(tradePrice)}`,
      );
    } catch (e: any) {
      console.error('거래 오류:', e);
      Alert.alert('거래 오류', e?.message ?? '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: DS.overlay }}
        activeOpacity={1}
        onPress={onClose}
      />

        {/* 시트 본체 */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={{
            backgroundColor: DS.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
            maxHeight: Dimensions.get('window').height * 0.85,
          }}>
            {/* 핸들 */}
            <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 4 }}>
              <View style={{ width: 40, height: 4, backgroundColor: DS.border, borderRadius: 2 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" bounces contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
              {/* 탭: 매수/매도 */}
              <View style={{ flexDirection: 'row', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: DS.border }}>
                {(['매수', '매도'] as const).map(t => {
                  const isBuy = t === '매수';
                  const isActive = (isBuy && tradeType === 'buy') || (!isBuy && tradeType === 'sell');
                  const activeColor = isBuy ? DS.rise : DS.fall;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => { setTradeType(isBuy ? 'buy' : 'sell'); setQuantity(0); setQuantityText(''); }}
                      style={{ flex: 1, paddingVertical: 10, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: isActive ? activeColor : 'transparent' }}
                    >
                      <Text style={{ color: isActive ? activeColor : DS.textMuted, fontSize: 15, fontWeight: 'bold' }}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* 보유 현황 */}
              <View style={{ backgroundColor: DS.cardAlt, borderRadius: 12, padding: 12, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: DS.textSub, fontSize: 12 }}>{tradeType === 'buy' ? '주문가능' : '보유수량'}</Text>
                  <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
                    {tradeType === 'buy' ? `${Math.round(balance).toLocaleString()}원` : isKR ? `${maxSellQty}주` : `${maxSellQty.toFixed(4)}주`}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: DS.textSub, fontSize: 12 }}>{tradeType === 'buy' ? '최대 매수' : '평균매수가'}</Text>
                  <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>
                    {tradeType === 'buy' ? (isKR ? `${maxBuyQty}주` : `${maxBuyQty.toFixed(4)}주`) : fmtP(ownedStock?.avgPrice ?? 0)}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: DS.textSub, fontSize: 12 }}>체결가</Text>
                  <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>{fmtP(fixedPrice)}</Text>
                </View>
              </View>

              {/* 수량 입력 */}
              <View style={{ marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8, paddingHorizontal: 4 }}>
                  <Text style={{ color: DS.textSub, fontSize: 13 }}>수량{!isKR && <Text style={{ color: DS.fall, fontSize: 11 }}> (소수점 가능)</Text>}</Text>
                  <Text style={{ color: quantity >= maxQty ? DS.rise : DS.textSub, fontSize: 12, fontWeight: quantity >= maxQty ? 'bold' : 'normal' }}>
                    최대 {isKR ? `${maxQty}주` : `${maxQty.toFixed(4)}주`}
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: DS.borderLight, borderRadius: 12, padding: 12 }}>
                  <TouchableOpacity onPress={handleDecrease} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: DS.border, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: DS.text, fontSize: 22 }}>−</Text>
                  </TouchableOpacity>
                  <TextInput
                    value={quantityText}
                    onChangeText={handleQuantityChange}
                    keyboardType="decimal-pad"
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                    blurOnSubmit
                    placeholder={isKR ? '수량' : '수량 (소수점)'}
                    placeholderTextColor={DS.textDim}
                    style={{ flex: 1, textAlign: 'center', fontSize: 24, fontWeight: 'bold', color: quantity > maxQty ? DS.rise : DS.text }}
                  />
                  <TouchableOpacity onPress={handleIncrease} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: DS.border, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={{ color: DS.text, fontSize: 22 }}>+</Text>
                  </TouchableOpacity>
                </View>
                {quantity > maxQty && (
                  <Text style={{ color: DS.rise, fontSize: 13, textAlign: 'center', marginTop: 6, fontWeight: 'bold' }}>
                    {tradeType === 'buy' ? '잔액이 부족해요' : '보유 수량을 초과했어요'}
                  </Text>
                )}
              </View>

              {/* % 버튼 */}
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                {[10, 25, 50, 100].map(pct => (
                  <TouchableOpacity
                    key={pct}
                    onPress={() => handlePercentSelect(pct)}
                    style={{ flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: DS.cardAlt, alignItems: 'center', borderWidth: 1, borderColor: DS.border }}
                  >
                    <Text style={{ color: DS.text, fontSize: 13, fontWeight: 'bold' }}>{pct}%</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 주문 요약 */}
              <View style={{ backgroundColor: DS.cardAlt, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                {[
                  { label: '체결 가격', value: fmtP(fixedPrice) },
                  { label: '수량', value: isKR ? `${quantity}주` : `${quantity.toFixed(4)}주` },
                  { label: '수수료 (0.1%)', value: fmtP(fixedPrice * quantity * 0.001) },
                ].map((item, i, arr) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: DS.border }}>
                    <Text style={{ color: DS.textSub, fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: DS.text }}>{item.value}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: DS.borderLight }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: DS.text }}>{tradeType === 'buy' ? '총 결제금액' : '총 수령금액'}</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: tradeType === 'buy' ? DS.rise : DS.fall }}>
                    {tradeType === 'buy' ? fmtP(totalCost) : fmtP(totalReceive)}
                  </Text>
                </View>
              </View>

              {/* 매수/매도 버튼 */}
              <TouchableOpacity
                onPress={handleTrade}
                disabled={isButtonDisabled}
                style={{
                  height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
                  backgroundColor: isButtonDisabled ? DS.borderLight : tradeType === 'buy' ? DS.rise : DS.fall,
                }}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color={theme.bgCard} />
                ) : (
                  <Text style={{ color: isButtonDisabled ? DS.textMuted : theme.bgCard, fontSize: 17, fontWeight: 'bold' }}>
                    {tradeType === 'sell' && quantity > maxSellQty
                      ? '보유 수량 초과'
                      : tradeType === 'buy' && balance < totalCost
                        ? '잔액 부족'
                        : tradeType === 'buy'
                          ? `${isKR ? quantity : quantity.toFixed(4)}주 매수하기`
                          : `${isKR ? quantity : quantity.toFixed(4)}주 매도하기`}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={{ color: DS.textDim, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
                실제 투자가 아닌 모의투자입니다
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
    </Modal>
  );
}

// ══════════════════════════════════════════════════
//  OrderbookTab — 호가 데이터
// ══════════════════════════════════════════════════
interface OrderbookTabProps {
  ticker: string;
  isKR: boolean;
  livePrice: number;
  isPositive: boolean;
  changeColor: string;
  liveChange: number;
  fmt: (n: number) => string;
  hasPrice: boolean;
  onBuy: () => void;
  onSell: () => void;
}

function OrderbookTab({ ticker, isKR, livePrice, isPositive, changeColor, liveChange, fmt, hasPrice, onBuy, onSell }: OrderbookTabProps) {
  const DS = useDS();
  const [orderbookData, setOrderbookData] = useState<{
    asks: { price: number; quantity: number; rate: number }[];
    bids: { price: number; quantity: number; rate: number }[];
    totalAskQty: number;
    totalBidQty: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrderbook();
  }, [ticker, livePrice]);

  const loadOrderbook = async () => {
    if (!livePrice || livePrice <= 0) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const yahooTicker = isKR ? `${ticker}.KS` : ticker;
      const response = await fetch(
        `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooTicker}&fields=bid,ask,bidSize,askSize,regularMarketPrice,regularMarketVolume`,
        { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' } },
      );
      const data = await response.json();
      const quote = data.quoteResponse?.result?.[0];

      const currentPrice = quote?.regularMarketPrice ?? livePrice;
      const bid = quote?.bid ?? currentPrice * 0.999;
      const ask = quote?.ask ?? currentPrice * 1.001;

      const tickSize = isKR
        ? currentPrice >= 500000 ? 1000
        : currentPrice >= 100000 ? 500
        : currentPrice >= 50000 ? 100
        : currentPrice >= 10000 ? 50
        : currentPrice >= 5000 ? 10
        : 5
        : 0.01;

      const asks = Array.from({ length: 10 }, (_, i) => {
        const p = isKR
          ? Math.round((ask + tickSize * (9 - i)) / tickSize) * tickSize
          : parseFloat((ask + 0.01 * (9 - i)).toFixed(2));
        return {
          price: p,
          quantity: Math.floor(Math.random() * 200 + 10),
          rate: parseFloat(((p - currentPrice) / currentPrice * 100).toFixed(2)),
        };
      });

      const bids = Array.from({ length: 10 }, (_, i) => {
        const p = isKR
          ? Math.round((bid - tickSize * i) / tickSize) * tickSize
          : parseFloat((bid - 0.01 * i).toFixed(2));
        return {
          price: p,
          quantity: Math.floor(Math.random() * 200 + 10),
          rate: parseFloat(((p - currentPrice) / currentPrice * 100).toFixed(2)),
        };
      });

      setOrderbookData({
        asks,
        bids,
        totalAskQty: asks.reduce((s, a) => s + a.quantity, 0),
        totalBidQty: bids.reduce((s, b) => s + b.quantity, 0),
      });
    } catch (error) {
      console.error('호가 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <ActivityIndicator color={DS.text} />
        <Text style={{ color: DS.textMuted, marginTop: 12 }}>호가 로딩 중...</Text>
      </View>
    );
  }

  if (!orderbookData || !hasPrice) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
        <Text style={{ color: DS.textMuted, textAlign: 'center', lineHeight: 22 }}>
          호가 데이터를 불러올 수 없어요
        </Text>
      </View>
    );
  }

  const fmtOB = (p: number) => isKR ? Math.round(p).toLocaleString() : p.toFixed(2);

  return (
    <View>
      {/* 체결강도 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: DS.card }}>
        <Text style={{ color: DS.textSub, fontSize: 13 }}>체결강도</Text>
        <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 13 }}>
          {orderbookData.totalAskQty > 0
            ? (orderbookData.totalBidQty / orderbookData.totalAskQty * 100).toFixed(2)
            : '-'}%
        </Text>
      </View>

      {/* 매도호가 (asks) */}
      {orderbookData.asks.map((ask, i) => (
        <TouchableOpacity
          key={`ask-${i}`}
          onPress={onBuy}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: DS.cardAlt,
            backgroundColor: DS.card,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ flex: 1, color: DS.textMuted, fontSize: 13, textAlign: 'right' }}>
            {ask.quantity.toLocaleString()}
          </Text>
          <Text style={{ flex: 1.5, color: DS.fall, fontSize: 15, fontWeight: 'bold', textAlign: 'center' }}>
            {fmtOB(ask.price)}
          </Text>
          <Text style={{ flex: 1, color: DS.fall, fontSize: 12, textAlign: 'left' }}>
            {ask.rate > 0 ? '+' : ''}{ask.rate}%
          </Text>
        </TouchableOpacity>
      ))}

      {/* 현재가 */}
      <View style={{
        backgroundColor: DS.cardAlt, padding: 16, alignItems: 'center',
        borderWidth: 1, borderColor: DS.borderLight,
      }}>
        <Text style={{ color: changeColor, fontSize: 24, fontWeight: 'bold' }}>
          {fmt(livePrice)}
        </Text>
        <Text style={{ color: changeColor, fontSize: 14, marginTop: 4 }}>
          {isPositive ? '+' : ''}{liveChange.toFixed(2)}%
        </Text>
      </View>

      {/* 매수호가 (bids) */}
      {orderbookData.bids.map((bid, i) => (
        <TouchableOpacity
          key={`bid-${i}`}
          onPress={onSell}
          style={{
            flexDirection: 'row', alignItems: 'center',
            paddingHorizontal: 16, paddingVertical: 10,
            borderBottomWidth: 1, borderBottomColor: DS.cardAlt,
            backgroundColor: DS.card,
          }}
          activeOpacity={0.7}
        >
          <Text style={{ flex: 1, color: DS.rise, fontSize: 12, textAlign: 'right' }}>
            {bid.rate > 0 ? '+' : ''}{bid.rate}%
          </Text>
          <Text style={{ flex: 1.5, color: DS.rise, fontSize: 15, fontWeight: 'bold', textAlign: 'center' }}>
            {fmtOB(bid.price)}
          </Text>
          <Text style={{ flex: 1, color: DS.textMuted, fontSize: 13, textAlign: 'left' }}>
            {bid.quantity.toLocaleString()}
          </Text>
        </TouchableOpacity>
      ))}

      {/* 총 잔량 */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 16, backgroundColor: DS.card }}>
        <Text style={{ color: DS.fall, fontWeight: 'bold', fontSize: 14 }}>
          판매 대기 {orderbookData.totalAskQty.toLocaleString()}
        </Text>
        <Text style={{ color: DS.rise, fontWeight: 'bold', fontSize: 14 }}>
          구매 대기 {orderbookData.totalBidQty.toLocaleString()}
        </Text>
      </View>
    </View>
  );
}

// ══════════════════════════════════════════════════
//  StockNewsSection — 종목 관련 뉴스
// ══════════════════════════════════════════════════
function StockNewsSection({ ticker, name, isKR }: { ticker: string; name: string; isKR: boolean }) {
  const DS = useDS();
  const [news, setNews] = useState<any[]>([]);
  const navigation = useNavigation<any>();

  useEffect(() => {
    fetchStockNews(ticker, name).then(setNews).catch(console.error);
  }, [ticker, name]);

  if (news.length === 0) return null;

  return (
    <View style={{ marginTop: 16 }}>
      <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>
        관련 뉴스
      </Text>
      {news.slice(0, 5).map((item, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => navigation.navigate('WebView', { url: item.url, title: item.title })}
          style={{ backgroundColor: DS.card, borderRadius: DS.radius, padding: 14, marginBottom: 8 }}
          activeOpacity={0.7}
        >
          <Text style={{ color: DS.text, fontSize: 14, lineHeight: 20 }}>{item.title}</Text>
          <Text style={{ color: DS.textMuted, fontSize: 12, marginTop: 6 }}>
            {item.source} · {new Date(item.publishedAt).toLocaleString('ko-KR', {
              month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
            })}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ══════════════════════════════════════════════════
//  스타일
// ══════════════════════════════════════════════════
function createMainStyles(DS: ReturnType<typeof useDS>) {
  return StyleSheet.create({
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  headerName: {
    color: DS.text,
    fontSize: 15,
    fontWeight: 'bold',
  },

  // 탭
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: DS.text,
  },
  tabText: {
    color: DS.textMuted,
    fontSize: 13,
  },
  tabTextActive: {
    color: DS.text,
    fontWeight: 'bold',
  },

  // 칩 버튼
  chipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: DS.borderLight,
  },
  chipBtnActive: {
    backgroundColor: DS.borderLight,
    borderColor: DS.borderLight,
  },
  chipText: {
    color: DS.textMuted,
    fontSize: 13,
  },
  chipTextActive: {
    color: DS.text,
  },

  // 정보 카드
  infoCard: {
    margin: 16,
    backgroundColor: DS.card,
    borderRadius: DS.radius,
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  infoRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  infoLabel: {
    color: DS.textSub,
    fontSize: 14,
  },
  infoValue: {
    color: DS.text,
    fontSize: 14,
    fontWeight: '600',
  },

  // AI 버튼
  aiBtn: {
    marginTop: 16,
    backgroundColor: DS.cardAlt,
    borderRadius: DS.radius,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: DS.borderLight,
  },

  // 하단 바
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: DS.bg,
    borderTopWidth: 1,
    borderTopColor: DS.border,
    gap: 12,
  },
  bottomBtn: {
    flex: 1,
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
}

// TradeSheet 스타일
function createTradeStyles(DS: ReturnType<typeof useDS>) {
  return StyleSheet.create({
  sheet: {
    backgroundColor: DS.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  tabBar: {
    flexDirection: 'row',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: DS.border,
  },
  tabItem: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    color: DS.textMuted,
    fontSize: 14,
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: DS.borderLight,
    borderRadius: 8,
    padding: 12,
  },
  circleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: DS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBtnText: {
    color: DS.text,
    fontSize: 20,
  },
  inputText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  pctBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 6,
    backgroundColor: DS.cardAlt,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: DS.border,
  },
  pctBtnActive: {
    backgroundColor: DS.borderLight,
    borderColor: DS.borderLight,
  },
  pctText: {
    color: DS.textMuted,
    fontSize: 13,
    fontWeight: 'bold',
  },
  pctTextActive: {
    color: DS.text,
  },
  amountBox: {
    backgroundColor: DS.cardAlt,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  tradeBtn: {
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
}
