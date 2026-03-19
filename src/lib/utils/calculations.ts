import { Position, PositionWithMarketData } from '@/types/portfolio';
import { StockQuote, StockProfile } from '@/types/market';

export function enrichPosition(
  position: Position,
  quote?: StockQuote | null,
  profile?: StockProfile
): PositionWithMarketData {
  const price = quote?.price ?? 0;
  const marketValue = position.shares * price;
  const totalCostBasis = position.shares * position.costBasisPerShare;
  const gainLoss = marketValue - totalCostBasis;
  const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0;

  return {
    ...position,
    currentPrice: price,
    marketValue,
    totalCostBasis,
    gainLoss,
    gainLossPercent,
    dayChange: quote?.change ?? 0,
    dayChangePercent: quote?.changesPercentage ?? 0,
    sector: profile?.sector ?? 'Unknown',
    companyName: profile?.companyName ?? quote?.name ?? position.ticker,
  };
}

export function calculatePortfolioTotalValue(positions: PositionWithMarketData[]): number {
  return positions.reduce((sum, p) => sum + p.marketValue, 0);
}

export function calculatePortfolioCostBasis(positions: PositionWithMarketData[]): number {
  return positions.reduce((sum, p) => sum + p.totalCostBasis, 0);
}

export function calculatePortfolioDayChange(positions: PositionWithMarketData[]): number {
  return positions.reduce((sum, p) => sum + p.dayChange * p.shares, 0);
}

export function calculateAllocation(
  positions: PositionWithMarketData[]
): { ticker: string; companyName: string; allocation: number; marketValue: number }[] {
  const total = calculatePortfolioTotalValue(positions);
  if (total === 0) return [];
  return positions.map((p) => ({
    ticker: p.ticker,
    companyName: p.companyName,
    allocation: (p.marketValue / total) * 100,
    marketValue: p.marketValue,
  }));
}

export function calculateSectorAllocation(
  positions: PositionWithMarketData[]
): { sector: string; allocation: number; marketValue: number }[] {
  const total = calculatePortfolioTotalValue(positions);
  if (total === 0) return [];

  const sectorMap = new Map<string, number>();
  for (const p of positions) {
    const current = sectorMap.get(p.sector) ?? 0;
    sectorMap.set(p.sector, current + p.marketValue);
  }

  return Array.from(sectorMap.entries())
    .map(([sector, marketValue]) => ({
      sector,
      allocation: (marketValue / total) * 100,
      marketValue,
    }))
    .sort((a, b) => b.allocation - a.allocation);
}
