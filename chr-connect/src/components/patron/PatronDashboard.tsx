'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, PlusCircle, Calendar, FileText,
  Users, Settings, Bell, Search, ChevronRight,
  Wrench, ChefHat, Monitor, Hammer, Ruler,
  Clock, MapPin, Star, CreditCard, X,
  ArrowUpRight, AlertCircle, CheckCircle2, User, LogOut,
  Warehouse, QrCode, Menu, Scale, Calculator, Receipt,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateMissionWizard, type CategoryId } from '@/components/mission/CreateMissionWizard';
import { clsx } from 'clsx';
import { useStore } from '@/store/useStore';
import { useMissionEngine } from '@/store/mission-engine';
import { useCalendarStore } from '@/store/calendarStore';
import LiveMissionTracker from '@/components/mission/LiveMissionTracker';
import VenueSelector from '../venues/VenueSelector';
import VenueDashboard from '../venues/VenueDashboard';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import { Mission } from '@/types/missions';

// Icon mapping for dynamic rendering
const ICON_MAP: Record<string, any> = {
  Wrench, ChefHat, Monitor, Hammer, Users, Calendar, Scale, Calculator
};

// Equipment System
import { GaragePage } from '../equipment';

// Tabs
import MissionsTab from './tabs/MissionsTab';
import PlanningTab from './tabs/PlanningTab';
import TeamTab from './tabs/TeamTab';
import InvoicesTab from './tabs/InvoicesTab';
import PayslipsTab from './tabs/PayslipsTab';
import MissionDetailsModal from './missions/MissionDetailsModal';


const UPCOMING_MISSIONS = [
  {
    id: 'u1',
    title: 'Maintenance Préventive Clim',
    date: 'Demain, 09:00',
    expert: 'ClimExpress',
    category: 'TECHNICIENS'
  },
  {
    id: 'u2',
    title: 'Extra Serveur (x2)',
    date: 'Samedi 15 Juin, 18:00',
    expert: 'À confirmer',
    category: 'PERSONNEL'
  }
];

export default function PatronDashboard() {
  const { setUserRole } = useStore();
  const { activeVenueId, venues } = useVenuesStore();
  const { missions } = useMissionsStore();
  
  const activeVenue = venues.find(v => v.id === activeVenueId);
  const [activeTab, setActiveTab] = useState('TEAM');
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | undefined>(undefined);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showVenueDashboard, setShowVenueDashboard] = useState(false);
  const [venueDashboardView, setVenueDashboardView] = useState<'LIST' | 'SEARCH'>('LIST');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [isMissionModalOpen, setIsMissionModalOpen] = useState(false);
  const { status } = useMissionEngine(); // To detect if a mission is truly live in the engine

  const activeMissions = useMemo(() => {
    if (!activeVenueId) return [];
    
    return missions
      .filter(m => 
        m.venueId === activeVenueId && 
        ['IN_PROGRESS', 'SEARCHING', 'PENDING', 'SCHEDULED'].includes(m.status)
      )
      .slice(0, 5)
      .map(m => ({
        ...m,
        icon: ICON_MAP[m.iconName || 'Wrench'] || Wrench,
        // Ensure we have displayable strings
        displayTime: m.date || 'En cours',
        displayStatus: m.status === 'IN_PROGRESS' ? 'En cours' : 
                       m.status === 'SEARCHING' ? 'Recherche...' : 
                       m.status === 'SCHEDULED' ? 'Prévu' : 'En attente'
      }));
  }, [missions, activeVenueId]);

  const handleQuickAction = (category: string) => {
    setSelectedCategory(category as CategoryId);
    setShowNewRequestModal(true);
  };

  const handleMissionClick = (mission: Mission) => {
    setSelectedMission(mission);
    setIsMissionModalOpen(true);
  };

  const NOTIFICATIONS = [
    { id: 1, title: 'Mission Validée', desc: 'Jean D. a accepté la mission "Four Mixte"', time: 'Il y a 2 min', unread: true },
    { id: 2, title: 'Nouvelle Candidature', desc: '3 profils pour "Extra Chef de Partie"', time: 'Il y a 15 min', unread: true },
    { id: 3, title: 'Rappel Facture', desc: 'Facture #INV-2024-004 arrive à échéance', time: 'Il y a 1h', unread: false },
  ];

  return (
     <div className="flex h-screen bg-[#050505] text-white overflow-hidden font-sans">
        {/* Sidebar (Desktop) */}
        <aside className="hidden lg:flex w-64 border-r border-white/5 bg-[#0a0a0a] flex-col z-20">
           <div 
             onClick={() => setActiveTab('DASHBOARD')}
             className="h-16 flex items-center justify-start px-6 border-b border-white/5 cursor-pointer hover:bg-white/5 transition-colors"
           >
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
                C
              </div>
              <span className="ml-3 font-bold text-xl tracking-wider">CONNECT</span>
           </div>

           <nav className="flex-1 py-6 space-y-2 px-3">
              {[
                { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Mon tableau de bord' },
                { id: 'TEAM', icon: Users, label: 'Mon Équipe' },
                { id: 'PAYSLIPS', icon: Receipt, label: 'Bulletin de paie' },
                { id: 'GARAGE', icon: Warehouse, label: 'Mes équipements' },
                { id: 'INVOICES', icon: CreditCard, label: 'Mes factures' },
                { id: 'PLANNING', icon: Calendar, label: 'Planning' },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={clsx(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                    activeTab === item.id 
                      ? "bg-white/10 text-white shadow-lg shadow-white/5" 
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  )}
                >
                  <item.icon className={clsx("w-5 h-5 z-10", activeTab === item.id ? "text-blue-400" : "group-hover:text-gray-200")} />
                  <span className={clsx("font-medium text-sm z-10")}>{item.label}</span>
                  
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="activeTabDesktop"
                      className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl"
                    />
                  )}
                </button>
              ))}
           </nav>

           <div className="p-4 border-t border-white/5 space-y-2">
              <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                 <Settings className="w-5 h-5" />
                 <span className="text-sm font-medium">Paramètres</span>
              </button>
              <button 
                onClick={() => setUserRole(null)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                 <User className="w-5 h-5" />
                 <span className="text-sm font-medium">Changer Rôle</span>
              </button>
           </div>
        </aside>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <>
              {/* Backdrop */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsMobileMenuOpen(false)}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] lg:hidden"
              />
              
              {/* Drawer */}
              <motion.aside 
                initial={{ x: '-100%' }}
                animate={{ x: 0 }}
                exit={{ x: '-100%' }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 left-0 w-64 bg-[#0a0a0a] border-r border-white/10 z-[100] lg:hidden flex flex-col shadow-2xl"
              >
                 <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-xl flex items-center justify-center font-bold text-lg">
                        C
                      </div>
                      <span className="ml-3 font-bold text-xl tracking-wider">CONNECT</span>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 -mr-2 text-gray-400 hover:text-white">
                      <X className="w-5 h-5" />
                    </button>
                 </div>

                 <nav className="flex-1 py-6 space-y-2 px-3 overflow-y-auto">
                    {[
                      { id: 'DASHBOARD', icon: LayoutDashboard, label: 'Mon tableau de bord' },
                      { id: 'TEAM', icon: Users, label: 'Mon Équipe' },
                      { id: 'PAYSLIPS', icon: Receipt, label: 'Bulletin de paie' },
                      { id: 'GARAGE', icon: Warehouse, label: 'Mes équipements' },
                      { id: 'INVOICES', icon: CreditCard, label: 'Mes factures' },
                      { id: 'PLANNING', icon: Calendar, label: 'Planning' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={clsx(
                          "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                          activeTab === item.id 
                            ? "bg-white/10 text-white shadow-lg shadow-white/5" 
                            : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                        >
                        <item.icon className={clsx("w-5 h-5 z-10", activeTab === item.id ? "text-blue-400" : "group-hover:text-gray-200")} />
                        <span className="font-medium text-sm z-10">{item.label}</span>
                        
                        {activeTab === item.id && (
                          <motion.div 
                            layoutId="activeTabMobile"
                            className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-xl"
                          />
                        )}
                      </button>
                    ))}
                 </nav>

                 <div className="p-4 border-t border-white/5 space-y-2">
                    <button className="w-full flex items-center gap-3 p-3 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors">
                       <Settings className="w-5 h-5" />
                       <span className="text-sm font-medium">Paramètres</span>
                    </button>
                    <button 
                      onClick={() => setUserRole(null)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
                    >
                       <User className="w-5 h-5" />
                       <span className="text-sm font-medium">Changer Rôle</span>
                    </button>
                 </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#050505] relative">
           {/* Background Ambient Glow */}
           <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />

           {/* Header */}
           <header className="h-16 flex items-center justify-between px-4 lg:px-8 border-b border-white/5 z-50 bg-[#050505]/80 backdrop-blur-xl sticky top-0 shadow-lg shadow-black/10">
               <div className="flex items-center gap-4 lg:gap-6 w-full lg:w-auto relative">
                  {/* Mobile Menu Toggle */}
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="lg:hidden absolute left-0 p-2 -ml-2 text-gray-400 hover:text-white relative z-10"
                  >
                    <Menu className="w-6 h-6" />
                  </button>
 
                  {/* Venue Selector - Centered on mobile */}
                  <div className="flex-1 flex justify-center lg:justify-start">
                     <VenueSelector 
                        onAddVenue={() => {
                           setVenueDashboardView('SEARCH');
                           setShowVenueDashboard(true);
                        }}
                        onManage={() => {
                           setVenueDashboardView('LIST');
                           setShowVenueDashboard(true);
                        }}
                     />
                  </div>
               </div>

               <div className="flex items-center gap-4">
                 <div className="relative hidden md:block">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input 
                      type="text" 
                      placeholder="Rechercher..." 
                      className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all w-64"
                    />
                 </div>
                 
                 <div className="relative">
                    <button 
                       onClick={() => setShowNotifications(!showNotifications)}
                       className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors relative"
                    >
                       <Bell className="w-5 h-5 text-gray-300" />
                       <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-[#050505]" />
                    </button>

                    <AnimatePresence>
                       {showNotifications && (
                          <motion.div
                             initial={{ opacity: 0, y: 10, scale: 0.95 }}
                             animate={{ opacity: 1, y: 0, scale: 1 }}
                             exit={{ opacity: 0, y: 10, scale: 0.95 }}
                             className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl z-50"
                          >
                             <div className="p-4 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-bold text-sm">Notifications</h3>
                                <button className="text-xs text-blue-400 hover:text-blue-300">Tout marquer lu</button>
                             </div>
                             <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                                {NOTIFICATIONS.map((notif) => (
                                   <div key={notif.id} className={clsx("p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer", notif.unread ? "bg-blue-500/5" : "")}>
                                      <div className="flex justify-between items-start mb-1">
                                         <h4 className={clsx("text-sm font-bold", notif.unread ? "text-white" : "text-gray-400")}>{notif.title}</h4>
                                         <span className="text-[10px] text-gray-500">{notif.time}</span>
                                      </div>
                                      <p className="text-xs text-gray-400">{notif.desc}</p>
                                   </div>
                                ))}
                             </div>
                             <button className="w-full p-3 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-colors text-center">
                                Voir toutes les notifications
                             </button>
                          </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
                 
                 <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 p-[1px] cursor-pointer hover:scale-105 transition-transform hidden md:block">
                    <div className="w-full h-full rounded-full bg-black flex items-center justify-center overflow-hidden">
                       <span className="font-bold text-sm">LF</span>
                    </div>
                 </div>
              </div>
           </header>
           
           {/* Content Scroll Area */}
            <div className={clsx("flex-1 overflow-y-auto custom-scrollbar", activeTab === 'GARAGE' ? "p-0" : (['PLANNING', 'INVOICES', 'PAYSLIPS'].includes(activeTab) ? "p-0 lg:p-8" : "p-4 lg:p-8"))}>
               {activeTab === 'DASHBOARD' && (
                 <div className="max-w-7xl mx-auto space-y-10">
                    
                    {/* Hero / Quick Actions */}
                    <section>
                       <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-6 md:mb-6 gap-4">
                          <div className="text-center md:text-left w-full md:w-auto">
                             <h2 className="text-2xl md:text-3xl font-bold mb-2 md:mb-2 bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">Nouvelle Demande</h2>
                             <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">De quoi avez-vous besoin aujourd'hui ?</p>
                          </div>
                          <Button 
                             onClick={() => setShowNewRequestModal(true)}
                             className="hidden md:flex bg-white text-black hover:bg-gray-200 font-bold rounded-full px-6"
                          >
                             <PlusCircle className="w-5 h-5 mr-2" />
                             Autre demande
                          </Button>
                       </div>

                       <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
                          {[
                             { id: 'PERSONNEL', label: 'Personnel / Extra', desc: 'Renforts salle et cuisine', icon: Users, color: 'from-purple-500 to-pink-500' },
                             { id: 'TECHNICIENS', label: 'Techniciens', desc: 'Maintenance et équipements', icon: Wrench, color: 'from-orange-500 to-red-500' },
                             { id: 'BATIMENTS', label: 'Bâtiments', desc: 'Rénovation et construction', icon: Hammer, color: 'from-emerald-500 to-teal-500' },
                             { id: 'COMPTABILITE', label: 'Comptabilité', desc: 'Gestion financière', icon: Calculator, color: 'from-blue-500 to-cyan-500' },
                             { id: 'JURIDIQUE', label: 'Juridique', desc: 'Conseil et conformité', icon: Scale, color: 'from-amber-500 to-yellow-500' },
                          ].map((cat) => (
                             <motion.button
                                key={cat.id}
                                whileHover={{ y: -5, scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => handleQuickAction(cat.id)}
                                className="relative h-32 md:h-48 rounded-2xl md:rounded-3xl overflow-hidden group text-left p-4 md:p-6 flex flex-col justify-between bg-[#1a1a1a] border border-white/5 hover:border-white/20 transition-all shadow-xl"
                             >
                                <div className={clsx("absolute top-0 right-0 w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br opacity-10 blur-2xl rounded-full -mr-8 -mt-8 md:-mr-10 md:-mt-10 transition-opacity group-hover:opacity-20", cat.color)} />
                                
                                <div className={clsx("w-8 h-8 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg", cat.color)}>
                                   <cat.icon className="w-4 h-4 md:w-6 md:h-6 text-white" />
                                </div>
                                
                                <div>
                                   <h3 className="text-sm md:text-xl font-bold text-white mb-0.5 md:mb-1 group-hover:translate-x-1 transition-transform">{cat.label}</h3>
                                   <p className="text-xs md:text-sm text-gray-400 truncate">{cat.desc}</p>
                                </div>
                                
                                <div className="absolute bottom-3 right-3 md:bottom-4 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 hidden md:block">
                                   <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                      <ArrowUpRight className="w-4 h-4 text-white" />
                                   </div>
                                </div>
                             </motion.button>
                          ))}
                       </div>
                    </section>

                    {/* Garage Virtuel Quick Access */}
                    <section>
                       <motion.button
                          onClick={() => setActiveTab('GARAGE')}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          className="w-full p-6 rounded-3xl bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
                       >
                          <div className="flex items-center justify-between">
                             <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                   <QrCode className="w-7 h-7 text-white" />
                                </div>
                                <div className="text-left">
                                   <h3 className="text-xl font-bold text-white mb-1">Garage Virtuel</h3>
                                   <p className="text-gray-400 text-sm">Gérez vos équipements et déclarez les pannes en un scan</p>
                                </div>
                             </div>
                             <ChevronRight className="w-6 h-6 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                          </div>
                       </motion.button>
                    </section>

                    {/* Dashboard Widgets Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                       {/* Left Column (Missions) */}
                       <div className="lg:col-span-2 space-y-8">
                          
                          {/* Active Missions */}
                          <section>
                             <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                   <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                   En cours
                                </h3>
                                <button onClick={() => setActiveTab('MISSIONS')} className="text-sm text-blue-400 hover:text-blue-300 font-medium">Tout voir</button>
                             </div>

                             <div className="space-y-4">
                                {/* If we have a LIVE mission in the engine, show the tracker */}
                                {status !== 'IDLE' && (
                                   <div className="bg-[#1a1a1a] rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
                                      <div className="p-4 bg-blue-600/10 border-b border-blue-500/10 flex justify-between items-center">
                                         <div className="flex items-center gap-3">
                                            <span className="px-2 py-1 rounded bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider">Live</span>
                                            <span className="font-bold text-blue-100">Suivi Temps Réel</span>
                                         </div>
                                      </div>
                                      <div className="h-64 relative">
                                         <LiveMissionTracker />
                                      </div>
                                   </div>
                                )}

                                {activeMissions.map((mission) => (
                                   <div key={mission.id} 
                                      onClick={() => handleMissionClick(mission as Mission)}
                                      className="bg-[#1a1a1a] p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all flex items-center gap-4 group cursor-pointer"
                                   >
                                      <div className={clsx("w-12 h-12 rounded-xl flex items-center justify-center bg-opacity-10", 
                                         mission.color === 'blue' ? "bg-blue-500 text-blue-500" : "bg-orange-500 text-orange-500"
                                      )}>
                                         <mission.icon className="w-6 h-6" />
                                      </div>
                                      <div className="flex-1">
                                         <h4 className="font-bold text-white group-hover:text-blue-400 transition-colors">{mission.title}</h4>
                                         <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                            <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {mission.expert}</span>
                                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                                            <span className="text-gray-500">{mission.displayTime}</span>
                                         </div>
                                      </div>
                                      <div className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium">
                                         {mission.displayStatus}
                                      </div>
                                   </div>
                                ))}
                             </div>
                          </section>

                       </div>

                       {/* Right Column (Planning & Stats) */}
                       <div className="space-y-8">
                          
                          {/* Stats Card */}
                          <div className="bg-gradient-to-br from-[#1a1a1a] to-[#111] p-6 rounded-3xl border border-white/5 shadow-xl relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-3xl rounded-full -mr-10 -mt-10" />
                             
                             <h3 className="font-bold text-gray-400 mb-6 uppercase text-xs tracking-wider">Activité du mois</h3>
                             
                             <div className="flex items-baseline gap-2 mb-1">
                                <span className="text-4xl font-bold text-white">2,450€</span>
                                <span className="text-sm text-green-400 font-medium">+12%</span>
                             </div>
                             <p className="text-sm text-gray-500 mb-6">Dépensé en Juin</p>
                             
                             <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-3">
                                   <div className="text-2xl font-bold text-white mb-1">8</div>
                                   <div className="text-xs text-gray-400">Missions</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                   <div className="text-2xl font-bold text-white mb-1">4.9</div>
                                   <div className="text-xs text-gray-400">Note Moy.</div>
                                </div>
                             </div>
                          </div>

                          {/* Upcoming */}
                          <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 overflow-hidden">
                             <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <h3 className="font-bold">À Venir</h3>
                                <Calendar className="w-4 h-4 text-gray-500" />
                             </div>
                             <div className="divide-y divide-white/5">
                                {UPCOMING_MISSIONS.map((mission) => (
                                   <div key={mission.id} onClick={() => setActiveTab('PLANNING')} className="p-4 hover:bg-white/5 transition-colors cursor-pointer">
                                      <div className="flex items-start gap-3">
                                         <div className="flex flex-col items-center justify-center w-10 h-10 bg-white/5 rounded-lg border border-white/5 text-xs font-bold text-gray-400">
                                            <span>JUIN</span>
                                            <span className="text-white text-sm">15</span>
                                         </div>
                                         <div>
                                            <h4 className="font-bold text-sm text-white mb-1">{mission.title}</h4>
                                            <p className="text-xs text-gray-500 flex items-center gap-1">
                                               <Clock className="w-3 h-3" /> {mission.date.split(', ')[1]}
                                            </p>
                                         </div>
                                      </div>
                                   </div>
                                ))}
                             </div>
                             <button onClick={() => setActiveTab('PLANNING')} className="w-full py-3 text-xs font-bold text-gray-500 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-wider">
                                Voir tout le planning
                             </button>
                          </div>

                       </div>
                    </div>

                 </div>
              )}
              
              {activeTab === 'GARAGE' && (
                <GaragePage
                  venueId={activeVenue?.id || 'v1'}
                  ownerId="patron_001"
                  venueName={activeVenue?.name}
                  onBack={() => setActiveTab('TEAM')}
                />
              )}
              {activeTab === 'MISSIONS' && <MissionsTab onMissionClick={(m) => console.log(m)} />}
              {activeTab === 'PLANNING' && <PlanningTab />}
              {activeTab === 'TEAM' && <TeamTab />}
              {activeTab === 'PAYSLIPS' && <PayslipsTab />}
              {activeTab === 'INVOICES' && <InvoicesTab />}

           </div>
        </div>

        {/* New Request Modal - Asset-First Wizard */}
        <AnimatePresence>
          {showNewRequestModal && (
            <CreateMissionWizard
               key="mission-wizard"
               isOpen={true}
               onClose={() => {
                 setShowNewRequestModal(false);
                 setSelectedCategory(undefined);
               }}
               defaultCategory={selectedCategory}
            />
          )}
        </AnimatePresence>

        {/* Mission Details Modal - Real-time GPS view */}
        <AnimatePresence>
          {isMissionModalOpen && selectedMission && (
            <MissionDetailsModal
               mission={missions.find(m => m.id === selectedMission.id) || selectedMission}
               isOpen={isMissionModalOpen}
               onClose={() => {
                 setIsMissionModalOpen(false);
                 setSelectedMission(null);
               }}
            />
          )}
        </AnimatePresence>

        {/* Venue Dashboard Modal */}
        <AnimatePresence>
           {showVenueDashboard && (
              <VenueDashboard 
                 onClose={() => setShowVenueDashboard(false)} 
                 initialView={venueDashboardView}
              />
           )}
        </AnimatePresence>
     </div>
  )
}
