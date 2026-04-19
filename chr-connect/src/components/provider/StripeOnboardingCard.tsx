'use client';

import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'loading' | 'not_started' | 'incomplete' | 'active' | 'error';

interface ConnectStatus {
  accountId: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirementsDue: string[];
}

export default function StripeOnboardingCard() {
  const { user, profile } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [connect, setConnect] = useState<ConnectStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startingOnboarding, setStartingOnboarding] = useState(false);

  const refreshStatus = async () => {
    if (!user?.id) return;
    setError(null);
    try {
      const res = await fetch(`/api/stripe/connect/status?userId=${user.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur de statut');
      const s: ConnectStatus = {
        accountId: data.accountId,
        chargesEnabled: data.chargesEnabled,
        payoutsEnabled: data.payoutsEnabled,
        detailsSubmitted: data.detailsSubmitted,
        requirementsDue: data.requirementsDue ?? [],
      };
      setConnect(s);
      if (!s.accountId) setStatus('not_started');
      else if (s.chargesEnabled && s.payoutsEnabled) setStatus('active');
      else setStatus('incomplete');
    } catch (err: any) {
      setError(err?.message || 'Erreur');
      setStatus('error');
    }
  };

  useEffect(() => {
    refreshStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('stripe') === 'return' || params.get('stripe') === 'refresh') {
      const url = new URL(window.location.href);
      url.searchParams.delete('stripe');
      window.history.replaceState({}, '', url.toString());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const startOnboarding = async () => {
    if (!user?.id || !user.email) return;
    setStartingOnboarding(true);
    setError(null);
    try {
      const res = await fetch('/api/stripe/connect/onboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, email: user.email }),
      });
      const data = await res.json();
      if (!res.ok || !data.onboardingUrl) throw new Error(data.error || 'Impossible de démarrer');
      window.location.href = data.onboardingUrl;
    } catch (err: any) {
      setError(err?.message || 'Erreur');
      setStartingOnboarding(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)] flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
        <span className="text-sm text-[var(--text-muted)]">Chargement...</span>
      </div>
    );
  }

  if (status === 'active') {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-green-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-[var(--text-primary)]">Paiements activés</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Vous pouvez recevoir vos rémunérations sous 48h après chaque mission
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'incomplete') {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-amber-500/30">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[var(--text-primary)]">Vérification en cours</p>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Complétez votre dossier Stripe pour recevoir des paiements (pièce d'identité, RIB, vérification bancaire).
            </p>
            {connect?.requirementsDue && connect.requirementsDue.length > 0 && (
              <div className="mt-2 text-[11px] text-amber-500">
                <p className="font-bold mb-1">Informations manquantes :</p>
                <ul className="list-disc list-inside space-y-0.5">
                  {connect.requirementsDue.slice(0, 4).map((r) => (
                    <li key={r}>{r.replace(/_/g, ' ')}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <button
          onClick={startOnboarding}
          disabled={startingOnboarding}
          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black text-sm font-bold flex items-center justify-center gap-2 transition-colors"
        >
          {startingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
          Compléter mon dossier
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-red-500/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-[var(--text-primary)]">Erreur</p>
            <p className="text-xs text-red-400 mt-0.5">{error}</p>
          </div>
          <button onClick={refreshStatus} className="text-xs text-blue-500 hover:underline">
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // not_started
  return (
    <div className="bg-[var(--bg-card)] rounded-2xl p-5 border border-[var(--border)]">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
          <CreditCard className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[var(--text-primary)]">Recevoir des paiements</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Activez vos paiements pour recevoir vos rémunérations directement sur votre compte bancaire après chaque mission.
          </p>
        </div>
      </div>
      <button
        onClick={startOnboarding}
        disabled={startingOnboarding || !user?.email}
        className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
      >
        {startingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
        Activer les paiements
      </button>
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
