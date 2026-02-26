'use client';

// ============================================================================
// QUOTE RECEIVER VIEW - Interface Patron
// ============================================================================
// Vue que le patron reçoit pour consulter, approuver et signer un devis
// Flux complet: Étudier → Questions → CGV → Signer → Payer
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Download,
  Printer,
  Phone,
  Lock,
  PenTool,
  Euro,
  Clock,
  Building2,
  User,
  Mail,
  MapPin,
  Calendar,
  Package,
  Wrench,
  Truck,
  Info,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  HelpCircle,
  Sparkles,
  CreditCard,
  Banknote,
  Building,
  Receipt,
  MessageCircle,
  CornerDownRight,
  Loader2,
  ExternalLink,
  Eye,
  CheckCheck,
} from 'lucide-react';
import { clsx } from 'clsx';

import type { FinalQuote } from '@/components/provider/QuoteBuilderUltimate';
import type { TrustLevel } from '@/lib/quote-intelligence/types';

// ============================================================================
// TYPES
// ============================================================================

interface QuoteReceiverViewProps {
  quote: FinalQuote;
  onAccept: (signatureData: SignatureData) => void;
  onReject: (reason: string) => void;
  onRequestModification: (message: string) => void;
  onClose?: () => void;
}

interface SignatureData {
  signatureImage: string;
  signedAt: Date;
  phoneNumber: string;
  phoneVerified: boolean;
  verificationCode: string;
  acceptedTerms: boolean;
  approvalText: string; // "Lu et approuvé" ou "Bon pour travaux"
  paymentMethod?: 'card' | 'transfer' | 'check';
  depositPaid?: boolean;
}

// Types pour le système de questions
interface QuoteQuestion {
  id: string;
  itemId?: string; // Si question sur un item spécifique
  question: string;
  askedAt: Date;
  answer?: string;
  answeredAt?: Date;
  status: 'pending' | 'answered';
}

type PaymentMethod = 'card' | 'transfer' | 'check';

// Étapes du workflow patron
type WorkflowStep = 'study' | 'questions' | 'terms' | 'sign' | 'pay';

// ============================================================================
// CONSTANTS - CGV Légales Complètes
// ============================================================================

const FULL_CGV_TEXT = `
CONDITIONS GÉNÉRALES DE VENTE - PRESTATIONS DE SERVICES

ARTICLE 1 - OBJET ET CHAMP D'APPLICATION
Les présentes Conditions Générales de Vente (CGV) s'appliquent à toutes les prestations de services conclues entre le prestataire et le client. Elles constituent le socle unique de la relation commerciale entre les parties.

ARTICLE 2 - DEVIS
Le présent devis est valable pour la durée indiquée. Passé ce délai, le prestataire se réserve le droit de modifier les tarifs. Le devis devient un contrat liant les deux parties dès lors qu'il est signé par le client avec la mention "Bon pour travaux" ou "Lu et approuvé".

ARTICLE 3 - PRIX ET PAIEMENT
3.1. Les prix sont indiqués en euros hors taxes (HT). La TVA applicable est ajoutée au taux en vigueur au jour de la facturation.
3.2. Conditions de paiement : selon les modalités indiquées sur le devis.
3.3. En cas de retard de paiement, des pénalités de retard seront appliquées au taux de 3 fois le taux d'intérêt légal, conformément à l'article L.441-10 du Code de commerce.
3.4. Une indemnité forfaitaire de 40 euros pour frais de recouvrement sera due en cas de retard de paiement (article D.441-5 du Code de commerce).

ARTICLE 4 - EXÉCUTION DES PRESTATIONS
4.1. Le prestataire s'engage à exécuter les prestations décrites dans le devis avec diligence et selon les règles de l'art.
4.2. Les délais d'intervention mentionnés sont donnés à titre indicatif et ne constituent pas un engagement ferme.
4.3. Le client s'engage à assurer l'accès aux locaux et équipements nécessaires à l'exécution des prestations.

ARTICLE 5 - GARANTIES
5.1. Les pièces neuves installées bénéficient de la garantie constructeur.
5.2. La main d'œuvre est garantie selon les termes spécifiés sur le devis.
5.3. La garantie ne couvre pas les dommages résultant d'une mauvaise utilisation, d'un défaut d'entretien ou d'une intervention d'un tiers.

ARTICLE 6 - RESPONSABILITÉ
6.1. Le prestataire est responsable des dommages directs causés par sa faute dans l'exécution des prestations.
6.2. La responsabilité du prestataire est limitée au montant du devis.
6.3. Le prestataire ne saurait être tenu responsable des dommages indirects ou immatériels.

ARTICLE 7 - ASSURANCE
Le prestataire déclare être assuré pour son activité professionnelle. Les coordonnées de l'assureur et la couverture géographique sont mentionnées sur le devis.

ARTICLE 8 - RÉCLAMATIONS
Toute réclamation doit être adressée par écrit dans un délai de 8 jours suivant l'intervention. Passé ce délai, les travaux seront réputés acceptés sans réserve.

ARTICLE 9 - MÉDIATION
Conformément aux articles L.616-1 et R.616-1 du Code de la consommation, le client peut recourir gratuitement au service de médiation proposé par le prestataire. Le médiateur peut être saisi si aucune solution amiable n'a été trouvée.

ARTICLE 10 - DONNÉES PERSONNELLES
Les données personnelles collectées sont traitées conformément au Règlement Général sur la Protection des Données (RGPD). Le client dispose d'un droit d'accès, de rectification et de suppression de ses données.

ARTICLE 11 - DROIT APPLICABLE
Les présentes CGV sont soumises au droit français. Tout litige relève de la compétence des tribunaux du ressort du siège social du prestataire.
`;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

function getTrustLevelInfo(level: TrustLevel): { label: string; color: string; bgColor: string; description: string } {
  switch (level) {
    case 'EXCELLENT':
      return {
        label: 'Excellent',
        color: 'text-green-400',
        bgColor: 'bg-green-500/20',
        description: 'Ce devis présente des prix conformes aux standards du marché.',
      };
    case 'GOOD':
      return {
        label: 'Bon',
        color: 'text-lime-400',
        bgColor: 'bg-lime-500/20',
        description: 'Les prix sont légèrement au-dessus de la moyenne mais restent raisonnables.',
      };
    case 'FAIR':
      return {
        label: 'Correct',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/20',
        description: 'Certains éléments pourraient être négociés. Vérifiez les détails.',
      };
    case 'HIGH':
      return {
        label: 'Élevé',
        color: 'text-orange-400',
        bgColor: 'bg-orange-500/20',
        description: 'Les prix sont sensiblement au-dessus du marché. Demandez des justifications.',
      };
    case 'SUSPICIOUS':
      return {
        label: 'À vérifier',
        color: 'text-red-400',
        bgColor: 'bg-red-500/20',
        description: 'Certains prix semblent anormalement élevés. Demandez un second avis.',
      };
    default:
      return {
        label: 'Non évalué',
        color: 'text-gray-400',
        bgColor: 'bg-gray-500/20',
        description: 'Ce devis n\'a pas encore été analysé.',
      };
  }
}

// ============================================================================
// SIGNATURE PAD COMPONENT
// ============================================================================

function SignaturePad({
  onSign,
  disabled = false,
}: {
  onSign: (imageData: string) => void;
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

    // Fond blanc cassé pour meilleure visibilité
    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Style de ligne
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { x, y } = getCoordinates(e);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.closePath();
    setIsDrawing(false);

    // Save signature
    if (hasSignature) {
      onSign(canvas.toDataURL('image/png'));
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    ctx.fillStyle = '#f8f9fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onSign('');
  };

  return (
    <div className="space-y-2">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className={clsx(
            'w-full border-2 border-dashed rounded-xl cursor-crosshair touch-none',
            disabled ? 'opacity-50 cursor-not-allowed border-gray-600' : 'border-blue-500/50 hover:border-blue-500'
          )}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm">Signez ici avec votre souris ou votre doigt</p>
          </div>
        )}
      </div>
      {hasSignature && (
        <button
          type="button"
          onClick={clearSignature}
          disabled={disabled}
          className="text-sm text-gray-500 hover:text-gray-400 transition-colors"
        >
          Effacer la signature
        </button>
      )}
    </div>
  );
}

// ============================================================================
// PHONE VERIFICATION COMPONENT
// ============================================================================

function PhoneVerification({
  phoneNumber,
  onVerified,
  disabled = false,
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
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const sendCode = async () => {
    if (!phone || phone.length < 10) {
      setError('Numéro de téléphone invalide');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Simulation d'envoi SMS
    await new Promise(resolve => setTimeout(resolve, 1500));

    setCodeSent(true);
    setCountdown(60);
    setIsVerifying(false);
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setIsVerifying(true);
    setError(null);

    // Simulation de vérification (accepte tout code à 6 chiffres)
    await new Promise(resolve => setTimeout(resolve, 1000));

    onVerified(code);
    setIsVerifying(false);
  };

  return (
    <div className="space-y-3">
      {!codeSent ? (
        <>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Numéro de téléphone mobile</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              disabled={disabled}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
            />
          </div>
          <button
            onClick={sendCode}
            disabled={disabled || isVerifying || !phone}
            className={clsx(
              'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              disabled || isVerifying || !phone
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            )}
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Recevoir le code SMS
              </>
            )}
          </button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">Code envoyé au {phone}</span>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Code de vérification (6 chiffres)</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              disabled={disabled}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-center text-2xl tracking-widest focus:outline-none focus:border-blue-500 disabled:opacity-50"
              maxLength={6}
            />
          </div>
          <button
            onClick={verifyCode}
            disabled={disabled || isVerifying || code.length !== 6}
            className={clsx(
              'w-full py-2.5 rounded-lg font-medium transition-colors flex items-center justify-center gap-2',
              disabled || isVerifying || code.length !== 6
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
            )}
          >
            {isVerifying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Vérification...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Valider le code
              </>
            )}
          </button>
          {countdown > 0 ? (
            <p className="text-xs text-gray-500 text-center">
              Renvoyer le code dans {countdown}s
            </p>
          ) : (
            <button
              onClick={() => {
                setCodeSent(false);
                setCode('');
              }}
              className="text-xs text-blue-400 hover:text-blue-300 text-center w-full"
            >
              Renvoyer le code
            </button>
          )}
        </>
      )}
      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}

// ============================================================================
// WORKFLOW STEP INDICATOR COMPONENT
// ============================================================================

function WorkflowSteps({
  currentStep,
  onStepClick,
  completedSteps,
}: {
  currentStep: WorkflowStep;
  onStepClick: (step: WorkflowStep) => void;
  completedSteps: Set<WorkflowStep>;
}) {
  const steps: { id: WorkflowStep; label: string; icon: React.ElementType }[] = [
    { id: 'study', label: 'Étudier', icon: Eye },
    { id: 'questions', label: 'Questions', icon: MessageCircle },
    { id: 'terms', label: 'Conditions', icon: FileText },
    { id: 'sign', label: 'Signer', icon: PenTool },
    { id: 'pay', label: 'Payer', icon: CreditCard },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex items-center justify-between px-2">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.id === currentStep;
        const isCompleted = completedSteps.has(step.id);
        const isPast = index < currentIndex;
        const isClickable = isCompleted || index <= currentIndex;

        return (
          <React.Fragment key={step.id}>
            <button
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={clsx(
                'flex flex-col items-center gap-1 transition-all',
                isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
              )}
            >
              <div className={clsx(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all border-2',
                isActive && 'bg-blue-500 border-blue-500 text-white scale-110',
                isCompleted && !isActive && 'bg-green-500 border-green-500 text-white',
                !isActive && !isCompleted && isPast && 'bg-blue-500/20 border-blue-500/50 text-blue-400',
                !isActive && !isCompleted && !isPast && 'bg-white/5 border-white/20 text-gray-500'
              )}>
                {isCompleted && !isActive ? (
                  <CheckCheck className="w-5 h-5" />
                ) : (
                  <Icon className="w-5 h-5" />
                )}
              </div>
              <span className={clsx(
                'text-xs font-medium',
                isActive && 'text-blue-400',
                isCompleted && !isActive && 'text-green-400',
                !isActive && !isCompleted && 'text-gray-500'
              )}>
                {step.label}
              </span>
            </button>
            {index < steps.length - 1 && (
              <div className={clsx(
                'flex-1 h-0.5 mx-2',
                index < currentIndex ? 'bg-blue-500' : 'bg-white/10'
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ============================================================================
// QUESTION BUBBLE COMPONENT
// ============================================================================

function QuestionBubble({
  question,
  isProviderAnswer = false,
}: {
  question: QuoteQuestion;
  isProviderAnswer?: boolean;
}) {
  return (
    <div className={clsx(
      'flex',
      isProviderAnswer ? 'justify-start' : 'justify-end'
    )}>
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-2.5',
        isProviderAnswer
          ? 'bg-slate-700 rounded-tl-sm'
          : 'bg-blue-500/20 text-blue-100 rounded-tr-sm'
      )}>
        {isProviderAnswer ? (
          <>
            <p className="text-sm text-gray-300">{question.answer}</p>
            <p className="text-[10px] text-gray-500 mt-1">
              {question.answeredAt ? formatDate(question.answeredAt) : ''}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm">{question.question}</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-[10px] text-blue-400/70">
                {formatDate(question.askedAt)}
              </p>
              {question.status === 'pending' && (
                <span className="text-[10px] text-yellow-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  En attente
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// ITEM QUESTION MODAL
// ============================================================================

function ItemQuestionModal({
  item,
  onSubmit,
  onClose,
}: {
  item: { id: string; description: string };
  onSubmit: (question: string) => void;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState('');

  const handleSubmit = () => {
    if (!question.trim()) return;
    onSubmit(question);
    setQuestion('');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 overflow-hidden"
      >
        <div className="p-4 border-b border-white/10">
          <h3 className="font-semibold text-white flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-blue-400" />
            Poser une question
          </h3>
          <p className="text-sm text-gray-400 mt-1">
            Concernant : <span className="text-white">{item.description}</span>
          </p>
        </div>

        <div className="p-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Votre question au prestataire..."
            rows={3}
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
          />

          {/* Suggestions rapides */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              'Pourquoi ce prix ?',
              'Garantie incluse ?',
              'Délai disponibilité ?',
              'Alternative moins chère ?',
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setQuestion(suggestion)}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition-colors"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-white/10 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={!question.trim()}
            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            Envoyer
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ============================================================================
// PAYMENT SECTION COMPONENT
// ============================================================================

function PaymentSection({
  quote,
  selectedMethod,
  onSelectMethod,
  onPayDeposit,
  isProcessing,
}: {
  quote: FinalQuote;
  selectedMethod: PaymentMethod | null;
  onSelectMethod: (method: PaymentMethod) => void;
  onPayDeposit: () => void;
  isProcessing: boolean;
}) {
  const paymentMethods: { id: PaymentMethod; label: string; icon: React.ElementType; description: string }[] = [
    { id: 'card', label: 'Carte bancaire', icon: CreditCard, description: 'Paiement sécurisé immédiat' },
    { id: 'transfer', label: 'Virement', icon: Building, description: 'IBAN fourni après validation' },
    { id: 'check', label: 'Chèque', icon: Receipt, description: 'À l\'ordre du prestataire' },
  ];

  return (
    <div className="space-y-6">
      {/* Récapitulatif à payer */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-xl p-5 border border-blue-500/30">
        <h3 className="text-lg font-semibold text-white mb-4">Récapitulatif</h3>
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Total du devis TTC</span>
            <span className="text-white font-medium">{formatPrice(quote.totalTTC)}</span>
          </div>
          {quote.deposit && (
            <>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between">
                <span className="text-gray-400">Acompte à verser ({quote.depositPercent}%)</span>
                <span className="text-xl font-bold text-blue-400">{formatPrice(quote.deposit)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Solde après travaux</span>
                <span className="text-white">{formatPrice(quote.totalTTC - quote.deposit)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Choix du mode de paiement */}
      <div>
        <h3 className="font-semibold text-white mb-3">Mode de paiement</h3>
        <div className="space-y-2">
          {paymentMethods.map((method) => {
            const Icon = method.icon;
            const isSelected = selectedMethod === method.id;
            return (
              <button
                key={method.id}
                onClick={() => onSelectMethod(method.id)}
                className={clsx(
                  'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                  isSelected
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-white/5 border-white/10 hover:border-white/30'
                )}
              >
                <div className={clsx(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  isSelected ? 'bg-blue-500/20 text-blue-400' : 'bg-white/10 text-gray-400'
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className={clsx('font-medium', isSelected ? 'text-blue-400' : 'text-white')}>
                    {method.label}
                  </p>
                  <p className="text-sm text-gray-500">{method.description}</p>
                </div>
                <div className={clsx(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-500'
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Informations selon le mode choisi */}
      <AnimatePresence mode="wait">
        {selectedMethod === 'card' && (
          <motion.div
            key="card"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Paiement sécurisé Stripe</p>
                <p className="text-sm text-gray-400 mt-1">
                  Vous serez redirigé vers une page de paiement sécurisée.
                  Vos données bancaires ne sont jamais stockées sur nos serveurs.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <img src="/visa.svg" alt="Visa" className="h-6 opacity-70" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <img src="/mastercard.svg" alt="Mastercard" className="h-6 opacity-70" onError={(e) => e.currentTarget.style.display = 'none'} />
                  <span className="text-xs text-gray-500">CB, Visa, Mastercard</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {selectedMethod === 'transfer' && (
          <motion.div
            key="transfer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <Building className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Virement bancaire</p>
                <p className="text-sm text-gray-400 mt-1">
                  Les coordonnées bancaires vous seront communiquées après validation.
                  Le devis sera confirmé dès réception du virement (2-3 jours ouvrés).
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {selectedMethod === 'check' && (
          <motion.div
            key="check"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-slate-800/50 rounded-xl p-4 border border-white/10"
          >
            <div className="flex items-start gap-3">
              <Receipt className="w-5 h-5 text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Paiement par chèque</p>
                <p className="text-sm text-gray-400 mt-1">
                  Chèque à l'ordre de : <span className="text-white">{quote.provider.name}</span>
                </p>
                <p className="text-sm text-gray-400">
                  À remettre au prestataire lors de l'intervention ou à envoyer à l'adresse indiquée.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton de paiement */}
      {selectedMethod && quote.deposit && (
        <button
          onClick={onPayDeposit}
          disabled={isProcessing}
          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-gray-600 disabled:to-gray-600 rounded-xl text-white font-semibold transition-all flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Traitement en cours...
            </>
          ) : (
            <>
              {selectedMethod === 'card' ? (
                <>
                  <CreditCard className="w-5 h-5" />
                  Payer l'acompte de {formatPrice(quote.deposit)}
                </>
              ) : selectedMethod === 'transfer' ? (
                <>
                  <Building className="w-5 h-5" />
                  Recevoir les coordonnées bancaires
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Confirmer (chèque à remettre)
                </>
              )}
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteReceiverView({
  quote,
  onAccept,
  onReject,
  onRequestModification,
  onClose,
}: QuoteReceiverViewProps) {
  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('study');
  const [completedSteps, setCompletedSteps] = useState<Set<WorkflowStep>>(new Set());

  // Questions state
  const [questions, setQuestions] = useState<QuoteQuestion[]>([]);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [questionItemTarget, setQuestionItemTarget] = useState<{ id: string; description: string } | null>(null);
  const [generalQuestion, setGeneralQuestion] = useState('');

  // Terms & Signature state
  const [showFullCGV, setShowFullCGV] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [approvalText, setApprovalText] = useState<'lu_approuve' | 'bon_travaux'>('bon_travaux');
  const [signatureImage, setSignatureImage] = useState<string>('');
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');

  // Payment state
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Modal states
  const [rejectReason, setRejectReason] = useState('');
  const [modificationMessage, setModificationMessage] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState(false);

  const trustInfo = getTrustLevelInfo(quote.trustLevel);

  const canSign = termsAccepted && signatureImage && phoneVerified;

  // Mark step as completed and move to next
  const completeStep = (step: WorkflowStep) => {
    setCompletedSteps(prev => new Set([...prev, step]));
  };

  // Navigation avec validation
  const goToStep = (step: WorkflowStep) => {
    setCurrentStep(step);
  };

  // Ajouter une question
  const addQuestion = (question: string, itemId?: string) => {
    const newQuestion: QuoteQuestion = {
      id: `q_${Date.now()}`,
      itemId,
      question,
      askedAt: new Date(),
      status: 'pending',
    };
    setQuestions(prev => [...prev, newQuestion]);
  };

  // Ouvrir le modal de question pour un item
  const openQuestionForItem = (item: { id: string; description: string }) => {
    setQuestionItemTarget(item);
    setShowQuestionModal(true);
  };

  const handleAccept = () => {
    if (!canSign) return;

    onAccept({
      signatureImage,
      signedAt: new Date(),
      phoneNumber: quote.client.phone || '',
      phoneVerified,
      verificationCode,
      acceptedTerms: termsAccepted,
      approvalText: approvalText === 'bon_travaux' ? 'Bon pour travaux' : 'Lu et approuvé',
      paymentMethod: selectedPaymentMethod || undefined,
      depositPaid: false,
    });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) return;
    onReject(rejectReason);
    setShowRejectModal(false);
  };

  const handleRequestModification = () => {
    if (!modificationMessage.trim()) return;
    onRequestModification(modificationMessage);
    setShowModifyModal(false);
  };

  const handlePayDeposit = async () => {
    setIsProcessingPayment(true);
    // Simulation du paiement
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessingPayment(false);
    // Ici on appellerait la vraie API de paiement
    handleAccept();
  };

  // Envoyer question générale
  const handleSendGeneralQuestion = () => {
    if (!generalQuestion.trim()) return;
    addQuestion(generalQuestion);
    setGeneralQuestion('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header avec workflow */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          {/* Titre et score */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">Devis {quote.reference}</h1>
                <p className="text-xs text-gray-400">
                  De {quote.provider.name}
                </p>
              </div>
            </div>

            {/* Trust Score Badge */}
            <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-full', trustInfo.bgColor)}>
              <ShieldCheck className={clsx('w-4 h-4', trustInfo.color)} />
              <span className={clsx('text-sm font-medium', trustInfo.color)}>
                {quote.trustScore}/100
              </span>
            </div>
          </div>

          {/* Workflow Steps */}
          <WorkflowSteps
            currentStep={currentStep}
            onStepClick={goToStep}
            completedSteps={completedSteps}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* ============================================= */}
          {/* STEP 1: STUDY - Étudier le devis */}
          {/* ============================================= */}
          {currentStep === 'study' && (
            <motion.div
              key="study"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Trust Score Alert */}
              <div className={clsx(
                'p-4 rounded-xl border',
                trustInfo.bgColor,
                quote.trustLevel === 'EXCELLENT' || quote.trustLevel === 'GOOD'
                  ? 'border-green-500/30'
                  : quote.trustLevel === 'FAIR'
                  ? 'border-yellow-500/30'
                  : 'border-red-500/30'
              )}>
                <div className="flex items-start gap-3">
                  {quote.trustLevel === 'EXCELLENT' || quote.trustLevel === 'GOOD' ? (
                    <ShieldCheck className={clsx('w-6 h-6 flex-shrink-0', trustInfo.color)} />
                  ) : (
                    <ShieldAlert className={clsx('w-6 h-6 flex-shrink-0', trustInfo.color)} />
                  )}
                  <div className="flex-1">
                    <p className={clsx('font-semibold', trustInfo.color)}>
                      Score de confiance: {quote.trustScore}/100 ({trustInfo.label})
                    </p>
                    <p className="text-sm text-gray-400 mt-1">{trustInfo.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span className="text-xs text-purple-400">Analyse IA</span>
                  </div>
                </div>
              </div>

              {/* Parties Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Provider */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Prestataire</h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-white">{quote.provider.name}</p>
                    {quote.provider.siret && (
                      <p className="text-sm text-gray-400">SIRET: {quote.provider.siret}</p>
                    )}
                    {quote.provider.address && (
                      <p className="text-sm text-gray-400 flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        {quote.provider.address}
                      </p>
                    )}
                    {quote.provider.phone && (
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {quote.provider.phone}
                      </p>
                    )}
                    {quote.provider.email && (
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {quote.provider.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Client (Patron) */}
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-3">Client</h3>
                  <div className="space-y-2">
                    <p className="font-semibold text-white">{quote.client.establishmentName}</p>
                    <p className="text-sm text-gray-400">{quote.client.name}</p>
                    {quote.client.siret && (
                      <p className="text-sm text-gray-400">SIRET: {quote.client.siret}</p>
                    )}
                    {quote.client.establishmentAddress && (
                      <p className="text-sm text-gray-400 flex items-start gap-2">
                        <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                        {quote.client.establishmentAddress}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Quote Details with Question buttons */}
              <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
                <div className="p-4 border-b border-white/10 flex items-center justify-between flex-wrap gap-2">
                  <h3 className="font-semibold text-white">Détail des prestations</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {formatDate(quote.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Valide jusqu'au {formatDate(quote.validUntil)}
                    </span>
                  </div>
                </div>

                {/* Items Table with Question button per item */}
                <div className="divide-y divide-white/5">
                  {quote.items.map((item) => {
                    const ItemIcon = item.type === 'PART' ? Package : item.type === 'LABOR' ? Wrench : Truck;
                    const lineTotal = item.quantity * item.unitPriceHT * (1 - (item.discount || 0) / 100);
                    const itemQuestions = questions.filter(q => q.itemId === item.id);

                    return (
                      <div key={item.id} className="p-4 hover:bg-white/5 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className={clsx(
                            'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
                            item.type === 'PART' && 'bg-cyan-500/20 text-cyan-400',
                            item.type === 'LABOR' && 'bg-orange-500/20 text-orange-400',
                            item.type === 'TRAVEL' && 'bg-green-500/20 text-green-400',
                            (item.type === 'OTHER' || item.type === 'CUSTOM') && 'bg-purple-500/20 text-purple-400'
                          )}>
                            <ItemIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="font-medium text-white">{item.description}</p>
                                {item.reference && (
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    Réf: {item.reference}
                                    {item.brand && ` • ${item.brand}`}
                                    {item.model && ` ${item.model}`}
                                  </p>
                                )}
                              </div>
                              <div className="text-right shrink-0">
                                <p className="font-semibold text-white">{formatPrice(lineTotal)}</p>
                                <p className="text-xs text-gray-500">
                                  {item.quantity} {item.unit} × {formatPrice(item.unitPriceHT)}
                                </p>
                              </div>
                            </div>

                            {/* Market Price Comparison */}
                            {item.marketPrice && (
                              <div className="flex items-center gap-3 mt-2">
                                <div className={clsx(
                                  'text-xs flex items-center gap-2 px-2 py-1 rounded w-fit',
                                  (item.priceVariance || 0) <= 10 && 'bg-green-500/10 text-green-400',
                                  (item.priceVariance || 0) > 10 && (item.priceVariance || 0) <= 25 && 'bg-yellow-500/10 text-yellow-400',
                                  (item.priceVariance || 0) > 25 && 'bg-red-500/10 text-red-400'
                                )}>
                                  <span>Prix marché: {formatPrice(item.marketPrice.average)}</span>
                                  <span>•</span>
                                  <span>
                                    {(item.priceVariance || 0) > 0 ? '+' : ''}{item.priceVariance?.toFixed(0) || 0}%
                                  </span>
                                </div>

                                {/* Question button for this item */}
                                <button
                                  onClick={() => openQuestionForItem({ id: item.id, description: item.description })}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity px-2 py-1 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded text-xs text-blue-400 flex items-center gap-1"
                                >
                                  <HelpCircle className="w-3 h-3" />
                                  Question
                                </button>
                              </div>
                            )}

                            {/* Questions for this item */}
                            {itemQuestions.length > 0 && (
                              <div className="mt-3 pl-3 border-l-2 border-blue-500/30 space-y-2">
                                {itemQuestions.map(q => (
                                  <div key={q.id} className="text-xs">
                                    <p className="text-blue-400">Vous: {q.question}</p>
                                    {q.answer ? (
                                      <p className="text-gray-400 flex items-center gap-1 mt-1">
                                        <CornerDownRight className="w-3 h-3" />
                                        {q.answer}
                                      </p>
                                    ) : (
                                      <p className="text-yellow-400/70 text-[10px] flex items-center gap-1 mt-1">
                                        <Clock className="w-3 h-3" />
                                        En attente de réponse
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Totals */}
                <div className="p-4 bg-slate-900/50 border-t border-white/10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Sous-total HT</span>
                      <span className="text-white">{formatPrice(quote.subtotalHT)}</span>
                    </div>
                    {quote.globalDiscount > 0 && (
                      <div className="flex justify-between text-sm text-green-400">
                        <span>Remise ({quote.globalDiscount}%)</span>
                        <span>-{formatPrice(quote.subtotalHT - quote.subtotalAfterDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">TVA</span>
                      <span className="text-white">{formatPrice(quote.totalTVA)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold pt-2 border-t border-white/10">
                      <span className="text-white">Total TTC</span>
                      <span className="text-blue-400">{formatPrice(quote.totalTTC)}</span>
                    </div>
                    {quote.deposit && (
                      <div className="flex justify-between text-sm text-yellow-400">
                        <span>Acompte à verser ({quote.depositPercent}%)</span>
                        <span>{formatPrice(quote.deposit)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Public Notes */}
              {quote.publicNotes && (
                <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                  <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-400" />
                    Notes du prestataire
                  </h3>
                  <p className="text-sm text-gray-400">{quote.publicNotes}</p>
                </div>
              )}

              {/* Action: Continue to next step */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    completeStep('study');
                    goToStep('questions');
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                >
                  J'ai étudié le devis
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================= */}
          {/* STEP 2: QUESTIONS - Poser des questions */}
          {/* ============================================= */}
          {currentStep === 'questions' && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <h2 className="text-xl font-bold text-white">Des questions sur ce devis ?</h2>
                <p className="text-gray-400 mt-1">
                  Posez vos questions au prestataire avant de vous engager
                </p>
              </div>

              {/* Questions list */}
              {questions.length > 0 && (
                <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
                  <div className="p-4 border-b border-white/10">
                    <h3 className="font-semibold text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      Vos questions ({questions.length})
                    </h3>
                  </div>
                  <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
                    {questions.map((q) => (
                      <div key={q.id} className="space-y-2">
                        <QuestionBubble question={q} isProviderAnswer={false} />
                        {q.answer && (
                          <QuestionBubble question={q} isProviderAnswer={true} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New question input */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-3">Nouvelle question</h3>
                <div className="flex gap-2">
                  <textarea
                    value={generalQuestion}
                    onChange={(e) => setGeneralQuestion(e.target.value)}
                    placeholder="Tapez votre question ici..."
                    rows={2}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
                  />
                  <button
                    onClick={handleSendGeneralQuestion}
                    disabled={!generalQuestion.trim()}
                    className="px-4 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-xl text-white transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>

                {/* Quick questions */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {[
                    'Quel est le délai d\'intervention ?',
                    'Y a-t-il une garantie ?',
                    'Pouvez-vous détailler le prix ?',
                    'Des frais supplémentaires possibles ?',
                  ].map((q) => (
                    <button
                      key={q}
                      onClick={() => setGeneralQuestion(q)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs text-gray-400 hover:text-white transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              {/* Pending questions warning */}
              {questions.some(q => q.status === 'pending') && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-yellow-400" />
                    <div>
                      <p className="font-medium text-yellow-400">Questions en attente</p>
                      <p className="text-sm text-gray-400">
                        Vous avez {questions.filter(q => q.status === 'pending').length} question(s) sans réponse.
                        Vous pouvez continuer ou attendre les réponses.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => goToStep('study')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Retour au devis
                </button>
                <button
                  onClick={() => {
                    completeStep('questions');
                    goToStep('terms');
                  }}
                  className="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-medium transition-colors flex items-center gap-2"
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================= */}
          {/* STEP 3: TERMS - Conditions */}
          {/* ============================================= */}
          {currentStep === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Payment Terms */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Euro className="w-5 h-5 text-green-400" />
                  Conditions de paiement
                </h3>
                <p className="text-gray-300">{quote.paymentTerms}</p>
              </div>

              {/* Full CGV */}
              <div className="bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setShowFullCGV(!showFullCGV)}
                  className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-yellow-400" />
                    <span className="font-semibold text-white">Conditions Générales de Vente</span>
                  </div>
                  {showFullCGV ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showFullCGV && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 border-t border-white/10 max-h-96 overflow-y-auto">
                        <pre className="text-xs text-gray-400 whitespace-pre-wrap font-sans leading-relaxed">
                          {FULL_CGV_TEXT}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Terms Acceptance */}
              <label className={clsx(
                'flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all border-2',
                termsAccepted
                  ? 'bg-green-500/10 border-green-500/50'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              )}>
                <div className={clsx(
                  'w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all',
                  termsAccepted
                    ? 'bg-green-500 border-green-500'
                    : 'border-gray-500'
                )}>
                  {termsAccepted && <Check className="w-4 h-4 text-white" />}
                </div>
                <span className="text-sm text-gray-300">
                  J'ai lu et j'accepte les Conditions Générales de Vente. Je reconnais avoir pris connaissance de l'ensemble des informations relatives aux prestations proposées et aux prix indiqués.
                </span>
              </label>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => goToStep('questions')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => {
                    if (termsAccepted) {
                      completeStep('terms');
                      goToStep('sign');
                    }
                  }}
                  disabled={!termsAccepted}
                  className={clsx(
                    'px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2',
                    termsAccepted
                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Continuer vers la signature
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================= */}
          {/* STEP 4: SIGN - Signature */}
          {/* ============================================= */}
          {currentStep === 'sign' && (
            <motion.div
              key="sign"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Pre-requisites Check */}
              {!termsAccepted && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-400">Acceptation requise</p>
                      <p className="text-sm text-gray-400">
                        Vous devez d'abord accepter les Conditions Générales de Vente.
                      </p>
                      <button
                        onClick={() => goToStep('terms')}
                        className="text-sm text-blue-400 hover:text-blue-300 mt-1"
                      >
                        Aller aux conditions →
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Approval Text Selection */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-3">Mention d'approbation</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="radio"
                      name="approval"
                      checked={approvalText === 'bon_travaux'}
                      onChange={() => setApprovalText('bon_travaux')}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-white">Bon pour travaux</p>
                      <p className="text-xs text-gray-500">J'accepte l'exécution des travaux selon ce devis</p>
                    </div>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-lg border border-white/10 cursor-pointer hover:bg-white/5 transition-colors">
                    <input
                      type="radio"
                      name="approval"
                      checked={approvalText === 'lu_approuve'}
                      onChange={() => setApprovalText('lu_approuve')}
                      className="w-4 h-4 text-blue-500 focus:ring-blue-500"
                    />
                    <div>
                      <p className="font-medium text-white">Lu et approuvé</p>
                      <p className="text-xs text-gray-500">J'ai lu et j'approuve le contenu de ce devis</p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Signature Pad */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-blue-400" />
                  Signature électronique
                </h3>
                <SignaturePad
                  onSign={setSignatureImage}
                  disabled={!termsAccepted}
                />
                {signatureImage && (
                  <div className="mt-3 flex items-center gap-2 text-green-400 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    Signature enregistrée
                  </div>
                )}
              </div>

              {/* Phone Verification */}
              <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-green-400" />
                  Vérification d'identité par SMS
                  {phoneVerified && (
                    <span className="ml-auto px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                      Vérifié
                    </span>
                  )}
                </h3>
                {phoneVerified ? (
                  <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Votre identité a été vérifiée</span>
                  </div>
                ) : (
                  <PhoneVerification
                    phoneNumber={quote.client.phone}
                    onVerified={(code) => {
                      setVerificationCode(code);
                      setPhoneVerified(true);
                    }}
                    disabled={!termsAccepted || !signatureImage}
                  />
                )}
              </div>

              {/* Security Note */}
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-400">Signature électronique sécurisée</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Votre signature est horodatée et associée à votre numéro de téléphone vérifié.
                      Elle a valeur légale conformément au règlement européen eIDAS (UE) n°910/2014.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between">
                <button
                  onClick={() => goToStep('terms')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Retour
                </button>
                <button
                  onClick={() => {
                    if (canSign) {
                      completeStep('sign');
                      goToStep('pay');
                    }
                  }}
                  disabled={!canSign}
                  className={clsx(
                    'px-6 py-3 rounded-xl font-medium transition-colors flex items-center gap-2',
                    canSign
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  )}
                >
                  Continuer vers le paiement
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* ============================================= */}
          {/* STEP 5: PAY - Paiement */}
          {/* ============================================= */}
          {currentStep === 'pay' && (
            <motion.div
              key="pay"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Devis signé avec succès !</h2>
                <p className="text-gray-400 mt-1">
                  Finalisez en réglant l'acompte pour confirmer l'intervention
                </p>
              </div>

              <PaymentSection
                quote={quote}
                selectedMethod={selectedPaymentMethod}
                onSelectMethod={setSelectedPaymentMethod}
                onPayDeposit={handlePayDeposit}
                isProcessing={isProcessingPayment}
              />

              {/* Retour */}
              <div className="flex justify-start">
                <button
                  onClick={() => goToStep('sign')}
                  className="px-4 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-colors"
                >
                  Retour à la signature
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Actions - Contextuel selon l'étape */}
      {currentStep !== 'pay' && (
        <footer className="sticky bottom-0 bg-slate-900/95 backdrop-blur-sm border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            {/* Left: Reject/Modify - visible sauf sur pay */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowRejectModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 text-sm font-medium transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                Refuser
              </button>
              <button
                onClick={() => setShowModifyModal(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-yellow-400 text-sm font-medium transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Modifier
              </button>
            </div>

            {/* Right: Prix total */}
            <div className="text-right">
              <p className="text-xs text-gray-500">Total TTC</p>
              <p className="text-lg font-bold text-blue-400">{formatPrice(quote.totalTTC)}</p>
            </div>
          </div>
        </footer>
      )}

      {/* Reject Modal */}
      <AnimatePresence>
        {showRejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowRejectModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Refuser le devis</h3>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Veuillez indiquer la raison du refus..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-red-500 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowRejectModal(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectReason.trim()}
                  className="flex-1 py-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  Confirmer le refus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modify Modal */}
      <AnimatePresence>
        {showModifyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowModifyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/10 p-6"
            >
              <h3 className="text-lg font-bold text-white mb-4">Demander une modification</h3>
              <textarea
                value={modificationMessage}
                onChange={(e) => setModificationMessage(e.target.value)}
                placeholder="Décrivez les modifications souhaitées..."
                rows={4}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-yellow-500 resize-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setShowModifyModal(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleRequestModification}
                  disabled={!modificationMessage.trim()}
                  className="flex-1 py-2 bg-yellow-500 hover:bg-yellow-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white transition-colors"
                >
                  Envoyer la demande
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Item Question Modal */}
      <AnimatePresence>
        {showQuestionModal && questionItemTarget && (
          <ItemQuestionModal
            item={questionItemTarget}
            onSubmit={(question) => {
              addQuestion(question, questionItemTarget.id);
            }}
            onClose={() => {
              setShowQuestionModal(false);
              setQuestionItemTarget(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default QuoteReceiverView;
