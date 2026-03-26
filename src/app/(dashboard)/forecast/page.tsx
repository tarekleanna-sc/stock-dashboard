'use client';

import { useState, useMemo } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import CompoundGrowthChart from '@/components/forecast/CompoundGrowthChart';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { formatCurrency, formatCompactCurrency, formatPercent } from '@/lib/utils/formatting';
import { CHART_COLORS } from '@/lib/utils/constants';

const CURRENT_YEAR = new Date().getFullYear();

export default function ForecastPage() {
  const { enrichedPositions, totalValue, isLoading } = usePortfolioValue();
  const [years, setYears] = useState(10);
  const [growthRate, setGrowthRate] = useState(8);

  const chartData = useMemo(
    () =>
      Array.from({ length: years + 1 }, (_, i) => ({
        year: String(CURRENT_YEAR + i),
        value: totalValue * Math.pow(1 + growthRate / 100, i),
      })),
    [totalValue, years, growthRate]
  );

  const projectedValue = totalValue * Math.pow(1 + growthRate / 100, years);
  const totalGain = projectedValue - totalValue;
  const totalReturnPct = totalValue > 0 ? (totalGain / totalValue) * 100 : 0;

  const positionProjections = useMemo(
    () =>
      [...enrichedPositions]
        .sort((a, b) => b.marketValue - a.marketValue)
        .map((p) => {
          const projected = p.marketValue * Math.pow(1 + growthRate / 100, years);
          const gain = projected - p.marketValue;
          return { ...p, projected, gain };
        }),
    [enrichedPositions, growthRate, years]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Forecast" description="Project your portfolio's future value" />
        <GlassCard className="p-12 text-center">
          <div className="animate-pulse text-white/50">Loading portfolio data...</div>
        </GlassCard>
      </div>
    );
  }

  if (enrichedPositions.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Forecast" description="Project your portfolio's future value" />
        <GlassCard className="p-12 text-center">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-lg font-semibold text-white mb-2">No Positions Yet</h3>
          <p className="text-white/50">
            Add positions to your portfolio to start forecasting growth.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Forecast" description="Project your portfolio's future value" />

      {/* Controls */}
      <GlassCard className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {/* Years slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/70">Time Horizon</span>
              <span className="text-sm font-semibold text-cyan-300">{years} {years === 1 ? 'year' : 'years'}</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={1}
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-400"
              style={{
                background: `linear-gradient(to right, #22d3ee ${((years - 1) / 49) * 100}%, rgba(255,255,255,0.12) ${((years - 1) / 49) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5 text-xs text-white/30">
              <span>1y</span>
              <span>25y</span>
              <span>50y</span>
            </div>
          </div>

          {/* Growth rate slider */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-white/70">Annual Growth Rate</span>
              <span className="text-sm font-semibold text-cyan-300">{growthRate.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min={1}
              max={30}
              step={0.5}
              value={growthRate}
              onChange={(e) => setGrowthRate(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-400"
              style={{
                background: `linear-gradient(to right, #22d3ee ${((growthRate - 1) / 29) * 100}%, rgba(255,255,255,0.12) ${((growthRate - 1) / 29) * 100}%)`,
              }}
            />
            <div className="flex justify-between mt-1.5 text-xs text-white/30">
              <span>1%</span>
              <span>15%</span>
              <span>30%</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Chart */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">
          Portfolio Value Projection — {CURRENT_YEAR} to {CURRENT_YEAR + years}
        </h3>
        <CompoundGrowthChart data={chartData} startValue={totalValue} />
      </GlassCard>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard className="p-5" hover={false}>
          <p className="text-xs text-white/50 mb-1">Starting Value</p>
          <p className="text-lg font-semibold text-white">{formatCompactCurrency(totalValue)}</p>
        </GlassCard>
        <GlassCard className="p-5" hover={false}>
          <p className="text-xs text-white/50 mb-1">Projected Value</p>
          <p className="text-lg font-semibold text-cyan-300">{formatCompactCurrency(projectedValue)}</p>
        </GlassCard>
        <GlassCard className="p-5" hover={false}>
          <p className="text-xs text-white/50 mb-1">Total Gain</p>
          <p className="text-lg font-semibold text-emerald-400">+{formatCompactCurrency(totalGain)}</p>
        </GlassCard>
        <GlassCard className="p-5" hover={false}>
          <p className="text-xs text-white/50 mb-1">Total Return</p>
          <p className="text-lg font-semibold text-emerald-400">+{totalReturnPct.toFixed(1)}%</p>
        </GlassCard>
      </div>

      {/* Per-position table */}
      <GlassCard className="p-6">
        <h3 className="text-sm font-medium text-white/60 mb-4">Position Projections</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left pb-3 text-xs font-medium text-white/40">Position</th>
                <th className="text-right pb-3 text-xs font-medium text-white/40">Current Value</th>
                <th className="text-right pb-3 text-xs font-medium text-white/40">
                  Projected ({CURRENT_YEAR + years})
                </th>
                <th className="text-right pb-3 text-xs font-medium text-white/40">Gain</th>
              </tr>
            </thead>
            <tbody>
              {positionProjections.map((p, i) => (
                <tr
                  key={p.ticker}
                  className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <div>
                        <span className="font-semibold text-white">{p.ticker}</span>
                        {p.companyName && (
                          <span className="ml-2 text-xs text-white/40 hidden sm:inline">{p.companyName}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-right text-white/70">{formatCurrency(p.marketValue)}</td>
                  <td className="py-3 text-right font-medium text-cyan-300">{formatCurrency(p.projected)}</td>
                  <td className="py-3 text-right text-emerald-400">
                    +{formatCompactCurrency(p.gain)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
