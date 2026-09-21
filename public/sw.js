const CACHE_NAME = 'whenwemet-__BUILD__';

// Le nouveau service worker prend la main immédiatement.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  // Pages : réseau d'abord, cache seulement si hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copie = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(req, copie));
          return res;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('/index.html')))
    );
    return;
  }

  // Ressources (JS, CSS, images) : cache d'abord, leurs noms changent à chaque build.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok && new URL(req.url).origin === self.location.origin) {
        const copie = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(req, copie));
      }
      return res;
    }))
  );
});
