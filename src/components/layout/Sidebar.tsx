'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, ChevronRight, ChevronLeft } from 'lucide-react';
import { useSupabase } from '@/providers/SupabaseProvider';

const navItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v3" />
      </svg>
    ),
  },
  {
    name: 'Charts',
    href: '/charts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    name: 'Weekly Buys',
    href: '/recommendations',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    name: 'Rebalance',
    href: '/rebalance',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v18" />
        <path d="M3 9l4-4 4 4" />
        <path d="M17 15l4-4-4-4" />
        <line x1="3" y1="9" x2="9" y2="9" />
        <line x1="15" y1="15" x2="21" y2="15" />
      </svg>
    ),
  },
  {
    name: 'Forecast',
    href: '/forecast',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="9" x2="21" y2="9" />
      </svg>
    ),
  },
  {
    name: 'Mock Builder',
    href: '/mock-builder',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: 'Correlation',
    href: '/correlation',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        <path d="M10 6.5h4M6.5 10v4M17.5 10v4M10 17.5h4" strokeOpacity="0.5" />
      </svg>
    ),
  },
  {
    name: 'Monte Carlo',
    href: '/monte-carlo',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 12C2 12 5 5 12 5s10 7 10 7-3 7-10 7S2 12 2 12z" />
        <path d="M8 12a4 4 0 0 0 4 4" strokeDasharray="2 2" />
        <path d="M8 12a4 4 0 0 1 4-4" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: 'News',
    href: '/news',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
        <path d="M16 13h-4M16 17h-4M10 13h.01M10 17h.01" />
      </svg>
    ),
  },
  {
    name: 'Earnings',
    href: '/earnings',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </svg>
    ),
  },
  {
    name: 'Alerts',
    href: '/alerts',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 01-3.46 0" />
      </svg>
    ),
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
  },
];

export default function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabase();
  const initials = userEmail ? userEmail[0].toUpperCase() : '?';
  const [expanded, setExpanded] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <aside
      className={`fixed left-0 top-0 z-40 hidden md:flex h-screen flex-col border-r border-white/[0.08] bg-[#0d0d2b]/80 py-5 backdrop-blur-xl transition-[width] duration-200 ease-in-out overflow-hidden ${
        expanded ? 'w-52' : 'w-16'
      }`}
    >
      {/* Brand / Toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-6 flex items-center gap-3 px-4 group"
        title={expanded ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 group-hover:bg-cyan-500/30 transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 2 7 12 12 22 7 12 2" />
            <polyline points="2 17 12 22 22 17" />
            <polyline points="2 12 12 17 22 12" />
          </svg>
        </div>
        <span
          className={`text-sm font-bold text-white/90 whitespace-nowrap transition-all duration-200 ${
            expanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2'
          }`}
        >
          StockDash
        </span>
        <span
          className={`ml-auto text-white/30 transition-all duration-200 flex-shrink-0 ${
            expanded ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <ChevronLeft size={14} />
        </span>
      </button>

      {/* Nav Items */}
      <nav className="flex flex-1 flex-col gap-1 px-2">
        {navItems.map((item) => {
          const isActive =
            item.href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex h-10 items-center gap-3 rounded-xl px-2.5 transition-all duration-150 ${
                isActive
                  ? 'bg-cyan-500/15 text-cyan-400'
                  : 'text-white/40 hover:bg-white/[0.06] hover:text-white/75'
              }`}
            >
              <span className="flex-shrink-0 flex items-center justify-center w-5">{item.icon}</span>

              {/* Label — slides in when expanded */}
              <span
                className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                  expanded
                    ? 'opacity-100 translate-x-0 w-auto'
                    : 'opacity-0 translate-x-1 w-0 overflow-hidden'
                }`}
              >
                {item.name}
              </span>

              {/* Tooltip — only when collapsed */}
              {!expanded && (
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-[#1a1a4e]/95 px-3 py-1.5 text-xs font-medium text-white/90 opacity-0 shadow-lg backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100 border border-white/[0.08]">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + sign out */}
      <div className="px-2 space-y-1">
        {/* Divider */}
        <div className="h-px bg-white/[0.06] mb-2 mx-1" />

        {/* User row */}
        <div className={`flex items-center gap-3 px-2.5 py-2 rounded-xl ${expanded ? '' : 'justify-center'}`}>
          <div
            title={userEmail}
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400 ring-1 ring-cyan-500/30"
          >
            {initials}
          </div>
          <span
            className={`text-xs text-white/40 truncate transition-all duration-200 ${
              expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            }`}
          >
            {userEmail}
          </span>
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className={`group relative flex h-9 w-full items-center gap-3 rounded-xl px-2.5 text-white/30 transition-all hover:bg-white/[0.06] hover:text-rose-400 ${
            expanded ? '' : 'justify-center'
          }`}
        >
          <LogOut size={14} className="flex-shrink-0" />
          <span
            className={`text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              expanded ? 'opacity-100 w-auto' : 'opacity-0 w-0 overflow-hidden'
            }`}
          >
            Sign out
          </span>
          {!expanded && (
            <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-lg bg-[#1a1a4e]/95 px-3 py-1.5 text-xs font-medium text-white/90 opacity-0 shadow-lg backdrop-blur-xl transition-opacity duration-150 group-hover:opacity-100 border border-white/[0.08]">
              Sign out
            </span>
          )}
        </button>

        {/* Expand hint when collapsed */}
        {!expanded && (
          <button
            onClick={() => setExpanded(true)}
            title="Expand sidebar"
            className="flex h-7 w-full items-center justify-center rounded-xl text-white/20 hover:text-white/50 hover:bg-white/[0.04] transition-all"
          >
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </aside>
  );
}
