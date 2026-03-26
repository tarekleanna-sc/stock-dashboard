'use client';

import { useMemo } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { formatCurrency } from '@/lib/utils/formatting';
import type { DividendSummary } from '@/hooks/useDividendData';

interface DividendCardProps {
  summary: DividendSummary;
}

export default function DividendCard({ summary }: DividendCardProps) {
  const { totalAnnualIncome, weightedYield, positions, isLoading } = summary;

  const monthlyIncome = totalAnnualIncome / 12;

  const topPayers = useMemo(
    () =>
      [...positions]
        .filter((p) => p.annualIncome > 0)
        .sort((a, b) => b.annualIncome - a.annualIncome)
        .slice(0, 5),
    [positions]
  );

  if (!isLoading && topPayers.length === 0) {
    return (
      <GlassCard>
        <p className="text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase mb-3">
          Dividend Income
        </p>
        <p className="text-sm text-white/40">None of your holdings pay dividends.</p>
      </GlassCard>
    );
  }

  return (
    <GlassCard>
      <p className="text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase mb-4">
        Dividend Income
      </p>

      {/* Summary row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Annual</p>
          <p className="text-lg font-bold text-white">
            {isLoading ? '—' : formatCurrency(totalAnnualIncome)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Monthly</p>
          <p className="text-lg font-bold text-emerald-400">
            {isLoading ? '—' : formatCurrency(monthlyIncome)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Yield</p>
          <p className="text-lg font-bold text-cyan-400">
            {isLoading ? '—' : `${weightedYield.toFixed(2)}%`}
          </p>
        </div>
      </div>

      {/* Top paying positions */}
      {topPayers.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-white/25 uppercase tracking-wide">Top Dividend Payers</p>
          {topPayers.map((p) => (
            <div key={p.ticker} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-white w-14 flex-shrink-0">
                  {p.ticker}
                </span>
                <span className="text-xs text-white/30 truncate">
                  {p.dividendYield.toFixed(2)}% yield
                  {p.nextExDate && (
                    <span className="ml-1.5">
                      · ex {new Date(p.nextExDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  )}
                </span>
              </div>
              <span className="text-sm font-medium text-emerald-400 flex-shrink-0">
                {formatCurrency(p.annualIncome)}/yr
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
