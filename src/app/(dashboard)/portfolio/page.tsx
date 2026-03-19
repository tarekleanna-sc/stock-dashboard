'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import PageHeader from '@/components/layout/PageHeader';
import PortfolioSummary from '@/components/portfolio/PortfolioSummary';
import AccountCard from '@/components/portfolio/AccountCard';
import PositionRow from '@/components/portfolio/PositionRow';
import PositionForm from '@/components/portfolio/PositionForm';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassSelect } from '@/components/ui/GlassSelect';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePortfolioValue } from '@/hooks/usePortfolioValue';
import { accountSchema, AccountFormData, PositionFormData } from '@/lib/validators/schemas';
import { BrokerAccount, Position, BROKER_LABELS, ACCOUNT_TYPE_LABELS } from '@/types/portfolio';

export default function PortfolioPage() {
  const {
    accounts,
    addAccount,
    updateAccount,
    deleteAccount,
    addPosition,
    updatePosition,
    deletePosition,
    getPositionsByAccount,
  } = usePortfolioStore();

  const { enrichedPositions } = usePortfolioValue();

  // Modal states
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isPositionModalOpen, setIsPositionModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] = useState(false);
  const [isDeletePositionModalOpen, setIsDeletePositionModalOpen] = useState(false);

  // Editing states
  const [editingAccount, setEditingAccount] = useState<BrokerAccount | null>(null);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BrokerAccount | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
  const [preselectedAccountId, setPreselectedAccountId] = useState<string | undefined>(undefined);

  // Account form
  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  // Broker options
  const brokerOptions = Object.entries(BROKER_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  const accountTypeOptions = Object.entries(ACCOUNT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  // Get enriched positions grouped by account
  const positionsByAccount = useMemo(() => {
    const map = new Map<string, typeof enrichedPositions>();
    for (const account of accounts) {
      const accountPositions = enrichedPositions.filter((p) => p.accountId === account.id);
      map.set(account.id, accountPositions);
    }
    return map;
  }, [accounts, enrichedPositions]);

  // Account CRUD handlers
  const handleOpenAddAccount = () => {
    setEditingAccount(null);
    accountForm.reset({ name: '', broker: undefined, accountType: undefined });
    setIsAccountModalOpen(true);
  };

  const handleOpenEditAccount = (account: BrokerAccount) => {
    setEditingAccount(account);
    accountForm.reset({
      name: account.name,
      broker: account.broker,
      accountType: account.accountType,
    });
    setIsAccountModalOpen(true);
  };

  const handleAccountSubmit = (data: AccountFormData) => {
    if (editingAccount) {
      updateAccount(editingAccount.id, data);
    } else {
      addAccount(data);
    }
    setIsAccountModalOpen(false);
    setEditingAccount(null);
    accountForm.reset();
  };

  const handleOpenDeleteAccount = (account: BrokerAccount) => {
    setDeletingAccount(account);
    setIsDeleteAccountModalOpen(true);
  };

  const handleConfirmDeleteAccount = () => {
    if (deletingAccount) {
      deleteAccount(deletingAccount.id);
    }
    setIsDeleteAccountModalOpen(false);
    setDeletingAccount(null);
  };

  // Position CRUD handlers
  const handleOpenAddPosition = (accountId?: string) => {
    setEditingPosition(null);
    setPreselectedAccountId(accountId);
    setIsPositionModalOpen(true);
  };

  const handleOpenEditPosition = (position: Position) => {
    setEditingPosition(position);
    setPreselectedAccountId(undefined);
    setIsPositionModalOpen(true);
  };

  const handlePositionSubmit = (data: PositionFormData) => {
    if (editingPosition) {
      updatePosition(editingPosition.id, data);
    } else {
      addPosition(data);
    }
    setIsPositionModalOpen(false);
    setEditingPosition(null);
  };

  const handleOpenDeletePosition = (position: Position) => {
    setDeletingPosition(position);
    setIsDeletePositionModalOpen(true);
  };

  const handleConfirmDeletePosition = () => {
    if (deletingPosition) {
      deletePosition(deletingPosition.id);
    }
    setIsDeletePositionModalOpen(false);
    setDeletingPosition(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Portfolio" description="Manage your accounts and positions" />

      {/* Summary */}
      <PortfolioSummary />

      {/* Action Buttons */}
      <div className="flex items-center gap-3">
        <GlassButton onClick={handleOpenAddAccount}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Account
        </GlassButton>
        <GlassButton variant="ghost" onClick={() => handleOpenAddPosition()} disabled={accounts.length === 0}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Position
        </GlassButton>
      </div>

      {/* Accounts & Positions */}
      {accounts.length === 0 ? (
        <GlassCard>
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No Accounts Yet</h3>
            <p className="text-white/50 text-sm max-w-md mb-6">
              Get started by adding your first brokerage account. You can then track positions and monitor your portfolio performance.
            </p>
            <GlassButton onClick={handleOpenAddAccount}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Account
            </GlassButton>
          </div>
        </GlassCard>
      ) : (
        <div className="space-y-6">
          {accounts.map((account) => {
            const accountPositions = positionsByAccount.get(account.id) ?? [];
            return (
              <div key={account.id} className="space-y-2">
                <AccountCard
                  account={account}
                  positions={accountPositions}
                  onEdit={handleOpenEditAccount}
                  onDelete={handleOpenDeleteAccount}
                />

                {accountPositions.length > 0 ? (
                  <GlassCard padding="sm">
                    <div className="overflow-x-auto">
                      {/* Column Headers */}
                      <div className="flex items-center gap-4 px-4 py-2 border-b border-white/5 mb-1 min-w-[860px]">
                        <div className="w-[130px] min-w-[130px] text-xs text-white/40 uppercase tracking-wider">Ticker</div>
                        <div className="w-[70px] min-w-[70px] text-right text-xs text-white/40 uppercase tracking-wider">Shares</div>
                        <div className="w-[85px] min-w-[85px] text-right text-xs text-white/40 uppercase tracking-wider">Avg Cost</div>
                        <div className="w-[85px] min-w-[85px] text-right text-xs text-white/40 uppercase tracking-wider">Price</div>
                        <div className="w-[95px] min-w-[95px] text-right text-xs text-white/40 uppercase tracking-wider">Mkt Value</div>
                        <div className="w-[105px] min-w-[105px] text-right text-xs text-white/40 uppercase tracking-wider">Gain/Loss</div>
                        <div className="w-[70px] min-w-[70px] text-right text-xs text-white/40 uppercase tracking-wider">Day</div>
                        <div className="ml-auto w-[70px]" />
                      </div>
                      {accountPositions.map((position) => (
                        <PositionRow
                          key={position.id}
                          position={position}
                          onEdit={handleOpenEditPosition}
                          onDelete={handleOpenDeletePosition}
                        />
                      ))}
                    </div>
                    <div className="px-4 pt-2 mt-1 border-t border-white/5">
                      <button
                        onClick={() => handleOpenAddPosition(account.id)}
                        className="text-sm text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add position
                      </button>
                    </div>
                  </GlassCard>
                ) : (
                  <GlassCard padding="sm">
                    <div className="text-center py-8">
                      <p className="text-white/40 text-sm mb-3">No positions in this account</p>
                      <GlassButton variant="ghost" size="sm" onClick={() => handleOpenAddPosition(account.id)}>
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Position
                      </GlassButton>
                    </div>
                  </GlassCard>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Account Modal */}
      <GlassModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setEditingAccount(null);
        }}
        title={editingAccount ? 'Edit Account' : 'Add Account'}
      >
        <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Account Name</label>
            <GlassInput
              placeholder="e.g. My Brokerage"
              {...accountForm.register('name')}
              error={accountForm.formState.errors.name?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Broker</label>
            <GlassSelect
              options={brokerOptions}
              label=""
              {...accountForm.register('broker')}
              error={accountForm.formState.errors.broker?.message}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/70 mb-1">Account Type</label>
            <GlassSelect
              options={accountTypeOptions}
              label=""
              {...accountForm.register('accountType')}
              error={accountForm.formState.errors.accountType?.message}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <GlassButton
              variant="ghost"
              type="button"
              onClick={() => {
                setIsAccountModalOpen(false);
                setEditingAccount(null);
              }}
            >
              Cancel
            </GlassButton>
            <GlassButton type="submit">
              {editingAccount ? 'Update Account' : 'Add Account'}
            </GlassButton>
          </div>
        </form>
      </GlassModal>

      {/* Position Modal */}
      <GlassModal
        isOpen={isPositionModalOpen}
        onClose={() => {
          setIsPositionModalOpen(false);
          setEditingPosition(null);
        }}
        title={editingPosition ? 'Edit Position' : 'Add Position'}
      >
        <PositionForm
          accountId={preselectedAccountId}
          position={editingPosition ?? undefined}
          onSubmit={handlePositionSubmit}
          onCancel={() => {
            setIsPositionModalOpen(false);
            setEditingPosition(null);
          }}
        />
      </GlassModal>

      {/* Delete Account Confirmation */}
      <GlassModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => {
          setIsDeleteAccountModalOpen(false);
          setDeletingAccount(null);
        }}
        title="Delete Account"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to delete <span className="text-white font-semibold">{deletingAccount?.name}</span>?
            This will also delete all positions in this account. This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <GlassButton
              variant="ghost"
              onClick={() => {
                setIsDeleteAccountModalOpen(false);
                setDeletingAccount(null);
              }}
            >
              Cancel
            </GlassButton>
            <GlassButton onClick={handleConfirmDeleteAccount}>
              Delete Account
            </GlassButton>
          </div>
        </div>
      </GlassModal>

      {/* Delete Position Confirmation */}
      <GlassModal
        isOpen={isDeletePositionModalOpen}
        onClose={() => {
          setIsDeletePositionModalOpen(false);
          setDeletingPosition(null);
        }}
        title="Delete Position"
      >
        <div className="space-y-4">
          <p className="text-white/70">
            Are you sure you want to delete your <span className="text-white font-semibold">{deletingPosition?.ticker}</span> position?
            This action cannot be undone.
          </p>
          <div className="flex items-center justify-end gap-3">
            <GlassButton
              variant="ghost"
              onClick={() => {
                setIsDeletePositionModalOpen(false);
                setDeletingPosition(null);
              }}
            >
              Cancel
            </GlassButton>
            <GlassButton onClick={handleConfirmDeletePosition}>
              Delete Position
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
