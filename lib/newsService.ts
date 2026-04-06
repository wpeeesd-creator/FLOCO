/**
 * 뉴스 서비스 — Yahoo Finance RSS + GNews API + 더미 fallback
 */

import { Alert } from 'react-native';

// ── 타입 ──────────────────────────────────────
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

// ── XML 파싱 ──────────────────────────────────
const parseXML = (xml: string, country: 'KR' | 'US'): NewsItem[] => {
  try {
    const items = xml.match(/<item>([\s\S]*?)<\/item>/g) ?? [];
    return items.map((item, i) => {
      const title = (
        item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] ??
        item.match(/<title>(.*?)<\/title>/)?.[1] ?? ''
      ).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();

      const link = (
        item.match(/<link>(.*?)<\/link>/)?.[1] ??
        item.match(/<guid[^>]*>(.*?)<\/guid>/)?.[1] ?? ''
      ).trim();

      const description = (
        item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] ??
        item.match(/<description>(.*?)<\/description>/)?.[1] ?? ''
      ).replace(/<[^>]+>/g, '').slice(0, 120).trim();

      const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] ?? '';

      return {
        id: `yahoo-${country}-${i}-${Date.now()}`,
        title,
        description,
        source: country === 'KR' ? '야후 파이낸스' : 'Yahoo Finance',
        publishedAt: pubDate
          ? new Date(pubDate).toISOString()
          : new Date().toISOString(),
        url: link || null,
        imageUrl: null,
        country,
      };
    }).filter(n => n.title && n.title.length > 5);
  } catch {
    return [];
  }
};

// ── 더미 뉴스 (모든 소스 실패 시) ──────────────
const DUMMY_NEWS: NewsItem[] = [
  { id: '1', title: '코스피 외국인 순매수 지속... 반등 기대', description: '외국인 투자자 매수세 유입으로 지수 반등', source: 'FLOCO 뉴스', publishedAt: new Date().toISOString(), url: null, imageUrl: null, country: 'KR' },
  { id: '2', title: '삼성전자, AI 반도체 수요 급증으로 실적 개선', description: '2분기 영업이익 컨센서스 상향 조정', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 3600000).toISOString(), url: null, imageUrl: null, country: 'KR' },
  { id: '3', title: 'NVIDIA, 데이터센터 매출 분기 최대 경신', description: 'AI 인프라 투자 확대로 수요 지속', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: null, imageUrl: null, country: 'US' },
  { id: '4', title: '미국 연준 금리 동결... 연내 인하 기대', description: '인플레이션 둔화 확인 후 검토', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: null, imageUrl: null, country: 'US' },
  { id: '5', title: 'SK하이닉스, HBM 수요 폭발로 최대 실적', description: 'AI 메모리 시장 선점으로 수익성 개선', source: 'FLOCO 뉴스', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: null, imageUrl: null, country: 'KR' },
];

// ── 한국 뉴스 ──────────────────────────────────
export async function fetchKRNews(): Promise<NewsItem[]> {
  try {
    const xml = await fetch(
      'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^KS11,^KQ11&region=KR&lang=ko-KR',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then(r => r.text());
    const items = parseXML(xml, 'KR');
    if (items.length > 0) return items;
  } catch {}
  return DUMMY_NEWS.filter(n => n.country === 'KR');
}

// ── 미국 뉴스 ──────────────────────────────────
export async function fetchUSNews(): Promise<NewsItem[]> {
  try {
    const xml = await fetch(
      'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^IXIC&region=US&lang=en-US',
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then(r => r.text());
    const items = parseXML(xml, 'US');
    if (items.length > 0) return items;
  } catch {}
  return DUMMY_NEWS.filter(n => n.country === 'US');
}

// ── 종목별 뉴스 ────────────────────────────────
export async function fetchStockNews(ticker: string, name: string): Promise<NewsItem[]> {
  // Yahoo Finance RSS (종목)
  try {
    const yahooTicker = ticker.length === 6 && /^\d+$/.test(ticker)
      ? `${ticker}.KS`
      : ticker;
    const xml = await fetch(
      `https://feeds.finance.yahoo.com/rss/2.0/headline?s=${yahooTicker}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } },
    ).then(r => r.text());
    const country = ticker.length === 6 && /^\d+$/.test(ticker) ? 'KR' : 'US';
    const items = parseXML(xml, country);
    if (items.length > 0) return items;
  } catch {}

  // GNews fallback
  try {
    const GNEWS_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
    if (GNEWS_KEY && GNEWS_KEY !== 'dummy' && GNEWS_KEY !== '') {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=${encodeURIComponent(name)}&lang=ko&max=5&apikey=${GNEWS_KEY}`,
        { signal: AbortSignal.timeout(5000) },
      );
      if (res.ok) {
        const data = await res.json();
        const articles = (data.articles ?? [])
          .map((a: any, i: number) => ({
            id: `stock-${ticker}-${i}`,
            title: a.title ?? '',
            description: (a.description ?? '').slice(0, 120),
            source: a.source?.name ?? '뉴스',
            publishedAt: a.publishedAt,
            url: a.url,
            imageUrl: a.image ?? null,
            country: 'KR' as const,
          }))
          .filter((n: any) => n.title && n.url);
        if (articles.length > 0) return articles;
      }
    }
  } catch {}

  return [];
}

// ── 통합 뉴스 (Yahoo RSS → GNews → 더미 fallback) ──
export async function fetchAllNews(): Promise<NewsItem[]> {
  try {
    const results = await Promise.allSettled([
      // Yahoo Finance 한국 시장
      fetch(
        'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^KS11,^KQ11&region=KR&lang=ko-KR',
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      ).then(r => r.text()).then(xml => parseXML(xml, 'KR')).catch(() => []),

      // Yahoo Finance 미국 시장
      fetch(
        'https://feeds.finance.yahoo.com/rss/2.0/headline?s=^GSPC,^IXIC&region=US&lang=en-US',
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      ).then(r => r.text()).then(xml => parseXML(xml, 'US')).catch(() => []),

      // Yahoo Finance 삼성전자
      fetch(
        'https://feeds.finance.yahoo.com/rss/2.0/headline?s=005930.KS',
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      ).then(r => r.text()).then(xml => parseXML(xml, 'KR')).catch(() => []),

      // Yahoo Finance 주요 미국 종목
      fetch(
        'https://feeds.finance.yahoo.com/rss/2.0/headline?s=NVDA,AAPL,TSLA',
        { headers: { 'User-Agent': 'Mozilla/5.0' } },
      ).then(r => r.text()).then(xml => parseXML(xml, 'US')).catch(() => []),
    ]);

    const allNews: NewsItem[] = [];
    results.forEach(r => {
      if (r.status === 'fulfilled') {
        allNews.push(...r.value);
      }
    });

    // GNews도 시도
    const GNEWS_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;
    if (GNEWS_KEY && GNEWS_KEY !== 'dummy' && GNEWS_KEY !== '') {
      try {
        const [kr, us] = await Promise.allSettled([
          fetch(
            `https://gnews.io/api/v4/search?q=주식+코스피+증권&lang=ko&max=10&apikey=${GNEWS_KEY}`,
            { signal: AbortSignal.timeout(5000) },
          ).then(r => r.json()),
          fetch(
            `https://gnews.io/api/v4/search?q=stock+market+nasdaq+nyse&lang=en&max=10&apikey=${GNEWS_KEY}`,
            { signal: AbortSignal.timeout(5000) },
          ).then(r => r.json()),
        ]);

        if (kr.status === 'fulfilled') {
          allNews.push(
            ...(kr.value.articles ?? []).map((a: any) => ({
              id: a.url,
              title: a.title ?? '',
              description: (a.description ?? '').slice(0, 120),
              source: a.source?.name ?? '뉴스',
              publishedAt: a.publishedAt,
              url: a.url,
              imageUrl: a.image ?? null,
              country: 'KR' as const,
            })).filter((n: any) => n.title && n.url),
          );
        }

        if (us.status === 'fulfilled') {
          allNews.push(
            ...(us.value.articles ?? []).map((a: any) => ({
              id: a.url,
              title: a.title ?? '',
              description: (a.description ?? '').slice(0, 120),
              source: a.source?.name ?? 'News',
              publishedAt: a.publishedAt,
              url: a.url,
              imageUrl: a.image ?? null,
              country: 'US' as const,
            })).filter((n: any) => n.title && n.url),
          );
        }
      } catch {}
    }

    // 중복 제거
    const unique = Array.from(
      new Map(allNews.map(n => [n.title, n])).values(),
    );

    // 국내+해외 번갈아 섞기
    const kr = unique.filter(n => n.country === 'KR').sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    const us = unique.filter(n => n.country === 'US').sort((a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
    const interleaved: NewsItem[] = [];
    const maxLen = Math.max(kr.length, us.length);
    for (let i = 0; i < maxLen; i++) {
      if (i < kr.length) interleaved.push(kr[i]);
      if (i < us.length) interleaved.push(us[i]);
    }

    console.log(`✅ 뉴스 로드: ${interleaved.length}개`);
    return interleaved.length > 0 ? interleaved : DUMMY_NEWS;

  } catch (e) {
    console.error('뉴스 오류:', e);
    return DUMMY_NEWS;
  }
}

// ── 뉴스 클릭 핸들러 (WebView로 열기) ──────────
export function handleNewsPress(news: NewsItem, navigation: any): void {
  if (!news.url) {
    Alert.alert(news.title, news.description || '내용 없음', [{ text: '확인' }]);
    return;
  }
  navigation.navigate('WebView', {
    url: news.url,
    title: news.title,
  });
}

// ── 시간 포맷 ──────────────────────────────────
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
