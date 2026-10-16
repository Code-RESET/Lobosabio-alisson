import { parsearTexto } from './documentos/parser.js';
import { S } from './estado.js';
import { LETRAS, usaOpciones } from './opciones.js';
import { buscarActualizacion } from './pwa/actualizaciones.js';
import { instalar } from './pwa/instalacion.js';
import { sonar } from './sonido.js';
import { aplicarTema, enfocar, ir, pintarNav, render } from './ui.js';
import { $, almacen } from './util.js';
import { accionesConcurso, responderConcurso } from './vistas/concurso.js';
import { accionesCultura } from './vistas/cultura.js';
import { accionesDocumentos, procesarArchivo } from './vistas/documentos.js';
import { accionesEstudio, armarCola, guiaHTML, responderEstudio } from './vistas/estudio.js';

/* ---------- eventos: delegación de clics, formularios, cambios y teclado ----------
   Cada página exporta sus propias acciones; aquí solo se juntan y se despachan. */
const accionesGenerales = {
  'ir': b => ir(b.dataset.vista),
  'tema': b => { S.tema = S.tema === 'dark' ? 'light' : 'dark'; almacen.set('tema', S.tema); aplicarTema(); pintarNav(); },
  'sonido': b => { S.sonido = !S.sonido; almacen.set('sonido', S.sonido); pintarNav(); if (S.sonido) sonar('ok'); },
  'modo-resp': b => { S.cfg.modoResp = b.dataset.v; almacen.set('cfg', S.cfg); render(); if (!usaOpciones()) enfocar(S.vista === 'concurso' ? '#resp-cq' : '#resp-est'); },
  'actualizar': buscarActualizacion,
  'instalar': instalar,
  'pagina': b => {
    S.paginas[b.dataset.lista] = +b.dataset.p; render();
    document.querySelector(`[data-lista-ancla="${b.dataset.lista}"]`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
};
// Une los mapas y avisa si dos páginas usan el mismo nombre de acción (evita errores difíciles de encontrar).
function unirAcciones(...mapas) {
  const todas = {};
  for (const m of mapas) for (const [k, f] of Object.entries(m)) {
    if (todas[k]) throw new Error(`Acción duplicada: ${k}`);
    todas[k] = f;
  }
  return todas;
}
function iniciarEventos() {
  const ACCIONES = unirAcciones(accionesGenerales, accionesConcurso, accionesEstudio, accionesCultura, accionesDocumentos);
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-accion]');
    if (!b || b.disabled) return;
    const accion = ACCIONES[b.dataset.accion];
    if (accion) { e.preventDefault(); accion(b); }
  });
  document.addEventListener('click', e => {
    const l = e.target.closest('[data-logo]');
    if (!l) return;
    l.classList.remove('activo'); void l.getBoundingClientRect(); l.classList.add('activo');
    setTimeout(() => l.classList.remove('activo'), 1300);
  });
  document.addEventListener('submit', e => {
    const f = e.target.closest('[data-form]');
    if (!f) return;
    e.preventDefault();
    const tipo = f.dataset.form;
    if (tipo === 'concurso') responderConcurso($('#resp-cq').value);
    else if (tipo === 'estudio') responderEstudio($('#resp-est').value);
    else if (tipo === 'pegar') {
      const t = $('#texto-pegado').value;
      if (t.trim().length < 10) { S.docsUI.error = 'Pega al menos una pregunta con su respuesta.'; render(); return; }
      S.docsUI.preview = parsearTexto(t, 'Texto pegado ' + new Date().toLocaleDateString('es-MX')); S.paginas.preview = 1;
      S.docsUI.error = S.docsUI.preview.categorias.length ? null : 'No encontré preguntas en el texto pegado.';
      render();
    }
  });
  document.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.cfg) {
      const k = t.dataset.cfg;
      S.cfg[k] = t.type === 'checkbox' ? t.checked : (isNaN(+t.value) ? t.value : +t.value);
      almacen.set('cfg', S.cfg);
      if (S.vista === 'concurso') render();
      return;
    }
    const a = t.dataset.accionCambio;
    if (a === 'cat-estudio') { S.estudio.cat = t.value; S.paginas.guia = 1; armarCola(); render(); }
    else if (a === 'archivo' && t.files[0]) procesarArchivo(t.files[0]);
    else if (a === 'activar-doc') {
      if (t.dataset.doc === 'base') { S.baseActiva = t.checked; almacen.set('baseActiva', S.baseActiva); }
      else { const d = S.docs.find(x => x.id === t.dataset.doc); if (d) { d.activo = t.checked; almacen.set('docs', S.docs); } }
      S.concurso = null; armarCola(); render();
    }
  });
  document.addEventListener('input', e => {
    if (e.target.dataset.accionInput === 'buscar-guia') {
      S.estudio.busqueda = e.target.value;
      const tmp = document.createElement('div'); tmp.innerHTML = guiaHTML();
      $('#guia-res').innerHTML = tmp.querySelector('#guia-res').innerHTML;
    }
  });
  document.addEventListener('keydown', e => {
    if (!e.ctrlKey && !e.metaKey && !e.altKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName || '')) {
      let k = e.key.length === 1 ? e.key.toUpperCase() : '';
      if (/^[1-9]$/.test(k)) k = LETRAS[+k - 1];
      const btn = k && $(`#v-${S.vista} [data-tecla="${k}"]`);
      if (btn) { e.preventDefault(); btn.click(); return; }
    }
    if (S.vista !== 'estudio' || S.estudio.tab !== 'tarjetas' || /INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)) return;
    if (e.code === 'Space' && document.activeElement?.dataset.accion !== 'girar') { e.preventDefault(); $('[data-accion="girar"]')?.click(); }
    else if (S.estudio.girada && (e.key === 'ArrowRight' || e.key === '1')) $('[data-accion="tarjeta-si"]')?.click();
    else if (S.estudio.girada && (e.key === 'ArrowLeft' || e.key === '2')) $('[data-accion="tarjeta-no"]')?.click();
  });
  ['dragenter', 'dragover'].forEach(ev => document.addEventListener(ev, e => {
    const z = e.target.closest?.('#zona-soltar'); if (!z) return; e.preventDefault(); z.classList.add('encima');
  }));
  ['dragleave', 'drop'].forEach(ev => document.addEventListener(ev, e => {
    const z = e.target.closest?.('#zona-soltar'); if (!z) return; e.preventDefault(); z.classList.remove('encima');
    if (ev === 'drop' && e.dataTransfer.files[0]) procesarArchivo(e.dataTransfer.files[0]);
  }));
}

export { iniciarEventos };
