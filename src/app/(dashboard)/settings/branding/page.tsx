'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { useSubscription } from '@/hooks/useSubscription';

const STORAGE_KEY = 'stockdash_advisor_branding';

export interface AdvisorBranding {
  firmName: string;
  firmTagline: string;
  firmLogo: string;  // URL
  contactEmail: string;
  contactPhone: string;
  contactWebsite: string;
  accentColor: string; // hex
  disclaimerText: string;
}

const DEFAULTS: AdvisorBranding = {
  firmName: '',
  firmTagline: 'Wealth Management & Financial Planning',
  firmLogo: '',
  contactEmail: '',
  contactPhone: '',
  contactWebsite: '',
  accentColor: '#0d0d2b',
  disclaimerText:
    'This report is prepared for informational purposes only and does not constitute investment advice. Past performance is not indicative of future results. Securities involve risk of loss. Please consult your financial advisor before making investment decisions.',
};

const COLOR_PRESETS = [
  { label: 'Navy', value: '#0d0d2b' },
  { label: 'Slate', value: '#1e293b' },
  { label: 'Forest', value: '#14532d' },
  { label: 'Burgundy', value: '#7f1d1d' },
  { label: 'Indigo', value: '#1e1b4b' },
  { label: 'Charcoal', value: '#18181b' },
];

export function loadBranding(): AdvisorBranding {
  if (typeof window === 'undefined') return DEFAULTS;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export default function BrandingSettingsPage() {
  const { plan } = useSubscription();
  const isAdvisor = plan === 'advisor';

  const [branding, setBranding] = useState<AdvisorBranding>(DEFAULTS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setBranding(loadBranding());
  }, []);

  function update(key: keyof AdvisorBranding, value: string) {
    setBranding((b) => ({ ...b, [key]: value }));
    setSaved(false);
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(branding));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  if (!isAdvisor) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.8">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white/80">Advisor Plan Required</h2>
          <p className="text-sm text-white/40 mt-1 max-w-sm">
            Branded PDF reports are available on the Advisor plan. Upgrade to add your firm logo, colors, and contact info to client-facing reports.
          </p>
        </div>
        <a href="/billing" className="rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 px-5 py-2 text-sm font-medium hover:bg-cyan-500/25 transition-colors">
          View Plans →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white/90">Report Branding</h1>
        <p className="text-sm text-white/40 mt-0.5">
          Customize client-facing PDF reports with your firm's identity
        </p>
      </div>

      {/* Firm Identity */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">Firm Identity</h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Firm Name</label>
            <GlassInput
              value={branding.firmName}
              onChange={(e) => update('firmName', e.target.value)}
              placeholder="Acme Wealth Management"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Tagline</label>
            <GlassInput
              value={branding.firmTagline}
              onChange={(e) => update('firmTagline', e.target.value)}
              placeholder="Wealth Management & Financial Planning"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-white/50 mb-1.5">Logo URL</label>
          <GlassInput
            value={branding.firmLogo}
            onChange={(e) => update('firmLogo', e.target.value)}
            placeholder="https://yourfirm.com/logo.png (PNG or SVG, max 200×60px recommended)"
          />
          {branding.firmLogo && (
            <div className="mt-2 p-3 rounded-xl border border-white/[0.06] bg-white/[0.02] flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={branding.firmLogo} alt="Logo preview" className="h-10 max-w-[160px] object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              <span className="text-xs text-white/30">Logo preview</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Contact Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">Contact Information</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Email</label>
            <GlassInput
              type="email"
              value={branding.contactEmail}
              onChange={(e) => update('contactEmail', e.target.value)}
              placeholder="advisor@firm.com"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Phone</label>
            <GlassInput
              value={branding.contactPhone}
              onChange={(e) => update('contactPhone', e.target.value)}
              placeholder="(555) 000-0000"
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Website</label>
            <GlassInput
              value={branding.contactWebsite}
              onChange={(e) => update('contactWebsite', e.target.value)}
              placeholder="www.yourfirm.com"
            />
          </div>
        </div>
      </motion.div>

      {/* Accent Color */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-4"
      >
        <h2 className="text-sm font-semibold text-white/70">Brand Color</h2>
        <div className="flex flex-wrap gap-2 items-center">
          {COLOR_PRESETS.map((c) => (
            <button
              key={c.value}
              onClick={() => update('accentColor', c.value)}
              title={c.label}
              className={`w-9 h-9 rounded-xl border-2 transition-all ${
                branding.accentColor === c.value ? 'border-white/60 scale-110' : 'border-transparent hover:border-white/30'
              }`}
              style={{ backgroundColor: c.value }}
            />
          ))}
          <div className="flex items-center gap-2 ml-2">
            <input
              type="color"
              value={branding.accentColor}
              onChange={(e) => update('accentColor', e.target.value)}
              className="w-9 h-9 rounded-xl cursor-pointer border border-white/10 bg-transparent"
            />
            <span className="text-xs text-white/40">Custom</span>
          </div>
        </div>
        <div className="rounded-xl p-3 text-white text-sm font-bold" style={{ backgroundColor: branding.accentColor }}>
          Preview: {branding.firmName || 'Your Firm Name'}
        </div>
      </motion.div>

      {/* Disclaimer Text */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-2xl border border-white/[0.07] bg-white/[0.04] p-5 space-y-3"
      >
        <h2 className="text-sm font-semibold text-white/70">Disclaimer Text</h2>
        <p className="text-xs text-white/40">Appears at the bottom of every report page.</p>
        <textarea
          value={branding.disclaimerText}
          onChange={(e) => update('disclaimerText', e.target.value)}
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-xs text-white/70 outline-none focus:border-cyan-500/40 resize-none leading-relaxed"
        />
      </motion.div>

      {/* Save */}
      <div className="flex items-center gap-3">
        <GlassButton onClick={save}>
          {saved ? '✓ Saved' : 'Save Branding Settings'}
        </GlassButton>
        {saved && <span className="text-xs text-emerald-400">Settings saved to this device.</span>}
      </div>
    </div>
  );
}
