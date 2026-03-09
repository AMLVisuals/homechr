'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Users, ChefHat, Wine, Martini, Utensils, Shield,
  X, Minus, Plus, Check, ArrowLeft, Clock, AlertCircle,
  Building2, ChevronDown, Music, SprayCan,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useStore } from '@/store/useStore';
import { APP_CONFIG } from '@/config/appConfig';

interface SOSExtraLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Poste {
  id: string;
  label: string;
  icon: typeof User;
  rate: number;
  range: string;
}

const GROUPS: { name: string; color: string; postes: Poste[] }[] = [
  {
    name: 'Salle',
    color: 'from-purple-500 to-pink-500',
    postes: [
      { id: 'serveur', label: 'Serveur / Limonadier', icon: User, rate: 15, range: '12-18€/h' },
      { id: 'chef_rang', label: 'Chef de Rang / Maitre d\'hotel', icon: User, rate: 19, range: '15-22€/h' },
      { id: 'commis_salle', label: 'Commis de salle', icon: User, rate: 13, range: '11-15€/h' },
      { id: 'manager_salle', label: 'Manager de salle', icon: User, rate: 20, range: '18-25€/h' },
    ],
  },
  {
    name: 'Bar',
    color: 'from-amber-500 to-yellow-500',
    postes: [
      { id: 'barman', label: 'Barman / Mixologue', icon: Martini, rate: 17, range: '14-20€/h' },
      { id: 'sommelier', label: 'Sommelier / Caviste', icon: Wine, rate: 28, range: '20-35€/h' },
    ],
  },
  {
    name: 'Cuisine',
    color: 'from-orange-500 to-red-500',
    postes: [
      { id: 'chef_cuisine', label: 'Chef de Cuisine', icon: ChefHat, rate: 40, range: '30-50€/h' },
      { id: 'chef_partie', label: 'Chef de Partie', icon: ChefHat, rate: 23, range: '18-28€/h' },
      { id: 'cuisinier', label: 'Cuisinier', icon: ChefHat, rate: 16, range: '13-20€/h' },
      { id: 'patissier', label: 'Patissier', icon: ChefHat, rate: 21, range: '16-26€/h' },
      { id: 'boulanger', label: 'Boulanger', icon: ChefHat, rate: 18, range: '14-22€/h' },
      { id: 'plongeur', label: 'Plongeur', icon: Utensils, rate: 13, range: '11-14€/h' },
    ],
  },
  {
    name: 'Accueil & Hotellerie',
    color: 'from-emerald-500 to-teal-500',
    postes: [
      { id: 'hotesse', label: 'Hote / Hotesse d\'accueil', icon: User, rate: 16, range: '13-18€/h' },
      { id: 'gouvernante', label: 'Gouvernante / Femme de chambre', icon: User, rate: 15, range: '12-18€/h' },
      { id: 'groom', label: 'Groom / Valet', icon: User, rate: 14, range: '12-16€/h' },
    ],
  },
  {
    name: 'Securite',
    color: 'from-slate-500 to-zinc-600',
    postes: [
      { id: 'securite', label: 'Securite / Videur', icon: Shield, rate: 20, range: '15-25€/h' },
    ],
  },
  {
    name: 'Animation',
    color: 'from-fuchsia-500 to-purple-600',
    postes: [
      { id: 'dj', label: 'DJ', icon: Music, rate: 43, range: '25-60€/h' },
    ],
  },
  {
    name: 'Entretien',
    color: 'from-cyan-500 to-blue-500',
    postes: [
      { id: 'aide_menagere', label: 'Agent d\'entretien', icon: SprayCan, rate: 14, range: '12-16€/h' },
    ],
  },
];

const ALL_POSTES = GROUPS.flatMap(g => g.postes.map(p => ({ ...p, color: g.color })));

function roundToNextQuarter(date: Date): Date {
  const d = new Date(date);
  const minutes = d.getMinutes();
  const remainder = minutes % 15;
  if (remainder > 0) {
    d.setMinutes(minutes + (15 - remainder));
  }
  d.setSeconds(0, 0);
  return d;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function toMissionDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}`;
}

export default function SOSExtraLauncher({ isOpen, onClose }: SOSExtraLauncherProps) {
  const { currentEstablishment, establishments, setCurrentEstablishmentId } = useEstablishment();
  const { addMission } = useMissionsStore();
  const { addEvent } = useCalendarStore();
  const isPremium = useStore((s) => s.isPremium);

  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [selectedPosteId, setSelectedPosteId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [duration, setDuration] = useState(4);
  const [count, setCount] = useState(1);
  const [rate, setRate] = useState(13);
  const [isNow, setIsNow] = useState(true);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');

  const poste = ALL_POSTES.find(p => p.id === selectedPosteId);

  const startDate = useMemo(() => {
    if (!isNow && customDate && customTime) {
      return new Date(`${customDate}T${customTime}`);
    }
    return roundToNextQuarter(new Date());
  }, [isNow, customDate, customTime]);

  const total = count * duration * rate;

  const handleSelectPoste = (id: string) => {
    const p = ALL_POSTES.find(x => x.id === id);
    if (p) setRate(p.rate);
    setSelectedPosteId(id);
    setStep(2);
  };

  const handleSubmit = () => {
    if (!currentEstablishment || !poste) return;

    const missionId = `mission_${Date.now()}`;
    const missionDate = toMissionDate(startDate);

    const mission = {
      id: missionId,
      title: `${poste.label} - ${count} personne(s)`,
      venue: currentEstablishment.name,
      venueId: currentEstablishment.id,
      type: 'staff' as const,
      price: `${total}€ est.`,
      urgent: isNow,
      scheduled: !isNow,
      scheduledDate: !isNow ? startDate.toISOString() : undefined,
      description: isNow
        ? `SOS Extra : Besoin urgent de ${count} ${poste.label.toLowerCase()} pour ${duration}h`
        : `Extra planifié : ${count} ${poste.label.toLowerCase()} pour ${duration}h — ${formatDate(startDate)} à ${formatTime(startDate)}`,
      status: 'SEARCHING' as const,
      location: { lat: 48.8566, lng: 2.3522 },
      category: 'STAFFING' as const,
      date: missionDate,
      paidRelationFee: !isPremium,
      relationFeeAmount: isPremium ? 0 : 20,
    };

    addMission(mission);

    const [dateStr, timeStr] = missionDate.split(' ');
    addEvent({
      title: mission.title,
      date: dateStr,
      time: timeStr || '09:00',
      type: 'STAFFING',
      description: mission.description,
      venueId: currentEstablishment.id,
      location: currentEstablishment.name,
      missionId,
    });

    setStep('success');
    setTimeout(() => onClose(), 2000);
  };

  const slideVariants = {
    enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-[var(--bg-app)] flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          {step !== 1 && step !== 'success' && (
            <button
              onClick={() => setStep(step === 3 ? 2 : 1)}
              className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              SOS Extra
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Mission express en 3 clics</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-[var(--bg-hover)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Progress */}
      {step !== 'success' && (
        <div className="flex gap-2 px-4 pt-4">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[var(--bg-hover)]">
              <motion.div
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: (step as number) >= s ? '100%' : '0%' }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait" custom={step === 1 ? -1 : 1}>
          {/* Step 1: Poste selection */}
          {step === 1 && (
            <motion.div
              key="step1"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 p-4 flex flex-col"
            >
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-2">De quoi avez-vous besoin ?</h2>
              <p className="text-sm text-[var(--text-muted)] mb-4">Choisissez le metier</p>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 max-w-lg mx-auto w-full pb-4">
                {GROUPS.map(group => (
                  <div key={group.name}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">{group.name}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {group.postes.map(p => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectPoste(p.id)}
                          className={`rounded-2xl bg-gradient-to-br ${group.color} p-3.5 flex items-center gap-3 text-left overflow-hidden active:opacity-80 transition-opacity`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <p.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white leading-tight truncate">{p.label}</h4>
                            <p className="text-[11px] text-white/60">{p.range}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: When */}
          {step === 2 && (
            <motion.div
              key="step2"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 p-4 flex flex-col"
            >
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-2">Détails</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                {poste && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium">
                    <poste.icon className="w-3.5 h-3.5" /> {poste.label}
                  </span>
                )}
              </p>

              <div className="space-y-6 max-w-lg mx-auto w-full overflow-y-auto">
                {/* Establishment selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Établissement concerné</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowVenueDropdown(!showVenueDropdown)}
                      className="w-full flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-left hover:border-purple-500/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[var(--text-primary)] font-medium truncate">{currentEstablishment?.name || 'Sélectionner'}</p>
                        {currentEstablishment?.address && (
                          <p className="text-[var(--text-muted)] text-xs truncate">{currentEstablishment.address}</p>
                        )}
                      </div>
                      {establishments.length > 1 && (
                        <ChevronDown className={cn("w-5 h-5 text-[var(--text-muted)] transition-transform", showVenueDropdown && "rotate-180")} />
                      )}
                    </button>
                    {showVenueDropdown && establishments.length > 1 && (
                      <>
                        <div className="fixed inset-0 z-[10]" onClick={() => setShowVenueDropdown(false)} />
                        <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--bg-sidebar)] border border-[var(--border)] rounded-xl shadow-2xl z-[11] overflow-hidden max-h-48 overflow-y-auto">
                          {establishments.map((venue) => (
                            <button
                              key={venue.id}
                              onClick={() => {
                                setCurrentEstablishmentId(venue.id);
                                setShowVenueDropdown(false);
                              }}
                              className={cn(
                                'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                                venue.id === currentEstablishment?.id
                                  ? 'bg-purple-500/10 text-[var(--text-primary)]'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                              )}
                            >
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{venue.name}</span>
                              {venue.id === currentEstablishment?.id && (
                                <Check className="w-4 h-4 text-purple-500 ml-auto flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Timing toggle */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Quand ?</label>
                  <div className="flex bg-[var(--bg-hover)] rounded-xl border border-[var(--border)] p-1">
                    <button
                      onClick={() => setIsNow(true)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        isNow
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      Maintenant
                    </button>
                    <button
                      onClick={() => setIsNow(false)}
                      className={cn(
                        "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2",
                        !isNow
                          ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-sm"
                          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      )}
                    >
                      <Clock className="w-4 h-4" />
                      Plus tard
                    </button>
                  </div>

                  {isNow ? (
                    <div className="text-center py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                      <p className="text-sm text-[var(--text-secondary)]">Démarrage prévu</p>
                      <p className="text-lg font-bold text-[var(--text-primary)]">
                        {formatDate(roundToNextQuarter(new Date()))} à {formatTime(roundToNextQuarter(new Date()))}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">Date</label>
                        <input
                          type="date"
                          value={customDate}
                          onChange={e => setCustomDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[var(--text-muted)] mb-1 block">Heure</label>
                        <input
                          type="time"
                          value={customTime}
                          onChange={e => setCustomTime(e.target.value)}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Duration */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Duree</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setDuration(Math.max(1, duration - 1))}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center min-w-[80px]">
                      <span className="text-4xl font-bold text-[var(--text-primary)]">{duration}</span>
                      <span className="text-lg text-[var(--text-muted)] ml-1">h</span>
                    </div>
                    <button
                      onClick={() => setDuration(Math.min(12, duration + 1))}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Count */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Nombre de personnes</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setCount(Math.max(1, count - 1))}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center min-w-[80px]">
                      <span className="text-4xl font-bold text-[var(--text-primary)]">{count}</span>
                      <span className="text-lg text-[var(--text-muted)] ml-1">pers.</span>
                    </div>
                    <button
                      onClick={() => setCount(Math.min(10, count + 1))}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Rate */}
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] mb-2 block">Tarif horaire{poste && <span className="text-[var(--text-muted)] font-normal"> (marche : {poste.range})</span>}</label>
                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={() => setRate(Math.max(1, rate - 1))}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <div className="text-center min-w-[80px]">
                      <span className="text-4xl font-bold text-[var(--text-primary)]">{rate}</span>
                      <span className="text-lg text-[var(--text-muted)] ml-1">€/h</span>
                    </div>
                    <button
                      onClick={() => setRate(rate + 1)}
                      className="w-12 h-12 rounded-xl bg-[var(--bg-hover)] border border-[var(--border)] flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all active:scale-95"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Next button */}
              <div className="mt-auto pt-4 max-w-lg mx-auto w-full">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  disabled={!isNow && (!customDate || !customTime)}
                  className={cn(
                    "w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow",
                    !isNow && (!customDate || !customTime)
                      ? "bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed shadow-none"
                      : "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-red-500/20 active:shadow-md"
                  )}
                >
                  Suivant
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && poste && (
            <motion.div
              key="step3"
              custom={1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="absolute inset-0 p-4 flex flex-col"
            >
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-2">Paiement</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Confirmez pour lancer la recherche</p>

              <div className="space-y-4 max-w-lg mx-auto w-full">
                {/* Recap card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                  <div className={`bg-gradient-to-r ${poste.color} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <poste.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{poste.label}</h3>
                      <p className="text-sm text-white/70">{rate}€/h</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">Quand</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {isNow ? `Maintenant (${formatTime(startDate)})` : `${formatDate(startDate)} à ${formatTime(startDate)}`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">Duree</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{duration}h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">Personnes</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">{count}</span>
                    </div>
                    <div className="border-t border-[var(--border)] my-2" />
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-muted)]">
                        {count} pers. × {duration}h × {rate}€/h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-[var(--text-primary)]">Total estimé</span>
                      <span className="text-2xl font-bold text-[var(--text-primary)]">{total}€</span>
                    </div>
                  </div>
                </div>

                {/* Frais de mise en relation */}
                {!isPremium && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">Frais de mise en relation</span>
                      </div>
                      <span className="text-lg font-bold text-[var(--text-primary)]">{APP_CONFIG.MISSION_FEE}€</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] mt-1">Passez en Premium pour des missions illimitées sans frais</p>
                  </div>
                )}

                {/* Stripe Pay button */}
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setIsProcessingPayment(true);
                    setTimeout(() => { setIsProcessingPayment(false); handleSubmit(); }, 1500);
                  }}
                  disabled={isProcessingPayment}
                  className="w-full py-4 rounded-2xl bg-[#635BFF] text-white font-bold text-lg flex items-center justify-center gap-3 shadow-lg shadow-[#635BFF]/25 active:shadow-md transition-shadow disabled:opacity-70"
                >
                  {isProcessingPayment ? (
                    <div className="flex items-center gap-3">
                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
                      <span>Traitement en cours...</span>
                    </div>
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/></svg>
                      Payer{!isPremium ? ` ${APP_CONFIG.MISSION_FEE}€` : ''}
                    </>
                  )}
                </motion.button>

                <p className="text-center text-xs text-[var(--text-muted)]">
                  Paiement sécurisé via Stripe — CB, Apple Pay, Google Pay
                </p>
              </div>
            </motion.div>
          )}

          {/* Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                className="w-24 h-24 rounded-full bg-green-500 flex items-center justify-center mb-6 shadow-lg shadow-green-500/30"
              >
                <Check className="w-12 h-12 text-white" strokeWidth={3} />
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-bold text-[var(--text-primary)] mb-2"
              >
                Mission publiee !
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[var(--text-muted)] text-center"
              >
                Recherche en cours...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
