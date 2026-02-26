'use client';

// ============================================================================
// TEST PAGE - Vue Patron pour Devis
// ============================================================================
// Page de test pour visualiser l'interface que le patron reçoit
// quand il reçoit un devis à signer
// Route: /test-quote-patron
// ============================================================================

import { useState } from 'react';
import { QuoteReceiverView } from '@/components/patron/QuoteReceiverView';
import type { FinalQuote } from '@/components/provider/QuoteBuilderUltimate';

// Mock quote for testing
const MOCK_QUOTE: FinalQuote = {
  id: 'quote_test_001',
  reference: 'DEV-2025-ABC1',
  provider: {
    id: 'provider_001',
    name: 'Froid Express Paris',
    siret: '123 456 789 00001',
    rcs: 'Paris B 123 456 789',
    tvaNumber: 'FR 12 123456789',
    address: '15 Rue de la Glacière, 75013 Paris',
    phone: '01 42 00 00 00',
    email: 'contact@froid-express.fr',
    insurance: {
      company: 'AXA Assurances',
      policyNumber: 'POL-2024-789456',
      coverage: 'France métropolitaine',
    },
  },
  client: {
    id: 'patron_001',
    name: 'Bernard Pacaud',
    establishmentName: 'Restaurant L\'Ambroisie',
    establishmentAddress: '9 Place des Vosges, 75004 Paris',
    siret: '987 654 321 00001',
    phone: '01 42 78 51 45',
    email: 'contact@ambroisie.fr',
  },
  createdAt: new Date(),
  validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 jours
  items: [
    {
      id: 'item_1',
      type: 'TRAVEL',
      description: 'Déplacement zone Paris intra-muros',
      quantity: 1,
      unit: 'forfait',
      unitPriceHT: 55,
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 95,
      marketPrice: { min: 45, max: 65, average: 50 },
      priceVariance: 10,
    },
    {
      id: 'item_2',
      type: 'LABOR',
      description: 'Diagnostic complet chambre froide',
      quantity: 1,
      unit: 'heure',
      unitPriceHT: 75,
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 88,
      marketPrice: { min: 60, max: 90, average: 72 },
      priceVariance: 4,
    },
    {
      id: 'item_3',
      type: 'LABOR',
      description: 'Remplacement compresseur avec mise en service',
      quantity: 2.5,
      unit: 'heure',
      unitPriceHT: 75,
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 85,
      marketPrice: { min: 65, max: 85, average: 70 },
      priceVariance: 7,
    },
    {
      id: 'item_4',
      type: 'PART',
      description: 'Compresseur Danfoss SC15G',
      reference: 'Danfoss SC15G',
      brand: 'Danfoss',
      model: 'SC15G',
      serialNumber: 'DSC15G-2024-78945',
      quantity: 1,
      unit: 'unité',
      unitPriceHT: 320,
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 72,
      marketPrice: { min: 220, max: 290, average: 250 },
      priceVariance: 28,
    },
    {
      id: 'item_5',
      type: 'PART',
      description: 'Thermostat électronique Dixell XR06CX',
      reference: 'Dixell XR06CX',
      brand: 'Dixell',
      model: 'XR06CX',
      quantity: 1,
      unit: 'unité',
      unitPriceHT: 85,
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 90,
      marketPrice: { min: 70, max: 95, average: 80 },
      priceVariance: 6,
    },
    {
      id: 'item_6',
      type: 'PART',
      description: 'Gaz réfrigérant R134a - recharge complète',
      reference: 'R134a-1KG',
      brand: 'Climalife',
      model: 'Solkane 134a',
      quantity: 2,
      unit: 'kg',
      unitPriceHT: 45,
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 92,
      marketPrice: { min: 35, max: 55, average: 42 },
      priceVariance: 7,
    },
  ],
  subtotalHT: 717.50,
  globalDiscount: 0,
  subtotalAfterDiscount: 717.50,
  totalTVA: 143.50,
  totalTTC: 861.00,
  deposit: 300,
  depositPercent: 35,
  trustScore: 78,
  trustLevel: 'GOOD',
  paymentTerms: '35% d\'acompte à la signature, solde à la fin des travaux',
  publicNotes: 'Intervention prévue sous 48h après acceptation du devis. Garantie 2 ans sur les pièces remplacées. Main d\'oeuvre garantie 1 an.',
  termsAccepted: false,
  signature: {
    signed: false,
    phoneVerified: false,
  },
  status: 'PENDING_SIGNATURE',
};

// Quote avec score suspect pour test
const MOCK_QUOTE_SUSPICIOUS: FinalQuote = {
  ...MOCK_QUOTE,
  id: 'quote_test_002',
  reference: 'DEV-2025-XYZ9',
  trustScore: 42,
  trustLevel: 'SUSPICIOUS',
  items: [
    ...MOCK_QUOTE.items.slice(0, 3),
    {
      id: 'item_suspect',
      type: 'PART',
      description: 'Compresseur générique',
      reference: 'COMP-GEN-001',
      brand: 'NoName',
      model: 'Generic 15',
      quantity: 1,
      unit: 'unité',
      unitPriceHT: 580, // Prix très élevé
      tvaRate: 0.20,
      aiVerified: true,
      aiScore: 35,
      marketPrice: { min: 180, max: 250, average: 210 },
      priceVariance: 176, // +176% !
    },
  ],
  subtotalHT: 977.50,
  totalTVA: 195.50,
  totalTTC: 1173.00,
};

export default function TestQuotePatronPage() {
  const [currentQuote, setCurrentQuote] = useState<FinalQuote>(MOCK_QUOTE);
  const [showQuote, setShowQuote] = useState(true);
  const [actionResult, setActionResult] = useState<{
    type: 'accepted' | 'rejected' | 'modified';
    data?: unknown;
  } | null>(null);

  const handleAccept = (signatureData: unknown) => {
    console.log('Quote accepted:', signatureData);
    setActionResult({ type: 'accepted', data: signatureData });
    setShowQuote(false);
  };

  const handleReject = (reason: string) => {
    console.log('Quote rejected:', reason);
    setActionResult({ type: 'rejected', data: { reason } });
    setShowQuote(false);
  };

  const handleRequestModification = (message: string) => {
    console.log('Modification requested:', message);
    setActionResult({ type: 'modified', data: { message } });
    setShowQuote(false);
  };

  if (!showQuote) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center ${
            actionResult?.type === 'accepted' ? 'bg-green-500/20' :
            actionResult?.type === 'rejected' ? 'bg-red-500/20' : 'bg-yellow-500/20'
          }`}>
            {actionResult?.type === 'accepted' && (
              <svg className="w-10 h-10 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {actionResult?.type === 'rejected' && (
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {actionResult?.type === 'modified' && (
              <svg className="w-10 h-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            )}
          </div>

          <h1 className="text-2xl font-bold">
            {actionResult?.type === 'accepted' && 'Devis accepté et signé !'}
            {actionResult?.type === 'rejected' && 'Devis refusé'}
            {actionResult?.type === 'modified' && 'Demande de modification envoyée'}
          </h1>

          <p className="text-gray-400">
            {actionResult?.type === 'accepted' && 'Le prestataire a été notifié. L\'intervention sera programmée dans les plus brefs délais.'}
            {actionResult?.type === 'rejected' && 'Le prestataire a été informé de votre refus.'}
            {actionResult?.type === 'modified' && 'Le prestataire va réviser son devis selon vos demandes.'}
          </p>

          <div className="bg-slate-800 rounded-xl p-4 text-left text-sm">
            <p className="text-gray-500 mb-2">Données reçues :</p>
            <pre className="text-xs text-gray-400 overflow-auto max-h-40">
              {JSON.stringify(actionResult?.data, null, 2)}
            </pre>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={() => {
                setCurrentQuote(MOCK_QUOTE);
                setShowQuote(true);
                setActionResult(null);
              }}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl font-medium transition-colors"
            >
              Tester devis normal
            </button>
            <button
              onClick={() => {
                setCurrentQuote(MOCK_QUOTE_SUSPICIOUS);
                setShowQuote(true);
                setActionResult(null);
              }}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-medium transition-colors"
            >
              Tester devis suspect
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Toggle pour changer de devis */}
      <div className="fixed top-4 left-4 z-[100] flex gap-2">
        <button
          onClick={() => setCurrentQuote(MOCK_QUOTE)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentQuote.id === MOCK_QUOTE.id
              ? 'bg-green-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Devis OK (78/100)
        </button>
        <button
          onClick={() => setCurrentQuote(MOCK_QUOTE_SUSPICIOUS)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            currentQuote.id === MOCK_QUOTE_SUSPICIOUS.id
              ? 'bg-red-500 text-white'
              : 'bg-white/10 text-gray-300 hover:bg-white/20'
          }`}
        >
          Devis Suspect (42/100)
        </button>
      </div>

      <QuoteReceiverView
        quote={currentQuote}
        onAccept={handleAccept}
        onReject={handleReject}
        onRequestModification={handleRequestModification}
      />
    </>
  );
}
