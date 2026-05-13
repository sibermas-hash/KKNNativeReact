#!/usr/bin/env bash
# deploy-atomic.sh — Atomic zero-downtime deploy for SIBERMAS FreeBSD
# Strategy: release directory + symlink switch + health check + rollback
#
# Usage:
#   bash deploy-atomic.sh                              # deploy dari GitHub
#   bash deploy-atomic.sh /path/to/local/code.tar.gz   # deploy dari tarball (preferred)
#
# Rollback manual:
#   unlink /usr/local/www/sibermas/current
#   ln -s /usr/local/www/sibermas/releases/<PREV_TIMESTAMP> /usr/local/www/sibermas/current
#   supervisorctl restart workers:*
#   service php-fpm reload

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
REPO_URL="${REPO_URL:-https://github.com/anomalyco/kknuinsaizu.git}"
SKIP_MIGRATE="${SKIP_MIGRATE:-0}"

WEB_IP="${JAIL_WEB_IP:-127.0.0.1}"
API_IP="${JAIL_API_IP:-127.0.0.1}"
WEB_PORT="${WEB_PORT:-3000}"
# Multi-port default (cluster). Override dengan WEB_CLUSTER_PORTS="3000" untuk single.
WEB_CLUSTER_PORTS="${WEB_CLUSTER_PORTS:-3000,3001,3002,3003}"
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
  echo "[1/8] Extracting tarball: $1 ..."
  mkdir -p "${RELEASE_DIR}"
  tar xzf "$1" -C "${RELEASE_DIR}" --strip-components=1
else
  echo "[1/8] Cloning from GitHub (${REPO_URL})..."
  git clone --depth=1 "${REPO_URL}" "${RELEASE_DIR}"
fi

# ─── Step 2: Install backend deps ─────────────────────────────────────────
echo "[2/8] Installing backend dependencies..."
cd "${RELEASE_DIR}/apps/api"
composer install --no-dev --optimize-autoloader --no-interaction

# ─── Step 3: Build frontend ───────────────────────────────────────────────
# TURBO_INSTALL_SKIP_DOWNLOAD=1 wajib di FreeBSD — tidak ada turbo binary
# native. Script root package.json `build:web` sekarang pakai pnpm langsung
# (bukan turbo), jadi turbo tidak pernah di-invoke.
echo "[3/8] Installing frontend dependencies & building..."
cd "${RELEASE_DIR}"
# NOTE: devDependencies DIBUTUHKAN untuk Next.js build (typescript, postcss).
# Hanya remove setelah build selesai.
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile
# Build packages dependency chain dulu (shared-types, schemas, etc), lalu web.
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:packages
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:web

# Copy static & public ke standalone (required for FreeBSD).
# NOTE: apps/web/package.json postbuild sudah melakukan ini, tapi kita
# ulang di sini untuk defensive — kalau postbuild gagal atau build
# jalan tanpa postbuild hook.
cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static 2>/dev/null || true
cp -r apps/web/public         apps/web/.next/standalone/apps/web/public 2>/dev/null || true

# Prune devDependencies setelah build selesai untuk hemat disk.
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm prune --prod || true

# ─── Step 4: Configure .env ───────────────────────────────────────────────
# CRITICAL: .env harus di-seed dari release sebelumnya, BUKAN dari
# .env.production.example (itu cuma template dengan APP_KEY kosong).
# Kalau tidak ada release sebelumnya, abort — operator harus setup manual.
echo "[4/8] Configuring Laravel .env..."
cd "${RELEASE_DIR}/apps/api"
if [ -L "${CURRENT_LINK}" ] && [ -f "${CURRENT_LINK}/apps/api/.env" ]; then
  cp "${CURRENT_LINK}/apps/api/.env" .env
  echo "  ℹ️  .env copied from previous release"
else
  if [ -n "${JAIL_WEB_IP:-}" ] && [ -f ".env.production.jail" ]; then
    cp .env.production.jail .env
    echo "  ⚠️  First deploy (jails mode) — copied .env.production.jail."
  elif [ -f ".env.production.example" ]; then
    cp .env.production.example .env
    echo "  ⚠️  First deploy — copied .env.production.example."
  fi
  echo "  ❗ EDIT ${RELEASE_DIR}/apps/api/.env SEKARANG, lalu re-run deploy."
  echo "     Isi: APP_KEY, DB_PASSWORD, MASTER_WEBHOOK_SECRET, API_ADMIN_SECRET, APP_BLIND_INDEX_KEY"
  exit 1
fi

# key:generate HANYA kalau APP_KEY benar-benar kosong.
# Pattern check `^APP_KEY=base64` sebelumnya bisa false-positive dan
# rotating APP_KEY → semua encrypted_casts & password reset token invalid.
if ! grep -qE '^APP_KEY=base64:[A-Za-z0-9+/=]{44,}' .env; then
  if grep -qE '^APP_KEY=\s*$' .env; then
    echo "  APP_KEY empty — generating..."
    php artisan key:generate --force
  else
    echo "  ❌ APP_KEY format invalid and not empty. Refusing to overwrite (may be legitimate key)."
    echo "     Check .env manually. If you really want to regenerate, run:"
    echo "     php artisan key:generate --force"
    exit 1
  fi
fi

# Migrasi DB (opt-out via SKIP_MIGRATE=1 untuk hot-fix yang tidak perlu migrate).
if [ "${SKIP_MIGRATE}" != "1" ]; then
  php artisan migrate --force
fi
php artisan storage:link --force
php artisan config:cache
php artisan route:cache
php artisan event:cache 2>/dev/null || true

# ─── Step 5: Fix permissions ──────────────────────────────────────────────
# Use -exec ... + (batch) untuk kecepatan di storage ribuan file.
echo "[5/8] Setting permissions..."
chown -R "${WEB_USER}:${WEB_USER}" "${RELEASE_DIR}/apps/api/storage"
chown -R "${WEB_USER}:${WEB_USER}" "${RELEASE_DIR}/apps/api/bootstrap/cache"
chown -R "${WEB_USER}:${WEB_USER}" "${RELEASE_DIR}/apps/web/.next"
find "${RELEASE_DIR}/apps/api/storage" -type d -exec chmod 775 {} +
find "${RELEASE_DIR}/apps/api/storage" -type f -exec chmod 664 {} +

# ─── Step 6: Switch symlink (atomic) ──────────────────────────────────────
echo "[6/8] Switching symlink..."
ln -sfn "${RELEASE_DIR}" "${CURRENT_LINK}.new"
# FreeBSD mv tidak punya -T (GNU extension), jadi pakai rm + mv.
# Ini tetap atomic-enough: symlink .new → final via mv is single rename() syscall.
rm -f "${CURRENT_LINK}" && mv "${CURRENT_LINK}.new" "${CURRENT_LINK}"
echo "  ✅ current → ${RELEASE_DIR}"

# ─── Step 7: Reload PHP-FPM + restart workers ─────────────────────────────
# OPcache dengan validate_timestamps=0 TIDAK reload kode baru sampai FPM
# direstart. Ini dulu silent bug — kode lama terus di-serve setelah deploy.
echo "[7/8] Reloading PHP-FPM + restarting workers..."

if [ -n "${JAIL_WEB_IP:-}" ]; then
  # Jails mode — restart via jexec.
  jexec api service php-fpm reload 2>/dev/null || \
    echo "  ⚠️  php-fpm reload gagal di api jail"
  jexec api supervisorctl restart workers:* 2>/dev/null || \
    echo "  ⚠️  supervisorctl restart workers gagal"
  jexec web supervisorctl restart sibermas-web 2>/dev/null || \
    echo "  ⚠️  restart sibermas-web gagal"
  jexec nginx-proxy service nginx reload 2>/dev/null || \
    echo "  ⚠️  nginx reload gagal"
else
  # Single-server mode.
  service php-fpm reload 2>/dev/null || service php-fpm restart || true
  supervisorctl restart workers:*
  service nginx reload 2>/dev/null || true
fi

# ─── Step 8: Health check ─────────────────────────────────────────────────
echo "[8/8] Health check — waiting for web cluster..."
echo "  Targets: ${WEB_IP} ports=${WEB_CLUSTER_PORTS}"
for i in $(seq 1 "${HEALTH_RETRIES}"); do
  sleep "${HEALTH_INTERVAL}"
  ALL_OK=true
  for port in ${WEB_CLUSTER_PORTS//,/ }; do
    if ! curl -sf -o /dev/null -m 5 "http://${WEB_IP}:${port}/" 2>/dev/null; then
      ALL_OK=false
      break
    fi
  done
  if $ALL_OK; then
    echo "  ✅ Web cluster responded OK (attempt ${i})"
    break
  fi
  if [ "${i}" -eq "${HEALTH_RETRIES}" ]; then
    echo "  ❌ Web cluster did not respond after ${HEALTH_RETRIES} attempts"
    echo "  ⚠️  Deploy RUNNING, but health check failed. Check logs:"
    echo "     tail -f ${LOG_DIR}/web.log"
    echo ""
    echo "  Rollback command:"
    echo "    unlink ${CURRENT_LINK}"
    PREV=$(find "${RELEASES_DIR}" -maxdepth 1 -type d -not -path "${RELEASES_DIR}" | sort -r | sed -n '2p')
    if [ -n "${PREV}" ]; then
      echo "    ln -s ${PREV} ${CURRENT_LINK}"
    fi
    echo "    service php-fpm reload"
    echo "    supervisorctl restart workers:*"
    exit 1
  fi
  echo "  ... not ready yet (attempt ${i}/${HEALTH_RETRIES})"
done

# Prune old releases (keep last 3).
# find -print0 + sort -rz untuk handle spaces/newlines di filename (paranoia).
echo ""
echo "Pruning old releases (keeping last 3)..."
# BSD stat format: "%m" = mtime (epoch).
find "${RELEASES_DIR}" -maxdepth 1 -mindepth 1 -type d -exec \
  stat -f '%m %N' {} + 2>/dev/null | \
  sort -rn | tail -n +4 | while read -r _ old; do
  rm -rf "${old}"
  echo "  🗑️  Removed: ${old##*/}"
done

echo ""
echo "═══════════════════════════════════════════════"
echo "  ✅ Deploy ${TIMESTAMP} BERHASIL!"
echo "  current → ${RELEASE_DIR}"
echo "═══════════════════════════════════════════════"
