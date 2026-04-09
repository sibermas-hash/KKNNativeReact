# Panduan Output Operasional

Dokumen ini menjelaskan file keluaran dan template yang paling sering dipakai operator LPPM dari panel admin.

## 1. Pendaftaran Mahasiswa

Halaman: `/admin/pendaftaran`

### Ekspor pendaftaran

- Tombol: `Ekspor pendaftaran`
- Kegunaan:
  - daftar peserta hasil review admin
  - monitoring peserta `pending`, `approved`, atau `rejected`
- Catatan:
  - file mengikuti filter pencarian dan status yang sedang aktif di halaman

### Ekspor BPJS

- Tombol: `Ekspor BPJS`
- Kegunaan:
  - kebutuhan administrasi peserta untuk proses BPJS
  - menampilkan biodata operasional yang dibutuhkan LPPM
- Catatan:
  - pastikan biodata peserta sudah lengkap sebelum diekspor

## 2. Kelompok KKN

Halaman: `/admin/kelompok`

### Template impor kelompok

- Tombol: `Unduh Template`
- File: `template-import-kelompok.csv`
- Format minimal:
  - `kode_kelompok`
  - `nama_kelompok`
  - `periode`
  - `desa`
  - `kecamatan`
  - `kabupaten`
  - `kapasitas`
  - `status`

### Impor kelompok

- Kegunaan:
  - membuat atau memperbarui kelompok secara massal
  - membentuk atau menyesuaikan data lokasi otomatis dari setiap baris
- Catatan:
  - cukup satu file kelompok
  - tidak perlu impor lokasi terpisah untuk alur operasional utama

## 3. Rekap Nilai

Halaman: `/admin/rekap-nilai`

### Ekspor Excel

- Tombol: `Ekspor Excel`
- Kegunaan:
  - rekap kerja harian admin
  - olah data lanjutan di spreadsheet
- Catatan:
  - filter periode, fakultas, huruf nilai, dan pencarian ikut diterapkan ke file

### Ekspor ledger

- Tombol: `Ekspor ledger`
- Kegunaan:
  - audit nilai
  - pelaporan resmi berbasis nilai akhir
- Catatan:
  - bila periode belum dipilih, sistem memakai periode aktif
  - jika tidak ada periode aktif, sistem memakai periode terbaru yang tersedia

## 4. Checklist Sebelum Mengunduh

- Pastikan filter yang dipilih sudah benar.
- Pastikan periode aktif sudah sesuai.
- Pastikan data peserta, kelompok, atau nilai sudah final bila file dipakai untuk laporan resmi.
- Simpan catatan revisi bila file akan dibagikan ke pihak luar kampus.
