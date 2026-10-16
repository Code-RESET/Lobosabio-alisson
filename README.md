# LoboQuiz UAD · Lobos UAD Trivia Master

Aplicación web de estudio gamificada para preparar el concurso universitario **LoboSabio** de la Universidad Autónoma de Durango. Funciona como *100 Mexicanos Dijeron*: las respuestas están ocultas en un tablero, ordenadas por puntos, y tres strikes terminan la ronda.

Todo vive en un solo archivo: **`index.html`** (HTML5 + Tailwind CSS por CDN + JavaScript sin frameworks). Ábrelo en el navegador y ya funciona.

## Modos de juego

| Modo | Qué hace |
|---|---|
| **Tablero Lobo** | Tableros de 5 casillas por categoría (cada casilla es una pregunta de la guía, de 100 a 20 pts) y **Encuestas Lobo** de respuesta múltiple (los puntos suman 100). Strikes, temporizador opcional (15/30/45 s), pista que cuesta la mitad de los puntos, aviso de «casi» sin strike. |
| **Concurso UAD** | Ronda relámpago de 5 a 30 preguntas contra reloj (10/15/20 s). Puntos base + bono por velocidad, y la racha multiplica (×1.5 desde 3 aciertos, ×2 desde 5). Eliminación opcional con 3 strikes. Al final muestra los errores con la respuesta correcta. |
| **Modo Estudio** | Práctica guiada con retroalimentación explícita (tu respuesta, la respuesta de la guía, sinónimos aceptados y notas), tarjetas que se voltean, repaso de errores y la guía completa con buscador. |

Una pregunta queda **dominada** cuando la contestas bien dos veces seguidas. La pantalla de inicio muestra el porcentaje dominado por categoría y te sugiere la más débil. En los tableros y la práctica salen primero las preguntas nuevas o falladas.

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

También asigna puntos, extrae un índice de conceptos y genera una encuesta por cada categoría que tenga 4 preguntas o más. Antes de agregar el documento puedes revisar la vista previa y quitar preguntas. Si subes el PDF original de la guía, salen sus 7 categorías y 70 preguntas.

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
      "alias": ["mil ochocientos diez"], // otras formas aceptadas
      "puntos": 100,                   // relevancia 20–100: orden en el tablero
      "nota": "..."                    // opcional: aclaración que se muestra al revisar
    }]
  }],
  "encuestas": [{
    "id": "enc-01", "categoria": "historia",
    "pregunta": "Menciona un personaje de la Historia de México que aparezca en la guía",
    "respuestas": [{ "texto": "Miguel Hidalgo", "alias": ["Hidalgo"], "puntos": 34, "ref": "his-02" }]
  }]
}
```

Contenido: 7 categorías × 10 preguntas = 70 preguntas, y 10 encuestas armadas con las respuestas de la guía.

Algunas preguntas tienen una **nota**. La respuesta oficial de la guía se respeta, pero en los datos discutibles se agrega contexto (por ejemplo, La Paz frente a Sucre, o el Bravo frente al Lerma-Santiago) para que no te tomen por sorpresa.

## Marca

`assets/logo-loboquiz.svg`: escudo guinda con marco dorado, un lobo de facetas con una red de nodos en la frente, un destello y una barra de respuestas 100 / 80 / 60, al estilo de un tablero de trivia. Es animado: los nodos laten y, al pasar el cursor, la red se dibuja y los ojos brillan. Dentro de la app, el logo también responde al clic.
