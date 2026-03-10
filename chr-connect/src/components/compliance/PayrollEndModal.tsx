'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Euro, Calculator, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculatePayroll, type PayrollCalculation } from '@/services/payrollService';
import { APP_CONFIG } from '@/config/appConfig';

interface PayrollEndModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (hoursWorked: number, payroll: PayrollCalculation) => void;
  missionTitle: string;
  workerName: string;
}

/**
 * Modal affichée côté patron à la fin d'une mission STAFF
 * pour saisir les heures réelles et voir le calcul de paie.
 */
export default function PayrollEndModal({
  isOpen,
  onClose,
  onConfirm,
  missionTitle,
  workerName,
}: PayrollEndModalProps) {
  const [hours, setHours] = useState<string>('');
  const [payroll, setPayroll] = useState<PayrollCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  const handleCalculate = async () => {
    const h = parseFloat(hours);
    if (!h || h <= 0) return;

    setIsCalculating(true);
    // Petit délai pour l'UX
    await new Promise((r) => setTimeout(r, 500));
    const result = calculatePayroll(h, APP_CONFIG.SMIC_HOURLY_RATE);
    setPayroll(result);
    setIsCalculating(false);
  };

  const handleConfirm = () => {
    if (!payroll) return;
    onConfirm(parseFloat(hours), payroll);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-[var(--card-bg)] rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-[var(--border-color)]">
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Fin de mission</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{missionTitle}</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--hover-bg)]">
              <X className="w-5 h-5 text-[var(--text-muted)]" />
            </button>
          </div>

          <div className="p-5 space-y-5">
            {/* Worker info */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{workerName}</p>
                <p className="text-xs text-[var(--text-muted)]">Saisie des heures réelles travaillées</p>
              </div>
            </div>

            {/* Hours input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Heures travaillées
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  value={hours}
                  onChange={(e) => {
                    setHours(e.target.value);
                    setPayroll(null);
                  }}
                  placeholder="Ex: 7.5"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] text-[var(--text-primary)] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Calculate button */}
            {!payroll && (
              <Button
                onClick={handleCalculate}
                disabled={!hours || parseFloat(hours) <= 0 || isCalculating}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold"
              >
                {isCalculating ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Calculator className="w-5 h-5 mr-2" />
                )}
                Calculer la paie
              </Button>
            )}

            {/* Payroll result */}
            {payroll && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Euro className="w-4 h-4" /> Détail du calcul
                </h4>

                <div className="rounded-xl border border-[var(--border-color)] divide-y divide-[var(--border-color)] text-sm">
                  <Row label="Heures travaillées" value={`${payroll.hoursWorked}h`} />
                  <Row label="Taux horaire brut" value={`${payroll.hourlyRateGross.toFixed(2)} €/h`} />
                  <Row label="Salaire brut" value={`${payroll.grossAmount.toFixed(2)} €`} bold />
                  <Row label="Indemnité fin de contrat (10%)" value={`+ ${payroll.endOfContractBonus} €`} />
                  <Row label="Charges salariales (~22%)" value={`- ${payroll.socialChargesEmployee} €`} muted />
                  <Row label="Prélèvement source (~8%)" value={`- ${payroll.incomeTaxWithholding} €`} muted />
                  {payroll.mealBenefits > 0 && (
                    <Row label="Avantage repas HCR" value={`- ${payroll.mealBenefits} €`} muted />
                  )}
                  <Row label="Net à payer" value={`${payroll.netAmount} €`} bold highlight />
                </div>

                <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-xs text-[var(--text-muted)]">
                  <p><strong>Coût total employeur :</strong> {payroll.totalCostEmployer} €</p>
                  <p className="mt-1">Charges patronales (~42%) : {payroll.socialChargesEmployer} €</p>
                  <p className="mt-2 italic">Calcul indicatif basé sur la convention HCR (IDCC 1979). Le bulletin définitif sera généré par le logiciel de paie.</p>
                </div>

                <Button
                  onClick={handleConfirm}
                  className="w-full h-12 bg-green-600 hover:bg-green-700 rounded-xl text-white font-semibold"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Valider et générer la fiche de paie
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function Row({ label, value, bold, muted, highlight }: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
  highlight?: boolean;
}) {
  return (
    <div className={`flex justify-between items-center px-4 py-2.5 ${highlight ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
      <span className={`${bold ? 'font-semibold text-[var(--text-primary)]' : muted ? 'text-[var(--text-muted)]' : 'text-[var(--text-secondary)]'}`}>
        {label}
      </span>
      <span className={`${bold ? 'font-bold' : ''} ${highlight ? 'text-green-700 dark:text-green-400 text-base font-bold' : 'text-[var(--text-primary)]'}`}>
        {value}
      </span>
    </div>
  );
}
