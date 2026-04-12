# 📊 Database Schema Documentation

**KKN UIN SAIZU - Sistem Informasi KKN**

Dokumentasi lengkap schema database untuk aplikasi KKN UIN SAIZU.

---

## 📋 Daftar Isi

1. [Core Tables](#core-tables)
2. [Master Data](#master-data)
3. [KKN Operations](#kkn-operations)
4. [Grading & Evaluation](#grading--evaluation)
5. [Reports & Documents](#reports--documents)
6. [Workshop & Training](#workshop--training)
7. [DPL Management](#dpl-management)
8. [Student Lifecycle](#student-lifecycle)
9. [System & Infrastructure](#system--infrastructure)
10. [Relationships Diagram](#relationships-diagram)

---

## Core Tables

### `users`
Tabel utama untuk autentikasi dan authorization semua pengguna (admin, dpl, student).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | User ID |
| name | string(100) | | Nama lengkap |
| email | string(100) | Unique, Nullable | Email (nullable untuk dosen tanpa akun) |
| password | string(255) | | Hashed password |
| avatar | string | Nullable | URL avatar/foto profil |
| phone | string(20) | Nullable | Nomor telepon |
| address | text | Nullable | Alamat lengkap |
| faculty_id | bigint | FK → faculties.id | Fakultas pengguna |
| roles | json | | Roles dari Spatie Permission |
| remember_token | string(100) | Nullable | Token remember me |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** email, faculty_id

---

### `cache`
Cache application menggunakan database driver.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| key | string | PK, Unique | Cache key |
| value | text | | Cache value (serialized) |
| expiration_at | int | | Expiration timestamp |

---

### `jobs`
Queue jobs untuk background processing.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | Job ID |
| queue | string | Index | Queue name |
| payload | longtext | | Job payload (JSON) |
| available_at | int | | Available timestamp |
| reserved_at | int | Nullable | Reserved timestamp |
| attempts | smallint | | Number of attempts |
| reserved_at | timestamp | Nullable | |

**Indexes:** queue, available_at, reserved_at

---

### `failed_jobs`
Failed jobs untuk retry dan monitoring.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| uuid | string | Unique | Job UUID |
| connection | text | | Connection name |
| queue | text | | Queue name |
| payload | longtext | | Job payload |
| exception | longtext | | Exception details |
| failed_at | timestamp | Current | Failure timestamp |

---

### `personal_access_tokens`
API tokens untuk Sanctum authentication.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| tokenable_type | string | Polymorphic | Model type |
| tokenable_id | bigint | Polymorphic | Model ID |
| name | string | | Token name |
| token | string(64) | Unique, Hashed | Token value |
| abilities | text | | Token abilities (JSON) |
| last_used_at | timestamp | Nullable | Last usage |
| expires_at | timestamp | Nullable | Expiration |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** token, tokenable_type + tokenable_id

---

## Master Data

### `faculties`
Data fakultas di UIN SAIZU.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| code | string(10) | Unique | Kode fakultas |
| name | string(100) | | Nama fakultas |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `programs`
Data program studi.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| faculty_id | bigint | FK → faculties.id | Fakultas |
| code | string(10) | Unique | Kode prodi |
| name | string(100) | | Nama prodi |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** faculty_id

---

### `academic_years`
Tahun akademik.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| year | string(9) | | Format: 2025/2026 |
| is_active | boolean | Default: false | Status aktif |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `periode`
Periode KKN (semester pelaksanaan).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| academic_year_id | bigint | FK → academic_years.id | Tahun akademik |
| periode | integer | Nullable | Nomor periode |
| jenis | string(100) | Nullable | Jenis (Reguler, Tematik, dll) |
| name | string(100) | | Nama periode |
| start_date | date | | Tanggal mulai |
| end_date | date | | Tanggal selesai |
| registration_start | date | | Mulai pendaftaran |
| registration_end | date | | Akhir pendaftaran |
| kuota | integer | Default: 2000 | Kuota peserta |
| is_active | boolean | Default: false | Status aktif |
| grading_start_date | date | Nullable | Mulai penilaian |
| grading_end_date | date | Nullable | Akhir penilaian |
| is_grading_active | boolean | Default: false | Status penilaian |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** academic_year_id, is_active

---

### `dosen`
Data dosen (termasuk DPL).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| user_id | bigint | FK → users.id | User关联 (nullable) |
| nip | string(20) | Unique | NIP |
| name | string(100) | | Nama lengkap |
| faculty_id | bigint | FK → faculties.id | Fakultas |
| phone | string(20) | Nullable | Telepon |
| birth_date | date | Nullable | Tanggal lahir |
| qualification | enum | Nullable | S1/S2/S3 |
| major | string | Nullable | Bidang keahlian |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** user_id, nip, faculty_id

---

### `mahasiswa`
Data mahasiswa.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| user_id | bigint | FK → users.id | User关联 |
| nim | string(20) | Unique | NIM |
| name | string(100) | | Nama lengkap |
| faculty_id | bigint | FK → faculties.id | Fakultas |
| program_id | bigint | FK → programs.id | Program studi |
| batch_year | year | | Angkatan |
| sks_completed | integer | Default: 0 | SKS selesai |
| gpa | decimal(3,2) | Default: 0.00 | IPK |
| gender | enum(L,P) | | Jenis kelamin |
| university | string(100) | Nullable | Universitas (transfer) |
| birth_place | string(100) | Nullable | Tempat lahir |
| birth_date | date | Nullable | Tanggal lahir |
| master_faculty_id | string | Nullable | Sync dari master |
| master_program_id | string | Nullable | Sync dari master |
| is_active | boolean | Default: true | Status |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** user_id, nim, faculty_id, program_id

---

### `locations`
Data lokasi KKN (desa/kelurahan).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| province_id | integer | Nullable | ID provinsi |
| regency_id | integer | Nullable | ID kabupaten/kota |
| district_id | integer | Nullable | ID kecamatan |
| village_code | string(20) | Nullable | Kode desa |
| village_name | string(100) | | Nama desa |
| address | text | Nullable | Alamat lengkap |
| latitude | decimal(10,8) | Nullable | Koordinat lat |
| longitude | decimal(11,8) | Nullable | Koordinat long |
| capacity | integer | Default: 0 | Kapasitas mahasiswa |
| faculty_id | bigint | FK → faculties.id | Nullable | Fakultas mitra |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** village_code, district_id

---

## KKN Operations

### `kelompok_kkn`
Kelompok KKN.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| periode_id | bigint | FK → periode.id | Periode |
| location_id | bigint | FK → locations.id | Lokasi |
| dpl_id | bigint | FK → dosen.id | DPL pembimbing |
| code | string(20) | Unique | Kode kelompok |
| name | string(100) | | Nama kelompok |
| token | string(10) | Unique, Nullable | Token akses |
| capacity | integer | Default: 10 | Kapasitas |
| status | enum(draft,active,closed) | Default: draft | Status |
| poster | string | Nullable | URL poster kelompok |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** periode_id, location_id, dpl_id, code

---

### `peserta_kkn`
Peserta KKN (anggota kelompok).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| mahasiswa_id | bigint | FK → mahasiswas.id | Mahasiswa |
| role | enum(ketua,sekretaris,bendahara,anggota) | Default: anggota | Role dalam kelompok |
| status | enum(registered,active,inactive,completed) | Default: registered | Status |
| joined_at | timestamp | Current | Tanggal gabung |
| completed_at | timestamp | Nullable | Tanggal selesai |
| is_resubmission | boolean | Default: false | Mengulang KKN |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** kelompok_id, mahasiswa_id, unique(mahasiswa_id, kelompok_id)

---

### `registrations`
Pendaftaran KKN.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| student_id | bigint | FK → mahasiswas.id | Mahasiswa |
| period_id | bigint | FK → periode.id | Periode |
| group_id | bigint | FK → kelompok_kkn.id, Nullable | Kelompok |
| status | enum(pending,document_submitted,approved,rejected,completed) | Default: pending | Status |
| registration_date | timestamp | Current | Tanggal daftar |
| approved_at | timestamp | Nullable | Disetujui |
| approved_by | bigint | FK → users.id, Nullable | Approver |
| notes | text | Nullable | Catatan |
| eligibility_checked_at | timestamp | Nullable | Eligibility check |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** student_id, period_id, status

---

### `registration_documents`
Dokumen pendaftaran.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| registration_id | bigint | FK → registrations.id | Registration |
| document_type | enum(ktp,ktm,foto,cv,health_cert,other) | | Jenis dokumen |
| file_path | string | | Path file |
| file_name | string | | Nama file |
| file_size | integer | Nullable | Ukuran (bytes) |
| uploaded_at | timestamp | Current | |
| status | enum(pending,approved,rejected) | Default: pending | Status verifikasi |
| notes | text | Nullable | Catatan |

**Indexes:** registration_id

---

### `posko_kelompok`
Posko (basecamp) kelompok.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id, Unique | Kelompok |
| latitude | decimal(10,8) | | Koordinat lat |
| longitude | decimal(11,8) | | Koordinat long |
| gmaps_link | string | Nullable | Link Google Maps |
| photo_path | string | | Path foto |
| photo_name | string(255) | | Nama file |
| photo_size | bigint | Nullable | Ukuran file |
| uploaded_by | bigint | FK → users.id, Nullable | Uploader |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `program_kerja`
Program kerja KKN.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| title | string(200) | | Judul |
| description | text | Nullable | Deskripsi |
| objectives | text | Nullable | Tujuan |
| target_participants | integer | Nullable | Target peserta |
| budget | decimal(15,2) | Default: 0 | Anggaran |
| status | enum(draft,submitted,approved,rejected,completed) | Default: draft | Status |
| submitted_at | timestamp | Nullable | |
| approved_at | timestamp | Nullable | |
| approved_by | bigint | FK → users.id, Nullable | Approver |
| approval_notes | text | Nullable | |
| abcd_stage | enum(A,B,C,D,none) | Default: none | Stage ABCD |
| category | string | Nullable | Kategori |
| sdg_goals | json | Nullable | SDG goals |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** kelompok_id, status

---

### `kegiatan_kkn`
Kegiatan harian.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| mahasiswa_id | bigint | FK → mahasiswas.id | Mahasiswa |
| tanggal | date | | Tanggal |
| judul | string(200) | | Judul kegiatan |
| aktivitas | text | | Deskripsi aktivitas |
| output | text | Nullable | Output |
| status | enum(draft,submitted,approved,revision) | Default: draft | Status |
| reviewed_at | timestamp | Nullable | Direview |
| reviewed_by | bigint | FK → users.id, Nullable | Reviewer |
| review_notes | text | Nullable | |
| latitude | decimal(10,8) | Nullable | GPS latitude |
| longitude | decimal(11,8) | Nullable | GPS longitude |
| gps_accuracy | decimal(5,2) | Nullable | GPS accuracy (meters) |
| gps_timestamp | timestamp | Nullable | GPS timestamp |
| device_info | json | Nullable | Device info |
| abcd_stage | enum(A,B,C,D,none) | Default: none | Stage ABCD |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** kelompok_id, mahasiswa_id, tanggal, status

---

### `kegiatan_files`
File attachment kegiatan.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kegiatan_id | bigint | FK → kegiatan_kkn.id | Kegiatan |
| file_path | string | | Path file |
| file_name | string | | Nama file |
| file_type | string(50) | Nullable | MIME type |
| file_size | integer | Nullable | Ukuran |
| uploaded_at | timestamp | Current | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

## Grading & Evaluation

### `konfigurasi_penilaian`
Konfigurasi bobot penilaian.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| periode_id | bigint | FK → periode.id | Periode |
| component | string(50) | | Komponen (execution, article, dll) |
| weight | decimal(5,2) | | Bobot (%) |
| kkn_type | enum(reguler,tematik) | Nullable | Jenis KKN |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** periode_id, unique(periode_id, component)

---

### `nilai_kkn`
Nilai akhir KKN.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| mahasiswa_id | bigint | FK → mahasiswas.id | Mahasiswa |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| execution_score | decimal(5,2) | Nullable | Nilai pelaksanaan |
| article_score | decimal(5,2) | Nullable | Nilai artikel |
| discipline_score | decimal(5,2) | Nullable | Nilai kedisiplinan |
| attitude_score | decimal(5,2) | Nullable | Nilai sikap |
| dpl_weighted_score | decimal(5,2) | Nullable | Score DPL (weighted) |
| village_weighted_score | decimal(5,2) | Nullable | Score Desa (weighted) |
| total_score | decimal(5,2) | Nullable | Total nilai |
| letter_grade | char(2) | Nullable | Grade (A, B, C, D, E) |
| dpl_graded_by | bigint | FK → users.id, Nullable | Penilai DPL |
| village_graded_by | bigint | FK → users.id, Nullable | Penilai Desa |
| dpl_graded_at | timestamp | Nullable | |
| village_graded_at | timestamp | Nullable | |
| evidence_file | string | Nullable | Bukti pendukung |
| verification_token | string | Nullable | Token verifikasi |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** mahasiswa_id, kelompok_id, unique(mahasiswa_id, kelompok_id)

---

### `grading_configs`
Konfigurasi grading per komponen.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| period_id | bigint | FK → periode.id | |
| component_name | string(50) | | Nama komponen |
| weight | decimal(5,2) | | Bobot |
| min_score | decimal(5,2) | Default: 0 | Nilai minimum |
| max_score | decimal(5,2) | Default: 100 | Nilai maksimum |
| is_required | boolean | Default: true | Wajib diisi |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `evaluasi`
Evaluasi mahasiswa.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| student_id | bigint | FK → mahasiswas.id | Mahasiswa |
| group_id | bigint | FK → kelompok_kkn.id | Kelompok |
| evaluator_type | enum(dpl,peer,community) | | Tipe evaluator |
| evaluator_id | bigint | FK → users.id, Nullable | Evaluator |
| total_score | decimal(5,2) | Nullable | Total nilai |
| grade | string(2) | Nullable | Grade |
| notes | text | Nullable | Catatan |
| evaluated_at | timestamp | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `evaluation_items`
Item evaluasi.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| evaluation_id | bigint | FK → evaluasi.id | Evaluasi |
| criterion | string(100) | | Kriteria |
| score | decimal(5,2) | | Nilai |
| weight | decimal(5,2) | Default: 1.00 | Bobot |
| notes | text | Nullable | |

---

## Reports & Documents

### `laporan_harian`
Laporan harian (alternative naming).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| daily_report_id | bigint | FK → daily_reports.id | Report |
| is_offline | boolean | Default: false | Mode offline |
| synced_at | timestamp | Nullable | Sync timestamp |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `laporan_akhir`
Laporan akhir.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| final_report_id | bigint | FK → final_reports.id | Report |
| abcd_stage | enum(A,B,C,D) | | Stage ABCD |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `daily_reports`
Laporan harian.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| student_id | bigint | FK → mahasiswas.id | Mahasiswa |
| group_id | bigint | FK → kelompok_kkn.id | Kelompok |
| date | date | | Tanggal |
| title | string(200) | | Judul |
| activity | text | | Aktivitas |
| output | text | Nullable | Output |
| status | enum(draft,submitted,approved,revision) | Default: draft | Status |
| reviewed_at | timestamp | Nullable | |
| reviewed_by | bigint | FK → users.id, Nullable | |
| review_notes | text | Nullable | |
| reflection | text | Nullable | Refleksi |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** student_id, group_id, date, status

---

### `final_reports`
Laporan akhir.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| student_id | bigint | FK → mahasiswas.id | Mahasiswa |
| group_id | bigint | FK → kelompok_kkn.id | Kelompok |
| title | string(200) | | Judul |
| abstract | text | Nullable | Abstrak |
| file_path | string | Nullable | Path file |
| file_name | string | Nullable | Nama file |
| status | enum(draft,submitted,reviewed,approved,revision) | Default: draft | Status |
| submitted_at | timestamp | Nullable | |
| reviewed_at | timestamp | Nullable | |
| reviewed_by | bigint | FK → users.id, Nullable | |
| review_notes | text | Nullable | |
| score | decimal(5,2) | Nullable | Nilai |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `proposals`
Proposal kegiatan.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| group_id | bigint | FK → kelompok_kkn.id | Kelompok |
| title | string(200) | | Judul |
| file_path | string | | Path file |
| file_name | string | | Nama file |
| status | enum(pending,approved,rejected) | Default: pending | Status |
| submitted_at | timestamp | | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

## Workshop & Training

### `workshops`
Workshop/Pelatihan.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| title | string | | Judul |
| description | text | Nullable | Deskripsi |
| methodology | string | Nullable | Metodologi (ABCD, Participatory) |
| workshop_date | date | | Tanggal |
| start_time | time | Nullable | Waktu mulai |
| end_time | time | Nullable | Waktu selesai |
| location | string | Nullable | Lokasi |
| max_participants | integer | Nullable | Kuota |
| status | enum(scheduled,ongoing,completed,cancelled) | Default: scheduled | Status |
| use_qr_attendance | boolean | Default: false | QR attendance |
| qr_code | string | Nullable | QR code |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `workshop_participants`
Peserta workshop.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| workshop_id | bigint | FK → workshops.id | Workshop |
| user_id | bigint | FK → users.id | Peserta |
| registered_at | timestamp | Current | |
| attendance_status | enum(registered,attended,absent,excused) | Default: registered | Status |
| checked_in_at | timestamp | Nullable | Check-in time |
| certificate_generated | boolean | Default: false | Sertifikat |
| certificate_path | string | Nullable | Path sertifikat |
| certificate_issued_at | timestamp | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** workshop_id + user_id (unique)

---

## DPL Management

### `dpl_periods`
Periode penugasan DPL.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| dosen_id | bigint | FK → dosen.id | DPL |
| period_id | bigint | FK → periode.id | Periode |
| max_groups | integer | Default: 5 | Maksimal kelompok |
| is_active | boolean | Default: true | Status |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** dosen_id + period_id (unique)

---

### `dpl_kelompok`
Penugasan DPL ke kelompok.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| dpl_period_id | bigint | FK → dpl_periods.id | Periode DPL |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| assigned_at | timestamp | Current | |
| notes | text | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `dpl_kecamatan_assignments`
Tugas DPL per kecamatan.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| dpl_id | bigint | FK → dosen.id | DPL |
| period_id | bigint | FK → periode.id | Periode |
| district_id | integer | | ID kecamatan |
| district_name | string | | Nama kecamatan |
| assigned_at | timestamp | Current | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `monitoring_dpl`
Monitoring kunjungan DPL.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| dpl_id | bigint | FK → dosen.id | DPL |
| visit_date | date | | Tanggal kunjungan |
| report | text | | Laporan |
| recommendations | text | Nullable | Rekomendasi |
| latitude | decimal(10,8) | Nullable | GPS location |
| longitude | decimal(11,8) | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `izin_meninggalkans`
Izin meninggalkan lokasi.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| mahasiswa_id | bigint | FK → mahasiswas.id | Mahasiswa |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| reason | text | | Alasan |
| start_date | date | | Tanggal mulai |
| end_date | date | | Tanggal kembali |
| status | enum(pending,approved,rejected) | Default: pending | Status |
| approved_by | bigint | FK → users.id, Nullable | Approver |
| approved_at | timestamp | Nullable | |
| notes | text | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `absensi_harian`
Absensi harian.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id | Kelompok |
| mahasiswa_id | bigint | FK → mahasiswas.id | Mahasiswa |
| date | date | | Tanggal |
| status | enum(present,sick,permission,alpha) | | Status |
| notes | text | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** kelompok_id, date

---

## Student Lifecycle

### `registration_histories`
Riwayat pendaftaran.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| student_id | bigint | FK → mahasiswas.id | Mahasiswa |
| period_id | bigint | FK → periode.id | Periode |
| registration_status | enum | | Status |
| registered_at | timestamp | | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `group_members`
Anggota kelompok (pivot).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| group_id | bigint | FK → kelompok_kkn.id | Kelompok |
| student_id | bigint | FK → mahasiswas.id | Mahasiswa |
| role | enum | Default: member | Role |
| joined_at | timestamp | Current | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

## System & Infrastructure

### `system_settings`
Pengaturan sistem.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| key | string(100) | Unique | Setting key |
| value | text | Nullable | Setting value |
| type | string(20) | Default: string | Type |
| description | text | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `announcements`
Pengumuman.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| title | string | | Judul |
| content | text | | Konten |
| type | enum(info,news,warning) | Default: info | Tipe |
| is_published | boolean | Default: false | Published |
| published_at | timestamp | Nullable | |
| expires_at | timestamp | Nullable | |
| slug | string | Unique | URL slug |
| meta_title | string | Nullable | SEO title |
| meta_description | text | Nullable | SEO description |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `downloads`
Repository file download.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| title | string | | Judul |
| description | text | Nullable | |
| category | string | | Kategori |
| file_path | string | | Path |
| file_name | string | | Nama file |
| file_size | bigint | Nullable | Ukuran |
| download_count | integer | Default: 0 | Counter |
| is_published | boolean | Default: false | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `notifications`
Notifikasi internal.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | UUID | PK | |
| notifiable_type | string | Polymorphic | |
| notifiable_id | bigint | Polymorphic | |
| type | string | | Notification class |
| data | json | | Data |
| read_at | timestamp | Nullable | |
| created_at | timestamp | | |

**Indexes:** notifiable_type + notifiable_id

---

### `audit_logs`
Audit trail.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| log_name | string | | Log category |
| description | text | | Description |
| subject_type | string | Polymorphic | |
| subject_id | bigint | Polymorphic | |
| causer_type | string | Polymorphic | |
| causer_id | bigint | Polymorphic | |
| properties | json | | Properties |
| event | string | | Event name |
| batch_uuid | UUID | Nullable | Batch ID |
| created_at | timestamp | | |

**Indexes:** subject_type+subject_id, causer_type+causer_id, log_name

---

### `api_keys`
API keys untuk akses eksternal.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| project_id | bigint | FK → projects.id | Project |
| name | string(100) | | Nama key |
| key | string(64) | Unique, Hashed | API key |
| abilities | json | | Abilities |
| last_used_at | timestamp | Nullable | |
| expires_at | timestamp | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `projects`
Projects untuk API management.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| name | string(100) | | Nama project |
| description | text | Nullable | |
| owner_id | bigint | FK → users.id | Owner |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `konfigurasi_sertifikat`
Konfigurasi sertifikat.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| name | string | | Nama konfigurasi |
| template_path | string | | Path template |
| signature_image | string | Nullable | Tanda tangan |
| is_active | boolean | Default: true | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

### `user_profiles`
Profil pengguna (polymorphic).

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| user_id | bigint | FK → users.id | User |
| profileable_type | string | Polymorphic | Model type |
| profileable_id | bigint | Polymorphic | Model ID |
| phone | string(20) | Nullable | |
| address | text | Nullable | |
| avatar | string | Nullable | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

**Indexes:** profileable_type + profileable_id

---

### `rekapitulasi_kegiatan`
Rekapitulasi kegiatan.

| Column | Type | Attributes | Description |
|--------|------|------------|-------------|
| id | bigint | PK, Auto | |
| kelompok_id | bigint | FK → kelompok_kkn.id | |
| periode_id | bigint | FK → periode.id | |
| total_kegiatan | integer | Default: 0 | |
| total_participants | integer | Default: 0 | |
| sdg_breakdown | json | Nullable | |
| abcd_breakdown | json | Nullable | |
| generated_at | timestamp | | |
| created_at | timestamp | | |
| updated_at | timestamp | | |

---

## Relationships Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MASTER DATA                                  │
├─────────────────────────────────────────────────────────────────┤
│  faculties ──┬── programs                                       │
│              ├── dosen                                          │
│              ├── mahasiswa ──┬── users                          │
│              │               └── registrations                  │
│              ├── locations                                        │
│              └── academic_years ── periode                       │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    KKN OPERATIONS                               │
├─────────────────────────────────────────────────────────────────┤
│  periode ──┬── kelompok_kkn ──┬── peserta_kkn                   │
│            │                  ├── program_kerja                  │
│            │                  ├── kegiatan_kkn                   │
│            │                  ├── posko_kelompok                 │
│            │                  └── laporan_akhir                  │
│            │                                                      │
│            ├── dpl_periods ── dpl_kelompok                       │
│            │                                                      │
│            └── konfigurasi_penilaian ── nilai_kkn                │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    WORKSHOP & TRAINING                          │
├─────────────────────────────────────────────────────────────────┤
│  workshops ── workshop_participants                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Index Summary

### Performance Indexes
- **High Traffic Tables:** registrations, kegiatan_kkn, daily_reports
- **Foreign Keys:** All FK columns indexed
- **Unique Constraints:** NIM, NIP, email, tokens
- **Composite Indexes:** (periode_id, component), (mahasiswa_id, kelompok_id)

### Soft Deletes
Tables with soft deletes:
- mahasiswa
- dosen
- kelompok_kkn
- peserta_kkn

---

## Database Conventions

### Naming
- Table names: snake_case, plural
- Columns: snake_case
- Primary keys: id (bigint)
- Timestamps: created_at, updated_at

### Data Types
- IDs: bigint (auto-increment)
- Strings: varchar with explicit length
- Text: text for long content
- Decimals: decimal(5,2) for scores, decimal(15,2) for money
- Dates: date for dates, timestamp for datetime
- Boolean: boolean (tinyint(1))

### Foreign Keys
- Convention: {table}_id
- Cascade on delete for child records
- Null on delete for optional relationships

---

**Dokumentasi ini dibuat otomatis berdasarkan migration files.**
**Last Updated:** 2026-04-10
