import { NextRequest, NextResponse } from 'next/server';
import { finnhubSearch } from '@/lib/api/finnhubClient';
import { searchLocalStocks } from '@/lib/api/localStockDatabase';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = parseInt(request.nextUrl.searchParams.get('limit') ?? '10', 10);

  if (!query || query.trim().length === 0) {
    return NextResponse.json([]);
  }

  // 1. Try Finnhub first (60 req/min free)
  try {
    const results = await finnhubSearch(query, limit);
    if (results.length > 0) {
      return NextResponse.json(results, {
        headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60' },
      });
    }
  } catch (err) {
    // Key not set or rate limited — fall through to local DB
    const msg = err instanceof Error ? err.message : String(err);
    if (!msg.includes('FINNHUB_API_KEY is not set')) {
      console.warn('[Search] Finnhub error, falling back to local DB:', msg);
    }
  }

  // 2. Local stock database fallback (always works, no API needed)
  const local = searchLocalStocks(query, limit);
  return NextResponse.json(
    local.map((s) => ({ symbol: s.symbol, name: s.name, exchange: s.exchange })),
    { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30' } }
  );
}
