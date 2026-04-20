'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard,
  Search,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  Euro,
  Calendar,
  ExternalLink,
  X,
  Receipt,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import EmptyState from '@/components/shared/EmptyState';

type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'CAPTURED' | 'RELEASED' | 'REFUNDED' | 'FAILED';

interface PaymentRow {
  id: string;
  title: string;
  status: string;
  payment_status: PaymentStatus | null;
  authorized_amount: number | null;
  captured_amount: number | null;
  platform_fee_amount: number | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  captured_at?: string | null;
  provider_id?: string | null;
  worker_name?: string | null;
}

type FilterStatus = 'ALL' | PaymentStatus;

const FILTERS: { id: FilterStatus; label: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'PENDING', label: 'Bloqués' },
  { id: 'CAPTURED', label: 'Payés' },
  { id: 'RELEASED', label: 'Libérés' },
  { id: 'REFUNDED', label: 'Remboursés' },
  { id: 'FAILED', label: 'Échoués' },
];

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; text: string; Icon: typeof CheckCircle2 }> = {
  PENDING: { label: 'Bloqué (pré-auto)', bg: 'bg-amber-500/10', text: 'text-amber-500', Icon: Clock },
  AUTHORIZED: { label: 'Autorisé', bg: 'bg-blue-500/10', text: 'text-blue-500', Icon: CheckCircle2 },
  CAPTURED: { label: 'Payé', bg: 'bg-emerald-500/10', text: 'text-emerald-500', Icon: CheckCircle2 },
  RELEASED: { label: 'Libéré', bg: 'bg-gray-500/10', text: 'text-gray-500', Icon: RefreshCw },
  REFUNDED: { label: 'Remboursé', bg: 'bg-purple-500/10', text: 'text-purple-500', Icon: RefreshCw },
  FAILED: { label: 'Échoué', bg: 'bg-red-500/10', text: 'text-red-500', Icon: XCircle },
};

export default function PaymentsTab() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PaymentRow | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    loadPayments();
  }, [user?.id]);

  async function loadPayments() {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('id, title, status, payment_status, authorized_amount, captured_amount, platform_fee_amount, stripe_payment_intent_id, created_at, captured_at, provider_id')
        .eq('patron_id', user.id)
        .not('payment_status', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Enrichir avec le nom du prestataire
      const workerIds = Array.from(
        new Set((data || []).map((d: any) => d.provider_id).filter(Boolean))
      );
      const workersMap = new Map<string, string>();
      if (workerIds.length > 0) {
        const { data: workers } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, email')
          .in('id', workerIds);
        (workers || []).forEach((w: any) => {
          const name = `${w.first_name || ''} ${w.last_name || ''}`.trim() || w.email;
          workersMap.set(w.id, name);
        });
      }

      setPayments(
        (data || []).map((d: any) => ({
          ...d,
          worker_name: d.provider_id ? workersMap.get(d.provider_id) || null : null,
        }))
      );
    } catch (err) {
      console.error('[PaymentsTab] load error:', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }

  const filtered = useMemo(() => {
    let rows = payments;
    if (filter !== 'ALL') {
      rows = rows.filter((p) => p.payment_status === filter);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.worker_name?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [payments, filter, search]);

  const stats = useMemo(() => {
    let totalSpent = 0;
    let totalFees = 0;
    let totalRefunded = 0;
    let totalBlocked = 0;

    for (const p of payments) {
      if (p.payment_status === 'CAPTURED') {
        totalSpent += p.captured_amount || 0;
        totalFees += p.platform_fee_amount || 0;
      } else if (p.payment_status === 'REFUNDED') {
        totalRefunded += p.captured_amount || p.authorized_amount || 0;
      } else if (p.payment_status === 'PENDING' || p.payment_status === 'AUTHORIZED') {
        totalBlocked += p.authorized_amount || 0;
      }
    }

    return { totalSpent, totalFees, totalRefunded, totalBlocked };
  }, [payments]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            <CreditCard className="w-5 h-5 text-blue-500" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Paiements</h1>
        </div>
        <p className="text-sm text-[var(--text-secondary)] ml-12">
          Historique de vos paiements Stripe pour les missions.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={TrendingUp}
          label="Total dépensé"
          value={`${stats.totalSpent.toFixed(2)} €`}
          color="emerald"
        />
        <StatCard
          icon={Clock}
          label="En attente (bloqués)"
          value={`${stats.totalBlocked.toFixed(2)} €`}
          color="amber"
        />
        <StatCard
          icon={Euro}
          label="Commission payée"
          value={`${stats.totalFees.toFixed(2)} €`}
          color="blue"
        />
        <StatCard
          icon={TrendingDown}
          label="Remboursé"
          value={`${stats.totalRefunded.toFixed(2)} €`}
          color="purple"
        />
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
              filter === f.id
                ? 'bg-blue-500 text-white'
                : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recherche */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-secondary)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (mission, prestataire)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title={filter === 'ALL' ? 'Aucun paiement' : `Aucun paiement ${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()}`}
          description="Les paiements apparaîtront ici une fois qu'une mission sera bloquée sur votre carte."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <PaymentRow key={p.id} payment={p} onOpen={() => setSelected(p)} />
          ))}
        </div>
      )}

      {/* Modal détails */}
      <AnimatePresence>
        {selected && (
          <PaymentDetailsModal
            payment={selected}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof CheckCircle2;
  label: string;
  value: string;
  color: 'emerald' | 'amber' | 'blue' | 'purple';
}) {
  const colorMap = {
    emerald: 'bg-emerald-500/10 text-emerald-500',
    amber: 'bg-amber-500/10 text-amber-500',
    blue: 'bg-blue-500/10 text-blue-500',
    purple: 'bg-purple-500/10 text-purple-500',
  };

  return (
    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <div className={clsx('p-1.5 rounded-lg', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      </div>
      <p className="text-xl lg:text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function PaymentRow({ payment, onOpen }: { payment: PaymentRow; onOpen: () => void }) {
  const status = payment.payment_status ? STATUS_CONFIG[payment.payment_status] : null;
  const amount = payment.captured_amount || payment.authorized_amount || 0;
  const date = new Date(payment.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="w-full text-left p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-blue-500/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm text-[var(--text-primary)] truncate">{payment.title}</p>
            {status && (
              <span className={clsx('text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap', status.bg, status.text)}>
                {status.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] flex-wrap">
            {payment.worker_name && <span>🔧 {payment.worker_name}</span>}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {date}
            </span>
            {payment.platform_fee_amount && (
              <span>Commission {payment.platform_fee_amount.toFixed(2)}€</span>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-[var(--text-primary)]">{amount.toFixed(2)}€</p>
        </div>
      </div>
    </motion.button>
  );
}

function PaymentDetailsModal({
  payment,
  onClose,
}: {
  payment: PaymentRow;
  onClose: () => void;
}) {
  const status = payment.payment_status ? STATUS_CONFIG[payment.payment_status] : null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[var(--bg-app)] rounded-2xl shadow-2xl border border-[var(--border)] overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Détails paiement</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Mission</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">{payment.title}</p>
          </div>

          {payment.worker_name && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Prestataire</p>
              <p className="text-sm text-[var(--text-primary)]">{payment.worker_name}</p>
            </div>
          )}

          {status && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Statut</p>
              <span className={clsx('inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full', status.bg, status.text)}>
                <status.Icon className="w-3 h-3" />
                {status.label}
              </span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {payment.authorized_amount !== null && (
              <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">Autorisé</p>
                <p className="text-sm font-bold">{payment.authorized_amount?.toFixed(2)}€</p>
              </div>
            )}
            {payment.captured_amount !== null && (
              <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">Capturé</p>
                <p className="text-sm font-bold text-emerald-500">{payment.captured_amount?.toFixed(2)}€</p>
              </div>
            )}
            {payment.platform_fee_amount !== null && (
              <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
                <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">Commission (15%)</p>
                <p className="text-sm font-bold">{payment.platform_fee_amount?.toFixed(2)}€</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-[var(--bg-hover)]">
              <p className="text-[11px] font-semibold text-[var(--text-secondary)] uppercase mb-1">Net prestataire</p>
              <p className="text-sm font-bold text-blue-500">
                {((payment.captured_amount || 0) - (payment.platform_fee_amount || 0)).toFixed(2)}€
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Créé le</p>
            <p className="text-sm text-[var(--text-primary)]">
              {new Date(payment.created_at).toLocaleString('fr-FR')}
            </p>
          </div>

          {payment.captured_at && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Capturé le</p>
              <p className="text-sm text-[var(--text-primary)]">
                {new Date(payment.captured_at).toLocaleString('fr-FR')}
              </p>
            </div>
          )}

          {payment.stripe_payment_intent_id && (
            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Référence Stripe</p>
              <div className="flex items-center gap-2">
                <code className="text-[11px] bg-[var(--bg-hover)] px-2 py-1 rounded flex-1 truncate">
                  {payment.stripe_payment_intent_id}
                </code>
                <a
                  href={`https://dashboard.stripe.com/test/payments/${payment.stripe_payment_intent_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded hover:bg-[var(--bg-hover)]"
                  title="Voir dans Stripe dashboard (test)"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                </a>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
