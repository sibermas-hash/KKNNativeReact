# 03 — Database

## Overview

- **Engine**: PostgreSQL 16
- **Connection**: via `pdo_pgsql` di Laravel
- **SSL**: `DB_SSLMODE=require` (commented di .env.example, aktifkan di production)
- **Migration count**: 199 file di `database/migrations/` + 2 di `migrations/kkn/`
- **Seeders**: 12 kelas
- **Factories**: 18 factory (utama + KKN subdir)

## Core Schema (2026_01_01_000000_create_kkn_core_tables.php)

```
fakultas            # Fakultas
prodi               # Program studi (FK: fakultas_id)
tahun_akademik      # Tahun akademik
periode             # Periode KKN (FK: academic_year_id)
dosen               # Dosen (FK: user_id, fakultas_id)
mahasiswa           # Mahasiswa (FK: user_id, fakultas_id, prodi_id)
lokasi              # Desa/kelurahan lokasi KKN
kelompok_kkn        # Kelompok (FK: periode_id, location_id, dpl_id)
peserta_kkn         # Pivot mahasiswa-kelompok-periode (status pending/approved/rejected)
kegiatan_kkn        # Laporan harian (FK: mahasiswa_id, kelompok_id)
program_kerja       # Program kerja kelompok
laporan_akhir       # Laporan akhir per mahasiswa
evaluasi            # Evaluasi (FK: mahasiswa_id, kelompok_id)
item_evaluasi       # Item per evaluasi
```

Migrasi lanjutan menambah: workshop, dpl_period, posko_kelompok, document_template, bimbingan, chat_conversations, chat_messages, user_activity_logs, webhook_events, api_keys, system_settings, dispensasi_kkn, dll.

## Integrity Constraints

### CHECK Constraints (2026_05_11_080000)
```sql
peserta_kkn.status IN ('pending','approved','rejected','withdrawn','graduated')
kegiatan_kkn.status IN ('draft','pending','approved','rejected','revision')
laporan_akhir.status IN ('draft','submitted','approved','rejected','revision')
```

### Partial Unique Index (2026_05_11_030000)
```sql
CREATE UNIQUE INDEX peserta_kkn_kelompok_ketua_unique
ON peserta_kkn (kelompok_id)
WHERE role = 'Ketua' AND deleted_at IS NULL;
```
Satu Ketua per kelompok, PostgreSQL-specific.

### Soft Deletes (2026_05_11_060000)
Ditambahkan ke `users`, `mahasiswa`, `dosen`. Mencegah cascade destroying ke peserta_kkn, nilai, evaluasi, chat history.

### FK Tightening (2026_05_11_070000)
- `chat_messages.sender_id`: `cascade` → `nullOnDelete` (R13-DB-008)
- `dispensasi_kkn.granted_by`: FK ditambahkan dengan `nullOnDelete`

## PII Encryption (Phase 2-3)

### Strategy
- Kolom PII di-widen dari VARCHAR ke TEXT (menampung ciphertext).
- Laravel `encrypted` cast untuk serialization.
- **Blind Index** untuk field yang perlu lookup (NIM, NIP): HMAC-SHA256 dengan `APP_BLIND_INDEX_KEY`.
- Plaintext UNIQUE dihapus, uniqueness dijamin via `*_bidx` column.

### Fields Encrypted

**`users`** (2026_05_10_050000):
- `phone`, `address`, `address_village_name`, `address_district_name`, `address_regency_name`, `address_postal_code`
- `two_factor_secret`, `two_factor_recovery_codes`
- Email **tidak** di-encrypt (auth guard lookup). Trade-off didokumentasikan.

**`mahasiswa`** (2026_05_10_033000):
- `nik`, `mother_name`, `birth_place`, `phone` (dan kolom lain)
- `nim` → TEXT + `nim_bidx` HMAC lookup

**`dosen`**:
- PII serupa
- `nip` → TEXT + `nip_bidx`

### Lookup Pattern
```php
// Sebelumnya
Mahasiswa::where('nim', $nim)->first();

// Sekarang
Mahasiswa::whereBlind('nim', $nim)->first();
```

### Blind Index Key Rotation
**CATATAN PENTING**: Rotasi `APP_BLIND_INDEX_KEY` akan meng-orphan semua `*_bidx` existing. Wajib ada plan migrasi (rebuild semua bidx) sebelum rotasi. Ini tidak terdokumentasi saat audit — perlu SOP.

## 2FA Support (2026_05_10_090000)

Kolom tambahan di `users`:
- `two_factor_secret` (encrypted TEXT)
- `two_factor_recovery_codes` (encrypted:array, hash'd individual codes)
- `two_factor_confirmed_at` (datetime)
- `two_factor_enforced` (boolean — admin dapat force 2FA per-user)

## Performance Indexes

- `2026_02_11_190000_add_performance_indexes.php`
- `2026_04_02_100000_add_missing_performance_indexes.php`
- `2026_02_11_180000_add_indexes_to_audit_logs_table.php`
- Composite `user_activity_logs(user_id, created_at)` (R13-DB-006)

## Audit Log Infrastructure

- `audit_logs` table (2026_02_10_170205) dengan kolom user_id, event, model, old/new values
- `AuditObserver` attached ke: `NilaiKkn`, `Laporan`, `KegiatanKkn`, `Mahasiswa`, `Evaluasi`, `KonfigurasiSertifikat`, `KonfigurasiPenilaian`, `PesertaKkn`
- Tujuan: detect fraud di grading + manipulation data peserta.

## Seeders

### DatabaseSeeder Pipeline
```
RoleSeeder              # 6 role
PermissionSeeder        # 25+ permissions, synced to roles
SuperAdminSeeder        # Idempotent superadmin creation
KonfigurasiPenilaianSeeder
KonfigurasiSertifikatSeeder
JenisKknSeeder
SystemSettingSeeder
```

### Production Guards
`SuperAdminSeeder` refuse run di production tanpa `KKN_SUPERADMIN_PASSWORD` env (L-001 fix). Tidak ada auto-generated password di log production.

### Dev-only Seeders
- `LocalDevSeeder.php` — dummy data lokal
- `ImportDb2DosenSeeder.php` — import legacy dosen
- `ImportLegacyKknStatusSeeder.php`
- `ImportWorkshopDplSeeder.php`

## Factories

```
UserFactory.php
KKN/
  AntrianKknFactory.php
  AttendanceFactory.php
  DosenFactory.php
  EvaluasiDplPesertaFactory.php
  FakultasFactory.php
  JenisKknFactory.php
  KegiatanKknFactory.php
  KelompokKknFactory.php
  LaporanAkhirFactory.php
  LokasiFactory.php
  MahasiswaFactory.php
  NilaiKknFactory.php
  PeriodeFactory.php
  PesertaKknFactory.php
  PoskoKelompokFactory.php
  ProdiFactory.php
  ProgramKerjaFactory.php
  TahunAkademikFactory.php
```

## Temuan Spesifik DB

| ID | Severity | Catatan |
|---|---|---|
| M-NEW-006 | Medium | 199 migrasi perlu squash setelah stabil (baseline dump) |
| L-NEW-xx | Low | `mahasiswa.nama` & `dosen.nama` masih plaintext — sebagian OK (public), sebagian sensitive |
| Process | - | `APP_BLIND_INDEX_KEY` rotation plan belum didokumentasikan |
| Process | - | Tidak ada ER diagram formal / schema docs |

## Rekomendasi

1. **Squash migrasi** — setelah production stabil 2–3 periode KKN, `php artisan schema:dump --prune` untuk migrasi lama, sisakan incremental.
2. **ER diagram** — generate via `vendor/bin/generate-migration-diagram` atau `schemaspy`. Commit ke `docs/`.
3. **Blind index rotation SOP** — tulis runbook untuk rotate `APP_BLIND_INDEX_KEY` (rebuild semua `*_bidx` kolom).
4. **DB pooler** — kalau traffic meningkat, evaluasi PgBouncer di depan PostgreSQL (transaction pool).
5. **Backup verification** — `scripts/backup.sh` jalankan setiap hari, tapi tidak ada auto-restore verification. Tambahkan cron bulanan untuk `pg_restore --list` ke DB staging.
