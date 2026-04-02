/**
 * 실시간 주가 업데이트 훅
 * KIS API로 상위 종목의 실시간 가격을 가져와 STOCKS 배열을 업데이트
 * API 키 없으면 기존 정적 가격 유지
 */

import { useState, useEffect, useCallback } from 'react';
import { STOCKS } from '../store/appStore';
import { getKRStockPrice, getUSStockPrice, isKISEnabled } from '../lib/kisApi';

// 실시간 업데이트 대상 (API 호출량 제한 고려)
const TOP_KR_TICKERS = ['005930', '000660', '035420', '035720', '005380'];
const TOP_US_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'AMZN'];

const UPDATE_INTERVAL = 5 * 60 * 1000; // 5분

export function useRealTimeStocks() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const updatePrices = useCallback(async () => {
    if (!isKISEnabled()) return;

    try {
      setIsLoading(true);

      const [krPrices, usPrices] = await Promise.all([
        Promise.all(TOP_KR_TICKERS.map((t) => getKRStockPrice(t))),
        Promise.all(TOP_US_TICKERS.map((t) => getUSStockPrice(t))),
      ]);

      // STOCKS 배열의 가격을 직접 업데이트 (모듈 레벨 뮤터블 배열)
      TOP_KR_TICKERS.forEach((ticker, i) => {
        const result = krPrices[i];
        if (!result) return;
        const stock = STOCKS.find((s) => s.ticker === ticker);
        if (stock) {
          stock.price = result.price;
          stock.change = result.change;
        }
      });

      TOP_US_TICKERS.forEach((ticker, i) => {
        const result = usPrices[i];
        if (!result) return;
        const stock = STOCKS.find((s) => s.ticker === ticker);
        if (stock) {
          stock.price = result.price;
          stock.change = result.change;
        }
      });

      setLastUpdated(new Date());
    } catch (error) {
      console.error('실시간 주가 업데이트 오류:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    updatePrices();
    const interval = setInterval(updatePrices, UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, [updatePrices]);

  return { isLoading, lastUpdated, updatePrices };
}
