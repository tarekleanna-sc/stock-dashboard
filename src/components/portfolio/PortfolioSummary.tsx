'use client';

import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import { GlassCard } from '@/components/ui/GlassCard';

export default function PortfolioSummary() {
  const { enrichedPositions, totalValue, totalCostBasis, totalDayChange, isLoading } = usePortfolioValue();
  const { accounts } = usePortfolioStore();

  const totalGainLoss = totalValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;
  const isGainPositive = totalGainLoss >= 0;
  const isDayPositive = totalDayChange >= 0;
  const dayChangePercent = totalValue > 0 ? totalDayChange / (totalValue - totalDayChange) : 0;

  const metrics = [
    {
      label: 'Total Value',
      value: formatCurrency(totalValue),
      subValue: null,
      color: 'text-white',
    },
    {
      label: 'Cost Basis',
      value: formatCurrency(totalCostBasis),
      subValue: null,
      color: 'text-white',
    },
    {
      label: 'Total Gain/Loss',
      value: `${isGainPositive ? '+' : ''}${formatCurrency(totalGainLoss)}`,
      subValue: `${isGainPositive ? '+' : ''}${formatPercent(totalGainLossPercent)}`,
      color: isGainPositive ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      label: 'Day Change',
      value: `${isDayPositive ? '+' : ''}${formatCurrency(totalDayChange)}`,
      subValue: `${isDayPositive ? '+' : ''}${formatPercent(dayChangePercent)}`,
      color: isDayPositive ? 'text-emerald-400' : 'text-rose-400',
    },
    {
      label: 'Positions',
      value: enrichedPositions.length.toString(),
      subValue: null,
      color: 'text-white',
    },
    {
      label: 'Accounts',
      value: accounts.length.toString(),
      subValue: null,
      color: 'text-white',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <GlassCard key={i} padding="sm">
            <div className="animate-pulse space-y-2">
              <div className="h-3 w-16 bg-white/10 rounded" />
              <div className="h-6 w-24 bg-white/10 rounded" />
            </div>
          </GlassCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {metrics.map((metric) => (
        <GlassCard key={metric.label} padding="sm">
          <p className="text-xs text-white/50 uppercase tracking-wider mb-1">{metric.label}</p>
          <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
          {metric.subValue && (
            <p className={`text-sm ${metric.color} opacity-80`}>{metric.subValue}</p>
          )}
        </GlassCard>
      ))}
    </div>
  );
}
