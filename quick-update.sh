#!/usr/bin/env bash
# quick-update.sh — Update cepat tanpa full atomic deploy
# Cukup git pull + rebuild web + restart service.
# Usage: sudo bash quick-update.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/usr/local/www/sibermas}"
CURRENT_LINK="${APP_DIR}/current"
WEB_USER="www"

if [ ! -L "${CURRENT_LINK}" ]; then
  echo "❌ ${CURRENT_LINK} tidak ditemukan. Jalankan deploy-atomic.sh dulu."
  exit 1
fi

RELEASE_DIR=$(readlink "${CURRENT_LINK}")
echo "═══════════════════════════════════════════════"
echo "  Quick Update — $(date '+%Y%m%d_%H%M%S')"
echo "  Target: ${RELEASE_DIR}"
echo "═══════════════════════════════════════════════"

cd "${RELEASE_DIR}"

# Stash local changes & pull latest
echo "[1/4] Git pull..."
git stash --include-untracked 2>/dev/null || true
git pull origin main

# Rebuild web only
echo "[2/4] Building web..."
cd apps/web
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:web

# Copy static files to standalone
echo "[3/4] Copying static files..."
cp -r .next/static/. .next/standalone/apps/web/.next/static 2>/dev/null || true
cp -r public/. .next/standalone/apps/web/public 2>/dev/null || true

# Restart web service
echo "[4/4] Restarting web service..."
cd "${RELEASE_DIR}"
if [ -n "${JAIL_WEB_IP:-}" ]; then
  jexec web supervisorctl restart sibermas-web 2>/dev/null || \
    echo "  ⚠️  restart sibermas-web gagal"
else
  supervisorctl restart sibermas-web 2>/dev/null || \
    supervisorctl restart web:* 2>/dev/null || \
    echo "  ⚠️  restart web service gagal — restart manual"
fi

echo ""
echo "✅ Update selesai!"
