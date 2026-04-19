import { NextRequest, NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/push-server';

export async function POST(req: NextRequest) {
  try {
    const { oldEndpoint, newSubscription } = await req.json();
    if (!newSubscription?.endpoint || !newSubscription?.keys?.p256dh || !newSubscription?.keys?.auth) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 });
    }

    const admin = getAdminSupabase();

    if (oldEndpoint) {
      const { data: existing } = await admin
        .from('push_subscriptions')
        .select('user_id')
        .eq('endpoint', oldEndpoint)
        .maybeSingle();

      if (existing?.user_id) {
        await admin.from('push_subscriptions').delete().eq('endpoint', oldEndpoint);
        await admin.from('push_subscriptions').upsert({
          user_id: existing.user_id,
          endpoint: newSubscription.endpoint,
          p256dh: newSubscription.keys.p256dh,
          auth: newSubscription.keys.auth,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
