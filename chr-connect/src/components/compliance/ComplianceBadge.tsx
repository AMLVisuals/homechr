'use client';

import { Shield, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import type { ComplianceStatus } from '@/types/compliance';
import { cn } from '@/lib/utils';

interface ComplianceBadgeProps {
  status: ComplianceStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  className?: string;
}

const CONFIG: Record<ComplianceStatus, {
  label: string;
  icon: typeof Shield;
  colors: string;
}> = {
  VERIFIED: {
    label: 'Vérifié',
    icon: ShieldCheck,
    colors: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  },
  PENDING: {
    label: 'En attente',
    icon: Shield,
    colors: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  },
  EXPIRED: {
    label: 'Expiré',
    icon: ShieldAlert,
    colors: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
  SUSPENDED: {
    label: 'Suspendu',
    icon: ShieldX,
    colors: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  },
};

export default function ComplianceBadge({ status, size = 'sm', showLabel = true, className }: ComplianceBadgeProps) {
  const config = CONFIG[status];
  const Icon = config.icon;
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm',
      config.colors,
      className
    )}>
      <Icon className={iconSize} />
      {showLabel && config.label}
    </span>
  );
}
