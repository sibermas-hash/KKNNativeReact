# SIBERMAS — Dokumentasi Teknis Lengkap
## Sistem Informasi KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto

| Field | Value |
|-------|-------|
| **Nama** | SIBERMAS (Sistem Informasi Berbasis Masyarakat) |
| **App ID** | `ac.id.uinsaizu.kkn` |
| **Produksi** | `https://kkn.uinsaizu.ac.id` |
| **Lokal** | `http://localhost:8000` |
| **Repository** | `github.com/putrihati-cmd/kknuinsaizu` |

SIBERMAS mengelola seluruh siklus KKN: pendaftaran → plotting kelompok → pelaksanaan lapangan → penilaian → sertifikat. Satu codebase untuk **Web** (browser) dan **Mobile** (Capacitor → Android/iOS).

---

# STEP 1: TECH STACK

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Backend | Laravel (PHP) | 13.x (PHP 8.4) |
| Frontend | React + TypeScript + Inertia.js | React 19, Vite 8 |
| Styling | Tailwind CSS | 4.x |
| Animasi | Framer Motion | 12.x |
| UI | Headless UI | 2.x |
| Icons | Lucide React | 1.x |
| Editor | TipTap | 3.x |
| Maps | Leaflet + React Leaflet | — |
| Mobile | Capacitor | 8.x |
| Database | PostgreSQL | 15+ |
| Auth Web | Session + CAPTCHA Matematika | — |
| Auth API | Sanctum (Bearer Token) | — |
| Authorization | Spatie Permission | 6.x |
| Cache/Queue | Database Driver (→ Redis di produksi) | — |

---

# STEP 2: ARSITEKTUR SISTEM

```
CLIENT: Browser / Mobile App (Capacitor)
         │                    │
         │ Inertia.js         │ REST API
         ▼                    ▼
FRONTEND: React 19 + TypeScript + Vite 8
         │  Pages/ (Admin, Dosen, Student, Auth, Public)
         │  Components/ (Premium, UI, Forms)
         │  Layouts/ (AppLayout, PublicLayout)
         │  Mobile Only: 📍GPS  📷Camera  🔔Push
         ▼
BACKEND: Laravel 13 / PHP 8.4
         │  Controllers/ (Admin, Api, Auth, Dosen, Student, Public)
         │  Services/ (KKN/KknRequirementService, PlottingService, AttendanceService)
         │  Models/KKN/ (51 models)
         │  Policies, Requests, Middleware, Notifications
         ▼
DATA: PostgreSQL 15+ (75+ tables, 141 migrations)
      Auth: Sanctum + Spatie Permission (6 roles, 22 permissions)
```

### Struktur Folder Utama

```
kknuinsaizu/
├── app/Http/Controllers/{Admin,Api,Auth,Dosen,Student,Public}/
├── app/Models/KKN/          # 51 Eloquent models
├── app/Services/KKN/        # Business logic
├── resources/js/Pages/{Admin,Dosen,Student,Auth,Public}/  # 80+ pages
├── resources/js/Components/{Premium,UI,Forms}/
├── database/migrations/     # 141 files
├── database/seeders/        # 24 seeders
├── routes/{web,admin,api}.php
└── capacitor.config.ts
```

---

# STEP 3: USER ROLES (6)

| Role | Target | Akses |
|------|--------|-------|
| `superadmin` | IT Universitas | Semua + System Settings + Audit |
| `admin` | Staf LPPM | Semua kecuali System Settings |
| `faculty_admin` | Admin Fakultas | Data mahasiswa fakultasnya |
| `dosen` | Dosen biasa | Read-only kelompok |
| `dpl` | Dosen Pembimbing | Monitoring, evaluasi, penilaian |
| `student` | Mahasiswa | Pendaftaran, absensi, logbook, sertifikat |

**Catatan:** Semua mahasiswa bisa login, tapi tidak semua bisa ikut KKN (ditentukan validasi kelayakan). Dosen bisa punya role `dpl` bersamaan.

---

# STEP 4: ALUR BISNIS KKN (6 FASE)

```
SETUP ADMIN → PENDAFTARAN → PLOTTING → PELAKSANAAN → PENILAIAN → SERTIFIKAT
```

### Fase 1: Setup Admin
Admin buat Tahun Akademik → Jenis KKN (+ syarat) → Periode → Lokasi → Kelompok → Tugaskan DPL → Atur bobot penilaian.

### Fase 2: Pendaftaran Mahasiswa
Login NIM → Cek kelayakan otomatis → Isi formulir + upload dokumen → Status `pending` → Admin approve/reject.

### Fase 3: Plotting Kelompok
Admin jalankan plotting otomatis (keseimbangan gender, kapasitas, variasi prodi) atau manual → Tugaskan Ketua & Sekretaris.

### Fase 4: Pelaksanaan Lapangan
Absensi GPS (mobile) → Logbook harian + foto → Program kerja (metode ABCD) → DPL monitoring → Izin keluar jika perlu.

### Fase 5: Penilaian
DPL input evaluasi per komponen → Sistem hitung total (Σ Nilai×Bobot) → Tentukan grade → Admin verifikasi.

### Fase 6: Sertifikat
Admin atur template → Generate untuk yang lulus (Grade ≥ C) → Mahasiswa download.

---

# STEP 5: VALIDASI KELAYAKAN KKN

Dijalankan otomatis oleh `KknRequirementService` + `EligibilityService` (Hybrid Dynamic System):

### Sumber Validasi (Dual-Read Strategy)
- **Dynamic (JSON Config):** Jika `jenis_kkn.requirements_config` terisi, validasi otomatis menggunakan aturan JSON.
- **Legacy (Hardcoded):** Jika JSON kosong, fallback ke kolom-kolom legacy (`min_sks`, `min_gpa`, `require_bta_ppi`).

### Tipe Validasi
1. **Database Check (Auto):** SKS ≥ min_sks, IPK ≥ min_gpa, BTA PPI = LULUS, UKT Lunas → validasi otomatis dari DB.
2. **File Upload (Manual):** Surat sehat, izin orang tua, sertifikat prestasi → upload + verifikasi admin.
3. **Biodata:** NIK (16 digit), nama ibu, tempat/tanggal lahir, gender, ukuran kaos, no WA.
4. **Domisili (GPS Self-Tagging):** Untuk KKN Mandiri, mahasiswa wajib daftarkan koordinat GPS domisili via `/mahasiswa/domisili`.
5. **Khusus (opsional):** Belum menikah, prodi tertentu, wilayah tertentu, persyaratan kustom (JSON).

### Admin Builder
Admin LPPM dapat mengkonfigurasi syarat per Jenis KKN melalui UI Builder di `/admin/jenis-kkn` tanpa coding.

Hasil: **LAYAK** → tombol daftar aktif | **TIDAK LAYAK** → daftar syarat yang belum terpenuhi.

---

# STEP 6: SISTEM PENILAIAN

| Komponen | Contoh Bobot |
|----------|:---:|
| Kehadiran | 20% |
| Logbook | 15% |
| Program Kerja | 15% |
| Laporan Akhir | 10% |
| Evaluasi DPL | 30% |
| Evaluasi Desa | 10% |

| Grade | Range | Keterangan |
|:---:|:---:|---|
| A | 85-100 | Sangat Baik |
| B+ | 80-84 | Baik Sekali |
| B | 75-79 | Baik |
| C+ | 70-74 | Cukup Baik |
| C | 65-69 | Cukup |
| D | 55-64 | Kurang |
| E | <55 | Tidak Lulus |

---

# STEP 7: ABSENSI GPS (GEOFENCING DINAMIS)

```
Mobile: Klik Check-In → Ambil GPS → Kirim {lat, lng, photo}
Backend: Baca attendance_config dari JenisKkn
         Mode Posko:   Haversine(GPS, posko) ≤ radius → DITERIMA
         Mode Domisili: Haversine(GPS, domisili_mahasiswa) ≤ radius → DITERIMA
         Mode Bypass:  Tanpa geofencing (KKN Daring/Internasional)
```

### Konfigurasi Per Jenis KKN (`jenis_kkn.attendance_config`)
| Key | Type | Default | Keterangan |
|-----|------|---------|------------|
| `geofence_enabled` | bool | true | Aktifkan validasi lokasi |
| `radius_meters` | int | 100 | Radius toleransi (meter) |
| `location_source` | string | 'posko' | `posko` atau `domisili` |
| `require_photo` | bool | true | Wajib foto saat absensi |
| `allow_offline_sync` | bool | false | Izinkan sync offline |

### Parameter Legacy (Fallback)
| Parameter | Kolom | Default |
|-----------|-------|---------|
| Posko | `posko_kelompok.latitude/longitude` | — |
| Radius | `posko_kelompok.radius_meters` | 100m |
| Check-in | `system_settings` | 07:00-09:00 |
| Check-out | `system_settings` | 16:00-18:00 |

---

# STEP 8: DATABASE (TABEL UTAMA)

### Core
`users` (username, password, is_active, phone, address, domicile_*) → hasOne mahasiswa/dosen
`mahasiswa` (nim, nama, fakultas_id, prodi_id, gpa, sks_completed, gender, nik, is_bta_ppi_passed)
`dosen` (nip, nama, fakultas_id, jabatan)
`fakultas` (code, nama) → hasMany prodi
`prodi` (fakultas_id, code, nama)

### Periode & Config
`tahun_akademik`, `periode`, `jenis_kkn` (min_sks, min_gpa, require_bta_ppi, custom_requirements JSON, required_documents JSON), `system_settings`, `konfigurasi_penilaian`, `konfigurasi_sertifikat`

### Registrasi & Kelompok
`peserta_kkn` (mahasiswa_id, periode_id, kelompok_id, status: pending/approved/rejected)
`kelompok_kkn` (periode_id, location_id, dpl_id, code, capacity)
`lokasi` (village_name, latitude, longitude, geofence_radius)
`posko_kelompok` (latitude, longitude, radius_meters)
`dokumen_peserta_kkn`, `registration_histories`

### Aktivitas
`kegiatan_kkn` (logbook), `program_kerja`, `laporan_akhir`
`attendances` (check_in_lat/lng, check_out_lat/lng, distance_meters, status)
`izin_meninggalkan`, `monitoring_dpl`

### Penilaian
`evaluasi`, `item_evaluasi`, `evaluasi_dpl_peserta`, `nilai_kkn` (total, grade), `sertifikat_kkn`

### Utilitas
`announcements`, `downloads`, `log_audit`, `sync_logs`, `ai_chat_histories`, `api_keys`

### Laravel Internal
`roles` (6), `permissions` (22), `model_has_roles`, `personal_access_tokens`, `sessions`, `jobs`, `failed_jobs`

### Relasi
```
users ─┬─ mahasiswa ── peserta_kkn ── kelompok_kkn ── lokasi
       └─ dosen ── dpl_periode
fakultas ── prodi ── mahasiswa
periode ── kelompok_kkn ── {kegiatan_kkn, program_kerja, posko_kelompok}
```

---

# STEP 9: REST API

| Method | Endpoint | Auth |
|--------|----------|------|
| POST | `/api/login` | No |
| POST | `/api/logout` | Bearer |
| GET | `/api/user` | Bearer |
| GET/PUT | `/api/mahasiswa/{id}` | Bearer |
| GET | `/api/mahasiswa/{id}/eligibility` | Bearer |
| GET | `/api/periodes` | Bearer |
| POST | `/api/registrasi` | Bearer+Student |
| POST | `/api/attendance/check-in` | Bearer+Student (GPS) |
| POST | `/api/attendance/check-out` | Bearer+Student (GPS) |
| GET/POST | `/api/kegiatan` | Bearer |
| GET | `/api/kelompok/{id}` | Bearer |
| POST | `/api/nilai/{id}` | Bearer+DPL |
| POST | `/api/external/sync/mahasiswa` | API Key |

Response: `{ success: bool, data: ..., message: string, errors?: {}, meta?: { current_page, total } }`

---

# STEP 10: KEAMANAN

| Layer | Detail |
|-------|--------|
| Auth | Sanctum + Session + CAPTCHA matematika (TTL 10 menit) |
| Authorization | Spatie: 6 roles, 22 permissions, policies per resource |
| Login | Maks 3 percobaan, lockout + cooldown |
| CSRF | Token verification otomatis |
| CORS | Whitelist di `.env` (+ `capacitor://localhost`) |
| Password | Min 8 char, mixed case, angka, simbol, wajib ganti default |
| Validation | 30+ FormRequest classes |
| Audit | `log_audit`: siapa, kapan, apa yang berubah |
| Encryption | bcrypt 12 rounds |

---

# STEP 11: WEB vs MOBILE

| Fitur | Web | Mobile |
|-------|:---:|:---:|
| Login & Dashboard | ✅ | ✅ |
| Pendaftaran KKN | ✅ | ✅ |
| Absensi GPS | ❌ | ✅ |
| Foto Kamera | ❌ | ✅ |
| Push Notification | ❌ | ✅ |
| Plotting (Admin) | ✅ | ❌ |
| Export PDF/Excel | ✅ | ❌ |
| Cetak Sertifikat | ✅ | ❌ |

---

# STEP 12: SETUP DEVELOPMENT

### Prasyarat
PHP 8.4, Composer 2.x, Node.js 20+, PostgreSQL 15+, Git 2.x

### Install
```bash
git clone git@github.com:putrihati-cmd/kknuinsaizu.git && cd kknuinsaizu
composer install && npm install
cp .env.example .env && php artisan key:generate
# Edit .env → DB_DATABASE=kkn, DB_USERNAME=kknuinsaizu, DB_PASSWORD=kknuinsaizu2026
php artisan migrate
php artisan db:seed --class=RoleSeeder
php artisan db:seed --class=PermissionSeeder
php artisan db:seed --class=AdminUserSeeder
# Opsional: php artisan db:seed --class=StudentCsvSeeder
npm run dev          # Terminal 1
php artisan serve    # Terminal 2
```

### Login: `admin` / `SuperAdmin@2026`

### Mobile Dev
```bash
npm run build && npx cap add android && npx cap sync && npx cap open android
```

### Build Produksi
```bash
npm run build
composer install --optimize-autoloader --no-dev
php artisan config:cache && php artisan route:cache && php artisan view:cache
```

### Konvensi
- Commit: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`
- File: PascalCase (PHP/React), snake_case (DB/migration)
- **Import CASE SENSITIVE** (FreeBSD production)
- Audit: `node scripts/dev/check-case-sensitivity.mjs`

### Troubleshooting
- Cache path error → `mkdir -p storage/framework/{sessions,views,cache}`
- DB auth failed → cek `.env` DB_USERNAME/PASSWORD
- Login gagal → `php artisan tinker` → set `is_active = true`
- CSRF 419 → `php artisan config:clear && cache:clear`
- Error 500 produksi → cek case-sensitivity import

---

# STEP 13: STATUS & STATE MACHINE

**Pendaftaran:** `pending → approved` atau `pending → rejected`
**Kegiatan:** `submitted → reviewed` atau `submitted → revised → submitted`
**Izin:** `pending → approved` atau `pending → rejected`
**Absensi:** `present` | `late` | `absent` | `dispensation`

---

# STEP 14: INTEGRASI EKSTERNAL

| Integrasi | Pattern | Status |
|-----------|---------|--------|
| SIAKAD Master API | Circuit Breaker (5 failures, 300s timeout) | Perlu API key |
| Google Gemini AI | Direct API | Perlu GEMINI_API_KEY |
| Capacitor Native | JS Bridge (GPS, Camera, Push) | Terintegrasi |

---

# STEP 15: KRITIK & SARAN

## Kritik Utama
1. **Cache/Queue pakai Database** → bottleneck saat ratusan mahasiswa submit bersamaan
2. **Offline mobile belum jelas** → absensi/logbook harus tetap jalan di desa tanpa sinyal
3. ~~**Algoritma plotting tidak terdokumentasi**~~ → ✅ PlacementService terdokumentasi + self_determined mode
4. ~~**Validasi kelayakan all-or-nothing**~~ → ✅ Dynamic requirements + dual-read + per-item feedback
5. ~~**SIAKAD single point of failure**~~ → ✅ `CircuitBreakerService` graceful degradation mode
6. ~~**AI Gemini tanpa rubrik**~~ → ✅ Rubrik standar (`06-AI-LOGBOOK-RUBRIC.md`)
7. ~~**Penilaian DPL 30% manual**~~ → ✅ `DplScoreCalibrationService` Z-score outlier detection
8. ~~**Tidak ada backup/disaster recovery**~~ → ✅ `db:backup` command + pg_dump + 7-day retention + daily schedule
9. ~~**80 case-sensitivity bugs**~~ → ✅ Fixed + GitHub Actions CI check
10. ~~**AI chat tanpa kebijakan privasi**~~ → ✅ Kebijakan privasi (`05-AI-PRIVACY-POLICY.md`)

## Saran Prioritas

### Kritis (Pre-Launch)
- ~~Enforce password change middleware~~ → ✅ `EnsurePasswordChanged` middleware (password_changed_at + must_change_password)
- ~~Validasi total bobot penilaian = 100%~~ → ✅ `KonfigurasiPenilaianController::update()` line 87-93
- ~~Pasang Husky + lint-staged + ESLint~~ → ✅ Husky pre-commit + lint-staged (ESLint + PHP lint)
- ~~Backup PostgreSQL otomatis (pg_dump harian)~~ → ✅ `db:backup` + daily schedule 02:00 WIB + 7-day retention
- Migrasi Redis untuk cache & queue

### Tinggi (Post-Launch Minggu 1-4)
- Offline queue mobile (Capacitor Storage/SQLite)
- Sentry/Flare error tracking
- Progress bar validasi kelayakan
- ~~Kalibrasi nilai antar DPL~~ → ✅ `DplScoreCalibrationService` + admin API endpoint
- ~~Rubrik standar AI logbook~~ → ✅ Terdefinisi di `06-AI-LOGBOOK-RUBRIC.md`

### Sedang (Bulan 2-3)
- Dokumentasi & unit test PlottingService
- Migration squashing
- Partisi tabel log_audit
- ~~Strategy Pattern untuk validasi~~ → ✅ Dynamic Requirements hybrid system
- CI/CD mobile (Fastlane)
- ~~Mode degradasi saat SIAKAD down~~ → ✅ `CircuitBreakerService` isDegraded() + UI notices

### Rendah (Roadmap)
- ~~Notifikasi deadline proaktif (H-3, H-1)~~ → ✅ `kkn:send-deadline-reminders` + daily schedule 08:00 WIB
- Load testing (k6/Locust)
- ~~Kebijakan privasi data AI~~ → ✅ Terdokumentasi di `05-AI-PRIVACY-POLICY.md`
- Sequence diagram untuk developer baru
- ~~Docker Compose untuk local dev~~ → ✅ `docker-compose.yml` (PostgreSQL 15 + Redis 7)

---

# STEP 16: CHANGELOG

### 2026-04-28
- **Dynamic KKN Requirements (Hybrid System)**: Admin Builder UI + JSON config + dual-read services
- **Dynamic Geofencing**: Per-jenis KKN attendance config (posko/domisili/bypass)
- **KKN Mandiri (Solo-Group)**: PlacementService self_determined + GPS self-tagging domisili
- **6 Bug Fixes**: Namespace import, method missing, key mismatch, dual-read, placement skip, frontend missing
- **Halaman Domisili Mahasiswa**: Student/Domisili/Edit.tsx + DomisiliController + API routes
- **EnsurePasswordChanged middleware**: Diperkuat dengan cek `password_changed_at` + admin exemption
- **Husky + lint-staged**: Pre-commit hook (ESLint + PHP lint on staged files)
- **Database Backup**: `db:backup` command dengan pg_dump + gzip + 7-day retention + scheduled 02:00 WIB
- **Deadline Reminders**: `kkn:send-deadline-reminders` command (H-3, H-1, hari terakhir) + scheduled 08:00 WIB
- **DPL Score Calibration**: `DplScoreCalibrationService` Z-score outlier detection + admin API endpoint
- **CircuitBreaker Degradation Mode**: `isDegraded()` + dashboard notices saat SIAKAD down
- **Docker Compose**: Setup lokal PostgreSQL 15 & Redis 7
- **AI Docs**: `05-AI-PRIVACY-POLICY.md` dan `06-AI-LOGBOOK-RUBRIC.md`
- Cleanup: hapus docs diskusi/changes/flows yang sudah terimplementasi

### 2026-04-27
- Reorganisasi dokumentasi, cleanup repository
- Modal konfirmasi premium (Headless UI + Framer Motion)
- Import mahasiswa dari CSV, fix akun superadmin

### 2026-04-24
- Dukungan iOS (Capacitor), fix 80 case-sensitivity bugs
- GitHub Actions: case-sensitivity check

### 2026-04: Absensi GPS, evaluasi DPL, sertifikat, AI chat
### 2026-03: Pendaftaran KKN, kelompok, logbook, penilaian
### 2026-02: Laravel + React + Inertia, Spatie Permission, admin dashboard
### 2026-01: Project init, database design, auth system

---

# STATISTIK

| Komponen | Jumlah |
|----------|--------|
| Migrations | 141 |
| Models | 51 |
| Controllers | 60+ |
| Inertia Pages | 80+ |
| Routes | 200+ |
| React Components | 100+ |
| Database Tables | 75+ |
| Seeders | 24 |
