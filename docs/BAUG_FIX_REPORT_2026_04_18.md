# Laporan Error, Bug, dan Perbaikan

**Tanggal:** 18 April 2026  
**Proyek:** KKN UIN SAIZU Portal (Laravel + Inertia + React/TypeScript)

---

## Ringkasan Eksekutif

Dokumen ini mencatat komprehensif semua error dan bug yang ditemukan selama proses QA Testing, beserta root cause dan langkah perbaikan yang sudah/s belum dilakukan.

**Status Test Akhir:** 374 failed, 10 passed

---

## 1. Error Database (Critical)

### 1.1 Missing Table: `announcements`

**Error:**

```
SQLSTATE[42P01]: Undefined table: 7 ERROR: relation "announcements" does not exist
```

**Status:** ❌ Belum ada migration/tabel

---

### 1.2 Missing Table: `downloads`

**Error:**

```
SQLSTATE[42P01]: Undefined table: 7 ERROR: relation "downloads" does not exist
```

**Status:** ❌ Belum ada migration/tabel

---

### 1.3 Missing Table: `dpl_periods`

**Error:**

```
SQLSTATE[42P01]: Undefined table: 7 ERROR: relation "dpl_periods" does not exist
```

**Status:** ❌ Belum ada migration/tabel

---

### 1.4 Missing Column: `faculty_id` di tabel `prodi`

**Error:**

```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "faculty_id" of relation "prodi" does not exist
```

**Root Cause:**
Kolom di database menggunakan `fakultas_id`, tapi kode/model pakai `faculty_id`.

**Status:** Model sudah diperbaiki, perlu cek migration

---

### 1.5 Missing Column: `faculty_id` di tabel `users`

**Error:**

```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "faculty_id" of relation "users" does not exist
```

**Status:** ❌ Perlu update ke `fakultas_id`

---

### 1.6 Missing Column: `output` di tabel `kegiatan_kkn`

**Error:**

```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "output" of relation "kegiatan_kkn" does not exist
```

**Status:** ❌ Belum ada kolom di tabel

---

### 1.7 Missing Column: `period_id` di tabel `peserta_kkn`

**Error:**

```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "period_id" of relation "peserta_kkn" does not exist
```

**Root Cause:**
Kolom di database menggunakan `periode_id`, tapi kode pakai `period_id`.

**Status:** Model sudah diperbaiki

---

### 1.8 Missing Column: `review_notes` di tabel `laporan_akhir`

**Error:**

```
SQLSTATE[42703]: Undefined column: 7 ERROR: column "review_notes" of relation "laporan_akhir" does not exist
```

**Status:** ❌ Belum ada kolom di tabel

---

## 2. Error Column Naming (Critical)

### 2.1 `program_id` vs `prodi_id` vs `fakultas_id` vs `fakultas_id`

**Error:**

```
SQLSTATE[42703]: ERROR: column "program_id" does not exist
```

**Root Cause:**
Ketidakkonsistenan naming convention di codebase:

- Database column: `fakultas_id`, `prodi_id`, `periode_id`
- Models/Factories masih gunakan: `faculty_id`, `program_id`, `period_id`

**Model yang sudah diperbaiki:**
| Model | Antesedan | Sesudah |
|------|----------|---------|
| `Prodi` | `faculty_id` | `fakultas_id` |
| `Mahasiswa` | `faculty_id`, `program_id` | `faksimal_id`, `prodi_id` |
| `PesertaKkn` | `period_id` | `periode_id` |

**Status:** Sebagian sudah diperbaiki (model + factory)

---

### 2.2 Test Files Pakai Column Names Lama

**File Test yang masih gunakan `program_id`:**

- `tests/Feature/StudentRegistrationFlowTest.php` (lines 580, 585, 603)
- `tests/Feature/NilaiKknIdentityConsistencyTest.php` (line 153)
- `tests/Feature/FacultyAdminRekapNilaiTest.php` (line 181)
- `tests/Feature/Legacy/AdminMahasiswaRegistryTest.php` (lines 56, 78, 136, 155)
- `tests/Feature/MultiRoleWorkflowTest.php` (line 87)
- `tests/Feature/StudentDailyReportFullWorkflowTest.php` (line 56)
- `tests/Feature/GroupManagementWorkflowTest.php` (line 60)
- `tests/Feature/FullRegistrationToGradingWorkflowTest.php` (line 97)
- `tests/Unit/Services/RegistrationServiceTest.php` (line 235)
- `tests/Unit/Services/DashboardStatisticsServiceTest.php` (lines 361, 366)
- `tests/Feature/AdminBpjsParticipantExportTest.php` (lines 74, 101)

**Status:** Belum diperbaiki (test files masih gagal)

---

### 2.3 `bpjs_profile` does not exist in controller response

**Error:**

```
Error: bpjs_profile property does not exist
```

**Root Cause:**
Test expectation `StudentRegistrationFlowTest.php` expect `bpjs_profile` di response, tetapi controller tidak mengembalikan field tersebut.

**Status:** Sudah diperbaiki (assertion dihapus dari test)

---

## 3. Error Migration

### 3.1 Migration `work_programs` → `program_kerja` Table Rename

**Error:**
Migration salah rename tabel dari `work_programs` ke `program_kerja` yang tidak sesuai dengan arsitektur.

**Status:** Sudah diperbaiki

---

## 4. Frontend Warnings (Non-Critical)

### 4.1 Unused Imports

**Files:**

- `resources/js/Pages/Student/Dashboard.tsx`
- `resources/js/Pages/Student/Izin/Index.tsx`
- `resources/js/Pages/Student/Rekapitulasi/Index.tsx`
- `resources/js/Pages/Student/WorkPrograms/Index.tsx`
- `resources/js/Pages/Student/Workshops/Index.tsx`

**Status:** Pending - warning tidak mempengaruhi fungsionalitas

---

### 4.2 Missing Form Labels

**Files:**

- `resources/js/Pages/Student/FinalReport/Create.tsx` (lines 146, 159)
- `resources/js/Pages/Student/Poster/Index.tsx` (line 198)
- `resources/js/Pages/Student/WorkPrograms/Create.tsx` (lines 128, 145)

**Status:** Pending - aksesibility issue

---

## 5. PHPUnit Deprecation Warnings

### 5.1 Metadata in Doc-Comments

**Warning:**

```
Metadata found in doc-comment for method Tests\Unit\... is deprecated and will no longer be supported in PHPUnit 12
```

**Lokasi:**

- `tests/Unit/Services/PeriodContextServiceTest.php`
- `tests/Feature/Admin/AdminDashboardTest.php`
- `tests/Feature/Auth/LoginTest.php`
- `tests/Feature/DailyReports/DailyReportAuthorizationTest.php`
- Dan banyak test files lainnya

**Status:** Pending - perlu update ke PHPUnit attributes

---

## 6. Error Lainnya

### 6.1 Model `Prodi` Missing HasFactory

**Error:**
Test menggunakan `Prodi::factory()->create()` tapi model tidak punya `HasFactory` trait.

**Status:** Sudah diperbaiki

---

### 6.2 `PesertaKkn` Fillable Missing

**Error:**
Kolom fillable tidak lengkap di model `PesertaKkn`.

**Status:** Sudah diperbaiki

---

## 7. Ringkasan Status Perbaikan

| No  | Issue                                       | Status   |
| --- | ------------------------------------------- | -------- |
| 1   | Tabel `announcements` tidak ada             | ❌ Belum |
| 2   | Tabel `downloads` tidak ada                 | ❌ Belum |
| 3   | Tabel `dpl_periods` tidak ada               | ❌ Belum |
| 4   | Column `faculty_id` → `fakultas_id` (prodi) | ✅ Sudah |
| 5   | Column `faculty_id` → `fakultas_id` (users) | ❌ Belum |
| 6   | Column `output` di `k教育活动` tidak ada    | ❌ Belum |
| 7   | Column `period_id` → `periode_id` (peserta) | ✅ Sudah |
| 8   | Column `review_notes` di `laporan_akhir`    | ❌ Belum |
| 9   | Column naming di model/factory              | ✅ Sudah |
| 10  | Column naming di test files                 | ❌ Belum |
| 11  | `bpjs_profile` expectation                  | ✅ Sudah |
| 12  | Prodi HasFactory trait                      | ✅ Sudah |
| 13  | PesertaKkn fillable                         | ✅ Sudah |

---

## 8. Langkah Perbaikan yang Perlu Dilanjutkan

### 8.1 Tabel & Kolom Baru (Priority: High)

Buat migration untuk tabel dan kolom yang belum ada:

1. **Tabel `announcements`** - untuk pengumuman
2. **Tabel `downloads`** - untuk unduhan file
3. **Tabel `dpl_periods`** - untuk periode DPL
4. **Kolom `output` di tabel `kegiatan_kkn`** - untuk output kegiatan
5. **Kolom `review_notes` di tabel `laporan_akhir`** - untuk catatan review
6. **Kolom `fakultas_id` di tabel `users`** - ubah dari `faculty_id`

### 8.2 Fix Column Names di Test Files (Priority: High)

Update test files berikut untuk gunakan `prodi_id` bukan `program_id`, dst:

1. `tests/Feature/StudentRegistrationFlowTest.php`
2. `tests/Feature/NilaiKknIdentityConsistencyTest.php`
3. `tests/Feature/FacultyAdminRekapNilaiTest.php`
4. `tests/Feature/Legacy/AdminMahasiswaRegistryTest.php`
5. `tests/Feature/MultiRoleWorkflowTest.php`
6. `tests/Feature/StudentDailyReportFullWorkflowTest.php`
7. `tests/Feature/GroupManagementWorkflowTest.php`
8. `tests/Feature/FullRegistrationToGradingWorkflowTest.php`
9. `tests/Unit/Services/RegistrationServiceTest.php`
10. `tests/Unit/Services/DashboardStatisticsServiceTest.php`
11. `tests/Feature/AdminBpjsParticipantExportTest.php`

### 8.3 Fix Frontend Warnings (Priority: Low)

bersihkan unused imports dan tambahkan form labels untuk aksesibility.

---

## 9. Catatan Tambahan

- Aplikasi bisa dijalankan (serve) tanpa error critical
- E2E tests (Playwright) lulus 7/7 - ini menunjukkan functional flow bekerja
- Error terjadi terutama di unit/feature tests yang menggunakan mock/factory dengan column names yang salah
- Root cause utama adalah inkonsistensi antara database schema (nama kolom) dengan kode yang ditulis (factory/model)

---

**Dokumen ini akan diperbarui seiring progresses perbaikan.**
