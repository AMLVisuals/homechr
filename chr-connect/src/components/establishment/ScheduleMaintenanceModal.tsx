'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Wrench,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Repeat,
  Bell,
  CalendarDays,
  Settings,
  Snowflake,
  Flame,
  Coffee,
  Wind,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import type { Equipment } from '@/types/equipment';

// ============================================================================
// TYPES
// ============================================================================

interface ScheduleMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preselectedEquipment?: Equipment;
}

type MaintenanceType = 'PREVENTIVE' | 'INSPECTION' | 'CALIBRATION' | 'CLEANING' | 'REPLACEMENT';
type RecurrenceType = 'ONCE' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'BIANNUAL' | 'ANNUAL';

interface MaintenanceTypeOption {
  id: MaintenanceType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  estimatedDuration: string;
}

interface RecurrenceOption {
  id: RecurrenceType;
  label: string;
  description: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAINTENANCE_TYPES: MaintenanceTypeOption[] = [
  {
    id: 'PREVENTIVE',
    label: 'Maintenance préventive',
    description: 'Entretien régulier pour prévenir les pannes',
    icon: <Settings className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    estimatedDuration: '1-2h',
  },
  {
    id: 'INSPECTION',
    label: 'Inspection',
    description: 'Vérification de l\'état général',
    icon: <AlertCircle className="w-5 h-5" />,
    color: 'from-amber-500 to-orange-500',
    estimatedDuration: '30min-1h',
  },
  {
    id: 'CALIBRATION',
    label: 'Calibration',
    description: 'Ajustement des paramètres',
    icon: <Wrench className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
    estimatedDuration: '1-2h',
  },
  {
    id: 'CLEANING',
    label: 'Nettoyage profond',
    description: 'Nettoyage complet de l\'équipement',
    icon: <Wind className="w-5 h-5" />,
    color: 'from-green-500 to-emerald-500',
    estimatedDuration: '2-3h',
  },
  {
    id: 'REPLACEMENT',
    label: 'Remplacement pièces',
    description: 'Changement de pièces d\'usure',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-red-500 to-rose-500',
    estimatedDuration: '2-4h',
  },
];

const RECURRENCE_OPTIONS: RecurrenceOption[] = [
  { id: 'ONCE', label: 'Une seule fois', description: 'Intervention unique' },
  { id: 'WEEKLY', label: 'Hebdomadaire', description: 'Chaque semaine' },
  { id: 'MONTHLY', label: 'Mensuel', description: 'Chaque mois' },
  { id: 'QUARTERLY', label: 'Trimestriel', description: 'Tous les 3 mois' },
  { id: 'BIANNUAL', label: 'Semestriel', description: 'Tous les 6 mois' },
  { id: 'ANNUAL', label: 'Annuel', description: 'Une fois par an' },
];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  FRIDGE: <Snowflake className="w-5 h-5" />,
  FREEZER: <Snowflake className="w-5 h-5" />,
  COLD_ROOM: <Snowflake className="w-5 h-5" />,
  OVEN: <Flame className="w-5 h-5" />,
  COOKING: <Flame className="w-5 h-5" />,
  COFFEE_MACHINE: <Coffee className="w-5 h-5" />,
  VENTILATION: <Wind className="w-5 h-5" />,
  default: <Wrench className="w-5 h-5" />,
};

// ============================================================================
// TIME SLOTS
// ============================================================================

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00',
  '14:00', '15:00', '16:00', '17:00', '18:00',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function ScheduleMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  preselectedEquipment,
}: ScheduleMaintenanceModalProps) {
  const { equipment } = useEstablishment();

  // Step management
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form state
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(
    preselectedEquipment || null
  );
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('ONCE');
  const [notes, setNotes] = useState('');
  const [notifyBefore, setNotifyBefore] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reset on close
  const handleClose = () => {
    setStep(1);
    setSelectedEquipment(preselectedEquipment || null);
    setMaintenanceType(null);
    setSelectedDate('');
    setSelectedTime('');
    setRecurrence('ONCE');
    setNotes('');
    onClose();
  };

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDay = firstDay.getDay() || 7; // Monday = 1

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean; isPast: boolean }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    for (let i = startingDay - 1; i > 0; i--) {
      const date = new Date(year, month, 1 - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: date < today,
      });
    }

    // Current month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.toDateString() === today.toDateString(),
        isPast: date < today,
      });
    }

    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
      });
    }

    return days;
  }, [currentMonth]);

  // Format date for comparison
  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  // Handle submit
  const handleSubmit = async () => {
    if (!selectedEquipment || !maintenanceType || !selectedDate || !selectedTime) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    console.log('Scheduling maintenance:', {
      equipment: selectedEquipment,
      type: maintenanceType,
      date: selectedDate,
      time: selectedTime,
      recurrence,
      notes,
      notifyBefore,
    });

    setIsSubmitting(false);
    onSuccess?.();
    handleClose();
  };

  // Get selected maintenance type details
  const selectedMaintenanceType = maintenanceType
    ? MAINTENANCE_TYPES.find(t => t.id === maintenanceType)
    : null;

  // Can proceed to next step
  const canProceed = () => {
    switch (step) {
      case 1:
        return selectedEquipment !== null && maintenanceType !== null;
      case 2:
        return selectedDate !== '' && selectedTime !== '';
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] bg-[var(--bg-card)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[var(--text-primary)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">Planifier maintenance</h2>
                  <p className="text-[var(--text-muted)] text-sm">
                    Étape {step} sur {totalSteps}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-[var(--bg-active)] rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[var(--text-muted)]" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="px-6 pt-4">
              <div className="flex gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      'h-1 flex-1 rounded-full transition-colors',
                      i < step ? 'bg-blue-500' : 'bg-[var(--bg-active)]'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <AnimatePresence mode="wait">
                {/* Step 1: Select Equipment & Type */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Equipment Selection */}
                    <div>
                      <h3 className="text-[var(--text-primary)] font-semibold mb-3">
                        Sélectionner l'équipement
                      </h3>
                      <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {equipment.map((eq) => (
                          <button
                            key={eq.id}
                            onClick={() => setSelectedEquipment(eq)}
                            className={cn(
                              'flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                              selectedEquipment?.id === eq.id
                                ? 'bg-blue-500/20 border-blue-500/50'
                                : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)]'
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text-muted)]">
                              {CATEGORY_ICONS[eq.category] || CATEGORY_ICONS.default}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[var(--text-primary)] text-sm font-medium truncate">
                                {eq.nickname || `${eq.brand} ${eq.model}`}
                              </p>
                              <p className="text-[var(--text-muted)] text-xs truncate">
                                {eq.brand} {eq.model}
                              </p>
                            </div>
                            {selectedEquipment?.id === eq.id && (
                              <Check className="w-4 h-4 text-blue-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Maintenance Type Selection */}
                    <div>
                      <h3 className="text-[var(--text-primary)] font-semibold mb-3">
                        Type de maintenance
                      </h3>
                      <div className="space-y-2">
                        {MAINTENANCE_TYPES.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => setMaintenanceType(type.id)}
                            className={cn(
                              'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                              maintenanceType === type.id
                                ? 'bg-[var(--bg-active)] border-[var(--border-strong)]'
                                : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)]'
                            )}
                          >
                            <div
                              className={cn(
                                'w-12 h-12 rounded-xl flex items-center justify-center text-[var(--text-primary)]',
                                `bg-gradient-to-br ${type.color}`
                              )}
                            >
                              {type.icon}
                            </div>
                            <div className="flex-1">
                              <p className="text-[var(--text-primary)] font-medium">{type.label}</p>
                              <p className="text-[var(--text-muted)] text-sm">{type.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-[var(--text-muted)] text-xs">Durée estimée</p>
                              <p className="text-[var(--text-muted)] text-sm">{type.estimatedDuration}</p>
                            </div>
                            {maintenanceType === type.id && (
                              <Check className="w-5 h-5 text-blue-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 2: Select Date & Time */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Calendar */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[var(--text-primary)] font-semibold">
                          Choisir la date
                        </h3>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setCurrentMonth(
                                new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
                              )
                            }
                            className="p-2 hover:bg-[var(--bg-active)] rounded-lg transition-colors"
                          >
                            <ChevronLeft className="w-4 h-4 text-[var(--text-muted)]" />
                          </button>
                          <span className="text-[var(--text-primary)] font-medium min-w-[140px] text-center">
                            {currentMonth.toLocaleDateString('fr-FR', {
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                          <button
                            onClick={() =>
                              setCurrentMonth(
                                new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
                              )
                            }
                            className="p-2 hover:bg-[var(--bg-active)] rounded-lg transition-colors"
                          >
                            <ChevronRight className="w-4 h-4 text-[var(--text-muted)]" />
                          </button>
                        </div>
                      </div>

                      {/* Days header */}
                      <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
                          <div
                            key={day}
                            className="h-8 flex items-center justify-center text-[var(--text-muted)] text-xs font-medium"
                          >
                            {day}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, index) => {
                          const dateStr = formatDateString(day.date);
                          const isSelected = selectedDate === dateStr;

                          return (
                            <button
                              key={index}
                              onClick={() => !day.isPast && setSelectedDate(dateStr)}
                              disabled={day.isPast}
                              className={cn(
                                'h-10 rounded-lg text-sm font-medium transition-all',
                                day.isPast && 'opacity-30 cursor-not-allowed',
                                !day.isCurrentMonth && 'text-[var(--text-muted)]',
                                day.isCurrentMonth && !isSelected && 'text-[var(--text-primary)] hover:bg-[var(--bg-active)]',
                                day.isToday && !isSelected && 'ring-1 ring-blue-500/50',
                                isSelected && 'bg-blue-500 text-white'
                              )}
                            >
                              {day.date.getDate()}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots */}
                    <div>
                      <h3 className="text-[var(--text-primary)] font-semibold mb-3">
                        Choisir l'heure
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => setSelectedTime(time)}
                            className={cn(
                              'px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                              selectedTime === time
                                ? 'bg-blue-500/20 border-blue-500/50 text-blue-400'
                                : 'bg-[var(--bg-hover)] border-[var(--border)] text-[var(--text-muted)] hover:bg-[var(--bg-active)]'
                            )}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Recurrence */}
                    <div>
                      <h3 className="text-[var(--text-primary)] font-semibold mb-3 flex items-center gap-2">
                        <Repeat className="w-4 h-4" />
                        Récurrence
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {RECURRENCE_OPTIONS.map((option) => (
                          <button
                            key={option.id}
                            onClick={() => setRecurrence(option.id)}
                            className={cn(
                              'px-4 py-3 rounded-xl border text-left transition-all',
                              recurrence === option.id
                                ? 'bg-blue-500/20 border-blue-500/50'
                                : 'bg-[var(--bg-hover)] border-[var(--border)] hover:bg-[var(--bg-active)]'
                            )}
                          >
                            <p className="text-[var(--text-primary)] text-sm font-medium">{option.label}</p>
                            <p className="text-[var(--text-muted)] text-xs">{option.description}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Confirmation */}
                {step === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    {/* Summary */}
                    <div className="bg-[var(--bg-hover)] rounded-2xl p-4 space-y-4">
                      <h3 className="text-[var(--text-primary)] font-semibold">Récapitulatif</h3>

                      {/* Equipment */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text-muted)]">
                          {selectedEquipment &&
                            (CATEGORY_ICONS[selectedEquipment.category] || CATEGORY_ICONS.default)}
                        </div>
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">
                            {selectedEquipment?.nickname || `${selectedEquipment?.brand} ${selectedEquipment?.model}`}
                          </p>
                          <p className="text-[var(--text-muted)] text-sm">
                            {selectedEquipment?.brand} {selectedEquipment?.model}
                          </p>
                        </div>
                      </div>

                      {/* Type */}
                      {selectedMaintenanceType && (
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center text-[var(--text-primary)]',
                              `bg-gradient-to-br ${selectedMaintenanceType.color}`
                            )}
                          >
                            {selectedMaintenanceType.icon}
                          </div>
                          <div>
                            <p className="text-[var(--text-primary)] font-medium">
                              {selectedMaintenanceType.label}
                            </p>
                            <p className="text-[var(--text-muted)] text-sm">
                              Durée: {selectedMaintenanceType.estimatedDuration}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Date & Time */}
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text-muted)]">
                          <CalendarDays className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">
                            {selectedDate &&
                              new Date(selectedDate).toLocaleDateString('fr-FR', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                              })}
                          </p>
                          <p className="text-[var(--text-muted)] text-sm">à {selectedTime}</p>
                        </div>
                      </div>

                      {/* Recurrence */}
                      {recurrence !== 'ONCE' && (
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[var(--bg-active)] flex items-center justify-center text-[var(--text-muted)]">
                            <Repeat className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[var(--text-primary)] font-medium">
                              {RECURRENCE_OPTIONS.find((r) => r.id === recurrence)?.label}
                            </p>
                            <p className="text-[var(--text-muted)] text-sm">Récurrence automatique</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-[var(--text-primary)] font-semibold mb-2">
                        Notes (optionnel)
                      </label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Ajoutez des instructions particulières..."
                        className="w-full h-24 px-4 py-3 bg-[var(--bg-hover)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-muted)] resize-none focus:outline-none focus:border-blue-500/50"
                      />
                    </div>

                    {/* Notification toggle */}
                    <div className="flex items-center justify-between p-4 bg-[var(--bg-hover)] rounded-xl">
                      <div className="flex items-center gap-3">
                        <Bell className="w-5 h-5 text-[var(--text-muted)]" />
                        <div>
                          <p className="text-[var(--text-primary)] font-medium">Rappel</p>
                          <p className="text-[var(--text-muted)] text-sm">
                            Notification 24h avant l'intervention
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifyBefore(!notifyBefore)}
                        className={cn(
                          'w-12 h-6 rounded-full transition-colors relative',
                          notifyBefore ? 'bg-blue-500' : 'bg-[var(--bg-active)]'
                        )}
                      >
                        <motion.div
                          animate={{ x: notifyBefore ? 24 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border)] flex items-center justify-between">
              <button
                onClick={() => step > 1 && setStep(step - 1)}
                disabled={step === 1}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
                  step === 1
                    ? 'text-[var(--text-muted)] cursor-not-allowed'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-active)]'
                )}
              >
                <ChevronLeft className="w-4 h-4" />
                Retour
              </button>

              {step < totalSteps ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  className={cn(
                    'flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all',
                    canProceed()
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:shadow-lg hover:shadow-blue-500/25'
                      : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                  )}
                >
                  Continuer
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        className="w-4 h-4 border-2 border-[var(--border-strong)] border-t-white rounded-full"
                      />
                      Planification...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Planifier
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
