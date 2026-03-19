import { NextRequest, NextResponse } from 'next/server';
import { fetchQuotes } from '@/lib/api/fmpClient';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbolsParam = searchParams.get('symbols');

  if (!symbolsParam) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbols' },
      { status: 400 }
    );
  }

  const symbols = symbolsParam.split(',').map((s) => s.trim()).filter(Boolean);

  if (symbols.length === 0) {
    return NextResponse.json(
      { error: 'No valid symbols provided' },
      { status: 400 }
    );
  }

  const data = await fetchQuotes(symbols);

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
    },
  });
}
