Pantauan Implementasi: Persyaratan KKN Dinamis (DYNAMIC-KKN-REQUIREMENTS)

Tujuan

Memonitor dan memverifikasi bahwa spesifikasi pada docs/diskusi/01-DYNAMIC-KKN-REQUIREMENTS.md diimplementasikan sesuai kebijakan dan acceptance criteria.

Ruang lingkup pemantauan

- Fitur utama: Hybrid Requirements (file upload + database checks), Dynamic Attendance, Solo-Group bypass, dan konfigurasi JSON pada JenisKkn/Periode.
- Lokasi kode signifikan: app/Models/KKN/JenisKkn.php, app/Models/KKN/Periode.php, app/Services/RegistrationPortalService.php, app/Services/KKN/PeriodeGovernanceService.php, app/Http/Controllers/Student/KknDaftarController.php, resources/js/Pages/Student/**, resources/js/Pages/Admin/**.

Acceptance Criteria (Harus dipenuhi)

1. Kolom konfigurasi JSON ada dan tercasting pada model (requirements_config, attendance_config).
2. Admin Requirement Builder (backend) tersedia dan dapat menyimpan konfigurasi berbentuk JSON.
3. UI pendaftaran merender form dinamis berdasarkan konfigurasi jenis KKN.
4. Validasi hybrid: database checks berjalan (SKS, IPK, BTA-PPI) dan upload dokumen tercatat untuk verifikasi manual.
5. Alur KKN Mandiri (Solo-Group) bekerja: kelompok dengan capacity=1 dibuat, lokasi domisili disimpan, dan penempatan tidak terganggu oleh batch placement.
6. Tes otomatisitas: unit/integration tests yang menutup minimal satu skenario per mode (open/selective/proposal_based) ada dan lulus.
7. Dokumentasi /docs diupdate untuk setiap PR yang mengubah perilaku pendaftaran/penempatan (masuk ke docs/changes dengan template).

Tindakan pemantauan

- Setiap PR yang menyentuh file pada lokasi kode signifikan di-scan secara manual atau lewat CI untuk:
  - Memastikan ada perubahan docs/changes/* sesuai template.
  - Memastikan ada test baru atau modifikasi test yang relevan.
  - Memastikan migration (jika perlu) disertakan dan dijelaskan.
- Jalankan checklist verifikasi lokal (atau CI):
  1. php artisan migrate --pretend untuk melihat perubahan skema.
  2. Jalankan unit tests: php artisan test dan npm test.
  3. Uji end-to-end manual singkat: buat JenisKkn baru via Admin UI dengan requirements_config, lalu akses UI pendaftaran sebagai mahasiswa dan verifikasi dynamic form.

Pelaporan & Tanggung jawab

- Pelapor otomatis: buat entry di docs/changes/ setiap kali fitur selesai (PR merged).
- Penanggung jawab pemantauan awal: Tim Pengembang (sebutkan nama) — jika tidak ada, QA tim.
- Frekuensi pemeriksaan: setiap PR; re-check mingguan untuk backlog PR.

Langkah selanjutnya yang direkomendasikan

- Tambahkan CI check yang memblokir merge bila PR mengubah kode di area kritis tanpa docs/changes update.
- Buat test suite khusus untuk flow pendaftaran dinamis (integrasi antara RegistrationPortalService dan front-end rendering).

Catatan: dokumen ini bertujuan sebagai panduan pemantauan. Untuk otomasi penuh, siapkan workflow CI yang memeriksa kesesuaian PR (docs + tests + migrations).
