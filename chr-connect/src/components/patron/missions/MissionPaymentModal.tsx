'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, CreditCard, Loader2, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import type { Stripe, StripeElementsOptions } from '@stripe/stripe-js';
import { getStripe } from '@/lib/stripe-client';
import { useAuth } from '@/contexts/AuthContext';

const PLATFORM_FEE_RATE = 0.15;

interface MissionPaymentModalProps {
  missionId: string;
  missionTitle: string;
  workerUserId: string;
  amountEuros: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MissionPaymentModal(props: MissionPaymentModalProps) {
  const { user } = useAuth();
  const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!props.isOpen) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);

      const stripePromise = getStripe();
      if (!stripePromise) {
        setError('Stripe non configuré');
        setLoading(false);
        return;
      }
      const s = await stripePromise;
      if (cancelled) return;
      setStripeInstance(s);

      if (!user?.id || !user.email) {
        setError('Session invalide');
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/stripe/payment/preauth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId: props.missionId,
            amountEuros: props.amountEuros,
            patronUserId: user.id,
            workerUserId: props.workerUserId,
            patronEmail: user.email,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Impossible de créer le paiement');
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (err: any) {
        if (!cancelled) setError(err?.message || 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen, props.missionId, props.amountEuros, props.workerUserId]);

  if (!props.isOpen) return null;

  const fee = Math.round(props.amountEuros * PLATFORM_FEE_RATE * 100) / 100;
  const workerReceives = Math.round((props.amountEuros - fee) * 100) / 100;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={props.onClose}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9998]"
      />
      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[520px] md:max-h-[90vh] md:rounded-3xl bg-[var(--bg-card)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col rounded-t-3xl"
      >
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Préautoriser le paiement</h2>
              <p className="text-xs text-[var(--text-muted)]">{props.missionTitle}</p>
            </div>
          </div>
          <button onClick={props.onClose} className="p-2 rounded-xl hover:bg-[var(--bg-hover)] transition-colors">
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div className="p-4 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Rémunération prestataire</span>
              <span className="font-bold text-[var(--text-primary)]">{workerReceives.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-muted)]">Frais plateforme (15%)</span>
              <span className="text-[var(--text-muted)]">{fee.toFixed(2)} €</span>
            </div>
            <div className="border-t border-[var(--border)] pt-2 flex justify-between">
              <span className="font-bold text-[var(--text-primary)]">Total à bloquer</span>
              <span className="font-bold text-lg text-[var(--text-primary)]">{props.amountEuros.toFixed(2)} €</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-[var(--text-muted)] p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p>
              Les fonds seront bloqués sur votre carte mais ne seront <strong>prélevés qu'après validation de la mission</strong>. En cas d'annulation, tout est libéré automatiquement.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[var(--text-muted)]" />
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!loading && !error && clientSecret && stripeInstance && (
            <Elements
              stripe={stripeInstance}
              options={{ clientSecret, appearance: { theme: 'stripe' } } as StripeElementsOptions}
            >
              <PaymentForm onSuccess={props.onSuccess} onClose={props.onClose} />
            </Elements>
          )}
        </div>
      </motion.div>
    </>
  );
}

function PaymentForm({ onSuccess, onClose }: { onSuccess?: () => void; onClose: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<'success' | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setErr(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (error) {
      setErr(error.message || 'Le paiement a échoué');
      setSubmitting(false);
      return;
    }

    if (paymentIntent?.status === 'requires_capture' || paymentIntent?.status === 'succeeded') {
      setResult('success');
      setSubmitting(false);
      onSuccess?.();
      setTimeout(() => onClose(), 1500);
      return;
    }

    setErr('État de paiement inattendu — vérifiez dans quelques secondes.');
    setSubmitting(false);
  };

  if (result === 'success') {
    return (
      <div className="py-6 text-center space-y-3">
        <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-7 h-7 text-green-500" />
        </div>
        <p className="font-bold text-[var(--text-primary)]">Paiement préautorisé</p>
        <p className="text-xs text-[var(--text-muted)]">Les fonds sont bloqués. Ils seront transférés au prestataire une fois la mission validée.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {err && (
        <p className="text-xs text-red-400 flex items-start gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{err}</span>
        </p>
      )}
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
      >
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        Confirmer et bloquer les fonds
      </button>
    </form>
  );
}
