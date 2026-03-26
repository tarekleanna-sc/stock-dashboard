'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchHistoricalPrices } from '@/lib/api/fmpClient';

export type BenchmarkSymbol = 'SPY' | 'QQQ' | 'DIA' | 'IWM';

export const BENCHMARK_LABELS: Record<BenchmarkSymbol, string> = {
  SPY: 'S&P 500',
  QQQ: 'NASDAQ 100',
  DIA: 'Dow Jones',
  IWM: 'Russell 2000',
};

export interface BenchmarkDataPoint {
  date: string;
  returnPct: number; // % return from start date (0 = no change)
}

export function useBenchmarkComparison(
  symbol: BenchmarkSymbol | null,
  fromDate: string | null,
  toDate?: string | null
) {
  return useQuery({
    queryKey: ['benchmark', symbol, fromDate, toDate],
    queryFn: async (): Promise<BenchmarkDataPoint[]> => {
      if (!symbol || !fromDate) return [];

      const prices = await fetchHistoricalPrices(
        symbol,
        fromDate,
        toDate ?? undefined
      );

      if (!prices || prices.length === 0) return [];

      // Sort ascending by date
      const sorted = [...prices].sort((a, b) => a.date.localeCompare(b.date));
      const basePrice = sorted[0].close;
      if (!basePrice) return [];

      return sorted.map((p) => ({
        date: p.date,
        returnPct: parseFloat((((p.close - basePrice) / basePrice) * 100).toFixed(2)),
      }));
    },
    enabled: !!symbol && !!fromDate,
    staleTime: 1000 * 60 * 60, // 1 hour — benchmark data doesn't need frequent refresh
    gcTime: 1000 * 60 * 60 * 4,
  });
}
