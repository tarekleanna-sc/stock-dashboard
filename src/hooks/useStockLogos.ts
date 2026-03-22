'use client';

import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';

async function fetchLogo(ticker: string): Promise<{ ticker: string; logo: string }> {
  const res = await fetch(`/api/stock/profile?symbol=${ticker}`);
  if (!res.ok) return { ticker, logo: '' };
  const data = await res.json();
  return { ticker, logo: data.image ?? '' };
}

export function useStockLogos(tickers: string[]): Record<string, string> {
  const tickersKey = tickers.join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const uniqueTickers = useMemo(() => Array.from(new Set(tickers)), [tickersKey]);

  const results = useQueries({
    queries: uniqueTickers.map((ticker) => ({
      queryKey: ['stockLogo', ticker],
      queryFn: () => fetchLogo(ticker),
      staleTime: 24 * 60 * 60 * 1000, // 24 hours — logos rarely change
      enabled: !!ticker,
    })),
  });

  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const result of results) {
      if (result.data) {
        map[result.data.ticker] = result.data.logo;
      }
    }
    return map;
  }, [results]);
}
