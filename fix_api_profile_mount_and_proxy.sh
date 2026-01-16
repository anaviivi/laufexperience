#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
ROOT="$(pwd)"

backup() {
  local f="$1"
  cp -a "$f" "$f.bak.$TS"
  echo "Backup: $f -> $f.bak.$TS"
}

echo "== 1) Backend (Express) finden =="

BACKEND_DIR=""

# typische Ordnernamen
for d in "$ROOT/backend" "$ROOT/server" "$ROOT/api"; do
  if [[ -f "$d/package.json" ]] && grep -qi '"express"' "$d/package.json"; then
    BACKEND_DIR="$d"
    break
  fi
done

# fallback: finde package.json (maxdepth 3) die express enthält
if [[ -z "$BACKEND_DIR" ]]; then
  while IFS= read -r p; do
    if grep -qi '"express"' "$p"; then
      BACKEND_DIR="$(dirname "$p")"
      break
    fi
  done < <(find "$ROOT" -maxdepth 3 -name package.json -not -path "*/node_modules/*")
fi

if [[ -z "$BACKEND_DIR" ]]; then
  echo "❌ Konnte kein Backend finden (kein package.json mit express)."
  exit 1
fi

echo "✅ Backend: $BACKEND_DIR"

echo "== 2) Server-Datei finden (app.listen) =="

SERVER_FILE="$(grep -RIl --exclude-dir=node_modules --include='*.js' --include='*.mjs' --include='*.cjs' 'app\.listen' "$BACKEND_DIR" | head -n 1 || true)"
if [[ -z "$SERVER_FILE" ]]; then
  # fallback: listen(
  SERVER_FILE="$(grep -RIl --exclude-dir=node_modules --include='*.js' --include='*.mjs' --include='*.cjs' 'listen\s*\(' "$BACKEND_DIR" | head -n 1 || true)"
fi

if [[ -z "$SERVER_FILE" ]]; then
  echo "❌ Konnte keine Server-Datei finden (kein app.listen)."
  exit 1
fi

echo "✅ Server: $SERVER_FILE"

echo "== 3) profile router finden (profile.js) =="

PROFILE_ROUTER_FILE="$(find "$ROOT" -type f -name 'profile.js' -not -path '*/node_modules/*' | head -n 1 || true)"
if [[ -z "$PROFILE_ROUTER_FILE" ]]; then
  echo "❌ profile.js nicht gefunden. (Dein Router heißt evtl. anders?)"
  exit 1
fi

echo "✅ profile router: $PROFILE_ROUTER_FILE"

echo "== 4) Relativen Importpfad berechnen =="

REL_PROFILE_PATH="$(python3 - <<PY
import os,sys
server=sys.argv[1]
router=sys.argv[2]
base=os.path.dirname(server)
rel=os.path.relpath(router, base).replace(os.sep,'/')
if not (rel.startswith('./') or rel.startswith('../')):
    rel='./'+rel
print(rel)
PY
"$SERVER_FILE" "$PROFILE_ROUTER_FILE")"

echo "✅ rel import: $REL_PROFILE_PATH"

echo "== 5) Backend Port erraten (default 5000) =="

PORT="5000"
PORT_GUESS="$(perl -ne 'if(/app\.listen\s*\(\s*(\d+)/){print $1; exit}' "$SERVER_FILE" 2>/dev/null || true)"
if [[ -n "${PORT_GUESS:-}" ]]; then PORT="$PORT_GUESS"; fi
echo "✅ Backend-Port (guess): $PORT"

echo "== 6) Express mount einfügen (/api/profile) =="

backup "$SERVER_FILE"

CONTENT="$(cat "$SERVER_FILE")"

# ESM vs CJS grob erkennen
IS_ESM="0"
if echo "$CONTENT" | grep -Eq '^\s*import\s+.*from\s+["'\'']'; then
  IS_ESM="1"
fi

IMPORT_ESM="import profileRouter from \"${REL_PROFILE_PATH}\";"
IMPORT_CJS="const profileRouter = require(\"${REL_PROFILE_PATH}\");"
MOUNT_LINE='app.use("/api/profile", profileRouter);'

# Import hinzufügen falls nicht vorhanden
if ! echo "$CONTENT" | grep -q 'profileRouter'; then
  echo "➕ Import profileRouter hinzufügen …"
  if [[ "$IS_ESM" == "1" ]]; then
    # nach letztem import einfügen
    perl -0777 -i -pe "s/^((?:\\s*import[^\\n]*\\n)+)/\$1$IMPORT_ESM\\n/m" "$SERVER_FILE"
  else
    # oben einfügen
    perl -0777 -i -pe "s/^/$IMPORT_CJS\\n/" "$SERVER_FILE"
  fi
else
  echo "✅ profileRouter Import scheint schon da."
fi

# Mount hinzufügen falls nicht vorhanden
CONTENT2="$(cat "$SERVER_FILE")"
if ! echo "$CONTENT2" | grep -q 'app\.use\(["'\'']\/api\/profile'; then
  echo "➕ Mount app.use(\"/api/profile\", profileRouter) hinzufügen …"
  # vor app.listen einfügen
  perl -0777 -i -pe "s/(\\n\\s*app\\.listen\\s*\\()/(\\n$MOUNT_LINE\\n\\n\\s*app.listen\\(/m" "$SERVER_FILE"
else
  echo "✅ /api/profile Mount scheint schon da."
fi

echo "✅ Backend Route gemountet."

echo "== 7) Vite Proxy setzen (falls vite.config.* existiert) =="

VITE_CFG=""
for f in "$ROOT/vite.config.js" "$ROOT/vite.config.mjs" "$ROOT/vite.config.ts"; do
  if [[ -f "$f" ]]; then VITE_CFG="$f"; break; fi
done

if [[ -n "$VITE_CFG" ]]; then
  echo "✅ Vite config: $VITE_CFG"
  backup "$VITE_CFG"

  CFG="$(cat "$VITE_CFG")"

  if echo "$CFG" | grep -q 'proxy' && echo "$CFG" | grep -q "'/api'\|\"/api\""; then
    echo "✅ Proxy für /api ist bereits vorhanden."
  else
    echo "➕ Proxy /api -> http://localhost:$PORT einfügen …"

    # Versuch 1: server:{} existiert
    if echo "$CFG" | grep -q 'server\s*:\s*{'; then
      perl -0777 -i -pe "s/server\\s*:\\s*\\{\\s*/server: {\\n    proxy: {\\n      '\\/api': 'http:\\/\\/localhost:$PORT',\\n    },\\n    /s" "$VITE_CFG"
    else
      # Versuch 2: defineConfig({ ... }) existiert, aber kein server
      if echo "$CFG" | grep -q 'defineConfig'; then
        perl -0777 -i -pe "s/defineConfig\\(\\{\\s*/defineConfig({\\n  server: {\\n    proxy: {\\n      '\\/api': 'http:\\/\\/localhost:$PORT',\\n    },\\n  },\\n/s" "$VITE_CFG"
      else
        echo "⚠️ Konnte Vite config nicht sicher patchen. Bitte manuell setzen."
      fi
    fi
  fi
else
  echo "ℹ️ Keine vite.config.* gefunden – Proxy Schritt übersprungen."
fi

echo
echo "== 8) Nächste Schritte / Tests =="
echo "1) Backend starten:"
echo "   cd \"$BACKEND_DIR\""
echo "   npm install"
echo "   npm run dev || npm start"
echo
echo "2) In NEUEM Terminal testen (Backend direkt):"
echo "   curl -i http://localhost:$PORT/api/profile"
echo "   curl -i http://localhost:$PORT/api/profile/runlog"
echo
echo "3) Frontend neu starten (falls Vite Proxy geändert):"
echo "   npm run dev"
echo
echo "Wenn curl jetzt NICHT mehr 'Cannot GET /api/profile' zeigt, ist der 404 weg ✅"
