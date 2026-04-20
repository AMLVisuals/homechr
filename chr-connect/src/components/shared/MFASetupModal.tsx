'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Copy, Check, Loader2, AlertCircle } from 'lucide-react';
import { enrollTotp, verifyTotpEnrollment, type EnrollResponse } from '@/lib/mfa';

interface MFASetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function MFASetupModal({ isOpen, onClose, onSuccess }: MFASetupModalProps) {
  const [step, setStep] = useState<'init' | 'scan' | 'verify' | 'done'>('init');
  const [enrollment, setEnrollment] = useState<EnrollResponse | null>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      startEnroll();
    } else {
      // Reset on close
      setStep('init');
      setEnrollment(null);
      setCode('');
      setError(null);
      setSecretCopied(false);
    }
  }, [isOpen]);

  async function startEnroll() {
    setLoading(true);
    setError(null);
    try {
      const data = await enrollTotp('ConnectCHR');
      setEnrollment(data);
      setStep('scan');
    } catch (err: any) {
      setError(err?.message || 'Impossible de démarrer l\'inscription MFA');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    if (!enrollment || code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      await verifyTotpEnrollment(enrollment.factorId, code);
      setStep('done');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err?.message || 'Code invalide. Vérifiez votre app authenticator.');
    } finally {
      setLoading(false);
    }
  }

  async function copySecret() {
    if (!enrollment) return;
    try {
      await navigator.clipboard.writeText(enrollment.secret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // ignore
    }
  }

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[var(--bg-app)] rounded-2xl shadow-2xl border border-[var(--border)] z-[10001] overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Shield className="w-5 h-5 text-emerald-500" />
                </div>
                <h2 className="text-lg font-bold text-[var(--text-primary)]">Activer la 2FA</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--bg-hover)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {loading && step === 'init' && (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
              )}

              {step === 'scan' && enrollment && (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Scannez ce QR code avec votre app authenticator (Google Authenticator, 1Password, Authy, etc.) ou saisissez la clé manuellement.
                  </p>

                  {/* QR Code */}
                  <div className="flex justify-center p-4 bg-white rounded-xl">
                    <div
                      className="w-48 h-48"
                      dangerouslySetInnerHTML={{ __html: enrollment.qrCode }}
                    />
                  </div>

                  {/* Clé manuelle */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] uppercase mb-1">Clé manuelle</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 px-3 py-2 bg-[var(--bg-hover)] rounded-lg text-sm font-mono break-all">
                        {enrollment.secret}
                      </code>
                      <button
                        onClick={copySecret}
                        className="p-2 rounded-lg hover:bg-[var(--bg-hover)] border border-[var(--border)]"
                        aria-label="Copier la clé"
                      >
                        {secretCopied ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <Copy className="w-4 h-4 text-[var(--text-secondary)]" />
                        )}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep('verify')}
                    className="w-full py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors"
                  >
                    J'ai ajouté le compte dans mon app
                  </button>
                </>
              )}

              {step === 'verify' && (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Entrez le code à 6 chiffres affiché par votre app authenticator.
                  </p>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-[0.5em] bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-emerald-500"
                    autoFocus
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setStep('scan')}
                      className="flex-1 py-2.5 rounded-xl bg-[var(--bg-hover)] text-[var(--text-primary)] font-semibold hover:bg-[var(--bg-active)] transition-colors"
                    >
                      Retour
                    </button>
                    <button
                      onClick={verify}
                      disabled={code.length !== 6 || loading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      Vérifier
                    </button>
                  </div>
                </>
              )}

              {step === 'done' && (
                <div className="flex flex-col items-center py-6">
                  <div className="p-4 rounded-full bg-emerald-500/10 mb-3">
                    <Check className="w-10 h-10 text-emerald-500" />
                  </div>
                  <p className="text-lg font-bold text-[var(--text-primary)]">2FA activée</p>
                  <p className="text-sm text-[var(--text-secondary)] text-center mt-1">
                    Votre compte est maintenant protégé par une authentification à deux facteurs.
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-500 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
