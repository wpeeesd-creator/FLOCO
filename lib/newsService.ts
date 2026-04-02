/**
 * 뉴스 서비스 — GNews API 기반 미국/한국 실시간 뉴스
 * - GNews API 사용 (EXPO_PUBLIC_NEWS_API_KEY)
 * - 실패 시 항상 더미 뉴스 표시 (빈 화면 방지)
 * - 타임아웃 10초 적용
 */

import { fetchWithTimeout } from './errorHandler';

const GNEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY ?? '';

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string | null;
  imageUrl: string | null;
  country: 'US' | 'KR';
}

// ── 한국 주식 뉴스 (GNews ko) ──────────────────

export async function fetchKRNews(): Promise<NewsItem[]> {
  try {
    if (!GNEWS_API_KEY || GNEWS_API_KEY === 'dummy') {
      return KR_DUMMY_NEWS;
    }

    const res = await fetchWithTimeout(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent('주식 증권 경제')}&lang=ko&max=10&apikey=${GNEWS_API_KEY}`,
      undefined,
      10000,
    );
    const data = await res.json();

    const articles = (data.articles ?? []).map((a: any) => ({
      id: a.url,
      title: a.title ?? '',
      description: (a.description ?? '').slice(0, 100),
      source: a.source?.name ?? '국내 뉴스',
      publishedAt: a.publishedAt,
      url: a.url,
      imageUrl: a.image ?? null,
      country: 'KR' as const,
    }));

    return articles.length > 0 ? articles : KR_DUMMY_NEWS;
  } catch (error) {
    console.error('한국 뉴스 fetch 오류:', error);
    return KR_DUMMY_NEWS;
  }
}

// ── 미국 주식 뉴스 (GNews en) ──────────────────

export async function fetchUSNews(keyword?: string): Promise<NewsItem[]> {
  try {
    if (!GNEWS_API_KEY || GNEWS_API_KEY === 'dummy') {
      return US_DUMMY_NEWS;
    }

    const query = keyword ?? 'stock market nasdaq';
    const res = await fetchWithTimeout(
      `https://gnews.io/api/v4/search?q=${encodeURIComponent(query)}&lang=en&max=10&apikey=${GNEWS_API_KEY}`,
      undefined,
      10000,
    );
    const data = await res.json();

    const articles = (data.articles ?? []).map((a: any) => ({
      id: a.url,
      title: a.title ?? '',
      description: (a.description ?? '').slice(0, 100),
      source: a.source?.name ?? 'US News',
      publishedAt: a.publishedAt,
      url: a.url,
      imageUrl: a.image ?? null,
      country: 'US' as const,
    }));

    return articles.length > 0 ? articles : US_DUMMY_NEWS;
  } catch (error) {
    console.error('미국 뉴스 fetch 오류:', error);
    return US_DUMMY_NEWS;
  }
}

// ── 종목별 뉴스 검색 ──────────────────────────

export async function fetchStockNews(ticker: string, name: string): Promise<NewsItem[]> {
  try {
    const [byTicker, byName] = await Promise.all([
      fetchUSNews(ticker),
      fetchUSNews(name),
    ]);

    const combined = [...byTicker, ...byName];
    const unique = combined.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

    return unique
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);
  } catch {
    return [];
  }
}

// ── 통합 뉴스 (미국 + 한국) ──────────────────

export async function fetchAllNews(): Promise<NewsItem[]> {
  try {
    if (!GNEWS_API_KEY || GNEWS_API_KEY === 'dummy') {
      return DUMMY_NEWS;
    }

    const [krRes, usRes] = await Promise.all([
      fetchWithTimeout(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent('주식 증권 경제')}&lang=ko&max=10&apikey=${GNEWS_API_KEY}`,
        undefined,
        10000,
      ),
      fetchWithTimeout(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent('stock market nasdaq')}&lang=en&max=10&apikey=${GNEWS_API_KEY}`,
        undefined,
        10000,
      ),
    ]);

    const [krData, usData] = await Promise.all([krRes.json(), usRes.json()]);

    const krNews: NewsItem[] = (krData.articles ?? []).map((a: any) => ({
      id: a.url,
      title: a.title ?? '',
      description: (a.description ?? '').slice(0, 100),
      source: a.source?.name ?? '국내 뉴스',
      publishedAt: a.publishedAt,
      url: a.url,
      imageUrl: a.image ?? null,
      country: 'KR' as const,
    }));

    const usNews: NewsItem[] = (usData.articles ?? []).map((a: any) => ({
      id: a.url,
      title: a.title ?? '',
      description: (a.description ?? '').slice(0, 100),
      source: a.source?.name ?? 'US News',
      publishedAt: a.publishedAt,
      url: a.url,
      imageUrl: a.image ?? null,
      country: 'US' as const,
    }));

    const combined = [...krNews, ...usNews].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

    return combined.length > 0 ? combined : DUMMY_NEWS;
  } catch (error) {
    console.error('뉴스 로드 오류:', error);
    return DUMMY_NEWS;
  }
}

// ── 시간 포맷 ──────────────────────────────

export function formatNewsTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
  } catch {
    return dateString;
  }
}

// ── 더미 데이터 (API 실패/키 없을 때 항상 표시) ──

const KR_DUMMY_NEWS: NewsItem[] = [
  { id: 'kr1', title: '삼성전자, 3분기 영업이익 9조원 달성', description: '반도체 업황 개선으로 실적 회복세', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 3600000).toISOString(), url: null, imageUrl: null, country: 'KR' },
  { id: 'kr2', title: 'SK하이닉스, HBM 수주 확대로 목표가 상향', description: '글로벌 AI 수요 증가로 고대역폭메모리 주문 급증', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: null, imageUrl: null, country: 'KR' },
  { id: 'kr3', title: '코스피, 2,600선 회복 시도…외국인 매수세 유입', description: '미국 증시 강세 영향으로 국내 증시도 상승 출발', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: null, imageUrl: null, country: 'KR' },
  { id: 'kr4', title: '카카오, 플랫폼 사업 정상화 본격화', description: '규제 리스크 완화로 주가 반등 기대', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: null, imageUrl: null, country: 'KR' },
  { id: 'kr5', title: '현대차, 전기차 라인업 확대로 글로벌 경쟁력 강화', description: '2025년 신규 전기차 5개 모델 출시 계획', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 18000000).toISOString(), url: null, imageUrl: null, country: 'KR' },
];

const US_DUMMY_NEWS: NewsItem[] = [
  { id: 'us1', title: 'NVIDIA, AI 칩 수요 급증으로 주가 신고가', description: '데이터센터 수요 확대로 실적 전망 밝아', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 3600000).toISOString(), url: null, imageUrl: null, country: 'US' },
  { id: 'us2', title: 'Apple, 새로운 AI 기능 아이폰에 탑재', description: 'Apple Intelligence로 생성형 AI를 모든 아이폰 사용자에게 제공', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: null, imageUrl: null, country: 'US' },
  { id: 'us3', title: '미국 연준 금리 동결... 시장 반응은?', description: '인플레이션 둔화로 연내 인하 기대감', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: null, imageUrl: null, country: 'US' },
  { id: 'us4', title: '테슬라, 신형 모델 출시로 판매량 급증', description: '전기차 시장 회복세 속 점유율 확대', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: null, imageUrl: null, country: 'US' },
  { id: 'us5', title: 'Microsoft, OpenAI와 파트너십 확대', description: 'Azure 클라우드 인프라에 대규모 투자 발표', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 18000000).toISOString(), url: null, imageUrl: null, country: 'US' },
];

const DUMMY_NEWS: NewsItem[] = [...KR_DUMMY_NEWS, ...US_DUMMY_NEWS];
