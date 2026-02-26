'use client';

// ============================================================================
// QUOTE AI ASSISTANT
// ============================================================================
// Assistant IA conversationnel pour aider à la création de devis
// Suggestions contextuelles, réponses aux questions, aide à la négociation

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Send,
  X,
  Sparkles,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  HelpCircle,
  Zap,
  Target,
  DollarSign,
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RotateCcw,
  Bot,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

export type MessageRole = 'user' | 'assistant' | 'system';
export type SuggestionCategory = 'price' | 'time' | 'negotiation' | 'technical' | 'general';

export interface AIMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  category?: SuggestionCategory;
  suggestions?: string[];
  isTyping?: boolean;
  feedback?: 'positive' | 'negative';
}

export interface QuoteContext {
  items: Array<{
    type: string;
    description: string;
    price: number;
    marketPrice?: number;
    variance?: number;
  }>;
  totalHT: number;
  totalTTC: number;
  trustScore: number;
  clientName?: string;
  equipmentType?: string;
  problemDescription?: string;
}

interface QuoteAIAssistantProps {
  context: QuoteContext;
  isOpen: boolean;
  onClose: () => void;
  onSuggestionApply?: (suggestion: string) => void;
  position?: 'right' | 'bottom';
  className?: string;
}

// ============================================================================
// MOCK AI RESPONSES
// ============================================================================

const QUICK_SUGGESTIONS: Record<SuggestionCategory, string[]> = {
  price: [
    'Ce prix est-il justifié ?',
    'Comment négocier ce tarif ?',
    'Y a-t-il des alternatives moins chères ?',
    'Quel est le prix moyen du marché ?',
  ],
  time: [
    'Combien de temps pour cette réparation ?',
    'Le temps facturé est-il raisonnable ?',
    'Peut-on optimiser le temps d\'intervention ?',
  ],
  negotiation: [
    'Comment obtenir une remise ?',
    'Quels arguments pour négocier ?',
    'Le devis est-il négociable ?',
  ],
  technical: [
    'Cette pièce est-elle fiable ?',
    'Y a-t-il une garantie ?',
    'Quelle est la durée de vie moyenne ?',
  ],
  general: [
    'Résumé du devis',
    'Points d\'attention',
    'Recommandations',
  ],
};

// Simulated AI responses based on context
function generateAIResponse(
  message: string,
  context: QuoteContext
): { content: string; suggestions?: string[]; category?: SuggestionCategory } {
  const lowerMessage = message.toLowerCase();

  // Prix / Tarif questions
  if (lowerMessage.includes('prix') || lowerMessage.includes('tarif') || lowerMessage.includes('coût')) {
    const highPriceItems = context.items.filter(i => (i.variance || 0) > 15);

    if (highPriceItems.length > 0) {
      return {
        content: `J'ai identifié ${highPriceItems.length} élément(s) avec des prix au-dessus du marché:\n\n${highPriceItems.map(item => `• **${item.description}**: +${item.variance?.toFixed(0)}% vs marché (${item.price.toFixed(2)}€ vs ~${item.marketPrice?.toFixed(2)}€)`).join('\n')}\n\n**Conseil**: Ces écarts peuvent être justifiés par la qualité, l'urgence ou la garantie. N'hésitez pas à demander des explications au prestataire.`,
        suggestions: ['Comment négocier ?', 'Alternatives disponibles ?'],
        category: 'price',
      };
    }

    return {
      content: `Les prix de ce devis semblent conformes au marché. Le score de confiance de ${context.trustScore}/100 indique un devis équilibré.\n\n**Total**: ${context.totalTTC.toFixed(2)}€ TTC\n\nAucun élément ne présente d'écart significatif avec les prix du marché.`,
      suggestions: ['Détail par poste', 'Optimisations possibles'],
      category: 'price',
    };
  }

  // Négociation
  if (lowerMessage.includes('négoci') || lowerMessage.includes('remise') || lowerMessage.includes('réduction')) {
    return {
      content: `Voici mes conseils pour négocier ce devis:\n\n**1. Points forts à utiliser:**\n• Fidélité client (si applicable)\n• Paiement rapide\n• Regroupement d'interventions\n\n**2. Éléments négociables:**\n• Frais de déplacement (-10% possible)\n• Main d'oeuvre sur lots importants\n• Conditions de paiement\n\n**3. À éviter:**\n• Négocier les pièces d'origine\n• Demander des remises irréalistes (>20%)\n\n**Estimation remise possible**: 5-15% selon le contexte`,
      suggestions: ['Script de négociation', 'Contre-proposition'],
      category: 'negotiation',
    };
  }

  // Temps / Durée
  if (lowerMessage.includes('temps') || lowerMessage.includes('durée') || lowerMessage.includes('heure')) {
    const laborItems = context.items.filter(i => i.type === 'LABOR');
    const totalHours = laborItems.reduce((acc, item) => {
      // Estimation basique
      const hours = item.price / 65; // ~65€/h moyenne
      return acc + hours;
    }, 0);

    return {
      content: `**Analyse du temps facturé:**\n\nTemps total estimé: ~${totalHours.toFixed(1)} heures\n\n${laborItems.map(item => `• ${item.description}: ~${(item.price / 65).toFixed(1)}h`).join('\n')}\n\n**Référence marché:**\n• Diagnostic: 0.5-1h\n• Réparation simple: 1-2h\n• Réparation complexe: 2-4h\n• Installation: 3-6h\n\nLe temps semble ${totalHours < 4 ? 'raisonnable' : 'conséquent'} pour ce type d'intervention.`,
      suggestions: ['Optimiser le temps ?', 'Forfait possible ?'],
      category: 'time',
    };
  }

  // Résumé / Analyse
  if (lowerMessage.includes('résumé') || lowerMessage.includes('analyse') || lowerMessage.includes('avis')) {
    const partsCount = context.items.filter(i => i.type === 'PART').length;
    const laborCount = context.items.filter(i => i.type === 'LABOR').length;

    return {
      content: `**Résumé du devis:**\n\n📦 **${partsCount} pièce(s)** détachée(s)\n🔧 **${laborCount} poste(s)** de main d'oeuvre\n\n💰 **Total HT**: ${context.totalHT.toFixed(2)}€\n💶 **Total TTC**: ${context.totalTTC.toFixed(2)}€\n\n🛡️ **Score de confiance**: ${context.trustScore}/100\n${context.trustScore >= 80 ? '✅ Excellent - Prix conformes au marché' : context.trustScore >= 60 ? '⚠️ Correct - Quelques points à vérifier' : '🔴 Attention - Prix significativement élevés'}\n\n**Points d'attention:**\n${context.items.filter(i => (i.variance || 0) > 10).map(i => `• ${i.description}: +${i.variance?.toFixed(0)}%`).join('\n') || '• Aucun point critique détecté'}`,
      suggestions: ['Détail des anomalies', 'Conseils négociation'],
      category: 'general',
    };
  }

  // Technique / Pièce
  if (lowerMessage.includes('pièce') || lowerMessage.includes('technique') || lowerMessage.includes('fiable')) {
    return {
      content: `**Analyse technique des pièces:**\n\nLes pièces proposées dans ce devis sont:\n\n${context.items.filter(i => i.type === 'PART').map(item => `• **${item.description}**\n  Prix: ${item.price.toFixed(2)}€\n  ${item.marketPrice ? `Marché: ${item.marketPrice.toFixed(2)}€` : ''}`).join('\n\n')}\n\n**Recommandations:**\n• Privilégiez les pièces d'origine pour les équipements sous garantie\n• Les pièces compatibles peuvent offrir un bon rapport qualité/prix\n• Demandez toujours la garantie sur les pièces remplacées`,
      suggestions: ['Alternatives compatibles', 'Garanties pièces'],
      category: 'technical',
    };
  }

  // Default response
  return {
    content: `Je suis là pour vous aider avec ce devis de ${context.totalTTC.toFixed(2)}€ TTC.\n\n**Ce que je peux faire:**\n• Analyser les prix par rapport au marché\n• Vous conseiller sur la négociation\n• Expliquer les postes du devis\n• Identifier les points d'attention\n\nPosez-moi une question ou choisissez une suggestion ci-dessous.`,
    suggestions: ['Analyse complète', 'Points d\'attention', 'Conseils négociation'],
    category: 'general',
  };
}

// ============================================================================
// TYPING INDICATOR
// ============================================================================

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity }}
        className="w-2 h-2 bg-blue-400 rounded-full"
      />
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
        className="w-2 h-2 bg-blue-400 rounded-full"
      />
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
        className="w-2 h-2 bg-blue-400 rounded-full"
      />
    </div>
  );
}

// ============================================================================
// MESSAGE BUBBLE
// ============================================================================

function MessageBubble({
  message,
  onSuggestionClick,
  onFeedback,
}: {
  message: AIMessage;
  onSuggestionClick?: (suggestion: string) => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const categoryIcons: Record<SuggestionCategory, React.ElementType> = {
    price: DollarSign,
    time: Clock,
    negotiation: Target,
    technical: Wrench,
    general: Sparkles,
  };

  const CategoryIcon = message.category ? categoryIcons[message.category] : Sparkles;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={clsx(
        'flex gap-2 mb-4',
        isUser ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {/* Avatar */}
      <div className={clsx(
        'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
        isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'
      )}>
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Content */}
      <div className={clsx(
        'max-w-[80%] rounded-2xl px-4 py-3',
        isUser
          ? 'bg-blue-500 text-white rounded-tr-sm'
          : 'bg-slate-700/50 text-gray-100 rounded-tl-sm'
      )}>
        {message.isTyping ? (
          <TypingIndicator />
        ) : (
          <>
            {/* Category Badge */}
            {!isUser && message.category && (
              <div className="flex items-center gap-1 mb-2 text-xs text-purple-400">
                <CategoryIcon className="w-3 h-3" />
                <span className="uppercase tracking-wider">
                  {message.category === 'price' ? 'Prix' :
                   message.category === 'time' ? 'Temps' :
                   message.category === 'negotiation' ? 'Négociation' :
                   message.category === 'technical' ? 'Technique' : 'Général'}
                </span>
              </div>
            )}

            {/* Message Content */}
            <div className="text-sm whitespace-pre-wrap">
              {message.content.split('**').map((part, i) =>
                i % 2 === 1 ? <strong key={i}>{part}</strong> : part
              )}
            </div>

            {/* Suggestions */}
            {!isUser && message.suggestions && message.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-white/10">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => onSuggestionClick?.(suggestion)}
                    className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

            {/* Actions */}
            {!isUser && (
              <div className="flex items-center gap-2 mt-3 pt-2 border-t border-white/5">
                <button
                  onClick={handleCopy}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title="Copier"
                >
                  {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <div className="flex-1" />
                <button
                  onClick={() => onFeedback?.(message.id, 'positive')}
                  className={clsx(
                    'p-1 transition-colors',
                    message.feedback === 'positive' ? 'text-green-400' : 'text-gray-500 hover:text-green-400'
                  )}
                  title="Utile"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onFeedback?.(message.id, 'negative')}
                  className={clsx(
                    'p-1 transition-colors',
                    message.feedback === 'negative' ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
                  )}
                  title="Pas utile"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function QuoteAIAssistant({
  context,
  isOpen,
  onClose,
  onSuggestionApply,
  position = 'right',
  className,
}: QuoteAIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<SuggestionCategory>('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage: AIMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Bonjour ! Je suis votre assistant IA pour ce devis.\n\n**Score de confiance**: ${context.trustScore}/100\n**Total**: ${context.totalTTC.toFixed(2)}€ TTC\n\nComment puis-je vous aider ?`,
        timestamp: new Date(),
        suggestions: ['Analyse du devis', 'Points d\'attention', 'Conseils négociation'],
        category: 'general',
      };
      setMessages([welcomeMessage]);
    }
  }, [isOpen, context.trustScore, context.totalTTC, messages.length]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback((text: string) => {
    if (!text.trim()) return;

    // Add user message
    const userMessage: AIMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Add typing indicator
    const typingId = `typing_${Date.now()}`;
    setMessages(prev => [...prev, {
      id: typingId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isTyping: true,
    }]);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(text, context);
      setMessages(prev => prev.filter(m => m.id !== typingId));

      const assistantMessage: AIMessage = {
        id: `assistant_${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        category: response.category,
      };
      setMessages(prev => [...prev, assistantMessage]);
    }, 1000 + Math.random() * 1000);
  }, [context]);

  const handleFeedback = (messageId: string, feedback: 'positive' | 'negative') => {
    setMessages(prev =>
      prev.map(m => m.id === messageId ? { ...m, feedback } : m)
    );
  };

  const handleReset = () => {
    setMessages([]);
    // Trigger welcome message again
    setTimeout(() => {
      const welcomeMessage: AIMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `Conversation réinitialisée.\n\n**Score de confiance**: ${context.trustScore}/100\n**Total**: ${context.totalTTC.toFixed(2)}€ TTC\n\nComment puis-je vous aider ?`,
        timestamp: new Date(),
        suggestions: ['Analyse du devis', 'Points d\'attention', 'Conseils négociation'],
        category: 'general',
      };
      setMessages([welcomeMessage]);
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: position === 'right' ? 20 : 0, y: position === 'bottom' ? 20 : 0 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: position === 'right' ? 20 : 0, y: position === 'bottom' ? 20 : 0 }}
      className={clsx(
        'bg-slate-900 rounded-xl border border-white/10 shadow-2xl overflow-hidden flex flex-col',
        position === 'right' ? 'w-96 h-[500px]' : 'w-full h-80',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-purple-500/20 to-blue-500/20 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-purple-500/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-white">Assistant IA</h3>
            <p className="text-[10px] text-gray-400">Analyse de devis</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Réinitialiser"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex-1 flex flex-col min-h-0"
          >
            {/* Quick Suggestions */}
            <div className="px-3 py-2 border-b border-white/5 overflow-x-auto">
              <div className="flex gap-1">
                {(Object.keys(QUICK_SUGGESTIONS) as SuggestionCategory[]).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={clsx(
                      'px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
                      selectedCategory === cat
                        ? 'bg-purple-500/20 text-purple-400'
                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                    )}
                  >
                    {cat === 'price' ? '💰 Prix' :
                     cat === 'time' ? '⏱️ Temps' :
                     cat === 'negotiation' ? '🎯 Négo' :
                     cat === 'technical' ? '🔧 Tech' : '✨ Général'}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
                {QUICK_SUGGESTIONS[selectedCategory].map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(suggestion)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-xs text-gray-300 rounded-full transition-colors whitespace-nowrap"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onSuggestionClick={handleSendMessage}
                  onFeedback={handleFeedback}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-white/10">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(inputValue);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Posez une question..."
                  className="flex-1 px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim()}
                  className={clsx(
                    'p-2 rounded-lg transition-colors',
                    inputValue.trim()
                      ? 'bg-purple-500 hover:bg-purple-600 text-white'
                      : 'bg-slate-700 text-gray-500 cursor-not-allowed'
                  )}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================================
// FLOATING ASSISTANT BUTTON
// ============================================================================

export function AIAssistantButton({
  onClick,
  hasNewInsights = false,
  className,
}: {
  onClick: () => void;
  hasNewInsights?: boolean;
  className?: string;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={clsx(
        'relative p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-lg',
        'hover:shadow-purple-500/25 transition-shadow',
        className
      )}
    >
      <Sparkles className="w-5 h-5 text-white" />

      {/* Notification dot */}
      {hasNewInsights && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center"
        >
          <span className="text-[10px] text-white font-bold">!</span>
        </motion.div>
      )}

      {/* Pulse animation */}
      <motion.div
        animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute inset-0 bg-purple-500 rounded-full"
      />
    </motion.button>
  );
}

export default QuoteAIAssistant;
