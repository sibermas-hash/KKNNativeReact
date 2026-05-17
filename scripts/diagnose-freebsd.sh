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
WEB_DOMAIN="${WEB_DOMAIN:-sibermas.uinsaizu.ac.id}"
CERT_BASE="${CERT_BASE:-$WEB_DOMAIN}"
EDGE_REVERSE_PROXY="${EDGE_REVERSE_PROXY:-0}"
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

resolve_records() {
  record_type="$1"
  name="$2"
  case "${RESOLVER:-}" in
    drill)
      drill "$record_type" "$name" 2>/dev/null | awk -v t="$record_type" '$4 == t {print $5}' | sort -u
      ;;
    dig)
      dig +short "$record_type" "$name" 2>/dev/null | sed '/^$/d' | sort -u
      ;;
    host)
      host -t "$record_type" "$name" 2>/dev/null | awk '
        / has address / {print $4}
        / IPv6 address / {print $5}
      ' | sort -u
      ;;
    *)
      return 1
      ;;
  esac
}

global_ipv6_list() {
  if command -v ifconfig >/dev/null 2>&1; then
    ifconfig 2>/dev/null | awk '
      /inet6 / {
        split($2, addr, "%")
        if (addr[1] != "::1" && addr[1] !~ /^fe80:/) {
          print addr[1]
        }
      }
    ' | sort -u
  fi
}

resolve_path() {
  path="$1"
  if command -v realpath >/dev/null 2>&1; then
    realpath "$path" 2>/dev/null || readlink "$path" 2>/dev/null || printf '%s\n' "$path"
  else
    readlink "$path" 2>/dev/null || printf '%s\n' "$path"
  fi
}

hosts_has_domain() {
  domain="$1"
  awk -v domain="$domain" '
    /^[[:space:]]*#/ {next}
    {
      for (i = 2; i <= NF; i++) {
        if ($i == domain) {
          found = 1
        }
      }
    }
    END { exit(found ? 0 : 1) }
  ' /etc/hosts 2>/dev/null
}

show_hosts_domain_lines() {
  domain="$1"
  awk -v domain="$domain" '
    /^[[:space:]]*#/ {next}
    {
      for (i = 2; i <= NF; i++) {
        if ($i == domain) {
          print NR ":" $0
          break
        }
      }
    }
  ' /etc/hosts 2>/dev/null
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
check_service apache24
check_service "php-fpm"
check_service postgresql
check_service redis
check_service supervisord
check_service sibermas_web
check_service sibermas_queue
check_service pf

# ─── 3. Listening Ports ────────────────────────────────────────────────
section "3. Listening Ports"
echo "Port  | Process"
sockstat -4 -l 2>/dev/null | awk 'NR>1 {print $6, "|", $2"("$3")"}' | sort -u | head -20 || echo "  (sockstat unavailable)"
PUBLIC_HTTPD=$(sockstat -4 -l 2>/dev/null | awk '$2 ~ /^(httpd|apache|apache24)$/ && ($6 ~ /:(80|443)$/) {print}' || true)
if [ -n "$PUBLIC_HTTPD" ]; then
  echo ""
  echo "  [FAIL] Apache/httpd listen di port publik 80/443. Untuk profile ini Nginx harus owns 80/443; Apache24 hanya 127.0.0.1:8080."
  echo "$PUBLIC_HTTPD" | sed 's/^/    /'
fi

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
      echo "DB_HOST:        $(grep '^DB_HOST=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
      echo "DB_PORT:        $(grep '^DB_PORT=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
      echo "DB_DATABASE:    $(grep '^DB_DATABASE=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
      echo "DB_USERNAME:    $(grep '^DB_USERNAME=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
      echo "DB_SSLMODE:     $(grep '^DB_SSLMODE=' "$APP_DIR/apps/api/.env" 2>/dev/null | cut -d= -f2)"
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

# ─── 9. Apache24 / rc.d Runtime ────────────────────────────────────────
section "9. Apache24 / rc.d Runtime"
if [ -f /usr/local/etc/apache24/Includes/sibermas-api.conf ]; then
  echo "Apache API config: /usr/local/etc/apache24/Includes/sibermas-api.conf"
  echo "Test config:"
  apachectl configtest 2>&1 | sed 's/^/  /'
  echo ""
  echo "Last 10 Apache API error log entries:"
  tail -10 "$LOG_DIR/apache-api-error.log" 2>/dev/null | sed 's/^/  /' || echo "  (log tidak ada)"
fi

if service sibermas_web status >/dev/null 2>&1; then
  service sibermas_web status 2>&1 | sed 's/^/  /'
fi
if service sibermas_queue status >/dev/null 2>&1; then
  service sibermas_queue status 2>&1 | sed 's/^/  /'
fi
WEB_BIND_HOST=$(sysrc -n sibermas_web_host 2>/dev/null || true)
WEB_BIND_PORT=$(sysrc -n sibermas_web_port 2>/dev/null || true)
[ -n "$WEB_BIND_HOST" ] || WEB_BIND_HOST="127.0.0.1"
[ -n "$WEB_BIND_PORT" ] || WEB_BIND_PORT="3000"
echo "Configured sibermas_web bind: ${WEB_BIND_HOST}:${WEB_BIND_PORT}"
if [ "$WEB_BIND_HOST" != "127.0.0.1" ] || [ "$WEB_BIND_PORT" != "3000" ]; then
  echo "  [WARN] Untuk profile native ini, Next.js sebaiknya tetap internal di 127.0.0.1:3000 dan Nginx yang owns 80/443."
fi

# ─── 10. Supervisord ───────────────────────────────────────────────────
section "10. Supervisord"
if command -v supervisorctl >/dev/null 2>&1; then
  supervisorctl status 2>&1 | sed 's/^/  /'
else
  echo "  supervisorctl tidak ditemukan"
fi

# ─── 11. Application Logs ──────────────────────────────────────────────
section "11. Application Logs"
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

# ─── 12. HTTP Health Check ─────────────────────────────────────────────
section "12. HTTP Health Check"
echo "Test localhost:80 (Nginx):"
curl -sI -m 5 http://127.0.0.1/ 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"
echo ""
echo "Test localhost:8080 (Apache API backend):"
curl -sI -m 5 http://127.0.0.1:8080/api/health 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"
echo ""
echo "Test localhost:3000 (Next.js):"
curl -sI -m 5 http://127.0.0.1:3000/ 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"
echo ""
echo "Test API health:"
curl -s -m 5 http://127.0.0.1/api/health 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"
echo ""
echo "Test login preflight (captcha endpoint):"
curl -s -m 5 http://127.0.0.1/api/v1/auth/captcha 2>&1 | head -5 | sed 's/^/  /' || echo "  curl gagal"

# ─── 13. Public DNS / TLS sanity ───────────────────────────────────────
section "13. Public DNS / TLS sanity"

if [ -f /etc/hosts ] && hosts_has_domain "$WEB_DOMAIN"; then
  echo "  [WARN] /etc/hosts override terdeteksi untuk $WEB_DOMAIN:"
  show_hosts_domain_lines "$WEB_DOMAIN" | sed 's/^/    /'
else
  echo "  [OK] Tidak ada override /etc/hosts untuk $WEB_DOMAIN"
fi

if command -v drill >/dev/null 2>&1; then
  RESOLVER="drill"
elif command -v dig >/dev/null 2>&1; then
  RESOLVER="dig"
elif command -v host >/dev/null 2>&1; then
  RESOLVER="host"
else
  RESOLVER=""
fi

if [ -n "$RESOLVER" ]; then
  A_RECORDS="$(resolve_records A "$WEB_DOMAIN" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  AAAA_RECORDS="$(resolve_records AAAA "$WEB_DOMAIN" | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
  echo "Public A:         ${A_RECORDS:-<none>}"
  echo "Public AAAA:      ${AAAA_RECORDS:-<none>}"
else
  echo "Resolver tool:    <none>"
fi

GLOBAL_IPV6="$(global_ipv6_list | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
echo "Origin global IPv6: ${GLOBAL_IPV6:-<none>}"
if [ -n "${AAAA_RECORDS:-}" ] && [ -z "$GLOBAL_IPV6" ]; then
  echo "  [WARN] AAAA publik ada tapi origin ini tidak punya global IPv6"
fi

echo ""
echo "Strict HTTPS check ke https://$WEB_DOMAIN/:"
if command -v curl >/dev/null 2>&1; then
  curl -sSI -m 10 "https://$WEB_DOMAIN/" 2>&1 | head -10 | sed 's/^/  /' || echo "  curl gagal"
else
  echo "  curl tidak ditemukan"
fi

if [ "${EDGE_REVERSE_PROXY}" = "1" ]; then
  echo "Origin cert file: <skipped> EDGE_REVERSE_PROXY=1 (TLS terminates at frontend/gateway)"
else
  CERT_FILE="/usr/local/etc/letsencrypt/live/${CERT_BASE}/fullchain.pem"
  if [ -f "$CERT_FILE" ]; then
    RESOLVED_CERT="$(resolve_path "$CERT_FILE")"
    echo ""
    echo "Origin cert file: $CERT_FILE"
    echo "Resolved path:    $RESOLVED_CERT"
    case "$RESOLVED_CERT" in
      *selfsigned*|*/nginx/ssl/*)
        echo "  [WARN] Cert path mengarah ke self-signed/internal cert"
        ;;
    esac

    if command -v openssl >/dev/null 2>&1; then
      CERT_SUBJECT="$(openssl x509 -in "$CERT_FILE" -noout -subject -nameopt RFC2253 2>/dev/null | sed 's/^subject=//')"
      CERT_ISSUER="$(openssl x509 -in "$CERT_FILE" -noout -issuer -nameopt RFC2253 2>/dev/null | sed 's/^issuer=//')"
      CERT_SAN="$(openssl x509 -in "$CERT_FILE" -noout -ext subjectAltName 2>/dev/null | sed '1d' | tr '\n' ' ' | sed 's/[[:space:]]*$//')"
      echo "Subject:          ${CERT_SUBJECT:-<unreadable>}"
      echo "Issuer:           ${CERT_ISSUER:-<unreadable>}"
      echo "SAN:              ${CERT_SAN:-<missing>}"
    else
      echo "openssl:          <not installed>"
    fi
  else
    echo "Origin cert file: <missing> $CERT_FILE"
  fi
fi

# ─── 14. Most Common Issues Quick Check ────────────────────────────────
section "14. Common Issues Quick Check"

# A. APP_KEY kosong
if [ -f "$APP_DIR/apps/api/.env" ]; then
  if ! grep -qE '^APP_KEY=base64:[A-Za-z0-9+/=]{44,}' "$APP_DIR/apps/api/.env" 2>/dev/null; then
    echo "  [WARN] APP_KEY belum di-set di .env — jalankan: php artisan key:generate --force"
  fi
  echo ""
  echo "Login/session env:"
  for k in APP_URL APP_FRONTEND_URL SESSION_DOMAIN SANCTUM_STATEFUL_DOMAINS CORS_ALLOWED_ORIGINS SESSION_SECURE_COOKIE SESSION_SAME_SITE; do
    grep "^${k}=" "$APP_DIR/apps/api/.env" 2>/dev/null | sed 's/^/  /'
  done
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
