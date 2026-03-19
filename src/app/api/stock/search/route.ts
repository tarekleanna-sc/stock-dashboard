import { NextRequest, NextResponse } from 'next/server';
import { fetchSearchResults } from '@/lib/api/fmpClient';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  const limit = request.nextUrl.searchParams.get('limit');

  if (!query || query.trim().length === 0) {
    return NextResponse.json([]);
  }

  try {
    const results = await fetchSearchResults(query, limit ? parseInt(limit) : 10);
    return NextResponse.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json({ error: 'Failed to search stocks' }, { status: 500 });
  }
}
