#!/usr/bin/env bash
set -euo pipefail

ROOT="$(pwd)"
TS="$(date +%Y%m%d-%H%M%S)"

echo "== Fix /api/profile (Express mount + Vite proxy) =="
echo "Projekt-Root: $ROOT"

# --- Helper: backup
backup_file() {
  local f="$1"
  cp -a "$f" "$f.bak.$TS"
  echo "Backup: $f -> $f.bak.$TS"
}

# --- 1) Backend finden
BACKEND_DIR=""
if [[ -d "$ROOT/backend" ]]; then
  BACKEND_DIR="$ROOT/backend"
elif [[ -d "$ROOT/server" ]]; then
  BACKEND_DIR="$ROOT/server"
else
  # heuristisch: suche Ordner mit package.json + express
  CAND="$(find "$ROOT" -maxdepth 2 -type f -name package.json -print0 | xargs -0 -I{} dirname {} | head -n 10 | tr '\n' ' ')"
  for d in $CAND; do
    if grep -qi '"express"' "$d/package.json" 2>/dev/null; then
      BACKEND_DIR="$d"
      break
    fi
  done
fi

if [[ -z "$BACKEND_DIR" ]]; then
  echo "❌ Konnte Backend-Ordner nicht finden. Erwartet ./backend oder ein package.json mit express."
  exit 1
fi

echo "Backend-Ordner: $BACKEND_DIR"

# --- 2) Server-Entry finden (Datei mit app.listen)
SERVER_FILE="$(grep -RIl --exclude-dir=node_modules --include='*.js' --include='*.mjs' --include='*.cjs' 'app\.listen' "$BACKEND_DIR" | head -n 1 || true)"
if [[ -z "$SERVER_FILE" ]]; then
  SERVER_FILE="$(grep -RIl --exclude-dir=node_modules --include='*.js' --include='*.mjs' --include='*.cjs' 'listen\(' "$BACKEND_DIR" | head -n 1 || true)"
fi

if [[ -z "$SERVER_FILE" ]]; then
  echo "❌ Konnte keine Server-Datei finden (kein app.listen)."
  exit 1
fi

echo "Server-Datei: $SERVER_FILE"

# --- 3) profile router Datei finden (profile.js)
PROFILE_ROUTER_FILE="$(find "$ROOT" -type f -name 'profile.js' -not -path '*/node_modules/*' | head -n 1 || true)"
if [[ -z "$PROFILE_ROUTER_FILE" ]]; then
  echo "❌ Konnte profile.js nicht finden. Stelle sicher, dass dein Router existiert."
  exit 1
fi
echo "Gefundener profile-Router: $PROFILE_ROUTER_FILE"

# --- 4) Router Import-Pfad relativ zum Server bestimmen
# wir wollen import profileRouter from "<relpath>"
relpath() {
  python3 - <<PY
import os,sys
base=os.path.dirname(sys.argv[1])
target=sys.argv[2]
print(os.path.relpath(target, base).replace(os.sep,'/'))
PY
}
REL_PROFILE_PATH="$(relpath "$SERVER_FILE" "$PROFILE_ROUTER_FILE")"
# ensure it starts with ./ or ../
if [[ "$REL_PROFILE_PATH" != ./* && "$REL_PROFILE_PATH" != ../* ]]; then
  REL_PROFILE_PATH="./$REL_PROFILE_PATH"
fi
echo "Relativer Importpfad: $REL_PROFILE_PATH"

# --- 5) Backend-Port grob auslesen (default 5000)
PORT="5000"
# naive extraction: app.listen(XXXX
PORT_GUESS="$(perl -ne 'if(/app\.listen\s*\(\s*(\d+)/){print $1; exit}' "$SERVER_FILE" || true)"
if [[ -n "$PORT_GUESS" ]]; then PORT="$PORT_GUESS"; fi
echo "Backend-Port (guess): $PORT"

# --- 6) Express mount + import einfügen (ESM oder CJS)
backup_file "$SERVER_FILE"

CONTENT="$(cat "$SERVER_FILE")"

# Detect module style
IS_ESM="0"
if echo "$CONTENT" | grep -Eq '^\s*import\s+.*from\s+["'\'']'; then
  IS_ESM="1"
fi

IMPORT_LINE_ESM="import profileRouter from \"${REL_PROFILE_PATH}\";"
IMPORT_LINE_CJS="const profileRouter = require(\"${REL_PROFILE_PATH}\");"

MOUNT_LINE='app.use("/api/profile", profileRouter);'

# Add import if missing
if echo "$CONTENT" | grep -q 'profileRouter'; then
  echo "✅ profileRouter Import scheint schon vorhanden."
else
  echo "➕ Füge profileRouter Import hinzu…"
  if [[ "$IS_ESM" == "1" ]]; then
    # insert after last import line
    perl -0777 -i -pe "s/^(.*?(?:^\\s*import[^\\n]*\\n)+)/\$1$IMPORT_LINE_ESM\\n/m" "$SERVER_FILE"
  else
    # insert near top (after require lines if any)
    perl -0777 -i -pe "s/^(\\s*(?:const|var|let)\\s+[^=]+\\s*=\\s*require\\([^\\n]*\\)\\s*;\\s*\\n)+/\$&$IMPORT_LINE_CJS\\n/m" "$SERVER_FILE" \
      || perl -0777 -i -pe "s/^/$(printf '%s\n' "$IMPORT_LINE_CJS" | sed 's/[\/&]/\\&/g')\\n/" "$SERVER_FILE"
  fi
fi

# Add mount line if missing
CONTENT2="$(cat "$SERVER_FILE")"
if echo "$CONTENT2" | grep -q 'app\.use\(["'\'']\/api\/profile'; then
  echo "✅ /api/profile scheint schon gemountet."
else
  echo "➕ Füge app.use(\"/api/profile\", profileRouter) hinzu…"
  # insert before app.listen
  perl -0777 -i -pe "s/(\\n\\s*app\\.listen\\s*\\()/(\\n$MOUNT_LINE\\n\\n\\s*app.listen\\(/m" "$SERVER_FILE"
fi

echo "✅ Backend: Route /api/profile sollte jetzt existieren."

# --- 7) Vite Proxy setzen (falls vite.config.* existiert)
VITE_CFG=""
if [[ -f "$ROOT/vite.config.js" ]]; then VITE_CFG="$ROOT/vite.config.js"; fi
if [[ -f "$ROOT/vite.config.mjs" ]]; then VITE_CFG="$ROOT/vite.config.mjs"; fi
if [[ -f "$ROOT/vite.config.ts" ]]; then VITE_CFG="$ROOT/vite.config.ts"; fi

if [[ -n "$VITE_CFG" ]]; then
  echo "Vite Config gefunden: $VITE_CFG"
  backup_file "$VITE_CFG"
  CFG="$(cat "$VITE_CFG")"

  if echo "$CFG" | grep -q 'proxy' && echo "$CFG" | grep -q '"/api"'; then
    echo "✅ Vite proxy für /api scheint schon vorhanden."
  else
    echo "➕ Füge Vite proxy (/api -> http://localhost:$PORT) hinzu…"
    # very pragmatic patch:
    # - if defineConfig exists and server block exists: inject proxy
    # - else create/append server block
    if echo "$CFG" | grep -q 'defineConfig' && echo "$CFG" | grep -q 'server\s*:\s*{'; then
      perl -0777 -i -pe "s/server\\s*:\\s*\\{\\s*/server: {\\n    proxy: {\\n      \\/api: 'http:\\/\\/localhost:$PORT',\\n    },\\n    /s" "$VITE_CFG"
    elif echo "$CFG" | grep -q 'defineConfig' && echo "$CFG" | grep -q 'export default'; then
      # inject a server block inside defineConfig({...})
      perl -0777 -i -pe "s/defineConfig\\(\\{\\s*/defineConfig({\\n  server: {\\n    proxy: {\\n      \\/api: 'http:\\/\\/localhost:$PORT',\\n    },\\n  },\\n/s" "$VITE_CFG"
    else
      echo "⚠️ Konnte Vite Config nicht sauber patchen. Bitte manuell proxy setzen."
    fi
  fi
else
  echo "ℹ️ Keine vite.config.* gefunden – Proxy wurde nicht gesetzt."
fi

# --- 8) Test-Hinweise
cat <<EOF

== Nächste Schritte ==
1) Backend starten (im Backend-Ordner):
   cd "$BACKEND_DIR"
   npm install
   npm run dev  # oder npm start

2) In einem 2. Terminal testen:
   curl -i http://localhost:$PORT/api/profile

Wenn hier NICHT mehr 'Cannot GET /api/profile' kommt, ist der 404-Fix done.
EOF

