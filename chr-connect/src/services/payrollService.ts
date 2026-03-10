import type { StaffMissionEndData } from '@/types/compliance';
import { HCR_CONVENTION } from '@/config/compliance';
import { APP_CONFIG } from '@/config/appConfig';

// ============================================================================
// PAYROLL SERVICE — Calcul de paie pour les extras (CDD d'usage HCR)
// ============================================================================
// En production : appel API de paie (PayFit, Silae, etc.)
// Actuellement : calcul simplifié basé sur la convention HCR
// ============================================================================

export interface PayrollCalculation {
  // Entrées
  hoursWorked: number;
  hourlyRateGross: number;
  // Résultats
  grossAmount: number;
  socialChargesEmployee: number;    // ~22% du brut (part salariale)
  socialChargesEmployer: number;    // ~42% du brut (part patronale)
  incomeTaxWithholding: number;     // Prélèvement à la source (~8% approx)
  netBeforeTax: number;
  netAmount: number;                // Net à payer au salarié
  mealBenefits: number;             // Avantage en nature repas HCR
  endOfContractBonus: number;       // Indemnité de fin de contrat (10%)
  totalCostEmployer: number;        // Coût total pour le patron
}

/**
 * Calcule la paie d'un extra HCR
 * Calcul simplifié — en prod, utiliser une API de paie certifiée
 */
export function calculatePayroll(
  hoursWorked: number,
  hourlyRateGross: number,
  mealsProvided: number = 0
): PayrollCalculation {
  // Vérification SMIC
  const effectiveRate = Math.max(hourlyRateGross, APP_CONFIG.SMIC_HOURLY_RATE);

  // Brut
  const grossAmount = hoursWorked * effectiveRate;

  // Avantage en nature repas (convention HCR)
  const mealBenefits = mealsProvided * HCR_CONVENTION.mealBenefit.perMeal;

  // Indemnité de fin de contrat CDD (10% du brut)
  const endOfContractBonus = grossAmount * 0.10;

  // Brut total
  const totalGross = grossAmount + endOfContractBonus;

  // Charges sociales salariales (~22% du brut total)
  const socialChargesEmployee = totalGross * 0.22;

  // Charges sociales patronales (~42% du brut total)
  const socialChargesEmployer = totalGross * 0.42;

  // Net avant impôt
  const netBeforeTax = totalGross - socialChargesEmployee - mealBenefits;

  // Prélèvement à la source (taux neutre ~8%)
  const incomeTaxWithholding = netBeforeTax * 0.08;

  // Net à payer
  const netAmount = netBeforeTax - incomeTaxWithholding;

  // Coût total employeur
  const totalCostEmployer = totalGross + socialChargesEmployer;

  return {
    hoursWorked,
    hourlyRateGross: effectiveRate,
    grossAmount,
    socialChargesEmployee: Math.round(socialChargesEmployee * 100) / 100,
    socialChargesEmployer: Math.round(socialChargesEmployer * 100) / 100,
    incomeTaxWithholding: Math.round(incomeTaxWithholding * 100) / 100,
    netBeforeTax: Math.round(netBeforeTax * 100) / 100,
    netAmount: Math.round(netAmount * 100) / 100,
    mealBenefits: Math.round(mealBenefits * 100) / 100,
    endOfContractBonus: Math.round(endOfContractBonus * 100) / 100,
    totalCostEmployer: Math.round(totalCostEmployer * 100) / 100,
  };
}

/**
 * Finalise une mission staff — calcule la paie et retourne les données
 * En prod : appel API de paie pour générer le bulletin PDF
 */
export async function finalizeMissionPayroll(data: StaffMissionEndData): Promise<{
  success: boolean;
  payroll?: PayrollCalculation;
  payslipUrl?: string;
  error?: string;
}> {
  await new Promise((r) => setTimeout(r, 1500));

  if (!data.actualHoursWorked || data.actualHoursWorked <= 0) {
    return { success: false, error: 'Le nombre d\'heures travaillées est requis.' };
  }

  // Récupérer le taux horaire depuis la mission (default SMIC)
  const hourlyRate = APP_CONFIG.SMIC_HOURLY_RATE; // En prod : récupéré depuis la mission

  const payroll = calculatePayroll(data.actualHoursWorked, hourlyRate);

  // Mock : URL du bulletin de paie
  const payslipUrl = `#mock-payslip-${data.missionId}-${Date.now()}`;

  return {
    success: true,
    payroll,
    payslipUrl,
  };
}
