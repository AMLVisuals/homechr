'use client';

import { useState } from 'react';
import { X, Download, Printer, FileText, FileCode, Eye, ChevronDown, CheckCircle2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  type FacturXData,
  generateInvoiceHTML,
  generateFacturXML,
  downloadFacturXML,
  downloadInvoiceHTML,
  printInvoice,
} from '@/lib/facturx-generator';

interface FacturXInvoiceViewProps {
  data: FacturXData;
  onClose: () => void;
}

export default function FacturXInvoiceView({ data, onClose }: FacturXInvoiceViewProps) {
  const [activeTab, setActiveTab] = useState<'preview' | 'xml'>('preview');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const invoiceHTML = generateInvoiceHTML(data);
  const invoiceXML = generateFacturXML(data);

  const statusColors: Record<string, string> = {
    DRAFT: 'text-gray-400 bg-gray-400/10',
    SENT: 'text-blue-400 bg-blue-400/10',
    PAID: 'text-green-400 bg-green-400/10',
    OVERDUE: 'text-red-400 bg-red-400/10',
    CANCELLED: 'text-gray-400 bg-gray-400/10',
    REFUNDED: 'text-amber-400 bg-amber-400/10',
  };

  const statusLabels: Record<string, string> = {
    DRAFT: 'Brouillon',
    SENT: 'Envoyée',
    PAID: 'Payée',
    OVERDUE: 'En retard',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-2 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[800px] md:max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl z-[9999] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg font-bold text-[var(--text-primary)] truncate">
                    {data.invoice.reference}
                  </h2>
                  <span className={clsx('px-2.5 py-0.5 rounded-full text-[10px] font-bold', statusColors[data.invoice.status])}>
                    {statusLabels[data.invoice.status]}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-[var(--text-muted)]">{formatCurrency(data.invoice.totalTTC)}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold text-green-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Factur-X
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Export dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exporter</span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                <AnimatePresence>
                  {showExportMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute right-0 top-full mt-1 w-56 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-xl z-10 overflow-hidden"
                    >
                      <button
                        onClick={() => { printInvoice(data); setShowExportMenu(false); }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-colors text-left"
                      >
                        <Printer className="w-4 h-4 text-[var(--text-muted)]" />
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">Imprimer / PDF</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Via le dialogue d&apos;impression</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { downloadInvoiceHTML(data); setShowExportMenu(false); }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-colors text-left border-t border-[var(--border)]"
                      >
                        <FileText className="w-4 h-4 text-[var(--text-muted)]" />
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">Facture HTML</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Document formaté pour impression</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { downloadFacturXML(data); setShowExportMenu(false); }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--bg-hover)] transition-colors text-left border-t border-[var(--border)]"
                      >
                        <FileCode className="w-4 h-4 text-green-400" />
                        <div>
                          <div className="text-sm font-bold text-[var(--text-primary)]">XML Factur-X</div>
                          <div className="text-[10px] text-[var(--text-muted)]">Fichier structuré norme CII</div>
                        </div>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-[var(--bg-hover)] p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('preview')}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                activeTab === 'preview'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              Aperçu facture
            </button>
            <button
              onClick={() => setActiveTab('xml')}
              className={clsx(
                'flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                activeTab === 'xml'
                  ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
              )}
            >
              <FileCode className="w-3.5 h-3.5" />
              XML Factur-X
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'preview' ? (
            <div className="bg-gray-100 dark:bg-gray-900/50 p-4">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-auto max-w-[700px]">
                <iframe
                  srcDoc={invoiceHTML}
                  className="w-full h-[600px] md:h-[700px] border-0"
                  title="Aperçu facture"
                />
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span className="text-xs font-bold text-green-400">Profil Basic WL — Conforme Factur-X 1.0</span>
                </div>
              </div>
              <pre className="bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-xs text-[var(--text-secondary)] overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-words">
                {invoiceXML}
              </pre>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-[var(--border)] shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)]">
            <CheckCircle2 className="w-3 h-3 text-green-400" />
            Format Factur-X — Obligation légale sept. 2026
          </div>
          <div className="text-[10px] text-[var(--text-muted)]">
            {data.seller.name} → {data.buyer.name}
          </div>
        </div>
      </motion.div>
    </>
  );
}
