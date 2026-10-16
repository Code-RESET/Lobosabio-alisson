import { almacen } from './util.js';

/* ---------- estado ---------- */
const S = {
  vista: 'inicio',
  tema: almacen.get('tema', 'dark') === 'light' ? 'light' : 'dark',
  sonido: almacen.get('sonido', true),
  stats: almacen.get('stats', {}),
  docs: almacen.get('docs', []),
  baseActiva: almacen.get('baseActiva', true),
  record: { concurso: 0, ...almacen.get('record', {}) },
  cfg: { cqNum: 10, cqTiempo: 15, cqCat: 'todas', cqElim: true, modoResp: 'opciones', ...almacen.get('cfg', {}) },
  concurso: null,
  act: { estado: 'idle', revisado: null },
  estudio: { crono: { acum: 0, desde: null, pausadoUsuario: false }, tab: 'practica', cat: 'todas', cola: [], idx: 0, fase: 'pregunta', res: null, girada: false, busqueda: '', vuelta: false },
  verPasos: false,
  paginas: { guia: 1, preview: 1 },
  docsUI: { preview: null, procesando: false, error: null, confirmar: null, verJson: false }
};
const guardarStats = () => almacen.set('stats', S.stats);

export { guardarStats, S };
