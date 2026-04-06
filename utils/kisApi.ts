/**
 * 한국투자증권 KIS Open API 유틸리티
 * - 모의투자 서버 사용
 * - 토큰 자동 캐싱/갱신
 * - API 실패 시 null 반환 (UI에서 "-" 표시)
 * - 더미/랜덤 데이터 없음
 */

const KIS_BASE_URL = 'https://openapivts.koreainvestment.com:29443';

// ── 토큰 캐싱 ──────────────────────────────────
let accessToken: string | null = null;
let tokenExpiry: number = 0;

export const getKISToken = async (): Promise<string> => {
  if (accessToken && Date.now() < tokenExpiry) {
    return accessToken;
  }

  const APP_KEY = process.env.EXPO_PUBLIC_KIS_APP_KEY;
  const APP_SECRET = process.env.EXPO_PUBLIC_KIS_APP_SECRET;

  if (!APP_KEY || !APP_SECRET) {
    throw new Error('KIS API 키가 설정되지 않았습니다');
  }

  console.log('🔑 KIS 토큰 발급 시도...');

  const response = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: APP_KEY,
      appsecret: APP_SECRET,
    }),
  });

  const data = await response.json();

  if (!data.access_token) {
    console.error('❌ KIS 토큰 발급 실패:', JSON.stringify(data));
    throw new Error(`토큰 발급 실패: ${data.msg1 ?? JSON.stringify(data)}`);
  }

  console.log('✅ KIS 토큰 발급 성공');
  accessToken = data.access_token;
  tokenExpiry = Date.now() + ((data.expires_in ?? 86400) * 1000) - 60000;
  return accessToken!;
};

// ── 공통 헤더 ──────────────────────────────────
const getKISHeaders = async (trId: string) => {
  const token = await getKISToken();
  return {
    'Content-Type': 'application/json',
    authorization: `Bearer ${token}`,
    appkey: process.env.EXPO_PUBLIC_KIS_APP_KEY!,
    appsecret: process.env.EXPO_PUBLIC_KIS_APP_SECRET!,
    tr_id: trId,
    custtype: 'P',
  };
};

// ── 타입 ──────────────────────────────────────
export interface KRStockPrice {
  price: number;
  change: number;
  changeAmount: number;
  sign: string;
  high: number;
  low: number;
  open: number;
  volume: number;
  tradingValue: number;
  upperLimit: number;
  lowerLimit: number;
  per: string;
  pbr: string;
  eps: string;
  bps: string;
  week52High: number;
  week52Low: number;
  marketCap: string;
  sharesOutstanding: string;
}

export interface USStockPrice {
  price: number;
  change: number;
  changeAmount: number;
  high: number;
  low: number;
  open: number;
  volume: number;
  week52High: number;
  week52Low: number;
  per: string;
  pbr: string;
  eps: string;
}

export interface OrderbookEntry {
  price: number;
  quantity: number;
  rate: number;
}

export interface OrderbookData {
  asks: OrderbookEntry[];
  bids: OrderbookEntry[];
  totalAskQty: number;
  totalBidQty: number;
  strengthRatio: string;
}

export type ChartPeriod = 'D' | 'W' | 'M' | 'Y';

export interface ChartDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  changeRate?: number;
}

// ── 국내주식 현재가 ──────────────────────────────
export const getKRStockPrice = async (ticker: string): Promise<KRStockPrice> => {
  const headers = await getKISHeaders('FHKST01010100');
  const response = await fetch(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${ticker}`,
    { headers },
  );
  const data = await response.json();

  if (data.rt_cd !== '0') {
    throw new Error(`KR 주가 오류 (${ticker}): ${data.msg1}`);
  }

  const o = data.output;
  console.log(`✅ KR 주가 (${ticker}): ${o.stck_prpr}원`);

  return {
    price: parseInt(o.stck_prpr),
    change: parseFloat(o.prdy_ctrt),
    changeAmount: parseInt(o.prdy_vrss),
    sign: o.prdy_vrss_sign,
    high: parseInt(o.stck_hgpr),
    low: parseInt(o.stck_lwpr),
    open: parseInt(o.stck_oprc),
    volume: parseInt(o.acml_vol),
    tradingValue: parseInt(o.acml_tr_pbmn ?? '0'),
    upperLimit: parseInt(o.stck_mxpr ?? '0'),
    lowerLimit: parseInt(o.stck_llam ?? '0'),
    per: o.per ?? '-',
    pbr: o.pbr ?? '-',
    eps: o.eps ?? '-',
    bps: o.bps ?? '-',
    week52High: parseInt(o.w52_hgpr ?? '0'),
    week52Low: parseInt(o.w52_lwpr ?? '0'),
    marketCap: o.hts_avls ?? '-',
    sharesOutstanding: o.lstn_stcn ?? '-',
  };
};

// ── 해외주식 현재가 ──────────────────────────────
export const getUSStockPrice = async (ticker: string): Promise<USStockPrice> => {
  const headers = await getKISHeaders('HHDFS00000300');
  const response = await fetch(
    `${KIS_BASE_URL}/uapi/overseas-price/v1/quotations/price?AUTH=&EXCD=NAS&SYMB=${ticker}`,
    { headers },
  );
  const data = await response.json();

  if (data.rt_cd !== '0') {
    throw new Error(`US 주가 오류 (${ticker}): ${data.msg1}`);
  }

  const o = data.output;
  console.log(`✅ US 주가 (${ticker}): $${o.last}`);

  return {
    price: parseFloat(o.last),
    change: parseFloat(o.rate),
    changeAmount: parseFloat(o.diff),
    high: parseFloat(o.high),
    low: parseFloat(o.low),
    open: parseFloat(o.open),
    volume: parseInt(o.tvol),
    week52High: parseFloat(o.h52p ?? '0'),
    week52Low: parseFloat(o.l52p ?? '0'),
    per: o.perx ?? '-',
    pbr: o.pbrx ?? '-',
    eps: o.epsx ?? '-',
  };
};

// ── 국내주식 호가 ──────────────────────────────
export const getKROrderbook = async (ticker: string): Promise<OrderbookData> => {
  const headers = await getKISHeaders('FHKST01010200');
  const response = await fetch(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-asking-price-exp-ccn?FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${ticker}`,
    { headers },
  );
  const data = await response.json();

  if (data.rt_cd !== '0') {
    throw new Error(`호가 오류: ${data.msg1}`);
  }

  const o = data.output1;
  const asks: OrderbookEntry[] = [];
  const bids: OrderbookEntry[] = [];

  for (let i = 1; i <= 10; i++) {
    asks.push({
      price: parseInt(o[`askp${i}`] ?? '0'),
      quantity: parseInt(o[`askp_rsqn${i}`] ?? '0'),
      rate: parseFloat(o[`askp_rang${i}`] ?? '0'),
    });
    bids.push({
      price: parseInt(o[`bidp${i}`] ?? '0'),
      quantity: parseInt(o[`bidp_rsqn${i}`] ?? '0'),
      rate: parseFloat(o[`bidp_rang${i}`] ?? '0'),
    });
  }

  return {
    asks: asks.filter(a => a.price > 0).reverse(),
    bids: bids.filter(b => b.price > 0),
    totalAskQty: parseInt(o.total_askp_rsqn ?? '0'),
    totalBidQty: parseInt(o.total_bidp_rsqn ?? '0'),
    strengthRatio: o.seln_rsqn_smtn && o.shnu_rsqn_smtn
      ? (parseInt(o.shnu_rsqn_smtn) / parseInt(o.seln_rsqn_smtn) * 100).toFixed(2)
      : '-',
  };
};

// ── 국내주식 일별 차트 ──────────────────────────
export const getKRDailyChart = async (
  ticker: string,
  period: ChartPeriod = 'D',
): Promise<ChartDataPoint[]> => {
  const headers = await getKISHeaders('FHKST03010100');

  const endDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const startDate = (() => {
    const d = new Date();
    if (period === 'D') d.setMonth(d.getMonth() - 3);
    else if (period === 'W') d.setFullYear(d.getFullYear() - 1);
    else if (period === 'M') d.setFullYear(d.getFullYear() - 3);
    else d.setFullYear(d.getFullYear() - 10);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  })();

  const response = await fetch(
    `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice?` +
    `FID_COND_MRKT_DIV_CODE=J&FID_INPUT_ISCD=${ticker}` +
    `&FID_INPUT_DATE_1=${startDate}&FID_INPUT_DATE_2=${endDate}` +
    `&FID_PERIOD_DIV_CODE=${period}&FID_ORG_ADJ_PRC=0`,
    { headers },
  );
  const data = await response.json();

  if (!data.output2 || data.output2.length === 0) {
    throw new Error('차트 데이터 없음');
  }

  console.log(`✅ 차트 데이터 (${ticker}): ${data.output2.length}개`);

  return data.output2.map((item: any) => ({
    date: item.stck_bsop_date,
    open: parseInt(item.stck_oprc),
    high: parseInt(item.stck_hgpr),
    low: parseInt(item.stck_lwpr),
    close: parseInt(item.stck_clpr),
    volume: parseInt(item.acml_vol),
    changeRate: parseFloat(item.prdy_ctrt ?? '0'),
  })).reverse();
};

// ── 해외주식 일별 차트 ──────────────────────────
export const getUSDailyChart = async (
  ticker: string,
  period: 'D' | 'W' | 'M' = 'D',
): Promise<ChartDataPoint[]> => {
  const headers = await getKISHeaders('HHDFS76240000');
  const gubn = period === 'D' ? '0' : period === 'W' ? '1' : '2';

  const response = await fetch(
    `${KIS_BASE_URL}/uapi/overseas-price/v1/quotations/dailyprice?` +
    `AUTH=&EXCD=NAS&SYMB=${ticker}&GUBN=${gubn}&BYMD=&MODP=1`,
    { headers },
  );
  const data = await response.json();

  if (!data.output2 || data.output2.length === 0) {
    throw new Error('해외 차트 데이터 없음');
  }

  return data.output2.map((item: any) => ({
    date: item.xymd,
    open: parseFloat(item.open),
    high: parseFloat(item.high),
    low: parseFloat(item.low),
    close: parseFloat(item.clos),
    volume: parseInt(item.tvol),
  })).reverse();
};
