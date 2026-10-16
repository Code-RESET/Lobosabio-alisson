import { normalizar, sinParentesis, VACIAS } from '../calificar.js';
import { uid } from '../util.js';

/* ---------- parser: convierte texto en categorías y preguntas ---------- */
const RE_NUMERAL = /^(\(?\d{1,3}[.)]|[a-zA-Z][.)])\s+/;
const RE_VINETA = /^[•·▪◦●■\-–*]\s*/;
function quitarNumeracion(l) {
  let s = l, antes;
  do { antes = s; s = s.replace(RE_NUMERAL, '').replace(RE_VINETA, '').trim(); } while (s !== antes);
  return s;
}
const limpiarRespuesta = s => s.replace(/^(r|resp|respuesta)\s*[:.-]\s*/i, '').replace(/\s+/g, ' ').replace(/[.;]\s*$/, '').trim();
const COMUNES = new Set('para como entre sobre desde hasta tiene tienen cual cuál cuales qué que quien quién donde dónde cuando cuándo cuanto cuántos cuántas cuanta este esta estos estas ese esa aquel también porque pero sino solo sólo muy más menos todo toda todos todas otro otra otros otras cada mismo misma años año país mundo nombre llama llamada conocido conocida según guia guía estudio pregunta respuesta grande grandes primer primera primero inicio inició escribio escribió encuentra encuentran puso pone hace hizo nombre llama mismo largo pequeño mayor menor famoso famosa actualmente usada usado mantiene conocido base'.split(' ').map(w => normalizar(w)));
function palabrasClave(texto, n = 28) {
  const cuenta = {};
  normalizar(texto).split(' ').forEach(w => { if (w.length > 3 && !VACIAS.has(w) && !COMUNES.has(w) && !/^\d+$/.test(w)) cuenta[w] = (cuenta[w] || 0) + 1; });
  return Object.entries(cuenta).sort((a, b) => b[1] - a[1]).slice(0, n).map(([w, c]) => ({ w, c }));
}
function parsearTexto(texto, nombreDoc) {
  const crudas = texto.replace(/\r/g, '').split('\n').map(l => l.replace(/\s+/g, ' ').trim());
  const cats = [];
  let cat = null, q = null, esperando = false, acumulandoPregunta = false, titulo = '';
  const nuevaCat = nombre => { cat = { nombre: nombre.replace(/[:.]\s*$/, '').trim(), preguntas: [] }; cats.push(cat); };
  const cerrarQ = () => { if (q && q.respuesta) { if (!cat) nuevaCat('General'); cat.preguntas.push(q); } q = null; esperando = false; acumulandoPregunta = false; };
  for (const raw of crudas) {
    if (!raw) continue;
    const l = quitarNumeracion(raw);
    if (!l) continue;
    if (acumulandoPregunta) { q.pregunta += ' ' + l; if (l.includes('?')) { acumulandoPregunta = false; esperando = true; } continue; }
    const marcaP = /^(p|pregunta)\s*[:.-]\s*/i.test(l);
    const marcaR = /^(r|resp|respuesta)\s*[:.-]\s*/i.test(l);
    const esPregunta = marcaP || /[¿?]/.test(l);
    if (esPregunta && !marcaR) {
      cerrarQ();
      q = { pregunta: l.replace(/^(p|pregunta)\s*[:.-]\s*/i, ''), respuesta: '' };
      if (l.includes('¿') && !l.includes('?')) acumulandoPregunta = true; else esperando = true;
      continue;
    }
    const numerada = /^\(?\d{1,2}[.)]\s+\S/.test(raw);
    const mayusculas = l.length >= 4 && l === l.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{4}/.test(l);
    const esEncabezado = !marcaR && l.length <= 60 && !/[.;,]$/.test(l) && (numerada || mayusculas || /:$/.test(l));
    if (q && esperando && !q.respuesta) { q.respuesta = limpiarRespuesta(l); continue; }
    if (esEncabezado) { cerrarQ(); if (!titulo && !cats.length && mayusculas) titulo = l; nuevaCat(l); continue; }
    if (q && q.respuesta) { q.respuesta = limpiarRespuesta(q.respuesta + ' ' + l); continue; }
  }
  cerrarQ();
  let lista = cats.filter(c => c.preguntas.length);
  let modo = 'preguntas';
  if (lista.reduce((a, c) => a + c.preguntas.length, 0) < 3) {
    const defs = [];
    crudas.forEach(raw => {
      const l = quitarNumeracion(raw);
      let m = l.match(/^([^:]{2,60}):\s+(.{8,240})$/);
      if (m && !/[¿?]/.test(m[1])) { defs.push({ pregunta: `¿Qué concepto se define así? «${m[2].replace(/\.$/, '')}»`, respuesta: m[1].trim() }); return; }
      m = l.match(/^([A-ZÁÉÍÓÚÑ][^,.;:]{2,50}?)\s+(es|son|fue|se define como|consiste en)\s+(.{8,220})\.?$/);
      if (m) defs.push({ pregunta: `¿A qué concepto se refiere: «… ${m[2]} ${m[3].replace(/\.$/, '')}»?`, respuesta: m[1].trim() });
    });
    if (defs.length) { lista = [{ nombre: 'Conceptos clave', preguntas: defs }]; modo = 'definiciones'; }
  }
  const docId = 'd' + uid();
  const PUNTOS = [100, 80, 60, 40, 20];
  const categorias = lista.map((c, ci) => ({
    id: `${docId}-c${ci + 1}`,
    codigo: normalizar(c.nombre).replace(/\s/g, '').slice(0, 3).toUpperCase() || 'GEN',
    nombre: c.nombre === c.nombre.toUpperCase() ? c.nombre.charAt(0) + c.nombre.slice(1).toLowerCase() : c.nombre,
    preguntas: c.preguntas.map((p, pi) => {
      const alias = [];
      (p.respuesta.match(/\(([^)]+)\)/g) || []).forEach(x => { const t = x.slice(1, -1).trim(); if (t.split(/\s+/).length <= 2) alias.push(t); });
      const primera = sinParentesis(p.respuesta).split(/,\s*seguid|;\s*/i)[0].trim();
      if (primera && primera !== p.respuesta) alias.push(primera);
      return { id: `${docId}-c${ci + 1}-q${pi + 1}`, pregunta: p.pregunta.trim(), respuesta: p.respuesta, alias, puntos: PUNTOS[pi % 5] };
    })
  }));
  return {
    id: docId, nombre: nombreDoc, titulo, modo, fecha: new Date().toISOString(), activo: true,
    categorias, palabras: palabrasClave(texto), caracteres: texto.length
  };
}

export { palabrasClave, parsearTexto, quitarNumeracion };
