'use client';

import { PositionWithMarketData } from '@/types/portfolio';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import DriftIndicator from './DriftIndicator';
import { formatPercent } from '@/lib/utils/formatting';

interface AllocationTargetEditorProps {
  positions: PositionWithMarketData[];
  targetAllocations: Record<string, number>;
  onChange: (ticker: string, value: number) => void;
  onEqualWeight: () => void;
  onClear: () => void;
}

export default function AllocationTargetEditor({
  positions,
  targetAllocations,
  onChange,
  onEqualWeight,
  onClear,
}: AllocationTargetEditorProps) {
  const totalValue = positions.reduce((sum, p) => sum + p.marketValue, 0);
  const totalTarget = Object.values(targetAllocations).reduce((sum, v) => sum + v, 0);
  const totalTargetDiff = Math.abs(totalTarget - 100);

  return (
    <GlassCard className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white">Target Allocations</h3>
        <div className="flex gap-2">
          <GlassButton onClick={onEqualWeight} size="sm">
            Equal Weight
          </GlassButton>
          <GlassButton onClick={onClear} size="sm" variant="ghost">
            Clear All
          </GlassButton>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-white/50 uppercase tracking-wider border-b border-white/10">
              <th className="text-left pb-3 pr-4">Ticker</th>
              <th className="text-right pb-3 px-4">Current %</th>
              <th className="text-right pb-3 px-4">Target %</th>
              <th className="text-right pb-3 pl-4">Drift</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((position) => {
              const currentAlloc = totalValue > 0
                ? (position.marketValue / totalValue) * 100
                : 0;
              const targetAlloc = targetAllocations[position.ticker] ?? 0;
              const drift = currentAlloc - targetAlloc;

              return (
                <tr
                  key={position.ticker}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="py-3 pr-4">
                    <div className="flex flex-col">
                      <span className="font-medium text-white">{position.ticker}</span>
                      <span className="text-xs text-white/40">{position.companyName}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-4 text-white/70 tabular-nums">
                    {formatPercent(currentAlloc)}
                  </td>
                  <td className="text-right py-3 px-4">
                    <GlassInput
                      type="number"
                      value={targetAlloc || ''}
                      onChange={(e) => onChange(position.ticker, parseFloat(e.target.value) || 0)}
                      className="w-20 text-right ml-auto"
                      min={0}
                      max={100}
                      step={0.5}
                      placeholder="0"
                    />
                  </td>
                  <td className="text-right py-3 pl-4">
                    <DriftIndicator drift={drift} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-sm text-white/50">Total Target</span>
        <span
          className={`text-sm font-medium tabular-nums ${
            totalTargetDiff < 1
              ? 'text-emerald-400'
              : totalTargetDiff < 5
              ? 'text-amber-400'
              : 'text-rose-400'
          }`}
        >
          {totalTarget.toFixed(1)}%
          {totalTargetDiff >= 1 && (
            <span className="text-xs text-white/40 ml-2">
              ({totalTarget > 100 ? '+' : ''}{(totalTarget - 100).toFixed(1)}%)
            </span>
          )}
        </span>
      </div>
    </GlassCard>
  );
}
