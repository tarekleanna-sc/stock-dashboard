'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSupabase } from '@/providers/SupabaseProvider';

export default function LoginPage() {
  const { supabase } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/15 ring-1 ring-green-500/25">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">My Portfolio</h1>
            <p className="mt-1 text-sm text-white/40">Sign in to your account</p>
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-8 backdrop-blur-2xl"
          style={{
            background: 'var(--glass-bg, rgba(255,255,255,0.06))',
            border: '1px solid var(--glass-border, rgba(255,255,255,0.10))',
            boxShadow: 'var(--glass-shadow, 0 8px 40px rgba(0,0,0,0.35))',
          }}
        >
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-white/40 uppercase">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-green-500/50 focus:ring-1 focus:ring-green-500/25"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold tracking-wide text-white/40 uppercase">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-green-500/50 focus:ring-1 focus:ring-green-500/25"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400 bg-rose-500/10 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-500/20 py-2.5 text-sm font-semibold text-green-400 ring-1 ring-green-500/30 transition-all hover:bg-green-500/30 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

        </div>

        <p className="mt-6 text-center text-xs text-white/20">
          Access is by invitation only
        </p>
      </motion.div>
    </div>
  );
}
