/**
 * Yahoo Finance API — 실시간 주가 조회
 * - 단일/복수 종목 현재가 조회
 * - 차트 데이터 (1일~5년)
 * - 30초 자동 업데이트
 * - 한국 주식: ticker.KS 변환
 */

const YAHOO_BASE = 'https://query1.finance.yahoo.com';
const HEADERS = {
  'User-Agent': 'Mozilla/5.0',
  Accept: 'application/json',
};

// ── 티커 변환 ──────────────────────────────────
export const toYahooTicker = (ticker: string): string => {
  if (ticker.length === 6 && /^\d+$/.test(ticker)) {
    return `${ticker}.KS`;
  }
  return ticker;
};

const fromYahooTicker = (yahooTicker: string): string =>
  yahooTicker.replace('.KS', '');

// ── 타입 ──────────────────────────────────────
export interface StockQuote {
  ticker: string;
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
  marketCap: number;
  currency: string;
  marketState: string;
  exchangeName: string;
  isKR: boolean;
}

export interface ChartDataPoint {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type ChartPeriod = '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y';

// ── 단일 종목 현재가 ──────────────────────────────
export const getStockQuote = async (ticker: string): Promise<StockQuote> => {
  const yahooTicker = toYahooTicker(ticker);
  const isKR = yahooTicker.endsWith('.KS');

  const response = await fetch(
    `${YAHOO_BASE}/v8/finance/chart/${yahooTicker}?interval=1m&range=1d`,
    { headers: HEADERS },
  );

  if (!response.ok) {
    throw new Error(`Yahoo API 오류 (${response.status}): ${ticker}`);
  }

  const data = await response.json();
  const meta = data.chart?.result?.[0]?.meta;

  if (!meta) throw new Error(`주가 데이터 없음: ${ticker}`);

  const regularPrice = meta.regularMarketPrice;
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? regularPrice;
  const change = previousClose > 0 ? ((regularPrice - previousClose) / previousClose) * 100 : 0;
  const changeAmount = regularPrice - previousClose;

  console.log(`✅ Yahoo 주가 (${ticker}): ${isKR ? `${regularPrice}원` : `$${regularPrice}`}`);

  return {
    ticker,
    price: regularPrice,
    change: parseFloat(change.toFixed(2)),
    changeAmount: parseFloat(changeAmount.toFixed(isKR ? 0 : 2)),
    open: meta.regularMarketOpen ?? previousClose,
    high: meta.regularMarketDayHigh ?? regularPrice,
    low: meta.regularMarketDayLow ?? regularPrice,
    previousClose,
    volume: meta.regularMarketVolume ?? 0,
    week52High: 0,
    week52Low: 0,
    per: '-',
    pbr: '-',
    marketCap: 0,
    currency: meta.currency ?? (isKR ? 'KRW' : 'USD'),
    marketState: meta.marketState ?? 'CLOSED',
    exchangeName: meta.exchangeName ?? '',
    isKR,
  };
};

// ── 여러 종목 한번에 조회 ──────────────────────────
export const getMultipleQuotes = async (tickers: string[]): Promise<Record<string, StockQuote>> => {
  if (tickers.length === 0) return {};

  const yahooTickers = tickers.map(toYahooTicker).join(',');

  const response = await fetch(
    `${YAHOO_BASE}/v7/finance/quote?symbols=${yahooTickers}&fields=regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketOpen,regularMarketDayHigh,regularMarketDayLow,regularMarketVolume,regularMarketPreviousClose,fiftyTwoWeekHigh,fiftyTwoWeekLow,trailingPE,priceToBook,marketCap`,
    { headers: HEADERS },
  );

  if (!response.ok) {
    throw new Error(`Yahoo 복수 조회 오류 (${response.status})`);
  }

  const data = await response.json();
  const results = data.quoteResponse?.result ?? [];
  const priceMap: Record<string, StockQuote> = {};

  results.forEach((item: any) => {
    const originalTicker = fromYahooTicker(item.symbol);
    const isKR = item.symbol.endsWith('.KS');

    priceMap[originalTicker] = {
      ticker: originalTicker,
      price: item.regularMarketPrice ?? 0,
      change: parseFloat((item.regularMarketChangePercent ?? 0).toFixed(2)),
      changeAmount: parseFloat((item.regularMarketChange ?? 0).toFixed(isKR ? 0 : 2)),
      open: item.regularMarketOpen ?? 0,
      high: item.regularMarketDayHigh ?? 0,
      low: item.regularMarketDayLow ?? 0,
      previousClose: item.regularMarketPreviousClose ?? 0,
      volume: item.regularMarketVolume ?? 0,
      week52High: item.fiftyTwoWeekHigh ?? 0,
      week52Low: item.fiftyTwoWeekLow ?? 0,
      per: item.trailingPE ? item.trailingPE.toFixed(1) : '-',
      pbr: item.priceToBook ? item.priceToBook.toFixed(1) : '-',
      marketCap: item.marketCap ?? 0,
      currency: item.currency ?? (isKR ? 'KRW' : 'USD'),
      marketState: item.marketState ?? 'CLOSED',
      exchangeName: item.fullExchangeName ?? '',
      isKR,
    };
  });

  console.log(`✅ Yahoo 복수 조회: ${Object.keys(priceMap).length}/${tickers.length}개`);
  return priceMap;
};

// ── 차트 데이터 ──────────────────────────────────
const INTERVAL_MAP: Record<ChartPeriod, string> = {
  '1d': '5m',
  '5d': '15m',
  '1mo': '1d',
  '3mo': '1d',
  '6mo': '1d',
  '1y': '1wk',
  '2y': '1wk',
  '5y': '1mo',
};

export const getStockChart = async (
  ticker: string,
  period: ChartPeriod = '3mo',
): Promise<ChartDataPoint[]> => {
  const yahooTicker = toYahooTicker(ticker);
  const interval = INTERVAL_MAP[period];

  const response = await fetch(
    `${YAHOO_BASE}/v8/finance/chart/${yahooTicker}?interval=${interval}&range=${period}`,
    { headers: HEADERS },
  );

  if (!response.ok) {
    throw new Error(`차트 API 오류 (${response.status}): ${ticker}`);
  }

  const data = await response.json();
  const result = data.chart?.result?.[0];

  if (!result) throw new Error('차트 데이터 없음');

  const timestamps: number[] = result.timestamp ?? [];
  const quotes = result.indicators?.quote?.[0] ?? {};

  const chartData = timestamps
    .map((ts: number, i: number) => ({
      date: new Date(ts * 1000).toISOString(),
      timestamp: ts,
      open: quotes.open?.[i] ?? 0,
      high: quotes.high?.[i] ?? 0,
      low: quotes.low?.[i] ?? 0,
      close: quotes.close?.[i] ?? 0,
      volume: quotes.volume?.[i] ?? 0,
    }))
    .filter((d: ChartDataPoint) => d.close > 0 && d.open > 0);

  console.log(`✅ Yahoo 차트 (${ticker}/${period}): ${chartData.length}개`);
  return chartData;
};

// ── 차트 기간 매핑 (UI 라벨 → Yahoo 기간) ──────────
export const CHART_PERIODS: { key: ChartPeriod; label: string }[] = [
  { key: '1d', label: '1일' },
  { key: '1mo', label: '1개월' },
  { key: '3mo', label: '3개월' },
  { key: '1y', label: '1년' },
  { key: '5y', label: '5년' },
];
