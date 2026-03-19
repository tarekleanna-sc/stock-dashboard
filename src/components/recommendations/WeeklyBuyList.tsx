'use client';

import type { BuyRecommendation } from '@/types/analysis';
import { RecommendationCard } from './RecommendationCard';

interface WeeklyBuyListProps {
  recommendations: BuyRecommendation[];
}

export function WeeklyBuyList({ recommendations }: WeeklyBuyListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">
          Top Picks This Week
        </h2>
        <span className="text-sm text-white/50">
          {recommendations.length} recommendation{recommendations.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((rec) => (
          <RecommendationCard key={rec.ticker} recommendation={rec} />
        ))}
      </div>
    </div>
  );
}
