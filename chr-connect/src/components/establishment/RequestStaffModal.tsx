'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronLeft,
  Users,
  Calendar,
  Clock,
  Check,
  Send,
  Plus,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useMissionsStore } from '@/store/useMissionsStore';
import { STAFFING_NEEDS, type StaffingNeed } from '@/lib/equipmentProblems';

// ============================================================================
// TYPES
// ============================================================================

interface RequestStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type Step = 'select-role' | 'details' | 'success';

// ============================================================================
// ROLE SELECTION
// ============================================================================

interface RoleGridProps {
  roles: StaffingNeed[];
  selectedId: string | null;
  onSelect: (role: StaffingNeed) => void;
}

function RoleGrid({ roles, selectedId, onSelect }: RoleGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {roles.map((role) => {
        const isSelected = selectedId === role.id;

        return (
          <button
            key={role.id}
            onClick={() => onSelect(role)}
            className={cn(
              'p-4 rounded-xl border text-left transition-all',
              isSelected
                ? 'bg-purple-500/20 border-purple-500/50 ring-2 ring-purple-500/30'
                : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)]'
            )}
          >
            <div className="flex items-start gap-3">
              <div className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center',
                isSelected ? 'bg-purple-500/30' : 'bg-[var(--bg-active)]'
              )}>
                <Users className={cn('w-5 h-5', isSelected ? 'text-purple-400' : 'text-[var(--text-muted)]')} />
              </div>
              <div className="flex-1">
                <p className="text-[var(--text-primary)] font-medium">{role.role}</p>
                <p className="text-[var(--text-muted)] text-xs mt-0.5">{role.description}</p>
                <p className="text-[var(--text-muted)] text-xs mt-2">
                  ~{role.hourlyRate.min}€ - {role.hourlyRate.max}€/h
                </p>
              </div>
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

export function RequestStaffModal({ isOpen, onClose }: RequestStaffModalProps) {
  const { currentEstablishment } = useEstablishment();
  const { addMission } = useMissionsStore();

  // State
  const [step, setStep] = useState<Step>('select-role');
  const [selectedRole, setSelectedRole] = useState<StaffingNeed | null>(null);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [numberOfPeople, setNumberOfPeople] = useState(1);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset on open
  React.useEffect(() => {
    if (isOpen) {
      setStep('select-role');
      setSelectedRole(null);
      setDate('');
      setStartTime('');
      setEndTime('');
      setNumberOfPeople(1);
      setNotes('');
    }
  }, [isOpen]);

  // Calculate estimated cost
  const estimatedCost = React.useMemo(() => {
    if (!selectedRole || !startTime || !endTime) return null;

    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    let hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    if (hours < 0) hours += 24; // Handle overnight

    const minCost = Math.round(hours * selectedRole.hourlyRate.min * numberOfPeople);
    const maxCost = Math.round(hours * selectedRole.hourlyRate.max * numberOfPeople);

    return { min: minCost, max: maxCost, hours: Math.round(hours * 10) / 10 };
  }, [selectedRole, startTime, endTime, numberOfPeople]);

  // Handlers
  const handleRoleSelect = (role: StaffingNeed) => {
    setSelectedRole(role);
    setStep('details');
  };

  const handleBack = () => {
    if (step === 'details') {
      setStep('select-role');
    }
  };

  const handleSubmit = async () => {
    if (!selectedRole || !currentEstablishment || !date || !startTime || !endTime) return;

    setIsSubmitting(true);

    try {
      // Create staffing mission (equipmentId = null)
      const missionId = `mission_${Date.now()}`;
      const mission = {
        id: missionId,
        title: `${selectedRole.role} (x${numberOfPeople})`,
        venue: currentEstablishment.name,
        venueId: currentEstablishment.id,
        type: 'staff' as const,
        price: estimatedCost ? `${estimatedCost.min}€ - ${estimatedCost.max}€` : 'À déterminer',
        urgent: false,
        description: notes || `Besoin de ${numberOfPeople} ${selectedRole.role} le ${date} de ${startTime} à ${endTime}`,
        status: 'SEARCHING' as const,
        location: { lat: 48.8566, lng: 2.3522 },
        skills: [selectedRole.id],
        attributes: {
          role: [selectedRole.role],
          serviceType: 'extra',
        },
      };

      addMission(mission);
      setStep('success');
    } catch (error) {
      console.error('Failed to create staffing mission:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  const stepInfo = {
    'select-role': { title: 'Quel poste recherchez-vous ?', progress: 1 },
    'details': { title: 'Détails de la mission', progress: 2 },
    'success': { title: 'Demande envoyée !', progress: 3 },
  }[step];

  const isFormValid = date && startTime && endTime && numberOfPeople > 0;

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
                {step === 'details' && (
                  <button
                    onClick={handleBack}
                    className="w-8 h-8 rounded-full bg-[var(--bg-hover)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-[var(--text-primary)]" />
                  </button>
                )}
                <div>
                  <h2 className="text-xl font-semibold text-[var(--text-primary)]">{stepInfo.title}</h2>
                  {selectedRole && step !== 'select-role' && step !== 'success' && (
                    <p className="text-[var(--text-muted)] text-sm">{selectedRole.role}</p>
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
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i <= stepInfo.progress ? 'bg-purple-500' : 'bg-[var(--bg-active)]'
                    )}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {/* Step 1: Select Role */}
              {step === 'select-role' && (
                <motion.div
                  key="select-role"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                >
                  <RoleGrid
                    roles={STAFFING_NEEDS}
                    selectedId={selectedRole?.id || null}
                    onSelect={handleRoleSelect}
                  />
                </motion.div>
              )}

              {/* Step 2: Details */}
              {step === 'details' && selectedRole && (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  {/* Role Summary */}
                  <div className="bg-purple-500/20 border border-purple-500/40 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <Users className="w-6 h-6 text-purple-400" />
                      <div>
                        <p className="text-[var(--text-primary)] font-medium">{selectedRole.role}</p>
                        <p className="text-purple-300/70 text-sm">{selectedRole.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Date
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {/* Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Début
                      </label>
                      <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Fin
                      </label>
                      <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-purple-500/50"
                      />
                    </div>
                  </div>

                  {/* Number of People */}
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Nombre de personnes
                    </label>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setNumberOfPeople(Math.max(1, numberOfPeople - 1))}
                        className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
                      >
                        <Minus className="w-5 h-5 text-[var(--text-muted)]" />
                      </button>
                      <span className="text-3xl font-bold text-[var(--text-primary)] w-16 text-center">
                        {numberOfPeople}
                      </span>
                      <button
                        onClick={() => setNumberOfPeople(Math.min(10, numberOfPeople + 1))}
                        className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
                      >
                        <Plus className="w-5 h-5 text-[var(--text-muted)]" />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-sm text-[var(--text-muted)] mb-2 block">
                      Instructions particulières (optionnel)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Dress code, expérience requise, etc."
                      rows={3}
                      className="w-full p-4 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-purple-500/50"
                    />
                  </div>

                  {/* Estimated Cost */}
                  {estimatedCost && (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)]">Durée</span>
                        <span className="text-[var(--text-primary)]">{estimatedCost.hours}h × {numberOfPeople} pers.</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)]">Estimation</span>
                        <span className="text-[var(--text-primary)] font-semibold text-lg">
                          {estimatedCost.min}€ - {estimatedCost.max}€
                        </span>
                      </div>
                    </div>
                  )}
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
                    Nous recherchons les meilleurs profils pour votre service.
                  </p>

                  {selectedRole && estimatedCost && (
                    <div className="bg-[var(--bg-hover)] rounded-xl p-4 border border-[var(--border)] text-left">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)] text-sm">Poste</span>
                        <span className="text-[var(--text-primary)] font-medium">{selectedRole.role} (x{numberOfPeople})</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)] text-sm">Date</span>
                        <span className="text-[var(--text-primary)]">{date}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[var(--text-muted)] text-sm">Horaires</span>
                        <span className="text-[var(--text-primary)]">{startTime} - {endTime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--text-muted)] text-sm">Estimation</span>
                        <span className="text-[var(--text-primary)]">
                          {estimatedCost.min}€ - {estimatedCost.max}€
                        </span>
                      </div>
                    </div>
                  )}

                  <p className="text-[var(--text-muted)] text-sm mt-6">
                    Vous recevrez des candidatures dans les prochaines minutes.
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
                disabled={isSubmitting || !isFormValid}
                className={cn(
                  'w-full py-4 px-6 rounded-xl font-medium flex items-center justify-center gap-2 transition-all',
                  isFormValid && !isSubmitting
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
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
                    Publier la demande
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
