'use client';

import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="py-16 px-8 text-center"
    >
      <div className="bg-[var(--bg-hover)] p-4 rounded-2xl inline-flex mb-5">
        <Icon className="w-7 h-7 text-[var(--text-muted)]" />
      </div>

      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
        {title}
      </h3>

      <p className="text-sm text-[var(--text-muted)] max-w-xs mx-auto mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 transition-all shadow-lg shadow-blue-900/20"
        >
          {actionLabel}
        </button>
      )}
    </motion.div>
  );
}
