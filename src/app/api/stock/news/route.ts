import { NextRequest, NextResponse } from 'next/server';

/**
 * Stock news API route — uses FMP (Financial Modeling Prep) stable endpoint.
 * Supports both ticker-specific and general market news.
 */

export interface FMPNewsArticle {
  title: string;
  text: string;
  url: string;
  image: string;
  publishedDate: string;  // ISO datetime string
  site: string;
  symbol: string;
}

export interface NewsArticle {
  id: number;
  symbol: string;
  headline: string;
  summary: string;
  source: string;
  url: string;
  image: string;
  datetime: number; // Unix timestamp (seconds)
  category: string;
  related: string;
}

function fmpToNews(article: FMPNewsArticle, idx: number, fallbackSymbol?: string): NewsArticle {
  return {
    id: idx,
    symbol: (article.symbol || fallbackSymbol || '').toUpperCase(),
    headline: article.title || '',
    summary: article.text || '',
    source: article.site || '',
    url: article.url || '',
    image: article.image || '',
    datetime: article.publishedDate
      ? Math.floor(new Date(article.publishedDate).getTime() / 1000)
      : Math.floor(Date.now() / 1000),
    category: '',
    related: article.symbol || fallbackSymbol || '',
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol');
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 50) : 20;

  const apiKey = process.env.FMP_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'FMP_API_KEY not configured' }, { status: 500 });
  }

  try {
    let articles: NewsArticle[] = [];

    if (symbol) {
      // Fetch news for a specific ticker (or comma-separated list)
      const symbols = symbol.split(',').map((s) => s.trim().toUpperCase()).join(',');
      const url = `https://financialmodelingprep.com/stable/news/stock-news?tickers=${encodeURIComponent(symbols)}&limit=${limit}&apikey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 900 } });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[news route] FMP error:', res.status, text);
        return NextResponse.json(
          { error: `FMP error: ${res.status}` },
          { status: res.status },
        );
      }

      const data: FMPNewsArticle[] = await res.json();
      articles = (Array.isArray(data) ? data : [])
        .filter((a) => a.title && a.url)
        .map((a, i) => fmpToNews(a, i, symbol));
    } else {
      // General market news (no ticker filter)
      const url = `https://financialmodelingprep.com/stable/news/stock-news?limit=${Math.min(limit, 30)}&apikey=${apiKey}`;
      const res = await fetch(url, { next: { revalidate: 900 } });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        console.error('[news route] FMP error:', res.status, text);
        return NextResponse.json(
          { error: `FMP error: ${res.status}` },
          { status: res.status },
        );
      }

      const data: FMPNewsArticle[] = await res.json();
      articles = (Array.isArray(data) ? data : [])
        .filter((a) => a.title && a.url)
        .map((a, i) => fmpToNews(a, i));
    }

    return NextResponse.json(articles, {
      headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=300' },
    });
  } catch (err) {
    console.error('[news route]', err);
    return NextResponse.json({ error: 'Failed to fetch news' }, { status: 500 });
  }
}
