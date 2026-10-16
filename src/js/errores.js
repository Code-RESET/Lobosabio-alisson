import { APP_BUILD, APP_VERSION } from './config.js';
import { S } from './estado.js';
import { almacen } from './util.js';

/* ---------- registro de errores ----------
   Guarda los últimos errores de la app (Documentos → Diagnóstico) para poder revisarlos
   y muestra un aviso discreto en lugar de dejar la pantalla rota sin explicación. */
const MAX_ERRORES = 20;
let avisoErrorTimer = null;
function leerErrores() { return almacen.get('errores', []); }
function borrarErrores() { almacen.set('errores', []); }
function anotarError(tipo, mensaje, detalle = '') {
  const lista = leerErrores();
  lista.unshift({
    fecha: new Date().toISOString(), tipo,
    mensaje: String(mensaje ?? '').slice(0, 300), detalle: String(detalle ?? '').slice(0, 800),
    version: `${APP_VERSION}+${APP_BUILD}`, vista: S.vista
  });
  almacen.set('errores', lista.slice(0, MAX_ERRORES));
  mostrarAvisoError();
}
function mostrarAvisoError() {
  if (typeof document === 'undefined') return;
  let el = document.getElementById('aviso-error');
  if (!el) {
    el = document.createElement('div');
    el.id = 'aviso-error'; el.className = 'toast-error'; el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = 'Algo no salió bien. Si se repite, recarga la app. El detalle quedó en Documentos → Diagnóstico.';
  el.hidden = false;
  clearTimeout(avisoErrorTimer);
  avisoErrorTimer = setTimeout(() => { el.hidden = true; }, 6000);
}
function iniciarRegistroErrores() {
  window.addEventListener('error', e => {
    if (!e.message) return; // errores de carga de recursos: los atiende cada módulo
    anotarError('error', e.message, `${e.filename || ''}:${e.lineno || ''}:${e.colno || ''}\n${e.error?.stack || ''}`);
  });
  window.addEventListener('unhandledrejection', e => anotarError('promesa', e.reason?.message || e.reason, e.reason?.stack || ''));
}

export { borrarErrores, iniciarRegistroErrores, leerErrores };
