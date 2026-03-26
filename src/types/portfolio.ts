export type BrokerName =
  | 'fidelity'
  | 'schwab'
  | 'robinhood'
  | 'vanguard'
  | 'td_ameritrade'
  | 'etrade'
  | 'interactive_brokers'
  | 'webull'
  | 'merrill'
  | 'other';

export type AccountType =
  | 'brokerage'
  | 'roth_ira'
  | 'traditional_ira'
  | '401k'
  | 'hsa'
  | '529'
  | 'other';

export interface BrokerAccount {
  id: string;
  name: string;
  broker: BrokerName;
  accountType: AccountType;
  cashBalance: number; // cash held in this account (requires DB column: cash_balance numeric DEFAULT 0)
  createdAt: string;
}

export interface Position {
  id: string;
  accountId: string;
  ticker: string;
  shares: number;
  costBasisPerShare: number;
  dateAdded: string;
  notes?: string;
}

export interface PositionWithMarketData extends Position {
  currentPrice: number;
  marketValue: number;
  totalCostBasis: number;
  gainLoss: number;
  gainLossPercent: number;
  dayChange: number;
  dayChangePercent: number;
  sector: string;
  companyName: string;
}

export interface PortfolioSnapshot {
  date: string;
  totalValue: number;
  totalCostBasis: number;
}

export const BROKER_LABELS: Record<BrokerName, string> = {
  fidelity: 'Fidelity',
  schwab: 'Charles Schwab',
  robinhood: 'Robinhood',
  vanguard: 'Vanguard',
  td_ameritrade: 'TD Ameritrade',
  etrade: 'E*TRADE',
  interactive_brokers: 'Interactive Brokers',
  webull: 'Webull',
  merrill: 'Merrill Edge',
  other: 'Other',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  brokerage: 'Brokerage',
  roth_ira: 'Roth IRA',
  traditional_ira: 'Traditional IRA',
  '401k': '401(k)',
  hsa: 'HSA',
  '529': '529 Plan',
  other: 'Other',
};
