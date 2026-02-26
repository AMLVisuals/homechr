import React from 'react';
import { Invoice } from '@/types/missions';
import { Download, CreditCard, CheckCircle, Clock, FileText, Printer, Share2 } from 'lucide-react';
import { useMissionsStore } from '@/store/useMissionsStore';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface InvoiceDetailViewProps {
  invoice: Invoice;
  onPay?: () => void;
}

export const InvoiceDetailView: React.FC<InvoiceDetailViewProps> = ({ invoice, onPay }) => {
  const { payInvoice } = useMissionsStore();

  const handlePay = () => {
    payInvoice(invoice.id);
    if (onPay) onPay();
  };

  const handleDownload = () => {
    // Simulate download
    const link = document.createElement('a');
    link.href = '#';
    link.download = `Facture-${invoice.number}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-gray-50 rounded-xl overflow-hidden shadow-lg border border-gray-200">
      {/* Top Actions Bar */}
      <div className="bg-white border-b border-gray-200 p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-gray-500" />
          <span className="font-bold text-gray-700">Facture #{invoice.number}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => window.print()}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            title="Imprimer"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button 
            onClick={handleDownload}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>PDF</span>
          </button>
          {invoice.status !== 'PAID' && (
            <button 
              onClick={handlePay}
              className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-gray-800 text-white rounded-lg font-medium transition-colors shadow-lg shadow-black/20"
            >
              <CreditCard className="w-4 h-4" />
              <span>Payer {invoice.totalAmount} €</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-4xl mx-auto bg-white min-h-[600px]">
        {/* Status Banner */}
        <div className={clsx(
          "mb-8 p-4 rounded-lg flex items-center justify-between",
          invoice.status === 'PAID' ? "bg-green-50 border border-green-100" : "bg-orange-50 border border-orange-100"
        )}>
          <div className="flex items-center gap-3">
            {invoice.status === 'PAID' ? (
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <CheckCircle className="w-6 h-6" />
              </div>
            ) : (
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <Clock className="w-6 h-6" />
              </div>
            )}
            <div>
              <p className={clsx("font-bold", invoice.status === 'PAID' ? "text-green-800" : "text-orange-800")}>
                {invoice.status === 'PAID' ? 'Facture réglée' : 'En attente de paiement'}
              </p>
              <p className="text-sm text-gray-500">
                {invoice.status === 'PAID' 
                  ? `Payée le ${invoice.history?.find(h => h.status === 'PAID')?.date.split('T')[0] || new Date().toISOString().split('T')[0]}`
                  : `Échéance le ${invoice.dueDate}`
                }
              </p>
            </div>
          </div>
          {invoice.status === 'PAID' && invoice.paymentMethod && (
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Moyen de paiement</p>
              <p className="text-sm font-medium text-gray-700 flex items-center gap-2 justify-end">
                <CreditCard className="w-4 h-4" />
                Carte **** {invoice.paymentMethod.last4}
              </p>
            </div>
          )}
        </div>

        {/* Header: Issuer & Client */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Émetteur</p>
            <div className="flex items-start gap-4">
              {invoice.issuerDetails?.logo ? (
                <img src={invoice.issuerDetails.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover bg-gray-100" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 font-bold text-2xl">
                  {invoice.issuerDetails?.name.charAt(0)}
                </div>
              )}
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{invoice.issuerDetails?.name}</h3>
                <div className="text-sm text-gray-500 space-y-1 mt-1">
                  <p>{invoice.issuerDetails?.address}</p>
                  <p>SIRET: {invoice.issuerDetails?.siret}</p>
                  <p>{invoice.issuerDetails?.email}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Adressé à</p>
            <h3 className="font-bold text-gray-900 text-lg">{invoice.clientDetails?.name}</h3>
            <div className="text-sm text-gray-500 space-y-1 mt-1">
              <p>{invoice.clientDetails?.address}</p>
              {invoice.clientDetails?.vatNumber && <p>TVA: {invoice.clientDetails.vatNumber}</p>}
            </div>
          </div>
        </div>

        {/* Invoice Meta */}
        <div className="grid grid-cols-3 gap-4 mb-12 bg-gray-50 p-6 rounded-xl border border-gray-100">
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Date d'émission</p>
            <p className="font-medium text-gray-900">{invoice.date}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Date d'échéance</p>
            <p className="font-medium text-gray-900">{invoice.dueDate}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 uppercase mb-1">Référence</p>
            <p className="font-medium text-gray-900">{invoice.number}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-12">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</th>
                <th className="text-right py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Qté</th>
                <th className="text-right py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Prix Unit.</th>
                <th className="text-right py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-4 text-sm text-gray-900 font-medium">{item.description}</td>
                  <td className="py-4 text-right text-sm text-gray-500">{item.quantity}</td>
                  <td className="py-4 text-right text-sm text-gray-500">{item.unitPrice.toFixed(2)} €</td>
                  <td className="py-4 text-right text-sm text-gray-900 font-bold">{(item.quantity * item.unitPrice).toFixed(2)} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-12">
          <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total HT</span>
              <span className="font-medium text-gray-900">{(invoice.totalAmount - invoice.taxAmount).toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">TVA (20%)</span>
              <span className="font-medium text-gray-900">{invoice.taxAmount.toFixed(2)} €</span>
            </div>
            <div className="pt-3 border-t border-gray-200 flex justify-between items-end">
              <span className="font-bold text-gray-900">Total TTC</span>
              <span className="text-2xl font-bold text-gray-900">{invoice.totalAmount.toFixed(2)} €</span>
            </div>
          </div>
        </div>

        {/* History Timeline */}
        {invoice.history && invoice.history.length > 0 && (
          <div className="border-t border-gray-200 pt-8">
            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-6">Historique</h4>
            <div className="space-y-6">
              {invoice.history.map((event, idx) => (
                <div key={idx} className="flex gap-4 relative">
                  {/* Connector Line */}
                  {idx !== invoice.history!.length - 1 && (
                    <div className="absolute left-[9px] top-6 bottom-[-24px] w-0.5 bg-gray-200" />
                  )}
                  
                  <div className={clsx(
                    "w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                    event.status === 'PAID' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
                  )}>
                    <div className={clsx(
                      "w-2 h-2 rounded-full",
                      event.status === 'PAID' ? "bg-green-500" : "bg-blue-500"
                    )} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{event.label}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(event.date).toLocaleDateString()} à {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-xs text-gray-400">
          <p>Merci de votre confiance.</p>
          <p className="mt-1">Conditions de paiement : 30 jours fin de mois. En cas de retard de paiement, une pénalité de 3 fois le taux d'intérêt légal sera appliquée.</p>
        </div>
      </div>
    </div>
  );
};
