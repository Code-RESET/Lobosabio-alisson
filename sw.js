// Service worker de Lobitos: guarda la app para que funcione sin conexión.
// Al publicar una versión nueva, cambia VERSION (el flujo de GitHub Pages le agrega el commit automáticamente).
// La app detecta la versión nueva y muestra «Actualizar ahora»; al tocarlo se activa sin perder el progreso.
const VERSION = 'lobitos-1.4.0';
const APP = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icono-192.png',
  './icons/icono-512.png',
  './icons/icono-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  './icons/icono.svg'
];
// Bibliotecas externas: Tailwind siempre; pdf.js y mammoth se guardan la primera vez que se usan.
const CDN = ['https://cdn.tailwindcss.com/3.4.17'];

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(APP);
    await Promise.all(CDN.map(u => fetch(u, { mode: 'no-cors' }).then(r => c.put(u, r)).catch(() => {})));
    // La primera instalación se activa sola; las actualizaciones esperan a que el usuario toque «Actualizar ahora».
    if (!self.registration.active) await self.skipWaiting();
  })());
});

self.addEventListener('message', e => { if (e.data === 'activar') self.skipWaiting(); });

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Páginas: primero la red (para recibir actualizaciones); sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(VERSION); c.put('./index.html', r.clone());
        return r;
      } catch (err) {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }
  // Archivos propios y bibliotecas: la copia guardada al instante y se actualiza en segundo plano.
  const propio = url.origin === location.origin;
  const cdn = /(^|\.)(cdn\.tailwindcss\.com|cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net)$/.test(url.hostname);
  if (!propio && !cdn) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const guardada = await c.match(req, { ignoreSearch: propio });
    const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    return guardada || (await red) || new Response('', { status: 504, statusText: 'Sin conexión' });
  })());
});
