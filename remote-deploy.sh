#!/usr/bin/env bash
# remote-deploy.sh — Deploy changes to SIBERMAS server via SSH key
# Prerequisites:
#   1. SSH key-based auth to server (ssh-copy-id -p <port> <user>@<host>)
#   2. Server must have git access to the repository
# Usage: bash remote-deploy.sh
#   Or: DEPLOY_SERVER=user@host DEPLOY_PORT=22 bash remote-deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="${DEPLOY_SERVER:?DEPLOY_SERVER tidak di-set (contoh: user@host)}"
PORT="${DEPLOY_PORT:-22}"
APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://sibermas.uinsaizu.ac.id}"

# Jails mode: set JAIL_WEB_IP / JAIL_API_IP / JAIL_PROXY_IP untuk restart per-jail.
# CATATAN: jails mode membutuhkan SSH server aktif di setiap jail, ATAU
# script ini jalan dari FreeBSD host (bukan remote) agar bisa pakai jexec.
# Lihat docs/JAILS_MIGRATION.md untuk detail arsitektur two-nginx.
JAIL_WEB_IP="${JAIL_WEB_IP:-}"
JAIL_API_IP="${JAIL_API_IP:-}"
JAIL_PROXY_IP="${JAIL_PROXY_IP:-}"

COMMIT_MSG="${1:-deploy: update dari $(whoami)@$(hostname 2>/dev/null || echo 'unknown')}"

echo "═══════════════════════════════════════════════"
echo "  SIBERMAS Remote Deploy"
echo "═══════════════════════════════════════════════"

# Step 1: Push local changes to GitHub
echo ""
echo "[1/2] Pushing local changes to GitHub..."
cd "$SCRIPT_DIR"
node scripts/ci-guard.mjs
git add -A
if ! git diff --cached --quiet; then
  git commit -m "$COMMIT_MSG"
else
  echo "  ℹ️  No changes to commit, skipping..."
fi
git push origin main
echo "  ✅ Push ke GitHub selesai"

# Step 2: SSH ke server dan deploy
echo ""
echo "[2/2] Deploying ke server via SSH key..."
echo ""

# Quoted heredoc (<<'ENDSSH') mencegah expansion di lokal — variable
# expand di server. Env vars di-pass explicit via `VAR=xxx bash -s` karena
# FreeBSD sshd default tidak accept SendEnv tanpa konfigurasi server-side.
ssh -A -p "$PORT" -o StrictHostKeyChecking=accept-new "$SERVER" \
  APP_DIR="$APP_DIR" \
  JAIL_WEB_IP="$JAIL_WEB_IP" \
  JAIL_API_IP="$JAIL_API_IP" \
  JAIL_PROXY_IP="$JAIL_PROXY_IP" \
  PUBLIC_BASE_URL="$PUBLIC_BASE_URL" \
  SUDO_PASS="${SUDO_PASS:-}" \
  bash -s << 'ENDSSH'
  set -euo pipefail

  APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
  PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://sibermas.uinsaizu.ac.id}"
  JAIL_WEB_IP="${JAIL_WEB_IP:-}"
  JAIL_API_IP="${JAIL_API_IP:-}"
  JAIL_PROXY_IP="${JAIL_PROXY_IP:-10.0.0.10}"
  SUDO_PASS="${SUDO_PASS:-}"

  restart_native_web() {
    if [ -x /usr/local/etc/rc.d/sibermas_web ]; then
      if [ -n "${SUDO_PASS:-}" ]; then
        echo "$SUDO_PASS" | sudo -S service sibermas_web stop 2>/dev/null || true
        sleep 1
        echo "$SUDO_PASS" | sudo -S service sibermas_web restart
      else
        service sibermas_web stop 2>/dev/null || true
        sleep 1
        service sibermas_web restart
      fi
      return
    fi

    supervisorctl restart sibermas-web 2>/dev/null
  }

  restart_native_queue() {
    if [ -x /usr/local/etc/rc.d/sibermas_queue ]; then
      if [ -n "${SUDO_PASS:-}" ]; then
        echo "$SUDO_PASS" | sudo -S service sibermas_queue restart
      else
        service sibermas_queue restart
      fi
      return
    fi

    supervisorctl restart "workers:*" 2>/dev/null
  }

  check_http_status() {
    local url="$1"
    local expected="$2"
    local label="$3"
    local code

    code=$(curl -s -o /dev/null -m 8 -w '%{http_code}' "${url}" 2>/dev/null || printf '000')
    if [ "${code}" != "${expected}" ]; then
      echo "  ❌ ${label} returned HTTP ${code} (expected ${expected})"
      return 1
    fi

    echo "  ✅ ${label} returned HTTP ${expected}"
  }

  lint_backend_php() {
    local api_dir="$1"
    local file

    while IFS= read -r file; do
      php -l "${file}" >/dev/null
    done < <(
      printf '%s\n' \
        "${api_dir}/artisan" \
        "${api_dir}/bootstrap/app.php"
      find \
        "${api_dir}/app" \
        "${api_dir}/config" \
        "${api_dir}/database" \
        "${api_dir}/routes" \
        -type f -name '*.php'
    )
  }

  echo "  [a] Pulling latest code..."
  cd "${APP_DIR}"
  git pull origin main

  echo "  [b] Installing PHP dependencies..."
  cd "${APP_DIR}/apps/api"
  composer install --no-dev --optimize-autoloader --no-interaction
  echo "  [b.1] Linting backend PHP syntax..."
  lint_backend_php "${APP_DIR}/apps/api"
  cd "${APP_DIR}"

  echo "  [c] Running migrations..."
  cd "${APP_DIR}/apps/api"
  php artisan migrate --force
  cd "${APP_DIR}"

  echo "  [d] Caching Laravel config/routes..."
  cd "${APP_DIR}/apps/api"
  php artisan config:cache
  php artisan route:cache
  php artisan event:cache 2>/dev/null || true
  cd "${APP_DIR}"

  echo "  [e] Installing JS dependencies..."
  TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile --filter web...

  echo "  [f] Building packages dependency chain..."
  TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:packages

  echo "  [g] Building frontend..."
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${PUBLIC_BASE_URL%/}/api/v1}"
  export SERVER_API_URL="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
  export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${PUBLIC_BASE_URL%/}}"
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-${PUBLIC_BASE_URL%/}}"
  echo "  [h] Building web..."
  rm -rf apps/web/.next
  TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:web

  echo "  [i] Cleaning Next runtime cache..."
rm -rf apps/web/.next/cache apps/web/.next/standalone/apps/web/.next/cache 2>/dev/null || true

echo "  [i] Copying static & public to standalone..."
  cp -r apps/web/.next/static/. apps/web/.next/standalone/apps/web/.next/static 2>/dev/null || true
  cp -r apps/web/public/.       apps/web/.next/standalone/apps/web/public 2>/dev/null || true

  echo "  [j] Fixing permissions..."
  if [ -n "${SUDO_PASS:-}" ]; then
    echo "$SUDO_PASS" | sudo -S chown -R ${DEPLOY_USER:-kampelmas}:www apps/web/.next || true
    echo "$SUDO_PASS" | sudo -S chown -R www:www apps/api/storage apps/api/bootstrap/cache || true
  else
    chown -R ${DEPLOY_USER:-kampelmas}:www apps/web/.next || true
    chown -R www:www apps/api/storage apps/api/bootstrap/cache || true
  fi
  find apps/web/.next/standalone -type d -exec chmod 2775 {} + 2>/dev/null || true
  find apps/web/.next/standalone -type f -exec chmod u+rw,g+r {} + 2>/dev/null || true

  echo "  [k] Reloading services..."
  if [ -n "${JAIL_WEB_IP}" ]; then
    echo "  → Jails mode: restart per jail"
    jexec api service php-fpm reload 2>/dev/null || \
      (command -v ssh >/dev/null && ssh "${JAIL_API_IP}" service php-fpm reload) || true
    jexec api supervisorctl restart workers:* 2>/dev/null || \
      (command -v ssh >/dev/null && ssh "${JAIL_API_IP}" supervisorctl restart "workers:*") || true
    jexec web supervisorctl restart sibermas-web 2>/dev/null || \
      (command -v ssh >/dev/null && ssh "${JAIL_WEB_IP}" supervisorctl restart sibermas-web) || true
    jexec nginx-proxy service nginx reload 2>/dev/null || \
      (command -v ssh >/dev/null && ssh "${JAIL_PROXY_IP}" service nginx reload) || true
  else
    if [ -n "${SUDO_PASS:-}" ]; then
      echo "$SUDO_PASS" | sudo -S service php-fpm restart 2>/dev/null || echo "$SUDO_PASS" | sudo -S service php_fpm restart || true
      restart_native_web || true
      restart_native_queue || true
      echo "$SUDO_PASS" | sudo -S service nginx reload 2>/dev/null || true
    else
      service php-fpm restart 2>/dev/null || service php_fpm restart || true
      restart_native_web || true
      restart_native_queue || true
      service nginx reload 2>/dev/null || true
    fi
  fi

  echo ""
  echo "  [l] Health check..."
  sleep 3
  HC_OK=0
  for i in 1 2 3 4 5; do
    if curl -sf -m 5 "http://127.0.0.1/api/health" >/dev/null 2>&1; then
      HC_OK=1
      break
    fi
    echo "    waiting... ($i/5)"
    sleep 3
  done
  if [ "$HC_OK" = "1" ]; then
    echo "  ✅ Deploy selesai — health check OK"
  else
    echo "  ⚠️  Deploy selesai tapi health check gagal. Cek service secara manual."
  fi

  echo "  [m] API smoke checks..."
  check_http_status "http://127.0.0.1/api/v1/auth/captcha" "200" "Public auth captcha"
  check_http_status "http://127.0.0.1/api/v1/profile" "401" "Protected profile guard"
  check_http_status "http://127.0.0.1/api/v1/admin/dashboard" "401" "Protected admin dashboard guard"
ENDSSH

echo ""
echo "═══════════════════════════════════════════════"
echo "  DONE! Buka https://sibermas.uinsaizu.ac.id"
echo "  Ctrl+Shift+R untuk hard refresh browser"
echo "═══════════════════════════════════════════════"
