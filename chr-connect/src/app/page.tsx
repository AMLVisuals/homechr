'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { useMissionEngine } from '@/store/mission-engine';
import RoleSwitcher from '@/components/RoleSwitcher';
import UniversalRequestModal from '@/components/UniversalRequestModal';
import MissionRadar from '@/components/provider/MissionRadar';
import ProviderProfileEditor from '@/components/provider/ProviderProfileEditor';
import MissionWorkflow from '@/components/mission/MissionWorkflow';
import LiveMissionTracker from '@/components/mission/LiveMissionTracker';
import PatronDashboard from '@/components/patron/PatronDashboard';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, Bell, Settings, User, X, Briefcase, UserCircle, ChevronDown, PlayCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/button';
import { SIMULATED_PROFILES } from '@/constants/profiles';

export default function Home() {
  const { userRole, setUserRole } = useStore();
  const { status, startMission } = useMissionEngine();
  const [showNotifications, setShowNotifications] = useState(false);
  const [workerView, setWorkerView] = useState<'MISSIONS' | 'PROFILE'>('MISSIONS');
  
  // State for simulated user profile
  const [currentProfile, setCurrentProfile] = useState(SIMULATED_PROFILES[0]);
  const [showProfileSwitcher, setShowProfileSwitcher] = useState(false);

  if (!userRole) {
    return <RoleSwitcher />;
  }

  if (userRole === 'PATRON') {
    return <PatronDashboard />;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col">
      {/* Navbar */}
      <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 glass sticky top-0 z-50">
        <div className="text-xl font-bold tracking-wider">CHR CONNECT</div>
        <div className="flex items-center gap-4 relative">
             <div className="relative">
               <button 
                 onClick={() => setShowProfileSwitcher(!showProfileSwitcher)}
                 className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors"
               >
                 <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                 <span className="text-blue-400 text-xs font-bold uppercase tracking-wider">{currentProfile.specialty}</span>
                 <ChevronDown className="w-3 h-3 text-blue-400 ml-1" />
               </button>

               <AnimatePresence>
                 {showProfileSwitcher && (
                   <motion.div
                     initial={{ opacity: 0, y: 10, scale: 0.95 }}
                     animate={{ opacity: 1, y: 0, scale: 1 }}
                     exit={{ opacity: 0, y: 10, scale: 0.95 }}
                     className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50"
                   >
                     {SIMULATED_PROFILES.map((profile) => (
                       <button
                         key={profile.id}
                         onClick={() => {
                           setCurrentProfile(profile);
                           setShowProfileSwitcher(false);
                         }}
                         className={clsx(
                           "w-full text-left px-4 py-3 text-sm hover:bg-white/5 transition-colors",
                           currentProfile.id === profile.id ? "text-blue-400 bg-blue-500/10 font-medium" : "text-gray-300"
                         )}
                       >
                         {profile.specialty}
                       </button>
                     ))}
                   </motion.div>
                 )}
               </AnimatePresence>
             </div>

           <button 
             onClick={() => setShowNotifications(!showNotifications)}
             className="p-2 hover:bg-white/10 rounded-full transition-colors relative"
           >
             <Bell className="w-5 h-5" />
             <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full" />
           </button>
           
           <AnimatePresence>
             {showNotifications && (
               <motion.div 
                 initial={{ opacity: 0, y: 10, scale: 0.95 }}
                 animate={{ opacity: 1, y: 0, scale: 1 }}
                 exit={{ opacity: 0, y: 10, scale: 0.95 }}
                 className="absolute top-full right-0 mt-2 w-80 bg-[#1a1a1a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50"
               >
                 <div className="p-4 border-b border-white/10 flex justify-between items-center">
                   <h3 className="font-bold">Notifications</h3>
                   <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-gray-400" /></button>
                 </div>
                 <div className="max-h-80 overflow-y-auto">
                   <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                     <div className="flex gap-3">
                       <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
                       <div>
                         <p className="text-sm font-medium">Expert en route</p>
                         <p className="text-xs text-gray-400 mt-1">L'expert Plombier arrivera dans 15 min.</p>
                         <p className="text-[10px] text-gray-500 mt-2">Il y a 2 min</p>
                       </div>
                     </div>
                   </div>
                   <div className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                     <div className="flex gap-3">
                       <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shrink-0" />
                       <div>
                         <p className="text-sm font-medium">Mission Terminée</p>
                         <p className="text-xs text-gray-400 mt-1">La réparation du four a été validée.</p>
                         <p className="text-[10px] text-gray-500 mt-2">Hier</p>
                       </div>
                     </div>
                   </div>
                 </div>
                 <div className="p-2 bg-black/20 text-center">
                   <button className="text-xs text-gray-400 hover:text-white font-medium">Tout marquer comme lu</button>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>

           <button 
             onClick={() => setUserRole(null)} 
             className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10"
           >
             <User className="w-4 h-4" />
             <span className="text-sm font-medium">{userRole} VIEW</span>
           </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }}
          className="h-full max-w-5xl mx-auto"
        >
             <div className="h-full flex flex-col">
                {/* Worker Navigation */}
                <div className="flex justify-center mb-6 shrink-0 relative">
                   <div className="bg-white/5 p-1 rounded-xl flex gap-1 border border-white/10">
                      <button 
                         onClick={() => setWorkerView('MISSIONS')}
                         className={clsx(
                           "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", 
                           workerView === 'MISSIONS' 
                             ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/20" 
                             : "text-gray-400 hover:text-white hover:bg-white/5"
                         )}
                      >
                         <Briefcase className="w-4 h-4" />
                         Missions
                      </button>
                      <button 
                         onClick={() => setWorkerView('PROFILE')}
                         className={clsx(
                           "px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2", 
                           workerView === 'PROFILE' 
                             ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-900/20" 
                             : "text-gray-400 hover:text-white hover:bg-white/5"
                         )}
                      >
                         <UserCircle className="w-4 h-4" />
                         Mon Profil
                      </button>
                   </div>
                </div>

                <div className="flex-1 min-h-0">
                  {workerView === 'MISSIONS' ? (
                     status !== 'IDLE' ? (
                        <div className="h-full w-full rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl bg-white text-black">
                             <MissionWorkflow />
                        </div>
                     ) : (
                        <div className="h-full w-full rounded-3xl overflow-hidden border border-white/10 relative shadow-2xl">
                           <MissionRadar authorizedCategories={currentProfile.authorizedCategories} />
                        </div>
                     )
                  ) : (
                     <ProviderProfileEditor />
                  )}
                </div>
             </div>
        </motion.div>
      </main>
    </div>
  );
}
