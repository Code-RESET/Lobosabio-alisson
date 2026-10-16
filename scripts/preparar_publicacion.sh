#!/bin/bash
# Prepara la carpeta que se publica en GitHub Pages.
#   Uso: scripts/preparar_publicacion.sh <build> <carpeta_destino>
# 1) Copia la app.  2) Compila Tailwind y lo incrusta en index.html (sin depender del CDN).
# 3) Marca la versión con el build para que los celulares detecten la actualización.
set -euo pipefail
BUILD="$1"; D="$2"
RAIZ="$(cd "$(dirname "$0")/.." && pwd)"
rm -rf "$D"; mkdir -p "$D"
cd "$RAIZ"
cp -r index.html manifest.webmanifest sw.js icons assets data "$D/"
printf '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n' > "$D/.tw-entrada.css"
npx --yes tailwindcss@3.4.17 -c tailwind.config.js -i "$D/.tw-entrada.css" -o "$D/.tw.css" --minify
python3 - "$D" <<'PY'
import sys, re
d = sys.argv[1]
html = open(f'{d}/index.html', encoding='utf-8').read()
css = open(f'{d}/.tw.css', encoding='utf-8').read()
# Se quita el CDN y el CSS compilado va al final del <head>, el mismo orden en que lo inserta el CDN.
nuevo, n = re.subn(r'<!-- tailwind:inicio.*?<!-- tailwind:fin -->\n?', '', html, flags=re.S)
assert n == 1, 'no se encontró el bloque de Tailwind'
assert nuevo.count('</head>') == 1
nuevo = nuevo.replace('</head>', '<style id="tailwind">' + css + '</style>\n</head>')
open(f'{d}/index.html', 'w', encoding='utf-8').write(nuevo)
PY
rm -f "$D/.tw-entrada.css" "$D/.tw.css"
sed -i -E "s/const VERSION = 'lobitos-([^']*)'/const VERSION = 'lobitos-\1-${BUILD}'/" "$D/sw.js"
sed -i -E "s/const APP_BUILD = '[^']*'/const APP_BUILD = '${BUILD}'/" "$D/index.html"
grep -q "lobitos-.*-${BUILD}" "$D/sw.js"
grep -q "APP_BUILD = '${BUILD}'" "$D/index.html"
! grep -q "cdn.tailwindcss.com" "$D/index.html"
touch "$D/.nojekyll"
echo "Listo: $D (build ${BUILD})"
