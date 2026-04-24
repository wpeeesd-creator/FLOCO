/**
 * 한국투자증권 KIS API — 실시간 주가 조회
 * - 모의투자 API 서버 사용 (openapivts.koreainvestment.com:29443)
 * - 토큰 캐싱으로 불필요한 재발급 방지
 * - API 키 없으면 null 반환 (기존 정적 가격 유지)
 * - 타임아웃 15초, 실패 시 Yahoo Finance 폴백 + 1회 재시도
 */

import { fetchWithTimeout, classifyError } from './errorHandler';

const KIS_BASE_URL = 'https://openapivts.koreainvestment.com:29443';
const KIS_APP_KEY = process.env.EXPO_PUBLIC_KIS_APP_KEY ?? '';
const KIS_APP_SECRET = process.env.EXPO_PUBLIC_KIS_APP_SECRET ?? '';

// ── 토큰 캐싱 ────────────────────────────────────
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const response = await fetchWithTimeout(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: KIS_APP_KEY,
      appsecret: KIS_APP_SECRET,
    }),
  }, 15000);
  const data = await response.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in ?? 86400) * 1000);
  return cachedToken!;
}

// ── 타입 ──────────────────────────────────────────
export interface KISPriceResult {
  price: number;
  change: number;
  high: number;
  low: number;
  volume: number;
}

// ── Yahoo Finance 폴백 ──────────────────────────
async function getYahooFallback(ticker: string): Promise<KISPriceResult | null> {
  try {
    const res = await fetchWithTimeout(
      `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`,
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: '*/*' } },
      10000,
    );
    const text = await res.text();
    if (!text || text.trim() === '') return null;
    const data = JSON.parse(text);
    const meta = data.chart?.result?.[0]?.meta;
    if (!meta?.regularMarketPrice) return null;

    const closes = data.chart?.result?.[0]?.indicators?.quote?.[0]?.close ?? [];
    let prev = meta.chartPreviousClose ?? meta.previousClose ?? meta.regularMarketPrice;
    if (closes.length >= 2 && closes[0] != null) prev = closes[0];

    const price = meta.regularMarketPrice;
    const change = prev > 0 ? parseFloat(((price - prev) / prev * 100).toFixed(2)) : 0;

    return {
      price,
      change,
      high: meta.regularMarketDayHigh ?? price,
      low: meta.regularMarketDayLow ?? price,
      volume: meta.regularMarketVolume ?? 0,
    };
  } catch {
    return null;
  }
}

// ── 국내 주식 현재가 ─────────────────────────────
export async function getKRStockPrice(ticker: string): Promise<KISPriceResult | null> {
  try {
    if (!KIS_APP_KEY || !KIS_APP_SECRET) return null;

    const token = await getAccessToken();
    const response = await fetchWithTimeout(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${ticker}`,
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
          appkey: KIS_APP_KEY,
          appsecret: KIS_APP_SECRET,
          tr_id: 'FHKST01010100',
        },
      },
      15000,
    );
    const data = await response.json();
    const output = data.output;
    if (!output) return null;

    return {
      price: parseInt(output.stck_prpr ?? '0', 10),
      change: parseFloat(output.prdy_ctrt ?? '0'),
      high: parseInt(output.stck_hgpr ?? '0', 10),
      low: parseInt(output.stck_lwpr ?? '0', 10),
      volume: parseInt(output.acml_vol ?? '0', 10),
    };
  } catch (error) {
    console.warn(`KIS 국내 주가 오류 (${ticker}):`, error);
    return null;
  }
}

// ── 해외 주식 현재가 (재시도 + Yahoo 폴백) ──────
async function fetchUSPrice(ticker: string): Promise<KISPriceResult | null> {
  if (!KIS_APP_KEY || !KIS_APP_SECRET) return null;

  const token = await getAccessToken();
  const response = await fetchWithTimeout(
    `${KIS_BASE_URL}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=NAS&SYMB=${ticker}`,
    {
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
        appkey: KIS_APP_KEY,
        appsecret: KIS_APP_SECRET,
        tr_id: 'HHDFS00000300',
      },
    },
    15000,
  );
  const data = await response.json();
  const output = data.output;
  if (!output || !output.last || output.last === '0') return null;

  return {
    price: parseFloat(output.last),
    change: parseFloat(output.rate ?? '0'),
    high: parseFloat(output.high ?? '0'),
    low: parseFloat(output.low ?? '0'),
    volume: parseInt(output.tvol ?? '0', 10),
  };
}

export async function getUSStockPrice(ticker: string): Promise<KISPriceResult | null> {
  // 1차 시도
  try {
    const result = await fetchUSPrice(ticker);
    if (result) return result;
  } catch (error) {
    console.warn(`KIS 해외 주가 1차 실패 (${ticker}):`, error);
  }

  // 1초 대기 후 재시도
  await new Promise(resolve => setTimeout(resolve, 1000));
  try {
    const result = await fetchUSPrice(ticker);
    if (result) return result;
  } catch (error) {
    console.warn(`KIS 해외 주가 2차 실패 (${ticker}):`, error);
  }

  // Yahoo Finance 폴백
  console.warn(`KIS 실패 → Yahoo 폴백 (${ticker})`);
  return getYahooFallback(ticker);
}

// ── KIS API 활성화 여부 ──────────────────────────
export function isKISEnabled(): boolean {
  return !!(KIS_APP_KEY && KIS_APP_SECRET);
}
