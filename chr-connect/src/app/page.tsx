'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useNotificationsStore, formatTimeAgo } from '@/store/useNotificationsStore';
import { useMissionEngine } from '@/store/mission-engine';
import { usePathname, useRouter } from 'next/navigation';
import RoleSwitcher from '@/components/RoleSwitcher';
import MissionRadar from '@/components/provider/MissionRadar';
import ProviderProfileEditor from '@/components/provider/ProviderProfileEditor';
import MissionWorkflow from '@/components/mission/MissionWorkflow';
import MissionPopup from '@/components/provider/MissionPopup';
import MissionWarningPopup from '@/components/provider/MissionWarningPopup';
import DispatchSearchingOverlay from '@/components/provider/DispatchSearchingOverlay';
import { useMissionDispatch } from '@/hooks/useMissionDispatch';
import { useMissionDispatchStore } from '@/store/useMissionDispatchStore';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Bell, User, X, Briefcase, UserCircle, ChevronDown, Power, Menu, CheckCircle, AlertTriangle, MapPin, Euro, LogOut } from 'lucide-react';
import { clsx } from 'clsx';
import { SIMULATED_PROFILES } from '@/constants/profiles';
import WorkerDashboard from '@/components/provider/WorkerDashboard';

const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Tableau de bord', icon: LayoutDashboard, route: '/prestataire/tableau-de-bord', alwaysEnabled: true },
  { id: 'PROFILE', label: 'Mon Profil', icon: UserCircle, route: '/prestataire/mon-profil', alwaysEnabled: true },
  { id: 'MISSIONS', label: 'Missions', icon: Briefcase, route: '/prestataire/mes-missions', alwaysEnabled: false },
];

export default function Home() {
  const { userRole, setUserRole, isOnAir, toggleOnAir, setIsOnAir } = useStore();
  const { notifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const unreadCount = notifications.filter((n) => !n.read).length;
  const status = useMissionEngine((s) => s.status);
  const resetMission = useMissionEngine((s) => s.resetMission);
  const [showAvailabilityPrompt, setShowAvailabilityPrompt] = useState(false);
  const [lastMissionSummary, setLastMissionSummary] = useState<{ title: string; venue: string; price: string } | null>(null);
  const [showNavWarning, setShowNavWarning] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const workerView = pathname === '/prestataire/mes-missions' ? 'MISSIONS'
    : pathname === '/prestataire/tableau-de-bord' ? 'DASHBOARD'
    : 'PROFILE';

  const isAvailable = isOnAir;
  const [currentProfile, setCurrentProfile] = useState(() => {
    if (typeof window === 'undefined') return SIMULATED_PROFILES[0];
    const savedId = localStorage.getItem('chr-worker-profile');
    return SIMULATED_PROFILES.find(p => p.id === savedId) || SIMULATED_PROFILES[0];
  });
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Callback when a mission ends (STAFF or TECH) — prompt availability
  const handleMissionEnd = (summary?: { title: string; venue: string; price: string }) => {
    setLastMissionSummary(summary || null);
    resetMission();          // engine → IDLE
    setIsOnAir(false);       // prevent dispatch auto-restart
    setShowAvailabilityPrompt(true);
  };

  // Navigation guard: intercept nav when a mission is active
  const handleNavClick = (route: string, itemId: string, closeMobileMenu?: () => void) => {
    if (status !== 'IDLE' && itemId !== 'MISSIONS') {
      setPendingRoute(route);
      setShowNavWarning(true);
      if (closeMobileMenu) closeMobileMenu();
      return;
    }
    router.push(route);
    if (closeMobileMenu) closeMobileMenu();
  };

  // Mission dispatch system
  const {
    dispatchStatus,
    currentProposal,
    countdown,
    consecutiveRefusals,
    showWarning,
    suspendedUntil,
    handleAccept,
    handleRefuse,
    dismissWarning,
  } = useMissionDispatch({
    authorizedCategories: currentProfile.authorizedCategories,
    enabled: workerView === 'MISSIONS',
  });

  const isSuspended = dispatchStatus === 'SUSPENDED';

  useEffect(() => {
    if (!isAvailable && workerView === 'MISSIONS' && !showAvailabilityPrompt) {
      router.push('/prestataire/mon-profil');
    }
  }, [isAvailable, workerView, router, showAvailabilityPrompt]);

  useEffect(() => {
    if (pathname !== '/') return;
    if (userRole === 'PATRON') {
      router.replace('/patron/tableau-de-bord');
    }
    if (userRole === 'WORKER') {
      router.replace('/prestataire/tableau-de-bord');
    }
  }, [userRole, router, pathname]);

  if (!userRole) {
    return <RoleSwitcher />;
  }

  if (userRole === 'PATRON') {
    return null;
  }

  if (userRole === 'WORKER' && pathname === '/') {
    return null;
  }

  return (
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans" style={{ height: '100dvh' }}>
      {/* ── Sidebar Desktop ─────────────────────────────────── */}
      <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-[var(--border)]">
          <button onClick={() => { setUserRole(null); router.push('/'); }} className="text-lg font-bold tracking-wider text-[var(--text-primary)] hover:opacity-70 transition-opacity">
            CHR CONNECT
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const disabled = !item.alwaysEnabled && !isAvailable;
            return (
              <button
                key={item.id}
                onClick={() => !disabled && handleNavClick(item.route, item.id)}
                disabled={disabled}
                className={clsx(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  disabled
                    ? "text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                    : workerView === item.id
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/20"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border)]">
          <button onClick={() => { setUserRole(null); router.push('/'); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* ── Mobile Drawer ───────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] z-[100] lg:hidden flex flex-col shadow-2xl">
              <div className="h-16 flex items-center justify-between px-6 border-b border-[var(--border)]">
                <span className="text-lg font-bold tracking-wider text-[var(--text-primary)]">CHR CONNECT</span>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>
              <nav className="flex-1 p-4 space-y-1">
                {NAV_ITEMS.map((item) => {
                  const disabled = !item.alwaysEnabled && !isAvailable;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { if (!disabled) handleNavClick(item.route, item.id, () => setIsMobileMenuOpen(false)); }}
                      disabled={disabled}
                      className={clsx(
                        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                        disabled
                          ? "text-[var(--text-muted)] opacity-40 cursor-not-allowed"
                          : workerView === item.id
                            ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/20"
                            : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      {item.label}
                      {disabled && <span className="ml-auto text-[10px] text-[var(--text-muted)]">Hors ligne</span>}
                    </button>
                  );
                })}
              </nav>
              <div className="p-4 border-t border-[var(--border)]">
                <button onClick={() => { setUserRole(null); router.push('/'); setIsMobileMenuOpen(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all">
                  <User className="w-5 h-5" />
                  Changer de rôle
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-app)] relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[var(--border)] z-50 bg-[var(--bg-header)] backdrop-blur-xl sticky top-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto relative">
            {/* Burger mobile */}
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex-1 flex justify-center lg:justify-start items-center gap-3">
              {/* Profile specialty */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                  <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">{currentProfile.specialty}</span>
                  <ChevronDown className="w-3 h-3 text-blue-400 ml-1" />
                </button>
                <AnimatePresence>
                  {showProfileSwitcher && (
                    <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full left-0 mt-2 w-48 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden z-50 max-h-60 overflow-y-auto custom-scrollbar">
                      {SIMULATED_PROFILES.map((profile) => (
                        <button key={profile.id} onClick={() => { setCurrentProfile(profile); localStorage.setItem('chr-worker-profile', profile.id); setShowProfileSwitcher(false); }} className={clsx("w-full text-left px-4 py-3 text-sm hover:bg-[var(--bg-hover)] transition-colors", currentProfile.id === profile.id ? "text-blue-400 bg-blue-500/10 font-medium" : "text-[var(--text-secondary)]")}>
                          {profile.specialty}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Availability toggle */}
              <button
                disabled={isSuspended}
                onClick={() => {
                  if (isAvailable) {
                    // Going offline: reset dispatch
                    useMissionDispatchStore.getState().reset();
                  }
                  toggleOnAir();
                  if (!isAvailable) {
                    router.push('/prestataire/mes-missions');
                  }
                }}
                className={clsx(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full transition-all font-medium text-xs",
                  isAvailable
                    ? "bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30"
                    : "bg-[var(--bg-hover)] text-[var(--text-muted)] border border-[var(--border)] hover:bg-[var(--bg-active)]"
                )}
              >
                <Power className={clsx("w-3.5 h-3.5", isAvailable ? "text-green-400" : "")} />
                <span className="hidden sm:inline">{isAvailable ? "Disponible" : "Se rendre disponible"}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications */}
            <div className="relative">
              <button onClick={() => setShowNotifications(!showNotifications)} className="w-10 h-10 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] flex items-center justify-center transition-colors relative">
                <Bell className="w-5 h-5 text-[var(--text-secondary)]" />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden backdrop-blur-xl z-50" style={{ boxShadow: 'var(--shadow-lg)' }}>
                    <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                      <h3 className="font-bold text-sm text-[var(--text-primary)]">Notifications</h3>
                      <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-400">Tout marquer lu</button>
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.map((notif) => (
                        <div key={notif.id} onClick={() => markAsRead(notif.id)} className={clsx("p-4 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer", !notif.read && "bg-blue-500/5")}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className={clsx("text-sm font-bold", !notif.read ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{notif.title}</h4>
                            <span className="text-[10px] text-[var(--text-muted)]">{formatTimeAgo(notif.time)}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">{notif.description}</p>
                        </div>
                      ))}
                    </div>
                    <button className="w-full p-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors text-center">
                      Voir toutes les notifications
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] cursor-pointer hover:scale-105 transition-transform hidden md:block">
              <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
                <span className="font-bold text-sm text-[var(--text-primary)]">{currentProfile.name.split(' ').map(n => n[0]).join('')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8">
          {workerView === 'DASHBOARD' ? (
            <div className="max-w-7xl mx-auto">
              <WorkerDashboard currentProfile={currentProfile} />
            </div>
          ) : workerView === 'MISSIONS' ? (
            <div className="max-w-5xl mx-auto h-full">
              {status !== 'IDLE' ? (
                <div className="h-full w-full rounded-3xl overflow-hidden border border-[var(--border)] relative shadow-2xl bg-[var(--bg-card)]">
                  <MissionWorkflow onMissionEnd={handleMissionEnd} />
                </div>
              ) : (
                <div className="h-full w-full rounded-3xl overflow-hidden border border-[var(--border)] relative shadow-2xl">
                  <MissionRadar
                    authorizedCategories={currentProfile.authorizedCategories}
                  />
                  {/* Dispatch overlay — blocks map interactions during all active dispatch phases */}
                  <DispatchSearchingOverlay
                    visible={dispatchStatus === 'SEARCHING' || dispatchStatus === 'COOLDOWN' || dispatchStatus === 'PROPOSING'}
                    isCooldown={dispatchStatus === 'COOLDOWN'}
                    minimal={dispatchStatus === 'PROPOSING'}
                  />
                </div>
              )}
              {/* Mission proposal popup */}
              <MissionPopup
                mission={dispatchStatus === 'PROPOSING' ? currentProposal : null}
                countdown={countdown}
                consecutiveRefusals={consecutiveRefusals}
                onAccept={handleAccept}
                onRefuse={handleRefuse}
              />
              {/* Warning popup (3 refusals) */}
              <MissionWarningPopup
                type="warning"
                visible={showWarning}
                onDismiss={dismissWarning}
              />
              {/* Suspension popup (5 refusals) */}
              <MissionWarningPopup
                type="suspension"
                visible={isSuspended}
                suspendedUntil={suspendedUntil}
                onDismiss={() => {
                  useMissionDispatchStore.getState().reset();
                  router.push('/prestataire/tableau-de-bord');
                }}
              />

              {/* Availability prompt after mission ends */}
              <AnimatePresence>
                {showAvailabilityPrompt && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-[var(--bg-card)] rounded-2xl w-full max-w-sm p-6 space-y-5 border border-[var(--border)] shadow-2xl"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-xl font-bold text-[var(--text-primary)]">Mission terminée !</h3>
                      </div>

                      {/* Mission summary recap */}
                      {lastMissionSummary && (
                        <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-3">
                          <div className="flex items-center gap-3">
                            <Briefcase className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                            <span className="text-sm font-medium text-[var(--text-primary)] truncate">{lastMissionSummary.title}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                            <span className="text-sm text-[var(--text-secondary)]">{lastMissionSummary.venue}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Euro className="w-4 h-4 text-green-500 shrink-0" />
                            <span className="text-sm font-bold text-green-500">{lastMissionSummary.price}</span>
                          </div>
                        </div>
                      )}

                      <div className="border-t border-[var(--border)]" />

                      <p className="text-sm text-[var(--text-secondary)] text-center">
                        Voulez-vous rester disponible pour de nouvelles missions ?
                      </p>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => {
                            setIsOnAir(true);
                            setShowAvailabilityPrompt(false);
                            setLastMissionSummary(null);
                          }}
                          className="w-full h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm transition-colors shadow-lg shadow-green-900/20"
                        >
                          Oui, rester disponible
                        </button>
                        <button
                          onClick={() => {
                            setShowAvailabilityPrompt(false);
                            setLastMissionSummary(null);
                            router.push('/prestataire/tableau-de-bord');
                          }}
                          className="w-full h-12 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          Non, me déconnecter
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation warning modal when mission is active */}
              <AnimatePresence>
                {showNavWarning && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 20 }}
                      className="bg-[var(--bg-card)] rounded-2xl w-full max-w-sm p-6 space-y-5 border border-[var(--border)] shadow-2xl"
                    >
                      <div className="flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-8 h-8 text-amber-600" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-[var(--text-primary)]">Mission en cours</h3>
                          <p className="text-sm text-[var(--text-secondary)] mt-2">
                            Vous avez une mission active. Voulez-vous vraiment quitter ?
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3">
                        <button
                          onClick={() => setShowNavWarning(false)}
                          className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-900/20"
                        >
                          Rester sur la mission
                        </button>
                        <button
                          onClick={() => {
                            resetMission();
                            setIsOnAir(false);
                            setShowNavWarning(false);
                            if (pendingRoute) {
                              router.push(pendingRoute);
                              setPendingRoute(null);
                            }
                          }}
                          className="w-full h-12 rounded-xl border border-red-500/30 text-red-500 font-medium text-sm hover:bg-red-500/10 transition-colors"
                        >
                          Quitter la mission
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <ProviderProfileEditor />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
