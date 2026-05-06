# Deployment Guide — FreeBSD (Production)

**Platform:** FreeBSD 14.x (no Docker)  
**Web Server:** Nginx  
**App Server:** PHP-FPM 8.4  
**Process Manager:** Supervisord atau rc.d script  
**Database:** PostgreSQL 16+  
**Cache/Queue:** Redis 7+  

---

## 1. Prerequisites

```sh
# FreeBSD packages
pkg install -y nginx php84 php84-extensions redis postgresql16-server \
  composer node pnpm

# PHP extensions yang dibutuhkan
pkg install -y php84-pgsql php84-redis php84-mbstring php84-xml \
  php84-zip php84-gd php84-intl php84-bcmath php84-curl php84-openssl
```

---

## 2. PostgreSQL Setup

```sh
# Enable & start PostgreSQL
sysrc postgresql_enable=YES
service postgresql initdb
service postgresql start

# Create database & user
su - postgres
createuser sibermas
psql -c "ALTER USER sibermas WITH PASSWORD 'STRONG_PASSWORD';"
createdb -O sibermas kknnative
exit
```

---

## 3. Redis Setup

```sh
# Enable Redis
sysrc redis_enable=YES
service redis start
```

---

## 4. Application Deployment

```sh
# Clone project (contoh path)
git clone https://github.com/your-org/kknuinsaizu.git /usr/local/www/sibermas
cd /usr/local/www/sibermas

# API — Laravel
cd apps/api
cp .env.example .env
# Edit .env: DB_PASSWORD, APP_KEY, REDIS_PASSWORD, dll
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan db:seed --force --class=ProductionSeeder   # Jika ada
php artisan optimize
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Web — Next.js (build di server)
cd apps/web
pnpm install
pnpm build
```

---

## 5. Queue Workers (Supervisord)

Install & config `supervisor`:

```sh
pkg install -y py311-supervisor
sysrc supervisord_enable=YES
```

`/usr/local/etc/supervisor/conf.d/sibermas.conf`:

```ini
[program:sibermas-api]
command=/usr/local/bin/php /usr/local/www/sibermas/apps/api/artisan queue:work redis --sleep=3 --tries=3 --timeout=90
autostart=true
autorestart=true
user=www
numprocs=2
redirect_stderr=true
stdout_logfile=/var/log/sibermas-worker.log

[program:sibermas-schedule]
command=/usr/local/bin/php /usr/local/www/sibermas/apps/api/artisan schedule:run
autostart=false
autorestart=false
user=www
stdout_logfile=/var/log/sibermas-schedule.log
```

Jika menggunakan `cron` untuk scheduler:

```sh
# crontab -u www
echo "* * * * * cd /usr/local/www/sibermas/apps/api && /usr/local/bin/php artisan schedule:run >> /dev/null 2>&1" | crontab -u www -
```

---

## 6. Nginx Configuration

`/usr/local/etc/nginx/nginx.conf` (relevant snippet):

```nginx
upstream php_backend {
    server 127.0.0.1:9000;
}

server {
    listen 443 ssl http2;
    server_name sibermas.uinsaizu.ac.id;

    ssl_certificate     /usr/local/etc/ssl/sibermas.crt;
    ssl_certificate_key /usr/local/etc/ssl/sibermas.key;

    # Laravel API
    location /api {
        alias /usr/local/www/sibermas/apps/api/public;
        try_files $uri $uri/ /index.php?$query_string;

        location ~ \.php$ {
            fastcgi_pass php_backend;
            fastcgi_index index.php;
            fastcgi_param SCRIPT_FILENAME $request_filename;
            include fastcgi_params;
        }
    }

    # Next.js (standalone output)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Health checks (passthrough ke Laravel)
    location /health { proxy_pass http://127.0.0.1:8000/health; }
    location /ready  { proxy_pass http://127.0.0.1:8000/ready; }
}
```

---

## 7. Security Hardening

```sh
# File permissions
chown -R www:www /usr/local/www/sibermas/apps/api/storage
chmod -R 750 /usr/local/www/sibermas/apps/api/storage
chmod -R 700 /usr/local/www/sibermas/apps/api/storage/logs

# Disable .env access
location ~ /\.env {
    deny all;
}
```

---

## 8. Backup

```sh
# pg_dump schedule (via cron daily)
0 2 * * * su - postgres -c "pg_dump kknnative | gzip > /backup/kknnative-$(date +\%Y\%m\%d).sql.gz"
# retention: keep 7 days
find /backup -name "kknnative-*.sql.gz" -mtime +7 -delete
```
