'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sun, Moon, Crown, ChevronRight, LogOut, Bell, BellOff, Loader2 } from 'lucide-react';
import { useStore } from '@/store/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import PremiumBadge from './PremiumBadge';
import {
  isPushSupported,
  getExistingSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push-client';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { theme, setTheme, isPremium, setPremium, setUserRole } = useStore();
  const { signOut, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [pushState, setPushState] = useState<'unsupported' | 'denied' | 'on' | 'off' | 'loading'>('loading');
  const [pushError, setPushError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!isOpen) return;
    (async () => {
      if (!isPushSupported()) {
        setPushState('unsupported');
        return;
      }
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setPushState('denied');
        return;
      }
      const sub = await getExistingSubscription();
      setPushState(sub ? 'on' : 'off');
    })();
  }, [isOpen]);

  const handleTogglePush = async () => {
    if (!user?.id) return;
    setPushError(null);
    const previous = pushState;
    setPushState('loading');
    if (previous === 'on') {
      const { ok, error } = await unsubscribeFromPush(user.id);
      if (!ok) {
        setPushError(error || 'Échec désinscription.');
        setPushState('on');
        return;
      }
      setPushState('off');
    } else {
      const { ok, error } = await subscribeToPush(user.id);
      if (!ok) {
        setPushError(error || 'Échec inscription push.');
        setPushState(typeof Notification !== 'undefined' && Notification.permission === 'denied' ? 'denied' : 'off');
        return;
      }
      setPushState('on');
    }
  };

  const handleLogout = async () => {
    onClose();
    await signOut();
    setUserRole(null);
    router.push('/');
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
          />
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm bg-[var(--bg-sidebar)] border-l border-[var(--border)] shadow-2xl z-[9999] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h2 className="text-lg font-bold text-[var(--text-primary)]">Paramètres</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">

              {/* Apparence */}
              <section>
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Apparence</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setTheme('light')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      theme === 'light'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      theme === 'light' ? 'bg-blue-500 text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                      <Sun className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-bold ${theme === 'light' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)]'}`}>Clair</span>
                  </button>

                  <button
                    onClick={() => setTheme('dark')}
                    className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                        : 'border-[var(--border)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      theme === 'dark' ? 'bg-blue-500 text-white' : 'bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                    }`}>
                      <Moon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm font-bold ${theme === 'dark' ? 'text-blue-600 dark:text-blue-400' : 'text-[var(--text-secondary)]'}`}>Sombre</span>
                  </button>
                </div>
              </section>

              {/* Abonnement */}
              <section>
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Abonnement</h3>
                <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-hover)]">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Crown className={`w-5 h-5 ${isPremium ? 'text-amber-500' : 'text-[var(--text-muted)]'}`} />
                      <span className="font-bold text-[var(--text-primary)]">
                        {isPremium ? 'Plan Premium' : 'Plan Gratuit'}
                      </span>
                      {isPremium && <PremiumBadge />}
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mb-3">
                    {isPremium
                      ? 'Vous avez accès à toutes les fonctionnalités.'
                      : 'Passez au Premium pour débloquer la création de bulletins de paie.'}
                  </p>
                  <button
                    onClick={() => setPremium(!isPremium)}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all ${
                      isPremium
                        ? 'bg-[var(--bg-active)] text-[var(--text-secondary)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10'
                        : 'bg-gradient-to-r from-amber-400 to-yellow-500 text-black hover:from-amber-300 hover:to-yellow-400'
                    }`}
                  >
                    {isPremium ? 'Rétrograder au gratuit' : 'Passer au Premium'}
                  </button>
                </div>
              </section>

              {/* Notifications */}
              <section>
                <h3 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">Notifications</h3>

                <div className="mb-3 p-3 rounded-xl border border-[var(--border)] bg-[var(--bg-hover)]">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                        {pushState === 'on' ? <Bell className="w-4 h-4 text-blue-500" /> : <BellOff className="w-4 h-4 text-[var(--text-muted)]" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--text-primary)]">Notifications push</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          {pushState === 'unsupported' && 'Non supporté par ce navigateur'}
                          {pushState === 'denied' && 'Bloqué dans les réglages du navigateur'}
                          {pushState === 'on' && 'Activées sur cet appareil'}
                          {pushState === 'off' && 'Désactivées'}
                          {pushState === 'loading' && 'Chargement...'}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={handleTogglePush}
                      disabled={pushState === 'loading' || pushState === 'unsupported' || pushState === 'denied' || !user?.id}
                      className="shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
                      aria-label="Activer les notifications push"
                    >
                      {pushState === 'loading' ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[var(--text-muted)]" />
                      ) : (
                        <div
                          className={`w-11 h-6 rounded-full relative transition-colors ${
                            pushState === 'on' ? 'bg-blue-500' : 'bg-[var(--bg-active)]'
                          }`}
                        >
                          <div
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                              pushState === 'on' ? 'translate-x-[22px]' : 'translate-x-0.5'
                            }`}
                          />
                        </div>
                      )}
                    </button>
                  </div>

                  {pushError && (
                    <p className="mt-2 text-[11px] text-red-400">{pushError}</p>
                  )}
                </div>

                <div className="space-y-2">
                  {['Missions', 'Factures', 'Bulletins de paie'].map((item) => (
                    <div key={item} className="flex items-center justify-between p-3 rounded-xl border border-[var(--border)]">
                      <span className="text-sm font-medium text-[var(--text-primary)]">{item}</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" defaultChecked className="sr-only peer" />
                        <div className="w-9 h-5 bg-[var(--bg-active)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
                      </label>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-[var(--border)] space-y-3">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-500/10 border border-red-500/20 transition-colors text-sm font-medium"
              >
                <LogOut className="w-4 h-4" />
                Déconnexion
              </button>
              <p className="text-xs text-[var(--text-muted)] text-center">ConnectCHR v1.0</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
