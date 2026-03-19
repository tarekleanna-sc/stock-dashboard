'use client';

import { useQuery } from '@tanstack/react-query';
import type { StockFinancials } from '@/types/market';

async function fetchStockFinancials(symbol: string): Promise<StockFinancials> {
  const response = await fetch(`/api/stock/financials?symbol=${symbol}`);

  if (!response.ok) {
    throw new Error('Failed to fetch stock financials');
  }

  return response.json();
}

export function useStockFinancials(symbol: string) {
  return useQuery<StockFinancials, Error>({
    queryKey: ['stockFinancials', symbol],
    queryFn: () => fetchStockFinancials(symbol),
    staleTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!symbol,
  });
}
