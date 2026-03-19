'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { WeeklyBuyList } from '@/components/recommendations/WeeklyBuyList';
import { TickerSearch } from '@/components/ui/TickerSearch';
import { useRecommendations } from '@/hooks/useRecommendations';
import { usePortfolioStore } from '@/stores/portfolioStore';

function SkeletonCard() {
  return (
    <GlassCard className="p-5 space-y-4 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-6 w-16 rounded bg-white/10" />
          <div className="h-4 w-32 rounded bg-white/10" />
        </div>
        <div className="h-[72px] w-[72px] rounded-full bg-white/10" />
      </div>
      <div className="h-4 w-24 rounded bg-white/10" />
      <div className="h-16 rounded-xl bg-white/5" />
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-3 w-full rounded bg-white/10" />
        ))}
      </div>
      <div className="h-8 w-full rounded bg-white/10" />
    </GlassCard>
  );
}

export default function RecommendationsPage() {
  const [newTicker, setNewTicker] = useState('');
  const { watchlist, addToWatchlist, removeFromWatchlist, getUniqueTickers } =
    usePortfolioStore();
  const existingTickers = getUniqueTickers();
  const watchlistTickers = watchlist ?? [];

  const { data: recommendations, isLoading, error, refetch } =
    useRecommendations(watchlistTickers, existingTickers);

  const handleAddTicker = () => {
    const ticker = newTicker.trim().toUpperCase();
    if (ticker && !watchlistTickers.includes(ticker)) {
      addToWatchlist(ticker);
      setNewTicker('');
    }
  };

  const handleTickerSelect = (result: { symbol: string }) => {
    const ticker = result.symbol.toUpperCase();
    if (ticker && !watchlistTickers.includes(ticker)) {
      addToWatchlist(ticker);
    }
    setNewTicker('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTicker();
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Weekly Buys"
        description="Fundamental analysis picks based on long-term value investing"
      />

      {/* Watchlist Management */}
      <GlassCard className="p-5 space-y-4">
        <h3 className="text-sm font-medium text-white/70">
          Analysis Watchlist
        </h3>
        <div className="flex flex-wrap gap-2">
          {watchlistTickers.length === 0 && (
            <p className="text-sm text-white/40">
              No tickers in watchlist. Add some below to get recommendations.
            </p>
          )}
          {watchlistTickers.map((ticker) => (
            <GlassBadge
              key={ticker}
              variant="default"
              className="cursor-pointer hover:bg-white/20 transition-colors"
              onClick={() => removeFromWatchlist(ticker)}
            >
              {ticker} &times;
            </GlassBadge>
          ))}
        </div>
        <div className="flex gap-2">
          <TickerSearch
            value={newTicker}
            onChange={setNewTicker}
            onSelect={handleTickerSelect}
            placeholder="Search ticker or company to add..."
            className="flex-1"
          />
          <GlassButton variant="default" onClick={handleAddTicker}>
            Add
          </GlassButton>
        </div>
      </GlassCard>

      {/* Refresh Button */}
      <div className="flex justify-end">
        <GlassButton
          variant="primary"
          onClick={() => refetch()}
          disabled={isLoading || watchlistTickers.length === 0}
        >
          {isLoading ? 'Analyzing...' : 'Refresh Analysis'}
        </GlassButton>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <GlassCard className="p-5">
          <p className="text-rose-400 text-sm">
            Failed to load recommendations. Please try again.
          </p>
        </GlassCard>
      )}

      {/* Empty State */}
      {!isLoading && !error && watchlistTickers.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-white/50 text-sm">
            Add tickers to your watchlist above to generate buy recommendations.
          </p>
        </GlassCard>
      )}

      {/* Recommendations */}
      {!isLoading && recommendations && recommendations.length > 0 && (
        <WeeklyBuyList recommendations={recommendations} />
      )}

      {/* Disclaimer */}
      <GlassCard className="p-4">
        <p className="text-xs text-white/40 text-center leading-relaxed">
          For educational purposes only. Not financial advice. Based on
          quantitative fundamental analysis &mdash; always do your own research.
        </p>
      </GlassCard>
    </div>
  );
}
