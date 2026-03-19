'use client';

import { RebalanceSuggestion } from '@/types/analysis';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { formatCurrency } from '@/lib/utils/formatting';

interface RebalanceSuggestionListProps {
  suggestions: RebalanceSuggestion[];
}

export default function RebalanceSuggestionList({ suggestions }: RebalanceSuggestionListProps) {
  if (suggestions.length === 0) {
    return (
      <GlassCard className="p-8 text-center">
        <p className="text-white/50">
          Set your target allocations above to see rebalance suggestions.
        </p>
      </GlassCard>
    );
  }

  const actionableCount = suggestions.filter((s) => s.action !== 'hold').length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Rebalance Suggestions</h3>
        <span className="text-sm text-white/50">
          {actionableCount} actionable suggestion{actionableCount !== 1 ? 's' : ''}
        </span>
      </div>

      {suggestions.map((suggestion) => (
        <GlassCard key={suggestion.ticker} className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">{suggestion.ticker}</span>
                  <ActionBadge action={suggestion.action} />
                </div>
                <span className="text-xs text-white/40">{suggestion.companyName}</span>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              {suggestion.action !== 'hold' && (
                <>
                  <div className="text-right">
                    <div className="text-xs text-white/40">Shares</div>
                    <div
                      className={`font-medium tabular-nums ${
                        suggestion.sharesNeeded > 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {suggestion.sharesNeeded > 0 ? '+' : ''}
                      {suggestion.sharesNeeded}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/40">Amount</div>
                    <div
                      className={`font-medium tabular-nums ${
                        suggestion.action === 'buy' ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {formatCurrency(suggestion.dollarAmount)}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <p className="text-xs text-white/50 mt-2 leading-relaxed">{suggestion.reason}</p>
        </GlassCard>
      ))}
    </div>
  );
}

function ActionBadge({ action }: { action: RebalanceSuggestion['action'] }) {
  switch (action) {
    case 'buy':
      return (
        <GlassBadge variant="positive">
          Buy
        </GlassBadge>
      );
    case 'trim':
      return (
        <GlassBadge variant="warning">
          Trim
        </GlassBadge>
      );
    case 'hold':
      return (
        <GlassBadge>
          Hold
        </GlassBadge>
      );
  }
}
