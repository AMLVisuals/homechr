import { getAdminSupabase } from './supabase-admin';

/**
 * Transmission facture électronique — loi du 1er septembre 2026.
 *
 * Mode STUB par défaut (PDP/PPF key absente) : simule transmission et marque
 * la facture TRANSMITTED avec une référence fictive.
 *
 * En production, brancher l'API de la Plateforme Dématérialisation Partenaire
 * (PDP) choisie — ex: Chorus Pro, Iopole, Docaposte, Esker, etc. — ou le
 * Portail Public de Facturation (PPF).
 *
 * Archive 10 ans : Art. L.123-22 Code de commerce (conservation des livres et
 * documents comptables). Déclenché par le trigger `trg_invoice_archive_until`.
 */

const PDP_API_KEY = process.env.PDP_API_KEY || '';
const PDP_BASE_URL = process.env.PDP_BASE_URL || '';
const PDP_PROVIDER = process.env.PDP_PROVIDER || 'STUB'; // 'STUB' | 'CHORUS_PRO' | 'IOPOLE' | ...

export const PDP_IS_CONFIGURED = !!(PDP_API_KEY && PDP_BASE_URL);

export type TransmissionChannel = 'PDP' | 'PPF' | 'EMAIL' | 'MANUAL' | 'NONE';

export interface TransmitInvoiceParams {
  invoiceId: string;
  channel?: TransmissionChannel;
  clientSiret?: string;
  clientEmail?: string;
  actorId?: string;
}

export interface TransmitInvoiceResult {
  ok: boolean;
  reference?: string;
  mode: 'STUB' | 'LIVE';
  channel: TransmissionChannel;
  error?: string;
}

export async function transmitInvoice(
  params: TransmitInvoiceParams
): Promise<TransmitInvoiceResult> {
  const admin = getAdminSupabase();
  const channel: TransmissionChannel = params.channel || 'PDP';

  const { data: invoice, error } = await admin
    .from('invoices')
    .select('id, reference, total_ttc, electronic_status, client_name, mission_id')
    .eq('id', params.invoiceId)
    .single();

  if (error || !invoice) {
    return { ok: false, mode: 'STUB', channel, error: 'Facture introuvable' };
  }

  if (invoice.electronic_status === 'TRANSMITTED' || invoice.electronic_status === 'DELIVERED') {
    return { ok: false, mode: 'STUB', channel, error: 'Facture déjà transmise' };
  }

  // ── STUB mode (pas de clé PDP configurée) ────────────────────────────
  if (!PDP_IS_CONFIGURED) {
    const reference = `${PDP_PROVIDER}-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date().toISOString();

    await admin
      .from('invoices')
      .update({
        electronic_status: 'TRANSMITTED',
        transmission_channel: channel,
        transmitted_at: now,
        transmission_reference: reference,
      })
      .eq('id', params.invoiceId);

    await admin.from('invoice_send_history').insert({
      invoice_id: params.invoiceId,
      event_type: 'TRANSMITTED',
      channel,
      target: params.clientSiret || params.clientEmail || invoice.client_name || null,
      external_reference: reference,
      payload: { mode: 'STUB', provider: PDP_PROVIDER },
      created_by: params.actorId || null,
    });

    return { ok: true, mode: 'STUB', channel, reference };
  }

  // ── LIVE mode (PDP configurée) ───────────────────────────────────────
  try {
    const res = await fetch(`${PDP_BASE_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${PDP_API_KEY}`,
      },
      body: JSON.stringify({
        reference: invoice.reference,
        total_ttc: invoice.total_ttc,
        client_siret: params.clientSiret,
        client_email: params.clientEmail,
      }),
    });

    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      await admin.from('invoice_send_history').insert({
        invoice_id: params.invoiceId,
        event_type: 'REJECTED',
        channel,
        error_message: payload?.error || `HTTP ${res.status}`,
        payload,
        created_by: params.actorId || null,
      });
      return {
        ok: false,
        mode: 'LIVE',
        channel,
        error: payload?.error || `HTTP ${res.status}`,
      };
    }

    const reference = payload.reference || payload.id || '';
    await admin
      .from('invoices')
      .update({
        electronic_status: 'TRANSMITTED',
        transmission_channel: channel,
        transmitted_at: new Date().toISOString(),
        transmission_reference: reference,
      })
      .eq('id', params.invoiceId);

    await admin.from('invoice_send_history').insert({
      invoice_id: params.invoiceId,
      event_type: 'TRANSMITTED',
      channel,
      target: params.clientSiret || params.clientEmail || null,
      external_reference: reference,
      payload,
      created_by: params.actorId || null,
    });

    return { ok: true, mode: 'LIVE', channel, reference };
  } catch (err: any) {
    return { ok: false, mode: 'LIVE', channel, error: err?.message || 'Erreur transmission' };
  }
}

export async function markInvoiceIssued(invoiceId: string, actorId?: string): Promise<void> {
  const admin = getAdminSupabase();
  await admin
    .from('invoices')
    .update({ electronic_status: 'ISSUED' })
    .eq('id', invoiceId);

  await admin.from('invoice_send_history').insert({
    invoice_id: invoiceId,
    event_type: 'GENERATED',
    channel: 'NONE',
    created_by: actorId || null,
  });
}

export async function getInvoiceHistory(invoiceId: string) {
  const admin = getAdminSupabase();
  const { data, error } = await admin
    .from('invoice_send_history')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}
