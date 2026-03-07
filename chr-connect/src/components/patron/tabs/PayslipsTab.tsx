'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Download, Calendar, User, Receipt, DollarSign, CheckCircle, RefreshCw, PlusCircle, Plus, Crown, FileCheck, ShieldCheck, Calculator, FileText } from 'lucide-react';
import { clsx } from 'clsx';
import { SkeletonTable } from '@/components/shared/Skeleton';
import EmptyState from '@/components/shared/EmptyState';
import { motion, AnimatePresence } from 'framer-motion';
import { useVenuesStore } from '@/store/useVenuesStore';
import { usePayslipsStore } from '@/store/usePayslipsStore';
import { useStore } from '@/store/useStore';
import type { Payslip, PayslipStatus } from '@/types/payslip';
import PremiumBadge from '@/components/shared/PremiumBadge';
import PremiumUpsellModal from '@/components/shared/PremiumUpsellModal';
import CreatePayslipWizard from '../payslips/CreatePayslipWizard';
import PayslipDetailModal from '../payslips/PayslipDetailModal';

export default function PayslipsTab() {
  const { activeVenueId } = useVenuesStore();
  const { payslips, isLoading, error, fetchVenuePayslips, setFilters, downloadPayslipPdf } = usePayslipsStore();
  const { isPremium } = useStore();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTabLoading, setIsTabLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showUpsellModal, setShowUpsellModal] = useState(false);
  const [showCreateWizard, setShowCreateWizard] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsTabLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeVenueId) {
      loadPayslips();
    }
  }, [activeVenueId]);

  const loadPayslips = async () => {
    if (!activeVenueId) return;

    setIsRefreshing(true);
    const filters: any = {};
    if (filter !== 'ALL') {
      filters.status = filter;
    }
    if (searchQuery) {
      filters.search = searchQuery;
    }

    await fetchVenuePayslips(activeVenueId, filters);
    setIsRefreshing(false);
  };

  useEffect(() => {
    setFilters({ status: filter === 'ALL' ? undefined : filter as PayslipStatus, search: searchQuery || undefined });
  }, [filter, searchQuery, setFilters]);

  const filteredPayslips = payslips.filter(payslip => {
    if (filter !== 'ALL' && payslip.status !== filter) return false;
    if (searchQuery &&
        !payslip.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !payslip.number.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PENDING': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'PROCESSING': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'FAILED': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Payée';
      case 'PENDING': return 'En attente';
      case 'PROCESSING': return 'En cours';
      case 'FAILED': return 'Échouée';
      default: return status;
    }
  };

  const handleDownload = async (e: React.MouseEvent, payslip: Payslip) => {
    e.stopPropagation();
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
    } catch (error) {
      console.error('Failed to download payslip:', error);
    }
  };

  const handleCreateClick = () => {
    if (isPremium) {
      setShowCreateWizard(true);
    } else {
      setShowUpsellModal(true);
    }
  };

  const handlePayslipClick = (payslip: Payslip) => {
    setSelectedPayslip(payslip);
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
              Les bulletins de paie sont reserves aux abonnes Premium.
            </p>

            <div className="space-y-3 text-left mb-8">
              {[
                { icon: FileCheck, text: 'Generation automatique des fiches de paie' },
                { icon: Calculator, text: 'Calcul automatique des charges et cotisations' },
                { icon: ShieldCheck, text: 'Conformite legale et archivage securise' },
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
              Passer Premium
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isTabLoading) return <SkeletonTable />;

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 mb-4 md:mb-8 p-4 md:p-0">
            <div className="text-center md:text-left w-full md:w-auto">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">Bulletins de Paie</h2>
                {!isPremium && <PremiumBadge size="md" className="mb-1" />}
              </div>
              <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Gérez les fiches de paie de votre équipe</p>
            </div>

            <div className="hidden md:flex items-center gap-2 w-full md:w-auto">
              {/* Create button - desktop only */}
              <button
                onClick={handleCreateClick}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold transition-all shadow-lg shadow-blue-900/20 shrink-0"
              >
                <PlusCircle className="w-4 h-4" />
                Nouveau bulletin
                {!isPremium && <PremiumBadge />}
              </button>

              <div className="hidden md:flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-strong)] flex-1 md:flex-none">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[var(--text-primary)] pl-9 w-full md:w-64 placeholder:text-[var(--text-muted)] focus:outline-none"
                  />
                </div>
                <div className="w-px h-6 bg-[var(--border-strong)] shrink-0" />
                <button
                  onClick={loadPayslips}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Actualiser"
                >
                  <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
                </button>
                <button className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0">
                  <Filter className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Mobile search bar */}
          <div className="md:hidden px-4 mb-4">
            <div className="flex items-center gap-2 bg-[var(--bg-card)] p-1 rounded-xl border border-[var(--border-strong)]">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Rechercher un bulletin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[var(--text-primary)] pl-9 w-full placeholder:text-[var(--text-muted)]"
                />
              </div>
              <button
                onClick={loadPayslips}
                disabled={isRefreshing}
                className="p-2 hover:bg-[var(--bg-hover)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mx-4 md:mx-0">
              {error}
            </div>
          )}

          {/* Stats cards - horizontal scroll on mobile, grid on desktop */}
          <div className="mb-6 md:mb-8">
            <div className="flex md:grid md:grid-cols-3 gap-4 md:gap-6 overflow-x-auto pb-2 md:pb-0 px-4 md:px-0 snap-x snap-mandatory md:snap-none">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden min-w-[260px] md:min-w-0 snap-center"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-green-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">Total Net</div>
                    <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                      {isLoading ? '...' : filteredPayslips.reduce((sum, p) => sum + p.netAmount, 0).toLocaleString('fr-FR')}€
                    </div>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-[var(--text-muted)]">
                  {isLoading ? 'Chargement...' : `${filteredPayslips.length} bulletin(s) affiché(s)`}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden min-w-[260px] md:min-w-0 snap-center"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">Total Brut</div>
                    <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                      {isLoading ? '...' : filteredPayslips.reduce((sum, p) => sum + p.grossAmount, 0).toLocaleString('fr-FR')}€
                    </div>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-[var(--text-muted)]">
                  {isLoading ? 'Chargement...' : `Charges déduites: ${(filteredPayslips.reduce((sum, p) => sum + p.grossAmount, 0) - filteredPayslips.reduce((sum, p) => sum + p.netAmount, 0)).toLocaleString('fr-FR')}€`}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-[var(--bg-card)] to-[var(--bg-elevated)] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-[var(--border)] shadow-xl relative overflow-hidden min-w-[260px] md:min-w-0 snap-center"
                style={{ boxShadow: 'var(--shadow-card)' }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
                <div className="flex items-center gap-3 mb-3 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                  </div>
                  <div>
                    <div className="text-xs md:text-sm text-[var(--text-secondary)] font-medium">En Attente</div>
                    <div className="text-xl md:text-2xl font-bold text-[var(--text-primary)]">
                      {isLoading ? '...' : filteredPayslips.filter(p => p.status === 'PENDING').length}
                    </div>
                  </div>
                </div>
                <div className="text-xs md:text-sm text-[var(--text-muted)]">{isLoading ? 'Chargement...' : 'Bulletin(s) à traiter'}</div>
              </motion.div>
            </div>
          </div>
        </div>

        <div className="px-4 md:px-0">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button
              onClick={() => setFilter('ALL')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'ALL' ? "bg-blue-500 text-white" : "bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]"
              )}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('PAID')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'PAID' ? "bg-green-500 text-white" : "bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]"
              )}
            >
              Payées
            </button>
            <button
              onClick={() => setFilter('PENDING')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'PENDING' ? "bg-orange-500 text-white" : "bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]"
              )}
            >
              En attente
            </button>
            <button
              onClick={() => setFilter('PROCESSING')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'PROCESSING' ? "bg-blue-500 text-white" : "bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]"
              )}
            >
              En cours
            </button>
            <button
              onClick={() => setFilter('FAILED')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'FAILED' ? "bg-red-500 text-white" : "bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]"
              )}
            >
              Échouées
            </button>
          </div>

          <div className="space-y-3">
            {filteredPayslips.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucun bulletin de paie"
                description="Les bulletins de paie apparaîtront ici après vos premières missions."
              />
            ) : (
              filteredPayslips.map((payslip, index) => (
                <motion.div
                  key={payslip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handlePayslipClick(payslip)}
                  className="bg-[var(--bg-card)] p-4 md:p-5 rounded-xl md:rounded-2xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-all cursor-pointer active:scale-[0.98] md:active:scale-100"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Receipt className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-[var(--text-primary)] truncate">{payslip.employeeName}</h4>
                          <span className={clsx("px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border", getStatusColor(payslip.status))}>
                            {getStatusLabel(payslip.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs md:text-sm text-[var(--text-secondary)] flex-wrap">
                          <span className="flex items-center gap-1"><Receipt className="w-3 h-3" /> {payslip.number}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] hidden md:block" />
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {payslip.period}</span>
                          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)] hidden md:block" />
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Brut: {payslip.grossAmount}€</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="text-right shrink-0">
                        <div className="text-lg md:text-xl font-bold text-[var(--text-primary)]">{payslip.netAmount.toLocaleString('fr-FR')}€</div>
                        <div className="text-xs text-[var(--text-muted)]">Net à payer</div>
                      </div>
                      <div className="w-px h-8 bg-[var(--border-strong)] hidden md:block" />
                      <button
                        onClick={(e) => handleDownload(e, payslip)}
                        className="p-2 hover:bg-[var(--bg-active)] rounded-lg transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] shrink-0"
                        title="Télécharger le bulletin"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={handleCreateClick}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Premium Upsell Modal */}
      <PremiumUpsellModal isOpen={showUpsellModal} onClose={() => setShowUpsellModal(false)} />

      {/* Create Payslip Wizard */}
      <AnimatePresence>
        {showCreateWizard && (
          <CreatePayslipWizard
            isOpen={showCreateWizard}
            onClose={() => {
              setShowCreateWizard(false);
              if (activeVenueId) loadPayslips();
            }}
          />
        )}
      </AnimatePresence>

      {/* Payslip Detail Modal */}
      <AnimatePresence>
        {selectedPayslip && (
          <PayslipDetailModal
            payslip={selectedPayslip}
            isOpen={!!selectedPayslip}
            onClose={() => setSelectedPayslip(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
