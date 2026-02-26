import { useEffect, useState } from 'react';
import { Search, Filter, Download, Calendar, User, Receipt, DollarSign, CheckCircle, RefreshCw } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { useVenuesStore } from '@/store/useVenuesStore';
import { usePayslipsStore } from '@/store/usePayslipsStore';
import type { Payslip } from '@/types/payslip';

export default function PayslipsTab() {
  const { activeVenueId } = useVenuesStore();
  const { payslips, isLoading, error, fetchVenuePayslips, setFilters, downloadPayslipPdf } = usePayslipsStore();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    setFilters({ status: filter === 'ALL' ? undefined : filter, search: searchQuery || undefined });
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

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        <div className="sticky top-0 z-0 md:static md:z-auto pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 mb-4 md:mb-8 p-4 md:p-0">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Bulletins de Paie</h2>
              <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Gérez les fiches de paie de votre équipe</p>
            </div>
            
            <div className="hidden md:flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 w-full md:w-auto">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input 
                  type="text" 
                  placeholder="Rechercher..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-white pl-9 w-full md:w-64 placeholder:text-gray-600 focus:outline-none"
                />
              </div>
              <div className="w-px h-6 bg-white/10 shrink-0" />
              <button 
                onClick={loadPayslips}
                disabled={isRefreshing}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Actualiser"
              >
                <RefreshCw className={clsx("w-4 h-4", isRefreshing && "animate-spin")} />
              </button>
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 p-4 md:p-0">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#111] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-green-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-green-400" />
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-400 font-medium">Total Net</div>
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {isLoading ? '...' : filteredPayslips.reduce((sum, p) => sum + p.netAmount, 0).toLocaleString('fr-FR')}€
                  </div>
                </div>
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {isLoading ? 'Chargement...' : `${filteredPayslips.length} bulletin(s) affiché(s)`}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#111] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-blue-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6 text-blue-400" />
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-400 font-medium">Total Brut</div>
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {isLoading ? '...' : filteredPayslips.reduce((sum, p) => sum + p.grossAmount, 0).toLocaleString('fr-FR')}€
                  </div>
                </div>
              </div>
              <div className="text-xs md:text-sm text-gray-500">
                {isLoading ? 'Chargement...' : `Charges déduites: ${(filteredPayslips.reduce((sum, p) => sum + p.grossAmount, 0) - filteredPayslips.reduce((sum, p) => sum + p.netAmount, 0)).toLocaleString('fr-FR')}€`}
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-[#1a1a1a] to-[#111] p-4 md:p-6 rounded-2xl md:rounded-3xl border border-white/5 shadow-xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-amber-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
              <div className="flex items-center gap-3 mb-3 md:mb-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 md:w-6 md:h-6 text-amber-400" />
                </div>
                <div>
                  <div className="text-xs md:text-sm text-gray-400 font-medium">En Attente</div>
                  <div className="text-xl md:text-2xl font-bold text-white">
                    {isLoading ? '...' : filteredPayslips.filter(p => p.status === 'PENDING').length}
                  </div>
                </div>
              </div>
              <div className="text-xs md:text-sm text-gray-500">{isLoading ? 'Chargement...' : 'Bulletin(s) à traiter'}</div>
            </motion.div>
          </div>
        </div>

        <div className="px-4 md:px-0">
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
            <button 
              onClick={() => setFilter('ALL')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'ALL' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              Tous
            </button>
            <button 
              onClick={() => setFilter('PAID')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'PAID' ? "bg-green-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              Payées
            </button>
            <button 
              onClick={() => setFilter('PENDING')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'PENDING' ? "bg-orange-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              En attente
            </button>
            <button 
              onClick={() => setFilter('PROCESSING')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'PROCESSING' ? "bg-blue-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              En cours
            </button>
            <button 
              onClick={() => setFilter('FAILED')}
              className={clsx(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
                filter === 'FAILED' ? "bg-red-500 text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
              )}
            >
              Échouées
            </button>
          </div>

          <div className="space-y-3">
            {filteredPayslips.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Receipt className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Aucun bulletin de paie trouvé</p>
              </div>
            ) : (
              filteredPayslips.map((payslip, index) => (
                <motion.div
                  key={payslip.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1a1a1a] p-4 md:p-5 rounded-xl md:rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Receipt className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h4 className="font-bold text-white truncate">{payslip.employeeName}</h4>
                          <span className={clsx("px-2 py-0.5 rounded-full text-[10px] md:text-xs font-medium border", getStatusColor(payslip.status))}>
                            {getStatusLabel(payslip.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs md:text-sm text-gray-400 flex-wrap">
                          <span className="flex items-center gap-1"><Receipt className="w-3 h-3" /> {payslip.number}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600 hidden md:block" />
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {payslip.period}</span>
                          <span className="w-1 h-1 rounded-full bg-gray-600 hidden md:block" />
                          <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Brut: {payslip.grossAmount}€</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="text-right shrink-0">
                        <div className="text-lg md:text-xl font-bold text-white">{payslip.netAmount.toLocaleString('fr-FR')}€</div>
                        <div className="text-xs text-gray-500">Net à payer</div>
                      </div>
                      <div className="w-px h-8 bg-white/10 hidden md:block" />
                      <button 
                        onClick={(e) => handleDownload(e, payslip)}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0"
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
    </div>
  );
}
