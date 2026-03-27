'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { useEarningsCalendar, groupByDate, EarningsEvent } from '@/hooks/useEarningsCalendar';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

function isToday(dateStr: string): boolean {
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

function isTomorrow(dateStr: string): boolean {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return dateStr === tomorrow.toISOString().split('T')[0];
}

function daysFromNow(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00');
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function formatEPS(val: number | null): string {
  if (val === null || val === undefined) return '—';
  return val >= 0 ? `$${val.toFixed(2)}` : `-$${Math.abs(val).toFixed(2)}`;
}

function formatRevenue(val: number | null): string {
  if (val === null || val === undefined) return '—';
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
}

function hourLabel(hour: string) {
  if (hour === 'bmo') return 'Before Open';
  if (hour === 'amc') return 'After Close';
  return 'During Hours';
}

function hourColor(hour: string) {
  if (hour === 'bmo') return 'text-amber-400';
  if (hour === 'amc') return 'text-violet-400';
  return 'text-cyan-400';
}

// ─── Components ──────────────────────────────────────────────────────────────

function EarningsRow({ event, isHolding }: { event: EarningsEvent; isHolding: boolean }) {
  const hasActuals = event.epsActual !== null;
  const beat = hasActuals && event.epsEstimate !== null && event.epsActual! >= event.epsEstimate!;

  return (
    <div className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-all ${
      isHolding
        ? 'border-emerald-500/20 bg-emerald-500/[0.04]'
        : 'border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04]'
    }`}>
      {/* Ticker */}
      <div className="flex items-center gap-2.5 w-28 shrink-0">
        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
          isHolding ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/[0.08] text-white/70'
        }`}>
          {event.symbol.slice(0, 2)}
        </div>
        <div>
          <div className="text-sm font-semibold text-white">{event.symbol}</div>
          {isHolding && <div className="text-xs text-emerald-500/80">Holding</div>}
        </div>
      </div>

      {/* Quarter */}
      <div className="hidden sm:block w-20 shrink-0">
        <div className="text-xs text-white/40">Q{event.quarter} {event.year}</div>
      </div>

      {/* Timing */}
      <div className="hidden md:block w-28 shrink-0">
        <div className={`text-xs font-medium ${hourColor(event.hour)}`}>
          {hourLabel(event.hour)}
        </div>
      </div>

      {/* EPS */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-xs text-white/40">
            EPS: <span className="text-white/70">Est {formatEPS(event.epsEstimate)}</span>
            {hasActuals && (
              <>
                {' · '}
                <span className={beat ? 'text-emerald-400' : 'text-rose-400'}>
                  Actual {formatEPS(event.epsActual)}
                </span>
                {beat && <span className="ml-1 text-emerald-500">✓ Beat</span>}
                {!beat && event.epsActual !== null && <span className="ml-1 text-rose-400">✗ Miss</span>}
              </>
            )}
          </div>
        </div>
        <div className="mt-0.5 text-xs text-white/30">
          Rev: {formatRevenue(event.revenueEstimate)} est
          {event.revenueActual !== null && ` · ${formatRevenue(event.revenueActual)} actual`}
        </div>
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        {hasActuals ? (
          <GlassBadge variant={beat ? 'positive' : 'negative'}>
            {beat ? 'Beat' : 'Miss'}
          </GlassBadge>
        ) : (
          <GlassBadge variant="info">Upcoming</GlassBadge>
        )}
      </div>
    </div>
  );
}

function DateGroup({ dateStr, events, holdingSet }: {
  dateStr: string;
  events: EarningsEvent[];
  holdingSet: Set<string>;
}) {
  const days = daysFromNow(dateStr);
  const label = isToday(dateStr) ? 'Today' : isTomorrow(dateStr) ? 'Tomorrow' : formatDate(dateStr);
  const hasHoldings = events.some((e) => holdingSet.has(e.symbol));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Date header */}
      <div className="mb-3 flex items-center gap-3">
        <div className={`text-sm font-semibold ${
          isToday(dateStr) ? 'text-emerald-400' :
          isTomorrow(dateStr) ? 'text-amber-400' :
          'text-white/60'
        }`}>
          {label}
        </div>
        {days >= 0 && days <= 7 && !isToday(dateStr) && (
          <div className="text-xs text-white/30">{days}d away</div>
        )}
        {hasHoldings && (
          <div className="text-xs text-emerald-500/70 ml-auto flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Holdings reporting
          </div>
        )}
      </div>

      <div className="mb-6 flex flex-col gap-2">
        {events.map((event) => (
          <EarningsRow key={`${event.symbol}-${event.date}`} event={event} isHolding={holdingSet.has(event.symbol)} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Upcoming strip ──────────────────────────────────────────────────────────

function UpcomingStrip({ events, holdingSet }: { events: EarningsEvent[]; holdingSet: Set<string> }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const upcoming = events.filter((e) => {
    const d = new Date(e.date + 'T00:00:00');
    return d >= today && d <= nextWeek;
  });

  if (upcoming.length === 0) return null;

  return (
    <GlassCard className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
        <h3 className="text-sm font-semibold text-white">Upcoming This Week</h3>
        <span className="ml-auto text-xs text-white/40">{upcoming.length} earnings</span>
      </div>
      <div className="flex gap-2 flex-wrap">
        {upcoming.map((e) => {
          const days = daysFromNow(e.date);
          return (
            <div
              key={`${e.symbol}-${e.date}`}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                holdingSet.has(e.symbol)
                  ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                  : 'border-white/[0.08] bg-white/[0.03]'
              }`}
            >
              <div className={`text-sm font-semibold ${holdingSet.has(e.symbol) ? 'text-emerald-300' : 'text-white'}`}>
                {e.symbol}
              </div>
              <div className="text-xs text-white/40">
                {isToday(e.date) ? 'Today' : isTomorrow(e.date) ? 'Tomorrow' : `${days}d`}
              </div>
              <div className={`text-xs ${hourColor(e.hour)}`}>
                {e.hour === 'bmo' ? '▲' : e.hour === 'amc' ? '▼' : '◆'}
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────

type FilterMode = 'all' | 'holdings' | 'upcoming';

function FilterTabs({ active, onChange }: { active: FilterMode; onChange: (m: FilterMode) => void }) {
  const tabs: { key: FilterMode; label: string }[] = [
    { key: 'upcoming', label: 'Next 30 days' },
    { key: 'holdings', label: 'My Holdings Only' },
    { key: 'all', label: 'All (60 days)' },
  ];
  return (
    <div className="flex gap-1 rounded-xl bg-white/[0.04] p-1 w-fit">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
            active === t.key
              ? 'bg-white/[0.10] text-white'
              : 'text-white/45 hover:text-white/70'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function EarningsPage() {
  const positions = usePortfolioStore((s) => s.positions);
  const [filter, setFilter] = useState<FilterMode>('upcoming');

  const holdingTickers = useMemo(
    () => [...new Set(positions.map((p) => p.ticker))],
    [positions]
  );
  const holdingSet = useMemo(() => new Set(holdingTickers), [holdingTickers]);

  // Fetch earnings for holdings (60-day window) + broader market
  const today = new Date().toISOString().split('T')[0];
  const future60 = new Date();
  future60.setDate(future60.getDate() + 60);
  const to60 = future60.toISOString().split('T')[0];

  const future30 = new Date();
  future30.setDate(future30.getDate() + 30);
  const to30 = future30.toISOString().split('T')[0];

  const { data: holdingEvents = [], isLoading: holdingLoading } = useEarningsCalendar(
    holdingTickers,
    today,
    to60
  );

  const isLoading = holdingLoading;

  // Filter logic
  const filtered = useMemo(() => {
    if (filter === 'holdings') return holdingEvents;
    if (filter === 'upcoming') {
      return holdingEvents.filter((e) => e.date <= to30);
    }
    return holdingEvents;
  }, [holdingEvents, filter, to30]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const sortedDates = useMemo(() => Object.keys(grouped).sort(), [grouped]);

  const holdingCount = holdingEvents.filter((e) => holdingSet.has(e.symbol)).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Earnings Calendar"
        description="Track upcoming earnings for your holdings and the broader market"
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          {
            label: 'Holdings Reporting',
            value: holdingTickers.length > 0 ? holdingCount.toString() : '—',
            sub: 'next 60 days',
            color: 'text-emerald-400',
          },
          {
            label: 'This Week',
            value: holdingEvents.filter((e) => daysFromNow(e.date) >= 0 && daysFromNow(e.date) <= 7).length.toString(),
            sub: 'from holdings',
            color: 'text-amber-400',
          },
          {
            label: 'Today',
            value: holdingEvents.filter((e) => isToday(e.date)).length.toString(),
            sub: 'earnings today',
            color: 'text-rose-400',
          },
          {
            label: 'Already Reported',
            value: holdingEvents.filter((e) => e.epsActual !== null).length.toString(),
            sub: 'with actuals',
            color: 'text-cyan-400',
          },
        ].map((stat) => (
          <GlassCard key={stat.label} padding="sm">
            <div className="text-xs text-white/40 mb-1">{stat.label}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-xs text-white/30 mt-0.5">{stat.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Upcoming strip */}
      {!isLoading && <UpcomingStrip events={holdingEvents} holdingSet={holdingSet} />}

      {/* Filter + list */}
      <GlassCard>
        <div className="mb-5 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-sm font-semibold text-white">Earnings Schedule</h2>
          <FilterTabs active={filter} onChange={setFilter} />
        </div>

        {isLoading && (
          <div className="flex flex-col gap-3 py-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/[0.04] animate-pulse" />
            ))}
          </div>
        )}

        {!isLoading && sortedDates.length === 0 && (
          <div className="py-12 text-center">
            <div className="mb-3 flex justify-center text-white/20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p className="text-sm text-white/40">
              {holdingTickers.length === 0
                ? 'Add positions to your portfolio to see earnings dates.'
                : 'No earnings scheduled for the selected period.'}
            </p>
          </div>
        )}

        {!isLoading && sortedDates.length > 0 && (
          <div>
            {sortedDates.map((dateStr) => (
              <DateGroup
                key={dateStr}
                dateStr={dateStr}
                events={grouped[dateStr]}
                holdingSet={holdingSet}
              />
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
