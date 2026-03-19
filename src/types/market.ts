export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  changesPercentage: number;
  change: number;
  dayLow: number;
  dayHigh: number;
  yearHigh: number;
  yearLow: number;
  marketCap: number;
  volume: number;
  avgVolume: number;
  open: number;
  previousClose: number;
  pe: number;
  eps: number;
  exchange: string;
  sharesOutstanding?: number;
}

export interface StockProfile {
  symbol: string;
  companyName: string;
  sector: string;
  industry: string;
  description: string;
  exchange: string;
  marketCap: number;
  beta: number;
  lastDiv: number;
  image: string;
}

export interface HistoricalPrice {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IncomeStatement {
  date: string;
  revenue: number;
  grossProfit: number;
  netIncome: number;
  operatingIncome: number;
  eps: number;
  epsdiluted: number;
}

export interface BalanceSheet {
  date: string;
  totalAssets: number;
  totalLiabilities: number;
  totalStockholdersEquity: number;
  totalDebt: number;
  cashAndCashEquivalents: number;
}

export interface CashFlowStatement {
  date: string;
  operatingCashFlow: number;
  capitalExpenditure: number;
  freeCashFlow: number;
  dividendsPaid: number;
}

export interface KeyMetrics {
  date: string;
  peRatio: number;
  priceToFreeCashFlowsRatio: number;
  returnOnEquity: number;
  debtToEquity: number;
  dividendYield: number;
  netProfitMargin: number;
  revenuePerShare: number;
  freeCashFlowPerShare: number;
  bookValuePerShare: number;
  payoutRatio: number;
}

export interface StockFinancials {
  incomeStatements: IncomeStatement[];
  balanceSheets: BalanceSheet[];
  cashFlowStatements: CashFlowStatement[];
  keyMetrics: KeyMetrics[];
}
