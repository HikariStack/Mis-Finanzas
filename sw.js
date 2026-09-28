// Service worker: guarda la app para que abra sin conexión y muestra
// las notificaciones push que manda el servidor.
const CACHE = 'cuentas-claras-v5';
const FILES = ['./', './index.html', './config.js', './manifest.webmanifest', './apple-touch-icon.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Primero la red (para recibir mejoras), y si no hay conexión, la copia guardada
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match('./index.html')))
  );
});

self.addEventListener('push', e => {
  let data = {title: 'Cuentas Claras', body: 'Tienes un aviso nuevo.'};
  try { data = e.data.json(); } catch(_){}
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: './icon-192.png',
    badge: './icon-192.png',
  }));
});
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type:'window'}).then(list => {
    if (list.length) return list[0].focus();
    return self.clients.openWindow('./');
  }));
});
