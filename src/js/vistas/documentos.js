import { BASE, catsDe } from '../banco.js';
import { APP_BUILD, APP_VERSION } from '../config.js';
import { textoDeDOCX, textoDePDF } from '../documentos/lector.js';
import { parsearTexto } from '../documentos/parser.js';
import { borrarErrores, leerErrores } from '../errores.js';
import { guardarStats, S } from '../estado.js';
import { controlesPaginacion, paginar } from '../paginacion.js';
import { render } from '../ui.js';
import { $, almacen, esc, uid } from '../util.js';

/* ============================================================
   DOCUMENTOS · ingesta y procesamiento
   ============================================================ */
async function procesarArchivo(file) {
  const U = S.docsUI;
  U.procesando = true; U.error = null; U.preview = null; render();
  try {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (file.size > 25 * 1024 * 1024) throw new Error('El archivo pesa más de 25 MB. Divide el documento o exporta solo el texto.');
    let texto = '';
    if (ext === 'json') {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.categorias)) throw new Error('El JSON no tiene la lista "categorias". Usa la estructura que aparece abajo.');
      const docId = 'd' + uid();
      const doc = { id: docId, nombre: file.name, modo: 'json', fecha: new Date().toISOString(), activo: true,
        categorias: data.categorias.map((c, ci) => ({ id: `${docId}-${c.id || 'c' + ci}`, codigo: c.codigo || 'JSN', nombre: c.nombre || 'Categoría', preguntas: (c.preguntas || []).filter(p => p.pregunta && p.respuesta).map((p, pi) => ({ id: `${docId}-${p.id || 'q' + ci + '-' + pi}`, pregunta: p.pregunta, respuesta: p.respuesta, alias: p.alias || [], distractores: p.distractores, puntos: p.puntos || 60, nota: p.nota })) })),
        palabras: [] };
      U.preview = doc; S.paginas.preview = 1;
    } else {
      if (ext === 'pdf') texto = await textoDePDF(await file.arrayBuffer());
      else if (ext === 'docx') texto = await textoDeDOCX(await file.arrayBuffer());
      else if (ext === 'txt' || ext === 'md' || file.type.startsWith('text/')) texto = await file.text();
      else throw new Error(`No reconozco el formato «.${ext}». Usa PDF, DOCX, TXT o JSON.`);
      if (texto.replace(/\s/g, '').length < 20) throw new Error('No encontré texto en el archivo. Si es un PDF escaneado, conviértelo primero con OCR o pega el texto abajo.');
      U.preview = parsearTexto(texto, file.name); S.paginas.preview = 1;
    }
    if (!U.preview.categorias.some(c => c.preguntas.length)) U.error = 'Leí el documento, pero no encontré preguntas ni definiciones. Usa el formato «¿Pregunta?» seguido de la respuesta en la siguiente línea, o «Término: definición».';
  } catch (e) {
    U.error = e.message || String(e);
  }
  U.procesando = false; render();
}
function renderDocumentos() {
  const U = S.docsUI, P = U.preview;
  const docsFila = (d, base) => {
    const n = d.categorias.reduce((a, c) => a + c.preguntas.length, 0);
    const activo = base ? S.baseActiva : d.activo;
    return `<li class="py-3 flex flex-wrap items-center gap-3" style="border-color:var(--linea)">
      <span class="chip ${base ? 'chip-cod' : ''}">${base ? 'PDF' : esc((d.nombre.split('.').pop() || 'txt').toUpperCase())}</span>
      <span class="flex-1 min-w-0"><strong class="block truncate">${esc(base ? d.fuente.titulo : d.nombre)}</strong><span class="text-sm tenue">${d.categorias.length} categorías · ${n} preguntas${base ? ' · ' + esc(d.fuente.archivo) : ' · ' + new Date(d.fecha).toLocaleDateString('es-MX')}</span></span>
      <label class="flex items-center gap-2 text-sm" for="act-${base ? 'base' : esc(d.id)}"><input type="checkbox" id="act-${base ? 'base' : esc(d.id)}" class="w-4 h-4" data-accion-cambio="activar-doc" data-doc="${base ? 'base' : esc(d.id)}" ${activo ? 'checked' : ''}> En juego</label>
      ${base ? '' : U.confirmar === d.id
        ? `<span class="flex gap-1"><button type="button" class="btn btn-sm btn-guinda" data-accion="borrar-doc" data-doc="${esc(d.id)}">Eliminar</button><button type="button" class="btn btn-sm btn-linea" data-accion="cancelar-borrar">Cancelar</button></span>`
        : `<button type="button" class="btn btn-sm btn-linea" data-accion="confirmar-borrar" data-doc="${esc(d.id)}">Eliminar</button>`}
    </li>`;
  };
  $('#v-documentos').innerHTML = `
  <div class="flex flex-col gap-6">
    <div><p class="eyebrow">Gestor de documentos</p><h2 class="text-4xl font-extrabold">Convierte tus apuntes en preguntas</h2>
      <p class="tenue mt-1 max-w-[66ch]">Sube una guía en PDF, DOCX o TXT. La app detecta las categorías, las preguntas que empiezan con «¿» y sus respuestas, asigna puntos y prepara opciones A·B·C. Todo se procesa en tu navegador; nada se envía a internet.</p></div>

    <div class="grid lg:grid-cols-[1.1fr_.9fr] gap-6">
      <div class="flex flex-col gap-4 min-w-0">
        <label for="archivo" class="soltar p-8 flex flex-col items-center justify-center text-center gap-2 cursor-pointer" id="zona-soltar">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="var(--guinda)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5"/><path d="M12 17v-6"/><path d="M9.5 13.5 12 11l2.5 2.5"/></svg>
          <strong class="text-xl">${U.procesando ? 'Procesando documento…' : 'Arrastra tu archivo aquí'}</strong>
          <span class="text-sm tenue">o haz clic para elegirlo · PDF, DOCX, TXT o JSON del banco</span>
          <input id="archivo" type="file" class="sr-only" accept=".pdf,.docx,.txt,.md,.json,application/pdf,text/plain,application/json,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-accion-cambio="archivo">
        </label>
        <details class="panel p-4">
          <summary class="cursor-pointer font-bold">Pegar texto en lugar de subir un archivo</summary>
          <form class="flex flex-col gap-2 mt-3" data-form="pegar">
            <label for="texto-pegado" class="sr-only">Texto de la guía</label>
            <textarea id="texto-pegado" class="campo min-h-[9rem] text-base" placeholder="1. Historia&#10;¿En qué año inició la Independencia de México?&#10;1810."></textarea>
            <button type="submit" class="btn btn-guinda self-start">Procesar texto</button>
          </form>
        </details>
        ${U.error ? `<div class="aviso aviso-mal">${esc(U.error)}</div>` : ''}
        ${P ? previewHTML(P) : ''}
      </div>

      <div class="flex flex-col gap-4 min-w-0">
        <div class="panel p-5">
          <p class="eyebrow mb-1">Documentos en tu banco</p>
          <ul class="divide-y" style="border-color:var(--linea)">${docsFila(BASE, true)}${S.docs.map(d => docsFila(d, false)).join('')}</ul>
        </div>
        <div class="panel p-5 flex flex-col gap-3">
          <p class="eyebrow">Formato que reconoce el lector</p>
          <pre class="text-sm overflow-x-auto p-3 rounded-lg" style="background:var(--hundido)"><code>2. Geografía                 ← encabezado de categoría
1. ¿Cuál es la capital de Yucatán?
       Mérida.                ← respuesta (línea siguiente)
P: ¿Pregunta?  R: Respuesta  ← también válido
Fotosíntesis: proceso por…   ← definición</code></pre>
        </div>
        <div class="panel p-5 flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-2"><p class="eyebrow">Estructura de datos (JSON)</p>
            <span class="flex gap-2"><button type="button" class="btn btn-sm btn-linea" data-accion="ver-json">${U.verJson ? 'Ocultar' : 'Ver banco'}</button><button type="button" class="btn btn-sm btn-guinda" data-accion="copiar-json">Copiar JSON</button></span></div>
          <p class="text-sm tenue">Cada categoría tiene preguntas con <code>respuesta</code>, <code>alias</code> aceptados y <code>puntos</code> de relevancia. Puedes editar el JSON y volver a subirlo.</p>
          ${U.verJson ? `<label for="json-banco" class="sr-only">Banco en JSON</label><textarea id="json-banco" class="campo font-mono text-xs min-h-[16rem]" readonly>${esc(JSON.stringify(bancoExportable(), null, 2))}</textarea>` : ''}
          <p class="text-sm" id="msg-copia" aria-live="polite"></p>
        </div>
        <div class="panel p-5 flex flex-wrap items-center justify-between gap-3">
          <span class="text-sm"><strong>Progreso guardado en este navegador.</strong> <span class="tenue">${Object.keys(S.stats).length} preguntas con historial.</span></span>
          ${U.confirmar === 'progreso'
            ? '<span class="flex gap-1"><button type="button" class="btn btn-sm btn-guinda" data-accion="borrar-progreso">Sí, borrar</button><button type="button" class="btn btn-sm btn-linea" data-accion="cancelar-borrar">Cancelar</button></span>'
            : '<button type="button" class="btn btn-sm btn-linea" data-accion="confirmar-borrar" data-doc="progreso">Reiniciar progreso</button>'}
        </div>
        ${diagnosticoHTML()}
      </div>
    </div>
  </div>`;
}
// Preguntas de la vista previa como lista plana (con su posición original) para paginarlas.
const filasPreview = P => P.categorias.flatMap((c, ci) => c.preguntas.map((p, pi) => ({ c, ci, p, pi })));
function gruposPreview(P) {
  const pag = paginar(filasPreview(P), S.paginas.preview);
  S.paginas.preview = pag.pagina;
  const grupos = [];
  for (const f of pag.items) { const g = grupos.at(-1); if (g && g.ci === f.ci) g.filas.push(f); else grupos.push({ c: f.c, ci: f.ci, filas: [f] }); }
  return grupos;
}
function diagnosticoHTML() {
  const errores = leerErrores();
  return `<div class="panel p-5 flex flex-col gap-3">
    <div class="flex flex-wrap items-center justify-between gap-2"><p class="eyebrow">Diagnóstico</p>
      ${errores.length ? '<span class="flex gap-2"><button type="button" class="btn btn-sm btn-linea" data-accion="copiar-errores">Copiar registro</button><button type="button" class="btn btn-sm btn-linea" data-accion="borrar-errores">Borrar</button></span>' : ''}</div>
    <p class="text-sm">Versión <strong class="num">${esc(APP_VERSION)}</strong> <span class="tenue num">(${esc(APP_BUILD)})</span> · ${errores.length ? `<strong style="color:var(--error)">${errores.length} error${errores.length === 1 ? '' : 'es'} registrado${errores.length === 1 ? '' : 's'}</strong>` : '<span style="color:var(--exito)">Sin errores registrados</span>'}</p>
    ${errores.length ? `<ul class="flex flex-col gap-2 text-sm">${errores.slice(0, 5).map(e => `<li class="aviso aviso-mal"><strong>${esc(e.mensaje)}</strong><span class="block text-xs tenue num">${esc(new Date(e.fecha).toLocaleString('es-MX'))} · ${esc(e.vista)} · v${esc(e.version)}</span></li>`).join('')}</ul>` : ''}
    <p class="text-sm" id="msg-diagnostico" aria-live="polite"></p>
  </div>`;
}
function previewHTML(P) {
  const n = P.categorias.reduce((a, c) => a + c.preguntas.length, 0);
  return `<div class="panel overflow-hidden">
    <div class="p-5 flex flex-wrap items-center justify-between gap-3" style="background:var(--hundido);border-bottom:1px solid var(--linea)">
      <div class="min-w-0"><p class="eyebrow">Vista previa</p><h3 class="text-2xl font-bold truncate">${esc(P.titulo || P.nombre)}</h3>
        <p class="text-sm tenue">${P.categorias.length} categorías · ${n} preguntas${P.modo === 'definiciones' ? ' · generadas a partir de definiciones' : ''}</p></div>
      <div class="flex gap-2"><button type="button" class="btn btn-guinda" data-accion="guardar-doc" ${n ? '' : 'disabled'}>Agregar al banco</button><button type="button" class="btn btn-linea" data-accion="descartar-doc">Descartar</button></div>
    </div>
    ${P.palabras && P.palabras.length ? `<div class="px-5 pt-4"><p class="eyebrow mb-2">Índice de conceptos</p><div class="flex flex-wrap gap-1.5">${P.palabras.map(p => `<span class="chip">${esc(p.w)} <span class="num">${p.c}</span></span>`).join('')}</div></div>` : ''}
    <div class="p-5 flex flex-col gap-4" data-lista-ancla="preview">
      ${gruposPreview(P).map(({ c, ci, filas }) => `<div><h4 class="text-lg font-bold mb-1"><span class="chip chip-cod mr-2">${esc(c.codigo)}</span>${esc(c.nombre)} <span class="tenue text-sm normal-case">(${c.preguntas.length})</span></h4>
        <ul class="flex flex-col">${filas.map(({ p, pi }) => `<li class="py-2 grid grid-cols-[1fr_auto] gap-3 items-start border-b" style="border-color:var(--linea)">
          <span class="min-w-0 text-sm">${esc(p.pregunta)}<strong class="block" style="color:var(--guinda)">${esc(p.respuesta)}</strong></span>
          <button type="button" class="btn btn-sm btn-linea" data-accion="quitar-preview" data-ci="${ci}" data-pi="${pi}" aria-label="Quitar pregunta">Quitar</button></li>`).join('')}</ul></div>`).join('')}
      ${controlesPaginacion('preview', paginar(filasPreview(P), S.paginas.preview))}
    </div>
  </div>`;
}
function bancoExportable() {
  const cats = catsDe('todas');
  return { version: 1, generado: new Date().toISOString(), categorias: cats.map(({ docId, docNombre, grupo, ...c }) => c) };
}

/* Acciones de esta página (data-accion="…"). Reciben el botón que se tocó. */
const accionesDocumentos = {
  'guardar-doc': b => { const P = S.docsUI.preview; P.categorias = P.categorias.filter(c => c.preguntas.length); S.docs.push(P); almacen.set('docs', S.docs); S.docsUI.preview = null; S.docsUI.error = null; render(); },
  'descartar-doc': b => { S.docsUI.preview = null; S.docsUI.error = null; render(); },
  'quitar-preview': b => {
    const P = S.docsUI.preview, c = P.categorias[+b.dataset.ci];
    c.preguntas.splice(+b.dataset.pi, 1);
    render();
  },
  'confirmar-borrar': b => { S.docsUI.confirmar = b.dataset.doc; render(); },
  'cancelar-borrar': b => { S.docsUI.confirmar = null; render(); },
  'borrar-doc': b => { S.docs = S.docs.filter(d => d.id !== b.dataset.doc); almacen.set('docs', S.docs); S.docsUI.confirmar = null; render(); },
  'borrar-progreso': b => { S.stats = {}; guardarStats(); S.record = { concurso: 0 }; almacen.set('record', S.record); S.docsUI.confirmar = null; render(); },
  'ver-json': b => { S.docsUI.verJson = !S.docsUI.verJson; render(); },
  'copiar-json': b => {
    const txt = JSON.stringify(bancoExportable(), null, 2), msg = $('#msg-copia');
    const respaldo = () => { S.docsUI.verJson = true; render(); const t = $('#json-banco'); if (t) { t.focus(); t.select(); } const m = $('#msg-copia'); if (m) m.textContent = 'No se pudo copiar automáticamente: el texto quedó seleccionado, cópialo con Ctrl+C.'; };
    try { navigator.clipboard.writeText(txt).then(() => { if (msg) msg.textContent = 'JSON copiado al portapapeles.'; }, respaldo); } catch (err) { respaldo(); }
  },
  'copiar-errores': () => {
    const txt = JSON.stringify(leerErrores(), null, 2), msg = $('#msg-diagnostico');
    try { navigator.clipboard.writeText(txt).then(() => { if (msg) msg.textContent = 'Registro copiado al portapapeles.'; }, () => { if (msg) msg.textContent = 'No se pudo copiar; selecciona el texto del registro.'; }); } catch (err) { if (msg) msg.textContent = 'No se pudo copiar; selecciona el texto del registro.'; }
  },
  'borrar-errores': () => { borrarErrores(); render(); }
};

export { accionesDocumentos, bancoExportable, procesarArchivo, renderDocumentos };
