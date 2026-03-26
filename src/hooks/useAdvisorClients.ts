'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';
import type { AdvisorClient } from '@/types/advisor';

export function useAdvisorClients() {
  const { supabase, user } = useSupabase();
  const [clients, setClients] = useState<AdvisorClient[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('advisor_id', user.id)
      .order('name');

    if (!error && data) {
      setClients(
        data.map((r) => ({
          id: r.id,
          name: r.name,
          email: r.email,
          phone: r.phone,
          notes: r.notes,
          createdAt: r.created_at,
        }))
      );
    }
    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    load();
  }, [load]);

  const addClient = useCallback(
    async (data: { name: string; email?: string; phone?: string; notes?: string }) => {
      if (!user) return null;
      const { data: row, error } = await supabase
        .from('clients')
        .insert({
          advisor_id: user.id,
          name: data.name,
          email: data.email ?? null,
          phone: data.phone ?? null,
          notes: data.notes ?? null,
        })
        .select()
        .single();

      if (!error && row) {
        const newClient: AdvisorClient = {
          id: row.id,
          name: row.name,
          email: row.email,
          phone: row.phone,
          notes: row.notes,
          createdAt: row.created_at,
        };
        setClients((prev) => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)));
        return newClient;
      }
      return null;
    },
    [supabase, user]
  );

  const updateClient = useCallback(
    async (id: string, updates: Partial<Omit<AdvisorClient, 'id' | 'createdAt'>>) => {
      await supabase
        .from('clients')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      setClients((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
    },
    [supabase]
  );

  const deleteClient = useCallback(
    async (id: string) => {
      await supabase.from('clients').delete().eq('id', id);
      setClients((prev) => prev.filter((c) => c.id !== id));
    },
    [supabase]
  );

  return { clients, loading, addClient, updateClient, deleteClient, reload: load };
}
