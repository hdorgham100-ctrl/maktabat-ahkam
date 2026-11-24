/* مكتبة أحكام — Service Worker: آخر نسخة من النت أولاً، والنسخة المحفوظة لو مفيش نت */
const CACHE = 'maktaba-ahkam-v1';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE).catch(() => {})));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // مكتبات خارجية: المتصفح يتصرف عادي
  const isPage = req.mode === 'navigate' || /\/(index\.html)?$/.test(url.pathname) || /version\.json$/.test(url.pathname);
  if (isPage) {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        if (fresh && fresh.ok && !/version\.json$/.test(url.pathname)) { const c = await caches.open(CACHE); await c.put('./index.html', fresh.clone()); await c.put('./', fresh.clone()); }
        return fresh;
      } catch (err) {
        const c = await caches.open(CACHE);
        return (await c.match('./index.html')) || (await c.match(req)) || Response.error();
      }
    })());
    return;
  }
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const hit = await c.match(req);
    const net = fetch(req).then(r => { if (r && r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
    return hit || net;
  })());
});
