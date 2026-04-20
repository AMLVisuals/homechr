'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Search,
  X,
  CheckCircle2,
  XCircle,
  Eye,
  Clock,
  Euro,
  UserX,
  FileText,
  Loader2,
  Ban,
} from 'lucide-react';
import { clsx } from 'clsx';
import { supabase } from '@/lib/supabase';
import { DISPUTE_REASONS, type DisputeStatus, type DisputeReason } from '@/types/missions';

interface DisputeRow {
  id: string;
  mission_id: string;
  reason: DisputeReason;
  description: string;
  photos?: string[] | null;
  status: DisputeStatus;
  resolution?: string | null;
  resolved_at?: string | null;
  admin_notes?: string | null;
  refund_status?: 'NONE' | 'REQUESTED' | 'REFUNDED' | 'FAILED' | null;
  refund_amount?: number | null;
  stripe_refund_id?: string | null;
  created_at: string;
  patron_name?: string | null;
  worker_name?: string | null;
  mission?: {
    id: string;
    title: string;
    patron_id: string;
    provider_id: string;
    status: string;
    payment_status?: string;
    captured_amount?: number;
    authorized_amount?: number;
    stripe_payment_intent_id?: string;
  } | null;
}

type FilterStatus = 'ALL' | DisputeStatus;

const FILTERS: { id: FilterStatus; label: string; color?: string }[] = [
  { id: 'ALL', label: 'Tous' },
  { id: 'OPEN', label: 'Ouverts', color: 'red' },
  { id: 'UNDER_REVIEW', label: 'En examen', color: 'amber' },
  { id: 'RESOLVED_PATRON', label: 'Résolus patron', color: 'emerald' },
  { id: 'RESOLVED_PROVIDER', label: 'Résolus prestataire', color: 'blue' },
  { id: 'CLOSED', label: 'Clôturés', color: 'gray' },
];

const STATUS_BADGE: Record<DisputeStatus, { label: string; bg: string; text: string }> = {
  OPEN: { label: 'Ouvert', bg: 'bg-red-500/10', text: 'text-red-500' },
  UNDER_REVIEW: { label: 'En examen', bg: 'bg-amber-500/10', text: 'text-amber-500' },
  RESOLVED_PATRON: { label: 'Résolu patron', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
  RESOLVED_PROVIDER: { label: 'Résolu prestataire', bg: 'bg-blue-500/10', text: 'text-blue-500' },
  CLOSED: { label: 'Clôturé', bg: 'bg-gray-500/10', text: 'text-gray-500' },
};

export default function AdminDisputesTab() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<DisputeRow | null>(null);

  async function fetchDisputes() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }
      const url = filter === 'ALL' ? '/api/admin/disputes' : `/api/admin/disputes?status=${filter}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur chargement litiges');
      setDisputes(json.disputes || []);
    } catch (err) {
      console.error('[AdminDisputesTab]', err);
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDisputes();
  }, [filter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return disputes;
    return disputes.filter(
      (d) =>
        d.mission?.title?.toLowerCase().includes(q) ||
        d.patron_name?.toLowerCase().includes(q) ||
        d.worker_name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q)
    );
  }, [disputes, search]);

  const stats = useMemo(() => {
    return {
      open: disputes.filter((d) => d.status === 'OPEN').length,
      review: disputes.filter((d) => d.status === 'UNDER_REVIEW').length,
      resolved: disputes.filter(
        (d) => d.status === 'RESOLVED_PATRON' || d.status === 'RESOLVED_PROVIDER'
      ).length,
      refundedTotal: disputes
        .filter((d) => d.refund_status === 'REFUNDED')
        .reduce((sum, d) => sum + (d.refund_amount || 0), 0),
    };
  }, [disputes]);

  return (
    <div>
      {/* Header + stats */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Litiges</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Gestion des signalements et remboursements Stripe.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={AlertTriangle} label="Ouverts" value={stats.open} color="red" />
        <StatCard icon={Clock} label="En examen" value={stats.review} color="amber" />
        <StatCard icon={CheckCircle2} label="Résolus" value={stats.resolved} color="emerald" />
        <StatCard icon={Euro} label="Remboursé" value={`${stats.refundedTotal.toFixed(0)}€`} color="blue" />
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
                ? 'bg-emerald-500 text-white'
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
          placeholder="Rechercher (mission, patron, prestataire)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Aucun litige {filter !== 'ALL' && `(${FILTERS.find((f) => f.id === filter)?.label.toLowerCase()})`}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d) => (
            <DisputeCard key={d.id} dispute={d} onOpen={() => setSelected(d)} />
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {selected && (
          <ResolveDisputeModal
            dispute={selected}
            onClose={() => setSelected(null)}
            onResolved={() => {
              setSelected(null);
              fetchDisputes();
            }}
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
  icon: typeof AlertTriangle;
  label: string;
  value: string | number;
  color: 'red' | 'amber' | 'emerald' | 'blue';
}) {
  const colorMap = {
    red: 'bg-red-500/10 text-red-500',
    amber: 'bg-amber-500/10 text-amber-500',
    emerald: 'bg-emerald-500/10 text-emerald-500',
    blue: 'bg-blue-500/10 text-blue-500',
  };
  return (
    <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)]">
      <div className="flex items-center gap-2 mb-2">
        <div className={clsx('p-1.5 rounded-lg', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
      </div>
      <p className="text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}

function DisputeCard({ dispute, onOpen }: { dispute: DisputeRow; onOpen: () => void }) {
  const badge = STATUS_BADGE[dispute.status];
  const created = new Date(dispute.created_at).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.button
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="w-full text-left p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border)] hover:border-emerald-500/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--text-primary)] truncate">
            {dispute.mission?.title || 'Mission supprimée'}
          </p>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {DISPUTE_REASONS[dispute.reason]}
          </p>
        </div>
        <span className={clsx('text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap', badge.bg, badge.text)}>
          {badge.label}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] flex-wrap">
        {dispute.patron_name && <span>👤 {dispute.patron_name}</span>}
        {dispute.worker_name && <span>🔧 {dispute.worker_name}</span>}
        <span>🕐 {created}</span>
        {dispute.refund_status === 'REFUNDED' && (
          <span className="text-emerald-500 font-semibold">✓ Remboursé {dispute.refund_amount}€</span>
        )}
        {dispute.refund_status === 'FAILED' && (
          <span className="text-red-500 font-semibold">⚠ Refund échoué</span>
        )}
      </div>
    </motion.button>
  );
}

function ResolveDisputeModal({
  dispute,
  onClose,
  onResolved,
}: {
  dispute: DisputeRow;
  onClose: () => void;
  onResolved: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState(dispute.admin_notes || '');
  const [refundAmount, setRefundAmount] = useState<number | ''>(
    dispute.mission?.captured_amount || dispute.mission?.authorized_amount || ''
  );
  const [blacklist, setBlacklist] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mission = dispute.mission;
  const canRefund =
    mission?.payment_status === 'CAPTURED' ||
    mission?.payment_status === 'PENDING' ||
    mission?.payment_status === 'AUTHORIZED';

  async function submit(action: 'UNDER_REVIEW' | 'RESOLVED_PATRON' | 'RESOLVED_PROVIDER' | 'CLOSED') {
    setSubmitting(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expirée');

      const res = await fetch('/api/admin/disputes/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          disputeId: dispute.id,
          action,
          adminNotes: adminNotes || undefined,
          refundAmount: action === 'RESOLVED_PATRON' && refundAmount ? Number(refundAmount) : undefined,
          blacklist: action !== 'UNDER_REVIEW' ? blacklist : false,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur résolution');
      onResolved();
    } catch (err: any) {
      setError(err?.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

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
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[var(--bg-app)] rounded-2xl shadow-2xl border border-[var(--border)]"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-app)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">Résoudre le litige</h2>
            <p className="text-xs text-[var(--text-secondary)]">{dispute.mission?.title}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Contexte */}
          <section className="grid grid-cols-2 gap-3">
            <InfoField label="Patron" value={dispute.patron_name || '—'} />
            <InfoField label="Prestataire" value={dispute.worker_name || '—'} />
            <InfoField label="Motif" value={DISPUTE_REASONS[dispute.reason]} />
            <InfoField
              label="Statut paiement"
              value={mission?.payment_status || 'NONE'}
              highlight={mission?.payment_status === 'CAPTURED' ? 'emerald' : undefined}
            />
          </section>

          {/* Description litige */}
          <section className="p-3 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)]">
            <p className="text-xs font-semibold text-[var(--text-secondary)] mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3" />
              Description du signalement
            </p>
            <p className="text-sm text-[var(--text-primary)] whitespace-pre-wrap">
              {dispute.description || '(vide)'}
            </p>
            {dispute.photos && dispute.photos.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {dispute.photos.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                    <img src={url} alt="" className="w-20 h-20 rounded-lg object-cover border border-[var(--border)]" />
                  </a>
                ))}
              </div>
            )}
          </section>

          {/* Admin notes */}
          <section>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1.5">
              Note interne / résolution (visible patron et prestataire)
            </label>
            <textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              rows={3}
              placeholder="Expliquer la décision..."
              className="w-full p-3 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm focus:outline-none focus:border-emerald-500 resize-none"
            />
          </section>

          {/* Refund */}
          {canRefund && (
            <section className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/5">
              <label className="flex items-center gap-2 text-sm font-semibold text-emerald-500 mb-2">
                <Euro className="w-4 h-4" />
                Remboursement Stripe
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value ? Number(e.target.value) : '')}
                  min={0}
                  max={mission?.captured_amount || mission?.authorized_amount || 99999}
                  className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-card)] border border-[var(--border)] text-sm"
                  placeholder="Montant en €"
                />
                <span className="text-sm text-[var(--text-secondary)]">/ {mission?.captured_amount || mission?.authorized_amount || 0}€</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5">
                Appliqué uniquement si résolu en faveur du patron. Commission plateforme également remboursée.
              </p>
            </section>
          )}

          {/* Blacklist */}
          <section>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={blacklist}
                onChange={(e) => setBlacklist(e.target.checked)}
                className="w-4 h-4 accent-red-500"
              />
              <Ban className="w-4 h-4 text-red-500" />
              <span>Ajouter à la blacklist réciproque (les 2 parties ne se reverront plus)</span>
            </label>
          </section>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="sticky bottom-0 p-4 border-t border-[var(--border)] bg-[var(--bg-app)] flex gap-2 flex-wrap">
          <button
            onClick={() => submit('UNDER_REVIEW')}
            disabled={submitting || dispute.status === 'UNDER_REVIEW'}
            className="flex-1 min-w-[140px] px-3 py-2.5 rounded-lg bg-amber-500/10 text-amber-500 text-sm font-semibold hover:bg-amber-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            En examen
          </button>
          <button
            onClick={() => submit('RESOLVED_PATRON')}
            disabled={submitting}
            className="flex-1 min-w-[140px] px-3 py-2.5 rounded-lg bg-emerald-500/10 text-emerald-500 text-sm font-semibold hover:bg-emerald-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Patron {canRefund && refundAmount ? `(+refund ${refundAmount}€)` : ''}
          </button>
          <button
            onClick={() => submit('RESOLVED_PROVIDER')}
            disabled={submitting}
            className="flex-1 min-w-[140px] px-3 py-2.5 rounded-lg bg-blue-500/10 text-blue-500 text-sm font-semibold hover:bg-blue-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <UserX className="w-4 h-4" />
            Prestataire
          </button>
          <button
            onClick={() => submit('CLOSED')}
            disabled={submitting}
            className="flex-1 min-w-[140px] px-3 py-2.5 rounded-lg bg-gray-500/10 text-gray-500 text-sm font-semibold hover:bg-gray-500/20 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" />
            Clôturer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function InfoField({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'emerald' | 'red';
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-[var(--text-secondary)] mb-0.5">{label}</p>
      <p
        className={clsx(
          'text-sm font-medium',
          highlight === 'emerald' && 'text-emerald-500',
          highlight === 'red' && 'text-red-500',
          !highlight && 'text-[var(--text-primary)]'
        )}
      >
        {value}
      </p>
    </div>
  );
}
