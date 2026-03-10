'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, AlertCircle, FileText, CheckCircle, Building2 } from 'lucide-react';
import { clsx } from 'clsx';
import { ProviderProfile } from '@/types/provider';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { Mission } from '@/types/missions';

interface DirectRequestModalProps {
  provider: ProviderProfile;
  isOpen: boolean;
  onClose: () => void;
}

export default function DirectRequestModal({ provider, isOpen, onClose }: DirectRequestModalProps) {
  const { addMission } = useMissionsStore();
  const { venues, activeVenueId } = useVenuesStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isUrgent, setIsUrgent] = useState(false);
  const [selectedVenueId, setSelectedVenueId] = useState('');

  // Set default venue when modal opens or venues load
  useEffect(() => {
    if (isOpen && !selectedVenueId) {
      if (activeVenueId) {
        setSelectedVenueId(activeVenueId);
      } else if (venues.length > 0) {
        setSelectedVenueId(venues[0].id);
      }
    }
  }, [isOpen, activeVenueId, venues, selectedVenueId]);

  if (!isOpen || !mounted) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const selectedVenue = venues.find(v => v.id === selectedVenueId);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const newMission: Mission = {
      id: `m-${Date.now()}`,
      title,
      description,
      status: 'SEARCHING', // Starts as searching, but targeted
      expert: `${provider.firstName} ${provider.lastName.charAt(0)}.`, // Targeted expert name
      provider: {
        id: provider.id,
        name: `${provider.firstName} ${provider.lastName}`,
        rating: provider.stats.rating,
        completedMissions: provider.stats.missionsCompleted,
        bio: provider.bio,
        phone: '06 12 34 56 78', // Mock phone
        avatar: provider.avatarUrl
      },
      date: `${date} ${time}`,
      urgent: isUrgent,
      location: {
        lat: 48.8566,
        lng: 2.3522,
        address: selectedVenue ? `${selectedVenue.address}, ${selectedVenue.city}` : 'Adresse inconnue'
      },
      price: 'Sur devis', // Default for direct request
      category: 'OTHER', // General fallback
      iconName: 'Zap',
      color: isUrgent ? 'red' : 'blue',
      venue: selectedVenue?.name || 'Établissement inconnu',
      venueId: selectedVenueId || 'v1'
    };

    addMission(newMission);
    setIsSubmitting(false);
    setShowSuccess(true);

    // Close after success message
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 2000);
  };

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
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
      >
        {/* Success Overlay */}
        {showSuccess && (
          <div className="absolute inset-0 z-50 bg-[var(--bg-sidebar)] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Demande envoyée !</h3>
            <p className="text-[var(--text-secondary)]">
              Votre demande a été transmise à {provider.firstName}.<br/>
              Vous recevrez une réponse rapidement.
            </p>
          </div>
        )}

        {/* Header */}
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-card)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">Solliciter {provider.firstName}</h2>
            <p className="text-sm text-blue-400">{provider.title}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[var(--bg-active)] rounded-full transition-colors">
            <X className="w-6 h-6 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          <form id="request-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Title */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-secondary)] uppercase">Titre de la mission</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Dépannage four, Extra service..."
                className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date
                </label>
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Heure
                </label>
                <input
                  required
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                />
              </div>
            </div>

            {/* Venue Selector */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Établissement
              </label>
              <div className="relative">
                <select
                  required
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors appearance-none cursor-pointer"
                >
                  <option value="" disabled>Choisir un établissement</option>
                  {venues.map((venue) => (
                    <option key={venue.id} value={venue.id} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                      {venue.name} - {venue.city}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-secondary)]">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              {selectedVenueId && (
                <p className="text-xs text-[var(--text-muted)] ml-1">
                  {venues.find(v => v.id === selectedVenueId)?.address}, {venues.find(v => v.id === selectedVenueId)?.zipCode} {venues.find(v => v.id === selectedVenueId)?.city}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-[var(--text-secondary)] uppercase flex items-center gap-2">
                <FileText className="w-4 h-4" /> Description
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Détaillez votre besoin..."
                className="w-full bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl p-4 text-[var(--text-primary)] focus:outline-none focus:border-blue-500 transition-colors resize-none"
              />
            </div>

            {/* Urgency Toggle */}
            <div 
              onClick={() => setIsUrgent(!isUrgent)}
              className={clsx(
                "flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all",
                isUrgent 
                  ? "bg-red-500/10 border-red-500/50" 
                  : "bg-[var(--bg-hover)] border-[var(--border)] hover:border-[var(--border-strong)]"
              )}
            >
              <div className={clsx(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors",
                isUrgent ? "bg-red-500 text-white" : "bg-[var(--bg-active)] text-[var(--text-secondary)]"
              )}>
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className={clsx("font-bold", isUrgent ? "text-red-400" : "text-[var(--text-primary)]")}>Urgence</div>
                <div className="text-xs text-[var(--text-secondary)]">Cette mission nécessite une intervention immédiate (+20%)</div>
              </div>
              <div className={clsx(
                "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors",
                isUrgent ? "border-red-500 bg-red-500" : "border-gray-500"
              )}>
                {isUrgent && <CheckCircle className="w-4 h-4 text-white" />}
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border)] bg-[var(--bg-card)]">
          <button
            form="request-form"
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 bg-white text-black rounded-xl font-bold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer la demande'
            )}
          </button>
        </div>

      </motion.div>
    </>,
    document.body
  );
}
