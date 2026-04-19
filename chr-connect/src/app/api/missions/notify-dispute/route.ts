import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, sendPushToUser } from '@/lib/push-server';

/**
 * POST /api/missions/notify-dispute
 * Body: { missionId, reason }
 * Notifie les 2 parties (patron + worker) qu'un litige a été ouvert sur leur mission.
 */
export async function POST(req: NextRequest) {
  try {
    const { missionId, reason } = await req.json();
    if (!missionId) return NextResponse.json({ error: 'missionId requis' }, { status: 400 });

    const admin = getAdminSupabase();
    const { data: mission, error } = await admin
      .from('missions')
      .select('id, title, patron_id, provider_id')
      .eq('id', missionId)
      .single();

    if (error || !mission) {
      return NextResponse.json({ error: error?.message || 'Mission introuvable' }, { status: 404 });
    }

    const payload = {
      title: 'Litige ouvert',
      body: `Un signalement a été déposé sur "${mission.title}". L'équipe support examine.`,
      url: '/patron/missions',
      tag: `dispute-${mission.id}`,
      data: { missionId: mission.id, reason },
      requireInteraction: true,
    };

    const targets = [mission.patron_id, mission.provider_id].filter(Boolean) as string[];
    const results = await Promise.allSettled(targets.map((uid) => sendPushToUser(uid, payload)));
    const pushed = results.reduce((sum, r) => sum + (r.status === 'fulfilled' ? r.value.sent : 0), 0);

    return NextResponse.json({ ok: true, pushed });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
