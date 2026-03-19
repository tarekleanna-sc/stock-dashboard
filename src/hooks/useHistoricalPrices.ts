'use client';

import { useQuery } from '@tanstack/react-query';
import type { HistoricalPrice } from '@/types/market';

async function fetchHistoricalPrices(
  symbol: string,
  from?: string,
  to?: string
): Promise<HistoricalPrice[]> {
  const params = new URLSearchParams({ symbol });
  if (from) params.set('from', from);
  if (to) params.set('to', to);

  const response = await fetch(`/api/stock/historical?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch historical prices');
  }

  return response.json();
}

export function useHistoricalPrices(symbol: string, from?: string, to?: string) {
  return useQuery<HistoricalPrice[], Error>({
    queryKey: ['historicalPrices', symbol, from, to],
    queryFn: () => fetchHistoricalPrices(symbol, from, to),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: !!symbol,
  });
}
