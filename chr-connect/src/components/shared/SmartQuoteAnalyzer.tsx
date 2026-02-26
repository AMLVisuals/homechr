'use client';

// ============================================================================
// SMART QUOTE ANALYZER COMPONENT
// ============================================================================
// Interface utilisateur pour l'analyse intelligente des devis
// Affiche le Trust Score, l'analyse des items, et les recommandations

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Camera,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  DollarSign,
  Clock,
  Truck,
  Package,
  Info,
  Sparkles,
  Eye,
  BarChart3,
  History,
  ArrowRight,
} from 'lucide-react';
import type {
  QuoteAnalysisResult,
  ItemAnalysisResult,
  TrustLevel,
  Recommendation,
  IdentifiedPart,
} from '@/lib/quote-intelligence/types';

// ============================================================================
// TYPES
// ============================================================================

interface SmartQuoteAnalyzerProps {
  analysis: QuoteAnalysisResult | null;
  isLoading?: boolean;
  onIdentifyPart?: (itemId: string) => void;
  onRequestAnalysis?: () => void;
  compact?: boolean;
}

interface PartScannerProps {
  onScan: (result: IdentifiedPart) => void;
  isLoading?: boolean;
}

// ============================================================================
// TRUST SCORE BADGE
// ============================================================================

function TrustScoreBadge({
  score,
  level,
  size = 'large',
}: {
  score: number;
  level: TrustLevel;
  size?: 'small' | 'medium' | 'large';
}) {
  const configs: Record<TrustLevel, { icon: React.ElementType; bg: string; ring: string }> = {
    EXCELLENT: { icon: ShieldCheck, bg: 'bg-green-500/20', ring: 'ring-green-500' },
    GOOD: { icon: ShieldCheck, bg: 'bg-green-500/15', ring: 'ring-green-400' },
    FAIR: { icon: ShieldCheck, bg: 'bg-yellow-500/15', ring: 'ring-yellow-500' },
    HIGH: { icon: ShieldAlert, bg: 'bg-orange-500/15', ring: 'ring-orange-500' },
    SUSPICIOUS: { icon: ShieldX, bg: 'bg-red-500/15', ring: 'ring-red-500' },
  };

  const config = configs[level];
  const Icon = config.icon;

  const sizes = {
    small: { container: 'w-12 h-12', icon: 'w-5 h-5', text: 'text-sm' },
    medium: { container: 'w-16 h-16', icon: 'w-6 h-6', text: 'text-lg' },
    large: { container: 'w-24 h-24', icon: 'w-8 h-8', text: 'text-2xl' },
  };

  const s = sizes[size];

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`relative ${s.container} rounded-full ${config.bg} ring-2 ${config.ring} flex items-center justify-center`}
    >
      <div className="text-center">
        <span className={`${s.text} font-bold text-white`}>{score}</span>
        <span className="text-[10px] text-gray-400 block">/100</span>
      </div>
      <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-slate-800">
        <Icon className={`${s.icon} ${level === 'SUSPICIOUS' ? 'text-red-400' : level === 'HIGH' ? 'text-orange-400' : 'text-green-400'}`} />
      </div>
    </motion.div>
  );
}

// ============================================================================
// ANALYSIS SUMMARY CARD
// ============================================================================

function AnalysisSummaryCard({ analysis }: { analysis: QuoteAnalysisResult }) {
  const { summary, globalScore } = analysis;

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
      <div className="flex items-start gap-4">
        {/* Trust Score */}
        <TrustScoreBadge
          score={globalScore.score}
          level={globalScore.level}
          size="large"
        />

        {/* Summary */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-lg font-bold ${globalScore.color}`}>
              {globalScore.emoji} {globalScore.label}
            </span>
          </div>
          <p className="text-sm text-gray-400 mb-3">
            {globalScore.detailedMessage}
          </p>

          {/* Key Insights */}
          <div className="space-y-1">
            {summary.keyInsights.map((insight, i) => (
              <div key={i} className="text-sm text-gray-300">
                {insight}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Price Comparison Bar */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Votre devis</span>
          <span className="text-white font-semibold">
            {summary.quotedTotal.toFixed(0)}€ HT
          </span>
        </div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">Estimation marché</span>
          <span className="text-gray-300">
            {summary.estimatedMarketTotal.min.toFixed(0)}€ - {summary.estimatedMarketTotal.max.toFixed(0)}€
          </span>
        </div>
        {summary.potentialSavings > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-yellow-400">Économie potentielle</span>
            <span className="text-yellow-400 font-semibold">
              -{summary.potentialSavings.toFixed(0)}€
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ITEM ANALYSIS ROW
// ============================================================================

function ItemAnalysisRow({
  item,
  onIdentify,
}: {
  item: ItemAnalysisResult;
  onIdentify?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getVerdictConfig = (verdict: string) => {
    const configs: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
      EXCELLENT: { color: 'text-green-400', bg: 'bg-green-500/20', icon: CheckCircle2 },
      GOOD: { color: 'text-green-400', bg: 'bg-green-500/15', icon: CheckCircle2 },
      FAIR: { color: 'text-yellow-400', bg: 'bg-yellow-500/15', icon: Minus },
      HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/15', icon: AlertTriangle },
      VERY_HIGH: { color: 'text-orange-500', bg: 'bg-orange-500/20', icon: AlertTriangle },
      SUSPICIOUS: { color: 'text-red-400', bg: 'bg-red-500/20', icon: XCircle },
    };
    return configs[verdict] || configs.FAIR;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      PART: Package,
      LABOR: Clock,
      TRAVEL: Truck,
      OTHER: Info,
    };
    return icons[type] || Info;
  };

  const verdictConfig = getVerdictConfig(item.verdict);
  const TypeIcon = getTypeIcon(item.type);
  const VerdictIcon = verdictConfig.icon;

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
      >
        {/* Type Icon */}
        <div className={`p-2 rounded-lg ${verdictConfig.bg}`}>
          <TypeIcon className={`w-4 h-4 ${verdictConfig.color}`} />
        </div>

        {/* Info */}
        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">
              {item.identifiedPart?.fullName || item.laborAnalysis?.description || `Item ${item.itemId}`}
            </span>
            {item.identifiedPart?.source === 'OCR' && (
              <span className="px-1.5 py-0.5 text-[10px] bg-purple-500/20 text-purple-400 rounded">
                OCR
              </span>
            )}
          </div>
          {item.identifiedPart?.reference && (
            <span className="text-xs text-gray-500">
              Réf: {item.identifiedPart.reference}
            </span>
          )}
        </div>

        {/* Price Comparison */}
        <div className="text-right">
          <div className="text-sm font-semibold text-white">
            {item.quotedPrice.toFixed(0)}€
          </div>
          {item.marketPrice.average > 0 && (
            <div className={`text-xs ${item.variance > 0 ? 'text-orange-400' : 'text-green-400'}`}>
              {item.variance > 0 ? '+' : ''}{item.variance.toFixed(0)}%
            </div>
          )}
        </div>

        {/* Verdict Badge */}
        <div className={`px-2 py-1 rounded-full ${verdictConfig.bg}`}>
          <VerdictIcon className={`w-4 h-4 ${verdictConfig.color}`} />
        </div>

        {/* Expand Icon */}
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0 space-y-3">
              {/* Market Price Range */}
              {item.marketPrice.average > 0 && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">Prix marché constaté</div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">
                      {item.marketPrice.min.toFixed(0)}€
                    </span>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full relative">
                      <div
                        className="absolute inset-y-0 bg-gradient-to-r from-green-500 to-yellow-500 rounded-full"
                        style={{
                          left: '0%',
                          right: '0%',
                        }}
                      />
                      {/* Quoted price marker */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full border-2 border-blue-500"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((item.quotedPrice - item.marketPrice.min) / (item.marketPrice.max - item.marketPrice.min)) * 100))}%`,
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-400">
                      {item.marketPrice.max.toFixed(0)}€
                    </span>
                  </div>
                  <div className="text-center text-xs text-gray-500 mt-1">
                    Moyenne: {item.marketPrice.average.toFixed(0)}€
                  </div>
                </div>
              )}

              {/* Labor Analysis */}
              {item.laborAnalysis && (
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-2">Analyse main d&apos;œuvre</div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Temps facturé:</span>
                      <span className="text-white ml-2">{item.laborAnalysis.quotedHours}h</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Standard:</span>
                      <span className="text-gray-300 ml-2">
                        {item.laborAnalysis.marketHours.min}-{item.laborAnalysis.marketHours.max}h
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Taux horaire:</span>
                      <span className="text-white ml-2">{item.laborAnalysis.quotedHourlyRate}€/h</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Moyenne région:</span>
                      <span className="text-gray-300 ml-2">
                        {item.laborAnalysis.marketHourlyRate.average}€/h
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Flags / Alerts */}
              {item.flags.length > 0 && (
                <div className="space-y-2">
                  {item.flags.map((flag, i) => (
                    <div
                      key={i}
                      className={`flex items-start gap-2 p-2 rounded-lg ${
                        flag.severity === 'ALERT'
                          ? 'bg-red-500/10 border border-red-500/20'
                          : flag.severity === 'WARNING'
                          ? 'bg-orange-500/10 border border-orange-500/20'
                          : 'bg-blue-500/10 border border-blue-500/20'
                      }`}
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          flag.severity === 'ALERT'
                            ? 'text-red-400'
                            : flag.severity === 'WARNING'
                            ? 'text-orange-400'
                            : 'text-blue-400'
                        }`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-white">{flag.message}</p>
                        {flag.suggestion && (
                          <p className="text-xs text-gray-400 mt-1">{flag.suggestion}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Identify Button (if no reference) */}
              {item.type === 'PART' && !item.identifiedPart && onIdentify && (
                <button
                  onClick={onIdentify}
                  className="w-full flex items-center justify-center gap-2 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Scanner la pièce
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// RECOMMENDATIONS CARD
// ============================================================================

function RecommendationsCard({ recommendations }: { recommendations: Recommendation[] }) {
  if (recommendations.length === 0) return null;

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'text-red-400 bg-red-500/20 border-red-500/30',
      MEDIUM: 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30',
      LOW: 'text-green-400 bg-green-500/20 border-green-500/30',
    };
    return colors[priority] || colors.MEDIUM;
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ElementType> = {
      NEGOTIATE_PRICE: DollarSign,
      REQUEST_DETAILS: Search,
      COMPARE_QUOTES: BarChart3,
      VERIFY_REFERENCE: Eye,
      CHECK_WARRANTY: ShieldCheck,
      CONSIDER_ALTERNATIVE: Lightbulb,
      APPROVE: CheckCircle2,
    };
    return icons[type] || Lightbulb;
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-5 h-5 text-yellow-400" />
        <h3 className="font-semibold text-white">Recommandations</h3>
      </div>

      <div className="space-y-2">
        {recommendations.map((rec) => {
          const Icon = getTypeIcon(rec.type);
          return (
            <div
              key={rec.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getPriorityColor(rec.priority)}`}
            >
              <Icon className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white">{rec.title}</span>
                  {rec.potentialImpact && rec.potentialImpact > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full">
                      -{rec.potentialImpact}€
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">{rec.description}</p>
              </div>
              {rec.actionable && (
                <ArrowRight className="w-4 h-4 text-gray-500 shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// BREAKDOWN CHART
// ============================================================================

function BreakdownChart({ breakdown }: { breakdown: QuoteAnalysisResult['breakdown'] }) {
  const items = [
    { label: 'Pièces', score: breakdown.partsScore, icon: Package },
    { label: 'Main d\'œuvre', score: breakdown.laborScore, icon: Clock },
    { label: 'Déplacement', score: breakdown.travelScore, icon: Truck },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500';
    if (score >= 50) return 'bg-yellow-500';
    if (score >= 30) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h3 className="font-semibold text-white">Analyse par catégorie</h3>
      </div>

      <div className="space-y-3">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400 w-28">{item.label}</span>
              <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${item.score}%` }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                  className={`h-full rounded-full ${getScoreColor(item.score)}`}
                />
              </div>
              <span className="text-sm font-medium text-white w-10 text-right">
                {item.score}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// PART SCANNER
// ============================================================================

export function PartScanner({ onScan, isLoading }: PartScannerProps) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [reference, setReference] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleManualSearch = async () => {
    if (!reference.trim()) return;

    setScanning(true);
    try {
      const response = await fetch('/api/ai/analyze-quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference: reference.trim() }),
      });

      const data = await response.json();
      if (data.success && data.part) {
        onScan(data.part);
      }
    } catch (error) {
      console.error('Scan error:', error);
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <h3 className="font-semibold text-white">Identifier une pièce</h3>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('camera')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            mode === 'camera'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Camera className="w-4 h-4" />
          Scanner
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
            mode === 'manual'
              ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Search className="w-4 h-4" />
          Référence
        </button>
      </div>

      {mode === 'camera' ? (
        <div className="aspect-video bg-black/50 rounded-lg flex items-center justify-center border border-dashed border-white/20">
          <div className="text-center text-gray-500">
            <Camera className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Photographiez l&apos;étiquette</p>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ex: Danfoss SC15G"
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
            onKeyDown={(e) => e.key === 'Enter' && handleManualSearch()}
          />
          <button
            onClick={handleManualSearch}
            disabled={scanning || isLoading || !reference.trim()}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition-colors"
          >
            {scanning ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function SmartQuoteAnalyzer({
  analysis,
  isLoading,
  onIdentifyPart,
  onRequestAnalysis,
  compact = false,
}: SmartQuoteAnalyzerProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <Sparkles className="w-6 h-6 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-gray-400 mt-4">Analyse en cours...</p>
        <p className="text-gray-500 text-sm">Vérification des prix marché</p>
      </div>
    );
  }

  // No analysis yet
  if (!analysis) {
    return (
      <div className="text-center py-8">
        <ShieldCheck className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">
          Protégez-vous des arnaques
        </h3>
        <p className="text-gray-400 text-sm mb-4 max-w-xs mx-auto">
          Notre IA analyse chaque ligne du devis et compare avec les prix du marché
        </p>
        {onRequestAnalysis && (
          <button
            onClick={onRequestAnalysis}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg text-white font-medium transition-all"
          >
            Lancer l&apos;analyse
          </button>
        )}
      </div>
    );
  }

  // Compact mode (just the badge)
  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <TrustScoreBadge
          score={analysis.globalScore.score}
          level={analysis.globalScore.level}
          size="small"
        />
        <div>
          <span className={`text-sm font-semibold ${analysis.globalScore.color}`}>
            {analysis.globalScore.label}
          </span>
          <p className="text-xs text-gray-500">{analysis.globalScore.shortMessage}</p>
        </div>
      </div>
    );
  }

  // Full analysis view
  return (
    <div className="space-y-4">
      {/* Summary */}
      <AnalysisSummaryCard analysis={analysis} />

      {/* Breakdown */}
      <BreakdownChart breakdown={analysis.breakdown} />

      {/* Item Analysis */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-5 h-5 text-blue-400" />
          <h3 className="font-semibold text-white">
            Analyse détaillée ({analysis.itemAnalysis.length} postes)
          </h3>
        </div>
        <div className="space-y-2">
          {analysis.itemAnalysis.map((item) => (
            <ItemAnalysisRow
              key={item.itemId}
              item={item}
              onIdentify={onIdentifyPart ? () => onIdentifyPart(item.itemId) : undefined}
            />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      <RecommendationsCard recommendations={analysis.recommendations} />

      {/* Historical Comparison */}
      {analysis.historicalComparison && analysis.historicalComparison.previousPurchases.length > 0 && (
        <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Historique des prix</h3>
            <span className={`ml-auto text-sm ${
              analysis.historicalComparison.priceTrend === 'INCREASING' ? 'text-red-400' :
              analysis.historicalComparison.priceTrend === 'DECREASING' ? 'text-green-400' :
              'text-gray-400'
            }`}>
              {analysis.historicalComparison.priceTrend === 'INCREASING' && (
                <><TrendingUp className="w-4 h-4 inline mr-1" /> En hausse</>
              )}
              {analysis.historicalComparison.priceTrend === 'DECREASING' && (
                <><TrendingDown className="w-4 h-4 inline mr-1" /> En baisse</>
              )}
              {analysis.historicalComparison.priceTrend === 'STABLE' && (
                <><Minus className="w-4 h-4 inline mr-1" /> Stable</>
              )}
            </span>
          </div>
          <div className="text-sm text-gray-400">
            {analysis.historicalComparison.previousPurchases.length} achat(s) précédent(s) •
            Moyenne: {analysis.historicalComparison.averageHistoricalPrice}€
          </div>
        </div>
      )}
    </div>
  );
}

export default SmartQuoteAnalyzer;
