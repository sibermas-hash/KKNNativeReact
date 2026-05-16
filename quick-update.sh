#!/usr/bin/env bash
# quick-update.sh — Update cepat tanpa full atomic deploy
# Cukup git pull + rebuild web + restart service.
# Usage: sudo bash quick-update.sh

set -euo pipefail

APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
CURRENT_LINK="${APP_DIR}/current"
WEB_USER="www"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://${WEB_DOMAIN:-sibermas.uinsaizu.ac.id}}"

if [ -L "${CURRENT_LINK}" ]; then
  RELEASE_DIR=$(readlink "${CURRENT_LINK}")
elif [ -f "${APP_DIR}/package.json" ]; then
  RELEASE_DIR="${APP_DIR}"
else
  echo "❌ Tidak menemukan app di ${APP_DIR} atau symlink atomic ${CURRENT_LINK}."
  exit 1
fi
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
cd "${RELEASE_DIR}"
export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${PUBLIC_BASE_URL%/}/api/v1}"
export SERVER_API_URL="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${PUBLIC_BASE_URL%/}}"
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-${PUBLIC_BASE_URL%/}}"
rm -rf apps/web/.next
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:web

# Copy static files to standalone
echo "[3/4] Copying static files..."
cp -r apps/web/.next/static/. apps/web/.next/standalone/apps/web/.next/static 2>/dev/null || true
cp -r apps/web/public/.       apps/web/.next/standalone/apps/web/public 2>/dev/null || true
chown -R "${WEB_USER}:${WEB_USER}" apps/web/.next
find apps/web/.next/standalone -type d -exec chmod 2775 {} + 2>/dev/null || true
find apps/web/.next/standalone -type f -exec chmod u+rw,g+r {} + 2>/dev/null || true

# Restart web service
echo "[4/4] Restarting web service..."
cd "${RELEASE_DIR}"
if [ -n "${JAIL_WEB_IP:-}" ]; then
  jexec web supervisorctl restart sibermas-web 2>/dev/null || \
    echo "  ⚠️  restart sibermas-web gagal"
else
  service sibermas_web restart 2>/dev/null || \
    supervisorctl restart sibermas-web 2>/dev/null || \
    supervisorctl restart web:* 2>/dev/null || \
    echo "  ⚠️  restart web service gagal — restart manual"
fi

echo ""
echo "✅ Update selesai!"
