#!/usr/bin/env bash
# deploy-freebsd-simple.sh - Single-server FreeBSD deploy/redeploy for SIBERMAS.
#
# Run on the FreeBSD server from the repository root:
#   bash deploy-freebsd-simple.sh
#
# Optional:
#   WEB_DOMAIN=staging.example.ac.id bash deploy-freebsd-simple.sh
#   SKIP_MIGRATE=1 bash deploy-freebsd-simple.sh
#   RENDER_NGINX=1 bash deploy-freebsd-simple.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="${APP_DIR:-${SCRIPT_DIR}}"
APP_DIR="$(cd "${APP_DIR}" && pwd)"
API_DIR="${APP_DIR}/apps/api"
WEB_DIR="${APP_DIR}/apps/web"
ENV_FILE="${API_DIR}/.env"
DB_PASS_FILE="${APP_DIR}/.db_password.initial"

WEB_USER="${WEB_USER:-www}"
DURABLE_STORAGE="${SIBERMAS_DURABLE_STORAGE:-/usr/local/www/apache24/data/Sibermas2026/apps/api/storage}"
FIX_STORAGE_LINKS="${FIX_STORAGE_LINKS:-/usr/local/www/sibermas/bin/fix-storage-links.sh}"
WEB_DOMAIN="${WEB_DOMAIN:-sibermas.uinsaizu.ac.id}"
PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://${WEB_DOMAIN}}"
LOG_DIR="${LOG_DIR:-/var/log/sibermas}"

RC_D_DEST="${RC_D_DEST:-/usr/local/etc/rc.d}"
NGINX_DEST="${NGINX_DEST:-/usr/local/etc/nginx/nginx.conf}"
PHP_FPM_POOL_DEST="${PHP_FPM_POOL_DEST:-/usr/local/etc/php-fpm.d/sibermas.conf}"

SKIP_MIGRATE="${SKIP_MIGRATE:-0}"
SKIP_FRONTEND_BUILD="${SKIP_FRONTEND_BUILD:-0}"
RENDER_NGINX="${RENDER_NGINX:-auto}"

die() {
  echo "ERROR: $*" >&2
  exit 1
}

step() {
  echo ""
  echo "==> $*"
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
  command -v "$1" >/dev/null 2>&1 || die "Command '$1' belum tersedia. Jalankan sh install-freebsd.sh dulu."
}

validate_rendered_nginx() {
  [ -f "${NGINX_DEST}" ] || return 0  # no config yet → will be rendered below
  # Only validate if config was rendered by us (has our template markers)
  if grep -q '__WEB_DOMAIN__\|sibermas' "${NGINX_DEST}" 2>/dev/null; then
    if ! grep -q 'map \$http_x_forwarded_proto \$forwarded_proto' "${NGINX_DEST}"; then
      echo "WARNING: Nginx config outdated — will re-render from template."
      RENDER_NGINX=1
    fi
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

if [ "$(id -u)" -ne 0 ]; then
  die "Jalankan sebagai root: sudo bash deploy-freebsd-simple.sh"
fi

[ -f "${API_DIR}/composer.json" ] || die "Tidak menemukan ${API_DIR}/composer.json. Jalankan dari root repo."
[ -f "${WEB_DIR}/package.json" ] || die "Tidak menemukan ${WEB_DIR}/package.json. Jalankan dari root repo."

require_command php
require_command composer
require_command pnpm
require_command node
require_command service

echo "============================================================"
echo " SIBERMAS FreeBSD Simple Deploy"
echo " APP_DIR: ${APP_DIR}"
echo " DOMAIN : ${WEB_DOMAIN}"
echo "============================================================"

step "Preparing directories"
mkdir -p "${LOG_DIR}" /usr/local/etc/php-fpm.d
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
set_env APP_URL "${PUBLIC_BASE_URL%/}/api"
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

"${FIX_STORAGE_LINKS}" "${APP_DIR}"
php artisan config:cache
php artisan route:cache
php artisan event:cache 2>/dev/null || true

if [ "${SKIP_FRONTEND_BUILD}" != "1" ]; then
  step "Installing and building Next.js frontend"
  cd "${APP_DIR}"
  export TURBO_INSTALL_SKIP_DOWNLOAD=1
  export NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-${PUBLIC_BASE_URL%/}/api/v1}"
  export SERVER_API_URL="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
  export NEXT_PUBLIC_APP_URL="${NEXT_PUBLIC_APP_URL:-${PUBLIC_BASE_URL%/}}"
  export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-${PUBLIC_BASE_URL%/}}"

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

step "Installing FreeBSD service configuration"
cp "${APP_DIR}/conf/php-fpm.sibermas.conf" "${PHP_FPM_POOL_DEST}"
install -m 0555 "${APP_DIR}/conf/rc.d/sibermas_web" "${RC_D_DEST}/sibermas_web"
install -m 0555 "${APP_DIR}/conf/rc.d/sibermas_queue" "${RC_D_DEST}/sibermas_queue"

sysrc nginx_enable="YES"
sysrc php_fpm_enable="YES"
sysrc sibermas_web_enable="YES"
sysrc sibermas_web_app_dir="${APP_DIR}"
sysrc sibermas_web_user="${WEB_USER}"
sysrc sibermas_web_host="127.0.0.1"
sysrc sibermas_web_port="3000"
sysrc sibermas_web_public_api_url="${NEXT_PUBLIC_API_URL:-${PUBLIC_BASE_URL%/}/api/v1}"
sysrc sibermas_web_server_api_url="${SERVER_API_URL:-http://127.0.0.1/api/v1}"
sysrc sibermas_web_public_app_url="${NEXT_PUBLIC_APP_URL:-${PUBLIC_BASE_URL%/}}"
sysrc sibermas_web_logfile="${LOG_DIR}/web.log"
sysrc sibermas_web_pidfile="${LOG_DIR}/sibermas-web.pid"
sysrc sibermas_web_child_pidfile="${LOG_DIR}/sibermas-web.child.pid"
sysrc sibermas_queue_enable="YES"
sysrc sibermas_queue_app_dir="${APP_DIR}"
sysrc sibermas_queue_user="${WEB_USER}"
sysrc sibermas_queue_log_dir="${LOG_DIR}"
sysrc sibermas_queue_pid_dir="${LOG_DIR}"
service supervisord stop 2>/dev/null || true
sysrc supervisord_enable="NO" 2>/dev/null || true

validate_rendered_nginx

if [ "${RENDER_NGINX}" = "1" ] || { [ "${RENDER_NGINX}" = "auto" ] && [ ! -f "${NGINX_DEST}" ]; }; then
  sed -e "s|__WEB_DOMAIN__|${WEB_DOMAIN}|g" \
      -e "s|__CERT_BASE__|${WEB_DOMAIN}|g" \
      -e "s|__APP_DIR__|${APP_DIR}|g" \
      "${APP_DIR}/nginx-freebsd.conf" > "${NGINX_DEST}"
  echo "Rendered ${NGINX_DEST}"
else
  echo "Keeping existing ${NGINX_DEST}. Set RENDER_NGINX=1 to overwrite it."
fi

step "Fixing permissions"
chown -R "${WEB_USER}:${WEB_USER}" \
  "${API_DIR}/storage" \
  "${API_DIR}/bootstrap/cache"
if [ -d "${WEB_DIR}/.next" ]; then
  chown -R "${WEB_USER}:${WEB_USER}" "${WEB_DIR}/.next"
fi
find "${API_DIR}/storage" -type d -exec chmod 2775 {} +
find "${API_DIR}/storage" -type f -exec chmod 0664 {} +
chmod 0775 "${API_DIR}/bootstrap/cache"

step "Reloading services"
service php-fpm reload 2>/dev/null || service php-fpm restart

if nginx -t; then
  service nginx status >/dev/null 2>&1 && service nginx reload || service nginx start
else
  die "nginx -t gagal. Periksa ${NGINX_DEST}."
fi

service sibermas_web restart
service sibermas_queue restart

step "Health checks"
for i in $(seq 1 12); do
  if curl -sf -m 5 "http://127.0.0.1/api/health" >/dev/null \
    && curl -sf -m 5 "http://127.0.0.1:3000/" >/dev/null; then
    echo "OK: API and web are healthy."
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
echo "  service sibermas_web status && tail -50 ${LOG_DIR}/web.log"
echo "  service sibermas_queue status && tail -50 ${LOG_DIR}/worker-default.log"
echo "  tail -50 ${API_DIR}/storage/logs/laravel.log"
exit 1
