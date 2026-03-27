'use client';

import { useQuery } from '@tanstack/react-query';

export interface EarningsEvent {
  symbol: string;
  date: string;
  hour: 'bmo' | 'amc' | 'dmh';
  epsEstimate: number | null;
  epsActual: number | null;
  revenueEstimate: number | null;
  revenueActual: number | null;
  quarter: number;
  year: number;
}

async function fetchEarnings(symbols: string[], from?: string, to?: string): Promise<EarningsEvent[]> {
  const params = new URLSearchParams();
  if (symbols.length > 0) params.set('symbols', symbols.join(','));
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const res = await fetch(`/api/stock/earnings?${params}`);
  if (!res.ok) throw new Error('Failed to fetch earnings calendar');
  return res.json();
}

export function useEarningsCalendar(symbols: string[], from?: string, to?: string) {
  return useQuery<EarningsEvent[], Error>({
    queryKey: ['earningsCalendar', symbols.sort().join(','), from, to],
    queryFn: () => fetchEarnings(symbols, from, to),
    staleTime: 60 * 60 * 1000, // 1 hour
    enabled: symbols.length > 0,
  });
}

// Helper: group events by date string
export function groupByDate(events: EarningsEvent[]): Record<string, EarningsEvent[]> {
  return events.reduce<Record<string, EarningsEvent[]>>((acc, event) => {
    if (!acc[event.date]) acc[event.date] = [];
    acc[event.date].push(event);
    return acc;
  }, {});
}

// Helper: get earnings within N days
export function getUpcomingEarnings(events: EarningsEvent[], days = 7): EarningsEvent[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cutoff = new Date(today);
  cutoff.setDate(cutoff.getDate() + days);
  return events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= today && d <= cutoff;
  });
}
