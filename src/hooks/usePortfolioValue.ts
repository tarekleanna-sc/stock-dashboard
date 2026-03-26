'use client';

import { useMemo } from 'react';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useStockQuotes } from '@/hooks/useStockQuote';
import { useStockProfiles } from '@/hooks/useStockProfiles';
import { enrichPosition } from '@/lib/utils/calculations';
import type { PositionWithMarketData } from '@/types/portfolio';
import type { StockQuote } from '@/types/market';

export function usePortfolioValue() {
  const positions = usePortfolioStore((state) => state.positions);

  const uniqueTickers = useMemo(() => {
    const tickers = new Set(positions.map((p) => p.ticker));
    return Array.from(tickers);
  }, [positions]);

  const { data: quotes = [], isLoading, error, refetch, dataUpdatedAt } = useStockQuotes(uniqueTickers);
  const profileMap = useStockProfiles(uniqueTickers);

  const quoteMap = useMemo(() => {
    const map = new Map<string, StockQuote>();
    for (const quote of quotes) {
      map.set(quote.symbol, quote);
    }
    return map;
  }, [quotes]);

  const enrichedPositions: PositionWithMarketData[] = useMemo(() => {
    return positions.map((position) => {
      const quote = quoteMap.get(position.ticker);
      const profile = profileMap[position.ticker];
      return enrichPosition(position, quote, profile);
    });
  }, [positions, quoteMap, profileMap]);

  const totalValue = useMemo(
    () => enrichedPositions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0),
    [enrichedPositions]
  );

  const totalCostBasis = useMemo(
    () => enrichedPositions.reduce((sum, p) => sum + (p.totalCostBasis ?? 0), 0),
    [enrichedPositions]
  );

  const totalDayChange = useMemo(
    () => enrichedPositions.reduce((sum, p) => sum + ((p.dayChange ?? 0) * p.shares), 0),
    [enrichedPositions]
  );

  return {
    positions: enrichedPositions,
    enrichedPositions,
    totalValue,
    totalCostBasis,
    totalDayChange,
    isLoading,
    error,
    refetch,
    dataUpdatedAt,
  };
}
