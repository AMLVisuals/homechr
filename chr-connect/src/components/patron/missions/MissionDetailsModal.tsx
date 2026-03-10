'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Clock, Camera, Mic, Star, Send,
  User, Phone, MessageSquare, Video, Image as ImageIcon,
  AlertCircle, Navigation, ChevronRight, CheckCircle2, Package, FileText
} from 'lucide-react';
import { clsx } from 'clsx';
import FullScreenGallery from '@/components/shared/FullScreenGallery';
import ProviderProfileModal from '@/components/shared/ProviderProfileModal';
import DirectRequestModal from './DirectRequestModal';
import QuoteRejectionForm from '@/components/mission/QuoteRejectionForm';
import { ProviderProfile } from '@/types/provider';
import { calculateTravelCost } from '@/lib/financial-engine';
import { getMissionFlowType } from '@/lib/utils';

import { useMissionsStore } from '@/store/useMissionsStore';
import { useStore } from '@/store/useStore';
import { useDPAEStore } from '@/store/useDPAEStore';
import { Mission } from '@/types/missions';
import DPAEWizard from '../dpae/DPAEWizard';

interface MissionDetailsModalProps {
  mission: Mission | null;
  isOpen: boolean;
  onClose: () => void;
}

import { InvoiceDetailView } from '../billing/InvoiceDetailView';

export default function MissionDetailsModal({ mission, isOpen, onClose }: MissionDetailsModalProps) {
  const { addReview, generateInvoice, payInvoice, updateMission, rejectQuote, validateStaffMission, setPartsStatus } = useMissionsStore();
  const isPremium = useStore((s) => s.isPremium);
  const dpaeDeclaration = useDPAEStore((s) => mission ? s.getDeclarationByMission(mission.id) : undefined);
  const [showDPAEWizard, setShowDPAEWizard] = useState(false);
  const [activeTab, setActiveTab] = useState<'DETAILS' | 'EVIDENCE' | 'PROVIDER' | 'INVOICE' | 'QUOTE'>('DETAILS');
  const [showRating, setShowRating] = useState(false);
  const [showProviderProfile, setShowProviderProfile] = useState(false);
  const [showDirectRequest, setShowDirectRequest] = useState(false);

  // Staff validation state
  const [staffConfirmed, setStaffConfirmed] = useState(false);

  // Tech quote response state
  const [showImmediateChoice, setShowImmediateChoice] = useState(false);
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  
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
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mission || !mounted) return null;

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
      },
      employmentCategory: mission.category === 'STAFFING' ? 'EXTRA_EMPLOYEE' : 'FREELANCE_TECHNICIAN',
      complianceStatus: 'VERIFIED',
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
      case 'PENDING_VALIDATION':
        return { label: 'Validation requise', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' };
      case 'DIAGNOSING':
        return { label: 'Diagnostic', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' };
      case 'QUOTE_SENT':
        return { label: 'Devis reçu', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' };
      case 'STANDBY':
        return { label: 'En attente pièce', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' };
      default:
        return { label: status, color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' };
    }
  };

  const statusInfo = getStatusInfo(mission.status);

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9998]"
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-sidebar)] border-0 md:border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{mission.title}</h2>
              <span className={clsx(
                "px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                statusInfo.color
              )}>
                {statusInfo.label}
              </span>
            </div>
            <p className="text-[var(--text-secondary)] text-sm flex items-center gap-2">
              <Clock className="w-3 h-3" /> {mission.date || "Date non définie"}
              <span className="w-1 h-1 bg-[var(--text-muted)] rounded-full" />
              <MapPin className="w-3 h-3" /> {mission.location?.address || 'Adresse inconnue'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors">
            <X className="w-6 h-6 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="flex flex-col lg:flex-row h-full">

            {/* Left Column: Map & Status */}
            <div className="lg:w-1/3 bg-[var(--bg-card)]/50 border-r border-[var(--border)] p-6 space-y-6">
              {/* Map Placeholder */}
              <div className="aspect-square rounded-2xl overflow-hidden relative bg-[var(--bg-active)] group">
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
                    className="absolute p-2 bg-[var(--bg-card)] rounded-lg border border-[var(--border)] shadow-xl transition-all duration-1000 ease-in-out"
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
                  <div className="absolute bottom-4 left-4 right-4 bg-[var(--bg-card)]/90 backdrop-blur border border-[var(--border)] p-3 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-secondary)] uppercase">
                        {mission.status === 'ON_WAY' ? 'En route' : 
                         mission.status === 'ON_SITE' ? 'Sur Place' : 'En Intervention'}
                      </span>
                      {mission.eta && (
                        <span className="text-xs font-bold text-green-400">{mission.eta} min</span>
                      )}
                    </div>
                    {mission.status === 'ON_WAY' && (
                      <div className="h-1 bg-[var(--bg-active)] rounded-full overflow-hidden">
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
                <div className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)] space-y-3">
                  <p className="text-sm text-[var(--text-secondary)] text-center">
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
                  className="bg-[var(--bg-card)] rounded-2xl p-4 border border-[var(--border)] cursor-pointer hover:border-[var(--border-strong)] transition-all group/card"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-lg font-bold text-white group-hover/card:scale-105 transition-transform">
                      {mission.provider.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-[var(--text-primary)] group-hover/card:text-blue-400 transition-colors">{mission.provider.name}</h4>
                      <div className="flex items-center gap-1 text-xs text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{mission.provider.rating}</span>
                        <span className="text-[var(--text-muted)]">({mission.provider.completedMissions} missions)</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-xl text-xs font-bold text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
                    >
                      <Phone className="w-3 h-3" /> Appeler
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); }}
                      className="flex-1 py-2 bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] rounded-xl text-xs font-bold text-[var(--text-primary)] transition-colors flex items-center justify-center gap-2"
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
                      <button onClick={() => setShowRating(false)} className="p-2 hover:bg-[var(--bg-active)] rounded-full">
                        <X className="w-5 h-5 text-[var(--text-secondary)]" />
                      </button>
                      <h3 className="text-xl font-bold text-[var(--text-primary)]">Noter la prestation</h3>
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
                          className="w-full h-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-2xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 resize-none"
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
                            className="flex flex-col items-center justify-center w-24 h-24 bg-[var(--bg-hover)] border border-[var(--border)] border-dashed rounded-xl hover:bg-[var(--bg-active)] transition-colors shrink-0"
                          >
                            <Camera className="w-6 h-6 text-[var(--text-secondary)] mb-2" />
                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Photo</span>
                          </button>
                          <button 
                            type="button" 
                            onClick={triggerFileUpload}
                            className="flex flex-col items-center justify-center w-24 h-24 bg-[var(--bg-hover)] border border-[var(--border)] border-dashed rounded-xl hover:bg-[var(--bg-active)] transition-colors shrink-0"
                          >
                            <Video className="w-6 h-6 text-[var(--text-secondary)] mb-2" />
                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Vidéo</span>
                          </button>
                          {/* Mocked uploaded media */}
                          {reviewMedia.map((url, i) => (
                            <div key={i} className="w-24 h-24 bg-[var(--bg-active)] rounded-xl border border-[var(--border)] shrink-0 overflow-hidden relative group">
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
                    <div className="flex items-center gap-1 bg-[var(--bg-hover)] p-1 rounded-xl mb-6 shrink-0">
                      <button
                        onClick={() => setActiveTab('DETAILS')}
                        className={clsx(
                          "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                          activeTab === 'DETAILS' ? "bg-white text-black shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        )}
                      >
                        Détails
                      </button>
                      <button
                        onClick={() => setActiveTab('EVIDENCE')}
                        className={clsx(
                          "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                          activeTab === 'EVIDENCE' ? "bg-white text-black shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                        )}
                      >
                        Preuves
                      </button>
                      {mission.quote && (
                        <button
                          onClick={() => setActiveTab('QUOTE')}
                          className={clsx(
                            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'QUOTE' ? "bg-white text-black shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                          )}
                        >
                          Devis
                        </button>
                      )}
                      {(mission.status === 'COMPLETED' || mission.invoice) && (
                        <button
                          onClick={() => {
                             setActiveTab('INVOICE');
                             if (!mission.invoice) generateInvoice(mission.id);
                          }}
                          className={clsx(
                            "flex-1 py-2 rounded-lg text-sm font-bold transition-all",
                            activeTab === 'INVOICE' ? "bg-white text-black shadow-lg" : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]"
                          )}
                        >
                          Facture
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-6">

                      {/* === PENDING_VALIDATION BANNER (Staff flow — patron must validate) === */}
                      {mission.status === 'PENDING_VALIDATION' && activeTab === 'DETAILS' && (
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-5 h-5 text-amber-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[var(--text-primary)]">Le prestataire a terminé</h4>
                              <p className="text-xs text-[var(--text-muted)]">Veuillez valider le travail effectué</p>
                            </div>
                          </div>

                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={staffConfirmed}
                              onChange={(e) => setStaffConfirmed(e.target.checked)}
                              className="w-4 h-4 text-amber-500 focus:ring-amber-500 rounded"
                            />
                            <span className="text-sm text-[var(--text-primary)]">Je confirme que le travail a été effectué correctement</span>
                          </label>

                          {staffConfirmed && !showRating && (
                            <button
                              onClick={() => setShowRating(true)}
                              className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <Star className="w-4 h-4" /> Noter le prestataire puis valider
                            </button>
                          )}

                          {staffConfirmed && (
                            <button
                              onClick={() => {
                                validateStaffMission(mission.id);
                                generateInvoice(mission.id);
                                updateMission(mission.id, { status: 'COMPLETED' });
                                // Auto-pay
                                setTimeout(() => {
                                  const updatedMission = useMissionsStore.getState().missions.find(m => m.id === mission.id);
                                  if (updatedMission?.invoice) payInvoice(updatedMission.invoice.id);
                                }, 100);
                              }}
                              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                            >
                              <CheckCircle2 className="w-4 h-4" /> Valider et payer
                            </button>
                          )}
                        </div>
                      )}

                      {/* === QUOTE_SENT BANNER (Tech flow — patron must accept/reject quote) === */}
                      {mission.status === 'QUOTE_SENT' && activeTab === 'DETAILS' && (
                        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-5 space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                              <FileText className="w-5 h-5 text-orange-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[var(--text-primary)]">Devis reçu du technicien</h4>
                              <p className="text-xs text-[var(--text-muted)]">
                                {mission.quote ? `${mission.quote.totalTTC.toFixed(2)} € TTC` : 'Consultez le devis dans l\'onglet Devis'}
                              </p>
                            </div>
                          </div>

                          {!showImmediateChoice ? (
                            <div className="flex gap-3">
                              <button
                                onClick={() => setShowImmediateChoice(true)}
                                className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-all"
                              >
                                Accepter le devis
                              </button>
                              <button
                                onClick={() => setShowRejectionForm(true)}
                                className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-bold transition-all"
                              >
                                Refuser
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="text-sm text-[var(--text-secondary)]">La réparation peut-elle être effectuée immédiatement ?</p>
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    updateMission(mission.id, { status: 'IN_PROGRESS' });
                                    setShowImmediateChoice(false);
                                  }}
                                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all"
                                >
                                  Oui, réparation immédiate
                                </button>
                                <button
                                  onClick={() => {
                                    updateMission(mission.id, { status: 'STANDBY', partsStatus: 'PART_ORDERED' });
                                    setShowImmediateChoice(false);
                                  }}
                                  className="flex-1 py-3 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-xl text-sm font-bold transition-all"
                                >
                                  Non, commande de pièce
                                </button>
                              </div>
                              <button
                                onClick={() => setShowImmediateChoice(false)}
                                className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                              >
                                Annuler
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* === STANDBY BANNER (Tech flow — waiting for parts) === */}
                      {mission.status === 'STANDBY' && activeTab === 'DETAILS' && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-5 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-yellow-500/20 rounded-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-yellow-400" />
                            </div>
                            <div>
                              <h4 className="font-bold text-[var(--text-primary)]">
                                {mission.partsStatus === 'PART_RECEIVED' ? 'Pièce reçue' : 'Pièce commandée'}
                              </h4>
                              <p className="text-xs text-[var(--text-muted)]">Le technicien reprendra l'intervention à réception</p>
                            </div>
                          </div>

                          {mission.partsStatus !== 'PART_RECEIVED' ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse" />
                                <span className="text-sm text-yellow-400">En attente de livraison...</span>
                              </div>
                              <button
                                onClick={() => setPartsStatus(mission.id, 'PART_RECEIVED')}
                                className="w-full py-2.5 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <Package className="w-4 h-4" /> Marquer pièce reçue
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-green-400 font-medium">Pièce reçue — en attente de reprise par le technicien</p>
                          )}
                        </div>
                      )}

                      {activeTab === 'DETAILS' && (
                        <>
                          {mission.description && (
                            <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)]">
                              <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase mb-2">Description</h3>
                              <p className="text-[var(--text-primary)] text-sm">{mission.description}</p>
                            </div>
                          )}

                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                              <MessageSquare className="w-4 h-4" /> Notes de l'intervenant
                            </h3>
                            <div className="space-y-3">
                              {mission.notes && mission.notes.length > 0 ? (
                                mission.notes.map((note, idx) => (
                                  <div key={idx} className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)] text-sm text-[var(--text-secondary)]">
                                    "{note}"
                                  </div>
                                ))
                              ) : (
                                <p className="text-[var(--text-muted)] italic text-sm">Aucune note pour le moment.</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                              <Navigation className="w-4 h-4" /> Suivi
                            </h3>
                            <div className="space-y-4 pl-2 border-l-2 border-[var(--border)]">
                              {/* Creation Step - Always Visible */}
                              <div className="relative pl-6">
                                <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-gray-500 ring-4 ring-black" />
                                <p className="text-sm text-[var(--text-primary)] font-medium">Mission créée</p>
                                <p className="text-xs text-[var(--text-muted)]">{mission.date || "Date inconnue"}</p>
                              </div>

                              {/* Search Step */}
                              {mission.status === 'SEARCHING' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Recherche en cours...</p>
                                  <p className="text-xs text-[var(--text-muted)]">Diffusion aux prestataires</p>
                                </div>
                              )}

                              {/* Accepted Step - If NOT searching/cancelled */}
                              {mission.status !== 'SEARCHING' && mission.status !== 'CANCELLED' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-black" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Mission acceptée</p>
                                  <p className="text-xs text-[var(--text-muted)]">Prestataire assigné</p>
                                </div>
                              )}
                              
                              {/* On Way / On Site */}
                              {(mission.status === 'ON_WAY' || mission.status === 'ON_SITE') && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">{mission.status === 'ON_WAY' ? 'En route' : 'Sur place'}</p>
                                  <p className="text-xs text-[var(--text-muted)]">Arrivée imminente</p>
                                </div>
                              )}

                              {/* Diagnosing */}
                              {mission.status === 'DIAGNOSING' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-purple-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Diagnostic en cours</p>
                                  <p className="text-xs text-[var(--text-muted)]">Le technicien analyse le problème</p>
                                </div>
                              )}

                              {/* Quote Sent */}
                              {mission.status === 'QUOTE_SENT' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-orange-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Devis reçu</p>
                                  <p className="text-xs text-[var(--text-muted)]">En attente de votre validation</p>
                                </div>
                              )}

                              {/* In Progress */}
                              {mission.status === 'IN_PROGRESS' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Intervention en cours</p>
                                  <p className="text-xs text-[var(--text-muted)]">Travaux démarrés</p>
                                </div>
                              )}

                              {/* Pending Validation (Staff) */}
                              {mission.status === 'PENDING_VALIDATION' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-amber-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Validation requise</p>
                                  <p className="text-xs text-[var(--text-muted)]">Le prestataire a terminé son service</p>
                                </div>
                              )}

                              {/* Standby (Tech - parts) */}
                              {mission.status === 'STANDBY' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-yellow-500 ring-4 ring-black animate-pulse" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">En attente de pièce</p>
                                  <p className="text-xs text-[var(--text-muted)]">
                                    {mission.partsStatus === 'PART_RECEIVED' ? 'Pièce reçue — reprise imminente' : 'Pièce commandée'}
                                  </p>
                                </div>
                              )}

                              {/* Completed */}
                              {mission.status === 'COMPLETED' && (
                                <div className="relative pl-6">
                                  <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-green-500 ring-4 ring-black" />
                                  <p className="text-sm text-[var(--text-primary)] font-medium">Intervention terminée</p>
                                  <p className="text-xs text-[var(--text-muted)]">Mission clôturée</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </>
                      )}

                      {/* DPAE Button — STAFF missions, confirmed, premium only */}
                      {activeTab === 'DETAILS' &&
                       mission.category === 'STAFFING' &&
                       ['ON_WAY', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'PENDING_VALIDATION'].includes(mission.status) && (
                        <div className="mt-4">
                          <button
                            onClick={() => setShowDPAEWizard(true)}
                            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-blue-500/25"
                          >
                            <FileText className="w-4 h-4" />
                            Déclarer DPAE + Générer contrat
                          </button>
                          {dpaeDeclaration && (
                            <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-medium text-green-400">
                                DPAE envoyée — Réf. {dpaeDeclaration.urssafReference || 'En cours'}
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {activeTab === 'EVIDENCE' && (
                        <div>
                          <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> Photos & Vidéos
                          </h3>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {mission.photos && mission.photos.length > 0 ? (
                              mission.photos.map((photo, idx) => (
                                <div 
                                  key={idx} 
                                  onClick={() => handleOpenGallery(mission.photos || [], idx)}
                                  className="aspect-square rounded-xl bg-[var(--bg-active)] border border-[var(--border)] relative overflow-hidden group cursor-pointer"
                                >
                                  <div className="absolute inset-0 bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-muted)]">
                                    <ImageIcon className="w-8 h-8 opacity-50" />
                                  </div>
                                  <img src={getPhotoUrl(photo)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <span className="text-xs font-bold text-white">Voir</span>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="col-span-full py-8 text-center border-2 border-dashed border-[var(--border)] rounded-xl text-[var(--text-muted)] text-sm">
                                En attente de photos...
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'QUOTE' && mission.quote && (
                        <div className="animate-fadeIn space-y-4">
                          <div className="bg-[var(--bg-hover)] p-4 rounded-xl border border-[var(--border)]">
                            <h3 className="text-sm font-bold text-[var(--text-muted)] uppercase mb-3">Devis #{mission.quote.reference}</h3>
                            <div className="space-y-2">
                              {mission.quote.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                  <span className="text-[var(--text-secondary)]">{item.description} × {item.quantity}</span>
                                  <span className="text-[var(--text-primary)] font-medium">{(item.unitPriceHT * item.quantity).toFixed(2)} €</span>
                                </div>
                              ))}
                              <div className="border-t border-[var(--border)] pt-2 mt-2">
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--text-muted)]">Sous-total HT</span>
                                  <span>{mission.quote.subtotalHT.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-[var(--text-muted)]">TVA</span>
                                  <span>{mission.quote.totalTVA.toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-base font-bold mt-1">
                                  <span className="text-[var(--text-primary)]">Total TTC</span>
                                  <span className="text-green-400">{mission.quote.totalTTC.toFixed(2)} €</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-[var(--text-muted)]">
                            <span>Statut: </span>
                            <span className="font-bold">{mission.quote.status}</span>
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

    {/* Quote Rejection Form */}
    <AnimatePresence>
      {showRejectionForm && mission && (
        <QuoteRejectionForm
          missionTitle={mission.title}
          quoteTotal={mission.quote?.totalTTC || 0}
          displacementFeeAmount={(() => {
            const distKm = mission.distance ? parseFloat(mission.distance.replace(/[^\d.]/g, '')) : 5;
            try { return calculateTravelCost(distKm).totalTTC; } catch { return 25; }
          })()}
          onSubmit={(rejection) => {
            rejectQuote(mission.id, rejection);
            setShowRejectionForm(false);
          }}
          onCancel={() => setShowRejectionForm(false)}
        />
      )}
    </AnimatePresence>

    {/* DPAE Wizard */}
    {showDPAEWizard && mission && (
      <DPAEWizard
        isOpen={showDPAEWizard}
        onClose={() => setShowDPAEWizard(false)}
        mission={mission}
        establishmentName={mission.venue}
      />
    )}
    </>,
    document.body
  );
}
