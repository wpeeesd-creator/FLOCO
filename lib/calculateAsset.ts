/**
 * 총 자산 자동 계산 유틸리티
 * balance(현금) + portfolio(보유 종목 평가액) = totalAsset
 *
 * 사용처:
 * - 실시간 동기화 시 총 자산 재계산
 * - 랭킹 계산
 * - 화면 렌더링
 */

import { STOCKS, type Holding } from '../store/appStore';

/**
 * 포트폴리오 평가액 계산
 * currentPrice 우선, 없으면 STOCKS 정적 가격, 없으면 avgPrice fallback
 */
export function calculatePortfolioValue(portfolio: any[]): number {
  const safePortfolio = portfolio ?? [];
  return safePortfolio.reduce((sum, stock) => {
    // 실시간 가격 → STOCKS 정적 가격 → 평균 단가 순으로 fallback
    const price = stock?.currentPrice
      ?? STOCKS.find(s => s.ticker === stock?.ticker)?.price
      ?? stock?.avgPrice
      ?? 0;
    const quantity = stock?.quantity ?? stock?.qty ?? 0;
    return sum + (price * quantity);
  }, 0);
}

/**
 * 총 자산 = 현금 + 포트폴리오 평가액
 */
export function calculateTotalAsset(balance: number, portfolio: any[]): number {
  const portfolioValue = calculatePortfolioValue(portfolio);
  return (balance ?? 0) + portfolioValue;
}

/**
 * 수익률 계산
 */
export function calculateReturnRate(
  totalAsset: number,
  initialBalance: number = 1_000_000,
): number {
  if (initialBalance <= 0) return 0;
  return ((totalAsset - initialBalance) / initialBalance) * 100;
}

/**
 * Holding[] 타입 기반 총 자산 계산 (Zustand store 호환)
 * STOCKS 정적 가격 기준
 */
export function calculateTotalFromHoldings(
  cash: number,
  holdings: Holding[],
): number {
  const safeHoldings = holdings ?? [];
  const stockValue = safeHoldings.reduce((sum, h) => {
    const stock = STOCKS.find(s => s.ticker === h.ticker);
    return sum + (stock ? (stock.price ?? 0) * (h.qty ?? 0) : 0);
  }, 0);
  return (cash ?? 0) + stockValue;
}
