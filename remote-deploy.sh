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
ssh -p "$PORT" -o StrictHostKeyChecking=accept-new "$SERVER" \
  APP_DIR="$APP_DIR" \
  JAIL_WEB_IP="$JAIL_WEB_IP" \
  JAIL_API_IP="$JAIL_API_IP" \
  JAIL_PROXY_IP="$JAIL_PROXY_IP" \
  PUBLIC_BASE_URL="$PUBLIC_BASE_URL" \
  bash -s << 'ENDSSH'
  set -euo pipefail

  APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
  PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://sibermas.uinsaizu.ac.id}"
  JAIL_WEB_IP="${JAIL_WEB_IP:-}"
  JAIL_API_IP="${JAIL_API_IP:-}"
  JAIL_PROXY_IP="${JAIL_PROXY_IP:-10.0.0.10}"

  echo "  [a] Pulling latest code..."
  cd "${APP_DIR}"
  git pull origin main

  echo "  [b] Installing dependencies..."
  TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile --filter web...

  echo "  [c] Building packages dependency chain..."
  TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:packages

  echo "  [d] Building frontend..."
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${PUBLIC_BASE_URL%/}/api/v1}"
  export SERVER_API_URL="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
  export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${PUBLIC_BASE_URL%/}}"
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-${PUBLIC_BASE_URL%/}}"
  TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build:web

  echo "  [e] Copying static & public to standalone..."
  cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static 2>/dev/null || true
  cp -r apps/web/public         apps/web/.next/standalone/apps/web/public 2>/dev/null || true

  echo "  [f] Fixing permissions..."
  chown -R www:www apps/web/.next apps/api/storage apps/api/bootstrap/cache

  echo "  [g] Reloading PHP-FPM (OPcache reset)..."
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
    service php-fpm reload 2>/dev/null || service php-fpm restart || true
    supervisorctl restart "workers:*"
    service nginx reload 2>/dev/null || true
  fi

  echo ""
  echo "  ✅ Deploy selesai!"
  echo "  🌐 Cek di: https://sibermas.uinsaizu.ac.id"
ENDSSH

echo ""
echo "═══════════════════════════════════════════════"
echo "  DONE! Buka https://sibermas.uinsaizu.ac.id"
echo "  Ctrl+Shift+R untuk hard refresh browser"
echo "═══════════════════════════════════════════════"
