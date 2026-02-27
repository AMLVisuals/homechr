'use client';

// ============================================================================
// QUOTE BUILDER ULTIMATE
// ============================================================================
// Créateur de devis intelligent de niveau professionnel
// Intègre: OCR Gemini, Recherche Perplexity, Analyse IA, Signature électronique
// ============================================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Camera,
  Search,
  Loader2,
  Package,
  Clock,
  Truck,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Wand2,
  Eye,
  FileText,
  Send,
  Phone,
  CheckCircle2,
  XCircle,
  GripVertical,
  Info,
  TrendingUp,
  TrendingDown,
  Minus,
  Building2,
  User,
  Calendar,
  Euro,
  Percent,
  MessageSquare,
  Lock,
  Smartphone,
  PenTool,
  BadgeCheck,
  BarChart3,
  RefreshCw,
  Zap,
  Target,
  Award,
  History,
} from 'lucide-react';
import Webcam from 'react-webcam';
import { clsx } from 'clsx';

import type {
  IdentifiedPart,
  QuoteAnalysisResult,
  QuoteAnalysisRequest,
  TrustLevel,
  ItemAnalysisResult,
} from '@/lib/quote-intelligence/types';

// ============================================================================
// TYPES
// ============================================================================

interface QuoteBuilderUltimateProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (quote: FinalQuote) => void;
  // Provider Info
  providerId: string;
  providerName: string;
  providerSiret?: string;
  providerRcs?: string; // Ex: "Paris B 123 456 789"
  providerTvaNumber?: string; // Ex: "FR 12 123456789"
  providerAddress?: string;
  providerPhone?: string;
  providerEmail?: string;
  // Provider Insurance (required for artisans)
  providerInsurance?: {
    company: string;
    policyNumber?: string;
    coverage: string;
  };
  // Client Info
  clientId: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  // Establishment Info
  establishmentId: string;
  establishmentName: string;
  establishmentAddress?: string;
  establishmentSiret?: string;
  // Mission Context
  missionId?: string;
  distanceKm?: number;
  problemDescription?: string;
}

interface QuoteItem {
  id: string;
  type: 'PART' | 'LABOR' | 'TRAVEL' | 'OTHER' | 'CUSTOM';
  description: string;
  reference?: string;
  brand?: string;
  model?: string; // Obligatoire pour les pièces (PART)
  serialNumber?: string;
  quantity: number;
  unit: string;
  unitPriceHT: number;
  tvaRate: number;
  discount?: number;
  // Photo de la pièce (optionnel mais recommandé)
  photoUrl?: string;
  photoBase64?: string;
  // IA Data
  identifiedPart?: IdentifiedPart;
  marketPrice?: { min: number; max: number; average: number };
  priceVariance?: number;
  aiVerified: boolean;
  aiScore?: number;
  // Custom line (for manual text entries)
  isCustomLine?: boolean;
  customText?: string;
}

export interface FinalQuote {
  id: string;
  reference: string;
  // Parties
  provider: {
    id: string;
    name: string;
    siret?: string;
    rcs?: string; // Numéro RCS avec ville du greffe
    rne?: string; // Répertoire National des Entreprises (ex-RM)
    tvaNumber?: string; // N° TVA intracommunautaire
    address?: string;
    phone?: string;
    email?: string;
    // Assurance professionnelle (obligatoire pour artisans)
    insurance?: {
      company: string; // Nom de l'assureur
      policyNumber?: string;
      coverage: string; // Couverture géographique
    };
  };
  client: {
    id: string;
    name: string;
    establishmentName: string;
    establishmentAddress?: string;
    siret?: string;
    phone?: string;
    email?: string;
  };
  // Dates
  createdAt: Date;
  validUntil: Date;
  // Items
  items: QuoteItem[];
  // Totals
  subtotalHT: number;
  globalDiscount: number;
  subtotalAfterDiscount: number;
  totalTVA: number;
  totalTTC: number;
  deposit?: number;
  depositPercent?: number;
  // Analysis
  trustScore: number;
  trustLevel: TrustLevel;
  analysisResult?: QuoteAnalysisResult;
  // Terms
  paymentTerms: string;
  publicNotes?: string;
  privateNotes?: string;
  termsAccepted: boolean;
  // Signature
  signature: {
    signed: boolean;
    signedAt?: Date;
    signedBy?: string;
    signatureImage?: string;
    phoneVerified: boolean;
    verificationCode?: string;
    phoneNumber?: string;
  };
  // Status
  status: 'DRAFT' | 'PENDING_SIGNATURE' | 'SIGNED' | 'SENT' | 'ACCEPTED' | 'REJECTED';
}

type WizardStep = 'items' | 'analysis' | 'terms' | 'signature' | 'preview';

// ============================================================================
// CONSTANTS
// ============================================================================

const TVA_RATES = [
  { value: 0.20, label: '20% (Standard)' },
  { value: 0.10, label: '10% (Réduit)' },
  { value: 0.055, label: '5.5% (Super réduit)' },
  { value: 0, label: '0% (Exonéré)' },
];

const PAYMENT_TERMS = [
  { value: 'immediate', label: 'Comptant à réception' },
  { value: 'on_completion', label: 'À la fin des travaux' },
  { value: 'net15', label: 'Net 15 jours' },
  { value: 'net30', label: 'Net 30 jours' },
  { value: 'net45', label: 'Net 45 jours' },
  { value: '50_50', label: '50% acompte + 50% à la fin' },
];

const ITEM_UNITS: Record<string, string[]> = {
  PART: ['unité', 'pièce', 'lot', 'kit'],
  LABOR: ['heure', 'forfait', 'demi-journée', 'journée'],
  TRAVEL: ['forfait', 'km'],
  OTHER: ['unité', 'forfait'],
  CUSTOM: ['unité', 'forfait', 'heure', 'lot'],
};

// ============================================================================
// CGV LÉGALES COMPLÈTES (conformes au droit français)
// ============================================================================

const LEGAL_CGV = `CONDITIONS GÉNÉRALES DE VENTE - PRESTATIONS DE SERVICES

ARTICLE 1 - OBJET ET CHAMP D'APPLICATION
Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les prestations de services conclues entre le prestataire et le client. Le devis signé avec la mention "Bon pour travaux" ou "Lu et approuvé" constitue un contrat liant les deux parties.

ARTICLE 2 - DEVIS
2.1. Le présent devis est valable pour la durée indiquée. Passé ce délai, le prestataire se réserve le droit de modifier les tarifs.
2.2. Toute modification des travaux demandée par le client fera l'objet d'un avenant au devis initial.
2.3. Le devis est établi gratuitement, sauf mention contraire.

ARTICLE 3 - PRIX ET PAIEMENT
3.1. Les prix sont indiqués en euros hors taxes (HT). La TVA applicable est ajoutée au taux en vigueur au jour de la facturation.
3.2. En cas de retard de paiement, des pénalités seront appliquées au taux de 3 fois le taux d'intérêt légal (article L.441-10 du Code de commerce).
3.3. Une indemnité forfaitaire de 40€ pour frais de recouvrement sera due en cas de retard (article D.441-5 du Code de commerce).

ARTICLE 4 - EXÉCUTION DES PRESTATIONS
4.1. Le prestataire s'engage à exécuter les prestations avec diligence et selon les règles de l'art.
4.2. Les délais sont donnés à titre indicatif. Le client s'engage à assurer l'accès aux locaux et équipements.
4.3. Toute annulation moins de 24h avant l'intervention pourra donner lieu à une facturation des frais de déplacement.

ARTICLE 5 - GARANTIES
5.1. Les pièces neuves bénéficient de la garantie constructeur. La main d'œuvre est garantie selon les termes du devis.
5.2. La garantie ne couvre pas : mauvaise utilisation, défaut d'entretien, intervention d'un tiers non autorisé.
5.3. Garantie légale de conformité (art. L.217-4 et suivants du Code de la consommation) et garantie des vices cachés (art. 1641 du Code civil).

ARTICLE 6 - RESPONSABILITÉ
6.1. La responsabilité du prestataire est limitée aux dommages directs, dans la limite du montant du devis.
6.2. Le prestataire ne saurait être tenu responsable des dommages indirects ou immatériels.

ARTICLE 7 - ASSURANCE
Le prestataire déclare être assuré pour son activité professionnelle auprès de l'assureur mentionné sur le devis.

ARTICLE 8 - RÉCLAMATIONS
Toute réclamation doit être adressée par écrit dans un délai de 8 jours suivant l'intervention.

ARTICLE 9 - MÉDIATION
Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, en cas de litige, le client peut recourir gratuitement au service de médiation : Médiateur de la consommation.

ARTICLE 10 - DONNÉES PERSONNELLES
Les données collectées sont traitées conformément au RGPD. Droits d'accès, rectification et suppression sur demande.

ARTICLE 11 - DROIT APPLICABLE
Les présentes CGV sont soumises au droit français. Tout litige relève des tribunaux compétents.`;

const LABOR_TYPES = [
  { id: 'DIAGNOSTIC', label: 'Diagnostic', defaultHours: 1, defaultRate: 65 },
  { id: 'REPAIR_SIMPLE', label: 'Réparation simple', defaultHours: 1.5, defaultRate: 65 },
  { id: 'REPAIR_COMPLEX', label: 'Réparation complexe', defaultHours: 3, defaultRate: 75 },
  { id: 'REPLACEMENT', label: 'Remplacement pièce', defaultHours: 2, defaultRate: 70 },
  { id: 'INSTALLATION', label: 'Installation', defaultHours: 4, defaultRate: 70 },
  { id: 'MAINTENANCE', label: 'Maintenance', defaultHours: 1.5, defaultRate: 60 },
  { id: 'EMERGENCY', label: 'Urgence (+50%)', defaultHours: 2, defaultRate: 95 },
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateQuoteReference(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `DEV-${year}${month}-${random}`;
}

function generateId(): string {
  return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function getValidityDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// Step Indicator
function StepIndicator({
  steps,
  currentStep,
  onStepClick,
}: {
  steps: { id: WizardStep; label: string; icon: React.ElementType }[];
  currentStep: WizardStep;
  onStepClick?: (step: WizardStep) => void;
}) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-hover)] border-b border-[var(--border)]">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = index < currentIndex;
        const isClickable = onStepClick && (isCompleted || index === currentIndex + 1);

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                isActive && 'bg-blue-500/20 text-blue-400',
                isCompleted && 'text-green-400',
                !isActive && !isCompleted && 'text-[var(--text-muted)]',
                isClickable && 'cursor-pointer hover:bg-[var(--bg-hover)]',
                !isClickable && 'cursor-default'
              )}
            >
              <div
                className={clsx(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                  isActive && 'bg-blue-500 text-white',
                  isCompleted && 'bg-green-500 text-white',
                  !isActive && !isCompleted && 'bg-[var(--text-muted)] text-[var(--text-secondary)]'
                )}
              >
                {isCompleted ? <Check className="w-3 h-3" /> : index + 1}
              </div>
              <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
            </button>
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-2',
                  index < currentIndex ? 'bg-green-500' : 'bg-[var(--text-muted)]'
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Trust Score Badge (Large)
function TrustScoreBadge({
  score,
  level,
  analyzing,
}: {
  score: number;
  level: TrustLevel;
  analyzing?: boolean;
}) {
  const configs: Record<TrustLevel, { color: string; bg: string; label: string; icon: React.ElementType }> = {
    EXCELLENT: { color: 'text-green-400', bg: 'bg-green-500/20', label: 'Excellent', icon: Award },
    GOOD: { color: 'text-green-400', bg: 'bg-green-500/15', label: 'Bon', icon: CheckCircle2 },
    FAIR: { color: 'text-yellow-400', bg: 'bg-yellow-500/15', label: 'Correct', icon: Target },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-500/15', label: 'Élevé', icon: AlertTriangle },
    SUSPICIOUS: { color: 'text-red-400', bg: 'bg-red-500/15', label: 'Suspect', icon: XCircle },
  };

  const config = configs[level];
  const Icon = config.icon;

  if (analyzing) {
    return (
      <div className="flex items-center gap-3 p-4 bg-purple-500/10 rounded-xl border border-purple-500/30">
        <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
        </div>
        <div>
          <p className="text-purple-400 font-medium">Analyse IA en cours...</p>
          <p className="text-xs text-[var(--text-muted)]">Vérification des prix marché</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 ${config.bg} rounded-xl border border-[var(--border)]`}>
      <div className={`w-12 h-12 rounded-full ${config.bg} flex items-center justify-center relative`}>
        <span className={`text-xl font-bold ${config.color}`}>{score}</span>
        <div className="absolute -bottom-1 -right-1">
          <Icon className={`w-5 h-5 ${config.color}`} />
        </div>
      </div>
      <div>
        <p className={`font-semibold ${config.color}`}>Trust Score: {config.label}</p>
        <p className="text-xs text-[var(--text-secondary)]">Confiance basée sur l'analyse marché</p>
      </div>
    </div>
  );
}

// Part Scanner Modal
function PartScannerModal({
  isOpen,
  onClose,
  onPartIdentified,
}: {
  isOpen: boolean;
  onClose: () => void;
  onPartIdentified: (part: IdentifiedPart) => void;
}) {
  const [mode, setMode] = useState<'camera' | 'manual'>('manual');
  const [reference, setReference] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const webcamRef = useRef<Webcam>(null);

  const captureImage = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setCapturedImage(imageSrc);
    }
  }, []);

  const handleSearch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/analyze-quote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reference: reference || undefined,
          brand: brand || undefined,
          model: model || undefined,
          serialNumber: serialNumber || undefined,
          imageBase64: capturedImage || undefined,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Impossible d\'identifier la pièce');
      }

      if (data.part) {
        onPartIdentified(data.part);
        onClose();
      } else {
        throw new Error('Aucune information trouvée');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de recherche');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--bg-card)] rounded-2xl w-full max-w-lg border border-[var(--border)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="font-bold text-[var(--text-primary)]">Identifier une pièce</h3>
              <p className="text-xs text-[var(--text-muted)]">OCR + Recherche IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-active)] rounded-lg transition-colors">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => setMode('camera')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                mode === 'camera'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]'
              )}
            >
              <Camera className="w-4 h-4" />
              Scanner
            </button>
            <button
              onClick={() => setMode('manual')}
              className={clsx(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors',
                mode === 'manual'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]'
              )}
            >
              <Search className="w-4 h-4" />
              Manuel
            </button>
          </div>

          {mode === 'camera' ? (
            <div className="space-y-3">
              {!capturedImage ? (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <Webcam
                    ref={webcamRef}
                    audio={false}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{ facingMode: 'environment' }}
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-purple-500/50 m-8 rounded-lg pointer-events-none" />
                  <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-white/70">
                    Cadrez l'étiquette dans le rectangle
                  </p>
                </div>
              ) : (
                <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
                  <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
                  <button
                    onClick={() => setCapturedImage(null)}
                    className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4 text-white" />
                  </button>
                </div>
              )}
              {!capturedImage && (
                <button
                  onClick={captureImage}
                  className="w-full py-3 bg-purple-500 hover:bg-purple-600 rounded-xl text-[var(--text-primary)] font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Capturer
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">Référence complète</label>
                <input
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Ex: Danfoss SC15G"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Marque</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Ex: Danfoss"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Modèle</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    placeholder="Ex: SC15G"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-[var(--text-muted)] mb-1">N° de série (optionnel)</label>
                <input
                  type="text"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                  placeholder="Numéro de série"
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Search Button */}
          <button
            onClick={handleSearch}
            disabled={isLoading || (!reference && !brand && !model && !capturedImage)}
            className={clsx(
              'w-full py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2',
              isLoading || (!reference && !brand && !model && !capturedImage)
                ? 'bg-gray-500/20 text-[var(--text-muted)] cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Recherche en cours...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Identifier avec l'IA
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Quote Item Row - Refait pour meilleur alignement
function QuoteItemRow({
  item,
  onUpdate,
  onDelete,
  onScanPart,
  showAnalysis,
}: {
  item: QuoteItem;
  onUpdate: (updates: Partial<QuoteItem>) => void;
  onDelete: () => void;
  onScanPart: () => void;
  showAnalysis?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(item.type === 'PART' && !item.model);

  const getTypeConfig = (type: QuoteItem['type']) => {
    const configs = {
      PART: { icon: Package, color: 'text-cyan-400', bg: 'bg-cyan-500/20', label: 'Pièce' },
      LABOR: { icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/20', label: 'MO' },
      TRAVEL: { icon: Truck, color: 'text-green-400', bg: 'bg-green-500/20', label: 'Dépl.' },
      OTHER: { icon: Wrench, color: 'text-[var(--text-secondary)]', bg: 'bg-gray-500/20', label: 'Autre' },
      CUSTOM: { icon: FileText, color: 'text-slate-400', bg: 'bg-slate-500/20', label: 'Libre' },
    };
    return configs[type];
  };

  const config = getTypeConfig(item.type);
  const Icon = config.icon;
  const totalHT = item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100);
  const hasPartError = item.type === 'PART' && !item.model;

  return (
    <Reorder.Item
      value={item}
      className={clsx(
        'rounded-xl border overflow-hidden transition-colors',
        hasPartError ? 'bg-red-500/5 border-red-500/30' : 'bg-[var(--bg-hover)] border-[var(--border)]'
      )}
    >
      {/* Main Row - Structure en grille fixe pour alignement */}
      <div className="grid grid-cols-[auto_auto_1fr_auto_80px_100px_100px_auto_auto] items-center gap-2 p-3">
        {/* 1. Drag Handle */}
        <div className="cursor-grab active:cursor-grabbing p-1 hover:bg-[var(--bg-active)] rounded">
          <GripVertical className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        {/* 2. Type Badge */}
        <div className={clsx('flex items-center gap-1.5 px-2 py-1 rounded-lg', config.bg)}>
          <Icon className={clsx('w-3.5 h-3.5', config.color)} />
          <span className={clsx('text-[10px] font-medium uppercase', config.color)}>{config.label}</span>
        </div>

        {/* 3. Description */}
        <div className="min-w-0">
          <input
            type="text"
            value={item.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full bg-transparent text-[var(--text-primary)] text-sm font-medium focus:outline-none placeholder:text-[var(--text-muted)]"
            placeholder={item.type === 'PART' ? 'Nom de la pièce...' : 'Description...'}
          />
          {/* Afficher marque/modèle si c'est une pièce */}
          {item.type === 'PART' && (item.brand || item.model) && (
            <p className="text-[11px] text-[var(--text-muted)] truncate">
              {item.brand && <span className="text-cyan-400/70">{item.brand}</span>}
              {item.brand && item.model && <span className="mx-1">•</span>}
              {item.model && <span>{item.model}</span>}
            </p>
          )}
          {item.type !== 'PART' && item.reference && (
            <p className="text-[11px] text-[var(--text-muted)]">Réf: {item.reference}</p>
          )}
        </div>

        {/* 4. Status indicators */}
        <div className="flex items-center gap-1">
          {item.aiVerified && (
            <span title="Prix vérifié par IA" className="p-1 bg-green-500/10 rounded">
              <BadgeCheck className="w-3.5 h-3.5 text-green-400" />
            </span>
          )}
          {item.type === 'PART' && !item.model && (
            <span title="Modèle requis" className="p-1 bg-red-500/10 rounded">
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </span>
          )}
          {showAnalysis && item.priceVariance !== undefined && (
            <span
              className={clsx(
                'px-1.5 py-0.5 rounded text-[10px] font-bold',
                item.priceVariance <= 0 && 'bg-green-500/20 text-green-400',
                item.priceVariance > 0 && item.priceVariance <= 15 && 'bg-yellow-500/20 text-yellow-400',
                item.priceVariance > 15 && 'bg-red-500/20 text-red-400'
              )}
            >
              {item.priceVariance > 0 ? '+' : ''}{item.priceVariance.toFixed(0)}%
            </span>
          )}
        </div>

        {/* 5. Quantity */}
        <div>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => onUpdate({ quantity: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.5"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm text-center focus:outline-none focus:border-blue-500"
          />
          <select
            value={item.unit}
            onChange={(e) => onUpdate({ unit: e.target.value })}
            className="w-full bg-transparent text-[10px] text-[var(--text-muted)] text-center focus:outline-none cursor-pointer"
          >
            {ITEM_UNITS[item.type].map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>

        {/* 6. Unit Price */}
        <div className="relative">
          <input
            type="number"
            value={item.unitPriceHT}
            onChange={(e) => onUpdate({ unitPriceHT: parseFloat(e.target.value) || 0 })}
            min="0"
            step="0.01"
            className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm text-right pr-5 focus:outline-none focus:border-blue-500"
          />
          <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[10px] text-[var(--text-muted)]">€</span>
          <p className="text-[10px] text-[var(--text-muted)] text-center">HT/unité</p>
        </div>

        {/* 7. Total */}
        <div className="text-right">
          <p className="text-[var(--text-primary)] font-bold text-sm">{formatPrice(totalHT)}</p>
          <p className="text-[10px] text-[var(--text-muted)]">Total HT</p>
        </div>

        {/* 8. Expand button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={clsx(
            'p-1.5 rounded-lg transition-colors',
            isExpanded ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-[var(--bg-active)] text-[var(--text-muted)]'
          )}
        >
          <ChevronRight className={clsx('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
        </button>

        {/* 9. Delete button */}
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-[var(--text-muted)] hover:text-red-400"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Expanded Details */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-[var(--border)]"
          >
            <div className="p-4 space-y-4">
              {/* Part-specific fields: Brand, Model (required), Photo */}
              {item.type === 'PART' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-4 border-b border-[var(--border)]">
                  {/* Brand */}
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Marque</label>
                    <input
                      type="text"
                      value={item.brand || ''}
                      onChange={(e) => onUpdate({ brand: e.target.value })}
                      className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Ex: Danfoss"
                    />
                  </div>

                  {/* Model (Required) */}
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">
                      Modèle <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={item.model || ''}
                      onChange={(e) => onUpdate({ model: e.target.value })}
                      className={clsx(
                        'w-full bg-[var(--bg-hover)] border rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none',
                        !item.model ? 'border-red-500/50 focus:border-red-500' : 'border-[var(--border)] focus:border-blue-500'
                      )}
                      placeholder="Ex: SC15G (obligatoire)"
                    />
                    {!item.model && (
                      <p className="text-[10px] text-red-400 mt-0.5">Modèle obligatoire pour les pièces</p>
                    )}
                  </div>

                  {/* Serial Number */}
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">N° de série</label>
                    <input
                      type="text"
                      value={item.serialNumber || ''}
                      onChange={(e) => onUpdate({ serialNumber: e.target.value })}
                      className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                      placeholder="Optionnel"
                    />
                  </div>

                  {/* Photo Upload */}
                  <div>
                    <label className="block text-xs text-[var(--text-muted)] mb-1">Photo (optionnel)</label>
                    {item.photoBase64 ? (
                      <div className="relative group">
                        <img
                          src={item.photoBase64}
                          alt="Photo pièce"
                          className="w-full h-16 object-cover rounded border border-[var(--border)]"
                        />
                        <button
                          onClick={() => onUpdate({ photoBase64: undefined, photoUrl: undefined })}
                          className="absolute top-1 right-1 p-1 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center justify-center gap-2 h-[34px] bg-[var(--bg-hover)] border border-dashed border-[var(--border-strong)] rounded cursor-pointer hover:border-[var(--border-strong)] hover:bg-[var(--bg-active)] transition-all">
                        <Camera className="w-4 h-4 text-[var(--text-muted)]" />
                        <span className="text-xs text-[var(--text-muted)]">Ajouter photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const base64 = event.target?.result as string;
                                onUpdate({ photoBase64: base64 });
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Custom line text editor */}
              {item.type === 'CUSTOM' && (
                <div className="pb-4 border-b border-[var(--border)]">
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Texte personnalisé</label>
                  <textarea
                    value={item.customText || item.description}
                    onChange={(e) => onUpdate({
                      customText: e.target.value,
                      description: e.target.value
                    })}
                    rows={3}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-purple-500 resize-none"
                    placeholder="Entrez votre texte personnalisé ici..."
                  />
                </div>
              )}

              {/* Common fields */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Reference */}
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Référence</label>
                  <input
                    type="text"
                    value={item.reference || ''}
                    onChange={(e) => onUpdate({ reference: e.target.value })}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                    placeholder="Réf..."
                  />
                </div>

                {/* TVA */}
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">TVA</label>
                  <select
                    value={item.tvaRate}
                    onChange={(e) => onUpdate({ tvaRate: parseFloat(e.target.value) })}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                  >
                    {TVA_RATES.map((rate) => (
                      <option key={rate.value} value={rate.value}>
                        {rate.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Unité</label>
                  <select
                    value={item.unit}
                    onChange={(e) => onUpdate({ unit: e.target.value })}
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                  >
                    {ITEM_UNITS[item.type].map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Discount */}
                <div>
                  <label className="block text-xs text-[var(--text-muted)] mb-1">Remise %</label>
                  <input
                    type="number"
                    value={item.discount || 0}
                    onChange={(e) => onUpdate({ discount: parseFloat(e.target.value) || 0 })}
                    min="0"
                    max="100"
                    className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1.5 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Market Price Info (if available) */}
              {item.marketPrice && (
                <div className="bg-blue-500/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-medium text-blue-400">Prix marché</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-[var(--text-secondary)]">
                      Min: <span className="text-[var(--text-primary)]">{formatPrice(item.marketPrice.min)}</span>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Moy: <span className="text-[var(--text-primary)]">{formatPrice(item.marketPrice.average)}</span>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Max: <span className="text-[var(--text-primary)]">{formatPrice(item.marketPrice.max)}</span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Reorder.Item>
  );
}

// Signature Pad
function SignaturePad({
  onSign,
  disabled,
}: {
  onSign: (signature: string) => void;
  disabled?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Fill with off-white background for visibility
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set up canvas for drawing (dark blue for signature)
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and refill with background
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Reset stroke style
    ctx.strokeStyle = '#1e3a5f';
    setHasSignature(false);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signature = canvas.toDataURL('image/png');
    onSign(signature);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={clsx(
            'w-full bg-[var(--bg-hover)] rounded-xl border-2 border-dashed cursor-crosshair',
            disabled ? 'border-[var(--border)] opacity-50' : 'border-[var(--border-strong)]'
          )}
        />
        {!hasSignature && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-[var(--text-muted)] text-sm">Signez ici</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={clear}
          disabled={disabled || !hasSignature}
          className="flex-1 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[var(--text-secondary)] text-sm transition-colors"
        >
          Effacer
        </button>
        <button
          onClick={save}
          disabled={disabled || !hasSignature}
          className="flex-1 py-2 bg-green-500/20 hover:bg-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-green-400 text-sm font-medium transition-colors"
        >
          Valider signature
        </button>
      </div>
    </div>
  );
}

// Phone Verification
function PhoneVerification({
  phoneNumber,
  onVerified,
  disabled,
}: {
  phoneNumber?: string;
  onVerified: (code: string) => void;
  disabled?: boolean;
}) {
  const [phone, setPhone] = useState(phoneNumber || '');
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendCode = async () => {
    if (!phone || phone.length < 10) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Simulate sending SMS
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setCodeSent(true);
    setIsVerifying(false);
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Code à 6 chiffres requis');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Simulate verification
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // For demo, accept any 6-digit code
    onVerified(code);
    setIsVerifying(false);
  };

  return (
    <div className="space-y-3">
      {!codeSent ? (
        <>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Numéro de téléphone</label>
            <div className="flex gap-2">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                disabled={disabled}
                className="flex-1 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                onClick={sendCode}
                disabled={disabled || isVerifying || !phone}
                className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[var(--text-primary)] font-medium transition-colors flex items-center gap-2"
              >
                {isVerifying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Smartphone className="w-4 h-4" />
                )}
                Envoyer SMS
              </button>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <Check className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Code envoyé au {phone}</span>
          </div>
          <div>
            <label className="block text-xs text-[var(--text-muted)] mb-1">Code de vérification (6 chiffres)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                maxLength={6}
                disabled={disabled}
                className="flex-1 bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] text-center text-xl tracking-widest font-mono focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                onClick={verifyCode}
                disabled={disabled || isVerifying || code.length !== 6}
                className="px-4 py-2.5 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-[var(--text-primary)] font-medium transition-colors flex items-center gap-2"
              >
                {isVerifying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Vérifier
              </button>
            </div>
          </div>
          <button
            onClick={() => {
              setCodeSent(false);
              setCode('');
            }}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            Renvoyer le code
          </button>
        </>
      )}

      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteBuilderUltimate({
  isOpen,
  onClose,
  onSubmit,
  providerId,
  providerName,
  providerSiret,
  providerRcs,
  providerTvaNumber,
  providerAddress,
  providerPhone,
  providerEmail,
  providerInsurance,
  clientId,
  clientName,
  clientPhone,
  clientEmail,
  establishmentId,
  establishmentName,
  establishmentAddress,
  establishmentSiret,
  missionId,
  distanceKm,
  problemDescription,
}: QuoteBuilderUltimateProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [currentStep, setCurrentStep] = useState<WizardStep>('items');
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState(0);
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositPercent, setDepositPercent] = useState(30);
  const [paymentTerms, setPaymentTerms] = useState('on_completion');
  const [validityDays, setValidityDays] = useState(15);
  const [publicNotes, setPublicNotes] = useState('');
  const [privateNotes, setPrivateNotes] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Signature
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);

  // Analysis
  const [analysis, setAnalysis] = useState<QuoteAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [trustScore, setTrustScore] = useState(50);
  const [trustLevel, setTrustLevel] = useState<TrustLevel>('FAIR');

  // Modals
  const [showPartScanner, setShowPartScanner] = useState(false);
  const [scanningForItemId, setScanningForItemId] = useState<string | null>(null);

  // Quote reference
  const [quoteReference] = useState(generateQuoteReference());

  // ============================================================================
  // CALCULATED VALUES
  // ============================================================================

  const subtotalHT = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100);
    return sum + itemTotal;
  }, 0);

  const subtotalAfterDiscount = subtotalHT * (1 - globalDiscount / 100);

  const totalTVA = items.reduce((sum, item) => {
    const itemTotal = item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100);
    return sum + itemTotal * item.tvaRate;
  }, 0) * (1 - globalDiscount / 100);

  const totalTTC = subtotalAfterDiscount + totalTVA;

  const depositAmount = depositEnabled ? totalTTC * (depositPercent / 100) : 0;

  // ============================================================================
  // WIZARD STEPS
  // ============================================================================

  const steps: { id: WizardStep; label: string; icon: React.ElementType }[] = [
    { id: 'items', label: 'Lignes', icon: Package },
    { id: 'analysis', label: 'Analyse IA', icon: Sparkles },
    { id: 'terms', label: 'Conditions', icon: FileText },
    { id: 'signature', label: 'Signature', icon: PenTool },
    { id: 'preview', label: 'Aperçu', icon: Eye },
  ];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const addItem = (type: QuoteItem['type']) => {
    const newItem: QuoteItem = {
      id: generateId(),
      type,
      description: '',
      quantity: type === 'TRAVEL' ? 1 : type === 'LABOR' ? 1 : 1,
      unit: ITEM_UNITS[type][0],
      unitPriceHT: type === 'TRAVEL' && distanceKm ? (distanceKm <= 15 ? 45 : distanceKm <= 30 ? 65 : 85) : 0,
      tvaRate: 0.20,
      aiVerified: false,
    };

    // Pre-fill for travel
    if (type === 'TRAVEL' && distanceKm) {
      newItem.description = `Déplacement ${distanceKm}km`;
    }

    setItems([...items, newItem]);
  };

  const updateItem = (id: string, updates: Partial<QuoteItem>) => {
    setItems(items.map((item) => (item.id === id ? { ...item, ...updates } : item)));
  };

  const deleteItem = (id: string) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const handlePartIdentified = (part: IdentifiedPart) => {
    if (scanningForItemId) {
      // Update existing item
      updateItem(scanningForItemId, {
        description: part.fullName || part.reference,
        reference: part.reference,
        brand: part.brand,
        model: part.model,
        identifiedPart: part,
        marketPrice: {
          min: part.marketData.minPrice,
          max: part.marketData.maxPrice,
          average: part.marketData.averagePrice,
        },
        aiVerified: true,
        // Suggest average price
        unitPriceHT: part.marketData.averagePrice || 0,
      });
      setScanningForItemId(null);
    } else {
      // Add new item
      const newItem: QuoteItem = {
        id: generateId(),
        type: 'PART',
        description: part.fullName || part.reference,
        reference: part.reference,
        brand: part.brand,
        model: part.model,
        quantity: 1,
        unit: 'unité',
        unitPriceHT: part.marketData.averagePrice || 0,
        tvaRate: 0.20,
        identifiedPart: part,
        marketPrice: {
          min: part.marketData.minPrice,
          max: part.marketData.maxPrice,
          average: part.marketData.averagePrice,
        },
        aiVerified: true,
      };
      setItems([...items, newItem]);
    }
    setShowPartScanner(false);
  };

  const runAnalysis = async () => {
    if (items.length === 0) return;

    setIsAnalyzing(true);

    try {
      const request: QuoteAnalysisRequest = {
        quoteId: quoteReference,
        provider: {
          id: providerId,
          name: providerName,
          siret: providerSiret,
        },
        items: items.map((item) => ({
          id: item.id,
          type: item.type,
          description: item.description,
          quantity: item.quantity,
          unitPriceHT: item.unitPriceHT,
          totalHT: item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100),
          part: item.type === 'PART' ? {
            reference: item.reference,
            brand: item.brand,
            model: item.model,
            serialNumber: item.serialNumber,
          } : undefined,
          labor: item.type === 'LABOR' ? {
            taskType: 'REPAIR_SIMPLE',
            description: item.description,
            hours: item.quantity,
          } : undefined,
        })),
        subtotalHT,
        tva: totalTVA,
        totalTTC,
      };

      const response = await fetch('/api/ai/analyze-quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quote: request, options: { region: 'paris', includeHistory: true } }),
      });

      const data = await response.json();

      if (data.success && data.analysis) {
        setAnalysis(data.analysis);
        setTrustScore(data.analysis.globalScore.score);
        setTrustLevel(data.analysis.globalScore.level);

        // Update items with analysis results
        const updatedItems = items.map((item) => {
          const itemAnalysis = data.analysis.itemAnalysis.find(
            (a: ItemAnalysisResult) => a.itemId === item.id
          );
          if (itemAnalysis) {
            return {
              ...item,
              marketPrice: itemAnalysis.marketPrice,
              priceVariance: itemAnalysis.variance,
              aiScore: itemAnalysis.score,
            };
          }
          return item;
        });
        setItems(updatedItems);
      }
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    const finalQuote: FinalQuote = {
      id: generateId(),
      reference: quoteReference,
      provider: {
        id: providerId,
        name: providerName,
        siret: providerSiret,
        rcs: providerRcs,
        tvaNumber: providerTvaNumber,
        address: providerAddress,
        phone: providerPhone,
        email: providerEmail,
        insurance: providerInsurance,
      },
      client: {
        id: clientId,
        name: clientName,
        establishmentName,
        establishmentAddress,
        siret: establishmentSiret,
        phone: clientPhone,
        email: clientEmail,
      },
      createdAt: new Date(),
      validUntil: getValidityDate(validityDays),
      items,
      subtotalHT,
      globalDiscount,
      subtotalAfterDiscount,
      totalTVA,
      totalTTC,
      deposit: depositEnabled ? depositAmount : undefined,
      depositPercent: depositEnabled ? depositPercent : undefined,
      trustScore,
      trustLevel,
      analysisResult: analysis || undefined,
      paymentTerms,
      publicNotes: publicNotes || undefined,
      privateNotes: privateNotes || undefined,
      termsAccepted,
      signature: {
        signed: !!signatureImage,
        signedAt: signatureImage ? new Date() : undefined,
        signedBy: providerName,
        signatureImage: signatureImage || undefined,
        phoneVerified,
        verificationCode: verificationCode || undefined,
        phoneNumber: providerPhone,
      },
      status: signatureImage && phoneVerified ? 'SIGNED' : signatureImage ? 'PENDING_SIGNATURE' : 'DRAFT',
    };

    onSubmit(finalQuote);
    onClose();
  };

  // Validation: check if all PART items have required model
  const validateItems = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const partsWithoutModel = items.filter(item => item.type === 'PART' && !item.model);

    if (partsWithoutModel.length > 0) {
      errors.push(`${partsWithoutModel.length} pièce(s) sans modèle renseigné. Le modèle est obligatoire pour toutes les pièces.`);
    }

    const itemsWithoutDescription = items.filter(item => !item.description.trim());
    if (itemsWithoutDescription.length > 0) {
      errors.push(`${itemsWithoutDescription.length} ligne(s) sans description.`);
    }

    return { valid: errors.length === 0, errors };
  };

  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const goToNextStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex < steps.length - 1) {
      // Validate before leaving items step
      if (currentStep === 'items') {
        const { valid, errors } = validateItems();
        if (!valid) {
          setValidationErrors(errors);
          return;
        }
        setValidationErrors([]);
      }

      const nextStep = steps[currentIndex + 1].id;
      if (nextStep === 'analysis' && !analysis && !isAnalyzing) {
        runAnalysis();
      }
      setCurrentStep(nextStep);
    }
  };

  const goToPrevStep = () => {
    const currentIndex = steps.findIndex((s) => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[var(--bg-card)] rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col border border-[var(--border)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[var(--text-primary)]">Créateur de Devis Intelligent</h2>
              <p className="text-xs text-[var(--text-muted)]">{quoteReference} • {establishmentName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Mini Trust Score */}
            {analysis && (
              <div className={clsx(
                'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                trustLevel === 'EXCELLENT' || trustLevel === 'GOOD' ? 'bg-green-500/20' :
                trustLevel === 'FAIR' ? 'bg-yellow-500/20' :
                trustLevel === 'HIGH' ? 'bg-orange-500/20' : 'bg-red-500/20'
              )}>
                <ShieldCheck className={clsx(
                  'w-4 h-4',
                  trustLevel === 'EXCELLENT' || trustLevel === 'GOOD' ? 'text-green-400' :
                  trustLevel === 'FAIR' ? 'text-yellow-400' :
                  trustLevel === 'HIGH' ? 'text-orange-400' : 'text-red-400'
                )} />
                <span className="text-sm font-medium text-[var(--text-primary)]">{trustScore}/100</span>
              </div>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-[var(--bg-active)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          onStepClick={setCurrentStep}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            {/* STEP 1: Items */}
            {currentStep === 'items' && (
              <motion.div
                key="items"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Quick Add Buttons - Grid propre */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  <button
                    onClick={() => addItem('TRAVEL')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 transition-colors"
                  >
                    <Truck className="w-5 h-5" />
                    <span className="text-xs font-medium">Déplacement</span>
                  </button>
                  <button
                    onClick={() => addItem('LABOR')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 rounded-xl text-orange-400 transition-colors"
                  >
                    <Clock className="w-5 h-5" />
                    <span className="text-xs font-medium">Main d'œuvre</span>
                  </button>
                  <button
                    onClick={() => addItem('PART')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400 transition-colors"
                  >
                    <Package className="w-5 h-5" />
                    <span className="text-xs font-medium">Pièce</span>
                  </button>
                  <button
                    onClick={() => {
                      setScanningForItemId(null);
                      setShowPartScanner(true);
                    }}
                    className="flex flex-col items-center gap-1.5 p-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 transition-colors"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span className="text-xs font-medium">Scanner IA</span>
                  </button>
                  <button
                    onClick={() => addItem('OTHER')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-gray-500/10 hover:bg-gray-500/20 border border-[var(--text-muted)]/30 rounded-xl text-[var(--text-secondary)] transition-colors"
                  >
                    <Wrench className="w-5 h-5" />
                    <span className="text-xs font-medium">Autre</span>
                  </button>
                  <button
                    onClick={() => addItem('CUSTOM')}
                    className="flex flex-col items-center gap-1.5 p-3 bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 rounded-xl text-slate-400 transition-colors"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-xs font-medium">Texte libre</span>
                  </button>
                </div>

                {/* Items List */}
                {items.length === 0 ? (
                  <div className="text-center py-12 bg-[var(--bg-hover)] rounded-xl border border-dashed border-[var(--border)]">
                    <Package className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-secondary)]">Aucune ligne dans le devis</p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Utilisez les boutons ci-dessus pour ajouter des éléments
                    </p>
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={items}
                    onReorder={setItems}
                    className="space-y-2"
                  >
                    {items.map((item) => (
                      <QuoteItemRow
                        key={item.id}
                        item={item}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                        onDelete={() => deleteItem(item.id)}
                        onScanPart={() => {
                          setScanningForItemId(item.id);
                          setShowPartScanner(true);
                        }}
                        showAnalysis={!!analysis}
                      />
                    ))}
                  </Reorder.Group>
                )}

                {/* Totals */}
                {items.length > 0 && (
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="grid grid-cols-2 gap-4">
                      {/* Left: Global Discount */}
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-[var(--text-muted)] mb-1">Remise globale (%)</label>
                          <input
                            type="number"
                            value={globalDiscount}
                            onChange={(e) => setGlobalDiscount(parseFloat(e.target.value) || 0)}
                            min="0"
                            max="100"
                            className="w-32 bg-[var(--bg-hover)] border border-[var(--border)] rounded px-3 py-2 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                          />
                        </div>
                        <div className="flex items-center gap-3">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={depositEnabled}
                              onChange={(e) => setDepositEnabled(e.target.checked)}
                              className="sr-only"
                            />
                            <div className={clsx(
                              'w-10 h-6 rounded-full transition-colors',
                              depositEnabled ? 'bg-blue-500' : 'bg-[var(--text-muted)]'
                            )}>
                              <div className={clsx(
                                'w-4 h-4 rounded-full bg-white transition-transform mt-1',
                                depositEnabled ? 'translate-x-5' : 'translate-x-1'
                              )} />
                            </div>
                            <span className="text-sm text-[var(--text-secondary)]">Acompte</span>
                          </label>
                          {depositEnabled && (
                            <input
                              type="number"
                              value={depositPercent}
                              onChange={(e) => setDepositPercent(parseFloat(e.target.value) || 0)}
                              min="0"
                              max="100"
                              className="w-20 bg-[var(--bg-hover)] border border-[var(--border)] rounded px-2 py-1 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      </div>

                      {/* Right: Totals */}
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Sous-total HT</span>
                          <span className="text-[var(--text-primary)]">{formatPrice(subtotalHT)}</span>
                        </div>
                        {globalDiscount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-[var(--text-muted)]">Remise ({globalDiscount}%)</span>
                            <span className="text-red-400">-{formatPrice(subtotalHT - subtotalAfterDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">TVA</span>
                          <span className="text-[var(--text-primary)]">{formatPrice(totalTVA)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                          <span className="text-[var(--text-primary)] font-semibold">Total TTC</span>
                          <span className="text-xl font-bold text-blue-400">{formatPrice(totalTTC)}</span>
                        </div>
                        {depositEnabled && (
                          <div className="flex justify-between text-sm">
                            <span className="text-[var(--text-muted)]">Acompte ({depositPercent}%)</span>
                            <span className="text-green-400">{formatPrice(depositAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 2: Analysis */}
            {currentStep === 'analysis' && (
              <motion.div
                key="analysis"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Trust Score */}
                <TrustScoreBadge
                  score={trustScore}
                  level={trustLevel}
                  analyzing={isAnalyzing}
                />

                {!isAnalyzing && analysis && (
                  <>
                    {/* Summary */}
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                        Résumé de l'analyse
                      </h3>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <p className="text-2xl font-bold text-[var(--text-primary)]">
                            {analysis.summary.itemsAnalyzed}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">Postes analysés</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-green-400">
                            {analysis.summary.fairlyPriced}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">Prix conformes</p>
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-orange-400">
                            {analysis.summary.partsOverpriced + analysis.summary.laborOverpriced}
                          </p>
                          <p className="text-xs text-[var(--text-muted)]">À vérifier</p>
                        </div>
                      </div>

                      {analysis.summary.potentialSavings > 0 && (
                        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                          <p className="text-yellow-400 text-sm">
                            💡 Ce devis est {Math.round((analysis.summary.quotedTotal - analysis.summary.estimatedMarketTotal.average) / analysis.summary.estimatedMarketTotal.average * 100)}% au-dessus de la moyenne marché
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Item Analysis */}
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                      <h3 className="font-semibold text-[var(--text-primary)] mb-3">Analyse par poste</h3>
                      <div className="space-y-2">
                        {analysis.itemAnalysis.map((itemAnalysis) => {
                          const item = items.find((i) => i.id === itemAnalysis.itemId);
                          if (!item) return null;

                          return (
                            <div
                              key={itemAnalysis.itemId}
                              className="flex items-center gap-3 p-3 bg-[var(--bg-hover)] rounded-lg"
                            >
                              <div className={clsx(
                                'w-8 h-8 rounded-lg flex items-center justify-center',
                                itemAnalysis.verdict === 'EXCELLENT' || itemAnalysis.verdict === 'GOOD' ? 'bg-green-500/20' :
                                itemAnalysis.verdict === 'FAIR' ? 'bg-yellow-500/20' :
                                'bg-red-500/20'
                              )}>
                                {itemAnalysis.verdict === 'EXCELLENT' || itemAnalysis.verdict === 'GOOD' ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                                ) : itemAnalysis.verdict === 'FAIR' ? (
                                  <Minus className="w-4 h-4 text-yellow-400" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-red-400" />
                                )}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm text-[var(--text-primary)]">{item.description}</p>
                                <p className="text-xs text-[var(--text-muted)]">
                                  {formatPrice(itemAnalysis.quotedPrice)} • Marché: {formatPrice(itemAnalysis.marketPrice.average)}
                                </p>
                              </div>
                              <div className={clsx(
                                'px-2 py-1 rounded text-xs font-medium',
                                itemAnalysis.variance <= 0 ? 'bg-green-500/20 text-green-400' :
                                itemAnalysis.variance <= 20 ? 'bg-yellow-500/20 text-yellow-400' :
                                'bg-red-500/20 text-red-400'
                              )}>
                                {itemAnalysis.variance > 0 ? '+' : ''}{itemAnalysis.variance.toFixed(0)}%
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Recommendations - Adaptées pour le prestataire */}
                    {analysis.recommendations.length > 0 && (
                      <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                        <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          Analyse de compétitivité
                        </h3>
                        <div className="space-y-2">
                          {analysis.recommendations.map((rec) => {
                            // Adapter les messages pour le prestataire
                            let title = rec.title;
                            let description = rec.description;

                            if (rec.type === 'APPROVE') {
                              title = 'Devis compétitif';
                              description = 'Vos prix sont alignés avec le marché. Ce devis a de bonnes chances d\'être accepté.';
                            } else if (rec.type === 'NEGOTIATE_PRICE') {
                              title = 'Prix au-dessus du marché';
                              description = 'Certains de vos prix sont supérieurs à la moyenne. Le client pourrait négocier.';
                            }

                            return (
                              <div
                                key={rec.id}
                                className={clsx(
                                  'p-3 rounded-lg border',
                                  rec.priority === 'HIGH' ? 'bg-red-500/10 border-red-500/30' :
                                  rec.priority === 'MEDIUM' ? 'bg-yellow-500/10 border-yellow-500/30' :
                                  'bg-green-500/10 border-green-500/30'
                                )}
                              >
                                <p className="font-medium text-[var(--text-primary)] text-sm">{title}</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">{description}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Re-analyze button */}
                    <button
                      onClick={runAnalysis}
                      className="w-full py-3 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl text-[var(--text-secondary)] text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Relancer l'analyse
                    </button>
                  </>
                )}

                {!isAnalyzing && !analysis && (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                    <p className="text-[var(--text-secondary)]">Aucune analyse disponible</p>
                    <button
                      onClick={runAnalysis}
                      className="mt-4 px-6 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-[var(--text-primary)] font-medium transition-colors"
                    >
                      Lancer l'analyse
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* STEP 3: Terms */}
            {currentStep === 'terms' && (
              <motion.div
                key="terms"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Payment Terms */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Euro className="w-5 h-5 text-green-400" />
                      Conditions de paiement
                    </h3>
                    <select
                      value={paymentTerms}
                      onChange={(e) => setPaymentTerms(e.target.value)}
                      className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                    >
                      {PAYMENT_TERMS.map((term) => (
                        <option key={term.value} value={term.value}>
                          {term.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Validity */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      Validité du devis
                    </h3>
                    <div className="flex gap-2">
                      {[7, 15, 30].map((days) => (
                        <button
                          key={days}
                          onClick={() => setValidityDays(days)}
                          className={clsx(
                            'flex-1 py-2 rounded-lg text-sm font-medium transition-colors',
                            validityDays === days
                              ? 'bg-blue-500 text-white'
                              : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]'
                          )}
                        >
                          {days} jours
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                    Notes
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Notes publiques (visibles par le client)</label>
                      <textarea
                        value={publicNotes}
                        onChange={(e) => setPublicNotes(e.target.value)}
                        rows={3}
                        className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Informations complémentaires pour le client..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-muted)] mb-1">Notes privées (internes)</label>
                      <textarea
                        value={privateNotes}
                        onChange={(e) => setPrivateNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-primary)] text-sm focus:outline-none focus:border-blue-500 resize-none"
                        placeholder="Notes internes..."
                      />
                    </div>
                  </div>
                </div>

                {/* Terms Acceptance */}
                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    Conditions générales
                  </h3>
                  <div className="text-xs text-[var(--text-secondary)] bg-[var(--bg-hover)] rounded-lg p-3 max-h-32 overflow-y-auto mb-3">
                    <p className="mb-2"><strong>Article 1 - Objet</strong></p>
                    <p className="mb-2">Le présent devis a pour objet de définir les conditions de réalisation des prestations de services décrites ci-dessus.</p>
                    <p className="mb-2"><strong>Article 2 - Prix</strong></p>
                    <p className="mb-2">Les prix indiqués sont en euros et hors taxes (HT). La TVA applicable est ajoutée au taux en vigueur.</p>
                    <p className="mb-2"><strong>Article 3 - Validité</strong></p>
                    <p className="mb-2">Ce devis est valable {validityDays} jours à compter de sa date d'émission.</p>
                    <p className="mb-2"><strong>Article 4 - Paiement</strong></p>
                    <p>Conditions: {PAYMENT_TERMS.find(t => t.value === paymentTerms)?.label}</p>
                  </div>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="mt-1"
                    />
                    <span className="text-sm text-[var(--text-secondary)]">
                      J'accepte les conditions générales de vente et certifie l'exactitude des informations fournies.
                    </span>
                  </label>
                </div>
              </motion.div>
            )}

            {/* STEP 4: Signature */}
            {currentStep === 'signature' && (
              <motion.div
                key="signature"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Case "Lu et approuvé" OBLIGATOIRE avant signature */}
                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                  <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    Validation du devis
                  </h3>

                  <label className={clsx(
                    'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2',
                    termsAccepted
                      ? 'bg-green-500/10 border-green-500/50'
                      : 'bg-[var(--bg-hover)] border-[var(--border)] hover:border-[var(--border-strong)]'
                  )}>
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={clsx(
                      'w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                      termsAccepted
                        ? 'bg-green-500 border-green-500'
                        : 'border-[var(--text-muted)]'
                    )}>
                      {termsAccepted && <Check className="w-4 h-4 text-white" />}
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Je certifie l'exactitude des informations
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        En cochant cette case, je certifie que toutes les informations contenues dans ce devis sont exactes
                        et que les prix indiqués sont conformes à mes tarifs. Je m'engage à respecter les conditions mentionnées.
                      </p>
                    </div>
                  </label>

                  {!termsAccepted && (
                    <p className="text-sm text-amber-400 mt-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Vous devez valider cette case avant de signer
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Signature */}
                  <div className={clsx(
                    'bg-[var(--bg-hover)] rounded-xl p-4 border transition-opacity',
                    termsAccepted ? 'border-[var(--border)]' : 'border-[var(--border)] opacity-50 pointer-events-none'
                  )}>
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <PenTool className="w-5 h-5 text-blue-400" />
                      Signature électronique
                      {!termsAccepted && <span className="text-xs text-[var(--text-muted)] ml-auto">(Validez d'abord ci-dessus)</span>}
                    </h3>
                    {signatureImage ? (
                      <div className="space-y-3">
                        <div className="bg-white rounded-xl p-2">
                          <img src={signatureImage} alt="Signature" className="max-h-24 mx-auto" />
                        </div>
                        <div className="flex items-center gap-2 text-green-400 text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          Signature enregistrée
                        </div>
                        <button
                          onClick={() => setSignatureImage(null)}
                          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        >
                          Modifier la signature
                        </button>
                      </div>
                    ) : (
                      <SignaturePad
                        onSign={setSignatureImage}
                        disabled={!termsAccepted}
                      />
                    )}
                  </div>

                  {/* Phone Verification */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                    <h3 className="font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                      <Smartphone className="w-5 h-5 text-green-400" />
                      Vérification par SMS
                      {phoneVerified && (
                        <span className="ml-auto px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Vérifié
                        </span>
                      )}
                    </h3>
                    {phoneVerified ? (
                      <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                        <CheckCircle2 className="w-5 h-5" />
                        <span>Numéro vérifié avec succès</span>
                      </div>
                    ) : (
                      <PhoneVerification
                        phoneNumber={providerPhone}
                        onVerified={(code) => {
                          setVerificationCode(code);
                          setPhoneVerified(true);
                        }}
                        disabled={false}
                      />
                    )}
                  </div>
                </div>

                {/* Security Info */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-400">Signature sécurisée</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Votre signature est horodatée et associée à votre numéro de téléphone vérifié.
                        Elle a valeur légale conformément au règlement eIDAS.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 5: Preview */}
            {currentStep === 'preview' && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Preview Card */}
                <div className="bg-white text-gray-900 rounded-xl overflow-hidden">
                  {/* Header */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-bold">DEVIS</h2>
                        <p className="text-blue-200">{quoteReference}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{providerName}</p>
                        {providerSiret && <p className="text-sm text-blue-200">SIRET: {providerSiret}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Client */}
                  <div className="p-6 border-b">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Client</p>
                        <p className="font-bold">{establishmentName}</p>
                        <p className="text-sm text-[var(--text-muted)]">{clientName}</p>
                        {establishmentAddress && <p className="text-sm text-[var(--text-muted)]">{establishmentAddress}</p>}
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-[var(--text-muted)] uppercase mb-1">Date</p>
                        <p>{new Date().toLocaleDateString('fr-FR')}</p>
                        <p className="text-xs text-[var(--text-muted)] mt-2">Validité: {validityDays} jours</p>
                      </div>
                    </div>
                  </div>

                  {/* Trust Score Badge in Preview */}
                  {analysis && (
                    <div className={clsx(
                      'mx-6 mt-4 p-3 rounded-lg flex items-center gap-3',
                      trustLevel === 'EXCELLENT' || trustLevel === 'GOOD' ? 'bg-green-50 border border-green-200' :
                      trustLevel === 'FAIR' ? 'bg-yellow-50 border border-yellow-200' :
                      'bg-red-50 border border-red-200'
                    )}>
                      <ShieldCheck className={clsx(
                        'w-6 h-6',
                        trustLevel === 'EXCELLENT' || trustLevel === 'GOOD' ? 'text-green-600' :
                        trustLevel === 'FAIR' ? 'text-yellow-600' : 'text-red-600'
                      )} />
                      <div>
                        <p className={clsx(
                          'font-semibold',
                          trustLevel === 'EXCELLENT' || trustLevel === 'GOOD' ? 'text-green-700' :
                          trustLevel === 'FAIR' ? 'text-yellow-700' : 'text-red-700'
                        )}>
                          Trust Score: {trustScore}/100
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">Devis vérifié par Intelligence Artificielle</p>
                      </div>
                    </div>
                  )}

                  {/* Items */}
                  <div className="p-6">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 text-[var(--text-muted)]">Description</th>
                          <th className="text-center py-2 text-[var(--text-muted)]">Qté</th>
                          <th className="text-right py-2 text-[var(--text-muted)]">P.U. HT</th>
                          <th className="text-right py-2 text-[var(--text-muted)]">Total HT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((item) => (
                          <tr key={item.id} className="border-b border-gray-100">
                            <td className="py-2">
                              <p className="font-medium">{item.description}</p>
                              {item.reference && (
                                <p className="text-xs text-[var(--text-muted)]">Réf: {item.reference}</p>
                              )}
                            </td>
                            <td className="text-center py-2">{item.quantity} {item.unit}</td>
                            <td className="text-right py-2">{formatPrice(item.unitPriceHT)}</td>
                            <td className="text-right py-2 font-medium">
                              {formatPrice(item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals */}
                  <div className="px-6 pb-6">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">Sous-total HT</span>
                          <span>{formatPrice(subtotalHT)}</span>
                        </div>
                        {globalDiscount > 0 && (
                          <div className="flex justify-between text-red-600">
                            <span>Remise ({globalDiscount}%)</span>
                            <span>-{formatPrice(subtotalHT - subtotalAfterDiscount)}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-[var(--text-muted)]">TVA</span>
                          <span>{formatPrice(totalTVA)}</span>
                        </div>
                        <div className="flex justify-between pt-2 border-t text-lg font-bold">
                          <span>Total TTC</span>
                          <span className="text-blue-600">{formatPrice(totalTTC)}</span>
                        </div>
                        {depositEnabled && (
                          <div className="flex justify-between text-green-600">
                            <span>Acompte à verser ({depositPercent}%)</span>
                            <span>{formatPrice(depositAmount)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Signature */}
                  {signatureImage && (
                    <div className="px-6 pb-6">
                      <div className="border-t pt-4">
                        <p className="text-xs text-[var(--text-muted)] mb-2">Signature du prestataire</p>
                        <img src={signatureImage} alt="Signature" className="h-16" />
                        <p className="text-xs text-[var(--text-secondary)] mt-1">
                          Signé le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
                          {phoneVerified && ' • Identité vérifiée par SMS'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] bg-[var(--bg-hover)] shrink-0">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/30">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-400">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between p-4">
            <button
              onClick={goToPrevStep}
              disabled={currentStep === 'items'}
              className="flex items-center gap-2 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Retour
            </button>

            <div className="flex items-center gap-3">
              {currentStep === 'preview' ? (
                <button
                  onClick={handleSubmit}
                  disabled={items.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[var(--text-primary)] font-medium transition-all"
                >
                  <Send className="w-4 h-4" />
                  Envoyer le devis
                </button>
              ) : (
                <button
                  onClick={goToNextStep}
                  disabled={currentStep === 'items' && items.length === 0}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[var(--text-primary)] font-medium transition-colors"
                >
                  Suivant
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Part Scanner Modal */}
      <AnimatePresence>
        {showPartScanner && (
          <PartScannerModal
            isOpen={showPartScanner}
            onClose={() => {
              setShowPartScanner(false);
              setScanningForItemId(null);
            }}
            onPartIdentified={handlePartIdentified}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default QuoteBuilderUltimate;
