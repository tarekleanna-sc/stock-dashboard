'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useStockQuotes } from '@/hooks/useStockQuote';
import { useMultiTickerNews, useMarketNews, timeAgo } from '@/hooks/useStockNews';
import type { NewsArticle } from '@/hooks/useStockNews';
import type { StockQuote } from '@/types/market';
import { classifyNewsImpact, summarizeNews, detectPriceSpike } from '@/lib/utils/newsImpact';
import type { NewsImpactResult, PriceContext, NewsDigest } from '@/lib/utils/newsImpact';
import { canUseNewsImpact } from '@/lib/utils/featureGating';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import PageHeader from '@/components/layout/PageHeader';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ClassifiedArticle {
  article: NewsArticle;
  impact: NewsImpactResult;
  priceContext?: PriceContext;
}

type FilterTab = 'all' | 'fundamental' | 'sentiment' | 'noise';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPriceContext(quote: StockQuote | undefined): PriceContext | undefined {
  if (!quote) return undefined;
  return {
    changePercent: quote.changesPercentage ?? 0,
    avgVolume: quote.avgVolume ?? 0,
    currentVolume: quote.volume ?? 0,
    previousClose: quote.previousClose ?? 0,
    currentPrice: quote.price ?? 0,
  };
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="text-xs font-medium text-white/40">{label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: color || '#e2e8f0' }}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-white/30">{sub}</p>}
    </div>
  );
}

// ─── Sentiment Badge ─────────────────────────────────────────────────────────

function SentimentBadge({ sentiment }: { sentiment: NewsDigest['netSentiment'] }) {
  const config = {
    bullish: { bg: 'rgba(16,185,129,0.12)', text: '#10b981', label: 'Bullish' },
    bearish: { bg: 'rgba(244,63,94,0.12)', text: '#f43f5e', label: 'Bearish' },
    mixed: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', label: 'Mixed' },
    neutral: { bg: 'rgba(100,116,139,0.12)', text: '#64748b', label: 'Neutral' },
  };
  const c = config[sentiment];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ background: c.text }}
      />
      {c.label}
    </span>
  );
}

// ─── Impact Badge ────────────────────────────────────────────────────────────

function ImpactBadge({ impact }: { impact: NewsImpactResult }) {
  const typeConfig = {
    fundamental: { bg: 'rgba(139,92,246,0.12)', text: '#8b5cf6', icon: '◆' },
    sentiment: { bg: 'rgba(59,130,246,0.12)', text: '#3b82f6', icon: '◇' },
    noise: { bg: 'rgba(100,116,139,0.08)', text: '#475569', icon: '○' },
  };
  const dirConfig = {
    positive: { bg: 'rgba(16,185,129,0.12)', text: '#10b981' },
    negative: { bg: 'rgba(244,63,94,0.12)', text: '#f43f5e' },
    neutral: { bg: 'rgba(100,116,139,0.08)', text: '#64748b' },
  };
  const sevConfig = {
    high: { bg: 'rgba(244,63,94,0.12)', text: '#f43f5e' },
    medium: { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b' },
    low: { bg: 'rgba(100,116,139,0.08)', text: '#475569' },
  };

  const t = typeConfig[impact.type];
  const d = dirConfig[impact.direction];
  const s = sevConfig[impact.severity];

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Type badge */}
      <span
        className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium"
        style={{ background: t.bg, color: t.text }}
      >
        {t.icon} {impact.type}
      </span>
      {/* Direction */}
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
        style={{ background: d.bg, color: d.text }}
      >
        {impact.direction}
      </span>
      {/* Severity */}
      {impact.severity !== 'low' && (
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
          style={{ background: s.bg, color: s.text }}
        >
          {impact.severity}
        </span>
      )}
      {/* Fundamental flag */}
      {impact.longTermFundamental && (
        <span
          className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-semibold"
          style={{ background: 'rgba(139,92,246,0.15)', color: '#a78bfa' }}
        >
          Long-term
        </span>
      )}
    </div>
  );
}

// ─── Spike Indicator ─────────────────────────────────────────────────────────

function SpikeIndicator({ priceContext }: { priceContext?: PriceContext }) {
  if (!priceContext) return null;
  const spike = detectPriceSpike(priceContext);
  if (!spike.isSpike) return null;

  const color = spike.spikeDirection === 'up' ? '#10b981' : spike.spikeDirection === 'down' ? '#f43f5e' : '#f59e0b';

  return (
    <div
      className="flex items-center gap-1.5 rounded-lg px-2.5 py-1"
      style={{ background: `${color}12`, border: `1px solid ${color}20` }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        {spike.spikeDirection === 'up' ? (
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        ) : (
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
        )}
      </svg>
      <span className="text-xs font-semibold" style={{ color }}>
        {priceContext.changePercent > 0 ? '+' : ''}{priceContext.changePercent.toFixed(1)}%
      </span>
      <span className="text-[10px] text-white/30">
        {spike.volumeRatio.toFixed(1)}x vol
      </span>
    </div>
  );
}

// ─── Article Card ────────────────────────────────────────────────────────────

function ArticleCard({ item }: { item: ClassifiedArticle }) {
  const [expanded, setExpanded] = useState(false);
  const { article, impact, priceContext } = item;

  return (
    <motion.div
      layout
      className="rounded-xl border border-white/[0.06] bg-white/[0.03] transition-colors hover:bg-white/[0.05]"
    >
      <div className="p-4">
        {/* Top row: symbol + time + spike */}
        <div className="mb-2 flex items-center gap-2">
          {article.symbol && (
            <span className="rounded-md bg-white/[0.08] px-2 py-0.5 text-xs font-bold text-white/80">
              {article.symbol}
            </span>
          )}
          <span className="text-[11px] text-white/25">{timeAgo(article.datetime)}</span>
          <span className="text-[11px] text-white/20">· {article.source}</span>
          <div className="ml-auto">
            <SpikeIndicator priceContext={priceContext} />
          </div>
        </div>

        {/* Headline */}
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm font-semibold leading-snug text-white/90 hover:text-white transition-colors"
        >
          {article.headline}
        </a>

        {/* Impact classification */}
        <div className="mt-2.5 flex items-center justify-between gap-3">
          <ImpactBadge impact={impact} />
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors"
          >
            {expanded ? 'Less' : 'Analysis'}
          </button>
        </div>

        {/* Expandable analysis */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-lg border border-white/[0.04] bg-white/[0.02] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/40">
                    Classification
                  </span>
                  <span className="text-xs font-medium text-white/60">{impact.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-white/40">{impact.reasoning}</p>
                {article.summary && (
                  <p className="mt-2 text-xs leading-relaxed text-white/25 line-clamp-3">
                    {article.summary}
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Filter Tabs ─────────────────────────────────────────────────────────────

function FilterTabs({
  active,
  onChange,
  counts,
}: {
  active: FilterTab;
  onChange: (tab: FilterTab) => void;
  counts: Record<FilterTab, number>;
}) {
  const tabs: { id: FilterTab; label: string; color: string }[] = [
    { id: 'all', label: 'All News', color: '#e2e8f0' },
    { id: 'fundamental', label: 'Fundamental', color: '#8b5cf6' },
    { id: 'sentiment', label: 'Sentiment', color: '#3b82f6' },
    { id: 'noise', label: 'Noise', color: '#475569' },
  ];

  return (
    <div className="flex gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="relative rounded-md px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            color: active === tab.id ? tab.color : '#475569',
            background: active === tab.id ? `${tab.color}12` : 'transparent',
          }}
        >
          {tab.label}
          <span className="ml-1 text-[10px] opacity-60">{counts[tab.id]}</span>
        </button>
      ))}
    </div>
  );
}

// ─── Ticker Spike Bar ────────────────────────────────────────────────────────

function TickerSpikeBar({
  classified,
  quotes,
  onSelect,
  selected,
}: {
  classified: ClassifiedArticle[];
  quotes: StockQuote[];
  onSelect: (sym: string | null) => void;
  selected: string | null;
}) {
  // Get unique symbols that have spikes or fundamental news
  const tickerStats = useMemo(() => {
    const map = new Map<string, { articles: number; fundamental: number; change: number; spike: boolean }>();
    for (const item of classified) {
      const sym = item.article.symbol;
      if (!sym) continue;
      const existing = map.get(sym) || { articles: 0, fundamental: 0, change: 0, spike: false };
      existing.articles++;
      if (item.impact.type === 'fundamental') existing.fundamental++;
      if (item.priceContext) {
        existing.change = item.priceContext.changePercent;
        const spike = detectPriceSpike(item.priceContext);
        if (spike.isSpike) existing.spike = true;
      }
      map.set(sym, existing);
    }
    return Array.from(map.entries())
      .sort((a, b) => Math.abs(b[1].change) - Math.abs(a[1].change))
      .slice(0, 12);
  }, [classified]);

  if (tickerStats.length === 0) return null;

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
      <p className="mb-3 text-xs font-medium text-white/40">Tickers with Activity</p>
      <div className="flex flex-wrap gap-2">
        {tickerStats.map(([sym, stats]) => {
          const isActive = selected === sym;
          const color = stats.change > 0 ? '#10b981' : stats.change < 0 ? '#f43f5e' : '#64748b';
          return (
            <button
              key={sym}
              onClick={() => onSelect(isActive ? null : sym)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-left transition-all"
              style={{
                background: isActive ? `${color}15` : 'rgba(255,255,255,0.03)',
                border: `1px solid ${isActive ? `${color}40` : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <span className="text-xs font-bold text-white/80">{sym}</span>
              <span className="text-[11px] font-semibold" style={{ color }}>
                {stats.change > 0 ? '+' : ''}{stats.change.toFixed(1)}%
              </span>
              {stats.spike && (
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: color }} />
              )}
              {stats.fundamental > 0 && (
                <span className="text-[10px] text-violet-400/60">{stats.fundamental}f</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {/* KPI row skeleton */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="h-3 w-16 rounded bg-white/[0.06] animate-pulse" />
            <div className="mt-2 h-7 w-24 rounded bg-white/[0.06] animate-pulse" />
          </div>
        ))}
      </div>
      {/* Article skeletons */}
      {[...Array(5)].map((_, i) => (
        <div key={i} className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex gap-2 mb-3">
            <div className="h-5 w-12 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-16 rounded bg-white/[0.06] animate-pulse" />
          </div>
          <div className="h-4 w-3/4 rounded bg-white/[0.06] animate-pulse" />
          <div className="mt-2 h-4 w-1/2 rounded bg-white/[0.06] animate-pulse" />
          <div className="mt-3 flex gap-2">
            <div className="h-5 w-20 rounded bg-white/[0.06] animate-pulse" />
            <div className="h-5 w-16 rounded bg-white/[0.06] animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function NewsImpactPage() {
  const { plan } = useSubscription();
  const [filter, setFilter] = useState<FilterTab>('all');
  const [tickerFilter, setTickerFilter] = useState<string | null>(null);

  // Get portfolio tickers
  const positions = usePortfolioStore((s) => s.positions);
  const uniqueTickers = useMemo(() => {
    const set = new Set(positions.map((p) => p.ticker.toUpperCase()));
    return Array.from(set);
  }, [positions]);

  // Fetch news for portfolio holdings
  const {
    data: portfolioNews = [],
    isLoading: newsLoading,
  } = useMultiTickerNews(uniqueTickers, 50);

  // Fetch general market news as fallback
  const { data: marketNews = [] } = useMarketNews(20);

  // Fetch live quotes for price context
  const { data: quotes = [] } = useStockQuotes(uniqueTickers);

  // Build quote map
  const quoteMap = useMemo(() => {
    const map = new Map<string, StockQuote>();
    for (const q of quotes) map.set(q.symbol.toUpperCase(), q);
    return map;
  }, [quotes]);

  // Classify all news
  const classified = useMemo((): ClassifiedArticle[] => {
    const allNews = portfolioNews.length > 0 ? portfolioNews : marketNews;
    return allNews.map((article) => {
      const priceContext = buildPriceContext(quoteMap.get(article.symbol?.toUpperCase()));
      const impact = classifyNewsImpact(article.headline, article.summary, priceContext);
      return { article, impact, priceContext };
    });
  }, [portfolioNews, marketNews, quoteMap]);

  // Digest summary
  const digest = useMemo(
    () => summarizeNews(classified.map((c) => c.impact)),
    [classified],
  );

  // Filtered articles
  const filtered = useMemo(() => {
    let items = classified;
    if (filter !== 'all') {
      items = items.filter((c) => c.impact.type === filter);
    }
    if (tickerFilter) {
      items = items.filter((c) => c.article.symbol?.toUpperCase() === tickerFilter);
    }
    return items;
  }, [classified, filter, tickerFilter]);

  // Count by type
  const counts: Record<FilterTab, number> = useMemo(() => ({
    all: classified.length,
    fundamental: classified.filter((c) => c.impact.type === 'fundamental').length,
    sentiment: classified.filter((c) => c.impact.type === 'sentiment').length,
    noise: classified.filter((c) => c.impact.type === 'noise').length,
  }), [classified]);

  // ─── Gate check ──────────────────────────────────────────────────────────

  if (!canUseNewsImpact(plan)) {
    return (
      <div>
        <PageHeader
          title="News Impact Analysis"
          description="See how breaking news affects your holdings and whether it impacts long-term fundamentals"
        />
        <UpgradePrompt
          requiredPlan="pro"
          title="Unlock News Impact Analysis"
          description="Upgrade to Pro to see real-time news classified by fundamental impact, sentiment drivers, and price spike correlation for every stock in your portfolio."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="News Impact Analysis"
        description="Real-time news classified by fundamental impact on your portfolio holdings"
      />

      {newsLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiCard label="Total Articles" value={digest.totalArticles} sub="Last 7 days" />
            <KpiCard
              label="Fundamental Events"
              value={digest.fundamentalCount}
              sub="Affects long-term value"
              color="#8b5cf6"
            />
            <KpiCard
              label="High Severity"
              value={digest.highSeverityCount}
              sub="Requires attention"
              color={digest.highSeverityCount > 0 ? '#f43f5e' : '#64748b'}
            />
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
              <p className="text-xs font-medium text-white/40">Net Sentiment</p>
              <div className="mt-2">
                <SentimentBadge sentiment={digest.netSentiment} />
              </div>
              <p className="mt-1.5 text-[11px] text-white/25">
                Weighted by severity
              </p>
            </div>
          </div>

          {/* Ticker spike bar */}
          <TickerSpikeBar
            classified={classified}
            quotes={quotes}
            onSelect={setTickerFilter}
            selected={tickerFilter}
          />

          {/* Filter tabs + articles */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <FilterTabs active={filter} onChange={setFilter} counts={counts} />
            {tickerFilter && (
              <button
                onClick={() => setTickerFilter(null)}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 hover:text-white/80 transition-colors"
              >
                Filtering: <span className="font-bold text-white/80">{tickerFilter}</span>
                <span className="ml-1 text-white/30">×</span>
              </button>
            )}
          </div>

          {/* Article list */}
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-12 text-center">
              <p className="text-sm text-white/40">
                {uniqueTickers.length === 0
                  ? 'Add positions to your portfolio to see news impact analysis.'
                  : 'No news articles match the current filter.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {filtered.map((item, i) => (
                <ArticleCard key={`${item.article.symbol}-${item.article.datetime}-${i}`} item={item} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
