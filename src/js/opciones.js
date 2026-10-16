import { todasPreguntas } from './banco.js';
import { evaluar, normalizar, NUMEROS, sinParentesis, variantesDe } from './calificar.js';
import { S } from './estado.js';
import { barajar, esc } from './util.js';

/* ---------- opciones múltiples ---------- */
const LETRAS = 'ABCDEFGHIJKL';
const usaOpciones = () => S.cfg.modoResp !== 'escribir';
const esNumero = t => /^-?\d+([.,]\d+)?$/.test(String(t).trim());
const PALABRA_NUM = Object.fromEntries(Object.entries(NUMEROS).map(([w, n]) => [n, w]));
const PALABRA_BONITA = { dieciseis: 'dieciséis', veintidos: 'veintidós', veintitres: 'veintitrés', veintiseis: 'veintiséis' };
function opcionesPara(q, total = 3) {
  const correcta = sinParentesis(q.respuesta);
  const vars = variantesDe(q);
  const vistos = new Set([normalizar(correcta)]);
  const malas = [];
  const tomar = t => {
    const k = normalizar(t);
    if (!k || vistos.has(k) || evaluar(t, vars).ok) return;
    vistos.add(k); malas.push(t);
  };
  if (q.distractores && q.distractores.length) {
    barajar(q.distractores).forEach(t => { const k = normalizar(t); if (malas.length < total - 1 && k && !vistos.has(k)) { vistos.add(k); malas.push(t); } });
  }
  const otras = todasPreguntas().filter(p => p.id !== q.id).map(p => ({ t: sinParentesis(p.respuesta), cat: p.catId }));
  const nk = normalizar(correcta);
  const fecha = correcta.match(/^((?:el\s+)?)(\d{1,2})( de [a-záéíóú]+)$/i);
  if (malas.length >= total - 1) { /* completo con los distractores de la guía */ }
  else if (fecha) {
    barajar([1, -1, 7, -7, 10, 2]).forEach(k => { const d = +fecha[2] + k; if (d >= 1 && d <= 31 && malas.length < total - 1) tomar(fecha[1] + d + fecha[3]); });
  } else if (esNumero(correcta)) {
    const v = parseFloat(correcta.replace(',', '.'));
    const dec = (correcta.split(/[.,]/)[1] || '').length;
    const anio = !dec && v >= 1400 && v <= 2100;
    barajar(otras.filter(o => esNumero(o.t) && (anio ? (+o.t >= 1400 && +o.t <= 2100) : (+o.t > 0 && +o.t / Math.max(v, 1) <= 3 && Math.max(v, 1) / +o.t <= 3))))
      .forEach(o => { if (malas.length < total - 1) tomar(o.t); });
    const base = anio ? 10 : dec ? Math.pow(10, -dec) * 2 : Math.max(1, Math.round(Math.abs(v) * 0.1));
    const saltos = barajar([1, -1, 2, -2, 3, -3]);
    for (const k of saltos) { if (malas.length >= total - 1) break; const x = v + k * base; if (x >= 0) tomar(dec ? x.toFixed(dec) : String(x)); }
  } else if (NUMEROS[nk] !== undefined) {
    const n = NUMEROS[nk], mayus = correcta[0] === correcta[0].toUpperCase();
    barajar([1, -1, 2, -2]).forEach(k => {
      const w = PALABRA_NUM[n + k];
      if (w && malas.length < total - 1) { const b = PALABRA_BONITA[w] || w; tomar(mayus ? b[0].toUpperCase() + b.slice(1) : b); }
    });
  }
  if (malas.length < total - 1) {
    const palabras = correcta.split(/\s+/).length;
    const art = /^(el|la|los|las)\s/i.test(correcta);
    const tipo = t => /^(el|la|los|las)\s/i.test(t) ? 'concepto' : /^(\p{Lu}[\p{L}'-]+)(\s+(de|del|y|van|von|la)?\s*\p{Lu}[\p{L}'-]+)+$/u.test(t) ? 'nombre' : t.split(/\s+/).length === 1 ? 'palabra' : 'frase';
    const miTipo = tipo(correcta);
    otras.filter(o => !esNumero(o.t))
      .map(o => [(tipo(o.t) === miTipo ? 4 : 0) + (o.cat === q.catId ? 3 : 0) + (Math.abs(o.t.split(/\s+/).length - palabras) <= 1 ? 1 : 0) + (/^(el|la|los|las)\s/i.test(o.t) === art ? 1 : 0) + Math.random() * 1.5, o.t])
      .sort((a, b) => b[0] - a[0])
      .forEach(([, t]) => { if (malas.length < total - 1) tomar(t); });
  }
  return barajar([{ texto: correcta, ok: true }, ...malas.map(t => ({ texto: t, ok: false }))]);
}
// ops: [{texto, ok, elegida, fuera, usada}] · revelar: muestra correctas/incorrectas tras responder
function opcionesHTML(ops, accion, { revelar = false, cols = 3 } = {}) {
  return `<div class="opciones" style="--cols:${cols}" role="group" aria-label="Opciones de respuesta">${ops.map((o, i) => {
    let cls = 'opcion';
    if (o.fuera) cls += ' opcion-fuera';
    else if (revelar) cls += o.ok ? ' opcion-ok' : o.elegida ? ' opcion-mal' : ' opcion-tenue';
    else if (o.usada) cls += o.ok ? ' opcion-ok' : ' opcion-mal';
    const off = revelar || o.fuera || o.usada;
    return `<button type="button" class="${cls}" data-accion="${accion}" data-o="${i}" ${off ? 'disabled' : `data-tecla="${LETRAS[i]}"`}><span class="opcion-letra">${LETRAS[i]}</span><span class="min-w-0">${esc(o.texto)}</span></button>`;
  }).join('')}</div>`;
}
function segmentoResp() {
  const o = usaOpciones();
  return `<div class="segmento" role="group" aria-label="Forma de responder"><button type="button" data-accion="modo-resp" data-v="opciones" aria-pressed="${o}">Opciones A·B·C</button><button type="button" data-accion="modo-resp" data-v="escribir" aria-pressed="${!o}">Escribir</button></div>`;
}

export { LETRAS, opcionesHTML, opcionesPara, segmentoResp, usaOpciones };
