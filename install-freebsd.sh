#!/bin/sh
# install-freebsd.sh - Script instalasi KKN UIN SAIZU di FreeBSD
# Diuji pada FreeBSD 14.x
# Jalankan sebagai root: sh install-freebsd.sh

set -e

APP_DIR="/usr/local/www/sibermas"
APP_USER="www"
LOG_DIR="/var/log/sibermas"
PHP_VERSION="84"  # php84

echo "==> Memperbarui pkg repository..."
pkg update -f

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
    postgresql16-server \
    postgresql16-client \
    redis \
    node22 \
    npm-node22 \
    py311-supervisor \
    git \
    curl

echo "==> Mengaktifkan layanan di /etc/rc.conf..."
sysrc nginx_enable="YES"
sysrc postgresql_enable="YES"
sysrc redis_enable="YES"
sysrc supervisord_enable="YES"

echo "==> Menginisialisasi PostgreSQL..."
if [ ! -f /var/db/postgres/data16/PG_VERSION ]; then
    service postgresql initdb
fi
service postgresql start

echo "==> Membuat database dan user PostgreSQL..."
su -l postgres -c "psql -c \"CREATE USER kkn_app WITH PASSWORD 'changeme_strong_password';\"" 2>/dev/null || true
su -l postgres -c "psql -c \"CREATE DATABASE kkn_production OWNER kkn_app;\"" 2>/dev/null || true

echo "==> Memulai Redis..."
service redis start

echo "==> Membuat direktori aplikasi..."
mkdir -p "${APP_DIR}"
mkdir -p "${LOG_DIR}"
chown -R ${APP_USER}:${APP_USER} "${LOG_DIR}"

echo "==> Menginstal pnpm..."
npm install -g pnpm

echo "==> Menyalin konfigurasi supervisord..."
mkdir -p /usr/local/etc/supervisord.d
cp "${APP_DIR}/apps/api/supervisord.conf" /usr/local/etc/supervisord.d/sibermas.conf 2>/dev/null || \
    echo "  [!] supervisord.conf belum ada di ${APP_DIR}, salin manual setelah deploy."

echo "==> Menyalin konfigurasi nginx..."
if [ -f "${APP_DIR}/nginx-freebsd.conf" ]; then
    cp "${APP_DIR}/nginx-freebsd.conf" /usr/local/etc/nginx/nginx.conf
else
    echo "  [!] nginx-freebsd.conf belum ada, salin manual setelah deploy."
fi

echo ""
echo "================================================================"
echo " Instalasi dependensi selesai!"
echo "================================================================"
echo ""
echo "Langkah selanjutnya:"
echo "  1. Clone/upload kode ke ${APP_DIR}"
echo "  2. cd ${APP_DIR}/apps/api"
echo "  3. cp .env.production.example .env"
echo "  4. Edit .env (DB_PASSWORD, APP_KEY, dll)"
echo "  5. composer install --no-dev --optimize-autoloader"
echo "  6. php artisan key:generate"
echo "  7. php artisan migrate --force"
echo "  8. php artisan db:seed --force"
echo "  9. php artisan storage:link"
echo " 10. php artisan config:cache && php artisan route:cache"
echo " 11. cd ${APP_DIR} && pnpm install && pnpm build"
echo " 12. # Copy static files Next.js standalone:"
echo "     cp -r ${APP_DIR}/apps/web/.next/static \\"
echo "        ${APP_DIR}/apps/web/.next/standalone/apps/web/.next/static"
echo "     cp -r ${APP_DIR}/apps/web/public \\"
echo "        ${APP_DIR}/apps/web/.next/standalone/apps/web/public"
echo " 13. chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/apps/api/storage"
echo " 14. chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/apps/api/bootstrap/cache"
echo " 15. chown -R ${APP_USER}:${APP_USER} ${APP_DIR}/apps/web/.next"
echo " 16. service nginx start"
echo " 17. service supervisord start"
echo ""
echo "Cek log: tail -f ${LOG_DIR}/horizon.log ${LOG_DIR}/web.log"
