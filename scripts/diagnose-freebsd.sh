#!/bin/sh
# diagnose-freebsd.sh — Diagnostic tool kalau deploy SIBERMAS gagal
#
# Usage:
#   sh scripts/diagnose-freebsd.sh
#   sh scripts/diagnose-freebsd.sh > diagnose.log  # capture untuk debug
#
# Tidak mengubah apa pun. Hanya inspect state.

set -u

PHP_VERSION="${PHP_VERSION:-84}"
PG_VERSION="${PG_VERSION:-18}"
APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
PG_DATA_DIR="/var/db/postgres/data${PG_VERSION}"
LOG_DIR="/var/log/sibermas"
NGINX_LOG_DIR="/var/log/nginx"

echo "═══════════════════════════════════════════════════════"
echo "  SIBERMAS FreeBSD Deployment Diagnostics"
echo "  $(date -u) UTC"
echo "═══════════════════════════════════════════════════════"

section() {
  echo ""
  echo "═══ $1 ═══"
}

# ─── 1. System Info ────────────────────────────────────────────────────
section "1. System Info"
echo "Hostname:    $(hostname 2>/dev/null)"
echo "OS:          $(uname -srv 2>/dev/null)"
echo "Uptime:      $(uptime 2>/dev/null)"
echo "Memory:"
echo "  Total:   $(($(sysctl -n hw.physmem 2>/dev/null) / 1024 / 1024)) MB"
echo "  Free:    $(($(sysctl -n vm.stats.vm.v_free_count 2>/dev/null) * $(sysctl -n hw.pagesize 2>/dev/null) / 1024 / 1024)) MB"
echo "Disk:"
df -h / /var "$APP_DIR" 2>/dev/null | head -10

# ─── 2. Services ───────────────────────────────────────────────────────
section "2. Services Status"

check_service() {
  name="$1"
  if service "$name" status >/dev/null 2>&1; then
    echo "  [RUNNING] $name"
  else
    STATUS=$(service "$name" status 2>&1 | head -1)
    echo "  [STOPPED] $name — $STATUS"
  fi
}

check_service nginx
check_service "php-fpm"
check_service postgresql
check_service redis
check_service supervisord
check_service pf

# ─── 3. Listening Ports ────────────────────────────────────────────────
section "3. Listening Ports"
echo "Port  | Process"
sockstat -4 -l 2>/dev/null | awk 'NR>1 {print $6, "|", $2"("$3")"}' | sort -u | head -20 || echo "  (sockstat unavailable)"

# ─── 4. App Directory ──────────────────────────────────────────────────
section "4. App Directory"

if [ -d "$APP_DIR" ]; then
  echo "App dir: $APP_DIR (ada)"
  ls -la "$APP_DIR" 2>/dev/null | head -15
  echo ""
  if [ -d "$APP_DIR/apps/api" ]; then
    echo ".env exists: $([ -f "$APP_DIR/apps/api/.env" ] && echo YES || echo NO)"
    if [ -f "$APP_DIR/apps/api/.env" ]; then
      echo ".env permissions: $(stat -f '%Sp %Su:%Sg' "$APP_DIR/apps/api/.env" 2>/dev/null)"
      echo "APP_KEY set:    $(grep -c '^APP_KEY=base64:' "$APP_DIR/apps/api/.env" 2>/dev/null || echo 0) (>0 = set)"
      echo "APP_ENV:        $(grep '^APP_ENV=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
      echo "DB_CONNECTION:  $(grep '^DB_CONNECTION=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
      echo "DB_DATABASE:    $(grep '^DB_DATABASE=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
    fi
  fi
  if [ -f "$APP_DIR/apps/web/.next/standalone/apps/web/server.js" ]; then
    echo "Next.js standalone build: OK"
  else
    echo "Next.js standalone build: MISSING (pnpm build:web belum jalan, atau gagal)"
  fi
  if [ -d "$APP_DIR/apps/api/vendor" ]; then
    echo "Composer vendor: OK ($(find "$APP_DIR/apps/api/vendor" -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ') subdirs)"
  else
    echo "Composer vendor: MISSING (composer install belum jalan)"
  fi
else
  echo "App dir TIDAK ADA: $APP_DIR"
fi

# ─── 5. PHP & Composer ─────────────────────────────────────────────────
section "5. PHP & Composer"
php -v 2>/dev/null | head -2 || echo "  php tidak ditemukan"
echo ""
echo "Loaded extensions (yang relevan):"
php -m 2>/dev/null | grep -iE 'pdo_pgsql|redis|sodium|opcache|gd|mbstring|intl|bcmath|pcntl|curl|zip|sockets' | sed 's/^/  /'
echo ""
composer -V 2>/dev/null || echo "  composer tidak ditemukan"
echo ""
echo "PHP-FPM socket: /var/run/php-fpm.sock"
ls -la /var/run/php-fpm.sock 2>/dev/null || echo "  (socket tidak ada — php-fpm belum start)"
echo ""
echo "OPcache config:"
php -r 'foreach (["enable","memory_consumption","validate_timestamps","max_accelerated_files"] as $k) echo "  opcache.$k = " . ini_get("opcache.$k") . "\n";' 2>/dev/null

# ─── 6. PostgreSQL ─────────────────────────────────────────────────────
section "6. PostgreSQL"
if [ -d "$PG_DATA_DIR" ]; then
  echo "Data dir: $PG_DATA_DIR"
  if [ -f "$PG_DATA_DIR/PG_VERSION" ]; then
    echo "PG version: $(cat "$PG_DATA_DIR/PG_VERSION" 2>/dev/null)"
  fi
  echo "Listen addresses:"
  grep -E '^[[:space:]]*listen_addresses' "$PG_DATA_DIR/postgresql.conf" 2>/dev/null || echo "  (default = localhost)"
  echo "pg_hba.conf entries (relevant):"
  grep -E '^[[:space:]]*(local|host)' "$PG_DATA_DIR/pg_hba.conf" 2>/dev/null | grep -v '^#' | head -10 | sed 's/^/  /'
else
  echo "PG data dir TIDAK ADA: $PG_DATA_DIR"
  for OLD in 14 15 16 17; do
    if [ -d "/var/db/postgres/data${OLD}" ]; then
      echo "Ditemukan PG lama: /var/db/postgres/data${OLD}"
    fi
  done
fi

# Test koneksi DB pakai .env
if [ -f "$APP_DIR/apps/api/.env" ]; then
  DB_HOST=$(grep '^DB_HOST=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
  DB_PORT=$(grep '^DB_PORT=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
  DB_DATABASE=$(grep '^DB_DATABASE=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
  DB_USERNAME=$(grep '^DB_USERNAME=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2 | tr -d '"' | tr -d "'")
  echo ""
  echo "Test connect ke ${DB_USERNAME}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}:"
  if command -v psql >/dev/null 2>&1; then
    DB_PASSWORD=$(grep '^DB_PASSWORD=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' | tr -d "'")
    if PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "${DB_PORT:-5432}" -U "$DB_USERNAME" -d "$DB_DATABASE" -c 'SELECT 1' >/dev/null 2>&1; then
      echo "  [OK] Connect berhasil"
    else
      echo "  [FAIL] Connect gagal — cek username/password/host/port"
    fi
  else
    echo "  (psql tidak ada — skip test)"
  fi
fi

# ─── 7. Redis ──────────────────────────────────────────────────────────
section "7. Redis"
if command -v redis-cli >/dev/null 2>&1; then
  if redis-cli -h 127.0.0.1 ping 2>/dev/null | grep -q PONG; then
    echo "  [OK] Redis PING di 127.0.0.1"
    REDIS_INFO=$(redis-cli -h 127.0.0.1 info server 2>/dev/null | grep -E '^redis_version|^uptime_in_seconds')
    echo "$REDIS_INFO" | sed 's/^/  /'
  else
    echo "  [FAIL] Redis tidak respond — cek service redis status"
  fi
else
  echo "  redis-cli tidak ditemukan"
fi

# ─── 8. Nginx ──────────────────────────────────────────────────────────
section "8. Nginx"
if [ -f /usr/local/etc/nginx/nginx.conf ]; then
  echo "Config: /usr/local/etc/nginx/nginx.conf"
  echo "Test config:"
  nginx -t 2>&1 | sed 's/^/  /'
  echo ""
  echo "Last 5 access log entries:"
  tail -5 "$NGINX_LOG_DIR/sibermas-access.log" 2>/dev/null | sed 's/^/  /' || echo "  (log tidak ada)"
  echo ""
  echo "Last 10 error log entries:"
  tail -10 "$NGINX_LOG_DIR/sibermas-error.log" 2>/dev/null | sed 's/^/  /' || echo "  (log tidak ada)"
fi

# ─── 9. Supervisord ────────────────────────────────────────────────────
section "9. Supervisord"
if command -v supervisorctl >/dev/null 2>&1; then
  supervisorctl status 2>&1 | sed 's/^/  /'
else
  echo "  supervisorctl tidak ditemukan"
fi

# ─── 10. Application Logs ──────────────────────────────────────────────
section "10. Application Logs"
if [ -d "$LOG_DIR" ]; then
  echo "Log dir: $LOG_DIR"
  ls -la "$LOG_DIR" 2>/dev/null | tail -10 | sed 's/^/  /'
  echo ""
  for f in "$LOG_DIR/web.log" "$LOG_DIR/worker-default.log" "$LOG_DIR/worker-low.log"; do
    if [ -f "$f" ]; then
      echo "Last 5 lines $f:"
      tail -5 "$f" 2>/dev/null | sed 's/^/  /'
      echo ""
    fi
  done
fi

if [ -f "$APP_DIR/apps/api/storage/logs/laravel.log" ]; then
  echo "Last 20 lines laravel.log:"
  tail -20 "$APP_DIR/apps/api/storage/logs/laravel.log" 2>/dev/null | sed 's/^/  /'
fi

# ─── 11. HTTP Health Check ─────────────────────────────────────────────
section "11. HTTP Health Check"
echo "Test localhost:80 (Nginx):"
curl -sI -m 5 http://127.0.0.1/ 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"
echo ""
echo "Test localhost:3000 (Next.js):"
curl -sI -m 5 http://127.0.0.1:3000/ 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"
echo ""
echo "Test API health:"
curl -s -m 5 http://127.0.0.1/api/health 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"

# ─── 12. Most Common Issues Quick Check ────────────────────────────────
section "12. Common Issues Quick Check"

# A. APP_KEY kosong
if [ -f "$APP_DIR/apps/api/.env" ]; then
  if ! grep -qE '^APP_KEY=base64:[A-Za-z0-9+/=]{44,}' "$APP_DIR/apps/api/.env" 2>/dev/null; then
    echo "  [WARN] APP_KEY belum di-set di .env — jalankan: php artisan key:generate --force"
  fi
fi

# B. Migration belum jalan
if [ -f "$APP_DIR/apps/api/.env" ] && command -v php >/dev/null 2>&1; then
  cd "$APP_DIR/apps/api" 2>/dev/null && {
    PENDING=$(php artisan migrate:status 2>/dev/null | grep -c "Pending")
    if [ "$PENDING" -gt 0 ]; then
      echo "  [WARN] Ada $PENDING migration yang belum jalan — php artisan migrate --force"
    fi
  }
fi

# C. Permissions storage
if [ -d "$APP_DIR/apps/api/storage" ]; then
  STORAGE_OWNER=$(stat -f '%Su' "$APP_DIR/apps/api/storage" 2>/dev/null)
  if [ "$STORAGE_OWNER" != "www" ]; then
    echo "  [WARN] storage/ owned by '$STORAGE_OWNER', bukan 'www' — chown -R www:www storage/"
  fi
fi

# D. Composer vendor missing
if [ -d "$APP_DIR/apps/api" ] && [ ! -d "$APP_DIR/apps/api/vendor" ]; then
  echo "  [FAIL] composer install belum jalan di apps/api/"
fi

# E. Next.js standalone missing
if [ -d "$APP_DIR/apps/web" ] && [ ! -f "$APP_DIR/apps/web/.next/standalone/apps/web/server.js" ]; then
  echo "  [FAIL] Next.js belum di-build (TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm build)"
fi

# F. PHP-FPM socket permissions
if [ -S /var/run/php-fpm.sock ]; then
  SOCK_PERM=$(stat -f '%Sp' /var/run/php-fpm.sock 2>/dev/null)
  echo "  PHP-FPM socket permissions: $SOCK_PERM"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Diagnostics Selesai"
echo "═══════════════════════════════════════════════════════"
echo ""
echo "Untuk capture output:"
echo "  sh scripts/diagnose-freebsd.sh > diagnose-\$(date +%Y%m%d_%H%M%S).log 2>&1"
