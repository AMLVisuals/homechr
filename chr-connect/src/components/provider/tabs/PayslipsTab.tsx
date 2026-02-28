'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt, Download, Calendar, Clock, Search,
  X, ChevronDown, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePayslipsStore } from '@/store/usePayslipsStore';
import type { Payslip, PayslipStatus } from '@/types/payslip';
import { PAYSLIP_STATUS_INFO, PAYSLIP_PERIOD_LABELS } from '@/types/payslip';

const STATUS_FILTERS: { key: PayslipStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tous' },
  { key: 'PAID', label: 'Payés' },
  { key: 'PENDING', label: 'En attente' },
  { key: 'PROCESSING', label: 'En cours' },
];

export function PayslipsTab() {
  const { payslips, fetchPayslips, downloadPayslipPdf, isLoading } = usePayslipsStore();
  const [statusFilter, setStatusFilter] = useState<PayslipStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    fetchPayslips();
  }, [fetchPayslips]);

  const filtered = useMemo(() => {
    let list = payslips.filter(p => !p.isDeleted);
    if (statusFilter !== 'ALL') {
      list = list.filter(p => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.number.toLowerCase().includes(q) ||
        p.period.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime());
  }, [payslips, statusFilter, search]);

  const totalNet = useMemo(() => filtered.reduce((sum, p) => sum + p.netAmount, 0), [filtered]);

  const handleDownload = async (payslip: Payslip) => {
    setIsDownloading(true);
    try {
      const blob = await downloadPayslipPdf(payslip.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Bulletin-${payslip.number}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // handled by store
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2">
          <Receipt className="w-5 h-5 text-purple-500" />
          Mes fiches de paie
        </h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">Consultez et téléchargez vos bulletins de salaire</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          type="text"
          placeholder="Rechercher par numéro ou période..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[var(--bg-card)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-all"
        />
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setStatusFilter(f.key)}
            className={clsx(
              "px-4 py-2 rounded-lg text-xs font-bold transition-all",
              statusFilter === f.key
                ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20"
                : "bg-[var(--bg-card)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--bg-active)]"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="flex gap-4">
        <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Total net perçu</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{totalNet.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</div>
        </div>
        <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] p-4">
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider font-bold mb-1">Bulletins</div>
          <div className="text-2xl font-bold text-[var(--text-primary)]">{filtered.length}</div>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)] text-sm">Aucune fiche de paie trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(payslip => {
            const statusInfo = PAYSLIP_STATUS_INFO[payslip.status];
            return (
              <motion.div
                key={payslip.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedPayslip(payslip)}
                className="bg-[var(--bg-card)] border border-[var(--border)] rounded-xl p-4 hover:border-blue-500/30 transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center shrink-0">
                    <Receipt className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[var(--text-primary)]">{payslip.number}</span>
                      <span className={clsx('px-2 py-0.5 rounded-full text-[10px] font-bold', statusInfo.bgColor, statusInfo.color)}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-[var(--text-muted)]">
                      <Calendar className="w-3 h-3" />
                      <span>{payslip.period}</span>
                      {payslip.hoursWorked && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                          <Clock className="w-3 h-3" />
                          <span>{payslip.hoursWorked}h</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-lg font-bold text-[var(--text-primary)]">{payslip.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</div>
                    <div className="text-[10px] text-[var(--text-muted)]">net</div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedPayslip && (
          <PayslipDetailView
            payslip={selectedPayslip}
            onClose={() => setSelectedPayslip(null)}
            onDownload={() => handleDownload(selectedPayslip)}
            isDownloading={isDownloading}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Detail view (read-only, no status management) ────────────────────────────

function PayslipDetailView({ payslip, onClose, onDownload, isDownloading }: {
  payslip: Payslip;
  onClose: () => void;
  onDownload: () => void;
  isDownloading: boolean;
}) {
  const statusInfo = PAYSLIP_STATUS_INFO[payslip.status];
  const charges = payslip.grossAmount - payslip.netAmount;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200]"
      />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed inset-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[85vh] bg-[var(--bg-sidebar)] md:border md:border-[var(--border)] md:rounded-3xl shadow-2xl z-[201] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/20 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">{payslip.number}</h2>
              <p className="text-xs text-[var(--text-muted)]">{payslip.period}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={clsx('px-3 py-1.5 rounded-full text-xs font-medium', statusInfo.bgColor, statusInfo.color)}>
              {statusInfo.label}
            </span>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
          {/* Period Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[var(--bg-hover)] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Calendar className="w-3.5 h-3.5" /> Période
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{PAYSLIP_PERIOD_LABELS[payslip.periodType]}</div>
              <div className="text-xs text-[var(--text-muted)] mt-0.5">{payslip.startDate} → {payslip.endDate}</div>
            </div>
            <div className="bg-[var(--bg-hover)] rounded-xl p-3">
              <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                <Clock className="w-3.5 h-3.5" /> Heures
              </div>
              <div className="text-sm font-medium text-[var(--text-primary)]">{payslip.hoursWorked || 0}h</div>
              {(payslip.overtimeHours || 0) > 0 && (
                <div className="text-xs text-blue-500 mt-0.5">+{payslip.overtimeHours}h sup.</div>
              )}
            </div>
          </div>

          {/* Breakdown */}
          <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
            <div className="p-4 border-b border-[var(--border)] bg-gradient-to-r from-blue-600/5 to-transparent">
              <h3 className="text-sm font-bold text-[var(--text-secondary)]">Détail du bulletin</h3>
            </div>
            <div className="p-4 space-y-3">
              {payslip.hoursWorked && payslip.hourlyRate && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Heures normales ({payslip.hoursWorked}h x {payslip.hourlyRate}&euro;)</span>
                  <span className="text-[var(--text-primary)] font-medium">{(payslip.hoursWorked * payslip.hourlyRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
              )}
              {(payslip.overtimeHours || 0) > 0 && payslip.overtimeRate && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)]">Heures sup. ({payslip.overtimeHours}h x {payslip.overtimeRate}&euro;)</span>
                  <span className="text-[var(--text-primary)] font-medium">{((payslip.overtimeHours || 0) * payslip.overtimeRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
              )}

              <div className="border-t border-[var(--border)] pt-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-secondary)] font-bold">Salaire Brut</span>
                  <span className="text-[var(--text-primary)] font-bold">{payslip.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Impôts</span>
                  <span className="text-[var(--text-secondary)]">-{payslip.taxAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Sécurité sociale</span>
                  <span className="text-[var(--text-secondary)]">-{payslip.socialSecurity.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--text-muted)]">Charges totales</span>
                  <span className="text-[var(--text-secondary)]">-{charges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
              </div>

              <div className="border-t border-[var(--border)] pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[var(--text-primary)]">Net à payer</span>
                  <span className="text-2xl font-bold text-blue-500">{payslip.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}&euro;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-[var(--text-muted)] space-y-1">
            <div>Émis le : {new Date(payslip.issueDate).toLocaleDateString('fr-FR')}</div>
          </div>
        </div>

        {/* Download */}
        <div className="p-4 md:p-6 border-t border-[var(--border)]">
          <button
            onClick={onDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {isDownloading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Télécharger PDF
          </button>
        </div>
      </motion.div>
    </>
  );
}
