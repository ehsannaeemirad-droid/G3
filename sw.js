/* Service worker — گرامر
 * Cache-first shell (code, fonts, icons, manifest), network-first lesson JSON.
 * Bump CACHE_VERSION together with version.json when shipping an update.
 * Do NOT use ignoreSearch on cache.match: keys with ?v=N must stay separate.
 */
const CACHE_VERSION = '1';
const CACHE_NAME = 'grammar-v' + CACHE_VERSION;

const PRECACHE = [
  './',
  './index.html',
  './app.css',
  './manifest.webmanifest',
  './version.json',
  // js
  './js/main.js',
  './js/config.js',
  './js/router.js',
  './js/store.js',
  './js/data.js',
  './js/views/dashboard.js',
  './js/views/library.js',
  './js/views/lesson.js',
  './js/views/finish.js',
  './js/views/review.js',
  './js/views/stats.js',
  './js/views/settings.js',
  './js/engine/lesson-runner.js',
  './js/engine/review-runner.js',
  './js/engine/item-mounter.js',
  './js/engine/items/mcq.js',
  './js/engine/items/text.js',
  './js/engine/items/order.js',
  './js/engine/items/ident.js',
  './js/engine/items/double.js',
  './js/engine/items/fix.js',
  './js/engine/ui/feedback.js',
  './js/engine/ui/skip.js',
  // data
  './data/lessons-index.json',
  './data/lessons/gerunds.json',
  './data/lessons/noun-clauses.json',
  './data/lessons/adjective-clauses.json',
  './data/lessons/present-perfect.json',
  './data/lessons/present-perfect-continuous.json',
  './data/lessons/past-perfect.json',
  './data/lessons/future-continuous.json',
  './data/lessons/passive.json',
  './data/lessons/perfect-modals.json',
  './data/lessons/conditional-2.json',
  './data/lessons/conditional-3.json',
  './data/lessons/mixed-conditionals.json',
  './data/lessons/wish.json',
  './data/lessons/reported-speech.json',
  // assets
  './assets/fonts/Vazirmatn-Regular.woff2',
  './assets/fonts/Vazirmatn-Medium.woff2',
  './assets/fonts/Vazirmatn-Bold.woff2',
  './assets/fonts/Vazirmatn-ExtraBold.woff2',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
    // no skipWaiting here: main.js posts { type: 'SKIP_WAITING' } when ready
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((k) => k.startsWith('grammar-v') && k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

function isDataJson(url) {
  return url.pathname.includes('/data/') && url.pathname.endsWith('.json');
}

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // lesson JSON: network-first (fresh content when online, cache when offline).
  // Runtime copies are keyed by the full ?v=N URL; on an exact miss we fall back
  // to the precached plain URL (same bundle content, no ignoreSearch option).
  if (isDataJson(url)) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(async () => {
          const hit = await caches.match(req);
          if (hit) return hit;
          const plain = new URL(req.url);
          plain.search = '';
          const fallback = await caches.match(plain.href);
          if (fallback) return fallback;
          return new Response('آفلاین نیستی و این فایل کش نشده است.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          });
        })
    );
    return;
  }

  // shell, code, fonts, icons: cache-first (updates flow through CACHE_VERSION bumps)
  event.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      }).catch(async () => {
        // SPA offline navigation: serve the app shell
        if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
        }
        throw new Error('offline and not cached: ' + req.url);
      });
    })
  );
});
