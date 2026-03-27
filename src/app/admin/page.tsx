'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

interface AdminStats {
  totalUsers: number | null;
  newUsers30d: number | null;
  activeSubscriptions: number;
  paidSubscriptions: number;
  newSubs30d: number;
  canceledSubs: number;
  newCanceled30d: number;
  planDistribution: Record<string, number>;
  mrr: number;
  arr: number;
  dailySignups: { date: string; count: number }[];
  generatedAt: string;
}

const PLAN_COLORS = { free: '#94a3b8', pro: '#22d3ee', advisor: '#a78bfa' };
const PLAN_PRICES = { free: 0, pro: 9.99, advisor: 29.99 };

function StatCard({ label, value, sub, color = 'text-white/80' }: {
  label: string; value: string | number; sub?: string; color?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-white/30 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const [secretKey, setSecretKey] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async (key: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/stats?key=${encodeURIComponent(key)}`);
      if (res.status === 401) {
        setError('Invalid admin key.');
        setAuthenticated(false);
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        setError(err.error ?? 'Failed to load stats');
        return;
      }
      const data = await res.json();
      setStats(data);
      setAuthenticated(true);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStats(secretKey);
  };

  // Auto-refresh every 2 minutes if authenticated
  useEffect(() => {
    if (!authenticated || !secretKey) return;
    const interval = setInterval(() => fetchStats(secretKey), 120_000);
    return () => clearInterval(interval);
  }, [authenticated, secretKey, fetchStats]);

  const fmt = (n: number) =>
    `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const planPieData = stats
    ? Object.entries(stats.planDistribution).map(([plan, count]) => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: count,
        color: PLAN_COLORS[plan as keyof typeof PLAN_COLORS] ?? '#64748b',
      }))
    : [];

  // ─── Login gate ──────────────────────────────────────────────────────────

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0d0d2b] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.04] p-8 space-y-5"
        >
          <div className="text-center">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/15 flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-white/90">StockDash Admin</h1>
            <p className="text-sm text-white/40 mt-1">Enter your admin key to continue</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder="Admin secret key"
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-cyan-500/40 placeholder-white/20"
              autoFocus
            />
            {error && <p className="text-xs text-rose-400">{error}</p>}
            <button
              type="submit"
              disabled={loading || !secretKey}
              className="w-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 rounded-xl py-3 text-sm font-semibold hover:bg-cyan-500/25 transition-colors disabled:opacity-50"
            >
              {loading ? 'Authenticating…' : 'Access Dashboard'}
            </button>
          </form>

          <p className="text-[11px] text-white/20 text-center">
            Set ADMIN_SECRET_KEY in Vercel environment variables
          </p>
        </motion.div>
      </div>
    );
  }

  // ─── Admin Dashboard ─────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0d0d2b] text-white p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white/90">StockDash Admin</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Analytics & Revenue Dashboard
            {stats?.generatedAt && (
              <span className="ml-2 text-white/20">
                · Updated {new Date(stats.generatedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchStats(secretKey)}
            disabled={loading}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/50 hover:text-white/80 hover:bg-white/[0.07] transition-all"
          >
            {loading ? '↻ Refreshing…' : '↻ Refresh'}
          </button>
          <button
            onClick={() => { setAuthenticated(false); setStats(null); setSecretKey(''); }}
            className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-white/40 hover:text-rose-400 transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>

      {loading && !stats && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-white/[0.07] bg-white/[0.04] h-24 animate-pulse" />
          ))}
        </div>
      )}

      {stats && (
        <>
          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="MRR" value={fmt(stats.mrr)} sub={`ARR: ${fmt(stats.arr)}`} color="text-emerald-400" />
            <StatCard label="Paid Subscribers" value={stats.paidSubscriptions} sub={`${stats.newSubs30d} new last 30d`} color="text-cyan-400" />
            <StatCard label="Total Users" value={stats.totalUsers ?? '—'} sub={stats.newUsers30d != null ? `${stats.newUsers30d} new last 30d` : undefined} />
            <StatCard label="Churned" value={stats.canceledSubs} sub={`${stats.newCanceled30d} last 30d`} color={stats.newCanceled30d > 0 ? 'text-rose-400' : 'text-white/70'} />
          </div>

          {/* Secondary metrics */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Active Subscriptions" value={stats.activeSubscriptions} />
            <StatCard
              label="Avg Revenue/User"
              value={stats.paidSubscriptions > 0 ? fmt(stats.mrr / stats.paidSubscriptions) : '—'}
              sub="per paid sub"
            />
            <StatCard
              label="Pro Plan"
              value={stats.planDistribution.pro ?? 0}
              sub={fmt((stats.planDistribution.pro ?? 0) * PLAN_PRICES.pro) + '/mo'}
              color="text-cyan-400"
            />
            <StatCard
              label="Advisor Plan"
              value={stats.planDistribution.advisor ?? 0}
              sub={fmt((stats.planDistribution.advisor ?? 0) * PLAN_PRICES.advisor) + '/mo'}
              color="text-violet-400"
            />
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">

            {/* Daily signups area chart */}
            <div className="lg:col-span-2 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
              <h2 className="text-sm font-semibold text-white/70 mb-4">New Signups (Last 30 Days)</h2>
              {stats.dailySignups.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-white/30">No signup data available</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={stats.dailySignups}>
                    <defs>
                      <linearGradient id="signupGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      tickFormatter={(v) => v.slice(5)}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={24}
                    />
                    <Tooltip
                      contentStyle={{ background: '#0f1020', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                      labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    />
                    <Area type="monotone" dataKey="count" stroke="#22d3ee" fill="url(#signupGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan distribution pie */}
            <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
              <h2 className="text-sm font-semibold text-white/70 mb-4">Plan Distribution</h2>
              {planPieData.every(p => p.value === 0) ? (
                <div className="h-40 flex items-center justify-center text-sm text-white/30">No subscribers yet</div>
              ) : (
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={planPieData} cx="50%" cy="45%" outerRadius={64} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={10}>
                      {planPieData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend formatter={(v) => <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }}>{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5">
            <h2 className="text-sm font-semibold text-white/70 mb-4">Revenue Breakdown by Plan</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {(['free', 'pro', 'advisor'] as const).map((plan) => {
                const count = stats.planDistribution[plan] ?? 0;
                const rev = count * PLAN_PRICES[plan];
                const pct = stats.mrr > 0 ? (rev / stats.mrr) * 100 : 0;
                return (
                  <div key={plan} className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: PLAN_COLORS[plan] }}>
                        {plan}
                      </span>
                      <span className="text-xs text-white/30">{count} users</span>
                    </div>
                    <p className="text-lg font-bold text-white/80">{fmt(rev)}<span className="text-xs text-white/30 ml-1">/mo</span></p>
                    {stats.mrr > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: PLAN_COLORS[plan] }} />
                        </div>
                        <p className="text-[11px] text-white/30 mt-1">{pct.toFixed(1)}% of MRR</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
