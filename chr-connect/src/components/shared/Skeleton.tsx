'use client';

import { clsx } from 'clsx';

// ---------------------------------------------------------------------------
// Base Skeleton
// ---------------------------------------------------------------------------

type SkeletonVariant = 'text' | 'circle' | 'card' | 'row';

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<SkeletonVariant, string> = {
  text: 'h-4 w-full rounded',
  circle: 'w-10 h-10 rounded-full',
  card: 'h-32 w-full rounded-xl',
  row: 'h-16 w-full rounded-xl',
};

export function Skeleton({ variant = 'text', className }: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-[var(--bg-hover)]',
        VARIANT_CLASSES[variant],
        className,
      )}
    />
  );
}

// ---------------------------------------------------------------------------
// SkeletonCard - icon area + title line + 2 description lines
// ---------------------------------------------------------------------------

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        'bg-[var(--bg-card)] rounded-xl p-4 md:p-6 border border-[var(--border)]',
        className,
      )}
    >
      <div className="flex items-start gap-4">
        {/* Icon placeholder */}
        <Skeleton variant="circle" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0" />

        <div className="flex-1 space-y-3">
          {/* Title */}
          <Skeleton className="h-4 w-2/3" />
          {/* Description lines */}
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonRow - avatar + 2 columns (for list items)
// ---------------------------------------------------------------------------

function SkeletonRow() {
  return (
    <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-4">
      {/* Avatar */}
      <Skeleton variant="circle" className="w-10 h-10 md:w-12 md:h-12 rounded-xl shrink-0" />

      {/* Text columns */}
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-3/4" />
      </div>

      {/* Right value */}
      <div className="hidden md:block space-y-2">
        <Skeleton className="h-4 w-16 ml-auto" />
        <Skeleton className="h-3 w-12 ml-auto" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonTable - 5 rows (for missions, payslips, invoices lists)
// ---------------------------------------------------------------------------

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} />
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SkeletonDashboard - 4 stat cards + a table below
// ---------------------------------------------------------------------------

export function SkeletonDashboard() {
  return (
    <div className="space-y-8">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-[var(--bg-card)] rounded-xl p-4 md:p-6 border border-[var(--border)] space-y-3"
          >
            <Skeleton variant="circle" className="w-10 h-10 rounded-xl" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>

      {/* Table rows */}
      <SkeletonTable rows={4} />
    </div>
  );
}
