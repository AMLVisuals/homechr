'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  Camera,
  Upload,
  Check,
  ChevronRight,
  Zap,
  Clock,
  AlertCircle,
  Flame,
  Send,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import type { Equipment, FaultType, FaultSeverity } from '@/types/equipment';
import {
  FAULT_TYPES,
  EQUIPMENT_CATEGORY_LABELS,
} from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface FaultDeclarationModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: Equipment;
  onMissionCreated?: (missionId: string) => void;
  onSuccess?: () => void;
}

// ============================================================================
// SEVERITY BADGE
// ============================================================================

function SeverityBadge({ severity }: { severity: FaultSeverity }) {
  const config = {
    LOW: { label: 'Faible', color: 'bg-blue-500/20 text-blue-400 border-blue-500/40' },
    MEDIUM: { label: 'Moyen', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40' },
    HIGH: { label: 'Élevé', color: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
    CRITICAL: { label: 'Critique', color: 'bg-red-500/20 text-red-400 border-red-500/40' },
  };

  return (
    <span className={cn('text-xs px-2 py-0.5 rounded-full border', config[severity].color)}>
      {config[severity].label}
    </span>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FaultDeclarationModal({
  isOpen,
  onClose,
  equipment,
  onMissionCreated,
  onSuccess,
}: FaultDeclarationModalProps) {
  const { reportFault } = useEquipmentStore();
  const { addMission } = useMissionsStore();

  // Form state
  const [selectedFault, setSelectedFault] = useState<FaultType | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [urgency, setUrgency] = useState<'normal' | 'urgent'>('normal');

  // UI state
  const [step, setStep] = useState<'select' | 'details' | 'confirm' | 'success'>(
    'select'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMissionId, setCreatedMissionId] = useState<string | null>(null);

  // Get fault types for this equipment category
  const faultTypes = useMemo(() => {
    return FAULT_TYPES[equipment.category] || FAULT_TYPES.OTHER;
  }, [equipment.category]);

  // Handle photo upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).map((file) => ({
      id: `photo_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
  };

  // Remove photo
  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  // Handle fault selection
  const handleFaultSelect = (fault: FaultType) => {
    setSelectedFault(fault);
    setStep('details');
  };

  // Handle back navigation
  const handleBack = () => {
    if (step === 'details') {
      setStep('select');
      setSelectedFault(null);
    } else if (step === 'confirm') {
      setStep('details');
    }
  };

  // Handle submission
  const handleSubmit = async () => {
    if (!selectedFault) return;

    setIsSubmitting(true);

    try {
      // Report fault on equipment
      reportFault(equipment.id, selectedFault.id, description);

      // Create mission
      const missionId = `mission_${Date.now()}`;
      const mission = {
        id: missionId,
        title: `${selectedFault.label} - ${equipment.brand} ${equipment.model}`,
        venue: 'Le Bistrot Parisien', // This would come from context
        venueId: equipment.venueId,
        type: 'cold' as const, // Map based on category
        price: selectedFault.severity === 'CRITICAL' ? '200€ - 300€' : '100€ - 200€',
        urgent: urgency === 'urgent' || selectedFault.severity === 'CRITICAL',
        description: description || selectedFault.label,
        status: 'SEARCHING' as const,
        location: { lat: 48.8566, lng: 2.3522 },
        photos: photos.map((p) => p.url),
        attributes: {
          equipment: [equipment.category.toLowerCase()],
          machineType: equipment.model,
          urgency: urgency === 'urgent',
        },
        // Link to equipment
        machineId: equipment.id,
      };

      addMission(mission);
      setCreatedMissionId(missionId);
      setStep('success');

      if (onMissionCreated) {
        onMissionCreated(missionId);
      }
    } catch (error) {
      console.error('Failed to create mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset and close
  const handleClose = () => {
    setSelectedFault(null);
    setDescription('');
    setPhotos([]);
    setUrgency('normal');
    setStep('select');
    setCreatedMissionId(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#121212] border border-white/10 rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {step !== 'select' && step !== 'success' && (
                <button
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-white rotate-180" />
                </button>
              )}
              <div>
                <h2 className="text-xl font-semibold text-white">
                  {step === 'success' ? 'Demande envoyée' : 'Déclarer une panne'}
                </h2>
                <p className="text-white/50 text-sm">
                  {equipment.brand} {equipment.model}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Fault Type */}
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="p-6"
                >
                  <p className="text-white/60 text-sm mb-4">
                    Quel est le problème ?
                  </p>
                  <div className="space-y-3">
                    {faultTypes.map((fault) => (
                      <button
                        key={fault.id}
                        onClick={() => handleFaultSelect(fault)}
                        className="w-full p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-left transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'w-10 h-10 rounded-lg flex items-center justify-center',
                                fault.severity === 'CRITICAL'
                                  ? 'bg-red-500/20'
                                  : fault.severity === 'HIGH'
                                    ? 'bg-orange-500/20'
                                    : 'bg-yellow-500/20'
                              )}
                            >
                              <AlertTriangle
                                className={cn(
                                  'w-5 h-5',
                                  fault.severity === 'CRITICAL'
                                    ? 'text-red-400'
                                    : fault.severity === 'HIGH'
                                      ? 'text-orange-400'
                                      : 'text-yellow-400'
                                )}
                              />
                            </div>
                            <div>
                              <p className="text-white font-medium">{fault.label}</p>
                              <SeverityBadge severity={fault.severity} />
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 'details' && selectedFault && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="p-6 space-y-6"
                >
                  {/* Selected Fault Summary */}
                  <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <div className="flex items-center gap-3">
                      <AlertTriangle
                        className={cn(
                          'w-6 h-6',
                          selectedFault.severity === 'CRITICAL'
                            ? 'text-red-400'
                            : selectedFault.severity === 'HIGH'
                              ? 'text-orange-400'
                              : 'text-yellow-400'
                        )}
                      />
                      <div>
                        <p className="text-white font-medium">{selectedFault.label}</p>
                        <SeverityBadge severity={selectedFault.severity} />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
                      Description du problème (optionnel)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez le problème plus en détail..."
                      rows={4}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 resize-none focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  {/* Photos */}
                  <div>
                    <label className="text-sm text-white/60 mb-2 block">
                      Photos du problème (optionnel)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-xl overflow-hidden bg-white/5"
                        >
                          <img
                            src={photo.url}
                            alt="Fault photo"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}

                      {photos.length < 4 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors">
                          <Camera className="w-6 h-6 text-white/40" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="text-sm text-white/60 mb-3 block">
                      Niveau d&apos;urgence
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setUrgency('normal')}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-colors',
                          urgency === 'normal'
                            ? 'bg-blue-500/20 border-blue-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        )}
                      >
                        <Clock
                          className={cn(
                            'w-6 h-6 mb-2',
                            urgency === 'normal' ? 'text-blue-400' : 'text-white/40'
                          )}
                        />
                        <p
                          className={cn(
                            'font-medium',
                            urgency === 'normal' ? 'text-blue-300' : 'text-white'
                          )}
                        >
                          Normal
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          Intervention sous 24-48h
                        </p>
                      </button>

                      <button
                        onClick={() => setUrgency('urgent')}
                        className={cn(
                          'p-4 rounded-xl border text-left transition-colors',
                          urgency === 'urgent'
                            ? 'bg-red-500/20 border-red-500/50'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        )}
                      >
                        <Zap
                          className={cn(
                            'w-6 h-6 mb-2',
                            urgency === 'urgent' ? 'text-red-400' : 'text-white/40'
                          )}
                        />
                        <p
                          className={cn(
                            'font-medium',
                            urgency === 'urgent' ? 'text-red-300' : 'text-white'
                          )}
                        >
                          Urgent
                        </p>
                        <p className="text-white/50 text-xs mt-1">
                          Intervention dans l&apos;heure
                        </p>
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success State */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 text-center"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Demande envoyée !
                  </h3>
                  <p className="text-white/60 mb-6">
                    Nous recherchons un technicien disponible pour intervenir sur votre{' '}
                    {equipment.brand} {equipment.model}.
                  </p>

                  <div className="bg-white/5 rounded-xl p-4 border border-white/10 mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white/60 text-sm">Problème</span>
                      <span className="text-white font-medium">
                        {selectedFault?.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-white/60 text-sm">Urgence</span>
                      <span
                        className={cn(
                          'font-medium',
                          urgency === 'urgent' ? 'text-red-400' : 'text-blue-400'
                        )}
                      >
                        {urgency === 'urgent' ? 'Urgente' : 'Normale'}
                      </span>
                    </div>
                  </div>

                  <p className="text-white/40 text-sm">
                    Vous recevrez une notification dès qu&apos;un technicien acceptera la mission.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step === 'details' && (
            <div className="p-6 border-t border-white/10">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                  !isSubmitting
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                    />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Demander une intervention
                  </>
                )}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => {
                  handleClose();
                  onSuccess?.();
                }}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
