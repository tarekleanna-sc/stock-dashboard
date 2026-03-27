'use client';

import { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { GlassInput } from '@/components/ui/GlassInput';
import { GlassModal } from '@/components/ui/GlassModal';
import { GlassBadge } from '@/components/ui/GlassBadge';
import { useAdvisorClients } from '@/hooks/useAdvisorClients';
import { useSelectedClient } from '@/providers/ClientProvider';
import type { AdvisorClient } from '@/types/advisor';

interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const EMPTY_FORM: ClientFormData = { name: '', email: '', phone: '', notes: '' };

export default function ClientsPage() {
  const { clients, loading, addClient, updateClient, deleteClient } = useAdvisorClients();
  const { selectedClient, setSelectedClient } = useSelectedClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<AdvisorClient | null>(null);
  const [form, setForm] = useState<ClientFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const openAdd = () => {
    setEditingClient(null);
    setForm(EMPTY_FORM);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (client: AdvisorClient) => {
    setEditingClient(client);
    setForm({
      name: client.name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
    });
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Client name is required.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      if (editingClient) {
        await updateClient(editingClient.id, {
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        });
      } else {
        await addClient({
          name: form.name,
          email: form.email || undefined,
          phone: form.phone || undefined,
          notes: form.notes || undefined,
        });
      }
      setIsModalOpen(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    await deleteClient(id);
    if (selectedClient?.id === id) setSelectedClient(null);
    setDeletingId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <PageHeader
          title="Clients"
          description="Advisor mode — manage multiple client portfolios"
        />
        <GlassButton onClick={openAdd}>
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Client
        </GlassButton>
      </div>

      {/* Active client indicator */}
      {selectedClient && (
        <div className="rounded-xl bg-violet-500/10 border border-violet-500/30 px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-white/70">
            Viewing portfolio for{' '}
            <span className="font-semibold text-white">{selectedClient.name}</span>
          </p>
          <GlassButton variant="ghost" size="sm" onClick={() => setSelectedClient(null)}>
            Switch to My Portfolio
          </GlassButton>
        </div>
      )}

      {/* Client list */}
      {loading ? (
        <div className="text-white/40 text-sm">Loading clients...</div>
      ) : clients.length === 0 ? (
        <GlassCard>
          <div className="text-center py-10">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-violet-500/10 flex items-center justify-center">
              <svg width="24" height="24" fill="none" stroke="#8b5cf6" strokeWidth="1.5" viewBox="0 0 24 24">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            </div>
            <p className="text-white font-semibold mb-1">No clients yet</p>
            <p className="text-white/40 text-sm">
              Add your first client to start managing their portfolio.
            </p>
          </div>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client) => {
            const isSelected = selectedClient?.id === client.id;
            return (
              <GlassCard
                key={client.id}
                className={`cursor-pointer transition-all ${isSelected ? 'ring-1 ring-violet-500/50' : ''}`}
                hover={false}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0">
                    <span className="text-violet-400 font-bold text-sm">
                      {client.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  {isSelected && (
                    <GlassBadge variant="info">Active</GlassBadge>
                  )}
                </div>

                <p className="text-white font-semibold mb-0.5">{client.name}</p>
                {client.email && (
                  <p className="text-xs text-white/40 truncate">{client.email}</p>
                )}
                {client.phone && (
                  <p className="text-xs text-white/30">{client.phone}</p>
                )}
                {client.notes && (
                  <p className="text-xs text-white/30 mt-1 line-clamp-2">{client.notes}</p>
                )}

                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/[0.06]">
                  <GlassButton
                    variant={isSelected ? 'ghost' : 'primary'}
                    size="sm"
                    className="flex-1"
                    onClick={() => setSelectedClient(isSelected ? null : client)}
                  >
                    {isSelected ? 'Deselect' : 'View Portfolio'}
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    title="Generate branded PDF report for this client"
                    onClick={() => window.open(`/report/branded?client=${encodeURIComponent(client.name)}`, '_blank')}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
                    </svg>
                  </GlassButton>
                  <GlassButton variant="ghost" size="sm" onClick={() => openEdit(client)}>
                    <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                      <path d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </GlassButton>
                  <GlassButton
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(client.id)}
                    disabled={deletingId === client.id}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="text-rose-400">
                      <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </GlassButton>
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}

      {/* Add/Edit Client Modal */}
      <GlassModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'New Client'}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Name *</label>
            <GlassInput
              placeholder="John Smith"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Email</label>
              <GlassInput
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1.5">Phone</label>
              <GlassInput
                placeholder="(555) 123-4567"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-white/50 mb-1.5">Notes</label>
            <GlassInput
              placeholder="e.g. Aggressive growth focus, retirement in 2035..."
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            />
          </div>
          {error && <p className="text-xs text-rose-400">{error}</p>}
          <div className="flex gap-3 pt-1">
            <GlassButton variant="ghost" size="md" onClick={() => setIsModalOpen(false)} className="flex-1">
              Cancel
            </GlassButton>
            <GlassButton variant="primary" size="md" onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? 'Saving...' : editingClient ? 'Save Changes' : 'Add Client'}
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  );
}
