Implementasi Fondasi Persyaratan Dinamis KKN (2026-04-28)

Ringkasan perubahan:
- Tambah migrasi untuk menambahkan kolom JSON:
  - jenis_kkn.requirements_config (JSON)
  - jenis_kkn.attendance_config (JSON)
  - periode.settings_override (JSON)
- Perbarui Model JenisKkn untuk mengisi dan melakukan cast kolom JSON baru.
- Perbarui Admin/JenisKknController agar menerima requirements_config dan attendance_config pada store/update.
- Tambah layanan bantu RequirementBuilderService untuk memvalidasi format konfigurasi.

Langkah berikutnya:
- Implementasi Admin Requirement Builder UI (frontend).
- Integrasi validasi hybrid di RegistrationPortalService.
- Tambahkan test otomatis untuk alur pendaftaran dinamis.

Catatan: jalankan `php artisan migrate` di environment pengembangan untuk menerapkan skema.
