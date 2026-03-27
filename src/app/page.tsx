'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import { PLANS } from '@/types/billing';

// ─── Helpers ────────────────────────────────────────────────────────────────

function CheckIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.15" />
      <path d="M4.5 8.5L7 11L11.5 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="8" fill="currentColor" fillOpacity="0.08" />
      <path d="M5.5 5.5L10.5 10.5M10.5 5.5L5.5 10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/25 shrink-0"
    >
      <svg
        width={size * 0.55}
        height={size * 0.55}
        viewBox="0 0 24 24"
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
        <polyline points="16 7 22 7 22 13" />
      </svg>
    </div>
  );
}

// ─── Nav ────────────────────────────────────────────────────────────────────

function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#08090e]/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <LogoMark size={34} />
          <span className="text-lg font-semibold tracking-tight text-white">StockDash</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-white/60 transition-colors hover:text-white">Features</a>
          <a href="#pricing" className="text-sm text-white/60 transition-colors hover:text-white">Pricing</a>
          <a href="#faq" className="text-sm text-white/60 transition-colors hover:text-white">FAQ</a>
        </div>

        {/* CTA buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <Link href="/auth/login" className="text-sm text-white/70 transition-colors hover:text-white">
            Sign in
          </Link>
          <Link
            href="/auth/login"
            className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-emerald-400 hover:shadow-lg hover:shadow-emerald-500/25"
          >
            Get started free
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] md:hidden"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            {menuOpen ? (
              <path d="M3 3L15 15M15 3L3 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            ) : (
              <>
                <line x1="3" y1="6" x2="15" y2="6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="3" y1="12" x2="15" y2="12" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-t border-white/[0.06] bg-[#08090e]/95 px-6 pb-5 pt-4 md:hidden"
        >
          <div className="flex flex-col gap-4">
            <a href="#features" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#pricing" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="text-sm text-white/70" onClick={() => setMenuOpen(false)}>FAQ</a>
            <div className="flex flex-col gap-2 border-t border-white/[0.06] pt-3">
              <Link href="/auth/login" className="rounded-xl border border-white/[0.12] px-4 py-2.5 text-center text-sm text-white">
                Sign in
              </Link>
              <Link href="/auth/login" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-center text-sm font-medium text-white">
                Get started free
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </nav>
  );
}

// ─── Hero ────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-16 pt-24 text-center">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.05] blur-[120px]" />
        <div className="absolute left-1/3 top-2/3 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/[0.04] blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative max-w-4xl"
      >
        {/* Live badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-4 py-1.5"
        >
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
          <span className="text-xs font-medium tracking-wide text-emerald-300">
            Live market data · Real-time portfolio tracking
          </span>
        </motion.div>

        {/* Headline */}
        <h1 className="mb-6 text-5xl font-bold leading-[1.1] tracking-tight text-white md:text-6xl lg:text-7xl">
          Your entire portfolio.{' '}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 bg-clip-text text-transparent">
            One dashboard.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/55 md:text-xl">
          Track every account, monitor live prices, analyze risk, and grow your wealth — all in a beautifully designed dashboard built for investors and financial advisors.
        </p>

        {/* CTA row */}
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/auth/login"
            className="group inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/25 transition-all hover:-translate-y-0.5 hover:bg-emerald-400 hover:shadow-emerald-500/40"
          >
            Start for free
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-0.5">
              <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <a
            href="#features"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/[0.12] bg-white/[0.05] px-8 py-4 text-base font-medium text-white/80 backdrop-blur-xl transition-all hover:bg-white/[0.09] hover:text-white"
          >
            See how it works
          </a>
        </div>
        <p className="mt-5 text-sm text-white/35">Free plan available · No credit card required</p>
      </motion.div>

      {/* Dashboard screenshot mockup */}
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.35, duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative mt-16 w-full max-w-5xl"
      >
        <div className="absolute -inset-4 rounded-3xl bg-emerald-500/[0.07] blur-2xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.1] bg-white/[0.04] shadow-[0_32px_80px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] px-5 py-3.5">
            <div className="h-3 w-3 rounded-full bg-red-500/60" />
            <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/60" />
            <div className="mx-auto flex items-center gap-2 rounded-lg bg-white/[0.06] px-4 py-1">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="white" strokeOpacity="0.4" />
                <path d="M4 6L6 8L9 4" stroke="#10b981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="text-xs text-white/40">stock-dashboard-delta-seven.vercel.app/dashboard</span>
            </div>
          </div>

          {/* Mock content */}
          <div className="p-5">
            {/* Stat cards */}
            <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Portfolio Value', value: '$284,521', change: '+$12,408', up: true },
                { label: 'Day Gain', value: '+$1,832', change: '+0.65%', up: true },
                { label: 'Total Return', value: '+$48,241', change: '+20.4%', up: true },
                { label: 'Annual Yield', value: '2.8%', change: '$7,967/yr', up: true },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-3">
                  <div className="mb-1 text-xs text-white/40">{stat.label}</div>
                  <div className="text-base font-semibold text-white">{stat.value}</div>
                  <div className={`mt-0.5 text-xs ${stat.up ? 'text-emerald-400' : 'text-rose-400'}`}>{stat.change}</div>
                </div>
              ))}
            </div>

            {/* Performance chart */}
            <div className="mb-4 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="text-sm text-white/60">Portfolio Performance</span>
                <div className="flex gap-1">
                  {['1M', '3M', '6M', '1Y', 'All'].map((r, i) => (
                    <span
                      key={r}
                      className={`rounded-md px-2 py-0.5 text-xs ${i === 3 ? 'bg-emerald-500/20 text-emerald-400' : 'text-white/30'}`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <svg viewBox="0 0 600 100" className="h-20 w-full" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="heroGreenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M0,90 C30,85 60,78 100,70 C140,62 160,58 200,48 C240,38 260,43 300,30 C340,20 370,22 410,13 C450,6 480,8 520,3 C545,1 570,1 600,0 L600,100 L0,100 Z"
                  fill="url(#heroGreenGrad)"
                />
                <path
                  d="M0,90 C30,85 60,78 100,70 C140,62 160,58 200,48 C240,38 260,43 300,30 C340,20 370,22 410,13 C450,6 480,8 520,3 C545,1 570,1 600,0"
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2"
                />
                <path
                  d="M0,95 C40,90 80,84 120,78 C160,72 200,68 240,62 C280,56 320,50 360,45 C400,40 440,35 480,30 C520,26 560,20 600,16"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  opacity="0.5"
                />
              </svg>
              <div className="mt-2 flex gap-4">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-4 rounded-full bg-emerald-500" />
                  <span className="text-xs text-white/40">Portfolio</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-4 rounded-full bg-indigo-500 opacity-60" />
                  <span className="text-xs text-white/40">SPY</span>
                </div>
              </div>
            </div>

            {/* Holdings list */}
            <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.03]">
              <div className="border-b border-white/[0.06] px-4 py-2.5">
                <span className="text-xs font-medium text-white/50">Holdings</span>
              </div>
              {[
                { ticker: 'AAPL', name: 'Apple Inc.', shares: '42', value: '$8,412', gain: '+$2,108', pct: '+33.4%', up: true, color: '#888' },
                { ticker: 'NVDA', name: 'NVIDIA Corp.', shares: '8', value: '$7,629', gain: '+$4,245', pct: '+125.7%', up: true, color: '#76b900' },
                { ticker: 'MSFT', name: 'Microsoft', shares: '20', value: '$6,840', gain: '+$1,520', pct: '+28.6%', up: true, color: '#00a4ef' },
                { ticker: 'TSLA', name: 'Tesla Inc.', shares: '15', value: '$3,210', gain: '-$390', pct: '-10.8%', up: false, color: '#cc0000' },
              ].map((h) => (
                <div key={h.ticker} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-white/[0.03]">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{ background: `${h.color}20`, color: h.color }}
                  >
                    {h.ticker.slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-white">{h.ticker}</div>
                    <div className="truncate text-xs text-white/35">{h.name}</div>
                  </div>
                  <div className="hidden text-right sm:block">
                    <div className="text-sm text-white">{h.value}</div>
                    <div className="text-xs text-white/35">{h.shares} shares</div>
                  </div>
                  <div className={`ml-4 text-right ${h.up ? 'text-emerald-400' : 'text-rose-400'}`}>
                    <div className="text-sm font-medium">{h.pct}</div>
                    <div className="text-xs opacity-70">{h.gain}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 3v18h18" /><path d="M7 16l4-4 4 4 4-8" />
      </svg>
    ),
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    ring: 'ring-emerald-500/20',
    title: 'Live Portfolio Tracking',
    description: 'Real-time quotes from Finnhub & FMP. Every holding updated the moment you open your dashboard.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    ring: 'ring-cyan-500/20',
    title: 'Multiple Brokerage Accounts',
    description: 'Consolidate Fidelity, Schwab, TD Ameritrade, IBKR and more in a single unified view.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" />
      </svg>
    ),
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    ring: 'ring-violet-500/20',
    title: 'Advanced Risk Analytics',
    description: 'Beta, Sharpe ratio, max drawdown, volatility, benchmark overlay — the full toolkit for serious analysis.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8h1a4 4 0 0 1 0 8h-1" /><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
      </svg>
    ),
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    ring: 'ring-amber-500/20',
    title: 'Dividend Tracking',
    description: 'Track yield, annual income estimates and ex-dividend dates across your entire portfolio automatically.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10" /><circle cx="18" cy="7" r="3" /><path d="M6 20v-4" /><circle cx="6" cy="13" r="3" /><path d="M12 20V13" /><circle cx="12" cy="10" r="3" />
      </svg>
    ),
    color: 'text-rose-400',
    bg: 'bg-rose-500/10',
    ring: 'ring-rose-500/20',
    title: 'Price Alerts',
    description: 'Set target price thresholds and get in-app notifications the moment a stock hits your level.',
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    ring: 'ring-sky-500/20',
    title: 'Multi-Client Advisor Mode',
    description: 'Manage portfolios for all your clients from one dashboard — built for RIAs and financial advisors.',
  },
];

function FeaturesSection() {
  return (
    <section id="features" className="relative py-28 px-6">
      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-white/50">Features</span>
          </div>
          <h2 className="mb-5 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              invest smarter
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-white/50">
            From live price tracking to advanced risk analytics — StockDash gives individual investors and professional advisors the tools they actually need.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.07, duration: 0.55 }}
              className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl transition-all hover:border-white/[0.14] hover:bg-white/[0.05]"
            >
              <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg} ${feature.color} ring-1 ${feature.ring}`}>
                {feature.icon}
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-white/50">{feature.description}</p>
              <div className={`pointer-events-none absolute -bottom-10 -right-10 h-32 w-32 rounded-full ${feature.bg} blur-3xl opacity-0 transition-opacity group-hover:opacity-100`} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Social Proof ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  {
    quote: "Finally a dashboard that shows all my Fidelity and Schwab accounts together. The risk metrics alone are worth the Pro upgrade.",
    name: "Michael T.",
    role: "Self-directed investor",
    avatar: "MT",
    color: "#10b981",
  },
  {
    quote: "I switched from spreadsheets to StockDash and haven't looked back. The benchmark overlay shows exactly how I'm doing vs SPY.",
    name: "Sarah K.",
    role: "Active portfolio manager",
    avatar: "SK",
    color: "#6366f1",
  },
  {
    quote: "The advisor mode is perfect for my practice. I pull up any client's portfolio in seconds and generate a branded PDF on the spot.",
    name: "David R.",
    role: "Registered Investment Advisor",
    avatar: "DR",
    color: "#f59e0b",
  },
];

function SocialProofSection() {
  return (
    <section className="relative overflow-hidden py-20 px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-500/[0.04] blur-[100px]" />
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-white md:text-4xl">
            Trusted by investors
          </h2>
          <p className="mt-3 text-white/45">From home-office traders to professional RIAs</p>
        </motion.div>

        <div className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
            >
              <div className="mb-4 flex gap-1">
                {[...Array(5)].map((_, si) => (
                  <svg key={si} width="14" height="14" viewBox="0 0 14 14" fill="#f59e0b">
                    <path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.3l-3.7 2 .7-4.1-3-2.9 4.2-.7z" />
                  </svg>
                ))}
              </div>
              <p className="mb-5 text-sm italic leading-relaxed text-white/65">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold"
                  style={{ background: `${t.color}20`, color: t.color }}
                >
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-medium text-white">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-10 grid grid-cols-3 gap-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6"
        >
          {[
            { value: '$2.4M+', label: 'Portfolio value tracked' },
            { value: '3 tiers', label: 'Free, Pro & Advisor plans' },
            { value: 'Real-time', label: 'Live market data' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="mt-1 text-sm text-white/40">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PricingSection() {
  return (
    <section id="pricing" className="relative py-28 px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[1000px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/[0.04] blur-[120px]" />
      <div className="relative mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-1.5">
            <span className="text-xs font-medium uppercase tracking-wide text-white/50">Pricing</span>
          </div>
          <h2 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-white/50">Start free. Upgrade when you need more power.</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ delay: i * 0.1, duration: 0.55 }}
              className={`relative flex flex-col rounded-2xl border p-7 backdrop-blur-xl transition-all ${
                plan.highlight
                  ? 'border-emerald-500/40 bg-emerald-500/[0.06] shadow-[0_0_60px_rgba(16,185,129,0.12)]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.14]'
              }`}
            >
              {plan.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full px-3 py-0.5 text-xs font-semibold ${
                    plan.highlight ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                  }`}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                <p className="mt-1 text-sm text-white/45">{plan.description}</p>
                <div className="mt-4 flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="text-4xl font-bold text-white">Free</span>
                  ) : (
                    <>
                      <span className="text-4xl font-bold text-white">${plan.price}</span>
                      <span className="text-sm text-white/45">/month</span>
                    </>
                  )}
                </div>
              </div>

              <ul className="mb-8 flex flex-1 flex-col gap-3">
                {plan.features.map((feature) => (
                  <li key={feature.text} className="flex items-start gap-2.5">
                    {feature.included ? (
                      <CheckIcon className={`mt-0.5 shrink-0 ${plan.highlight ? 'text-emerald-400' : 'text-white/50'}`} />
                    ) : (
                      <XIcon className="mt-0.5 shrink-0 text-white/20" />
                    )}
                    <span className={`text-sm ${feature.included ? 'text-white/80' : 'text-white/30'}`}>
                      {feature.text}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href="/auth/login"
                className={`block w-full rounded-xl py-3 text-center text-sm font-semibold transition-all ${
                  plan.highlight
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-500/40'
                    : 'border border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.10]'
                }`}
              >
                {plan.price === 0 ? 'Get started free' : `Start ${plan.name}`}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'Is my portfolio data secure?',
    a: 'Yes. Your data is stored in Supabase (Postgres) with row-level security — only you can access your accounts and positions. We never store brokerage credentials.',
  },
  {
    q: 'Where does the market data come from?',
    a: 'We use Finnhub and Financial Modeling Prep (FMP) for live quotes, fundamentals, dividend data, and historical prices.',
  },
  {
    q: 'Can I import from my broker?',
    a: 'Yes — upload a CSV export from any brokerage and use our import wizard to map columns and bulk-add positions. Preset column mappings for Fidelity, Schwab, TD Ameritrade, and IBKR are coming soon.',
  },
  {
    q: 'What does the Advisor plan include?',
    a: "The Advisor plan adds unlimited client portfolios, per-client dashboard views, branded PDF reports with your firm's name, and a built-in CRM for client notes. Perfect for registered investment advisors.",
  },
  {
    q: 'Can I cancel at any time?',
    a: "Absolutely. You can cancel anytime and retain access until the end of your billing period. No long-term contracts, no cancellation fees.",
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: "Start on the Free plan and explore core features at no cost. When you're ready for Pro or Advisor features, upgrade in the billing page inside your dashboard.",
  },
];

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-24 px-6">
      <div className="mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="mb-12 text-center"
        >
          <h2 className="text-4xl font-bold tracking-tight text-white">Frequently asked questions</h2>
          <p className="mt-3 text-white/45">Everything you need to know before getting started.</p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {FAQS.map((faq, i) => (
            <motion.div
              key={faq.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.05, duration: 0.45 }}
              className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03]"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-5 py-4 text-left"
              >
                <span className="pr-4 text-sm font-medium text-white">{faq.q}</span>
                <svg
                  width="16" height="16" viewBox="0 0 16 16" fill="none"
                  className={`shrink-0 text-white/40 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                >
                  <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {open === i && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="border-t border-white/[0.06] px-5 py-4"
                >
                  <p className="text-sm leading-relaxed text-white/55">{faq.a}</p>
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA Banner ──────────────────────────────────────────────────────────────

function CTASection() {
  return (
    <section className="px-6 pb-20">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.1] to-cyan-500/[0.05] p-12 text-center"
        >
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/20 blur-3xl" />
          </div>
          <div className="relative">
            <div className="mb-2 flex justify-center">
              <LogoMark size={48} />
            </div>
            <h2 className="mb-3 mt-4 text-3xl font-bold tracking-tight text-white md:text-4xl">
              Ready to take control of your portfolio?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-white/55">
              Join investors and advisors who track smarter with StockDash. Free to start, no credit card required.
            </p>
            <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-500 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-500/30 transition-all hover:-translate-y-0.5 hover:bg-emerald-400"
              >
                Get started free
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M9 4L13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
              <a href="#pricing" className="text-sm text-white/50 transition-colors hover:text-white">
                View pricing →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Footer ──────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} />
            <span className="text-sm font-semibold text-white/80">StockDash</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="text-xs text-white/40 transition-colors hover:text-white/70">Features</a>
            <a href="#pricing" className="text-xs text-white/40 transition-colors hover:text-white/70">Pricing</a>
            <a href="#faq" className="text-xs text-white/40 transition-colors hover:text-white/70">FAQ</a>
            <Link href="/auth/login" className="text-xs text-white/40 transition-colors hover:text-white/70">Sign in</Link>
          </div>
          <p className="text-xs text-white/25">© {new Date().getFullYear()} StockDash. Built for investors.</p>
        </div>
      </div>
    </footer>
  );
}

// ─── Root page ────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#08090e]">
      <Nav />
      <HeroSection />
      <FeaturesSection />
      <SocialProofSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
    </div>
  );
}
