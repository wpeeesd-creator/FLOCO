/**
 * Yahoo Finance 가격 서비스 — 앱 전체 단일 소스
 * 모든 화면은 이 파일의 함수만 사용
 */

import { useState, useEffect } from 'react';

// ══════════════════════════════════════════════════
//  타입 정의
// ══════════════════════════════════════════════════

export type ChartPeriod = '1d' | '5d' | '1mo' | '3mo' | '1y' | '5y';

export interface PriceData {
  price: number;
  change: number;
  changeAmount: number;
  open: number;
  high: number;
  low: number;
  previousClose: number;
  volume: number;
  week52High: number;
  week52Low: number;
  per: string;
  pbr: string;
  marketState: string;
  isKR: boolean;
}

export interface CandleData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// ══════════════════════════════════════════════════
//  내부 헬퍼
// ══════════════════════════════════════════════════

const YAHOO_HEADERS_V7 = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
};

const YAHOO_HEADERS_V8 = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  Accept: '*/*',
};

const QUOTE_FIELDS = 'regularMarketPrice,regularMarketChangePercent,regularMarketChange,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,trailingPE,priceToBook,marketState';

const toPriceData = (item: any, isKR: boolean): PriceData => ({
  price: isKR
    ? Math.round(item.regularMarketPrice ?? 0)
    : item.regularMarketPrice ?? 0,
  change: parseFloat((item.regularMarketChangePercent ?? 0).toFixed(2)),
  changeAmount: isKR
    ? Math.round(item.regularMarketChange ?? 0)
    : parseFloat((item.regularMarketChange ?? 0).toFixed(2)),
  open: isKR ? Math.round(item.regularMarketOpen ?? 0) : item.regularMarketOpen ?? 0,
  high: isKR ? Math.round(item.regularMarketDayHigh ?? 0) : item.regularMarketDayHigh ?? 0,
  low: isKR ? Math.round(item.regularMarketDayLow ?? 0) : item.regularMarketDayLow ?? 0,
  previousClose: isKR
    ? Math.round(item.regularMarketPreviousClose ?? 0)
    : item.regularMarketPreviousClose ?? 0,
  volume: item.regularMarketVolume ?? 0,
  week52High: isKR ? Math.round(item.fiftyTwoWeekHigh ?? 0) : item.fiftyTwoWeekHigh ?? 0,
  week52Low: isKR ? Math.round(item.fiftyTwoWeekLow ?? 0) : item.fiftyTwoWeekLow ?? 0,
  per: item.trailingPE?.toFixed(1) ?? '-',
  pbr: item.priceToBook?.toFixed(1) ?? '-',
  marketState: item.marketState ?? 'CLOSED',
  isKR,
});

// ══════════════════════════════════════════════════
//  단일 종목 가격 (v7 → v8 fallback)
// ══════════════════════════════════════════════════

export const fetchSinglePrice = async (
  ticker: string,
  isKR: boolean,
): Promise<PriceData | null> => {
  const yahooTicker = isKR ? `${ticker}.KS` : ticker;

  // v7 시도
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooTicker}&fields=${QUOTE_FIELDS}`,
      { headers: YAHOO_HEADERS_V7 },
    );
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    const data = JSON.parse(text);
    const item = data.quoteResponse?.result?.[0];
    if (item?.regularMarketPrice) {
      console.log(`✅ 가격 (${ticker}): ${isKR ? Math.round(item.regularMarketPrice) : item.regularMarketPrice}`);
      return toPriceData(item, isKR);
    }
  } catch {
    console.log(`v7 실패 (${ticker}), v8 시도`);
  }

  // v8 fallback
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=5d`,
      { headers: YAHOO_HEADERS_V8 },
    );
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    const data = JSON.parse(text);
    const meta = data.chart?.result?.[0]?.meta;
    if (meta?.regularMarketPrice) {
      const price = isKR ? Math.round(meta.regularMarketPrice) : meta.regularMarketPrice;
      const prev = meta.previousClose ?? meta.chartPreviousClose ?? price;
      const change = prev > 0
        ? parseFloat(((price - prev) / prev * 100).toFixed(2))
        : 0;
      console.log(`✅ v8 가격 (${ticker}): ${price}`);
      return {
        price,
        change,
        changeAmount: isKR ? Math.round(price - prev) : parseFloat((price - prev).toFixed(2)),
        open: isKR ? Math.round(meta.regularMarketOpen ?? prev) : meta.regularMarketOpen ?? prev,
        high: isKR ? Math.round(meta.regularMarketDayHigh ?? price) : meta.regularMarketDayHigh ?? price,
        low: isKR ? Math.round(meta.regularMarketDayLow ?? price) : meta.regularMarketDayLow ?? price,
        previousClose: isKR ? Math.round(prev) : prev,
        volume: meta.regularMarketVolume ?? 0,
        week52High: isKR ? Math.round(meta.fiftyTwoWeekHigh ?? 0) : meta.fiftyTwoWeekHigh ?? 0,
        week52Low: isKR ? Math.round(meta.fiftyTwoWeekLow ?? 0) : meta.fiftyTwoWeekLow ?? 0,
        per: '-',
        pbr: '-',
        marketState: meta.marketState ?? 'CLOSED',
        isKR,
      };
    }
  } catch (e) {
    console.error(`❌ 가격 실패 (${ticker}):`, e);
  }

  return null;
};

// 하위 호환 alias
export const fetchYahooPrice = fetchSinglePrice;

// ══════════════════════════════════════════════════
//  다중 종목 가격 (v7 → 개별 v8 fallback)
// ══════════════════════════════════════════════════

export const fetchMultiplePrices = async (
  stocks: Array<{ ticker: string; isKR: boolean }>,
): Promise<Record<string, PriceData>> => {
  if (stocks.length === 0) return {};

  const yahooTickers = stocks
    .map(s => s.isKR ? `${s.ticker}.KS` : s.ticker)
    .join(',');

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooTickers}&fields=${QUOTE_FIELDS}`,
      { headers: YAHOO_HEADERS_V7 },
    );
    const data = await res.json();
    const results = data.quoteResponse?.result ?? [];

    if (results.length > 0) {
      const map: Record<string, PriceData> = {};
      results.forEach((item: any) => {
        const t = item.symbol.replace('.KS', '');
        const kr = item.symbol.endsWith('.KS');
        map[t] = toPriceData(item, kr);
      });
      console.log(`✅ 다중 가격: ${Object.keys(map).length}개`);
      return map;
    }
  } catch {
    console.log('v7 다중 실패, 개별 호출');
  }

  // 개별 fallback
  const map: Record<string, PriceData> = {};
  await Promise.allSettled(
    stocks.map(async ({ ticker, isKR }) => {
      const d = await fetchSinglePrice(ticker, isKR);
      if (d) map[ticker] = d;
    }),
  );
  console.log(`✅ 개별 가격: ${Object.keys(map).length}개`);
  return map;
};

// ══════════════════════════════════════════════════
//  차트 데이터
// ══════════════════════════════════════════════════

const INTERVAL_MAP: Record<ChartPeriod, string> = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1d',
  '3mo': '1d',
  '1y': '1wk',
  '5y': '1mo',
};

export const fetchChartData = async (
  ticker: string,
  isKR: boolean,
  period: ChartPeriod = '3mo',
): Promise<CandleData[]> => {
  const yahooTicker = isKR ? `${ticker}.KS` : ticker;

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=${INTERVAL_MAP[period]}&range=${period}`,
      { headers: YAHOO_HEADERS_V8 },
    );
    const data = await res.json();
    const result = data.chart?.result?.[0];
    if (!result) return [];

    const timestamps: number[] = result.timestamp ?? [];
    const quotes = result.indicators?.quote?.[0] ?? {};

    return timestamps
      .map((ts, i) => ({
        date: new Date(ts * 1000).toISOString(),
        timestamp: ts,
        open: isKR ? Math.round(quotes.open?.[i] ?? 0) : quotes.open?.[i] ?? 0,
        high: isKR ? Math.round(quotes.high?.[i] ?? 0) : quotes.high?.[i] ?? 0,
        low: isKR ? Math.round(quotes.low?.[i] ?? 0) : quotes.low?.[i] ?? 0,
        close: isKR ? Math.round(quotes.close?.[i] ?? 0) : quotes.close?.[i] ?? 0,
        volume: quotes.volume?.[i] ?? 0,
      }))
      .filter(d => d.close > 0 && d.open > 0);
  } catch (e) {
    console.error('차트 오류:', e);
    return [];
  }
};

// ══════════════════════════════════════════════════
//  수익률 계산 (앱 전체 통일)
// ══════════════════════════════════════════════════

/** 단순 수익률 (totalAsset 기준) */
export const calculateProfit = (totalAsset: number, initialBalance: number) => {
  const profit = totalAsset - initialBalance;
  const profitRate = initialBalance > 0
    ? parseFloat(((profit / initialBalance) * 100).toFixed(2))
    : 0;
  return { profit, profitRate };
};

/** 포트폴리오 기반 수익률 (실시간 가격 반영) */
export const calcProfit = (
  portfolio: any[],
  prices: Record<string, PriceData>,
  balance: number,
  initialBalance: number,
) => {
  const portfolioValue = portfolio.reduce((sum: number, s: any) => {
    const currentPrice = prices[s.ticker]?.price ?? s.avgPrice ?? 0;
    return sum + currentPrice * (s.quantity ?? s.qty ?? 0);
  }, 0);

  const totalAsset = balance + portfolioValue;
  const profit = totalAsset - initialBalance;
  const profitRate = initialBalance > 0
    ? parseFloat(((profit / initialBalance) * 100).toFixed(2))
    : 0;

  return {
    portfolioValue: Math.round(portfolioValue),
    totalAsset: Math.round(totalAsset),
    profit: Math.round(profit),
    profitRate,
  };
};

// ══════════════════════════════════════════════════
//  가격 포맷 (앱 전체 통일)
// ══════════════════════════════════════════════════

export const fmtPrice = (
  price: number | undefined | null,
  isKR: boolean,
): string => {
  if (!price || price === 0) return '-';
  return isKR
    ? `${Math.round(price).toLocaleString()}원`
    : `$${price.toFixed(2)}`;
};

// 하위 호환 alias
export const formatPrice = fmtPrice;

// ══════════════════════════════════════════════════
//  전역 가격 훅 (모든 화면에서 공유, 30초 TTL)
// ══════════════════════════════════════════════════

let globalPriceCache: Record<string, PriceData> = {};
let lastFetchTime = 0;
const CACHE_TTL = 30_000;

export const usePrices = (
  stocks: Array<{ ticker: string; isKR: boolean }>,
) => {
  const [prices, setPrices] = useState<Record<string, PriceData>>(globalPriceCache);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const load = async (force = false) => {
    if (!force && Date.now() - lastFetchTime < CACHE_TTL) {
      setPrices({ ...globalPriceCache });
      return;
    }
    if (stocks.length === 0) return;
    try {
      setIsLoading(true);
      const data = await fetchMultiplePrices(stocks);
      globalPriceCache = { ...globalPriceCache, ...data };
      lastFetchTime = Date.now();
      setPrices({ ...globalPriceCache });
      setLastUpdated(new Date());
    } catch (e) {
      console.error('usePrices 오류:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(() => load(true), CACHE_TTL);
    return () => clearInterval(interval);
  }, [stocks.length]);

  return { prices, isLoading, lastUpdated, refresh: () => load(true) };
};

// ══════════════════════════════════════════════════
//  차트 기간 라벨 (UI용)
// ══════════════════════════════════════════════════

export const CHART_PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: '1d', label: '1일' },
  { key: '1mo', label: '1개월' },
  { key: '3mo', label: '3개월' },
  { key: '1y', label: '1년' },
  { key: '5y', label: '5년' },
];
