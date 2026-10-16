/* ---------- calificación de respuestas ---------- */
const NUMEROS = { cero: 0, uno: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10, once: 11, doce: 12, trece: 13, catorce: 14, quince: 15, dieciseis: 16, diecisiete: 17, dieciocho: 18, diecinueve: 19, veinte: 20, veintiuno: 21, veintidos: 22, veintitres: 23, veinticuatro: 24, veinticinco: 25, veintiseis: 26, veintisiete: 27, veintiocho: 28, veintinueve: 29, treinta: 30, cien: 100 };
const VACIAS = new Set(['el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'de', 'del', 'y', 'e', 'en', 'al', 'lo', 'que', 'es', 'son', 'fue', 'por', 'para', 'con', 'se', 'su', 'sus', 'entre']);
function normalizar(s) {
  return String(s ?? '').toLowerCase()
    .replace(/π/g, ' pi ')
    .replace(/\b([o0])\s*[-−–](?![a-z0-9])/g, 'o negativo')
    .replace(/\b([o0])\s*\+/g, 'o positivo')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
const fichas = s => normalizar(s).split(' ').filter(t => t && !VACIAS.has(t)).map(t => NUMEROS[t] !== undefined ? String(NUMEROS[t]) : t);
function lev(a, b) {
  if (a === b) return 0; if (!a.length) return b.length; if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return prev[b.length];
}
function fichaIgual(a, b) {
  if (a === b) return true;
  if (/^\d+$/.test(a) || /^\d+$/.test(b)) return false;
  if (Math.min(a.length, b.length) < 4) return false;
  return lev(a, b) <= (Math.max(a.length, b.length) >= 8 ? 2 : 1);
}
// opciones.exacta: sin tolerancia a errores de dedo (preguntas de ortografía).
function evaluar(respuesta, variantes, { exacta = false } = {}) {
  const u = fichas(respuesta);
  if (!u.length) return { ok: false, casi: false, score: 0 };
  const uj = u.join(' ');
  let mejor = 0;
  for (const v of variantes) {
    const t = [...new Set(fichas(v))];
    if (!t.length) continue;
    const tj = t.join(' ');
    if (tj === uj) return { ok: true, casi: false, score: 1 };
    if (exacta) continue;
    // Respuesta numérica: los números escritos deben ser exactamente los de la respuesta («1/2» no es «1»).
    const numsT = t.filter(x => /^\d+$/.test(x)), numsU = u.filter(y => /^\d+$/.test(y));
    if (numsT.length && numsT.length === t.length && numsU.join(' ') !== numsT.join(' ')) continue;
    let sc = t.filter(x => u.some(y => fichaIgual(x, y))).length / t.length;
    // ¿Escribió palabras que no están en la respuesta? (p. ej. «Universal Service Bus» por «Universal Serial Bus»)
    const ajenas = u.some(y => !t.some(x => fichaIgual(x, y)));
    // Errores de dedo en el texto completo; con palabras ajenas solo cuenta si cambió el número de palabras («saintexupery»).
    const L = Math.max(tj.length, uj.length);
    if (L >= 6 && !/\d/.test(tj) && (!ajenas || u.length !== t.length) && 1 - lev(tj, uj) / L >= 0.85) sc = 1;
    // Faltar palabras se tolera («Miguel Hidalgo» por «Miguel Hidalgo y Costilla»); sustituirlas, a lo más es «casi».
    if (sc < 1 && ajenas) sc = Math.min(sc, 0.65);
    // Enumeraciones con comas («Verde, blanco y rojo»): hay que decir todos los elementos.
    if (sc < 1 && v.includes(',')) sc = Math.min(sc, 0.65);
    mejor = Math.max(mejor, sc);
  }
  return { ok: mejor >= 0.66, casi: mejor > 0 && mejor < 0.66, score: mejor };
}
const sinParentesis = s => String(s).replace(/\s*\([^)]*\)/g, '').trim();
// Califica la respuesta escrita para una pregunta, respetando si exige escritura exacta.
const calificar = (texto, p) => evaluar(texto, variantesDe(p), { exacta: !!p.exacta });
const variantesDe = p => [...new Set([p.respuesta ?? p.texto, sinParentesis(p.respuesta ?? p.texto), ...(p.alias || [])].filter(Boolean))];
function mascara(texto) {
  return sinParentesis(texto).split(/\s+/).map(w => w.length <= 2 && !/\d/.test(w) ? w : w[0] + ' ' + '_ '.repeat(Math.max(0, w.length - 1)).trim()).join('   ');
}

export { calificar, evaluar, fichaIgual, fichas, lev, mascara, normalizar, NUMEROS, sinParentesis, VACIAS, variantesDe };
