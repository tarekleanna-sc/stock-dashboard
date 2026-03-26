'use client';

import { useMemo } from 'react';
import type { PositionWithMarketData } from '@/types/portfolio';

export interface RiskMetrics {
  portfolioBeta: number;
  annualizedReturn: number | null;  // % — null if insufficient data
  annualizedVolatility: number | null; // % — null if < 20 daily snapshots
  sharpeRatio: number | null;
  maxDrawdown: number | null;       // % — max peak-to-trough
  positions52w: Array<{
    ticker: string;
    companyName: string;
    currentPrice: number;
    yearHigh: number;
    yearLow: number;
    fromHighPct: number; // % below 52w high (negative = below high)
    fromLowPct: number;  // % above 52w low (positive = above low)
  }>;
}

const RISK_FREE_RATE = 0.045; // 4.5% annualized risk-free rate

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((s, v) => s + v, 0) / values.length;
  const variance = values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function useRiskMetrics(
  positions: PositionWithMarketData[],
  snapshots: { date: string; totalValue: number }[]
): RiskMetrics {
  return useMemo(() => {
    const totalValue = positions.reduce((s, p) => s + (p.marketValue ?? 0), 0);

    // ── Portfolio Beta (market-value weighted) ────────────────────────────────
    const portfolioBeta =
      totalValue > 0
        ? positions.reduce((s, p) => {
            const beta = (p as PositionWithMarketData & { beta?: number }).beta ?? 1;
            return s + beta * ((p.marketValue ?? 0) / totalValue);
          }, 0)
        : 1;

    // ── Snapshot-based metrics (need sorted daily snapshots) ─────────────────
    const sorted = [...snapshots].sort((a, b) => a.date.localeCompare(b.date));

    let annualizedReturn: number | null = null;
    let annualizedVolatility: number | null = null;
    let sharpeRatio: number | null = null;
    let maxDrawdown: number | null = null;

    if (sorted.length >= 2) {
      const first = sorted[0].totalValue;
      const last = sorted[sorted.length - 1].totalValue;
      const days = Math.max(
        1,
        (new Date(sorted[sorted.length - 1].date).getTime() -
          new Date(sorted[0].date).getTime()) /
          (1000 * 60 * 60 * 24)
      );

      // Annualized return: (last/first)^(365/days) - 1
      annualizedReturn = first > 0
        ? (Math.pow(last / first, 365 / days) - 1) * 100
        : null;

      // Daily returns for volatility & sharpe
      const dailyReturns: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1].totalValue;
        const curr = sorted[i].totalValue;
        if (prev > 0) dailyReturns.push((curr - prev) / prev);
      }

      if (dailyReturns.length >= 10) {
        const dailyVol = stdDev(dailyReturns);
        annualizedVolatility = dailyVol * Math.sqrt(252) * 100;

        const dailyRf = RISK_FREE_RATE / 252;
        const meanDailyReturn =
          dailyReturns.reduce((s, v) => s + v, 0) / dailyReturns.length;
        const excessReturn = meanDailyReturn - dailyRf;
        sharpeRatio =
          dailyVol > 0
            ? parseFloat(((excessReturn / dailyVol) * Math.sqrt(252)).toFixed(2))
            : null;
      }

      // Max drawdown: max (peak - trough) / peak
      let peak = sorted[0].totalValue;
      let maxDD = 0;
      for (const s of sorted) {
        if (s.totalValue > peak) peak = s.totalValue;
        const drawdown = peak > 0 ? (peak - s.totalValue) / peak : 0;
        if (drawdown > maxDD) maxDD = drawdown;
      }
      maxDrawdown = parseFloat((maxDD * 100).toFixed(2));
    }

    // ── 52-week position metrics (from StockQuote data) ─────────────────────
    const positions52w = positions
      .filter((p) => p.yearHigh > 0 && p.yearLow > 0)
      .map((p) => ({
        ticker: p.ticker,
        companyName: p.companyName,
        currentPrice: p.currentPrice,
        yearHigh: p.yearHigh,
        yearLow: p.yearLow,
        fromHighPct: p.yearHigh > 0
          ? parseFloat((((p.currentPrice - p.yearHigh) / p.yearHigh) * 100).toFixed(1))
          : 0,
        fromLowPct: p.yearLow > 0
          ? parseFloat((((p.currentPrice - p.yearLow) / p.yearLow) * 100).toFixed(1))
          : 0,
      }))
      .sort((a, b) => a.fromHighPct - b.fromHighPct); // worst first

    return {
      portfolioBeta: parseFloat(portfolioBeta.toFixed(2)),
      annualizedReturn: annualizedReturn !== null ? parseFloat(annualizedReturn.toFixed(2)) : null,
      annualizedVolatility: annualizedVolatility !== null ? parseFloat(annualizedVolatility.toFixed(2)) : null,
      sharpeRatio,
      maxDrawdown,
      positions52w,
    };
  }, [positions, snapshots]);
}
