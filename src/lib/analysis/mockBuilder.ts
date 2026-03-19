import {
  MockPortfolioConfig,
  MockPortfolioResult,
  MockAllocation,
  RiskTolerance,
  TimeHorizon,
} from '@/types/analysis';
import {
  CONSERVATIVE_UNIVERSE,
  MODERATE_UNIVERSE,
  AGGRESSIVE_UNIVERSE,
} from '@/lib/utils/constants';

// ── Joseph Carlson–Style Mock Portfolio Builder ──────────────────────────────
// Philosophy: Buy quality businesses at reasonable prices. Focus on
// fundamentally strong companies with proven earnings, healthy balance sheets,
// competitive moats, and ideally a growing dividend. No speculative,
// unprofitable, or meme stocks allowed.

// ── Stock data: sector, quality tier, and rationale ─────────────────────────

interface StockMeta {
  name: string;
  sector: string;
  tier: 'core' | 'growth' | 'income';
  estimatedPrice: number;
  dividendYield: number; // approximate %
  rationale: string;
  conviction?: number; // 1.0 = normal, >1 = overweight (e.g. 1.5 = 50% more weight)
}

const STOCK_DATABASE: Record<string, StockMeta> = {
  // ── Conservative / Income ──────────────────────────────────────────────
  JNJ:  { name: 'Johnson & Johnson',   sector: 'Healthcare',       tier: 'income', estimatedPrice: 155, dividendYield: 3.2, rationale: 'Dividend king with 60+ years of increases, diversified healthcare conglomerate with recession-resistant demand' },
  PG:   { name: 'Procter & Gamble',    sector: 'Consumer Staples', tier: 'income', estimatedPrice: 170, dividendYield: 2.4, rationale: 'Best-in-class consumer brands with pricing power, 65+ years of dividend growth — a Carlson portfolio staple' },
  KO:   { name: 'Coca-Cola',           sector: 'Consumer Staples', tier: 'income', estimatedPrice: 62,  dividendYield: 3.0, rationale: 'Warren Buffett\'s favorite — unmatched global brand, consistent cash flow, 60+ year dividend streak' },
  PEP:  { name: 'PepsiCo',             sector: 'Consumer Staples', tier: 'income', estimatedPrice: 175, dividendYield: 2.7, rationale: 'Diversified snack & beverage powerhouse with Frito-Lay moat and 50+ year dividend growth record' },
  MCD:  { name: 'McDonald\'s',         sector: 'Consumer Discretionary', tier: 'income', estimatedPrice: 295, dividendYield: 2.1, rationale: 'Franchise-heavy model generates enormous FCF, 45+ year dividend streak with global brand dominance' },
  WMT:  { name: 'Walmart',             sector: 'Consumer Staples', tier: 'income', estimatedPrice: 175, dividendYield: 1.3, rationale: 'Retail defensive giant with growing e-commerce and advertising businesses driving margin expansion' },
  ABBV: { name: 'AbbVie',              sector: 'Healthcare',       tier: 'income', estimatedPrice: 175, dividendYield: 3.6, rationale: 'Pharma leader with strong pipeline beyond Humira, excellent capital return with growing dividend' },
  MRK:  { name: 'Merck',               sector: 'Healthcare',       tier: 'income', estimatedPrice: 130, dividendYield: 2.5, rationale: 'Keytruda franchise drives growth while pipeline fills future revenue, consistent dividend grower' },
  XOM:  { name: 'Exxon Mobil',         sector: 'Energy',           tier: 'income', estimatedPrice: 115, dividendYield: 3.3, rationale: 'Integrated energy major with industry-leading capital discipline and 40+ year dividend growth' },
  CVX:  { name: 'Chevron',             sector: 'Energy',           tier: 'income', estimatedPrice: 160, dividendYield: 3.8, rationale: 'Strong balance sheet energy leader with disciplined capex and 35+ year dividend increases' },
  NEE:  { name: 'NextEra Energy',      sector: 'Utilities',        tier: 'income', estimatedPrice: 78,  dividendYield: 2.6, rationale: 'World\'s largest generator of wind and solar energy with visible double-digit earnings growth' },
  DUK:  { name: 'Duke Energy',         sector: 'Utilities',        tier: 'income', estimatedPrice: 105, dividendYield: 3.8, rationale: 'Regulated utility with predictable earnings and 4%+ yield — classic defensive income holding' },
  SO:   { name: 'Southern Company',    sector: 'Utilities',        tier: 'income', estimatedPrice: 75,  dividendYield: 3.5, rationale: 'Regulated utility providing stable earnings and income in any economic environment' },
  CL:   { name: 'Colgate-Palmolive',   sector: 'Consumer Staples', tier: 'income', estimatedPrice: 90,  dividendYield: 2.2, rationale: 'Global oral care leader with 60+ year dividend streak and pricing power across categories' },
  MMM:  { name: '3M Company',          sector: 'Industrials',      tier: 'income', estimatedPrice: 105, dividendYield: 2.0, rationale: 'Diversified industrial with restructuring underway, strong IP portfolio and improving margins' },
  ABT:  { name: 'Abbott Laboratories', sector: 'Healthcare',       tier: 'income', estimatedPrice: 115, dividendYield: 1.8, rationale: 'Diversified healthcare leader with growing diagnostics and medical devices businesses' },
  TGT:  { name: 'Target',              sector: 'Consumer Discretionary', tier: 'income', estimatedPrice: 145, dividendYield: 2.8, rationale: 'Retailer with strong private label brands, same-day fulfillment moat, and growing dividend' },
  LOW:  { name: 'Lowe\'s',             sector: 'Consumer Discretionary', tier: 'core', estimatedPrice: 260, dividendYield: 1.7, rationale: 'Home improvement retailer with Pro customer growth and housing market tailwinds' },
  ITW:  { name: 'Illinois Tool Works', sector: 'Industrials',      tier: 'income', estimatedPrice: 260, dividendYield: 2.2, rationale: 'Diversified manufacturer with 80/20 operating model driving best-in-class margins and dividends' },
  PFE:  { name: 'Pfizer',              sector: 'Healthcare',       tier: 'income', estimatedPrice: 28,  dividendYield: 5.8, rationale: 'Major pharma at deep value with pipeline optionality and above-average yield' },

  // ── Moderate / Quality Growth ──────────────────────────────────────────
  AAPL: { name: 'Apple',               sector: 'Technology',       tier: 'core',   estimatedPrice: 250, dividendYield: 0.5, rationale: 'Dominant tech ecosystem with $100B+ services revenue, massive buybacks, and unmatched brand loyalty' },
  MSFT: { name: 'Microsoft',           sector: 'Technology',       tier: 'core',   estimatedPrice: 395, dividendYield: 0.7, rationale: 'Cloud and AI leader with 40%+ operating margins, Azure growth engine, and fortress balance sheet' },
  GOOGL:{ name: 'Alphabet',            sector: 'Technology',       tier: 'core',   estimatedPrice: 180, dividendYield: 0.5, rationale: 'Search monopoly + cloud growth + AI leadership, now returning capital via dividends and buybacks' },
  JPM:  { name: 'JPMorgan Chase',      sector: 'Financials',       tier: 'core',   estimatedPrice: 255, dividendYield: 2.0, rationale: 'Best-run universal bank with diversified revenue, strong capital markets, and growing dividend' },
  UNH:  { name: 'UnitedHealth Group',  sector: 'Healthcare',       tier: 'core',   estimatedPrice: 530, dividendYield: 1.5, rationale: 'Healthcare conglomerate with Optum growth engine delivering 15%+ earnings growth consistently' },
  V:    { name: 'Visa',                sector: 'Financials',       tier: 'core',   estimatedPrice: 310, dividendYield: 0.7, rationale: 'Global payments duopoly with 65%+ net margins and secular cashless transaction tailwinds' },
  MA:   { name: 'Mastercard',          sector: 'Financials',       tier: 'core',   estimatedPrice: 530, dividendYield: 0.6, rationale: 'Premium payments franchise with asset-light model generating 45%+ net margins' },
  HD:   { name: 'Home Depot',          sector: 'Consumer Discretionary', tier: 'core', estimatedPrice: 380, dividendYield: 2.3, rationale: 'Home improvement leader with Pro growth, MRO expansion — a Carlson portfolio favorite' },
  COST: { name: 'Costco',              sector: 'Consumer Staples', tier: 'core',   estimatedPrice: 950, dividendYield: 0.5, rationale: 'Membership-driven retail with 90%+ renewal rates, special dividends, and inflation-resistant model' },
  AVGO: { name: 'Broadcom',            sector: 'Technology',       tier: 'core',   estimatedPrice: 205, dividendYield: 1.2, rationale: 'Semiconductor & infrastructure software leader with AI networking exposure and growing dividend' },
  LLY:  { name: 'Eli Lilly',           sector: 'Healthcare',       tier: 'growth', estimatedPrice: 850, dividendYield: 0.6, rationale: 'GLP-1 franchise leader with Mounjaro/Zepbound driving decades of growth potential' },
  AMZN: { name: 'Amazon',              sector: 'Technology',       tier: 'core',   estimatedPrice: 210, dividendYield: 0.0, conviction: 1.6, rationale: 'AWS cloud dominance + retail scale + $50B advertising business generating massive free cash flow — a Carlson top-conviction holding' },
  BLK:  { name: 'BlackRock',           sector: 'Financials',       tier: 'core',   estimatedPrice: 950, dividendYield: 2.1, rationale: 'World\'s largest asset manager with $10T+ AUM, secular ETF tailwinds, and consistent dividend growth' },
  SPGI: { name: 'S&P Global',          sector: 'Financials',       tier: 'core',   estimatedPrice: 510, dividendYield: 0.7, rationale: 'Data and analytics monopoly — credit ratings duopoly with index and analytics growth engines' },
  ACN:  { name: 'Accenture',           sector: 'Technology',       tier: 'core',   estimatedPrice: 345, dividendYield: 1.5, rationale: 'IT consulting leader benefiting from digital transformation and AI enterprise adoption' },
  TXN:  { name: 'Texas Instruments',   sector: 'Technology',       tier: 'income', estimatedPrice: 195, dividendYield: 2.6, rationale: 'Analog semiconductor leader with fab advantage, capital return focus, and growing dividend' },
  ADBE: { name: 'Adobe',               sector: 'Technology',       tier: 'growth', estimatedPrice: 460, dividendYield: 0.0, rationale: 'Creative and document cloud monopoly with AI-driven product expansion and 35%+ margins' },
  CRM:  { name: 'Salesforce',          sector: 'Technology',       tier: 'growth', estimatedPrice: 310, dividendYield: 0.5, rationale: 'Enterprise CRM leader now focused on profitability with AI (Einstein) driving next growth wave' },

  // ── Aggressive / High-Growth Quality ───────────────────────────────────
  NVDA: { name: 'NVIDIA',              sector: 'Technology',       tier: 'growth', estimatedPrice: 135, dividendYield: 0.0, rationale: 'Dominant AI infrastructure provider with 60%+ net margins — the picks-and-shovels play of the AI era' },
  CRWD: { name: 'CrowdStrike',         sector: 'Technology',       tier: 'growth', estimatedPrice: 370, dividendYield: 0.0, rationale: 'AI-native cybersecurity platform with 75%+ gross margins and expanding product modules' },
  PANW: { name: 'Palo Alto Networks',  sector: 'Technology',       tier: 'growth', estimatedPrice: 190, dividendYield: 0.0, rationale: 'Platform cybersecurity leader with platformization driving durable recurring revenue growth' },
  MELI: { name: 'MercadoLibre',        sector: 'Technology',       tier: 'growth', estimatedPrice: 2100, dividendYield: 0.0, rationale: 'Latin American Amazon + PayPal with massive fintech adoption in underpenetrated markets' },
  NFLX: { name: 'Netflix',             sector: 'Communication',    tier: 'growth', estimatedPrice: 1000, dividendYield: 0.0, rationale: 'Streaming leader now profitable with ad tier growth, pricing power, and expanding margins' },
  META: { name: 'Meta Platforms',      sector: 'Technology',       tier: 'core',   estimatedPrice: 620, dividendYield: 0.3, rationale: '3B+ user social media empire with AI-driven engagement, 35%+ margins, and new dividend program' },
  ISRG: { name: 'Intuitive Surgical',  sector: 'Healthcare',       tier: 'growth', estimatedPrice: 590, dividendYield: 0.0, rationale: 'Robotic surgery monopoly with installed base driving recurring instrument revenue and 70%+ gross margins' },
  LRCX: { name: 'Lam Research',        sector: 'Technology',       tier: 'growth', estimatedPrice: 82,  dividendYield: 0.9, rationale: 'Critical semiconductor equipment maker with AI-driven wafer fab expansion tailwinds' },
  KLAC: { name: 'KLA Corporation',     sector: 'Technology',       tier: 'growth', estimatedPrice: 750, dividendYield: 0.8, rationale: 'Semiconductor process control leader with high margins and growing dividend — quality compounder' },
  ANET: { name: 'Arista Networks',     sector: 'Technology',       tier: 'growth', estimatedPrice: 100, dividendYield: 0.0, rationale: 'Cloud networking leader with AI data center demand driving 40%+ revenue growth' },
  CDNS: { name: 'Cadence Design',      sector: 'Technology',       tier: 'growth', estimatedPrice: 310, dividendYield: 0.0, rationale: 'EDA software duopoly essential for chip design — sticky recurring revenue with AI tailwinds' },
  SNPS: { name: 'Synopsys',            sector: 'Technology',       tier: 'growth', estimatedPrice: 540, dividendYield: 0.0, rationale: 'Other half of EDA duopoly — mission-critical for semiconductor innovation with 30%+ margins' },
  FTNT: { name: 'Fortinet',            sector: 'Technology',       tier: 'growth', estimatedPrice: 105, dividendYield: 0.0, rationale: 'Network security leader with ASIC advantage delivering best-in-class margins in cybersecurity' },
  NOW:  { name: 'ServiceNow',          sector: 'Technology',       tier: 'growth', estimatedPrice: 1020, dividendYield: 0.0, rationale: 'Enterprise workflow automation leader with 25%+ growth, 80%+ gross margins, and AI integration' },
  INTU: { name: 'Intuit',              sector: 'Technology',       tier: 'growth', estimatedPrice: 640, dividendYield: 0.6, rationale: 'TurboTax + QuickBooks ecosystem with AI-powered financial platform and strong SMB moat' },
  MSTR: { name: 'MicroStrategy',       sector: 'Technology',       tier: 'growth', estimatedPrice: 340, dividendYield: 0.0, rationale: 'Bitcoin treasury strategy with enterprise analytics — high-beta digital asset exposure' },
  TTD:  { name: 'The Trade Desk',      sector: 'Technology',       tier: 'growth', estimatedPrice: 110, dividendYield: 0.0, rationale: 'Programmatic advertising leader benefiting from CTV shift with consistent 20%+ growth' },
  ABNB: { name: 'Airbnb',              sector: 'Consumer Discretionary', tier: 'growth', estimatedPrice: 150, dividendYield: 0.0, rationale: 'Asset-light travel platform with network effects, 35%+ FCF margins, and global expansion' },
};

// ── Weighting strategy (Carlson-style conviction weighting) ─────────────────

interface WeightConfig {
  coreWeight: number;
  growthWeight: number;
  incomeWeight: number;
}

function getTierWeights(risk: RiskTolerance): WeightConfig {
  switch (risk) {
    case 'conservative':
      return { coreWeight: 1.0, growthWeight: 0.6, incomeWeight: 1.3 };
    case 'moderate':
      return { coreWeight: 1.2, growthWeight: 1.0, incomeWeight: 0.8 };
    case 'aggressive':
      return { coreWeight: 0.9, growthWeight: 1.3, incomeWeight: 0.6 };
  }
}

function getUniverse(risk: RiskTolerance): string[] {
  switch (risk) {
    case 'conservative':
      return CONSERVATIVE_UNIVERSE;
    case 'moderate':
      return MODERATE_UNIVERSE;
    case 'aggressive':
      return AGGRESSIVE_UNIVERSE;
  }
}

function getPositionCount(horizon: TimeHorizon, risk: RiskTolerance): number {
  const base = risk === 'conservative' ? 12 : risk === 'moderate' ? 10 : 8;
  switch (horizon) {
    case 'short':
      return base;
    case 'medium':
      return base + 3;
    case 'long':
      return base + 5;
  }
}

function getMaxPositionCap(risk: RiskTolerance): number {
  switch (risk) {
    case 'conservative':
      return 10;
    case 'moderate':
      return 12;
    case 'aggressive':
      return 14;
  }
}

function getExpectedReturns(risk: RiskTolerance): { low: number; mid: number; high: number } {
  switch (risk) {
    case 'conservative':
      return { low: 6, mid: 8, high: 11 };
    case 'moderate':
      return { low: 8, mid: 11, high: 15 };
    case 'aggressive':
      return { low: 10, mid: 15, high: 22 };
  }
}

function getExpectedVolatility(risk: RiskTolerance): number {
  switch (risk) {
    case 'conservative':
      return 10;
    case 'moderate':
      return 15;
    case 'aggressive':
      return 22;
  }
}

export function buildMockPortfolio(config: MockPortfolioConfig): MockPortfolioResult {
  const { riskTolerance, timeHorizon, accountSize } = config;

  const universe = getUniverse(riskTolerance);
  const positionCount = Math.min(getPositionCount(timeHorizon, riskTolerance), universe.length);
  const maxCap = getMaxPositionCap(riskTolerance);
  const tierWeights = getTierWeights(riskTolerance);
  const selectedTickers = universe.slice(0, positionCount);

  // Calculate conviction-weighted allocations
  const rawWeights = selectedTickers.map((ticker) => {
    const meta = STOCK_DATABASE[ticker];
    if (!meta) return 1;
    const convictionMultiplier = meta.conviction ?? 1.0;
    let tierWeight: number;
    switch (meta.tier) {
      case 'core':
        tierWeight = tierWeights.coreWeight;
        break;
      case 'growth':
        tierWeight = tierWeights.growthWeight;
        break;
      case 'income':
        tierWeight = tierWeights.incomeWeight;
        break;
    }
    return tierWeight * convictionMultiplier;
  });

  const totalRawWeight = rawWeights.reduce((sum, w) => sum + w, 0);

  // Normalize to percentages
  let weights = rawWeights.map((w) => (w / totalRawWeight) * 100);

  // Cap and redistribute iteratively
  let iterations = 0;
  while (iterations < 5) {
    let excess = 0;
    let uncappedTotal = 0;
    const capped = weights.map((w) => w > maxCap);

    weights.forEach((w, i) => {
      if (capped[i]) {
        excess += w - maxCap;
      } else {
        uncappedTotal += w;
      }
    });

    if (excess <= 0.01) break;

    weights = weights.map((w, i) => {
      if (capped[i]) return maxCap;
      return w + (w / uncappedTotal) * excess;
    });

    iterations++;
  }

  // Build allocations
  const allocations: MockAllocation[] = selectedTickers.map((ticker, i) => {
    const meta = STOCK_DATABASE[ticker];
    const allocationPercent = weights[i];
    const dollarAmount = (allocationPercent / 100) * accountSize;
    const estimatedPrice = meta?.estimatedPrice ?? 100;
    const shares = Math.floor(dollarAmount / estimatedPrice);
    const actualDollarAmount = shares * estimatedPrice;

    const yieldInfo = meta && meta.dividendYield > 0
      ? ` Pays ~${meta.dividendYield.toFixed(1)}% dividend yield.`
      : '';

    return {
      ticker,
      companyName: meta?.name ?? ticker,
      shares,
      dollarAmount: actualDollarAmount,
      allocation: allocationPercent,
      rationale: (meta?.rationale ?? `Quality fundamental pick for ${riskTolerance} portfolio.`) + yieldInfo,
      sector: meta?.sector ?? 'Diversified',
    };
  });

  const totalInvested = allocations.reduce((sum, a) => sum + a.dollarAmount, 0);

  return {
    config: { riskTolerance, timeHorizon, accountSize },
    allocations,
    totalInvested,
    expectedReturn: getExpectedReturns(riskTolerance),
    expectedVolatility: getExpectedVolatility(riskTolerance),
  };
}
