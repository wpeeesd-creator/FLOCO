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
  dividendYield?: number;
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

const QUOTE_FIELDS = 'regularMarketPrice,regularMarketChangePercent,regularMarketChange,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,trailingPE,priceToBook,marketState,trailingAnnualDividendYield';

const toPriceData = (item: any, isKR: boolean): PriceData => {
  const v7Price = item.regularMarketPrice ?? 0;
  const v7Prev = item.regularMarketPreviousClose ?? v7Price;
  // Yahoo가 계산한 값을 우선 사용, 없으면 직접 계산
  const changeAmount = item.regularMarketChange != null
    ? parseFloat(item.regularMarketChange.toFixed(2))
    : parseFloat((v7Price - v7Prev).toFixed(2));
  const change = item.regularMarketChangePercent != null
    ? parseFloat(item.regularMarketChangePercent.toFixed(2))
    : (v7Prev > 0
      ? parseFloat(((v7Price - v7Prev) / v7Prev * 100).toFixed(2))
      : 0);
  return {
  price: isKR ? Math.round(v7Price) : v7Price,
  change,
  changeAmount,
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
  dividendYield: typeof item.trailingAnnualDividendYield === 'number'
    ? parseFloat((item.trailingAnnualDividendYield * 100).toFixed(2))
    : undefined,
  };
};

// ══════════════════════════════════════════════════
//  업비트 가격 (KRW마켓, 인증 불필요)
// ══════════════════════════════════════════════════

async function fetchUpbitPrices(tickers: string[]): Promise<Record<string, PriceData>> {
  if (tickers.length === 0) return {};
  const markets = tickers.map(t => `KRW-${t}`).join(',');
  try {
    const res = await fetch(`https://api.upbit.com/v1/ticker?markets=${markets}`);
    if (!res.ok) throw new Error(`Upbit HTTP ${res.status}`);
    const data: any[] = await res.json();
    const map: Record<string, PriceData> = {};
    for (const item of data) {
      const ticker = String(item.market ?? '').replace(/^KRW-/, '');
      if (!ticker) continue;
      map[ticker] = {
        price: item.trade_price ?? 0,
        change: parseFloat(((item.signed_change_rate ?? 0) * 100).toFixed(2)),
        changeAmount: item.signed_change_price ?? 0,
        open: item.opening_price ?? 0,
        high: item.high_price ?? 0,
        low: item.low_price ?? 0,
        previousClose: item.prev_closing_price ?? 0,
        volume: item.acc_trade_volume_24h ?? 0,
        week52High: item.highest_52_week_price ?? 0,
        week52Low: item.lowest_52_week_price ?? 0,
        per: '-',
        pbr: '-',
        marketState: 'REGULAR',
        isKR: true,
      };
    }
    console.log(`✅ 업비트 가격: ${Object.keys(map).length}개`);
    return map;
  } catch (e) {
    console.warn('업비트 가격 실패:', e);
    return {};
  }
}

// 업비트 캔들 (코인 차트). ChartPeriod 별 endpoint + count 매핑.
// 업비트는 최신순 반환 → 오래된→최신 순으로 reverse.
export async function fetchUpbitCandles(
  ticker: string,
  period: ChartPeriod,
): Promise<CandleData[]> {
  const market = `KRW-${ticker}`;
  const map: Record<ChartPeriod, { path: string; count: number }> = {
    '1d':  { path: 'minutes/30', count: 48 },
    '5d':  { path: 'minutes/240', count: 30 },
    '1mo': { path: 'days',  count: 30 },
    '3mo': { path: 'days',  count: 90 },
    '1y':  { path: 'weeks', count: 52 },
    '5y':  { path: 'months', count: 60 },
  };
  const { path, count } = map[period];
  try {
    const res = await fetch(`https://api.upbit.com/v1/candles/${path}?market=${market}&count=${count}`);
    if (!res.ok) throw new Error(`Upbit 캔들 HTTP ${res.status}`);
    const data: any[] = await res.json();
    return data
      .map(item => ({
        date: String(item.candle_date_time_kst ?? ''),
        timestamp: Math.floor((item.timestamp ?? 0) / 1000),
        open: item.opening_price ?? 0,
        high: item.high_price ?? 0,
        low: item.low_price ?? 0,
        close: item.trade_price ?? 0,
        volume: item.candle_acc_trade_volume ?? 0,
      }))
      .filter(d => d.close > 0)
      .reverse();
  } catch (e) {
    console.warn('업비트 캔들 실패:', e);
    return [];
  }
}

// ══════════════════════════════════════════════════
//  Yahoo 인덱스 가격 (^KS11, ^GSPC, KRW=X 등 — .KS suffix 없이 원본 그대로)
// ══════════════════════════════════════════════════

async function fetchYahooIndex(tickers: string[]): Promise<Record<string, PriceData>> {
  if (tickers.length === 0) return {};
  const symbols = tickers.join(',');
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols}&fields=${QUOTE_FIELDS}`,
      { headers: YAHOO_HEADERS_V7 },
    );
    const data = await res.json();
    const results = data.quoteResponse?.result ?? [];
    if (results.length > 0) {
      const map: Record<string, PriceData> = {};
      for (const item of results) {
        map[item.symbol] = toPriceData(item, false);
      }
      console.log(`✅ 인덱스 가격: ${Object.keys(map).length}개`);
      return map;
    }
  } catch (e) {
    console.warn('[priceService] fetchYahooIndex v7 실패, v8 fallback');
  }
  // v8 fallback (각 ticker 개별 호출)
  const map: Record<string, PriceData> = {};
  await Promise.allSettled(
    tickers.map(async (ticker) => {
      try {
        const enc = encodeURIComponent(ticker);
        const res = await fetch(
          `https://query2.finance.yahoo.com/v8/finance/chart/${enc}?interval=1d&range=2d`,
          { headers: YAHOO_HEADERS_V8 },
        );
        const data = await res.json();
        const result = data.chart?.result?.[0];
        const meta = result?.meta;
        if (!meta?.regularMarketPrice) return;
        const price = meta.regularMarketPrice;
        const closes = result?.indicators?.quote?.[0]?.close ?? [];
        let prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
        if (closes.length >= 2 && closes[0] != null) prev = closes[0];
        const change = prev > 0 ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;
        map[ticker] = {
          price,
          change,
          changeAmount: parseFloat((price - prev).toFixed(2)),
          open: meta.regularMarketOpen ?? prev,
          high: meta.regularMarketDayHigh ?? price,
          low: meta.regularMarketDayLow ?? price,
          previousClose: prev,
          volume: meta.regularMarketVolume ?? 0,
          week52High: meta.fiftyTwoWeekHigh ?? 0,
          week52Low: meta.fiftyTwoWeekLow ?? 0,
          per: '-',
          pbr: '-',
          marketState: meta.marketState ?? 'CLOSED',
          isKR: false,
        };
      } catch {}
    }),
  );
  return map;
}

// ══════════════════════════════════════════════════
//  단일 종목 가격 (v7 → v8 fallback)
// ══════════════════════════════════════════════════

// 한국 종목 거래소 접미사 캐시 (.KS 코스피 / .KQ 코스닥)
// 한 번 성공한 접미사를 기억해 다음 호출 시 바로 사용 → 불필요한 재시도 방지
const tickerExchangeCache: Record<string, 'KS' | 'KQ'> = {};
const getKRSuffix = (ticker: string): 'KS' | 'KQ' => tickerExchangeCache[ticker] ?? 'KS';

// Yahoo는 잘못된 거래소(.KS/.KQ) 심볼에도 가격을 echo하므로 (예: 코스닥 종목을 .KS로
// 조회 시 "247540.KS,0P00..." 같은 가짜 종목명으로 엉뚱한 가격 반환), 종목명으로 진위 판별.
// 실제 상장 종목은 사람이 읽는 이름을 반환하고, 미등록 심볼은 코드를 그대로 echo한다.
const isRealKRListing = (name: unknown, ticker: string): boolean => {
  if (typeof name !== 'string' || name.trim() === '') return true; // 이름 미제공 시 보수적으로 통과
  const n = name.trim();
  return !n.startsWith(ticker) && !/^\d{6}[.,\s]/.test(n);
};

// 단일 Yahoo 심볼 가격 조회 (v7 → v8 fallback).
// yahooTicker는 접미사 포함 완성 심볼, ticker는 로그/표시용 원본.
const fetchYahooSymbol = async (
  yahooTicker: string,
  ticker: string,
  isKR: boolean,
): Promise<PriceData | null> => {
  // v7 시도
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${yahooTicker}&fields=${QUOTE_FIELDS}`,
      { headers: YAHOO_HEADERS_V7 },
    );
    const text = await res.text();
    if (text && text.trim() !== '') {
      const data = JSON.parse(text);
      const item = data.quoteResponse?.result?.[0];
      if (item?.regularMarketPrice) {
        const nm = item.longName ?? item.shortName ?? item.displayName;
        if (!isKR || isRealKRListing(nm, ticker)) {
          console.log(`✅ 가격 (${ticker}): ${isKR ? Math.round(item.regularMarketPrice) : item.regularMarketPrice}`);
          return toPriceData(item, isKR);
        }
        return null; // 잘못된 거래소 매칭 → 호출부가 다른 접미사 재시도
      }
    }
  } catch {
    console.log(`v7 실패 (${ticker}), v8 시도`);
  }

  // v8 fallback — range=2d로 전일 종가 정확히 확보
  try {
    const res = await fetch(
      `https://query2.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=1d&range=2d`,
      { headers: YAHOO_HEADERS_V8 },
    );
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    const data = JSON.parse(text);
    const result = data.chart?.result?.[0];
    const meta = result?.meta;
    if (meta?.regularMarketPrice) {
      // 잘못된 거래소 매칭 (가짜 종목명) → 실패 처리하여 다른 접미사 재시도
      if (isKR && !isRealKRListing(meta.longName ?? meta.shortName, ticker)) return null;
      const price = isKR ? Math.round(meta.regularMarketPrice) : meta.regularMarketPrice;

      // 전일 종가: 차트 데이터의 첫 번째 캔들 close 사용 (2d 범위이므로 전일 데이터)
      const closes = result?.indicators?.quote?.[0]?.close ?? [];
      let prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
      if (closes.length >= 2 && closes[0] != null) {
        // 첫 번째 캔들 = 전일, 두 번째 = 당일
        prev = closes[0];
      }
      if (isKR) prev = Math.round(prev);

      const change = prev > 0
        ? parseFloat(((price - prev) / prev * 100).toFixed(2))
        : 0;
      console.log(`✅ v8 가격 (${ticker}): ${price}, 전일종가: ${prev}, 등락: ${change}%`);
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

export const fetchSinglePrice = async (
  ticker: string,
  isKR: boolean,
  type?: 'stock' | 'etf' | 'crypto' | 'index',
): Promise<PriceData | null> => {
  if (type === 'crypto') {
    const result = await fetchUpbitPrices([ticker]);
    return result[ticker] ?? null;
  }

  if (isKR) {
    // .KS(코스피) → .KQ(코스닥) 순서로 시도, 성공한 접미사 캐싱.
    // 캐시에 .KQ로 기록된 종목은 .KQ부터 시도.
    const primary = getKRSuffix(ticker);
    const order: Array<'KS' | 'KQ'> = primary === 'KQ' ? ['KQ', 'KS'] : ['KS', 'KQ'];
    for (const suffix of order) {
      const d = await fetchYahooSymbol(`${ticker}.${suffix}`, ticker, true);
      if (d && d.price > 0) {
        tickerExchangeCache[ticker] = suffix;
        return d;
      }
    }
    return null;
  }

  return fetchYahooSymbol(ticker, ticker, false);
};

// 하위 호환 alias
export const fetchYahooPrice = fetchSinglePrice;

// ══════════════════════════════════════════════════
//  환율 조회 (Yahoo Finance KRW=X, 실패 시 고정값)
// ══════════════════════════════════════════════════

export const getExchangeRate = async (): Promise<number> => {
  try {
    const res = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/KRW=X?interval=1d&range=1d'
    );
    const data = await res.json();
    return data?.chart?.result?.[0]?.meta?.regularMarketPrice ?? 1380;
  } catch {
    return 1380;
  }
};

// ══════════════════════════════════════════════════
//  다중 종목 가격 (v7 → 개별 v8 fallback)
// ══════════════════════════════════════════════════

export const fetchMultiplePrices = async (
  stocks: Array<{ ticker: string; isKR: boolean; type?: 'stock' | 'etf' | 'crypto' | 'index' }>,
): Promise<Record<string, PriceData>> => {
  if (stocks.length === 0) return {};

  const cryptoStocks = stocks.filter(s => s.type === 'crypto');
  const indexStocks = stocks.filter(s => s.type === 'index');
  const nonCryptoStocks = stocks.filter(s => s.type !== 'crypto' && s.type !== 'index');

  const cryptoPromise = cryptoStocks.length > 0
    ? fetchUpbitPrices(cryptoStocks.map(s => s.ticker))
    : Promise.resolve<Record<string, PriceData>>({});

  const indexPromise = indexStocks.length > 0
    ? fetchYahooIndex(indexStocks.map(s => s.ticker))
    : Promise.resolve<Record<string, PriceData>>({});

  const stockPromise = (async (): Promise<Record<string, PriceData>> => {
    if (nonCryptoStocks.length === 0) return {};

    const yahooTickers = nonCryptoStocks
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
          // 코스닥 종목을 .KS로 조회 시 Yahoo가 가짜 종목명+엉뚱한 가격을 echo함 → 제외.
          // 제외된 종목은 아래 missing 개별 재시도(.KQ)로 정확히 채워짐.
          if (kr && !isRealKRListing(item.longName ?? item.shortName ?? item.displayName, t)) return;
          map[t] = toPriceData(item, kr);
        });
        // v7 .KS 배치에서 누락된 종목 (코스닥 .KQ 등) 개별 재시도
        const missing = nonCryptoStocks.filter(s => !map[s.ticker]);
        if (missing.length > 0) {
          await Promise.allSettled(
            missing.map(async ({ ticker, isKR }) => {
              const d = await fetchSinglePrice(ticker, isKR);
              if (d) map[ticker] = d;
            }),
          );
        }
        console.log(`✅ 다중 가격: ${Object.keys(map).length}개`);
        return map;
      }
    } catch {
      console.log('v7 다중 실패, 개별 호출');
    }

    // 개별 fallback
    const map: Record<string, PriceData> = {};
    await Promise.allSettled(
      nonCryptoStocks.map(async ({ ticker, isKR }) => {
        const d = await fetchSinglePrice(ticker, isKR);
        if (d) map[ticker] = d;
      }),
    );
    console.log(`✅ 개별 가격: ${Object.keys(map).length}개`);
    return map;
  })();

  const [stockMap, cryptoMap, indexMap] = await Promise.all([stockPromise, cryptoPromise, indexPromise]);
  return { ...stockMap, ...cryptoMap, ...indexMap };
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

  // 빈 데이터·HTTP 오류·네트워크 예외를 모두 throw로 전파.
  // 호출부(loadChartData)가 retry 및 에러 UI를 책임짐.
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${yahooTicker}?interval=${INTERVAL_MAP[period]}&range=${period}`,
    { headers: YAHOO_HEADERS_V8 },
  );
  if (!res.ok) {
    throw new Error(`차트 API 응답 실패: ${res.status}`);
  }
  const data = await res.json();
  const result = data.chart?.result?.[0];
  if (!result) {
    throw new Error('차트 데이터 없음');
  }

  const timestamps: number[] = result.timestamp ?? [];
  const quotes = result.indicators?.quote?.[0] ?? {};

  // close 기준만 유효성 체크 (open=0인 휴장 분봉 등은 살림)
  const filtered = timestamps
    .map((ts, i) => ({
      date: new Date(ts * 1000).toISOString(),
      timestamp: ts,
      open: isKR ? Math.round(quotes.open?.[i] ?? 0) : quotes.open?.[i] ?? 0,
      high: isKR ? Math.round(quotes.high?.[i] ?? 0) : quotes.high?.[i] ?? 0,
      low: isKR ? Math.round(quotes.low?.[i] ?? 0) : quotes.low?.[i] ?? 0,
      close: isKR ? Math.round(quotes.close?.[i] ?? 0) : quotes.close?.[i] ?? 0,
      volume: quotes.volume?.[i] ?? 0,
    }))
    .filter((d) => d.close > 0);
  if (filtered.length === 0) {
    throw new Error('유효한 차트 데이터 없음');
  }
  return filtered;
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

  // 티커 목록이 같은 수지만 다른 종목으로 바뀌어도 재조회하기 위해 key 사용
  const stocksKey = stocks.map(s => s.ticker).join(',');

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
    // stocksKey: 티커 목록 변경 시 재조회 (stocks.length만으론 부족)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stocksKey]);

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
