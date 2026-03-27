import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

interface FinnhubEarningsItem {
  date: string;          // "2024-01-25"
  epsActual: number | null;
  epsEstimate: number | null;
  hour: 'bmo' | 'amc' | 'dmh'; // before market open, after market close, during market hours
  quarter: number;
  revenueActual: number | null;
  revenueEstimate: number | null;
  symbol: string;
  year: number;
}

interface FinnhubEarningsResponse {
  earningsCalendar: FinnhubEarningsItem[];
}

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

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbolsParam = searchParams.get('symbols');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  // Default window: today to 60 days out
  const now = new Date();
  const from = fromParam ?? now.toISOString().split('T')[0];
  const future = new Date(now);
  future.setDate(future.getDate() + 60);
  const to = toParam ?? future.toISOString().split('T')[0];

  try {
    if (symbolsParam) {
      // Fetch per-symbol earnings calendar for specific tickers
      const symbols = symbolsParam.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

      const settled = await Promise.allSettled(
        symbols.map(async (symbol): Promise<EarningsEvent[]> => {
          const url = `${FINNHUB_BASE}/calendar/earnings?from=${from}&to=${to}&symbol=${symbol}&token=${apiKey}`;
          const res = await fetch(url, { next: { revalidate: 3600 } });
          if (!res.ok) return [];
          const data: FinnhubEarningsResponse = await res.json();
          return (data.earningsCalendar ?? []).map((item) => ({
            symbol: item.symbol,
            date: item.date,
            hour: item.hour,
            epsEstimate: item.epsEstimate ?? null,
            epsActual: item.epsActual ?? null,
            revenueEstimate: item.revenueEstimate ?? null,
            revenueActual: item.revenueActual ?? null,
            quarter: item.quarter,
            year: item.year,
          }));
        })
      );

      const events: EarningsEvent[] = settled
        .filter((r): r is PromiseFulfilledResult<EarningsEvent[]> => r.status === 'fulfilled')
        .flatMap((r) => r.value)
        .sort((a, b) => a.date.localeCompare(b.date));

      return NextResponse.json(events, {
        headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
      });
    }

    // No symbols param — return broad upcoming earnings (useful for general calendar)
    const url = `${FINNHUB_BASE}/calendar/earnings?from=${from}&to=${to}&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Finnhub error: ${res.status}` }, { status: res.status });
    }
    const data: FinnhubEarningsResponse = await res.json();
    const events: EarningsEvent[] = (data.earningsCalendar ?? [])
      .map((item) => ({
        symbol: item.symbol,
        date: item.date,
        hour: item.hour,
        epsEstimate: item.epsEstimate ?? null,
        epsActual: item.epsActual ?? null,
        revenueEstimate: item.revenueEstimate ?? null,
        revenueActual: item.revenueActual ?? null,
        quarter: item.quarter,
        year: item.year,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(events, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600' },
    });
  } catch (err) {
    console.error('[earnings route]', err);
    return NextResponse.json({ error: 'Failed to fetch earnings calendar' }, { status: 500 });
  }
}
