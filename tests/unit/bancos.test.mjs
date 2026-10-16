// Validación de los dos bancos de preguntas (guía LoboSabio y cultura general).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BASE, CULTURA, catsDe, todasPreguntas, preguntaPorId } from '../../src/js/banco.js';
import { normalizar, calificar, variantesDe } from '../../src/js/calificar.js';

const BANCOS = [['guía', BASE, 70, 7], ['cultura general', CULTURA, 110, 11]];

for (const [nombre, banco, totalEsperado, catsEsperadas] of BANCOS) {
  test(`${nombre}: ${catsEsperadas} categorías y ${totalEsperado} preguntas`, () => {
    assert.equal(banco.categorias.length, catsEsperadas);
    assert.equal(banco.categorias.reduce((a, c) => a + c.preguntas.length, 0), totalEsperado);
  });

  test(`${nombre}: cada pregunta está completa`, () => {
    for (const c of banco.categorias) {
      assert.ok(c.id && c.codigo && c.nombre, `categoría incompleta: ${JSON.stringify(c).slice(0, 80)}`);
      for (const p of c.preguntas) {
        assert.match(p.pregunta, /^¿.+\?$/s, `${p.id}: la pregunta debe ir entre ¿ ?`);
        assert.ok(p.respuesta && normalizar(p.respuesta), `${p.id}: sin respuesta`);
        assert.ok([20, 40, 60, 80, 100].includes(p.puntos), `${p.id}: puntos fuera de escala (${p.puntos})`);
        assert.ok(Array.isArray(p.alias), `${p.id}: alias debe ser una lista`);
      }
    }
  });

  test(`${nombre}: 3 opciones incorrectas distintas y ninguna se confunde con la respuesta`, () => {
    for (const c of banco.categorias) for (const p of c.preguntas) {
      assert.equal(p.distractores?.length, 3, `${p.id}: deben ser 3 distractores`);
      const norm = p.distractores.map(normalizar);
      assert.equal(new Set(norm).size, 3, `${p.id}: distractores repetidos`);
      const correctas = variantesDe(p).map(normalizar);
      for (const d of p.distractores) {
        assert.ok(!correctas.includes(normalizar(d)), `${p.id}: «${d}» es igual a la respuesta`);
        assert.equal(calificar(d, p).ok, false, `${p.id}: el calificador aceptaría «${d}» como correcta`);
      }
    }
  });
}

test('los ids son únicos entre ambos bancos', () => {
  const ids = [...BASE.categorias, ...CULTURA.categorias].flatMap(c => [c.id, ...c.preguntas.map(p => p.id)]);
  assert.equal(new Set(ids).size, ids.length);
});

test('cultura general no repite preguntas de la guía', () => {
  const guia = new Set(BASE.categorias.flatMap(c => c.preguntas.map(p => normalizar(p.pregunta))));
  for (const c of CULTURA.categorias) for (const p of c.preguntas) assert.ok(!guia.has(normalizar(p.pregunta)), `${p.id} repite la guía`);
});

test('selección por grupos: la guía y la cultura general se cuentan aparte', () => {
  assert.equal(todasPreguntas('todas').length, 70);
  assert.equal(todasPreguntas('grupo:cultura').length, 110);
  assert.equal(todasPreguntas('*').length, 180);
  assert.equal(catsDe('cg-esp').length, 1);
  assert.equal(preguntaPorId('cg-esp-01').respuesta, '1969');
  assert.equal(preguntaPorId('his-01').grupo, 'guia');
  assert.equal(preguntaPorId('no-existe'), null);
});
