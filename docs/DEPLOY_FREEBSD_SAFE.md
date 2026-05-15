# Deploy Aman FreeBSD 14.3

Panduan ini untuk deploy ulang SIBERMAS pada server FreeBSD agar tidak mudah down dan mengurangi risiko Cloudflare 522/524.

Target arsitektur:

```text
Cloudflare -> Nginx RevProxy :443 -> App server 172.16.2.70:80 -> Laravel PHP-FPM + Next.js
```

## 1. Prasyarat Server

Spesifikasi minimum yang tervalidasi:

```text
OS      : FreeBSD 14.3 amd64
CPU     : 8 vCPU
RAM     : 32 GiB
Disk    : 500 GB
Runtime : PHP 8.4, Node.js 22+, PostgreSQL, Redis, Nginx
```

Paket penting:

```sh
pkg install -y nginx php84 php84-extensions php84-pdo_pgsql php84-pecl-redis \
  php84-gd php84-intl php84-mbstring php84-zip php84-curl php84-openssl \
  php84-dom php84-xmlreader php84-xmlwriter php84-fileinfo \
  node22 npm-node22 pnpm redis postgresql16-client composer supervisor certbot
```

Validasi runtime:

```sh
freebsd-version
php -v
php -m
node -v
pnpm -v
nginx -V
```

## 2. Limit FreeBSD

Nginx menggunakan:

```nginx
worker_rlimit_nofile 200000;
worker_connections 8192;
```

Pastikan limit OS cukup:

```sh
sysctl kern.maxfiles kern.maxfilesperproc
```

Target aman:

```text
kern.maxfiles >= 300000
kern.maxfilesperproc >= 200000
```

Jika belum cukup, set di `/etc/sysctl.conf`:

```conf
kern.maxfiles=300000
kern.maxfilesperproc=200000
```

Apply:

```sh
service sysctl restart
```

## 3. Direktori Wajib

```sh
mkdir -p /usr/local/www/sibermas
mkdir -p /var/log/sibermas
mkdir -p /var/tmp/nginx-client-temp
chown -R www:www /var/log/sibermas /var/tmp/nginx-client-temp
chmod 775 /var/tmp/nginx-client-temp
```

Validasi:

```sh
df -h / /var/tmp
ls -ld /var/tmp/nginx-client-temp /var/log/sibermas
```

## 4. Environment Production

Salin template:

```sh
cp apps/api/.env.production.example apps/api/.env
```

Wajib isi:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://sibermas.uinsaizu.ac.id/api
APP_FRONTEND_URL=https://sibermas.uinsaizu.ac.id

QUEUE_CONNECTION=redis
CACHE_STORE=redis
REDIS_QUEUE_RETRY_AFTER=1200
DB_QUEUE_RETRY_AFTER=1200

SESSION_DOMAIN=sibermas.uinsaizu.ac.id
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SANCTUM_STATEFUL_DOMAINS=sibermas.uinsaizu.ac.id

CORS_ALLOWED_ORIGINS=https://sibermas.uinsaizu.ac.id
```

Generate key:

```sh
cd apps/api
php artisan key:generate --force
```

## 5. Build Backend

```sh
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan storage:link
php artisan config:clear
php artisan route:clear
php artisan view:clear
php artisan config:cache
php artisan route:cache
```

Validasi backend:

```sh
php artisan about
php artisan queue:restart
```

## 6. Build Frontend

Di root repo:

```sh
pnpm install --frozen-lockfile
pnpm build
```

Pastikan standalone lengkap:

```sh
test -f apps/web/.next/standalone/apps/web/server.js
test -d apps/web/.next/standalone/apps/web/.next/static
test -d apps/web/.next/standalone/apps/web/public
```

## 7. PHP-FPM

Untuk server 8 vCPU / 32 GiB, gunakan config konservatif:

```sh
cp conf/php-fpm.www.conf /usr/local/etc/php-fpm.d/sibermas.conf
```

Nilai awal:

```ini
pm.max_children = 120
request_terminate_timeout = 120
```

Jangan langsung pakai 200 child sebelum mengukur RSS PHP-FPM saat PDF/import/export.

Validasi:

```sh
php-fpm -t
service php-fpm reload || service php-fpm start
```

## 8. Supervisor

Single server:

```sh
cp apps/api/supervisord.conf /usr/local/etc/supervisord.d/sibermas.conf
service supervisord restart
supervisorctl reread
supervisorctl update
```

Jail/cluster mode:

```sh
cp apps/api/supervisord.jail-api.conf /usr/local/etc/supervisord.d/sibermas-api.conf
cp apps/web/supervisord.jail-web.conf /usr/local/etc/supervisord.d/sibermas-web.conf
service supervisord restart
supervisorctl reread
supervisorctl update
```

Validasi:

```sh
supervisorctl status
```

## 9. Nginx App Server 172.16.2.70

App server hanya HTTP port 80. SSL selesai di RevProxy.

Render config:

```sh
sed -e 's|__WEB_DOMAIN__|sibermas.uinsaizu.ac.id|g' \
    -e 's|__CERT_BASE__|sibermas.uinsaizu.ac.id|g' \
    -e 's|__APP_DIR__|/usr/local/www/sibermas|g' \
    nginx-freebsd.conf > /usr/local/etc/nginx/nginx.conf
```

Validasi penting:

```sh
nginx -t
service nginx reload || service nginx start
sockstat -4 -6 -l | grep ':80'
curl -I http://127.0.0.1/api/health
curl -I http://127.0.0.1/
```

## 10. Nginx RevProxy

Deploy vhost:

```sh
cp conf/revproxy-sibermas.uinsaizu.ac.id.conf \
  /usr/local/etc/nginx/vhosts/sibermas.uinsaizu.ac.id.conf
```

Pastikan global Nginx include:

```nginx
include /usr/local/etc/nginx/vhosts/*.conf;
include /usr/local/etc/nginx/conf.d/cloudflare_realip.conf;
```

Cloudflare real IP wajib:

```nginx
real_ip_header CF-Connecting-IP;
```

Validasi sertifikat:

```sh
certbot certificates
openssl x509 -in /usr/local/etc/letsencrypt/live/sibermas.uinsaizu.ac.id/fullchain.pem -noout -dates
```

Reload aman:

```sh
nginx -t && service nginx reload
```

Jangan gunakan `service nginx restart` saat production traffic aktif.

## 11. Validasi Anti-522

Dari RevProxy:

```sh
curl -I http://172.16.2.70/
curl -I http://172.16.2.70/api/health
```

Dari publik:

```sh
curl -Iv https://sibermas.uinsaizu.ac.id/
curl -Iv https://sibermas.uinsaizu.ac.id/api/health
curl -I -X OPTIONS https://sibermas.uinsaizu.ac.id/api/v1/auth/captcha
```

TLS/SNI:

```sh
openssl s_client -connect sibermas.uinsaizu.ac.id:443 -servername sibermas.uinsaizu.ac.id </dev/null
```

Port listen:

```sh
sockstat -4 -6 -l | egrep '(:80|:443|:3000|php-fpm|redis|postgres)'
```

## 12. Health Check Setelah Deploy

```sh
php artisan config:cache
php artisan route:cache
php artisan queue:restart
supervisorctl status
```

```sh
curl -sf http://127.0.0.1/api/health
curl -sf http://127.0.0.1:3000/
curl -sf https://sibermas.uinsaizu.ac.id/api/health
```

## 13. Operasi Aman Saat Update

Urutan aman:

```sh
git pull
composer install --no-dev --optimize-autoloader
pnpm install --frozen-lockfile
pnpm build
php artisan migrate --force
php artisan config:clear
php artisan config:cache
php artisan route:cache
php artisan queue:restart
supervisorctl restart sibermas-web
supervisorctl restart workers:*
nginx -t && service nginx reload
```

Hindari:

```sh
service nginx restart
supervisorctl restart all
```

`restart all` bisa bounce web + worker bersamaan dan membuat window downtime.

## 14. Jika Cloudflare 522 Muncul

Cek berurutan:

```sh
sockstat -4 -6 -l | grep ':443'
nginx -t
tail -100 /var/log/nginx/error.log
curl -I http://172.16.2.70/api/health
sysctl kern.maxfiles kern.maxfilesperproc
```

Interpretasi cepat:

```text
443 tidak listen      -> RevProxy/Nginx/cert problem
172.16.2.70 gagal     -> app server down/network/firewall
OPTIONS 444           -> method block masih salah
502 dari RevProxy     -> app server/PHP-FPM/Next.js down
524 dari Cloudflare   -> backend terlalu lama merespons
```

## 15. Checklist Final

- `nginx -t` sukses di RevProxy dan app server.
- `OPTIONS` tidak diblokir.
- `/api/notifications/stream` tidak dibuffer.
- `/api/` timeout 300s.
- `X-Forwarded-Proto` sampai PHP-FPM.
- `REDIS_QUEUE_RETRY_AFTER=1200` aktif.
- `pm.max_children=120` sebagai baseline.
- `service nginx reload`, bukan restart.
- `sockstat` menunjukkan port 443 dan 80 listen.
- Cloudflare SSL mode: Full Strict jika origin cert valid.
