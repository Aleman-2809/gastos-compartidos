#!/usr/bin/env bash
# Mide Lighthouse en móvil y escritorio sobre el build de producción. Requiere Google Chrome instalado.
# Uso:  npm run build && bash calidad/lighthouse.sh [URL]   (por defecto, un servidor local en :3000)
set -euo pipefail
URL="${1:-http://localhost:3000}"
cd "$(dirname "$0")/informes"
if [ "$URL" = "http://localhost:3000" ]; then
  (cd ../.. && npx next start -p 3000 >/dev/null 2>&1 &) ; sleep 5
fi
for pagina in "" "grupos/ejemplo" "entrar" "unirse"; do
  nombre="$(echo "${pagina:-inicio}" | tr '/' '-')"
  for modo in mobile desktop; do
    flags=(); [ "$modo" = desktop ] && flags=(--preset=desktop)
    npx --yes lighthouse "$URL/$pagina" "${flags[@]}" --quiet --chrome-flags="--headless" \
      --output=html --output=json --output-path="./${nombre}-${modo}"
  done
done
echo "Informes en calidad/informes/. Anota LCP, INP y CLS en CALIDAD.md."
