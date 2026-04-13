import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  getStockByVenue,
  upsertStockItem,
  deleteStockItem,
} from '@/lib/supabase-helpers';

export type StockCategory = 'BOISSONS' | 'ALIMENTATION' | 'CONSOMMABLES' | 'EQUIPEMENTS';

export interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  alertThreshold: number;
  category: StockCategory;
  supplier?: string;
  unitPrice?: number;
  venueId: string;
  lastUpdated: string;
}

export interface StockHistoryEntry {
  id: string;
  timestamp: string;
  changes: { itemId: string; itemName: string; oldQty: number; newQty: number }[];
}

interface StockState {
  items: StockItem[];
  history: StockHistoryEntry[];
  lastValidatedAt: string | null;
  isLoading: boolean;
  error: string | null;

  // Existing local actions (backward compat)
  addItem: (item: StockItem) => void;
  updateItem: (id: string, updates: Partial<StockItem>) => void;
  removeItem: (id: string) => void;
  applyChanges: (changes: Record<string, number>) => void;

  // Async Supabase actions
  fetchStock: (venueId: string) => Promise<void>;
  syncAddItem: (item: StockItem) => Promise<void>;
  syncUpdateItem: (id: string, updates: Partial<StockItem>) => Promise<void>;
  syncRemoveItem: (id: string) => Promise<void>;
}

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      items: [],
      history: [],
      lastValidatedAt: null,
      isLoading: false,
      error: null,

      // ── Existing local actions (backward compat) ──────────────────────
      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, lastUpdated: new Date().toISOString().split('T')[0] } : item
          ),
        })),
      removeItem: (id) =>
        set((state) => ({ items: state.items.filter((item) => item.id !== id) })),
      applyChanges: (changes) =>
        set((state) => {
          const now = new Date().toISOString();
          const today = now.split('T')[0];
          const changeEntries: StockHistoryEntry['changes'] = [];

          const updatedItems = state.items.map((item) => {
            if (changes[item.id] !== undefined && changes[item.id] !== item.quantity) {
              changeEntries.push({
                itemId: item.id,
                itemName: item.name,
                oldQty: item.quantity,
                newQty: changes[item.id],
              });
              return { ...item, quantity: changes[item.id], lastUpdated: today };
            }
            return item;
          });

          if (changeEntries.length === 0) return state;

          const entry: StockHistoryEntry = {
            id: `h-${Date.now()}`,
            timestamp: now,
            changes: changeEntries,
          };

          return {
            items: updatedItems,
            history: [entry, ...state.history].slice(0, 50),
            lastValidatedAt: now,
          };
        }),

      // ── Async Supabase actions ────────────────────────────────────────
      fetchStock: async (venueId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await getStockByVenue(venueId);
          set({ items: (data as StockItem[] | null) ?? [], isLoading: false });
        } catch (err) {
          console.error('[useStockStore] fetchStock failed, keeping local data:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors du chargement du stock' });
        }
      },

      syncAddItem: async (item: StockItem) => {
        set({ isLoading: true, error: null });
        try {
          await upsertStockItem(item);
          set((state) => ({ items: [...state.items, item], isLoading: false }));
        } catch (err) {
          console.error('[useStockStore] syncAddItem failed:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors de l\'ajout' });
        }
      },

      syncUpdateItem: async (id: string, updates: Partial<StockItem>) => {
        const existing = get().items.find((i) => i.id === id);
        if (!existing) return;

        const updated = { ...existing, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
        set({ isLoading: true, error: null });
        try {
          await upsertStockItem(updated);
          set((state) => ({
            items: state.items.map((item) => (item.id === id ? updated : item)),
            isLoading: false,
          }));
        } catch (err) {
          console.error('[useStockStore] syncUpdateItem failed:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors de la mise a jour' });
        }
      },

      syncRemoveItem: async (id: string) => {
        set({ isLoading: true, error: null });
        try {
          await deleteStockItem(id);
          set((state) => ({ items: state.items.filter((item) => item.id !== id), isLoading: false }));
        } catch (err) {
          console.error('[useStockStore] syncRemoveItem failed:', err);
          set({ isLoading: false, error: err instanceof Error ? err.message : 'Erreur lors de la suppression' });
        }
      },
    }),
    { name: 'stock-storage-v2' }
  )
);
