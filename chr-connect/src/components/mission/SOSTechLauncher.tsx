'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench, Snowflake, Flame, Utensils, Coffee, Beer, Zap, Monitor, Wifi,
  Mic, Lightbulb, Video,
  X, ArrowLeft, Clock, AlertCircle, Building2, ChevronDown, Check,
  Camera, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useEstablishment } from '@/contexts/EstablishmentContext';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useCalendarStore } from '@/store/calendarStore';
import { useStore } from '@/store/useStore';
import { APP_CONFIG } from '@/config/appConfig';
import type { MissionType } from '@/types/missions';

interface SOSTechLauncherProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Specialty {
  id: string;
  label: string;
  icon: typeof Wrench;
}

const GROUPS: { name: string; color: string; specialties: Specialty[] }[] = [
  {
    name: 'Froid & Climatisation',
    color: 'from-sky-500 to-blue-600',
    specialties: [
      { id: 'tech_froid', label: 'Technicien Froid', icon: Snowflake },
      { id: 'tech_ventilation', label: 'Technicien Ventilation / CVC', icon: Wrench },
    ],
  },
  {
    name: 'Cuisson & Chaud',
    color: 'from-orange-500 to-red-500',
    specialties: [
      { id: 'tech_chaud', label: 'Technicien Chaud', icon: Flame },
    ],
  },
  {
    name: 'Équipement cuisine',
    color: 'from-emerald-500 to-teal-500',
    specialties: [
      { id: 'tech_lave_vaisselle', label: 'Technicien Lave-vaisselle', icon: Utensils },
      { id: 'tech_cafe', label: 'Technicien Machine à Café', icon: Coffee },
      { id: 'tech_biere', label: 'Technicien Pompe à Bière', icon: Beer },
    ],
  },
  {
    name: 'Électricité & Plomberie',
    color: 'from-yellow-500 to-amber-600',
    specialties: [
      { id: 'electricien', label: 'Électricien', icon: Zap },
      { id: 'plombier', label: 'Plombier', icon: Wrench },
    ],
  },
  {
    name: 'Caisse & IT',
    color: 'from-violet-500 to-purple-600',
    specialties: [
      { id: 'tech_pos', label: 'Technicien Caisse / POS', icon: Monitor },
      { id: 'tech_reseau', label: 'Technicien Réseau / WiFi', icon: Wifi },
    ],
  },
  {
    name: 'Événementiel / AV',
    color: 'from-pink-500 to-rose-600',
    specialties: [
      { id: 'ingenieur_son', label: 'Ingénieur Son', icon: Mic },
      { id: 'ingenieur_lumiere', label: 'Ingénieur Lumière', icon: Lightbulb },
      { id: 'tech_video', label: 'Technicien Vidéo', icon: Video },
    ],
  },
];

const ALL_SPECIALTIES = GROUPS.flatMap(g => g.specialties.map(s => ({ ...s, color: g.color })));

const PLACEHOLDERS: Record<string, string> = {
  tech_froid: 'Ex: La chambre froide ne descend plus en température...',
  plombier: 'Ex: Fuite d\'eau sous l\'évier de la cuisine...',
  electricien: 'Ex: Plusieurs prises ne fonctionnent plus, les plombs sautent...',
};

const DEFAULT_PLACEHOLDER = 'Décrivez votre problème le plus précisément possible...';

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

export default function SOSTechLauncher({ isOpen, onClose }: SOSTechLauncherProps) {
  const { currentEstablishment, establishments, setCurrentEstablishmentId } = useEstablishment();
  const { addMission } = useMissionsStore();
  const { addEvent } = useCalendarStore();
  const isPremium = useStore((s) => s.isPremium);

  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 'success'>(1);
  const [selectedSpecialtyId, setSelectedSpecialtyId] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [description, setDescription] = useState('');
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const specialty = ALL_SPECIALTIES.find(s => s.id === selectedSpecialtyId);

  const startDate = useMemo(() => {
    return roundToNextQuarter(new Date());
  }, []);

  const placeholder = selectedSpecialtyId
    ? (PLACEHOLDERS[selectedSpecialtyId] ?? DEFAULT_PLACEHOLDER)
    : DEFAULT_PLACEHOLDER;

  const handleSelectSpecialty = (id: string) => {
    setSelectedSpecialtyId(id);
    setStep(2);
  };

  const handleMediaUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*,video/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        setMediaFiles(prev => [...prev, ...Array.from(target.files!)]);
      }
    };
    input.click();
  };

  const handleSubmit = () => {
    if (!currentEstablishment || !specialty) return;

    const missionId = `mission_${Date.now()}`;
    const missionDate = toMissionDate(startDate);

    const missionTypeMap: Record<string, string> = {
      tech_froid: 'cold',
      tech_ventilation: 'cold',
      tech_chaud: 'hot',
      tech_lave_vaisselle: 'cold',
      tech_cafe: 'coffee',
      tech_biere: 'beer',
      electricien: 'electricity',
      plombier: 'plumbing',
      tech_pos: 'pos',
      tech_reseau: 'network',
      ingenieur_son: 'sound',
      ingenieur_lumiere: 'light',
      tech_video: 'video',
    };

    const mission = {
      id: missionId,
      title: `${specialty.label} - Intervention`,
      venue: currentEstablishment.name,
      venueId: currentEstablishment.id,
      type: (missionTypeMap[specialty.id] || 'cold') as MissionType,
      price: isPremium ? 'Inclus' : `${APP_CONFIG.MISSION_FEE}€`,
      urgent: true,
      description: `SOS Tech : ${specialty.label} — ${description}`,
      status: 'SEARCHING' as const,
      location: { lat: 48.8566, lng: 2.3522 },
      category: 'MAINTENANCE' as const,
      date: missionDate,
      paidRelationFee: !isPremium,
      relationFeeAmount: isPremium ? 0 : APP_CONFIG.MISSION_FEE,
    };

    addMission(mission);

    const [dateStr, timeStr] = missionDate.split(' ');
    addEvent({
      title: mission.title,
      date: dateStr,
      time: timeStr || '09:00',
      type: 'MAINTENANCE',
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
              <AlertCircle className="w-5 h-5 text-orange-500" />
              SOS Technicien
            </h1>
            <p className="text-xs text-[var(--text-muted)]">Intervention express en 3 clics</p>
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
                className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
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
          {/* Step 1: Specialty selection */}
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
              <p className="text-sm text-[var(--text-muted)] mb-4">Choisissez la spécialité</p>

              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-5 max-w-lg mx-auto w-full pb-4">
                {GROUPS.map(group => (
                  <div key={group.name}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2 px-1">{group.name}</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {group.specialties.map(s => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectSpecialty(s.id)}
                          className={`rounded-2xl bg-gradient-to-br ${group.color} p-3.5 flex items-center gap-3 text-left overflow-hidden active:opacity-80 transition-opacity`}
                        >
                          <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                            <s.icon className="w-4 h-4 text-white" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-white leading-tight truncate">{s.label}</h4>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Describe the problem */}
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
              <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2 mt-2">Décrivez le problème</h2>
              <p className="text-sm text-[var(--text-muted)] mb-6">
                {specialty && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--bg-hover)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium">
                    <specialty.icon className="w-3.5 h-3.5" /> {specialty.label}
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
                      className="w-full flex items-center gap-3 p-4 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-left hover:border-orange-500/50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-orange-400" />
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
                                  ? 'bg-orange-500/10 text-[var(--text-primary)]'
                                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
                              )}
                            >
                              <Building2 className="w-4 h-4 flex-shrink-0" />
                              <span className="text-sm font-medium truncate">{venue.name}</span>
                              {venue.id === currentEstablishment?.id && (
                                <Check className="w-4 h-4 text-orange-500 ml-auto flex-shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Timing info */}
                <div className="text-center py-3 px-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl">
                  <p className="text-sm text-[var(--text-secondary)]">Intervention prévue</p>
                  <p className="text-lg font-bold text-[var(--text-primary)]">
                    {formatDate(roundToNextQuarter(new Date()))} à {formatTime(roundToNextQuarter(new Date()))}
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">Description du problème <span className="text-red-400">*</span></label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder={placeholder}
                    rows={4}
                    className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-orange-500/50 resize-none"
                  />
                </div>

                {/* Media upload */}
                <div className="space-y-2">
                  <button
                    onClick={handleMediaUpload}
                    className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--bg-card)] border border-dashed border-[var(--border)] rounded-xl text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-orange-500/50 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">Ajouter des photos/vidéos</span>
                  </button>
                  {mediaFiles.length > 0 && (
                    <p className="text-xs text-[var(--text-muted)]">{mediaFiles.length} fichier{mediaFiles.length > 1 ? 's' : ''} sélectionné{mediaFiles.length > 1 ? 's' : ''}</p>
                  )}
                </div>
              </div>

              {/* Next button */}
              <div className="mt-auto pt-4 max-w-lg mx-auto w-full">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setStep(3)}
                  disabled={!description.trim()}
                  className={cn(
                    'w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-shadow',
                    description.trim()
                      ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-orange-500/20 active:shadow-md'
                      : 'bg-[var(--bg-hover)] text-[var(--text-muted)] cursor-not-allowed shadow-none'
                  )}
                >
                  Suivant
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Payment */}
          {step === 3 && specialty && (
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
                  <div className={`bg-gradient-to-r ${specialty.color} p-4 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <specialty.icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-lg">{specialty.label}</h3>
                      <p className="text-sm text-white/70">Intervention</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">Quand</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">Maintenant ({formatTime(startDate)})</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-[var(--text-secondary)]">Établissement</span>
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate ml-4 text-right">
                        {currentEstablishment?.name || '—'}
                      </span>
                    </div>
                    <div className="border-t border-[var(--border)] my-2" />
                    <div>
                      <span className="text-sm text-[var(--text-secondary)]">Description</span>
                      <p className="text-sm text-[var(--text-primary)] mt-1 line-clamp-3">{description}</p>
                    </div>
                    {mediaFiles.length > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-[var(--text-secondary)]">Pièces jointes</span>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{mediaFiles.length} fichier{mediaFiles.length > 1 ? 's' : ''}</span>
                      </div>
                    )}
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
                Mission publiée !
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-[var(--text-muted)] text-center"
              >
                Recherche d&apos;un technicien en cours...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
