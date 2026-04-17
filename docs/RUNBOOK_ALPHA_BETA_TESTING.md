# Runbook Alpha Beta Testing

Dokumen ini menjadi panduan kerja untuk menjalankan alpha testing, beta testing, dan bug bash pada sistem KKN. Fokusnya adalah membuat pengujian terstruktur, terukur, dan bisa diulang.

Rujukan utama:
- [Checklist UAT Per Role](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/CHECKLIST_UAT_PER_ROLE.md)
- [Template Laporan Bug](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/TEMPLATE_LAPORAN_BUG.md)
- [Strategi Automated Testing](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/STRATEGI_AUTOMATED_TESTING.md)
- [Checklist Readiness Produksi](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/CHECKLIST_READINESS_PRODUKSI.md)

## Tujuan

- memastikan alur inti sistem bisa dipakai dari sudut pandang pengguna nyata
- menemukan bug fungsional, bug akses role, bug data, dan kebingungan UX sebelum rilis
- memisahkan temuan `blocker`, `critical`, `major`, dan `minor`
- memastikan keputusan rilis didasarkan pada bukti, bukan asumsi

## Definisi

### Alpha Testing

Pengujian internal oleh tim pengembang, operator internal, atau orang yang masih dekat dengan proyek. Tujuannya mencari masalah logika, integrasi, dan alur bisnis.

### Beta Testing

Pengujian terbatas oleh pengguna nyata di luar tim inti. Tujuannya menguji apakah sistem benar-benar bisa dipahami dan dipakai secara natural.

### Bug Bash / Bug Hunter

Sesi berburu bug dalam waktu singkat dengan fokus mencari error, kebocoran akses, copy membingungkan, dan langkah yang terasa patah.

## Lingkungan yang Dipakai

Gunakan lingkungan yang konsisten:
- `local-dev` untuk eksplorasi awal dan debugging cepat
- `staging` untuk alpha final dan beta testing
- jangan gunakan produksi untuk eksperimen bug hunting

Prasyarat minimum:
- database staging terpisah dari database kerja harian
- data demo realistis tersedia
- role penting tersedia: `admin`, `faculty_admin`, `dpl`, `mahasiswa ketua`, `mahasiswa biasa`
- build frontend terbaru tersedia
- log aplikasi aktif dan mudah dibaca

## Data Uji yang Wajib Ada

Siapkan minimal:
- 1 periode aktif
- 1 periode nonaktif/selesai
- beberapa mahasiswa dengan status profil berbeda
- pendaftaran `pending`, `approved`, dan `rejected`
- minimal 2 kelompok
- minimal 1 DPL aktif
- contoh laporan harian, program kerja, laporan akhir, dan nilai

## Alpha Testing

### Peserta Alpha

- 1 orang backend/dev utama
- 1 orang frontend/dev utama
- 1 operator admin
- 1 user simulasi DPL
- 1 user simulasi mahasiswa

### Scope Alpha

Jalankan dulu alur inti:
- login
- ganti password jika wajib
- profil mahasiswa
- pendaftaran KKN
- review admin
- penempatan kelompok
- monitoring DPL
- laporan harian
- program kerja
- laporan akhir
- penilaian dan sertifikat

### Cara Menjalankan

1. Tentukan build atau commit yang diuji.
2. Freeze perubahan selama sesi alpha.
3. Jalankan [Checklist UAT Per Role](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/CHECKLIST_UAT_PER_ROLE.md) dari awal sampai akhir.
4. Setiap kegagalan langsung dicatat dengan [Template Laporan Bug](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/TEMPLATE_LAPORAN_BUG.md).
5. Setelah sesi selesai, kelompokkan bug menurut prioritas.

### Exit Criteria Alpha

Alpha dianggap lolos jika:
- tidak ada `blocker`
- tidak ada `critical` pada alur inti
- semua role utama berhasil login dan bekerja
- tidak ada error `500` di alur inti
- semua ekspor penting berhasil diunduh

## Beta Testing

### Tujuan Beta

- menguji apakah pengguna nyata memahami sistem tanpa penjelasan teknis
- menguji istilah, navigasi, dan urutan langkah
- menangkap bug yang hanya muncul pada penggunaan realistis

### Peserta Beta

Rekomendasi awal:
- 2 admin/operator
- 2 DPL
- 5 sampai 10 mahasiswa
- 1 koordinator yang mengumpulkan feedback

### Aturan Beta

- gunakan staging, bukan produksi
- jangan lakukan deploy besar di tengah sesi
- berikan panduan singkat, bukan tutorial panjang
- minta pengguna mengerjakan tugas nyata, bukan sekadar klik acak

### Contoh Tugas Beta

- mahasiswa melengkapi profil dan mendaftar
- admin memverifikasi pendaftaran
- DPL membuka kelompok binaan dan meninjau laporan
- admin mengekspor data operasional

### Exit Criteria Beta

Beta dianggap sehat jika:
- tidak ada `blocker`
- mayoritas pengguna bisa menyelesaikan alur utama tanpa bantuan intensif
- tidak ada kebocoran hak akses
- istilah dan tombol utama dipahami dengan baik

## Bug Bash / Bug Hunter

### Format Sesi

- durasi 60 sampai 120 menit
- semua orang fokus ke area berbeda
- satu orang bertindak sebagai triage lead

### Distribusi Fokus

- admin operasional
- mahasiswa
- DPL
- ekspor dan dokumen
- role/permission
- mobile/responsive

### Aturan Bug Bash

- setiap bug wajib bisa direproduksi
- satu bug satu laporan
- jangan campur tiga masalah dalam satu tiket
- sertakan screenshot atau video singkat

### Severity

- `Blocker`: sistem tidak bisa dipakai atau data tidak bisa diproses
- `Critical`: alur inti gagal atau data salah
- `Major`: fitur penting terganggu tapi ada jalan memutar
- `Minor`: masalah UX, validasi, copy, atau styling
- `Trivial`: kosmetik kecil

## Format Pelaporan Hasil

Setelah satu sesi testing, buat rekap:

### Ringkasan

- build/commit yang diuji
- tanggal pengujian
- peserta
- jumlah skenario lulus
- jumlah bug per severity

### Temuan Utama

- daftar blocker
- daftar critical
- daftar major
- daftar minor

### Keputusan

- `lanjut perbaikan`
- `ulang alpha`
- `siap beta`
- `siap rilis`

## Jadwal yang Disarankan

### Minggu Kerja Ringan

1. Senin: stabilisasi branch dan deploy ke staging
2. Selasa: alpha testing internal
3. Rabu: perbaikan temuan alpha
4. Kamis: beta testing terbatas
5. Jumat: bug bash final dan keputusan rilis

## Peran Tim

### Developer

- memperbaiki bug
- menambah regression test
- membantu reproduksi

### Tester / QA

- menjalankan checklist
- menulis bug report
- memvalidasi bug fix

### Product / Operator Lead

- menentukan prioritas
- memutuskan bug mana yang wajib beres sebelum rilis
- menilai apakah UX cukup jelas

## Catatan Penting

- jangan gabungkan testing dengan refactor besar
- jangan menilai sistem sehat hanya karena build berhasil
- jangan anggap bug kecil tidak penting jika muncul berulang
- setiap bug yang sudah diperbaiki sebaiknya punya regression test bila memungkinkan
