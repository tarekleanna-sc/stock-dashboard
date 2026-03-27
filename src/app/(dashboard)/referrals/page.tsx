'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/providers/SupabaseProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';

interface ReferralData {
  code: string;
  usedCount: number;
}

interface ReferralRow {
  id: string;
  referred_user_id: string;
  status: string;
  created_at: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://stock-dashboard-delta-seven.vercel.app';

const REWARDS = [
  { threshold: 1, label: '1 referral', reward: '1 month Pro free', icon: '🎁' },
  { threshold: 3, label: '3 referrals', reward: '3 months Pro free', icon: '🚀' },
  { threshold: 5, label: '5 referrals', reward: 'Advisor plan upgrade', icon: '⭐' },
  { threshold: 10, label: '10 referrals', reward: 'Lifetime discount 20%', icon: '💎' },
];

export default function ReferralsPage() {
  const { supabase, user } = useSupabase();
  const [referral, setReferral] = useState<ReferralData | null>(null);
  const [referrals, setReferrals] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Referral code input (for entering someone else's code)
  const [friendCode, setFriendCode] = useState('');
  const [codeApplied, setCodeApplied] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [applyingCode, setApplyingCode] = useState(false);

  const loadReferralData = useCallback(async () => {
    setLoading(true);
    try {
      // Get or create my referral code
      const res = await fetch('/api/referral/create', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReferral(data);
      } else {
        setError('Could not load referral code. Run the add_referrals.sql migration first.');
      }

      // Fetch my referral list
      const { data: rows } = await supabase
        .from('referrals')
        .select('id, referred_user_id, status, created_at')
        .eq('user_id', user?.id ?? '')
        .order('created_at', { ascending: false });

      setReferrals(rows ?? []);
    } finally {
      setLoading(false);
    }
  }, [supabase, user]);

  useEffect(() => {
    if (user) loadReferralData();
  }, [user, loadReferralData]);

  function copyLink() {
    if (!referral) return;
    const link = `${APP_URL}/auth/login?ref=${referral.code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  async function applyFriendCode() {
    if (!friendCode.trim()) return;
    setApplyingCode(true);
    setCodeError('');
    try {
      const res = await fetch('/api/referral/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: friendCode.trim() }),
      });
      if (res.ok) {
        setCodeApplied(true);
        setFriendCode('');
      } else {
        const err = await res.json();
        setCodeError(err.error ?? 'Failed to apply code');
      }
    } finally {
      setApplyingCode(false);
    }
  }

  const referredByCode = user?.user_metadata?.referred_by;
  const nextReward = REWARDS.find(r => (referral?.usedCount ?? 0) < r.threshold);

  const referralLink = referral ? `${APP_URL}/auth/login?ref=${referral.code}` : '';

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Refer & Earn</h1>
        <p className="text-sm text-white/40 mt-0.5">Invite friends — earn free months and plan upgrades</p>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-400/80">
          <span className="font-semibold">Setup needed:</span> {error}
          <br />Run <code className="bg-white/[0.06] px-1 rounded">supabase/migrations/add_referrals.sql</code> in your Supabase SQL editor.
        </div>
      )}

      {/* Referral code card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/[0.08] to-transparent p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">Your Referral Link</h2>

        {loading ? (
          <div className="h-12 rounded-xl bg-white/[0.05] animate-pulse" />
        ) : referral ? (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white/70 font-mono truncate">
                {referralLink}
              </div>
              <button
                onClick={copyLink}
                className={`flex-shrink-0 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                  copied
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                    : 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20'
                }`}
              >
                {copied ? '✓ Copied!' : 'Copy Link'}
              </button>
            </div>

            <div className="flex items-center gap-3 text-xs text-white/40">
              <span>Your code:</span>
              <span className="font-mono font-bold text-cyan-400 tracking-wider text-sm">{referral.code}</span>
              <span className="ml-auto">{referral.usedCount} friend{referral.usedCount !== 1 ? 's' : ''} joined</span>
            </div>
          </>
        ) : null}
      </motion.div>

      {/* Rewards ladder */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-3"
      >
        <h2 className="text-sm font-semibold text-white/70">Rewards</h2>
        <div className="space-y-2">
          {REWARDS.map((r) => {
            const achieved = (referral?.usedCount ?? 0) >= r.threshold;
            const isCurrent = nextReward?.threshold === r.threshold;
            return (
              <div
                key={r.threshold}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 border transition-all ${
                  achieved
                    ? 'border-emerald-500/30 bg-emerald-500/[0.07]'
                    : isCurrent
                    ? 'border-cyan-500/20 bg-cyan-500/[0.05]'
                    : 'border-white/[0.06] bg-white/[0.02]'
                }`}
              >
                <span className="text-xl flex-shrink-0">{r.icon}</span>
                <div className="flex-1">
                  <span className={`text-sm font-semibold ${achieved ? 'text-emerald-400' : 'text-white/70'}`}>
                    {r.reward}
                  </span>
                  <span className="text-xs text-white/30 ml-2">at {r.label}</span>
                </div>
                {achieved ? (
                  <span className="text-xs text-emerald-400 font-semibold">✓ Earned</span>
                ) : isCurrent ? (
                  <span className="text-xs text-cyan-400/70">
                    {r.threshold - (referral?.usedCount ?? 0)} more needed
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-white/20 pt-1">
          Rewards are applied manually — contact support@stockdash.app to claim.
        </p>
      </motion.div>

      {/* Progress bar to next reward */}
      {nextReward && referral && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4"
        >
          <div className="flex justify-between text-xs text-white/40 mb-2">
            <span>Progress to next reward</span>
            <span className="text-cyan-400">{referral.usedCount} / {nextReward.threshold} referrals</span>
          </div>
          <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min((referral.usedCount / nextReward.threshold) * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400"
            />
          </div>
          <p className="text-xs text-white/30 mt-2">
            {nextReward.threshold - referral.usedCount} more referral{nextReward.threshold - referral.usedCount !== 1 ? 's' : ''} to earn: {nextReward.reward}
          </p>
        </motion.div>
      )}

      {/* Referral history */}
      {referrals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl border border-white/[0.07] bg-white/[0.04] overflow-hidden"
        >
          <div className="px-5 py-4 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white/70">Referral History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Date', 'Status', 'ID'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs text-white/30 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {referrals.map((row) => (
                  <tr key={row.id} className="border-b border-white/[0.04]">
                    <td className="px-4 py-3 text-white/50 text-xs">{row.created_at.slice(0, 10)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${
                        row.status === 'rewarded'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-white/[0.07] text-white/40'
                      }`}>
                        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/25 font-mono text-[11px] truncate max-w-[120px]">{row.referred_user_id.slice(0, 12)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Enter a friend's code */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">
          Have a Friend's Code?
          {referredByCode && (
            <span className="ml-2 text-xs text-emerald-400 font-normal">✓ Code applied: {referredByCode}</span>
          )}
        </h2>

        {referredByCode ? (
          <p className="text-sm text-white/40">You already applied a referral code when you signed up.</p>
        ) : codeApplied ? (
          <p className="text-sm text-emerald-400">✓ Referral code applied! Your friend will be credited.</p>
        ) : (
          <div className="flex gap-2">
            <GlassInput
              placeholder="Enter referral code (e.g. SD-ABC123XYZ)"
              value={friendCode}
              onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
              className="flex-1 font-mono"
            />
            <GlassButton onClick={applyFriendCode} disabled={!friendCode || applyingCode}>
              {applyingCode ? 'Applying…' : 'Apply'}
            </GlassButton>
          </div>
        )}
        {codeError && <p className="text-xs text-rose-400">{codeError}</p>}
      </motion.div>

      {/* Share options */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-3"
      >
        <h2 className="text-sm font-semibold text-white/70">Share via</h2>
        <div className="flex flex-wrap gap-2">
          {referralLink && [
            {
              label: 'X / Twitter',
              href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Track your investments with StockDash — free portfolio dashboard. Use my link to get started: ${referralLink}`)}`,
              icon: '𝕏',
            },
            {
              label: 'LinkedIn',
              href: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(referralLink)}&title=StockDash+Portfolio+Tracker`,
              icon: 'in',
            },
            {
              label: 'Email',
              href: `mailto:?subject=Check out StockDash&body=${encodeURIComponent(`Hey, I've been using StockDash to track my investments — it's pretty great. Use my referral link to sign up free: ${referralLink}`)}`,
              icon: '✉',
            },
          ].map((share) => (
            <a
              key={share.label}
              href={share.href}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-white/50 hover:text-white/80 hover:border-white/20 transition-all"
            >
              <span className="font-mono text-xs font-bold">{share.icon}</span>
              {share.label}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
