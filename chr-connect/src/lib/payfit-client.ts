import { getAdminSupabase } from './supabase-admin';

const PAYFIT_API_KEY = process.env.PAYFIT_API_KEY || '';
const PAYFIT_COMPANY_ID = process.env.PAYFIT_COMPANY_ID || '';
const PAYFIT_BASE_URL = process.env.PAYFIT_BASE_URL || 'https://partner-api.payfit.com';

export const PAYFIT_IS_CONFIGURED = !!(PAYFIT_API_KEY && PAYFIT_COMPANY_ID);

async function pfFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!PAYFIT_IS_CONFIGURED) throw new Error('PAYFIT_API_KEY / PAYFIT_COMPANY_ID manquants');
  const res = await fetch(`${PAYFIT_BASE_URL}${path}`, {
    ...init,
    headers: {
      'X-API-KEY': PAYFIT_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayFit ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

export interface CreatePayslipJobParams {
  missionId: string;
  workerId: string;
  patronId: string;
  workerName: string;
  workerEmail: string;
  hoursWorked: number;
  hourlyRateGross: number;
  missionDate: string; // ISO
}

/**
 * Crée une job de génération bulletin dans PayFit.
 * NOTE : PayFit API est accessible uniquement via partenariat enterprise.
 * En MVP, cette fonction tourne en MODE STUB qui :
 *   - enregistre le job en BDD avec status=PENDING
 *   - retourne un ID mock
 *   - le bulletin réel sera généré quand PAYFIT_API_KEY sera fourni
 */
export async function createPayslipJob(params: CreatePayslipJobParams): Promise<{
  jobId: string;
  externalId: string | null;
  mode: 'PAYFIT_API' | 'STUB';
}> {
  const admin = getAdminSupabase();

  const gross = Math.round(params.hoursWorked * params.hourlyRateGross * 100) / 100;
  const net = Math.round(gross * 0.78 * 100) / 100; // approximation charges salariales ~22%

  const { data: job, error } = await admin
    .from('payslip_jobs')
    .insert({
      mission_id: params.missionId,
      worker_id: params.workerId,
      patron_id: params.patronId,
      provider: 'PAYFIT',
      status: 'PENDING',
      hours_worked: params.hoursWorked,
      gross_amount: gross,
      net_amount: net,
    })
    .select()
    .single();

  if (error) throw error;

  if (!PAYFIT_IS_CONFIGURED) {
    return { jobId: job.id, externalId: null, mode: 'STUB' };
  }

  try {
    const pfResp = await pfFetch<{ id: string }>(`/companies/${PAYFIT_COMPANY_ID}/payslips`, {
      method: 'POST',
      body: JSON.stringify({
        external_id: params.missionId,
        employee: {
          email: params.workerEmail,
          full_name: params.workerName,
        },
        period: {
          start: params.missionDate,
          end: params.missionDate,
        },
        variables: {
          hours: params.hoursWorked,
          hourly_rate: params.hourlyRateGross,
          gross_amount: gross,
        },
      }),
    });

    await admin
      .from('payslip_jobs')
      .update({ external_id: pfResp.id, status: 'PROCESSING' })
      .eq('id', job.id);

    return { jobId: job.id, externalId: pfResp.id, mode: 'PAYFIT_API' };
  } catch (err: any) {
    await admin
      .from('payslip_jobs')
      .update({ status: 'FAILED', error_message: err?.message })
      .eq('id', job.id);
    throw err;
  }
}

export async function pollPayslipJob(jobId: string): Promise<{ status: string; pdfUrl?: string }> {
  const admin = getAdminSupabase();
  const { data: job } = await admin
    .from('payslip_jobs')
    .select('*')
    .eq('id', jobId)
    .single();

  if (!job) throw new Error('Job introuvable');
  if (!PAYFIT_IS_CONFIGURED || !job.external_id) {
    return { status: job.status };
  }

  const pf = await pfFetch<{ status: string; pdf_url?: string }>(
    `/companies/${PAYFIT_COMPANY_ID}/payslips/${job.external_id}`
  );

  const mapped =
    pf.status === 'ready' ? 'READY' : pf.status === 'failed' ? 'FAILED' : 'PROCESSING';

  const update: any = { status: mapped };
  if (pf.pdf_url) update.payslip_pdf_url = pf.pdf_url;

  await admin.from('payslip_jobs').update(update).eq('id', jobId);

  return { status: mapped, pdfUrl: pf.pdf_url };
}
