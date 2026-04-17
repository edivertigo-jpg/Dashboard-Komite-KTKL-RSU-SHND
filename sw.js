/**
 * ============================================================
 *  SERVICE WORKER — Dashboard Komite Nakes Lain SHND
 *  v2 — Cache agresif dibersihkan saat update
 * ============================================================
 */

const CACHE_VERSION = 'nakes-shnd-v2';          // ← naikkan ini setiap deploy
const STATIC_CACHE  = `${CACHE_VERSION}-static`;
const FONT_CACHE    = `${CACHE_VERSION}-fonts`;

const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

const NETWORK_ONLY_PATTERNS = [
  'script.google.com',
  'googleapis.com/macros',
];

const SWR_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'lh3.googleusercontent.com',
];

// ── INSTALL ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache =>
        Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(e => console.warn('[SW] Precache skip:', url, e.message))
          )
        )
      )
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => {
        console.log('[SW] Caches ditemukan:', keys);
        return Promise.all(
          keys
            .filter(key => key !== STATIC_CACHE && key !== FONT_CACHE)
            .map(key => {
              console.log('[SW] Hapus cache lama:', key);
              return caches.delete(key);
            })
        );
      })
      .then(() => self.clients.claim())
      .then(() => {
        return self.clients.matchAll({ type: 'window' }).then(clients => {
          clients.forEach(client => {
            client.postMessage({ type: 'SW_UPDATED', version: CACHE_VERSION });
          });
        });
      })
  );
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  if (request.method !== 'GET') return;

  if (NETWORK_ONLY_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(networkOnly(request));
    return;
  }

  if (SWR_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  event.respondWith(networkFirst(request));
});

// ── STRATEGI FETCH ───────────────────────────────────────────

async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: 'Tidak ada koneksi internet.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store' });
    if (response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    console.warn('[SW] Network gagal, pakai cache:', request.url);
    const cached = await cache.match(request);
    if (cached) return cached;
    const indexCache = await cache.match('./index.html');
    if (indexCache) return indexCache;
    return new Response('<h2>Tidak ada koneksi &amp; belum ada cache</h2>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise;
}

// ── PESAN DARI CLIENT ─────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data?.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
  if (event.data?.type === 'CLEAR_ALL_CACHE') {
    caches.keys().then(keys =>
      Promise.all(keys.map(k => caches.delete(k)))
    ).then(() => {
      if (event.ports[0]) event.ports[0].postMessage({ cleared: true });
      console.log('[SW] Semua cache dibersihkan via perintah manual');
    });
  }
});
