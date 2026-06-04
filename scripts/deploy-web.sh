#!/usr/bin/env bash
# Deploy web frontend on server. Run on server from repo root.
set -euo pipefail

APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
BRANCH="${BRANCH:-main}"
WEB_PORT="${WEB_PORT:-3001}"
PM2_NAME="${PM2_NAME:-sibermas-web}"

cd "$APP_DIR"

echo "[1/6] git pull origin ${BRANCH}"
git fetch origin "$BRANCH"
git pull --ff-only origin "$BRANCH"

echo "[2/6] install deps"
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile --filter web...

echo "[3/6] build packages"
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:packages

echo "[4/6] build web"
rm -rf apps/web/.next
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:web
mkdir -p apps/web/.next/standalone/apps/web/public apps/web/.next/standalone/apps/web/.next/static
cp -R apps/web/public/. apps/web/.next/standalone/apps/web/public/
cp -R apps/web/.next/static/. apps/web/.next/standalone/apps/web/.next/static/
chmod -R u+rwX,g+rX,o+rX apps/web/.next/static apps/web/.next/standalone/apps/web/public apps/web/.next/standalone/apps/web/.next/static
rm -rf apps/web/.next/cache apps/web/.next/standalone/apps/web/.next/cache 2>/dev/null || true

echo "[5/6] restart pm2"
PM2_BIN="${PM2_BIN:-}"
if [ -z "$PM2_BIN" ]; then
  PM2_BIN="$(command -v pm2 2>/dev/null || true)"
fi
if [ -z "$PM2_BIN" ]; then
  PM2_BIN="$(find "$HOME/.npm/_npx" -path '*/node_modules/pm2/bin/pm2' -type f 2>/dev/null | sort | tail -1 || true)"
fi
if [ -z "$PM2_BIN" ]; then
  echo "pm2 not found; installing via npx cache"
  npx --yes pm2@latest --version >/dev/null
  PM2_BIN="$(find "$HOME/.npm/_npx" -path '*/node_modules/pm2/bin/pm2' -type f 2>/dev/null | sort | tail -1 || true)"
fi
if [ -z "$PM2_BIN" ]; then
  echo "ERROR: pm2 unavailable" >&2
  exit 1
fi

if "$PM2_BIN" describe "$PM2_NAME" >/dev/null 2>&1; then
  "$PM2_BIN" restart "$PM2_NAME" --update-env
else
  PORT="$WEB_PORT" "$PM2_BIN" start apps/web/.next/standalone/apps/web/server.js --name "$PM2_NAME" --update-env
fi
"$PM2_BIN" save >/dev/null 2>&1 || true
"$PM2_BIN" list

echo "[6/6] health"
sleep 3
curl -I -s "http://127.0.0.1:${WEB_PORT}/" | head -5

echo "DONE $(git rev-parse --short HEAD)"
