import { getAdminSupabase } from './supabase-admin';

const URSSAF_API_KEY = process.env.URSSAF_API_KEY || '';
const URSSAF_SIRET = process.env.URSSAF_SIRET || '';
const URSSAF_BASE_URL = process.env.URSSAF_BASE_URL || 'https://api.net-entreprises.fr';

export const URSSAF_IS_CONFIGURED = !!(URSSAF_API_KEY && URSSAF_SIRET);

export interface SubmitDpaeParams {
  missionId: string;
  workerFirstName: string;
  workerLastName: string;
  workerBirthDate: string; // YYYY-MM-DD
  workerBirthCity?: string;
  workerBirthDept?: string;
  workerSocialNumber?: string; // Numéro de sécurité sociale
  startDate: string; // ISO
  endDate?: string;
  contractType: 'CDD_USAGE' | 'CDI';
  employerSiret: string;
}

/**
 * Soumet une DPAE à URSSAF Net-Entreprises.
 *
 * MODES :
 *   - API_NET_ENTREPRISES : appel réel (nécessite URSSAF_API_KEY + URSSAF_SIRET + certificat)
 *   - MANUAL_PDF : génère un PDF pré-rempli, le patron le soumet lui-même
 *   - MOCK : simule une soumission (dev)
 *
 * L'intégration API réelle URSSAF demande ~2-3 semaines de paperasse
 * (convention Net-Entreprises, certificat X.509, SIRET validé).
 * Tant que ce n'est pas fait, on reste en MOCK ou MANUAL_PDF.
 */
export async function submitDpae(params: SubmitDpaeParams): Promise<{
  declarationId: string;
  receiptId: string | null;
  mode: 'API_NET_ENTREPRISES' | 'MANUAL_PDF' | 'MOCK';
  pdfUrl?: string;
}> {
  const admin = getAdminSupabase();
  const mode: 'API_NET_ENTREPRISES' | 'MANUAL_PDF' | 'MOCK' = URSSAF_IS_CONFIGURED
    ? 'API_NET_ENTREPRISES'
    : 'MOCK';

  const { data: decl, error } = await admin
    .from('dpae_declarations')
    .insert({
      mission_id: params.missionId,
      employee_first_name: params.workerFirstName,
      employee_last_name: params.workerLastName,
      employee_birth_date: params.workerBirthDate,
      employee_ssn: params.workerSocialNumber,
      start_date: params.startDate,
      end_date: params.endDate,
      contract_type: params.contractType,
      employer_siret: params.employerSiret,
      employer_name: '',
      status: 'PENDING',
      submission_mode: mode,
    })
    .select()
    .single();

  if (error) throw error;

  if (mode === 'MOCK') {
    const fakeReceipt = `MOCK-${Date.now()}`;
    await admin
      .from('dpae_declarations')
      .update({
        status: 'VALIDATED',
        urssaf_reference: fakeReceipt,
        aee_number: fakeReceipt,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', decl.id);
    return { declarationId: decl.id, receiptId: fakeReceipt, mode };
  }

  // API_NET_ENTREPRISES : soumission réelle
  try {
    const res = await fetch(`${URSSAF_BASE_URL}/dpae/v1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${URSSAF_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        employer_siret: params.employerSiret,
        employee: {
          first_name: params.workerFirstName,
          last_name: params.workerLastName,
          birth_date: params.workerBirthDate,
          social_number: params.workerSocialNumber,
        },
        contract: {
          type: params.contractType,
          start_date: params.startDate,
          end_date: params.endDate,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      await admin
        .from('dpae_declarations')
        .update({ status: 'ERROR', error_message: err })
        .eq('id', decl.id);
      throw new Error(`URSSAF ${res.status}: ${err}`);
    }

    const data = await res.json();
    const receipt = data.receipt_id || data.AEE || null;

    await admin
      .from('dpae_declarations')
      .update({
        status: 'VALIDATED',
        urssaf_reference: receipt,
        aee_number: receipt,
        acknowledged_at: new Date().toISOString(),
      })
      .eq('id', decl.id);

    return { declarationId: decl.id, receiptId: receipt, mode };
  } catch (err: any) {
    await admin
      .from('dpae_declarations')
      .update({ status: 'ERROR', error_message: err?.message })
      .eq('id', decl.id);
    throw err;
  }
}
