'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Download, RefreshCw, Calendar, Clock,
  DollarSign, Receipt, ChevronDown,
} from 'lucide-react';
import { clsx } from 'clsx';
import { usePayslipsStore } from '@/store/usePayslipsStore';
import type { Payslip, PayslipStatus } from '@/types/payslip';
import { PAYSLIP_STATUS_INFO, PAYSLIP_PERIOD_LABELS } from '@/types/payslip';

interface PayslipDetailModalProps {
  payslip: Payslip;
  isOpen: boolean;
  onClose: () => void;
}

export default function PayslipDetailModal({ payslip, isOpen, onClose }: PayslipDetailModalProps) {
  const { downloadPayslipPdf, regeneratePayslip, updatePayslipStatus } = usePayslipsStore();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const statusInfo = PAYSLIP_STATUS_INFO[payslip.status];

  const handleDownload = async () => {
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
      // Error handled by store
    } finally {
      setIsDownloading(false);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      await regeneratePayslip(payslip.id);
    } catch {
      // Error handled by store
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleStatusChange = async (status: 'PAID' | 'PENDING' | 'FAILED') => {
    await updatePayslipStatus(payslip.id, status);
    setShowStatusMenu(false);
  };

  const charges = payslip.grossAmount - payslip.netAmount;

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />

          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[85vh] md:rounded-3xl bg-[var(--bg-sidebar)] md:border md:border-[var(--border)] shadow-2xl z-[9999] flex flex-col overflow-hidden"
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
              <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
              {/* Employee & Status */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[var(--text-secondary)]">Employe</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{payslip.employeeName}</div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setShowStatusMenu(!showStatusMenu)}
                    className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all', statusInfo.bgColor, statusInfo.color, 'border-transparent hover:border-[var(--border)]')}
                  >
                    {statusInfo.label}
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  <AnimatePresence>
                    {showStatusMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="absolute right-0 top-full mt-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl overflow-hidden shadow-2xl z-10"
                      >
                        {(['PAID', 'PENDING', 'FAILED'] as PayslipStatus[]).map((st) => {
                          const info = PAYSLIP_STATUS_INFO[st];
                          return (
                            <button
                              key={st}
                              onClick={() => handleStatusChange(st as 'PAID' | 'PENDING' | 'FAILED')}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                            >
                              <div className={clsx('w-2 h-2 rounded-full', info.bgColor)} />
                              <span className={info.color}>{info.label}</span>
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Period Info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-hover)] rounded-xl p-3">
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] text-xs mb-1">
                    <Calendar className="w-3.5 h-3.5" /> Periode
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
                  <h3 className="text-sm font-bold text-[var(--text-secondary)]">Detail du bulletin</h3>
                </div>
                <div className="p-4 space-y-3">
                  {payslip.hoursWorked && payslip.hourlyRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Heures normales ({payslip.hoursWorked}h x {payslip.hourlyRate}€)</span>
                      <span className="text-[var(--text-primary)] font-medium">{(payslip.hoursWorked * payslip.hourlyRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                  )}
                  {(payslip.overtimeHours || 0) > 0 && payslip.overtimeRate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Heures sup. ({payslip.overtimeHours}h x {payslip.overtimeRate}€)</span>
                      <span className="text-[var(--text-primary)] font-medium">{((payslip.overtimeHours || 0) * payslip.overtimeRate).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                  )}

                  <div className="border-t border-[var(--border)] pt-3 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)] font-bold">Salaire Brut</span>
                      <span className="text-[var(--text-primary)] font-bold">{payslip.grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Impots</span>
                      <span className="text-[var(--text-secondary)]">-{payslip.taxAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Securite sociale</span>
                      <span className="text-[var(--text-secondary)]">-{payslip.socialSecurity.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--text-muted)]">Charges totales</span>
                      <span className="text-[var(--text-secondary)]">-{charges.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border-strong)] pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-[var(--text-primary)]">Net a payer</span>
                      <span className="text-2xl font-bold text-blue-500">{payslip.netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metadata */}
              <div className="text-xs text-[var(--text-muted)] space-y-1">
                <div>Cree le : {new Date(payslip.createdAt).toLocaleDateString('fr-FR')}</div>
                <div>Derniere mise a jour : {new Date(payslip.updatedAt).toLocaleDateString('fr-FR')}</div>
                {payslip.externalReference && (
                  <div>Ref. externe : {payslip.externalReference}</div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 md:p-6 border-t border-[var(--border)] flex items-center gap-3">
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-50"
              >
                {isDownloading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Telecharger PDF
              </button>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] text-sm font-medium transition-colors disabled:opacity-50"
              >
                <RefreshCw className={clsx('w-4 h-4', isRegenerating && 'animate-spin')} />
                Regenerer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
