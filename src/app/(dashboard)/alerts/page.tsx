'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { usePriceAlerts } from '@/hooks/usePriceAlerts';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { useSubscription } from '@/hooks/useSubscription';
import { canUseAlerts } from '@/lib/utils/featureGating';
import { formatCurrency } from '@/lib/utils/formatting';
import type { AlertDirection } from '@/types/alerts';

export default function AlertsPage() {
  const { plan, loading: subLoading } = useSubscription();
  const { enrichedPositions } = usePortfolioValue();
  const { alerts, loading, newlyTriggered, addAlert, deleteAlert, dismissTriggered } =
    usePriceAlerts(enrichedPositions);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [symbol, setSymbol] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<AlertDirection>('above');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [showTriggered, setShowTriggered] = useState(false);

  const activeAlerts = alerts.filter((a) => !a.triggered);
  const triggeredAlerts = alerts.filter((a) => a.triggered);

  const handleAdd = async () => {
    const price = parseFloat(targetPrice);
    if (!symbol.trim() || !price || price <= 0) {
      setError('Please provide a valid ticker and target price.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await addAlert(symbol.trim().toUpperCase(), price, direction, notes || undefined);
      setIsModalOpen(false);
      setSymbol('');
      setTargetPrice('');
      setNotes('');
    } finally {
      setSubmitting(false);
    }
  };

  if (!subLoading && !canUseAlerts(plan)) {
    return (
      <div className="space-y-6">
        <PageHeader title="Price Alerts" description="Get notified when a stock hits your target price" />
        <UpgradePrompt
          title="Pro Feature: Price Alerts"
          description="Set custom price alerts for your holdings and get notified when targets are hit. Upgrade to Pro to unlock this feature."
          requiredPlan="pro"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Price Alerts"
          description="Get notified when a stock hits your target price"
        />
        <GlassButton onClick={() => setIsModalOpen(true)}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Alert
        </GlassButton>
      </div>

      {/* Newly triggered banner */}
      {newlyTriggered.length > 0 && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-amber-400 font-semibold text-sm mb-2">
                🔔 {newlyTriggered.length} alert{newlyTriggered.length > 1 ? 's' : ''} triggered!
              </p>
              {newlyTriggered.map((a) => (
                <p key={a.id} className="text-white/70 text-sm">
                  <span className="font-semibold text-white">{a.symbol}</span> is{' '}
                  {a.direction === 'above' ? 'at or above' : 'at or below'}{' '}
                  {formatCurrency(a.targetPrice)} (current: {formatCurrency(a.currentPrice)})
                </p>
              ))}
            </div>
            <button onClick={dismissTriggered} className="text-white/30 hover:text-white/70 transition-colors flex-shrink-0">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Active alerts */}
      {loading ? (
        <div className="text-white/40 text-sm">Loading alerts...</div>
      ) : activeAlerts.length === 0 ? (
        <GlassCard>
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <svg width="22" height="22" fill="none" stroke="#f59e0b" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </div>
            <p className="text-white/40 text-sm">No active alerts. Create one to get started.</p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard padding="none">
          <div className="divide-y divide-white/[0.05]">
            {activeAlerts.map((alert) => {
              const isClose = Math.abs(alert.distancePct) < 3;
              return (
                <div key={alert.id} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.03] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{alert.symbol}</span>
                      <GlassBadge variant={alert.direction === 'above' ? 'positive' : 'warning'}>
                        {alert.direction === 'above' ? '↑ above' : '↓ below'} {formatCurrency(alert.targetPrice)}
                      </GlassBadge>
                      {isClose && (
                        <GlassBadge variant="warning">Near target</GlassBadge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-white/30">
                      {alert.currentPrice > 0 && (
                        <span>Current: {formatCurrency(alert.currentPrice)}</span>
                      )}
                      <span>
                        {Math.abs(alert.distancePct).toFixed(1)}% {alert.distancePct < 0 ? 'below' : 'above'} target
                      </span>
                      {alert.notes && <span>· {alert.notes}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteAlert(alert.id)}
                    className="text-white/20 hover:text-rose-400 transition-colors flex-shrink-0"
                    title="Delete alert"
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              );
            })}
          </div>
        </GlassCard>
      )}

      {/* Triggered history toggle */}
      {triggeredAlerts.length > 0 && (
        <div>
          <button
            onClick={() => setShowTriggered((p) => !p)}
            className="text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            {showTriggered ? 'Hide' : 'Show'} {triggeredAlerts.length} triggered alert{triggeredAlerts.length > 1 ? 's' : ''}
          </button>
          {showTriggered && (
            <GlassCard padding="none" className="mt-3">
              <div className="divide-y divide-white/[0.05]">
                {triggeredAlerts.map((alert) => (
                  <div key={alert.id} className="flex items-center gap-4 px-4 py-3 opacity-50">
                    <div className="flex-1">
                      <span className="text-sm font-medium text-white">{alert.symbol}</span>
                      <span className="ml-2 text-xs text-white/40">
                        {alert.direction} {formatCurrency(alert.targetPrice)} · triggered{' '}
                        {alert.triggeredAt
                          ? new Date(alert.triggeredAt).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="text-white/20 hover:text-rose-400 transition-colors"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </GlassCard>
          )}
        </div>
      )}

      {/* Add Alert Modal */}
      <GlassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="New Price Alert">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Ticker *</label>
              <GlassInput
                placeholder="AAPL"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Target Price *</label>
              <GlassInput
                type="number"
                min="0"
                step="0.01"
                placeholder="150.00"
                value={targetPrice}
                onChange={(e) => setTargetPrice(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Alert When Price Is</label>
            <div className="flex gap-2">
              {(['above', 'below'] as AlertDirection[]).map((d) => (
                <button
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all border ${
                    direction === d
                      ? d === 'above'
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                      : 'bg-white/[0.05] text-white/40 border-white/[0.08] hover:border-white/20'
                  }`}
                >
                  {d === 'above' ? '↑ At or Above' : '↓ At or Below'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-white/50 mb-1.5">Notes (optional)</label>
            <GlassInput
              placeholder="e.g. Take profit target"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <div className="flex gap-3 pt-1">
            <GlassButton variant="ghost" size="md" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="md" onClick={handleAdd} disabled={submitting} className="flex-1">
              {submitting ? 'Creating...' : 'Create Alert'}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
