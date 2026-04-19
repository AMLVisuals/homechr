const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = typeof atob === 'function' ? atob(normalized) : Buffer.from(normalized, 'base64').toString('binary');
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;
  const reg = await navigator.serviceWorker.ready;
  return reg.pushManager.getSubscription();
}

export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

export async function subscribeToPush(userId: string): Promise<{
  ok: boolean;
  subscription?: PushSubscription;
  error?: string;
}> {
  if (!isPushSupported()) return { ok: false, error: 'Push non supporté par ce navigateur.' };
  if (!VAPID_PUBLIC_KEY) return { ok: false, error: 'Clé VAPID publique manquante.' };

  const permission = await requestPushPermission();
  if (permission !== 'granted') return { ok: false, error: 'Permission refusée.' };

  const reg = await navigator.serviceWorker.ready;

  let subscription = await reg.pushManager.getSubscription();
  if (!subscription) {
    const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer;
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey,
    });
  }

  const res = await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      subscription: subscription.toJSON(),
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { ok: false, error: err || 'Échec enregistrement serveur.' };
  }

  return { ok: true, subscription };
}

export async function unsubscribeFromPush(userId: string): Promise<{ ok: boolean; error?: string }> {
  if (!isPushSupported()) return { ok: false };
  const sub = await getExistingSubscription();
  if (!sub) return { ok: true };

  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, endpoint: sub.endpoint }),
  });

  try {
    await sub.unsubscribe();
  } catch (_) {
    /* ignore */
  }

  return { ok: true };
}
