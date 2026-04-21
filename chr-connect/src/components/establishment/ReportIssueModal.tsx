'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Camera,
  Check,
  Send,
  Wrench,
  Clock,
  Zap,
  Trash2,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useEquipmentStore } from '@/store/useEquipmentStore';
import { useMissionsStore } from '@/store/useMissionsStore';
import {
  EQUIPMENT_PROBLEMS,
  SEVERITY_CONFIG,
  getProblemsForCategory,
  getMissionTypeFromCategory,
  type EquipmentProblem,
} from '@/lib/equipmentProblems';
import { EQUIPMENT_CATEGORY_LABELS, EQUIPMENT_STATUS_INFO } from '@/types/equipment';
import type { Equipment } from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedEquipment?: Equipment | null;
}

type Step = 'select-equipment' | 'select-problem' | 'details' | 'success';

// ============================================================================
// EQUIPMENT SELECTION GRID
// ============================================================================

interface EquipmentGridProps {
  equipment: Equipment[];
  selectedId: string | null;
  onSelect: (eq: Equipment) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

function EquipmentGrid({ equipment, selectedId, onSelect, searchQuery, onSearchChange }: EquipmentGridProps) {
  const filteredEquipment = equipment.filter(eq => {
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      eq.brand.toLowerCase().includes(search) ||
      eq.model.toLowerCase().includes(search) ||
      eq.nickname?.toLowerCase().includes(search) ||
      eq.location.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Rechercher un équipement..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-9 pr-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500/50"
        />
      </div>

      {/* Grid */}
      {filteredEquipment.length === 0 ? (
        <div className="text-center py-8">
          <Wrench className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
          <p className="text-[var(--text-muted)]">Aucun équipement trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
          {filteredEquipment.map((eq) => {
            const statusInfo = EQUIPMENT_STATUS_INFO[eq.status];
            const isSelected = selectedId === eq.id;

            return (
              <button
                key={eq.id}
                onClick={() => onSelect(eq)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  isSelected
                    ? 'bg-blue-500/20 border-blue-500/50 ring-2 ring-blue-500/30'
                    : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)]'
                )}
              >
                <div className="flex items-start gap-2">
                  {eq.photos.length > 0 ? (
                    <img
                      src={eq.photos[0].url}
                      alt={eq.brand}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-[var(--text-muted)]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                      {eq.nickname || `${eq.brand} ${eq.model}`}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs truncate">{eq.location}</p>
                    <span className={cn(
                      'inline-block mt-1 text-xs px-1.5 py-0.5 rounded',
                      statusInfo.bgColor,
                      statusInfo.color
                    )}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {isSelected && (
                    <Check className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PROBLEM SELECTION
// ============================================================================

interface ProblemGridProps {
  problems: EquipmentProblem[];
  selectedId: string | null;
  onSelect: (problem: EquipmentProblem) => void;
}

function ProblemGrid({ problems, selectedId, onSelect }: ProblemGridProps) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar pr-2">
      {problems.map((problem) => {
        const severityConfig = SEVERITY_CONFIG[problem.severity];
        const isSelected = selectedId === problem.id;

        return (
          <button
            key={problem.id}
            onClick={() => onSelect(problem)}
            className={cn(
              'w-full p-4 rounded-xl border text-left transition-all',
              isSelected
                ? `${severityConfig.bgColor} ${severityConfig.borderColor} ring-2 ring-offset-2 ring-offset-[#121212]`
                : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)]'
            )}
            style={isSelected ? { '--tw-ring-color': severityConfig.color.replace('text-', 'rgb(var(--') } as React.CSSProperties : undefined}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                  severityConfig.bgColor
                )}>
                  <AlertTriangle className={cn('w-5 h-5', severityConfig.color)} />
                </div>
                <div>
                  <p className="text-[var(--text-primary)] font-medium">{problem.label}</p>
                  <p className="text-[var(--text-muted)] text-sm mt-0.5">{problem.description}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border',
                      severityConfig.bgColor,
                      severityConfig.color,
                      severityConfig.borderColor
                    )}>
                      {severityConfig.label}
                    </span>
                    <span className="text-[var(--text-muted)] text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {problem.estimatedResponseTime}
                    </span>
                  </div>
                </div>
              </div>
              {isSelected && (
                <Check className={cn('w-5 h-5 flex-shrink-0', severityConfig.color)} />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ReportIssueModal({ isOpen, onClose, preselectedEquipment }: ReportIssueModalProps) {
  const { currentEstablishment, equipment } = useEstablishment();
  const { reportFault } = useEquipmentStore();
  const { syncAddMission } = useMissionsStore();

  // State
  const [step, setStep] = useState<Step>(preselectedEquipment ? 'select-problem' : 'select-equipment');
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(preselectedEquipment || null);
  const [selectedProblem, setSelectedProblem] = useState<EquipmentProblem | null>(null);
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<{ id: string; url: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdMissionId, setCreatedMissionId] = useState<string | null>(null);

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setStep(preselectedEquipment ? 'select-problem' : 'select-equipment');
      setSelectedEquipment(preselectedEquipment || null);
      setSelectedProblem(null);
      setDescription('');
      setPhotos([]);
      setSearchQuery('');
      setCreatedMissionId(null);
    }
  }, [isOpen, preselectedEquipment]);

  // Get problems for selected equipment
  const problems = useMemo(() => {
    if (!selectedEquipment) return [];
    return getProblemsForCategory(selectedEquipment.category);
  }, [selectedEquipment]);

  // Handlers
  const handleEquipmentSelect = (eq: Equipment) => {
    setSelectedEquipment(eq);
    setStep('select-problem');
  };

  const handleProblemSelect = (problem: EquipmentProblem) => {
    setSelectedProblem(problem);
    setStep('details');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newPhotos = Array.from(files).map((file) => ({
      id: `photo_${Date.now()}_${Math.random()}`,
      url: URL.createObjectURL(file),
    }));

    setPhotos((prev) => [...prev, ...newPhotos].slice(0, 4));
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photoId));
  };

  const handleBack = () => {
    if (step === 'select-problem') {
      setStep('select-equipment');
      setSelectedProblem(null);
    } else if (step === 'details') {
      setStep('select-problem');
    }
  };

  const handleSubmit = async () => {
    if (!selectedEquipment || !selectedProblem || !currentEstablishment) return;

    setIsSubmitting(true);

    try {
      // Update equipment status
      reportFault(selectedEquipment.id, selectedProblem.id, description || selectedProblem.label);

      // Create mission
      const missionId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `mission_${Date.now()}`;
      const mission = {
        id: missionId,
        title: `${selectedProblem.label} - ${selectedEquipment.brand} ${selectedEquipment.model}`,
        venue: currentEstablishment.name,
        venueId: currentEstablishment.id,
        type: getMissionTypeFromCategory(selectedEquipment.category) as any,
        price: `${selectedProblem.priceRange.min}€ - ${selectedProblem.priceRange.max}€`,
        urgent: selectedProblem.severity === 'CRITICAL' || selectedProblem.severity === 'HIGH',
        description: description || selectedProblem.description,
        status: 'SEARCHING' as const,
        location: { lat: 48.8566, lng: 2.3522 }, // Would come from establishment
        photos: photos.map((p) => p.url),
        skills: selectedProblem.requiredSkills,
        attributes: {
          equipment: [selectedEquipment.category.toLowerCase()],
          machineType: selectedEquipment.model,
        },
      };

      await syncAddMission(mission as any);
      setCreatedMissionId(missionId);
      setStep('success');
    } catch (error: any) {
      console.error('Failed to create mission:', error);
      alert(`Erreur : ${error?.message || 'inconnue'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  // Get step info
  const stepInfo = {
    'select-equipment': { title: 'Sélectionnez l\'équipement', progress: 1 },
    'select-problem': { title: 'Quel est le problème ?', progress: 2 },
    'details': { title: 'Détails supplémentaires', progress: 3 },
    'success': { title: 'Demande envoyée !', progress: 4 },
  }[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-3xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {step !== 'select-equipment' && step !== 'success' && (
                  <button
                    onClick={handleBack}
                    className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[var(--text-primary)]" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{stepInfo.title}</h2>
                  {selectedEquipment && step !== 'select-equipment' && step !== 'success' && (
                    <p className="text-[var(--text-muted)] text-sm">
                      {selectedEquipment.brand} {selectedEquipment.model}
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Progress */}
            {step !== 'success' && (
              <div className="flex gap-2 mt-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= stepInfo.progress ? 'bg-blue-500' : 'bg-[var(--bg-active)]'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Equipment */}
              {step === 'select-equipment' && (
                <motion.div
                  key="select-equipment"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <EquipmentGrid
                    equipment={equipment}
                    selectedId={selectedEquipment?.id || null}
                    onSelect={handleEquipmentSelect}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  />
                </motion.div>
              )}

              {/* Step 2: Select Problem */}
              {step === 'select-problem' && selectedEquipment && (
                <motion.div
                  key="select-problem"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  {/* Equipment Summary */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-3 mb-4 flex items-center gap-3">
                    {selectedEquipment.photos.length > 0 ? (
                      <img
                        src={selectedEquipment.photos[0].url}
                        alt={selectedEquipment.brand}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-[var(--bg-active)] flex items-center justify-center">
                        <Wrench className="w-6 h-6 text-[var(--text-muted)]" />
                      </div>
                    )}
                    <div>
                      <p className="text-[var(--text-primary)] font-medium">
                        {selectedEquipment.nickname || `${selectedEquipment.brand} ${selectedEquipment.model}`}
                      </p>
                      <p className="text-[var(--text-muted)] text-sm">
                        {EQUIPMENT_CATEGORY_LABELS[selectedEquipment.category]} • {selectedEquipment.location}
                      </p>
                    </div>
                  </div>

                  <p className="text-[var(--text-muted)] text-sm mb-4">
                    Sélectionnez le problème rencontré :
                  </p>

                  <ProblemGrid
                    problems={problems}
                    selectedId={selectedProblem?.id || null}
                    onSelect={handleProblemSelect}
                  />
                </motion.div>
              )}

              {/* Step 3: Details */}
              {step === 'details' && selectedProblem && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Problem Summary */}
                  <div className={cn(
                    'rounded-xl p-4 border',
                    SEVERITY_CONFIG[selectedProblem.severity].bgColor,
                    SEVERITY_CONFIG[selectedProblem.severity].borderColor
                  )}>
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={cn('w-6 h-6', SEVERITY_CONFIG[selectedProblem.severity].color)} />
                      <div>
                        <p className="text-[var(--text-primary)] font-medium">{selectedProblem.label}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            'text-xs px-2 py-0.5 rounded-full border',
                            SEVERITY_CONFIG[selectedProblem.severity].bgColor,
                            SEVERITY_CONFIG[selectedProblem.severity].color,
                            SEVERITY_CONFIG[selectedProblem.severity].borderColor
                          )}>
                            {SEVERITY_CONFIG[selectedProblem.severity].label}
                          </span>
                          <span className="text-[var(--text-muted)] text-xs">
                            Intervention {selectedProblem.estimatedResponseTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Décrivez le problème plus en détail..."
                      rows={3}
                      className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-blue-500/50"
                    />
                  </div>

                  {/* Photos */}
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">
                      Photos (optionnel)
                    </label>
                    <div className="grid grid-cols-4 gap-3">
                      {photos.map((photo) => (
                        <div
                          key={photo.id}
                          className="relative aspect-square rounded-xl overflow-hidden bg-[var(--bg-hover)]"
                        >
                          <img
                            src={photo.url}
                            alt="Issue"
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() => removePhoto(photo.id)}
                            className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center"
                          >
                            <Trash2 className="w-3 h-3 text-[var(--text-primary)]" />
                          </button>
                        </div>
                      ))}

                      {photos.length < 4 && (
                        <label className="aspect-square rounded-xl border-2 border-dashed border-[var(--border-strong)] flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-colors">
                          <Camera className="w-6 h-6 text-[var(--text-muted)]" />
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

                  {/* Estimated Price */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--text-muted)]">Estimation</span>
                      <span className="text-[var(--text-primary)] font-semibold">
                        {selectedProblem.priceRange.min}€ - {selectedProblem.priceRange.max}€
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Success */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
                    <Check className="w-10 h-10 text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">
                    Demande envoyée !
                  </h3>
                  <p className="text-[var(--text-muted)] mb-6">
                    Nous recherchons un technicien disponible pour intervenir.
                  </p>

                  {selectedProblem && (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)] text-sm">Problème</span>
                        <span className="text-[var(--text-primary)] font-medium">{selectedProblem.label}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)] text-sm">Délai estimé</span>
                        <span className="text-[var(--text-primary)]">{selectedProblem.estimatedResponseTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-sm">Estimation</span>
                        <span className="text-[var(--text-primary)]">
                          {selectedProblem.priceRange.min}€ - {selectedProblem.priceRange.max}€
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[var(--text-muted)] text-sm mt-6">
                    Vous recevrez une notification dès qu'un technicien acceptera la mission.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          {step === 'details' && (
            <div className="p-6 border-t border-[var(--border)]">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                  !isSubmitting
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700'
                    : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                {isSubmitting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-5 h-5 border-2 border-[var(--border-strong)] border-t-white rounded-full"
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
            <div className="p-6 border-t border-[var(--border)]">
              <button
                onClick={handleClose}
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
