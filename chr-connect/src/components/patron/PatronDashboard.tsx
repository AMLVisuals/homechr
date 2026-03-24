'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, PlusCircle, Calendar, FileText,
  Users, Settings, Bell, Search, ChevronRight,
  Wrench, ChefHat, Monitor, Hammer, Ruler,
  Clock, MapPin, Star, CreditCard, X,
  ArrowUpRight, AlertCircle, CheckCircle2, User, LogOut,
  Warehouse, QrCode, Menu, Scale, Receipt, Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateMissionWizard, type CategoryId } from '@/components/mission/CreateMissionWizard';
import SOSExtraLauncher from '@/components/mission/SOSExtraLauncher';
import SOSTechLauncher from '@/components/mission/SOSTechLauncher';
import { COMING_SOON_CATEGORIES } from '@/data/categories';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';
import { useNotificationsStore, formatTimeAgo } from '@/store/useNotificationsStore';
import { useMissionEngine } from '@/store/mission-engine';
import { useCalendarStore } from '@/store/calendarStore';
import LiveMissionTracker from '@/components/mission/LiveMissionTracker';
import VenueSelector from '../venues/VenueSelector';
import VenueDashboard from '../venues/VenueDashboard';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import { Mission } from '@/types/missions';
import { APP_CONFIG } from '@/config/appConfig';
import { useDocumentsStore } from '@/store/useDocumentsStore';

const ICON_MAP: Record<string, any> = {
  Wrench, ChefHat, Monitor, Hammer, Users, Calendar, Scale
};

import { GaragePage } from '../equipment';
import MissionsTab from './tabs/MissionsTab';
import PlanningTab from './tabs/PlanningTab';
import TeamTab from './tabs/TeamTab';
import InvoicesTab from './tabs/InvoicesTab';
import PayslipsTab from './tabs/PayslipsTab';
import PremiumTab from './tabs/PremiumTab';
import StockTab from './tabs/StockTab';
import DPAETab from './tabs/DPAETab';
import MissionDetailsModal from './missions/MissionDetailsModal';
import ActionAlertsBanner from './ActionAlertsBanner';
import MaintenanceAlertsBanner from './maintenance/MaintenanceAlertsBanner';
import Sidebar from './Sidebar';
import SettingsModal from '../shared/SettingsModal';

const UPCOMING_MISSIONS = [
  { id: 'u1', title: 'Maintenance Préventive Clim', date: 'Demain, 09:00', expert: 'ClimExpress', category: 'TECHNICIENS' },
  { id: 'u2', title: 'Extra Serveur (x2)', date: 'Samedi 15 Juin, 18:00', expert: 'À confirmer', category: 'PERSONNEL' },
];

export default function PatronDashboard() {
  const { setUserRole } = useStore();
  const { activeVenueId, venues } = useVenuesStore();
  const { missions } = useMissionsStore();
  const pathname = usePathname();
  const router = useRouter();

  const activeVenue = venues.find(v => v.id === activeVenueId);

  const getInitialTab = (path: string) => {
    const tabMap: Record<string, string> = {
      '/': 'DASHBOARD',
      '/patron/tableau-de-bord': 'DASHBOARD',
      '/patron/missions': 'MISSIONS',
      '/patron/mon-equipe': 'TEAM',
      '/patron/bulletins-paie': 'PAYSLIPS',
      '/patron/premium': 'PREMIUM',
      '/patron/equipements': 'GARAGE',
      '/patron/factures': 'INVOICES',
      '/patron/planning': 'PLANNING',
      '/patron/stock': 'STOCK',
      '/patron/dpae': 'DPAE',
    };
    return tabMap[path] || 'DASHBOARD';
  };

  const [activeTab, setActiveTab] = useState(() => getInitialTab(pathname));
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | undefined>(undefined);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVenueDashboard, setShowVenueDashboard] = useState(false);
  const [venueDashboardView, setVenueDashboardView] = useState<'LIST' | 'SEARCH' | 'FORM'>('LIST');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const [showSOSExtra, setShowSOSExtra] = useState(false);
  const [showSOSTech, setShowSOSTech] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { status } = useMissionEngine();
  const { team } = useMissionsStore();
  const { documents } = useDocumentsStore();

  useEffect(() => {
    setActiveTab(getInitialTab(pathname));
  }, [pathname]);

  useEffect(() => {
    const handleSetPatronTab = (e: CustomEvent) => {
      setActiveTab(e.detail);
    };

    window.addEventListener('set-patron-tab', handleSetPatronTab as EventListener);
    return () => window.removeEventListener('set-patron-tab', handleSetPatronTab as EventListener);
  }, []);

  useEffect(() => {
    const handleOpenCreateMission = () => {
      setShowNewRequestModal(true);
    };

    window.addEventListener('open-create-mission', handleOpenCreateMission);
    return () => window.removeEventListener('open-create-mission', handleOpenCreateMission);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        searchInputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeMissions = useMemo(() => {
    if (!activeVenueId) return [];
    return missions
      .filter(m => m.venueId === activeVenueId && ['IN_PROGRESS', 'SEARCHING', 'PENDING', 'SCHEDULED'].includes(m.status))
      .slice(0, 5)
      .map(m => ({
        ...m,
        icon: ICON_MAP[m.iconName || 'Wrench'] || Wrench,
        displayTime: m.date || 'En cours',
        displayStatus: m.status === 'IN_PROGRESS' ? 'En cours' : m.status === 'SEARCHING' ? 'Recherche...' : m.status === 'SCHEDULED' ? 'Prévu' : 'En attente'
      }));
  }, [missions, activeVenueId]);

  const searchResults = useMemo(() => {
    if (!globalSearch.trim()) return { missions: [], team: [], documents: [] };
    const q = globalSearch.toLowerCase();
    return {
      missions: missions.filter(m => m.title.toLowerCase().includes(q) || m.expert?.toLowerCase().includes(q)).slice(0, 4),
      team: team.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q)).slice(0, 4),
      documents: documents.filter(d => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q) || d.tags?.some(t => t.toLowerCase().includes(q))).slice(0, 4),
    };
  }, [globalSearch, missions, team, documents]);

  const hasSearchResults = searchResults.missions.length > 0 || searchResults.team.length > 0 || searchResults.documents.length > 0;

  const handleQuickAction = (category: string) => {
    if (category === 'PERSONNEL') { setShowSOSExtra(true); return; }
    if (category === 'TECHNICIENS') { setShowSOSTech(true); return; }
    setSelectedCategory(category as CategoryId); setShowNewRequestModal(true);
  };
  const handleMissionClick = (mission: Mission) => { setSelectedMission(mission); setIsMissionModalOpen(true); };
  const handleTabChange = (tab: string) => { setActiveTab(tab); setIsMobileMenuOpen(false); };

  const { notifications, syncMarkAsRead, markAllAsRead } = useNotificationsStore();
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex h-screen bg-[var(--bg-app)] text-[var(--text-primary)] overflow-hidden font-sans" style={{ height: '100dvh' }}>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 border-r border-[var(--border)] bg-[var(--bg-sidebar)] flex-col z-20">
        <Sidebar activeTab={activeTab} onSettingsClick={() => setShowSettings(true)} layoutId="activeTabDesktop" />
      </aside>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] lg:hidden" />
            <motion.aside initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed inset-y-0 left-0 w-64 bg-[var(--bg-sidebar)] border-r border-[var(--border)] z-[100] lg:hidden flex flex-col shadow-2xl">
              <div className="absolute top-4 right-4 z-10">
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X className="w-5 h-5" /></button>
              </div>
              <Sidebar activeTab={activeTab} onSettingsClick={() => { setIsMobileMenuOpen(false); setShowSettings(true); }} layoutId="activeTabMobile" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-app)] relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-[var(--border)] z-50 bg-[var(--bg-header)] backdrop-blur-xl sticky top-0" style={{ boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto relative">
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden absolute left-0 p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] relative z-10">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 flex justify-center lg:justify-start items-center gap-3">
              <VenueSelector onAddVenue={() => { setVenueDashboardView('FORM'); setShowVenueDashboard(true); }} onManage={() => { setVenueDashboardView('LIST'); setShowVenueDashboard(true); }} />
              <button
                onClick={() => { setActiveTab('PREMIUM'); router.push('/patron/premium'); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-black transition-all text-xs font-bold hover:from-amber-300 hover:to-yellow-400 shadow-sm shadow-amber-500/20"
              >
                <Crown className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Premium</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setShowMobileSearch(!showMobileSearch)} className="md:hidden p-2 rounded-full bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <div className="relative hidden md:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                className="bg-[var(--bg-input)] border border-[var(--border)] rounded-full pl-10 pr-16 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-all w-64"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:flex items-center gap-0.5 text-[10px] text-[var(--text-muted)] bg-[var(--bg-hover)] px-1.5 py-0.5 rounded border border-[var(--border)] pointer-events-none">
                Ctrl+K
              </kbd>
              {globalSearch.trim() && isSearchFocused && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden z-50 w-80">
                  {!hasSearchResults ? (
                    <div className="p-6 text-center text-[var(--text-muted)] text-sm">Aucun résultat pour "{globalSearch}"</div>
                  ) : (
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                      {searchResults.missions.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-hover)]">Missions</div>
                          {searchResults.missions.map(m => (
                            <button key={m.id} onClick={() => { setGlobalSearch(''); handleMissionClick(m); }} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3">
                              <Wrench className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{m.title}</div>
                                <div className="text-xs text-[var(--text-muted)]">{m.expert || 'En attente'}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.team.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-hover)]">Équipe</div>
                          {searchResults.team.map(m => (
                            <button key={m.id} onClick={() => { setGlobalSearch(''); setActiveTab('TEAM'); router.push('/patron/mon-equipe'); }} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3">
                              <Users className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{m.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">{m.role}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.documents.length > 0 && (
                        <div>
                          <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-hover)]">Documents</div>
                          {searchResults.documents.map(d => (
                            <button key={d.id} onClick={() => { setGlobalSearch(''); setActiveTab('INVOICES'); router.push('/patron/factures'); }} className="w-full text-left px-4 py-3 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3">
                              <FileText className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                              <div className="min-w-0">
                                <div className="text-sm font-medium text-[var(--text-primary)] truncate">{d.name}</div>
                                <div className="text-xs text-[var(--text-muted)]">{d.category}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
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
                        <div key={notif.id} onClick={() => syncMarkAsRead(notif.id)} className={clsx("p-4 border-b border-[var(--border)] hover:bg-[var(--bg-hover)] transition-colors cursor-pointer", !notif.read && "bg-blue-500/5")}>
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
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] cursor-pointer hover:scale-105 transition-transform hidden md:block">
              <div className="w-full h-full rounded-full bg-[var(--bg-card)] flex items-center justify-center overflow-hidden">
                <span className="font-bold text-sm text-[var(--text-primary)]">LF</span>
              </div>
            </div>
          </div>
        </header>

        {/* Mobile Search */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="md:hidden border-b border-[var(--border)] overflow-hidden bg-[var(--bg-card)]">
              <div className="p-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    autoFocus
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-full pl-10 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50 transition-all"
                  />
                </div>
                {globalSearch.trim() && (
                  <div className="mt-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
                    {!hasSearchResults ? (
                      <div className="p-4 text-center text-[var(--text-muted)] text-sm">Aucun résultat</div>
                    ) : (
                      <>
                        {searchResults.missions.map(m => (
                          <button key={m.id} onClick={() => { setGlobalSearch(''); setShowMobileSearch(false); handleMissionClick(m); }} className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 rounded-lg">
                            <Wrench className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                            <div className="min-w-0"><div className="text-sm font-medium text-[var(--text-primary)] truncate">{m.title}</div></div>
                          </button>
                        ))}
                        {searchResults.team.map(m => (
                          <button key={m.id} onClick={() => { setGlobalSearch(''); setShowMobileSearch(false); setActiveTab('TEAM'); router.push('/patron/mon-equipe'); }} className="w-full text-left px-3 py-2.5 hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-3 rounded-lg">
                            <Users className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                            <div className="min-w-0"><div className="text-sm font-medium text-[var(--text-primary)] truncate">{m.name}</div></div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <div className={clsx("flex-1 overflow-y-auto custom-scrollbar", ['PLANNING', 'INVOICES', 'PAYSLIPS'].includes(activeTab) ? "p-0 lg:p-8" : "p-4 lg:p-8")}>
          {activeTab === 'DASHBOARD' && (
            <div className="max-w-7xl mx-auto space-y-10">
              {/* Onboarding — shown when no missions exist */}
              {missions.length === 0 && (
                <motion.section
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-3xl p-6 md:p-10 text-center md:text-left"
                >
                  <div className="max-w-2xl mx-auto md:mx-0 space-y-4">
                    <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">
                      Bienvenue sur Home CHR
                    </h2>
                    <p className="text-[var(--text-secondary)] text-sm md:text-base leading-relaxed">
                      Commencez par configurer votre établissement, puis créez votre première demande — personnel extra, technicien, maintenance...
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2 justify-center md:justify-start">
                      <button
                        onClick={() => { setVenueDashboardView('LIST'); setShowVenueDashboard(true); }}
                        className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                      >
                        <MapPin className="w-4 h-4" />
                        Configurer mon établissement
                      </button>
                      <button
                        onClick={() => handleQuickAction('PERSONNEL')}
                        className="px-5 py-3 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold transition-colors flex items-center justify-center gap-2"
                      >
                        <PlusCircle className="w-4 h-4" />
                        Créer ma première demande
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Maintenance Alerts */}
              <MaintenanceAlertsBanner
                onCreateMission={() => {
                  setSelectedCategory('TECHNICIENS');
                  setShowNewRequestModal(true);
                }}
              />

              {/* Quick Actions */}
              <section>
                <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-6 gap-4">
                  <div className="text-center md:text-left w-full md:w-auto">
                    <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">Nouvelle Demande</h2>
                    <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 font-medium">De quoi avez-vous besoin aujourd'hui ?</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                  {[
                    { id: 'PERSONNEL', label: 'Personnel / Extra', desc: 'Renforts salle et cuisine', icon: Users, gradient: 'from-purple-500 to-pink-500' },
                    { id: 'TECHNICIENS', label: 'Techniciens', desc: 'Maintenance et équipements', icon: Wrench, gradient: 'from-orange-500 to-red-500' },
                    { id: 'BATIMENTS', label: 'Bâtiments', desc: 'Rénovation et construction', icon: Hammer, gradient: 'from-emerald-500 to-teal-500' },
                  ].map((cat) => {
                    const isComingSoon = COMING_SOON_CATEGORIES.includes(cat.id as any);
                    return (
                    <motion.button key={cat.id}
                      {...(!isComingSoon ? { whileHover: { y: -5, scale: 1.02 }, whileTap: { scale: 0.98 } } : {})}
                      onClick={() => !isComingSoon && handleQuickAction(cat.id)}
                      className={clsx("relative h-32 md:h-48 rounded-2xl md:rounded-3xl overflow-hidden group text-left p-4 md:p-6 flex flex-col justify-between border-0 transition-all bg-gradient-to-br shadow-lg", cat.gradient, isComingSoon && "opacity-50 cursor-not-allowed")}>
                      {isComingSoon && (
                        <span className="absolute top-2 right-2 text-[9px] md:text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full z-10">
                          Bientôt disponible
                        </span>
                      )}
                      <div className={clsx("w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm")}>
                        <cat.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                      </div>
                      <div>
                        <h3 className={clsx("text-sm md:text-xl font-bold mb-0.5 md:mb-1 transition-transform text-white", !isComingSoon && "group-hover:translate-x-1")}>{cat.label}</h3>
                        <p className="text-xs md:text-sm truncate text-white/70">{cat.desc}</p>
                      </div>
                      {!isComingSoon && (
                      <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><ArrowUpRight className="w-4 h-4 text-white" /></div>
                      </div>
                      )}
                    </motion.button>
                    );
                  })}
                </div>
              </section>

              {/* Garage Quick Access */}
              <section>
                <motion.button onClick={() => setActiveTab('GARAGE')} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                  className="w-full p-6 rounded-3xl bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <QrCode className="w-7 h-7 text-white" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1">Mes Équipements</h3>
                        <p className="text-[var(--text-secondary)] text-sm">Gérez vos équipements et déclarez les pannes en un scan</p>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.button>
              </section>

              {/* Action Alerts */}
              <ActionAlertsBanner
                onNavigateToMission={(missionId) => {
                  const m = missions.find(mi => mi.id === missionId);
                  if (m) handleMissionClick(m);
                }}
                onNavigateToMissions={() => { setActiveTab('MISSIONS'); router.push('/patron/missions'); }}
              />

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                  <section>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-lg flex items-center gap-2 text-[var(--text-primary)]"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> En cours</h3>
                      <button onClick={() => setActiveTab('MISSIONS')} className="text-sm text-blue-500 hover:text-blue-400 font-medium">Tout voir</button>
                    </div>
                    <div className="space-y-4">
                      {status !== 'IDLE' && (
                        <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-lg)' }}>
                          <div className="p-4 bg-blue-500/10 border-b border-blue-500/10 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">Live</span>
                              <span className="font-bold text-blue-600 dark:text-blue-300">Suivi Temps Réel</span>
                            </div>
                          </div>
                          <div className="h-64 relative"><LiveMissionTracker /></div>
                        </div>
                      )}
                      {activeMissions.map((mission) => (
                        <div key={mission.id} onClick={() => handleMissionClick(mission as Mission)} className="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border)] hover:border-[var(--border-strong)] transition-all flex items-center gap-4 group cursor-pointer" style={{ boxShadow: 'var(--shadow-card)' }}>
                          <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center", mission.color === 'blue' ? "bg-blue-500/10 text-blue-500" : "bg-orange-500/10 text-orange-500")}>
                            <mission.icon className="w-6 h-6" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-[var(--text-primary)] group-hover:text-blue-500 transition-colors">{mission.title}</h4>
                            <div className="flex items-center gap-3 text-sm text-[var(--text-secondary)] mt-1">
                              <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {mission.expert}</span>
                              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
                              <span className="text-[var(--text-muted)]">{mission.displayTime}</span>
                            </div>
                          </div>
                          <div className="px-3 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] text-xs font-medium text-[var(--text-secondary)]">{mission.displayStatus}</div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <div className="space-y-8">
                  {/* Stats */}
                  <div className="bg-[var(--bg-card)] p-6 rounded-3xl border border-[var(--border)] relative overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
                    <h3 className="font-bold text-[var(--text-muted)] mb-6 uppercase text-xs tracking-wider">Activité du mois</h3>
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-4xl font-bold text-[var(--text-primary)]">2,450€</span>
                      <span className="text-sm text-green-500 font-medium">+12%</span>
                    </div>
                    <p className="text-sm text-[var(--text-muted)] mb-6">Dépensé en Juin</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[var(--bg-hover)] rounded-xl p-3"><div className="text-2xl font-bold text-[var(--text-primary)] mb-1">8</div><div className="text-xs text-[var(--text-secondary)]">Missions</div></div>
                      <div className="bg-[var(--bg-hover)] rounded-xl p-3"><div className="text-2xl font-bold text-[var(--text-primary)] mb-1">4.9</div><div className="text-xs text-[var(--text-secondary)]">Note Moy.</div></div>
                    </div>
                  </div>
                  {/* Upcoming */}
                  <div className="bg-[var(--bg-card)] rounded-3xl border border-[var(--border)] overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                    <div className="p-5 border-b border-[var(--border)] flex justify-between items-center">
                      <h3 className="font-bold text-[var(--text-primary)]">À Venir</h3>
                      <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    </div>
                    <div className="divide-y divide-[var(--border)]">
                      {UPCOMING_MISSIONS.map((mission) => (
                        <div key={mission.id} onClick={() => setActiveTab('PLANNING')} className="p-4 hover:bg-[var(--bg-hover)] transition-colors cursor-pointer">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col items-center justify-center w-10 h-10 bg-[var(--bg-hover)] rounded-lg border border-[var(--border)] text-xs font-bold text-[var(--text-muted)]">
                              <span>JUIN</span><span className="text-[var(--text-primary)] text-sm">15</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-[var(--text-primary)] mb-1">{mission.title}</h4>
                              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><Clock className="w-3 h-3" /> {mission.date.split(', ')[1]}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setActiveTab('PLANNING')} className="w-full py-3 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors uppercase tracking-wider">Voir tout le planning</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'GARAGE' && <GaragePage venueId={activeVenue?.id || 'v1'} ownerId={APP_CONFIG.DEFAULT_OWNER_ID} venueName={activeVenue?.name} onBack={() => setActiveTab('TEAM')} />}
          {activeTab === 'MISSIONS' && <MissionsTab onMissionClick={() => {}} />}
          {activeTab === 'PLANNING' && <PlanningTab />}
          {activeTab === 'TEAM' && <TeamTab />}
          {activeTab === 'PAYSLIPS' && <PayslipsTab />}
          {activeTab === 'PREMIUM' && <PremiumTab />}
          {activeTab === 'STOCK' && <StockTab />}
          {activeTab === 'DPAE' && <DPAETab />}
          {activeTab === 'INVOICES' && <InvoicesTab />}
        </div>
      </div>

      {/* Settings */}
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />

      {/* Modals — portal-based, no AnimatePresence wrapper needed */}
      {showNewRequestModal && <CreateMissionWizard isOpen={true} onClose={() => { setShowNewRequestModal(false); setSelectedCategory(undefined); }} defaultCategory={selectedCategory} />}
      {isMissionModalOpen && selectedMission && <MissionDetailsModal mission={missions.find(m => m.id === selectedMission.id) || selectedMission} isOpen={isMissionModalOpen} onClose={() => { setIsMissionModalOpen(false); setSelectedMission(null); }} />}
      {showVenueDashboard && <VenueDashboard onClose={() => setShowVenueDashboard(false)} initialView={venueDashboardView} />}
      {showSOSExtra && <SOSExtraLauncher isOpen={true} onClose={() => setShowSOSExtra(false)} />}
      {showSOSTech && <SOSTechLauncher isOpen={true} onClose={() => setShowSOSTech(false)} />}
    </div>
  );
}
