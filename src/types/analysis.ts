export interface ScoreFactor {
  value: number;
  score: number;
  label: string;
}

export interface BuyRecommendation {
  ticker: string;
  companyName: string;
  currentPrice: number;
  intrinsicValue: number;
  discountToIntrinsic: number;
  compositeScore: number;
  factors: {
    peRatio: ScoreFactor;
    revenueGrowth: ScoreFactor;
    profitMargin: ScoreFactor;
    freeCashFlowYield: ScoreFactor;
    dividendYield: ScoreFactor;
    debtToEquity: ScoreFactor;
    roe: ScoreFactor;
  };
  isExistingPosition: boolean;
  rationale: string;
  conviction: 'high' | 'medium' | 'low';
  sector: string;
}

export interface RebalanceSuggestion {
  ticker: string;
  companyName: string;
  currentAllocation: number;
  targetAllocation: number;
  drift: number;
  action: 'buy' | 'trim' | 'hold';
  sharesNeeded: number;
  dollarAmount: number;
  reason: string;
}

export type RiskTolerance = 'conservative' | 'moderate' | 'aggressive';
export type TimeHorizon = 'short' | 'medium' | 'long';

export interface MockPortfolioConfig {
  riskTolerance: RiskTolerance;
  timeHorizon: TimeHorizon;
  accountSize: number;
}

export interface MockAllocation {
  ticker: string;
  companyName: string;
  shares: number;
  dollarAmount: number;
  allocation: number;
  rationale: string;
  sector: string;
}

export interface MockPortfolioResult {
  config: MockPortfolioConfig;
  allocations: MockAllocation[];
  expectedReturn: { low: number; mid: number; high: number };
  expectedVolatility: number;
  totalInvested: number;
}

export const RISK_LABELS: Record<RiskTolerance, string> = {
  conservative: 'Conservative',
  moderate: 'Moderate',
  aggressive: 'Aggressive',
};

export const HORIZON_LABELS: Record<TimeHorizon, string> = {
  short: 'Short-term (< 2 years)',
  medium: 'Medium-term (2-7 years)',
  long: 'Long-term (7+ years)',
};
