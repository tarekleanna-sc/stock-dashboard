'use client';

import { BrokerAccount, PositionWithMarketData, BROKER_LABELS, ACCOUNT_TYPE_LABELS } from '@/types/portfolio';
import { formatCurrency, formatPercent } from '@/lib/utils/formatting';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { GlassButton } from '@/components/ui/GlassButton';

interface AccountCardProps {
  account: BrokerAccount;
  positions: PositionWithMarketData[];
  onEdit: (account: BrokerAccount) => void;
  onDelete: (account: BrokerAccount) => void;
}

export default function AccountCard({ account, positions, onEdit, onDelete }: AccountCardProps) {
  const totalMarketValue = positions.reduce((sum, p) => sum + (p.marketValue ?? 0), 0);
  const totalCostBasis = positions.reduce((sum, p) => sum + p.shares * p.costBasisPerShare, 0);
  const totalGainLoss = totalMarketValue - totalCostBasis;
  const totalGainLossPercent = totalCostBasis > 0 ? totalGainLoss / totalCostBasis : 0;
  const isPositive = totalGainLoss >= 0;

  return (
    <GlassCard padding="sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <h3 className="text-white font-semibold text-lg truncate">{account.name}</h3>
          <GlassBadge>{BROKER_LABELS[account.broker]}</GlassBadge>
          <GlassBadge>{ACCOUNT_TYPE_LABELS[account.accountType]}</GlassBadge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <GlassButton variant="ghost" size="sm" onClick={() => onEdit(account)}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </GlassButton>
          <GlassButton variant="ghost" size="sm" onClick={() => onDelete(account)}>
            <svg className="w-4 h-4 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </GlassButton>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">Market Value</p>
          <p className="text-xl font-bold text-white">{formatCurrency(totalMarketValue)}</p>
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">Gain/Loss</p>
          <p className={`text-lg font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isPositive ? '+' : ''}{formatCurrency(totalGainLoss)}{' '}
            <span className="text-sm">({isPositive ? '+' : ''}{formatPercent(totalGainLossPercent)})</span>
          </p>
        </div>
        <div>
          <p className="text-xs text-white/50 uppercase tracking-wider">Positions</p>
          <p className="text-lg font-semibold text-white">{positions.length}</p>
        </div>
      </div>
    </GlassCard>
  );
}
