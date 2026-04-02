import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { type SupabaseClient } from '@supabase/supabase-js';
import { BrokerAccount, Position, ClosedPosition, BrokerName, AccountType } from '@/types/portfolio';

interface PortfolioState {
  accounts: BrokerAccount[];
  positions: Position[];
  closedPositions: ClosedPosition[];
  watchlist: string[];
  targetAllocations: Record<string, number>;
  snapshots: { date: string; totalValue: number }[];
  hydrated: boolean;

  // Lifecycle
  hydrate: (supabase: SupabaseClient, userId: string) => Promise<void>;
  reset: () => void;

  // Account actions
  addAccount: (data: { name: string; broker: BrokerName; accountType: AccountType; cashBalance?: number }, supabase: SupabaseClient, userId: string) => Promise<string>;
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

  // Closed position actions
  closePosition: (
    data: { positionId: string; salePrice: number; closedAt: string; notes?: string },
    supabase: SupabaseClient,
    userId: string
  ) => Promise<void>;
  deleteClosedPosition: (id: string, supabase: SupabaseClient) => Promise<void>;

  // Helpers
  getPositionsByAccount: (accountId: string) => Position[];
  getUniqueTickers: () => string[];
}

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH'];

const INITIAL_STATE = {
  accounts: [] as BrokerAccount[],
  positions: [] as Position[],
  closedPositions: [] as ClosedPosition[],
  watchlist: DEFAULT_WATCHLIST,
  targetAllocations: {} as Record<string, number>,
  snapshots: [] as { date: string; totalValue: number }[],
  hydrated: false,
};

export const usePortfolioStore = create<PortfolioState>()((set, get) => ({
  ...INITIAL_STATE,

  hydrate: async (supabase, userId) => {
    const [accountsRes, positionsRes, watchlistRes, allocationsRes, snapshotsRes, closedRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('positions').select('*').eq('user_id', userId).order('created_at'),
      supabase.from('watchlist_items').select('symbol').eq('user_id', userId),
      supabase.from('target_allocations').select('*').eq('user_id', userId),
      supabase.from('snapshots').select('date, total_value').eq('user_id', userId).order('date'),
      supabase.from('closed_positions').select('*').eq('user_id', userId).order('closed_at', { ascending: false }),
    ]);

    // Surface RLS / permission errors so they're visible in the console
    if (accountsRes.error) console.error('[Portfolio] accounts fetch error:', accountsRes.error.message, '| code:', accountsRes.error.code);
    if (positionsRes.error) console.error('[Portfolio] positions fetch error:', positionsRes.error.message, '| code:', positionsRes.error.code);
    if (watchlistRes.error) console.error('[Portfolio] watchlist fetch error:', watchlistRes.error.message);
    if (allocationsRes.error) console.error('[Portfolio] allocations fetch error:', allocationsRes.error.message);
    if (snapshotsRes.error) console.error('[Portfolio] snapshots fetch error:', snapshotsRes.error.message);
    if (closedRes.error && closedRes.error.code !== '42P01') console.error('[Portfolio] closed_positions fetch error:', closedRes.error.message);

    const accounts: BrokerAccount[] = (accountsRes.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      broker: r.broker as BrokerName,
      accountType: r.type as AccountType,
      cashBalance: r.cash_balance ?? 0,
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
    // Fallback priority: saved watchlist → user's own portfolio tickers → default list
    const portfolioTickers = [...new Set((positionsRes.data ?? []).map((r: { symbol: string }) => r.symbol))];
    const watchlist = watchlistSymbols.length > 0
      ? watchlistSymbols
      : portfolioTickers.length > 0
      ? portfolioTickers
      : DEFAULT_WATCHLIST;

    const targetAllocations: Record<string, number> = {};
    (allocationsRes.data ?? []).forEach((r) => {
      targetAllocations[r.symbol] = r.percentage;
    });

    const snapshots = (snapshotsRes.data ?? []).map((r) => ({
      date: r.date,
      totalValue: r.total_value,
    }));

    const closedPositions: ClosedPosition[] = (closedRes.data ?? []).map((r) => {
      const gain = (r.sale_price - r.avg_cost) * r.shares;
      const gainPct = r.avg_cost > 0 ? ((r.sale_price - r.avg_cost) / r.avg_cost) * 100 : 0;
      return {
        id: r.id,
        accountId: r.account_id,
        ticker: r.symbol,
        shares: r.shares,
        costBasisPerShare: r.avg_cost,
        salePrice: r.sale_price,
        closedAt: r.closed_at,
        notes: r.notes,
        realizedGain: parseFloat(gain.toFixed(2)),
        realizedGainPct: parseFloat(gainPct.toFixed(2)),
      };
    });

    set({ accounts, positions, closedPositions, watchlist, targetAllocations, snapshots, hydrated: true });
  },

  reset: () => set({ ...INITIAL_STATE }),

  addAccount: async (data, supabase, userId) => {
    const id = uuidv4();
    const newAccount: BrokerAccount = {
      id,
      name: data.name,
      broker: data.broker,
      accountType: data.accountType,
      cashBalance: data.cashBalance ?? 0,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ accounts: [...state.accounts, newAccount] }));
    const { error } = await supabase.from('accounts').insert({
      id,
      user_id: userId,
      name: data.name,
      broker: data.broker,
      type: data.accountType,
      cash_balance: data.cashBalance ?? 0,
    });
    if (error) {
      // Rollback optimistic update
      set((state) => ({ accounts: state.accounts.filter((a) => a.id !== id) }));
      throw new Error(error.message);
    }
    return id;
  },

  updateAccount: async (id, updates, supabase) => {
    const prev = get().accounts.find((a) => a.id === id);
    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }));
    const dbUpdates: Record<string, unknown> = {};
    if (updates.name) dbUpdates.name = updates.name;
    if (updates.broker) dbUpdates.broker = updates.broker;
    if (updates.accountType) dbUpdates.type = updates.accountType;
    if (updates.cashBalance !== undefined) dbUpdates.cash_balance = updates.cashBalance;
    dbUpdates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('accounts').update(dbUpdates).eq('id', id);
    if (error) {
      if (prev) set((state) => ({ accounts: state.accounts.map((a) => (a.id === id ? prev : a)) }));
      throw new Error(error.message);
    }
  },

  deleteAccount: async (id, supabase) => {
    const prevAccount = get().accounts.find((a) => a.id === id);
    const prevPositions = get().positions.filter((p) => p.accountId === id);
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
      positions: state.positions.filter((p) => p.accountId !== id),
    }));
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) {
      if (prevAccount) {
        set((state) => ({
          accounts: [...state.accounts, prevAccount],
          positions: [...state.positions, ...prevPositions],
        }));
      }
      throw new Error(error.message);
    }
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
    const { error } = await supabase.from('positions').insert({
      id,
      user_id: userId,
      account_id: data.accountId,
      symbol: data.ticker.toUpperCase(),
      shares: data.shares,
      avg_cost: data.costBasisPerShare,
      notes: data.notes ?? null,
    });
    if (error) {
      // Rollback optimistic update
      set((state) => ({ positions: state.positions.filter((p) => p.id !== id) }));
      throw new Error(error.message);
    }
  },

  updatePosition: async (id, updates, supabase) => {
    const prev = get().positions.find((p) => p.id === id);
    set((state) => ({
      positions: state.positions.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
    const dbUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.ticker) dbUpdates.symbol = updates.ticker.toUpperCase();
    if (updates.shares !== undefined) dbUpdates.shares = updates.shares;
    if (updates.costBasisPerShare !== undefined) dbUpdates.avg_cost = updates.costBasisPerShare;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    const { error } = await supabase.from('positions').update(dbUpdates).eq('id', id);
    if (error) {
      if (prev) set((state) => ({ positions: state.positions.map((p) => (p.id === id ? prev : p)) }));
      throw new Error(error.message);
    }
  },

  deletePosition: async (id, supabase) => {
    const prev = get().positions.find((p) => p.id === id);
    set((state) => ({ positions: state.positions.filter((p) => p.id !== id) }));
    const { error } = await supabase.from('positions').delete().eq('id', id);
    if (error) {
      if (prev) set((state) => ({ positions: [...state.positions, prev] }));
      throw new Error(error.message);
    }
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

  closePosition: async ({ positionId, salePrice, closedAt, notes }, supabase, userId) => {
    const position = get().positions.find((p) => p.id === positionId);
    if (!position) return;

    const id = uuidv4();
    const gain = (salePrice - position.costBasisPerShare) * position.shares;
    const gainPct =
      position.costBasisPerShare > 0
        ? ((salePrice - position.costBasisPerShare) / position.costBasisPerShare) * 100
        : 0;

    const newClosed: ClosedPosition = {
      id,
      accountId: position.accountId,
      ticker: position.ticker,
      shares: position.shares,
      costBasisPerShare: position.costBasisPerShare,
      salePrice,
      closedAt,
      notes,
      realizedGain: parseFloat(gain.toFixed(2)),
      realizedGainPct: parseFloat(gainPct.toFixed(2)),
    };

    // Optimistic update: remove from open, add to closed
    set((state) => ({
      positions: state.positions.filter((p) => p.id !== positionId),
      closedPositions: [newClosed, ...state.closedPositions],
    }));

    // Write closed record then delete open position
    await supabase.from('closed_positions').insert({
      id,
      user_id: userId,
      account_id: position.accountId,
      symbol: position.ticker,
      shares: position.shares,
      avg_cost: position.costBasisPerShare,
      sale_price: salePrice,
      closed_at: closedAt,
      notes: notes ?? null,
    });
    await supabase.from('positions').delete().eq('id', positionId);
  },

  deleteClosedPosition: async (id, supabase) => {
    set((state) => ({
      closedPositions: state.closedPositions.filter((c) => c.id !== id),
    }));
    await supabase.from('closed_positions').delete().eq('id', id);
  },
}));
