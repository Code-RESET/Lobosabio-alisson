import BASE from '../datos/banco-guia.json' with { type: 'json' };
import CULTURA from '../datos/banco-cultura.json' with { type: 'json' };
import { guardarStats, S } from './estado.js';
import { esc } from './util.js';

/* ---------- banco activo ---------- */
// El banco se arma una sola vez y se reutiliza mientras no cambien los documentos activos.
let cacheBanco = null, claveBanco = '';
function banco() {
  const clave = (S.baseActiva ? 'b' : '') + '|' + S.docs.filter(d => d.activo).map(d => d.id).join(',');
  if (cacheBanco && clave === claveBanco) return cacheBanco;
  const cats = [];
  if (S.baseActiva) BASE.categorias.forEach(c => cats.push({ ...c, grupo: 'guia', docId: 'base', docNombre: BASE.fuente.titulo }));
  S.docs.filter(d => d.activo).forEach(d => d.categorias.forEach(c => cats.push({ ...c, grupo: 'guia', docId: d.id, docNombre: d.nombre })));
  CULTURA.categorias.forEach(c => cats.push({ ...c, grupo: 'cultura', docId: 'cultura', docNombre: 'Cultura general' }));
  cacheBanco = { cats }; claveBanco = clave;
  return cacheBanco;
}
// Selección de categorías: 'todas' = la guía (y documentos subidos); 'grupo:cultura' = cultura general; o el id de una categoría.
function catsDe(sel) {
  const cats = banco().cats;
  if (sel === '*') return cats;
  if (!sel || sel === 'todas') return cats.filter(c => c.grupo !== 'cultura');
  if (sel.startsWith('grupo:')) return cats.filter(c => c.grupo === sel.slice(6));
  return cats.filter(c => c.id === sel);
}
function todasPreguntas(catId) {
  return catsDe(catId).flatMap(c => c.preguntas.map(p => ({ ...p, catId: c.id, catNombre: c.nombre, codigo: c.codigo, grupo: c.grupo })));
}
function preguntaPorId(id) { return todasPreguntas('*').find(p => p.id === id) || null; }
function opcionesCategoria(valor) {
  const op = (v, l) => `<option value="${esc(v)}" ${valor === v ? 'selected' : ''}>${esc(l)}</option>`;
  const guia = catsDe('todas'), cult = catsDe('grupo:cultura');
  return `<optgroup label="Guía LoboSabio">${op('todas', 'Toda la guía')}${guia.map(c => op(c.id, c.nombre)).join('')}</optgroup>`
    + `<optgroup label="Cultura general">${op('grupo:cultura', 'Toda la cultura general')}${cult.map(c => op(c.id, c.nombre)).join('')}</optgroup>`;
}
const dominada = id => (S.stats[id]?.r || 0) >= 2;
function estadoPregunta(id) {
  const s = S.stats[id];
  if (!s) return { cls: '', txt: 'Nueva' };
  if (s.r >= 2) return { cls: 'chip-ok', txt: 'Dominada' };
  if (s.f > 0 && s.r === 0) return { cls: 'chip-mal', txt: 'Con errores' };
  return { cls: 'chip-oro', txt: 'En progreso' };
}
function dominio(catId) {
  const qs = todasPreguntas(catId);
  const d = qs.filter(q => dominada(q.id)).length;
  return { total: qs.length, dom: d, pct: qs.length ? Math.round(d / qs.length * 100) : 0 };
}
function necesidad(p) {
  const s = S.stats[p.id];
  if (!s) return 2 + Math.random() * 0.4;
  if (s.r >= 2) return Math.random() * 0.4;
  return 1 + Math.min(s.f, 4) * 0.4 + Math.random() * 0.4;
}
const priorizar = lista => lista.map(p => [necesidad(p), p]).sort((a, b) => b[0] - a[0]).map(x => x[1]);

function registrar(id, ok) {
  const prev = S.stats[id] ? { ...S.stats[id] } : null;
  const s = S.stats[id] ? { ...S.stats[id] } : { v: 0, a: 0, f: 0, r: 0 };
  s.v++; if (ok) { s.a++; s.r++; } else { s.f++; s.r = 0; }
  s.t = Date.now(); S.stats[id] = s; guardarStats();
  return prev;
}
function corregirARegistroCorrecto(id, prev) {
  if (prev) S.stats[id] = prev; else delete S.stats[id];
  registrar(id, true);
}

export { banco, BASE, catsDe, corregirARegistroCorrecto, CULTURA, dominada, dominio, estadoPregunta, opcionesCategoria, preguntaPorId, priorizar, registrar, todasPreguntas };
