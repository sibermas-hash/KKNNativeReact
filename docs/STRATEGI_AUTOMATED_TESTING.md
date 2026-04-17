# Strategi Automated Testing

Dokumen ini menjelaskan bagaimana proyek KKN ini sebaiknya dikelola agar mendekati `release-ready`: version control, automated testing, debugging, breakpoint, peran tester, dan quality gate.

Rujukan teknis:
- [composer.json](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/composer.json)
- [package.json](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/package.json)
- [phpunit.xml](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/phpunit.xml)
- [tests/Concerns/RefreshPostgresDatabase.php](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/tests/Concerns/RefreshPostgresDatabase.php)

## Tujuan

- mencegah refactor merusak alur inti
- memastikan bug yang sudah diperbaiki tidak kambuh
- membuat keputusan merge dan release berbasis bukti

## 1. Version Control yang Disarankan

Struktur branch:
- `main`: kandidat produksi
- `develop`: integrasi harian
- `feature/<nama-fitur>`: pengembangan fitur
- `fix/<nama-perbaikan>`: perbaikan bug
- `hotfix/<nama-hotfix>`: perbaikan darurat dari produksi

Aturan kerja:
- satu task satu branch
- semua merge lewat pull request
- jangan commit langsung ke `main`
- setiap PR wajib menyebut:
  - tujuan perubahan
  - risiko
  - cara uji

Format commit yang disarankan:
- `feat: tambah validasi pendaftaran`
- `fix: perbaiki route laporan akhir`
- `test: tambah regression test approval`
- `refactor: rapikan service grading`

## 2. Lapisan Automated Testing

### A. Unit Test

Untuk:
- service murni
- helper
- perhitungan nilai
- rule eligibility

Lokasi:
- [tests/Unit](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/tests/Unit)

Target yang cocok untuk proyek ini:
- grading
- governance periode
- rule penempatan kelompok
- sinkronisasi data master

### B. Feature Test

Untuk:
- alur HTTP Laravel
- middleware
- otorisasi role
- redirect, validasi, dan persistence

Lokasi:
- [tests/Feature](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/tests/Feature)

Ini adalah lapisan terpenting untuk proyek Anda saat ini.

### C. Frontend Component Test

Untuk:
- komponen React reusable
- validasi UI dasar
- state perubahan pada komponen kompleks

Tooling yang sudah ada:
- `vitest`
- `@testing-library/react`
- `jsdom`

Lokasi contoh:
- [resources/js/Components/__tests__/DashboardCard.test.tsx](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/resources/js/Components/__tests__/DashboardCard.test.tsx)

### D. End-to-End Test

Ini lapisan yang masih paling layak ditambahkan.

Saran:
- tambahkan `Playwright`

Script yang dipakai di proyek ini:

```bash
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run test:e2e:install
```

Alur E2E prioritas:
- login
- pendaftaran mahasiswa
- review admin
- penugasan DPL
- input laporan harian
- ekspor admin

## 3. Quality Gate Sebelum Merge

Minimal setiap branch harus lolos:

```bash
php artisan test
npm run test
npm run build
npm run lint
```

Gate gabungan yang sekarang tersedia:

```bash
npm run quality:gate
npm run quality:gate:full
```

Gate tambahan yang disarankan:

```bash
./vendor/bin/pint
php artisan phpstan
```

## 4. Quality Gate Sebelum Release

Sebelum release ke staging atau production:
- seluruh test otomatis inti hijau
- tidak ada blocker
- tidak ada critical
- alpha testing selesai
- beta testing minimal satu putaran
- checklist readiness produksi diperiksa

## 5. Alur CI yang Disarankan

Urutan pipeline:
1. install dependency
2. lint frontend
3. build frontend
4. jalankan backend tests
5. jalankan frontend tests
6. publish artefak atau tandai siap review

Kalau belum ada CI, mulai dulu dari local discipline:
- developer wajib jalankan perintah di atas sebelum membuka PR

## 6. Kondisi Khusus Proyek Ini

Ada satu catatan penting: baseline backend test sangat bergantung pada PostgreSQL testing di [phpunit.xml](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/phpunit.xml) dan trait [RefreshPostgresDatabase.php](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/tests/Concerns/RefreshPostgresDatabase.php).

Artinya:
- `php artisan test` baru bisa dipercaya jika database test benar-benar sehat
- jangan anggap suite rusak total sebelum memastikan koneksi `kkn_test` stabil
- perbaikan pada harness testing harus dianggap prioritas

## 7. Strategi Prioritas Test

Untuk proyek ini, urutan paling bernilai adalah:

### Prioritas 1

- login dan auth
- pendaftaran mahasiswa
- approval admin
- penempatan kelompok
- DPL monitoring

### Prioritas 2

- laporan harian
- program kerja
- laporan akhir
- penilaian

### Prioritas 3

- sinkronisasi data master
- unduhan
- konten publik
- visual regression ringan

## 8. Debugging

### Debugging Backend

Gunakan:
- `storage/logs/laravel.log`
- `php artisan pail`
- `logger()`
- `dump()` atau `dd()` secara sementara

Jangan biarkan `dd()` tertinggal di branch yang akan di-merge.

### Debugging Frontend

Gunakan:
- browser DevTools
- tab `Console`
- tab `Network`
- React DevTools
- `console.log()` secukupnya lalu bersihkan

## 9. Breakpoint

### PHP Breakpoint

Gunakan Xdebug di VS Code atau PHPStorm.

Breakpoint paling berguna dipasang di:
- controller yang menerima request
- service bisnis inti
- middleware auth/phase

Contoh area sensitif:
- pendaftaran mahasiswa
- approval admin
- perhitungan nilai
- penempatan kelompok

### Frontend Breakpoint

Gunakan browser DevTools atau `debugger;` sementara pada file `.tsx`.

Cocok untuk:
- alur form
- masalah Inertia props
- route helper frontend
- bug state React

## 10. Peran Software Tester / QA

Jika belum ada QA khusus, bagi peran seperti ini:

### Developer

- menulis unit/feature test
- memperbaiki bug
- membuat regression test setelah bug fix

### Tester / QA

- menjalankan alpha dan beta testing
- mendokumentasikan bug
- retest setelah perbaikan

### Product / Operator

- memvalidasi apakah alur sesuai kebutuhan lapangan
- memutuskan severity dari sisi bisnis

## 11. Definition of Done

Satu task dianggap selesai jika:
- fitur berjalan
- validasi utama aman
- role access benar
- regression test ditambahkan jika layak
- lint/build/test yang relevan lolos
- bug report lama yang terkait sudah ditutup

## 12. Roadmap 4 Minggu yang Realistis

### Minggu 1

- stabilkan harness backend test
- rapikan test database
- pastikan `php artisan test` bisa jadi verdict

### Minggu 2

- tambah feature test untuk alur inti
- tambah component test untuk UI penting

### Minggu 3

- tambah Playwright untuk 3 sampai 5 alur paling kritis
- mulai alpha testing internal

### Minggu 4

- jalankan beta testing terbatas
- bug bash final
- freeze kandidat release

## 13. Metrik yang Perlu Dipantau

- jumlah blocker aktif
- jumlah critical aktif
- persentase skenario alpha yang lolos
- jumlah bug reopen
- waktu rata-rata perbaikan bug
- tren hasil test otomatis

## 14. Aturan Emas

- jangan refactor besar tanpa test pengaman
- jangan merge hanya karena build sukses
- setiap bug penting yang pernah muncul sebaiknya diberi regression test
- kalau test otomatis dan testing manual bertentangan, investigasi sampai akar masalahnya ketemu
