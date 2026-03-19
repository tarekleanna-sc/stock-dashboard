import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalPrices } from '@/lib/api/fmpClient';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbol' },
      { status: 400 }
    );
  }

  const from = searchParams.get('from') ?? undefined;
  const to = searchParams.get('to') ?? undefined;

  const data = await fetchHistoricalPrices(symbol, from, to);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=300',
    },
  });
}
