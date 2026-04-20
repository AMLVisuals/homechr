import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/push-server';

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
 * GET /api/admin/disputes?status=OPEN|UNDER_REVIEW|...
 * Liste tous les litiges avec les infos mission + parties.
 */
export async function GET(req: NextRequest) {
  try {
    const check = await assertAdmin(req);
    if (!check.ok) return NextResponse.json({ error: check.error }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const statusFilter = searchParams.get('status');

    const admin = getAdminSupabase();
    let query = admin
      .from('mission_disputes')
      .select(`
        *,
        mission:missions(id,title,patron_id,provider_id,status,payment_status,captured_amount,authorized_amount,stripe_payment_intent_id)
      `)
      .order('created_at', { ascending: false });

    if (statusFilter && statusFilter !== 'ALL') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Enrichir avec les noms des parties
    const enriched = await Promise.all(
      (data || []).map(async (d: any) => {
        const mission = d.mission;
        if (!mission) return d;
        const [patronRes, workerRes] = await Promise.all([
          mission.patron_id
            ? admin.from('profiles').select('first_name,last_name,email').eq('id', mission.patron_id).single()
            : Promise.resolve({ data: null }),
          mission.provider_id
            ? admin.from('profiles').select('first_name,last_name,email').eq('id', mission.provider_id).single()
            : Promise.resolve({ data: null }),
        ]);
        return {
          ...d,
          patron_name: patronRes.data
            ? `${patronRes.data.first_name || ''} ${patronRes.data.last_name || ''}`.trim() || patronRes.data.email
            : null,
          worker_name: workerRes.data
            ? `${workerRes.data.first_name || ''} ${workerRes.data.last_name || ''}`.trim() || workerRes.data.email
            : null,
        };
      })
    );

    return NextResponse.json({ disputes: enriched });
  } catch (err: any) {
    console.error('[admin/disputes GET]', err);
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
