'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, MapPin, Clock, Camera, Mic, Star, Send, 
  User, Phone, MessageSquare, Video, Image as ImageIcon,
  AlertCircle, Navigation, ChevronRight
} from 'lucide-react';
import { clsx } from 'clsx';
import FullScreenGallery from '@/components/shared/FullScreenGallery';
import ProviderProfileModal from '@/components/shared/ProviderProfileModal';
import DirectRequestModal from './DirectRequestModal';
import { ProviderProfile } from '@/types/provider';

import { useMissionsStore } from '@/store/useMissionsStore';
import { Mission } from '@/types/missions';

interface MissionDetailsModalProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
}

import { InvoiceDetailView } from '../billing/InvoiceDetailView';

export default function MissionDetailsModal({ mission, isOpen, onClose }: MissionDetailsModalProps) {
  const { addReview, generateInvoice, payInvoice, updateMission } = useMissionsStore();
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'EVIDENCE' | 'PROVIDER' | 'INVOICE'>('DETAILS');
  const [showRating, setShowRating] = useState(false);
  const [showProviderProfile, setShowProviderProfile] = useState(false);
  const [showDirectRequest, setShowDirectRequest] = useState(false);
  
  // Gallery State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [galleryInitialIndex, setGalleryInitialIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState<string[]>([]);
  
  // Rating State
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [reviewMedia, setReviewMedia] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen || !mission) return null;

  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);

  const handleOpenProviderProfile = () => {
    if (!mission?.provider) return;

    // Simulate API call to fetch full provider profile
    const fullProvider: ProviderProfile = {
      id: mission.provider.id,
      firstName: mission.provider.name.split(' ')[0],
      lastName: mission.provider.name.split(' ')[1] || '',
      title: 'Expert Technique',
      bio: mission.provider.bio,
      avatarUrl: mission.provider.avatar || '',
      location: { city: 'Paris', latitude: 48.8566, longitude: 2.3522 },
      stats: {
        rating: mission.provider.rating,
        missionsCompleted: mission.provider.completedMissions,
        responseRate: 98,
        onTimeRate: 100
      },
      skills: ['Dépannage', 'Maintenance', 'Urgence'],
      certifications: [
        {
          id: '1',
          name: 'Certificat Professionnel',
          issuer: 'État',
          dateObtained: '2020',
          isVerified: true
        }
      ],
      portfolio: [
        {
          id: '1',
          type: 'IMAGE',
          url: 'https://images.unsplash.com/photo-1581092921461-eab62e97a782?q=80&w=2070&auto=format&fit=crop',
          title: 'Intervention Rapide',
          description: 'Réparation sur site en moins de 30 minutes.'
        },
        {
          id: '2',
          type: 'BEFORE_AFTER',
          url: 'https://images.unsplash.com/photo-1584622050111-993a426fbf0a?q=80&w=2070&auto=format&fit=crop',
          beforeUrl: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?q=80&w=2069&auto=format&fit=crop',
          title: 'Rénovation Complète',
          description: 'Avant et après notre passage.'
        }
      ],
      experiences: [
        {
          id: '1',
          role: 'Technicien Senior',
          company: 'Solutions Pro',
          startDate: '2018',
          description: 'Responsable des interventions complexes.'
        }
      ],
      reviews: [
        {
          id: '1',
          author: 'Jean Dupont',
          rating: 5,
          comment: 'Excellent travail, très pro.',
          date: 'Il y a 2 jours'
        }
      ],
      languages: ['Français', 'Anglais'],
      badges: ['VERIFIED', 'GOLD'],
      preferences: {
        radius: 30,
        minHourlyRate: 50,
        availabilityBadges: []
      },
      availability: {
        isAvailable: true,
        nextSlot: 'Aujourd\'hui 14h'
      }
    };

    setSelectedProvider(fullProvider);
    setShowProviderProfile(true);
  };

  const handleOpenGallery = (images: (string | { url: string })[], index: number) => {
    const imageUrls = images.map(img => typeof img === 'string' ? img : img.url);
    setGalleryImages(imageUrls);
    setGalleryInitialIndex(index);
    setIsGalleryOpen(true);
  };

  const getPhotoUrl = (photo: string | { url: string }) => {
    return typeof photo === 'string' ? photo : photo.url;
  };

  const handleRatingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mission) {
      addReview(mission.id, {
        rating,
        comment: reviewText,
        photos: reviewMedia.filter(url => !url.endsWith('.mp4')), // Simple assumption
        videos: reviewMedia.filter(url => url.endsWith('.mp4')),
        date: new Date().toISOString()
      });
      alert('Avis enregistré avec succès !');
      setShowRating(false);
      setReviewMedia([]);
      setReviewText('');
      setRating(0);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Simulation of speech-to-text
    if (!isRecording) {
      setTimeout(() => {
        setReviewText(prev => prev + " Service impeccable, le technicien était très professionnel et rapide.");
        setIsRecording(false);
      }, 2000);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      // Simulate file upload by creating object URLs
      const newMedia = Array.from(files).map(file => URL.createObjectURL(file));
      setReviewMedia(prev => [...prev, ...newMedia]);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'SEARCHING':
        return { label: 'En recherche', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      case 'SCHEDULED':
        return { label: 'Programmée', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' };
      case 'ON_WAY':
        return { label: 'En route', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'ON_SITE':
        return { label: 'Sur place', color: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };
      case 'IN_PROGRESS':
        return { label: 'En cours', color: 'bg-blue-600/20 text-blue-400 border-blue-600/30' };
      case 'COMPLETED':
        return { label: 'Terminée', color: 'bg-green-500/20 text-green-400 border-green-500/30' };
      case 'CANCELLED':
        return { label: 'Annulée', color: 'bg-red-500/20 text-red-400 border-red-500/30' };
      default:
        return { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const statusInfo = getStatusInfo(mission.status);

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />

      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="relative w-full max-w-4xl bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#1a1a1a]">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-white">{mission.title}</h2>
              <span className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                statusInfo.color
              )}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-gray-400 text-sm flex items-center gap-2">
              <Clock className="w-3 h-3" /> {mission.date || "Date non définie"}
              <span className="w-1 h-1 bg-gray-600 rounded-full" />
              <MapPin className="w-3 h-3" /> {mission.location?.address || 'Adresse inconnue'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row h-full">
            
            {/* Left Column: Map & Status */}
            <div className="lg:w-1/3 bg-[#1a1a1a]/50 border-r border-white/5 p-6 space-y-6">
              {/* Map Placeholder */}
              <div className="aspect-square rounded-2xl overflow-hidden relative bg-[#2a2a2a] group">
                {/* Mock Map UI */}
                <div 
                  className="absolute inset-0 opacity-50 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('https://api.mapbox.com/styles/v1/mapbox/dark-v10/static/${mission.location?.lng || 2.3522},${mission.location?.lat || 48.8566},13,0/600x600?access_token=pk.eyJ1IjoiYnJrY29kZXVyIiwiYSI6ImNsZ3J6b3J6djBkNmwzaG14YXJ4bGF5aGwifQ.jS-2_1Jg-5Y_1')`
                  }}
                />
                
                {/* Venue Marker */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-blue-500 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.5)] animate-pulse" />
                
                {/* Technician Marker (Simulated Movement if available) */}
                {mission.technicianLocation && (
                  <div 
                    className="absolute p-2 bg-[#1a1a1a] rounded-lg border border-white/10 shadow-xl transition-all duration-1000 ease-in-out"
                    style={{
                      // This is a rough approximation for demo visualization on static map image
                      // In a real map, you'd use markers with lat/lng
                      top: '30%', 
                      left: '30%',
                      transform: `translate(${Math.sin(Date.now() / 1000) * 20}px, ${Math.cos(Date.now() / 1000) * 20}px)` 
                    }}
                  >
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
                
                {(mission.status === 'ON_WAY' || mission.status === 'ON_SITE' || mission.status === 'IN_PROGRESS') && (
                  <div className="absolute bottom-4 left-4 right-4 bg-[#1a1a1a]/90 backdrop-blur border border-white/10 p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-gray-400 uppercase">
                        {mission.status === 'ON_WAY' ? 'En route' : 
                         mission.status === 'ON_SITE' ? 'Sur Place' : 'En Intervention'}
                      </span>
                      {mission.eta && (
                        <span className="text-xs font-bold text-green-400">{mission.eta} min</span>
                      )}
                    </div>
                    {mission.status === 'ON_WAY' && (
                      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${Math.max(10, 100 - (mission.eta || 15) * 5)}%` }} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Provider Card */}
              {mission.status === 'SEARCHING' && (
                <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 space-y-3">
                  <p className="text-sm text-gray-400 text-center">
                    Votre mission est en cours de diffusion auprès des prestataires qualifiés.
                  </p>
                  <button
                    onClick={() => {
                      if (confirm('Voulez-vous vraiment annuler cette recherche ?')) {
                        updateMission(mission.id, { status: 'CANCELLED' });
                        onClose();
                      }
                    }}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    Annuler la recherche
                  </button>
                </div>
              )}

              {mission.provider && mission.status !== 'SEARCHING' && (
                <div 
                  onClick={handleOpenProviderProfile}
                  className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/5 cursor-pointer hover:border-white/20 transition-all group/card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white group-hover/card:scale-105 transition-transform">
                      {mission.provider.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white group-hover/card:text-blue-400 transition-colors">{mission.provider.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{mission.provider.rating}</span>
                        <span className="text-gray-500">({mission.provider.completedMissions} missions)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3 h-3" /> Appeler
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-bold text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <MessageSquare className="w-3 h-3" /> Message
                    </button>
                  </div>
                  
                  {mission.status === 'COMPLETED' && !showRating && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowRating(true); }}
                      className="w-full mt-3 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 border border-yellow-500/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Noter le prestataire
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Details & Rating */}
            <div className="flex-1 p-6">
              <AnimatePresence mode="wait">
                {showRating ? (
                  <motion.div 
                    key="rating"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="h-full flex flex-col"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <button onClick={() => setShowRating(false)} className="p-2 hover:bg-white/10 rounded-full">
                        <X className="w-5 h-5 text-gray-400" />
                      </button>
                      <h3 className="text-xl font-bold text-white">Noter la prestation</h3>
                    </div>

                    <form onSubmit={handleRatingSubmit} className="space-y-6 flex-1 flex flex-col">
                      <div className="flex justify-center gap-2 mb-4">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            className="p-2 transition-transform hover:scale-110"
                          >
                            <Star 
                              className={clsx(
                                "w-10 h-10 transition-colors",
                                rating >= star ? "fill-yellow-500 text-yellow-500" : "text-gray-600"
                              )} 
                            />
                          </button>
                        ))}
                      </div>

                      <div className="flex-1 relative">
                        <textarea
                          value={reviewText}
                          onChange={(e) => setReviewText(e.target.value)}
                          placeholder="Décrivez votre expérience..."
                          className="w-full h-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-blue-500 resize-none"
                        />
                        <button 
                          type="button"
                          onClick={toggleRecording}
                          className={clsx(
                            "absolute bottom-4 right-4 p-3 rounded-full transition-all shadow-lg",
                            isRecording ? "bg-red-500 animate-pulse text-white" : "bg-blue-600 text-white hover:bg-blue-500"
                          )}
                        >
                          <Mic className="w-5 h-5" />
                        </button>
                      </div>

                      <div>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          className="hidden" 
                          multiple 
                          accept="image/*,video/*" 
                          onChange={handleFileSelect} 
                        />
                        <div className="flex gap-4 mb-4 overflow-x-auto pb-2">
                          <button 
                            type="button" 
                            onClick={triggerFileUpload}
                            className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 border border-white/10 border-dashed rounded-xl hover:bg-white/10 transition-colors shrink-0"
                          >
                            <Camera className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Photo</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={triggerFileUpload}
                            className="flex flex-col items-center justify-center w-24 h-24 bg-white/5 border border-white/10 border-dashed rounded-xl hover:bg-white/10 transition-colors shrink-0"
                          >
                            <Video className="w-6 h-6 text-gray-400 mb-2" />
                            <span className="text-[10px] text-gray-500 font-bold uppercase">Vidéo</span>
                          </button>
                          {/* Mocked uploaded media */}
                          {reviewMedia.map((url, i) => (
                            <div key={i} className="w-24 h-24 bg-gray-800 rounded-xl border border-white/10 shrink-0 overflow-hidden relative group">
                              <img src={url} alt="Upload" className="w-full h-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => setReviewMedia(prev => prev.filter((_, idx) => idx !== i))}
                                className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <button 
                          type="submit"
                          disabled={rating === 0}
                          className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Envoyer l'avis
                        </button>
                      </div>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="details"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="h-full flex flex-col"
                  >
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl mb-6 shrink-0">
                      <button
                        onClick={() => setActiveTab('DETAILS')}
                        className={clsx(
                          "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                          activeTab === 'DETAILS' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => setActiveTab('EVIDENCE')}
                        className={clsx(
                          "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                          activeTab === 'EVIDENCE' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                        )}
                      >
                        Preuves
                      </button>
                      {mission.status === 'COMPLETED' && (
                        <button
                          onClick={() => {
                             setActiveTab('INVOICE');
                             if (!mission.invoice) generateInvoice(mission.id);
                          }}
                          className={clsx(
                            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'INVOICE' ? "bg-white text-black shadow-lg" : "text-gray-400 hover:text-white hover:bg-white/5"
                          )}
                        >
                          Facture
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">
                      {activeTab === 'DETAILS' && (
                        <>
                          {mission.description && (
                            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                              <h3 className="text-sm font-bold text-gray-500 uppercase mb-2">Description</h3>
                              <p className="text-white text-sm">{mission.description}</p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Notes de l'intervenant
                            </h3>
                            <div className="space-y-3">
                              {mission.notes && mission.notes.length > 0 ? (
                                mission.notes.map((note, idx) => (
                                  <div key={idx} className="bg-white/5 p-4 rounded-xl border border-white/5 text-sm text-gray-300">
                                    "{note}"
                                  </div>
                                ))
                              ) : (
                                <p className="text-gray-500 italic text-sm">Aucune note pour le moment.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Navigation className="w-4 h-4" /> Suivi
                            </h3>
                            <div className="space-y-4 pl-2 border-l-2 border-white/10">
                              {/* Creation Step - Always Visible */}
                              <div className="relative pl-6">
                                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-gray-500 ring-4 ring-black" />
                                <p className="text-sm text-white font-medium">Mission créée</p>
                                <p className="text-xs text-gray-500">{mission.date || "Date inconnue"}</p>
                              </div>

                              {/* Search Step */}
                              {mission.status === 'SEARCHING' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-white font-medium">Recherche en cours...</p>
                                  <p className="text-xs text-gray-500">Diffusion aux prestataires</p>
                                </div>
                              )}

                              {/* Accepted Step - If NOT searching/cancelled */}
                              {mission.status !== 'SEARCHING' && mission.status !== 'CANCELLED' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-black" />
                                  <p className="text-sm text-white font-medium">Mission acceptée</p>
                                  <p className="text-xs text-gray-500">Prestataire assigné</p>
                                </div>
                              )}
                              
                              {/* On Way / On Site */}
                              {(mission.status === 'ON_WAY' || mission.status === 'ON_SITE') && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-white font-medium">{mission.status === 'ON_WAY' ? 'En route' : 'Sur place'}</p>
                                  <p className="text-xs text-gray-500">Arrivée imminente</p>
                                </div>
                              )}

                              {/* In Progress */}
                              {mission.status === 'IN_PROGRESS' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-white font-medium">Intervention en cours</p>
                                  <p className="text-xs text-gray-500">Travaux démarrés</p>
                                </div>
                              )}

                              {/* Completed */}
                              {mission.status === 'COMPLETED' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-green-500 ring-4 ring-black" />
                                  <p className="text-sm text-white font-medium">Intervention terminée</p>
                                  <p className="text-xs text-gray-500">Mission clôturée</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {activeTab === 'EVIDENCE' && (
                        <div>
                          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Photos & Vidéos
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {mission.photos && mission.photos.length > 0 ? (
                              mission.photos.map((photo, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => handleOpenGallery(mission.photos || [], idx)}
                                  className="aspect-square rounded-xl bg-gray-800 border border-white/10 relative overflow-hidden group cursor-pointer"
                                >
                                  <div className="absolute inset-0 bg-gray-700 flex items-center justify-center text-gray-500">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                  </div>
                                  <img src={getPhotoUrl(photo)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">Voir</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full py-8 text-center border-2 border-dashed border-white/10 rounded-xl text-gray-500 text-sm">
                                En attente de photos...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'INVOICE' && mission.invoice && (
                        <div className="animate-fadeIn">
                          <InvoiceDetailView invoice={mission.invoice} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>
    </div>

    {/* Components Overlay */}
    <FullScreenGallery 
      isOpen={isGalleryOpen}
      images={galleryImages}
      initialIndex={galleryInitialIndex}
      onClose={() => setIsGalleryOpen(false)}
    />

    <ProviderProfileModal 
      isOpen={showProviderProfile && !!selectedProvider}
      provider={selectedProvider!}
      onClose={() => setShowProviderProfile(false)}
      onBook={() => {
        setShowProviderProfile(false);
        setShowDirectRequest(true);
      }}
    />

    <DirectRequestModal 
      isOpen={showDirectRequest && !!selectedProvider}
      provider={selectedProvider!}
      onClose={() => setShowDirectRequest(false)}
    />
    </>
  );
}
