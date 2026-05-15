# Deploy SIBERMAS ke FreeBSD

Target paling sederhana: satu server FreeBSD native, satu domain, Nginx di depan, Laravel lewat PHP-FPM, Next.js standalone lewat Supervisor, PostgreSQL dan Redis lokal.

Untuk profile yang diminta ops saat ini — backend `apps/api` lewat Apache24,
frontend lewat Nginx, dan tanpa Supervisor — gunakan
[`docs/DEPLOY_APACHE24_NGINX.md`](DEPLOY_APACHE24_NGINX.md) dan
`deploy-freebsd-apache-nginx.sh`.

Default path server:

```sh
/usr/local/www/apache24/data/Sibermas2026
```

Folder itu hanya path historis dari paket Apache. Aplikasi tetap memakai Nginx; Apache tidak dibutuhkan.

## Ringkasnya

```sh
# 1. Login sebagai root ke server FreeBSD
ssh root@server

# 2. Clone repo
git clone https://github.com/putrihati-cmd/KKNNATIVE.git \
  /usr/local/www/apache24/data/Sibermas2026
cd /usr/local/www/apache24/data/Sibermas2026

# 3. Cek kesiapan server
sh scripts/preflight-freebsd.sh

# 4. Install paket OS, PostgreSQL, Redis, Nginx, PHP-FPM, Node, pnpm
sh install-freebsd.sh

# 5. Deploy/redeploy aplikasi
KKN_SUPERADMIN_PASSWORD='ganti-dengan-password-kuat' bash deploy-freebsd-simple.sh
```

Setelah itu cek:

```sh
curl -s http://127.0.0.1/api/health
curl -I http://127.0.0.1/
```

## Yang Dijalankan Script

`install-freebsd.sh` melakukan setup satu kali:

- install paket FreeBSD: PHP 8.4, PostgreSQL 18, Redis, Nginx, Node 24, pnpm, Composer, Supervisor, Certbot
- enable service di `/etc/rc.conf`
- init database PostgreSQL jika belum ada
- buat user/database `kknuinsaizunative` / `kknnative`
- simpan password awal DB ke `.db_password.initial`
- render Nginx awal kalau template sudah tersedia

`deploy-freebsd-simple.sh` aman dijalankan ulang:

- membuat `apps/api/.env` dari template jika belum ada
- mengisi `DB_PASSWORD` dari `.db_password.initial`
- generate `APP_KEY`, `APP_BLIND_INDEX_KEY`, `API_ADMIN_SECRET`, dan `MASTER_WEBHOOK_SECRET` jika kosong
- menjalankan `composer install`, migration, storage link, dan cache Laravel
- menjalankan `pnpm install`, build shared packages, dan build Next.js standalone
- menyalin static/public Next.js ke folder standalone
- memasang config PHP-FPM socket, Supervisor, dan Nginx jika belum ada
- memperbaiki permission
- restart PHP-FPM, Nginx, Supervisor, lalu health check

## Konfigurasi Domain

Default domain adalah `sibermas.uinsaizu.ac.id`. Untuk staging:

```sh
WEB_DOMAIN=staging.example.ac.id \
KKN_SUPERADMIN_PASSWORD='password-kuat' \
bash deploy-freebsd-simple.sh
```

Ini akan mengatur:

- `APP_URL=https://<domain>/api`
- `APP_FRONTEND_URL=https://<domain>`
- `NEXT_PUBLIC_API_URL=https://<domain>/api/v1`
- `SESSION_DOMAIN=<domain>`
- `CORS_ALLOWED_ORIGINS=https://<domain>`
- `SANCTUM_STATEFUL_DOMAINS=<domain>`

## Environment Yang Tetap Perlu Diisi

Script sengaja tidak menebak secret eksternal. Setelah deploy pertama, edit:

```sh
ee apps/api/.env
```

Minimal untuk integrasi penuh:

```env
MASTER_API_TOKEN=
MAIL_PASSWORD=
GEMINI_API_KEY=
AI_PRIMARY_KEY=
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

Lalu jalankan ulang:

```sh
bash deploy-freebsd-simple.sh
```

## SSL

Setelah HTTP sudah hidup:

```sh
certbot certonly --webroot \
  -w /usr/local/www/apache24/data/Sibermas2026/apps/api/public \
  -d sibermas.uinsaizu.ac.id \
  --cert-name sibermas.uinsaizu.ac.id \
  -m admin@uinsaizu.ac.id --agree-tos -n
```

Aktifkan blok HTTPS di `/usr/local/etc/nginx/nginx.conf`, ubah blok port 80 menjadi redirect, lalu:

```sh
service nginx reload
```

Catatan: `deploy-freebsd-simple.sh` tidak menimpa Nginx yang sudah ada, kecuali dijalankan dengan `RENDER_NGINX=1`.

## Redeploy

```sh
cd /usr/local/www/apache24/data/Sibermas2026
git pull origin main
bash deploy-freebsd-simple.sh
```

Untuk hotfix tanpa migration:

```sh
SKIP_MIGRATE=1 bash deploy-freebsd-simple.sh
```

Untuk restart/re-cache tanpa build frontend:

```sh
SKIP_FRONTEND_BUILD=1 bash deploy-freebsd-simple.sh
```

## Service

| Service | Keterangan |
|---|---|
| Nginx | port 80/443, reverse proxy ke Next.js dan PHP-FPM |
| PHP-FPM | socket `/var/run/php-fpm.sock`, pool `sibermas` |
| PostgreSQL | lokal `127.0.0.1:5432` |
| Redis | lokal `127.0.0.1:6379` |
| Supervisor `sibermas-web` | Next.js standalone di `127.0.0.1:3000` |
| Supervisor `workers:*` | Laravel queue workers |

## Cron

Tambahkan ke `/etc/crontab`:

```cron
* * * * * www cd /usr/local/www/apache24/data/Sibermas2026/apps/api && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1
0 2 * * * root /usr/local/bin/bash /usr/local/www/apache24/data/Sibermas2026/scripts/backup.sh
0 3 1,15 * * root certbot renew --quiet && service nginx reload
```

## Troubleshooting

Diagnostik lengkap:

```sh
sh scripts/diagnose-freebsd.sh
```

Log utama:

```sh
tail -f /var/log/sibermas/web.log
tail -f /var/log/sibermas/worker-default.log
tail -f apps/api/storage/logs/laravel.log
tail -f /var/log/nginx/sibermas-error.log
```

Masalah umum:

- `502` di `/`: cek `supervisorctl status sibermas-web` dan `/var/log/sibermas/web.log`
- `502` di `/api/*`: cek `service php-fpm status`, `/var/run/php-fpm.sock`, dan `nginx -t`
- `DB connection refused`: cek `service postgresql status`, password di `.env`, dan `pg_hba.conf`
- asset Next.js hilang: jalankan ulang `bash deploy-freebsd-simple.sh`

## Jalur Lanjut

Dokumen jails dan scaling masih ada untuk fase berikutnya:

- `docs/JAILS_MIGRATION.md`
- `docs/SCALING_5000.md`

Untuk deploy awal dan maintenance harian, pakai jalur simple single-server di dokumen ini.
