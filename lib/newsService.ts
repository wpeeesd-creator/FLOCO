/**
 * 뉴스 서비스 — 미국/한국 실시간 뉴스
 * - 미국: NewsAPI (EXPO_PUBLIC_NEWS_API_KEY)
 * - 한국: 네이버금융 RSS (via rss2json)
 */

const NEWS_API_KEY = process.env.EXPO_PUBLIC_NEWS_API_KEY;

export interface NewsItem {
  id: string;
  title: string;
  description: string;
  source: string;
  publishedAt: string;
  url: string;
  imageUrl: string | null;
  country: 'US' | 'KR';
}

// ── 미국 주식 뉴스 (NewsAPI) ──────────────────

export async function fetchUSNews(keyword?: string): Promise<NewsItem[]> {
  try {
    const query = keyword ?? 'stock market nasdaq';
    // NewsAPI 키가 없으면 더미 반환
    if (!NEWS_API_KEY) {
      console.log('[News] NewsAPI 키 없음 — 더미 데이터 사용');
      return US_DUMMY_NEWS;
    }

    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.articles || data.articles.length === 0) return US_DUMMY_NEWS;

    return data.articles.map((article: any) => ({
      id: article.url ?? '',
      title: article.title ?? '',
      description: (article.description ?? '').slice(0, 120),
      source: article.source?.name ?? 'Unknown',
      publishedAt: article.publishedAt ?? '',
      url: article.url ?? '',
      imageUrl: article.urlToImage ?? null,
      country: 'US' as const,
    }));
  } catch (error) {
    console.error('미국 뉴스 fetch 오류:', error);
    return US_DUMMY_NEWS;
  }
}

// ── 한국 주식 뉴스 (네이버 RSS) ──────────────

export async function fetchKRNews(): Promise<NewsItem[]> {
  try {
    const rssUrl = 'https://finance.naver.com/news/news_list.naver?mode=LSS2D&section_id=101&section_id2=258';
    const response = await fetch(
      `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`
    );
    const data = await response.json();

    if (!data.items || data.items.length === 0) return KR_DUMMY_NEWS;

    return data.items.slice(0, 15).map((item: any) => ({
      id: item.link ?? '',
      title: (item.title ?? '').replace(/<[^>]*>/g, ''),
      description: (item.description ?? '').replace(/<[^>]*>/g, '').slice(0, 100),
      source: '네이버금융',
      publishedAt: item.pubDate ?? '',
      url: item.link ?? '',
      imageUrl: null,
      country: 'KR' as const,
    }));
  } catch (error) {
    console.error('한국 뉴스 fetch 오류:', error);
    return KR_DUMMY_NEWS;
  }
}

// ── 종목별 뉴스 검색 ──────────────────────────

export async function fetchStockNews(ticker: string, name: string): Promise<NewsItem[]> {
  try {
    const [byTicker, byName] = await Promise.all([
      fetchUSNews(ticker),
      fetchUSNews(name),
    ]);

    // 중복 제거
    const combined = [...byTicker, ...byName];
    const unique = combined.filter((v, i, a) =>
      a.findIndex(t => t.id === v.id) === i
    );

    return unique
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 20);
  } catch (error) {
    console.error('종목 뉴스 fetch 오류:', error);
    return [];
  }
}

// ── 통합 뉴스 (미국 + 한국) ──────────────────

export async function fetchAllNews(): Promise<NewsItem[]> {
  try {
    const [us, kr] = await Promise.all([
      fetchUSNews(),
      fetchKRNews(),
    ]);
    return [...kr, ...us].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  } catch (error) {
    console.error('통합 뉴스 fetch 오류:', error);
    return [...KR_DUMMY_NEWS, ...US_DUMMY_NEWS];
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

// ── 더미 데이터 (API 실패/키 없을 때) ──────

const US_DUMMY_NEWS: NewsItem[] = [
  { id: 'us1', title: 'NVIDIA surges on strong AI chip demand outlook', description: 'NVIDIA shares rose 3% after analysts raised price targets citing growing AI infrastructure spending.', source: 'Reuters', publishedAt: new Date(Date.now() - 3600000).toISOString(), url: '', imageUrl: null, country: 'US' },
  { id: 'us2', title: 'Apple announces new AI features for iPhone', description: 'Apple Intelligence will bring generative AI to every iPhone user starting this fall.', source: 'Bloomberg', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: '', imageUrl: null, country: 'US' },
  { id: 'us3', title: 'Fed holds rates steady, signals potential cuts', description: 'The Federal Reserve kept interest rates unchanged but hinted at possible cuts later this year.', source: 'CNBC', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: '', imageUrl: null, country: 'US' },
  { id: 'us4', title: 'Tesla deliveries beat expectations in Q1', description: 'Tesla delivered more vehicles than expected, easing concerns about slowing demand.', source: 'WSJ', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: '', imageUrl: null, country: 'US' },
  { id: 'us5', title: 'Microsoft and OpenAI deepen partnership', description: 'Microsoft announced expanded cloud infrastructure investment for OpenAI workloads.', source: 'TechCrunch', publishedAt: new Date(Date.now() - 18000000).toISOString(), url: '', imageUrl: null, country: 'US' },
];

const KR_DUMMY_NEWS: NewsItem[] = [
  { id: 'kr1', title: '삼성전자, 반도체 실적 호전 기대감에 외국인 순매수', description: 'HBM 수요 증가로 반도체 부문 실적 개선 전망', source: '네이버금융', publishedAt: new Date(Date.now() - 3600000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr2', title: 'SK하이닉스, HBM 수주 확대로 목표가 상향', description: '글로벌 AI 수요 증가로 고대역폭메모리 주문 급증', source: '네이버금융', publishedAt: new Date(Date.now() - 7200000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr3', title: '코스피, 2,600선 회복 시도…외국인 매수세 유입', description: '미국 증시 강세 영향으로 국내 증시도 상승 출발', source: '네이버금융', publishedAt: new Date(Date.now() - 10800000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr4', title: '카카오, 신사업 추진으로 투자자 관심 집중', description: 'AI 서비스 확대 및 핀테크 사업 강화 계획 발표', source: '네이버금융', publishedAt: new Date(Date.now() - 14400000).toISOString(), url: '', imageUrl: null, country: 'KR' },
  { id: 'kr5', title: '현대차, 전기차 라인업 확대로 글로벌 경쟁력 강화', description: '2025년 신규 전기차 5개 모델 출시 계획', source: '네이버금융', publishedAt: new Date(Date.now() - 18000000).toISOString(), url: '', imageUrl: null, country: 'KR' },
];
