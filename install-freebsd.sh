#!/bin/sh
# install-freebsd.sh - Script instalasi SIBERMAS di FreeBSD
# Diuji pada FreeBSD 14.x
# Jalankan sebagai root: sh install-freebsd.sh
#
# ASUMSI DEPLOY PROFILE (2026-05):
#   - Single-domain path-based API (Laravel di /api/*, Next.js di /)
#   - SINGLE-SERVER MODE: semua service di satu mesin (tidak pakai jail).
#     Untuk jails mode, lihat docs/JAILS_MIGRATION.md dan gunakan
#     jail_setup.sh yang sudah diadaptasi per-jail.
#   - App root di /usr/local/www/apache24/data/Sibermas2026
#     (path ini bukan karena server pakai Apache; hanya mengikuti layout
#     folder yang sudah dipakai ops team. Nginx tetap entry point utama.)
#   - Supervisor dengan path absolut /usr/local/bin/php + /usr/local/bin/node
#   - Horizon belum dipakai — queue via `queue:work` standar (supervisord.conf)

set -e

APP_DIR="/usr/local/www/apache24/data/Sibermas2026"
PF_CONF="/etc/pf.conf"
APP_USER="www"
LOG_DIR="/var/log/sibermas"
PHP_VERSION="84"  # php84
PG_VERSION="18"   # postgresql18 — selaras dengan jails mode & conf/postgresql-scaling.conf
NODE_VERSION="${NODE_VERSION:-24}"
PG_DATA_DIR="/var/db/postgres/data${PG_VERSION}"

# Production domain fallbacks. Override dengan export sebelum jalankan script:
#   WEB_DOMAIN=staging.example.com CERT_BASE=staging.example.com sh install-freebsd.sh
# Single-domain deploy — API_DOMAIN tidak lagi dipakai.
: "${WEB_DOMAIN:=sibermas.uinsaizu.ac.id}"
: "${CERT_BASE:=sibermas.uinsaizu.ac.id}"

echo "==> Memperbarui pkg repository..."
pkg update

echo "==> Menginstal dependensi sistem..."
pkg install -y \
    php${PHP_VERSION} \
    php${PHP_VERSION}-extensions \
    php${PHP_VERSION}-pdo \
    php${PHP_VERSION}-pdo_pgsql \
    php${PHP_VERSION}-pgsql \
    php${PHP_VERSION}-mbstring \
    php${PHP_VERSION}-xml \
    php${PHP_VERSION}-curl \
    php${PHP_VERSION}-zip \
    php${PHP_VERSION}-gd \
    php${PHP_VERSION}-intl \
    php${PHP_VERSION}-bcmath \
    php${PHP_VERSION}-redis \
    php${PHP_VERSION}-opcache \
    php${PHP_VERSION}-tokenizer \
    php${PHP_VERSION}-fileinfo \
    php${PHP_VERSION}-ctype \
    php${PHP_VERSION}-dom \
    php${PHP_VERSION}-session \
    php${PHP_VERSION}-simplexml \
    php${PHP_VERSION}-xmlwriter \
    php${PHP_VERSION}-xmlreader \
    php${PHP_VERSION}-openssl \
    php${PHP_VERSION}-filter \
    php${PHP_VERSION}-sodium \
    php${PHP_VERSION}-pcntl \
    php${PHP_VERSION}-posix \
    composer \
    nginx \
    postgresql${PG_VERSION}-server \
    postgresql${PG_VERSION}-client \
    redis \
    node${NODE_VERSION} \
    npm-node${NODE_VERSION} \
    py311-supervisor \
    git \
    curl \
    bash

echo "==> Mengaktifkan layanan di /etc/rc.conf..."
sysrc nginx_enable="YES"
sysrc postgresql_enable="YES"
sysrc redis_enable="YES"
sysrc supervisord_enable="YES"
sysrc php_fpm_enable="YES"

echo "==> Menginisialisasi PostgreSQL..."
if [ ! -f "${PG_DATA_DIR}/PG_VERSION" ]; then
    service postgresql initdb
fi
service postgresql start

echo "==> Membuat database dan user PostgreSQL..."
# Generate a strong random password. Only applies on first-run (CREATE USER
# will fail silently via || true on re-run, yang memang yang kita mau — tidak
# overwrite existing passwords).
DB_PASS_FILE="${APP_DIR}/.db_password.initial"
if [ ! -f "${DB_PASS_FILE}" ]; then
    DB_PASS=$(openssl rand -base64 33 | tr -d '/+=' | cut -c1-32)
    umask 077
    mkdir -p "${APP_DIR}"
    echo "${DB_PASS}" > "${DB_PASS_FILE}"
    chown root:wheel "${DB_PASS_FILE}" 2>/dev/null || true
    chmod 600 "${DB_PASS_FILE}"
else
    DB_PASS=$(cat "${DB_PASS_FILE}")
fi

# Gunakan pipe (bukan cmdline) untuk hindari leak password di ps aux
echo "CREATE USER kkn_app WITH PASSWORD '${DB_PASS}';" | su -l postgres -c psql 2>/dev/null || true
echo "CREATE DATABASE kkn_production OWNER kkn_app;" | su -l postgres -c psql 2>/dev/null || true

echo "==> Memulai Redis..."
service redis start

echo "==> Konfigurasi firewall (pf)..."
# Hanya buka port 80 (HTTP), 443 (HTTPS), dan SSH (1977). Blokir lainnya
# termasuk PostgreSQL (5432) dan Redis (6379) — hanya bind ke localhost.
if [ -f "${PF_CONF}" ] && ! grep -q "sibermas" "${PF_CONF}" 2>/dev/null; then
  cat >> "${PF_CONF}" << 'EOPF'

# sibermas - production rules
pass in proto tcp to port { 80 443 1977 }
block in log proto tcp to port { 5432 6379 }
EOPF
  sysrc pf_enable="YES"
  service pf start 2>/dev/null || true
fi

echo "==> Memulai PHP-FPM..."
service php-fpm start 2>/dev/null || true

echo "==> Membuat direktori aplikasi & log..."
mkdir -p "${APP_DIR}"
mkdir -p "${LOG_DIR}"
chown -R ${APP_USER}:${APP_USER} "${LOG_DIR}"

echo "==> Menginstal pnpm..."
# Prioritaskan FreeBSD package jika tersedia, fallback ke npm
if ! pkg install -y pnpm 2>/dev/null; then
  npm install -g pnpm@10
fi

echo "==> Menyalin konfigurasi supervisord..."
mkdir -p /usr/local/etc/supervisord.d
cp "${APP_DIR}/apps/api/supervisord.conf" /usr/local/etc/supervisord.d/sibermas.conf 2>/dev/null || \
    echo "  [!] supervisord.conf belum ada di ${APP_DIR}, salin manual setelah deploy."

echo "==> Menyalin konfigurasi nginx..."
if [ -f "${APP_DIR}/nginx-freebsd.conf" ]; then
    # Template placeholder: __WEB_DOMAIN__, __CERT_BASE__, __APP_DIR__
    # (API_DOMAIN tidak lagi dipakai — single-domain path-based deploy.)
    # Escape slash di APP_DIR supaya sed tidak bingung — pakai | sebagai delim.
    sed -e "s|__WEB_DOMAIN__|${WEB_DOMAIN}|g" \
        -e "s|__CERT_BASE__|${CERT_BASE}|g" \
        -e "s|__APP_DIR__|${APP_DIR}|g" \
        "${APP_DIR}/nginx-freebsd.conf" > /usr/local/etc/nginx/nginx.conf
    echo "  [+] Rendered nginx config:"
    echo "      WEB=${WEB_DOMAIN}"
    echo "      CERT_BASE=${CERT_BASE}"
    echo "      APP_DIR=${APP_DIR}"
else
    echo "  [!] nginx-freebsd.conf belum ada, salin manual setelah deploy."
fi

echo ""
echo "================================================================"
echo " Instalasi dependensi selesai!"
echo "================================================================"
echo ""
echo " DB password for kkn_app user saved to:"
echo "   ${DB_PASS_FILE} (mode 0600, owned by root)"
echo ""
echo " → Copy it into apps/api/.env as DB_PASSWORD, then delete the file."
echo ""
echo "Langkah selanjutnya:"
echo "  1. Clone/upload kode ke ${APP_DIR}"
echo "  2. cd ${APP_DIR}/apps/api"
echo "  3. cp .env.production.example .env"
echo "  4. Edit .env: DB_PASSWORD=<see ${DB_PASS_FILE}>, APP_KEY, MASTER_WEBHOOK_SECRET, GEMINI_API_KEY"
echo "     Filter SIAKAD defaults already set:"
echo "       - Pascasarjana (fakultas ID 1) otomatis diblokir"
echo "       - Dosen non-NIP (LB-xxxx) otomatis diblokir"
echo "  5. composer install --no-dev --optimize-autoloader"
echo "  6. php artisan key:generate"
echo "  7. php artisan migrate --force"
echo "  8. KKN_SUPERADMIN_PASSWORD='<strong-pw>' php artisan db:seed --class=SuperAdminSeeder --force"
echo "  9. php artisan storage:link"
echo " 10. php artisan config:cache && php artisan route:cache"
echo " 11. cd ${APP_DIR} && export TURBO_INSTALL_SKIP_DOWNLOAD=1"
echo "     export NEXT_PUBLIC_API_URL=https://${WEB_DOMAIN}/api/v1"
echo "     export NEXT_PUBLIC_APP_URL=https://${WEB_DOMAIN}"
echo "     export NEXT_PUBLIC_SITE_URL=https://${WEB_DOMAIN}"
echo "     pnpm install --frozen-lockfile && pnpm build"
echo " 12. # Next.js standalone: salin static + public ke direktori standalone"
echo "     cp -r ${APP_DIR}/apps/web/.next/static \\"
echo "        ${APP_DIR}/apps/web/.next/standalone/apps/web/.next/static"
echo "     cp -r ${APP_DIR}/apps/web/public \\"
echo "        ${APP_DIR}/apps/web/.next/standalone/apps/web/public"
echo " 13. chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/apps/api/storage"
echo " 14. chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/apps/api/bootstrap/cache"
echo " 15. chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/apps/web/.next"
echo ""
echo " 🔥 Pastikan PostgreSQL dan Redis hanya listen di localhost:"
echo "     sed -i '' 's/^listen_addresses =.*/listen_addresses = '\''127.0.0.1'\''/' ${PG_DATA_DIR}/postgresql.conf"
echo "     echo 'bind 127.0.0.1' >> /usr/local/etc/redis.conf"
echo "     service postgresql restart && service redis restart"
echo ""
echo " 16. (Setelah app hidup di HTTP) issue SSL single-domain:"
echo "       pkg install -y py311-certbot"
echo "       certbot certonly --webroot \\"
echo "         -w ${APP_DIR}/apps/api/public \\"
echo "         -d ${WEB_DOMAIN} \\"
echo "         --cert-name ${CERT_BASE} \\"
echo "         -m admin@uinsaizu.ac.id --agree-tos -n"
echo "     Lalu aktifkan block HTTPS di nginx-freebsd.conf dan reload:"
echo "       service nginx reload"
echo ""
echo " 17. service nginx start"
echo " 18. service supervisord start"
echo ""
echo "Cek log:"
echo "  tail -f ${LOG_DIR}/worker-default.log ${LOG_DIR}/web.log"
