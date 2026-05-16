# Deploy FreeBSD: Apache24 Backend + Nginx Frontend

Profile ini untuk target operasional:

- Nginx frontend di host aplikasi: direct-public di `80/443`, atau backend-only
  di `80` saat `EDGE_REVERSE_PROXY=1`
- Apache24 backend internal di `127.0.0.1:8080`
- Laravel API di `apps/api/public` lewat PHP-FPM socket `/var/run/php-fpm.sock`
- Next.js standalone di `127.0.0.1:3000`
- Tanpa Supervisor; proses Next.js dan queue Laravel dikelola `rc.d` + `daemon(8)`

Untuk `sibermas.uinsaizu.ac.id`, topologi live saat ini memakai SSL
frontend/gateway. Di app server, gunakan `EDGE_REVERSE_PROXY=1` agar vhost
backend tetap HTTP-only dan tidak memuat sertifikat lokal.

## Arsitektur

```text
Internet
  |
  v
Nginx :80/:443
  |-- /api/*        -> Apache24 127.0.0.1:8080 -> PHP-FPM -> Laravel
  |-- /_next/static -> file static Next.js
  `-- /            -> Next.js 127.0.0.1:3000
```

Apache tidak boleh bind port publik. Script deploy menonaktifkan `Listen 80`
di `/usr/local/etc/apache24/httpd.conf` dan memasang vhost internal:

```text
/usr/local/etc/apache24/Includes/sibermas-api.conf
```

## Paket Yang Dibutuhkan

Jalankan sebagai root di server FreeBSD:

```sh
pkg install -y \
  apache24 nginx postgresql18-server postgresql18-client redis \
  php84 php84-extensions php84-pdo php84-pdo_pgsql php84-pgsql \
  php84-mbstring php84-xml php84-curl php84-zip php84-gd php84-intl \
  php84-bcmath php84-redis php84-opcache php84-tokenizer php84-fileinfo \
  php84-ctype php84-dom php84-session php84-simplexml php84-xmlwriter \
  php84-xmlreader php84-openssl php84-filter php84-sodium php84-pcntl \
  php84-posix composer node24 npm-node24 py311-certbot git curl bash
```

Install `pnpm`:

```sh
pkg install -y pnpm || npm install -g pnpm@10
```

PostgreSQL/Redis bisa tetap memakai setup dari `install-freebsd.sh` jika server
sudah pernah disiapkan. Yang penting database `kknnative`, user
`kknuinsaizunative`, dan `apps/api/.env` sudah punya `DB_PASSWORD`.

## Deploy

```sh
cd /usr/local/www/apache24/data/Sibermas2026

APACHE_BACKEND=1 sh scripts/preflight-freebsd.sh

KKN_SUPERADMIN_PASSWORD='password-kuat' \
bash deploy-freebsd-apache-nginx.sh
```

### Opsi: di balik reverse proxy/gateway kampus

Kalau Nginx publik/gateway lain sudah terminate TLS dan meneruskan request ke
app server via HTTP, gunakan mode eksplisit ini:

```sh
EDGE_REVERSE_PROXY=1 \
KKN_SUPERADMIN_PASSWORD='password-kuat' \
bash deploy-freebsd-apache-nginx.sh
```

Mode ini merender:

```text
conf/nginx-vhost-sibermas-http.conf -> /usr/local/etc/nginx/vhosts/sibermas.conf
```

Ini mode yang cocok untuk host backend Sibermas saat ini.

Template gateway publik tetap ada di:

```text
conf/revproxy-sibermas.uinsaizu.ac.id.conf
```

Untuk staging:

```sh
WEB_DOMAIN=staging.example.ac.id \
KKN_SUPERADMIN_PASSWORD='password-kuat' \
bash deploy-freebsd-apache-nginx.sh
```

Kalau scheduler Laravel mau langsung dipasang ke `/etc/crontab`:

```sh
INSTALL_CRON=1 bash deploy-freebsd-apache-nginx.sh
```

Tanpa `INSTALL_CRON=1`, tambahkan manual:

```cron
* * * * * www cd /usr/local/www/apache24/data/Sibermas2026/apps/api && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
```

## Service

Script deploy memasang dan mengaktifkan:

```sh
service php-fpm status
service apache24 status
service nginx status
service sibermas_web status
service sibermas_queue status
```

Restart manual:

```sh
service php-fpm restart
service apache24 restart
service sibermas_web restart
service sibermas_queue restart
service nginx restart
```

`sibermas_queue` menjalankan:

- 2 worker untuk queue `default,critical,high`
- 1 worker untuk queue `low`
- 1 worker untuk queue `long`

Ubah jumlah worker via `/etc/rc.conf`:

```sh
sysrc sibermas_queue_default_procs=4
sysrc sibermas_queue_low_procs=2
sysrc sibermas_queue_long_procs=1
service sibermas_queue restart
```

## SSL

Setelah HTTP hidup:

```sh
certbot certonly --webroot \
  -w /usr/local/www/apache24/data/Sibermas2026/apps/api/public \
  -d sibermas.uinsaizu.ac.id \
  --cert-name sibermas.uinsaizu.ac.id \
  -m admin@uinsaizu.ac.id --agree-tos -n
```

Lalu aktifkan server block HTTPS di `/usr/local/etc/nginx/nginx.conf` dan ubah
server block port 80 menjadi redirect.

Jika host hanya berperan sebagai backend di balik gateway, bagian SSL lokal ini
tidak dipakai. Dalam mode itu yang wajib dijaga adalah header:

- `X-Forwarded-Proto`
- `X-Forwarded-Port`
- `X-Forwarded-For`

## Health Check

```sh
curl -i http://127.0.0.1:8080/api/health  # Apache backend
curl -i http://127.0.0.1/api/health       # Nginx -> Apache
curl -I http://127.0.0.1:3000/            # Next.js
curl -I http://127.0.0.1/                 # Nginx -> Next.js
```

Jika Apache memakai ModSecurity CRS, pastikan method REST tidak diblokir.
Minimal `PATCH /api/v1/profile/password` harus mencapai Laravel dan membalas
`401/422`, bukan `403`.

Diagnostik lengkap:

```sh
sh scripts/diagnose-freebsd.sh
```

Log utama:

```sh
tail -f /var/log/sibermas/apache-api-error.log
tail -f /var/log/sibermas/web.log
tail -f /var/log/sibermas/worker-default.log
tail -f apps/api/storage/logs/laravel.log
tail -f /var/log/nginx/sibermas-error.log
```
