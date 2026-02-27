'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Star, Users, Ruler, X, Phone, Mail, Globe, Clock, ShieldCheck, Utensils, Coffee } from 'lucide-react';
import { useVenuesStore } from '@/store/useVenuesStore';
import { Venue } from '@/types/venue';
import { useState } from 'react';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import type { EquipmentDocument } from '@/types/equipment';

interface EstablishmentSheetProps {
  venueId?: string;
  venueName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EstablishmentSheet({ venueId, venueName, isOpen, onClose }: EstablishmentSheetProps) {
  const { getVenue } = useVenuesStore();
  const [selectedDocument, setSelectedDocument] = useState<EquipmentDocument | null>(null);
  const storedVenue = venueId ? getVenue(venueId) : undefined;

  // Construct venueDetails from storedVenue or fallback to mock data
  const venueDetails = storedVenue ? {
    name: storedVenue.name,
    address: `${storedVenue.address}, ${storedVenue.zipCode} ${storedVenue.city}`,
    category: storedVenue.category,
    rating: storedVenue.rating || 4.5,
    reviews: storedVenue.reviewCount || 0,
    description: "Institution de la gastronomie, cet établissement propose une cuisine raffinée dans un cadre élégant.",
    teamSize: storedVenue.teamSize || 20,
    surface: storedVenue.surface || 200,
    photos: storedVenue.photos.length > 0 
      ? storedVenue.photos.map(p => ({ url: p.url, caption: p.caption })) 
      : [storedVenue.photoUrl || "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop"],
    equipment: storedVenue.equipment 
      ? Object.keys(storedVenue.equipment).filter(k => storedVenue.equipment![k as keyof typeof storedVenue.equipment]).map(k => k.replace(/([A-Z])/g, ' $1').trim()) 
      : ["Cuisine Professionnelle", "Vestiaires"],
    hours: "11:00 - 23:00", // Placeholder
    phone: storedVenue.access?.phone || "+33 1 00 00 00 00",
    email: "contact@etablissement.com", // Placeholder
    website: "www.etablissement.com" // Placeholder
  } : {
    // Fallback Mock data based on the venue name
    name: venueName,
    address: "12 Avenue Montaigne, 75008 Paris",
    category: "Restaurant Gastronomique",
    rating: 4.8,
    reviews: 124,
    description: "Institution de la gastronomie française, cet établissement propose une cuisine raffinée dans un cadre élégant et historique. Notre équipe s'engage à offrir une expérience inoubliable à chaque client.",
    teamSize: 45,
    surface: 450,
    photos: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?q=80&w=2670&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=2574&auto=format&fit=crop"
    ],
    equipment: ["Cuisine Professionnelle", "Chambre Froide", "Vestiaires", "Parking Privé"],
    hours: "11:00 - 23:00",
    phone: "+33 1 44 55 66 77",
    email: "contact@ambroisie.paris",
    website: "www.ambroisie-paris.com"
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
            className="absolute inset-0 bg-black/60 z-[700] backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            className="absolute bottom-0 left-0 right-0 z-[800] bg-[var(--bg-card)] border-t border-[var(--border)] rounded-t-[32px] overflow-hidden shadow-2xl h-[90vh]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            {/* Handle */}
            <div className="flex justify-center py-3 bg-gradient-to-b from-[var(--bg-hover)] to-transparent absolute top-0 left-0 right-0 z-20">
              <div className="w-12 h-1.5 bg-[var(--bg-active)] rounded-full" />
            </div>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors border border-[var(--border)]"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Cover Photo */}
            <div className="h-64 w-full relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--bg-card)]" />
              <img 
                src={typeof venueDetails.photos[0] === 'string' ? venueDetails.photos[0] : venueDetails.photos[0].url} 
                alt={venueDetails.name} 
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute bottom-0 left-0 right-0 p-6 pt-20 bg-gradient-to-t from-[var(--bg-card)] via-[var(--bg-card)]/80 to-transparent">
                <div className="flex items-start justify-between">
                   <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md bg-[var(--bg-active)] border border-[var(--border)] backdrop-blur-md text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          {venueDetails.category}
                        </span>
                        <span className="px-2 py-1 rounded-md bg-green-500/20 border border-green-500/30 text-xs font-bold text-green-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Ouvert
                        </span>
                      </div>
                      <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-1">{venueDetails.name}</h2>
                      <div className="flex items-center text-[var(--text-secondary)] text-sm">
                        <MapPin className="h-4 w-4 mr-1 text-[var(--text-muted)]" />
                        <span>{venueDetails.address}</span>
                      </div>
                   </div>
                   <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                         <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                         <span className="font-bold text-yellow-500">{venueDetails.rating}</span>
                         <span className="text-xs text-yellow-500/70">({venueDetails.reviews})</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-8 h-[calc(90vh-16rem)] overflow-y-auto custom-scrollbar">
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                <div className="bg-[var(--bg-hover)] rounded-2xl p-3 border border-[var(--border)] flex flex-col items-center justify-center text-center">
                  <Users className="h-5 w-5 text-blue-400 mb-1" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">{venueDetails.teamSize}</span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Employés</span>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-2xl p-3 border border-[var(--border)] flex flex-col items-center justify-center text-center">
                  <Ruler className="h-5 w-5 text-purple-400 mb-1" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">{venueDetails.surface}</span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">m² Surface</span>
                </div>
                <div className="bg-[var(--bg-hover)] rounded-2xl p-3 border border-[var(--border)] flex flex-col items-center justify-center text-center">
                  <ShieldCheck className="h-5 w-5 text-green-400 mb-1" />
                  <span className="text-lg font-bold text-[var(--text-primary)]">Vérifié</span>
                  <span className="text-[10px] text-[var(--text-muted)] uppercase">Status</span>
                </div>
              </div>
              
              {/* Description */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide">À propos</h3>
                <p className="text-[var(--text-secondary)] leading-relaxed text-sm">{venueDetails.description}</p>
              </div>

              {/* Photos Gallery */}
              <div className="mb-8">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Photos de l'établissement</h3>
                <div className="grid grid-cols-2 gap-3">
                   {venueDetails.photos.map((photo, idx) => {
                      const url = typeof photo === 'string' ? photo : photo.url;
                      return (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedDocument({
                            id: `venue-photo-${idx}`,
                            name: `Photo établissement ${idx + 1}`,
                            type: 'OTHER',
                            url: url,
                            date: new Date().toISOString(),
                            size: '0 MB'
                          })}
                          className={`rounded-xl overflow-hidden border border-[var(--border)] relative w-full text-left group ${idx === 0 ? 'col-span-2 h-48' : 'h-32'}`}
                        >
                           <img src={url} alt={`Venue ${idx}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                        </button>
                      );
                   })}
                </div>
              </div>

              {/* Contact & Infos */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3 uppercase tracking-wide">Contact & Accès</h3>
                
                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[var(--bg-active)] flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-[var(--text-primary)]" />
                   </div>
                   <div>
                      <p className="text-xs text-[var(--text-secondary)] uppercase">Téléphone</p>
                      <p className="text-[var(--text-primary)] font-medium">{venueDetails.phone}</p>
                   </div>
                </div>

                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[var(--bg-active)] flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-[var(--text-primary)]" />
                   </div>
                   <div>
                      <p className="text-xs text-[var(--text-secondary)] uppercase">Email</p>
                      <p className="text-[var(--text-primary)] font-medium">{venueDetails.email}</p>
                   </div>
                </div>

                <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] flex items-center gap-4">
                   <div className="w-10 h-10 rounded-full bg-[var(--bg-active)] flex items-center justify-center shrink-0">
                      <Globe className="w-5 h-5 text-[var(--text-primary)]" />
                   </div>
                   <div>
                      <p className="text-xs text-[var(--text-secondary)] uppercase">Site Web</p>
                      <p className="text-[var(--text-primary)] font-medium">{venueDetails.website}</p>
                   </div>
                </div>
              </div>

            </div>
          </motion.div>

          <DocumentViewer
            document={selectedDocument}
            isOpen={!!selectedDocument}
            onClose={() => setSelectedDocument(null)}
            readonly={true}
          />
        </>
      )}
    </AnimatePresence>
  );
}
