'use client';

// ============================================================================
// TEST PAGE - Financial Engine & QuoteBuilder + Intelligence Devis ULTIMATE
// ============================================================================
// Page de test complète pour:
// - Le moteur financier
// - Le QuoteBuilder Ultimate avec IA
// - L'analyse intelligente des devis (OCR + Perplexity)
// - Notifications intelligentes temps réel
// - Graphiques de prix et tendances
// - Assistant IA conversationnel
// Route: /test-finance
// ============================================================================

import { useState, useEffect } from 'react';
import {
  Calculator, FileText, Euro, TrendingUp,
  Wrench, MapPin, ChevronRight, Download,
  Snowflake, Flame, ChefHat, Sparkles, ShieldCheck,
  Bell, BarChart3, MessageSquare, Printer, FileDown
} from 'lucide-react';
import { clsx } from 'clsx';

import { QuoteBuilderUltimate } from '@/components/provider/QuoteBuilderUltimate';
import { SmartQuoteAnalyzer, PartScanner } from '@/components/shared/SmartQuoteAnalyzer';
import { useQuoteIntelligence } from '@/hooks/useQuoteIntelligence';
import { PriceHistoryChart } from '@/components/shared/PriceHistoryChart';
import { SmartNotifications, useSmartNotifications, NotificationCenter } from '@/components/shared/SmartNotifications';
import { QuoteAIAssistant, AIAssistantButton } from '@/components/shared/QuoteAIAssistant';
import { printQuote, downloadQuoteHTML, exportQuoteJSON } from '@/lib/quote-pdf-generator';
import type { FinalQuote } from '@/components/provider/QuoteBuilderUltimate';
import {
  MISSIONS_WITH_FINANCIALS,
  EXAMPLE_QUOTE,
  STAFFING_EXAMPLES
} from '@/lib/mock-data';
import {
  formatPrice,
  calculateTravelCost,
  analyzeStaffingRate
} from '@/lib/financial-engine';
import type { MissionWithFinancials } from '@/types/unified';
import type { QuoteAnalysisRequest, IdentifiedPart } from '@/lib/quote-intelligence/types';

// ============================================================================
// COMPONENT
// ============================================================================

export default function TestFinancePage() {
  const [selectedMission, setSelectedMission] = useState<MissionWithFinancials | null>(null);
  const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
  const [submittedQuotes, setSubmittedQuotes] = useState<FinalQuote[]>([]);
  const [lastScannedPart, setLastScannedPart] = useState<IdentifiedPart | null>(null);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showPriceChart, setShowPriceChart] = useState(true);

  // Quote Intelligence Hook
  const {
    analysis,
    isAnalyzing,
    analyzeQuote,
    identifyPart,
    isIdentifying,
    error: intelligenceError,
  } = useQuoteIntelligence({ region: 'paris', includeHistory: true });

  // Smart Notifications Hook
  const {
    notifications,
    addNotification,
    dismissNotification,
    dismissAll,
    addPriceAlert,
    addAITip,
  } = useSmartNotifications();

  // Demo: Add sample notifications on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      addAITip(
        'Pour obtenir les meilleurs prix, comparez toujours 3 devis minimum.',
        'Les prix peuvent varier de 15 à 40% selon les prestataires.'
      );
    }, 2000);

    const timer2 = setTimeout(() => {
      addPriceAlert('Danfoss SC15G', 28, 320, 250);
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [addAITip, addPriceAlert]);

  // AI Assistant context
  const aiContext = {
    items: submittedQuotes.length > 0
      ? submittedQuotes[0].items.map(item => ({
          type: item.type,
          description: item.description,
          price: item.unitPriceHT * item.quantity,
          marketPrice: item.marketPrice?.average,
          variance: item.priceVariance,
        }))
      : [
          { type: 'TRAVEL', description: 'Déplacement', price: 55, marketPrice: 50, variance: 10 },
          { type: 'LABOR', description: 'Main d\'oeuvre', price: 187.5, marketPrice: 180, variance: 4 },
          { type: 'PART', description: 'Compresseur Danfoss SC15G', price: 320, marketPrice: 250, variance: 28 },
        ],
    totalHT: 647.5,
    totalTTC: 777,
    trustScore: 72,
    clientName: 'Restaurant L\'Ambroisie',
    equipmentType: 'Chambre froide',
    problemDescription: 'Panne compresseur',
  };

  // Test travel cost calculation
  const travelTests = [5, 12, 30, 60];

  // Demo quote for analysis
  const demoQuoteRequest: QuoteAnalysisRequest = {
    quoteId: 'demo_001',
    provider: {
      id: 'provider_001',
      name: 'Froid Express Paris',
      siret: '123 456 789 00001',
    },
    items: [
      {
        id: 'item_1',
        type: 'TRAVEL',
        description: 'Déplacement zone Paris',
        quantity: 1,
        unitPriceHT: 55,
        totalHT: 55,
      },
      {
        id: 'item_2',
        type: 'LABOR',
        description: 'Diagnostic + réparation compresseur',
        quantity: 2.5,
        unitPriceHT: 75,
        totalHT: 187.5,
        labor: {
          taskType: 'REPAIR_COMPLEX',
          description: 'Remplacement compresseur chambre froide',
          hours: 2.5,
        },
      },
      {
        id: 'item_3',
        type: 'PART',
        description: 'Compresseur Danfoss SC15G',
        quantity: 1,
        unitPriceHT: 320,
        totalHT: 320,
        part: {
          reference: 'Danfoss SC15G',
          brand: 'Danfoss',
          model: 'SC15G',
        },
      },
      {
        id: 'item_4',
        type: 'PART',
        description: 'Thermostat Dixell XR06CX',
        quantity: 1,
        unitPriceHT: 85,
        totalHT: 85,
        part: {
          reference: 'Dixell XR06CX',
          brand: 'Dixell',
          model: 'XR06CX',
        },
      },
    ],
    subtotalHT: 647.5,
    tva: 129.5,
    totalTTC: 777,
  };

  // Handle demo analysis
  const handleDemoAnalysis = async () => {
    await analyzeQuote(demoQuoteRequest);
  };

  // Handle part scan
  const handlePartScanned = (part: IdentifiedPart) => {
    setLastScannedPart(part);
  };

  // Handle quote submission
  const handleQuoteSubmit = (quote: FinalQuote) => {
    console.log('Quote submitted:', quote);
    setSubmittedQuotes(prev => [...prev, quote]);
  };

  // Open quote builder for a mission
  const openQuoteBuilder = (mission: MissionWithFinancials) => {
    setSelectedMission(mission);
    setShowQuoteBuilder(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            CHR Connect - Ultimate Quote System
          </h1>
          <p className="text-gray-400 mt-2">
            Moteur de devis intelligent avec IA anti-arnaque
          </p>
          <div className="flex items-center justify-center gap-4 mt-4">
            <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full text-green-400 text-sm">
              <ShieldCheck className="w-4 h-4" />
              Protection IA Active
            </span>
            <span className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full text-purple-400 text-sm">
              <Sparkles className="w-4 h-4" />
              Analyse Temps Réel
            </span>
            <span className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-blue-400 text-sm">
              <BarChart3 className="w-4 h-4" />
              Prix Marché
            </span>
          </div>
        </div>

        {/* Premium Features Demo Section */}
        <section className="bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Fonctionnalités Premium</h2>
              <p className="text-sm text-gray-400">Démo des composants avancés du système</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Price History Chart Demo */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Graphique des Prix
              </h3>
              <PriceHistoryChart
                reference="Danfoss SC15G"
                brand="Danfoss"
                model="SC15G"
                currentPrice={320}
                marketAverage={250}
                marketMin={220}
                marketMax={290}
                trend="up"
                trendPercent={8}
                showFullChart={showPriceChart}
                onExpandToggle={() => setShowPriceChart(!showPriceChart)}
              />
            </div>

            {/* Actions & Tools */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Outils Premium
              </h3>

              {/* Notification Center Toggle */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-blue-400" />
                    <span className="font-medium text-white">Centre de Notifications</span>
                    {notifications.length > 0 && (
                      <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {notifications.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotificationCenter(!showNotificationCenter)}
                    className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                  >
                    {showNotificationCenter ? 'Fermer' : 'Ouvrir'}
                  </button>
                </div>

                {showNotificationCenter && (
                  <NotificationCenter
                    notifications={notifications}
                    onDismiss={dismissNotification}
                    onDismissAll={dismissAll}
                  />
                )}

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => addPriceAlert('Dixell XR06CX', 15, 85, 74)}
                    className="flex-1 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg text-xs hover:bg-orange-500/30 transition-colors"
                  >
                    + Alerte Prix
                  </button>
                  <button
                    onClick={() => addAITip('Demandez toujours une garantie écrite sur les pièces remplacées.')}
                    className="flex-1 px-3 py-2 bg-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/30 transition-colors"
                  >
                    + Conseil IA
                  </button>
                </div>
              </div>

              {/* AI Assistant Toggle */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">Assistant IA</span>
                  </div>
                  <button
                    onClick={() => setShowAIAssistant(!showAIAssistant)}
                    className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-sm hover:bg-purple-500/30 transition-colors"
                  >
                    {showAIAssistant ? 'Fermer' : 'Discuter'}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Posez des questions sur vos devis, négociez les prix, obtenez des conseils personnalisés
                </p>
              </div>

              {/* Export Tools */}
              {submittedQuotes.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <div className="flex items-center gap-2 mb-3">
                    <FileDown className="w-5 h-5 text-green-400" />
                    <span className="font-medium text-white">Export Devis</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => printQuote(submittedQuotes[0])}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/10 text-white rounded-lg text-sm hover:bg-white/20 transition-colors"
                    >
                      <Printer className="w-4 h-4" />
                      Imprimer
                    </button>
                    <button
                      onClick={() => downloadQuoteHTML(submittedQuotes[0])}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      HTML
                    </button>
                    <button
                      onClick={() => exportQuoteJSON(submittedQuotes[0])}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-500/20 text-green-400 rounded-lg text-sm hover:bg-green-500/30 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      JSON
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section 0: Quote Intelligence (NEW) */}
        <section className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Intelligence Devis</h2>
              <p className="text-sm text-gray-400">Système anti-arnaque avec OCR + Perplexity + IA</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-green-400" />
              <span className="text-sm text-green-400">Protection Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Part Scanner */}
            <div className="space-y-4">
              <PartScanner
                onScan={handlePartScanned}
                isLoading={isIdentifying}
              />

              {/* Last Scanned Part Result */}
              {lastScannedPart && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-green-500/30">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-5 h-5 text-green-400" />
                    <span className="font-semibold text-white">Pièce Identifiée</span>
                    <span className="ml-auto text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                      {lastScannedPart.source}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Référence</span>
                      <span className="text-white font-medium">{lastScannedPart.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Description</span>
                      <span className="text-gray-300 text-right max-w-[200px] truncate">
                        {lastScannedPart.description || lastScannedPart.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Catégorie</span>
                      <span className="text-blue-400">{lastScannedPart.category}</span>
                    </div>
                    <div className="pt-2 border-t border-white/10">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Prix Marché</span>
                        <span className="text-green-400 font-semibold">
                          {lastScannedPart.marketData.minPrice}€ - {lastScannedPart.marketData.maxPrice}€
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Moyenne</span>
                        <span className="text-white">{lastScannedPart.marketData.averagePrice}€ HT</span>
                      </div>
                    </div>
                    {lastScannedPart.officialImageUrl && (
                      <div className="pt-2">
                        <img
                          src={lastScannedPart.officialImageUrl}
                          alt={lastScannedPart.reference}
                          className="w-full h-24 object-contain bg-white/10 rounded"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Demo Button */}
              <button
                onClick={handleDemoAnalysis}
                disabled={isAnalyzing}
                className={clsx(
                  "w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2",
                  isAnalyzing
                    ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Lancer Analyse Démo
                  </>
                )}
              </button>

              {intelligenceError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                  {intelligenceError}
                </div>
              )}
            </div>

            {/* Right: Analysis Results */}
            <div>
              <SmartQuoteAnalyzer
                analysis={analysis}
                isLoading={isAnalyzing}
                onRequestAnalysis={handleDemoAnalysis}
                compact={false}
              />
            </div>
          </div>
        </section>

        {/* Section 1: Travel Cost Calculator */}
        <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Calcul Frais de Déplacement</h2>
              <p className="text-sm text-gray-400">Test des zones tarifaires</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {travelTests.map(distance => {
              const result = calculateTravelCost(distance);
              return (
                <div
                  key={distance}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="text-2xl font-bold text-white mb-1">
                    {distance} km
                  </div>
                  <div className="text-sm text-gray-400 mb-3">
                    {result.zone.name}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Forfait</span>
                      <span className="text-white">{formatPrice(result.baseFee)}</span>
                    </div>
                    {result.distanceSurcharge > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Surcharge</span>
                        <span className="text-orange-400">+{formatPrice(result.distanceSurcharge)}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-white/10">
                      <span className="text-gray-400">Total HT</span>
                      <span className="text-blue-400 font-semibold">{formatPrice(result.totalHT)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Missions with Financials */}
        <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Missions avec Données Financières</h2>
              <p className="text-sm text-gray-400">Cliquez pour créer un devis</p>
            </div>
          </div>

          <div className="space-y-4">
            {MISSIONS_WITH_FINANCIALS.map(mission => {
              const Icon = mission.equipmentCategory === 'COLD_ROOM'
                ? Snowflake
                : mission.equipmentCategory === 'OVEN'
                  ? Flame
                  : ChefHat;

              const statusColors: Record<string, string> = {
                'SEARCHING': 'bg-yellow-500/20 text-yellow-400',
                'MATCHED': 'bg-blue-500/20 text-blue-400',
                'SCHEDULED': 'bg-green-500/20 text-green-400',
              };

              return (
                <div
                  key={mission.id}
                  className="bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={clsx(
                      "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
                      mission.type === 'STAFFING'
                        ? "bg-purple-500/20"
                        : "bg-cyan-500/20"
                    )}>
                      <Icon className={clsx(
                        "w-6 h-6",
                        mission.type === 'STAFFING'
                          ? "text-purple-400"
                          : "text-cyan-400"
                      )} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-bold text-white truncate">
                          {mission.problemLabel}
                        </h3>
                        <span className={clsx(
                          "px-2 py-0.5 rounded-full text-xs font-medium",
                          statusColors[mission.status] || 'bg-gray-500/20 text-gray-400'
                        )}>
                          {mission.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">
                        {mission.establishmentName} - {mission.equipmentName || 'Staffing'}
                      </p>

                      {/* Financial info */}
                      <div className="flex items-center gap-4 text-sm">
                        {mission.distanceKm && (
                          <span className="text-gray-500">
                            <MapPin className="w-3 h-3 inline mr-1" />
                            {mission.distanceKm}km
                          </span>
                        )}
                        <span className="text-gray-500">
                          <Euro className="w-3 h-3 inline mr-1" />
                          {formatPrice(mission.estimatedPrice.min)} - {formatPrice(mission.estimatedPrice.max)}
                        </span>
                        {mission.quotes.length > 0 && (
                          <span className="text-green-400">
                            <FileText className="w-3 h-3 inline mr-1" />
                            {mission.quotes.length} devis
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action */}
                    <button
                      onClick={() => openQuoteBuilder(mission)}
                      className={clsx(
                        "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
                        "bg-gradient-to-r from-blue-600 to-purple-600",
                        "hover:from-blue-500 hover:to-purple-500"
                      )}
                    >
                      <Calculator className="w-4 h-4" />
                      Créer Devis
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Existing quote preview */}
                  {mission.quotes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <div className="text-xs text-gray-500 mb-2">Devis existant:</div>
                      <div className="bg-green-500/10 rounded-lg p-3 flex items-center justify-between">
                        <div>
                          <span className="text-green-400 font-medium">
                            {mission.quotes[0].reference}
                          </span>
                          <span className="text-gray-500 mx-2">-</span>
                          <span className="text-white">
                            {formatPrice(mission.quotes[0].totalTTC)} TTC
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-green-500/20 rounded text-xs text-green-400">
                          {mission.quotes[0].status}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 3: Staffing Market Analysis */}
        <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Analyse Marché Staffing</h2>
              <p className="text-sm text-gray-400">Test du Smart Pricing</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STAFFING_EXAMPLES.map((example, i) => {
              const analysis = analyzeStaffingRate(example.hourlyRate, example.roleId);

              const scoreColors: Record<string, string> = {
                'LOW': 'text-red-400 bg-red-500/20',
                'BELOW_MARKET': 'text-orange-400 bg-orange-500/20',
                'COMPETITIVE': 'text-green-400 bg-green-500/20',
                'ABOVE_MARKET': 'text-blue-400 bg-blue-500/20',
                'PREMIUM': 'text-purple-400 bg-purple-500/20',
              };

              return (
                <div
                  key={i}
                  className="bg-white/5 rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white">{example.role}</h3>
                    <span className={clsx(
                      "px-2 py-1 rounded-lg text-xs font-medium",
                      scoreColors[analysis.score]
                    )}>
                      {analysis.score}
                    </span>
                  </div>

                  {/* Rate bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{formatPrice(analysis.marketRateMin)}/h</span>
                      <span>{formatPrice(analysis.marketRateAvg)}/h (moy)</span>
                      <span>{formatPrice(analysis.marketRateMax)}/h</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full relative">
                      {/* Market range */}
                      <div className="absolute inset-y-0 left-0 right-0 bg-gradient-to-r from-red-500 via-green-500 to-purple-500 rounded-full opacity-30" />
                      {/* Position indicator */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg border-2 border-blue-500"
                        style={{ left: `${analysis.percentile}%` }}
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Taux proposé</span>
                      <span className="text-white font-medium">{formatPrice(example.hourlyRate)}/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Position marché</span>
                      <span className="text-blue-400">{analysis.percentile}e percentile</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Attractivité</span>
                      <span className={clsx(
                        analysis.attractivenessForProviders === 'HIGH' && 'text-green-400',
                        analysis.attractivenessForProviders === 'MEDIUM' && 'text-yellow-400',
                        analysis.attractivenessForProviders === 'LOW' && 'text-red-400',
                      )}>
                        {analysis.attractivenessForProviders}
                      </span>
                    </div>
                  </div>

                  {/* Recommendation */}
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-400">
                      {analysis.recommendation}
                    </p>
                  </div>

                  {/* Total */}
                  <div className="mt-3 flex justify-between items-center">
                    <span className="text-gray-500 text-sm">
                      {example.hours}h × {example.numberOfPeople} pers.
                    </span>
                    <span className="text-lg font-bold text-white">
                      {formatPrice(example.totalTTC)} TTC
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 4: Submitted Quotes */}
        {submittedQuotes.length > 0 && (
          <section className="bg-white/5 rounded-2xl p-6 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <FileText className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Devis Soumis ({submittedQuotes.length})</h2>
                <p className="text-sm text-gray-400">Devis créés pendant cette session</p>
              </div>
            </div>

            <div className="space-y-3">
              {submittedQuotes.map(quote => (
                <div
                  key={quote.id}
                  className="bg-white/5 rounded-xl p-4 border border-green-500/30"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-white">{quote.reference}</span>
                    <div className="flex items-center gap-2">
                      {quote.trustScore > 0 && (
                        <span className={clsx(
                          "px-2 py-1 rounded text-xs font-medium",
                          quote.trustLevel === 'EXCELLENT' || quote.trustLevel === 'GOOD'
                            ? "bg-green-500/20 text-green-400"
                            : quote.trustLevel === 'FAIR'
                            ? "bg-yellow-500/20 text-yellow-400"
                            : "bg-red-500/20 text-red-400"
                        )}>
                          Score: {quote.trustScore}/100
                        </span>
                      )}
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-medium",
                        quote.status === 'SIGNED'
                          ? "bg-green-500/20 text-green-400"
                          : quote.status === 'SENT'
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-gray-500/20 text-gray-400"
                      )}>
                        {quote.status}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Client</span>
                      <p className="text-white">{quote.client.establishmentName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Total TTC</span>
                      <p className="text-blue-400 font-bold">{formatPrice(quote.totalTTC)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Signature</span>
                      <p className={clsx(
                        "font-medium",
                        quote.signature.signed ? "text-green-400" : "text-gray-500"
                      )}>
                        {quote.signature.signed ? 'Signé' : 'Non signé'}
                        {quote.signature.phoneVerified && ' + SMS'}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    {quote.items.length} lignes
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Example Quote Reference */}
        <section className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10">
          <h2 className="text-xl font-bold mb-4">Exemple de Devis Complet</h2>
          <div className="bg-white/5 rounded-xl p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-2xl font-bold text-white">{EXAMPLE_QUOTE.reference}</p>
                <p className="text-gray-400">{EXAMPLE_QUOTE.establishmentName}</p>
              </div>
              <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-sm font-medium">
                {EXAMPLE_QUOTE.status}
              </span>
            </div>

            {/* Items */}
            <div className="border border-white/10 rounded-lg overflow-hidden mb-4">
              <div className="bg-white/5 px-4 py-2 grid grid-cols-12 gap-4 text-xs font-semibold text-gray-400">
                <div className="col-span-5">Description</div>
                <div className="col-span-2">Qté</div>
                <div className="col-span-2">Prix Unit.</div>
                <div className="col-span-3 text-right">Total HT</div>
              </div>
              {EXAMPLE_QUOTE.items.map(item => (
                <div key={item.id} className="px-4 py-2 grid grid-cols-12 gap-4 text-sm border-t border-white/5">
                  <div className="col-span-5 text-white">{item.description}</div>
                  <div className="col-span-2 text-gray-400">{item.quantity} {item.unit}</div>
                  <div className="col-span-2 text-gray-400">{formatPrice(item.unitPriceHT)}</div>
                  <div className="col-span-3 text-right text-white">{formatPrice(item.totalHT)}</div>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Sous-total HT</span>
                <span className="text-white">{formatPrice(EXAMPLE_QUOTE.subtotalHT)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">TVA</span>
                <span className="text-white">{formatPrice(EXAMPLE_QUOTE.totalTVA)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                <span className="text-white">Total TTC</span>
                <span className="text-blue-400">{formatPrice(EXAMPLE_QUOTE.totalTTC)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-white/10">
                <span className="text-gray-400">Commission ({Math.round(EXAMPLE_QUOTE.platformFeeRate * 100)}%)</span>
                <span className="text-red-400">-{formatPrice(EXAMPLE_QUOTE.platformFeeAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Net Prestataire</span>
                <span className="text-green-400 font-bold">{formatPrice(EXAMPLE_QUOTE.providerNetAmount)}</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Quote Builder Ultimate */}
      {selectedMission && (
        <QuoteBuilderUltimate
          isOpen={showQuoteBuilder}
          onClose={() => {
            setShowQuoteBuilder(false);
            setSelectedMission(null);
          }}
          onSubmit={handleQuoteSubmit}
          missionId={selectedMission.id}
          providerId="provider_test_001"
          providerName="Froid Express Paris"
          providerSiret="123 456 789 00001"
          providerAddress="15 Rue de la Glacière, 75013 Paris"
          providerPhone="06 12 34 56 78"
          providerEmail="contact@froid-express.fr"
          clientId="patron_001"
          clientName="Chef Bernard Pacaud"
          clientPhone="01 42 78 51 45"
          clientEmail="contact@ambroisie.fr"
          establishmentId={selectedMission.establishmentId}
          establishmentName={selectedMission.establishmentName || 'Établissement'}
          establishmentAddress="9 Place des Vosges, 75004 Paris"
          establishmentSiret="987 654 321 00001"
          distanceKm={selectedMission.distanceKm}
          problemDescription={selectedMission.problemLabel}
        />
      )}

      {/* Floating Smart Notifications */}
      <SmartNotifications
        notifications={notifications}
        onDismiss={dismissNotification}
        position="top-right"
        maxVisible={3}
      />

      {/* Floating AI Assistant Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <AIAssistantButton
          onClick={() => setShowAIAssistant(true)}
          hasNewInsights={notifications.some(n => n.type === 'tip' && !n.read)}
        />
      </div>

      {/* AI Assistant Panel */}
      {showAIAssistant && (
        <div className="fixed bottom-24 right-6 z-50">
          <QuoteAIAssistant
            context={aiContext}
            isOpen={showAIAssistant}
            onClose={() => setShowAIAssistant(false)}
            position="right"
          />
        </div>
      )}
    </div>
  );
}
