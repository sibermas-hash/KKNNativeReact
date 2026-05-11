#!/bin/bash
# remote-deploy.sh — Deploy perubahan navbar ke server SIBERMAS
# Jalankan: bash remote-deploy.sh

set -e

SERVER="kampelmas@172.16.2.70"
PORT="1977"
APP_DIR="/usr/local/www/apache24/data/Sibermas2026"

echo "═══════════════════════════════════════════════"
echo "  SIBERMAS Remote Deploy"
echo "═══════════════════════════════════════════════"

# Step 1: Push local changes to GitHub
echo ""
echo "[1/2] Pushing local changes to GitHub..."
cd /Users/macm4/Documents/KKN/kknuinsaizu
git add -A
git commit -m "refactor: navbar — pindah Bantuan ke icon pojok kanan atas" --allow-empty
git push origin main
echo "  ✅ Push ke GitHub selesai"

# Step 2: SSH ke server dan deploy
echo ""
echo "[2/2] Deploying ke server..."
echo "  → Masukkan password server saat diminta: KampelM45/.26:"
echo ""

ssh -p "$PORT" -o StrictHostKeyChecking=no "$SERVER" << 'REMOTE_SCRIPT'
set -e
APP_DIR="/usr/local/www/apache24/data/Sibermas2026"

echo "  [a] Pulling latest code..."
cd "$APP_DIR"
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
supervisorctl restart all

echo ""
echo "  ✅ Deploy selesai!"
echo "  🌐 Cek di: https://sibermas.uinsaizu.ac.id"
REMOTE_SCRIPT

echo ""
echo "═══════════════════════════════════════════════"
echo "  DONE! Buka https://sibermas.uinsaizu.ac.id"
echo "  Ctrl+Shift+R untuk hard refresh browser"
echo "═══════════════════════════════════════════════"
