import { APP_BUILD, APP_VERSION } from '../config.js';
import { S } from '../estado.js';
import { icono } from '../iconos.js';
import { enIframe } from './instalacion.js';
import { pintarNav, render } from '../ui.js';

/* ---------- actualizaciones ---------- */
let regSW = null, swEsperando = null, recargando = false;
const esperar = ms => new Promise(r => setTimeout(r, ms));
function avisarNueva(w) { swEsperando = w; S.act.estado = 'nueva'; if (S.vista === 'inicio') render(); else pintarNav(); }
function vigilarSW(reg) {
  if (reg.waiting && navigator.serviceWorker.controller) avisarNueva(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const nw = reg.installing;
    if (nw) nw.addEventListener('statechange', () => { if (nw.state === 'installed' && navigator.serviceWorker.controller) avisarNueva(nw); });
  });
}
async function buscarActualizacion() {
  if (S.act.estado.startsWith('nueva')) return aplicarActualizacion();
  if (enIframe) { location.reload(); return; }
  S.act.estado = 'buscando'; render();
  try {
    if (regSW) { await regSW.update(); await esperar(1500); }
    if (!swEsperando) {
      // Sin service worker nuevo: compara version.json publicado con la versión abierta.
      const pub = await (await fetch('version.json?comprobar=' + Date.now(), { cache: 'no-store' })).json();
      S.act.estado = pub.version && (pub.version !== APP_VERSION || pub.build !== APP_BUILD) ? 'nueva-pagina' : 'aldia';
    }
  } catch (e) { S.act.estado = 'error'; }
  S.act.revisado = Date.now(); render();
}
function aplicarActualizacion() {
  S.act.estado = 'aplicando'; render();
  if (swEsperando) { swEsperando.postMessage('activar'); setTimeout(() => location.reload(), 2500); }
  else location.reload();
}
function actualizacionHTML() {
  const e = S.act.estado;
  const sub = { idle: 'Toca para buscar una versión nueva', buscando: 'Buscando…', aldia: 'Tienes la versión más reciente', nueva: 'Hay una versión nueva. Toca para instalarla', 'nueva-pagina': 'Hay una versión nueva. Toca para cargarla', aplicando: 'Actualizando…', error: 'No se pudo comprobar. Revisa tu conexión' }[e];
  const nueva = e.startsWith('nueva');
  return `<button type="button" class="fila" style="--sangria:58px" data-accion="actualizar" ${e === 'buscando' || e === 'aplicando' ? 'disabled' : ''}>
      <span class="icono-cuadro" style="background:${nueva ? '#FF3B30' : '#5856D6'}">${icono('actualizar')}</span>
      <span class="min-w-0"><span class="block font-semibold">${nueva ? 'Actualizar ahora' : 'Buscar actualizaciones'}</span><span class="block text-sm tenue">${sub}</span></span>
      <span class="ml-auto text-sm tenue num whitespace-nowrap">v${APP_VERSION}</span></button>`;
}
function iniciarActualizaciones() {
  if (!('serviceWorker' in navigator) || enIframe || !/^(https:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => { regSW = reg; vigilarSW(reg); }).catch(() => { /* sin soporte: la app sigue funcionando en línea */ });
    navigator.serviceWorker.addEventListener('controllerchange', () => { if (!recargando && S.act.estado === 'aplicando') { recargando = true; location.reload(); } });
    setInterval(() => { if (regSW && !document.hidden) regSW.update().catch(() => {}); }, 30 * 60 * 1000);
  });
}

export { actualizacionHTML, buscarActualizacion, iniciarActualizaciones };
