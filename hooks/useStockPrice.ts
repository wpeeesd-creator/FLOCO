/**
 * TanStack Query 기반 주가 조회 훅
 * - 10분 staleTime (5~15분 지연 데이터에 맞춤)
 * - 자동 백그라운드 갱신
 * - 로딩/에러 상태 내장
 */

import { useQuery } from '@tanstack/react-query';
import { fetchPrice, type PriceResult } from '../lib/priceService';

const STALE_TIME = 10 * 60 * 1000; // 10분
const CACHE_TIME = 15 * 60 * 1000; // 15분

export function useStockPrice(ticker: string, krw: boolean) {
  return useQuery<PriceResult | null>({
    queryKey: ['stockPrice', ticker],
    queryFn: () => fetchPrice(ticker, krw),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
    retryDelay: 3000,
    // 앱이 포그라운드로 돌아올 때 자동 갱신
    refetchOnWindowFocus: true,
  });
}

/** 여러 종목 가격 동시 조회 (목록 화면용) */
export function useStockPriceEnabled(
  ticker: string,
  krw: boolean,
  enabled: boolean
) {
  return useQuery<PriceResult | null>({
    queryKey: ['stockPrice', ticker],
    queryFn: () => fetchPrice(ticker, krw),
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    enabled,
    retry: 1,
  });
}
