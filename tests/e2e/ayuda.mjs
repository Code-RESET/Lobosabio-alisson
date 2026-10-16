// Utilidades para las pruebas de punta a punta: servidor local, navegador y bibliotecas sin internet.
import { createServer } from 'node:http';
import { readFile, stat, cp, mkdtemp } from 'node:fs/promises';
import { join, extname, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

export const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '../..');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.css': 'text/css', '.txt': 'text/plain'
};

// Sirve una carpeta por http://127.0.0.1:<puerto>/ (los service workers solo funcionan en https o localhost).
export async function servir(carpeta) {
  const servidor = createServer(async (req, res) => {
    try {
      let ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      if (ruta.endsWith('/')) ruta += 'index.html';
      const archivo = join(carpeta, ruta);
      if (!archivo.startsWith(carpeta) || !(await stat(archivo)).isFile()) throw new Error('404');
      res.writeHead(200, { 'Content-Type': TIPOS[extname(archivo)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
      res.end(await readFile(archivo));
    } catch {
      res.writeHead(404); res.end('no encontrado');
    }
  });
  await new Promise(r => servidor.listen(0, '127.0.0.1', r));
  return { url: `http://127.0.0.1:${servidor.address().port}/`, cerrar: () => new Promise(r => servidor.close(r)) };
}

// Copia los archivos publicables de la app a una carpeta temporal (igual que el flujo de publicación).
export async function copiaPublicable() {
  const dir = await mkdtemp(join(tmpdir(), 'lobitos-e2e-'));
  for (const f of ['index.html', 'sw.js', 'version.json', 'manifest.webmanifest', 'icons', 'assets']) {
    await cp(join(RAIZ, f), join(dir, f), { recursive: true });
  }
  return dir;
}

// pdf.js y mammoth se piden a jsDelivr; en las pruebas se sirven desde node_modules. Todo lo demás externo se bloquea.
async function bibliotecasLocales(ctx) {
  await ctx.route(/^https:\/\//, async ruta => {
    const u = ruta.request().url();
    const m = u.match(/cdn\.jsdelivr\.net\/npm\/(pdfjs-dist|mammoth)@[^/]+\/(.+)$/);
    if (!m) return ruta.abort();
    const cuerpo = await readFile(join(RAIZ, 'node_modules', m[1], m[2]));
    await ruta.fulfill({ body: cuerpo, contentType: 'text/javascript', headers: { 'Access-Control-Allow-Origin': '*' } });
  });
}

let navegador = null;
export async function abrir(url, { ancho = 390, alto = 844, movil = true, sw = 'block', esquema = 'dark' } = {}) {
  navegador ??= await chromium.launch();
  const ctx = await navegador.newContext({ viewport: { width: ancho, height: alto }, isMobile: movil, hasTouch: movil, serviceWorkers: sw, colorScheme: esquema });
  await bibliotecasLocales(ctx);
  const pagina = await ctx.newPage();
  const errores = [];
  pagina.on('pageerror', e => errores.push(e.message));
  pagina.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text()); });
  await pagina.goto(url);
  await pagina.waitForSelector('#v-inicio .lista');
  return { pagina, ctx, errores };
}
export async function cerrarNavegador() { await navegador?.close(); navegador = null; }

// Toca la opción correcta de la pregunta visible (la lee del estado expuesto para pruebas).
export async function respuestaCorrecta(pagina, vista) {
  return pagina.evaluate(v => {
    const q = document.querySelector(`#v-${v} .escena-pregunta`)?.textContent;
    return window.Lobitos.todasPreguntas('*').find(p => p.pregunta === q);
  }, vista);
}
