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
echo "[2/2] Deploying ke server via automated SSH..."
echo ""


expect << EOF
set timeout -1
spawn ssh -p "$PORT" -o StrictHostKeyChecking=no "$SERVER"
expect "*assword:*"
send "KampelM45/.26:\r"
expect "*$"
send "set -e\r"
send "APP_DIR=\"/usr/local/www/apache24/data/Sibermas2026\"\r"
send "echo \"  [a] Pulling latest code...\"\r"
send "cd \$APP_DIR\r"
send "git pull origin main\r"
send "echo \"  [b] Installing dependencies...\"\r"
send "pnpm install --frozen-lockfile\r"
send "echo \"  [c] Building frontend...\"\r"
send "pnpm build\r"
send "echo \"  [d] Copying static & public to standalone...\"\r"
send "cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static\r"
send "cp -r apps/web/public         apps/web/.next/standalone/apps/web/public\r"
send "echo \"  [e] Fixing permissions...\"\r"
send "chown -R www:www apps/web/.next\r"
send "echo \"  [f] Restarting services...\"\r"
send "supervisorctl restart all\r"
send "echo \"\"\r"
send "echo \"  ✅ Deploy selesai!\"\r"
send "echo \"  🌐 Cek di: https://sibermas.uinsaizu.ac.id\"\r"
send "exit\r"
expect eof
EOF

echo ""
echo "═══════════════════════════════════════════════"
echo "  DONE! Buka https://sibermas.uinsaizu.ac.id"
echo "  Ctrl+Shift+R untuk hard refresh browser"
echo "═══════════════════════════════════════════════"
