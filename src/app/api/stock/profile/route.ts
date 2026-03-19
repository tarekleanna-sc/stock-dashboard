import { NextRequest, NextResponse } from 'next/server';
import { fetchProfile } from '@/lib/api/fmpClient';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbol' },
      { status: 400 }
    );
  }

  const data = await fetchProfile(symbol);

  if (!data) {
    return NextResponse.json(
      { error: `Profile not found for symbol: ${symbol}` },
      { status: 404 }
    );
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
