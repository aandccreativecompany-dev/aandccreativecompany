// Offline support: cache the app shell, always try the network first so an
// update is picked up as soon as you are online. Cloud sync calls are never cached.
const CACHE = 'prakriya-web-v2';
const SHELL = ['/app/', '/app/app.css', '/app/firebase-config.js', '/app/google-config.js', '/app/mantras.json', '/app/js/main.js', '/app/js/util.js', '/app/js/store.js', '/app/js/sync.js', '/app/js/drivebackup.js', '/app/js/ui.js',
  '/app/js/views/today.js', '/app/js/views/tasks.js', '/app/js/views/habits.js', '/app/js/views/journal.js', '/app/js/views/money.js', '/app/js/views/progress.js', '/app/js/views/mind.js', '/app/js/views/settings.js', '/app/icons/icon-192.png'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.startsWith('/app/')) return;
  e.respondWith(fetch(e.request).then((r) => { const copy = r.clone(); if (r.ok) caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request).then((m) => m || caches.match('/app/'))));
});
