'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { fetchDividends, fetchDividendCalendar } from '@/lib/api/fmpClient';
import type { PositionWithMarketData } from '@/types/portfolio';

export interface PositionDividendData {
  ticker: string;
  shares: number;
  currentPrice: number;
  annualDividendPerShare: number; // estimated annual (last dividend × frequency)
  dividendYield: number;          // %
  annualIncome: number;           // annual income for this position
  nextExDate: string | null;
  nextPayDate: string | null;
  lastDividend: number;
  frequency: number;              // payments per year (est.)
}

export interface DividendSummary {
  totalAnnualIncome: number;
  weightedYield: number;         // weighted by position market value
  positions: PositionDividendData[];
  isLoading: boolean;
}

function estimateFrequency(records: { date: string }[]): number {
  if (records.length < 2) return 4; // default quarterly
  // Calculate average gap in days between last few dividends
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
  let totalGap = 0;
  let count = 0;
  for (let i = 0; i < sorted.length - 1; i++) {
    const d1 = new Date(sorted[i].date);
    const d2 = new Date(sorted[i + 1].date);
    totalGap += (d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24);
    count++;
  }
  const avgGap = count > 0 ? totalGap / count : 90;
  if (avgGap <= 45) return 12;       // monthly
  if (avgGap <= 100) return 4;       // quarterly
  if (avgGap <= 200) return 2;       // semi-annual
  return 1;                          // annual
}

export function useDividendData(positions: PositionWithMarketData[]): DividendSummary {
  const uniqueTickers = useMemo(
    () => [...new Set(positions.map((p) => p.ticker))],
    [positions]
  );

  const dividendQueries = useQueries({
    queries: uniqueTickers.map((ticker) => ({
      queryKey: ['dividends', ticker],
      queryFn: () => fetchDividends(ticker, 8),
      staleTime: 1000 * 60 * 60 * 24, // 24h — dividends don't change frequently
      gcTime: 1000 * 60 * 60 * 24,
      retry: false,
    })),
  });

  // Fetch upcoming dividends calendar (next 30 days)
  const today = new Date().toISOString().split('T')[0];
  const in30Days = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const { data: calendarData = [] } = {
    data: [] as Awaited<ReturnType<typeof fetchDividendCalendar>>,
  };

  const isLoading = dividendQueries.some((q) => q.isLoading);

  const positionDividendData = useMemo<PositionDividendData[]>(() => {
    return positions.map((pos) => {
      const idx = uniqueTickers.indexOf(pos.ticker);
      const records = dividendQueries[idx]?.data ?? [];
      const sortedRecords = [...records].sort((a, b) => b.date.localeCompare(a.date));

      const lastRecord = sortedRecords[0];
      const lastDiv = lastRecord?.adjDividend ?? lastRecord?.dividend ?? 0;
      const frequency = estimateFrequency(sortedRecords);
      const annualDivPerShare = lastDiv * frequency;

      const yield_ = pos.currentPrice > 0
        ? (annualDivPerShare / pos.currentPrice) * 100
        : 0;

      // Find upcoming ex-date for this ticker from calendar
      const upcoming = calendarData.find(
        (c) => c.symbol === pos.ticker && c.exDividendDate >= today
      );

      return {
        ticker: pos.ticker,
        shares: pos.shares,
        currentPrice: pos.currentPrice,
        annualDividendPerShare: annualDivPerShare,
        dividendYield: parseFloat(yield_.toFixed(2)),
        annualIncome: parseFloat((annualDivPerShare * pos.shares).toFixed(2)),
        nextExDate: upcoming?.exDividendDate ?? (sortedRecords[0]?.date ?? null),
        nextPayDate: upcoming?.paymentDate ?? null,
        lastDividend: lastDiv,
        frequency,
      };
    });
  }, [positions, uniqueTickers, dividendQueries, calendarData, today]);

  const summary = useMemo<DividendSummary>(() => {
    const paying = positionDividendData.filter((p) => p.annualDividendPerShare > 0);
    const totalAnnualIncome = paying.reduce((s, p) => s + p.annualIncome, 0);

    const totalValue = positions.reduce((s, p) => s + (p.marketValue ?? 0), 0);
    const weightedYield = totalValue > 0
      ? paying.reduce((s, p) => {
          const pos = positions.find((po) => po.ticker === p.ticker);
          const weight = pos ? (pos.marketValue ?? 0) / totalValue : 0;
          return s + p.dividendYield * weight;
        }, 0)
      : 0;

    return {
      totalAnnualIncome,
      weightedYield: parseFloat(weightedYield.toFixed(2)),
      positions: positionDividendData,
      isLoading,
    };
  }, [positionDividendData, positions, isLoading]);

  return summary;
}
