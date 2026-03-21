'use client';

import { PositionWithMarketData } from '@/types/portfolio';
import { formatCurrency, formatPercent, formatShares } from '@/lib/utils/formatting';
import { GlassButton } from '@/components/ui/GlassButton';

interface PositionRowProps {
  position: PositionWithMarketData;
  onEdit: (position: PositionWithMarketData) => void;
  onDelete: (position: PositionWithMarketData) => void;
}

export default function PositionRow({ position, onEdit, onDelete }: PositionRowProps) {
  // Use pre-calculated values from enrichPosition (already has * 100 applied)
  const gainLoss = position.gainLoss ?? 0;
  const gainLossPercent = position.gainLossPercent ?? 0;
  const isPositive = gainLoss >= 0;
  const dayChangePercent = position.dayChangePercent ?? 0;
  const isDayPositive = dayChangePercent >= 0;

  return (
    <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-white/[0.03] transition-colors min-w-[860px]">
      {/* Ticker & Name */}
      <div className="w-[130px] min-w-[130px]">
        <p className="text-white font-bold text-sm">{position.ticker}</p>
        <p className="text-white/50 text-xs truncate">{position.companyName ?? '--'}</p>
      </div>

      {/* Shares */}
      <div className="w-[70px] min-w-[70px] text-right">
        <p className="text-white text-sm font-medium">{formatShares(position.shares)}</p>
      </div>

      {/* Cost Basis */}
      <div className="w-[85px] min-w-[85px] text-right">
        <p className="text-white text-sm font-medium">{formatCurrency(position.costBasisPerShare)}</p>
      </div>

      {/* Current Price */}
      <div className="w-[85px] min-w-[85px] text-right">
        <p className="text-white text-sm font-medium">
          {position.currentPrice ? formatCurrency(position.currentPrice) : '--'}
        </p>
      </div>

      {/* Market Value */}
      <div className="w-[95px] min-w-[95px] text-right">
        <p className="text-white text-sm font-bold">
          {position.marketValue ? formatCurrency(position.marketValue) : '--'}
        </p>
      </div>

      {/* Gain/Loss */}
      <div className="w-[105px] min-w-[105px] text-right">
        <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {isPositive ? '+' : ''}{formatCurrency(gainLoss)}
        </p>
        <p className={`text-xs ${isPositive ? 'text-emerald-400/70' : 'text-rose-400/70'}`}>
          {formatPercent(gainLossPercent)}
        </p>
      </div>

      {/* Day Change */}
      <div className="w-[70px] min-w-[70px] text-right">
        <p className={`text-sm font-medium ${isDayPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
          {formatPercent(dayChangePercent)}
        </p>
      </div>

      {/* Actions - always visible */}
      <div className="flex items-center gap-1 ml-auto">
        <GlassButton variant="ghost" size="sm" onClick={() => onEdit(position)}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </GlassButton>
        <GlassButton variant="ghost" size="sm" onClick={() => onDelete(position)}>
          <svg className="w-3.5 h-3.5 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </GlassButton>
      </div>
    </div>
  );
}
