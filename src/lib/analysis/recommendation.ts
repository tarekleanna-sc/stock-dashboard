import type { BuyRecommendation } from '@/types/analysis';
import type {
  StockQuote,
  KeyMetrics,
  IncomeStatement,
  CashFlowStatement,
  StockProfile,
} from '@/types/market';
import {
  calculateIntrinsicValue,
  calculateDiscountToIntrinsic,
} from './valuation';

interface InternalFactor {
  name: string;
  value: number;
  score: number;
  maxScore: number;
  description: string;
}

export interface StockAnalysisInput {
  quote: StockQuote;
  profile: StockProfile;
  keyMetrics: KeyMetrics[]; // last 5 years
  incomeStatements: IncomeStatement[];
  cashFlowStatements: CashFlowStatement[];
  existingTickers: string[];
}

function scoreValuation(
  keyMetrics: KeyMetrics[],
  quote: StockQuote
): { score: number; factors: InternalFactor[] } {
  const factors: InternalFactor[] = [];
  const latest = keyMetrics[0];

  // P/E ratio scoring
  const pe = latest?.peRatio ?? quote.pe ?? 0;
  let peScore = 0;
  if (pe <= 0) {
    peScore = 0;
  } else if (pe < 15) {
    peScore = 25;
  } else if (pe < 20) {
    peScore = 20;
  } else if (pe < 25) {
    peScore = 15;
  } else if (pe < 30) {
    peScore = 10;
  } else {
    peScore = 5;
  }

  factors.push({
    name: 'P/E Ratio',
    value: pe,
    score: peScore,
    maxScore: 25,
    description:
      pe <= 0
        ? 'Negative earnings'
        : pe < 15
          ? 'Deep value territory'
          : pe < 20
            ? 'Reasonably valued'
            : pe < 25
              ? 'Fairly valued'
              : 'Premium valuation',
  });

  // P/FCF modifier
  const pfcf = latest?.priceToFreeCashFlowsRatio ?? 0;
  let pfcfModifier = 0;
  if (pfcf > 0 && pfcf < 15) {
    pfcfModifier = 3;
  } else if (pfcf > 0 && pfcf < 25) {
    pfcfModifier = 1;
  }

  const totalScore = Math.min(25, peScore + pfcfModifier);

  return { score: totalScore, factors };
}

function scoreGrowth(
  incomeStatements: IncomeStatement[]
): { score: number; factors: InternalFactor[] } {
  const factors: InternalFactor[] = [];

  let revenueGrowth = 0;
  if (incomeStatements.length >= 2) {
    const current = incomeStatements[0]?.revenue ?? 0;
    const prior = incomeStatements[1]?.revenue ?? 0;
    if (prior > 0) {
      revenueGrowth = ((current - prior) / prior) * 100;
    }
  }

  let growthScore = 5;
  if (revenueGrowth > 20) {
    growthScore = 25;
  } else if (revenueGrowth > 10) {
    growthScore = 20;
  } else if (revenueGrowth > 5) {
    growthScore = 15;
  } else if (revenueGrowth > 0) {
    growthScore = 10;
  }

  factors.push({
    name: 'Revenue Growth',
    value: revenueGrowth,
    score: growthScore,
    maxScore: 25,
    description:
      revenueGrowth > 20
        ? 'Exceptional growth'
        : revenueGrowth > 10
          ? 'Strong growth'
          : revenueGrowth > 5
            ? 'Moderate growth'
            : revenueGrowth > 0
              ? 'Slow growth'
              : 'Declining revenue',
  });

  return { score: growthScore, factors };
}

function scoreQuality(
  keyMetrics: KeyMetrics[]
): { score: number; factors: InternalFactor[] } {
  const factors: InternalFactor[] = [];
  const latest = keyMetrics[0];

  // Net profit margin
  const margin = (latest?.netProfitMargin ?? 0) * 100;
  let marginScore = 3;
  if (margin > 20) {
    marginScore = 12;
  } else if (margin > 10) {
    marginScore = 9;
  } else if (margin > 5) {
    marginScore = 6;
  }

  factors.push({
    name: 'Profit Margin',
    value: margin,
    score: marginScore,
    maxScore: 12,
    description: margin > 20 ? 'Excellent margins' : margin > 10 ? 'Good margins' : 'Thin margins',
  });

  // ROE
  const roe = (latest?.returnOnEquity ?? 0) * 100;
  let roeScore = 2;
  if (roe > 20) {
    roeScore = 8;
  } else if (roe > 15) {
    roeScore = 6;
  } else if (roe > 10) {
    roeScore = 4;
  }

  factors.push({
    name: 'ROE',
    value: roe,
    score: roeScore,
    maxScore: 8,
    description: roe > 20 ? 'Outstanding returns on equity' : roe > 15 ? 'Strong ROE' : 'Moderate ROE',
  });

  // Debt-to-Equity
  const debtToEquity = latest?.debtToEquity ?? 0;
  let deScore = 1;
  if (debtToEquity < 0.5) {
    deScore = 5;
  } else if (debtToEquity < 1.0) {
    deScore = 4;
  } else if (debtToEquity < 2.0) {
    deScore = 2;
  }

  factors.push({
    name: 'Debt/Equity',
    value: debtToEquity,
    score: deScore,
    maxScore: 5,
    description:
      debtToEquity < 0.5
        ? 'Conservative balance sheet'
        : debtToEquity < 1.0
          ? 'Manageable debt'
          : 'High leverage',
  });

  return { score: marginScore + roeScore + deScore, factors };
}

function scoreIncome(
  keyMetrics: KeyMetrics[]
): { score: number; factors: InternalFactor[] } {
  const factors: InternalFactor[] = [];
  const latest = keyMetrics[0];

  const dividendYield = (latest?.dividendYield ?? 0) * 100;
  let incomeScore = 2;
  if (dividendYield > 3) {
    incomeScore = 15;
  } else if (dividendYield > 2) {
    incomeScore = 12;
  } else if (dividendYield > 1) {
    incomeScore = 8;
  } else if (dividendYield > 0) {
    incomeScore = 4;
  }

  factors.push({
    name: 'Dividend Yield',
    value: dividendYield,
    score: incomeScore,
    maxScore: 15,
    description:
      dividendYield > 3
        ? 'High income potential'
        : dividendYield > 1
          ? 'Moderate dividend'
          : dividendYield > 0
            ? 'Small dividend'
            : 'Growth-oriented (no dividend)',
  });

  return { score: incomeScore, factors };
}

function scoreMomentum(
  quote: StockQuote
): { score: number; factors: InternalFactor[] } {
  const factors: InternalFactor[] = [];

  // Everyone gets 4 base points (bullish tilt)
  let momentumScore = 4;
  const description: string[] = ['Bullish base bias'];

  const price = quote.price ?? 0;
  const yearHigh = quote.yearHigh ?? price;
  const yearLow = quote.yearLow ?? price;

  // Down > 10% from 52-week high: buy the dip
  if (yearHigh > 0) {
    const drawdown = ((yearHigh - price) / yearHigh) * 100;
    if (drawdown > 10) {
      momentumScore += 3;
      description.push('Buy the dip opportunity');
    }
  }

  // Near 52-week low (within 15%)
  if (yearLow > 0 && price > 0) {
    const distFromLow = ((price - yearLow) / yearLow) * 100;
    if (distFromLow <= 15) {
      momentumScore += 3;
      description.push('Near 52-week low');
    }
  }

  factors.push({
    name: 'Momentum Bias',
    value: momentumScore,
    score: momentumScore,
    maxScore: 10,
    description: description.join('. '),
  });

  return { score: momentumScore, factors };
}

export function scoreStock(input: StockAnalysisInput): BuyRecommendation {
  const {
    quote,
    profile,
    keyMetrics,
    incomeStatements,
    cashFlowStatements,
    existingTickers,
  } = input;

  const valuation = scoreValuation(keyMetrics, quote);
  const growth = scoreGrowth(incomeStatements);
  const quality = scoreQuality(keyMetrics);
  const income = scoreIncome(keyMetrics);
  const momentum = scoreMomentum(quote);

  const allFactors = [
    ...valuation.factors,
    ...growth.factors,
    ...quality.factors,
    ...income.factors,
    ...momentum.factors,
  ];

  const compositeScore =
    valuation.score +
    growth.score +
    quality.score +
    income.score +
    momentum.score;

  // Calculate intrinsic value via DCF if we have cash flow data
  let intrinsicValue: number;
  const currentPrice = quote.price ?? 0;
  const latestCF = cashFlowStatements[0];
  const latestMetrics = keyMetrics[0];

  if (latestCF && latestCF.freeCashFlow && latestCF.freeCashFlow > 0) {
    // Estimate growth rate from revenue growth
    let estGrowthRate = 0.08;
    if (incomeStatements.length >= 2) {
      const current = incomeStatements[0]?.revenue ?? 0;
      const prior = incomeStatements[1]?.revenue ?? 0;
      if (prior > 0) {
        estGrowthRate = Math.max(0.02, Math.min(0.25, (current - prior) / prior));
      }
    }

    const sharesOutstanding = quote.sharesOutstanding ??
      (quote.marketCap && currentPrice > 0 ? quote.marketCap / currentPrice : 0);

    if (sharesOutstanding > 0) {
      intrinsicValue = calculateIntrinsicValue(
        latestCF.freeCashFlow,
        estGrowthRate,
        0.10,
        0.03,
        5,
        sharesOutstanding
      );
    } else {
      intrinsicValue = currentPrice * 1.2;
    }
  } else {
    intrinsicValue = currentPrice * 1.2;
  }

  const discountToIntrinsic = calculateDiscountToIntrinsic(
    currentPrice,
    intrinsicValue
  );

  // Generate rationale
  const topFactors = [...allFactors]
    .sort((a, b) => (b.score / b.maxScore) - (a.score / a.maxScore))
    .slice(0, 2);

  const rationale = `${profile.companyName ?? quote.symbol} scores well on ${topFactors.map((f) => f.name.toLowerCase()).join(' and ')}, with a composite score of ${compositeScore}/100. ${discountToIntrinsic > 0 ? `Trading at an estimated ${discountToIntrinsic.toFixed(0)}% discount to intrinsic value.` : 'Near fair value based on DCF analysis.'}`;

  const conviction: 'high' | 'medium' | 'low' =
    compositeScore > 75 ? 'high' : compositeScore >= 50 ? 'medium' : 'low';

  // Get key metric values for display
  const pe = latestMetrics?.peRatio ?? quote.pe ?? 0;
  const revenueGrowth =
    incomeStatements.length >= 2 && (incomeStatements[1]?.revenue ?? 0) > 0
      ? ((incomeStatements[0]?.revenue ?? 0) - (incomeStatements[1]?.revenue ?? 0)) /
        (incomeStatements[1]?.revenue ?? 1) *
        100
      : 0;
  const profitMargin = (latestMetrics?.netProfitMargin ?? 0) * 100;
  const fcfYield = latestMetrics?.priceToFreeCashFlowsRatio
    ? (1 / latestMetrics.priceToFreeCashFlowsRatio) * 100
    : 0;
  const dividendYield = (latestMetrics?.dividendYield ?? 0) * 100;
  const debtToEquity = latestMetrics?.debtToEquity ?? 0;

  // Find factor scores from allFactors array
  const findFactor = (name: string) => allFactors.find((f) => f.name === name);

  return {
    ticker: quote.symbol,
    companyName: profile.companyName ?? quote.name ?? quote.symbol,
    sector: profile.sector ?? 'Unknown',
    currentPrice,
    intrinsicValue,
    discountToIntrinsic,
    compositeScore,
    conviction,
    factors: {
      peRatio: { value: pe, score: findFactor('P/E Ratio')?.score ?? 0, label: 'P/E Ratio' },
      revenueGrowth: { value: revenueGrowth, score: findFactor('Revenue Growth')?.score ?? 0, label: 'Revenue Growth' },
      profitMargin: { value: profitMargin, score: findFactor('Profit Margin')?.score ?? 0, label: 'Profit Margin' },
      freeCashFlowYield: { value: fcfYield, score: valuation.score, label: 'FCF Yield' },
      dividendYield: { value: dividendYield, score: findFactor('Dividend Yield')?.score ?? 0, label: 'Dividend Yield' },
      debtToEquity: { value: debtToEquity, score: findFactor('Debt/Equity')?.score ?? 0, label: 'Debt/Equity' },
      roe: { value: (latestMetrics?.returnOnEquity ?? 0) * 100, score: findFactor('ROE')?.score ?? 0, label: 'ROE' },
    },
    rationale,
    isExistingPosition: existingTickers.includes(quote.symbol),
  };
}
