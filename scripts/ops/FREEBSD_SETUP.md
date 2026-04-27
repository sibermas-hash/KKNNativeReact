# FreeBSD Native Setup Guide

Dokumen ini berisi panduan untuk melakukan instalasi **SIBERMAS (Portal KKN UIN Saizu)** secara native di sistem operasi **FreeBSD 14+**.

## 1. Instalasi Paket Sistem

Jalankan perintah berikut sebagai root untuk menginstal semua dependensi yang diperlukan:

```bash
# Update repository
pkg update

# Install PHP 8.4 dan ekstensi yang diperlukan
pkg install -y php84 php84-mysqli php84-pdo_pgsql php84-pgsql php84-mbstring \
    php84-zip php84-zlib php84-curl php84-gd php84-bcmath php84-intl \
    php84-opcache php84-pecl-redis php84-filter php84-session php84-tokenizer \
    php84-xml php84-ctype php84-dom php84-fileinfo php84-iconv php84-posix \
    php84-pcntl php84-pecl-igbinary

# Install Database & Caching
pkg install -y postgresql16-server redis

# Install Web Server & Tools
pkg install -y nginx node20 npm-node20 composer bash git
```

## 2. Konfigurasi Service

Aktifkan service agar berjalan otomatis saat boot:

```bash
sysrc php_fpm_enable="YES"
sysrc nginx_enable="YES"
sysrc redis_enable="YES"
sysrc postgresql_enable="YES"

# Inisialisasi Database PostgreSQL
service postgresql initdb
service postgresql start

# Jalankan service lainnya
service php-fpm start
service redis start
service nginx start
```

## 3. Setup Database

Masuk ke shell postgres dan buat database:

```bash
su - postgres
psql
```

```sql
CREATE DATABASE kkn;
CREATE USER kkn_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE kkn TO kkn_user;
\q
exit
```

## 4. Deploy Aplikasi

Clone repository dan jalankan skrip setup:

```bash
# Clone (jika belum)
git clone <repository_url> /usr/local/www/kkn-system
cd /usr/local/www/kkn-system

# Copy environment
cp .env.example .env

# Sesuaikan konfigurasi .env (DB_USERNAME, DB_PASSWORD, dll)
vi .env

# Jalankan skrip setup produksi (sudah mendukung FreeBSD)
WEB_USER=www bash scripts/production-setup.sh
```

## 5. Konfigurasi Nginx (FreeBSD)

Buat file konfigurasi di `/usr/local/etc/nginx/conf.d/kkn.conf`:

```nginx
server {
    listen 80;
    server_name kkn.uinsaizu.ac.id;
    root /usr/local/www/kkn-system/public;

    add_header X-Frame-Options "SAMEORIGIN";
    add_header X-Content-Type-Options "nosniff";

    index index.php;

    charset utf-8;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location = /favicon.ico { access_log off; log_not_found off; }
    location = /robots.txt  { access_log off; log_not_found off; }

    error_page 404 /index.php;

    location ~ \.php$ {
        fastcgi_pass unix:/var/run/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

Pastikan `/usr/local/etc/php-fpm.d/www.conf` menggunakan listen socket di `/var/run/php-fpm.sock` dan user/group adalah `www`.

## 6. Otomatisasi Backup

Setup cronjob untuk backup:

```bash
# Edit crontab sebagai root
crontab -e
```

Tambahkan baris berikut (setiap jam 2 pagi):
```bash
0 2 * * * /usr/local/bin/bash /usr/local/www/kkn-system/scripts/backup.sh
```

---
**Catatan:** Pastikan binary `bash` berada di `/usr/local/bin/bash` (standar FreeBSD setelah install pkg bash).
