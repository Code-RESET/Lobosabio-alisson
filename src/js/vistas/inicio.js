import { catsDe, dominio } from '../banco.js';
import { S } from '../estado.js';
import { chevron, icono } from '../iconos.js';
import { logoSVG } from '../logo.js';
import { actualizacionHTML } from '../pwa/actualizaciones.js';
import { instalacionHTML } from '../pwa/instalacion.js';
import { anillo } from '../ui.js';
import { $, esc } from '../util.js';

/* ============================================================
   INICIO
   ============================================================ */
function renderInicio() {
  const cats = catsDe('todas');
  const g = dominio();
  const filas = cats.map(c => ({ c, d: dominio(c.id) }));
  const debil = [...filas].sort((a, b) => a.d.pct - b.d.pct)[0];
  const totalVistas = Object.keys(S.stats).length;
  const modo = (vista, color, ic, titulo, sub) => `<button type="button" class="fila" style="--sangria:58px" data-accion="ir" data-vista="${vista}">
      <span class="icono-cuadro" style="background:${color}">${icono(ic)}</span>
      <span class="min-w-0"><span class="block font-semibold">${titulo}</span><span class="block text-sm tenue">${sub}</span></span>${chevron()}</button>`;
  $('#v-inicio').innerHTML = `
  <div class="flex flex-col gap-7">
    <div class="flex items-center gap-4">
      <div class="shrink-0">${logoSVG(76)}</div>
      <div class="min-w-0">
        <p class="eyebrow">Concurso LoboSabio</p>
        <h1 class="text-[2.125rem] md:text-[2.6rem]">Domina la guía al 100&nbsp;%</h1>
      </div>
    </div>

    <div class="grid lg:grid-cols-2 gap-7">
      <section class="flex flex-col gap-2">
        <h2 class="eyebrow px-4">Tu avance</h2>
        <div class="panel p-5 flex items-center gap-5">
          ${anillo(g.pct, 128)}
          <div class="min-w-0 flex flex-col gap-1">
            <p class="num text-[2rem] font-bold leading-none">${g.dom}<span class="tenue text-xl">/${g.total}</span></p>
            <p class="tenue">preguntas dominadas</p>
            <p class="text-sm tenue">${totalVistas ? `${totalVistas} practicadas · récord ${S.record.concurso} pts` : 'Aún no has practicado.'}</p>
          </div>
        </div>
        <p class="text-[.8125rem] tenue px-4">Una pregunta queda dominada al contestarla bien dos veces seguidas.</p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="eyebrow px-4">Modos</h2>
        <div class="lista">
          ${modo('concurso', '#FF9500', 'concurso', 'Modo Concurso', 'Preguntas rápidas contra reloj')}
          ${modo('estudio', '#007AFF', 'estudio', 'Modo Estudio', 'Práctica, tarjetas y repaso de errores')}
          ${modo('documentos', '#8E8E93', 'documentos', 'Documentos', 'Sube tu propia guía en PDF, DOCX o TXT')}
        </div>
        ${debil && debil.d.pct < 100 ? `<p class="text-[.8125rem] tenue px-4">Te conviene empezar por <button type="button" class="font-semibold" style="color:var(--guinda)" data-accion="estudiar-cat" data-cat="${esc(debil.c.id)}">${esc(debil.c.nombre)}</button> (${debil.d.pct}&nbsp;% dominado).</p>` : ''}
      </section>
    </div>

    ${S.act.estado.startsWith('nueva') ? `<div class="aviso flex items-center gap-3" style="background:var(--guinda-suave)"><span class="flex-1 text-[.9375rem]"><strong>Hay una versión nueva de Lobitos.</strong> Se instala en un segundo y conserva tu progreso.</span><button type="button" class="btn btn-guinda btn-sm" data-accion="actualizar">Actualizar</button></div>` : ''}
    <section class="flex flex-col gap-2">
      <h2 class="eyebrow px-4">Categorías</h2>
      <div class="lista">
        ${filas.map(({ c, d }) => `
          <button type="button" class="fila" style="--sangria:72px" data-accion="estudiar-cat" data-cat="${esc(c.id)}">
            <span class="chip chip-cod w-11 justify-center">${esc(c.codigo || '···')}</span>
            <span class="min-w-0 flex-1"><span class="block font-medium truncate">${esc(c.nombre)}</span><span class="barra mt-1.5 block"><span style="width:${d.pct}%"></span></span></span>
            <span class="num text-[.9375rem] tenue w-12 text-right">${d.dom}/${d.total}</span>${chevron()}
          </button>`).join('') || '<p class="fila tenue">No hay categorías activas. Activa la guía o carga un documento.</p>'}
      </div>
    </section>
    <section class="flex flex-col gap-2">
      <h2 class="eyebrow px-4">App</h2>
      <div class="lista">${actualizacionHTML()}</div>
      ${instalacionHTML()}
    </section>
  </div>`;
}

export { renderInicio };
