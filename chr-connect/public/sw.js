const STATIC_CACHE = 'connectchr-static-v3';
const DYNAMIC_CACHE = 'connectchr-dynamic-v3';
const OFFLINE_URL = '/';

const PRECACHE_URLS = ['/', '/patron/equipements', '/patron/planning', '/prestataire/mes-missions'];

// Install — precache shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch(() => {
            /* best-effort */
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE && k !== DYNAMIC_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function shouldBypass(url) {
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('stripe.com') ||
    url.pathname.startsWith('/_next/webpack-hmr')
  );
}

function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    /\.(png|jpg|jpeg|svg|webp|woff2?|css|js)$/i.test(url.pathname)
  );
}

// Fetch — strategies : bypass API, cache-first pour statics, network-first pour HTML
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;
  if (shouldBypass(url)) return;

  if (isStaticAsset(url)) {
    // Cache-first pour les assets (bundle JS, CSS, images, fonts)
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Network-first pour HTML/documents avec fallback cache + offline page
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
        }
        return new Response('Hors ligne', { status: 503, statusText: 'Offline' });
      })
  );
});

// ============================================================================
// PUSH NOTIFICATIONS
// ============================================================================
self.addEventListener('push', (event) => {
  let payload = { title: 'ConnectCHR', body: 'Nouvelle notification', url: '/' };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch (_) {
      payload.body = event.data.text();
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/icons/icon-192.png',
    badge: payload.badge || '/icons/icon-192.png',
    data: { url: payload.url || '/', ...(payload.data || {}) },
    tag: payload.tag,
    requireInteraction: !!payload.requireInteraction,
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url.includes(targetUrl) && 'focus' in win) return win.focus();
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});

// Triggered when the browser invalidates a subscription (e.g. user clears data)
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const newSub = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: event.oldSubscription && event.oldSubscription.options.applicationServerKey,
        });
        await fetch('/api/push/resubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldEndpoint: event.oldSubscription && event.oldSubscription.endpoint,
            newSubscription: newSub.toJSON(),
          }),
        });
      } catch (err) {
        // Best-effort; subscription will be recreated on next app open.
      }
    })()
  );
});
