'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useNotificationsStore, formatTimeAgo } from '@/store/useNotificationsStore';
import { useMissionEngine } from '@/store/mission-engine';
import { usePathname, useRouter } from 'next/navigation';
import RoleSwitcher from '@/components/RoleSwitcher';
import ProviderProfileEditor from '@/components/provider/ProviderProfileEditor';
import MissionWorkflow from '@/components/mission/MissionWorkflow';
import MissionPopup from '@/components/provider/MissionPopup';
import DispatchSearchingOverlay from '@/components/provider/DispatchSearchingOverlay';
import { useMissionDispatch } from '@/hooks/useMissionDispatch';
import { useMissionDispatchStore } from '@/store/useMissionDispatchStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Bell, Briefcase, UserCircle, Power, CheckCircle, AlertTriangle, MapPin, Euro } from 'lucide-react';
import { clsx } from 'clsx';
import { SIMULATED_PROFILES } from '@/constants/profiles';
import WorkerHub from '@/components/provider/WorkerHub';
import WorkerMissionsPage from '@/components/provider/WorkerMissionsPage';

const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Accueil', icon: HomeIcon, route: '/prestataire/tableau-de-bord' },
  { id: 'PROFILE', label: 'Profil', icon: UserCircle, route: '/prestataire/mon-profil' },
  { id: 'MISSIONS', label: 'Missions', icon: Briefcase, route: '/prestataire/mes-missions' },
];

export default function Home() {
  const { userRole, setUserRole, isOnAir, toggleOnAir, setIsOnAir } = useStore();
  const { notifications, syncMarkAsRead, markAllAsRead } = useNotificationsStore();
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showOnlineConfirm, setShowOnlineConfirm] = useState(false);

  const handleMissionEnd = (summary?: { title: string; venue: string; price: string }) => {
    setLastMissionSummary(summary || null);
    resetMission();
    setIsOnAir(false);
    setShowAvailabilityPrompt(true);
  };

  const handleNavClick = (route: string, itemId: string) => {
    if (status !== 'IDLE' && itemId !== 'MISSIONS') {
      setPendingRoute(route);
      setShowNavWarning(true);
      return;
    }
    router.push(route);
  };

  const {
    dispatchStatus,
    currentProposal,
    countdown,
    handleAccept,
    handleRefuse,
  } = useMissionDispatch({
    authorizedCategories: currentProfile.authorizedCategories,
    enabled: workerView === 'MISSIONS',
  });

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
    <div className="flex flex-col h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans" style={{ height: '100dvh' }}>
      {/* ── Header (compact) ──────────────────────────────── */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] z-50 bg-[var(--bg-header)] backdrop-blur-xl shrink-0" style={{ boxShadow: 'var(--shadow-card)' }}>
        <button onClick={() => { setUserRole(null); router.push('/'); }} className="text-sm font-bold tracking-wider text-[var(--text-primary)] hover:opacity-70 transition-opacity">
          HOME CHR
        </button>

        {/* Notifications */}
        <div className="relative">
          <button onClick={() => setShowNotifications(!showNotifications)} className="w-9 h-9 rounded-full bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] flex items-center justify-center transition-colors relative">
            <Bell className="w-4 h-4 text-[var(--text-secondary)]" />
            {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />}
          </button>
          <AnimatePresence>
            {showNotifications && (
              <>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowNotifications(false)} className="fixed inset-0 z-40" />
                <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.95 }} className="absolute top-full right-0 mt-2 w-80 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden backdrop-blur-xl z-50" style={{ boxShadow: 'var(--shadow-lg)' }}>
                  <div className="p-4 border-b border-[var(--border)] flex justify-between items-center">
                    <h3 className="font-bold text-sm text-[var(--text-primary)]">Notifications</h3>
                    <button onClick={markAllAsRead} className="text-xs text-blue-500 hover:text-blue-400">Tout marquer lu</button>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto">
                    {notifications.map((notif) => (
                      <div key={notif.id} onClick={() => syncMarkAsRead(notif.id)} className={clsx("p-4 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer", !notif.read && "bg-blue-500/5")}>
                        <div className="flex justify-between items-start mb-1">
                          <h4 className={clsx("text-sm font-bold", !notif.read ? "text-[var(--text-primary)]" : "text-[var(--text-muted)]")}>{notif.title}</h4>
                          <span className="text-[10px] text-[var(--text-muted)]">{formatTimeAgo(notif.time)}</span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">{notif.description}</p>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </>
              )}
            </AnimatePresence>
          </div>
      </header>

      {/* ── Content ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-6">
        {workerView === 'DASHBOARD' ? (
          <WorkerHub currentProfile={currentProfile} onGoOnline={() => setShowOnlineConfirm(true)} />
        ) : workerView === 'MISSIONS' ? (
          <div className="max-w-5xl mx-auto h-full">
            {status !== 'IDLE' ? (
              <div className="h-full w-full rounded-2xl overflow-hidden border border-[var(--border)] relative shadow-2xl bg-[var(--bg-card)]">
                <MissionWorkflow onMissionEnd={handleMissionEnd} />
              </div>
            ) : (
              <WorkerMissionsPage
                authorizedCategories={currentProfile.authorizedCategories}
                radarOverlay={
                  isAvailable ? (
                    <DispatchSearchingOverlay
                      visible={dispatchStatus === 'SEARCHING' || dispatchStatus === 'COOLDOWN' || dispatchStatus === 'PROPOSING'}
                      isCooldown={dispatchStatus === 'COOLDOWN'}
                      minimal={dispatchStatus === 'PROPOSING'}
                    />
                  ) : undefined
                }
              />
            )}
            {/* Mission proposal popup */}
            <MissionPopup
              mission={dispatchStatus === 'PROPOSING' ? currentProposal : null}
              countdown={countdown}
              onAccept={handleAccept}
              onRefuse={handleRefuse}
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

            {/* Navigation warning when mission active */}
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
          <div className="max-w-4xl mx-auto">
            <ProviderProfileEditor />
          </div>
        )}
      </div>

      {/* ── Bottom Navigation (Uber Eats style) ───────────── */}
      <nav className="shrink-0 bg-[var(--bg-card)] border-t border-[var(--border)] px-2 pb-[env(safe-area-inset-bottom)] z-50" style={{ boxShadow: '0 -4px 20px rgba(0,0,0,0.1)' }}>
        <div className="flex items-center justify-around max-w-md mx-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = workerView === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.route, item.id)}
                className={clsx(
                  "flex flex-col items-center gap-0.5 py-2.5 px-5 rounded-xl transition-all relative",
                  isActive
                    ? "text-blue-500"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-1 bg-blue-500 rounded-full"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <Icon className={clsx("w-5 h-5", isActive && "text-blue-500")} />
                <span className={clsx("text-[10px] font-bold", isActive ? "text-blue-500" : "text-[var(--text-muted)]")}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Confirmation popup before going online (global, visible from any view) ── */}
      <AnimatePresence>
        {showOnlineConfirm && (
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
                <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center border-2 border-green-500/20">
                  <Power className="w-8 h-8 text-green-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--text-primary)]">Se rendre disponible ?</h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-2 leading-relaxed">
                    En vous rendant disponible, vous serez mis en relation avec des <strong>missions immédiates</strong> dans votre zone. Vous recevrez des propositions de mission urgentes auxquelles vous devrez répondre dans les 30 secondes.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowOnlineConfirm(false);
                    useMissionDispatchStore.getState().reset();
                    setIsOnAir(true);
                    router.push('/prestataire/mes-missions');
                  }}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-sm transition-all shadow-lg shadow-green-500/20 active:scale-[0.98]"
                >
                  Oui, je suis disponible
                </button>
                <button
                  onClick={() => setShowOnlineConfirm(false)}
                  className="w-full h-12 rounded-xl border border-[var(--border)] text-[var(--text-secondary)] font-medium text-sm hover:bg-[var(--bg-hover)] transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
