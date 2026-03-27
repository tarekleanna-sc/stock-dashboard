'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { useSupabase } from '@/providers/SupabaseProvider';

export default function DigestSettingsPage() {
  const { user } = useSupabase();
  const { enrichedPositions, totalValue } = usePortfolioValue();

  const [email, setEmail] = useState(user?.email ?? '');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<'success' | 'error' | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Build digest data from current portfolio
  const digestData = useMemo(() => {
    const sorted = [...enrichedPositions].sort(
      (a, b) => (b.dayChangePercent ?? 0) - (a.dayChangePercent ?? 0)
    );
    const topGainers = sorted
      .filter((p) => (p.dayChangePercent ?? 0) > 0)
      .slice(0, 5)
      .map((p) => ({ ticker: p.ticker, pct: p.dayChangePercent ?? 0 }));
    const topLosers = sorted
      .filter((p) => (p.dayChangePercent ?? 0) < 0)
      .slice(-5)
      .reverse()
      .map((p) => ({ ticker: p.ticker, pct: p.dayChangePercent ?? 0 }));
    const holdings = [...enrichedPositions]
      .sort((a, b) => (b.marketValue ?? 0) - (a.marketValue ?? 0))
      .slice(0, 10)
      .map((p) => ({
        ticker: p.ticker,
        marketValue: p.marketValue ?? 0,
        gainLossPct: p.gainLossPercent ?? 0,
      }));

    // Approximate week change from day changes (best available without snapshot history)
    const weekChange = enrichedPositions.reduce(
      (s, p) => s + (p.dayChange ?? 0) * p.shares, 0
    );
    const weekChangePct = totalValue > 0 ? (weekChange / totalValue) * 100 : 0;

    return { totalValue, weekChange, weekChangePct, topGainers, topLosers, holdings };
  }, [enrichedPositions, totalValue]);

  async function sendDigest() {
    if (!email || !user) return;
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/digest/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          toEmail: email,
          ...digestData,
        }),
      });
      if (res.ok) {
        setResult('success');
      } else {
        const err = await res.json();
        setErrorMsg(err.error ?? 'Failed to send');
        setResult('error');
      }
    } catch (e) {
      setErrorMsg(String(e));
      setResult('error');
    } finally {
      setSending(false);
    }
  }

  const isResendConfigured = true; // We don't know server env from client, so always show UI

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Email Digest</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Send a weekly portfolio summary to your inbox
        </p>
      </div>

      {/* Preview card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">Digest Preview</h2>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 space-y-4">
          {/* Simulated email header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
            <span className="text-sm font-bold text-cyan-400">StockDash</span>
            <span className="text-xs text-white/30">Weekly Portfolio Digest</span>
          </div>

          {/* Total value */}
          <div>
            <p className="text-xs text-white/40 mb-1">Total Portfolio Value</p>
            <p className="text-2xl font-bold text-white/90">
              ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold mt-2 ${
              (digestData.weekChange ?? 0) >= 0
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-rose-500/15 text-rose-400'
            }`}>
              {(digestData.weekChange ?? 0) >= 0 ? '▲' : '▼'}{' '}
              {digestData.weekChangePct >= 0 ? '+' : ''}{digestData.weekChangePct.toFixed(2)}% today
            </span>
          </div>

          {/* Top movers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-400 mb-2">▲ Top Gainers</p>
              {digestData.topGainers.length === 0 ? (
                <p className="text-xs text-white/30">None today</p>
              ) : (
                digestData.topGainers.slice(0, 3).map((g) => (
                  <div key={g.ticker} className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-white/70">{g.ticker}</span>
                    <span className="text-emerald-400">+{g.pct.toFixed(2)}%</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-400 mb-2">▼ Top Losers</p>
              {digestData.topLosers.length === 0 ? (
                <p className="text-xs text-white/30">None today</p>
              ) : (
                digestData.topLosers.slice(0, 3).map((l) => (
                  <div key={l.ticker} className="flex justify-between text-xs mb-1">
                    <span className="font-semibold text-white/70">{l.ticker}</span>
                    <span className="text-rose-400">{l.pct.toFixed(2)}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Send form */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">Send Digest Now</h2>

        {/* Setup info */}
        <GlassCard padding="sm" className="bg-amber-500/[0.04] border-amber-500/15">
          <p className="text-xs text-amber-400/80 leading-relaxed">
            <span className="font-semibold">Setup required:</span> Add{' '}
            <code className="bg-white/[0.08] px-1 rounded text-amber-300">RESEND_API_KEY</code> to your Vercel environment variables to enable email sending.
            Get a free API key at <a href="https://resend.com" target="_blank" rel="noreferrer" className="underline text-amber-300">resend.com</a>.
          </p>
        </GlassCard>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Send to email</label>
          <GlassInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
          />
        </div>

        <div className="flex items-center gap-3">
          <GlassButton
            onClick={sendDigest}
            disabled={sending || !email || enrichedPositions.length === 0}
          >
            {sending ? 'Sending…' : 'Send Test Digest'}
          </GlassButton>

          {result === 'success' && (
            <span className="text-sm text-emerald-400 flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Digest sent!
            </span>
          )}
          {result === 'error' && (
            <span className="text-sm text-rose-400">{errorMsg}</span>
          )}
        </div>
      </motion.div>

      {/* Scheduled digest info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5"
      >
        <h2 className="text-sm font-semibold text-white/70 mb-3">Automated Weekly Schedule</h2>
        <p className="text-xs text-white/40 leading-relaxed mb-4">
          To send a digest every Monday morning automatically, deploy a Supabase Edge Function
          or use a cron job service (e.g., Vercel Cron) that calls <code className="text-white/60 bg-white/[0.06] px-1.5 py-0.5 rounded text-[11px]">POST /api/digest/send</code> weekly.
        </p>
        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 font-mono text-xs text-white/50 leading-relaxed">
          <p className="text-white/30 mb-1"># vercel.json — add cron</p>
          <p>{'"crons": [{'}</p>
          <p className="pl-4">{'"path": "/api/digest/cron",'}</p>
          <p className="pl-4">{'"schedule": "0 9 * * 1"'}</p>
          <p>{'}]'}</p>
        </div>
      </motion.div>
    </div>
  );
}
