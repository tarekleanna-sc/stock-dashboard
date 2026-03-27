'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/providers/SupabaseProvider';

// Primary nav items shown in bottom bar (max 5 for usability)
const PRIMARY_NAV = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    name: 'Portfolio',
    href: '/portfolio',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    name: 'Charts',
    href: '/charts',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
  {
    name: 'News',
    href: '/news',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 22h16a2 2 0 002-2V4a2 2 0 00-2-2H8a2 2 0 00-2 2v16a2 2 0 01-2 2zm0 0a2 2 0 01-2-2v-9c0-1.1.9-2 2-2h2" />
      </svg>
    ),
  },
  {
    name: 'More',
    href: '__more__',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
];

// All nav items for the "More" drawer
const ALL_NAV = [
  { name: 'Alerts', href: '/alerts' },
  { name: 'Earnings', href: '/earnings' },
  { name: 'Recommendations', href: '/recommendations' },
  { name: 'Rebalance', href: '/rebalance' },
  { name: 'Forecast', href: '/forecast' },
  { name: 'Mock Builder', href: '/mock-builder' },
  { name: 'Clients', href: '/clients' },
  { name: 'Billing', href: '/billing' },
  { name: 'Attribution', href: '/performance-attribution' },
  { name: 'Tax Lots', href: '/tax-lots' },
  { name: 'Referrals', href: '/referrals' },
  { name: 'Settings', href: '/settings/branding' },
];

export default function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { supabase } = useSupabase();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push('/auth/login');
  }

  return (
    <>
      {/* Bottom nav bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-white/[0.08] bg-[#0d0d2b]/90 backdrop-blur-2xl">
        {PRIMARY_NAV.map((item) => {
          if (item.href === '__more__') {
            return (
              <button
                key="more"
                onClick={() => setDrawerOpen(true)}
                className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                  drawerOpen ? 'text-cyan-400' : 'text-white/40'
                }`}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.name}</span>
              </button>
            );
          }
          const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-3 transition-colors ${
                isActive ? 'text-cyan-400' : 'text-white/40 hover:text-white/70'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* More drawer overlay */}
      {drawerOpen && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm md:hidden"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-[70] md:hidden rounded-t-2xl border-t border-white/[0.10] bg-[#0f1020]/95 backdrop-blur-2xl px-4 pb-6 pt-4">
            {/* Handle */}
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/[0.15]" />
            <div className="grid grid-cols-2 gap-2">
              {ALL_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                    pathname.startsWith(item.href)
                      ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300'
                      : 'border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
            {/* Sign out */}
            <button
              onClick={handleSignOut}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.03] py-3 text-sm text-white/40 hover:text-rose-400 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              Sign out
            </button>
          </div>
        </>
      )}
    </>
  );
}
