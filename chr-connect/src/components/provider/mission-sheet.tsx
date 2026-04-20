'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, DollarSign, X, ArrowRight, Navigation, Share2, ShieldCheck, Building2, ImageIcon, Info, Camera, CheckCircle, Wrench, QrCode, CalendarClock, UserPlus, XCircle, MessageSquare } from 'lucide-react';
import { Mission } from '@/types/missions';
import { useState } from 'react';
import { clsx } from 'clsx';
import { EstablishmentSheet } from './EstablishmentSheet';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import ChatThreadModal from '@/components/shared/ChatThreadModal';
import { useVenuesStore } from '@/store/useVenuesStore';
import { useMissionEngine } from '@/store/mission-engine';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useAuth } from '@/contexts/AuthContext';
import { MissionEquipmentDetails } from '@/components/equipment';
import type { EquipmentDocument } from '@/types/equipment';

interface MissionSheetProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation: { lat: number; lng: number };
}

export function MissionSheet({ mission, isOpen, onClose, userLocation }: MissionSheetProps) {
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<EquipmentDocument | null>(null);
  const [isEstablishmentOpen, setIsEstablishmentOpen] = useState(false);
  const [isEquipmentOpen, setIsEquipmentOpen] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const { user, profile } = useAuth();

  const { startMission } = useMissionEngine();
  const { syncUpdateMission, addCandidate, removeCandidate } = useMissionsStore();
  const { getVenue } = useVenuesStore();
  const { equipment } = useEquipmentStore();
  const venueDetails = mission?.venueId ? getVenue(mission.venueId) : undefined;

  // Check if worker already applied to this planned mission
  const alreadyApplied = hasApplied || (mission?.candidates?.some(c => c.id === 'worker-self') ?? false);
  const isPlanned = mission?.scheduled === true;

  // Find linked equipment for this mission (simulated - in real app would use mission.machineId)
  const linkedEquipment = mission?.venueId
    ? equipment.find(eq => eq.venueId === mission.venueId && eq.status === 'FAULT')
    : equipment.find(eq => eq.status === 'FAULT'); // Fallback to any faulty equipment for demo

  if (!mission) return null;
  
  // Simple estimation: 3 mins per km
  const estimatedTime = mission.distance ? Math.round(parseFloat(mission.distance) * 3) : 15;
  
  const handleAccept = () => {
    startMission(mission.id); // Sets status to ACCEPTED in global store
    syncUpdateMission(mission.id, {
      status: 'SCHEDULED', // Sync with shared store (SCHEDULED = ACCEPTED in this context)
      provider: {
        id: 'current-provider-id',
        name: 'Alexandre P.',
        rating: 4.9,
        completedMissions: 42,
        bio: 'Expert qualifié disponible immédiatement.',
        phone: '06 12 34 56 78',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop'
      }
    });
    onClose(); // Close the sheet to reveal the workflow
  };

  const handleCancelApply = () => {
    if (!mission) return;
    removeCandidate(mission.id, 'worker-self');
    setHasApplied(false);
  };

  const handleApply = () => {
    if (!mission || alreadyApplied) return;
    addCandidate(mission.id, {
      id: 'worker-self',
      name: 'Alexandre P.',
      specialty: 'Expert qualifié',
      rating: 4.9,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
      completedMissions: 42,
      appliedAt: new Date().toISOString(),
      status: 'PENDING',
    });
    setHasApplied(true);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`Mission: ${mission.title} chez ${mission.venue || 'Client'} - ${mission.price}€`);
    setShowShareTooltip(true);
    setTimeout(() => setShowShareTooltip(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 z-[500] backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-[600] bg-[var(--bg-card)] border-t border-[var(--border)] rounded-t-[32px] overflow-hidden shadow-2xl"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) onClose();
            }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3 bg-gradient-to-b from-[var(--bg-hover)] to-transparent">
              <div className="w-12 h-1.5 bg-[var(--bg-active)] rounded-full" />
            </div>
            
            <div className="px-6 pb-8 pt-2 max-h-[80vh] overflow-y-auto custom-scrollbar">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 pr-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                      mission.urgent 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30' 
                        : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                    }`}>
                      {mission.urgent ? 'Intervention Urgente' : mission.type}
                    </span>
                    {mission.matchScore && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" />
                        {mission.matchScore}% Match
                      </span>
                    )}
                    {mission.status && mission.status !== 'SEARCHING' && (
                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 ${
                         mission.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                       }`}>
                         {mission.status === 'SCHEDULED' && 'Acceptée'}
                         {mission.status === 'IN_PROGRESS' && 'En cours'}
                         {mission.status === 'COMPLETED' && 'Terminée'}
                       </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)] leading-tight mb-1">{mission.title}</h2>
                  <div className="flex items-center text-[var(--text-secondary)] text-sm">
                    <MapPin className="h-4 w-4 mr-1 text-[var(--text-muted)]" />
                    <span>{mission.venue || 'Client'}</span>
                    <span className="mx-2">•</span>
                    <span>{mission.distance || 0} km</span>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-[var(--bg-hover)] rounded-2xl p-3 border border-[var(--border)] flex flex-col items-center justify-center text-center">
                  <DollarSign className="h-5 w-5 text-green-400 mb-1" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">{mission.price}€</span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Net Est.</span>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-2xl p-3 border border-[var(--border)] flex flex-col items-center justify-center text-center">
                  <Clock className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">{estimatedTime}</span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Minutes</span>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-2xl p-3 border border-[var(--border)] flex flex-col items-center justify-center text-center">
                  <Navigation className="h-5 w-5 text-purple-400 mb-1" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">~15</span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Min Trajet</span>
                </div>
              </div>

              {/* Photos Gallery */}
              {mission.photos && mission.photos.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Photos de la mission
                  </h3>
                  <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
                    {mission.photos.map((photo, index) => {
                      const url = typeof photo === 'string' ? photo : photo.url;
                      return (
                        <button 
                          key={index} 
                          onClick={() => setSelectedDocument({
                            id: `mission-photo-${index}`,
                            name: `Photo mission ${index + 1}`,
                            type: 'OTHER',
                            url: url,
                            uploadedAt: new Date().toISOString(),
                            fileSize: '0 MB'
                          })}
                          className="flex-shrink-0 w-40 h-28 rounded-xl overflow-hidden border border-[var(--border)] relative group cursor-zoom-in"
                        >
                          <img 
                            src={url} 
                            alt={`Mission photo ${index + 1}`} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              
              {/* Description */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2 uppercase tracking-wide">Détails de la mission</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{mission.description}</p>
              </div>

              {/* Equipment Info (if linked) */}
              {linkedEquipment && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Équipement concerné
                  </h3>
                  <div
                    onClick={() => setIsEquipmentOpen(true)}
                    className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-4 border border-blue-500/30 flex items-start gap-4 hover:border-blue-500/50 transition-colors cursor-pointer group"
                  >
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-[var(--bg-active)] flex-shrink-0">
                      {linkedEquipment.photos.length > 0 ? (
                        <img
                          src={linkedEquipment.photos[0].url}
                          alt={linkedEquipment.brand}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <QrCode className="w-6 h-6 text-[var(--text-muted)]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                        {linkedEquipment.brand} {linkedEquipment.model}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mb-1">
                        {linkedEquipment.nickname || linkedEquipment.location}
                      </p>
                      {linkedEquipment.serialNumber && (
                        <p className="text-xs text-[var(--text-muted)] font-mono">
                          S/N: {linkedEquipment.serialNumber}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                          En panne
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          Voir fiche technique complète →
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Establishment Sheet Preview */}
              <div className="mb-6">
                 <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    L'Établissement
                  </h3>
                  <div 
                    onClick={() => setIsEstablishmentOpen(true)}
                    className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] flex items-start gap-4 hover:bg-[var(--bg-active)] transition-colors cursor-pointer group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center text-lg font-bold text-[var(--text-primary)] shrink-0">
                      {(mission.venue || 'C').charAt(0)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-[var(--text-primary)] group-hover:text-blue-400 transition-colors">
                        {venueDetails ? venueDetails.name : (mission.venue || 'Client')}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)] mb-2">
                        {venueDetails ? venueDetails.category : "Restaurant Gastronomique"} • {venueDetails?.rating || "4.8"}/5 ({venueDetails?.reviewCount || "24"} avis)
                      </p>
                      <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> 
                          {venueDetails ? venueDetails.city : "Paris"}
                        </span>
                        <span>•</span>
                        <span className="text-green-400">Ouvert maintenant</span>
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-primary)] transition-colors self-center" />
                  </div>
              </div>
              
              {/* Skills */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Compétences Requises</h3>
                <div className="flex flex-wrap gap-2">
                  {mission.skills?.map((skill, index) => (
                    <span key={index} className="px-3 py-1.5 rounded-lg bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              
              {/* Contacter le patron — visible dès que worker accepté */}
              {mission.patronId && user?.id && ['SCHEDULED', 'ON_WAY', 'ON_SITE', 'IN_PROGRESS', 'PENDING_VALIDATION'].includes(mission.status) && (
                <button
                  onClick={() => setShowChatModal(true)}
                  className="w-full mb-4 py-3 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] text-[var(--text-primary)] text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  Contacter le patron
                </button>
              )}

              {/* Actions */}
              <div className="grid grid-cols-4 gap-3">
                <button
                  onClick={handleShare}
                  className="col-span-1 flex flex-col items-center justify-center bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] border border-[var(--border)] rounded-xl transition-colors relative"
                >
                  <Share2 className="w-5 h-5 text-[var(--text-primary)] mb-1" />
                  <span className="text-[10px] text-[var(--text-secondary)]">Partager</span>
                  {showShareTooltip && (
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-black text-white text-xs rounded shadow-lg whitespace-nowrap">
                      Lien copié !
                    </div>
                  )}
                </button>

                {isPlanned ? (
                  alreadyApplied ? (
                    <>
                      <div className="col-span-2 font-bold py-4 rounded-xl flex items-center justify-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400">
                        <CheckCircle className="h-5 w-5" />
                        <span>Candidature envoyée</span>
                      </div>
                      <button
                        onClick={handleCancelApply}
                        className="col-span-1 font-bold py-4 rounded-xl flex items-center justify-center gap-2 bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 transition-colors active:scale-95"
                      >
                        <XCircle className="h-5 w-5" />
                        <span className="text-xs">Annuler</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={handleApply}
                      className="col-span-3 font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white shadow-purple-900/20"
                    >
                      <UserPlus className="h-5 w-5" />
                      <span>Se positionner</span>
                    </button>
                  )
                ) : (
                  <button
                    onClick={handleAccept}
                    className="col-span-3 font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-blue-900/20"
                  >
                    <span>Accepter la mission</span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Document Viewer for Images */}
          <DocumentViewer
            document={selectedDocument}
            isOpen={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            readonly={true}
          />

          {/* Chat avec le patron */}
          {showChatModal && mission.patronId && user?.id && (
            <ChatThreadModal
              missionId={mission.id}
              missionTitle={mission.title}
              patronId={mission.patronId}
              workerId={user.id}
              peerName={mission.venue || 'Patron'}
              peerId={mission.patronId}
              senderName={`${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || 'Prestataire'}
              isOpen={showChatModal}
              onClose={() => setShowChatModal(false)}
            />
          )}

          {/* Establishment Sheet */}
          <EstablishmentSheet
            venueName={mission.venue || 'Client'}
            venueId={mission.venueId}
            isOpen={isEstablishmentOpen}
            onClose={() => setIsEstablishmentOpen(false)}
          />

          {/* Equipment Details Modal */}
          {linkedEquipment && (
            <MissionEquipmentDetails
              isOpen={isEquipmentOpen}
              onClose={() => setIsEquipmentOpen(false)}
              equipmentId={linkedEquipment.id}
              mission={mission}
              onAcceptMission={handleAccept}
              onOpenWaze={() => {
                const address = mission.location?.address || venueDetails?.address || 'Paris';
                window.open(`https://waze.com/ul?q=${encodeURIComponent(address)}`, '_blank');
              }}
              onCallRestaurant={() => {
                const phone = venueDetails?.access?.phone || '+33 1 23 45 67 89';
                window.open(`tel:${phone}`, '_self');
              }}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
