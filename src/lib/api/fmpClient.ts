import type {
  StockQuote,
  StockProfile,
  HistoricalPrice,
  IncomeStatement,
  BalanceSheet,
  CashFlowStatement,
  KeyMetrics,
} from '@/types/market';
import { searchLocalStocks } from './localStockDatabase';

const STABLE_BASE_URL = 'https://financialmodelingprep.com/stable';

function getApiKey(): string {
  const key = process.env.FMP_API_KEY;
  if (!key) {
    throw new Error('FMP_API_KEY environment variable is not set');
  }
  return key;
}

// Simple in-memory rate counter
let dailyRequestCount = 0;
let lastResetDate = new Date().toDateString();

function trackRequest(): void {
  const today = new Date().toDateString();
  if (today !== lastResetDate) {
    dailyRequestCount = 0;
    lastResetDate = today;
  }
  dailyRequestCount++;
  if (dailyRequestCount === 200) {
    console.warn('[FMP Client] Daily request count has reached 200. Consider monitoring usage.');
  }
  if (dailyRequestCount > 200) {
    console.warn(`[FMP Client] Daily request count: ${dailyRequestCount} (exceeds 200 warning threshold)`);
  }
}

async function fetchFromStable<T>(endpoint: string): Promise<T> {
  trackRequest();
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${STABLE_BASE_URL}${endpoint}${separator}apikey=${getApiKey()}`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`FMP API error: ${response.status} ${response.statusText}`);
  }

  // FMP sometimes returns plain-text errors with status 200 (e.g. "Premium Query Parameter")
  const text = await response.text();
  if (text.startsWith('Premium') || text.startsWith('Limit') || text.startsWith('Special')) {
    throw new Error(`FMP API error: ${text.slice(0, 120)}`);
  }

  const data = JSON.parse(text) as unknown;

  // Also handle JSON-wrapped error messages
  if (
    data &&
    typeof data === 'object' &&
    'Error Message' in (data as object) &&
    typeof (data as Record<string, unknown>)['Error Message'] === 'string'
  ) {
    throw new Error(`FMP API error: ${(data as Record<string, unknown>)['Error Message']}`);
  }

  return data as T;
}

// ─── Symbol normalization ─────────────────────────────────────────────────────
// FMP free tier blocks certain symbol variants — remap to accepted equivalents.
// The quote result's .symbol field is rewritten back to the original so the rest
// of the app sees the symbol the user actually holds (e.g. GOOG, not GOOGL).
const FMP_SYMBOL_MAP: Record<string, string> = {
  GOOG:    'GOOGL',   // Alphabet class C → class A (same underlying company)
  'BRK.B': 'BRK-B',
  'BRK.A': 'BRK-A',
};
function normalizeFmpSymbol(s: string): string {
  return FMP_SYMBOL_MAP[s.toUpperCase()] ?? s.toUpperCase();
}

// ─── Quotes ───────────────────────────────────────────────────────────────────

interface StableQuote {
  symbol: string;
  name: string;
  price: number;
  changePercentage: number;
  change: number;
  volume: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  exchange: string;
  open: number;
  previousClose: number;
}

function mapStableQuote(sq: StableQuote): StockQuote {
  return {
    symbol: sq.symbol,
    name: sq.name,
    price: sq.price,
    changesPercentage: sq.changePercentage,
    change: sq.change,
    dayLow: sq.dayLow,
    dayHigh: sq.dayHigh,
    yearHigh: sq.yearHigh,
    yearLow: sq.yearLow,
    marketCap: sq.marketCap,
    volume: sq.volume,
    avgVolume: sq.volume,
    open: sq.open,
    previousClose: sq.previousClose,
    pe: 0,
    eps: 0,
    exchange: sq.exchange,
  };
}

export async function fetchQuotes(symbols: string[]): Promise<StockQuote[]> {
  if (symbols.length === 0) return [];

  try {
    const results = await Promise.all(
      symbols.map(async (originalSymbol) => {
        const fmpSymbol = normalizeFmpSymbol(originalSymbol);
        try {
          const data = await fetchFromStable<StableQuote[]>(`/quote?symbol=${fmpSymbol}`);
          if (!data?.[0]) return null;
          const quote = mapStableQuote(data[0]);
          // Restore original symbol so positions keyed on e.g. GOOG still match
          quote.symbol = originalSymbol.toUpperCase();
          return quote;
        } catch {
          console.error(`[FMP Client] Quote unavailable for ${originalSymbol}`);
          return null;
        }
      })
    );
    return results.filter((q): q is StockQuote => q !== null);
  } catch (error) {
    console.error('[FMP Client] Error fetching quotes:', error);
    return [];
  }
}

// ─── Profile ──────────────────────────────────────────────────────────────────

interface StableProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  exchange: string;
  exchangeShortName: string;
  marketCap: number;
  beta: number;
  lastDividend: number;
  image: string;
  currency: string;
}

function mapStableProfile(sp: StableProfile): StockProfile {
  return {
    symbol: sp.symbol,
    companyName: sp.companyName,
    sector: sp.sector ?? 'Unknown',
    industry: sp.industry ?? 'Unknown',
    description: sp.description ?? '',
    exchange: sp.exchange ?? sp.exchangeShortName ?? '',
    marketCap: sp.marketCap ?? 0,
    beta: sp.beta ?? 0,
    lastDiv: sp.lastDividend ?? 0,
    image: sp.image ?? '',
  };
}

export async function fetchProfile(symbol: string): Promise<StockProfile | null> {
  try {
    const data = await fetchFromStable<StableProfile[]>(`/profile?symbol=${symbol}`);
    return data?.[0] ? mapStableProfile(data[0]) : null;
  } catch (error) {
    console.error('[FMP Client] Error fetching profile:', error);
    return null;
  }
}

// ─── Historical Prices ───────────────────────────────────────────────────────

interface StableHistoricalPrice {
  symbol: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export async function fetchHistoricalPrices(
  symbol: string,
  from?: string,
  to?: string
): Promise<HistoricalPrice[]> {
  try {
    let endpoint = `/historical-price-eod/full?symbol=${symbol}`;
    if (from) endpoint += `&from=${from}`;
    if (to) endpoint += `&to=${to}`;

    const data = await fetchFromStable<StableHistoricalPrice[]>(endpoint);
    return (data ?? []).map((d) => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume,
    }));
  } catch (error) {
    console.error('[FMP Client] Error fetching historical prices:', error);
    return [];
  }
}

// ─── Financial Statements ────────────────────────────────────────────────────

export async function fetchIncomeStatements(
  symbol: string,
  limit: number = 5
): Promise<IncomeStatement[]> {
  try {
    const data = await fetchFromStable<IncomeStatement[]>(
      `/income-statement?symbol=${symbol}&limit=${limit}`
    );
    return data ?? [];
  } catch (error) {
    console.error('[FMP Client] Error fetching income statements:', error);
    return [];
  }
}

export async function fetchBalanceSheets(
  symbol: string,
  limit: number = 5
): Promise<BalanceSheet[]> {
  try {
    const data = await fetchFromStable<BalanceSheet[]>(
      `/balance-sheet-statement?symbol=${symbol}&limit=${limit}`
    );
    return data ?? [];
  } catch (error) {
    console.error('[FMP Client] Error fetching balance sheets:', error);
    return [];
  }
}

export async function fetchCashFlowStatements(
  symbol: string,
  limit: number = 5
): Promise<CashFlowStatement[]> {
  try {
    const data = await fetchFromStable<CashFlowStatement[]>(
      `/cash-flow-statement?symbol=${symbol}&limit=${limit}`
    );
    return data ?? [];
  } catch (error) {
    console.error('[FMP Client] Error fetching cash flow statements:', error);
    return [];
  }
}

// ─── Key Metrics (combined from key-metrics + ratios) ────────────────────────

interface StableKeyMetric {
  date: string;
  returnOnEquity: number;
  [key: string]: unknown;
}

interface StableRatio {
  date: string;
  priceToEarningsRatio: number;
  priceToFreeCashFlowRatio: number;
  debtToEquityRatio: number;
  dividendYield: number;
  netProfitMargin: number;
  revenuePerShare: number;
  freeCashFlowPerShare: number;
  bookValuePerShare: number;
  dividendPayoutRatio: number;
  [key: string]: unknown;
}

export async function fetchKeyMetrics(
  symbol: string,
  limit: number = 5
): Promise<KeyMetrics[]> {
  try {
    const [metrics, ratios] = await Promise.all([
      fetchFromStable<StableKeyMetric[]>(`/key-metrics?symbol=${symbol}&limit=${limit}`),
      fetchFromStable<StableRatio[]>(`/ratios?symbol=${symbol}&limit=${limit}`),
    ]);

    const ratioMap = new Map<string, StableRatio>();
    for (const r of ratios ?? []) {
      ratioMap.set(r.date, r);
    }

    return (metrics ?? []).map((m) => {
      const r = ratioMap.get(m.date);
      return {
        date: m.date,
        peRatio: r?.priceToEarningsRatio ?? 0,
        priceToFreeCashFlowsRatio: r?.priceToFreeCashFlowRatio ?? 0,
        returnOnEquity: m.returnOnEquity ?? 0,
        debtToEquity: r?.debtToEquityRatio ?? 0,
        dividendYield: r?.dividendYield ?? 0,
        netProfitMargin: r?.netProfitMargin ?? 0,
        revenuePerShare: r?.revenuePerShare ?? 0,
        freeCashFlowPerShare: r?.freeCashFlowPerShare ?? 0,
        bookValuePerShare: r?.bookValuePerShare ?? 0,
        payoutRatio: r?.dividendPayoutRatio ?? 0,
      };
    });
  } catch (error) {
    console.error('[FMP Client] Error fetching key metrics:', error);
    return [];
  }
}

// ─── Search ──────────────────────────────────────────────────────────────────

export interface SearchResult {
  symbol: string;
  name: string;
  currency: string;
  exchange: string;
  exchangeFullName: string;
}

export async function fetchSearchResults(
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  try {
    // Search by company name with US exchange filter
    const nameResults = await fetchFromStable<SearchResult[]>(
      `/search-name?query=${encodeURIComponent(query)}&limit=${limit}&exchange=NYSE,NASDAQ,AMEX`
    );

    // Also try a direct profile lookup if query looks like a ticker (all caps, short)
    const trimmed = query.trim().toUpperCase();
    if (/^[A-Z]{1,5}$/.test(trimmed)) {
      try {
        const profileData = await fetchFromStable<StableProfile[]>(
          `/profile?symbol=${trimmed}`
        );
        const profile = profileData?.[0];
        if (profile) {
          const alreadyIncluded = (nameResults ?? []).some(
            (r) => r.symbol === profile.symbol
          );
          if (!alreadyIncluded) {
            return [
              {
                symbol: profile.symbol,
                name: profile.companyName,
                currency: profile.currency ?? 'USD',
                exchange: profile.exchangeShortName ?? profile.exchange ?? '',
                exchangeFullName: profile.exchange ?? '',
              },
              ...(nameResults ?? []),
            ].slice(0, limit);
          }
        }
      } catch {
        // Profile lookup failed, just return name results
      }
    }

    return nameResults ?? [];
  } catch (error) {
    console.error('[FMP Client] Error fetching search results:', error);
    // Fallback to local stock database
    console.log('[FMP Client] Using local stock database fallback');
    const localResults = searchLocalStocks(query, limit);
    return localResults.map((stock) => ({
      symbol: stock.symbol,
      name: stock.name,
      currency: 'USD',
      exchange: stock.exchange,
      exchangeFullName: stock.exchange,
    }));
  }
}

// ─── Dividends ────────────────────────────────────────────────────────────────

export interface DividendRecord {
  symbol: string;
  date: string;          // ex-dividend date
  recordDate: string;
  paymentDate: string;
  declarationDate: string;
  adjDividend: number;   // adjusted per-share dividend
  dividend: number;      // raw per-share dividend
  label?: string;
}

export async function fetchDividends(
  symbol: string,
  limit: number = 10
): Promise<DividendRecord[]> {
  try {
    const data = await fetchFromStable<DividendRecord[]>(
      `/dividends?symbol=${normalizeFmpSymbol(symbol)}&limit=${limit}`
    );
    return (data ?? []).map((d) => ({ ...d, symbol: symbol.toUpperCase() }));
  } catch (error) {
    console.error(`[FMP Client] Error fetching dividends for ${symbol}:`, error);
    return [];
  }
}

// ─── Dividend Calendar (upcoming ex-dates) ───────────────────────────────────

export interface UpcomingDividend {
  symbol: string;
  exDividendDate: string;
  dividendAmount: number;
  paymentDate: string;
  recordDate: string;
  declarationDate: string;
}

export async function fetchDividendCalendar(
  from: string,
  to: string
): Promise<UpcomingDividend[]> {
  try {
    const data = await fetchFromStable<UpcomingDividend[]>(
      `/dividends-calendar?from=${from}&to=${to}`
    );
    return data ?? [];
  } catch (error) {
    console.error('[FMP Client] Error fetching dividend calendar:', error);
    return [];
  }
}
