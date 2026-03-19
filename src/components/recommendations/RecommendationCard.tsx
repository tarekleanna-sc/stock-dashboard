'use client';

import type { BuyRecommendation } from '@/types/analysis';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';

interface RecommendationCardProps {
  recommendation: BuyRecommendation;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const color =
    score > 70 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
  const strokeColor =
    score > 70 ? 'stroke-emerald-400' : score >= 50 ? 'stroke-amber-400' : 'stroke-rose-400';

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="72" height="72" className="-rotate-90">
        <circle cx="36" cy="36" r={radius} fill="none" stroke="currentColor" strokeWidth="4" className="text-white/10" />
        <circle cx="36" cy="36" r={radius} fill="none" strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={circumference - progress} strokeLinecap="round" className={strokeColor} />
      </svg>
      <span className={`absolute text-lg font-bold ${color}`}>{score}</span>
    </div>
  );
}

function MetricRow({ label, value, score, maxScore }: { label: string; value: string; score: number; maxScore: number }) {
  const pct = Math.min(100, maxScore > 0 ? (score / maxScore) * 100 : 0);
  const barColor = pct > 70 ? 'bg-emerald-400' : pct >= 50 ? 'bg-amber-400' : 'bg-rose-400';

  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-white/50 whitespace-nowrap">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end">
        <span className="text-xs font-medium text-white/80">{value}</span>
        <div className="w-12 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

export function RecommendationCard({ recommendation }: RecommendationCardProps) {
  const {
    ticker,
    companyName,
    compositeScore,
    conviction,
    currentPrice,
    intrinsicValue,
    discountToIntrinsic,
    factors,
    rationale,
    isExistingPosition,
  } = recommendation;

  const convictionVariant: 'positive' | 'warning' | 'negative' =
    conviction === 'high' ? 'positive' : conviction === 'medium' ? 'warning' : 'negative';

  const isDiscount = discountToIntrinsic > 0;

  return (
    <GlassCard className="p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white">{ticker}</h3>
          <p className="text-sm text-white/50 truncate">{companyName}</p>
        </div>
        <ScoreCircle score={compositeScore} />
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        <GlassBadge variant={convictionVariant}>
          {conviction.charAt(0).toUpperCase() + conviction.slice(1)} Conviction
        </GlassBadge>
        {isExistingPosition && (
          <GlassBadge variant="info">Existing Position</GlassBadge>
        )}
      </div>

      {/* Intrinsic Value Comparison */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
        <div className="text-center">
          <p className="text-xs text-white/40">Current</p>
          <p className="text-sm font-semibold text-white">${currentPrice.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40">Intrinsic</p>
          <p className="text-sm font-semibold text-white">${intrinsicValue.toFixed(2)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-white/40">{isDiscount ? 'Discount' : 'Premium'}</p>
          <p className={`text-sm font-bold ${isDiscount ? 'text-emerald-400' : 'text-rose-400'}`}>
            {isDiscount ? '+' : ''}{discountToIntrinsic.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 gap-1.5">
        <MetricRow
          label="P/E"
          value={factors.peRatio.value > 0 ? factors.peRatio.value.toFixed(1) : 'N/A'}
          score={factors.peRatio.score}
          maxScore={25}
        />
        <MetricRow
          label="Rev Growth"
          value={`${factors.revenueGrowth.value.toFixed(1)}%`}
          score={factors.revenueGrowth.score}
          maxScore={25}
        />
        <MetricRow
          label="Margin"
          value={`${factors.profitMargin.value.toFixed(1)}%`}
          score={factors.profitMargin.score}
          maxScore={12}
        />
        <MetricRow
          label="FCF Yield"
          value={`${factors.freeCashFlowYield.value.toFixed(1)}%`}
          score={factors.freeCashFlowYield.score}
          maxScore={25}
        />
        <MetricRow
          label="Div Yield"
          value={`${factors.dividendYield.value.toFixed(2)}%`}
          score={factors.dividendYield.score}
          maxScore={15}
        />
        <MetricRow
          label="Debt/Equity"
          value={factors.debtToEquity.value.toFixed(2)}
          score={factors.debtToEquity.score}
          maxScore={5}
        />
      </div>

      {/* Rationale */}
      <p className="text-xs italic text-white/60 leading-relaxed">{rationale}</p>
    </GlassCard>
  );
}
