import { NextRequest, NextResponse } from 'next/server';
import { calculatePayroll } from '@/services/payrollService';

/**
 * POST /api/payroll/calculate
 * Calcule la paie d'un extra HCR
 * Body: { hoursWorked: number, hourlyRateGross: number, mealsProvided?: number }
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { hoursWorked, hourlyRateGross, mealsProvided } = body;

  if (!hoursWorked || hoursWorked <= 0) {
    return NextResponse.json(
      { success: false, error: 'Le nombre d\'heures travaillées doit être supérieur à 0.' },
      { status: 400 }
    );
  }

  if (!hourlyRateGross || hourlyRateGross <= 0) {
    return NextResponse.json(
      { success: false, error: 'Le taux horaire brut doit être supérieur à 0.' },
      { status: 400 }
    );
  }

  const payroll = calculatePayroll(hoursWorked, hourlyRateGross, mealsProvided || 0);

  return NextResponse.json({ success: true, payroll });
}
