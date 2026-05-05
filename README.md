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
- **Mobile**: Capacitor 8 (Android)
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
- [🔒 Security Guide](docs/SECURITY_GUIDE.md) - Best practices keamanan
- [📡 External API](docs/EXTERNAL_API_GUIDE.md) - Panduan integrasi SIAKAD
- [⚙️ SIAKAD Config](docs/SIAKAD_CONFIG.md) - Konfigurasi API SIAKAD
- [📋 Audit Status](docs/auditnow.md) - Temuan audit & status terkini
- [✅ Implementation Checklist](docs/IMPLEMENTATION_CHECKLIST.md) - Checklist implementasi

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

## 📱 Mobile App

Aplikasi Android tersedia via Capacitor:

```bash
npx cap sync android
npx cap open android
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
