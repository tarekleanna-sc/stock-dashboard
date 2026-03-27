'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useTickerNews, useMarketNews, timeAgo, NewsArticle } from '@/hooks/useStockNews';

// ─── Article card ─────────────────────────────────────────────────────────────

function ArticleCard({ article }: { article: NewsArticle }) {
  const [imgError, setImgError] = useState(false);

  return (
    <motion.a
      href={article.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="group flex gap-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 transition-all hover:border-white/[0.14] hover:bg-white/[0.05]"
    >
      {/* Thumbnail */}
      {article.image && !imgError ? (
        <div className="h-16 w-20 shrink-0 overflow-hidden rounded-lg bg-white/[0.06]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.image}
            alt=""
            onError={() => setImgError(true)}
            className="h-full w-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          />
        </div>
      ) : (
        <div className="h-16 w-20 shrink-0 rounded-lg bg-white/[0.06] flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeOpacity="0.2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          {article.symbol && (
            <span className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-xs font-semibold text-emerald-400">
              {article.symbol}
            </span>
          )}
          <span className="text-xs text-white/35">{article.source}</span>
          <span className="text-xs text-white/25">·</span>
          <span className="text-xs text-white/35">{timeAgo(article.datetime)}</span>
        </div>
        <p className="text-sm font-medium leading-snug text-white/90 group-hover:text-white line-clamp-2">
          {article.headline}
        </p>
        {article.summary && (
          <p className="mt-1 text-xs leading-relaxed text-white/40 line-clamp-2">
            {article.summary}
          </p>
        )}
      </div>

      {/* Arrow */}
      <div className="shrink-0 flex items-center text-white/20 group-hover:text-white/50 transition-colors">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </motion.a>
  );
}

// ─── Ticker pill selector ─────────────────────────────────────────────────────

function TickerSelector({
  tickers,
  active,
  onChange,
}: {
  tickers: string[];
  active: string | null;
  onChange: (t: string | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange(null)}
        className={`rounded-xl border px-3 py-1.5 text-xs font-medium transition-all ${
          active === null
            ? 'border-white/[0.20] bg-white/[0.10] text-white'
            : 'border-white/[0.07] bg-white/[0.03] text-white/45 hover:border-white/[0.14] hover:text-white/70'
        }`}
      >
        Market News
      </button>
      {tickers.map((t) => (
        <button
          key={t}
          onClick={() => onChange(active === t ? null : t)}
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition-all ${
            active === t
              ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300'
              : 'border-white/[0.07] bg-white/[0.03] text-white/55 hover:border-white/[0.14] hover:text-white/80'
          }`}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function NewsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex gap-4 rounded-xl border border-white/[0.07] p-4">
          <div className="h-16 w-20 shrink-0 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 animate-pulse rounded bg-white/[0.06]" />
            <div className="h-4 w-full animate-pulse rounded bg-white/[0.06]" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── News feed with single ticker ─────────────────────────────────────────────

function TickerNewsFeed({ symbol }: { symbol: string }) {
  const { data: articles = [], isLoading } = useTickerNews(symbol);
  if (isLoading) return <NewsSkeleton />;
  if (articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-white/40">No recent news found for {symbol}.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {articles.map((a) => <ArticleCard key={`${a.id}-${a.datetime}`} article={a} />)}
    </div>
  );
}

// ─── Market news feed ─────────────────────────────────────────────────────────

function MarketNewsFeed() {
  const { data: articles = [], isLoading } = useMarketNews();
  if (isLoading) return <NewsSkeleton />;
  if (articles.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-white/40">Unable to load market news right now.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {articles.map((a) => <ArticleCard key={`${a.id}-${a.datetime}`} article={a} />)}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function NewsPage() {
  const positions = usePortfolioStore((s) => s.positions);
  const [activeTicker, setActiveTicker] = useState<string | null>(null);

  const holdingTickers = useMemo(
    () => [...new Set(positions.map((p) => p.ticker))].slice(0, 20), // cap at 20 to avoid API spam
    [positions]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="News Feed"
        subtitle="Latest headlines for your holdings and the broader market"
      />

      {/* Ticker filter */}
      <GlassCard>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white">Filter by holding</h3>
          {activeTicker && (
            <button
              onClick={() => setActiveTicker(null)}
              className="text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
        {holdingTickers.length > 0 ? (
          <TickerSelector
            tickers={holdingTickers}
            active={activeTicker}
            onChange={setActiveTicker}
          />
        ) : (
          <p className="text-sm text-white/40">
            Add positions to your portfolio to see holding-specific news.
          </p>
        )}
      </GlassCard>

      {/* News feed */}
      <GlassCard>
        <div className="mb-4 flex items-center gap-2">
          {activeTicker ? (
            <>
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-xs font-bold text-emerald-400">
                {activeTicker.slice(0, 2)}
              </div>
              <h3 className="text-sm font-semibold text-white">{activeTicker} — Recent News</h3>
              <GlassBadge variant="info">Last 7 days</GlassBadge>
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
              </svg>
              <h3 className="text-sm font-semibold text-white">Market News</h3>
              <GlassBadge variant="info">General</GlassBadge>
            </>
          )}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTicker ?? '__market__'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTicker ? (
              <TickerNewsFeed symbol={activeTicker} />
            ) : (
              <MarketNewsFeed />
            )}
          </motion.div>
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
