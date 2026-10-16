import { catsDe, dominio } from '../banco.js';
import { S } from '../estado.js';
import { chevron, icono } from '../iconos.js';
import { detenerRelojes } from '../reloj.js';
import { anillo, ir } from '../ui.js';
import { $, almacen, esc } from '../util.js';
import { iniciarConcurso } from './concurso.js';
import { armarCola } from './estudio.js';

/* ============================================================
   CULTURA GENERAL (entrenamiento extra)
   ============================================================ */
function renderCultura() {
  const cats = catsDe('grupo:cultura');
  const g = dominio('grupo:cultura');
  const accion = (acc, color, ic, titulo, sub, extra = '') => `<button type="button" class="fila" style="--sangria:58px" data-accion="${acc}" ${extra}>
      <span class="icono-cuadro" style="background:${color}">${icono(ic)}</span>
      <span class="min-w-0"><span class="block font-semibold">${titulo}</span><span class="block text-sm tenue">${sub}</span></span>${chevron()}</button>`;
  $('#v-cultura').innerHTML = `
  <div class="flex flex-col gap-7">
    <div>
      <p class="eyebrow">Entrenamiento extra</p>
      <h2 class="text-[2.125rem]">Cultura general</h2>
      <p class="tenue mt-1">${g.total} preguntas de cultura general en ${cats.length} categorías para entrenar más allá de la guía. Tu avance aquí se cuenta aparte.</p>
    </div>
    <div class="grid lg:grid-cols-2 gap-7">
      <section class="flex flex-col gap-2">
        <h3 class="eyebrow px-4">Tu avance</h3>
        <div class="panel p-5 flex items-center gap-5">
          ${anillo(g.pct, 112)}
          <div class="min-w-0"><p class="num text-[2rem] font-bold leading-none">${g.dom}<span class="tenue text-xl">/${g.total}</span></p><p class="tenue">preguntas dominadas</p></div>
        </div>
      </section>
      <section class="flex flex-col gap-2">
        <h3 class="eyebrow px-4">Entrenar</h3>
        <div class="lista">
          ${accion('cultura-ronda', '#FF9500', 'concurso', 'Ronda rápida', `${S.cfg.cqNum} preguntas al azar contra reloj`)}
          ${accion('cultura-estudio', '#007AFF', 'estudio', 'Práctica guiada', 'Primero las que aún no dominas')}
          ${accion('cultura-estudio', '#AF52DE', 'cultura', 'Tarjetas', 'Repaso rápido volteando tarjetas', 'data-tab="tarjetas"')}
        </div>
      </section>
    </div>
    <section class="flex flex-col gap-2">
      <h3 class="eyebrow px-4">Categorías</h3>
      <div class="lista">
        ${cats.map(c => { const d = dominio(c.id); return `
          <div class="fila" style="--sangria:72px">
            <span class="chip chip-cod w-11 justify-center">${esc(c.codigo)}</span>
            <span class="min-w-0 flex-1"><span class="block font-medium leading-tight">${esc(c.nombre)}</span><span class="barra mt-1.5 block"><span style="width:${d.pct}%"></span></span></span>
            <span class="num text-[.9375rem] tenue w-10 text-right">${d.dom}/${d.total}</span>
            <button type="button" class="btn btn-linea btn-sm" data-accion="cultura-ronda" data-cat="${esc(c.id)}" aria-label="Ronda rápida de ${esc(c.nombre)}">Jugar</button>
          </div>`; }).join('')}
      </div>
      <p class="text-[.8125rem] tenue px-4">También puedes elegir estas categorías en Modo Concurso y en Estudio.</p>
    </section>
  </div>`;
}

/* Acciones de esta página (data-accion="…"). Reciben el botón que se tocó. */
const accionesCultura = {
  'cultura-ronda': b => { S.cfg.cqCat = b.dataset.cat || 'grupo:cultura'; almacen.set('cfg', S.cfg); detenerRelojes(); S.vista = 'concurso'; iniciarConcurso(); window.scrollTo({ top: 0 }); },
  'cultura-estudio': b => { detenerRelojes(); S.estudio.cat = b.dataset.cat || 'grupo:cultura'; S.estudio.tab = b.dataset.tab || 'practica'; armarCola(); ir('estudio'); }
};

export { accionesCultura, renderCultura };
