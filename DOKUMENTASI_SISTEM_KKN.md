# 📚 DOKUMENTASI LENGKAP SISTEM MANAJEMEN KKN
## UIN Prof. K.H. Saifuddin Zuhri Purwokerto
### Laravel 12 + Inertia.js v2 + React/TypeScript + PostgreSQL

---

> **Versi Dokumen:** 1.0.0  
> **Terakhir Diperbarui:** 2025  
> **Status:** Siap Implementasi  
> **Target:** AI Agent (GitHub Copilot / Cursor / Continue.dev)

---

## 📋 DAFTAR ISI

1. [Gambaran Umum Sistem](#1-gambaran-umum-sistem)
2. [Stack Teknologi](#2-stack-teknologi)
3. [Arsitektur Sistem](#3-arsitektur-sistem)
4. [Struktur Database](#4-struktur-database)
5. [Struktur Direktori](#5-struktur-direktori)
6. [Modul & Fitur](#6-modul--fitur)
7. [Sistem Peran & Izin](#7-sistem-peran--izin)
8. [Alur Bisnis Per Modul](#8-alur-bisnis-per-modul)
9. [Konvensi Kode](#9-konvensi-kode)
10. [Konfigurasi Environment](#10-konfigurasi-environment)
11. [Panduan Implementasi Bertahap](#11-panduan-implementasi-bertahap)
12. [API & Route Reference](#12-api--route-reference)
13. [Aturan Validasi](#13-aturan-validasi)
14. [Sistem Notifikasi](#14-sistem-notifikasi)
15. [Panduan Testing](#15-panduan-testing)
16. [Checklist Deployment](#16-checklist-deployment)

---

## 1. GAMBARAN UMUM SISTEM

### 1.1 Deskripsi

Sistem Manajemen KKN adalah platform digital resmi LPPM UIN Prof. K.H. Saifuddin Zuhri Purwokerto untuk mengelola seluruh proses Kuliah Kerja Nyata (KKN) Angkatan ke-56 Tahun 2025, mulai dari pendaftaran mahasiswa, penugasan DPL, monitoring logbook harian, pengumpulan tugas kelompok, penilaian tiga pihak, hingga yudisium akhir.

### 1.2 Tujuan Sistem

- Mendigitalisasi seluruh proses administrasi KKN
- Memastikan transparansi penilaian dari tiga sumber (Kepala Desa, DPL, LPPM)
- Mempermudah monitoring DPL terhadap mahasiswa bimbingan
- Mengotomatisasi perhitungan nilai akhir dan status kelulusan
- Menyediakan audit trail lengkap untuk akuntabilitas

### 1.3 Jenis KKN yang Didukung

| Kode | Nama | Durasi | Lokasi |
|------|------|--------|--------|
| `reguler` | KKN Reguler | 40 hari | 5 Kabupaten Penginyongan |
| `nusantara` | KKN Nusantara | 40 hari | Kulonprogo DIY |
| `internasional` | KKN Internasional Mandiri | ~1 bulan | Malaysia & Thailand |
| `kolaborasi` | KKN Kolaborasi PTKIN | Variatif | PTKIN Mitra |
| `tematik` | KKN Tematik | Variatif | Sesuai proposal dosen |

### 1.4 Periode KKN Angkatan ke-56

- **Tanggal Mulai:** 12 Juli 2025
- **Tanggal Selesai:** 20 Agustus 2025
- **Durasi:** 40 hari live in

---

## 2. STACK TEKNOLOGI

### 2.1 Backend

```
PHP          : 8.4
Laravel      : 12.x
Inertia.js   : v2 (server-side adapter)
Database     : PostgreSQL 15+
Cache        : Redis (production) / Database (development)
Queue        : Database / Redis
Session      : Database
```

### 2.2 Frontend

```
React        : 18.x
TypeScript   : 5.x
Inertia.js   : v2 (React adapter)
Tailwind CSS : 3.x
Vite         : 5.x
Lucide Icons : latest
```

### 2.3 Package Laravel Utama

```
spatie/laravel-permission      : Manajemen peran & izin
maatwebsite/excel              : Export Excel
barryvdh/laravel-dompdf        : Export PDF
laravel/telescope              : Debugging (dev only)
barryvdh/laravel-debugbar      : Debugbar (dev only)
```

### 2.4 Konfigurasi Database

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=kkn
DB_USERNAME=postgres
DB_PASSWORD=your_password

# Test Database (WAJIB TERPISAH)
DB_TEST_DATABASE=kkn_test
```

---

## 3. ARSITEKTUR SISTEM

### 3.1 Pola Arsitektur

```
HTTP Request
    ↓
Middleware (Auth, RBAC, Throttle, CSRF)
    ↓
Form Request (Validasi Input)
    ↓
Controller (Thin - hanya routing logic)
    ↓
Service Layer (Business Logic)
    ↓
Repository / Model (Data Access)
    ↓
Observer (Audit Log Otomatis)
    ↓
Response (Inertia::render / JSON)
```

### 3.2 Prinsip Desain

- **Thin Controller** — Controller tidak boleh mengandung logika bisnis
- **Fat Service** — Semua aturan bisnis ada di Service Layer
- **Policy-First** — Setiap aksi dikontrol melalui Laravel Policy
- **Scoped Query** — DPL hanya bisa query data kelompoknya sendiri
- **Immutable After Finalize** — Nilai yang sudah difinalisasi tidak bisa diubah tanpa superadmin

### 3.3 Hierarki Akses Data

```
LPPM/Superadmin
    └── Semua data semua periode

Admin Fakultas
    └── Semua data fakultasnya

DPL
    └── Hanya data kelompok yang ditugaskan kepadanya
        └── Mahasiswa A, B, C, D, E (bimbingannya saja)

Koordinator Kecamatan
    └── Data ringkasan semua kordes di kecamatannya
    └── TIDAK bisa menilai

Ketua Kelompok / Kordes
    └── Data kelompoknya sendiri
    └── Bisa input data kelompok

Mahasiswa
    └── Hanya data miliknya sendiri
```

---

## 4. STRUKTUR DATABASE

### 4.1 Tabel Inti

#### `users`
```
id                  : bigint PK
name                : string
email               : string UNIQUE
password            : string (hashed)
nim                 : string NULLABLE (khusus mahasiswa)
nip                 : string NULLABLE (khusus dosen/staff)
fakultas_id         : FK NULLABLE
prodi_id            : FK NULLABLE
no_hp               : string NULLABLE
foto                : string NULLABLE
is_active           : boolean DEFAULT true
email_verified_at   : timestamp NULLABLE
remember_token      : string NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

#### `periode_kkn`
```
id                  : bigint PK
tahun_akademik_id   : FK
nama                : string  (contoh: "KKN Reguler 2025/2026 Gel. I")
jenis               : enum [reguler, nusantara, internasional, kolaborasi, tematik]
tanggal_mulai       : date
tanggal_selesai     : date
tanggal_buka_daftar : date
tanggal_tutup_daftar: date
kuota_total         : integer
kuota_terisi        : integer DEFAULT 0
status              : enum [draft, aktif, berjalan, selesai, arsip]
bobot_kades         : decimal(5,2)  -- bobot nilai Kepala Desa
bobot_dpl           : decimal(5,2)  -- bobot nilai DPL
bobot_lppm          : decimal(5,2)  -- bobot nilai LPPM
min_hari_tanpa_izin : integer DEFAULT 3  -- batas sanksi
frekuensi_monitoring: integer DEFAULT 3  -- minimal kunjungan DPL
nilai_lulus_minimum : string DEFAULT 'C'
is_demo             : boolean DEFAULT false  -- flag data demo/uji coba
metadata            : jsonb NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

#### `pendaftaran`
```
id                  : bigint PK
mahasiswa_id        : FK -> users
periode_id          : FK -> periode_kkn
kelompok_id         : FK NULLABLE -> kelompok
lokasi_id           : FK NULLABLE -> lokasi
status              : enum [menunggu_verifikasi, diverifikasi, ditolak, aktif, selesai, gugur]
waktu_daftar        : timestamp
alasan_penolakan    : text NULLABLE
catatan_admin       : text NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

#### `kelompok`
```
id                  : bigint PK
periode_id          : FK
dpl_id              : FK -> users
lokasi_id           : FK -> lokasi
nama                : string  (contoh: "Kelompok 12")
kode                : string UNIQUE
koordinator_desa_id : FK NULLABLE -> users (mahasiswa)
korcam_id           : FK NULLABLE -> users (mahasiswa)
status              : enum [aktif, selesai]
created_at          : timestamp
updated_at          : timestamp
```

#### `lokasi`
```
id                  : bigint PK
periode_id          : FK
nama_desa           : string
kecamatan           : string
kabupaten           : string
provinsi            : string
latitude            : decimal(10,8) NULLABLE
longitude           : decimal(11,8) NULLABLE
nama_kepala_desa    : string NULLABLE
kontak_kepala_desa  : string NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

#### `logbook`
```
id                  : bigint PK
mahasiswa_id        : FK -> users
kelompok_id         : FK -> kelompok
tanggal             : date
kegiatan            : text  (minimal 100 karakter)
hasil               : text NULLABLE
kendala             : text NULLABLE
rencana_besok       : text NULLABLE
status              : enum [draft, terkirim, diperiksa]
diperiksa_oleh      : FK NULLABLE -> users (DPL)
diperiksa_pada      : timestamp NULLABLE
catatan_dpl         : text NULLABLE
is_terlambat        : boolean DEFAULT false
created_at          : timestamp
updated_at          : timestamp

UNIQUE: (mahasiswa_id, tanggal)
```

#### `izin_meninggalkan`
```
id                  : bigint PK
mahasiswa_id        : FK -> users
kelompok_id         : FK -> kelompok
tanggal_mulai       : date
tanggal_kembali     : date
durasi_hari         : integer  (computed)
alasan              : text
status              : enum [menunggu, disetujui, ditolak, selesai]
diproses_oleh       : FK NULLABLE -> users (DPL)
diproses_pada       : timestamp NULLABLE
catatan_dpl         : text NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

#### `absensi_harian`
```
id                  : bigint PK
mahasiswa_id        : FK -> users
kelompok_id         : FK -> kelompok
tanggal             : date
status              : enum [hadir, izin, tanpa_keterangan]
izin_id             : FK NULLABLE -> izin_meninggalkan
created_at          : timestamp
updated_at          : timestamp

UNIQUE: (mahasiswa_id, tanggal)
```

### 4.2 Tabel Penilaian

#### `penilaian`
```
id                      : bigint PK
mahasiswa_id            : FK -> users
kelompok_id             : FK -> kelompok
periode_id              : FK -> periode_kkn
penilai_id              : FK -> users
sumber                  : enum [kepala_desa, dpl, lppm]

-- Komponen Nilai Kepala Desa
interaksi_sosial        : decimal(5,2) NULLABLE
kedisiplinan_etika      : decimal(5,2) NULLABLE
kinerja_kelompok        : decimal(5,2) NULLABLE
pelaksanaan_program     : decimal(5,2) NULLABLE

-- Komponen Nilai DPL
relevansi_program       : decimal(5,2) NULLABLE
artikel_ilmiah          : decimal(5,2) NULLABLE
laporan_akhir_dpl       : decimal(5,2) NULLABLE

-- Komponen Nilai LPPM
kelengkapan_logbook     : decimal(5,2) NULLABLE
ketepatan_waktu         : decimal(5,2) NULLABLE
video_dokumentasi       : decimal(5,2) NULLABLE
hasil_kerja_nyata       : decimal(5,2) NULLABLE

skor_total              : decimal(5,2) NULLABLE  (dihitung otomatis)
status                  : enum [draft, terkirim, difinalisasi]
catatan                 : text NULLABLE
finalisasi_pada         : timestamp NULLABLE
created_at              : timestamp
updated_at              : timestamp

UNIQUE: (mahasiswa_id, periode_id, sumber)
```

#### `nilai_akhir`
```
id                  : bigint PK
mahasiswa_id        : FK -> users
periode_id          : FK -> periode_kkn
skor_kades          : decimal(5,2) NULLABLE
skor_dpl            : decimal(5,2) NULLABLE
skor_lppm           : decimal(5,2) NULLABLE
skor_akhir          : decimal(5,2) NULLABLE  (weighted average)
nilai_huruf         : string NULLABLE  (A, A-, B+, B, dst)
nilai_indeks        : decimal(3,2) NULLABLE  (4.0, 3.6, dst)
status_lulus        : enum [lulus, tidak_lulus, pending]
pengurangan_poin    : decimal(5,2) DEFAULT 0  (keterlambatan)
alasan_pengurangan  : text NULLABLE
yudisium_pada       : timestamp NULLABLE
created_at          : timestamp
updated_at          : timestamp

UNIQUE: (mahasiswa_id, periode_id)
```

### 4.3 Tabel Tugas Kelompok

#### `tugas_kelompok`
```
id                  : bigint PK
kelompok_id         : FK -> kelompok
periode_id          : FK -> periode_kkn
jenis               : enum [poster, video, berita, artikel_ilmiah, laporan_akhir]
judul               : string NULLABLE
deskripsi           : text NULLABLE
file_path           : string NULLABLE  (untuk upload file)
link_eksternal      : string NULLABLE  (untuk Google Drive)
status              : enum [belum_dikumpul, draft, dikumpul, direvisi, disetujui_dpl, disetujui_lppm]
disetujui_dpl_pada  : timestamp NULLABLE
disetujui_lppm_pada : timestamp NULLABLE
catatan_reviewer    : text NULLABLE
terlambat           : boolean DEFAULT false
menit_terlambat     : integer DEFAULT 0
created_at          : timestamp
updated_at          : timestamp
```

#### `artikel_ilmiah`
```
id                  : bigint PK
tugas_id            : FK -> tugas_kelompok
kelompok_id         : FK -> kelompok
judul               : string
abstrak             : text
file_path           : string
status_seleksi      : enum [menunggu, lolos_prosiding, wajib_jurnal_eksternal]
jurnal_tujuan       : string NULLABLE  (jika wajib submit eksternal)
link_submit         : string NULLABLE
catatan_lppm        : text NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

### 4.4 Tabel Monitoring DPL

#### `monitoring_dpl`
```
id                  : bigint PK
dpl_id              : FK -> users
kelompok_id         : FK -> kelompok
periode_id          : FK -> periode_kkn
tanggal_kunjungan   : date
permasalahan        : text
solusi              : text
catatan_tambahan    : text NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

### 4.5 Tabel Konfigurasi

#### `konfigurasi_sistem`
```
id                  : bigint PK
periode_id          : FK NULLABLE -> periode_kkn  (null = global)
kunci               : string UNIQUE
nilai               : text
keterangan          : string NULLABLE
created_at          : timestamp
updated_at          : timestamp
```

#### `audit_logs`
```
id                  : bigint PK
user_id             : FK -> users NULLABLE
user_name           : string  (snapshot nama saat aksi)
user_ip             : string
aksi                : string  (created, updated, deleted, login, logout, finalized)
model_type          : string
model_id            : bigint NULLABLE
data_lama           : jsonb NULLABLE
data_baru           : jsonb NULLABLE
keterangan          : text NULLABLE
created_at          : timestamp

INDEX: (user_id, created_at)
INDEX: (model_type, model_id, created_at)
PARTISI: per bulan (untuk performa)
```

### 4.6 Konversi Nilai (Sesuai Panduan Resmi)

```
Skor 86-100  → Nilai A   → Indeks 4.0
Skor 81-85   → Nilai A-  → Indeks 3.6
Skor 76-80   → Nilai B+  → Indeks 3.3
Skor 71-75   → Nilai B   → Indeks 3.0
Skor 66-70   → Nilai B-  → Indeks 2.6
Skor 61-65   → Nilai C+  → Indeks 2.3
Skor 56-60   → Nilai C   → Indeks 2.0
Skor 42-55   → Nilai D   → Indeks 1.0
Skor 0-40    → Nilai E   → Indeks 0.0

LULUS MINIMUM: Nilai C (Skor >= 56)
```

---

## 5. STRUKTUR DIREKTORI

### 5.1 Backend (Laravel)

```
app/
├── Console/
│   └── Commands/
│       ├── CekAbsensiHarian.php      -- Jalankan setiap malam via Scheduler
│       ├── PruningAuditLog.php       -- Hapus audit log > 6 bulan
│       └── NotifikasiLogbookKosong.php
│
├── Exceptions/
│   ├── PeriodeSudahTutupException.php
│   ├── KuotaPenuhException.php
│   ├── SudahTerdaftarException.php
│   ├── NilaiSudahDifinalisasiException.php
│   └── TidakMemilikiAksesException.php
│
├── Http/
│   ├── Controllers/
│   │   ├── Auth/
│   │   │   └── AuthenticatedSessionController.php
│   │   ├── Admin/
│   │   │   ├── DashboardController.php
│   │   │   ├── PenggunaController.php
│   │   │   ├── PeriodeController.php
│   │   │   ├── FakultasController.php
│   │   │   ├── ProdiController.php
│   │   │   ├── LokasiController.php
│   │   │   ├── KelompokController.php
│   │   │   ├── PenugasanDplController.php
│   │   │   ├── PendaftaranController.php
│   │   │   ├── PenilaianController.php
│   │   │   ├── YudisiumController.php
│   │   │   ├── MonitoringController.php
│   │   │   ├── LaporanController.php
│   │   │   └── KonfigurasiController.php
│   │   ├── Dpl/
│   │   │   ├── DashboardController.php
│   │   │   ├── MahasiswaBimbinganController.php
│   │   │   ├── LogbookController.php
│   │   │   ├── IzinController.php
│   │   │   ├── PenilaianController.php
│   │   │   ├── TugasKelompokController.php
│   │   │   └── MonitoringController.php
│   │   └── Mahasiswa/
│   │       ├── DashboardController.php
│   │       ├── PendaftaranController.php
│   │       ├── LogbookController.php
│   │       ├── IzinController.php
│   │       ├── TugasKelompokController.php
│   │       └── NilaiController.php
│   │
│   ├── Middleware/
│   │   ├── EnsureUserIsActive.php
│   │   ├── RestrictDebugTools.php    -- Telescope & Debugbar hanya superadmin
│   │   ├── KknThrottle.php
│   │   └── DisableDebugbar.php
│   │
│   └── Requests/
│       ├── Auth/
│       │   └── LoginRequest.php
│       ├── Admin/
│       │   ├── StorePeriodeRequest.php
│       │   ├── StoreKelompokRequest.php
│       │   ├── StorePendaftaranRequest.php
│       │   └── StoreKonfigurasiRequest.php
│       ├── Dpl/
│       │   ├── StoreMonitoringRequest.php
│       │   └── StorePenilaianRequest.php
│       └── Mahasiswa/
│           ├── StoreLogbookRequest.php
│           ├── StoreIzinRequest.php
│           └── StoreTugasRequest.php
│
├── Models/
│   ├── User.php
│   ├── PeriodeKkn.php
│   ├── Pendaftaran.php
│   ├── Kelompok.php
│   ├── Lokasi.php
│   ├── Logbook.php
│   ├── IzinMeninggalkan.php
│   ├── AbsensiHarian.php
│   ├── Penilaian.php
│   ├── NilaiAkhir.php
│   ├── TugasKelompok.php
│   ├── ArtikelIlmiah.php
│   ├── MonitoringDpl.php
│   ├── KonfigurasiSistem.php
│   └── AuditLog.php
│
├── Observers/
│   ├── PendaftaranObserver.php
│   ├── LogbookObserver.php
│   ├── PenilaianObserver.php
│   └── NilaiAkhirObserver.php
│
├── Policies/
│   ├── LogbookPolicy.php
│   ├── IzinPolicy.php
│   ├── PenilaianPolicy.php
│   ├── TugasKelompokPolicy.php
│   └── MonitoringPolicy.php
│
├── Services/
│   ├── PendaftaranService.php        -- Logika daftar + race condition prevention
│   ├── LogbookService.php            -- Logika logbook harian
│   ├── IzinService.php               -- Logika perizinan + hitung absensi
│   ├── PenilaianService.php          -- Logika nilai + konversi huruf mutu
│   ├── NilaiAkhirService.php         -- Kalkulasi nilai akhir weighted
│   ├── YudisiumService.php           -- Logika kelulusan
│   ├── TugasKelompokService.php      -- Upload & validasi tugas
│   ├── MonitoringService.php         -- Monitoring DPL
│   ├── NotifikasiService.php         -- Kirim notifikasi in-app
│   └── ExportService.php             -- Export Excel & PDF
│
└── Jobs/
    ├── RecordAuditLog.php
    ├── KirimNotifikasiLogbook.php
    ├── KirimNotifikasiIzin.php
    └── HitungNilaiAkhir.php

database/
├── migrations/
│   ├── xxxx_create_users_table.php
│   ├── xxxx_create_tahun_akademik_table.php
│   ├── xxxx_create_periode_kkn_table.php
│   ├── xxxx_create_fakultas_table.php
│   ├── xxxx_create_prodi_table.php
│   ├── xxxx_create_lokasi_table.php
│   ├── xxxx_create_kelompok_table.php
│   ├── xxxx_create_pendaftaran_table.php
│   ├── xxxx_create_logbook_table.php
│   ├── xxxx_create_izin_meninggalkan_table.php
│   ├── xxxx_create_absensi_harian_table.php
│   ├── xxxx_create_penilaian_table.php
│   ├── xxxx_create_nilai_akhir_table.php
│   ├── xxxx_create_tugas_kelompok_table.php
│   ├── xxxx_create_artikel_ilmiah_table.php
│   ├── xxxx_create_monitoring_dpl_table.php
│   ├── xxxx_create_konfigurasi_sistem_table.php
│   ├── xxxx_create_audit_logs_table.php
│   └── xxxx_add_indexes_optimization.php
│
└── seeders/
    ├── DatabaseSeeder.php
    ├── RolePermissionSeeder.php
    ├── TahunAkademikSeeder.php
    ├── FakultasProdiSeeder.php
    └── DemoDataSeeder.php            -- HANYA untuk env demo, is_demo=true

routes/
├── web.php
├── auth.php
└── console.php
```

### 5.2 Frontend (React/TypeScript)

```
resources/js/
├── Components/
│   ├── Layout/
│   │   ├── AppLayout.tsx             -- Layout utama + ErrorBoundary
│   │   ├── Sidebar.tsx               -- Navigasi per peran
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   ├── UI/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Skeleton.tsx              -- Loading placeholder
│   │   ├── EmptyState.tsx
│   │   ├── Pagination.tsx
│   │   └── ConfirmDialog.tsx
│   ├── Forms/
│   │   ├── TextInput.tsx
│   │   ├── SelectInput.tsx
│   │   ├── TextareaInput.tsx
│   │   ├── FileUpload.tsx
│   │   ├── DatePicker.tsx
│   │   └── FormError.tsx
│   └── Shared/
│       ├── ErrorBoundary.tsx
│       ├── LoadingOverlay.tsx
│       └── StatusBadge.tsx
│
├── Pages/
│   ├── Auth/
│   │   └── Login.tsx
│   ├── Admin/
│   │   ├── Dashboard.tsx
│   │   ├── Pengguna/
│   │   │   ├── Index.tsx
│   │   │   ├── Create.tsx
│   │   │   └── Edit.tsx
│   │   ├── Periode/
│   │   │   ├── Index.tsx
│   │   │   ├── Create.tsx
│   │   │   └── Edit.tsx
│   │   ├── Kelompok/
│   │   │   ├── Index.tsx
│   │   │   └── Detail.tsx
│   │   ├── Pendaftaran/
│   │   │   ├── Index.tsx
│   │   │   └── Detail.tsx
│   │   ├── PenilaianKades/
│   │   │   └── Index.tsx
│   │   ├── RekapNilai/
│   │   │   ├── Index.tsx
│   │   │   └── Detail.tsx
│   │   ├── Yudisium/
│   │   │   └── Index.tsx
│   │   ├── Monitoring/
│   │   │   └── Index.tsx
│   │   └── Konfigurasi/
│   │       └── Index.tsx
│   ├── Dpl/
│   │   ├── Dashboard.tsx
│   │   ├── MahasiswaBimbingan/
│   │   │   ├── Index.tsx
│   │   │   └── Detail.tsx
│   │   ├── Logbook/
│   │   │   └── Index.tsx
│   │   ├── Izin/
│   │   │   └── Index.tsx
│   │   ├── Penilaian/
│   │   │   ├── Index.tsx
│   │   │   └── Form.tsx
│   │   ├── TugasKelompok/
│   │   │   └── Index.tsx
│   │   └── Monitoring/
│   │       ├── Index.tsx
│   │       └── Create.tsx
│   └── Mahasiswa/
│       ├── Dashboard.tsx
│       ├── Pendaftaran/
│       │   ├── Index.tsx
│       │   └── Form.tsx
│       ├── Logbook/
│       │   ├── Index.tsx
│       │   └── Form.tsx
│       ├── Izin/
│       │   ├── Index.tsx
│       │   └── Form.tsx
│       ├── TugasKelompok/
│       │   └── Index.tsx
│       └── Nilai/
│           └── Index.tsx
│
└── hooks/
    ├── useDashboardData.ts
    ├── usePermission.ts
    └── usePagination.ts
```

---

## 6. MODUL & FITUR

### 6.1 Modul Pendaftaran Mahasiswa

**Deskripsi:** Mahasiswa mendaftar ke periode KKN yang aktif. Sistem mencegah race condition saat kuota hampir penuh.

**Fitur:**
- Cek kelayakan otomatis (minimal 100 SKS, lulus BTA/PPI)
- Cek duplikasi pendaftaran
- Lock kuota dengan atomic operation (Cache Lock + DB Transaction + Pessimistic Locking)
- Notifikasi status pendaftaran ke mahasiswa
- Admin bisa verifikasi, tolak, atau transfer mahasiswa antar kelompok

**Status Pendaftaran:**
```
menunggu_verifikasi → diverifikasi → aktif → selesai
                    ↘ ditolak
                              ↘ gugur (3 hari tanpa izin)
```

### 6.2 Modul Logbook Harian

**Deskripsi:** Mahasiswa mengisi laporan kegiatan harian setiap hari selama KKN berlangsung.

**Aturan Bisnis (dari Panduan):**
- Logbook harus diisi setiap hari — bukan kegiatan pribadi
- Diisi online melalui sistem (Kampelmas)
- DPL wajib memeriksa logbook mahasiswa bimbingannya
- Logbook yang tidak diisi 2 hari berturut-turut → notifikasi otomatis ke DPL

**Status Logbook:**
```
[belum diisi] → draft → terkirim → diperiksa
```

**Validasi:**
- Tanggal harus hari ini (tidak boleh backdate kecuali ada mekanisme khusus)
- Konten minimal 100 karakter
- Hanya 1 logbook per mahasiswa per hari (UNIQUE constraint)
- Tidak bisa mengisi logbook di luar rentang tanggal periode

### 6.3 Modul Perizinan

**Deskripsi:** Mahasiswa mengajukan izin meninggalkan lokasi KKN, DPL menyetujui/menolak.

**Aturan Bisnis (dari Panduan):**
- Izin harus ditandatangani DPL (digital approval di sistem)
- Mahasiswa tanpa keterangan/izin DPL selama ≥ 3 hari → dianggap mengundurkan diri
- Sistem menghitung akumulasi hari tanpa izin secara otomatis

**Alur:**
```
Mahasiswa ajukan izin
    ↓ (notifikasi ke DPL)
DPL review
    ↓
Setuju → Sistem catat durasi izin → Update absensi harian
Tolak  → Notifikasi ke mahasiswa
    ↓
Jika tanpa keterangan ≥ 3 hari → Notifikasi ke LPPM
```

### 6.4 Modul Penilaian Tiga Pihak

**Deskripsi:** Nilai mahasiswa berasal dari tiga penilai dengan komponen berbeda.

**Penilai & Komponen:**

| Penilai | Komponen | Catatan |
|---------|----------|---------|
| Kepala Desa | Interaksi sosial, Kedisiplinan, Kinerja kelompok, Pelaksanaan program | Input via DPL sebagai perantara (default) |
| DPL | Relevansi program, Artikel ilmiah, Laporan akhir | Input langsung oleh DPL |
| LPPM | Kelengkapan logbook, Ketepatan waktu, Video dokumentasi, Hasil kerja nyata | Input oleh staf LPPM |

**Aturan Nilai:**
- Nilai dihitung dengan weighted average berdasarkan bobot yang disimpan di `periode_kkn`
- Setelah difinalisasi → TIDAK bisa diubah kecuali superadmin
- Konversi otomatis skor → huruf mutu → indeks (sesuai tabel panduan)
- Pengurangan poin otomatis untuk keterlambatan pengumpulan

### 6.5 Modul Tugas Kelompok

**Deskripsi:** Setiap kelompok mengumpulkan 4 jenis tugas selama dan setelah KKN.

**Jenis Tugas & Aturan:**

| Jenis | Format | Validasi | Deadline |
|-------|--------|----------|---------|
| Poster Peta Potensi | 3 file JPEG | MIME type wajib dicek | Minggu ke-2 |
| Video Kegiatan | Link Google Drive | URL valid | Akhir KKN |
| Berita Kegiatan | File .doc/.docx | Min 350 kata (perkiraan) | Per kegiatan unggulan |
| Artikel Ilmiah | Min 2 file .doc/.docx | 3000-5000 kata | Setelah KKN |
| Laporan Akhir | File .doc/.docx | Sesuai sistematika | Setelah KKN |

### 6.6 Modul Monitoring DPL

**Deskripsi:** DPL mencatat kunjungan monitoring ke lokasi KKN.

**Aturan:**
- Frekuensi minimal monitoring diatur di konfigurasi periode (default: 3 kali)
- DPL yang belum memenuhi frekuensi minimal mendapat peringatan dari sistem
- Data monitoring menjadi salah satu bahan evaluasi DPL oleh LPPM

### 6.7 Modul Yudisium

**Deskripsi:** LPPM menentukan kelulusan mahasiswa setelah semua nilai masuk.

**Alur Yudisium:**
```
Semua nilai dari 3 pihak masuk
    ↓
Sistem hitung nilai akhir otomatis
    ↓
LPPM review rekap semua mahasiswa
    ↓
Sidang Dewan Yudisium
    ↓
Nilai ≥ C → LULUS → Sertifikat
Nilai < C → TIDAK LULUS → Wajib KKN angkatan berikutnya
```

---

## 7. SISTEM PERAN & IZIN

### 7.1 Daftar Peran

```
superadmin          -- Akses penuh ke semua fitur dan data
admin-lppm          -- Manajemen periode, kelompok, yudisium
admin-fakultas      -- Monitoring data fakultasnya saja
dpl                 -- Bimbingan, penilaian, monitoring kelompoknya
koordinator-kecamatan -- Lihat ringkasan kecamatannya
ketua-kelompok      -- Input tugas kelompok, koordinasi
mahasiswa           -- Pendaftaran, logbook, izin, tugas individu
```

### 7.2 Matriks Izin

```
IZIN                            | superadmin | admin-lppm | dpl | mahasiswa
--------------------------------|-----------|------------|-----|----------
periode.kelola                  |     ✅    |     ✅     |  ❌  |    ❌
kelompok.kelola                 |     ✅    |     ✅     |  ❌  |    ❌
pendaftaran.verifikasi          |     ✅    |     ✅     |  ❌  |    ❌
pendaftaran.buat                |     ✅    |     ✅     |  ❌  |    ✅
logbook.isi                     |     ✅    |     ❌     |  ❌  |    ✅
logbook.periksa                 |     ✅    |     ✅     |  ✅  |    ❌
izin.ajukan                     |     ✅    |     ❌     |  ❌  |    ✅
izin.setujui                    |     ✅    |     ✅     |  ✅  |    ❌
penilaian.dpl                   |     ✅    |     ❌     |  ✅  |    ❌
penilaian.lppm                  |     ✅    |     ✅     |  ❌  |    ❌
penilaian.kades                 |     ✅    |     ✅     |  ✅  |    ❌
penilaian.finalisasi            |     ✅    |     ✅     |  ✅  |    ❌
nilai.lihat-sendiri             |     ✅    |     ✅     |  ✅  |    ✅
yudisium.kelola                 |     ✅    |     ✅     |  ❌  |    ❌
tugas.kumpul                    |     ✅    |     ❌     |  ❌  |    ✅
tugas.review                    |     ✅    |     ✅     |  ✅  |    ❌
monitoring.isi                  |     ✅    |     ❌     |  ✅  |    ❌
export.nilai                    |     ✅    |     ✅     |  ✅  |    ❌
konfigurasi.kelola              |     ✅    |     ❌     |  ❌  |    ❌
```

### 7.3 Scope Data (Scoped Access)

Selain izin, akses data dibatasi berdasarkan relasi:

```php
// DPL hanya bisa query kelompoknya sendiri
// Implementasi di Model atau Repository:

// Logbook
Logbook::whereHas('mahasiswa.kelompok', function($q) use ($dplId) {
    $q->where('dpl_id', $dplId);
});

// Mahasiswa bimbingan
Kelompok::where('dpl_id', $dplId)->with('mahasiswas');

// Admin Fakultas - hanya mahasiswa di fakultasnya
User::where('fakultas_id', $adminFakultasId)->role('mahasiswa');
```

---

## 8. ALUR BISNIS PER MODUL

### 8.1 Alur Pendaftaran (dengan Race Condition Prevention)

```
1. Mahasiswa buka halaman pendaftaran
2. Sistem cek periode aktif ada
3. Sistem cek mahasiswa belum pernah daftar di periode ini
4. Mahasiswa submit form pendaftaran
5. Controller panggil PendaftaranService::daftar()
6. Di dalam service:
   a. Ambil Cache Lock dengan key unik per mahasiswa+periode (TTL: 10 detik)
   b. Di dalam lock, buka DB Transaction
   c. SELECT ... FOR UPDATE pada baris periode (Pessimistic Lock)
   d. Cek deadline belum lewat
   e. Cek kuota belum penuh
   f. Cek duplikasi pendaftaran
   g. INCREMENT kuota_terisi
   h. INSERT pendaftaran baru
   i. Commit transaction
   j. Release lock
7. Kirim notifikasi ke mahasiswa (via queue)
8. Catat audit log (via queue)
```

### 8.2 Alur Penilaian Lengkap

```
1. DPL login ke sistem
2. Buka menu "Penilaian Mahasiswa Bimbingan"
3. Sistem tampilkan daftar mahasiswa kelompoknya
4. DPL pilih mahasiswa → isi komponen nilai DPL
5. DPL save sebagai draft terlebih dahulu
6. DPL review semua nilai → klik "Finalisasi"
7. Sistem konfirmasi: "Nilai yang sudah difinalisasi tidak bisa diubah"
8. DPL konfirmasi → sistem set status = difinalisasi
9. Sistem trigger: hitung nilai akhir (jika semua 3 sumber sudah difinalisasi)
10. Nilai akhir otomatis dikonversi ke huruf mutu dan indeks
11. Status mahasiswa update di dashboard LPPM
```

### 8.3 Alur Deteksi Absensi Tanpa Izin

```
[Setiap malam pukul 23:59 - Laravel Scheduler]
1. Ambil semua mahasiswa dengan status KKN aktif
2. Untuk setiap mahasiswa:
   a. Cek apakah ada logbook hari ini
   b. Cek apakah ada izin yang disetujui untuk hari ini
   c. Jika tidak ada keduanya → catat sebagai absensi "tanpa_keterangan"
3. Hitung akumulasi hari tanpa keterangan per mahasiswa
4. Jika akumulasi >= 3 hari → kirim notifikasi ke LPPM
5. LPPM memutuskan apakah mahasiswa dinyatakan mengundurkan diri
```

---

## 9. KONVENSI KODE

### 9.1 Penamaan (Bahasa Indonesia)

```
Route names    : admin.periode.index, mahasiswa.logbook.simpan
Controller     : PendaftaranController, LogbookController
Service        : PendaftaranService, NilaiAkhirService
Model          : PeriodeKkn, IzinMeninggalkan
Database       : snake_case Indonesia (periode_kkn, izin_meninggalkan)
Enum values    : snake_case Indonesia (menunggu_verifikasi, tanpa_keterangan)
Vue/React pages: Admin/Pendaftaran/Index.tsx
```

### 9.2 Struktur Controller (Thin)

```php
// ✅ BENAR - Controller tipis
class LogbookController extends Controller
{
    public function __construct(private LogbookService $service) {}

    public function simpan(StoreLogbookRequest $request): RedirectResponse
    {
        $this->authorize('isi', Logbook::class);
        $this->service->simpanLogbook(auth()->user(), $request->validated());
        return back()->with('sukses', 'Logbook berhasil disimpan.');
    }
}

// ❌ SALAH - Logika bisnis di controller
class LogbookController extends Controller
{
    public function simpan(Request $request)
    {
        // JANGAN taruh logika bisnis di sini
        $existing = Logbook::where('mahasiswa_id', auth()->id())
                           ->where('tanggal', today())->exists();
        if ($existing) { ... }
        // dst
    }
}
```

### 9.3 Struktur Service

```php
class LogbookService
{
    public function simpanLogbook(User $mahasiswa, array $data): Logbook
    {
        // 1. Validasi bisnis (bukan validasi input - itu di Form Request)
        $this->pastikanPeriodeAktif($mahasiswa);
        $this->pastikanBelumAdaLogbookHariIni($mahasiswa);
        $this->pastikanTanggalDalamRentangKKN($mahasiswa);

        // 2. Simpan data
        return DB::transaction(function () use ($mahasiswa, $data) {
            return Logbook::create([
                'mahasiswa_id' => $mahasiswa->id,
                'kelompok_id'  => $mahasiswa->kelompok_aktif->id,
                'tanggal'      => today(),
                'kegiatan'     => $data['kegiatan'],
                'hasil'        => $data['hasil'] ?? null,
                'kendala'      => $data['kendala'] ?? null,
                'rencana_besok'=> $data['rencana_besok'] ?? null,
                'status'       => 'terkirim',
            ]);
        });
    }
}
```

### 9.4 Struktur Policy

```php
class LogbookPolicy
{
    // Mahasiswa hanya bisa edit logbooknya sendiri
    public function perbarui(User $user, Logbook $logbook): bool
    {
        return $user->id === $logbook->mahasiswa_id
            && $logbook->status !== 'diperiksa';  // Tidak bisa edit yang sudah diperiksa DPL
    }

    // DPL hanya bisa periksa logbook mahasiswa bimbingannya
    public function periksa(User $user, Logbook $logbook): bool
    {
        return $user->hasRole('dpl')
            && $logbook->mahasiswa->kelompok->dpl_id === $user->id;
    }
}
```

### 9.5 Konvensi React/TypeScript

```typescript
// Interface props selalu didefinisikan
interface LogbookFormProps {
  logbook?: Logbook;
  isEdit?: boolean;
}

// Gunakan form dari Inertia - JANGAN gunakan form HTML native
const { data, setData, post, processing, errors } = useForm({
  kegiatan: logbook?.kegiatan ?? '',
  hasil: logbook?.hasil ?? '',
});

// Submit via Inertia post (bukan fetch/axios)
const submit = () => {
  post(route('mahasiswa.logbook.simpan'), {
    preserveScroll: true,
    onSuccess: () => reset(),
  });
};

// Button selalu disabled saat processing
<button disabled={processing} type="button" onClick={submit}>
  {processing ? 'Menyimpan...' : 'Simpan Logbook'}
</button>
```

---

## 10. KONFIGURASI ENVIRONMENT

### 10.1 File `.env` Production

```env
APP_NAME="Sistem KKN UIN SAIZU"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://kkn.uinsaizu.ac.id

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=kkn
DB_USERNAME=kkn_user
DB_PASSWORD=strong_password_here

# Session (WAJIB untuk production)
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.uinsaizu.ac.id

# Cache & Queue
CACHE_DRIVER=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Mail
MAIL_MAILER=smtp
MAIL_HOST=smtp.uinsaizu.ac.id
MAIL_PORT=587
MAIL_USERNAME=kkn@uinsaizu.ac.id
MAIL_FROM_ADDRESS=kkn@uinsaizu.ac.id
MAIL_FROM_NAME="Sistem KKN UIN SAIZU"

# Storage
FILESYSTEM_DISK=local
```

### 10.2 File `.env` Development

```env
APP_ENV=local
APP_DEBUG=true
APP_URL=http://localhost:8000

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5433
DB_DATABASE=kkn

# WAJIB BERBEDA dari DB runtime!
DB_TEST_CONNECTION=pgsql
DB_TEST_DATABASE=kkn_test

SESSION_DRIVER=database
SESSION_SECURE_COOKIE=false   # false di localhost (HTTP)
SESSION_DOMAIN=               # KOSONG di localhost
SESSION_SAME_SITE=lax

CACHE_DRIVER=database
QUEUE_CONNECTION=database

TELESCOPE_ENABLED=true
DEBUGBAR_ENABLED=true
```

---

## 11. PANDUAN IMPLEMENTASI BERTAHAP

### FASE 1 — Fondasi & Environment (Estimasi: 2-3 hari)

**Target:** Aplikasi bisa berjalan, login berfungsi, database terhubung benar

**Langkah:**
1. Setup project Laravel 12 baru atau clone existing
2. Konfigurasi `.env` sesuai panduan di atas
3. Jalankan: `php artisan config:clear && php artisan cache:clear`
4. Buat database `kkn` dan `kkn_test` di PostgreSQL
5. Jalankan migrasi tabel dasar (users, sessions, cache)
6. Install Spatie Permission dan jalankan migrasinya
7. Jalankan `RolePermissionSeeder` untuk membuat semua peran dan izin
8. Test login berhasil tanpa error 419

**Berhasil jika:**
- Login page load tanpa error
- Submit form login tidak error 419
- User dengan peran berbeda bisa login dan melihat dashboard yang sesuai

---

### FASE 2 — Master Data (Estimasi: 3-4 hari)

**Target:** CRUD Tahun Akademik, Periode, Fakultas, Prodi, Lokasi, Kelompok

**Urutan Implementasi:**
1. Migrasi dan Model untuk semua tabel master
2. CRUD Tahun Akademik (paling dasar, tidak ada dependency)
3. CRUD Periode KKN (bergantung Tahun Akademik)
4. CRUD Fakultas & Prodi
5. CRUD Lokasi (bergantung Periode)
6. CRUD Kelompok (bergantung Periode, Lokasi, DPL)
7. CRUD Pengguna (Mahasiswa, DPL, Admin)

**Aturan Penting:**
- Setiap controller wajib ada `$this->authorize()` sebelum aksi apapun
- Setiap form wajib ada Form Request dengan validasi lengkap
- Gunakan pagination `->paginate(20)->withQueryString()` — TIDAK boleh `->get()` tanpa limit

---

### FASE 3 — Pendaftaran Mahasiswa (Estimasi: 2-3 hari)

**Target:** Mahasiswa bisa mendaftar, admin bisa verifikasi

**Langkah:**
1. Buat migrasi tabel `pendaftaran`
2. Buat `PendaftaranService` dengan logika race condition prevention
3. Buat controller mahasiswa untuk submit pendaftaran
4. Buat controller admin untuk verifikasi/tolak pendaftaran
5. Buat halaman pendaftaran untuk mahasiswa
6. Buat halaman manajemen pendaftaran untuk admin
7. Test concurrent submission (simulasikan 2 request bersamaan)

**Kode Kritis di Service:**
- Cache::lock() untuk atomic operation
- DB::transaction() dengan lockForUpdate()
- Cek deadline, kuota, dan duplikasi di DALAM transaksi

---

### FASE 4 — Logbook & Absensi (Estimasi: 3-4 hari)

**Target:** Mahasiswa mengisi logbook, DPL memeriksa, absensi otomatis terhitung

**Langkah:**
1. Buat migrasi tabel `logbook` dan `absensi_harian` dan `izin_meninggalkan`
2. Buat `LogbookService` dengan semua validasi bisnis
3. Buat `IzinService` dengan alur approval DPL
4. Buat Scheduler untuk hitung absensi setiap malam
5. Buat halaman logbook mahasiswa (form + riwayat)
6. Buat halaman review logbook untuk DPL
7. Buat halaman manajemen izin

---

### FASE 5 — Tugas Kelompok (Estimasi: 3-4 hari)

**Target:** Kelompok bisa mengumpulkan semua jenis tugas, DPL bisa review

**Langkah:**
1. Buat migrasi tabel `tugas_kelompok` dan `artikel_ilmiah`
2. Buat `TugasKelompokService` dengan validasi MIME type
3. Konfigurasi storage disk untuk dokumen terenkripsi
4. Buat halaman pengumpulan tugas untuk mahasiswa
5. Buat halaman review tugas untuk DPL
6. Buat halaman seleksi artikel untuk LPPM

---

### FASE 6 — Penilaian & Yudisium (Estimasi: 4-5 hari)

**Target:** Tiga penilai bisa input nilai, sistem hitung otomatis, yudisium berjalan

**Langkah:**
1. Buat migrasi tabel `penilaian` dan `nilai_akhir`
2. Buat `PenilaianService` dengan logika finalisasi
3. Buat `NilaiAkhirService` dengan weighted average dan konversi huruf mutu
4. Buat `YudisiumService` dengan logika kelulusan
5. Buat antarmuka penilaian untuk masing-masing penilai
6. Buat halaman rekap nilai untuk LPPM
7. Buat halaman yudisium dengan status lulus/tidak lulus
8. Implementasi export Excel dan PDF untuk rekap nilai

---

### FASE 7 — Monitoring & Notifikasi (Estimasi: 2-3 hari)

**Target:** DPL bisa input monitoring, notifikasi otomatis berjalan

**Langkah:**
1. Buat migrasi tabel `monitoring_dpl`
2. Buat `MonitoringService`
3. Buat `NotifikasiService` dengan queue
4. Setup Scheduler untuk semua job otomatis
5. Buat halaman monitoring untuk DPL
6. Test semua notifikasi otomatis

---

### FASE 8 — Keamanan & Production Hardening (Estimasi: 2 hari)

**Target:** Sistem aman dan siap production

**Langkah:**
1. Aktifkan `RestrictDebugTools` middleware
2. Tambahkan rate limiting pada endpoint sensitif
3. Validasi MIME type semua file upload
4. Pastikan semua config production benar
5. Nonaktifkan `APP_DEBUG`
6. Test seluruh alur dari login hingga yudisium

---

## 12. API & ROUTE REFERENCE

### 12.1 Route Auth

```
POST   /masuk                     auth.masuk          -- Login
POST   /keluar                    auth.keluar         -- Logout
```

### 12.2 Route Admin

```
GET    /admin                     admin.dasbor        -- Dashboard
GET    /admin/pengguna            admin.pengguna.index
POST   /admin/pengguna            admin.pengguna.simpan
GET    /admin/pengguna/{id}/ubah  admin.pengguna.ubah
PATCH  /admin/pengguna/{id}       admin.pengguna.perbarui
DELETE /admin/pengguna/{id}       admin.pengguna.hapus

GET    /admin/periode             admin.periode.index
POST   /admin/periode             admin.periode.simpan
GET    /admin/periode/{id}/ubah   admin.periode.ubah
PATCH  /admin/periode/{id}        admin.periode.perbarui

GET    /admin/kelompok            admin.kelompok.index
POST   /admin/kelompok            admin.kelompok.simpan

GET    /admin/pendaftaran         admin.pendaftaran.index
PATCH  /admin/pendaftaran/{id}/verifikasi  admin.pendaftaran.verifikasi
PATCH  /admin/pendaftaran/{id}/tolak       admin.pendaftaran.tolak

GET    /admin/rekap-nilai         admin.rekap-nilai.index
POST   /admin/rekap-nilai/finalisasi-massal  admin.rekap-nilai.finalisasi-massal

GET    /admin/yudisium            admin.yudisium.index
POST   /admin/yudisium/proses     admin.yudisium.proses

GET    /admin/konfigurasi         admin.konfigurasi.index
PATCH  /admin/konfigurasi         admin.konfigurasi.perbarui

GET    /admin/ekspor/nilai        admin.ekspor.nilai  -- Download Excel
GET    /admin/ekspor/yudisium     admin.ekspor.yudisium  -- Download PDF
```

### 12.3 Route DPL

```
GET    /dpl                       dpl.dasbor
GET    /dpl/mahasiswa-bimbingan   dpl.mahasiswa.index
GET    /dpl/mahasiswa-bimbingan/{id}  dpl.mahasiswa.detail

GET    /dpl/logbook               dpl.logbook.index
PATCH  /dpl/logbook/{id}/periksa  dpl.logbook.periksa

GET    /dpl/izin                  dpl.izin.index
PATCH  /dpl/izin/{id}/setujui     dpl.izin.setujui
PATCH  /dpl/izin/{id}/tolak       dpl.izin.tolak

GET    /dpl/penilaian             dpl.penilaian.index
POST   /dpl/penilaian             dpl.penilaian.simpan
PATCH  /dpl/penilaian/{id}        dpl.penilaian.perbarui
POST   /dpl/penilaian/{id}/finalisasi  dpl.penilaian.finalisasi

GET    /dpl/tugas-kelompok        dpl.tugas.index
PATCH  /dpl/tugas-kelompok/{id}/setujui   dpl.tugas.setujui
PATCH  /dpl/tugas-kelompok/{id}/revisi    dpl.tugas.revisi

GET    /dpl/monitoring            dpl.monitoring.index
POST   /dpl/monitoring            dpl.monitoring.simpan
```

### 12.4 Route Mahasiswa

```
GET    /mahasiswa                 mahasiswa.dasbor
GET    /mahasiswa/pendaftaran     mahasiswa.pendaftaran.index
POST   /mahasiswa/pendaftaran     mahasiswa.pendaftaran.daftar

GET    /mahasiswa/logbook         mahasiswa.logbook.index
POST   /mahasiswa/logbook         mahasiswa.logbook.simpan
GET    /mahasiswa/logbook/{id}/ubah  mahasiswa.logbook.ubah
PATCH  /mahasiswa/logbook/{id}    mahasiswa.logbook.perbarui

GET    /mahasiswa/izin            mahasiswa.izin.index
POST   /mahasiswa/izin            mahasiswa.izin.ajukan

GET    /mahasiswa/tugas           mahasiswa.tugas.index
POST   /mahasiswa/tugas           mahasiswa.tugas.kumpul
PATCH  /mahasiswa/tugas/{id}      mahasiswa.tugas.perbarui

GET    /mahasiswa/nilai           mahasiswa.nilai.index
```

---

## 13. ATURAN VALIDASI

### 13.1 Validasi Pendaftaran

```
mahasiswa_id   : required, exists:users,id, role:mahasiswa
periode_id     : required, exists:periode_kkn,id, status:aktif
-- Validasi bisnis (di Service, bukan Form Request):
-- Belum pernah daftar di periode ini
-- Deadline belum lewat
-- Kuota belum penuh
-- SKS minimal 100 (jika ada integrasi SIAKAD)
```

### 13.2 Validasi Logbook

```
kegiatan       : required, string, min:100, max:5000
hasil          : nullable, string, max:2000
kendala        : nullable, string, max:2000
rencana_besok  : nullable, string, max:2000
-- Validasi bisnis:
-- Tanggal harus hari ini
-- Belum ada logbook hari ini untuk mahasiswa ini
-- Tanggal dalam rentang periode KKN
```

### 13.3 Validasi Izin

```
tanggal_mulai  : required, date, after_or_equal:today
tanggal_kembali: required, date, after:tanggal_mulai
alasan         : required, string, min:50, max:1000
-- Validasi bisnis:
-- Tidak ada izin lain yang overlapping
-- Dalam rentang periode KKN
```

### 13.4 Validasi Upload File

```
-- Poster (JPEG)
file           : required, file, mimes:jpg,jpeg, max:5120 (5MB)
-- Validasi MIME type wajib di backend (bukan hanya ekstensi)

-- Berita/Artikel (Word)
file           : required, file, mimes:doc,docx, max:10240 (10MB)

-- Video (hanya link)
link_video     : required, url, starts_with:https://drive.google.com

-- Laporan Akhir
file           : required, file, mimes:doc,docx, max:20480 (20MB)
```

### 13.5 Validasi Penilaian

```
-- Semua komponen nilai
[nama_komponen]: required, numeric, min:0, max:100

-- Validasi bisnis:
-- Penilai hanya bisa nilai mahasiswa yang sesuai cakupannya
-- Nilai yang sudah difinalisasi tidak bisa diubah
```

---

## 14. SISTEM NOTIFIKASI

### 14.1 Daftar Notifikasi Otomatis

| Event | Penerima | Channel | Waktu |
|-------|----------|---------|-------|
| Pendaftaran baru | Admin LPPM | In-app | Segera (queue) |
| Status pendaftaran berubah | Mahasiswa | In-app + Email | Segera |
| Izin diajukan | DPL | In-app | Segera |
| Izin disetujui/ditolak | Mahasiswa | In-app | Segera |
| Logbook tidak diisi 2 hari | DPL | In-app | Setiap malam |
| Absensi tanpa keterangan ≥ 3 hari | LPPM | In-app + Email | Setiap malam |
| Tugas baru dikumpulkan | DPL | In-app | Segera |
| Penilaian difinalisasi | Mahasiswa | In-app | Segera |
| Deadline tugas 3 hari lagi | Mahasiswa + DPL | In-app | H-3 |
| Frekuensi monitoring belum terpenuhi | DPL | In-app | H-7 sebelum akhir KKN |

### 14.2 Implementasi via Queue

Semua notifikasi dikirim via Laravel Queue agar tidak memblokir response. Channel default: `notifikasi`. Gunakan `database` queue driver untuk development, `redis` untuk production.

---

## 15. PANDUAN TESTING

### 15.1 Isolasi Database Test

```xml
<!-- phpunit.xml -->
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="DB_CONNECTION" value="pgsql"/>
    <env name="DB_DATABASE" value="kkn_test"/>  <!-- WAJIB database terpisah -->
    <env name="SESSION_DRIVER" value="array"/>
    <env name="CACHE_DRIVER" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
    <env name="TELESCOPE_ENABLED" value="false"/>
</php>
```

### 15.2 Test yang Wajib Ada

```
Feature Tests:
├── Auth/LoginTest.php              -- Login berhasil, gagal, CSRF
├── Pendaftaran/PendaftaranTest.php -- Daftar berhasil, gagal, race condition
├── Logbook/LogbookTest.php         -- Isi logbook, validasi tanggal, duplikasi
├── Izin/IzinTest.php               -- Ajukan, setujui, hitung absensi
├── Penilaian/PenilaianTest.php     -- Input nilai, finalisasi, konversi
├── Yudisium/YudisiumTest.php       -- Hitung nilai akhir, status lulus
└── Export/ExportTest.php           -- Export Excel dan PDF

Unit Tests:
├── Services/PendaftaranServiceTest.php
├── Services/NilaiAkhirServiceTest.php  -- Test konversi semua rentang skor
└── Services/AbsensiServiceTest.php
```

### 15.3 Test Race Condition Pendaftaran

```
Skenario:
- Periode dengan kuota = 1 mahasiswa
- Kirim 10 request pendaftaran secara bersamaan
- Harapan: Hanya 1 yang berhasil, 9 sisanya mendapat error kuota penuh
- Tidak boleh ada data inconsistency (kuota_terisi > 1)
```

---

## 16. CHECKLIST DEPLOYMENT

### 16.1 Sebelum Go-Live

```
ENVIRONMENT
☐ APP_DEBUG=false
☐ APP_ENV=production
☐ APP_URL menggunakan HTTPS
☐ SESSION_SECURE_COOKIE=true
☐ SESSION_DOMAIN dikonfigurasi benar

DATABASE
☐ Database produksi terpisah dari database test
☐ Semua migrasi sudah dijalankan
☐ RolePermissionSeeder sudah dijalankan
☐ Data demo (is_demo=true) sudah diarsipkan
☐ Periode resmi pertama sudah dibuat dengan status 'aktif'

KEAMANAN
☐ Debugbar dan Telescope hanya aktif untuk superadmin
☐ Rate limiting aktif pada endpoint login dan pendaftaran
☐ MIME type validation aktif pada semua upload
☐ File upload tersimpan di disk 'private' (tidak bisa diakses langsung via URL)
☐ Enkripsi session aktif

PERFORMA
☐ Config cache: php artisan config:cache
☐ Route cache: php artisan route:cache
☐ View cache: php artisan view:cache
☐ Composer autoload optimize: composer install --optimize-autoloader --no-dev
☐ npm run build (Vite production build)

QUEUE & SCHEDULER
☐ Laravel Queue Worker berjalan (supervisor/systemd)
☐ Laravel Scheduler berjalan (cron: * * * * * php artisan schedule:run)

VERIFIKASI AKHIR
☐ Login berhasil dengan semua peran
☐ Pendaftaran mahasiswa berjalan
☐ Logbook bisa diisi dan diperiksa DPL
☐ Penilaian bisa diinput dan difinalisasi
☐ Export Excel dan PDF berfungsi
☐ Notifikasi terkirim
☐ Dashboard menampilkan data nol (bukan data demo)
```

### 16.2 Perintah Terminal Deployment

```bash
# 1. Pull kode terbaru
git pull origin main

# 2. Install dependencies
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# 3. Jalankan migrasi
php artisan migrate --force

# 4. Bersihkan dan rebuild cache
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 5. Restart queue worker
php artisan queue:restart

# 6. Verifikasi
php artisan about
```

---

## 📎 CATATAN PENTING UNTUK AI AGENT

Ketika mengimplementasikan sistem ini, perhatikan hal-hal berikut:

1. **JANGAN hardcode** bobot nilai, batas hari, atau konfigurasi lain — semua harus bisa diubah dari tabel `konfigurasi_sistem`

2. **SELALU gunakan** `$this->authorize()` di awal setiap method controller sebelum melakukan apapun

3. **SELALU gunakan** Form Request terpisah — jangan validasi di controller

4. **SELALU kirim** operasi berat (audit log, email, notifikasi) ke queue — jangan blocking

5. **JANGAN pakai** `->get()` tanpa limit pada query yang bisa mengembalikan ribuan baris — selalu paginate

6. **SELALU gunakan** `DB::transaction()` untuk operasi yang menyentuh lebih dari satu tabel

7. **PASTIKAN** DPL hanya bisa mengakses data kelompoknya sendiri — scope query di service, bukan hanya di policy

8. **INGAT** bahwa nilai yang sudah difinalisasi bersifat immutable — cek status sebelum allow update

9. **PASTIKAN** test database (`kkn_test`) tidak pernah sama dengan database runtime (`kkn`)

10. **GUNAKAN** enum yang sudah didefinisikan — jangan gunakan string bebas untuk status

---

*Dokumen ini adalah panduan lengkap implementasi Sistem KKN UIN SAIZU.*  
*Setiap perubahan pada dokumen ini harus dikomunikasikan ke seluruh tim pengembang.*

---
**© 2025 LPPM UIN Prof. K.H. Saifuddin Zuhri Purwokerto**
