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
APP_DIR="${APP_DIR:-/usr/local/www/sibermas}"

# Jails mode: set JAIL_WEB_IP / JAIL_API_IP / JAIL_PROXY_IP to use per-jail restart.
# CATATAN: jails mode membutuhkan SSH server aktif di setiap jail, ATAU
# jalankan script ini dari FreeBSD host (bukan remote) agar bisa pakai jexec.
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

ssh -p "$PORT" -o StrictHostKeyChecking=accept-new "$SERVER" << ENDSSH
  set -e
  APP_DIR="$APP_DIR"

  echo "  [a] Pulling latest code..."
  cd "\${APP_DIR}"
  git pull origin main

  echo "  [b] Installing dependencies..."
  pnpm install --frozen-lockfile

  echo "  [c] Building frontend..."
  pnpm build

  echo "  [d] Copying static & public to standalone..."
  cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static
  cp -r apps/web/public         apps/web/.next/standalone/apps/web/public

  echo "  [e] Fixing permissions..."
  chown -R www:www apps/web/.next

  echo "  [f] Restarting services..."
  if [ -n "${JAIL_WEB_IP}" ]; then
    echo "  → Jails mode: restart per jail"
    jexec api supervisorctl restart workers:* 2>/dev/null || \
      ssh "${JAIL_API_IP}" supervisorctl restart workers:*
    jexec web supervisorctl restart sibermas-web 2>/dev/null || \
      ssh "${JAIL_WEB_IP}" supervisorctl restart sibermas-web
    jexec nginx-proxy service nginx reload 2>/dev/null || \
      ssh "${JAIL_PROXY_IP:-10.0.0.10}" service nginx reload
  else
    supervisorctl restart workers:*
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
