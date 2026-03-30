'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabase } from '@/providers/SupabaseProvider';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { BROKER_LABELS, ACCOUNT_TYPE_LABELS, BrokerName, AccountType } from '@/types/portfolio';

// ─── Types ───────────────────────────────────────────────────────────────────

type UserRole = 'individual' | 'advisor';

interface AccountDraft {
  name: string;
  broker: BrokerName;
  accountType: AccountType;
  cashBalance: number;
}

interface PositionDraft {
  ticker: string;
  shares: string;
  costBasis: string;
}

// ─── Step indicators ─────────────────────────────────────────────────────────

const STEPS = ['Welcome', 'Add Account', 'Add Position', 'All set!'];

function StepDots({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                i < current
                  ? 'bg-emerald-500 text-white'
                  : i === current
                  ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                  : 'bg-white/[0.06] text-white/30'
              }`}
            >
              {i < current ? (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2.5 6.5L5 9L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`text-xs transition-colors ${i === current ? 'text-white/70' : 'text-white/25'}`}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`mb-5 h-px w-8 transition-all duration-500 ${i < current ? 'bg-emerald-500/60' : 'bg-white/[0.08]'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Step 0: Welcome ─────────────────────────────────────────────────────────

function StepWelcome({ onNext, role, setRole }: {
  onNext: () => void;
  role: UserRole | null;
  setRole: (r: UserRole) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/25">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white">Welcome to StockDash</h1>
        <p className="mt-2 text-white/55">Let's get your portfolio set up in under 2 minutes.</p>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-white/70">How would you describe yourself?</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {
              key: 'individual' as UserRole,
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              ),
              label: 'Individual Investor',
              sub: 'Managing my own accounts',
            },
            {
              key: 'advisor' as UserRole,
              icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ),
              label: 'Financial Advisor',
              sub: 'Managing client portfolios',
            },
          ].map((option) => (
            <button
              key={option.key}
              onClick={() => setRole(option.key)}
              className={`flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                role === option.key
                  ? 'border-emerald-500/40 bg-emerald-500/[0.08]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.15] hover:bg-white/[0.05]'
              }`}
            >
              <div className={`${role === option.key ? 'text-emerald-400' : 'text-white/50'}`}>
                {option.icon}
              </div>
              <div>
                <div className="text-sm font-medium text-white">{option.label}</div>
                <div className="text-xs text-white/45 mt-0.5">{option.sub}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!role}
        className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Continue →
      </button>
    </div>
  );
}

// ─── Step 1: Add Account ──────────────────────────────────────────────────────

function StepAddAccount({ onNext, onSkip, draft, setDraft, saving }: {
  onNext: () => void;
  onSkip: () => void;
  draft: AccountDraft;
  setDraft: (d: AccountDraft) => void;
  saving: boolean;
}) {
  const brokerOptions = Object.entries(BROKER_LABELS) as [BrokerName, string][];
  const typeOptions = Object.entries(ACCOUNT_TYPE_LABELS) as [AccountType, string][];

  const isValid = draft.name.trim().length > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Add your first account</h2>
        <p className="mt-1 text-sm text-white/50">You can add more accounts later from the Portfolio page.</p>
      </div>

      {/* Account name */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/60">Account Name</label>
        <input
          value={draft.name}
          onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          placeholder="e.g. My Fidelity IRA"
          className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/25 outline-none backdrop-blur-xl transition-colors focus:border-emerald-500/50 focus:bg-white/[0.07]"
        />
      </div>

      {/* Broker */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/60">Brokerage</label>
        <select
          value={draft.broker}
          onChange={(e) => setDraft({ ...draft, broker: e.target.value as BrokerName })}
          className="w-full rounded-xl border border-white/[0.10] bg-[#0f1117] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-emerald-500/50"
        >
          {brokerOptions.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {/* Account type */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/60">Account Type</label>
        <div className="grid grid-cols-2 gap-2">
          {typeOptions.map(([value, label]) => (
            <button
              key={value}
              onClick={() => setDraft({ ...draft, accountType: value })}
              className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-all ${
                draft.accountType === value
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/50 hover:border-white/[0.15] hover:text-white/70'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Cash balance */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-medium text-white/60">Cash Balance (optional)</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/40">$</span>
          <input
            type="number"
            value={draft.cashBalance || ''}
            onChange={(e) => setDraft({ ...draft, cashBalance: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] py-3 pl-8 pr-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-emerald-500/50"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          disabled={saving}
          className="flex-1 rounded-xl border border-white/[0.10] bg-transparent py-3 text-sm text-white/50 transition-all hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Skip for now
        </button>
        <button
          onClick={onNext}
          disabled={!isValid || saving}
          className="flex-[2] rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Creating…' : 'Create Account →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 2: Add Position ─────────────────────────────────────────────────────

function StepAddPosition({ onNext, onSkip, draft, setDraft, accountName, saving }: {
  onNext: () => void;
  onSkip: () => void;
  draft: PositionDraft;
  setDraft: (d: PositionDraft) => void;
  accountName: string;
  saving: boolean;
}) {
  const isValid = draft.ticker.trim().length > 0 &&
    parseFloat(draft.shares) > 0 &&
    parseFloat(draft.costBasis) > 0;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-bold text-white">Add your first holding</h2>
        <p className="mt-1 text-sm text-white/50">
          Add a position to <span className="text-white/80">{accountName}</span> to see live tracking right away.
        </p>
      </div>

      {/* Quick picks */}
      <div>
        <p className="mb-2 text-xs text-white/40">Popular tickers</p>
        <div className="flex flex-wrap gap-2">
          {['AAPL', 'MSFT', 'NVDA', 'GOOGL', 'AMZN', 'SPY', 'QQQ', 'VTI'].map((t) => (
            <button
              key={t}
              onClick={() => setDraft({ ...draft, ticker: t })}
              className={`rounded-lg border px-3 py-1 text-xs transition-all ${
                draft.ticker === t
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                  : 'border-white/[0.08] bg-white/[0.03] text-white/45 hover:border-white/[0.15] hover:text-white/70'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Ticker */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60">Ticker Symbol</label>
          <input
            value={draft.ticker}
            onChange={(e) => setDraft({ ...draft, ticker: e.target.value.toUpperCase() })}
            placeholder="AAPL"
            maxLength={10}
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-3 text-sm font-mono text-white placeholder-white/25 outline-none uppercase transition-colors focus:border-emerald-500/50"
          />
        </div>

        {/* Shares */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60">Shares</label>
          <input
            type="number"
            value={draft.shares}
            onChange={(e) => setDraft({ ...draft, shares: e.target.value })}
            placeholder="10"
            min="0.001"
            step="0.001"
            className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] px-4 py-3 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-emerald-500/50"
          />
        </div>

        {/* Avg cost */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-white/60">Avg Cost / Share</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-white/40">$</span>
            <input
              type="number"
              value={draft.costBasis}
              onChange={(e) => setDraft({ ...draft, costBasis: e.target.value })}
              placeholder="150.00"
              min="0.01"
              step="0.01"
              className="w-full rounded-xl border border-white/[0.10] bg-white/[0.05] py-3 pl-7 pr-4 text-sm text-white placeholder-white/25 outline-none transition-colors focus:border-emerald-500/50"
            />
          </div>
        </div>
      </div>

      {/* Estimated value preview */}
      {isValid && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3">
          <div className="text-xs text-emerald-400/70">Estimated cost basis</div>
          <div className="text-base font-semibold text-emerald-300">
            ${(parseFloat(draft.shares) * parseFloat(draft.costBasis)).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={onSkip}
          disabled={saving}
          className="flex-1 rounded-xl border border-white/[0.10] bg-transparent py-3 text-sm text-white/50 transition-all hover:bg-white/[0.05] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Skip for now
        </button>
        <button
          onClick={onNext}
          disabled={!isValid || saving}
          className="flex-[2] rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? 'Adding…' : 'Add Position →'}
        </button>
      </div>
    </div>
  );
}

// ─── Step 3: Done ─────────────────────────────────────────────────────────────

function StepDone({ role, accountCreated, positionAdded, onGoToDashboard, navigating }: {
  role: UserRole | null;
  accountCreated: boolean;
  positionAdded: boolean;
  onGoToDashboard: () => void;
  navigating: boolean;
}) {
  const nextSteps = [
    { done: accountCreated, label: 'Add more brokerage accounts', link: '/portfolio' },
    { done: positionAdded, label: 'Import positions via CSV', link: '/portfolio' },
    ...(role === 'advisor' ? [{ done: false, label: 'Add your first client', link: '/clients' }] : []),
    { done: false, label: 'Set price alerts', link: '/alerts' },
    { done: false, label: 'Explore charts & analytics', link: '/charts' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        {/* Checkmark animation */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-4 flex justify-center"
        >
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
              <path
                d="M8 18L15 25L28 11"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </motion.div>

        <h2 className="text-2xl font-bold text-white">You're all set!</h2>
        <p className="mt-2 text-sm text-white/55">
          {accountCreated && positionAdded
            ? 'Your account and first position are ready. Live data will load on the dashboard.'
            : accountCreated
            ? 'Your account is ready. Add positions any time from the Portfolio page.'
            : "Your dashboard is ready. Add accounts and positions to start tracking."}
        </p>
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap justify-center gap-2">
        {accountCreated && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0a5 5 0 100 10A5 5 0 005 0zm2.28 3.97L4.5 6.75l-1.78-1.8.71-.7L4.5 5.33l2.07-2.07.71.71z" /></svg>
            Account created
          </span>
        )}
        {positionAdded && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><path d="M5 0a5 5 0 100 10A5 5 0 005 0zm2.28 3.97L4.5 6.75l-1.78-1.8.71-.7L4.5 5.33l2.07-2.07.71.71z" /></svg>
            First position added
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-xs text-white/50">
          Live market data: on
        </span>
      </div>

      {/* Next step suggestions */}
      <div>
        <p className="mb-3 text-xs font-medium text-white/45">What to do next</p>
        <div className="flex flex-col gap-2">
          {nextSteps.slice(0, 4).map((step) => (
            <div key={step.label} className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3">
              <div className={`h-1.5 w-1.5 rounded-full ${step.done ? 'bg-emerald-500' : 'bg-white/20'}`} />
              <span className="text-sm text-white/60">{step.label}</span>
              <span className="ml-auto text-xs text-white/25">{step.link}</span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onGoToDashboard}
        disabled={navigating}
        className="w-full rounded-xl bg-emerald-500 py-3.5 text-sm font-semibold text-white transition-all hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {navigating ? 'Loading dashboard…' : 'Go to Dashboard →'}
      </button>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const { supabase, user } = useSupabase();
  const { addAccount, addPosition } = usePortfolioStore();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [role, setRole] = useState<UserRole | null>(null);

  const [accountDraft, setAccountDraft] = useState<AccountDraft>({
    name: '',
    broker: 'fidelity',
    accountType: 'brokerage',
    cashBalance: 0,
  });

  const [positionDraft, setPositionDraft] = useState<PositionDraft>({
    ticker: '',
    shares: '',
    costBasis: '',
  });

  const [createdAccountId, setCreatedAccountId] = useState<string | null>(null);
  const [accountCreated, setAccountCreated] = useState(false);
  const [positionAdded, setPositionAdded] = useState(false);

  async function markOnboardingComplete() {
    if (!user) return;
    await supabase.auth.updateUser({
      data: { onboarding_completed: true, role },
    });
  }

  async function handleAccountNext() {
    if (!user) return;
    setSaving(true);
    setError('');
    try {
      const accountId = await addAccount(
        {
          name: accountDraft.name,
          broker: accountDraft.broker,
          accountType: accountDraft.accountType,
          cashBalance: accountDraft.cashBalance,
        },
        supabase,
        user.id,
      );
      setCreatedAccountId(accountId);
      setAccountCreated(true);
      setStep(2);
    } catch (e) {
      setError('Failed to create account. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function handlePositionNext() {
    if (!user) return;
    // If account was skipped, no accountId exists — just mark complete and proceed
    if (!createdAccountId) {
      await skipToComplete();
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addPosition(
        {
          accountId: createdAccountId,
          ticker: positionDraft.ticker.trim().toUpperCase(),
          shares: parseFloat(positionDraft.shares),
          costBasisPerShare: parseFloat(positionDraft.costBasis),
        },
        supabase,
        user.id,
      );
      setPositionAdded(true);
      await markOnboardingComplete();
      setStep(3);
    } catch (e) {
      setError('Failed to add position. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  const [navigating, setNavigating] = useState(false);

  async function handleGoToDashboard() {
    setNavigating(true);
    try {
      await markOnboardingComplete();
    } catch { /* non-blocking — always navigate */ }
    // Full page navigation so server middleware sees the updated user metadata.
    window.location.href = '/dashboard';
  }

  function skipToStep3() {
    setStep(2);
  }

  async function skipToComplete() {
    try {
      await markOnboardingComplete();
    } catch { /* non-blocking */ }
    setStep(3);
  }

  const slideVariants = {
    enter: { opacity: 0, x: 40 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -40 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#08090e] px-6 py-16">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.05] blur-[100px]" />
      </div>

      <div className="relative w-full max-w-xl">
        {/* Progress */}
        {step < 3 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex justify-center"
          >
            <StepDots current={step} />
          </motion.div>
        )}

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-white/[0.09] bg-white/[0.04] shadow-[0_24px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
          <div className="p-8">
            {error && (
              <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
                {error}
              </div>
            )}

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step0"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <StepWelcome
                    onNext={() => setStep(1)}
                    role={role}
                    setRole={setRole}
                  />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step1"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <StepAddAccount
                    onNext={handleAccountNext}
                    onSkip={skipToStep3}
                    draft={accountDraft}
                    setDraft={setAccountDraft}
                    saving={saving}
                  />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <StepAddPosition
                    onNext={handlePositionNext}
                    onSkip={skipToComplete}
                    draft={positionDraft}
                    setDraft={setPositionDraft}
                    accountName={accountDraft.name || 'your account'}
                    saving={saving}
                  />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                >
                  <StepDone
                    role={role}
                    accountCreated={accountCreated}
                    positionAdded={positionAdded}
                    onGoToDashboard={handleGoToDashboard}
                    navigating={navigating}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Skip link */}
        {step < 3 && (
          <div className="mt-5 text-center">
            <button
              onClick={handleGoToDashboard}
              disabled={saving || navigating}
              className="text-xs text-white/30 transition-colors hover:text-white/55 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {navigating ? 'Loading dashboard…' : 'Skip setup and go straight to dashboard →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
