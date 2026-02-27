'use client';

import { clsx } from 'clsx';

interface PremiumBadgeProps {
  size?: 'sm' | 'md';
  className?: string;
}

export default function PremiumBadge({ size = 'sm', className }: PremiumBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-bold uppercase tracking-wider bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-full',
        size === 'sm' ? 'text-[9px] px-1.5 py-0.5' : 'text-[10px] px-2 py-0.5',
        className
      )}
    >
      PRO
    </span>
  );
}
