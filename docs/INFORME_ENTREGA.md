# Informe de entrega · Lobitos v1.5.0

**Proyecto:** Lobitos · Trivia Master, app de estudio para el concurso LoboSabio
**Desarrollador:** Ing. Luis Angel Díaz Bernal
**Fecha de revisión:** 16 de octubre de 2026
**Rama revisada:** `ccr-7c847de4-oxm62a`

---

## 1. Resumen

| Aspecto | Estado |
|---|---|
| Funciones | 5 pestañas: Inicio, Concurso, Estudio, Cultura y Documentos. 180 preguntas (70 de la guía + 110 de cultura general). |
| Código | Dividido en 24 módulos de JavaScript, 7 hojas de estilo y 2 bancos de datos. El módulo más grande tiene 201 líneas. |
| Análisis estático (ESLint) | **0 problemas.** |
| Pruebas unitarias | **43 de 43** aprobadas. |
| Pruebas de punta a punta (Chromium) | **13 de 13** aprobadas. |
| Errores encontrados en esta revisión | 9, todos corregidos (sección 4). |
| Vulnerabilidades en la app publicada | 0. Se actualizaron pdf.js y mammoth (sección 5). |
| Estado | **Lista para entregar** después de los 4 pasos de la sección 8. |

---

## 2. Qué se entrega

- **Modo Concurso:**
  - Rondas de 5 a 30 preguntas contra reloj.
  - Bono por velocidad, multiplicador de racha y 3 strikes.
  - Cronómetro de la ronda y resultados con las preguntas falladas.
- **Modo Estudio:**
  - Práctica guiada, tarjetas, repaso de errores y la guía completa con buscador y paginación.
  - Cronómetro de sesión con pausa y reinicio.
- **Cultura general:** 110 preguntas en 11 categorías. Su avance se cuenta aparte del de la guía.
- **Documentos:**
  - Lee PDF, DOCX, TXT y JSON, o texto pegado, todo dentro del navegador.
  - Vista previa paginada, exportación del banco y panel de **Diagnóstico** con los errores registrados.
- **Respuestas con opciones A · B · C:** cada pregunta tiene 3 distractores escritos a mano. El modo «Escribir» es opcional.
- **App instalable (PWA)** en iPhone y Android:
  - Funciona sin internet.
  - Botón **Buscar actualizaciones** y aviso automático cuando hay una versión nueva.
- **Interfaz:** estilo iOS, modo oscuro predeterminado, probada en celulares de 320×568 a 430×932 px.

---

## 3. Arquitectura

```
src/js/main.js            arranque
src/js/vistas/*.js        una página por pestaña; cada una exporta su pintado y sus acciones
src/js/{banco,calificar,opciones,paginacion,reloj,errores,…}.js   lógica reutilizable
src/js/documentos/        lector de PDF/DOCX y parser de guías
src/js/pwa/               instalación y actualizaciones
src/estilos/              CSS por secciones
src/datos/                bancos de preguntas en JSON
scripts/construir.mjs     genera index.html (un solo archivo), sw.js y version.json
```

**Cómo se construye**
- `npm run build` empaqueta los módulos con esbuild, compila Tailwind y genera un `index.html` de **203 KB** (170 KB de JavaScript, incluidos los bancos, y 30 KB de CSS).
- La construcción es determinista: dos corridas producen archivos idénticos.
- La versión tiene una sola fuente: `package.json`.

**Cómo se mantiene**
- Las acciones de los botones (`data-accion`) viven en la página que las usa.
- `eventos.js` las junta y avisa si dos páginas usan el mismo nombre.
- El README explica cómo agregar una pestaña.

**Automatización en GitHub**
- **Pruebas:** en cada cambio y PR corre ESLint, la construcción, las pruebas unitarias y las de punta a punta. También falla si `index.html` no se regeneró después de editar `src/`.
- **Publicar app:** en cada fusión a `main` revisa, construye con el commit y publica en GitHub Pages.

---

## 4. Errores encontrados y corregidos

| # | Gravedad | Error | Cómo se encontró | Corrección | Prueba que lo cubre |
|---|---|---|---|---|---|
| 1 | Alta | **pdf.js 3.11.174** permite ejecutar código desde un PDF malicioso (GHSA-wgrm-67xf-hhpq). La app ya aplicaba la mitigación oficial (`isEvalSupported: false`). | `npm audit` | Actualizado a **pdf.js 4.10.38**, cargado como módulo desde jsDelivr; la mitigación se mantiene. | e2e «Documentos: un PDF se lee…» |
| 2 | Alta | Al dividir en módulos, la página Documentos usaba el banco base (`BASE`) sin importarlo. La lista de documentos habría fallado. | ESLint (`no-undef`), antes de publicar | Importación agregada. | e2e «Documentos» |
| 3 | Media | **Temporizador del concurso:** al cambiar de pestaña a media pregunta y regresar, la cuenta regresiva ya no corría y la pregunta quedaba abierta sin límite. | Revisión de código | El temporizador guarda su hora límite y se reanuda con el tiempo restante al volver. | e2e «la cuenta regresiva se reanuda…» |
| 4 | Media | Calificador (modo Escribir): aceptaba **palabras cambiadas** («Universal Service Bus» por «Universal Serial Bus»). | Prueba unitaria | Faltar palabras se tolera; cambiarlas cuenta como «casi». | `calificar.test.mjs` |
| 5 | Media | Calificador: aceptaba **números distintos** que contienen el correcto («1/2» por «1», «1/8» por «8»). | Prueba de bancos | Las respuestas numéricas exigen exactamente los mismos números. | `bancos.test.mjs` |
| 6 | Media | Calificador: aceptaba **listas incompletas** («Rojo y blanco» por «Verde, blanco y rojo»). | Prueba de bancos | Las enumeraciones con comas exigen todos los elementos. | `bancos.test.mjs` |
| 7 | Baja | Calificador: la tolerancia a errores de dedo anulaba la pregunta de ortografía («Lápizes»). | Prueba de bancos | Campo `exacta` en las preguntas de ortografía. | `bancos.test.mjs` |
| 8 | Baja | La búsqueda de actualizaciones leía la versión del texto del HTML, un método frágil. | Revisión de código | Archivo `version.json`, que el service worker siempre consulta en la red. | e2e «Actualizaciones…» |
| 9 | Baja | Código muerto, estado sin declarar (`verPasos`), banco recalculado en cada consulta y **mammoth 1.6.0** con un aviso de seguridad que solo aplica en Node. | ESLint, revisión de código y `npm audit` | Se eliminó el código muerto, se declaró el estado, se agregó memoria al banco y mammoth pasó a 1.12.3. | ESLint y pruebas unitarias |

---

## 5. Seguridad y dependencias

- **App publicada.** Solo descarga bibliotecas externas cuando alguien sube un documento: pdf.js 4.10.38 y mammoth 1.12.3, desde jsDelivr, con versiones fijas. Ninguna tiene alertas conocidas.
- **Sin servidor.** Nada se envía a internet; el progreso queda en el `localStorage` del navegador.
- **Contenido.** Todo el texto que viene de documentos subidos se escapa antes de mostrarse (`esc()`).
- **Herramientas de desarrollo.** `npm audit` reporta alertas en dependencias internas (`braces`, `tar`, `sprintf-js`, `postcss-selector-parser`) que llegan a través de Tailwind, Playwright y otras herramientas. **No forman parte de la app publicada.** Conviene revisarlas cuando haya versiones nuevas de esas herramientas.

---

## 6. Rendimiento y accesibilidad

**Rendimiento** (celular simulado: CPU 4 veces más lenta y red 4G lenta, promedio de 3 cargas)
- Primer contenido en pantalla: **0.35 s**.
- App lista para usar: **1.5 s**.
- Cambio de pestaña: **0.2 s**.
- Sin conexión, la app abre desde la caché.

**Accesibilidad** (revisión automática de las 5 pestañas)
- Todos los botones, campos e íconos tienen nombre o etiqueta.
- Idioma declarado: español.
- Respeta «reducir movimiento».
- Tiene teclas rápidas: A/B/C y 1/2/3 para las opciones, y espacio para voltear las tarjetas.

**Pantalla fija al responder**
- Comprobado en 320×568, 375×667 y 390×844: la opción A queda en la misma posición, sin desplazamiento.
- La barra de resultado nunca tapa la opción C.

---

## 7. Limitaciones conocidas

1. **Sin pruebas en dispositivos reales.** Las pruebas automáticas usan Chromium con emulación de celular. Falta probar en un iPhone (Safari) y en un Android (Chrome) reales; ver la lista de la sección 8.
2. **El progreso no se sincroniza** entre dispositivos y se pierde si se borran los datos del navegador. Para sincronizarlo haría falta una cuenta y un servidor.
3. **Modo Escribir.** Todavía acepta respuestas que contienen la correcta más otra palabra («Rusia o China»). El modo predeterminado, opciones A·B·C, no tiene este problema.
4. **Documentos subidos.** Sus distractores se generan solos y son menos finos que los escritos a mano. La lectura de **DOCX** no tiene prueba automática; la de PDF y texto sí.
5. **GitHub Pages en repositorios privados** puede requerir un plan de pago.
6. **Contenido.** Algunas respuestas de la guía son discutibles (La Paz/Sucre, río Bravo, idioma más hablado). Se respeta la respuesta oficial y se agrega una nota. Conviene que alguien revise las 110 preguntas de cultura general antes de usarlas en clase.

---

## 8. Lista de verificación antes de entregar

- [ ] **Fusionar** la rama a `main`.
- [ ] En GitHub, **Settings → Pages → Source: GitHub Actions** (una sola vez).
- [ ] Confirmar que los flujos **Pruebas** y **Publicar app** salen en verde en la pestaña *Actions*.
- [ ] Abrir `https://code-reset.github.io/Lobosabio-alisson/` en un **iPhone** y en un **Android**. En cada uno:
  - [ ] Instalar en la pantalla de inicio (Safari: Compartir → Agregar a pantalla de inicio; Chrome: ⋮ → Instalar app).
  - [ ] Jugar una ronda del Modo Concurso y una práctica de Estudio.
  - [ ] Activar el modo avión y volver a abrir la app: debe funcionar sin internet.
  - [ ] Subir el PDF de la guía en Documentos: deben salir 7 categorías y 70 preguntas.
  - [ ] Revisar Documentos → Diagnóstico: «Sin errores registrados».
- [ ] Confirmar el nombre **Lobitos** y el uso de «LoboSabio», que es el nombre del concurso en la guía.

---

## 9. Cómo correr la revisión de nuevo

```bash
npm install
npx playwright install chromium
npm run verificar      # ESLint + construcción + 43 pruebas unitarias + 13 de punta a punta (≈ 20 s)
```
