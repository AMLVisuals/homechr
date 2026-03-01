import Link from 'next/link';
import { Search, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-main)]">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-card)] border border-[var(--border)] p-8 text-center shadow-[var(--shadow-lg)]">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500/10">
          <Search className="h-8 w-8 text-blue-500" />
        </div>

        <p className="mb-2 text-5xl font-bold text-[var(--text-muted)]">404</p>

        <h1 className="mb-2 text-xl font-semibold text-[var(--text-primary)]">
          Page introuvable
        </h1>

        <p className="mb-8 text-sm text-[var(--text-secondary)]">
          La page que vous recherchez n&apos;existe pas ou a &eacute;t&eacute; d&eacute;plac&eacute;e.
        </p>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--bg-card)]"
        >
          <Home className="h-4 w-4" />
          Retour &agrave; l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
