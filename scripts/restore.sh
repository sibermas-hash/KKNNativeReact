#!/usr/bin/env bash
#
# SIBERMAS — Database + File Storage Restore
#
# Usage:
#   ./scripts/restore.sh <db_dump_file> [storage_archive]
#
# Example:
#   ./scripts/restore.sh /var/backups/sibermas/db_20260510_020000.dump \
#                         /var/backups/sibermas/storage_20260510_020000.tar.gz
#
# ⚠️  DESTRUCTIVE — drops existing database and replaces it.
# Run only during scheduled maintenance. Confirmation required.
#

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
API_DIR="${APP_DIR}/apps/api"

DB_DUMP="${1:-}"
STORAGE_ARCHIVE="${2:-}"

if [[ -z "${DB_DUMP}" ]] || [[ ! -f "${DB_DUMP}" ]]; then
  echo "ERROR: db dump file not found: ${DB_DUMP}"
  echo "Usage: $0 <db_dump_file> [storage_archive]"
  exit 1
fi

# Load .env — parse safe (tanpa shell eval). Value di .env bisa mengandung
# $(...) atau backticks yang akan dieksekusi kalau pakai `source` / `eval`.
if [[ -f "${API_DIR}/.env" ]]; then
  while IFS='=' read -r key value; do
    # Strip surrounding quotes dari value.
    value="${value%\"}"
    value="${value#\"}"
    value="${value%\'}"
    value="${value#\'}"
    case "$key" in
      DB_*) export "$key=$value" ;;
    esac
  done < <(grep -E '^DB_' "${API_DIR}/.env")
fi

DB_HOST="${DB_HOST:-127.0.0.1}"
DB_PORT="${DB_PORT:-5432}"
DB_DATABASE="${DB_DATABASE:-kknnative}"
DB_USERNAME="${DB_USERNAME:-kknuinsaizunative}"
DB_PASSWORD="${DB_PASSWORD:-}"
if [ -z "${DB_PASSWORD}" ]; then
  echo "ERROR: DB_PASSWORD tidak di-set dan tidak ditemukan di .env. Restore dibatalkan." >&2
  exit 1
fi

echo "== SIBERMAS Restore =="
echo "Target DB:    ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
echo "Dump file:    ${DB_DUMP}"
echo "Storage file: ${STORAGE_ARCHIVE:-none}"
echo ""
echo "⚠️  THIS WILL DROP AND RECREATE THE DATABASE!"
echo "   All current data in ${DB_DATABASE} will be LOST."
echo ""
read -p "Type 'RESTORE' to continue: " CONFIRM
if [[ "${CONFIRM}" != "RESTORE" ]]; then
  echo "Aborted."
  exit 1
fi

# 1. Pre-restore safety snapshot
SAFETY_DIR="/tmp/sibermas_pre_restore_$(date +%s)"
mkdir -p "${SAFETY_DIR}"
SAFETY_DUMP="${SAFETY_DIR}/pre_restore.dump"
echo ""
echo "[1/4] Creating safety snapshot at ${SAFETY_DUMP}..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USERNAME}" \
  --format=custom --no-owner --no-privileges \
  --file="${SAFETY_DUMP}" "${DB_DATABASE}" || echo "  (skipped — current DB empty or unreachable)"

# 2. Drop + recreate database
echo "[2/4] Dropping and recreating ${DB_DATABASE}..."
PGPASSWORD="${DB_PASSWORD}" psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" -d postgres -c "
  SELECT pg_terminate_backend(pid) FROM pg_stat_activity
  WHERE datname = '${DB_DATABASE}' AND pid <> pg_backend_pid();
" > /dev/null
PGPASSWORD="${DB_PASSWORD}" dropdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" --if-exists "${DB_DATABASE}"
PGPASSWORD="${DB_PASSWORD}" createdb -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USERNAME}" "${DB_DATABASE}"

# 3. Restore dump
echo "[3/4] Restoring database from ${DB_DUMP}..."
PGPASSWORD="${DB_PASSWORD}" pg_restore \
  --host="${DB_HOST}" --port="${DB_PORT}" --username="${DB_USERNAME}" \
  --dbname="${DB_DATABASE}" \
  --no-owner --no-privileges \
  --clean --if-exists \
  "${DB_DUMP}" || echo "  (warnings may appear — check output above)"

# 4. Restore storage if provided
if [[ -n "${STORAGE_ARCHIVE}" ]] && [[ -f "${STORAGE_ARCHIVE}" ]]; then
  echo "[4/4] Restoring storage from ${STORAGE_ARCHIVE}..."
  STORAGE_PARENT="${API_DIR}/storage/app"
  mkdir -p "${STORAGE_PARENT}"
  # Backup existing before replacing
  if [[ -d "${STORAGE_PARENT}/public" ]]; then
    mv "${STORAGE_PARENT}/public" "${STORAGE_PARENT}/public.pre_restore_$(date +%s)"
  fi
  tar -xzf "${STORAGE_ARCHIVE}" -C "${STORAGE_PARENT}"
  echo "  OK"
else
  echo "[4/4] SKIP — no storage archive provided"
fi

# 5. Clear Laravel caches (config/route/view) — dump may have stale cached values
echo ""
echo "[post] Clearing Laravel caches..."
cd "${API_DIR}"
php artisan config:clear 2>&1 | tail -1
php artisan cache:clear 2>&1 | tail -1
php artisan route:clear 2>&1 | tail -1

echo ""
echo "== Restore complete =="
echo "Safety snapshot (pre-restore): ${SAFETY_DUMP}"
echo "Verify app health at: http://127.0.0.1/api/health (local) or https://sibermas.uinsaizu.ac.id/api/health (public)"
