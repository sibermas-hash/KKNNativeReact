# Deploy SIBERMAS ke FreeBSD

**Target OS:** FreeBSD 14.x
**Last Updated:** 12 Mei 2026
**Deploy profile:** Single-domain, path-based API · Nginx reverse proxy · Supervisor queue workers (no Horizon)

---

## Ringkasan Arsitektur (2026-05 refresh)

| | Value |
|---|---|
| App root di server | `/usr/local/www/apache24/data/Sibermas2026` |
| Entry point | **Nginx** (port 80/443) — bukan Apache, walaupun path berada di folder `apache24/data` |
| API | Laravel 13 behind **PHP-FPM** (socket `/var/run/php84-fpm.sock`) |
| Web | Next.js 15 **standalone build** di `127.0.0.1:3000` |
| Queue | `queue:work` via **Supervisor** (Horizon _tidak_ dipakai — belum ada di `composer.json`) |
| Domain | **Satu domain**: `sibermas.uinsaizu.ac.id`. API diakses via path `/api/v1/*`. |

Request routing di Nginx:

```
https://sibermas.uinsaizu.ac.id/              → Next.js (proxy_pass :3000)
https://sibermas.uinsaizu.ac.id/_next/static/ → alias ke .next/standalone/*/static
https://sibermas.uinsaizu.ac.id/api/*         → Laravel /index.php (PHP-FPM)
```

---

## Prasyarat Server

| Komponen | Minimum | Rekomendasi |
|---|---|---|
| CPU | 2 core | 4 core |
| RAM | 4 GB | 8 GB |
| Disk | 40 GB SSD | 80 GB SSD |
| OS | FreeBSD 14.0 | FreeBSD 14.1 |
| IP | 1 public IP | 1 public IP + domain |

---

## Quick Deploy (Otomatis)

```bash
# 1. Login sebagai root ke server FreeBSD
ssh root@your-server

# 2. Clone repository ke path target (BUKAN /usr/local/www/sibermas lama)
git clone https://github.com/your-org/kknuinsaizu.git \
  /usr/local/www/apache24/data/Sibermas2026
cd /usr/local/www/apache24/data/Sibermas2026

# 3. Jalankan installer (install semua dependensi + setup DB + render nginx)
sh install-freebsd.sh

# 4. Setup backend
cd apps/api
cp .env.production.example .env
# Edit .env:
#   - DB_PASSWORD (lihat /usr/local/www/apache24/data/Sibermas2026/.db_password.initial)
#   - APP_KEY: kosongkan, akan di-generate langkah berikut
#   - MASTER_WEBHOOK_SECRET, API_ADMIN_SECRET, APP_BLIND_INDEX_KEY: generate baru
php artisan key:generate

# 5. Migrasi database + seed superadmin
php artisan migrate --force
KKN_SUPERADMIN_PASSWORD="your-strong-password" php artisan db:seed --class=SuperAdminSeeder --force
php artisan storage:link

# 6. Cache config + route
php artisan config:cache
php artisan route:cache

# 7. Build frontend (standalone output)
cd /usr/local/www/apache24/data/Sibermas2026
pnpm install --frozen-lockfile
pnpm build

# 8. Copy static & public ke direktori standalone
#    Ini WAJIB — standalone output tidak menyertakan static/public otomatis.
cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public         apps/web/.next/standalone/apps/web/public

# 9. Set permissions
chown -R www:www apps/api/storage apps/api/bootstrap/cache apps/web/.next

# 10. (HTTP dulu) start services
service nginx start
service supervisord start
service php-fpm start

# 11. (Setelah app hidup di HTTP) aktifkan SSL
pkg install -y py311-certbot
certbot certonly --webroot \
  -w /usr/local/www/apache24/data/Sibermas2026/apps/api/public \
  -d sibermas.uinsaizu.ac.id \
  --cert-name sibermas.uinsaizu.ac.id \
  -m admin@uinsaizu.ac.id --agree-tos -n

# Lalu uncomment block HTTPS di /usr/local/etc/nginx/nginx.conf dan reload.
# Juga: ubah APP_URL/NEXT_PUBLIC_API_URL dari http:// ke https:// di .env,
# set SESSION_SECURE_COOKIE=true, dan rebuild frontend.
service nginx reload
```

---

## Struktur Direktori di Server

```
/usr/local/www/apache24/data/Sibermas2026/     # Root aplikasi (baru)
  apps/api/                                     # Laravel backend
    supervisord.conf                            # Template supervisor workers
  apps/web/                                     # Next.js frontend
    .next/standalone/apps/web/server.js         # Entry point standalone (yang dipanggil supervisor)
    .next/standalone/apps/web/.next/static/     # Harus di-copy manual (lihat langkah 8)
    .next/standalone/apps/web/public/           # Harus di-copy manual (lihat langkah 8)
  packages/                                     # Shared TS packages
  scripts/backup.sh                             # Backup script (cron)
  scripts/restore.sh                            # Restore script
  nginx-freebsd.conf                            # Template nginx (source)
  install-freebsd.sh                            # Installer

/usr/local/etc/nginx/nginx.conf                # Nginx config (rendered from template)
/usr/local/etc/supervisord.d/sibermas.conf     # Supervisor workers
/usr/local/etc/letsencrypt/                    # SSL certificates
/var/log/sibermas/                             # Application logs
/var/log/nginx/                                # Nginx logs
/var/backups/sibermas/                         # Database backups
/var/run/php84-fpm.sock                        # PHP-FPM socket (nginx → Laravel)
```

> **Catatan path:** folder `apache24/data/` adalah default document root pkg
> `www/apache24`. Kita _menggunakan_ path-nya, tapi **Apache tidak di-install**
> dan tidak mendengarkan port apapun. Nginx tetap satu-satunya entry point.

---

## Komponen yang Berjalan

| Service | Port/Socket | Managed By |
|---|---|---|
| Nginx | 80, 443 | rc.d |
| PHP-FPM (php84) | `/var/run/php84-fpm.sock` | rc.d |
| PostgreSQL 16 | 5432 | rc.d |
| Redis 7 | 6379 | rc.d |
| Next.js (Node) | `127.0.0.1:3000` | Supervisor (`sibermas-web`) |
| Queue worker default/critical/high | — | Supervisor (`sibermas-worker-default`, 2 proc) |
| Queue worker low | — | Supervisor (`sibermas-worker-low`, 1 proc) |
| Queue worker long | — | Supervisor (`sibermas-worker-long`, 1 proc) |

> **Horizon:** tidak dijalankan. Paket `laravel/horizon` belum ada di
> `composer.json`. Tambahkan `composer require laravel/horizon` + restore
> block `[program:sibermas-horizon]` di `apps/api/supervisord.conf` jika mau
> dashboard Horizon.

---

## Hal Krusial agar Deploy Tidak Gagal

1. **Supervisor command wajib path absolut.** Supervisord di FreeBSD tidak
   mewarisi `$PATH` dari shell interaktif, jadi `php`/`node` polos akan lempar
   `can't find command`. `apps/api/supervisord.conf` sudah pakai
   `/usr/local/bin/php` dan `/usr/local/bin/node`. Jangan diubah ke nama
   binary saja.

2. **Next.js butuh `output: 'standalone'` + `outputFileTracingRoot`
   monorepo.** Di `apps/web/next.config.ts`:
   ```ts
   outputFileTracingRoot: path.join(__dirname, '../../'),
   output: 'standalone',
   ```
   Tanpa `outputFileTracingRoot` pointing ke root monorepo, `server.js` bisa
   lempar `MODULE_NOT_FOUND` untuk paket di `node_modules` yang di-hoist pnpm
   atau simlink di `packages/*`.

3. **Static & public TIDAK ikut standalone otomatis.** Setiap selesai
   `pnpm build`, jalankan langkah 8 di atas (copy `static/` + `public/` ke
   `.next/standalone/apps/web/`).

4. **`pnpm-workspace.yaml` tidak include `apps/mobile`.** Deploy profile
   hanya membangun backend + web supaya `pnpm install --frozen-lockfile` di
   server tidak menarik Expo/RN toolchain.

5. **Path app root.** Semua konfigurasi (`supervisord.conf`, `nginx-freebsd.conf`,
   `install-freebsd.sh`) sudah pakai `/usr/local/www/apache24/data/Sibermas2026`.
   Jangan git clone ke path lain — kecuali Anda juga update semua reference.

---

## Environment Variables (.env) — ringkas

Template lengkap di `apps/api/.env.production.example`. Bagian paling kritis:

```env
# === WAJIB ===
APP_ENV=production
APP_DEBUG=false
APP_KEY=                                    # php artisan key:generate
APP_URL=http://sibermas.uinsaizu.ac.id/api  # path-based; ganti https:// setelah SSL
APP_FRONTEND_URL=http://sibermas.uinsaizu.ac.id

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kkn_production
DB_USERNAME=kkn_app
DB_PASSWORD=                                # dari .db_password.initial
DB_SSLMODE=require                          # set disable kalau pg belum pakai TLS

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=                             # openssl rand -base64 32
CACHE_STORE=redis
QUEUE_CONNECTION=redis
SESSION_DRIVER=database

SESSION_DOMAIN=sibermas.uinsaizu.ac.id      # tanpa leading-dot (single domain)
SESSION_SECURE_COOKIE=false                 # set true setelah HTTPS aktif

# === CORS / SANCTUM === (single-domain deploy)
CORS_ALLOWED_ORIGINS=http://sibermas.uinsaizu.ac.id
SANCTUM_STATEFUL_DOMAINS=sibermas.uinsaizu.ac.id

# === AI (minimal 1 tier) ===
AI_PRIMARY_KEY=                             # SumoPod key
GEMINI_API_KEY=                             # Direct Google fallback

# === MONITORING ===
TELEGRAM_BOT_TOKEN=                         # dari @BotFather
TELEGRAM_CHAT_ID=                           # group chat ID ops team

# === SECURITY ===
APP_BLIND_INDEX_KEY=                        # openssl rand -base64 32
API_ADMIN_SECRET=                           # openssl rand -base64 32
MASTER_API_TOKEN=                           # dari SIAKAD admin
MASTER_WEBHOOK_SECRET=                      # openssl rand -base64 32

AUTH_TEST_AUTO_LOGIN_ENABLED=false
DEBUGBAR_ENABLED=false
```

Template `apps/web/.env.production.example`:

```env
NEXT_PUBLIC_API_URL=http://sibermas.uinsaizu.ac.id/api/v1
NEXT_PUBLIC_APP_URL=http://sibermas.uinsaizu.ac.id
NEXT_PUBLIC_SENTRY_DSN=
```

---

## Cron Jobs

```cron
# /etc/crontab (tambahkan)

# Laravel scheduler (setiap menit) — PAKAI PATH PHP ABSOLUT
* * * * * www cd /usr/local/www/apache24/data/Sibermas2026/apps/api && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1

# Database backup (jam 2 pagi)
0 2 * * * root /usr/local/bin/bash /usr/local/www/apache24/data/Sibermas2026/scripts/backup.sh

# Certbot renewal (2x sebulan)
0 3 1,15 * * root certbot renew --quiet && service nginx reload
```

---

## Update / Redeploy

```bash
cd /usr/local/www/apache24/data/Sibermas2026

# 1. Pull kode terbaru
git pull origin main

# 2. Backend
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# 3. Frontend
cd /usr/local/www/apache24/data/Sibermas2026
pnpm install --frozen-lockfile
pnpm build
cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public         apps/web/.next/standalone/apps/web/public
chown -R www:www apps/web/.next

# 4. Restart services
supervisorctl restart workers:*
```

---

## Troubleshooting

### `supervisord` log: `FATAL can't find command 'php'`
Path `php` belum absolut. Verifikasi `apps/api/supervisord.conf` pakai
`/usr/local/bin/php` (bukan `php` saja).

### `supervisord` log: `sibermas-web: Exited too quickly (process log may have details)`
Cek `/var/log/sibermas/web.log`. Penyebab paling sering:
1. `server.js` tidak ada → lupa `pnpm build` atau folder `.next/standalone/apps/web/` kosong.
2. `MODULE_NOT_FOUND '.../get-network-host'` → `outputFileTracingRoot` di
   `next.config.ts` belum menunjuk root monorepo (`path.join(__dirname, '../../')`).
3. Static/public belum di-copy ke folder standalone (langkah 8).

### `502 Bad Gateway` di `/`
```bash
supervisorctl status sibermas-web
sockstat -4l | grep 3000        # Pastikan port 3000 listening
tail -50 /var/log/sibermas/web.log
```

### `502 Bad Gateway` di `/api/*`
```bash
service php-fpm status
ls -la /var/run/php84-fpm.sock  # Socket harus ada + owned by www
tail -50 /var/log/php-fpm.log
tail -50 /var/log/nginx/sibermas-error.log
```

### Nginx gagal start
```bash
nginx -t                        # Test config syntax
cat /var/log/nginx/error.log
```

### Queue tidak jalan
```bash
supervisorctl status
tail -50 /var/log/sibermas/worker-default.log
# Cek Redis
redis-cli ping
redis-cli llen queues:default
```

### Database connection refused
```bash
service postgresql status
su -l postgres -c "pg_isready"
# Cek pg_hba.conf: host kkn_production kkn_app 127.0.0.1/32 scram-sha-256
```

### SSL certificate expired
```bash
certbot renew --force-renewal
service nginx reload
```

---

## Monitoring

### Health Checks
```bash
curl -s https://sibermas.uinsaizu.ac.id/api/health | jq .
curl -s https://sibermas.uinsaizu.ac.id/api/ready  | jq .
```

### Logs
```bash
tail -f /var/log/sibermas/web.log                # Next.js
tail -f /var/log/sibermas/worker-default.log     # Queue default
tail -f /var/log/nginx/sibermas-error.log        # Nginx error (gabungan web + api)
tail -f /var/log/nginx/sibermas-access.log       # Nginx access
```

### Telegram AI Alerts
Otomatis aktif jika `TELEGRAM_BOT_TOKEN` dan `TELEGRAM_CHAT_ID` di-set.
Bot akan mengirim:
- Error backend/frontend/queue secara real-time dengan AI analysis
- Daily digest jam 21:00 WIB
- Anomaly detection setiap 30 menit

---

## Backup & Restore

### Manual Backup
```bash
/usr/local/bin/bash /usr/local/www/apache24/data/Sibermas2026/scripts/backup.sh
# Output: /var/backups/sibermas/db_YYYYMMDD_HHMMSS.dump
```

### Restore
```bash
/usr/local/bin/bash /usr/local/www/apache24/data/Sibermas2026/scripts/restore.sh \
  /var/backups/sibermas/db_20260511_020000.dump
```

---

## Security Checklist Production

- [ ] `APP_DEBUG=false`
- [ ] `AUTH_TEST_AUTO_LOGIN_ENABLED=false`
- [ ] `DEBUGBAR_ENABLED=false`
- [ ] `DB_SSLMODE=require`
- [ ] `SESSION_SECURE_COOKIE=true` (setelah SSL aktif)
- [ ] Semua secret di-generate fresh (bukan copy dari dev)
- [ ] `.db_password.initial` dihapus setelah di-copy ke `.env`
- [ ] Firewall: hanya port 22, 80, 443 terbuka
- [ ] Redis password di-set (`requirepass` di `redis.conf`)
- [ ] PostgreSQL hanya listen localhost (`pg_hba.conf`)
- [ ] Certbot auto-renewal aktif
- [ ] Supervisor pakai `/usr/local/bin/php` absolut
- [ ] Next.js `outputFileTracingRoot: path.join(__dirname, '../../')`
- [ ] Static & public ter-copy ke `.next/standalone/apps/web/` setelah tiap build
