import { NextRequest, NextResponse } from 'next/server';
import {
  fetchIncomeStatements,
  fetchBalanceSheets,
  fetchCashFlowStatements,
  fetchKeyMetrics,
} from '@/lib/api/fmpClient';
import type { StockFinancials } from '@/types/market';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get('symbol');

  if (!symbol) {
    return NextResponse.json(
      { error: 'Missing required query parameter: symbol' },
      { status: 400 }
    );
  }

  const [incomeStatements, balanceSheets, cashFlowStatements, keyMetrics] =
    await Promise.all([
      fetchIncomeStatements(symbol),
      fetchBalanceSheets(symbol),
      fetchCashFlowStatements(symbol),
      fetchKeyMetrics(symbol),
    ]);

  const data: StockFinancials = {
    incomeStatements,
    balanceSheets,
    cashFlowStatements,
    keyMetrics,
  };

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=3600',
    },
  });
}
