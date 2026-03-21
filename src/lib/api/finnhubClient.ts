// Finnhub API client — free tier: 60 calls/minute
// Sign up free at https://finnhub.io to get your API key

const FINNHUB_BASE = 'https://finnhub.io/api/v1';

function getFinnhubKey(): string {
  const key = process.env.FINNHUB_API_KEY;
  if (!key) throw new Error('FINNHUB_API_KEY is not set');
  return key;
}

async function fetchFromFinnhub<T>(path: string): Promise<T> {
  const url = `${FINNHUB_BASE}${path}&token=${getFinnhubKey()}`;
  const res = await fetch(url, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`Finnhub error: ${res.status} ${res.statusText}`);
  return res.json();
}

// ─── Symbol Search ────────────────────────────────────────────────────────────

interface FinnhubSearchResult {
  description: string;   // "APPLE INC"
  displaySymbol: string; // "AAPL"
  symbol: string;        // "AAPL"
  type: string;          // "Common Stock"
}

interface FinnhubSearchResponse {
  count: number;
  result: FinnhubSearchResult[];
}

export async function finnhubSearch(
  query: string,
  limit = 10
): Promise<Array<{ symbol: string; name: string; exchange: string }>> {
  if (!query.trim()) return [];

  const data = await fetchFromFinnhub<FinnhubSearchResponse>(
    `/search?q=${encodeURIComponent(query)}`
  );

  return (data.result ?? [])
    .filter(
      (r) =>
        r.type === 'Common Stock' &&
        // Only US-listed — Finnhub displaySymbol for US stocks has no dot/hyphen
        !r.displaySymbol.includes('.') &&
        !r.displaySymbol.includes('-') &&
        r.displaySymbol.length <= 5
    )
    .slice(0, limit)
    .map((r) => ({
      symbol: r.displaySymbol,
      name: r.description,
      exchange: 'US',
    }));
}

// ─── Quote ────────────────────────────────────────────────────────────────────

interface FinnhubQuote {
  c: number;  // current price
  d: number;  // change
  dp: number; // percent change
  h: number;  // day high
  l: number;  // day low
  o: number;  // open
  pc: number; // previous close
  t: number;  // timestamp
}

export async function finnhubQuote(symbol: string) {
  const data = await fetchFromFinnhub<FinnhubQuote>(`/quote?symbol=${symbol}`);
  if (!data.c || data.c === 0) return null;
  return {
    symbol,
    price: data.c,
    change: data.d,
    changesPercentage: data.dp,
    dayHigh: data.h,
    dayLow: data.l,
    open: data.o,
    previousClose: data.pc,
  };
}

// ─── Company Profile ──────────────────────────────────────────────────────────

interface FinnhubProfile {
  country: string;
  currency: string;
  exchange: string;
  ipo: string;
  marketCapitalization: number;
  name: string;
  phone: string;
  shareOutstanding: number;
  ticker: string;
  weburl: string;
  logo: string;
  finnhubIndustry: string;
}

export async function finnhubProfile(symbol: string) {
  const data = await fetchFromFinnhub<FinnhubProfile>(
    `/stock/profile2?symbol=${symbol}`
  );
  if (!data.ticker) return null;
  return {
    symbol: data.ticker,
    name: data.name,
    exchange: data.exchange,
    industry: data.finnhubIndustry,
    marketCap: data.marketCapitalization * 1_000_000,
    sharesOutstanding: data.shareOutstanding * 1_000_000,
    logo: data.logo,
  };
}
