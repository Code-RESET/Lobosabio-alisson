import { corregirARegistroCorrecto, opcionesCategoria, preguntaPorId, priorizar, registrar, todasPreguntas } from '../banco.js';
import { calificar, sinParentesis } from '../calificar.js';
import { S } from '../estado.js';
import { icono } from '../iconos.js';
import { opcionesHTML, opcionesPara, segmentoResp, usaOpciones } from '../opciones.js';
import { cronoPausar, detenerRelojes, fmtCrono, iniciarReloj, msCrono, relojActivo } from '../reloj.js';
import { sonar } from '../sonido.js';
import { avisoHTML, barraAccion, enfocar, mostrarPregunta, render } from '../ui.js';
import { $, almacen, barajar, esc } from '../util.js';

/* ============================================================
   MODO CONCURSO (ronda relámpago)
   ============================================================ */
function renderConcurso() {
  const C = S.concurso;
  if (!C) return renderConfigConcurso();
  if (C.fase === 'fin') return renderResultadosConcurso();
  const q = C.lista[C.i];
  const mult = C.racha >= 5 ? 2 : C.racha >= 3 ? 1.5 : 1;
  const n = C.lista.length;
  queueMicrotask(() => asegurarReloj(C));
  $('#v-concurso').innerHTML = `
  <div class="max-w-3xl mx-auto flex flex-col gap-3" id="quiz-cq">
    <div class="flex items-center gap-3">
      <button type="button" class="text-[1.0625rem] shrink-0" style="color:var(--guinda)" data-accion="abandonar-concurso">‹ Salir</button>
      <div class="flex-1 min-w-0 flex flex-col gap-1">
        <span class="text-xs tenue text-center num">Pregunta ${C.i + 1} de ${n} · <span class="inline-flex items-center gap-0.5 align-middle" style="color:var(--guinda)"><span class="inline-block w-3.5 h-3.5">${icono('crono')}</span><span data-crono="cq">${fmtCrono(msCrono(C.crono))}</span></span></span>
        <div class="flex gap-[3px]" aria-hidden="true">${C.lista.map((_, k) => `<span style="flex:1;height:4px;border-radius:9px;background:${k < C.i ? (C.res[k] ? 'var(--exito)' : 'var(--error)') : k === C.i ? 'var(--guinda)' : 'var(--relleno)'}"></span>`).join('')}</div>
      </div>
      ${S.cfg.cqElim ? `<div class="flex gap-1 shrink-0" role="img" aria-label="${C.strikes} de 3 strikes">${[0, 1, 2].map(k => `<span class="strike strike-mini ${k < C.strikes ? 'strike-on' : ''}">✕</span>`).join('')}</div>` : ''}
      <div class="text-right shrink-0"><div class="pts-mini">${C.puntos}</div><div class="text-[.7rem] tenue">pts${mult > 1 ? ` · ×${mult}` : ''}</div></div>
    </div>
    <div class="escena flex flex-col gap-3">
      <div class="fila-chips flex items-center justify-between gap-2"><span class="chip chip-cod">${esc(q.codigo || '···')}</span><span class="text-sm tenue truncate">${esc(q.catNombre)} · ${q.puntos} pts</span></div>
      <div class="escena-pregunta">${esc(q.pregunta)}</div>
      ${S.cfg.cqTiempo ? `<div class="flex items-center gap-3" style="${C.fase === 'pregunta' ? '' : 'visibility:hidden'}"><div class="reloj flex-1" id="reloj-cq"><span style="width:100%"></span></div><span class="num text-sm tenue w-9 text-right" id="reloj-cq-num">${S.cfg.cqTiempo} s</span></div>` : ''}
      ${C.fase === 'feedback' && !C.ultimoOk ? '<div class="x-capa" aria-hidden="true"><span class="x">✕</span></div>' : ''}
    </div>
    ${usaOpciones() && C.ops ? opcionesHTML(C.ops, 'opcion-cq', { revelar: C.fase !== 'pregunta' }) : ''}
    ${!usaOpciones() && C.fase === 'pregunta' ? `
    <form class="flex flex-col sm:flex-row gap-2" data-form="concurso" autocomplete="off">
      <label for="resp-cq" class="sr-only">Tu respuesta</label>
      <input id="resp-cq" class="campo flex-1" placeholder="Escribe tu respuesta y presiona Enter" maxlength="120" enterkeyhint="send">
      <button class="btn btn-guinda" type="submit">Responder</button>
    </form>` : ''}
    <div class="flex flex-wrap items-center justify-between gap-2">
      ${segmentoResp()}
      <button class="btn btn-linea btn-sm" type="button" data-accion="saltar-cq" style="${C.fase === 'pregunta' ? '' : 'visibility:hidden'}">Saltar</button>
    </div>
    ${C.fase === 'feedback' ? barraAccion(`
      ${avisoHTML(C.msg)}
      <div class="flex gap-2">
        <button type="button" class="btn btn-guinda flex-1" data-accion="siguiente-cq" id="btn-sig-cq">${C.i + 1 >= n || C.terminarYa ? 'Ver resultados' : 'Siguiente'}</button>
        ${!C.ultimoOk && C.ultimoTexto && !C.porOpcion ? '<button type="button" class="btn btn-linea" data-accion="corregir-cq">Era correcta</button>' : ''}
      </div>`) : ''}
  </div>`;
}
function renderConfigConcurso() {
  const c = S.cfg;
  const disp = todasPreguntas(c.cqCat).length;
  const sel = (id, k, ops) => `<select id="${id}" class="campo-fila" data-cfg="${k}">${ops.map(([v, l]) => `<option value="${esc(v)}" ${c[k] === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
  $('#v-concurso').innerHTML = `
  <div class="max-w-2xl mx-auto flex flex-col gap-7">
    <div>
      <p class="eyebrow">Simulador</p>
      <h2 class="text-[2.125rem]">Modo Concurso</h2>
      <p class="tenue mt-1">Preguntas rápidas, una tras otra. Ganas los puntos de la pregunta más un bono por velocidad, y tu racha multiplica: ×1.5 desde 3 aciertos seguidos y ×2 desde 5.</p>
    </div>
    <section class="flex flex-col gap-2">
      <h3 class="eyebrow px-4">Configuración</h3>
      <div class="lista">
        <label class="fila" for="cfg-cq-cat"><span>Categoría</span><select id="cfg-cq-cat" class="campo-fila" data-cfg="cqCat">${opcionesCategoria(c.cqCat)}</select></label>
        <label class="fila" for="cfg-cq-num"><span>Preguntas</span>${sel('cfg-cq-num', 'cqNum', [5, 10, 15, 20, 30].map(v => [v, String(v)]))}</label>
        <label class="fila" for="cfg-cq-tiempo"><span>Tiempo por pregunta</span>${sel('cfg-cq-tiempo', 'cqTiempo', [[10, '10 s'], [15, '15 s'], [20, '20 s'], [0, 'Sin tiempo']])}</label>
        <label class="fila" for="cfg-cq-elim"><span>Eliminación con 3 strikes</span><input id="cfg-cq-elim" type="checkbox" class="interruptor" data-cfg="cqElim" ${c.cqElim ? 'checked' : ''}></label>
      </div>
      <p class="text-[.8125rem] tenue px-4">${disp} preguntas disponibles con esta selección.</p>
    </section>
    <button type="button" class="btn btn-guinda w-full" data-accion="iniciar-concurso" ${disp ? '' : 'disabled'}>Empezar ronda</button>
  </div>`;
}
function iniciarConcurso() {
  const pool = priorizar(todasPreguntas(S.cfg.cqCat));
  if (!pool.length) return;
  const lista = barajar(pool.slice(0, Math.min(S.cfg.cqNum, pool.length)));
  S.concurso = { lista, i: 0, puntos: 0, strikes: 0, racha: 0, mejorRacha: 0, res: [], tiempos: [], fallos: [], fase: 'pregunta', msg: null, crono: { acum: 0, desde: Date.now() } };
  preguntaConcurso();
}
function preguntaConcurso() {
  const C = S.concurso;
  C.fase = 'pregunta'; C.msg = null; C.inicio = Date.now(); C.ops = opcionesPara(C.lista[C.i]); C.porOpcion = false;
  C.fin = S.cfg.cqTiempo ? Date.now() + S.cfg.cqTiempo * 1000 : null;
  render(); enfocar('#resp-cq');
}
// Arranca (o reanuda al volver a la pestaña) la cuenta regresiva de la pregunta actual.
function asegurarReloj(C) {
  if (C.fase !== 'pregunta' || !C.fin || relojActivo()) return;
  iniciarReloj(S.cfg.cqTiempo, () => { if (S.concurso === C && C.fase === 'pregunta') responderConcurso('', true); }, 'reloj-cq', 'reloj-cq-num', C.fin);
}
function responderConcurso(texto, agotado = false, okForzado) {
  const C = S.concurso;
  if (!C || C.fase !== 'pregunta') return;
  detenerRelojes();
  const q = C.lista[C.i], t = texto.trim();
  const seg = (Date.now() - C.inicio) / 1000;
  const r = okForzado !== undefined ? { ok: okForzado } : t ? calificar(t, q) : { ok: false };
  C.porOpcion = okForzado !== undefined;
  C.tiempos.push(seg); C.ultimoTexto = t; C.ultimoOk = r.ok;
  C.prev = registrar(q.id, r.ok);
  if (r.ok) {
    C.racha++; C.mejorRacha = Math.max(C.mejorRacha, C.racha);
    const mult = C.racha >= 5 ? 2 : C.racha >= 3 ? 1.5 : 1;
    const bono = S.cfg.cqTiempo ? Math.round(50 * Math.max(0, 1 - seg / S.cfg.cqTiempo)) : 0;
    const pts = Math.round((q.puntos + bono) * mult);
    C.ultimosPts = pts; C.puntos += pts; C.res.push(true);
    C.msg = { tipo: 'ok', html: `<strong>¡Correcto! +${pts}</strong> <span class="desglose">(${q.puntos} base${bono ? ` + ${bono} por velocidad` : ''}${mult > 1 ? ` × ${mult} de racha` : ''}). </span>Respuesta: «${esc(sinParentesis(q.respuesta))}».${q.nota ? ` <span class="tenue">${esc(q.nota)}</span>` : ''}` };
    sonar('ok');
  } else {
    C.racha = 0; C.res.push(false); C.fallos.push({ id: q.id, texto: t });
    if (S.cfg.cqElim) C.strikes++;
    C.msg = { tipo: 'mal', html: `<strong>${agotado ? 'Se acabó el tiempo.' : t ? 'Incorrecta.' : 'Pregunta saltada.'}</strong> La respuesta es «${esc(q.respuesta)}».${t ? `<span class="desglose"> ${C.porOpcion ? 'Elegiste' : 'Escribiste'} «${esc(t)}».</span>` : ''}${q.nota ? ` <span class="tenue">${esc(q.nota)}</span>` : ''}` };
    sonar('mal');
  }
  C.terminarYa = S.cfg.cqElim && C.strikes >= 3;
  C.fase = 'feedback';
  render();
  const b = $('#btn-sig-cq'); if (b) b.focus({ preventScroll: true });
  if (r.ok && !C.terminarYa) { const ref = C.i; C.auto = setTimeout(() => { if (S.concurso === C && C.i === ref && C.fase === 'feedback' && S.vista === 'concurso') siguienteConcurso(); }, 1600); }
}
function siguienteConcurso() {
  const C = S.concurso;
  if (!C) return;
  clearTimeout(C.auto);
  if (C.terminarYa || C.i + 1 >= C.lista.length) {
    C.fase = 'fin'; cronoPausar(C.crono);
    if (C.puntos > S.record.concurso) { S.record.concurso = C.puntos; C.nuevoRecord = true; almacen.set('record', S.record); }
    sonar('fin'); render(); return;
  }
  C.i++; preguntaConcurso(); mostrarPregunta('#quiz-cq');
}
function corregirConcurso() {
  const C = S.concurso;
  if (!C || C.ultimoOk) return;
  const q = C.lista[C.i];
  corregirARegistroCorrecto(q.id, C.prev);
  C.res[C.res.length - 1] = true; C.fallos = C.fallos.filter(f => f.id !== q.id);
  if (S.cfg.cqElim) C.strikes = Math.max(0, C.strikes - 1);
  C.racha++; C.mejorRacha = Math.max(C.mejorRacha, C.racha);
  C.puntos += q.puntos; C.ultimoOk = true; C.terminarYa = S.cfg.cqElim && C.strikes >= 3;
  C.msg = { tipo: 'ok', html: `Corregido: «${esc(C.ultimoTexto)}» se contó como acierto (+${q.puntos}, sin bono).` };
  render();
}
function renderResultadosConcurso() {
  const C = S.concurso, n = C.res.length, ok = C.res.filter(Boolean).length;
  const prom = C.tiempos.length ? (C.tiempos.reduce((a, b) => a + b, 0) / C.tiempos.length).toFixed(1) : '0';
  $('#v-concurso').innerHTML = `
  <div class="max-w-4xl mx-auto flex flex-col gap-5">
    <div class="escena text-center flex flex-col items-center gap-2 py-8">
      <p class="eyebrow">${C.terminarYa ? 'Eliminado con tres strikes' : 'Ronda terminada'}</p>
      <p class="num font-bold leading-none" style="font-size:clamp(3.5rem,12vw,5.5rem);color:var(--guinda)">${C.puntos}</p>
      <p class="tenue">puntos${C.nuevoRecord ? ' · ¡Nuevo récord!' : ` · Récord: ${S.record.concurso}`}</p>
    </div>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      ${[['Aciertos', `${ok}/${n}`], ['Precisión', `${n ? Math.round(ok / n * 100) : 0}%`], ['Mejor racha', C.mejorRacha], ['Tiempo total', fmtCrono(msCrono(C.crono))], ['Por pregunta', `${prom} s`]].map(([l, v]) => `<div class="panel p-4 text-center"><p class="eyebrow">${l}</p><p class="num text-3xl font-extrabold">${v}</p></div>`).join('')}
    </div>
    <div class="panel p-5">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 class="text-2xl font-bold">${C.fallos.length ? 'Para repasar' : 'Sin errores. ¡Así se compite!'}</h3>
        ${C.fallos.length ? '<button type="button" class="btn btn-guinda btn-sm" data-accion="estudiar-errores">Repasar estos errores</button>' : ''}
      </div>
      ${C.fallos.length ? `<ul class="flex flex-col divide-y" style="border-color:var(--linea)">${C.fallos.map(f => { const q = preguntaPorId(f.id); return q ? `
        <li class="py-3 grid sm:grid-cols-[1fr_auto] gap-1 sm:gap-4" style="border-color:var(--linea)">
          <span class="min-w-0"><span class="chip chip-cod mr-2">${esc(q.codigo || '···')}</span>${esc(q.pregunta)}</span>
          <span class="text-sm"><strong style="color:var(--exito)">${esc(q.respuesta)}</strong>${f.texto ? ` <span class="tenue">· tú: ${esc(f.texto)}</span>` : ''}</span>
        </li>` : ''; }).join('')}</ul>` : '<p class="tenue">Todas las respuestas fueron correctas.</p>'}
    </div>
    <div class="flex flex-wrap gap-2 justify-center">
      <button type="button" class="btn btn-oro" data-accion="iniciar-concurso">Jugar otra vez</button>
      <button type="button" class="btn btn-linea" data-accion="config-concurso">Cambiar configuración</button>
    </div>
  </div>`;
}

/* Acciones de esta página (data-accion="…"). Reciben el botón que se tocó. */
const accionesConcurso = {
  'opcion-cq': b => { const C = S.concurso, op = C && C.ops[+b.dataset.o]; if (!op || C.fase !== 'pregunta') return; op.elegida = true; responderConcurso(op.texto, false, op.ok); },
  'iniciar-concurso': iniciarConcurso,
  'saltar-cq': b => responderConcurso(''),
  'siguiente-cq': siguienteConcurso,
  'corregir-cq': corregirConcurso,
  'abandonar-concurso': b => { detenerRelojes(); clearTimeout(S.concurso?.auto); S.concurso = null; render(); },
  'config-concurso': b => { S.concurso = null; render(); }
};

export { accionesConcurso, iniciarConcurso, renderConcurso, responderConcurso };
