import { NextRequest, NextResponse } from 'next/server';
import { submitDPAE } from '@/services/dpaeService';

/**
 * POST /api/dpae/submit
 * Soumet une DPAE à l'URSSAF
 * Body: DPAEDeclaration fields (employerSiret, employeeLastName, etc.)
 */
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Validation minimale
  const requiredFields = [
    'employerSiret', 'employerName', 'employeeLastName',
    'employeeFirstName', 'employeeBirthDate', 'employeeSSN',
    'startDate', 'endDate', 'jobTitle'
  ];

  const missing = requiredFields.filter(f => !body[f]);
  if (missing.length > 0) {
    return NextResponse.json(
      { success: false, error: `Champs manquants : ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const result = await submitDPAE(body);

  return NextResponse.json(result, {
    status: result.success ? 200 : 422,
  });
}
