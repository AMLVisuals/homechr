import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase, sendPushToUser } from '@/lib/push-server';

/**
 * POST /api/missions/notify-candidates
 * Body: { missionId: string, maxCandidates?: number }
 *
 * Trouve les workers dont les skills overlappent avec ceux de la mission,
 * leur envoie une notification push "Nouvelle mission disponible".
 * À appeler côté client juste après la création d'une mission SEARCHING.
 */
export async function POST(req: NextRequest) {
  try {
    const { missionId, maxCandidates = 50 } = await req.json();
    if (!missionId) {
      return NextResponse.json({ error: 'missionId requis' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    const { data: mission, error: missionErr } = await admin
      .from('missions')
      .select('id, title, skills, patron_id, status, urgent, type, category')
      .eq('id', missionId)
      .single();

    if (missionErr || !mission) {
      return NextResponse.json({ error: missionErr?.message || 'Mission introuvable' }, { status: 404 });
    }

    if (mission.status !== 'SEARCHING') {
      return NextResponse.json({ ok: true, skipped: 'Mission non en recherche' });
    }

    let workersQuery = admin
      .from('profiles')
      .select('id, skills, role')
      .eq('role', 'WORKER')
      .neq('id', mission.patron_id)
      .limit(maxCandidates);

    if (Array.isArray(mission.skills) && mission.skills.length > 0) {
      workersQuery = workersQuery.overlaps('skills', mission.skills);
    }

    const { data: workers, error: workersErr } = await workersQuery;
    if (workersErr) {
      return NextResponse.json({ error: workersErr.message }, { status: 500 });
    }

    if (!workers || workers.length === 0) {
      return NextResponse.json({ ok: true, matched: 0, pushed: 0 });
    }

    // Exclure les workers blacklistés par le patron (ou ayant blacklisté le patron)
    let blacklistedIds = new Set<string>();
    if (mission.patron_id) {
      const { data: blacklistRows } = await admin
        .from('user_blacklist')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${mission.patron_id},blocked_id.eq.${mission.patron_id}`);
      if (blacklistRows) {
        for (const row of blacklistRows) {
          if (row.blocker_id === mission.patron_id) blacklistedIds.add(row.blocked_id);
          if (row.blocked_id === mission.patron_id) blacklistedIds.add(row.blocker_id);
        }
      }
    }

    const filteredWorkers = workers.filter((w: any) => !blacklistedIds.has(w.id));
    if (filteredWorkers.length === 0) {
      return NextResponse.json({ ok: true, matched: 0, pushed: 0, excluded: blacklistedIds.size });
    }

    const missionSkills: string[] = Array.isArray(mission.skills) ? mission.skills : [];
    const ranked = filteredWorkers
      .map((w: any) => {
        const ws: string[] = Array.isArray(w.skills) ? w.skills : [];
        const overlap = missionSkills.length === 0
          ? 0
          : ws.filter((s) => missionSkills.includes(s)).length;
        return { id: w.id, overlap };
      })
      .sort((a, b) => b.overlap - a.overlap);

    const urgentPrefix = mission.urgent ? '⚡ Urgent — ' : '';
    const payload = {
      title: `${urgentPrefix}Nouvelle mission`,
      body: mission.title || 'Une mission correspond à votre profil',
      url: '/prestataire/mes-missions',
      tag: `mission-${mission.id}`,
      data: { missionId: mission.id },
      requireInteraction: !!mission.urgent,
    };

    let totalSent = 0;
    const results = await Promise.allSettled(
      ranked.map((w) => sendPushToUser(w.id, payload))
    );
    for (const r of results) {
      if (r.status === 'fulfilled') totalSent += r.value.sent;
    }

    return NextResponse.json({
      ok: true,
      matched: ranked.length,
      pushed: totalSent,
      excluded: blacklistedIds.size,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
