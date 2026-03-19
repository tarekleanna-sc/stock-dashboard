import { NextRequest, NextResponse } from 'next/server';
import { scoreStock, type StockAnalysisInput } from '@/lib/analysis/recommendation';
import {
  fetchQuotes,
  fetchProfile,
  fetchKeyMetrics,
  fetchIncomeStatements,
  fetchCashFlowStatements,
} from '@/lib/api/fmpClient';
import type { BuyRecommendation } from '@/types/analysis';

export const revalidate = 21600; // Cache for 6 hours

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tickersParam = searchParams.get('tickers');
  const existingParam = searchParams.get('existing');

  if (!tickersParam) {
    return NextResponse.json(
      { error: 'Missing tickers parameter' },
      { status: 400 }
    );
  }

  const tickers = tickersParam
    .split(',')
    .map((t) => t.trim().toUpperCase())
    .filter(Boolean);
  const existingTickers = existingParam
    ? existingParam.split(',').map((t) => t.trim().toUpperCase()).filter(Boolean)
    : [];

  if (tickers.length === 0) {
    return NextResponse.json(
      { error: 'No valid tickers provided' },
      { status: 400 }
    );
  }

  try {
    const recommendations: BuyRecommendation[] = [];

    // Process tickers in parallel batches to avoid rate limits
    const batchSize = 5;
    for (let i = 0; i < tickers.length; i += batchSize) {
      const batch = tickers.slice(i, i + batchSize);

      const results = await Promise.allSettled(
        batch.map(async (ticker) => {
          const [quotes, profile, keyMetrics, incomeStatements, cashFlowStatements] =
            await Promise.all([
              fetchQuotes([ticker]),
              fetchProfile(ticker),
              fetchKeyMetrics(ticker, 5),
              fetchIncomeStatements(ticker, 5),
              fetchCashFlowStatements(ticker, 5),
            ]);
          const quote = quotes[0];

          if (!quote || !profile) {
            return null;
          }

          const input: StockAnalysisInput = {
            quote,
            profile,
            keyMetrics: keyMetrics ?? [],
            incomeStatements: incomeStatements ?? [],
            cashFlowStatements: cashFlowStatements ?? [],
            existingTickers,
          };

          return scoreStock(input);
        })
      );

      for (const result of results) {
        if (result.status === 'fulfilled' && result.value) {
          recommendations.push(result.value);
        }
      }
    }

    // Sort by composite score descending
    recommendations.sort((a, b) => b.compositeScore - a.compositeScore);

    // Return top 10
    const top10 = recommendations.slice(0, 10);

    return NextResponse.json(top10, {
      headers: {
        'Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Recommendation analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
