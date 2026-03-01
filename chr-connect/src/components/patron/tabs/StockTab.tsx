'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Package, Wine, UtensilsCrossed, Paintbrush, Wrench,
  AlertTriangle, X, Trash2, Edit3, Check, Crown, TrendingDown, BarChart3, Truck,
} from 'lucide-react';
import { clsx } from 'clsx';
import { SkeletonTable } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { useStockStore, StockCategory, StockItem } from '@/store/useStockStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useStore } from '@/store/useStore';

const CATEGORIES: { id: StockCategory | 'ALL'; label: string; icon: React.ElementType }[] = [
  { id: 'ALL', label: 'Tout', icon: Package },
  { id: 'BOISSONS', label: 'Boissons', icon: Wine },
  { id: 'ALIMENTATION', label: 'Alimentation', icon: UtensilsCrossed },
  { id: 'CONSOMMABLES', label: 'Consommables', icon: Paintbrush },
  { id: 'EQUIPEMENTS', label: 'Équipements', icon: Wrench },
];

export default function StockTab() {
  const { isPremium } = useStore();
  const { items, addItem, updateItem, removeItem } = useStockStore();
  const { activeVenueId } = useVenuesStore();
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<StockCategory | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);

  // Add form state
  const [newName, setNewName] = useState('');
  const [newQuantity, setNewQuantity] = useState('');
  const [newUnit, setNewUnit] = useState('unités');
  const [newThreshold, setNewThreshold] = useState('');
  const [newCategory, setNewCategory] = useState<StockCategory>('BOISSONS');
  const [newSupplier, setNewSupplier] = useState('');
  const [newPrice, setNewPrice] = useState('');

  const filteredItems = items.filter((item) => {
    if (activeVenueId && item.venueId !== activeVenueId) return false;
    if (filter !== 'ALL' && item.category !== filter) return false;
    if (searchQuery && !item.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const lowStockCount = items.filter(
    (i) => (!activeVenueId || i.venueId === activeVenueId) && i.quantity <= i.alertThreshold
  ).length;

  const resetForm = () => {
    setNewName('');
    setNewQuantity('');
    setNewUnit('unités');
    setNewThreshold('');
    setNewCategory('BOISSONS');
    setNewSupplier('');
    setNewPrice('');
  };

  const handleAdd = () => {
    if (!newName || !newQuantity) return;
    addItem({
      id: `s-${Date.now()}`,
      name: newName,
      quantity: parseFloat(newQuantity),
      unit: newUnit,
      alertThreshold: parseFloat(newThreshold) || 0,
      category: newCategory,
      supplier: newSupplier || undefined,
      unitPrice: newPrice ? parseFloat(newPrice) : undefined,
      venueId: activeVenueId || 'v1',
      lastUpdated: new Date().toISOString().split('T')[0],
    });
    resetForm();
    setShowAddModal(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleQuantityChange = (item: StockItem, delta: number) => {
    const newQty = Math.max(0, item.quantity + delta);
    updateItem(item.id, { quantity: newQty });
  };

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="h-full flex items-center justify-center p-4"
      >
        <div className="w-full max-w-md bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl p-8 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-yellow-500/10 blur-3xl rounded-full -ml-10 -mb-10" />

          <div className="relative">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Crown className="w-8 h-8 text-black" />
            </div>

            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Fonctionnalite Premium
            </h3>
            <p className="text-[var(--text-secondary)] text-sm mb-6">
              La gestion de stock est reservee aux abonnes Premium.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: TrendingDown, text: 'Alertes automatiques en cas de stock bas' },
                { icon: BarChart3, text: 'Suivi en temps reel de votre inventaire' },
                { icon: Truck, text: 'Gestion des fournisseurs et prix unitaires' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)]">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                    <item.icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-sm text-[var(--text-primary)] font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => window.dispatchEvent(new CustomEvent('set-patron-tab', { detail: 'PREMIUM' }))}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Passer Premium — 100 EUR/mois
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) return <SkeletonTable />;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-4 mb-8">
        <div className="text-center md:text-left w-full md:w-auto">
          <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">
            Stock
          </h2>
          <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium">
            Gérez l&apos;inventaire de vos établissements
          </p>
        </div>

        <div className="flex items-center gap-3">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-sm font-bold text-red-400">{lowStockCount} en stock bas</span>
            </div>
          )}

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-blue-500/25 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500 placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilter(cat.id)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap border flex items-center gap-1.5',
                filter === cat.id
                  ? 'bg-[var(--text-primary)] text-[var(--bg-app)] border-[var(--text-primary)]'
                  : 'bg-transparent text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--border-strong)]'
              )}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredItems.map((item) => {
            const isLow = item.quantity <= item.alertThreshold;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  'bg-[var(--bg-card)] rounded-xl p-4 border transition-all group',
                  isLow ? 'border-red-500/30' : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-[var(--text-primary)] truncate">{item.name}</h3>
                      {isLow && (
                        <span className="shrink-0 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] font-bold rounded-full uppercase">
                          Bas
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--text-muted)]">
                      {item.category} {item.supplier && `• ${item.supplier}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-7 h-7 rounded-lg hover:bg-red-500/10 flex items-center justify-center text-[var(--text-muted)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className={clsx('text-2xl font-bold', isLow ? 'text-red-400' : 'text-[var(--text-primary)]')}>
                      {item.quantity}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{item.unit}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(item, -1)}
                      className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors font-bold"
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleQuantityChange(item, 1)}
                      className="w-8 h-8 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-primary)] hover:bg-[var(--bg-active)] transition-colors font-bold"
                    >
                      +
                    </button>
                  </div>
                </div>

                {item.unitPrice && (
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    {item.unitPrice.toFixed(2)} €/{item.unit.replace(/s$/, '')}
                    {' '}• Valeur : {(item.quantity * item.unitPrice).toFixed(2)} €
                  </p>
                )}
              </motion.div>
            );
          })}

          {filteredItems.length === 0 && (
            <div className="col-span-2">
              <EmptyState
                icon={Package}
                title="Aucun article en stock"
                description="Ajoutez votre premier article pour commencer à gérer votre inventaire."
                actionLabel="Ajouter un article"
                onAction={() => setShowAddModal(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowAddModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Nouvel article</h2>
                <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-[var(--bg-card)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors">
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Nom de l&apos;article</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" placeholder="Ex: Coca-Cola 33cl" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Quantité</label>
                    <input type="number" value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Unité</label>
                    <input value={newUnit} onChange={(e) => setNewUnit(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Catégorie</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as StockCategory)}
                    className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                  >
                    <option value="BOISSONS">Boissons</option>
                    <option value="ALIMENTATION">Alimentation</option>
                    <option value="CONSOMMABLES">Consommables</option>
                    <option value="EQUIPEMENTS">Équipements</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Seuil d&apos;alerte</label>
                    <input type="number" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Prix unitaire (€)</label>
                    <input type="number" step="0.01" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Fournisseur</label>
                  <input value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" placeholder="Optionnel" />
                </div>
              </div>

              <div className="p-6 border-t border-[var(--border)]">
                <button
                  onClick={handleAdd}
                  disabled={!newName || !newQuantity}
                  className={clsx(
                    'w-full py-3.5 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                    newName && newQuantity
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                      : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                  )}
                >
                  <Check className="w-5 h-5" />
                  Ajouter l&apos;article
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
