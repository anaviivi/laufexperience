#!/usr/bin/env bash
set -euo pipefail
TS="$(date +%Y%m%d-%H%M%S)"
ROOT="$(pwd)"

backup(){ cp -a "$1" "$1.bak.$TS"; echo "Backup: $1 -> $1.bak.$TS"; }

echo "== 1) Finde Backend-Serverdatei (app.listen) =="
SERVER_FILE="$(grep -RIl --exclude-dir=node_modules --include='*.js' --include='*.mjs' --include='*.cjs' 'app\.listen' "$ROOT" | head -n 1 || true)"
if [[ -z "$SERVER_FILE" ]]; then
  echo "❌ Keine Datei mit app.listen gefunden."
  exit 1
fi
echo "✅ Server: $SERVER_FILE"

echo "== 2) Finde profile router Datei (profile.js) =="
PROFILE_ROUTER_FILE="$(find "$ROOT" -type f -name 'profile.js' -not -path '*/node_modules/*' | head -n 1 || true)"
if [[ -z "$PROFILE_ROUTER_FILE" ]]; then
  echo "❌ profile.js nicht gefunden."
  exit 1
fi
echo "✅ Router: $PROFILE_ROUTER_FILE"

echo "== 3) Berechne relativen Importpfad =="
REL_PROFILE_PATH="$(python3 - <<PY
import os,sys
server=sys.argv[1]; router=sys.argv[2]
base=os.path.dirname(server)
rel=os.path.relpath(router, base).replace(os.sep,'/')
if not (rel.startswith('./') or rel.startswith('../')): rel='./'+rel
print(rel)
PY
"$SERVER_FILE" "$PROFILE_ROUTER_FILE")"
echo "✅ Importpfad: $REL_PROFILE_PATH"

echo "== 4) Patche Server: Import + app.use('/api/profile', ...) =="
backup "$SERVER_FILE"
CONTENT="$(cat "$SERVER_FILE")"

# Detect ESM
IS_ESM="0"
if echo "$CONTENT" | grep -Eq '^\s*import\s+.*from\s+["'\'']'; then IS_ESM="1"; fi

IMPORT_ESM="import profileRouter from \"${REL_PROFILE_PATH}\";"
IMPORT_CJS="const profileRouter = require(\"${REL_PROFILE_PATH}\");"
MOUNT_LINE='app.use("/api/profile", profileRouter);'

# Import hinzufügen falls fehlt
if ! echo "$CONTENT" | grep -q 'profileRouter'; then
  echo "➕ Füge profileRouter Import hinzu…"
  if [[ "$IS_ESM" == "1" ]]; then
    if echo "$CONTENT" | grep -Eq '^\s*import\s'; then
      perl -0777 -i -pe "s/^((?:\\s*import[^\\n]*\\n)+)/\$1$IMPORT_ESM\\n/m" "$SERVER_FILE"
    else
      perl -0777 -i -pe "s/^/$IMPORT_ESM\\n/" "$SERVER_FILE"
    fi
  else
    perl -0777 -i -pe "s/^/$IMPORT_CJS\\n/" "$SERVER_FILE"
  fi
else
  echo "✅ profileRouter Import scheint schon vorhanden."
fi

# Mount hinzufügen falls fehlt
CONTENT2="$(cat "$SERVER_FILE")"
if ! echo "$CONTENT2" | grep -q 'app\.use\(["'\'']\/api\/profile'; then
  echo "➕ Füge Mount /api/profile hinzu…"
  perl -0777 -i -pe "s/(\\n\\s*app\\.listen\\s*\\()/(\\n$MOUNT_LINE\\n\\n\\s*app.listen\\(/m" "$SERVER_FILE"
else
  echo "✅ /api/profile ist schon gemountet."
fi

echo "✅ Patch fertig."

echo
echo "== 5) Test-Hinweis =="
echo "Starte/Restarte dein Backend auf Port 4000 und teste dann:"
echo "curl -i http://localhost:4000/api/profile"
