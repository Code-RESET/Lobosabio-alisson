// Pruebas de punta a punta en Chromium: la app construida (index.html) usada como lo haría una persona.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { servir, abrir, cerrarNavegador, respuestaCorrecta, copiaPublicable } from './ayuda.mjs';

let srv;
before(async () => { srv = await servir(await copiaPublicable()); });
after(async () => { await srv.cerrar(); await cerrarNavegador(); });

const sinDesborde = p => p.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('carga sin errores, con las 5 pestañas y la versión', async () => {
  const { pagina, ctx, errores } = await abrir(srv.url);
  const tabs = await pagina.$$eval('#nav-movil .tab', t => t.map(x => x.innerText.trim()));
  assert.deepEqual(tabs, ['Inicio', 'Concurso', 'Estudio', 'Cultura', 'Documentos']);
  for (const v of ['concurso', 'estudio', 'cultura', 'documentos', 'inicio']) {
    await pagina.click(`#nav-movil [data-vista="${v}"]`);
    assert.ok(await pagina.isVisible(`#v-${v}`), v);
  }
  assert.match(await pagina.innerText('[data-accion="actualizar"]'), /v\d+\.\d+\.\d+/);
  assert.match(await pagina.innerText('footer'), /Ing\. Luis Angel Díaz Bernal/);
  assert.deepEqual(errores, []);
  await ctx.close();
});

test('Modo Concurso: ronda completa con opciones A·B·C, cronómetro y resultados', async () => {
  const { pagina, ctx, errores } = await abrir(srv.url);
  await pagina.click('#nav-movil [data-vista="concurso"]');
  await pagina.selectOption('#cfg-cq-num', '5');
  await pagina.click('[data-accion="iniciar-concurso"]');
  for (let i = 0; i < 5; i++) {
    const q = await respuestaCorrecta(pagina, 'concurso');
    const textos = await pagina.$$eval('#v-concurso .opcion', o => o.map(x => x.innerText.slice(1).trim()));
    const idx = textos.findIndex(t => t === q.respuesta.replace(/\s*\([^)]*\)/g, '').trim());
    assert.ok(idx >= 0, `la respuesta correcta aparece entre las opciones: ${q.id}`);
    await pagina.click(`#v-concurso .opcion >> nth=${i === 2 ? (idx + 1) % 3 : idx}`); // la tercera se falla a propósito
    await pagina.click('[data-accion="siguiente-cq"]');
  }
  const res = await pagina.innerText('#v-concurso');
  assert.match(res, /4\/5/);
  assert.match(res, /Tiempo total\s*\d+:\d\d/i);
  assert.match(res, /Para repasar/);
  assert.deepEqual(errores, []);
  await ctx.close();
});

test('Modo Concurso: la cuenta regresiva se reanuda al volver de otra pestaña (error corregido)', async () => {
  const { pagina, ctx } = await abrir(srv.url);
  await pagina.click('#nav-movil [data-vista="concurso"]');
  await pagina.selectOption('#cfg-cq-tiempo', '20');
  await pagina.click('[data-accion="iniciar-concurso"]');
  await pagina.click('#nav-movil [data-vista="estudio"]');
  await pagina.waitForTimeout(1200);
  await pagina.click('#nav-movil [data-vista="concurso"]');
  const ancho = () => pagina.$eval('#reloj-cq > span', e => parseFloat(e.style.width));
  await pagina.waitForTimeout(400);
  const a = await ancho();
  await pagina.waitForTimeout(1200);
  const b = await ancho();
  assert.ok(a < 95, `el tiempo que pasó fuera se descuenta (${a}%)`);
  assert.ok(b < a, `la barra sigue bajando (${a}% → ${b}%)`);
  await ctx.close();
});

for (const [ancho, alto] of [[320, 568], [375, 667], [390, 844]]) {
  test(`Estudio ${ancho}×${alto}: responder no mueve la pantalla y el resultado no tapa las opciones`, async () => {
    const { pagina, ctx } = await abrir(srv.url, { ancho, alto });
    await pagina.click('#nav-movil [data-vista="estudio"]');
    await pagina.waitForTimeout(500); // deja terminar la animación de entrada de la pestaña (0.3 s)
    const antes = await pagina.evaluate(() => [scrollY, document.querySelector('#v-estudio .opcion').getBoundingClientRect().top]);
    await pagina.tap('#v-estudio .opcion >> nth=0');
    await pagina.waitForSelector('.accion-fija');
    const despues = await pagina.evaluate(() => {
      const ops = [...document.querySelectorAll('#v-estudio .opcion')];
      return [scrollY, ops[0].getBoundingClientRect().top, ops.at(-1).getBoundingClientRect().bottom, document.querySelector('.accion-fija').getBoundingClientRect().top];
    });
    assert.equal(despues[0], antes[0], 'el desplazamiento no cambia');
    assert.equal(Math.round(despues[1]), Math.round(antes[1]), 'la opción A no se mueve');
    assert.ok(despues[2] <= despues[3], `la opción C (${despues[2]}) queda arriba de la barra de resultado (${despues[3]})`);
    assert.ok(await sinDesborde(pagina));
    await ctx.close();
  });
}

test('tamaños de celular: ninguna página se desborda a lo ancho', async () => {
  for (const ancho of [320, 360, 414, 430]) {
    const { pagina, ctx } = await abrir(srv.url, { ancho, alto: 800 });
    for (const v of ['inicio', 'concurso', 'estudio', 'cultura', 'documentos']) {
      await pagina.click(`#nav-movil [data-vista="${v}"]`);
      assert.ok(await sinDesborde(pagina), `${v} a ${ancho}px`);
    }
    await ctx.close();
  }
});

test('Guía completa paginada: 15 por página, navegación y búsqueda', async () => {
  const { pagina, ctx } = await abrir(srv.url, { ancho: 1280, alto: 900, movil: false });
  await pagina.click('#nav-escritorio [data-vista="estudio"]');
  await pagina.click('[data-accion="tab-estudio"][data-tab="guia"]');
  assert.equal(await pagina.$$eval('#guia-res li', l => l.length), 15);
  assert.match(await pagina.innerText('.paginacion'), /1–15 de 70/);
  await pagina.click('.paginacion [aria-label="Página siguiente"]');
  assert.match(await pagina.innerText('.paginacion'), /16–30 de 70/);
  await pagina.fill('#busca-guia', 'juarez');
  assert.equal(await pagina.$$eval('#guia-res li', l => l.length), 1);
  assert.equal(await pagina.$('.paginacion'), null, 'con un solo resultado no hay paginación');
  await pagina.selectOption('#est-cat', 'grupo:cultura');
  await pagina.fill('#busca-guia', '');
  assert.match(await pagina.innerText('.paginacion'), /1–15 de 110/);
  await ctx.close();
});

test('Cultura: la ronda rápida usa preguntas de cultura general', async () => {
  const { pagina, ctx } = await abrir(srv.url);
  await pagina.click('#nav-movil [data-vista="cultura"]');
  assert.match(await pagina.innerText('#v-cultura'), /110 preguntas/);
  await pagina.click('[data-accion="cultura-ronda"] >> nth=0');
  const q = await respuestaCorrecta(pagina, 'concurso');
  assert.match(q.id, /^cg-/);
  await ctx.close();
});

test('Documentos: un PDF se lee, se pagina la vista previa y se agrega al banco', async () => {
  const { pagina, ctx, errores } = await abrir(srv.url, { ancho: 1280, alto: 900, movil: false });
  // Genera un PDF de prueba con 2 categorías y 20 preguntas usando el propio Chromium.
  const generador = await ctx.newPage();
  const preguntas = n => Array.from({ length: 10 }, (_, i) => `<p>${i + 1}. ¿Pregunta ${n} número ${i + 1}?</p><p>Respuesta ${n} ${i + 1}.</p>`).join('');
  await generador.setContent(`<html><body style="font:14px Arial"><h1>GUIA DE PRUEBA</h1><p>1. Primera parte</p>${preguntas('uno')}<p>2. Segunda parte</p>${preguntas('dos')}</body></html>`);
  const pdf = await generador.pdf({ format: 'Letter' });
  await generador.close();
  await pagina.click('#nav-escritorio [data-vista="documentos"]');
  await pagina.setInputFiles('#archivo', { name: 'prueba.pdf', mimeType: 'application/pdf', buffer: pdf });
  await pagina.waitForSelector('[data-accion="guardar-doc"], .aviso-mal', { timeout: 30000 });
  const vista = await pagina.innerText('#v-documentos');
  assert.match(vista, /2 categorías · 20 preguntas/);
  assert.match(await pagina.innerText('.paginacion'), /1–15 de 20/);
  await pagina.click('.paginacion [aria-label="Página siguiente"]');
  assert.match(await pagina.innerText('.paginacion'), /16–20 de 20/);
  await pagina.click('[data-accion="guardar-doc"]');
  await pagina.click('#nav-escritorio [data-vista="concurso"]');
  assert.match(await pagina.innerText('#cfg-cq-cat'), /Primera parte/);
  assert.deepEqual(errores, []);
  await ctx.close();
});

test('Registro de errores: un fallo inesperado avisa y queda en Diagnóstico', async () => {
  const { pagina, ctx } = await abrir(srv.url);
  await pagina.evaluate(() => setTimeout(() => { throw new Error('Fallo de prueba'); }));
  await pagina.waitForSelector('#aviso-error:not([hidden])');
  await pagina.click('#nav-movil [data-vista="documentos"]');
  assert.match(await pagina.innerText('#v-documentos'), /Fallo de prueba/);
  await pagina.click('[data-accion="borrar-errores"]');
  assert.match(await pagina.innerText('#v-documentos'), /Sin errores registrados/);
  await ctx.close();
});

test('PWA: instalable, service worker activo y funciona sin conexión', async () => {
  const { pagina, ctx } = await abrir(srv.url, { sw: 'allow' });
  await pagina.evaluate(() => navigator.serviceWorker.ready);
  const cdp = await ctx.newCDPSession(pagina);
  const { installabilityErrors } = await cdp.send('Page.getInstallabilityErrors');
  assert.deepEqual(installabilityErrors, []);
  await pagina.reload();
  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await ctx.setOffline(true);
  await pagina.reload();
  await pagina.waitForSelector('#v-inicio .lista');
  await pagina.click('#nav-movil [data-vista="concurso"]');
  await pagina.click('[data-accion="iniciar-concurso"]');
  await pagina.tap('#v-concurso .opcion >> nth=0');
  assert.ok(await pagina.isVisible('.accion-fija'), 'sin conexión se puede jugar');
  await ctx.close();
});

test('Actualizaciones: detecta la versión nueva, la instala y conserva el progreso', async () => {
  const dir = await copiaPublicable();
  const local = await servir(dir);
  const { pagina, ctx } = await abrir(local.url, { sw: 'allow' });
  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await pagina.reload();
  await pagina.evaluate(() => navigator.serviceWorker.ready);
  await pagina.evaluate(() => localStorage.setItem('loboquiz:stats', JSON.stringify({ 'his-01': { v: 2, a: 2, f: 0, r: 2 } })));
  await pagina.click('[data-accion="actualizar"]');
  await pagina.waitForFunction(() => /más reciente/.test(document.querySelector('[data-accion="actualizar"]').innerText));
  // Se publica una versión nueva: cambia el service worker y version.json, como lo hace el flujo con cada commit.
  const sw = await readFile(join(dir, 'sw.js'), 'utf8');
  await writeFile(join(dir, 'sw.js'), sw.replace(/const VERSION = 'lobitos-[^']*'/, "const VERSION = 'lobitos-prueba-nueva'"));
  await writeFile(join(dir, 'version.json'), JSON.stringify({ version: '9.9.9', build: 'nueva' }));
  await pagina.click('[data-accion="actualizar"]');
  await pagina.waitForSelector('text=Hay una versión nueva de Lobitos', { timeout: 15000 });
  assert.ok(await pagina.isVisible('.punto-act'), 'punto rojo en la pestaña Inicio');
  await Promise.all([pagina.waitForEvent('load', { timeout: 15000 }), pagina.click('.aviso [data-accion="actualizar"]')]);
  await pagina.waitForSelector('#v-inicio .lista');
  const caches = await pagina.evaluate(async () => (await caches.keys()).join(','));
  assert.equal(caches, 'lobitos-prueba-nueva', 'queda solo la caché nueva');
  assert.equal(await pagina.evaluate(() => JSON.parse(localStorage.getItem('loboquiz:stats'))['his-01'].r), 2, 'el progreso se conserva');
  await ctx.close();
  await local.cerrar();
});
