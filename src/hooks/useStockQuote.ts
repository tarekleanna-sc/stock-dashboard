'use client';

import { useQuery } from '@tanstack/react-query';
import type { StockQuote } from '@/types/market';

async function fetchStockQuotes(symbols: string[]): Promise<StockQuote[]> {
  const response = await fetch(`/api/stock/quote?symbols=${symbols.join(',')}`);

  if (!response.ok) {
    throw new Error('Failed to fetch stock quotes');
  }

  return response.json();
}

export function useStockQuotes(symbols: string[]) {
  return useQuery<StockQuote[], Error>({
    queryKey: ['stockQuotes', symbols.sort().join(',')],
    queryFn: () => fetchStockQuotes(symbols),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: symbols.length > 0,
  });
}
