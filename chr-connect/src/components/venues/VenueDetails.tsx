import { Venue } from '@/types/venue';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { MapPin, Users, Monitor, Star, Wifi, Key, Truck, Wind, Flame, ShieldCheck, Plus, Pencil, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AddEquipmentModal } from '@/components/establishment/AddEquipmentModal';
import { EquipmentDetailsModal } from '@/components/equipment/EquipmentDetailsModal';
import { EquipmentForm } from '@/components/equipment/EquipmentForm';
import TeamMemberModal from '@/components/patron/team/TeamMemberModal';
import { Equipment } from '@/types/equipment';
import { TeamMember } from '@/types/missions';
import { APP_CONFIG } from '@/config/appConfig';

interface VenueDetailsProps {
  venue: Venue;
  readOnly?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function VenueDetails({ venue, readOnly = false, onEdit, onDelete }: VenueDetailsProps) {
  const { team } = useMissionsStore();
  const { equipment } = useEquipmentStore();
  const [activeTab, setActiveTab] = useState<'info' | 'team' | 'equipment'>('info');

  // Modals state
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [isAddEquipmentModalOpen, setIsAddEquipmentModalOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | undefined>(undefined);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Actions
  const { syncDeleteEquipment } = useEquipmentStore();

  // Filter data for this venue
  const venueTeam = team.filter(t => t.venueId === venue.id);
  const venueEquipment = equipment.filter(e => e.venueId === venue.id);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar bg-[var(--bg-card)]">
      {/* Header Image */}
      <div className="h-64 md:h-80 relative group">
        <img 
          src={venue.photoUrl || venue.photos?.[0]?.url} 
          alt={venue.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent" />
        
        {!readOnly && (
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-20">
            {onEdit && (
              <button 
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-2 bg-black/50 backdrop-blur rounded-xl hover:bg-[var(--bg-active)] text-white transition-colors border border-[var(--border)]"
                title="Modifier l'établissement"
              >
                <Pencil className="w-5 h-5" />
              </button>
            )}
            {onDelete && (
              <button 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-2 bg-red-500/20 text-red-400 backdrop-blur rounded-xl hover:bg-red-500 hover:text-[var(--text-primary)] transition-colors border border-red-500/30"
                title="Supprimer l'établissement"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
                  {venue.category}
                </span>
                {venue.isVerified && (
                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 border border-green-500/30 text-green-300 text-xs font-bold uppercase tracking-wider">
                    <ShieldCheck className="w-3 h-3" /> Vérifié
                  </span>
                )}
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)] mb-2">{venue.name}</h2>
              <div className="flex items-center gap-2 text-[var(--text-muted)]">
                <MapPin className="w-4 h-4" />
                <span>{venue.address}, {venue.zipCode} {venue.city}</span>
              </div>
            </div>

            {venue.rating && (
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-yellow-500 bg-yellow-500/10 px-3 py-1 rounded-xl border border-yellow-500/20">
                  <Star className="w-5 h-5 fill-current" />
                  <span className="text-xl font-bold">{venue.rating}</span>
                </div>
                <span className="text-xs text-[var(--text-muted)] mt-1">{venue.reviewCount} avis</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-2 bg-[var(--bg-card)]/95 border-b border-[var(--border)] overflow-x-auto sticky top-0 z-30 backdrop-blur-md">
        <button
          onClick={() => setActiveTab('info')}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'info' ? "bg-[var(--bg-active)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          <MapPin className="w-4 h-4" /> Informations
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'team' ? "bg-[var(--bg-active)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          <Users className="w-4 h-4" /> Équipe 
          <span className="bg-[var(--bg-active)] px-1.5 py-0.5 rounded-md text-xs">{venueTeam.length}</span>
        </button>
        <button
          onClick={() => setActiveTab('equipment')}
          className={clsx(
            "px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2",
            activeTab === 'equipment' ? "bg-[var(--bg-active)] text-[var(--text-primary)]" : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
          )}
        >
          <Monitor className="w-4 h-4" /> Équipements
          <span className="bg-[var(--bg-active)] px-1.5 py-0.5 rounded-md text-xs">{venueEquipment.length}</span>
        </button>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8">
        
        {/* INFO TAB */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
            {/* Access Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Accès & Contact</h3>
              <div className="bg-[var(--bg-hover)] rounded-2xl p-6 border border-[var(--border)] space-y-4">
                {venue.access?.contactName && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Responsable sur site</p>
                      <p className="text-[var(--text-primary)] font-medium">{venue.access.contactName}</p>
                    </div>
                  </div>
                )}
                {venue.access?.digicode && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <Key className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase font-bold">Digicode</p>
                      <p className="text-[var(--text-primary)] font-medium tracking-widest">{venue.access.digicode}</p>
                    </div>
                  </div>
                )}
                {venue.access?.wifiSSID && (
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                      <Wifi className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-muted)] uppercase font-bold">WiFi Invité</p>
                      <p className="text-[var(--text-primary)] font-medium">{venue.access.wifiSSID}</p>
                      <p className="text-[var(--text-muted)] text-sm font-mono">{venue.access.wifiPassword}</p>
                    </div>
                  </div>
                )}
              </div>

              {venue.access?.instructions && (
                <div className="bg-[var(--bg-hover)] rounded-2xl p-6 border border-[var(--border)]">
                  <h4 className="text-sm font-bold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    Instructions d'accès
                  </h4>
                  <p className="text-[var(--text-muted)] text-sm leading-relaxed">
                    {venue.access.instructions}
                  </p>
                </div>
              )}
            </div>

            {/* Technical Info */}
            <div className="space-y-6">
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Caractéristiques Techniques</h3>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Électricité</p>
                    <p className="text-[var(--text-primary)] font-bold">{venue.technical?.elecType || 'Standard'}</p>
                 </div>
                 <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)]">
                    <p className="text-xs text-[var(--text-muted)] mb-1">Gaz</p>
                    <p className="text-[var(--text-primary)] font-bold">{venue.technical?.gasType || 'Standard'}</p>
                 </div>
                 <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)] col-span-2 flex items-center justify-between">
                    <span className="text-[var(--text-muted)] text-sm flex items-center gap-2">
                      <Wind className="w-4 h-4" /> Ventilation / Extraction
                    </span>
                    <div className={clsx("w-3 h-3 rounded-full", venue.technical?.hasVentilation ? "bg-green-500" : "bg-red-500")} />
                 </div>
                 <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)] col-span-2 flex items-center justify-between">
                    <span className="text-[var(--text-muted)] text-sm flex items-center gap-2">
                      <Flame className="w-4 h-4" /> Cuisine
                    </span>
                    <span className="text-[var(--text-primary)] font-medium">{venue.technical?.kitchenType === 'OPEN' ? 'Ouverte' : 'Fermée'}</span>
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* TEAM TAB */}
        {activeTab === 'team' && (
          <div className="space-y-6 pb-20">
            {!readOnly && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsAddTeamModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter un membre
                </button>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venueTeam.length > 0 ? (
                venueTeam.map(member => (
                  <div 
                    key={member.id} 
                    onClick={() => setEditingMember(member)}
                    className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)] flex items-center gap-4 relative group cursor-pointer hover:bg-[var(--bg-active)] transition-colors"
                  >
                    <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)]">{member.name}</h4>
                      <p className="text-blue-400 text-sm">{member.role}</p>
                      <div className="flex gap-1 mt-1">
                        {member.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-[10px] bg-[var(--bg-active)] px-1.5 py-0.5 rounded text-[var(--text-muted)]">{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-[var(--text-muted)] italic">
                  Aucun membre d'équipe assigné à cet établissement.
                </div>
              )}
            </div>
          </div>
        )}

        {/* EQUIPMENT TAB */}
        {activeTab === 'equipment' && (
          <div className="space-y-6 pb-20">
            {!readOnly && (
              <div className="flex justify-end">
                <button 
                  onClick={() => setIsAddEquipmentModalOpen(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter un équipement
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {venueEquipment.length > 0 ? (
                venueEquipment.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => setSelectedEquipment(item)}
                    className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)] hover:bg-[var(--bg-active)] transition-colors cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-2">
                       <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--text-muted)] bg-[var(--bg-hover)] px-2 py-1 rounded-md">
                         {item.category}
                       </span>
                       <div className={clsx(
                         "w-2 h-2 rounded-full",
                         item.status === 'OPERATIONAL' ? "bg-green-500" : "bg-red-500"
                       )} />
                    </div>
                    <h4 className="font-bold text-[var(--text-primary)] mb-1 group-hover:text-blue-400 transition-colors">{item.nickname || item.brand}</h4>
                    <p className="text-[var(--text-muted)] text-sm mb-2">{item.brand} {item.model}</p>
                    <p className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {item.location}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-[var(--text-muted)] italic">
                  Aucun équipement répertorié pour cet établissement.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
      <AnimatePresence>
        {(isAddTeamModalOpen || editingMember) && (
          <TeamMemberModal 
            isOpen={isAddTeamModalOpen || !!editingMember} 
            onClose={() => {
              setIsAddTeamModalOpen(false);
              setEditingMember(null);
            }}
            venueId={venue.id}
            member={editingMember}
          />
        )}
        {isAddEquipmentModalOpen && (
          <AddEquipmentModal
            isOpen={isAddEquipmentModalOpen}
            onClose={() => setIsAddEquipmentModalOpen(false)}
            venueId={venue.id}
          />
        )}
        {selectedEquipment && (
          <EquipmentDetailsModal
            isOpen={!!selectedEquipment}
            onClose={() => setSelectedEquipment(null)}
            equipment={selectedEquipment}
            onEdit={!readOnly ? () => {
              setEditingEquipment(selectedEquipment);
              setSelectedEquipment(null);
            } : undefined}
            onDelete={!readOnly ? () => {
               if (confirm('Êtes-vous sûr de vouloir supprimer cet équipement ?')) {
                 syncDeleteEquipment(selectedEquipment.id);
                 setSelectedEquipment(null);
               }
            } : undefined}
          />
        )}
        {editingEquipment && (
          <EquipmentForm
            isOpen={!!editingEquipment}
            onClose={() => setEditingEquipment(undefined)}
            editingEquipment={editingEquipment}
            venueId={venue.id}
            ownerId={editingEquipment.ownerId || APP_CONFIG.DEFAULT_OWNER_ID}
          />
        )}
      </AnimatePresence>
    </div>
  );
}