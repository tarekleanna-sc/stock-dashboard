import { NextRequest, NextResponse } from 'next/server';
import { fetchQuotes } from '@/lib/api/fmpClient';
import { finnhubQuote } from '@/lib/api/finnhubClient';
import type { StockQuote } from '@/types/market';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbols' },
      { status: 400 }
    );
  }

  const symbols = symbolsParam
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'No valid symbols provided' },
      { status: 400 }
    );
  }

  // 1. Try Finnhub (60 req/min free, real-time US quotes)
  try {
    // allSettled so a missing key or single failure doesn't abort the batch
    const settled = await Promise.allSettled(symbols.map(finnhubQuote));
    const finnhubResults = settled.map((r) => (r.status === 'fulfilled' ? r.value : null));
    const hits = finnhubResults.filter(Boolean);

    if (hits.length === symbols.length) {
      // All symbols resolved via Finnhub — return early, saves FMP quota
      return NextResponse.json(hits, {
        headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
      });
    }

    // Partial Finnhub success — fill missing symbols via FMP
    const missingSymbols = symbols.filter(
      (sym) => !hits.find((h) => h?.symbol === sym)
    );

    let fmpFallback: StockQuote[] = [];
    if (missingSymbols.length > 0) {
      try {
        fmpFallback = await fetchQuotes(missingSymbols);
      } catch {
        // FMP also failed — we'll just return what Finnhub gave us
      }
    }

    const merged = [
      ...hits,
      ...fmpFallback,
    ].filter(Boolean);

    return NextResponse.json(merged, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
    });
  } catch {
    // Finnhub unavailable — fall back entirely to FMP
  }

  // 2. FMP fallback
  const data = await fetchQuotes(symbols);
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
  });
}
