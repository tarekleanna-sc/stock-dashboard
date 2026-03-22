'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { StockProfile } from '@/types/market';

async function fetchProfile(ticker: string): Promise<StockProfile | null> {
  const res = await fetch(`/api/stock/profile?symbol=${ticker}`);
  if (!res.ok) return null;
  const data = await res.json();
  if (data.error) return null;
  return data as StockProfile;
}

export function useStockProfiles(tickers: string[]): Record<string, StockProfile> {
  const tickersKey = tickers.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uniqueTickers = useMemo(() => Array.from(new Set(tickers)), [tickersKey]);

  const results = useQueries({
    queries: uniqueTickers.map((ticker) => ({
      queryKey: ['stockProfile', ticker],
      queryFn: () => fetchProfile(ticker),
      staleTime: 24 * 60 * 60 * 1000, // 24 hours
      enabled: !!ticker,
    })),
  });

  return useMemo(() => {
    const map: Record<string, StockProfile> = {};
    for (let i = 0; i < uniqueTickers.length; i++) {
      const result = results[i];
      if (result?.data) {
        map[uniqueTickers[i]] = result.data;
      }
    }
    return map;
  }, [results, uniqueTickers]);
}
