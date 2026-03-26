'use client';

import { useMemo, useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import type { ClosedPosition } from '@/types/portfolio';

interface ClosedPositionsSectionProps {
  closedPositions: ClosedPosition[];
  onDelete?: (id: string) => void;
}

function getTaxYear(dateStr: string): number {
  return new Date(dateStr).getFullYear();
}

export default function ClosedPositionsSection({
  closedPositions,
  onDelete,
}: ClosedPositionsSectionProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  const availableYears = useMemo(() => {
    const years = new Set(closedPositions.map((c) => getTaxYear(c.closedAt)));
    return [...years].sort((a, b) => b - a);
  }, [closedPositions]);

  const filtered = useMemo(() => {
    if (selectedYear === 'all') return closedPositions;
    return closedPositions.filter((c) => getTaxYear(c.closedAt) === selectedYear);
  }, [closedPositions, selectedYear]);

  const taxSummary = useMemo(() => {
    const totalGain = filtered.reduce((s, c) => s + c.realizedGain, 0);
    const wins = filtered.filter((c) => c.realizedGain > 0);
    const losses = filtered.filter((c) => c.realizedGain < 0);
    return { totalGain, wins: wins.length, losses: losses.length };
  }, [filtered]);

  if (closedPositions.length === 0) return null;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3 px-1 flex-wrap gap-2">
        <p className="text-[11px] font-semibold tracking-[0.15em] text-white/30 uppercase">
          Closed Positions
        </p>
        {availableYears.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            <button
              onClick={() => setSelectedYear('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                selectedYear === 'all'
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  : 'text-white/40 hover:text-white/60 border border-transparent'
              }`}
            >
              All
            </button>
            {availableYears.map((year) => (
              <button
                key={year}
                onClick={() => setSelectedYear(year)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                  selectedYear === year
                    ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                {year}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tax-year summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <GlassCard padding="md">
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Realized P&amp;L</p>
          <p className={`text-lg font-bold ${taxSummary.totalGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {taxSummary.totalGain >= 0 ? '+' : ''}{formatCurrency(taxSummary.totalGain)}
          </p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Winners</p>
          <p className="text-lg font-bold text-emerald-400">{taxSummary.wins}</p>
        </GlassCard>
        <GlassCard padding="md">
          <p className="text-[10px] text-white/30 uppercase tracking-wide mb-0.5">Losers</p>
          <p className="text-lg font-bold text-rose-400">{taxSummary.losses}</p>
        </GlassCard>
      </div>

      {/* Position rows */}
      <GlassCard padding="none">
        <div className="divide-y divide-white/[0.05]">
          {filtered.map((cp) => (
            <div
              key={cp.id}
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/[0.03] transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-white">{cp.ticker}</span>
                  <span className="text-xs text-white/30">
                    {cp.shares} shares · sold {new Date(cp.closedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {cp.notes && (
                    <GlassBadge variant="default">{cp.notes}</GlassBadge>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                  <span>Basis {formatCurrency(cp.costBasisPerShare)}/sh</span>
                  <span className="text-white/10">·</span>
                  <span>Sale {formatCurrency(cp.salePrice)}/sh</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className={`text-sm font-bold ${cp.realizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {cp.realizedGain >= 0 ? '+' : ''}{formatCurrency(cp.realizedGain)}
                </p>
                <p className={`text-xs font-medium ${cp.realizedGain >= 0 ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
                  {formatPercent(cp.realizedGainPct)}
                </p>
              </div>

              {onDelete && (
                <button
                  onClick={() => onDelete(cp.id)}
                  title="Remove record"
                  className="ml-2 text-white/20 hover:text-rose-400 transition-colors flex-shrink-0"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
