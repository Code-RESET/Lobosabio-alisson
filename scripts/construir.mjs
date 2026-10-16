#!/usr/bin/env node
/* Construye Lobitos a partir de src/:
     index.html    → plantilla + estilos (src/estilos + Tailwind compilado) + módulos JS empaquetados
     sw.js         → service worker con la versión
     version.json  → versión publicada (la app la consulta para saber si hay actualización)
   Uso:  npm run build                      (build «local», resultado estable para el repositorio)
         LOBITOS_BUILD=abc1234 npm run build (lo usa el flujo de publicación con el commit)
         npm run dev                          (reconstruye al guardar cambios en src/) */
import { build } from 'esbuild';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdtempSync, rmSync, watch } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = ruta => readFileSync(join(RAIZ, ruta), 'utf8');

function compilarTailwind() {
  const tmp = mkdtempSync(join(tmpdir(), 'lobitos-tw-'));
  try {
    writeFileSync(join(tmp, 'entrada.css'), '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n');
    execFileSync(join(RAIZ, 'node_modules/.bin/tailwindcss'),
      ['-c', join(RAIZ, 'tailwind.config.js'), '-i', join(tmp, 'entrada.css'), '-o', join(tmp, 'salida.css'), '--minify'],
      { cwd: RAIZ, stdio: ['ignore', 'ignore', 'pipe'] });
    return readFileSync(join(tmp, 'salida.css'), 'utf8');
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

export async function construir({ silencioso = false } = {}) {
  const inicio = Date.now();
  const { version } = JSON.parse(leer('package.json'));
  const compilacion = process.env.LOBITOS_BUILD || 'local';

  const js = await build({
    entryPoints: [join(RAIZ, 'src/js/main.js')],
    bundle: true, format: 'iife', target: 'es2020', write: false, charset: 'utf8', legalComments: 'none',
    define: { __APP_VERSION__: JSON.stringify(version), __APP_BUILD__: JSON.stringify(compilacion) },
    logLevel: 'warning'
  });
  const codigo = js.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

  const estilos = readdirSync(join(RAIZ, 'src/estilos')).filter(f => f.endsWith('.css')).sort()
    .map(f => `/* ---- ${f} ---- */\n` + leer(`src/estilos/${f}`)).join('\n');
  const tailwind = compilarTailwind();

  let html = leer('src/index.html')
    .replace('<!-- Plantilla de Lobitos. index.html se genera con «npm run build»; edita este archivo, no el generado. -->',
      `<!-- ARCHIVO GENERADO por «npm run build» a partir de src/. No lo edites a mano. Lobitos v${version} (${compilacion}). -->`);
  const partes = html.split('<!-- @estilos -->');
  if (partes.length !== 2) throw new Error('La plantilla debe tener exactamente un <!-- @estilos -->');
  html = partes[0] + `<style>\n${estilos}</style>\n<style id="tailwind">${tailwind}</style>` + partes[1];
  const partesApp = html.split('<!-- @app -->');
  if (partesApp.length !== 2) throw new Error('La plantilla debe tener exactamente un <!-- @app -->');
  html = partesApp[0] + codigo + partesApp[1];

  writeFileSync(join(RAIZ, 'index.html'), html);
  writeFileSync(join(RAIZ, 'sw.js'),
    '// ARCHIVO GENERADO por «npm run build» a partir de src/sw.js. No lo edites a mano.\n' +
    leer('src/sw.js').replace('__VERSION__', `${version}-${compilacion}`));
  writeFileSync(join(RAIZ, 'version.json'), JSON.stringify({ version, build: compilacion }, null, 2) + '\n');

  if (!silencioso) {
    const kb = n => (Buffer.byteLength(n) / 1024).toFixed(0) + ' KB';
    console.log(`Lobitos v${version} (${compilacion}) → index.html ${kb(html)} · JS ${kb(codigo)} · CSS ${kb(estilos + tailwind)} · ${Date.now() - inicio} ms`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await construir();
  if (process.argv.includes('--vigilar')) {
    console.log('Vigilando src/… (Ctrl+C para salir)');
    let espera = null;
    watch(join(RAIZ, 'src'), { recursive: true }, () => {
      clearTimeout(espera);
      espera = setTimeout(() => construir().catch(e => console.error(e.message)), 150);
    });
  }
}
