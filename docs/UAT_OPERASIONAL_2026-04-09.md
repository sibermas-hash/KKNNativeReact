# UAT Operasional 2026-04-09

Dokumen ini merangkum pengecekan operasional berbasis role setelah penyesuaian alur KKN reguler sesuai panduan, termasuk perbaikan runtime pada modul evaluasi DPL.

## Ringkasan

- Status backend: lulus
- Hasil full test suite: `348 passed`, `1 skipped`, `1843 assertions`
- Status frontend build: sebelumnya lulus pada putaran terakhir
- Status smoke test runtime: lulus pada route utama admin, DPL, dan mahasiswa
- Temuan aktif yang diperbaiki pada putaran ini:
  - `/dpl/evaluasi` sempat gagal di PostgreSQL karena query ambigu pada relasi kelompok DPL
  - perbaikan dilakukan dengan mengkualifikasi kolom `kelompok_kkn.id` di `EvaluationController`

## Hasil UAT per Role

### Superadmin / Admin

- Login berhasil
- `/admin` -> `200`
- `/admin/periode` -> `200`
- `/admin/pendaftaran` -> `200`
- `/admin/kelompok` -> `200`
- `/admin/workshops` -> `200`
- `/admin/dpl/assignment` -> `200`
- `/admin/mahasiswa/sinkron` -> `200`
- `/admin/dosen/sinkron` -> `200`
- `/admin/nilai` -> `200`
- `/admin/rekap-nilai` -> `200`
- `/admin/pendaftaran/ekspor` -> `200`
- `/admin/pendaftaran/ekspor-bpjs` -> `200`
- `/admin/kelompok/template` -> `200`
- `/admin/rekap-nilai/ekspor` -> `200`
- `/admin/rekap-nilai/ekspor-ledger` -> `200`

### Faculty Admin

- Login berhasil
- `/admin` -> `200`
- `/admin/rekap-nilai` -> `200`
- `/admin/pendaftaran` -> `200`
- akses yang memang dibatasi tetap tertolak sesuai harapan:
  - `/admin/rekap-nilai/ekspor` -> `403`
  - `/admin/workshops` -> `403`
  - `/admin/dpl/assignment` -> `403`

### DPL

- Login berhasil
- `/dpl` -> `200`
- `/dpl/kelompok` -> `200`
- `/dpl/laporan-harian` -> `200`
- `/dpl/laporan-akhir` -> `200`
- `/dpl/evaluasi` -> `200`

Catatan:
- Route evaluasi DPL sebelumnya gagal karena `pluck('id')` pada relasi many-to-many menghasilkan kolom ambigu di PostgreSQL.
- Sudah ditambah regression test agar bug ini tidak terulang.

### Mahasiswa Ketua

- Login berhasil
- `/mahasiswa` -> `200`
- `/mahasiswa/pendaftaran` -> `302`
  - perilaku ini sesuai karena akun contoh sudah memiliki pendaftaran yang terkunci/approved
- `/mahasiswa/workshops` -> `200`
- `/mahasiswa/posko` -> `200`
- `/mahasiswa/laporan-harian` -> `200`
- `/mahasiswa/laporan-akhir` -> `200`

### Mahasiswa Biasa

- Login berhasil
- `/mahasiswa` -> `200`
- `/mahasiswa/pendaftaran` -> `200`
- `/mahasiswa/workshops` -> `200`
- `/mahasiswa/posko` -> `403`
  - perilaku ini sesuai karena akun contoh belum berhak mengelola posko

## Verifikasi Test Terarah

### Admin / Faculty

Lulus:

- `PeriodManagementTest`
- `AdminRegistrationReviewTest`
- `GroupManagementWorkflowTest`
- `AdminDplAssignmentTest`
- `AdminWorkshopsManagementTest`
- `FacultyAdminRekapNilaiTest`

### DPL / Mahasiswa

Lulus:

- `DplModuleTest`
- `StudentBpjsProfileTest`
- `StudentRegistrationFlowTest`
- `StudentOperationalPagesTest`
- `StudentPoskoTest`
- `StudentDailyReportFullWorkflowTest`

## Kesimpulan

Sistem saat ini siap dipakai untuk testing operasional harian dengan fondasi berikut:

- alur pendaftaran mahasiswa reguler mengikuti pola `daftar -> review admin -> penempatan sistem`
- pembatasan akses role utama berjalan sesuai ekspektasi
- modul DPL, mahasiswa, dan admin yang paling sensitif telah lolos smoke test runtime
- baseline backend kembali hijau penuh setelah perbaikan evaluasi DPL

## Rekomendasi Lanjutan

- Jalankan checklist di `docs/CHECKLIST_UAT_PER_ROLE.md` bersama operator nyata
- Catat temuan UX atau copy yang masih membingungkan saat dipakai di lapangan
- Lakukan hardening akhir environment produksi sebelum go-live
