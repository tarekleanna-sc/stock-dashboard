'use client';

import { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { RiskMetrics } from '@/hooks/useRiskMetrics';

interface RiskMetricsCardProps {
  metrics: RiskMetrics;
  isLoading?: boolean;
}

function MetricBox({
  label,
  value,
  sub,
  color,
  tooltip,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
  tooltip?: string;
}) {
  return (
    <div title={tooltip} className="group relative">
      <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-white/30">{sub}</p>}
    </div>
  );
}

function betaColor(beta: number): string {
  if (beta < 0.8) return 'text-emerald-400';
  if (beta < 1.2) return 'text-white';
  if (beta < 1.5) return 'text-amber-400';
  return 'text-rose-400';
}

function sharpeColor(sharpe: number): string {
  if (sharpe >= 1) return 'text-emerald-400';
  if (sharpe >= 0) return 'text-amber-400';
  return 'text-rose-400';
}

export default function RiskMetricsCard({ metrics, isLoading }: RiskMetricsCardProps) {
  const [showPositions, setShowPositions] = useState(false);

  const {
    portfolioBeta,
    annualizedReturn,
    annualizedVolatility,
    sharpeRatio,
    maxDrawdown,
    positions52w,
  } = metrics;

  const hasHistory = annualizedReturn !== null;

  return (
    <GlassCard>
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase">
          Risk Metrics
        </p>
        {positions52w.length > 0 && (
          <button
            onClick={() => setShowPositions((p) => !p)}
            className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
          >
            {showPositions ? 'Hide 52-week' : '52-week range →'}
          </button>
        )}
      </div>

      {/* Metric grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
        <MetricBox
          label="Portfolio Beta"
          value={isLoading ? '—' : portfolioBeta.toFixed(2)}
          sub={portfolioBeta < 1 ? 'less volatile' : portfolioBeta > 1 ? 'more volatile' : 'market-like'}
          color={isLoading ? 'text-white/40' : betaColor(portfolioBeta)}
          tooltip="Weighted-average beta vs. the market. >1 = higher volatility than S&P 500."
        />
        <MetricBox
          label="Ann. Return"
          value={isLoading || !hasHistory ? '—' : `${annualizedReturn! >= 0 ? '+' : ''}${annualizedReturn!.toFixed(1)}%`}
          sub={hasHistory ? 'since first snapshot' : 'needs history'}
          color={!hasHistory ? 'text-white/40' : annualizedReturn! >= 0 ? 'text-emerald-400' : 'text-rose-400'}
          tooltip="Annualized portfolio return calculated from your daily snapshots."
        />
        <MetricBox
          label="Volatility"
          value={isLoading || annualizedVolatility === null ? '—' : `${annualizedVolatility.toFixed(1)}%`}
          sub="annualized"
          color={annualizedVolatility === null ? 'text-white/40' : annualizedVolatility < 15 ? 'text-emerald-400' : annualizedVolatility < 25 ? 'text-amber-400' : 'text-rose-400'}
          tooltip="Annualized standard deviation of daily portfolio returns (requires 10+ daily snapshots)."
        />
        <MetricBox
          label="Sharpe Ratio"
          value={isLoading || sharpeRatio === null ? '—' : sharpeRatio.toFixed(2)}
          sub={sharpeRatio !== null ? (sharpeRatio >= 1 ? 'good' : sharpeRatio >= 0 ? 'fair' : 'poor') : 'needs history'}
          color={sharpeRatio === null ? 'text-white/40' : sharpeColor(sharpeRatio)}
          tooltip="Risk-adjusted return (4.5% risk-free rate). ≥1 is generally considered good."
        />
      </div>

      {/* Max drawdown */}
      {maxDrawdown !== null && maxDrawdown > 0 && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
          <span className="text-[10px] text-white/30 uppercase tracking-wide">Max Drawdown</span>
          <span className="text-sm font-semibold text-rose-400">-{maxDrawdown.toFixed(1)}%</span>
          <span className="text-xs text-white/20">peak to trough</span>
        </div>
      )}

      {/* 52-week per-position range */}
      {showPositions && positions52w.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/[0.06] space-y-2.5">
          <p className="text-[10px] text-white/25 uppercase tracking-wide">52-Week Positions</p>
          {positions52w.slice(0, 8).map((p) => {
            const rangePct = ((p.currentPrice - p.yearLow) / (p.yearHigh - p.yearLow)) * 100;
            return (
              <div key={p.ticker}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">{p.ticker}</span>
                  <span className={`font-medium ${p.fromHighPct < -10 ? 'text-rose-400' : p.fromHighPct > -5 ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {p.fromHighPct >= 0 ? '+' : ''}{p.fromHighPct}% from 52w high
                  </span>
                </div>
                {/* Range bar */}
                <div className="h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-emerald-500"
                    style={{ width: `${Math.max(2, Math.min(100, rangePct))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-white/20 mt-0.5">
                  <span>${p.yearLow.toFixed(0)}</span>
                  <span>${p.yearHigh.toFixed(0)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!hasHistory && (
        <p className="text-xs text-white/25 mt-3 pt-3 border-t border-white/[0.06]">
          Return, volatility, and Sharpe ratios require daily snapshot history. They will populate as you use the app.
        </p>
      )}
    </GlassCard>
  );
}
