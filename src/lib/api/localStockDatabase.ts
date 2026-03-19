// Local stock database for search fallback when FMP API is unavailable
// This includes all stocks from our universes plus common US stocks

interface LocalStock {
  symbol: string;
  name: string;
  exchange: string;
}

export const LOCAL_STOCK_DATABASE: Record<string, LocalStock> = {
  // Tech Giants
  AAPL: { symbol: 'AAPL', name: 'Apple Inc.', exchange: 'NASDAQ' },
  MSFT: { symbol: 'MSFT', name: 'Microsoft Corporation', exchange: 'NASDAQ' },
  GOOGL: { symbol: 'GOOGL', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  GOOG: { symbol: 'GOOG', name: 'Alphabet Inc.', exchange: 'NASDAQ' },
  AMZN: { symbol: 'AMZN', name: 'Amazon.com Inc.', exchange: 'NASDAQ' },
  META: { symbol: 'META', name: 'Meta Platforms Inc.', exchange: 'NASDAQ' },
  NVDA: { symbol: 'NVDA', name: 'NVIDIA Corporation', exchange: 'NASDAQ' },

  // Semiconductors
  AVGO: { symbol: 'AVGO', name: 'Broadcom Inc.', exchange: 'NASDAQ' },
  QCOM: { symbol: 'QCOM', name: 'Qualcomm Inc.', exchange: 'NASDAQ' },
  AMD: { symbol: 'AMD', name: 'Advanced Micro Devices', exchange: 'NASDAQ' },
  TSM: { symbol: 'TSM', name: 'Taiwan Semiconductor', exchange: 'NYSE' },
  LRCX: { symbol: 'LRCX', name: 'Lam Research Corporation', exchange: 'NASDAQ' },
  KLAC: { symbol: 'KLAC', name: 'KLA Corporation', exchange: 'NASDAQ' },
  CDNS: { symbol: 'CDNS', name: 'Cadence Design Systems', exchange: 'NASDAQ' },
  SNPS: { symbol: 'SNPS', name: 'Synopsys Inc.', exchange: 'NASDAQ' },

  // Software & Services
  ADBE: { symbol: 'ADBE', name: 'Adobe Inc.', exchange: 'NASDAQ' },
  CRM: { symbol: 'CRM', name: 'Salesforce Inc.', exchange: 'NYSE' },
  NFLX: { symbol: 'NFLX', name: 'Netflix Inc.', exchange: 'NASDAQ' },
  NOW: { symbol: 'NOW', name: 'ServiceNow Inc.', exchange: 'NYSE' },
  INTU: { symbol: 'INTU', name: 'Intuit Inc.', exchange: 'NASDAQ' },
  ANET: { symbol: 'ANET', name: 'Arista Networks', exchange: 'NYSE' },
  FTNT: { symbol: 'FTNT', name: 'Fortinet Inc.', exchange: 'NASDAQ' },

  // Cybersecurity
  CRWD: { symbol: 'CRWD', name: 'CrowdStrike Holdings', exchange: 'NASDAQ' },
  PANW: { symbol: 'PANW', name: 'Palo Alto Networks', exchange: 'NASDAQ' },

  // Finance & Banking
  JPM: { symbol: 'JPM', name: 'JPMorgan Chase & Co.', exchange: 'NYSE' },
  BLK: { symbol: 'BLK', name: 'BlackRock Inc.', exchange: 'NYSE' },
  GS: { symbol: 'GS', name: 'Goldman Sachs Group', exchange: 'NYSE' },
  MS: { symbol: 'MS', name: 'Morgan Stanley', exchange: 'NYSE' },
  BAC: { symbol: 'BAC', name: 'Bank of America', exchange: 'NYSE' },
  WFC: { symbol: 'WFC', name: 'Wells Fargo', exchange: 'NYSE' },
  C: { symbol: 'C', name: 'Citigroup Inc.', exchange: 'NYSE' },

  // Payment Processors & Financial Tech
  V: { symbol: 'V', name: 'Visa Inc.', exchange: 'NYSE' },
  MA: { symbol: 'MA', name: 'Mastercard Inc.', exchange: 'NYSE' },
  PYPL: { symbol: 'PYPL', name: 'PayPal Holdings', exchange: 'NASDAQ' },
  AXP: { symbol: 'AXP', name: 'American Express', exchange: 'NYSE' },

  // Healthcare & Pharma
  JNJ: { symbol: 'JNJ', name: 'Johnson & Johnson', exchange: 'NYSE' },
  PFE: { symbol: 'PFE', name: 'Pfizer Inc.', exchange: 'NYSE' },
  ABBV: { symbol: 'ABBV', name: 'AbbVie Inc.', exchange: 'NYSE' },
  MRK: { symbol: 'MRK', name: 'Merck & Co.', exchange: 'NYSE' },
  LLY: { symbol: 'LLY', name: 'Eli Lilly and Company', exchange: 'NYSE' },
  UNH: { symbol: 'UNH', name: 'UnitedHealth Group', exchange: 'NYSE' },
  ISRG: { symbol: 'ISRG', name: 'Intuitive Surgical', exchange: 'NASDAQ' },
  ABT: { symbol: 'ABT', name: 'Abbott Laboratories', exchange: 'NYSE' },

  // Consumer Staples
  PG: { symbol: 'PG', name: 'Procter & Gamble', exchange: 'NYSE' },
  KO: { symbol: 'KO', name: 'The Coca-Cola Company', exchange: 'NYSE' },
  PEP: { symbol: 'PEP', name: 'PepsiCo Inc.', exchange: 'NASDAQ' },
  MCD: { symbol: 'MCD', name: "McDonald's Corporation", exchange: 'NYSE' },
  WMT: { symbol: 'WMT', name: 'Walmart Inc.', exchange: 'NYSE' },
  CL: { symbol: 'CL', name: 'Colgate-Palmolive', exchange: 'NYSE' },

  // Retail & E-Commerce
  TGT: { symbol: 'TGT', name: 'Target Corporation', exchange: 'NYSE' },
  COST: { symbol: 'COST', name: 'Costco Wholesale', exchange: 'NASDAQ' },
  MELI: { symbol: 'MELI', name: 'MercadoLibre Inc.', exchange: 'NASDAQ' },
  ABNB: { symbol: 'ABNB', name: 'Airbnb Inc.', exchange: 'NASDAQ' },

  // Industrials
  HD: { symbol: 'HD', name: 'The Home Depot', exchange: 'NYSE' },
  LOW: { symbol: 'LOW', name: 'Lowe\'s Companies', exchange: 'NYSE' },
  MMM: { symbol: 'MMM', name: '3M Company', exchange: 'NYSE' },
  ITW: { symbol: 'ITW', name: 'Illinois Tool Works', exchange: 'NYSE' },
  CAT: { symbol: 'CAT', name: 'Caterpillar Inc.', exchange: 'NYSE' },
  BA: { symbol: 'BA', name: 'The Boeing Company', exchange: 'NYSE' },

  // Energy
  XOM: { symbol: 'XOM', name: 'Exxon Mobil Corporation', exchange: 'NYSE' },
  CVX: { symbol: 'CVX', name: 'Chevron Corporation', exchange: 'NYSE' },
  COP: { symbol: 'COP', name: 'ConocoPhillips', exchange: 'NYSE' },

  // Utilities & Energy
  NEE: { symbol: 'NEE', name: 'NextEra Energy', exchange: 'NYSE' },
  DUK: { symbol: 'DUK', name: 'Duke Energy', exchange: 'NYSE' },
  SO: { symbol: 'SO', name: 'Southern Company', exchange: 'NYSE' },

  // Communications
  SPGI: { symbol: 'SPGI', name: 'S&P Global Inc.', exchange: 'NYSE' },
  TXN: { symbol: 'TXN', name: 'Texas Instruments', exchange: 'NASDAQ' },
  ACN: { symbol: 'ACN', name: 'Accenture plc', exchange: 'NYSE' },

  // Asset Managers
  TTD: { symbol: 'TTD', name: 'The Trade Desk', exchange: 'NASDAQ' },
  MSTR: { symbol: 'MSTR', name: 'MicroStrategy Incorporated', exchange: 'NASDAQ' },
};

export function searchLocalStocks(
  query: string,
  limit: number = 10
): Array<{ symbol: string; name: string; exchange: string }> {
  if (!query.trim()) return [];

  const upperQuery = query.toUpperCase();
  const results: Array<{ symbol: string; name: string; exchange: string }> =
    [];

  // First, exact symbol matches (highest priority)
  if (LOCAL_STOCK_DATABASE[upperQuery]) {
    const stock = LOCAL_STOCK_DATABASE[upperQuery];
    results.push(stock);
  }

  // Then, symbol startswith matches
  for (const [symbol, stock] of Object.entries(LOCAL_STOCK_DATABASE)) {
    if (symbol.startsWith(upperQuery) && symbol !== upperQuery) {
      results.push(stock);
      if (results.length >= limit) return results;
    }
  }

  // Then, name matches
  for (const [, stock] of Object.entries(LOCAL_STOCK_DATABASE)) {
    if (stock.name.toUpperCase().includes(upperQuery)) {
      if (!results.some((r) => r.symbol === stock.symbol)) {
        results.push(stock);
        if (results.length >= limit) return results;
      }
    }
  }

  return results.slice(0, limit);
}
