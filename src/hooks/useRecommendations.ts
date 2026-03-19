'use client';

import { useQuery } from '@tanstack/react-query';
import type { BuyRecommendation } from '@/types/analysis';

async function fetchRecommendations(
  tickers: string[],
  existingTickers: string[]
): Promise<BuyRecommendation[]> {
  const params = new URLSearchParams();
  params.set('tickers', tickers.join(','));
  if (existingTickers.length > 0) {
    params.set('existing', existingTickers.join(','));
  }

  const response = await fetch(`/api/analysis/recommend?${params.toString()}`);
  if (!response.ok) {
    throw new Error('Failed to fetch recommendations');
  }
  return response.json();
}

export function useRecommendations(
  tickers: string[],
  existingTickers: string[]
) {
  return useQuery<BuyRecommendation[], Error>({
    queryKey: ['recommendations', tickers, existingTickers],
    queryFn: () => fetchRecommendations(tickers, existingTickers),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours
    enabled: tickers.length > 0,
  });
}
