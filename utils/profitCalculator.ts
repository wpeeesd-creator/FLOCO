/**
 * 수익률 계산 공통 함수
 * HomeScreen / RankingScreen 등에서 통일 사용
 */

export const calculateProfit = (
  totalAsset: number,
  initialBalance: number,
) => {
  const profit = totalAsset - initialBalance;
  const profitRate = initialBalance > 0
    ? parseFloat(((profit / initialBalance) * 100).toFixed(2))
    : 0;
  return { profit, profitRate };
};
