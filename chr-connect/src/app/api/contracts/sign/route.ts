import { NextRequest, NextResponse } from 'next/server';
import { createSignatureRequest, YOUSIGN_IS_CONFIGURED } from '@/lib/yousign-client';
import { getAdminSupabase } from '@/lib/push-server';

/**
 * POST /api/contracts/sign
 * Body: { contractId: string, pdfBase64: string }
 * Lance une signature électronique via Yousign pour un contrat CDD généré.
 * Retourne les liens de signature pour patron et worker.
 */
export async function POST(req: NextRequest) {
  try {
    if (!YOUSIGN_IS_CONFIGURED) {
      return NextResponse.json(
        { error: 'Yousign non configuré (YOUSIGN_API_KEY manquant dans .env.local)' },
        { status: 503 }
      );
    }

    const { contractId, pdfBase64 } = await req.json();
    if (!contractId || !pdfBase64) {
      return NextResponse.json({ error: 'contractId et pdfBase64 requis' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    // Récupérer contrat + infos patron/worker
    const { data: contract, error: cErr } = await admin
      .from('dpae_contracts')
      .select('id, mission_id, signature_status')
      .eq('id', contractId)
      .single();

    if (cErr || !contract) {
      return NextResponse.json({ error: cErr?.message || 'Contrat introuvable' }, { status: 404 });
    }

    if (contract.signature_status === 'SIGNED') {
      return NextResponse.json({ error: 'Contrat déjà signé' }, { status: 400 });
    }

    const { data: mission } = await admin
      .from('missions')
      .select('title, patron_id, provider_id')
      .eq('id', contract.mission_id)
      .single();

    if (!mission?.patron_id || !mission.provider_id) {
      return NextResponse.json({ error: 'Patron ou prestataire manquant sur la mission' }, { status: 400 });
    }

    const { data: parties } = await admin
      .from('profiles')
      .select('id, first_name, last_name, email, phone')
      .in('id', [mission.patron_id, mission.provider_id]);

    const patronProfile = parties?.find((p: any) => p.id === mission.patron_id);
    const workerProfile = parties?.find((p: any) => p.id === mission.provider_id);

    if (!patronProfile?.email || !workerProfile?.email) {
      return NextResponse.json({ error: 'Emails manquants sur les profils' }, { status: 400 });
    }

    const pdfBuffer = Buffer.from(pdfBase64, 'base64');

    const result = await createSignatureRequest({
      contractId,
      contractTitle: `CDD — ${mission.title}`,
      pdfBuffer,
      patron: {
        email: patronProfile.email,
        firstName: patronProfile.first_name || 'Patron',
        lastName: patronProfile.last_name || '',
        phone: patronProfile.phone,
      },
      worker: {
        email: workerProfile.email,
        firstName: workerProfile.first_name || 'Prestataire',
        lastName: workerProfile.last_name || '',
        phone: workerProfile.phone,
      },
    });

    await admin
      .from('dpae_contracts')
      .update({
        yousign_request_id: result.signatureRequestId,
        signature_status: 'SENT',
        sent_at: new Date().toISOString(),
      })
      .eq('id', contractId);

    return NextResponse.json({
      ok: true,
      signatureRequestId: result.signatureRequestId,
      patronSignLink: result.patronSignLink,
      workerSignLink: result.workerSignLink,
    });
  } catch (err: any) {
    console.error('[contracts/sign]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
