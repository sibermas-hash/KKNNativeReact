# Checklist UAT Per Role

Dokumen ini dipakai untuk uji terima sistem dari sudut pandang pengguna nyata. Jalankan setiap skenario dengan data demo yang sesuai, lalu tandai hasilnya.

Rujukan tambahan untuk file ekspor dan template:
- lihat [Panduan Output Operasional](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/PANDUAN_OUTPUT_OPERASIONAL.md)
- lihat [Checklist Readiness Produksi](/Users/macm4/Documents/Projek/KKN/kknuinsaizu/docs/CHECKLIST_READINESS_PRODUKSI.md)

## Prasyarat Umum

- [ ] Server Laravel aktif.
- [ ] Vite/dev asset aktif atau build frontend terbaru sudah tersedia.
- [ ] Database runtime menggunakan PostgreSQL `kkn`.
- [ ] Data demo tersedia untuk akun `admin`, `demo_faculty_admin`, `dpl`, `demo_student_ketua`, dan `demo_student_reg`.

## Superadmin / Admin

### Login dan Dashboard

- [ ] Buka halaman login.
- [ ] Login dengan `Username / NIM / NIP`.
- [ ] Pastikan captcha bisa di-refresh.
- [ ] Pastikan setelah login diarahkan ke dashboard.

### Periode

- [ ] Buka halaman periode.
- [ ] Buat periode baru.
- [ ] Ubah periode yang ada.
- [ ] Duplikasi periode.
- [ ] Pastikan periode aktif tampil benar di modul pendaftaran.

### Pendaftaran

- [ ] Buka daftar pendaftaran.
- [ ] Buka detail pendaftaran mahasiswa.
- [ ] Setujui pendaftaran yang masih `pending`.
- [ ] Tolak pendaftaran dengan alasan yang jelas.
- [ ] Pastikan ekspor pendaftaran berhasil diunduh.
- [ ] Pastikan ekspor BPJS berhasil diunduh.

### Kelompok

- [ ] Buka daftar kelompok.
- [ ] Buat kelompok baru manual.
- [ ] Unduh template impor kelompok.
- [ ] Impor kelompok dari file CSV.
- [ ] Buka detail kelompok.

### DPL

- [ ] Buka penugasan DPL.
- [ ] Aktifkan DPL untuk periode.
- [ ] Tugaskan DPL ke kelompok.
- [ ] Tetapkan koordinator kecamatan.
- [ ] Buka sinkron dosen.

### Workshop

- [ ] Buka halaman workshop admin.
- [ ] Buat workshop baru.
- [ ] Ubah workshop.
- [ ] Batalkan workshop.
- [ ] Uji ekspor atau impor absensi bila dipakai.

### Penilaian

- [ ] Buka halaman input nilai.
- [ ] Buka halaman rekap nilai.
- [ ] Ekspor rekap nilai dengan filter periode aktif.
- [ ] Ekspor ledger nilai.
- [ ] Finalisasi nilai tunggal.
- [ ] Finalisasi massal jika memang ada data siap final.

## Faculty Admin

- [ ] Login sebagai admin fakultas.
- [ ] Pastikan dashboard terbuka.
- [ ] Buka rekap nilai.
- [ ] Pastikan data yang tampil hanya dari fakultas sendiri.
- [ ] Pastikan tombol ekspor dan finalisasi tidak bisa dipakai jika memang dibatasi.

## DPL

### Dashboard dan Kelompok

- [ ] Login sebagai DPL.
- [ ] Buka dashboard DPL.
- [ ] Buka daftar kelompok DPL.
- [ ] Buka detail kelompok binaan.

### Laporan Harian

- [ ] Buka daftar laporan harian.
- [ ] Setujui laporan harian.
- [ ] Kirim revisi laporan harian.
- [ ] Pastikan DPL tidak bisa membuka laporan kelompok lain.

### Laporan Akhir dan Evaluasi

- [ ] Buka daftar laporan akhir.
- [ ] Setujui laporan akhir.
- [ ] Kirim revisi laporan akhir.
- [ ] Buka evaluasi DPL.

## Mahasiswa Ketua Kelompok

### Profil dan Pendaftaran

- [ ] Login sebagai mahasiswa.
- [ ] Lengkapi biodata peserta/BPJS.
- [ ] Lengkapi domisili dan verifikasi alamat.
- [ ] Buka halaman pendaftaran.
- [ ] Ajukan pendaftaran.
- [ ] Pastikan status berubah sesuai hasil review admin.

### Operasional

- [ ] Buka halaman workshop mahasiswa.
- [ ] Daftar workshop.
- [ ] Buka halaman posko.
- [ ] Simpan koordinat posko bila memang berperan sebagai ketua.
- [ ] Buka laporan harian.
- [ ] Unggah atau isi laporan harian.
- [ ] Buka laporan akhir.

## Mahasiswa Biasa

- [ ] Login sebagai mahasiswa biasa.
- [ ] Buka halaman pendaftaran.
- [ ] Pastikan tidak bisa membuka posko jika belum menjadi pihak yang berhak.
- [ ] Buka workshop.
- [ ] Buka laporan harian.

## Penutupan Uji

- [ ] Tidak ada error 500.
- [ ] Tidak ada redirect tak wajar ke login setelah session aktif.
- [ ] Semua file ekspor berhasil diunduh.
- [ ] Role dan hak akses sesuai.
- [ ] Catatan bug dan observasi ditulis sebelum deploy.
