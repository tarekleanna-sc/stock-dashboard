'use client';

import { useState } from 'react';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { formatCurrency } from '@/lib/utils/formatting';
import type { PositionWithMarketData } from '@/types/portfolio';

interface ClosePositionModalProps {
  position: PositionWithMarketData | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (positionId: string, salePrice: number, closedAt: string, notes?: string) => Promise<void>;
}

export default function ClosePositionModal({
  position,
  isOpen,
  onClose,
  onConfirm,
}: ClosePositionModalProps) {
  const [salePrice, setSalePrice] = useState('');
  const [closedAt, setClosedAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!position) return null;

  const price = parseFloat(salePrice) || 0;
  const proceeds = price * position.shares;
  const costBasis = position.totalCostBasis;
  const realizedGain = proceeds - costBasis;
  const realizedGainPct = costBasis > 0 ? (realizedGain / costBasis) * 100 : 0;

  const handleSubmit = async () => {
    const p = parseFloat(salePrice);
    if (!p || p <= 0) {
      setError('Please enter a valid sale price.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await onConfirm(position.id, p, closedAt, notes || undefined);
      onClose();
      setSalePrice('');
      setNotes('');
    } catch (e) {
      setError('Failed to close position. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GlassModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Close ${position.ticker} Position`}
    >
      <div className="space-y-5">
        {/* Position summary */}
        <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-1.5">
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Shares</span>
            <span className="text-white font-medium">{position.shares}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Cost Basis</span>
            <span className="text-white font-medium">
              {formatCurrency(position.costBasisPerShare)}/sh · {formatCurrency(costBasis)} total
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-white/50">Current Price</span>
            <span className="text-white font-medium">{formatCurrency(position.currentPrice)}</span>
          </div>
        </div>

        {/* Sale price + date */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Sale Price / Share *</label>
            <GlassInput
              type="number"
              min="0"
              step="0.01"
              placeholder={position.currentPrice.toFixed(2)}
              value={salePrice}
              onChange={(e) => setSalePrice(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Close Date</label>
            <GlassInput
              type="date"
              value={closedAt}
              onChange={(e) => setClosedAt(e.target.value)}
            />
          </div>
        </div>

        {/* Live P&L preview */}
        {price > 0 && (
          <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Proceeds</span>
              <span className="text-white font-medium">{formatCurrency(proceeds)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-white/50">Realized Gain / Loss</span>
              <span className={`font-semibold ${realizedGain >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {realizedGain >= 0 ? '+' : ''}{formatCurrency(realizedGain)} ({realizedGainPct >= 0 ? '+' : ''}{realizedGainPct.toFixed(2)}%)
              </span>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs text-white/50 mb-1.5">Notes (optional)</label>
          <GlassInput
            placeholder="e.g. Took profits, stop-loss triggered..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {error && <p className="text-xs text-rose-400">{error}</p>}

        <div className="flex gap-3 pt-1">
          <GlassButton variant="ghost" size="md" onClick={onClose} className="flex-1">
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={loading || !salePrice}
            className="flex-1"
          >
            {loading ? 'Closing...' : 'Close Position'}
          </GlassButton>
        </div>
      </div>
    </GlassModal>
  );
}
