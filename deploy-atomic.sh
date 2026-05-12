#!/usr/bin/env bash
# deploy-atomic.sh — Atomic zero-downtime deploy for SIBERMAS FreeBSD
# Strategy: release directory + symlink switch + health check + rollback
#
# Usage:
#   bash deploy-atomic.sh                              # deploy dari GitHub
#   bash deploy-atomic.sh /path/to/local/code.tar.gz   # deploy dari tarball
#
# Rollback manual:
#   unlink /usr/local/www/apache24/data/Sibermas2026/current
#   ln -s /usr/local/www/apache24/data/Sibermas2026/releases/20260512_120000 /usr/local/www/apache24/data/Sibermas2026/current
#   supervisorctl restart workers:*

set -euo pipefail

# ─── Config ────────────────────────────────────────────────────────────────
# Single-server mode (default) — all services on one machine.
# For jails mode, set JAIL_WEB_IP / JAIL_API_IP / JAIL_PROXY_IP env vars.
APP_DIR="${APP_DIR:-/usr/local/www/sibermas}"
RELEASES_DIR="${APP_DIR}/releases"
CURRENT_LINK="${APP_DIR}/current"
WEB_USER="www"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
RELEASE_DIR="${RELEASES_DIR}/${TIMESTAMP}"
LOG_DIR="/var/log/sibermas"

WEB_IP="${JAIL_WEB_IP:-127.0.0.1}"
API_IP="${JAIL_API_IP:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-3000}"
HEALTH_RETRIES="${HEALTH_RETRIES:-12}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-5}"

echo "═══════════════════════════════════════════════"
echo "  SIBERMAS Atomic Deploy — ${TIMESTAMP}"
echo "═══════════════════════════════════════════════"

# ─── Pre-flight checks ────────────────────────────────────────────────────
if [ "$(id -u)" -ne 0 ] && [ "$(id -u)" -ne "$(id -u "${WEB_USER}")" ]; then
  echo "❌ Jalankan sebagai root atau ${WEB_USER}"
  exit 1
fi

mkdir -p "${RELEASES_DIR}" "${LOG_DIR}"

# ─── Step 1: Get code ─────────────────────────────────────────────────────
if [ -n "${1:-}" ] && [ -f "$1" ]; then
  echo "[1/7] Extracting tarball: $1 ..."
  mkdir -p "${RELEASE_DIR}"
  tar xzf "$1" -C "${RELEASE_DIR}" --strip-components=1
else
  echo "[1/7] Cloning from GitHub..."
  git clone --depth=1 https://github.com/anomalyco/kknuinsaizu.git "${RELEASE_DIR}"
fi

# ─── Step 2: Install backend deps ─────────────────────────────────────────
echo "[2/7] Installing backend dependencies..."
cd "${RELEASE_DIR}/apps/api"
composer install --no-dev --optimize-autoloader --no-interaction

# ─── Step 3: Build frontend ───────────────────────────────────────────────
echo "[3/7] Installing frontend dependencies & building..."
cd "${RELEASE_DIR}"
pnpm install --frozen-lockfile --prod
pnpm build

# Copy static & public ke standalone (required for FreeBSD)
cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public         apps/web/.next/standalone/apps/web/public

# ─── Step 4: Configure & cache ────────────────────────────────────────────
echo "[4/7] Configuring Laravel..."
cd "${RELEASE_DIR}/apps/api"
cp .env.production.example .env
# .env harus sudah diisi sebelumnya — copy dari release sebelumnya jika ada
if [ -L "${CURRENT_LINK}" ] && [ -f "${CURRENT_LINK}/apps/api/.env" ]; then
  cp "${CURRENT_LINK}/apps/api/.env" .env
  echo "  ℹ️  .env copied from previous release"
else
  echo "  ⚠️  No previous .env found! Copy from template and edit manually."
  cp .env.production.example .env
fi
if ! grep -q '^APP_KEY=base64' .env 2>/dev/null; then
  php artisan key:generate --force
fi
php artisan migrate --force
php artisan storage:link --force
php artisan config:cache
php artisan route:cache

# ─── Step 5: Fix permissions ──────────────────────────────────────────────
echo "[5/7] Setting permissions..."
chown -R "${WEB_USER}:${WEB_USER}" "${RELEASE_DIR}/apps/api/storage"
chown -R "${WEB_USER}:${WEB_USER}" "${RELEASE_DIR}/apps/api/bootstrap/cache"
chown -R "${WEB_USER}:${WEB_USER}" "${RELEASE_DIR}/apps/web/.next"
find "${RELEASE_DIR}/apps/api/storage" -type d -exec chmod 775 {} \;
find "${RELEASE_DIR}/apps/api/storage" -type f -exec chmod 664 {} \;

# ─── Step 6: Switch symlink (atomic) ──────────────────────────────────────
echo "[6/7] Switching symlink..."
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}.new"
# FreeBSD mv tidak punya -T (GNU extension), jadi pakai rm + mv
rm -f "${CURRENT_LINK}" && mv "${CURRENT_LINK}.new" "${CURRENT_LINK}"
echo "  ✅ current → ${RELEASE_DIR}"

# ─── Step 7: Restart & health check ───────────────────────────────────────
echo "[7/7] Restarting services & health check..."

if [ -n "${JAIL_WEB_IP:-}" ]; then
  # Jails mode — restart via jexec
  jexec api supervisorctl restart workers:* 2>/dev/null || \
    ssh "${API_IP}" supervisorctl restart workers:*
  jexec web supervisorctl restart sibermas-web 2>/dev/null || \
    ssh "${WEB_IP}" supervisorctl restart sibermas-web
  jexec nginx-proxy service nginx reload 2>/dev/null || \
    ssh "${JAIL_PROXY_IP:-10.0.0.10}" service nginx reload
else
  # Single-server mode
  supervisorctl restart workers:*
fi

echo "  Waiting for web (${WEB_IP}:${WEB_PORT})..."
for i in $(seq 1 "${HEALTH_RETRIES}"); do
  sleep "${HEALTH_INTERVAL}"
  if curl -sf "http://${WEB_IP}:${WEB_PORT}/" > /dev/null 2>&1; then
    echo "  ✅ Web responded OK (attempt ${i})"
    break
  fi
  if [ "${i}" -eq "${HEALTH_RETRIES}" ]; then
    echo "  ❌ Web did not respond after ${HEALTH_RETRIES} attempts"
    echo "  ⚠️  RUNNING, but health check failed. Check logs:"
    echo "     tail -f ${LOG_DIR}/web.log"
    echo ""
    echo "  Rollback:"
    echo "    unlink ${CURRENT_LINK}"
    echo "    ln -s ${RELEASES_DIR}/<PREVIOUS> ${CURRENT_LINK}"
    echo "    supervisorctl restart workers:*"
    exit 1
  fi
  echo "  ... not ready yet (attempt ${i}/${HEALTH_RETRIES})"
done

# Prune old releases (keep last 3)
echo ""
echo "Pruning old releases (keeping last 3)..."
# Use stat + sort for FreeBSD compatibility — handles spaces in names
find "${RELEASES_DIR}" -maxdepth 1 -type d ! -name "$(basename "${RELEASES_DIR}")" -exec \
  sh -c 'for d; do echo "$(stat -f "%m" "$d") $d"; done' _ {} + | \
  sort -rn | tail -n +4 | while read -r _ old; do
  rm -rf "${old}"
  echo "  🗑️  Removed: ${old##*/}"
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Deploy ${TIMESTAMP} BERHASIL!"
echo "  current → ${RELEASE_DIR}"
echo "═══════════════════════════════════════════════"
