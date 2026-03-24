'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { AlertTriangle, RotateCcw, LayoutDashboard } from 'lucide-react';

export default function PatronError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Home CHR] Erreur espace patron:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-main)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8 text-center shadow-[var(--shadow-lg)]"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>

        <h1 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Erreur - Espace Patron
        </h1>

        <p className="mb-8 text-sm text-[var(--text-secondary)]">
          Une erreur est survenue dans votre espace de gestion.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]"
          >
            <RotateCcw className="h-4 w-4" />
            R&eacute;essayer
          </button>

          <Link
            href="/patron/tableau-de-bord"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] px-5 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--bg-hover)] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]"
          >
            <LayoutDashboard className="h-4 w-4" />
            Retour au tableau de bord
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
