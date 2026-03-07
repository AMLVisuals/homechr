import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  addItem: (item: StockItem) => void;
  updateItem: (id: string, updates: Partial<StockItem>) => void;
  removeItem: (id: string) => void;
  applyChanges: (changes: Record<string, number>) => void;
}

const INITIAL_ITEMS: StockItem[] = [
  { id: 's1', name: 'Coca-Cola 33cl', quantity: 48, unit: 'bouteilles', alertThreshold: 12, category: 'BOISSONS', supplier: 'Metro', unitPrice: 0.85, venueId: 'v1', lastUpdated: '2026-02-28' },
  { id: 's2', name: 'Perrier 75cl', quantity: 24, unit: 'bouteilles', alertThreshold: 6, category: 'BOISSONS', supplier: 'Metro', unitPrice: 1.20, venueId: 'v1', lastUpdated: '2026-02-28' },
  { id: 's3', name: 'Bière pression 50L', quantity: 3, unit: 'fûts', alertThreshold: 2, category: 'BOISSONS', supplier: 'Heineken France', unitPrice: 89.00, venueId: 'v1', lastUpdated: '2026-02-27' },
  { id: 's4', name: 'Café en grains 1kg', quantity: 5, unit: 'paquets', alertThreshold: 3, category: 'ALIMENTATION', supplier: 'Illy', unitPrice: 22.50, venueId: 'v1', lastUpdated: '2026-02-28' },
  { id: 's5', name: 'Farine T55 25kg', quantity: 2, unit: 'sacs', alertThreshold: 1, category: 'ALIMENTATION', supplier: 'Brake', unitPrice: 18.00, venueId: 'v1', lastUpdated: '2026-02-26' },
  { id: 's6', name: 'Huile d\'olive 5L', quantity: 1, unit: 'bidons', alertThreshold: 2, category: 'ALIMENTATION', supplier: 'Brake', unitPrice: 24.90, venueId: 'v1', lastUpdated: '2026-02-25' },
  { id: 's7', name: 'Serviettes papier', quantity: 200, unit: 'paquets', alertThreshold: 50, category: 'CONSOMMABLES', supplier: 'ProHygiène', unitPrice: 2.50, venueId: 'v1', lastUpdated: '2026-02-28' },
  { id: 's8', name: 'Produit vaisselle pro 5L', quantity: 4, unit: 'bidons', alertThreshold: 2, category: 'CONSOMMABLES', supplier: 'ProHygiène', unitPrice: 12.90, venueId: 'v1', lastUpdated: '2026-02-27' },
  { id: 's9', name: 'Gants jetables L', quantity: 8, unit: 'boîtes (100)', alertThreshold: 3, category: 'CONSOMMABLES', supplier: 'ProHygiène', unitPrice: 6.90, venueId: 'v1', lastUpdated: '2026-02-26' },
  { id: 's10', name: 'Ampoules LED E27', quantity: 6, unit: 'pièces', alertThreshold: 4, category: 'EQUIPEMENTS', supplier: 'Rexel', unitPrice: 4.50, venueId: 'v1', lastUpdated: '2026-02-24' },
];

export const useStockStore = create<StockState>()(
  persist(
    (set) => ({
      items: INITIAL_ITEMS,
      history: [],
      lastValidatedAt: null,
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
    }),
    { name: 'stock-storage-v2' }
  )
);
