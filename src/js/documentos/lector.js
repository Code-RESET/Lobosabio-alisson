/* ---------- lector de archivos: PDF (pdf.js) y DOCX (mammoth), cargados bajo demanda ----------
   Las bibliotecas se descargan solo cuando alguien sube un archivo, desde jsDelivr (mismo contenido que npm).
   pdf.js 4.10.38 corrige la vulnerabilidad GHSA-wgrm-67xf-hhpq de las versiones ≤ 4.1.392;
   además se desactiva eval (isEvalSupported: false) como defensa adicional.
   mammoth 1.12.3 corrige GHSA-rmjr-87wv-gf87. */
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs';
const PDFJS_WORKER = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
const MAMMOTH = 'https://cdn.jsdelivr.net/npm/mammoth@1.12.3/mammoth.browser.min.js';
const ERROR_CARGA = 'No se pudo cargar el lector de documentos. Revisa tu conexión e inténtalo de nuevo.';

let pdfjs = null;
async function cargarPdfjs() {
  if (pdfjs) return pdfjs;
  try {
    const url = PDFJS; // en variable para que el empaquetador no intente incluirlo
    pdfjs = await import(url);
  } catch (e) {
    throw new Error(ERROR_CARGA);
  }
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return pdfjs;
}
function cargarScript(src) {
  return new Promise((ok, mal) => {
    if (document.querySelector(`script[src="${src}"]`)?.dataset.listo) return ok();
    const s = document.createElement('script');
    s.src = src; s.onload = () => { s.dataset.listo = '1'; ok(); };
    s.onerror = () => mal(new Error(ERROR_CARGA));
    document.head.appendChild(s);
  });
}
// Agrupa los fragmentos de texto de pdf.js en líneas según su posición vertical.
function lineasDeContenido(items) {
  const lineas = [];
  let y0 = null, xFin = null, cur = '';
  for (const it of items) {
    if (!('str' in it)) continue;
    const x = it.transform[4], y = it.transform[5];
    if (y0 !== null && Math.abs(y - y0) > 3) { lineas.push(cur); cur = ''; xFin = null; }
    if (xFin !== null && x - xFin > 1.5 && !cur.endsWith(' ') && !it.str.startsWith(' ')) cur += ' ';
    cur += it.str; xFin = x + (it.width || 0); y0 = y;
  }
  if (cur) lineas.push(cur);
  return lineas;
}
async function textoDePDF(buf) {
  const lib = await cargarPdfjs();
  const pdf = await lib.getDocument({ data: new Uint8Array(buf), isEvalSupported: false }).promise;
  const lineas = [];
  for (let n = 1; n <= pdf.numPages; n++) {
    const pag = await pdf.getPage(n);
    const tc = await pag.getTextContent();
    lineas.push(...lineasDeContenido(tc.items), '');
  }
  await pdf.destroy();
  return lineas.join('\n');
}
async function textoDeDOCX(buf) {
  await cargarScript(MAMMOTH);
  const r = await window.mammoth.extractRawText({ arrayBuffer: buf });
  return r.value;
}

export { lineasDeContenido, textoDeDOCX, textoDePDF };
