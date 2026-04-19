import { NextRequest, NextResponse } from 'next/server';
import { sendPushToUser } from '@/lib/push-server';

export async function POST(req: NextRequest) {
  try {
    const { userId, payload } = await req.json();
    if (!userId || !payload?.title || !payload?.body) {
      return NextResponse.json({ error: 'Payload invalide (userId, title, body requis)' }, { status: 400 });
    }

    const result = await sendPushToUser(userId, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erreur serveur' }, { status: 500 });
  }
}
