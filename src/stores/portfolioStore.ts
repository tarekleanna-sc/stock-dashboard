import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { type SupabaseClient } from '@supabase/supabase-js';
import { BrokerAccount, Position, BrokerName, AccountType } from '@/types/portfolio';

interface PortfolioState {
  accounts: BrokerAccount[];
  positions: Position[];
  watchlist: string[];
  targetAllocations: Record<string, number>;
  snapshots: { date: string; totalValue: number }[];
  hydrated: boolean;

  // Lifecycle
  hydrate: (supabase: SupabaseClient, userId: string) => Promise<void>;
  reset: () => void;

  // Account actions
  addAccount: (data: { name: string; broker: BrokerName; accountType: AccountType }, supabase: SupabaseClient, userId: string) => Promise<string>;
  updateAccount: (id: string, updates: Partial<Omit<BrokerAccount, 'id' | 'createdAt'>>, supabase: SupabaseClient) => Promise<void>;
  deleteAccount: (id: string, supabase: SupabaseClient) => Promise<void>;

  // Position actions
  addPosition: (data: { accountId: string; ticker: string; shares: number; costBasisPerShare: number; notes?: string }, supabase: SupabaseClient, userId: string) => Promise<void>;
  updatePosition: (id: string, updates: Partial<Omit<Position, 'id' | 'dateAdded'>>, supabase: SupabaseClient) => Promise<void>;
  deletePosition: (id: string, supabase: SupabaseClient) => Promise<void>;

  // Watchlist actions
  addToWatchlist: (ticker: string, supabase: SupabaseClient, userId: string) => Promise<void>;
  removeFromWatchlist: (ticker: string, supabase: SupabaseClient, userId: string) => Promise<void>;

  // Target allocation actions
  setTargetAllocation: (ticker: string, percent: number, supabase: SupabaseClient, userId: string) => Promise<void>;
  clearTargetAllocations: (supabase: SupabaseClient, userId: string) => Promise<void>;

  // Snapshot actions
  addSnapshot: (totalValue: number, supabase: SupabaseClient, userId: string) => Promise<void>;

  // Helpers
  getPositionsByAccount: (accountId: string) => Position[];
  getUniqueTickers: () => string[];
}

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH'];

const INITIAL_STATE = {
  accounts: [] as BrokerAccount[],
  positions: [] as Position[],
  watchlist: DEFAULT_WATCHLIST,
  targetAllocations: {} as Record<string, number>,
  snapshots: [] as { date: string; totalValue: number }[],
  hydrated: false,
};

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  ...INITIAL_STATE,

  hydrate: async (supabase, userId) => {
    const [accountsRes, positionsRes, watchlistRes, allocationsRes, snapshotsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('positions').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('watchlist_items').select('symbol').eq('user_id', userId),
      supabase.from('target_allocations').select('*').eq('user_id', userId),
      supabase.from('snapshots').select('date, total_value').eq('user_id', userId).order('date'),
    ]);

    // Surface RLS / permission errors so they're visible in the console
    if (accountsRes.error) console.error('[Portfolio] accounts fetch error:', accountsRes.error.message, '| code:', accountsRes.error.code);
    if (positionsRes.error) console.error('[Portfolio] positions fetch error:', positionsRes.error.message, '| code:', positionsRes.error.code);
    if (watchlistRes.error) console.error('[Portfolio] watchlist fetch error:', watchlistRes.error.message);
    if (allocationsRes.error) console.error('[Portfolio] allocations fetch error:', allocationsRes.error.message);
    if (snapshotsRes.error) console.error('[Portfolio] snapshots fetch error:', snapshotsRes.error.message);

    const accounts: BrokerAccount[] = (accountsRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      broker: r.broker as BrokerName,
      accountType: r.type as AccountType,
      createdAt: r.created_at,
    }));

    const positions: Position[] = (positionsRes.data ?? []).map((r) => ({
      id: r.id,
      accountId: r.account_id,
      ticker: r.symbol,
      shares: r.shares,
      costBasisPerShare: r.avg_cost,
      dateAdded: r.created_at,
      notes: r.notes,
    }));

    const watchlistSymbols = watchlistRes.data?.map((r) => r.symbol) ?? [];
    const watchlist = watchlistSymbols.length > 0 ? watchlistSymbols : DEFAULT_WATCHLIST;

    const targetAllocations: Record<string, number> = {};
    (allocationsRes.data ?? []).forEach((r) => {
      targetAllocations[r.symbol] = r.percentage;
    });

    const snapshots = (snapshotsRes.data ?? []).map((r) => ({
      date: r.date,
      totalValue: r.total_value,
    }));

    set({ accounts, positions, watchlist, targetAllocations, snapshots, hydrated: true });
  },

  reset: () => set({ ...INITIAL_STATE }),

  addAccount: async (data, supabase, userId) => {
    const id = uuidv4();
    const newAccount: BrokerAccount = {
      id,
      name: data.name,
      broker: data.broker,
      accountType: data.accountType,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ accounts: [...state.accounts, newAccount] }));
    await supabase.from('accounts').insert({
      id,
      user_id: userId,
      name: data.name,
      broker: data.broker,
      type: data.accountType,
    });
    return id;
  },

  updateAccount: async (id, updates, supabase) => {
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.broker) dbUpdates.broker = updates.broker;
    if (updates.accountType) dbUpdates.type = updates.accountType;
    dbUpdates.updated_at = new Date().toISOString();
    await supabase.from('accounts').update(dbUpdates).eq('id', id);
  },

  deleteAccount: async (id, supabase) => {
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      positions: state.positions.filter((p) => p.accountId !== id),
    }));
    await supabase.from('accounts').delete().eq('id', id);
  },

  addPosition: async (data, supabase, userId) => {
    const id = uuidv4();
    const newPosition: Position = {
      id,
      accountId: data.accountId,
      ticker: data.ticker.toUpperCase(),
      shares: data.shares,
      costBasisPerShare: data.costBasisPerShare,
      dateAdded: new Date().toISOString(),
      notes: data.notes,
    };
    set((state) => ({ positions: [...state.positions, newPosition] }));
    await supabase.from('positions').insert({
      id,
      user_id: userId,
      account_id: data.accountId,
      symbol: data.ticker.toUpperCase(),
      shares: data.shares,
      avg_cost: data.costBasisPerShare,
      notes: data.notes ?? null,
    });
  },

  updatePosition: async (id, updates, supabase) => {
    set((state) => ({
      positions: state.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.ticker) dbUpdates.symbol = updates.ticker.toUpperCase();
    if (updates.shares !== undefined) dbUpdates.shares = updates.shares;
    if (updates.costBasisPerShare !== undefined) dbUpdates.avg_cost = updates.costBasisPerShare;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    await supabase.from('positions').update(dbUpdates).eq('id', id);
  },

  deletePosition: async (id, supabase) => {
    set((state) => ({ positions: state.positions.filter((p) => p.id !== id) }));
    await supabase.from('positions').delete().eq('id', id);
  },

  addToWatchlist: async (ticker, supabase, userId) => {
    const upper = ticker.toUpperCase();
    set((state) => ({
      watchlist: state.watchlist.includes(upper) ? state.watchlist : [...state.watchlist, upper],
    }));
    await supabase.from('watchlist_items').upsert({ user_id: userId, symbol: upper }, { onConflict: 'user_id,symbol' });
  },

  removeFromWatchlist: async (ticker, supabase, userId) => {
    const upper = ticker.toUpperCase();
    set((state) => ({ watchlist: state.watchlist.filter((t) => t !== upper) }));
    await supabase.from('watchlist_items').delete().eq('user_id', userId).eq('symbol', upper);
  },

  setTargetAllocation: async (ticker, percent, supabase, userId) => {
    set((state) => ({
      targetAllocations: { ...state.targetAllocations, [ticker]: percent },
    }));
    await supabase.from('target_allocations').upsert(
      { user_id: userId, symbol: ticker, percentage: percent },
      { onConflict: 'user_id,symbol' }
    );
  },

  clearTargetAllocations: async (supabase, userId) => {
    set({ targetAllocations: {} });
    await supabase.from('target_allocations').delete().eq('user_id', userId);
  },

  addSnapshot: async (totalValue, supabase, userId) => {
    const date = new Date().toISOString().split('T')[0];
    set((state) => ({ snapshots: [...state.snapshots, { date, totalValue }] }));
    await supabase.from('snapshots').upsert(
      { user_id: userId, date, total_value: totalValue },
      { onConflict: 'user_id,date' }
    );
  },

  getPositionsByAccount: (accountId) =>
    get().positions.filter((p) => p.accountId === accountId),

  getUniqueTickers: () => [...new Set(get().positions.map((p) => p.ticker))],
}));
