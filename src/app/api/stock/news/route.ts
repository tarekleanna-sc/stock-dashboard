import { NextRequest, NextResponse } from 'next/server';

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

export interface NewsArticle {
  id: number;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // Unix timestamp
  category: string;
  related: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol');
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');

  const apiKey = process.env.FINNHUB_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FINNHUB_API_KEY not configured' }, { status: 500 });
  }

  // Date range defaults: last 7 days
  const toDate = toParam ?? new Date().toISOString().split('T')[0];
  const fromDate = fromParam ?? (() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  })();

  try {
    if (symbol) {
      // Company-specific news
      const url = `${FINNHUB_BASE}/company-news?symbol=${encodeURIComponent(symbol)}&from=${fromDate}&to=${toDate}&token=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 900 } }); // 15 min cache
      if (!res.ok) {
        return NextResponse.json({ error: `Finnhub error: ${res.status}` }, { status: res.status });
      }
      const articles: NewsArticle[] = await res.json();
      // Return max 20 articles, filter out empty headlines
      const filtered = (Array.isArray(articles) ? articles : [])
        .filter((a) => a.headline && a.url)
        .slice(0, 20)
        .map((a) => ({ ...a, symbol: symbol.toUpperCase() }));
      return NextResponse.json(filtered, {
        headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
      });
    }

    // General market news (no symbol)
    const url = `${FINNHUB_BASE}/news?category=general&token=${apiKey}`;
    const res = await fetch(url, { next: { revalidate: 900 } });
    if (!res.ok) {
      return NextResponse.json({ error: `Finnhub error: ${res.status}` }, { status: res.status });
    }
    const articles: NewsArticle[] = await res.json();
    const filtered = (Array.isArray(articles) ? articles : [])
      .filter((a) => a.headline && a.url)
      .slice(0, 30);
    return NextResponse.json(filtered, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[news route]', err);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
