# Checklist Readiness Produksi

Dokumen ini dipakai sebelum sistem dipindahkan dari lingkungan lokal ke lingkungan produksi.

## Hasil Audit Lokal Saat Ini

- `APP_ENV=local`
- `APP_DEBUG=true`
- `APP_URL=http://localhost:8000`
- database runtime memakai PostgreSQL `kkn`

Nilai di atas aman untuk pengembangan lokal, tetapi belum layak dipakai sebagai konfigurasi produksi.

## 1. Konfigurasi Aplikasi

- [ ] Ubah `APP_ENV` menjadi environment produksi yang sesuai.
- [ ] Ubah `APP_DEBUG=false`.
- [ ] Pastikan `APP_URL` mengarah ke domain produksi yang benar.
- [ ] Pastikan `APP_KEY` tidak berubah dari instance produksi yang sedang aktif.

## 2. Database

- [ ] Buat backup database PostgreSQL sebelum deploy.
- [ ] Pastikan kredensial database produksi tidak memakai database lokal.
- [ ] Jalankan migrasi hanya setelah backup berhasil.
- [ ] Verifikasi tabel utama: `users`, `mahasiswa`, `peserta_kkn`, `kelompok_kkn`, `periode`.

## 3. Login dan Bantuan Pengguna

- [ ] Isi `Label Kontak Bantuan Login` di pengaturan sistem.
- [ ] Isi `Nomor WhatsApp Bantuan Login` di pengaturan sistem.
- [ ] Uji halaman `/lupa-kata-sandi` dan pastikan tombol WhatsApp muncul.
- [ ] Uji reset password sementara oleh admin.

## 4. Akses dan Keamanan

- [ ] Pastikan akun admin awal sudah benar dan jumlahnya terbatas.
- [ ] Pastikan Telescope/Debugbar tidak terbuka untuk publik.
- [ ] Pastikan role dan hak akses diuji ulang setelah deploy.
- [ ] Pastikan `APP_DEBUG=false` sebelum user umum mengakses sistem.

## 5. Uji Operasional Minimum

- [ ] Login admin berhasil.
- [ ] Login mahasiswa berhasil.
- [ ] Login DPL berhasil.
- [ ] Ekspor pendaftaran berhasil.
- [ ] Ekspor BPJS berhasil.
- [ ] Ekspor rekap nilai dan ledger berhasil.
- [ ] Import kelompok dari template resmi berhasil.

## 6. Penutupan

- [ ] Semua temuan UAT sudah dicatat.
- [ ] Operator mengetahui jalur bantuan login.
- [ ] Operator mengetahui file ekspor yang dipakai untuk kebutuhan lapangan.
