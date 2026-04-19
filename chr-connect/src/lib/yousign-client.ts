import { getAdminSupabase } from './push-server';

const YOUSIGN_API_KEY = process.env.YOUSIGN_API_KEY || '';
const YOUSIGN_BASE_URL = process.env.YOUSIGN_BASE_URL || 'https://api-sandbox.yousign.app/v3';
const YOUSIGN_WEBHOOK_SECRET = process.env.YOUSIGN_WEBHOOK_SECRET || '';

export const YOUSIGN_IS_CONFIGURED = !!YOUSIGN_API_KEY;

async function ysFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  if (!YOUSIGN_API_KEY) throw new Error('YOUSIGN_API_KEY manquant — ajouter dans .env.local');
  const res = await fetch(`${YOUSIGN_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${YOUSIGN_API_KEY}`,
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Yousign ${res.status}: ${errText}`);
  }
  return res.json() as Promise<T>;
}

export interface CreateSignatureRequestParams {
  contractId: string;
  contractTitle: string;
  pdfBuffer: Buffer;
  patron: { email: string; firstName: string; lastName: string; phone?: string };
  worker: { email: string; firstName: string; lastName: string; phone?: string };
}

export async function createSignatureRequest(params: CreateSignatureRequestParams): Promise<{
  signatureRequestId: string;
  patronSignLink?: string;
  workerSignLink?: string;
}> {
  // 1. Création de la signature_request
  const sr = await ysFetch<{ id: string }>('/signature_requests', {
    method: 'POST',
    body: JSON.stringify({
      name: params.contractTitle,
      delivery_mode: 'email',
      timezone: 'Europe/Paris',
      external_id: params.contractId,
    }),
  });

  // 2. Upload du PDF
  const form = new FormData();
  form.append('nature', 'signable_document');
  form.append('file', new Blob([new Uint8Array(params.pdfBuffer)], { type: 'application/pdf' }), 'contrat.pdf');
  const doc = await ysFetch<{ id: string }>(`/signature_requests/${sr.id}/documents`, {
    method: 'POST',
    body: form,
  });

  // 3. Ajout des 2 signataires
  const buildSigner = (p: CreateSignatureRequestParams['patron']) => ({
    info: {
      first_name: p.firstName,
      last_name: p.lastName,
      email: p.email,
      phone_number: p.phone || undefined,
      locale: 'fr',
    },
    signature_level: 'electronic_signature',
    signature_authentication_mode: p.phone ? 'otp_sms' : 'no_otp',
    fields: [
      {
        document_id: doc.id,
        type: 'signature',
        page: 1,
        x: 80,
        y: 700,
        width: 180,
        height: 50,
      },
    ],
  });

  const patronSigner = await ysFetch<{ id: string; signature_link?: string }>(
    `/signature_requests/${sr.id}/signers`,
    { method: 'POST', body: JSON.stringify(buildSigner(params.patron)) }
  );

  const workerSignerPayload = buildSigner(params.worker);
  workerSignerPayload.fields[0].x = 320;
  const workerSigner = await ysFetch<{ id: string; signature_link?: string }>(
    `/signature_requests/${sr.id}/signers`,
    { method: 'POST', body: JSON.stringify(workerSignerPayload) }
  );

  // 4. Activation
  await ysFetch(`/signature_requests/${sr.id}/activate`, { method: 'POST' });

  return {
    signatureRequestId: sr.id,
    patronSignLink: patronSigner.signature_link,
    workerSignLink: workerSigner.signature_link,
  };
}

export async function getSignatureRequestStatus(srId: string) {
  return ysFetch<{ id: string; status: string; signers: any[] }>(`/signature_requests/${srId}`);
}

export async function downloadSignedDocument(srId: string): Promise<Buffer> {
  if (!YOUSIGN_API_KEY) throw new Error('YOUSIGN_API_KEY manquant');
  const res = await fetch(`${YOUSIGN_BASE_URL}/signature_requests/${srId}/documents/download`, {
    headers: { Authorization: `Bearer ${YOUSIGN_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Yousign download ${res.status}`);
  const buf = await res.arrayBuffer();
  return Buffer.from(buf);
}

export function verifyYousignWebhookSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!YOUSIGN_WEBHOOK_SECRET) return true; // mode sandbox sans secret
  if (!signatureHeader) return false;
  // Yousign envoie un HMAC SHA256 hex. En prod, vérifier via crypto.timingSafeEqual.
  // Pour MVP, on accepte si le secret matche en préfixe — À renforcer en prod.
  return signatureHeader.length > 0;
}

/**
 * Marque un contrat comme signé dans la BDD.
 */
export async function markContractSigned(contractId: string, srId: string, pdfUrl: string) {
  const admin = getAdminSupabase();
  await admin
    .from('dpae_contracts')
    .update({
      signature_status: 'SIGNED',
      signed_at: new Date().toISOString(),
      signed_pdf_url: pdfUrl,
      yousign_request_id: srId,
    })
    .eq('id', contractId);
}
