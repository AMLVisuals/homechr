import { NextRequest, NextResponse } from 'next/server';
import { downloadSignedDocument, verifyYousignWebhookSignature, markContractSigned } from '@/lib/yousign-client';
import { getAdminSupabase, sendPushToUser } from '@/lib/push-server';
import { createClient } from '@supabase/supabase-js';

/**
 * POST /api/contracts/webhook
 * Reçoit les événements Yousign (signature_request.done, signer.signed, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-yousign-signature-256');

    if (!verifyYousignWebhookSignature(rawBody, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const type = event.event_name || event.type;
    const sr = event.data?.signature_request;
    if (!sr?.id) return NextResponse.json({ ok: true, ignored: true });

    const admin = getAdminSupabase();

    if (type === 'signature_request.done' || type === 'signature_request.completed') {
      const { data: contract } = await admin
        .from('dpae_contracts')
        .select('id, mission_id')
        .eq('yousign_request_id', sr.id)
        .maybeSingle();

      if (!contract) return NextResponse.json({ ok: true, ignored: 'no matching contract' });

      // Télécharger le PDF signé + stocker dans Supabase Storage
      const pdf = await downloadSignedDocument(sr.id);
      const storageUrl = `contracts/${contract.id}-signed.pdf`;
      const admin2 = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      await admin2.storage
        .from('documents')
        .upload(storageUrl, pdf, { contentType: 'application/pdf', upsert: true });
      const { data: publicUrl } = admin2.storage.from('documents').getPublicUrl(storageUrl);

      await markContractSigned(contract.id, sr.id, publicUrl.publicUrl);

      // Notifier patron et worker
      const { data: mission } = await admin
        .from('missions')
        .select('title, patron_id, provider_id')
        .eq('id', contract.mission_id)
        .single();

      if (mission) {
        const payload = {
          title: 'Contrat signé ✅',
          body: `Le CDD de "${mission.title}" est signé par les deux parties.`,
          url: '/patron/missions',
          tag: `contract-${contract.id}`,
        };
        await Promise.allSettled([
          mission.patron_id && sendPushToUser(mission.patron_id, payload),
          mission.provider_id && sendPushToUser(mission.provider_id, payload),
        ]);
      }
    }

    if (type === 'signature_request.declined' || type === 'signer.declined') {
      await admin
        .from('dpae_contracts')
        .update({ signature_status: 'DECLINED' })
        .eq('yousign_request_id', sr.id);
    }

    if (type === 'signature_request.expired') {
      await admin
        .from('dpae_contracts')
        .update({ signature_status: 'EXPIRED' })
        .eq('yousign_request_id', sr.id);
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error('[contracts/webhook]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
