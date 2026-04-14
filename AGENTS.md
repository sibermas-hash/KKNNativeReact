# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Gambaran proyek
- Aplikasi portal KKN berbasis **Laravel + Inertia + React/TypeScript** dengan domain utama: pendaftaran, penempatan kelompok, pelaporan, penilaian, sertifikat, dan sinkronisasi data master.
- Arsitektur runtime mengikuti konfigurasi root (`composer.json`, `package.json`, `vite.config.js`); dokumen `docs/` dipakai sebagai referensi sekunder.

## Perintah pengembangan yang umum dipakai
### Setup awal
```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
```

### Menjalankan aplikasi (lokal, non-Docker)
```bash
php artisan serve
npm run dev
```

### Build frontend
```bash
npm run build
```

### Testing
```bash
# seluruh backend test
php artisan test

# satu file backend test
php artisan test tests/Feature/SmokeTest.php

# satu test backend berdasarkan nama method
php artisan test --filter=test_home_page_is_accessible

# seluruh frontend test (Vitest)
npm run test

# satu file frontend test
npm run test -- resources/js/Components/__tests__/DashboardCard.test.tsx

# satu test frontend berdasarkan judul test
npm run test -- -t "renders"
```

### Static analysis / lint
```bash
# PHP static analysis (sesuai README)
php artisan phpstan

# Frontend lint
npm run lint

# PHP formatter (tersedia via dependency laravel/pint)
./vendor/bin/pint
```

### Docker workflow (jika dipakai)
```bash
docker-compose up -d
docker-compose exec app php artisan migrate
```

## Arsitektur tingkat tinggi
### 1) HTTP entrypoint dan routing
- Entry konfigurasi aplikasi ada di `bootstrap/app.php`.
- Routing web utama di `routes/web.php`, lalu route role-specific dipisah ke:
  - `routes/admin.php`
  - `routes/dpl.php`
  - `routes/student.php`
- Route API ada di `routes/api.php` (notifikasi, webhook, API key distribution, public data API v1).

### 2) Kontrol akses dan fase bisnis
- Akses berbasis role memakai Spatie Permission + middleware `role:*`.
- Middleware global penting di web stack:
  - `HandleInertiaRequests`
  - `HandleActivePeriod`
  - `EnsurePasswordChanged`
  - `EnsureUserIsActive`
  - security headers (`CspHeaders`, `SecurityHeaders`)
- Workflow KKN dipagari middleware `phase:*` (contoh: `registration`, `execution`, `grading`, `finished`) terutama di `routes/student.php` dan `routes/dpl.php`.
- Admin dapat mengubah fase aktif via dashboard (`/admin/dashboard/switch-phase`), sehingga perubahan fase memengaruhi akses fitur lintas role.

### 3) Lapisan backend
- Pola utama: **Controller -> Service -> Repository/Model**.
- Kode bisnis banyak terpusat di `app/Services/` dan `app/Services/KKN/`.
- Data access abstraction dipakai pada area tertentu lewat repository contracts (`app/Repositories/Contracts`).
- Model domain utama ada di `app/Models/KKN/`; integrasi data master ada di namespace `app/Models/Master/`.
- Background processing menggunakan jobs di `app/Jobs/` dan queue worker Redis (lihat command queue di `docker-compose.yml`).

### 4) Frontend Inertia + React
- Entrypoint frontend: `resources/js/app.tsx`.
- Resolusi halaman Inertia memakai pola `resources/js/Pages/**/*.tsx`.
- Layout utama aplikasi terautentikasi: `resources/js/Layouts/AppLayout.tsx`.
- Shared props Inertia ditentukan di `app/Http/Middleware/HandleInertiaRequests.php` (auth user, roles/permissions, active phase, flash message).
- Alias import frontend: `@` -> `resources/js` (lihat `vite.config.js` dan `vitest.config.ts`).

### 5) Integrasi penting
- Sinkronisasi data master dan monitoringnya tersebar di service/job/controller admin terkait sinkronisasi.
- Endpoint webhook dilindungi signature middleware (`VerifyWebhookSignature`) di `routes/api.php`.
- Public data API v1 dilindungi middleware `api.key`.

### 6) Catatan navigasi cepat untuk agent
- Saat perubahan menyentuh alur role tertentu, cek rute + middleware phase di file route role terkait terlebih dahulu.
- Untuk isu data/aturan bisnis, prioritaskan pembacaan service di `app/Services/**` sebelum controller.
- Untuk bug UI, mulai dari page Inertia di `resources/js/Pages/**`, lalu telusuri ke komponen reusable di `resources/js/Components/**`.
