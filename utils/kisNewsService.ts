/**
 * 한국투자증권 KIS API 뉴스 조회
 * - 종목별 뉴스 + 시장 전체 뉴스
 * - GNews와 통합 가능
 */

import { getKISToken } from './kisApi';
import { fetchAllNews, type NewsItem } from '../lib/newsService';

const KIS_BASE_URL = 'https://openapivts.koreainvestment.com:29443';

export interface KISNewsItem {
  id: string;
  title: string;
  source: string;
  publishedAt: string;
  url: string | null;
  country: 'KR' | 'US';
  ticker?: string;
}

// ── 날짜 포맷 변환 ──────────────────────────────
const formatKISDate = (date: string, time?: string): string => {
  try {
    if (!date) return new Date().toISOString();
    const y = date.slice(0, 4);
    const m = date.slice(4, 6);
    const d = date.slice(6, 8);
    const h = time?.slice(0, 2) ?? '00';
    const min = time?.slice(2, 4) ?? '00';
    return new Date(`${y}-${m}-${d}T${h}:${min}:00+09:00`).toISOString();
  } catch {
    return new Date().toISOString();
  }
};

// ── 종목별 뉴스 조회 ──────────────────────────────
export const getKRStockNews = async (ticker: string): Promise<KISNewsItem[]> => {
  try {
    const token = await getKISToken();

    const response = await fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/news-title?` +
      `FID_NEWS_OFER_ENTP_CODE=&FID_CLAS_CODE=&` +
      `FID_TITL_CNTT=&FID_INPUT_ISCD=${ticker}&` +
      `FID_INPUT_DATE_1=&FID_INPUT_DATE_2=`,
      {
        headers: {
          'Content-Type': 'application/json',
          authorization: `Bearer ${token}`,
          appkey: process.env.EXPO_PUBLIC_KIS_APP_KEY!,
          appsecret: process.env.EXPO_PUBLIC_KIS_APP_SECRET!,
          tr_id: 'HHKST03010100',
          custtype: 'P',
        },
      },
    );

    const data = await response.json();

    if (!data.output || data.output.length === 0) {
      return [];
    }

    return data.output
      .map((item: any) => ({
        id: item.news_id ?? item.cntt_usiq_id ?? `${ticker}-${item.dorg_news_tm}`,
        title: item.hts_news_titl ?? item.news_titl ?? '',
        source: item.news_ofer_entp_name ?? '한국투자증권',
        publishedAt: formatKISDate(item.cntt_dt, item.dorg_news_tm),
        url: null,
        country: 'KR' as const,
        ticker,
      }))
      .filter((n: KISNewsItem) => n.title.length > 0);
  } catch (error) {
    console.error('KIS 뉴스 오류:', error);
    return [];
  }
};

// ── 시장 전체 뉴스 (주요 종목 뉴스 병합) ──────────
export const getKRMarketNews = async (): Promise<KISNewsItem[]> => {
  try {
    const tickers = [
      '005930', // 삼성전자
      '000660', // SK하이닉스
      '035420', // NAVER
      '035720', // 카카오
      '005380', // 현대차
    ];

    const newsArrays = await Promise.allSettled(
      tickers.map(t => getKRStockNews(t)),
    );

    const allNews = newsArrays
      .filter((r): r is PromiseFulfilledResult<KISNewsItem[]> => r.status === 'fulfilled')
      .flatMap(r => r.value)
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 30);

    return allNews;
  } catch (error) {
    console.error('KIS 시장 뉴스 오류:', error);
    return [];
  }
};

// ── KIS + GNews 통합 뉴스 ──────────────────────
export const fetchAllNewsIntegrated = async (): Promise<NewsItem[]> => {
  try {
    const [kisResult, gNewsResult] = await Promise.allSettled([
      getKRMarketNews(),
      fetchAllNews(),
    ]);

    const kisNews: NewsItem[] = kisResult.status === 'fulfilled'
      ? kisResult.value.map(n => ({
          id: n.id,
          title: n.title,
          description: '',
          source: n.source,
          publishedAt: n.publishedAt,
          url: n.url,
          imageUrl: null,
          country: n.country,
        }))
      : [];

    const gNews: NewsItem[] = gNewsResult.status === 'fulfilled'
      ? gNewsResult.value
      : [];

    const combined = [...kisNews, ...gNews]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    console.log(`✅ 뉴스 로드: KIS ${kisNews.length}개 + GNews ${gNews.length}개`);
    return combined;
  } catch (error) {
    console.error('뉴스 통합 오류:', error);
    return fetchAllNews();
  }
};
