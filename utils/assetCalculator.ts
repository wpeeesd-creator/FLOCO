import { STOCKS } from '../store/appStore';

export interface CalculateAssetParams {
  balance: number;
  portfolio: Array<{
    ticker: string;
    qty?: number;
    quantity?: number;
    avgPrice?: number;
    krw?: boolean;
  }>;
  livePrices: Record<string, number>;
  exchangeRate: number;
}

export interface AssetResult {
  totalAsset: number;
  portfolioValue: number;
}

export function calculateTotalAsset(params: CalculateAssetParams): AssetResult {
  const { balance, portfolio, livePrices, exchangeRate } = params;

  const portfolioValue = portfolio.reduce((sum, p) => {
    const ticker = p.ticker;
    const qty = p.quantity ?? p.qty ?? 0;
    const stockMeta = STOCKS.find(s => s.ticker === ticker);
    const isKR = p?.krw ?? stockMeta?.krw ?? true;

    const livePrice = livePrices[ticker] ?? stockMeta?.price ?? 0;
    const livePriceKRW = isKR ? livePrice : Math.round(livePrice * exchangeRate);

    return sum + livePriceKRW * qty;
  }, 0);

  return {
    totalAsset: balance + portfolioValue,
    portfolioValue,
  };
}
