'use client';

import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, ChevronLeft, ChevronRight, User, Calendar, Clock,
  DollarSign, Plus, Trash2, CheckCircle2, Receipt, Search,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useMissionsStore } from '@/store/useMissionsStore';
import { useVenuesStore } from '@/store/useVenuesStore';
import { usePayslipsStore } from '@/store/usePayslipsStore';
import type { PayslipPeriodType, PayslipEntry } from '@/types/payslip';
import { PAYSLIP_PERIOD_LABELS } from '@/types/payslip';

type WizardStep = 'employee' | 'period' | 'extras' | 'summary' | 'success';

const STEPS: { id: WizardStep; label: string }[] = [
  { id: 'employee', label: 'Employe' },
  { id: 'period', label: 'Periode' },
  { id: 'extras', label: 'Primes' },
  { id: 'summary', label: 'Resume' },
];

interface CreatePayslipWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreatePayslipWizard({ isOpen, onClose }: CreatePayslipWizardProps) {
  const { team } = useMissionsStore();
  const { activeVenueId } = useVenuesStore();
  const { generatePayslip } = usePayslipsStore();

  const [step, setStep] = useState<WizardStep>('employee');
  const [direction, setDirection] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Step 1: Employee
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');

  // Step 2: Period
  const [periodType, setPeriodType] = useState<PayslipPeriodType>('MONTHLY');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursWorked, setHoursWorked] = useState(151.67);
  const [hourlyRate, setHourlyRate] = useState(13.84);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeRate, setOvertimeRate] = useState(17.30);

  // Step 3: Bonuses & Deductions
  const [bonuses, setBonuses] = useState<PayslipEntry[]>([]);
  const [deductions, setDeductions] = useState<PayslipEntry[]>([]);

  const filteredTeam = useMemo(() => {
    let members = team.filter(m => !activeVenueId || m.venueId === activeVenueId);
    if (employeeSearch) {
      const q = employeeSearch.toLowerCase();
      members = members.filter(m => m.name.toLowerCase().includes(q) || m.role.toLowerCase().includes(q));
    }
    return members;
  }, [team, activeVenueId, employeeSearch]);

  const selectedEmployee = team.find(m => m.id === selectedEmployeeId);

  // Calculations
  const grossBase = hoursWorked * hourlyRate;
  const overtimeTotal = overtimeHours * overtimeRate;
  const bonusTotal = bonuses.reduce((s, b) => s + b.amount, 0);
  const deductionTotal = deductions.reduce((s, d) => s + d.amount, 0);
  const grossAmount = grossBase + overtimeTotal + bonusTotal - deductionTotal;
  const taxAmount = Math.round(grossAmount * 0.13);
  const socialSecurity = Math.round(grossAmount * 0.05);
  const netAmount = Math.round(grossAmount * 0.82);

  const stepIndex = STEPS.findIndex(s => s.id === step);

  const goNext = () => {
    const nextIdx = stepIndex + 1;
    if (nextIdx < STEPS.length) {
      setDirection(1);
      setStep(STEPS[nextIdx].id);
    }
  };

  const goPrev = () => {
    const prevIdx = stepIndex - 1;
    if (prevIdx >= 0) {
      setDirection(-1);
      setStep(STEPS[prevIdx].id);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 'employee': return !!selectedEmployeeId;
      case 'period': return !!startDate && !!endDate && hoursWorked > 0 && hourlyRate > 0;
      case 'extras': return true;
      case 'summary': return true;
      default: return false;
    }
  };

  const addBonus = () => {
    setBonuses([...bonuses, { id: `b${Date.now()}`, label: '', rate: 0, amount: 0, type: 'BONUS' }]);
  };

  const addDeduction = () => {
    setDeductions([...deductions, { id: `d${Date.now()}`, label: '', rate: 0, amount: 0, type: 'DEDUCTION' }]);
  };

  const updateBonus = (id: string, field: string, value: string | number) => {
    setBonuses(bonuses.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const updateDeduction = (id: string, field: string, value: string | number) => {
    setDeductions(deductions.map(d => d.id === id ? { ...d, [field]: value } : d));
  };

  const handleGenerate = async () => {
    if (!selectedEmployee || !activeVenueId) return;
    setIsGenerating(true);
    try {
      await generatePayslip({
        employeeId: selectedEmployee.id,
        employeeName: selectedEmployee.name,
        venueId: activeVenueId,
        startDate,
        endDate,
        periodType,
        hoursWorked,
        hourlyRate,
        overtimeHours,
        overtimeRate,
        bonuses: bonuses.filter(b => b.label && b.amount > 0),
        deductions: deductions.filter(d => d.label && d.amount > 0),
      });
      setStep('success');
    } catch {
      // Error handled by store
    } finally {
      setIsGenerating(false);
    }
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]"
      />

      <motion.div
        initial={{ opacity: 0, y: '100%' }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: '100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed inset-x-0 bottom-0 top-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[560px] md:max-h-[85vh] md:rounded-3xl bg-[var(--bg-sidebar)] md:border md:border-[var(--border)] shadow-2xl z-[9999] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-[var(--border)]">
          <div>
            <h2 className="text-lg md:text-xl font-bold text-[var(--text-primary)]">Nouveau bulletin de paie</h2>
            {step !== 'success' && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Etape {stepIndex + 1}/{STEPS.length}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        {step !== 'success' && (
          <div className="px-4 md:px-6 pt-4">
            <div className="flex gap-2">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex-1 h-1 rounded-full overflow-hidden bg-[var(--bg-hover)]">
                  <motion.div
                    initial={false}
                    animate={{ width: i <= stepIndex ? '100%' : '0%' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                    transition={{ duration: 0.3 }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25 }}
              className="p-4 md:p-6"
            >
              {/* Step 1: Employee */}
              {step === 'employee' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      placeholder="Rechercher un employe..."
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2 max-h-[50vh] md:max-h-[40vh] overflow-y-auto">
                    {filteredTeam.length === 0 ? (
                      <div className="text-center py-8 text-[var(--text-muted)]">
                        <User className="w-12 h-12 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">Aucun employe trouve</p>
                      </div>
                    ) : (
                      filteredTeam.map((member) => (
                        <button
                          key={member.id}
                          onClick={() => setSelectedEmployeeId(member.id)}
                          className={clsx(
                            'w-full flex items-center gap-3 p-3 rounded-xl transition-all border',
                            selectedEmployeeId === member.id
                              ? 'bg-blue-500/10 border-blue-500/30 text-[var(--text-primary)]'
                              : 'bg-[var(--bg-hover)] border-transparent hover:bg-[var(--bg-active)] text-[var(--text-secondary)]'
                          )}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                            {member.avatar ? (
                              <img src={member.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              member.name.split(' ').map(n => n[0]).join('')
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-sm">{member.name}</div>
                            <div className="text-xs text-[var(--text-secondary)]">{member.role}</div>
                          </div>
                          <span className={clsx(
                            'text-[10px] px-2 py-0.5 rounded-full font-medium',
                            member.status === 'AVAILABLE' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'
                          )}>
                            {member.status === 'AVAILABLE' ? 'Dispo' : 'Occupe'}
                          </span>
                          {selectedEmployeeId === member.id && (
                            <CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0" />
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Period & Hours */}
              {step === 'period' && (
                <div className="space-y-5">
                  {/* Period Type */}
                  <div>
                    <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Type de periode</label>
                    <div className="flex gap-2">
                      {(['MONTHLY', 'WEEKLY', 'BIWEEKLY'] as PayslipPeriodType[]).map((pt) => (
                        <button
                          key={pt}
                          onClick={() => setPeriodType(pt)}
                          className={clsx(
                            'flex-1 py-2 rounded-xl text-sm font-medium transition-all',
                            periodType === pt
                              ? 'bg-blue-500 text-white'
                              : 'bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:bg-[var(--bg-active)]'
                          )}
                        >
                          {PAYSLIP_PERIOD_LABELS[pt]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Date debut</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Date fin</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Hours & Rate */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Heures travaillees</label>
                      <div className="relative">
                        <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="number"
                          step="0.01"
                          value={hoursWorked}
                          onChange={(e) => setHoursWorked(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Taux horaire (€)</label>
                      <div className="relative">
                        <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                        <input
                          type="number"
                          step="0.01"
                          value={hourlyRate}
                          onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                          className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl pl-10 pr-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Overtime */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Heures sup.</label>
                      <input
                        type="number"
                        step="0.5"
                        value={overtimeHours}
                        onChange={(e) => setOvertimeHours(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-[var(--text-secondary)] mb-2 block">Taux sup. (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={overtimeRate}
                        onChange={(e) => setOvertimeRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[var(--bg-input)] border border-[var(--border)] rounded-xl px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Live calculation */}
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded-xl p-4">
                    <div className="text-xs text-[var(--text-secondary)] mb-1">Salaire brut estime</div>
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{grossBase.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</div>
                    {overtimeTotal > 0 && (
                      <div className="text-xs text-blue-400 mt-1">+ {overtimeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€ heures sup.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Bonuses & Deductions */}
              {step === 'extras' && (
                <div className="space-y-6">
                  {/* Bonuses */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-[var(--text-secondary)]">Primes</label>
                      <button onClick={addBonus} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Ajouter
                      </button>
                    </div>
                    {bonuses.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucune prime ajoutee</p>
                    ) : (
                      <div className="space-y-2">
                        {bonuses.map((bonus) => (
                          <div key={bonus.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Libelle"
                              value={bonus.label}
                              onChange={(e) => updateBonus(bonus.id, 'label', e.target.value)}
                              className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
                            />
                            <input
                              type="number"
                              placeholder="Montant"
                              value={bonus.amount || ''}
                              onChange={(e) => updateBonus(bonus.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-24 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
                            />
                            <button onClick={() => setBonuses(bonuses.filter(b => b.id !== bonus.id))} className="p-2 text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Deductions */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-sm font-bold text-[var(--text-secondary)]">Deductions</label>
                      <button onClick={addDeduction} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                        <Plus className="w-3.5 h-3.5" /> Ajouter
                      </button>
                    </div>
                    {deductions.length === 0 ? (
                      <p className="text-xs text-[var(--text-muted)] text-center py-4">Aucune deduction ajoutee</p>
                    ) : (
                      <div className="space-y-2">
                        {deductions.map((ded) => (
                          <div key={ded.id} className="flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Libelle"
                              value={ded.label}
                              onChange={(e) => updateDeduction(ded.id, 'label', e.target.value)}
                              className="flex-1 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
                            />
                            <input
                              type="number"
                              placeholder="Montant"
                              value={ded.amount || ''}
                              onChange={(e) => updateDeduction(ded.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-24 bg-[var(--bg-input)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-blue-500"
                            />
                            <button onClick={() => setDeductions(deductions.filter(d => d.id !== ded.id))} className="p-2 text-red-400 hover:text-red-300">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Summary preview */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Base brut</span>
                      <span className="text-[var(--text-primary)] font-medium">{grossBase.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                    {overtimeTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Heures sup.</span>
                        <span className="text-[var(--text-primary)] font-medium">+{overtimeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                      </div>
                    )}
                    {bonusTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">Primes</span>
                        <span className="text-green-400 font-medium">+{bonusTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                      </div>
                    )}
                    {deductionTotal > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-red-400">Deductions</span>
                        <span className="text-red-400 font-medium">-{deductionTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                      </div>
                    )}
                    <div className="border-t border-[var(--border)] pt-2 flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Total brut</span>
                      <span className="text-[var(--text-primary)] font-bold">{grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--text-secondary)]">Net estime (~82%)</span>
                      <span className="text-blue-400 font-bold">{netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Summary */}
              {step === 'summary' && (
                <div className="space-y-5">
                  {/* Employee Card */}
                  <div className="bg-[var(--bg-hover)] rounded-xl p-4 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                      {selectedEmployee?.avatar ? (
                        <img src={selectedEmployee.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        selectedEmployee?.name.split(' ').map(n => n[0]).join('')
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-[var(--text-primary)]">{selectedEmployee?.name}</div>
                      <div className="text-xs text-[var(--text-secondary)]">{selectedEmployee?.role}</div>
                    </div>
                  </div>

                  {/* Payslip Preview */}
                  <div className="bg-[var(--bg-card)] rounded-xl border border-[var(--border)] overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 p-4 border-b border-[var(--border)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-xs text-[var(--text-secondary)] font-medium uppercase tracking-wider">Bulletin de paie</div>
                          <div className="text-sm text-[var(--text-primary)] font-bold mt-1">{PAYSLIP_PERIOD_LABELS[periodType]} - {startDate} au {endDate}</div>
                        </div>
                        <Receipt className="w-8 h-8 text-blue-400/30" />
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-[var(--text-secondary)]">Heures normales ({hoursWorked}h x {hourlyRate}€)</span>
                        <span className="text-[var(--text-primary)] font-medium">{grossBase.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                      </div>
                      {overtimeHours > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)]">Heures sup. ({overtimeHours}h x {overtimeRate}€)</span>
                          <span className="text-[var(--text-primary)] font-medium">{overtimeTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                      )}
                      {bonuses.filter(b => b.label && b.amount > 0).map(b => (
                        <div key={b.id} className="flex justify-between text-sm">
                          <span className="text-green-400">{b.label}</span>
                          <span className="text-green-400 font-medium">+{b.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                      ))}
                      {deductions.filter(d => d.label && d.amount > 0).map(d => (
                        <div key={d.id} className="flex justify-between text-sm">
                          <span className="text-red-400">{d.label}</span>
                          <span className="text-red-400 font-medium">-{d.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                      ))}

                      <div className="border-t border-[var(--border)] pt-3 space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[var(--text-secondary)] font-bold">Salaire Brut</span>
                          <span className="text-[var(--text-primary)] font-bold">{grossAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Impots (~13%)</span>
                          <span className="text-[var(--text-secondary)]">-{taxAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[var(--text-muted)]">Securite sociale (~5%)</span>
                          <span className="text-[var(--text-secondary)]">-{socialSecurity.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                      </div>

                      <div className="border-t border-[var(--border)] pt-3">
                        <div className="flex justify-between">
                          <span className="text-lg font-bold text-[var(--text-primary)]">Net a payer</span>
                          <span className="text-2xl font-bold text-blue-400">{netAmount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}€</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Success */}
              {step === 'success' && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 200, delay: 0.1 }}
                    className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/30 flex items-center justify-center mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10 text-green-400" />
                  </motion.div>
                  <motion.h3
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-bold text-[var(--text-primary)] mb-2"
                  >
                    Bulletin genere !
                  </motion.h3>
                  <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-sm text-[var(--text-secondary)] mb-8"
                  >
                    Le bulletin de paie de {selectedEmployee?.name} a ete cree avec succes.
                  </motion.p>
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    onClick={onClose}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm transition-colors"
                  >
                    Fermer
                  </motion.button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Navigation */}
        {step !== 'success' && (
          <div className="p-4 md:p-6 border-t border-[var(--border)] flex items-center justify-between gap-3">
            <button
              onClick={step === 'employee' ? onClose : goPrev}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[var(--bg-hover)] hover:bg-[var(--bg-active)] text-[var(--text-secondary)] text-sm font-medium transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 'employee' ? 'Annuler' : 'Retour'}
            </button>

            {step === 'summary' ? (
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generation...
                  </>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    Generer le bulletin
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={goNext}
                disabled={!canProceed()}
                className="flex items-center gap-1.5 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Suivant
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </motion.div>
    </>,
    document.body
  );
}
