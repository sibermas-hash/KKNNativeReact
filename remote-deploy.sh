#!/usr/bin/env bash
# remote-deploy.sh — Deploy changes to SIBERMAS server via SSH key
# Prerequisites:
#   1. SSH key-based auth to server (ssh-copy-id -p <port> <user>@<host>)
#   2. Server must have git access to the repository
# Usage: bash remote-deploy.sh
#   Or: DEPLOY_SERVER=user@host DEPLOY_PORT=22 bash remote-deploy.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER="${DEPLOY_SERVER:-kampelmas@172.16.2.70}"
PORT="${DEPLOY_PORT:-1977}"
APP_DIR="/usr/local/www/apache24/data/Sibermas2026"

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
  cd "\$APP_DIR"
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
  supervisorctl restart workers:*

  echo ""
  echo "  ✅ Deploy selesai!"
  echo "  🌐 Cek di: https://sibermas.uinsaizu.ac.id"
ENDSSH

echo ""
echo "═══════════════════════════════════════════════"
echo "  DONE! Buka https://sibermas.uinsaizu.ac.id"
echo "  Ctrl+Shift+R untuk hard refresh browser"
echo "═══════════════════════════════════════════════"
