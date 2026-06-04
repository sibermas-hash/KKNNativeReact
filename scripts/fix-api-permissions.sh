#!/usr/bin/env bash
# Fix Laravel API file permissions on server. Run from repo root or set APP_DIR.
set -euo pipefail

APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
API_DIR="$APP_DIR/apps/api"
WEB_USER="${WEB_USER:-www}"
WEB_GROUP="${WEB_GROUP:-www}"

cd "$API_DIR"

echo "[1/4] source files readable"
sudo chmod -R u+rwX,g+rX,o+rX app database config routes bootstrap

echo "[2/4] runtime dirs writable by web user"
sudo chown -R "$WEB_USER:$WEB_GROUP" storage bootstrap/cache
sudo chmod -R ug+rwX,o-rwx storage bootstrap/cache

echo "[3/4] clear Laravel caches"
php artisan optimize:clear

echo "[4/4] verify"
unreadable_count=$(find app database config routes bootstrap -type f ! -perm -004 | wc -l | tr -d ' ')
echo "unreadable_files=$unreadable_count"
php artisan route:list --path=api/v1 >/dev/null

if [ "$unreadable_count" != "0" ]; then
  echo "ERROR: unreadable source files remain" >&2
  find app database config routes bootstrap -type f ! -perm -004 -ls | head -50 >&2
  exit 1
fi

echo "DONE api permissions fixed"
