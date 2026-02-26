import { useState } from 'react';
import { Search, Filter, Download, Eye, X, FileText, Clock, AlertCircle, DollarSign } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { InvoiceDetailView } from '../billing/InvoiceDetailView';
import { Invoice } from '@/types/missions';

export default function InvoicesTab() {
  const { missions } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();
  const [filter, setFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  // Derive invoices from missions
  const invoices = missions
    .filter(m => {
      if (!m.invoice) return false;
      if (activeVenueId && m.venueId !== activeVenueId) return false;
      return true;
    })
    .map(m => ({
      ...m.invoice!,
      serviceName: m.title,
      expertName: m.provider?.name || 'Prestataire',
      missionId: m.id
    }));

  const selectedInvoice = selectedInvoiceId 
    ? invoices.find(inv => inv.id === selectedInvoiceId) 
    : null;

  const filteredInvoices = invoices.filter(inv => {
    if (filter !== 'ALL' && inv.status !== filter) return false;
    if (searchQuery && 
        !inv.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !inv.number.toLowerCase().includes(searchQuery.toLowerCase())
    ) return false;
    return true;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'PENDING': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'OVERDUE': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Payée';
      case 'PENDING': return 'En attente';
      case 'OVERDUE': return 'En retard';
      default: return status;
    }
  };

  const handleDownload = (e: React.MouseEvent, invoice: any) => {
    e.stopPropagation();
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `Facture-${invoice.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Fixed Header Section (Header + Stats) */}
        <div className="sticky top-0 z-0 md:static md:z-auto pb-4">
          {/* Header & Controls */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-4 mb-4 md:mb-8 p-4 md:p-0">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Factures</h2>
              <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Gérez vos paiements et historiques</p>
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
              <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0">
                <Filter className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Stats Cards - Compact on Mobile */}
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-4 md:mb-8 px-4 md:px-0">
            <div 
              onClick={() => setFilter('ALL')}
              className="bg-[#1a1a1a] p-2 md:p-6 rounded-xl md:rounded-2xl border border-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-4 gap-1 md:gap-0">
                <div className="p-2.5 md:p-3 rounded-xl bg-blue-500/10 text-blue-400 mb-1">
                  <DollarSign className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center md:text-left">Total</span>
              </div>
              <div className="text-lg md:text-3xl font-bold text-white mb-0 md:mb-1 text-center md:text-left truncate">2,820€</div>
              <div className="hidden md:block text-xs md:text-sm text-gray-400">12 factures</div>
            </div>

            <div 
              onClick={() => setFilter('PENDING')}
              className="bg-[#1a1a1a] p-2 md:p-6 rounded-xl md:rounded-2xl border border-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-4 gap-1 md:gap-0">
                <div className="p-2.5 md:p-3 rounded-xl bg-orange-500/10 text-orange-400 mb-1">
                  <Clock className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center md:text-left">Attente</span>
              </div>
              <div className="text-lg md:text-3xl font-bold text-white mb-0 md:mb-1 text-center md:text-left truncate">890€</div>
              <div className="hidden md:block text-sm text-gray-400">1 facture</div>
            </div>

            <div 
              onClick={() => setFilter('OVERDUE')}
              className="bg-[#1a1a1a] p-2 md:p-6 rounded-xl md:rounded-2xl border border-white/5 flex flex-col justify-between cursor-pointer hover:bg-white/5 active:scale-95 transition-all"
            >
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start mb-1 md:mb-4 gap-1 md:gap-0">
                <div className="p-2.5 md:p-3 rounded-xl bg-red-500/10 text-red-400 mb-1">
                  <AlertCircle className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="text-[10px] md:text-xs font-bold text-gray-500 uppercase tracking-wider text-center md:text-left">Retard</span>
              </div>
              <div className="text-lg md:text-3xl font-bold text-white mb-0 md:mb-1 text-center md:text-left truncate">230€</div>
              <div className="hidden md:block text-sm text-gray-400">Action requise</div>
            </div>
          </div>
        </div>

        {/* Scrolling Content Section (Search + List) */}
        <div className="relative z-10 bg-[#1a1a1a] rounded-t-3xl border-t border-white/5 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] min-h-full md:z-auto md:bg-transparent md:rounded-none md:border-none md:shadow-none">
          {/* Sticky Search & Tabs Container */}
          <div className="sticky top-0 z-20 bg-[#1a1a1a] pb-4 pt-4 px-4 md:px-0 rounded-t-3xl md:bg-transparent md:static md:z-auto md:rounded-none md:pt-0">
            <div className="px-4 md:px-0 pt-4 md:pt-0">
              {/* Mobile Search Bar */}
              <div className="md:hidden flex items-center gap-2 bg-[#1a1a1a] p-1 rounded-xl border border-white/10 w-full mb-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input 
                    type="text" 
                    placeholder="Rechercher..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-white pl-9 w-full placeholder:text-gray-600 focus:outline-none"
                  />
                </div>
                <div className="w-px h-6 bg-white/10 shrink-0" />
                <button className="p-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0">
                  <Filter className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-4 overflow-x-auto no-scrollbar pb-0">
                {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setFilter(tab)}
                    className={clsx(
                      "pb-4 text-sm font-medium transition-colors relative whitespace-nowrap px-2",
                      filter === tab ? "text-white" : "text-gray-500 hover:text-gray-300"
                    )}
                  >
                    {tab === 'ALL' && 'Toutes'}
                    {tab === 'PAID' && 'Payées'}
                    {tab === 'PENDING' && 'En attente'}
                    {tab === 'OVERDUE' && 'En retard'}
                    
                    {filter === tab && (
                      <motion.div 
                        layoutId="activeInvoiceTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Invoices List */}
          <div className="space-y-3 pb-20 px-4 md:px-0">
            {filteredInvoices.map((invoice) => (
              <motion.div 
                key={invoice.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#1a1a1a] p-3 md:p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all group flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 relative"
              >
                <div className="flex items-center gap-3 md:gap-4 flex-1 w-full md:w-auto">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors text-sm md:text-base truncate">{invoice.serviceName}</h4>
                    <div className="flex items-center gap-2 md:gap-3 text-xs md:text-sm text-gray-400 mt-0.5 md:mt-1">
                      <span className="font-mono shrink-0">{invoice.number}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-600 shrink-0" />
                      <span className="truncate">{invoice.expertName}</span>
                    </div>
                  </div>
                  <div className="md:hidden">
                    <div className={clsx("px-2 py-0.5 rounded-full border text-[10px] font-bold whitespace-nowrap", getStatusColor(invoice.status))}>
                      {getStatusLabel(invoice.status)}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 md:gap-6 w-full md:w-auto justify-between md:justify-end mt-1 md:mt-0 pl-[52px] md:pl-0">
                  <div className="text-left md:text-right">
                    <div className="font-bold text-white text-base md:text-lg">{invoice.totalAmount.toFixed(2)}€</div>
                    <div className="text-[10px] md:text-xs text-gray-500">Échéance: {invoice.dueDate}</div>
                  </div>

                  <div className={clsx("hidden md:block px-3 py-1 rounded-full border text-xs font-bold", getStatusColor(invoice.status))}>
                    {getStatusLabel(invoice.status)}
                  </div>

                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setSelectedInvoiceId(invoice.id)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" 
                      title="Voir"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={(e) => handleDownload(e, invoice)}
                      className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" 
                      title="Télécharger PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedInvoice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setSelectedInvoiceId(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-white rounded-2xl relative"
            >
              <button 
                onClick={() => setSelectedInvoiceId(null)}
                className="absolute top-4 right-4 p-2 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 z-10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <InvoiceDetailView 
                invoice={selectedInvoice as unknown as Invoice} 
                onPay={() => {}} // Don't close, just let the UI update
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
