import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllNews, fetchStockNews, fetchUSNews, fetchKRNews,
  type NewsItem,
} from '../lib/newsService';

export function useAllNews(limit = 10) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllNews();
      setNews(data.slice(0, limit));
    } catch {
      setNews([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => { load(); }, [load]);

  return { news, loading, refresh: load };
}

export function useStockNews(ticker: string, name: string) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchStockNews(ticker, name);
        if (!cancelled) setNews(data.slice(0, 10));
      } catch {
        if (!cancelled) setNews([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [ticker, name]);

  return { news, loading };
}
