# Lobitos · Trivia Master

Desarrollado por el **Ing. Luis Angel Díaz Bernal**.

Aplicación web de estudio para preparar el concurso **LoboSabio**: preguntas de opción múltiple contra reloj y práctica guiada hasta dominar las 70 preguntas de la guía.

Todo vive en un solo archivo: **`index.html`** (HTML5 + Tailwind CSS por CDN + JavaScript sin frameworks). Ábrelo en el navegador y ya funciona. Arranca en **modo oscuro**; el botón del encabezado cambia a modo claro y la elección se recuerda.

**Tamaños de pantalla:** probada en celulares de 320×568 a 430×932. En pantallas bajas la interfaz se compacta y el resultado se muestra en una sola línea, de modo que la pregunta y las tres opciones siempre quedan a la vista.

**Estilo iOS:** fuente del sistema (San Francisco en iPhone y Mac), encabezado translúcido, listas agrupadas, interruptores y controles segmentados. En el celular la navegación es una barra de pestañas abajo. Al responder, la pantalla no se mueve: el resultado y el botón «Siguiente» aparecen en una barra fija abajo, sin tapar la pregunta ni las opciones. El nombre del desarrollador aparece fijo al final de cada pantalla.

## Instalar en el celular (iPhone y Android)

Lobitos es una **app web instalable (PWA)**: se agrega a la pantalla de inicio con su propio ícono, abre a pantalla completa sin barra del navegador y funciona **sin internet** después de la primera visita.

- **iPhone / iPad:** abre la dirección en **Safari** → botón **Compartir** → **Agregar a pantalla de inicio**.
- **Android:** abre la dirección en **Chrome** → menú **⋮** → **Instalar app**. Si Chrome ofrece el aviso de instalación, la fila «Instalar en tu celular» del inicio lo abre directamente.

Para instalarla, la app tiene que estar publicada en una dirección **https**. Con GitHub Pages:

1. En GitHub abre **Settings → Pages**.
2. En **Build and deployment** elige **Deploy from a branch**, rama **main**, carpeta **/ (root)** y guarda.
3. En un par de minutos queda en `https://code-reset.github.io/Lobosabio-alisson/`. Abre esa dirección en el celular e instálala.

Archivos de la PWA: `manifest.webmanifest` (nombre, colores e íconos), `sw.js` (guarda la app para usarla sin conexión) e `icons/` (ícono de 192 y 512 px, versión adaptable para Android, ícono de Apple de 180 px y favicon). Al publicar una versión nueva, cambia `VERSION` en `sw.js` para que los teléfonos descarguen la actualización.

## Forma de responder

Por defecto se responde con **opciones A · B · C**: botones grandes que no abren el teclado del celular. En computadora también puedes usar las teclas **A/B/C** o **1/2/3**. En cada modo hay un selector **Opciones A·B·C / Escribir** por si prefieres teclear la respuesta; la app recuerda tu elección.

- Cada pregunta de la guía trae 3 distractores escritos a mano (`distractores`), del mismo tipo que la respuesta (años con años, personajes con personajes). En cada ronda salen 2 al azar, así que las opciones cambian.
- Para los documentos que subas, los distractores se generan solos a partir de otras respuestas del mismo tipo, y las fechas y números se generan cercanos al correcto.

## Modos de juego

| Modo | Qué hace |
|---|---|
| **Modo Concurso** | Ronda relámpago de 5 a 30 preguntas contra reloj (10/15/20 s). Puntos base + bono por velocidad, y la racha multiplica (×1.5 desde 3 aciertos, ×2 desde 5). Eliminación opcional con 3 strikes. Al final muestra los errores con la respuesta correcta. |
| **Modo Estudio** | Práctica guiada con retroalimentación explícita (tu respuesta, la respuesta de la guía, sinónimos aceptados y notas), tarjetas que se voltean, repaso de errores y la guía completa con buscador. |

Una pregunta queda **dominada** cuando la contestas bien dos veces seguidas. La pantalla de inicio muestra el porcentaje dominado por categoría y te sugiere la más débil. En el concurso y la práctica salen primero las preguntas nuevas o falladas.

Si el calificador rechaza un sinónimo válido, el botón **«Mi respuesta era correcta»** corrige el resultado. La comparación ignora acentos, mayúsculas y artículos, acepta errores de dedo pequeños y convierte números escritos («cinco» → 5).

## Documentos

En la sección **Documentos** puedes subir **PDF, DOCX, TXT** o un **JSON** del banco, o pegar texto. Todo se procesa en el navegador (pdf.js y mammoth se cargan bajo demanda). El lector reconoce:

```
2. Geografía                  ← encabezado de categoría (numerado, en MAYÚSCULAS o con «:»)
1. ¿Cuál es la capital de Yucatán?
       Mérida.                ← respuesta en la línea siguiente
P: ¿Pregunta?  R: Respuesta   ← formato alterno
Fotosíntesis: proceso por…    ← definición; se convierte en pregunta
```

También asigna puntos y extrae un índice de conceptos. Antes de agregar el documento puedes revisar la vista previa y quitar preguntas. Si subes el PDF original de la guía, salen sus 7 categorías y 70 preguntas.

El progreso, los documentos subidos y los récords se guardan en el `localStorage` de cada navegador.

## Estructura de datos

El banco base está dentro de `index.html` (`<script type="application/json" id="banco-base">`) y también en [`data/banco-lobosabio.json`](data/banco-lobosabio.json):

```jsonc
{
  "version": 1,
  "fuente": { "titulo": "...", "archivo": "LOBOSABIO_261015_185928.pdf", "paginas": 5 },
  "categorias": [{
    "id": "historia", "codigo": "HIS", "nombre": "Historia de México",
    "preguntas": [{
      "id": "his-01",
      "pregunta": "¿En qué año inició la Independencia de México?",
      "respuesta": "1810",            // respuesta oficial de la guía
      "alias": ["mil ochocientos diez"], // otras formas aceptadas al escribir
      "distractores": ["1821", "1910", "1800"], // opciones incorrectas A·B·C
      "puntos": 100,                   // relevancia 20–100: puntos base en el concurso
      "nota": "..."                    // opcional: aclaración que se muestra al revisar
    }]
  }]
}
```

Contenido: 7 categorías × 10 preguntas = 70 preguntas, cada una con 3 opciones incorrectas escritas a mano.

Algunas preguntas tienen una **nota**. La respuesta oficial de la guía se respeta, pero en los datos discutibles se agrega contexto (por ejemplo, La Paz frente a Sucre, o el Bravo frente al Lerma-Santiago) para que no te tomen por sorpresa.

## Marca

`assets/logo-lobitos.svg`: escudo guinda con marco dorado, un lobo de facetas con una red de nodos en la frente, un destello y una barra de respuestas 100 / 80 / 60, al estilo de un tablero de trivia. Es animado: los nodos laten y, al pasar el cursor, la red se dibuja y los ojos brillan. Dentro de la app, el logo también responde al clic.
