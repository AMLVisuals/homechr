'use client';

import { useState, useMemo } from 'react';
import { Search, Crown } from 'lucide-react';
import { clsx } from 'clsx';
import { useAdminStore } from '@/store/useAdminStore';
import type { Subscription, SubscriptionStatus } from '@/types/admin';

type FilterType = 'ALL' | 'ACTIVE' | 'CANCELLED' | 'EXPIRED';

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'ACTIVE', label: 'Actifs' },
  { id: 'CANCELLED', label: 'Annulés' },
  { id: 'EXPIRED', label: 'Expirés' },
];

const STATUS_STYLES: Record<SubscriptionStatus, { label: string; className: string }> = {
  ACTIVE: { label: 'Actif', className: 'bg-green-500/10 text-green-500' },
  CANCELLED: { label: 'Annulé', className: 'bg-red-500/10 text-red-500' },
  EXPIRED: { label: 'Expiré', className: 'bg-[var(--bg-hover)] text-[var(--text-muted)]' },
};

export default function AdminSubscriptionsTab() {
  const { adminUser } = useAdminStore();
  const isAdmin = adminUser?.role === 'ADMIN';

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterType>('ALL');
  const subscriptions: Subscription[] = [];

  const filteredSubs = useMemo(() => {
    let result = subscriptions;
    if (filter !== 'ALL') result = result.filter((s) => s.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) => s.userName.toLowerCase().includes(q) || (s.establishmentName?.toLowerCase().includes(q) ?? false)
      );
    }
    return result;
  }, [filter, search]);

  const activeCount = subscriptions.filter((s) => s.status === 'ACTIVE').length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">Abonnements</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">{activeCount} abonnements actifs</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Rechercher par nom ou établissement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-emerald-500/50 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={clsx(
                'px-3 py-2 rounded-xl text-xs font-medium transition-colors',
                filter === f.id
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Subscriptions Table */}
      <div className="bg-[var(--bg-card)] rounded-2xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg-hover)]">
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Utilisateur</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Établissement</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Plan</th>
                {isAdmin && (
                  <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Montant</th>
                )}
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Début</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Expiration</th>
                <th className="text-left px-4 py-3 text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.map((sub) => {
                const style = STATUS_STYLES[sub.status];
                return (
                  <tr key={sub.id} className="border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{sub.userName}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.establishmentName || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                        <Crown className="w-3 h-3" />
                        PREMIUM
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 font-medium text-[var(--text-primary)]">{sub.amount} €/mois</td>
                    )}
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.startDate}</td>
                    <td className="px-4 py-3 text-[var(--text-secondary)]">{sub.endDate}</td>
                    <td className="px-4 py-3">
                      <span className={clsx('text-xs font-bold px-2 py-0.5 rounded-full', style.className)}>
                        {style.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-[var(--border)]">
          {filteredSubs.map((sub) => {
            const style = STATUS_STYLES[sub.status];
            return (
              <div key={sub.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-[var(--text-primary)]">{sub.userName}</div>
                    <div className="text-xs text-[var(--text-muted)]">{sub.establishmentName}</div>
                  </div>
                  <span className={clsx('text-[10px] font-bold px-2 py-0.5 rounded-full', style.className)}>
                    {style.label}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1 font-bold px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-yellow-500 text-black">
                    <Crown className="w-2.5 h-2.5" /> PREMIUM
                  </span>
                  {isAdmin && <span>{sub.amount} €/mois</span>}
                  <span>{sub.startDate} → {sub.endDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {filteredSubs.length === 0 && (
          <div className="p-12 text-center text-[var(--text-muted)] text-sm">Aucun abonnement trouvé</div>
        )}
      </div>
    </div>
  );
}
