# KKN UIN SAIZU Portal

Sistem Informasi KKN (Kuliah Kerja Nyata) untuk UIN Prof. K.H. Saifuddin Zuhri Purwokerto.

## 📖 Deskripsi

Aplikasi ini mengelola seluruh siklus KKN:

- Pendaftaran & penempatan mahasiswa
- Pembagian kelompok & penugasan DPL
- Pelaporan kegiatan harian (dengan GPS)
- Program kerja & laporan akhir
- Penilaian & sertifikat
- Workshop & absensi QR code

## 🛠️ Tech Stack

- **Backend**: Laravel 13 (PHP 8.4) + PostgreSQL 16 + Redis 7
- **Frontend**: React 19 + TypeScript + Inertia.js + Tailwind CSS 4
- **Mobile**: Expo 53 / React Native (Android)
- **Testing**: Pest PHP + Vitest
- **CI/CD**: GitHub Actions

## 🚀 Instalasi

### Prasyarat

- PHP 8.4+
- Composer
- Node.js 20+
- PostgreSQL 16
- Redis 7

### Langkah Instalasi

```bash
# 1. Clone repository
git clone <repository-url>
cd kknuinsaizu

# 2. Install dependencies
composer install
npm install

# 3. Setup environment
cp .env.example .env
php artisan key:generate

# 4. Setup database
php artisan migrate
php artisan db:seed

# 5. Build assets
npm run build

# 6. Jalankan aplikasi
php artisan serve
npm run dev
```

## 📚 Dokumentasi

Dokumentasi lengkap tersedia di folder `docs/`:

- [📋 Dokumentasi Index](docs/INDEX.md) - Indeks seluruh dokumentasi
- [📘 API Reference](docs/API_REFERENCE.md) - Referensi API lengkap (V1)
- [🏗️ Arsitektur](docs/ARCHITECTURE.md) - Gambaran arsitektur sistem
- [🔧 Setup Guide](docs/SETUP.md) - Panduan setup & pengembangan lokal
- [📋 Audit Status](docs/AUDIT_STATUS.md) - Temuan audit & status terkini
- [🖥️ FreeBSD Deployment](docs/FREEBSD_DEPLOYMENT.md) - Panduan deploy ke production
- [🛠️ Workshop System](docs/workshop-system.md) - Sistem workshop & sertifikat DPL
- [🚀 Roadmap](docs/pengembangan_lanjutan.md) - Rencana pengembangan lanjutan

## 🧪 Testing

```bash
# Backend tests
php artisan test

# Frontend tests
npm run test

# Code quality
php artisan phpstan
npm run lint
```

## 🐳 Docker

```bash
# Build dan jalankan dengan Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec app php artisan migrate
```

## 🖥️ Deployment FreeBSD

### Prasyarat FreeBSD
- FreeBSD 14.x
- PHP 8.4 (`php84` via pkg)
- PostgreSQL 16 (`postgresql16-server`)
- Redis (`redis`)
- Nginx (`nginx`)
- Supervisor (`py311-supervisor`)
- Node.js 22 + pnpm

### Instalasi Otomatis

```bash
# Jalankan sebagai root
sh install-freebsd.sh
```

### Instalasi Manual

> ℹ️ **Panduan lengkap:** lihat [`docs/DEPLOY_FREEBSD.md`](docs/DEPLOY_FREEBSD.md).
> Ringkasan di sini hanya untuk quick-reference.

```bash
# 1. Install dependensi
pkg install -y php84 php84-extensions php84-pdo_pgsql php84-mbstring \
    php84-xml php84-curl php84-zip php84-gd php84-redis php84-opcache \
    php84-pcntl php84-posix composer nginx postgresql16-server redis \
    node22 npm-node22 py311-supervisor

# 2. Aktifkan layanan
sysrc nginx_enable="YES" postgresql_enable="YES" \
      redis_enable="YES" supervisord_enable="YES" php_fpm_enable="YES"

# 3. Init & start PostgreSQL
service postgresql initdb
service postgresql start

# 4. Buat database
su -l postgres -c "psql -c \"CREATE USER kkn_app WITH PASSWORD 'password';\""
su -l postgres -c "psql -c \"CREATE DATABASE kkn_production OWNER kkn_app;\""

# 5. Deploy aplikasi ke /usr/local/www/apache24/data/Sibermas2026
git clone <repository-url> /usr/local/www/apache24/data/Sibermas2026
cd /usr/local/www/apache24/data/Sibermas2026/apps/api

# 6. Setup environment
cp .env.production.example .env
# Edit .env: APP_KEY, DB_PASSWORD, dll

# 7. Install dependencies & build
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache

cd /usr/local/www/apache24/data/Sibermas2026
pnpm install --frozen-lockfile && pnpm build

# Next.js standalone output: static/public tidak ikut otomatis — copy manual:
cp -r apps/web/.next/static  apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public        apps/web/.next/standalone/apps/web/public

# 8. Set permissions (user www = FreeBSD web user)
chown -R www:www /usr/local/www/apache24/data/Sibermas2026/apps/api/storage
chown -R www:www /usr/local/www/apache24/data/Sibermas2026/apps/api/bootstrap/cache
chown -R www:www /usr/local/www/apache24/data/Sibermas2026/apps/web/.next

# 9. Konfigurasi nginx & supervisor (template di-sed oleh install-freebsd.sh)
cp nginx-freebsd.conf /usr/local/etc/nginx/nginx.conf
cp apps/api/supervisord.conf /usr/local/etc/supervisord.d/sibermas.conf

# 10. Start semua layanan
service nginx start
service redis start
service php-fpm start
service supervisord start
```

### Path Penting di FreeBSD

| Komponen | Path |
|---|---|
| Web root (app) | `/usr/local/www/apache24/data/Sibermas2026` |
| Nginx config | `/usr/local/etc/nginx/nginx.conf` |
| PHP binary | `/usr/local/bin/php` |
| Supervisor config | `/usr/local/etc/supervisord.d/` |
| SSL cert (Let's Encrypt) | `/usr/local/etc/letsencrypt/live/` |
| Log aplikasi | `/var/log/sibermas/` |
| PostgreSQL data | `/var/db/postgres/data16/` |

### Perbedaan dari Linux

| | Linux (Ubuntu/Debian) | FreeBSD |
|---|---|---|
| Web user | `www-data` | `www` |
| Web root | `/var/www/` | `/usr/local/www/` |
| Package manager | `apt` | `pkg` |
| PHP package | `php8.4` | `php84` |
| Service control | `systemctl` | `service` |
| SSL path | `/etc/letsencrypt/` | `/usr/local/etc/letsencrypt/` |

## 📱 Mobile App

Aplikasi Android tersedia via Expo React Native:

```bash
cd apps/mobile
npx expo prebuild --platform android
npx expo run:android
```

## 👥 Role Pengguna

1. **Superadmin** - Akses penuh ke semua fitur
2. **Faculty Admin** - Manajemen fakultas & mahasiswa
3. **DPL** - Monitoring kelompok & penilaian
4. **Mahasiswa** - Pendaftaran, pelaporan, & penilaian

## 🔐 Security

- Role-based access control (RBAC) via Spatie Permission
- CSRF protection & security headers
- Rate limiting & API key management
- Webhook signature verification

## 📄 License

Hak cipta dilindungi undang-undang. UIN Prof. K.H. Saifuddin Zuhri Purwokerto.

---
> 🔄 Last deployment test: 2026-04-24 14:22 WIB
