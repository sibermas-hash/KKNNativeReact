# Deploy SIBERMAS ke FreeBSD

**Target OS:** FreeBSD 14.x
**Last Updated:** 11 Mei 2026

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

# 2. Clone repository
git clone https://github.com/your-org/kknuinsaizu.git /usr/local/www/sibermas
cd /usr/local/www/sibermas

# 3. Jalankan installer (install semua dependensi + setup DB)
sh install-freebsd.sh

# 4. Setup aplikasi
cd apps/api
cp .env.production.example .env
# Edit .env: isi DB_PASSWORD (lihat /usr/local/www/sibermas/.db_password.initial)
# Generate secrets:
php artisan key:generate

# 5. Migrasi database + seed
php artisan migrate --force
KKN_SUPERADMIN_PASSWORD="your-strong-password" php artisan db:seed --class=SuperAdminSeeder --force
php artisan storage:link

# 6. Cache config
php artisan config:cache
php artisan route:cache

# 7. Build frontend
cd /usr/local/www/sibermas
pnpm install --frozen-lockfile
pnpm build

# 8. Copy Next.js standalone assets
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public

# 9. Set permissions
chown -R www:www apps/api/storage apps/api/bootstrap/cache apps/web/.next

# 10. SSL certificate
pkg install -y py311-certbot
certbot certonly --webroot \
  -w /usr/local/www/sibermas/apps/api/public \
  -d sibermas.uinsaizu.ac.id -d api.sibermas.uinsaizu.ac.id \
  --cert-name sibermas.uinsaizu.ac.id \
  -m admin@uinsaizu.ac.id --agree-tos -n

# 11. Start services
service nginx start
service supervisord start
```

---

## Struktur Direktori di Server

```
/usr/local/www/sibermas/          # Root aplikasi
  apps/api/                        # Laravel backend
  apps/web/                        # Next.js frontend
  apps/mobile/                     # Source mobile (tidak di-deploy)
  packages/                        # Shared TS packages
  scripts/backup.sh                # Backup script (cron)
  scripts/restore.sh               # Restore script
  nginx-freebsd.conf               # Template nginx
  install-freebsd.sh               # Installer

/usr/local/etc/nginx/nginx.conf   # Nginx config (rendered)
/usr/local/etc/supervisord.d/     # Supervisor configs
/usr/local/etc/letsencrypt/       # SSL certificates
/var/log/sibermas/                # Application logs
/var/log/nginx/                   # Nginx logs
/var/backups/sibermas/            # Database backups
```

---

## Komponen yang Berjalan

| Service | Port/Socket | Managed By |
|---|---|---|
| Nginx | 80, 443 | rc.d |
| PHP-FPM | /var/run/php84-fpm.sock | rc.d |
| PostgreSQL 16 | 5432 | rc.d |
| Redis 7 | 6379 | rc.d |
| Next.js (Node) | 127.0.0.1:3000 | Supervisor |
| Laravel Horizon | - | Supervisor |
| Queue Workers (3) | - | Supervisor |

---

## Environment Variables (.env)

```env
# === WAJIB ===
APP_ENV=production
APP_DEBUG=false
APP_KEY=              # php artisan key:generate
APP_URL=https://api.sibermas.uinsaizu.ac.id
FRONTEND_URL=https://sibermas.uinsaizu.ac.id

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kkn_production
DB_USERNAME=kkn_app
DB_PASSWORD=          # dari .db_password.initial
DB_SSLMODE=require

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=       # openssl rand -base64 32

SESSION_DRIVER=redis
SESSION_SECURE_COOKIE=true
CACHE_STORE=redis
QUEUE_CONNECTION=redis

CORS_ALLOWED_ORIGINS=https://sibermas.uinsaizu.ac.id
SANCTUM_STATEFUL_DOMAINS=sibermas.uinsaizu.ac.id

# === AI (minimal 1 tier) ===
AI_PRIMARY_KEY=       # SumoPod key
GEMINI_API_KEY=       # Direct Google fallback (gratis)
OPENAI_API_KEY=       # Direct OpenAI fallback

# === MONITORING ===
TELEGRAM_BOT_TOKEN=   # dari @BotFather
TELEGRAM_CHAT_ID=     # group chat ID ops team

# === SECURITY ===
APP_BLIND_INDEX_KEY=  # openssl rand -base64 32
API_ADMIN_SECRET=     # openssl rand -base64 32
MASTER_API_TOKEN=     # dari SIAKAD admin
MASTER_WEBHOOK_SECRET=# openssl rand -base64 32

AUTH_TEST_AUTO_LOGIN_ENABLED=false
DEBUGBAR_ENABLED=false
```

---

## Cron Jobs

```bash
# /etc/crontab (tambahkan)

# Laravel scheduler (setiap menit)
* * * * * www cd /usr/local/www/sibermas/apps/api && php artisan schedule:run >> /dev/null 2>&1

# Database backup (jam 2 pagi)
0 2 * * * root /usr/local/bin/bash /usr/local/www/sibermas/scripts/backup.sh

# Certbot renewal (2x sebulan)
0 3 1,15 * * root certbot renew --quiet && service nginx reload
```

---

## Update / Redeploy

```bash
cd /usr/local/www/sibermas

# 1. Pull kode terbaru
git pull origin main

# 2. Backend
cd apps/api
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# 3. Frontend
cd /usr/local/www/sibermas
pnpm install --frozen-lockfile
pnpm build
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public
chown -R www:www apps/web/.next

# 4. Restart services
supervisorctl restart workers:*
```

---

## Troubleshooting

### Nginx gagal start
```bash
nginx -t                          # Test config syntax
cat /var/log/nginx/error.log      # Lihat error
```

### PHP-FPM socket not found
```bash
service php-fpm status
service php-fpm start
ls -la /var/run/php84-fpm.sock
```

### Queue tidak jalan
```bash
supervisorctl status              # Cek semua proses
tail -50 /var/log/sibermas/horizon.log
tail -50 /var/log/sibermas/worker-default.log
```

### Database connection refused
```bash
service postgresql status
su -l postgres -c "pg_isready"
```

### Redis connection refused
```bash
service redis status
redis-cli ping
```

### Next.js 502 Bad Gateway
```bash
supervisorctl status sibermas-web
tail -50 /var/log/sibermas/web.log
# Pastikan port 3000 listening:
sockstat -4l | grep 3000
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
curl -s https://api.sibermas.uinsaizu.ac.id/api/health | jq .
curl -s https://api.sibermas.uinsaizu.ac.id/api/ready | jq .
```

### Logs
```bash
tail -f /var/log/sibermas/horizon.log      # Queue
tail -f /var/log/sibermas/web.log          # Next.js
tail -f /var/log/nginx/sibermas-api-error.log  # API errors
tail -f /var/log/nginx/sibermas-web-error.log  # Web errors
```

### Telegram AI Alerts
Otomatis aktif jika TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID di-set.
Bot akan mengirim:
- Error backend/frontend/queue secara real-time dengan AI analysis
- Daily digest jam 21:00 WIB
- Anomaly detection setiap 30 menit

---

## Backup & Restore

### Manual Backup
```bash
/usr/local/bin/bash /usr/local/www/sibermas/scripts/backup.sh
# Output: /var/backups/sibermas/db_YYYYMMDD_HHMMSS.dump
```

### Restore
```bash
/usr/local/bin/bash /usr/local/www/sibermas/scripts/restore.sh /var/backups/sibermas/db_20260511_020000.dump
```

---

## Security Checklist Production

- [ ] APP_DEBUG=false
- [ ] AUTH_TEST_AUTO_LOGIN_ENABLED=false
- [ ] DEBUGBAR_ENABLED=false
- [ ] DB_SSLMODE=require
- [ ] SESSION_SECURE_COOKIE=true
- [ ] Semua secret di-generate fresh (bukan copy dari dev)
- [ ] .db_password.initial dihapus setelah di-copy ke .env
- [ ] Firewall: hanya port 22, 80, 443 terbuka
- [ ] Redis password di-set (requirepass di redis.conf)
- [ ] PostgreSQL hanya listen localhost (pg_hba.conf)
- [ ] Certbot auto-renewal aktif
