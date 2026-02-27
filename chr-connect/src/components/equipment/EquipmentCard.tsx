'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  Cog,
  AlertCircle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Equipment, EquipmentCategory, EquipmentStatus } from '@/types/equipment';
import { EQUIPMENT_STATUS_INFO } from '@/types/equipment';
import { EQUIPMENT_CATEGORIES_DETAILS } from '@/constants/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface EquipmentCardProps {
  equipment: Equipment;
  onClick?: () => void;
  compact?: boolean;
}

// ============================================================================
// ICON MAPPING
// ============================================================================

const StatusIcon: Record<EquipmentStatus, React.ElementType> = {
  OPERATIONAL: CheckCircle2,
  WARNING: Clock,
  FAULT: AlertCircle,
  MAINTENANCE: Wrench,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function EquipmentCard({ equipment, onClick, compact = false }: EquipmentCardProps) {
  const Icon = EQUIPMENT_CATEGORIES_DETAILS.find(c => c.id === equipment.category)?.iconComponent || Cog;
  const StatusIconComponent = StatusIcon[equipment.status];
  const statusInfo = EQUIPMENT_STATUS_INFO[equipment.status];

  // Get display name
  const displayName = equipment.nickname || `${equipment.brand} ${equipment.model}`;

  // Calculate warranty status with progress
  const warrantyInfo = React.useMemo(() => {
    if (!equipment.warrantyExpiry) return null;
    const expiry = new Date(equipment.warrantyExpiry);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate progress if start date is available
    let progress = 0;
    const startDateStr = equipment.purchaseDate || equipment.installationDate || equipment.createdAt;
    if (startDateStr) {
      const start = new Date(startDateStr);
      const totalDuration = expiry.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      
      if (totalDuration > 0) {
        // Calculate remaining percentage instead of elapsed
        // New (0 elapsed) -> 100% remaining
        // Expired (elapsed >= total) -> 0% remaining
        const elapsedPercentage = (elapsed / totalDuration) * 100;
        progress = Math.max(0, Math.min(100, 100 - elapsedPercentage));
      } else {
        progress = 0;
      }
    }

    if (daysUntilExpiry < 0) return { status: 'expired' as const, days: Math.abs(daysUntilExpiry), progress: 0 };
    if (daysUntilExpiry < 90) return { status: 'expiring_soon' as const, days: daysUntilExpiry, progress };
    return { status: 'active' as const, days: daysUntilExpiry, progress };
  }, [equipment.warrantyExpiry, equipment.purchaseDate, equipment.installationDate, equipment.createdAt]);

  if (compact) {
    return (
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          'w-full p-4 rounded-xl border text-left transition-all',
          'bg-[var(--bg-hover)] hover:bg-[var(--bg-active)]',
          equipment.status === 'FAULT'
            ? 'border-red-500/30'
            : equipment.status === 'WARNING'
              ? 'border-yellow-500/30'
              : 'border-[var(--border)]'
        )}
      >
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              statusInfo.bgColor
            )}
          >
            <Icon className={cn('w-5 h-5', statusInfo.color)} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[var(--text-primary)] font-medium truncate">{displayName}</p>
            <p className="text-[var(--text-muted)] text-sm truncate">{equipment.location}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusIconComponent className={cn('w-4 h-4', statusInfo.color)} />
            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
          </div>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'relative w-full rounded-2xl overflow-hidden text-left transition-all group',
        'bg-gradient-to-br from-white/[0.08] to-white/[0.02]',
        'border hover:border-[var(--border-strong)]',
        equipment.status === 'FAULT'
          ? 'border-red-500/40'
          : equipment.status === 'WARNING'
            ? 'border-yellow-500/40'
            : 'border-[var(--border)]'
      )}
    >
      {/* Image or Placeholder */}
      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
        {equipment.photos.length > 0 ? (
          <img
            src={equipment.photos[0].url}
            alt={displayName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon className="w-16 h-16 text-[var(--text-muted)]" />
          </div>
        )}

        {/* Status Badge */}
        <div
          className={cn(
            'absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 backdrop-blur-md',
            statusInfo.bgColor,
            statusInfo.color
          )}
        >
          <StatusIconComponent className="w-3.5 h-3.5" />
          {statusInfo.label}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md text-xs text-[var(--text-secondary)]">
          {EQUIPMENT_CATEGORIES_DETAILS.find(c => c.id === equipment.category)?.label || equipment.category}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Brand */}
        <div className="mb-3">
          <h3 className="text-[var(--text-primary)] font-semibold text-lg truncate group-hover:text-blue-300 transition-colors">
            {displayName}
          </h3>
          <p className="text-[var(--text-muted)] text-sm">
            {equipment.brand} {equipment.model}
          </p>
        </div>

        {/* Location */}
        <div className="flex items-center gap-2 text-[var(--text-muted)] text-sm mb-3">
          <MapPin className="w-4 h-4" />
          <span>{equipment.location}</span>
        </div>

        {/* Footer Stats */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border)]">
          {warrantyInfo ? (
            <>
              <div className="flex items-center gap-2">
                <div className="w-16 h-1.5 bg-[var(--bg-active)] rounded-full overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      warrantyInfo.status === 'active'
                        ? 'bg-green-500'
                        : warrantyInfo.status === 'expiring_soon'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    )}
                    style={{ width: `${warrantyInfo.progress}%` }}
                  />
                </div>
                <span className="text-xs text-[var(--text-muted)]">{Math.round(warrantyInfo.progress)}%</span>
              </div>

              <span
                className={cn(
                  'text-xs px-2 py-1 rounded-full',
                  warrantyInfo.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : warrantyInfo.status === 'expiring_soon'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-red-500/20 text-red-400'
                )}
              >
                {warrantyInfo.status === 'active'
                  ? 'Sous garantie'
                  : warrantyInfo.status === 'expiring_soon'
                    ? 'Expire bientôt'
                    : 'Garantie expirée'}
              </span>
            </>
          ) : equipment.healthScore !== undefined ? (
            <div className="flex items-center gap-2">
              <div className="w-16 h-1.5 bg-[var(--bg-active)] rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all',
                    equipment.healthScore >= 80
                      ? 'bg-green-500'
                      : equipment.healthScore >= 60
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  )}
                  style={{ width: `${equipment.healthScore}%` }}
                />
              </div>
              <span className="text-xs text-[var(--text-muted)]">{equipment.healthScore}%</span>
            </div>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">Aucune garantie</span>
          )}
        </div>

        {/* Serial Number (subtle) */}
        {equipment.serialNumber && (
          <p className="text-[var(--text-muted)] text-xs font-mono mt-2 truncate">
            S/N: {equipment.serialNumber}
          </p>
        )}
      </div>

      {/* Fault Indicator Pulse */}
      {equipment.status === 'FAULT' && (
        <div className="absolute top-3 right-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
        </div>
      )}
    </motion.button>
  );
}

// ============================================================================
// SKELETON COMPONENT
// ============================================================================

export function EquipmentCardSkeleton({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className="w-full p-4 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] animate-pulse" />
          <div className="flex-1">
            <div className="h-4 w-32 bg-[var(--bg-active)] rounded animate-pulse mb-2" />
            <div className="h-3 w-24 bg-[var(--bg-active)] rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border)] bg-[var(--bg-hover)]">
      <div className="aspect-[4/3] bg-[var(--bg-active)] animate-pulse" />
      <div className="p-4">
        <div className="h-5 w-40 bg-[var(--bg-active)] rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-[var(--bg-active)] rounded animate-pulse mb-3" />
        <div className="h-4 w-24 bg-[var(--bg-active)] rounded animate-pulse mb-3" />
        <div className="pt-3 border-t border-[var(--border)] flex justify-between">
          <div className="h-3 w-20 bg-[var(--bg-active)] rounded animate-pulse" />
          <div className="h-5 w-24 bg-[var(--bg-active)] rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}
