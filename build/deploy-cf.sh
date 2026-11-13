#!/bin/sh
# Deploy aplikasi ke Cloudflare (Workers static assets) → https://perangkat-asesmen.aantriono.com
#
#   npm run deploy:cf
#
# Butuh CLI Cloudflare: `npm install --global cf` lalu `cf auth login` (sekali saja).
# Hanya berkas aplikasi yang diunggah (tanpa node_modules, build, docs, dsb.). Konfigurasi
# Cloudflare sengaja tidak disimpan di repo: `cf` akan menambah "type": "module" ke package.json
# dan itu merusak skrip build (CommonJS). Nama Worker diambil dari nama folder staging.
# Domain perangkat-asesmen.aantriono.com sudah terpasang ke Worker ini (sekali, lewat dasbor/API).
set -eu

ROOT=$(cd "$(dirname "$0")/.." && pwd)
cd "$ROOT"
WORKER=perangkat-asesmen
STAGE="$ROOT/.cf-deploy/$WORKER"

command -v cf >/dev/null 2>&1 || { echo "CLI 'cf' belum terpasang: npm install --global cf" >&2; exit 1; }
node build/build-sw.js --check >/dev/null || { echo "sw.js usang — jalankan 'npm run build' dulu." >&2; exit 1; }

rm -rf "$STAGE"
mkdir -p "$STAGE/public"
cp -r index.html manifest.webmanifest sw.js css js img vendor "$STAGE/public/"

VERSION=$(node -p "require('./package.json').version")
COMMIT=$(git rev-parse --short HEAD 2>/dev/null || echo lokal)
cd "$STAGE"
cf deploy public --message "v$VERSION ($COMMIT)" --tag "v$VERSION"
