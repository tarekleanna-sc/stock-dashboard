export const CHART_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#10b981', // emerald
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
  '#a855f7', // purple
  '#22d3ee', // light cyan
  '#84cc16', // lime
];

export const POSITIVE_COLOR = '#10b981';
export const NEGATIVE_COLOR = '#f43f5e';
export const NEUTRAL_COLOR = '#94a3b8';

// ── Joseph Carlson-Style Stock Universes ──────────────────────────────────────
// Only fundamentally strong companies: profitable, quality balance sheets,
// proven business models, dividend payers or strong earnings reinvestors.
// No speculative, unprofitable, or meme stocks.

export const CONSERVATIVE_UNIVERSE = [
  // Dividend aristocrats & blue-chip income: strong moats, proven dividends
  'AMZN', 'JNJ', 'PG', 'KO', 'PEP', 'MCD', 'WMT', 'ABBV', 'MRK', 'PFE',
  'XOM', 'CVX', 'NEE', 'DUK', 'SO', 'CL', 'MMM', 'ABT', 'TGT', 'LOW',
  'ITW',
];

export const MODERATE_UNIVERSE = [
  // Quality growth at reasonable price: strong fundamentals + growth
  'AMZN', 'AAPL', 'MSFT', 'GOOGL', 'JPM', 'UNH', 'V', 'MA', 'HD', 'COST',
  'AVGO', 'LLY', 'PG', 'JNJ', 'BLK', 'SPGI', 'ACN', 'TXN',
  'ADBE', 'CRM',
];

export const AGGRESSIVE_UNIVERSE = [
  // High-growth but fundamentally sound: profitable with strong margins
  'AMZN', 'NVDA', 'AVGO', 'CRWD', 'PANW', 'MELI', 'NFLX', 'META', 'ADBE',
  'ISRG', 'LRCX', 'KLAC', 'ANET', 'CDNS', 'SNPS', 'FTNT', 'NOW',
  'INTU', 'MSTR', 'TTD', 'ABNB',
];

export const DEFAULT_WATCHLIST = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'META', 'JPM', 'V', 'UNH',
  'HD', 'COST', 'AVGO', 'LLY', 'PG', 'JNJ', 'KO', 'PEP', 'MCD', 'CRM',
  'BLK',
];
