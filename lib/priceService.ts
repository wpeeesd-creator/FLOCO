/**
 * 실시간 주가 조회 — Yahoo Finance (5~15분 지연)
 * 클라이언트 메모리 캐싱 적용 (TTL: 10분)
 */

const CACHE_TTL_MS = 10 * 60 * 1000; // 10분

interface CacheEntry {
  price: number;
  change: number;  // 등락률 (%)
  updatedAt: number;
}

const cache = new Map<string, CacheEntry>();

/** 앱 ticker → Yahoo Finance 심볼 변환 */
function toYahooSymbol(ticker: string, krw: boolean): string {
  return krw ? `${ticker}.KS` : ticker;
}

export interface PriceResult {
  price: number;
  change: number;
  updatedAt: number;
  fromCache: boolean;
}

/**
 * 주가 조회. 캐시 유효 시 캐시 반환, 만료 시 API 호출.
 * 실패 시 null 반환 (UI에서 fallback 처리).
 */
export async function fetchPrice(ticker: string, krw: boolean): Promise<PriceResult | null> {
  const now = Date.now();
  const cached = cache.get(ticker);

  if (cached && now - cached.updatedAt < CACHE_TTL_MS) {
    return { ...cached, fromCache: true };
  }

  try {
    const symbol = toYahooSymbol(ticker, krw);
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price: number = meta.regularMarketPrice;
    const prevClose: number = meta.previousClose ?? meta.chartPreviousClose ?? price;
    const change = prevClose ? ((price - prevClose) / prevClose) * 100 : 0;

    const entry: CacheEntry = { price, change, updatedAt: now };
    cache.set(ticker, entry);

    return { price, change, updatedAt: now, fromCache: false };
  } catch {
    // 네트워크 오류 시 캐시된 값이라도 반환
    if (cached) return { ...cached, fromCache: true };
    return null;
  }
}

/** 캐시 수동 초기화 (필요 시) */
export function clearPriceCache(): void {
  cache.clear();
}

/** 마지막 업데이트 경과 시간 문자열 */
export function getCacheAge(updatedAt: number): string {
  const diffMs = Date.now() - updatedAt;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;
  return `${Math.floor(diffMin / 60)}시간 전`;
}
