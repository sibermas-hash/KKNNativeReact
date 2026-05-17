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
#   - Native single-server runtime memakai `rc.d` + `daemon(8)` untuk Next.js
#     dan queue worker; supervisor hanya legacy/fallback untuk profile lama.
#   - Horizon belum dipakai — queue via `queue:work` standar

set -e

APP_DIR="${APP_DIR:-/usr/local/www/apache24/data/Sibermas2026}"
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
    py311-certbot \
    git \
    curl \
    bash

echo "==> Mengaktifkan layanan di /etc/rc.conf..."
sysrc nginx_enable="YES"
sysrc postgresql_enable="YES"
sysrc redis_enable="YES"
sysrc php_fpm_enable="YES"

echo "==> Menginisialisasi PostgreSQL..."
if [ ! -f "${PG_DATA_DIR}/PG_VERSION" ]; then
    service postgresql initdb
fi
service postgresql start

echo "==> Membuat database dan user PostgreSQL..."
# Native DB names intentionally match local and server environments.
DB_PASS_FILE="${APP_DIR}/.db_password.initial"
if [ ! -f "${DB_PASS_FILE}" ]; then
    DB_PASS="${DB_PASSWORD:-$(openssl rand -base64 24 | tr -d '\n')}"
    umask 077
    mkdir -p "${APP_DIR}"
    echo "${DB_PASS}" > "${DB_PASS_FILE}"
    chown root:wheel "${DB_PASS_FILE}" 2>/dev/null || true
    chmod 600 "${DB_PASS_FILE}"
else
    DB_PASS=$(cat "${DB_PASS_FILE}")
fi

# Gunakan pipe (bukan cmdline) untuk hindari leak password di ps aux
echo "CREATE USER kknuinsaizunative WITH PASSWORD '${DB_PASS}';" | su -l postgres -c psql 2>/dev/null || true
echo "ALTER USER kknuinsaizunative WITH PASSWORD '${DB_PASS}';" | su -l postgres -c psql 2>/dev/null || true
echo "CREATE DATABASE kknnative OWNER kknuinsaizunative;" | su -l postgres -c psql 2>/dev/null || true
echo "ALTER DATABASE kknnative OWNER TO kknuinsaizunative;" | su -l postgres -c psql 2>/dev/null || true

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

echo "==> Menyiapkan direktori runtime rc.d..."
mkdir -p "${LOG_DIR}"

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
echo " DB password for kknuinsaizunative user saved to:"
echo "   ${DB_PASS_FILE} (mode 0600, owned by root)"
echo ""
echo " → deploy script akan memakai password native yang sama untuk apps/api/.env."
echo ""
echo "Langkah selanjutnya:"
echo "  1. Pastikan kode sudah ada di ${APP_DIR}"
echo "  2. cd ${APP_DIR}"
echo "  3. Jalankan deploy sederhana:"
echo "       KKN_SUPERADMIN_PASSWORD='<strong-pw>' bash deploy-freebsd-simple.sh"
echo ""
echo "     Script deploy akan otomatis:"
echo "       - seed apps/api/.env dari .env.production.example jika belum ada"
echo "       - set DB_DATABASE/DB_USERNAME/DB_PASSWORD native"
echo "       - generate APP_KEY dan secret lokal yang kosong"
echo "       - composer install, migrate, build Next.js standalone"
echo "       - pasang config PHP-FPM, rc.d service, dan Nginx jika belum ada"
echo "       - restart service dan menjalankan health check"
echo ""
echo " 🔥 Pastikan PostgreSQL dan Redis hanya listen di localhost:"
echo "     sed -i '' 's/^listen_addresses =.*/listen_addresses = '\''127.0.0.1'\''/' ${PG_DATA_DIR}/postgresql.conf"
echo "     echo 'bind 127.0.0.1' >> /usr/local/etc/redis.conf"
echo "     service postgresql restart && service redis restart"
echo ""
echo " 4. (Setelah app hidup di HTTP) issue SSL single-domain:"
echo "       certbot certonly --webroot \\"
echo "         -w ${APP_DIR}/apps/api/public \\"
echo "         -d ${WEB_DOMAIN} \\"
echo "         --cert-name ${CERT_BASE} \\"
echo "         -m admin@uinsaizu.ac.id --agree-tos -n"
echo "     Lalu aktifkan block HTTPS di /usr/local/etc/nginx/nginx.conf dan reload:"
echo "       service nginx reload"
echo ""
echo "Cek log:"
echo "  tail -f ${LOG_DIR}/worker-default.log ${LOG_DIR}/web.log"
