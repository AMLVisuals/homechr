import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, sendPushToUser } from '@/lib/push-server';
import { refundMissionPayment } from '@/lib/stripe-connect';

async function assertAdmin(req: NextRequest): Promise<{ ok: boolean; adminId?: string; error?: string }> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '');
  if (!token) return { ok: false, error: 'Token requis' };

  const admin = getAdminSupabase();
  const { data: { user }, error } = await admin.auth.getUser(token);
  if (error || !user) return { ok: false, error: 'Session invalide' };

  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) return { ok: false, error: 'Accès réservé aux admins' };
  return { ok: true, adminId: user.id };
}

/**
 * POST /api/admin/disputes/resolve
 * Body: { disputeId, action, adminNotes?, refundAmount?, blacklist? }
 * action ∈ 'UNDER_REVIEW' | 'RESOLVED_PATRON' | 'RESOLVED_PROVIDER' | 'CLOSED'
 *
 * Si action = RESOLVED_PATRON et mission capturée/pending → refund Stripe auto.
 * Si blacklist=true → ajoute la contre-partie à la blacklist réciproque.
 */
export async function POST(req: NextRequest) {
  try {
    const check = await assertAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 403 });

    const body = await req.json();
    const { disputeId, action, adminNotes, refundAmount, blacklist } = body;
    if (!disputeId || !action) {
      return NextResponse.json({ error: 'disputeId et action requis' }, { status: 400 });
    }

    const validActions = ['UNDER_REVIEW', 'RESOLVED_PATRON', 'RESOLVED_PROVIDER', 'CLOSED'];
    if (!validActions.includes(action)) {
      return NextResponse.json({ error: 'action invalide' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    const { data: dispute, error: fetchErr } = await admin
      .from('mission_disputes')
      .select('*, mission:missions(id,title,patron_id,provider_id,payment_status)')
      .eq('id', disputeId)
      .single();

    if (fetchErr || !dispute) {
      return NextResponse.json({ error: 'Litige introuvable' }, { status: 404 });
    }

    const mission = (dispute as any).mission;
    const updates: Record<string, any> = {
      status: action,
      admin_notes: adminNotes ?? dispute.admin_notes,
      resolved_by_admin_id: check.adminId,
    };

    // Mise à jour litige
    if (action !== 'UNDER_REVIEW') {
      updates.resolved_at = new Date().toISOString();
      if (adminNotes) updates.resolution = adminNotes;
    }

    // Refund automatique en cas de RESOLVED_PATRON
    let refundResult: { refundId: string; amount: number } | null = null;
    if (action === 'RESOLVED_PATRON' && mission?.id) {
      try {
        updates.refund_status = 'REQUESTED';
        const r = await refundMissionPayment({
          missionId: mission.id,
          amountEuros: refundAmount,
          reason: 'requested_by_customer',
        });
        refundResult = { refundId: r.refundId, amount: r.amount };
        updates.refund_status = 'REFUNDED';
        updates.refund_amount = r.amount;
        updates.stripe_refund_id = r.refundId;
      } catch (refundErr: any) {
        console.error('[admin/disputes/resolve] Refund error:', refundErr);
        updates.refund_status = 'FAILED';
        updates.admin_notes = `${updates.admin_notes || ''}\n[REFUND ERROR] ${refundErr?.message || refundErr}`.trim();
      }
    }

    const { error: updateErr } = await admin
      .from('mission_disputes')
      .update(updates)
      .eq('id', disputeId);

    if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

    // Update mission status en DISPUTED si UNDER_REVIEW, sinon garde COMPLETED/CANCELLED selon contexte
    if (mission?.id && action !== 'UNDER_REVIEW') {
      const newMissionStatus = action === 'RESOLVED_PATRON' ? 'CANCELLED' : 'COMPLETED';
      await admin
        .from('missions')
        .update({ status: newMissionStatus })
        .eq('id', mission.id);
    }

    // Blacklist réciproque (optionnel)
    if (blacklist && mission?.patron_id && mission?.provider_id) {
      const entries = [
        {
          blocker_id: mission.patron_id,
          blocked_id: mission.provider_id,
          reason: `Litige ${dispute.reason}`,
          dispute_id: disputeId,
        },
        {
          blocker_id: mission.provider_id,
          blocked_id: mission.patron_id,
          reason: `Litige ${dispute.reason}`,
          dispute_id: disputeId,
        },
      ];
      await admin.from('user_blacklist').upsert(entries, { onConflict: 'blocker_id,blocked_id' });
    }

    // Notifications push aux 2 parties
    if (mission) {
      const title = action === 'UNDER_REVIEW' ? 'Litige en cours d\'examen' : 'Litige résolu';
      const bodyText = action === 'RESOLVED_PATRON'
        ? `Le litige sur "${mission.title}" a été résolu en votre faveur${refundResult ? ` (remboursement ${refundResult.amount}€)` : ''}.`
        : action === 'RESOLVED_PROVIDER'
          ? `Le litige sur "${mission.title}" a été résolu en faveur du prestataire.`
          : action === 'CLOSED'
            ? `Le litige sur "${mission.title}" a été clôturé.`
            : `Votre litige sur "${mission.title}" est en cours d'examen par le support.`;

      const payload = {
        title,
        body: bodyText,
        url: '/patron/missions',
        tag: `dispute-${disputeId}`,
        requireInteraction: true,
      };

      const targets = [mission.patron_id, mission.provider_id].filter(Boolean);
      await Promise.allSettled(
        targets.map((uid: string) => sendPushToUser(uid, payload))
      );
    }

    return NextResponse.json({
      ok: true,
      disputeId,
      action,
      refund: refundResult,
    });
  } catch (err: any) {
    console.error('[admin/disputes/resolve]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
