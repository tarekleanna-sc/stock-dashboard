'use client';

import { useQuery } from '@tanstack/react-query';

export interface NewsArticle {
  id: number;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // Unix timestamp (seconds)
  category: string;
  related: string;
}

async function fetchNews(symbol?: string, limit?: number): Promise<NewsArticle[]> {
  const params = new URLSearchParams();
  if (symbol) params.set('symbol', symbol);
  if (limit) params.set('limit', String(limit));
  const res = await fetch(`/api/stock/news?${params}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

/** News for a specific ticker */
export function useTickerNews(symbol: string | null, limit = 20) {
  return useQuery<NewsArticle[], Error>({
    queryKey: ['news', symbol, limit],
    queryFn: () => fetchNews(symbol ?? '', limit),
    staleTime: 15 * 60 * 1000,
    enabled: !!symbol,
  });
}

/** News for multiple tickers (comma-separated) */
export function useMultiTickerNews(symbols: string[], limit = 50) {
  const joined = symbols.sort().join(',');
  return useQuery<NewsArticle[], Error>({
    queryKey: ['news', 'multi', joined, limit],
    queryFn: () => fetchNews(joined, limit),
    staleTime: 15 * 60 * 1000,
    enabled: symbols.length > 0,
  });
}

/** General market news */
export function useMarketNews(limit = 30) {
  return useQuery<NewsArticle[], Error>({
    queryKey: ['news', 'general', limit],
    queryFn: () => fetchNews(undefined, limit),
    staleTime: 15 * 60 * 1000,
  });
}

export function timeAgo(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}
