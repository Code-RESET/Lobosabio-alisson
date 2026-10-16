// Service worker de Lobitos: guarda la app para que funcione sin conexión.
// Plantilla: «npm run build» genera /sw.js reemplazando __VERSION__ por la versión de package.json y el build.
// La app detecta la versión nueva y muestra «Actualizar ahora»; al tocarlo se activa sin perder el progreso.
const VERSION = 'lobitos-__VERSION__';
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
// Bibliotecas externas (pdf.js y mammoth) se guardan la primera vez que se usan; los estilos ya vienen compilados.

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const c = await caches.open(VERSION);
    await c.addAll(APP);
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
  // version.json siempre va a la red: es como la app sabe si hay una versión nueva.
  if (url.origin === location.origin && url.pathname.endsWith('/version.json')) return;
  // Páginas: primero la red (para recibir actualizaciones); sin conexión, la copia guardada.
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const r = await fetch(req);
        const c = await caches.open(VERSION); c.put('./index.html', r.clone());
        return r;
      } catch {
        return (await caches.match('./index.html')) || (await caches.match('./'));
      }
    })());
    return;
  }
  // Archivos propios y bibliotecas: la copia guardada al instante y se actualiza en segundo plano.
  const propio = url.origin === location.origin;
  const cdn = /(^|\.)(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname);
  if (!propio && !cdn) return;
  e.respondWith((async () => {
    const c = await caches.open(VERSION);
    const guardada = await c.match(req, { ignoreSearch: propio });
    const red = fetch(req).then(r => { if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }).catch(() => null);
    return guardada || (await red) || new Response('', { status: 504, statusText: 'Sin conexión' });
  })());
});
