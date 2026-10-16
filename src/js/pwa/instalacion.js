import { S } from '../estado.js';
import { chevron, icono } from '../iconos.js';
import { render } from '../ui.js';
import { $ } from '../util.js';

/* ---------- instalación como app (PWA) ---------- */
let avisoInstalar = null;           // evento de Android/Chrome para mostrar el diálogo de instalación
const enIframe = (() => { try { return window.self !== window.top; } catch (e) { return true; } })();
const comoApp = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function instalacionHTML() {
  if (comoApp()) return '';
  if (enIframe) return `<p class="text-[.8125rem] tenue px-4">Para instalarla en tu celular, ábrela desde su dirección propia en el navegador.</p>`;
  const fila = `<button type="button" class="fila" style="--sangria:58px" data-accion="instalar">
      <span class="icono-cuadro" style="background:#34C759">${icono('instalar')}</span>
      <span class="min-w-0"><span class="block font-semibold">Instalar en tu celular</span><span class="block text-sm tenue">Ícono en tu pantalla de inicio y uso sin internet</span></span>${chevron()}</button>`;
  let pasos = '';
  if (S.verPasos) {
    pasos = esIOS()
      ? `<ol class="pasos text-[.9375rem]"><li><span>Abre esta página en <strong>Safari</strong>.</span></li><li><span>Toca <strong>Compartir</strong> <span class="inline-block align-middle w-5 h-5" style="color:var(--guinda)">${icono('compartir')}</span> en la barra de abajo.</span></li><li><span>Elige <strong>Agregar a pantalla de inicio</strong> y toca <strong>Agregar</strong>.</span></li></ol>`
      : `<ol class="pasos text-[.9375rem]"><li><span>Abre esta página en <strong>Chrome</strong>.</span></li><li><span>Toca el menú <strong>⋮</strong> arriba a la derecha.</span></li><li><span>Elige <strong>Instalar app</strong> (o <strong>Agregar a pantalla principal</strong>) y confirma.</span></li></ol>`;
    pasos = `<div class="panel p-4 flex flex-col gap-3">${pasos}<p class="text-[.8125rem] tenue">La app se abre a pantalla completa, sin barra del navegador, y tu progreso se conserva.</p></div>`;
  }
  return `<div class="lista">${fila}</div>${pasos}`;
}
async function instalar() {
  if (avisoInstalar) {
    avisoInstalar.prompt();
    const r = await avisoInstalar.userChoice.catch(() => null);
    avisoInstalar = null;
    if (r && r.outcome === 'accepted') { S.verPasos = false; render(); return; }
  }
  S.verPasos = !S.verPasos; render();
  if (S.verPasos) requestAnimationFrame(() => $('.pasos')?.closest('.panel')?.scrollIntoView({ block: 'center', behavior: 'smooth' }));
}
function iniciarInstalacion() {
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); avisoInstalar = e; });
  window.addEventListener('appinstalled', () => { avisoInstalar = null; if (S.vista === 'inicio') render(); });
}

export { enIframe, iniciarInstalacion, instalacionHTML, instalar };
