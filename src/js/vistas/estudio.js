import { catsDe, corregirARegistroCorrecto, dominada, dominio, estadoPregunta, opcionesCategoria, preguntaPorId, priorizar, registrar, todasPreguntas } from '../banco.js';
import { calificar, normalizar } from '../calificar.js';
import { S } from '../estado.js';
import { icono } from '../iconos.js';
import { opcionesHTML, opcionesPara, segmentoResp, usaOpciones } from '../opciones.js';
import { controlesPaginacion, paginar } from '../paginacion.js';
import { cronoCorrer, cronoPausar, detenerRelojes, fmtCrono, msCrono } from '../reloj.js';
import { sonar } from '../sonido.js';
import { barraAccion, enfocar, ir, mostrarPregunta, render } from '../ui.js';
import { $, $$, esc } from '../util.js';

/* ============================================================
   MODO ESTUDIO
   ============================================================ */
function poolEstudio() {
  const E = S.estudio, qs = todasPreguntas(E.cat);
  if (E.tab === 'errores') return qs.filter(q => (S.stats[q.id]?.f || 0) > 0 && !dominada(q.id));
  return qs;
}
function armarCola(vuelta = false) {
  const E = S.estudio;
  E.cola = priorizar(poolEstudio()).map(q => q.id);
  E.idx = 0; E.fase = 'pregunta'; E.res = null; E.girada = false; E.vuelta = vuelta;
}
function preguntaEstudio() {
  const E = S.estudio;
  if (E.idx >= E.cola.length) { armarCola(true); }
  const id = E.cola[E.idx];
  return id ? preguntaPorId(id) : null;
}
function renderEstudio() {
  const E = S.estudio;
  const d = dominio(E.cat);
  const nErr = todasPreguntas(E.cat).filter(q => (S.stats[q.id]?.f || 0) > 0 && !dominada(q.id)).length;
  const tabs = [['practica', 'Práctica'], ['tarjetas', 'Tarjetas'], ['errores', `Errores (${nErr})`], ['guia', 'Guía']];
  let cuerpo = '';
  if (E.tab === 'guia') cuerpo = guiaHTML();
  else {
    if (!E.cola.length || E.cola.some(id => !preguntaPorId(id))) armarCola();
    const q = preguntaEstudio();
    if (!q) cuerpo = `<div class="panel p-8 text-center flex flex-col items-center gap-3">
      <h3 class="text-2xl font-bold">${E.tab === 'errores' ? 'No tienes errores pendientes' : 'No hay preguntas en esta selección'}</h3>
      <p class="tenue max-w-[48ch]">${E.tab === 'errores' ? 'Las preguntas que falles en cualquier modo aparecerán aquí hasta que las contestes bien dos veces seguidas.' : 'Cambia la categoría o activa un documento en la sección Documentos.'}</p>
      ${E.tab === 'errores' ? '<button type="button" class="btn btn-guinda" data-accion="tab-estudio" data-tab="practica">Ir a práctica guiada</button>' : ''}
    </div>`;
    else cuerpo = E.tab === 'tarjetas' ? tarjetaHTML(q) : practicaHTML(q);
  }
  $('#v-estudio').innerHTML = `
  <div class="flex flex-col gap-3">
    <div class="flex items-center gap-2 md:gap-3">
      <h2 class="quiz-titulo hidden md:block text-[2.125rem] mr-auto">Estudio</h2>
      <label for="est-cat" class="sr-only">Categoría</label>
      <select id="est-cat" class="campo flex-1 min-w-0 md:flex-none md:w-72 py-2 text-[.9375rem]" data-accion-cambio="cat-estudio">
        ${opcionesCategoria(E.cat)}
      </select>
      <button type="button" class="crono-chip ${E.crono.desde ? '' : 'pausado'}" data-accion="crono-est" aria-label="${E.crono.desde ? 'Pausar cronómetro' : 'Reanudar cronómetro'}" title="Tiempo de estudio: toca para pausar o reanudar">${icono('crono')}<span class="num" data-crono="est">${fmtCrono(msCrono(E.crono))}</span></button>
      <button type="button" class="icono-btn" style="width:32px;height:32px" data-accion="crono-reset" aria-label="Reiniciar cronómetro" title="Reiniciar cronómetro">${icono('reiniciar')}</button>
    </div>
    <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div class="segmento nav-scroll" role="tablist">${tabs.map(([id, l]) => `<button type="button" role="tab" aria-selected="${E.tab === id}" data-accion="tab-estudio" data-tab="${id}">${l}</button>`).join('')}</div>
      <div class="solo-alto flex-1 min-w-[10rem] flex items-center gap-2"><div class="barra flex-1"><span style="width:${d.pct}%"></span></div><span class="num text-xs tenue">${d.dom}/${d.total} dominadas</span></div>
    </div>
    ${E.vuelta && E.tab !== 'guia' ? '<div class="aviso aviso-casi text-sm">Completaste una vuelta. La nueva empieza por las preguntas que aún no dominas.</div>' : ''}
    ${cuerpo}
  </div>`;
}
function opsEstudio(q) {
  const E = S.estudio;
  if (E.opsId !== q.id) { E.ops = opcionesPara(q); E.opsId = q.id; }
  return E.ops;
}
function practicaHTML(q) {
  const E = S.estudio, st = estadoPregunta(q.id), r = E.res;
  const fb = E.fase !== 'pregunta';
  return `
  <div class="grid lg:grid-cols-[1fr_300px] gap-4" id="quiz-est">
    <div class="flex flex-col gap-3 min-w-0">
      <div class="escena flex flex-col gap-3">
        <div class="fila-chips flex flex-wrap items-center gap-2"><span class="chip chip-cod">${esc(q.codigo || '···')}</span><span class="chip ${st.cls}">${st.txt}</span><span class="text-sm tenue ml-auto num">${E.idx + 1} de ${E.cola.length}</span></div>
        <h3 class="escena-pregunta">${esc(q.pregunta)}</h3>
      </div>
      ${usaOpciones() ? opcionesHTML(opsEstudio(q), 'opcion-est', { revelar: fb }) : !fb ? `
      <form class="flex flex-col sm:flex-row gap-2" data-form="estudio" autocomplete="off">
        <label for="resp-est" class="sr-only">Tu respuesta</label>
        <input id="resp-est" class="campo flex-1" placeholder="Escribe tu respuesta" maxlength="160" enterkeyhint="send">
        <button class="btn btn-guinda" type="submit">Comprobar</button>
      </form>
      ${r && r.casi ? `<div class="aviso aviso-casi"><strong>¡Casi!</strong> «${esc(r.texto)}» va bien, pero le falta precisión. Inténtalo otra vez.</div>` : ''}` : ''}
      <div class="flex flex-wrap items-center justify-between gap-2">
        ${segmentoResp()}
        <button class="btn btn-linea btn-sm" type="button" data-accion="nolase-est" style="${fb ? 'visibility:hidden' : ''}">No la sé</button>
      </div>
    </div>
    ${historialHTML(q)}
    ${fb ? barraAccion(`
      <div class="aviso ${r.ok ? 'aviso-ok' : 'aviso-mal'} flex flex-col gap-1">
        <p class="font-bold" style="color:${r.ok ? 'var(--exito)' : 'var(--error)'}">${r.ok ? (r.corregida ? 'Marcada como correcta' : '¡Correcto!') : r.texto ? 'Incorrecto' : 'Respuesta revelada'}</p>
        <p><span class="tenue">Respuesta de la guía:</span> <strong>${esc(q.respuesta)}</strong>${r.texto && !r.ok ? ` <span class="tenue">· tú: ${esc(r.texto)}</span>` : ''}</p>
        ${q.nota ? `<p class="nota-fb text-sm"><span class="tenue">Para recordar:</span> ${esc(q.nota)}</p>` : ''}
        ${!usaOpciones() && q.alias && q.alias.length ? `<p class="text-sm"><span class="tenue">También se acepta:</span> ${q.alias.map(esc).join(' · ')}</p>` : ''}
      </div>
      <div class="flex gap-2">
        <button type="button" class="btn btn-guinda flex-1" data-accion="sig-est" id="btn-sig-est">Siguiente</button>
        ${!r.ok && r.texto && !r.porOpcion ? '<button type="button" class="btn btn-linea" data-accion="corregir-est">Era correcta</button>' : ''}
      </div>`) : ''}
  </div>`;
}
function historialHTML(q) {
  const s = S.stats[q.id];
  return `<aside class="panel p-5 flex flex-col gap-3 text-sm">
    <p class="eyebrow">Esta pregunta</p>
    <div class="grid grid-cols-3 gap-2 text-center">
      ${[['Intentos', s?.v || 0], ['Aciertos', s?.a || 0], ['Errores', s?.f || 0]].map(([l, v]) => `<div class="aviso px-2 py-2"><p class="num text-2xl font-extrabold">${v}</p><p class="text-xs tenue">${l}</p></div>`).join('')}
    </div>
    <p class="tenue">${dominada(q.id) ? 'Ya la dominas. Seguirá apareciendo de vez en cuando para que no se olvide.' : `Te faltan ${2 - Math.min(2, s?.r || 0)} aciertos seguidos para dominarla.`}</p>
    <p class="tenue">Vale <strong class="num">${q.puntos}</strong> puntos base en el Modo Concurso.</p>
  </aside>`;
}
function tarjetaHTML(q) {
  const E = S.estudio;
  return `
  <div class="max-w-2xl w-full mx-auto flex flex-col gap-4">
    <div class="flex items-center justify-between text-sm tenue"><span><span class="chip chip-cod mr-2">${esc(q.codigo || '···')}</span>${esc(q.catNombre)}</span><span>${E.idx + 1} de ${E.cola.length}</span></div>
    <button type="button" class="flash ${E.girada ? 'girada' : ''} text-left w-full" data-accion="girar" aria-label="${E.girada ? 'Ver pregunta' : 'Ver respuesta'}">
      <div class="flash-int">
        <div class="flash-cara flash-frente gap-3"><p class="eyebrow">Pregunta</p><p class="font-bold text-2xl md:text-3xl leading-tight">${esc(q.pregunta)}</p><p class="text-sm tenue">Toca la tarjeta o presiona espacio para voltear</p></div>
        <div class="flash-cara flash-reverso gap-3"><p class="eyebrow">Respuesta</p><p class="font-bold text-3xl md:text-4xl">${esc(q.respuesta)}</p>${q.nota ? `<p class="text-sm" style="opacity:.8">${esc(q.nota)}</p>` : ''}</div>
      </div>
    </button>
    <div class="grid grid-cols-2 gap-2">
      <button type="button" class="btn btn-linea" data-accion="tarjeta-no" ${E.girada ? '' : 'disabled'}>No la sabía</button>
      <button type="button" class="btn btn-guinda" data-accion="tarjeta-si" ${E.girada ? '' : 'disabled'}>La sabía</button>
    </div>
  </div>`;
}
function guiaHTML() {
  const E = S.estudio, b = normalizar(E.busqueda);
  const filas = catsDe(E.cat).flatMap(c => c.preguntas
    .filter(q => !b || normalizar(q.pregunta + ' ' + q.respuesta + ' ' + (q.alias || []).join(' ')).includes(b))
    .map(q => ({ c, q })));
  const pag = paginar(filas, S.paginas.guia);
  S.paginas.guia = pag.pagina;
  // Agrupa por categoría solo las preguntas de esta página, conservando el orden.
  const grupos = [];
  for (const f of pag.items) { const g = grupos.at(-1); if (g && g.c === f.c) g.qs.push(f.q); else grupos.push({ c: f.c, qs: [f.q] }); }
  const bloques = grupos.map(({ c, qs }) => {
    return `<section class="panel overflow-hidden">
      <div class="flex items-center gap-2 px-5 py-3" style="background:var(--hundido);border-bottom:1px solid var(--linea)"><span class="chip chip-cod">${esc(c.codigo || '···')}</span><h3 class="text-xl font-bold">${esc(c.nombre)}</h3><span class="text-xs tenue ml-auto">${c.docId === 'base' ? 'Guía base' : esc(c.docNombre)}</span></div>
      <ol class="divide-y" style="border-color:var(--linea)">${qs.map(q => { const st = estadoPregunta(q.id); return `
        <li class="px-5 py-3 grid md:grid-cols-[1fr_minmax(0,16rem)_auto] gap-x-4 gap-y-1 items-start" style="border-color:var(--linea)">
          <span class="min-w-0">${esc(q.pregunta)}${q.nota ? `<span class="block text-sm tenue mt-0.5">${esc(q.nota)}</span>` : ''}</span>
          <strong class="min-w-0" style="color:var(--guinda)">${esc(q.respuesta)}</strong>
          <span class="flex gap-2 items-center"><span class="chip ${st.cls}">${st.txt}</span><span class="num text-sm tenue w-8 text-right">${q.puntos}</span></span>
        </li>`; }).join('')}</ol>
    </section>`;
  }).join('');
  return `<div class="flex flex-col gap-4">
    <label for="busca-guia" class="sr-only">Buscar en la guía</label>
    <input id="busca-guia" class="campo" placeholder="Buscar pregunta, respuesta o concepto…" value="${esc(E.busqueda)}" data-accion-input="buscar-guia">
    <div id="guia-res" class="flex flex-col gap-4" data-lista-ancla="guia">${bloques ? bloques + controlesPaginacion('guia', pag) : '<p class="tenue">Sin resultados para esa búsqueda.</p>'}</div>
  </div>`;
}
function responderEstudio(texto) {
  const E = S.estudio, q = preguntaPorId(E.cola[E.idx]);
  const t = texto.trim();
  if (!q || !t) return;
  const r = calificar(t, q);
  if (r.casi && !(E.res && E.res.casi)) { E.res = { casi: true, texto: t }; sonar('casi'); render(); enfocar('#resp-est', true); return; }
  E.res = { ok: r.ok, texto: t, prev: registrar(q.id, r.ok) };
  E.fase = 'feedback'; sonar(r.ok ? 'ok' : 'mal'); render(); enfocar('#btn-sig-est');
}
function siguienteEstudio() {
  const E = S.estudio;
  E.idx++; E.fase = 'pregunta'; E.res = null; E.girada = false; E.vuelta = false;
  if (E.tab === 'errores') { const id = E.cola[E.idx]; if (!id || dominada(id)) { const pend = E.cola.slice(E.idx).filter(x => !dominada(x)); E.cola = pend.length ? pend : priorizar(poolEstudio()).map(q => q.id); E.idx = 0; } }
  render(); mostrarPregunta('#quiz-est, .flash'); enfocar(E.tab === 'tarjetas' ? '.flash' : '#resp-est');
}

/* Acciones de esta página (data-accion="…"). Reciben el botón que se tocó. */
const accionesEstudio = {
  'estudiar-cat': b => { detenerRelojes(); S.estudio.cat = b.dataset.cat; S.estudio.tab = 'practica'; armarCola(); ir('estudio'); },
  'estudiar-errores': b => { S.concurso = null; S.estudio.tab = 'errores'; S.estudio.cat = 'todas'; armarCola(); ir('estudio'); },
  'tab-estudio': b => { S.estudio.tab = b.dataset.tab; armarCola(); render(); },
  'opcion-est': b => {
    const E = S.estudio, id = E.cola[E.idx], op = E.ops && E.ops[+b.dataset.o];
    if (!op || E.fase !== 'pregunta' || E.opsId !== id) return;
    op.elegida = true;
    E.res = { ok: op.ok, texto: op.texto, prev: registrar(id, op.ok), porOpcion: true };
    E.fase = 'feedback'; sonar(op.ok ? 'ok' : 'mal'); render(); enfocar('#btn-sig-est');
  },
  'nolase-est': b => { const E = S.estudio, q = preguntaPorId(E.cola[E.idx]); E.res = { ok: false, texto: '', prev: registrar(q.id, false) }; E.fase = 'feedback'; render(); enfocar('#btn-sig-est'); },
  'sig-est': siguienteEstudio,
  'corregir-est': b => { const E = S.estudio, id = E.cola[E.idx]; corregirARegistroCorrecto(id, E.res.prev); E.res = { ...E.res, ok: true, corregida: true }; render(); },
  'girar': b => { S.estudio.girada = !S.estudio.girada; $('.flash')?.classList.toggle('girada', S.estudio.girada); $$('[data-accion="tarjeta-si"],[data-accion="tarjeta-no"]').forEach(x => { x.disabled = !S.estudio.girada; }); },
  'tarjeta-si': b => { registrar(S.estudio.cola[S.estudio.idx], true); siguienteEstudio(); },
  'tarjeta-no': b => { registrar(S.estudio.cola[S.estudio.idx], false); siguienteEstudio(); },
  'crono-est': b => { const c = S.estudio.crono; if (c.desde) { cronoPausar(c); c.pausadoUsuario = true; } else { c.pausadoUsuario = false; cronoCorrer(c); } render(); },
  'crono-reset': b => { const c = S.estudio.crono; c.acum = 0; c.desde = c.pausadoUsuario ? null : Date.now(); render(); }
};

export { accionesEstudio, armarCola, guiaHTML, renderEstudio, responderEstudio };
