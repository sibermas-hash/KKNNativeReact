#!/usr/bin/env bash
#
# SIBERMAS — Database + File Storage Backup
#
# Usage:
#   ./scripts/backup.sh [output_dir]
#
# Default output: /var/backups/sibermas
# Retention: 7 days (older files auto-deleted)
#
# Requirements (server):
#   - pg_dump (PostgreSQL client)
#   - tar + gzip
#   - Write access to output dir
#
# Exits non-zero on any failure. Intended to be run via cron:
#   0 2 * * *  /usr/local/www/apache24/data/Sibermas2026/scripts/backup.sh
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
API_DIR="${APP_DIR}/apps/api"
OUTPUT_DIR="${1:-/var/backups/sibermas}"
TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
RETENTION_DAYS=7

# Load .env (specifically DB_* vars) — safe parsing without shell eval
if [[ -f "${API_DIR}/.env" ]]; then
  while IFS='=' read -r key value; do
    # Strip surrounding quotes from value
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    case "$key" in
      DB_*|APP_NAME) export "$key=$value" ;;
    esac
  done < <(grep -E '^(DB_|APP_NAME)=' "${API_DIR}/.env")
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-sibermas}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_PASSWORD="${DB_PASSWORD:-}"

mkdir -p "${OUTPUT_DIR}"

echo "== SIBERMAS Backup =="
echo "Timestamp:  ${TIMESTAMP}"
echo "Database:   ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
echo "Output dir: ${OUTPUT_DIR}"
echo ""

# 1. Database dump (custom format, compressed, verifiable)
DB_FILE="${OUTPUT_DIR}/db_${TIMESTAMP}.dump"
echo "[1/3] pg_dump -> ${DB_FILE}..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  --host="${DB_HOST}" \
  --port="${DB_PORT}" \
  --username="${DB_USERNAME}" \
  --format=custom \
  --no-owner --no-privileges \
  --file="${DB_FILE}" \
  "${DB_DATABASE}"
DB_SIZE="$(du -h "${DB_FILE}" | awk '{print $1}')"
echo "      OK — ${DB_SIZE}"

# 2. Storage archive (user uploads + generated files)
STORAGE_DIR="${API_DIR}/storage/app/public"
STORAGE_FILE="${OUTPUT_DIR}/storage_${TIMESTAMP}.tar.gz"
if [[ -d "${STORAGE_DIR}" ]]; then
  echo "[2/3] tar storage/app/public -> ${STORAGE_FILE}..."
  tar -czf "${STORAGE_FILE}" -C "${API_DIR}/storage/app" public
  STORAGE_SIZE="$(du -h "${STORAGE_FILE}" | awk '{print $1}')"
  echo "      OK — ${STORAGE_SIZE}"
else
  echo "[2/3] SKIP — ${STORAGE_DIR} not found"
fi

# 3. .env snapshot (no secrets — metadata only)
ENV_SNAPSHOT="${OUTPUT_DIR}/env_${TIMESTAMP}.meta"
echo "[3/3] env metadata -> ${ENV_SNAPSHOT}..."
{
  echo "backup_timestamp=${TIMESTAMP}"
  echo "laravel_version=$(cd "${API_DIR}" && php artisan --version 2>/dev/null || echo unknown)"
  echo "php_version=$(php -r 'echo PHP_VERSION;')"
  echo "app_name=${APP_NAME:-SIBERMAS}"
  echo "db_database=${DB_DATABASE}"
  echo "db_size_mb=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" -tAc "SELECT pg_database_size('${DB_DATABASE}')/1024/1024;" 2>/dev/null || echo unknown)"
  echo "user_count=$(PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -U "${DB_USERNAME}" -d "${DB_DATABASE}" -tAc 'SELECT COUNT(*) FROM users;' 2>/dev/null || echo unknown)"
} > "${ENV_SNAPSHOT}"
echo "      OK"

# 4. Retention cleanup (delete backups older than N days)
echo ""
echo "[cleanup] Removing backups older than ${RETENTION_DAYS} days..."
find "${OUTPUT_DIR}" -type f \( -name "db_*.dump" -o -name "storage_*.tar.gz" -o -name "env_*.meta" \) \
  -mtime +${RETENTION_DAYS} -print -delete 2>/dev/null || true

echo ""
echo "== Backup complete =="
ls -lh "${OUTPUT_DIR}" | tail -10
