import { S } from './estado.js';
import { icono } from './iconos.js';
import { detenerRelojes, gestionarCronos } from './reloj.js';
import { $, $$ } from './util.js';

/* ---------- navegación y pintado ---------- */
// Cada página (vista) se registra desde main.js; render() pinta la página activa.
const PAGINAS = {};
function registrarPaginas(mapa) { Object.assign(PAGINAS, mapa); }
const VISTAS = [['inicio', 'Inicio'], ['concurso', 'Concurso'], ['estudio', 'Estudio'], ['cultura', 'Cultura'], ['documentos', 'Documentos']];
function pintarNav() {
  const cur = id => S.vista === id ? 'aria-current="page"' : '';
  $('#nav-escritorio').innerHTML = VISTAS.map(([id, txt]) => `<button type="button" class="nav-btn" data-accion="ir" data-vista="${id}" ${cur(id)}>${txt}</button>`).join('');
  const punto = id => id === 'inicio' && S.act.estado.startsWith('nueva') ? '<i class="punto-act" aria-label="Actualización disponible"></i>' : '';
  $('#nav-movil').innerHTML = VISTAS.map(([id, txt]) => `<button type="button" class="tab" data-accion="ir" data-vista="${id}" ${cur(id)}><span class="relative">${icono(id)}${punto(id)}</span><span>${txt}</span></button>`).join('');
  const b = $('#btn-sonido'); b.innerHTML = icono(S.sonido ? 'sonido' : 'silencio'); b.setAttribute('aria-label', S.sonido ? 'Silenciar' : 'Activar sonido'); b.setAttribute('aria-pressed', String(S.sonido));
  const bt = $('#btn-tema'); bt.innerHTML = icono(S.tema === 'dark' ? 'sol' : 'luna'); bt.setAttribute('aria-label', S.tema === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}
function aplicarTema() {
  if (S.tema === 'sistema') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', S.tema);
}
function ir(vista) {
  detenerRelojes();
  S.vista = vista;
  render();
  window.scrollTo({ top: 0 });
}
let vistaPintada = null, pantallaPintada = null;
const clavePantalla = () => S.vista + ':' + (S.vista === 'concurso' ? (!S.concurso ? 'config' : S.concurso.fase === 'fin' ? 'fin' : 'quiz') : S.vista === 'estudio' ? S.estudio.tab : '');
function render() {
  const y = window.scrollY, misma = vistaPintada === S.vista, mismaPantalla = pantallaPintada === clavePantalla();
  $$('[data-vista-sec]').forEach(s => { s.hidden = s.dataset.vistaSec !== S.vista; });
  pintarNav();
  PAGINAS[S.vista]();
  gestionarCronos();
  const sec = $('#v-' + S.vista);
  document.body.classList.toggle('con-accion', !!sec.querySelector('.accion-fija'));
  if (misma) window.scrollTo(0, mismaPantalla ? y : 0);
  else { sec.classList.add('nueva'); setTimeout(() => sec.classList.remove('nueva'), 400); }
  vistaPintada = S.vista; pantallaPintada = clavePantalla();
}
// Al pasar a otra pregunta, si el usuario bajó, vuelve a mostrar la pregunta completa.
function mostrarPregunta(sel) {
  const el = $(sel); if (!el) return;
  const tope = el.getBoundingClientRect().top - 64;
  if (tope < 0) window.scrollBy({ top: tope, behavior: 'smooth' });
}
const barraAccion = interior => `<div class="espacio-accion" aria-hidden="true"></div><div class="accion-fija gutter" aria-live="polite"><div class="max-w-3xl mx-auto flex flex-col gap-2">${interior}</div></div>`;

/* ---------- piezas comunes ---------- */
function anillo(pct, size = 168) {
  const r = 70, c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}" viewBox="0 0 180 180" role="img" aria-label="Dominio de la guía: ${pct} por ciento">
    <circle cx="90" cy="90" r="${r}" fill="none" class="anillo-fondo" stroke-width="16"/>
    <circle cx="90" cy="90" r="${r}" fill="none" class="anillo-valor" stroke-width="16" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - pct / 100)}" transform="rotate(-90 90 90)"/>
    <text x="90" y="96" text-anchor="middle" class="anillo-texto" font-size="44">${pct}%</text>
    <text x="90" y="120" text-anchor="middle" class="anillo-sub" font-size="12">DOMINADO</text>
  </svg>`;
}
function avisoHTML(m) {
  if (!m) return '';
  const cls = { ok: 'aviso-ok', mal: 'aviso-mal', casi: 'aviso-casi', info: '' }[m.tipo] || '';
  return `<div class="aviso ${cls}">${m.html}</div>`;
}

/* ---------- foco ---------- */
function enfocar(sel, seleccionar = false) {
  requestAnimationFrame(() => {
    const el = $(sel);
    if (!el) return;
    if (window.matchMedia('(pointer: coarse)').matches && el.tagName === 'INPUT' && !seleccionar) return; // en móvil no forzamos el teclado
    el.focus({ preventScroll: true });
    if (seleccionar && el.select) el.select();
  });
}

export { anillo, aplicarTema, avisoHTML, barraAccion, enfocar, ir, mostrarPregunta, pintarNav, registrarPaginas, render, VISTAS };
