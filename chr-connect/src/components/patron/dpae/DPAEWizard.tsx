'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ArrowLeft, ChevronRight, Building2, User, FileText,
  CheckCircle2, Send, Loader2, Download, Printer, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DPAEDeclaration } from '@/types/dpae';
import { useDPAEStore } from '@/store/useDPAEStore';
import { Mission } from '@/types/missions';
import { downloadContract, printContract } from '@/lib/dpae-contract-generator';
import { APP_CONFIG } from '@/config/appConfig';

type DPAEStep = 'employer' | 'employee' | 'contract' | 'submitting' | 'done';

interface DPAEWizardProps {
  isOpen: boolean;
  onClose: () => void;
  mission?: Mission;
  establishmentName?: string;
  establishmentAddress?: string;
  establishmentSiret?: string;
}

export default function DPAEWizard({
  isOpen,
  onClose,
  mission,
  establishmentName = '',
  establishmentAddress = '',
  establishmentSiret = '',
}: DPAEWizardProps) {
  const { createDeclaration, submitToURSSAF, addContract } = useDPAEStore();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<DPAEStep>('employer');

  useEffect(() => { setMounted(true); }, []);

  // Employer fields (pre-filled)
  const [employerName, setEmployerName] = useState(establishmentName || mission?.venue || '');
  const [employerSiret, setEmployerSiret] = useState(establishmentSiret || '');
  const [employerAddress, setEmployerAddress] = useState(establishmentAddress || '');
  const [employerAPE, setEmployerAPE] = useState<string>(APP_CONFIG.DEFAULT_APE_CODE); // Restaurants, default

  // Employee fields
  const [employeeLastName, setEmployeeLastName] = useState(mission?.pendingWorker?.name?.split(' ').pop() || mission?.provider?.name?.split(' ').pop() || '');
  const [employeeFirstName, setEmployeeFirstName] = useState(mission?.pendingWorker?.name?.split(' ')[0] || mission?.provider?.name?.split(' ')[0] || '');
  const [employeeBirthDate, setEmployeeBirthDate] = useState('');
  const [employeeSSN, setEmployeeSSN] = useState('');
  const [employeeNationality, setEmployeeNationality] = useState('Française');

  // Contract fields (pre-filled from mission)
  const [startDate, setStartDate] = useState(mission?.date?.split(' ')[0] || new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [workHours, setWorkHours] = useState(mission?.date?.split(' ')[1] || '09:00 - 17:00');
  const [hourlyRate, setHourlyRate] = useState(String(APP_CONFIG.SMIC_HOURLY_RATE)); // SMIC horaire approx
  const [jobTitle, setJobTitle] = useState(
    mission?.provider?.bio || mission?.pendingWorker?.specialty || mission?.title || ''
  );

  const [createdDeclaration, setCreatedDeclaration] = useState<DPAEDeclaration | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleBack = () => {
    if (step === 'employee') setStep('employer');
    else if (step === 'contract') setStep('employee');
  };

  const handleSubmit = async () => {
    setStep('submitting');
    setError(null);

    const declaration: DPAEDeclaration = {
      id: `dpae-${Date.now()}`,
      missionId: mission?.id,
      employerSiret,
      employerName,
      employerAddress,
      employerAPE,
      employeeLastName,
      employeeFirstName,
      employeeBirthDate,
      employeeSSN,
      employeeNationality,
      contractType: 'CDD_USAGE',
      startDate,
      endDate,
      workHours,
      hourlyRate: parseFloat(hourlyRate),
      jobTitle,
      collectiveAgreement: 'Convention Collective HCR (IDCC 1979)',
      status: 'DRAFT',
    };

    createDeclaration(declaration);

    try {
      await submitToURSSAF(declaration.id);

      // Generate contract
      addContract({
        id: `contract-${Date.now()}`,
        declarationId: declaration.id,
        missionId: mission?.id,
        generatedAt: new Date().toISOString(),
        htmlContent: '',
        status: 'DRAFT',
      });

      setCreatedDeclaration({ ...declaration, status: 'ACKNOWLEDGED' });
      setStep('done');
    } catch {
      setError('Erreur lors de la soumission. Veuillez réessayer.');
      setStep('contract');
    }
  };

  if (!isOpen || !mounted) return null;

  const stepIndex = step === 'employer' ? 0 : step === 'employee' ? 1 : step === 'contract' ? 2 : 3;
  const progress = Math.min(stepIndex / 3, 1);

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9998]"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[80vh] md:rounded-3xl bg-[var(--bg-sidebar)] border border-[var(--border)] shadow-2xl z-[9999] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-3">
            {(step === 'employee' || step === 'contract') && (
              <button
                onClick={handleBack}
                className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-[var(--text-primary)]" />
              </button>
            )}
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)]">
                {step === 'employer' && 'DPAE — Employeur'}
                {step === 'employee' && 'DPAE — Salarié'}
                {step === 'contract' && 'DPAE — Contrat'}
                {step === 'submitting' && 'Envoi en cours...'}
                {step === 'done' && 'DPAE envoyée !'}
              </h2>
              <p className="text-xs text-[var(--text-muted)]">Déclaration Préalable à l&apos;Embauche</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-[var(--bg-card)] flex items-center justify-center hover:bg-[var(--bg-active)] transition-colors">
            <X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Progress bar */}
        {step !== 'done' && step !== 'submitting' && (
          <div className="h-1 bg-[var(--bg-active)]">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">

            {/* STEP: Employer */}
            {step === 'employer' && (
              <motion.div key="employer" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-400" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Informations de l&apos;établissement employeur</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Raison sociale</label>
                  <input value={employerName} onChange={(e) => setEmployerName(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">SIRET</label>
                  <input value={employerSiret} onChange={(e) => setEmployerSiret(e.target.value)} placeholder="123 456 789 00012" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 placeholder:text-[var(--text-muted)]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Adresse</label>
                  <input value={employerAddress} onChange={(e) => setEmployerAddress(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Code APE</label>
                  <input value={employerAPE} onChange={(e) => setEmployerAPE(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
              </motion.div>
            )}

            {/* STEP: Employee */}
            {step === 'employee' && (
              <motion.div key="employee" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Informations du salarié</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Nom</label>
                    <input value={employeeLastName} onChange={(e) => setEmployeeLastName(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Prénom</label>
                    <input value={employeeFirstName} onChange={(e) => setEmployeeFirstName(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Date de naissance</label>
                  <input type="date" value={employeeBirthDate} onChange={(e) => setEmployeeBirthDate(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">N° de Sécurité Sociale</label>
                  <input value={employeeSSN} onChange={(e) => setEmployeeSSN(e.target.value)} placeholder="1 85 01 75 116 005 42" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 placeholder:text-[var(--text-muted)]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Nationalité</label>
                  <input value={employeeNationality} onChange={(e) => setEmployeeNationality(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
              </motion.div>
            )}

            {/* STEP: Contract */}
            {step === 'contract' && (
              <motion.div key="contract" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-400" />
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">Paramètres du contrat CDD d&apos;usage</p>
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Poste</label>
                  <input value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Date début</label>
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Date fin</label>
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Horaires</label>
                  <input value={workHours} onChange={(e) => setWorkHours(e.target.value)} placeholder="09:00 - 17:00" className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500 placeholder:text-[var(--text-muted)]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--text-secondary)] block mb-1">Taux horaire brut (€)</label>
                  <input type="number" step="0.01" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} className="w-full px-4 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl text-[var(--text-primary)] focus:outline-none focus:border-blue-500" />
                </div>
                <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-400">
                  Convention collective : HCR (IDCC 1979) — Contrat : CDD d&apos;usage (extra)
                </div>
              </motion.div>
            )}

            {/* STEP: Submitting */}
            {step === 'submitting' && (
              <motion.div key="submitting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16 space-y-6">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                <div className="text-center">
                  <h3 className="text-lg font-bold text-[var(--text-primary)]">Déclaration en cours...</h3>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Envoi à l&apos;URSSAF et génération du contrat</p>
                </div>
              </motion.div>
            )}

            {/* STEP: Done */}
            {step === 'done' && createdDeclaration && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8 space-y-6">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-green-400" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-[var(--text-primary)]">DPAE envoyée !</h3>
                  <p className="text-[var(--text-muted)] mt-2 max-w-sm mx-auto">
                    La déclaration a été transmise à l&apos;URSSAF. Le contrat CDD d&apos;usage a été généré.
                  </p>
                </div>

                {createdDeclaration.urssafReference && (
                  <div className="bg-[var(--bg-card)] rounded-xl p-4 border border-[var(--border)] max-w-xs mx-auto">
                    <p className="text-xs text-[var(--text-muted)]">Référence URSSAF</p>
                    <p className="font-mono font-bold text-[var(--text-primary)]">{createdDeclaration.urssafReference}</p>
                  </div>
                )}

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => downloadContract(createdDeclaration)}
                    className="px-5 py-3 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl font-medium text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger
                  </button>
                  <button
                    onClick={() => printContract(createdDeclaration)}
                    className="px-5 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Printer className="w-4 h-4" />
                    Imprimer
                  </button>
                </div>

                <button onClick={onClose} className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors">
                  Fermer
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step !== 'submitting' && step !== 'done' && (
          <div className="p-6 border-t border-[var(--border)]">
            {step === 'employer' && (
              <button
                onClick={() => setStep('employee')}
                disabled={!employerName || !employerSiret}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  employerName && employerSiret
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg'
                    : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                Continuer <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {step === 'employee' && (
              <button
                onClick={() => setStep('contract')}
                disabled={!employeeLastName || !employeeFirstName}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  employeeLastName && employeeFirstName
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg'
                    : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                Continuer <ChevronRight className="w-5 h-5" />
              </button>
            )}
            {step === 'contract' && (
              <button
                onClick={handleSubmit}
                disabled={!startDate || !endDate || !jobTitle}
                className={cn(
                  'w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2',
                  startDate && endDate && jobTitle
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:shadow-lg'
                    : 'bg-[var(--bg-active)] text-[var(--text-muted)] cursor-not-allowed'
                )}
              >
                <Send className="w-5 h-5" />
                Déclarer et générer le contrat
              </button>
            )}
          </div>
        )}
      </motion.div>
    </>,
    document.body
  );
}
