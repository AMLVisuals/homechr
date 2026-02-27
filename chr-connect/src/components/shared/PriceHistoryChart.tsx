'use client';

// ============================================================================
// PRICE HISTORY CHART
// ============================================================================
// Graphique interactif des tendances de prix pour les pièces détachées
// Montre l'historique, les prédictions et les comparaisons marché

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChart,
  Target,
  Zap,
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

interface PriceDataPoint {
  date: string;
  price: number;
  source: 'market' | 'quoted' | 'predicted';
  supplier?: string;
}

interface PriceHistoryChartProps {
  reference: string;
  brand?: string;
  model?: string;
  currentPrice: number;
  marketAverage: number;
  marketMin: number;
  marketMax: number;
  priceHistory?: PriceDataPoint[];
  trend?: 'up' | 'down' | 'stable';
  trendPercent?: number;
  showFullChart?: boolean;
  onExpandToggle?: () => void;
  className?: string;
}

// ============================================================================
// MOCK DATA - Pour démonstration
// ============================================================================

function generateMockHistory(basePrice: number): PriceDataPoint[] {
  const history: PriceDataPoint[] = [];
  const now = new Date();

  for (let i = 11; i >= 0; i--) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - i);

    // Variation réaliste des prix (+/- 15%)
    const variance = (Math.random() - 0.5) * 0.3;
    const price = basePrice * (1 + variance);

    history.push({
      date: date.toISOString().split('T')[0],
      price: Math.round(price * 100) / 100,
      source: 'market',
    });
  }

  return history;
}

// ============================================================================
// MINI SPARKLINE COMPONENT
// ============================================================================

function Sparkline({
  data,
  width = 100,
  height = 30,
  color = '#3b82f6',
}: {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Point actuel */}
      <circle
        cx={width}
        cy={height - ((data[data.length - 1] - min) / range) * height}
        r="3"
        fill={color}
      />
    </svg>
  );
}

// ============================================================================
// FULL CHART COMPONENT
// ============================================================================

function FullPriceChart({
  history,
  currentPrice,
  marketMin,
  marketMax,
  marketAverage,
}: {
  history: PriceDataPoint[];
  currentPrice: number;
  marketMin: number;
  marketMax: number;
  marketAverage: number;
}) {
  const width = 400;
  const height = 150;
  const padding = { top: 20, right: 40, bottom: 30, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const prices = history.map(h => h.price);
  const allPrices = [...prices, currentPrice, marketMin, marketMax];
  const minPrice = Math.min(...allPrices) * 0.95;
  const maxPrice = Math.max(...allPrices) * 1.05;
  const priceRange = maxPrice - minPrice;

  const getY = (price: number) => {
    return padding.top + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const getX = (index: number) => {
    return padding.left + (index / (history.length - 1)) * chartWidth;
  };

  // Ligne de l'historique
  const linePath = history.map((point, index) => {
    const x = getX(index);
    const y = getY(point.price);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Zone de prix marché
  const marketZoneY1 = getY(marketMax);
  const marketZoneY2 = getY(marketMin);

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Zone de prix marché */}
      <rect
        x={padding.left}
        y={marketZoneY1}
        width={chartWidth}
        height={marketZoneY2 - marketZoneY1}
        fill="rgba(34, 197, 94, 0.1)"
        stroke="rgba(34, 197, 94, 0.3)"
        strokeDasharray="4 4"
      />

      {/* Ligne moyenne marché */}
      <line
        x1={padding.left}
        y1={getY(marketAverage)}
        x2={padding.left + chartWidth}
        y2={getY(marketAverage)}
        stroke="#22c55e"
        strokeWidth="1"
        strokeDasharray="4 4"
      />

      {/* Ligne de l'historique */}
      <path
        d={linePath}
        fill="none"
        stroke="#3b82f6"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Points de données */}
      {history.map((point, index) => (
        <circle
          key={index}
          cx={getX(index)}
          cy={getY(point.price)}
          r="3"
          fill="#3b82f6"
          className="hover:r-4 transition-all cursor-pointer"
        />
      ))}

      {/* Point prix actuel */}
      <circle
        cx={padding.left + chartWidth + 10}
        cy={getY(currentPrice)}
        r="5"
        fill={currentPrice <= marketAverage * 1.1 ? '#22c55e' : currentPrice <= marketAverage * 1.3 ? '#f59e0b' : '#ef4444'}
        stroke="white"
        strokeWidth="2"
      />

      {/* Axe Y labels */}
      <text x={padding.left - 5} y={getY(maxPrice)} textAnchor="end" className="text-[10px] fill-gray-400">
        {maxPrice.toFixed(0)}€
      </text>
      <text x={padding.left - 5} y={getY(minPrice)} textAnchor="end" className="text-[10px] fill-gray-400">
        {minPrice.toFixed(0)}€
      </text>
      <text x={padding.left - 5} y={getY(marketAverage)} textAnchor="end" className="text-[10px] fill-green-400">
        Moy.
      </text>

      {/* Labels dates */}
      {history.length > 0 && (
        <>
          <text x={padding.left} y={height - 5} textAnchor="start" className="text-[9px] fill-gray-500">
            {new Date(history[0].date).toLocaleDateString('fr-FR', { month: 'short' })}
          </text>
          <text x={padding.left + chartWidth} y={height - 5} textAnchor="end" className="text-[9px] fill-gray-500">
            {new Date(history[history.length - 1].date).toLocaleDateString('fr-FR', { month: 'short' })}
          </text>
        </>
      )}

      {/* Légende */}
      <g transform={`translate(${padding.left}, ${height - 5})`}>
        <rect x="0" y="-8" width="8" height="8" fill="rgba(34, 197, 94, 0.2)" stroke="rgba(34, 197, 94, 0.5)" />
        <text x="12" y="0" className="text-[8px] fill-gray-400">Zone marché</text>
      </g>
    </svg>
  );
}

// ============================================================================
// PRICE COMPARISON BAR
// ============================================================================

function PriceComparisonBar({
  currentPrice,
  marketMin,
  marketMax,
  marketAverage,
}: {
  currentPrice: number;
  marketMin: number;
  marketMax: number;
  marketAverage: number;
}) {
  const range = marketMax - marketMin;
  const extendedMin = marketMin - range * 0.2;
  const extendedMax = marketMax + range * 0.4;
  const totalRange = extendedMax - extendedMin;

  const getPosition = (price: number) => {
    return Math.max(0, Math.min(100, ((price - extendedMin) / totalRange) * 100));
  };

  const minPos = getPosition(marketMin);
  const maxPos = getPosition(marketMax);
  const avgPos = getPosition(marketAverage);
  const currentPos = getPosition(currentPrice);

  const isPriceGood = currentPrice <= marketAverage * 1.05;
  const isPriceFair = currentPrice > marketAverage * 1.05 && currentPrice <= marketAverage * 1.2;

  return (
    <div className="relative h-8 mt-2">
      {/* Background bar */}
      <div className="absolute inset-x-0 top-3 h-2 bg-[var(--bg-active)] rounded-full" />

      {/* Market zone (green) */}
      <div
        className="absolute top-3 h-2 bg-green-500/30 rounded-full"
        style={{ left: `${minPos}%`, width: `${maxPos - minPos}%` }}
      />

      {/* Average marker */}
      <div
        className="absolute top-1 w-0.5 h-6 bg-green-400"
        style={{ left: `${avgPos}%` }}
      >
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] text-green-400 whitespace-nowrap">
          Moy. {marketAverage.toFixed(0)}€
        </div>
      </div>

      {/* Current price marker */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        className={clsx(
          'absolute top-0 w-4 h-4 rounded-full border-2 border-white shadow-lg -translate-x-1/2',
          isPriceGood && 'bg-green-500',
          isPriceFair && 'bg-yellow-500',
          !isPriceGood && !isPriceFair && 'bg-red-500'
        )}
        style={{ left: `${currentPos}%` }}
      >
        <div className={clsx(
          'absolute top-5 left-1/2 -translate-x-1/2 text-[10px] font-bold whitespace-nowrap',
          isPriceGood && 'text-green-400',
          isPriceFair && 'text-yellow-400',
          !isPriceGood && !isPriceFair && 'text-red-400'
        )}>
          {currentPrice.toFixed(0)}€
        </div>
      </motion.div>

      {/* Min/Max labels */}
      <div
        className="absolute top-6 text-[8px] text-[var(--text-muted)]"
        style={{ left: `${minPos}%`, transform: 'translateX(-50%)' }}
      >
        Min
      </div>
      <div
        className="absolute top-6 text-[8px] text-[var(--text-muted)]"
        style={{ left: `${maxPos}%`, transform: 'translateX(-50%)' }}
      >
        Max
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PriceHistoryChart({
  reference,
  brand,
  model,
  currentPrice,
  marketAverage,
  marketMin,
  marketMax,
  priceHistory,
  trend = 'stable',
  trendPercent = 0,
  showFullChart = false,
  onExpandToggle,
  className,
}: PriceHistoryChartProps) {
  // Générer des données mock si pas d'historique fourni
  const history = useMemo(() => {
    return priceHistory || generateMockHistory(marketAverage);
  }, [priceHistory, marketAverage]);

  const sparklineData = history.map(h => h.price);

  const priceVariance = ((currentPrice - marketAverage) / marketAverage) * 100;
  const isPriceGood = priceVariance <= 5;
  const isPriceFair = priceVariance > 5 && priceVariance <= 20;
  const isPriceHigh = priceVariance > 20;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-red-400' : trend === 'down' ? 'text-green-400' : 'text-[var(--text-secondary)]';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className={clsx(
            'p-2 rounded-lg',
            isPriceGood && 'bg-green-500/20 text-green-400',
            isPriceFair && 'bg-yellow-500/20 text-yellow-400',
            isPriceHigh && 'bg-red-500/20 text-red-400'
          )}>
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-primary)]">
              Analyse de prix
            </div>
            <div className="text-xs text-[var(--text-secondary)]">
              {reference} {brand && `• ${brand}`}
            </div>
          </div>
        </div>

        {/* Trend Badge */}
        <div className={clsx('flex items-center gap-1 px-2 py-1 rounded-full text-xs', trendColor)}>
          <TrendIcon className="w-3 h-3" />
          <span>{trend === 'stable' ? 'Stable' : `${trendPercent > 0 ? '+' : ''}${trendPercent}%`}</span>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs text-[var(--text-secondary)]">Comparaison marché</div>
          <div className={clsx(
            'flex items-center gap-1 text-xs font-medium',
            isPriceGood && 'text-green-400',
            isPriceFair && 'text-yellow-400',
            isPriceHigh && 'text-red-400'
          )}>
            {isPriceGood && <CheckCircle2 className="w-3 h-3" />}
            {isPriceFair && <AlertTriangle className="w-3 h-3" />}
            {isPriceHigh && <AlertTriangle className="w-3 h-3" />}
            <span>
              {isPriceGood ? 'Prix correct' : isPriceFair ? 'Prix élevé' : 'Prix suspect'}
            </span>
          </div>
        </div>

        <PriceComparisonBar
          currentPrice={currentPrice}
          marketMin={marketMin}
          marketMax={marketMax}
          marketAverage={marketAverage}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-[var(--border)]">
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">Min</div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">{marketMin.toFixed(0)}€</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">Moy</div>
          <div className="text-sm font-medium text-green-400">{marketAverage.toFixed(0)}€</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">Max</div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">{marketMax.toFixed(0)}€</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[var(--text-muted)] uppercase">Écart</div>
          <div className={clsx(
            'text-sm font-medium',
            priceVariance <= 0 && 'text-green-400',
            priceVariance > 0 && priceVariance <= 20 && 'text-yellow-400',
            priceVariance > 20 && 'text-red-400'
          )}>
            {priceVariance > 0 ? '+' : ''}{priceVariance.toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Sparkline Preview */}
      {!showFullChart && (
        <div className="px-4 py-2 border-t border-[var(--border)]">
          <div className="flex items-center justify-between">
            <div className="text-[10px] text-[var(--text-muted)]">Évolution 12 mois</div>
            <Sparkline
              data={sparklineData}
              color={isPriceGood ? '#22c55e' : isPriceFair ? '#f59e0b' : '#ef4444'}
            />
          </div>
        </div>
      )}

      {/* Full Chart (Expandable) */}
      {showFullChart && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="px-4 py-3 border-t border-[var(--border)]"
        >
          <div className="text-xs text-[var(--text-secondary)] mb-2">Historique des prix (12 mois)</div>
          <FullPriceChart
            history={history}
            currentPrice={currentPrice}
            marketMin={marketMin}
            marketMax={marketMax}
            marketAverage={marketAverage}
          />
        </motion.div>
      )}

      {/* Expand/Collapse Button */}
      {onExpandToggle && (
        <button
          onClick={onExpandToggle}
          className="w-full px-4 py-2 flex items-center justify-center gap-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors border-t border-[var(--border)]"
        >
          {showFullChart ? (
            <>
              <ChevronUp className="w-3 h-3" />
              Masquer le graphique
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" />
              Voir l'historique complet
            </>
          )}
        </button>
      )}

      {/* AI Insight */}
      <div className="px-4 py-3 bg-[var(--bg-card)] border-t border-[var(--border)]">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-[var(--text-secondary)]">
            <span className="text-purple-400 font-medium">Analyse IA:</span>{' '}
            {isPriceGood
              ? `Ce prix est dans la fourchette normale du marché. Les prix ont été ${trend === 'up' ? 'en hausse' : trend === 'down' ? 'en baisse' : 'stables'} ces derniers mois.`
              : isPriceFair
              ? `Ce prix est ${priceVariance.toFixed(0)}% au-dessus de la moyenne. Négociable, surtout si achat en volume.`
              : `Attention: ce prix est significativement plus élevé que le marché. Demandez des justifications ou comparez avec d'autres fournisseurs.`
            }
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default PriceHistoryChart;
