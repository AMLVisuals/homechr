import { NextRequest, NextResponse } from 'next/server';
import { createPayslipJob, PAYFIT_IS_CONFIGURED } from '@/lib/payfit-client';
import { getAdminSupabase } from '@/lib/push-server';

/**
 * POST /api/payroll/generate
 * Body: { missionId: string, hourlyRateGross?: number }
 * Crée un bulletin de paie via PayFit (ou stub si non configuré).
 * À appeler après validation de la mission (quand actualHoursWorked est connu).
 */
export async function POST(req: NextRequest) {
  try {
    const { missionId, hourlyRateGross } = await req.json();
    if (!missionId) return NextResponse.json({ error: 'missionId requis' }, { status: 400 });

    const admin = getAdminSupabase();
    const { data: mission, error } = await admin
      .from('missions')
      .select('id, title, patron_id, provider_id, actual_hours_worked, scheduled_at, staffing_hourly_rate')
      .eq('id', missionId)
      .single();

    if (error || !mission) {
      return NextResponse.json({ error: error?.message || 'Mission introuvable' }, { status: 404 });
    }

    if (!mission.actual_hours_worked || !mission.provider_id) {
      return NextResponse.json({ error: 'Heures non validées ou prestataire absent' }, { status: 400 });
    }

    const { data: worker } = await admin
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', mission.provider_id)
      .single();

    const result = await createPayslipJob({
      missionId: mission.id,
      workerId: mission.provider_id,
      patronId: mission.patron_id,
      workerName: `${worker?.first_name || ''} ${worker?.last_name || ''}`.trim() || 'Prestataire',
      workerEmail: worker?.email || '',
      hoursWorked: Number(mission.actual_hours_worked),
      hourlyRateGross: Number(hourlyRateGross || mission.staffing_hourly_rate || 13),
      missionDate: mission.scheduled_at || new Date().toISOString(),
    });

    return NextResponse.json({
      ok: true,
      jobId: result.jobId,
      externalId: result.externalId,
      mode: result.mode,
      configured: PAYFIT_IS_CONFIGURED,
    });
  } catch (err: any) {
    console.error('[payroll/generate]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
