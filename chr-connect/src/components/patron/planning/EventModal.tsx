'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, Clock, MapPin, AlignLeft, Tag, Building2, StickyNote, Camera, Video, Mic, Paperclip, StopCircle } from 'lucide-react';
import { CalendarEvent, EventType, useCalendarStore } from '@/store/calendarStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { EquipmentDocument, ImageAnnotation } from '@/types/equipment';
import { clsx } from 'clsx';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate?: string;
  existingEvent?: CalendarEvent;
  onSuccess?: (eventData: any) => void;
}

const EVENT_TYPES: { id: EventType; label: string; color: string }[] = [
  { id: 'MAINTENANCE', label: 'Maintenance', color: 'bg-blue-500' },
  { id: 'STAFFING', label: 'Staffing', color: 'bg-orange-500' },
  { id: 'SUPPLY', label: 'Livraison', color: 'bg-purple-500' },
  { id: 'EVENT', label: 'Événement', color: 'bg-emerald-500' },
  { id: 'NOTE', label: 'Note / Mémo', color: 'bg-yellow-500' },
  { id: 'OTHER', label: 'Autre', color: 'bg-gray-500' },
];

export default function EventModal({ isOpen, onClose, selectedDate, existingEvent, onSuccess }: EventModalProps) {
  const { addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { venues, activeVenueId } = useVenuesStore();
  
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    date: selectedDate || new Date().toISOString().split('T')[0],
    time: '09:00',
    endTime: '10:00',
    type: 'MAINTENANCE' as EventType,
    venueId: '',
    location: '',
    description: '',
    media: [] as { id: string, type: 'image' | 'video' | 'audio', url: string, name: string, annotations?: ImageAnnotation[] }[]
  });

  const [viewingDocument, setViewingDocument] = useState<EquipmentDocument | null>(null);

  useEffect(() => {
    if (existingEvent) {
      setFormData({
        title: existingEvent.title,
        date: existingEvent.date,
        time: existingEvent.time,
        endTime: existingEvent.endTime || '',
        type: existingEvent.type,
        venueId: existingEvent.venueId || '',
        location: existingEvent.location || '',
        description: existingEvent.description || '',
        media: existingEvent.media || []
      });
    } else {
      setFormData(prev => ({
        ...prev,
        date: selectedDate || new Date().toISOString().split('T')[0],
        venueId: activeVenueId || (venues.length > 0 ? venues[0].id : ''),
        media: []
      }));
    }
  }, [existingEvent, selectedDate, isOpen, venues, activeVenueId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const newMedia = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'audio' as const,
          url: audioUrl,
          name: `Vocal ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
        };
        setFormData(prev => ({ ...prev, media: [...prev.media, newMedia] }));
        
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Impossible d'accéder au microphone. Veuillez vérifier les permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video' | 'audio') => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const newMedia = {
        id: Math.random().toString(36).substr(2, 9),
        type,
        url: URL.createObjectURL(file),
        name: file.name
      };
      setFormData(prev => ({ ...prev, media: [...prev.media, newMedia] }));
    }
  };

  const removeMedia = (id: string) => {
    setFormData(prev => ({ ...prev, media: prev.media.filter(m => m.id !== id) }));
  };

  const handleViewMedia = (media: { id: string, type: 'image' | 'video' | 'audio', url: string, name: string, annotations?: ImageAnnotation[] }) => {
    const doc: EquipmentDocument = {
      id: media.id,
      name: media.name,
      url: media.url,
      type: 'OTHER',
      uploadedAt: new Date().toISOString(),
      mimeType: media.type === 'image' ? 'image/jpeg' : media.type === 'video' ? 'video/mp4' : 'audio/wav',
      annotations: media.annotations
    };
    setViewingDocument(doc);
  };

  const handleSaveDocument = (updatedDoc: EquipmentDocument) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.map(m => 
        m.id === updatedDoc.id 
          ? { ...m, annotations: updatedDoc.annotations } 
          : m
      )
    }));
    setViewingDocument(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (existingEvent) {
      updateEvent(existingEvent.id, formData);
    } else {
      addEvent(formData);
    }
    if (onSuccess) onSuccess(formData);
    onClose();
  };

  const handleDelete = () => {
    if (existingEvent && confirm('Voulez-vous vraiment supprimer cet événement ?')) {
      deleteEvent(existingEvent.id);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div 
        initial={{ scale: 0.95, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 20, opacity: 0 }}
        className="relative w-full max-w-lg bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold text-white">
            {existingEvent ? 'Modifier l\'événement' : 'Nouvel événement'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="overflow-y-auto custom-scrollbar">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            
            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Titre</label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Ex: Maintenance Clim..."
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Type</label>
              <div className="flex flex-wrap gap-2">
                {EVENT_TYPES.map(type => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({...formData, type: type.id})}
                    className={clsx(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                      formData.type === type.id 
                        ? "bg-white text-black border-white" 
                        : "bg-transparent text-gray-400 border-white/10 hover:border-white/30"
                    )}
                  >
                    <span className={clsx("inline-block w-2 h-2 rounded-full mr-2", type.color)} />
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                    <Clock className="w-3 h-3" /> Début
                  </label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-sm text-center"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Fin</label>
                  <input 
                    type="time" 
                    value={formData.endTime}
                    onChange={e => setFormData({...formData, endTime: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-blue-500 text-sm text-center"
                  />
                </div>
              </div>
            </div>

            {/* Venue Selection */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Building2 className="w-3 h-3" /> Établissement
              </label>
              <select
                value={formData.venueId || 'GLOBAL'}
                onChange={e => setFormData({...formData, venueId: e.target.value === 'GLOBAL' ? '' : e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm cursor-pointer"
              >
                <option value="GLOBAL" className="bg-[#1a1a1a] font-bold text-blue-400">🌍 Global (Tous les établissements)</option>
                {venues.map(venue => (
                  <option key={venue.id} value={venue.id} className="bg-[#1a1a1a]">
                    {venue.name} - {venue.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Details */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Lieu / Équipement
              </label>
              <input 
                type="text" 
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm"
                placeholder="Ex: Chambre Froide, Four, Salle..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <AlignLeft className="w-3 h-3" /> Description
              </label>
              <textarea 
                rows={3}
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-blue-500 text-sm resize-none"
                placeholder="Détails supplémentaires..."
              />
            </div>

            {/* Media Attachments */}
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                <Paperclip className="w-3 h-3" /> Pièces Jointes
              </label>
              
              <div className="flex gap-2 mb-4">
                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/20 hover:bg-white/5 transition-all group">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                  <Camera className="w-5 h-5 text-gray-400 group-hover:text-blue-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-white">Photo</span>
                </label>
                <label className="flex-1 cursor-pointer flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-white/20 hover:bg-white/5 transition-all group">
                  <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'video')} />
                  <Video className="w-5 h-5 text-gray-400 group-hover:text-purple-400 mb-1" />
                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-white">Vidéo</span>
                </label>
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={clsx(
                    "flex-1 flex flex-col items-center justify-center p-3 rounded-xl border border-dashed transition-all group relative overflow-hidden",
                    isRecording ? "border-red-500 bg-red-500/10" : "border-white/20 hover:bg-white/5"
                  )}
                >
                  {isRecording ? (
                    <>
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="absolute inset-0 bg-red-500/5"
                      />
                      <StopCircle className="w-5 h-5 text-red-500 mb-1 relative z-10" />
                      <span className="text-[10px] font-bold text-red-500 relative z-10">Stop (Rec)</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5 text-gray-400 group-hover:text-red-400 mb-1" />
                      <span className="text-[10px] font-bold text-gray-500 group-hover:text-white">Vocal</span>
                    </>
                  )}
                </button>
              </div>

              {formData.media.length > 0 && (
                <div className="space-y-2">
                  {formData.media.map(media => (
                    <div 
                      key={media.id} 
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/10 group/item hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => handleViewMedia(media)}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          media.type === 'image' ? 'bg-blue-500/20 text-blue-400' :
                          media.type === 'video' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-red-500/20 text-red-400'
                        )}>
                          {media.type === 'image' && <Camera className="w-4 h-4" />}
                          {media.type === 'video' && <Video className="w-4 h-4" />}
                          {media.type === 'audio' && <Mic className="w-4 h-4" />}
                        </div>
                        <span className="text-xs text-gray-300 truncate group-hover/item:text-white transition-colors">{media.name}</span>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeMedia(media.id);
                        }}
                        className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-white/10">
              {existingEvent && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold transition-colors"
                >
                  Supprimer
                </button>
              )}
              <button 
                type="submit"
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold transition-colors"
              >
                {existingEvent ? 'Enregistrer' : 'Créer l\'événement'}
              </button>
            </div>

          </form>
        </div>
      </motion.div>

      <DocumentViewer
        isOpen={!!viewingDocument}
        onClose={() => setViewingDocument(null)}
        document={viewingDocument}
        onSave={handleSaveDocument}
        readonly={false}
      />
    </div>
  );
}
