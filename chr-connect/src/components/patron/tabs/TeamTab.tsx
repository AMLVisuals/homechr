'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, MessageSquare, UserPlus, Trash2, Users } from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { TeamMember } from '@/types/missions';
import TeamMemberModal from '../team/TeamMemberModal';

export default function TeamTab() {
  const { team, removeTeamMember } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const filteredTeam = team.filter(member => {
    if (activeVenueId && member.venueId && member.venueId !== activeVenueId) return false;
    
    return (
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  const handleAdd = () => {
    setSelectedMember(null);
    setIsModalOpen(true);
  };

  const handleEdit = (member: TeamMember) => {
    setSelectedMember(member);
    setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Êtes-vous sûr de vouloir supprimer ce membre ?')) {
      removeTeamMember(id);
    }
  };

  const handleContact = (e: React.MouseEvent, type: 'email' | 'phone', value?: string) => {
    e.stopPropagation();
    if (!value) {
      alert('Aucune coordonnée disponible');
      return;
    }
    if (type === 'email') {
      window.location.href = `mailto:${value}`;
    } else {
      window.location.href = `tel:${value}`;
    }
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar relative">
        {/* Fixed Header Section */}
        <div className="sticky top-0 z-0 md:static md:z-auto pb-4">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-center gap-6 md:gap-4 mb-4 md:mb-8 p-4 md:p-0">
            <div className="text-center md:text-left w-full md:w-auto">
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-[var(--gradient-heading-from)] via-[var(--gradient-heading-via)] to-[var(--gradient-heading-to)] bg-clip-text text-transparent">Mon Équipe</h2>
              <p className="text-sm md:text-base text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 font-medium animate-pulse">Vos experts favoris et staff régulier</p>
            </div>
            
            <button 
              onClick={handleAdd}
              className="hidden md:flex bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold items-center gap-2 transition-colors shadow-lg shadow-blue-900/20 shrink-0 h-[42px]"
            >
              <UserPlus className="w-4 h-4" />
              Ajouter
            </button>
          </div>
        </div>

        {/* Scrolling Content Section (Sheet) */}
        <div className="relative z-10 bg-[var(--bg-card)] rounded-t-3xl border-t border-[var(--border)] shadow-lg min-h-full md:z-auto md:bg-transparent md:rounded-none md:border-none md:shadow-none">
          
          {/* Sticky Search Container */}
          <div className="sticky top-0 z-20 bg-[var(--bg-card)] pb-4 pt-4 px-4 md:px-0 rounded-t-3xl md:bg-transparent md:static md:z-auto md:rounded-none md:pt-0">
            <div className="px-4 md:px-0 pt-4 md:pt-0">
              <div className="flex items-center gap-3 w-full mb-4 md:mb-6">
                <div className="flex items-center gap-2 bg-[var(--bg-card)] md:bg-[var(--bg-input)] p-1 rounded-xl border border-[var(--border)] flex-1">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input 
                      type="text" 
                      placeholder="Rechercher un membre..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-[var(--text-primary)] pl-9 w-full placeholder:text-[var(--text-muted)] focus:outline-none"
                    />
                  </div>
                </div>
                
                {/* Mobile Add Button */}
                <button 
                  onClick={handleAdd}
                  className="md:hidden w-10 h-10 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-blue-900/20 active:scale-95 shrink-0"
                >
                  <UserPlus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Grid Content */}
          <div className="px-4 md:px-0 pb-20">
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredTeam.length > 0 ? (
                  filteredTeam.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: -20 }}
                    transition={{ 
                      duration: 0.4,
                      delay: index * 0.05,
                      type: "spring",
                      stiffness: 100,
                      damping: 15
                    }}
                    whileHover={{ y: -5, transition: { delay: 0 } }}
                    onClick={() => handleEdit(member)}
                    className="bg-gradient-to-br from-[var(--bg-active)] to-[var(--bg-hover)] backdrop-blur-md rounded-2xl p-3 md:p-4 lg:p-6 border border-[var(--border)] hover:border-blue-500/30 transition-all cursor-pointer group relative flex flex-col justify-between shadow-xl h-full"
                  >
                    {/* Delete Button */}
                    <button
                      onClick={(e) => handleDelete(e, member.id)}
                      className="absolute top-2 right-2 md:top-4 md:right-4 p-1.5 md:p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 z-10"
                    >
                      <Trash2 className="w-3 h-3 md:w-4 md:h-4" />
                    </button>

                    <div className="flex flex-col items-center mb-3 md:mb-6 pt-1 md:pt-2 text-center w-full">
                      <div className="relative mb-2 md:mb-5">
                        <div className="w-16 h-16 md:w-28 md:h-28 rounded-full overflow-hidden border-2 md:border-4 border-[var(--border)] group-hover:border-blue-500/20 transition-all duration-300 shadow-2xl">
                          <img src={member.avatar} alt={member.name} className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" />
                        </div>
                        <div className={clsx(
                          "absolute bottom-0.5 right-0.5 md:bottom-1 md:right-1 w-3 h-3 md:w-5 md:h-5 rounded-full border-2 md:border-4 border-[var(--bg-card)]",
                          member.status === 'AVAILABLE' ? "bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]" :
                          member.status === 'BUSY' ? "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]" : "bg-gray-500"
                        )} />
                      </div>
                      
                      <h3 className="text-sm md:text-xl font-bold text-[var(--text-primary)] mb-0.5 md:mb-1 group-hover:text-blue-400 transition-colors truncate w-full">{member.name}</h3>
                      <p className="text-[var(--text-secondary)] font-medium text-[10px] md:text-sm mb-0.5 md:mb-1 truncate w-full">{member.role}</p>
                      {member.company && (
                        <p className="text-[var(--text-muted)] text-[9px] md:text-xs font-medium uppercase tracking-wider truncate w-full">{member.company}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 md:gap-3 mt-auto w-full">
                    <button 
                      onClick={(e) => handleContact(e, 'email', member.email)}
                      className="flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider group/btn"
                    >
                      <MessageSquare className="w-3 h-3 md:w-4 md:h-4 text-[var(--text-muted)] group-hover/btn:text-[var(--text-primary)] transition-colors" />
                      <span className="hidden md:inline">Message</span>
                    </button>
                    <button 
                      onClick={(e) => handleContact(e, 'phone', member.phone)}
                      className="flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 transition-all text-[10px] md:text-xs font-bold uppercase tracking-wider border border-blue-500/20 hover:border-blue-500/40 group/btn"
                    >
                      <Phone className="w-3 h-3 md:w-4 md:h-4" />
                      <span className="hidden md:inline">Appeler</span>
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-[var(--bg-hover)] flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Aucun membre trouvé</h3>
                <p className="text-[var(--text-muted)] max-w-sm">
                  Il n'y a pas encore de membres d'équipe assignés à cet établissement ou correspondant à votre recherche.
                </p>
                <button 
                  onClick={handleAdd}
                  className="mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors"
                >
                  Ajouter un membre
                </button>
              </div>
            )}
            </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <TeamMemberModal 
            member={selectedMember} 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}