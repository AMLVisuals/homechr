import { NextRequest, NextResponse } from 'next/server';
import { transmitInvoice, markInvoiceIssued } from '@/lib/einvoice-transmission';
import { getAdminSupabase } from '@/lib/supabase-admin';

/**
 * POST /api/invoices/send
 * Body: { invoiceId, channel?, clientSiret?, clientEmail? }
 *
 * Génère + transmet la facture via PDP/PPF (stub si pas de clé).
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) return NextResponse.json({ error: 'Token requis' }, { status: 401 });

    const admin = getAdminSupabase();
    const { data: { user }, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !user) return NextResponse.json({ error: 'Session invalide' }, { status: 401 });

    const body = await req.json();
    const { invoiceId, channel, clientSiret, clientEmail } = body;
    if (!invoiceId) return NextResponse.json({ error: 'invoiceId requis' }, { status: 400 });

    // Vérifier que le user a accès à la facture
    const { data: invoice } = await admin
      .from('invoices')
      .select('id, mission_id, electronic_status, missions!inner(patron_id,provider_id)')
      .eq('id', invoiceId)
      .single();

    if (!invoice) return NextResponse.json({ error: 'Facture introuvable' }, { status: 404 });

    const mission = (invoice as any).missions;
    if (mission?.patron_id !== user.id && mission?.provider_id !== user.id) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Marquer comme émise si encore DRAFT / NONE
    if (!invoice.electronic_status || invoice.electronic_status === 'NONE' || invoice.electronic_status === 'DRAFT') {
      await markInvoiceIssued(invoiceId, user.id);
    }

    const result = await transmitInvoice({
      invoiceId,
      channel,
      clientSiret,
      clientEmail,
      actorId: user.id,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error, mode: result.mode }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[api/invoices/send]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
