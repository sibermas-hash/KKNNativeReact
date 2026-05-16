#!/usr/bin/env bash
# deploy-freebsd-apache-nginx.sh
#
# Single-server FreeBSD deploy/redeploy profile:
#   - Nginx public frontend on 80/443
#   - Apache24 internal Laravel API backend on 127.0.0.1:8080
#   - PHP-FPM via /var/run/php-fpm.sock
#   - Next.js standalone on 127.0.0.1:3000 via rc.d + daemon(8)
#   - Laravel queue workers via rc.d + daemon(8), no Supervisor
#
# Run on the FreeBSD server from the repository root:
#   KKN_SUPERADMIN_PASSWORD='strong-password' bash deploy-freebsd-apache-nginx.sh
# Optional behind-gateway mode:
#   EDGE_REVERSE_PROXY=1 bash deploy-freebsd-apache-nginx.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-${SCRIPT_DIR}}"
APP_DIR="$(cd "${APP_DIR}" && pwd)"
API_DIR="${APP_DIR}/apps/api"
WEB_DIR="${APP_DIR}/apps/web"
ENV_FILE="${API_DIR}/.env"
DB_PASS_FILE="${APP_DIR}/.db_password.initial"

WEB_USER="${WEB_USER:-www}"
WEB_DOMAIN="${WEB_DOMAIN:-sibermas.uinsaizu.ac.id}"
CERT_BASE="${CERT_BASE:-${WEB_DOMAIN}}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://${WEB_DOMAIN}}"
LOG_DIR="${LOG_DIR:-/var/log/sibermas}"
API_PUBLIC_URL="${API_PUBLIC_URL:-${PUBLIC_BASE_URL%/}/api}"
API_V1_PUBLIC_URL="${API_V1_PUBLIC_URL:-${PUBLIC_BASE_URL%/}/api/v1}"

APACHE_HTTPD_CONF="${APACHE_HTTPD_CONF:-/usr/local/etc/apache24/httpd.conf}"
APACHE_DEST="${APACHE_DEST:-/usr/local/etc/apache24/Includes/sibermas-api.conf}"
MODSECURITY_CRS_SETUP="${MODSECURITY_CRS_SETUP:-/usr/local/etc/modsecurity-crs/crs-setup.conf}"
NGINX_DEST="${NGINX_DEST:-/usr/local/etc/nginx/vhosts/sibermas.conf}"
PHP_FPM_POOL_DEST="${PHP_FPM_POOL_DEST:-/usr/local/etc/php-fpm.d/sibermas.conf}"
RC_D_DEST="${RC_D_DEST:-/usr/local/etc/rc.d}"

SKIP_MIGRATE="${SKIP_MIGRATE:-0}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-0}"
DISABLE_SUPERVISOR="${DISABLE_SUPERVISOR:-1}"
INSTALL_CRON="${INSTALL_CRON:-1}"
EDGE_REVERSE_PROXY="${EDGE_REVERSE_PROXY:-0}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

step() {
  echo ""
  echo "==> $*"
}

backup_file() {
  local file="$1"
  if [ -f "${file}" ]; then
    cp "${file}" "${file}.bak.$(date +%Y%m%d%H%M%S)"
  fi
}

escape_sed() {
  printf '%s' "$1" | sed 's/[&|\\]/\\&/g'
}

env_value() {
  local key="$1"
  if [ ! -f "${ENV_FILE}" ]; then
    return 0
  fi

  grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null \
    | tail -n 1 \
    | cut -d= -f2- \
    | sed -E 's/[[:space:]]+#.*$//' \
    | tr -d '"' \
    | tr -d "'" \
    | xargs 2>/dev/null || true
}

set_env() {
  local key="$1"
  local value="$2"
  local escaped
  escaped="$(escape_sed "${value}")"

  if grep -qE "^${key}=" "${ENV_FILE}" 2>/dev/null; then
    sed -i '' "s|^${key}=.*|${key}=${escaped}|" "${ENV_FILE}"
  else
    printf '%s=%s\n' "${key}" "${value}" >> "${ENV_FILE}"
  fi
}

generate_secret() {
  openssl rand -base64 32 | tr -d '\n'
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Command '$1' belum tersedia. Install paket FreeBSD yang dibutuhkan dulu."
}

render_template() {
  local src="$1"
  local dest="$2"
  backup_file "${dest}"
  sed -e "s|__WEB_DOMAIN__|${WEB_DOMAIN}|g" \
      -e "s|__CERT_BASE__|${CERT_BASE}|g" \
      -e "s|__APP_DIR__|${APP_DIR}|g" \
      "${src}" > "${dest}"
}

validate_rendered_nginx() {
  [ -f "${NGINX_DEST}" ] || return 0
  if ! grep -q 'forwarded_proto' "${NGINX_DEST}" 2>/dev/null; then
    echo "WARNING: Nginx vhost missing forwarded_proto — template will be re-rendered."
  fi
}

nginx_template_path() {
  if [ "${EDGE_REVERSE_PROXY}" = "1" ]; then
    printf '%s' "${APP_DIR}/conf/nginx-vhost-sibermas-http.conf"
  else
    printf '%s' "${APP_DIR}/conf/nginx-vhost-sibermas.conf"
  fi
}

public_health_check() {
  [ "${PUBLIC_HEALTH_CHECK:-0}" = "1" ] || return 0
  step "Public reverse-proxy health check"
  curl -fsS -m 15 "${PUBLIC_BASE_URL%/}/api/health" >/dev/null \
    || die "Public health check gagal: ${PUBLIC_BASE_URL%/}/api/health. Cek Cloudflare/reverse proxy/vhost."
  curl -fsS -m 15 "${PUBLIC_BASE_URL%/}/api/v1/auth/captcha" >/dev/null \
    || die "Public login preflight gagal: ${PUBLIC_BASE_URL%/}/api/v1/auth/captcha."
  echo "OK: public reverse-proxy path healthy."
}

enable_apache_module() {
  local module="$1"
  [ -f "${APACHE_HTTPD_CONF}" ] || return 0

  sed -i '' -E \
    "s|^#LoadModule[[:space:]]+${module}_module[[:space:]]+|LoadModule ${module}_module |" \
    "${APACHE_HTTPD_CONF}" 2>/dev/null || true
}

ensure_apache_includes() {
  [ -f "${APACHE_HTTPD_CONF}" ] || return 0

  if ! grep -qE '^[[:space:]]*Include[[:space:]]+.*Includes/\*\.conf' "${APACHE_HTTPD_CONF}"; then
    backup_file "${APACHE_HTTPD_CONF}"
    {
      echo ""
      echo "# SIBERMAS vhost includes"
      echo "Include etc/apache24/Includes/*.conf"
    } >> "${APACHE_HTTPD_CONF}"
  fi
}

disable_apache_public_listen() {
  [ -f "${APACHE_HTTPD_CONF}" ] || return 0
  if grep -qE '^Listen[[:space:]]+([^#[:space:]]+:)?(80|443)([[:space:]]*)$' "${APACHE_HTTPD_CONF}"; then
    backup_file "${APACHE_HTTPD_CONF}"
    sed -i '' -E \
      's|^Listen[[:space:]]+([^#[:space:]]+:)?(80|443)([[:space:]]*)$|# &  # disabled by SIBERMAS; Nginx owns public 80/443|' \
      "${APACHE_HTTPD_CONF}"
  fi
}

disable_legacy_apache_vhosts() {
  local legacy_dir="/usr/local/etc/apache24/Vhosts"
  local legacy_file
  local placeholder="${legacy_dir}/000-disabled-placeholder.conf"

  [ -d "${legacy_dir}" ] || return 0

  while IFS= read -r legacy_file; do
    [ -f "${legacy_file}" ] || continue

    if ! grep -qE "Server(Name|Alias)[[:space:]]+${WEB_DOMAIN//./\\.}" "${legacy_file}" 2>/dev/null; then
      continue
    fi

    if ! grep -qE '<VirtualHost[[:space:]]+([^>]*:)?(80|443)>' "${legacy_file}" 2>/dev/null; then
      continue
    fi

    mv "${legacy_file}" "${legacy_file}.disabled"
    echo "Disabled legacy Apache vhost: ${legacy_file}"
  done < <(find "${legacy_dir}" -maxdepth 1 -type f -name '*.conf' | sort)

  if ! find "${legacy_dir}" -maxdepth 1 -type f -name '*.conf' | grep -q .; then
    cat > "${placeholder}" <<'EOF'
# Placeholder file to keep Apache wildcard Include happy when all legacy
# vhosts have been disabled by SIBERMAS deploy automation.
EOF
  fi
}

ensure_modsecurity_rest_methods() {
  [ -f "${MODSECURITY_CRS_SETUP}" ] || return 0

  if grep -q "tx.allowed_methods=.*PATCH" "${MODSECURITY_CRS_SETUP}" 2>/dev/null \
    && grep -q "tx.allowed_methods=.*PUT" "${MODSECURITY_CRS_SETUP}" 2>/dev/null \
    && grep -q "tx.allowed_methods=.*DELETE" "${MODSECURITY_CRS_SETUP}" 2>/dev/null; then
    echo "ModSecurity CRS already allows REST methods."
    return 0
  fi

  backup_file "${MODSECURITY_CRS_SETUP}"
  cat >> "${MODSECURITY_CRS_SETUP}" <<'EOF'

# SIBERMAS compatibility override:
# Apache + ModSecurity CRS defaults to GET/HEAD/POST/OPTIONS only, which
# blocks Laravel REST endpoints such as PATCH /api/v1/profile/password.
SecAction \
    "id:1000200,\
    phase:1,\
    pass,\
    t:none,\
    nolog,\
    tag:'SIBERMAS',\
    ver:'local',\
    setvar:'tx.allowed_methods=GET HEAD POST PUT PATCH DELETE OPTIONS'"
EOF
  echo "Applied ModSecurity CRS REST-method override."
}

assert_port_ownership() {
  if ! command -v sockstat >/dev/null 2>&1; then
    echo "sockstat unavailable; skipping port ownership check"
    return 0
  fi

  local public_httpd
  public_httpd="$(sockstat -4 -l 2>/dev/null | awk '$2 ~ /^(httpd|apache|apache24)$/ && ($6 ~ /:(80|443)$/) {print}' || true)"
  if [ -n "${public_httpd}" ]; then
    echo "${public_httpd}" >&2
    die "Apache/httpd masih listen di port publik 80/443. Nginx harus owns 80/443; Apache24 backend hanya 127.0.0.1:8080. Stop/disable vhost Apache publik dulu."
  fi
}

install_cron_line() {
  local marker="# SIBERMAS scheduler"
  local line="* * * * * www cd ${API_DIR} && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1"

  if grep -qF "${marker}" /etc/crontab 2>/dev/null; then
    echo "Cron scheduler already marked in /etc/crontab"
    return 0
  fi

  {
    echo ""
    echo "${marker}"
    echo "${line}"
  } >> /etc/crontab
  echo "Added Laravel scheduler to /etc/crontab"
}

if [ "$(id -u)" -ne 0 ]; then
  die "Jalankan sebagai root: sudo bash deploy-freebsd-apache-nginx.sh"
fi

[ -f "${API_DIR}/composer.json" ] || die "Tidak menemukan ${API_DIR}/composer.json. Jalankan dari root repo."
[ -f "${WEB_DIR}/package.json" ] || die "Tidak menemukan ${WEB_DIR}/package.json. Jalankan dari root repo."

require_command php
require_command composer
require_command pnpm
require_command node
require_command service
require_command sysrc
require_command apachectl
require_command nginx

echo "============================================================"
echo " SIBERMAS FreeBSD Deploy: Apache24 backend + Nginx frontend"
echo " APP_DIR: ${APP_DIR}"
echo " DOMAIN : ${WEB_DOMAIN}"
if [ "${EDGE_REVERSE_PROXY}" = "1" ]; then
  echo " MODE   : backend HTTP only behind upstream reverse proxy"
  echo " TLS    : terminated at upstream gateway"
else
  echo " MODE   : direct-public Nginx vhost"
  echo " TLS    : terminated locally on this host"
fi
echo "============================================================"

step "Preparing directories"
mkdir -p "${LOG_DIR}" /usr/local/etc/apache24/Includes /usr/local/etc/php-fpm.d "${RC_D_DEST}"
mkdir -p \
  "${API_DIR}/storage/app/public" \
  "${API_DIR}/storage/framework/cache" \
  "${API_DIR}/storage/framework/sessions" \
  "${API_DIR}/storage/framework/views" \
  "${API_DIR}/storage/logs" \
  "${API_DIR}/bootstrap/cache"
chown -R "${WEB_USER}:${WEB_USER}" "${LOG_DIR}"

step "Preparing Laravel .env"
ENV_WAS_SEEDED=0
if [ ! -f "${ENV_FILE}" ]; then
  cp "${API_DIR}/.env.production.example" "${ENV_FILE}"
  chmod 600 "${ENV_FILE}"
  ENV_WAS_SEEDED=1
  echo "Seeded ${ENV_FILE} from .env.production.example"
fi

set_env APP_ENV production
set_env APP_DEBUG false
set_env DEBUGBAR_ENABLED false
set_env AUTH_TEST_AUTO_LOGIN_ENABLED false
set_env APP_URL "${API_PUBLIC_URL%/}"
set_env APP_FRONTEND_URL "${PUBLIC_BASE_URL%/}"
set_env DB_CONNECTION pgsql
set_env DB_HOST "${DB_HOST:-127.0.0.1}"
set_env DB_PORT "${DB_PORT:-5432}"
set_env DB_DATABASE "${DB_DATABASE:-kknnative}"
set_env DB_USERNAME "${DB_USERNAME:-kknuinsaizunative}"
set_env DB_SSLMODE "${DB_SSLMODE:-prefer}"
set_env SESSION_DOMAIN "${WEB_DOMAIN}"
set_env CORS_ALLOWED_ORIGINS "${PUBLIC_BASE_URL%/}"
set_env SANCTUM_STATEFUL_DOMAINS "${WEB_DOMAIN}"
set_env SESSION_DRIVER database
set_env SESSION_ENCRYPT true
set_env SESSION_SECURE_COOKIE true
set_env SESSION_HTTP_ONLY true
set_env SESSION_SAME_SITE strict
set_env TRUSTED_PROXIES "127.0.0.1,10.0.0.0/8,172.16.0.0/12,192.168.0.0/16"

LEGACY_TEMPLATE_DB_PASSWORD="kknuinsaizu2026native"
if [ "$(env_value DB_PASSWORD)" = "" ] || { [ "${ENV_WAS_SEEDED}" = "1" ] && [ "$(env_value DB_PASSWORD)" = "${LEGACY_TEMPLATE_DB_PASSWORD}" ]; }; then
  set_env DB_PASSWORD "${DB_PASSWORD:-$(generate_secret)}"
  echo "Filled DB_PASSWORD with a generated secret for this deployment"
fi

for key in APP_BLIND_INDEX_KEY API_ADMIN_SECRET MASTER_WEBHOOK_SECRET; do
  if [ "$(env_value "${key}")" = "" ]; then
    set_env "${key}" "$(generate_secret)"
    echo "Generated ${key}"
  fi
done

if [ "$(env_value DB_PASSWORD)" = "" ]; then
  die "DB_PASSWORD masih kosong di ${ENV_FILE}. Isi manual, atau jalankan install-freebsd.sh dulu agar ${DB_PASS_FILE} dibuat."
fi

step "Installing Laravel dependencies"
cd "${API_DIR}"
composer install --no-dev --optimize-autoloader --no-interaction

APP_KEY_VALUE="$(env_value APP_KEY)"
if [[ ! "${APP_KEY_VALUE}" =~ ^base64:[A-Za-z0-9+/=]{44,}$ ]]; then
  if [ "${APP_KEY_VALUE}" = "" ]; then
    php artisan key:generate --force
  else
    die "APP_KEY ada tapi formatnya tidak valid. Periksa ${ENV_FILE}; deploy tidak akan overwrite key non-kosong."
  fi
fi

php artisan optimize:clear

if [ "${SKIP_MIGRATE}" != "1" ]; then
  php artisan migrate --force
else
  echo "Skipping migrations because SKIP_MIGRATE=1"
fi

if [ -n "${KKN_SUPERADMIN_PASSWORD:-}" ]; then
  KKN_SUPERADMIN_PASSWORD="${KKN_SUPERADMIN_PASSWORD}" php artisan db:seed --class=SuperAdminSeeder --force
else
  echo "Skipping SuperAdminSeeder. Set KKN_SUPERADMIN_PASSWORD to seed/update the superadmin."
fi

php artisan storage:link --force
php artisan config:cache
php artisan route:cache
php artisan event:cache 2>/dev/null || true

if [ "${SKIP_FRONTEND_BUILD}" != "1" ]; then
  step "Installing and building Next.js frontend"
  cd "${APP_DIR}"
  export TURBO_INSTALL_SKIP_DOWNLOAD=1
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${API_V1_PUBLIC_URL%/}}"
  export SERVER_API_URL="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
  export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${PUBLIC_BASE_URL%/}}"
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-${PUBLIC_BASE_URL%/}}"
  export NEXT_PUBLIC_ENABLE_NOTIFICATION_SSE="${NEXT_PUBLIC_ENABLE_NOTIFICATION_SSE:-false}"

  rm -rf "${WEB_DIR}/.next"
  pnpm install --frozen-lockfile --filter web...
  pnpm build:packages
  pnpm build:web

  mkdir -p \
    "${WEB_DIR}/.next/standalone/apps/web/.next/static" \
    "${WEB_DIR}/.next/standalone/apps/web/public"
  cp -r "${WEB_DIR}/.next/static/." "${WEB_DIR}/.next/standalone/apps/web/.next/static"
  cp -r "${WEB_DIR}/public/." "${WEB_DIR}/.next/standalone/apps/web/public"
else
  echo "Skipping frontend build because SKIP_FRONTEND_BUILD=1"
fi

step "Installing Apache24, Nginx, PHP-FPM, and rc.d configuration"
for module in rewrite proxy proxy_fcgi headers setenvif; do
  enable_apache_module "${module}"
done
ensure_apache_includes
disable_apache_public_listen
disable_legacy_apache_vhosts
ensure_modsecurity_rest_methods

render_template "${APP_DIR}/conf/apache24-api.conf" "${APACHE_DEST}"
mkdir -p "$(dirname "${NGINX_DEST}")"
render_template "$(nginx_template_path)" "${NGINX_DEST}"
cp "${APP_DIR}/conf/php-fpm.sibermas.conf" "${PHP_FPM_POOL_DEST}"

install -m 0555 "${APP_DIR}/conf/rc.d/sibermas_web" "${RC_D_DEST}/sibermas_web"
install -m 0555 "${APP_DIR}/conf/rc.d/sibermas_nginx_watchdog" "${RC_D_DEST}/sibermas_nginx_watchdog"
install -m 0555 "${APP_DIR}/conf/rc.d/sibermas_queue" "${RC_D_DEST}/sibermas_queue"
install -m 0555 "${APP_DIR}/conf/bin/sibermas_nginx_watchdog.sh" "/usr/local/libexec/sibermas_nginx_watchdog.sh"

sysrc apache24_enable="YES"
sysrc nginx_enable="YES"
sysrc php_fpm_enable="YES"
sysrc sibermas_web_enable="YES"
sysrc sibermas_nginx_watchdog_enable="YES"
sysrc sibermas_nginx_watchdog_interval="5"
sysrc sibermas_web_app_dir="${APP_DIR}"
sysrc sibermas_web_user="${WEB_USER}"
sysrc sibermas_web_public_api_url="${API_V1_PUBLIC_URL%/}"
sysrc sibermas_web_server_api_url="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
sysrc sibermas_web_public_app_url="${PUBLIC_BASE_URL%/}"
sysrc sibermas_web_pidfile="${LOG_DIR}/sibermas-web.pid"
sysrc sibermas_web_child_pidfile="${LOG_DIR}/sibermas-web.child.pid"
sysrc sibermas_queue_enable="YES"
sysrc sibermas_queue_app_dir="${APP_DIR}"
sysrc sibermas_queue_user="${WEB_USER}"
sysrc sibermas_queue_pid_dir="${LOG_DIR}"

if [ "${DISABLE_SUPERVISOR}" = "1" ]; then
  step "Disabling Supervisor for this no-supervisor profile"
  if command -v supervisorctl >/dev/null 2>&1; then
    supervisorctl stop all 2>/dev/null || true
  fi
  service supervisord stop 2>/dev/null || true
  sysrc supervisord_enable="NO" 2>/dev/null || true
fi

if [ "${INSTALL_CRON}" = "1" ]; then
  step "Installing Laravel scheduler cron"
  install_cron_line
else
  echo ""
  echo "NOTE: Laravel scheduler not installed automatically."
  echo "      To add it now, rerun with INSTALL_CRON=1 or append this to /etc/crontab:"
  echo "      * * * * * www cd ${API_DIR} && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1"
fi

step "Fixing permissions"
chown -R "${WEB_USER}:${WEB_USER}" \
  "${API_DIR}/storage" \
  "${API_DIR}/bootstrap/cache"
if [ -d "${WEB_DIR}/.next" ]; then
  chown -R "${WEB_USER}:${WEB_USER}" "${WEB_DIR}/.next"
  find "${WEB_DIR}/.next/standalone" -type d -exec chmod 2775 {} + 2>/dev/null || true
  find "${WEB_DIR}/.next/standalone" -type f -exec chmod u+rw,g+r {} + 2>/dev/null || true
fi
find "${API_DIR}/storage" -type d -exec chmod 2775 {} +
find "${API_DIR}/storage" -type f -exec chmod 0664 {} +
chmod 0775 "${API_DIR}/bootstrap/cache"

step "Testing service configuration"
validate_rendered_nginx
apachectl configtest
nginx -t

step "Reloading services"
service php-fpm reload 2>/dev/null || service php-fpm restart
apachectl graceful 2>/dev/null || service apache24 restart
service sibermas_web restart
service sibermas_queue restart
service nginx status >/dev/null 2>&1 && service nginx reload || service nginx start
service sibermas_nginx_watchdog restart

assert_port_ownership

step "Health checks"
for i in $(seq 1 12); do
  if curl -sf -m 5 "http://127.0.0.1:8080/api/health" >/dev/null \
    && curl -sf -m 5 "http://127.0.0.1/api/health" >/dev/null \
    && curl -sf -m 5 "http://127.0.0.1/api/v1/auth/captcha" >/dev/null \
    && curl -sf -m 5 "http://127.0.0.1:3000/" >/dev/null; then
    echo "OK: Apache API backend, login preflight, Nginx edge, and Next.js are healthy."
    public_health_check
    echo ""
    echo "Deploy complete: ${PUBLIC_BASE_URL%/}"
    exit 0
  fi
  echo "Waiting for services (${i}/12)..."
  sleep 5
done

echo "Health check failed. Useful diagnostics:"
echo "  sh ${APP_DIR}/scripts/diagnose-freebsd.sh"
echo "  service apache24 status && tail -50 ${LOG_DIR}/apache-api-error.log"
echo "  service sibermas_web status && tail -50 ${LOG_DIR}/web.log"
echo "  service sibermas_queue status && tail -50 ${LOG_DIR}/worker-default.log"
exit 1
