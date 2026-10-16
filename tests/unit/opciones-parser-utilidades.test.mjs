// Opciones A·B·C, lector de guías (parser), paginación y cronómetro.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { opcionesPara } from '../../src/js/opciones.js';
import { todasPreguntas } from '../../src/js/banco.js';
import { sinParentesis } from '../../src/js/calificar.js';
import { parsearTexto, quitarNumeracion } from '../../src/js/documentos/parser.js';
import { paginar } from '../../src/js/paginacion.js';
import { fmtCrono, msCrono } from '../../src/js/reloj.js';

test('opciones: siempre 3, sin repetir y con exactamente una correcta (180 preguntas × 25 rondas)', () => {
  for (let ronda = 0; ronda < 25; ronda++) {
    for (const q of todasPreguntas('*')) {
      const ops = opcionesPara(q);
      assert.equal(ops.length, 3, q.id);
      assert.equal(ops.filter(o => o.ok).length, 1, q.id);
      assert.equal(new Set(ops.map(o => o.texto)).size, 3, q.id);
      assert.equal(ops.find(o => o.ok).texto, sinParentesis(q.respuesta), q.id);
    }
  }
});

test('opciones: preguntas sin distractores escritos (documentos subidos) también reciben 3 opciones', () => {
  for (const q of todasPreguntas('todas')) {
    const ops = opcionesPara({ ...q, distractores: [] });
    assert.equal(ops.length, 3, q.id);
    assert.equal(ops.filter(o => o.ok).length, 1, q.id);
  }
  const fecha = opcionesPara({ id: 'x', catId: 'x', pregunta: '¿Día?', respuesta: 'El 22 de abril', alias: [] });
  assert.ok(fecha.every(o => /^El \d+ de abril$/.test(o.texto)), 'las fechas generan fechas cercanas');
});

test('parser: el texto del PDF de la guía produce 7 categorías y 70 preguntas', () => {
  const texto = readFileSync(new URL('../fixtures/guia-lobosabio.txt', import.meta.url), 'utf8');
  const doc = parsearTexto(texto, 'guia.pdf');
  assert.equal(doc.categorias.length, 7);
  assert.equal(doc.categorias.reduce((a, c) => a + c.preguntas.length, 0), 70);
  const todas = doc.categorias.flatMap(c => c.preguntas);
  const buscar = inicio => todas.find(p => p.pregunta.startsWith(inicio));
  assert.equal(buscar('¿En qué año inició la Independencia').respuesta, '1810');
  // pregunta partida en dos líneas en el PDF
  assert.equal(buscar('¿Cómo se llama la línea imaginaria').pregunta, '¿Cómo se llama la línea imaginaria que divide la Tierra en hemisferio norte y sur?');
  assert.ok(buscar('¿Qué país lanzó el primer satélite').alias.includes('URSS'));
  assert.deepEqual(doc.categorias.map(c => c.preguntas.length), [10, 10, 10, 10, 10, 10, 10]);
});

test('parser: formato P:/R:, definiciones y texto sin preguntas', () => {
  const pr = parsearTexto('Historia\nP: ¿Quién fue el primer presidente de México?\nR: Guadalupe Victoria\nP: ¿Año de la Independencia?\nR: 1810', 'pr.txt');
  assert.equal(pr.categorias[0].preguntas.length, 2);
  assert.equal(pr.categorias[0].preguntas[0].respuesta, 'Guadalupe Victoria');
  const def = parsearTexto('Fotosíntesis: proceso por el que las plantas producen alimento con luz.\nÁtomo: unidad más pequeña de la materia.\nCélula: unidad básica de la vida.', 'def.txt');
  assert.equal(def.modo, 'definiciones');
  assert.equal(def.categorias[0].preguntas.length, 3);
  assert.equal(parsearTexto('Hola, este texto no tiene preguntas.', 'x.txt').categorias.length, 0);
  assert.equal(quitarNumeracion('10. • ¿Pregunta?'), '¿Pregunta?');
  assert.equal(quitarNumeracion('206.'), '206.', 'no confunde una respuesta numérica con numeración');
});

test('paginación', () => {
  const lista = Array.from({ length: 37 }, (_, i) => i + 1);
  assert.deepEqual(paginar(lista, 1, 15).items, lista.slice(0, 15));
  const ultima = paginar(lista, 3, 15);
  assert.deepEqual([ultima.pagina, ultima.paginas, ultima.desde, ultima.hasta, ultima.items.length], [3, 3, 31, 37, 7]);
  assert.equal(paginar(lista, 99, 15).pagina, 3, 'una página fuera de rango se ajusta a la última');
  assert.equal(paginar(lista, 0, 15).pagina, 1);
  assert.equal(paginar([], 1).paginas, 1);
});

test('cronómetro', () => {
  assert.equal(fmtCrono(0), '0:00');
  assert.equal(fmtCrono(65_000), '1:05');
  assert.equal(fmtCrono(3_725_000), '1:02:05');
  assert.equal(msCrono({ acum: 5000, desde: null }), 5000);
  assert.ok(msCrono({ acum: 0, desde: Date.now() - 2000 }) >= 2000);
  assert.equal(msCrono(null), 0);
});
