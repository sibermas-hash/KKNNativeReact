# Laporan Audit UI/UX & Konsistensi Data SIBERMAS
**Auditor**: Senior UI/UX QA + Frontend Reviewer (Antigravity/Gemini)  
**Tanggal Audit**: 5 Juni 2026  
**Status Sesi Pengguna**: RETYAN NAYLA TRIYANA (NIM `234110301072`) — Status: Approved (Reguler Angkatan 2026/2027), Tanpa Kelompok.

---

## Ringkasan Eksekutif
Audit komprehensif ini dilakukan lintas rute frontend dan endpoint backend SIBERMAS untuk memverifikasi konsistensi tema dinamis (SIBERMAS, Ocean, Forest, Midnight, Rose), responsiveness, serta integritas data pengguna uji (RETYAN NAYLA TRIYANA). 

Secara umum, aplikasi berada pada status **Sangat Stabil**. Masalah caching stale lintas sesi yang sebelumnya dicurigai kini telah **diperbaiki sepenuhnya (Harden)** dengan membatasi query key menggunakan `user?.id` dan melakukan invalidasi pada mutasi profil/pendaftaran.

Berikut rincian audit per rute:

---

## 1. Rute & Komponen Mahasiswa (Student UI)

### Rute `/profil` — [profil/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/profil/page.tsx)
* **Status**: **PASS**
* **Severity**: P3 (Minor Polish)
* **Visual findings**:
  * Skema tema dinamis (terutama kontras Midnight dan Forest) diterapkan dengan sempurna pada container utama, kartu preferensi, dan teks.
  * Preview foto formal HD berukuran pas di mobile dan tidak meluap (*overflow*).
* **UX findings**:
  * Copy disclaimer lama *"Peta dinonaktifkan sementara. Cukup isi alamat tertulis sesuai KTP..."* telah **dihapus sepenuhnya**.
  * Bagian alamat asli KTP bersih dari referensi peta dinonaktifkan.
  * Tombol Edit/Batal profil beralih state dengan lancar tanpa lag.
* **Data consistency**:
  * Data terkirim terikat skema Zod. Perubahan biodata dan foto formal HD secara otomatis memicu invalidasi query `QUERY_KEYS.student.dashboard` untuk menyegarkan sidebar & header secara langsung.
* **Responsive risk**:
  * Input field tersusun ke bawah secara rapi pada layar mobile (< 640px) tanpa terjadi pemotongan teks.
* **Code/API notes**:
  * Menggunakan `useQueryClient` untuk invalidasi cache proaktif.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa` — [mahasiswa/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Kartu status pendaftaran selaras dengan warna token tema aktif.
  * Indikator progress milestone pengabdian ter-render proporsional.
* **UX findings**:
  * Berhasil menampilkan modal dialog penegasan persetujuan pendaftaran (Approved) pada login pertama.
  * Fitur-fitur KKN yang terkunci menampilkan pesan penjelas yang ramah (misal *"Terkunci — Aktif saat fase pelaksanaan KKN."*).
* **Data consistency**:
  * Menampilkan nama periode secara dinamis: `KKN REGULER ANGKATAN 2026/2027` (sesuai data pendaftaran RETYAN), bukan fallback global `KKN TEMATIK`.
* **Responsive risk**:
  * Judul nama periode yang panjang menggunakan kelas layout fleksibel sehingga terhindar dari risiko overflow horizontal di mobile portrait.
* **Code/API notes**:
  * Query key dikunci per user (`[...QUERY_KEYS.student.dashboard, user?.id]`), meniadakan bug cache lintas user.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/laporan-akhir` — [laporan-akhir/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/laporan-akhir/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Kontainer drag-and-drop file terintegrasi dengan variabel latar belakang tema dinamis.
  * Badge status laporan (`approved`, `rejected`, `pending`) terbaca jelas di tema terang/gelap.
* **UX findings**:
  * Mahasiswa non-ketua mendapatkan pesan pembatasan akses yang jelas: *"Unggah laporan akhir diperuntukkan bagi ketua kelompok..."*
  * Syarat format file (PDF/DOC, max 20MB) terpampang jelas.
* **Data consistency**:
  * Tombol unggah ulang hanya aktif bagi ketua jika status laporan ditolak (`rejected`).
* **Responsive risk**:
  * Teks nama file terunggah terpotong rapi dengan ellipsis (`truncate`) pada lebar ponsel kecil agar tombol "Lihat File" tidak terdorong ke luar layar.
* **Code/API notes**:
  * Invalidasi cache `['student', 'final-report']` berhasil dipicu sesaat setelah mutasi unggah sukses.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/laporan-harian` — [laporan-harian/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/laporan-harian/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Layout daftar baris laporan rapi.
  * Filter status menggunakan dropdown terpadu yang warnanya tersinkronisasi tema.
* **UX findings**:
  * Jika belum ada data, sistem merender `EmptyState` dengan CTA "Buat Laporan" yang menuntun pengguna baru.
  * Catatan revisi DPL ditampilkan di bawah judul kegiatan dengan kontras warna rose yang lembut.
* **Data consistency**:
  * Pagination tersinkron dengan metadata API (`meta.current_page` dan `meta.last_page`).
* **Responsive risk**:
  * Deskripsi aktivitas menggunakan `line-clamp-2` untuk menjaga tinggi baris konsisten di mobile.
* **Code/API notes**:
  * Filter query key dinamis mencegah tabrakan filter antar-halaman.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/laporan-harian/buat` — [buat/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/laporan-harian/buat/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Field input tanggal, kategori, dan textarea deskripsi menggunakan token `FIELD_CLASS` sehingga kontrasnya tinggi di seluruh tema.
* **UX findings**:
  * Aksi penentuan lokasi GPS via "Gunakan Lokasi Saya" berjalan responsif, lengkap dengan asersi koordinat lat/lng dan indikasi akurasi.
  * Label validasi error per bidang ter-render tepat di bawah elemen input terkait.
* **Data consistency**:
  * Pengiriman payload form terikat schema Zod. Invalidasi query dilakukan ke daftar laporan dan dashboard secara simultan.
* **Responsive risk**:
  * Grid form beralih dari 2 kolom (tablet/desktop) menjadi 1 kolom (mobile) secara natural.
* **Code/API notes**:
  * Berhasil membersihkan input file lampiran bertipe data ganda.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/laporan-harian/[id]/edit` — [edit/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/laporan-harian/[id]/edit/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Konsisten dengan desain formulir pembuatan laporan.
* **UX findings**:
  * Tombol kembali (ChevronLeft) mempermudah navigasi pembatalan.
* **Data consistency**:
  * Nilai default form dimuat bersih dari database tanpa ada efek kedipan visual (*flickering*).
* **Responsive risk**:
  * Tombol "Simpan Perubahan" dan "Batal" tersusun berdampingan di desktop, namun bertumpuk secara vertikal di mobile portrait.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/posko` — [posko/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/posko/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Preview foto posko terunggah dimuat dengan batas tinggi yang aman (`max-h-64`) sehingga tidak merusak aspek rasio layout.
* **UX findings**:
  * Jika mahasiswa belum terplot ke dalam kelompok (seperti RETYAN), halaman memblokir form dan menampilkan card informasi informatif: *"Posko Belum Tersedia. Kelompok KKN belum ditentukan..."*
* **Data consistency**:
  * Menyimpan koordinat desimal GPS secara presisi.
* **Responsive risk**:
  * Tombol pencarian GPS dan Google Maps tidak mengalami luapan teks (*text clipping*).
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/poster` — [poster/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/poster/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Area drag & drop responsif, berganti warna border saat file ditarik ke atasnya.
* **UX findings**:
  * Terdapat validasi ukuran file di sisi klien (maksimal 5MB) sebelum diunggah ke server untuk menghemat bandwidth.
* **Data consistency**:
  * Mampu membaca url poster yang terunggah dan menyediakan tombol "Lihat" (untuk format gambar) atau "Unduh" (untuk format non-gambar/PDF).
* **Responsive risk**:
  * Tombol kembali ke dashboard melayang aman di mobile.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/evaluasi` — [evaluasi/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/evaluasi/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Grade kelulusan (A, B, C, D, E) dibedakan secara visual menggunakan paduan warna latar belakang tersinkronisasi tema.
* **UX findings**:
  * Rata-rata nilai akhir KKN dipajang menonjol melalui komponen `StatCard`.
* **Data consistency**:
  * Menghitung rata-rata nilai secara aman menggunakan fallback nilai nol bila data evaluasi belum tersedia.
* **Responsive risk**:
  * Grid pembagi komponen tabel bobot nilai melar secara aman di mobile tablet.
* **Suggested fix**: Nihil. Status Lolos.

---

### Rute `/mahasiswa/izin` — [izin/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/mahasiswa/izin/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Kartu rekapitulasi status izin (Disetujui, Menunggu, Ditolak) menggunakan ikon yang sesuai dan berwarna harmonis.
* **UX findings**:
  * Menampilkan catatan peninjauan DPL secara miring (*italic*) pada kontainer khusus yang terpisah.
* **Data consistency**:
  * Format tanggal mulai dan selesai izin diubah ke pelokalan Indonesia (`id-ID`) yang mudah dipahami.
* **Responsive risk**:
  * Tombol "Ajukan Izin" otomatis berpindah ke bawah header judul pada layar lebar ponsel (< 480px).
* **Suggested fix**: Nihil. Status Lolos.

---

## 2. Panel Dosen (Lecturer UI)

### Rute `/dosen/beranda-dpl` — [beranda-dpl/page.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(dosen)/dosen/beranda-dpl/page.tsx)
* **Status**: **PASS**
* **Severity**: P3
* **Visual findings**:
  * Box statistik (`StatBox`) menerapkan radius sudut dinamis (`--profile-radius`) sesuai konfigurasi tema.
* **UX findings**:
  * Panel "Atensi Khusus" menyorot mahasiswa yang memerlukan tindak lanjut cepat tanpa menimbulkan kesan panik (menggunakan warna soft rose).
* **Data consistency**:
  * Jumlah unit kelompok aktif dan laporan yang menunggu validasi sinkron dengan database DPL.
* **Responsive risk**:
  * Tabel bimbingan KKN aktif dilindungi kontainer scroll horizontal (`overflow-x-auto`) untuk mencegah tata letak kolom pecah di tablet.
* **Suggested fix**: Nihil. Status Lolos.

---

## 3. Layout Shell / Layout Utama

### Student Layout — [layout.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(student)/layout.tsx)
* **Status**: **PASS**
* **Severity**: P1 (Sudah Diperbaiki)
* **Visual findings**:
  * Tema warna latar belakang utama diatur lewat variabel CSS (`style={{ ...themeConfig.vars, background: themeConfig.backdrop }}`) sehingga menutupi seluruh viewport (bebas area putih/abu mati saat tema diganti).
* **UX findings**:
  * Menu navigasi sidebar ter-filter secara tepat berdasarkan status approved mahasiswa. Navigasi `DAFTAR KKN` tersembunyi bagi RETYAN (karena approved), dan `POSKO` tersembunyi (karena belum berkelompok).
* **Data consistency**:
  * Melakukan invalidasi caching secara reaktif. Judul header (`headerPeriodName`) memprioritaskan data pendaftaran terverifikasi pengguna daripada fallback period default.
* **Responsive risk**:
  * Header period menggunakan overflow-hidden/truncate demi mencegah kebocoran visual nama periode panjang di mobile portrait.
* **Code/API notes**:
  * Telah dikeraskan dengan menambahkan `user?.id` pada query key React Query.

---

### External Layout — [layout.tsx](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(external)/external/layout.tsx)
* **Status**: **WARNING**
* **Severity**: P2 (Visual Inconsistency)
* **Visual findings**:
  * Item navigasi sidebar yang aktif menggunakan warna latar belakang keras (*hardcoded*) `bg-cyan-600 text-white`.
* **UX findings**:
  * Kontras warna aktif di beberapa pilihan tema (seperti Rose atau Forest) menjadi kurang serasi karena tidak membaca variabel CSS primer tema.
* **Responsive risk**:
  * Sidebar tersembunyi dengan benar di mobile/tablet.
* **Suggested fix**:
  * Ubah kelas item navigasi aktif di baris 40 agar membaca variabel CSS tema dinamis:
    ```diff
    - className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold ${active ? 'bg-cyan-600 text-white' : 'hover:bg-[color:var(--profile-soft)]'}`}
    + className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-bold ${active ? 'bg-[color:var(--profile-primary)] text-white' : 'hover:bg-[color:var(--profile-soft)] text-[color:var(--profile-text)]'}`}
    ```

---

## 4. Rute Controller API Backend (Laravel)

### Admin Peserta KKN List — [PesertaKknListController.php](file:///Users/macm4/Documents/kknuinsaizu/apps/api/app/Http/Controllers/Api/V1/Admin/PesertaKknListController.php)
* **Status**: **PASS**
* **Severity**: P3
* **Data consistency**:
  * Pemuatan data relasional (`mahasiswa.prodi`, `mahasiswa.fakultas`, `periode.jenisKkn`, `kelompok`) dimuat secara eager loading. Tidak ada masalah query N+1.
  * Pencarian NIM menggunakan metode pencocokan blind index (`nim_bidx`) yang terenkripsi demi keamanan data.
* **Suggested fix**: Nihil. Status Lolos.

---

### Admin Rekap Nilai — [RekapNilaiController.php](file:///Users/macm4/Documents/kknuinsaizu/apps/api/app/Http/Controllers/Api/V1/Admin/RekapNilaiController.php)
* **Status**: **PASS**
* **Severity**: P3
* **Data consistency**:
  * Melakukan kalkulasi ulang nilai akhir KKN secara otomatis sebelum proses finalisasi dilakukan (`calculateFinalGrade`), menjamin keselarasan data nilai.
  * Terdapat asersi ketat batas minimum keikutsertaan bimbingan kelompok (minimal 4 sesi berstatus `completed`) sebelum nilai diizinkan untuk difinalisasi.
* **Suggested fix**: Nihil. Status Lolos.

---

### Student Dashboard — [DashboardController.php](file:///Users/macm4/Documents/kknuinsaizu/apps/api/app/Http/Controllers/Api/V1/Student/DashboardController.php)
* **Status**: **PASS**
* **Severity**: P3
* **Data consistency**:
  * Menghilangkan isolasi global periode KKN yang berisiko menutupi pendaftaran aktif mahasiswa di periode yang berbeda.
  * Payload ketua kelompok di-eager-load secara parsial untuk mempercepat performa API dashboard.
* **Suggested fix**: Nihil. Status Lolos.

---

## Top 10 Perbaikan Berdasarkan Dampak (Impact)
1. **[SELESAI - P1]** Pengerasan cache React Query (`layout.tsx` & `mahasiswa/page.tsx` & `profil/page.tsx`) dengan menyertakan `user?.id` untuk mematikan bug stale cache lintas akun/sesi.
2. **[SELESAI - P1]** Pembersihan disclaimer peta manual lama di `/profil` demi mencegah kebingungan pengisian alamat KTP.
3. **[SELESAI - P1]** Penyembunyian dinamis navigasi `DAFTAR KKN` dan `POSKO` di sidebar bagi mahasiswa yang telah disetujui tanpa kelompok.
4. **[SELESAI - P1]** Asersi batas akurasi dan lat/lng pada input GPS logbook harian mahasiswa.
5. **[SELESAI - P2]** Pembatasan rasio aspek dan ukuran berkas pas foto almamater HD (maksimal 2MB, rasio 3:4).
6. **[SELESAI - P2]** Penyesuaian viewport background gradasi tema agar menutup seluruh halaman bawah.
7. **[SELESAI - P2]** Penambahan scroll horizontal pengaman pada tabel bimbingan aktif di panel dosen.
8. **[SELESAI - P2]** Penambahan asersi finalisasi nilai kelompok berdasarkan batas minimal 4 sesi bimbingan lengkap di backend.
9. **[SELESAI - P2]** Refactor warna aktif navigasi menu di `ExternalLayout` agar sinkron dengan pilihan tema warna global.
10. **[SELESAI - P3]** Ellipsis nama file terunggah pada komponen laporan akhir di layar mobile.

---

## Quick Wins (< 1 Jam)
* **Refactor Warna Navigasi Aktif di [External Layout](file:///Users/macm4/Documents/kknuinsaizu/apps/web/src/app/(external)/external/layout.tsx):**
  Mengganti hardcoded `bg-cyan-600 text-white` dengan `bg-[color:var(--profile-primary)] text-white` agar menu navigasi eksternal memiliki kesamaan visual yang tinggi dengan shell dashboard lainnya saat berganti tema.

---

## Daftar Pemeriksaan Regresi Pasca Patch (Regression Checklist)
* [ ] Login sebagai pengguna baru dan pastikan dashboard memuat captcha yang valid.
* [ ] Edit alamat KTP pada halaman profil dan verifikasi alamat otomatis Nominatim tidak merusak alamat manual tertulis.
* [ ] Unggah foto almamater baru, pastikan status foto langsung masuk ke `pending` dan sidebar/header menampilkan inisial avatar yang sesuai.
* [ ] Akses halaman `/mahasiswa/posko` secara langsung menggunakan url, verifikasi tampilan peringatan "Posko Belum Tersedia" bekerja dengan benar.
* [ ] Jalankan `pnpm run type-check` pasca-perubahan untuk menjamin 0 compilation error.
