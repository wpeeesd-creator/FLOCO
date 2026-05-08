/**
 * 종목 상세 화면 — 다크/라이트 테마
 * Yahoo Finance 실시간 연동 + 캔들/라인 차트 + 매수/매도 시트
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  BackHandler,
} from 'react-native';
import { Text } from '../components/ui/Text';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppStore, STOCKS } from '../store/appStore';
import { fetchStockNews } from '../lib/newsService';
import StockLogo from '../components/StockLogo';
import Svg, { Line as SvgLine, Rect, Path, Text as SvgText, G } from 'react-native-svg';
import {
  fetchSinglePrice, fetchChartData, getExchangeRate,
  CHART_PERIODS,
  type CandleData, type ChartPeriod, type PriceData,
} from '../utils/priceService';
import { saveNotif } from '../utils/notificationService';
import { updateMissionProgress } from '../lib/missionService';
import { validateReason, getReasonStatus } from '../utils/reasonValidator';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── 디자인 토큰 (테마 적응형) ──────────────────────────
function useDS() {
  const { theme, isDark } = useTheme();
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
    textDim: isDark ? '#444444' : '#B0B8C1',
    border: theme.stockBorder,
    borderLight: theme.borderStrong,
    overlay: theme.overlay,
    radius: 12,
  }), [theme, isDark]);
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

// 미국 서머타임 (DST): 3월 둘째 일요일 ~ 11월 첫째 일요일
function isUSDST(): boolean {
  const now = new Date();
  const year = now.getFullYear();
  const dstStart = new Date(year, 2, 1);
  while (dstStart.getDay() !== 0) dstStart.setDate(dstStart.getDate() + 1);
  dstStart.setDate(dstStart.getDate() + 7);
  const dstEnd = new Date(year, 10, 1);
  while (dstEnd.getDay() !== 0) dstEnd.setDate(dstEnd.getDate() + 1);
  return now >= dstStart && now < dstEnd;
}

function getUSMarketHoursKST(): string {
  // EDT(서머타임): KST 22:30 ~ 05:00 / EST: KST 23:30 ~ 06:00
  return isUSDST()
    ? 'NY 09:30~16:00 (KST 22:30~05:00 다음날)'
    : 'NY 09:30~16:00 (KST 23:30~06:00 다음날)';
}

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

  // X축 라벨 (5개) — 1d는 시간(HH:MM), 그 외는 날짜
  const xStep = Math.max(1, Math.floor(data.length / 4));
  const xTicks: { idx: number; label: string }[] = [];
  for (let i = 0; i < data.length; i += xStep) {
    const ts = data[i].timestamp;
    const d = data[i].date;
    const dateStr = d.length === 8
      ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`
      : d;
    const dt = ts ? new Date(ts * 1000) : new Date(dateStr);
    let label: string;
    if (period === '1d') {
      label = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    } else if (period === '5d' || period === '1mo' || period === '3mo') {
      label = `${dt.getMonth() + 1}/${dt.getDate()}`;
    } else {
      label = `${dt.getFullYear()}.${dt.getMonth() + 1}`;
    }
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
  const insets = useSafeAreaInsets();

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
          balance: data.balance ?? 10_000_000,
          totalAsset: data.totalAsset ?? 10_000_000,
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
  const [chartPeriod, setChartPeriod] = useState<ChartPeriod>('1d');
  const [chartType, setChartType] = useState<'line' | 'candle'>('candle');
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState<string | null>(null);
  const [showTradeSheet, setShowTradeSheet] = useState(false);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const isFavorite = wishlist.some((w: any) => w.ticker === ticker);
  const [showChartModal, setShowChartModal] = useState(false);
  const [exchangeRate, setExchangeRate] = useState(1380);

  // 현재가 (Yahoo Finance)
  const livePrice = quote?.price ?? 0;
  const liveChange = quote?.change ?? 0;
  const liveChangeAmount = quote?.changeAmount ?? 0;
  const isPositive = liveChange >= 0;
  const changeColor = isPositive ? DS.rise : DS.fall;
  const hasPrice = quote !== null && livePrice > 0;
  const livePriceKRW = isKR ? livePrice : Math.round(livePrice * exchangeRate);

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

  useEffect(() => {
    if (!isKR) {
      getExchangeRate().then(setExchangeRate);
    }
  }, [isKR]);

  // ── 차트 로드 (재시도 최대 2회: 1초 / 2초 backoff) ──────
  const loadChartData = useCallback(async () => {
    setChartLoading(true);
    setChartError(null);

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const data = await fetchChartData(ticker, stock.krw, chartPeriod);
        setChartData(data);
        setChartLoading(false);
        return; // 성공 시 즉시 종료
      } catch (error: any) {
        lastError = error;
        console.warn(
          `차트 로드 실패 (시도 ${attempt + 1}/${MAX_RETRIES + 1}):`,
          error?.message ?? error,
        );
        if (attempt < MAX_RETRIES) {
          // 1초 → 2초 backoff
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    // 모든 재시도 실패
    setChartError(lastError?.message ?? '차트 로드 실패');
    setChartData([]);
    setChartLoading(false);
  }, [ticker, stock.krw, chartPeriod]); // ★ stock.krw 추가 (작업 H)

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  // ── 재무 데이터 로드 (확장) ──────────────────────
  const fmtBig = (n: number | null | undefined, kr: boolean): string => {
    if (n == null || n === 0) return '-';
    if (kr) {
      if (n >= 1e12) return `${(n / 1e12).toFixed(1)}조원`;
      if (n >= 1e8) return `${Math.round(n / 1e8).toLocaleString()}억원`;
      if (n >= 1e4) return `${Math.round(n / 1e4).toLocaleString()}만원`;
      return `${Math.round(n).toLocaleString()}원`;
    }
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
    return `$${n.toLocaleString()}`;
  };
  const fmtPct = (n: number | null | undefined): string => (n != null ? `${(n * 100).toFixed(2)}%` : '-');

  useEffect(() => {
    const loadFinancial = async () => {
      try {
        const yt = isKR ? `${ticker}.KS` : ticker;
        const fields = 'longName,sector,industry,country,fullTimeEmployees,marketCap,sharesOutstanding,floatShares,trailingPE,forwardPE,priceToBook,priceToSalesTrailing12Months,trailingEps,bookValue,enterpriseValue,enterpriseToEbitda,dividendYield,dividendRate,payoutRatio,beta,fiftyTwoWeekHigh,fiftyTwoWeekLow,fiftyDayAverage,twoHundredDayAverage,averageVolume,totalRevenue,grossProfits,operatingCashflow,freeCashflow,totalDebt,totalCash,returnOnEquity,returnOnAssets,profitMargins,operatingMargins,targetMeanPrice,targetHighPrice,targetLowPrice,recommendationKey,numberOfAnalystOpinions';
        const res = await fetch(
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yt}&fields=${fields}`,
          { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', Accept: 'application/json' } },
        );
        const data = await res.json();
        const it = data.quoteResponse?.result?.[0];
        if (it) {
          setFinancialData({
            // 기본
            longName: it.longName ?? null,
            sector: it.sector ?? null,
            industry: it.industry ?? null,
            country: it.country ?? null,
            employees: it.fullTimeEmployees ?? null,
            // 시가총액
            marketCap: it.marketCap ?? null,
            sharesOutstanding: it.sharesOutstanding ?? null,
            floatShares: it.floatShares ?? null,
            // 밸류에이션
            per: it.trailingPE ?? null,
            forwardPE: it.forwardPE ?? null,
            pbr: it.priceToBook ?? null,
            psr: it.priceToSalesTrailing12Months ?? null,
            eps: it.trailingEps ?? null,
            bps: it.bookValue ?? null,
            ev: it.enterpriseValue ?? null,
            evEbitda: it.enterpriseToEbitda ?? null,
            // 배당
            dividendYield: it.dividendYield ?? null,
            dividendRate: it.dividendRate ?? null,
            payoutRatio: it.payoutRatio ?? null,
            beta: it.beta ?? null,
            // 이평
            fiftyDay: it.fiftyDayAverage ?? null,
            twoHundredDay: it.twoHundredDayAverage ?? null,
            avgVolume: it.averageVolume ?? null,
            // 재무
            revenue: it.totalRevenue ?? null,
            grossProfit: it.grossProfits ?? null,
            opCashflow: it.operatingCashflow ?? null,
            freeCashflow: it.freeCashflow ?? null,
            totalDebt: it.totalDebt ?? null,
            totalCash: it.totalCash ?? null,
            roe: it.returnOnEquity ?? null,
            roa: it.returnOnAssets ?? null,
            profitMargin: it.profitMargins ?? null,
            opMargin: it.operatingMargins ?? null,
            // 애널리스트
            targetMean: it.targetMeanPrice ?? null,
            targetHigh: it.targetHighPrice ?? null,
            targetLow: it.targetLowPrice ?? null,
            recommendation: it.recommendationKey ?? null,
            analystCount: it.numberOfAnalystOpinions ?? null,
          });
        }
      } catch (e) {
        console.warn('재무 데이터 오류:', e);
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
    <View style={{ flex: 1, backgroundColor: DS.bg, paddingTop: insets.top }}>
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
          onPress={() => { loadStockData(); loadChartData(); }}
          disabled={priceLoading || chartLoading}
          style={{ marginRight: 12 }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {(priceLoading || chartLoading) ? (
            <ActivityIndicator size="small" color={DS.text} />
          ) : (
            <Ionicons name="refresh-outline" size={22} color={DS.text} />
          )}
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
          <>
            <Text style={{ color: changeColor, fontSize: 13 }}>
              {fmt(livePrice)}{!isKR && livePrice > 0 ? ` (₩${Math.round(livePrice * exchangeRate).toLocaleString()})` : ''} 오늘 {isPositive ? '+' : ''}{liveChange.toFixed(2)}%
            </Text>
            {ownedStock && (() => {
              const myRate = ownedStock.avgPrice > 0
                ? ((livePriceKRW - ownedStock.avgPrice) / ownedStock.avgPrice * 100)
                : 0;
              const myUp = myRate >= 0;
              return (
                <Text style={{ color: myUp ? DS.rise : DS.fall, fontSize: 12, marginTop: 1 }}>
                  내 수익 {myUp ? '+' : ''}{myRate.toFixed(2)}%
                </Text>
              );
            })()}
            {!isKR && (
              <Text style={{ color: DS.textSub, fontSize: 11, marginTop: 2 }}>
                🇺🇸 {getUSMarketHoursKST()}
              </Text>
            )}
          </>
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
                  {!isKR && livePrice > 0 && (
                    <Text style={{ color: DS.textSub, fontSize: 14, marginTop: 2 }}>
                      ≈ ₩{Math.round(livePrice * exchangeRate).toLocaleString()}
                    </Text>
                  )}
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Text style={{ color: changeColor, fontSize: 16 }}>
                      오늘 {isPositive ? '▲' : '▼'}{' '}
                      {Math.abs(liveChangeAmount).toLocaleString()}
                      {'  '}{isPositive ? '+' : ''}{liveChange.toFixed(2)}%
                    </Text>
                    {ownedStock && (() => {
                      const myRate = ownedStock.avgPrice > 0
                        ? ((livePriceKRW - ownedStock.avgPrice) / ownedStock.avgPrice * 100)
                        : 0;
                      const myUp = myRate >= 0;
                      return (
                        <Text style={{ color: myUp ? DS.rise : DS.fall, fontSize: 14, marginLeft: 10 }}>
                          / 내 수익 {myUp ? '+' : ''}{myRate.toFixed(2)}%
                        </Text>
                      );
                    })()}
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

            {/* SVG 차트 */}
            <View>
              {chartLoading ? (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator color={DS.text} />
                </View>
              ) : chartError ? (
                <View style={{ height: 300, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>📊</Text>
                  <Text style={{ color: DS.text, fontSize: 15, fontWeight: '600', marginBottom: 4 }}>
                    차트를 불러오지 못했어요
                  </Text>
                  <Text style={{ color: DS.textMuted, fontSize: 12, marginBottom: 14, textAlign: 'center' }}>
                    잠시 후 다시 시도해 주세요
                  </Text>
                  <TouchableOpacity
                    onPress={loadChartData}
                    style={{
                      backgroundColor: DS.cardAlt,
                      paddingVertical: 10, paddingHorizontal: 18,
                      borderRadius: 10, borderWidth: 1, borderColor: DS.borderLight,
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ color: DS.text, fontSize: 13, fontWeight: 'bold' }}>다시 시도</Text>
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
                  <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
                  <Text style={{ color: DS.textMuted, fontSize: 13 }}>차트 데이터가 없어요</Text>
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

            {/* 기간 선택 버튼 — 차트 아래 */}
            <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 8, marginBottom: 16 }}>
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

            {/* 주니몽 AI 버튼 — 차트 바로 아래 */}
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
                  주니몽에게 물어보기
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
                    {hasPrice ? `${(livePriceKRW * ownedStock.quantity).toLocaleString()}원` : '-'}
                  </Text>
                  {(() => {
                    if (!hasPrice) return <Text style={{ color: DS.textMuted, fontSize: 16, marginTop: 4 }}>가격 로딩 중...</Text>;
                    const profitAmt = (livePriceKRW - ownedStock.avgPrice) * ownedStock.quantity;
                    const profitRate = ownedStock.avgPrice > 0
                      ? ((livePriceKRW - ownedStock.avgPrice) / ownedStock.avgPrice * 100)
                      : 0;
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
                    { label: '평균매수가', value: `${Math.round(ownedStock.avgPrice).toLocaleString()}원` },
                    { label: '현재가', value: hasPrice ? `${livePriceKRW.toLocaleString()}원` : '-' },
                    { label: '평가금액', value: hasPrice ? `${(livePriceKRW * ownedStock.quantity).toLocaleString()}원` : '-' },
                    { label: '매입금액', value: `${(ownedStock.avgPrice * ownedStock.quantity).toLocaleString()}원` },
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
            {!financialData ? (
              <View style={[s.infoCard, { marginHorizontal: 0, alignItems: 'center', paddingVertical: 40 }]}>
                <ActivityIndicator color={'#0066FF'} size="large" />
                <Text style={{ color: DS.textSub, fontSize: 13, marginTop: 12 }}>종목 정보 불러오는 중...</Text>
              </View>
            ) : (
              <>
                {/* 섹션 1: 기업 소개 */}
                {(financialData.sector || financialData.industry || financialData.country) && (
                  <View style={[s.infoCard, { marginHorizontal: 0 }]}>
                    <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>🏢 기업 소개</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                      {financialData.sector && (
                        <View style={{ backgroundColor: '#0066FF' + '15', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ color: '#0066FF', fontSize: 12, fontWeight: '700' }}>{financialData.sector}</Text>
                        </View>
                      )}
                      {financialData.industry && (
                        <View style={{ backgroundColor: '#FF950015', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
                          <Text style={{ color: '#FF9500', fontSize: 12, fontWeight: '700' }}>{financialData.industry}</Text>
                        </View>
                      )}
                    </View>
                    {[
                      { label: '종목명', value: financialData.longName ?? stock.name },
                      { label: '시장', value: isKR ? '🇰🇷 한국' : '🇺🇸 미국' },
                      financialData.country ? { label: '국가', value: financialData.country } : null,
                      financialData.employees ? { label: '직원 수', value: `${financialData.employees.toLocaleString()}명` } : null,
                    ].filter(Boolean).map((item: any, i, arr) => (
                      <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                        <Text style={s.infoLabel}>{item.label}</Text>
                        <Text style={s.infoValue}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 섹션 2: 시가총액 + 52주 레인지 */}
                <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
                  <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>💰 시가총액</Text>
                  {[
                    financialData.marketCap ? { label: '시가총액', value: fmtBig(financialData.marketCap, isKR) } : null,
                    financialData.sharesOutstanding ? { label: '발행주식수', value: `${(financialData.sharesOutstanding / 1e6).toFixed(1)}M주` } : null,
                    financialData.floatShares ? { label: '유동주식수', value: `${(financialData.floatShares / 1e6).toFixed(1)}M주` } : null,
                  ].filter(Boolean).map((item: any, i, arr) => (
                    <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                      <Text style={s.infoLabel}>{item.label}</Text>
                      <Text style={[s.infoValue, { fontWeight: 'bold' }]}>{item.value}</Text>
                    </View>
                  ))}
                  {/* 52주 레인지 바 */}
                  {quote?.week52Low != null && quote?.week52High != null && livePrice > 0 && (
                    <View style={{ marginTop: 14 }}>
                      <Text style={{ color: DS.textSub, fontSize: 12, marginBottom: 6 }}>52주 범위</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ color: DS.fall, fontSize: 11, fontWeight: '600', width: 52 }}>{fmtOrDash(quote.week52Low)}</Text>
                        <View style={{ flex: 1, height: 8, backgroundColor: DS.border, borderRadius: 4, marginHorizontal: 6 }}>
                          {(() => {
                            const range = (quote.week52High ?? 1) - (quote.week52Low ?? 0);
                            const pos = range > 0 ? ((livePrice - (quote.week52Low ?? 0)) / range) * 100 : 50;
                            return <View style={{ position: 'absolute', left: `${Math.min(Math.max(pos, 2), 98)}%` as any, top: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#0066FF', borderWidth: 2, borderColor: '#fff' }} />;
                          })()}
                        </View>
                        <Text style={{ color: DS.rise, fontSize: 11, fontWeight: '600', width: 52, textAlign: 'right' }}>{fmtOrDash(quote.week52High)}</Text>
                      </View>
                    </View>
                  )}
                </View>

                {/* 섹션 3: 밸류에이션 2x2 그리드 */}
                {(financialData.per || financialData.forwardPE || financialData.pbr || financialData.psr || financialData.ev || financialData.evEbitda) && (
                  <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
                    <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>📊 밸류에이션</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {[
                        { label: 'PER', value: financialData.per?.toFixed(2), unit: '배' },
                        { label: '선행 PER', value: financialData.forwardPE?.toFixed(2), unit: '배' },
                        { label: 'PBR', value: financialData.pbr?.toFixed(2), unit: '배' },
                        { label: 'PSR', value: financialData.psr?.toFixed(2), unit: '배' },
                        { label: 'EV', value: financialData.ev ? fmtBig(financialData.ev, isKR) : null, unit: '' },
                        { label: 'EV/EBITDA', value: financialData.evEbitda?.toFixed(2), unit: '배' },
                      ].map((m, i) => (
                        <View key={i} style={{ width: '48%' as any, backgroundColor: DS.bg, borderRadius: 12, padding: 12 }}>
                          <Text style={{ color: DS.textSub, fontSize: 12 }}>{m.label}</Text>
                          <Text style={{ color: DS.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>
                            {m.value ? `${m.value}${m.unit}` : 'N/A'}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* 섹션 4: 배당 & 안정성 */}
                {(financialData.dividendYield || financialData.beta) && (
                  <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
                    <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>🛡️ 배당 & 안정성</Text>
                    {[
                      financialData.dividendYield ? { label: '배당수익률', value: fmtPct(financialData.dividendYield) } : null,
                      financialData.dividendRate ? { label: '주당 배당금', value: isKR ? `${Math.round(financialData.dividendRate).toLocaleString()}원` : `$${financialData.dividendRate.toFixed(2)}` } : null,
                      financialData.payoutRatio ? { label: '배당성향', value: fmtPct(financialData.payoutRatio) } : null,
                      financialData.beta ? { label: '베타', value: `${financialData.beta.toFixed(2)} (${financialData.beta > 1.2 ? '높음' : financialData.beta < 0.8 ? '낮음' : '보통'})` } : null,
                      financialData.fiftyDay ? { label: '50일 이평', value: isKR ? `${Math.round(financialData.fiftyDay).toLocaleString()}` : `$${financialData.fiftyDay.toFixed(2)}` } : null,
                      financialData.twoHundredDay ? { label: '200일 이평', value: isKR ? `${Math.round(financialData.twoHundredDay).toLocaleString()}` : `$${financialData.twoHundredDay.toFixed(2)}` } : null,
                    ].filter(Boolean).map((item: any, i, arr) => (
                      <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                        <Text style={s.infoLabel}>{item.label}</Text>
                        <Text style={[s.infoValue, { fontWeight: '600' }]}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 섹션 5: 재무 현황 */}
                {(financialData.revenue || financialData.roe || financialData.totalCash || financialData.totalDebt) && (
                  <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
                    <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>📑 재무 현황</Text>
                    {[
                      financialData.revenue ? { label: '매출액', value: fmtBig(financialData.revenue, isKR) } : null,
                      financialData.opMargin ? { label: '영업이익률', value: fmtPct(financialData.opMargin) } : null,
                      financialData.profitMargin ? { label: '순이익률', value: fmtPct(financialData.profitMargin) } : null,
                      financialData.roe ? { label: 'ROE', value: fmtPct(financialData.roe) } : null,
                      financialData.roa ? { label: 'ROA', value: fmtPct(financialData.roa) } : null,
                      financialData.totalCash ? { label: '보유현금', value: fmtBig(financialData.totalCash, isKR) } : null,
                      financialData.totalDebt ? { label: '총부채', value: fmtBig(financialData.totalDebt, isKR) } : null,
                      financialData.opCashflow ? { label: '영업현금흐름', value: fmtBig(financialData.opCashflow, isKR) } : null,
                      financialData.freeCashflow ? { label: '잉여현금흐름', value: fmtBig(financialData.freeCashflow, isKR) } : null,
                    ].filter(Boolean).map((item: any, i, arr) => (
                      <View key={i} style={[s.infoRow, i < arr.length - 1 && s.infoRowBorder]}>
                        <Text style={s.infoLabel}>{item.label}</Text>
                        <Text style={[s.infoValue, { fontWeight: '600' }]}>{item.value}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* 섹션 6: 애널리스트 의견 */}
                {financialData.recommendation && (
                  <View style={[s.infoCard, { marginHorizontal: 0, marginTop: 12 }]}>
                    <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 15, marginBottom: 12 }}>🎯 애널리스트 의견</Text>
                    {/* 투자의견 뱃지 */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                      <View style={{ backgroundColor: financialData.recommendation === 'strong_buy' || financialData.recommendation === 'buy' ? '#34C75920' : financialData.recommendation === 'hold' ? '#FF950020' : '#FF3B3020', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
                        <Text style={{ fontWeight: '800', fontSize: 13, color: financialData.recommendation === 'strong_buy' || financialData.recommendation === 'buy' ? '#34C759' : financialData.recommendation === 'hold' ? '#FF9500' : '#FF3B30' }}>
                          {{ strong_buy: '적극 매수', buy: '매수', hold: '보유', underperform: '비중축소', sell: '매도' }[financialData.recommendation] ?? financialData.recommendation}
                        </Text>
                      </View>
                      {financialData.analystCount && (
                        <Text style={{ color: DS.textSub, fontSize: 12, marginLeft: 8 }}>({financialData.analystCount}명 분석)</Text>
                      )}
                    </View>
                    {/* 목표주가 레인지 */}
                    {financialData.targetLow && financialData.targetHigh && (
                      <View>
                        <Text style={{ color: DS.textSub, fontSize: 12, marginBottom: 6 }}>목표주가 범위</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={{ color: DS.fall, fontSize: 11, fontWeight: '600', width: 52 }}>${financialData.targetLow.toFixed(0)}</Text>
                          <View style={{ flex: 1, height: 8, backgroundColor: DS.border, borderRadius: 4, marginHorizontal: 6 }}>
                            {(() => {
                              const range = financialData.targetHigh - financialData.targetLow;
                              const pos = range > 0 ? ((livePrice - financialData.targetLow) / range) * 100 : 50;
                              return <View style={{ position: 'absolute', left: `${Math.min(Math.max(pos, 2), 98)}%` as any, top: -3, width: 14, height: 14, borderRadius: 7, backgroundColor: '#0066FF', borderWidth: 2, borderColor: '#fff' }} />;
                            })()}
                          </View>
                          <Text style={{ color: DS.rise, fontSize: 11, fontWeight: '600', width: 52, textAlign: 'right' }}>${financialData.targetHigh.toFixed(0)}</Text>
                        </View>
                        {financialData.targetMean && (
                          <Text style={{ color: DS.text, fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 8 }}>
                            평균 목표가 ${financialData.targetMean.toFixed(2)}
                            {livePrice > 0 && (
                              <Text style={{ color: financialData.targetMean > livePrice ? DS.rise : DS.fall }}>
                                {' '}({financialData.targetMean > livePrice ? '+' : ''}{(((financialData.targetMean - livePrice) / livePrice) * 100).toFixed(1)}%)
                              </Text>
                            )}
                          </Text>
                        )}
                      </View>
                    )}
                  </View>
                )}
              </>
            )}

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

      </ScrollView>

      {/* ── 하단 매수/매도 버튼 — flex flow로 하단 고정 ── */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 0,
          backgroundColor: 'white',
          flexDirection: 'row',
          borderTopWidth: 1,
          borderTopColor: DS.border,
          gap: 12,
        }}
      >
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
            <View style={{ flex: 2, paddingTop: insets.top }}>
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

            {/* 차트 영역 — ScrollView로 감싸서 높이 초과 방지 */}
            <ScrollView style={{ flex: 3 }} showsVerticalScrollIndicator={false}>
              {/* 1. 라인 차트 */}
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
                  height={Dimensions.get('window').height * 0.25}
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
                <View style={{ height: 200, alignItems: 'center', justifyContent: 'center' }}>
                  <ActivityIndicator color={DS.fall} size="large" />
                  <Text style={{ color: DS.textSub, marginTop: 12 }}>차트 로딩 중...</Text>
                </View>
              )}

              {/* 2. 기간 선택 버튼 — 독립된 View로 분리 */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: DS.border }}>
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
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{
                      color: chartPeriod === p.key ? DS.text : DS.textSub,
                      fontSize: 15,
                      fontWeight: chartPeriod === p.key ? 'bold' : 'normal',
                    }}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 3. 거래량 바 — 기간 버튼과 완전히 분리 */}
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
            </ScrollView>

            {/* 판매하기 / 구매하기 버튼 */}
            <SafeAreaView style={{ borderTopWidth: 1, borderTopColor: DS.border }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingBottom: insets.bottom + 8, gap: 12 }}>
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
          exchangeRate={exchangeRate}
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
  exchangeRate: number;
  onClose: () => void;
}

function TradeSheet({
  stock, livePrice, liveChange, isKR, type: initialType,
  userData, cash, userId, exchangeRate, onClose,
}: TradeSheetProps) {
  const { theme } = useTheme();
  const DS = useDS();
  const [tradeType, setTradeType] = useState(initialType);
  const [fixedPrice] = useState(livePrice);
  // 시트 열릴 때 quantity=1로 시작 → 매수 버튼이 활성 상태로 보여 사용자 오해 방지
  const [quantity, setQuantity] = useState(1);
  const [quantityText, setQuantityText] = useState('1');
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const buyStock = useAppStore(s => s.buyStock);
  const sellStock = useAppStore(s => s.sellStock);

  // 모든 거래 금액을 KRW로 통일 (해외 주식: USD → KRW 환산)
  const tradePriceKRW = isKR ? fixedPrice : Math.round(fixedPrice * exchangeRate);

  const ownedStock = userData?.portfolio?.find(p => p.ticker === stock.ticker);
  const balance = userData?.balance ?? cash;
  const maxSellQty = ownedStock?.quantity ?? 0;
  const maxBuyQty = tradePriceKRW > 0 ? Math.floor(balance / (tradePriceKRW * 1.001)) : 0;
  const maxQty = tradeType === 'buy' ? maxBuyQty : maxSellQty;
  const totalCost = Math.round(tradePriceKRW * quantity * 1.001);
  const totalReceive = Math.round(tradePriceKRW * quantity * 0.999);

  const isSellDisabled = tradeType === 'sell' && (quantity <= 0 || quantity > maxSellQty || maxSellQty === 0);
  const isBuyDisabled = tradeType === 'buy' && (quantity <= 0 || balance < tradePriceKRW * quantity * 1.001);
  const isButtonDisabled = isSellDisabled || isBuyDisabled || isLoading;

  // 호출부에서 들어오는 값이 이미 KRW로 환산됐는지 명시(inKRW).
  // 기본값은 종목 통화(isKR) — 한국 종목은 KRW, 미국 종목은 USD 그대로 표시.
  // KRW 환산값(예: totalCost, ownedStock.avgPrice)을 넘길 땐 inKRW=true 명시.
  const fmtP = (n: number, inKRW: boolean = isKR) => {
    if (!n) return '-';
    return inKRW
      ? `${Math.round(n).toLocaleString()}원`
      : `$${n.toFixed(2)}`;
  };

  const handleQuantityChange = (text: string) => {
    setQuantityText(text);
    const num = parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
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
  };

  const handleIncrease = () => {
    const newQ = quantity + 1;
    if (newQ > maxQty) return;
    setQuantity(newQ);
    setQuantityText(newQ.toString());
  };

  const handleDecrease = () => {
    const newQ = Math.max(0, quantity - 1);
    setQuantity(newQ);
    setQuantityText(newQ > 0 ? newQ.toString() : '');
  };

  const handlePercentSelect = (pct: number) => {
    const base = tradeType === 'buy' ? maxBuyQty : maxSellQty;
    const newQty = isKR ? Math.floor(base * pct / 100) : parseFloat((base * pct / 100).toFixed(4));
    const safeQty = Math.max(0, newQty);
    setQuantity(safeQty);
    setQuantityText(safeQty > 0 ? (isKR ? safeQty.toString() : safeQty.toFixed(4)) : '');
  };

  const handleTrade = async () => {
    if (!userId || quantity <= 0) {
      if (quantity <= 0) Alert.alert('알림', '수량을 입력해주세요');
      return;
    }

    // 모든 거래는 KRW 기준 (해외 주식: USD → KRW 환산)
    const tradePrice = tradePriceKRW;

    // 사전 검증 (스토어 액션 호출 전 사용자 피드백)
    if (tradeType === 'buy') {
      const cost = Math.floor(tradePrice * quantity * 1.001);
      if (balance < cost) {
        Alert.alert('잔액 부족', `필요: ${fmtP(cost)}\n보유: ${fmtP(balance)}`);
        return;
      }
    } else {
      if (!ownedStock || ownedStock.quantity < quantity) {
        Alert.alert(
          '보유 수량 부족',
          `보유: ${isKR ? (ownedStock?.quantity ?? 0) : (ownedStock?.quantity ?? 0).toFixed(4)}주`,
        );
        return;
      }
    }

    // 거래 이유 필수 (의미 있는 입력 검증)
    const reasonResult = validateReason(reason);
    if (!reasonResult.valid) {
      Alert.alert('이유 입력 확인', reasonResult.message);
      return;
    }
    const trimmedReason = reason.trim();

    try {
      setIsLoading(true);

      const result = tradeType === 'buy'
        ? await buyStock(stock.ticker, quantity, tradePrice, trimmedReason)
        : await sellStock(stock.ticker, quantity, tradePrice, trimmedReason);

      if (!result.success) {
        Alert.alert('거래 실패', result.message);
        return;
      }

      // 거래 알림 저장 (액션 성공 후 부수 효과)
      try {
        const latestSnap = await getDoc(doc(db, 'users', userId));
        const latestNotifs = latestSnap.data()?.notifications ?? [];
        await saveNotif(userId, latestNotifs, {
          type: 'trade',
          title: tradeType === 'buy' ? '✅ 매수 완료' : '✅ 매도 완료',
          body: `${stock.name} ${isKR ? Math.floor(quantity) : quantity.toFixed(4)}주 @ ₩${tradePrice.toLocaleString()}`,
          ticker: stock.ticker,
          stockName: stock.name,
          quantity,
          price: tradePrice,
          total: tradeType === 'buy' ? totalCost : totalReceive,
          tradeType,
        });
      } catch (e) {
        console.warn('거래 알림 저장 실패:', e);
      }

      setReason('');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
      const qtyStr = isKR ? `${Math.floor(quantity)}` : `${quantity.toFixed(4)}`;
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
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        {/* 딤 오버레이 — 전체 화면 절대 위치 */}
        <TouchableOpacity
          style={[StyleSheet.absoluteFill, { backgroundColor: DS.overlay }]}
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
                    {tradeType === 'buy' ? (isKR ? `${maxBuyQty}주` : `${maxBuyQty.toFixed(4)}주`) : fmtP(ownedStock?.avgPrice ?? 0, true)}
                  </Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ color: DS.textSub, fontSize: 12 }}>체결가</Text>
                  <Text style={{ color: DS.text, fontWeight: 'bold', fontSize: 14, marginTop: 4 }}>{fmtP(fixedPrice, isKR)}</Text>
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
                    keyboardType={isKR ? 'number-pad' : 'decimal-pad'}
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
                {!isLoading && quantity <= 0 && (
                  <Text style={{ color: DS.textSub, fontSize: 13, textAlign: 'center', marginTop: 6, fontWeight: 'bold' }}>
                    수량을 입력해주세요
                  </Text>
                )}
                {!isLoading && quantity > maxQty && (
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

              {/* 거래 이유 (필수) */}
              <View style={{ marginBottom: 16 }}>
                <Text style={{ color: DS.textSub, fontSize: 13, marginBottom: 8, paddingHorizontal: 4 }}>
                  거래 이유 <Text style={{ color: DS.fall }}>*</Text>
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder={tradeType === 'buy' ? '왜 매수하나요?' : '왜 매도하나요?'}
                  placeholderTextColor={DS.textDim}
                  multiline
                  maxLength={200}
                  textAlignVertical="top"
                  style={{
                    minHeight: 72,
                    borderWidth: 1,
                    borderColor: DS.borderLight,
                    borderRadius: 12,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: DS.text,
                  }}
                />
                {(() => {
                  const status = getReasonStatus(reason);
                  return (
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
                      <Text style={{ fontSize: 13, color: status.color, flex: 1 }}>
                        {status.text}
                      </Text>
                      <Text style={{ color: DS.textDim, fontSize: 11, textAlign: 'right' }}>
                        {reason.length}/200
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* 주문 요약 */}
              <View style={{ backgroundColor: DS.cardAlt, borderRadius: 12, padding: 14, marginBottom: 16 }}>
                {[
                  { label: '체결 가격', value: fmtP(fixedPrice, isKR) },
                  { label: '수량', value: isKR ? `${Math.floor(quantity)}주` : `${quantity.toFixed(4)}주` },
                  { label: '수수료 (0.1%)', value: fmtP(fixedPrice * quantity * 0.001, isKR) },
                ].map((item, i, arr) => (
                  <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: i < arr.length - 1 ? 1 : 0, borderBottomColor: DS.border }}>
                    <Text style={{ color: DS.textSub, fontSize: 14 }}>{item.label}</Text>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: DS.text }}>{item.value}</Text>
                  </View>
                ))}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: DS.borderLight }}>
                  <Text style={{ fontWeight: 'bold', fontSize: 15, color: DS.text }}>{tradeType === 'buy' ? '총 결제금액' : '총 수령금액'}</Text>
                  <Text style={{ fontWeight: 'bold', fontSize: 18, color: tradeType === 'buy' ? DS.rise : DS.fall }}>
                    {tradeType === 'buy' ? fmtP(totalCost, true) : fmtP(totalReceive, true)}
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
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ color: isButtonDisabled ? '#999' : '#FFFFFF', fontSize: 17, fontWeight: 'bold' }}>
                    {tradeType === 'sell' && quantity > maxSellQty
                      ? '보유 수량 초과'
                      : tradeType === 'buy' && balance < totalCost
                        ? '잔액 부족'
                        : quantity <= 0
                          ? '수량을 입력해주세요'
                          : tradeType === 'buy'
                            ? `${isKR ? Math.floor(quantity) : quantity.toFixed(4)}주 매수하기`
                            : `${isKR ? Math.floor(quantity) : quantity.toFixed(4)}주 매도하기`}
                  </Text>
                )}
              </TouchableOpacity>

              <Text style={{ color: DS.textDim, fontSize: 11, textAlign: 'center', marginTop: 12 }}>
                실제 투자가 아닌 모의투자입니다
              </Text>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    bottom: 80,
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
