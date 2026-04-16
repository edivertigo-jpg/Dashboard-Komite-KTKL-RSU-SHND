/**
 * ============================================================
 *  SERVICE WORKER — Dashboard Komite Nakes Lain SHND
 *  Strategi:
 *  • Google Apps Script API  → Network Only (data harus segar)
 *  • Google Fonts / CDN      → Stale-While-Revalidate (cache dulu, update background)
 *  • index.html              → Network-First dengan fallback cache
 *  • manifest.json / icons   → Cache First
 * ============================================================
 */

const CACHE_VERSION   = 'nakes-shnd-v1';
const STATIC_CACHE    = `${CACHE_VERSION}-static`;
const FONT_CACHE      = `${CACHE_VERSION}-fonts`;

// Aset yang di-precache saat install
const PRECACHE_ASSETS = [
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// URL yang tidak boleh di-cache (selalu fetch langsung)
const NETWORK_ONLY_PATTERNS = [
  'script.google.com',      // Google Apps Script API
  'googleapis.com/macros',  // GAS endpoint
];

// URL CDN/font yang pakai Stale-While-Revalidate
const SWR_PATTERNS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdnjs.cloudflare.com',
  'lh3.googleusercontent.com', // foto Drive
];

// ── INSTALL ─────────────────────────────────────────────────
self.addEventListener('install', event => {
  console.log('[SW] Installing', CACHE_VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        // Precache aset — abaikan error individual (icon mungkin belum ada)
        return Promise.allSettled(
          PRECACHE_ASSETS.map(url =>
            cache.add(url).catch(e => console.warn('[SW] Precache skip:', url, e.message))
          )
        );
      })
      .then(() => self.skipWaiting()) // langsung aktif
  );
});

// ── ACTIVATE ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  console.log('[SW] Activating', CACHE_VERSION);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key.startsWith('nakes-shnd-') && key !== STATIC_CACHE && key !== FONT_CACHE)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      ))
      .then(() => self.clients.claim()) // ambil alih tab yang sudah terbuka
  );
});

// ── FETCH ────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = request.url;

  // Hanya handle GET
  if (request.method !== 'GET') return;

  // 1. Network Only — GAS API
  if (NETWORK_ONLY_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(networkOnly(request));
    return;
  }

  // 2. Stale-While-Revalidate — CDN & Fonts & Foto Drive
  if (SWR_PATTERNS.some(p => url.includes(p))) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE));
    return;
  }

  // 3. Network-First — index.html dan file lokal lainnya
  event.respondWith(networkFirst(request));
});

// ── STRATEGI FETCH ───────────────────────────────────────────

/**
 * Network Only — langsung ke jaringan, tanpa cache.
 * Jika gagal, lempar error agar aplikasi bisa tampilkan pesan.
 */
async function networkOnly(request) {
  try {
    return await fetch(request);
  } catch (err) {
    console.warn('[SW] Network only failed:', request.url, err.message);
    return new Response(
      JSON.stringify({ success: false, error: 'Tidak ada koneksi internet. Periksa jaringan Anda.' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Network-First — coba jaringan, fallback ke cache.
 * Digunakan untuk index.html agar selalu dapat versi terbaru.
 */
async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) {
      // Update cache dengan versi terbaru
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch (err) {
    console.warn('[SW] Network failed, serving cache:', request.url);
    const cached = await cache.match(request);
    if (cached) return cached;
    // Fallback ke index.html jika path tidak ditemukan (SPA fallback)
    const indexCache = await cache.match('./index.html');
    if (indexCache) return indexCache;
    return new Response('<h2>Tidak ada koneksi &amp; belum ada cache</h2>', {
      status: 503,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

/**
 * Stale-While-Revalidate — sajikan cache, update di background.
 * Bagus untuk font dan CDN.
 */
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Update di background
  const fetchPromise = fetch(request)
    .then(response => {
      if (response.ok) cache.put(request, response.clone()).catch(() => {});
      return response;
    })
    .catch(() => null);

  // Sajikan cache langsung jika ada, jika tidak tunggu network
  return cached || fetchPromise;
}

// ── BACKGROUND SYNC (opsional — untuk POST yang gagal) ───────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-nakes-data') {
    console.log('[SW] Background sync triggered');
    // Bisa diimplementasikan untuk retry upload yang gagal
  }
});

// ── PESAN DARI CLIENT ─────────────────────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_VERSION });
  }
});
