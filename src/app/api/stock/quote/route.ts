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

  let results: StockQuote[] = [];

  // ── 1. Finnhub (only if key is configured) ───────────────────────────────
  const finnhubKey = process.env.FINNHUB_API_KEY;
  if (finnhubKey) {
    try {
      const settled = await Promise.allSettled(symbols.map(finnhubQuote));
      const hits = settled
        .map((r) => (r.status === 'fulfilled' ? r.value : null))
        .filter(Boolean) as StockQuote[];

      if (hits.length === symbols.length) {
        // Full hit — return immediately, saves FMP quota
        return NextResponse.json(hits, {
          headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
        });
      }
      results = hits;
    } catch {
      // Finnhub unavailable — continue to FMP
    }
  }

  // ── 2. FMP stable endpoint for any symbols Finnhub missed (or all, if Finnhub not configured) ──
  // fetchQuotes fetches each symbol individually, so partial failures don't drop the whole batch.
  const resolvedSymbols = new Set(results.map((r) => r.symbol));
  const missing = symbols.filter((s) => !resolvedSymbols.has(s));

  if (missing.length > 0) {
    try {
      const fmpQuotes = await fetchQuotes(missing);
      results = [...results, ...fmpQuotes];
    } catch (err) {
      console.error('[quote/route] FMP stable fetch failed:', err);
    }
  }

  // ── 3. Return whatever we have; client handles empty array gracefully ─────
  return NextResponse.json(results, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' },
  });
}
