'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';

type Mode = 'signin' | 'signup';

function LoginPageInner() {
  const { supabase } = useSupabase();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Capture referral code from URL param
  const refCode = searchParams.get('ref');

  useEffect(() => {
    // If there's a ref code, switch to signup mode to encourage registration
    if (refCode) setMode('signup');
  }, [refCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) {
          setError(error.message);
          setLoading(false);
        } else if (data.session) {
          // Email confirmation is OFF — user is immediately signed in.
          // onAuthStateChange in SupabaseProvider will handle the redirect.
          // Keep loading=true so the button stays in "Creating account…" state during navigation.
          const onboardingComplete = data.user?.user_metadata?.onboarding_completed === true;
          router.push(onboardingComplete ? '/dashboard' : '/onboarding');
        } else {
          // Email confirmation is ON — ask user to check their inbox.
          if (refCode && data.user) {
            try {
              await fetch('/api/referral/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: refCode }),
              });
            } catch { /* non-blocking */ }
          }
          setSuccessMsg('Account created! Check your email for a confirmation link, then sign in.');
          setMode('signin');
          setLoading(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setError(error.message);
          setLoading(false);
        } else {
          // onAuthStateChange in SupabaseProvider handles routing (checks onboarding).
          // Fallback push in case the event is slow.
          // Keep loading=true so the button stays in "Signing in…" state during navigation.
          const onboardingComplete = data.user?.user_metadata?.onboarding_completed === true;
          router.push(onboardingComplete ? '/dashboard' : '/onboarding');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  function switchMode(m: Mode) {
    setMode(m);
    setError('');
    setSuccessMsg('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090e] px-4">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.05] blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">StockDash</h1>
            <p className="mt-1 text-sm text-white/40">
              {mode === 'signin' ? 'Welcome back — sign in to continue' : 'Create your free account'}
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-white/[0.09] bg-white/[0.05] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">

          {/* Mode tabs */}
          <div className="mb-6 flex rounded-xl bg-white/[0.04] p-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className={`flex-1 rounded-lg py-2.5 text-xs font-semibold transition-all ${
                  mode === m
                    ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/25'
                    : 'text-white/50 hover:text-white/75'
                }`}
              >
                {m === 'signin' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/40">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-white/40">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={mode === 'signup' ? 6 : undefined}
                className="w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-white/20 outline-none transition-all focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/25"
              />
              {mode === 'signup' && (
                <p className="text-xs text-white/30">Minimum 6 characters</p>
              )}
            </div>

            {error && (
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-xs text-rose-400">{error}</p>
            )}
            {successMsg && (
              <p className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-400">{successMsg}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                : (mode === 'signin' ? 'Sign in' : 'Create free account')}
            </button>
          </form>

          {/* Inline mode-switch prompt */}
          <p className="mt-5 text-center text-xs text-white/35">
            {mode === 'signin' ? (
              <>
                Don&apos;t have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Create one free
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                >
                  Sign in →
                </button>
              </>
            )}
          </p>
        </div>

        {refCode && mode === 'signup' && (
          <p className="mt-3 text-center text-xs text-emerald-400/70">
            🎁 Referral code <span className="font-mono font-semibold">{refCode}</span> will be applied on signup
          </p>
        )}

        <p className="mt-5 text-center text-xs text-white/25">
          No credit card required · Free plan available
        </p>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-[#08090e]" />}>
      <LoginPageInner />
    </Suspense>
  );
}
