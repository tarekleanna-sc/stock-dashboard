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

async function fetchNews(symbol?: string, from?: string, to?: string): Promise<NewsArticle[]> {
  const params = new URLSearchParams();
  if (symbol) params.set('symbol', symbol);
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`/api/stock/news?${params}`);
  if (!res.ok) throw new Error('Failed to fetch news');
  return res.json();
}

// Single ticker news (last 7 days)
export function useTickerNews(symbol: string | null) {
  return useQuery<NewsArticle[], Error>({
    queryKey: ['news', symbol],
    queryFn: () => fetchNews(symbol ?? ''),
    staleTime: 15 * 60 * 1000, // 15 min
    enabled: !!symbol,
  });
}

// General market news
export function useMarketNews() {
  return useQuery<NewsArticle[], Error>({
    queryKey: ['news', 'general'],
    queryFn: () => fetchNews(),
    staleTime: 15 * 60 * 1000,
  });
}

export function timeAgo(unixSeconds: number): string {
  const diff = Date.now() / 1000 - unixSeconds;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}
