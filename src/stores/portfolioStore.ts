import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import { BrokerAccount, Position, BrokerName, AccountType } from '@/types/portfolio';

interface PortfolioState {
  accounts: BrokerAccount[];
  positions: Position[];
  watchlist: string[];
  targetAllocations: Record<string, number>;
  snapshots: { date: string; totalValue: number }[];

  // Account actions
  addAccount: (data: { name: string; broker: BrokerName; accountType: AccountType }) => string;
  updateAccount: (id: string, updates: Partial<Omit<BrokerAccount, 'id' | 'createdAt'>>) => void;
  deleteAccount: (id: string) => void;

  // Position actions
  addPosition: (data: { accountId: string; ticker: string; shares: number; costBasisPerShare: number; notes?: string }) => void;
  updatePosition: (id: string, updates: Partial<Omit<Position, 'id' | 'dateAdded'>>) => void;
  deletePosition: (id: string) => void;

  // Watchlist actions
  addToWatchlist: (ticker: string) => void;
  removeFromWatchlist: (ticker: string) => void;

  // Target allocation actions
  setTargetAllocation: (ticker: string, percent: number) => void;
  clearTargetAllocations: () => void;

  // Snapshot actions
  addSnapshot: (totalValue: number) => void;

  // Helpers
  getPositionsByAccount: (accountId: string) => Position[];
  getUniqueTickers: () => string[];
}

export const usePortfolioStore = create<PortfolioState>()(
  persist(
    (set, get) => ({
      accounts: [],
      positions: [],
      watchlist: [
        'AAPL', 'MSFT', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'JPM', 'V', 'UNH',
      ],
      targetAllocations: {},
      snapshots: [],

      addAccount: (data) => {
        const id = uuidv4();
        set((state) => ({
          accounts: [
            ...state.accounts,
            { ...data, id, createdAt: new Date().toISOString() },
          ],
        }));
        return id;
      },

      updateAccount: (id, updates) =>
        set((state) => ({
          accounts: state.accounts.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),

      deleteAccount: (id) =>
        set((state) => ({
          accounts: state.accounts.filter((a) => a.id !== id),
          positions: state.positions.filter((p) => p.accountId !== id),
        })),

      addPosition: (data) =>
        set((state) => ({
          positions: [
            ...state.positions,
            {
              ...data,
              id: uuidv4(),
              ticker: data.ticker.toUpperCase(),
              dateAdded: new Date().toISOString(),
            },
          ],
        })),

      updatePosition: (id, updates) =>
        set((state) => ({
          positions: state.positions.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
        })),

      deletePosition: (id) =>
        set((state) => ({
          positions: state.positions.filter((p) => p.id !== id),
        })),

      addToWatchlist: (ticker) =>
        set((state) => ({
          watchlist: state.watchlist.includes(ticker.toUpperCase())
            ? state.watchlist
            : [...state.watchlist, ticker.toUpperCase()],
        })),

      removeFromWatchlist: (ticker) =>
        set((state) => ({
          watchlist: state.watchlist.filter((t) => t !== ticker.toUpperCase()),
        })),

      setTargetAllocation: (ticker, percent) =>
        set((state) => ({
          targetAllocations: { ...state.targetAllocations, [ticker]: percent },
        })),

      clearTargetAllocations: () => set({ targetAllocations: {} }),

      addSnapshot: (totalValue) =>
        set((state) => ({
          snapshots: [
            ...state.snapshots,
            { date: new Date().toISOString().split('T')[0], totalValue },
          ],
        })),

      getPositionsByAccount: (accountId) =>
        get().positions.filter((p) => p.accountId === accountId),

      getUniqueTickers: () =>
        [...new Set(get().positions.map((p) => p.ticker))],
    }),
    {
      name: 'portfolio-storage',
    }
  )
);
