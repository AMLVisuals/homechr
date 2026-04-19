import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, sendPushToUser } from '@/lib/push-server';

/**
 * POST /api/missions/notify-patron
 * Body: { missionId: string, event: 'NEW_CANDIDATE' | 'CANDIDATE_WITHDRAWN', workerName?: string }
 * Envoie une push au patron de la mission concernée.
 */
export async function POST(req: NextRequest) {
  try {
    const { missionId, event, workerName } = await req.json();
    if (!missionId || !event) {
      return NextResponse.json({ error: 'missionId et event requis' }, { status: 400 });
    }

    const admin = getAdminSupabase();
    const { data: mission, error } = await admin
      .from('missions')
      .select('id, title, patron_id')
      .eq('id', missionId)
      .single();

    if (error || !mission) {
      return NextResponse.json({ error: error?.message || 'Mission introuvable' }, { status: 404 });
    }

    let title = 'Nouvelle notification';
    let body = mission.title;

    if (event === 'NEW_CANDIDATE') {
      title = 'Nouvelle candidature';
      body = workerName
        ? `${workerName} souhaite rejoindre "${mission.title}"`
        : `Un prestataire a postulé à "${mission.title}"`;
    } else if (event === 'CANDIDATE_WITHDRAWN') {
      title = 'Candidature retirée';
      body = workerName
        ? `${workerName} s'est retiré de "${mission.title}"`
        : `Un candidat s'est retiré de "${mission.title}"`;
    }

    const result = await sendPushToUser(mission.patron_id, {
      title,
      body,
      url: '/patron/missions',
      tag: `mission-${mission.id}`,
      data: { missionId: mission.id },
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
