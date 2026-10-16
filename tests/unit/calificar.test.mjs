// Calificador de respuestas escritas: tolera acentos, artículos, errores de dedo y sinónimos; no acepta sustituciones.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluar, normalizar, fichas, sinParentesis, variantesDe, mascara } from '../../src/js/calificar.js';

const v = (respuesta, alias = []) => variantesDe({ respuesta, alias });

test('normaliza acentos, mayúsculas y signos', () => {
  assert.equal(normalizar('¡Júpiter, el GRANDE!'), 'jupiter el grande');
  assert.equal(normalizar('O−'), 'o negativo');
  assert.equal(normalizar('π'), 'pi');
});

test('convierte números escritos y quita artículos', () => {
  assert.deepEqual(fichas('El ocho de marzo'), ['8', 'marzo']);
  assert.deepEqual(fichas('Cinco'), ['5']);
});

const CASOS = [
  // [respuesta del alumno, respuesta de la guía, alias, ¿correcta?, ¿casi?]
  ['miguel hidalgo', 'Miguel Hidalgo y Costilla', ['Hidalgo'], true],
  ['HIDALGO', 'Miguel Hidalgo y Costilla', ['Hidalgo'], true],
  ['1810', '1810', [], true],
  ['1811', '1810', [], false],
  ['o-', 'O negativo (O−)', ['O-'], true],
  ['o positivo', 'O negativo (O−)', [], false, true],
  ['pacifico y atlantico', 'Océano Pacífico y Océano Atlántico', [], true],
  ['puebla', 'Entre Puebla, Morelos y el Estado de México', [], false, true],
  ['cinco', 'Cinco', [], true],
  ['5', 'Cinco', [], true],
  ['3,14', '3.14', [], true],
  ['x', 'X', ['Twitter'], true],
  ['twitter', 'X', ['Twitter'], true],
  ['perseverancia', 'Perseverance', [], true],
  ['saint exupery', 'Antoine de Saint-Exupéry', ['Saint-Exupéry'], true],
  ['saintexupery', 'Antoine de Saint-Exupéry', ['Saint-Exupéry'], true],
  ['garcia marques', 'Gabriel García Márquez', ['García Márquez'], true],
  ['rio', 'El Río Bravo', ['Bravo'], false, true],
  ['ocho de marzo', 'El 8 de marzo', [], true],
  ['verde rojo blanco', 'Verde, blanco y rojo', [], true],
  ['qatar', 'Catar (Qatar)', ['Qatar'], true],
  // Sustituciones: no se aceptan (error corregido en v1.5.0)
  ['universal service bus', 'Universal Serial Bus', [], false, true],
  ['rojo blanco azul', 'Verde, blanco y rojo', [], false, true],
  ['propiedad asociativa', 'Propiedad conmutativa', [], false, true],
  ['', 'Marte', [], false, false]
];
for (const [alumno, guia, alias, ok, casi = false] of CASOS) {
  test(`«${alumno}» frente a «${guia}» → ${ok ? 'correcta' : casi ? 'casi' : 'incorrecta'}`, () => {
    const r = evaluar(alumno, v(guia, alias));
    assert.equal(r.ok, ok);
    if (!ok) assert.equal(r.casi, casi);
  });
}

test('sinParentesis y máscara de pista', () => {
  assert.equal(sinParentesis('Catar (Qatar)'), 'Catar');
  assert.equal(mascara('Marte'), 'M _ _ _ _');
});
