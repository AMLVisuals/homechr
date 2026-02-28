'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Users, ChefHat, Wine, Martini, Utensils, Shield,
  X, Minus, Plus, Check, ArrowLeft, Clock, AlertCircle,
} from 'lucide-react';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useStore } from '@/store/useStore';

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
  const { currentEstablishment } = useEstablishment();
  const { addMission } = useMissionsStore();
  const { addEvent } = useCalendarStore();
  const isPremium = useStore((s) => s.isPremium);

  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [selectedPosteId, setSelectedPosteId] = useState<string | null>(null);
  const [isNow, setIsNow] = useState(true);
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [duration, setDuration] = useState(4);
  const [count, setCount] = useState(1);
  const [rate, setRate] = useState(13);

  const poste = ALL_POSTES.find(p => p.id === selectedPosteId);

  const startDate = useMemo(() => {
    if (isNow) return roundToNextQuarter(new Date());
    if (customDate && customTime) {
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
      urgent: true,
      description: `SOS Extra : Besoin urgent de ${count} ${poste.label.toLowerCase()} pour ${duration}h`,
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
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-2">Quand ?</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                {poste && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium">
                    <poste.icon className="w-3.5 h-3.5" /> {poste.label}
                  </span>
                )}
              </p>

              <div className="space-y-6 max-w-lg mx-auto w-full overflow-y-auto">
                {/* Now / Later toggle */}
                <div className="flex gap-2 p-1 bg-[var(--bg-hover)] rounded-xl">
                  <button
                    onClick={() => setIsNow(true)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${isNow ? 'bg-red-500 text-white shadow-lg' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    <Clock className="w-4 h-4 inline mr-1.5 -mt-0.5" />
                    Maintenant
                  </button>
                  <button
                    onClick={() => setIsNow(false)}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${!isNow ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-lg border border-[var(--border)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                  >
                    Plus tard
                  </button>
                </div>

                {isNow ? (
                  <div className="text-center py-3 px-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <p className="text-sm text-[var(--text-secondary)]">Demarrage prevu</p>
                    <p className="text-lg font-bold text-[var(--text-primary)]">
                      {formatDate(roundToNextQuarter(new Date()))} a {formatTime(roundToNextQuarter(new Date()))}
                    </p>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="date"
                      value={customDate}
                      onChange={e => setCustomDate(e.target.value)}
                      className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                    />
                    <input
                      type="time"
                      value={customTime}
                      onChange={e => setCustomTime(e.target.value)}
                      className="w-32 bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500/50"
                    />
                  </div>
                )}

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
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-red-500/20 active:shadow-md transition-shadow"
                >
                  Suivant
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Confirm */}
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
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-2">Confirmer et envoyer</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">Verifiez les details avant de publier</p>

              <div className="space-y-4 max-w-lg mx-auto w-full">
                {/* Recap card */}
                <div className="bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl overflow-hidden" style={{ boxShadow: 'var(--shadow-card)' }}>
                  {/* Poste header */}
                  <div className={`bg-gradient-to-r ${poste.color} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <poste.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{poste.label}</h3>
                      <p className="text-sm text-white/70">{rate}€/h</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">Quand</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {isNow ? `Maintenant (${formatTime(startDate)})` : `${formatDate(startDate)} a ${formatTime(startDate)}`}
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
                      <span className="text-sm text-[var(--text-secondary)]">Calcul</span>
                      <span className="text-sm text-[var(--text-muted)]">
                        {count} pers. x {duration}h x {rate}€/h
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-base font-bold text-[var(--text-primary)]">Total estime</span>
                      <span className="text-2xl font-bold text-[var(--text-primary)]">{total}€</span>
                    </div>
                  </div>
                </div>

                {/* Relation fee for free users */}
                {!isPremium && (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[var(--text-primary)]">Frais de mise en relation : 20€</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">Passez en Premium pour des missions illimitees sans frais</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Submit button */}
              <div className="mt-auto pt-4 max-w-lg mx-auto w-full">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-lg shadow-lg shadow-red-500/20 active:shadow-md transition-shadow"
                >
                  {isPremium ? 'Publier la mission' : 'Publier — 20€'}
                </motion.button>
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
