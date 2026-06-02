// 메인 시장 인덱스 — InvestScreen 상단 띠에 표시.
// Yahoo Finance ticker 그대로 사용 (priceService.fetchYahooIndex 가 .KS suffix 없이 호출).

export const MARKET_INDICES = [
  { ticker: '^KS11', name: '코스피', isKR: true },
  { ticker: '^KQ11', name: '코스닥', isKR: true },
  { ticker: '^GSPC', name: 'S&P 500', isKR: false },
  { ticker: '^IXIC', name: '나스닥', isKR: false },
  { ticker: 'KRW=X', name: '달러원', isKR: false },
] as const;
