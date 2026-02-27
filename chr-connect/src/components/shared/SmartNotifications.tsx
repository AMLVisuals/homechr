'use client';

// ============================================================================
// SMART NOTIFICATIONS SYSTEM
// ============================================================================
// Système de notifications intelligentes en temps réel
// Alertes contextuelles pour le créateur de devis

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
  Bell,
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Euro,
  Target,
  Lightbulb,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { clsx } from 'clsx';

// ============================================================================
// TYPES
// ============================================================================

export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'tip' | 'price_alert';

export interface SmartNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  details?: string;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  onAction?: () => void;
  dismissible?: boolean;
  autoHide?: boolean;
  autoHideDelay?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  metadata?: {
    itemId?: string;
    priceVariance?: number;
    suggestedAction?: string;
    reference?: string;
  };
}

interface SmartNotificationsProps {
  notifications: SmartNotification[];
  onDismiss: (id: string) => void;
  onAction?: (notification: SmartNotification) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxVisible?: number;
  className?: string;
}

interface NotificationCenterProps {
  notifications: SmartNotification[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  onAction?: (notification: SmartNotification) => void;
}

// ============================================================================
// NOTIFICATION ICON MAPPING
// ============================================================================

const NOTIFICATION_CONFIG: Record<NotificationType, {
  icon: React.ElementType;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  titleColor: string;
}> = {
  success: {
    icon: CheckCircle2,
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/30',
    iconColor: 'text-green-400',
    titleColor: 'text-green-400',
  },
  warning: {
    icon: AlertTriangle,
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/30',
    iconColor: 'text-yellow-400',
    titleColor: 'text-yellow-400',
  },
  error: {
    icon: AlertCircle,
    bgColor: 'bg-red-500/10',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400',
    titleColor: 'text-red-400',
  },
  info: {
    icon: Info,
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400',
    titleColor: 'text-blue-400',
  },
  tip: {
    icon: Lightbulb,
    bgColor: 'bg-purple-500/10',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400',
    titleColor: 'text-purple-400',
  },
  price_alert: {
    icon: ShieldAlert,
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-400',
    titleColor: 'text-orange-400',
  },
};

// ============================================================================
// SINGLE NOTIFICATION TOAST
// ============================================================================

function NotificationToast({
  notification,
  onDismiss,
  onAction,
}: {
  notification: SmartNotification;
  onDismiss: () => void;
  onAction?: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  useEffect(() => {
    if (notification.autoHide) {
      const timer = setTimeout(() => {
        onDismiss();
      }, notification.autoHideDelay || 5000);
      return () => clearTimeout(timer);
    }
  }, [notification.autoHide, notification.autoHideDelay, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.95 }}
      className={clsx(
        'w-80 rounded-xl border shadow-xl overflow-hidden',
        config.bgColor,
        config.borderColor
      )}
    >
      {/* Progress bar for auto-hide */}
      {notification.autoHide && (
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: '0%' }}
          transition={{ duration: (notification.autoHideDelay || 5000) / 1000, ease: 'linear' }}
          className={clsx('h-0.5', config.iconColor.replace('text-', 'bg-'))}
        />
      )}

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={clsx('p-2 rounded-lg', config.bgColor)}>
            <Icon className={clsx('w-4 h-4', config.iconColor)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={clsx('text-sm font-medium', config.titleColor)}>
                {notification.title}
              </h4>
              {notification.dismissible !== false && (
                <button
                  onClick={onDismiss}
                  className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-[var(--text-secondary)] mt-1">{notification.message}</p>

            {/* Details */}
            {notification.details && (
              <p className="text-[10px] text-[var(--text-muted)] mt-2 p-2 bg-[var(--bg-input)] rounded">
                {notification.details}
              </p>
            )}

            {/* Price Alert Specific */}
            {notification.type === 'price_alert' && notification.metadata?.priceVariance && (
              <div className="flex items-center gap-2 mt-2">
                {notification.metadata.priceVariance > 0 ? (
                  <TrendingUp className="w-3 h-3 text-red-400" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-green-400" />
                )}
                <span className={clsx(
                  'text-xs font-medium',
                  notification.metadata.priceVariance > 0 ? 'text-red-400' : 'text-green-400'
                )}>
                  {notification.metadata.priceVariance > 0 ? '+' : ''}
                  {notification.metadata.priceVariance.toFixed(0)}% vs marché
                </span>
              </div>
            )}

            {/* Action Button */}
            {notification.actionLabel && (
              <button
                onClick={() => {
                  onAction?.();
                  notification.onAction?.();
                }}
                className={clsx(
                  'mt-3 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  config.bgColor,
                  'hover:bg-[var(--bg-active)]',
                  config.iconColor
                )}
              >
                {notification.actionLabel}
              </button>
            )}
          </div>
        </div>

        {/* Timestamp */}
        <div className="flex items-center justify-end mt-2">
          <span className="text-[10px] text-[var(--text-muted)]">
            {notification.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// NOTIFICATION TOASTS STACK
// ============================================================================

export function SmartNotifications({
  notifications,
  onDismiss,
  onAction,
  position = 'top-right',
  maxVisible = 3,
  className,
}: SmartNotificationsProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  const visibleNotifications = notifications.slice(0, maxVisible);

  return (
    <div className={clsx('fixed z-50 flex flex-col gap-3', positionClasses[position], className)}>
      <AnimatePresence mode="popLayout">
        {visibleNotifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => onDismiss(notification.id)}
            onAction={() => onAction?.(notification)}
          />
        ))}
      </AnimatePresence>

      {/* More notifications indicator */}
      {notifications.length > maxVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-xs text-[var(--text-muted)]"
        >
          +{notifications.length - maxVisible} autres notifications
        </motion.div>
      )}
    </div>
  );
}

// ============================================================================
// NOTIFICATION CENTER (Panel)
// ============================================================================

export function NotificationCenter({
  notifications,
  onDismiss,
  onDismissAll,
  onAction,
}: NotificationCenterProps) {
  const [filter, setFilter] = useState<NotificationType | 'all'>('all');

  const filteredNotifications = notifications.filter(
    (n) => filter === 'all' || n.type === filter
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  const groupedByPriority = {
    critical: filteredNotifications.filter((n) => n.priority === 'critical'),
    high: filteredNotifications.filter((n) => n.priority === 'high'),
    medium: filteredNotifications.filter((n) => n.priority === 'medium'),
    low: filteredNotifications.filter((n) => n.priority === 'low' || !n.priority),
  };

  return (
    <div className="w-96 bg-[var(--bg-card)] rounded-xl border border-[var(--border)] shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-hover)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span className="font-medium text-[var(--text-primary)]">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {notifications.length > 0 && (
            <button
              onClick={onDismissAll}
              className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              Tout effacer
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
          {(['all', 'price_alert', 'warning', 'error', 'success', 'tip'] as const).map((type) => {
            const count = type === 'all'
              ? notifications.length
              : notifications.filter((n) => n.type === type).length;

            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={clsx(
                  'px-2 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap',
                  filter === type
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
                )}
              >
                {type === 'all' ? 'Tout' : type === 'price_alert' ? 'Prix' : type === 'warning' ? 'Alertes' : type === 'error' ? 'Erreurs' : type === 'success' ? 'Succès' : 'Conseils'}
                {count > 0 && ` (${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="py-12 text-center">
            <Bell className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
            <p className="text-sm text-[var(--text-muted)]">Aucune notification</p>
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {/* Critical Priority */}
            {groupedByPriority.critical.length > 0 && (
              <div className="bg-red-500/5">
                <div className="px-4 py-2 text-xs font-medium text-red-400 uppercase tracking-wider">
                  Critique
                </div>
                {groupedByPriority.critical.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => onDismiss(notification.id)}
                    onAction={() => onAction?.(notification)}
                  />
                ))}
              </div>
            )}

            {/* High Priority */}
            {groupedByPriority.high.length > 0 && (
              <div className="bg-orange-500/5">
                <div className="px-4 py-2 text-xs font-medium text-orange-400 uppercase tracking-wider">
                  Important
                </div>
                {groupedByPriority.high.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => onDismiss(notification.id)}
                    onAction={() => onAction?.(notification)}
                  />
                ))}
              </div>
            )}

            {/* Normal Priority */}
            {(groupedByPriority.medium.length > 0 || groupedByPriority.low.length > 0) && (
              <div>
                {[...groupedByPriority.medium, ...groupedByPriority.low].map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onDismiss={() => onDismiss(notification.id)}
                    onAction={() => onAction?.(notification)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {notifications.length > 0 && (
        <div className="px-4 py-2 border-t border-[var(--border)] bg-[var(--bg-hover)]">
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span>
              {notifications.filter((n) => n.type === 'price_alert').length} alertes prix
            </span>
            <span>
              {notifications.filter((n) => n.type === 'tip').length} conseils IA
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// NOTIFICATION LIST ITEM
// ============================================================================

function NotificationItem({
  notification,
  onDismiss,
  onAction,
}: {
  notification: SmartNotification;
  onDismiss: () => void;
  onAction?: () => void;
}) {
  const config = NOTIFICATION_CONFIG[notification.type];
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      className={clsx(
        'px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer',
        !notification.read && 'bg-blue-500/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={clsx('p-1.5 rounded-lg flex-shrink-0', config.bgColor)}>
          <Icon className={clsx('w-3.5 h-3.5', config.iconColor)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className={clsx('text-sm font-medium', config.titleColor)}>
                {notification.title}
              </h4>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 line-clamp-2">
                {notification.message}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDismiss();
              }}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Price variance badge */}
          {notification.metadata?.priceVariance && (
            <div className={clsx(
              'inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded text-[10px] font-medium',
              notification.metadata.priceVariance > 20 ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
            )}>
              {notification.metadata.priceVariance > 0 ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
              {notification.metadata.priceVariance > 0 ? '+' : ''}{notification.metadata.priceVariance.toFixed(0)}%
            </div>
          )}

          {/* Action */}
          {notification.actionLabel && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAction?.();
                notification.onAction?.();
              }}
              className={clsx(
                'mt-2 text-xs font-medium',
                config.iconColor,
                'hover:underline'
              )}
            >
              {notification.actionLabel} →
            </button>
          )}

          <div className="flex items-center gap-2 mt-2 text-[10px] text-[var(--text-muted)]">
            <Clock className="w-2.5 h-2.5" />
            {notification.timestamp.toLocaleTimeString('fr-FR', {
              hour: '2-digit',
              minute: '2-digit',
            })}
            {notification.metadata?.reference && (
              <>
                <span>•</span>
                <span>{notification.metadata.reference}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================================
// NOTIFICATION HOOK
// ============================================================================

export function useSmartNotifications() {
  const [notifications, setNotifications] = useState<SmartNotification[]>([]);

  const addNotification = useCallback((notification: Omit<SmartNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: SmartNotification = {
      ...notification,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);
    return newNotification.id;
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const dismissAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  // Helper pour alertes de prix
  const addPriceAlert = useCallback((
    reference: string,
    priceVariance: number,
    currentPrice: number,
    marketPrice: number
  ) => {
    const severity = priceVariance > 30 ? 'critical' : priceVariance > 20 ? 'high' : 'medium';

    return addNotification({
      type: 'price_alert',
      title: priceVariance > 30 ? 'Prix très suspect' : 'Prix élevé détecté',
      message: `La pièce ${reference} est ${priceVariance.toFixed(0)}% au-dessus du prix marché`,
      details: `Prix devis: ${currentPrice.toFixed(2)}€ | Prix marché: ${marketPrice.toFixed(2)}€`,
      priority: severity,
      actionLabel: 'Voir les détails',
      metadata: {
        reference,
        priceVariance,
        suggestedAction: 'negotiate',
      },
      autoHide: false,
      dismissible: true,
    });
  }, [addNotification]);

  // Helper pour conseils IA
  const addAITip = useCallback((tip: string, details?: string) => {
    return addNotification({
      type: 'tip',
      title: 'Conseil IA',
      message: tip,
      details,
      priority: 'low',
      autoHide: true,
      autoHideDelay: 8000,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    dismissNotification,
    dismissAll,
    markAsRead,
    addPriceAlert,
    addAITip,
  };
}

export default SmartNotifications;
