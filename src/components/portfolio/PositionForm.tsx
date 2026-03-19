'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { positionSchema, PositionFormData } from '@/lib/validators/schemas';
import { Position } from '@/types/portfolio';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { GlassButton } from '@/components/ui/GlassButton';
import { TickerSearch } from '@/components/ui/TickerSearch';

interface PositionFormProps {
  accountId?: string;
  position?: Position;
  onSubmit: (data: PositionFormData) => void;
  onCancel: () => void;
}

export default function PositionForm({ accountId, position, onSubmit, onCancel }: PositionFormProps) {
  const { accounts } = usePortfolioStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<PositionFormData>({
    resolver: zodResolver(positionSchema),
    defaultValues: position
      ? {
          ticker: position.ticker,
          shares: position.shares,
          costBasisPerShare: position.costBasisPerShare,
          accountId: position.accountId,
          notes: position.notes ?? '',
        }
      : {
          ticker: '',
          shares: undefined,
          costBasisPerShare: undefined,
          accountId: accountId ?? '',
          notes: '',
        },
  });

  const tickerValue = watch('ticker');

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: a.name,
  }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Ticker Symbol</label>
        <TickerSearch
          value={tickerValue ?? ''}
          onChange={(val) => setValue('ticker', val, { shouldValidate: true })}
          placeholder="Search ticker or company..."
          error={errors.ticker?.message}
          disabled={!!position}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Shares</label>
          <GlassInput
            type="number"
            step="any"
            placeholder="0.00"
            {...register('shares', { valueAsNumber: true })}
            error={errors.shares?.message}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Cost Basis / Share</label>
          <GlassInput
            type="number"
            step="any"
            placeholder="0.00"
            {...register('costBasisPerShare', { valueAsNumber: true })}
            error={errors.costBasisPerShare?.message}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Account</label>
        <GlassSelect
          options={accountOptions}
          {...register('accountId')}
          error={errors.accountId?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Notes (optional)</label>
        <GlassInput
          placeholder="Add any notes..."
          {...register('notes')}
          error={errors.notes?.message}
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <GlassButton variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </GlassButton>
        <GlassButton type="submit" disabled={isSubmitting}>
          {position ? 'Update Position' : 'Add Position'}
        </GlassButton>
      </div>
    </form>
  );
}
