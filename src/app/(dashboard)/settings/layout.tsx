'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SETTINGS_NAV = [
  {
    href: '/settings/branding',
    label: 'Report Branding',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.07 4.93a10 10 0 010 14.14M4.93 4.93a10 10 0 000 14.14" />
      </svg>
    ),
    description: 'Firm logo, colors, and PDF customization',
  },
  {
    href: '/settings/digest',
    label: 'Email Digest',
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    description: 'Weekly portfolio summary emails',
  },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex gap-6 flex-col md:flex-row">
      {/* Settings sidebar */}
      <aside className="md:w-52 flex-shrink-0">
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-3">
          <p className="text-[11px] font-semibold text-white/30 uppercase tracking-wider px-2 py-1.5 mb-1">
            Settings
          </p>
          <nav className="space-y-0.5">
            {SETTINGS_NAV.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                      : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05] border border-transparent'
                  }`}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-cyan-400' : 'text-white/40'}`}>
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Settings content */}
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
