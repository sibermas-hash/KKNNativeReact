# Rencana Arsitektur: Persyaratan KKN Dinamis & Penanganan Edge Case

Dokumen ini merangkum diskusi strategis mengenai perombakan sistem persyaratan pendaftaran KKN untuk meningkatkan fleksibilitas dan ketahanan sistem (Agility & Fault Tolerance).

## 1. Masalah: Hardcoded Logic
Pengecekan otomatis (seperti status UKT, jumlah SKS, atau kelulusan BTA PPI) secara langsung via kode program memiliki kelemahan:
- **Kekakuan**: Setiap ada perubahan kebijakan universitas, pengembang harus membongkar codebase.
- **Ketergantungan**: Sistem menjadi rapuh jika API eksternal (SIAKAD) sedang bermasalah.
- **Maintenance Tinggi**: Menambah syarat baru memerlukan siklus development lengkap (coding, testing, deployment).

## 2. Solusi: Hybrid Dynamic Requirements (Rule-Based System)
Mengubah paradigma dari "Validasi Sistem Kaku" menjadi "Konfigurasi Syarat Fleksibel" yang bisa bersumber dari dua jalur:

### Tipe Sumber Syarat (Requirement Source):
1.  **File Upload**: Untuk dokumen fisik yang harus diunggah (misal: Surat Izin, Paspor, Sertifikat Sehat). Memerlukan verifikasi manual oleh Admin.
2.  **Database Check (Auto-validation)**: Untuk data yang sudah tersedia di sistem (misal: SKS, Status UKT, BTA PPI). Sistem melakukan pengecekan otomatis terhadap kolom terkait di database.

### Konsep Kerja:
- **Admin Builder**: Admin LPPM dapat memilih daftar syarat saat membuat *Jenis KKN* dan menentukan sumbernya (Upload atau Cek Database).
- **Flexible Storage**: Aturan syarat disimpan dalam format JSON pada kolom konfigurasi.
- **Dynamic UI**: Sisi Mahasiswa (Web & Mobile) akan merender form secara dinamis.
- **Human-in-the-loop**: Validasi tetap bisa dialihkan ke manual jika data sistem sedang tidak sinkron, memberikan ketahanan (Reliability) tinggi.

## 3. Penanganan Edge Case: KKN Mandiri / Berkebutuhan Khusus
Kasus mahasiswa yang harus KKN di rumah masing-masing ditangani tanpa merusak integritas database yang ada melalui pendekatan **Solo-Group**.

### Strategi Implementasi:
- **Kelompok Tunggal**: Mahasiswa mandiri didaftarkan ke dalam kelompok dengan `capacity = 1`.
- **Lokasi Virtual**: Mahasiswa melakukan self-tagging koordinat GPS rumah saat pendaftaran untuk rujukan absensi.
- **Bypass Placement**: Menggunakan mode penempatan `self_determined` sehingga tidak masuk ke algoritma plotting massal.
- **Konsistensi Akademik**: Alur Logbook harian, Program Kerja, dan Laporan Akhir tetap menggunakan modul yang sama.

## 4. Mekanisme Absensi Dinamis (Per Jenis KKN)
Absensi tidak bersifat global, melainkan mengikuti aturan (Rule Engine) tiap Jenis KKN.

### Aturan Absensi (Configurable Settings):
- **KKN Reguler**: Validasi Geofencing ketat berbasis lokasi **Posko Kelompok**.
- **KKN Mandiri**: Validasi Geofencing berbasis **Lokasi Domisili** yang didaftarkan mahasiswa.
- **KKN Internasional/Daring**: Tanpa Geofencing, validasi difokuskan pada **Foto Bukti & Logbook**.

## 5. Struktur Hirarki & Isolasi Konfigurasi
... (tetap sama)

## 6. Manajemen Siklus Hidup DPL
... (tetap sama)

## 7. Alur Kerja Mahasiswa (Dynamic Workflow)
Mahasiswa mengikuti alur pendaftaran yang responsif terhadap kebijakan tiap Jenis KKN.

### Tahapan Utama:
1.  **Selection**: Mahasiswa memilih Jenis KKN yang tersedia di bawah Tahun Akademik berjalan.
2.  **Hybrid Validation**: 
    - Melalui **Database Check** (SKS, UKT, BTA PPI terverifikasi otomatis).
    - Melalui **Manual Upload** (Unggah dokumen pendukung lainnya).
    - Khusus **KKN Mandiri**: Melakukan *self-tagging* lokasi GPS domisili.
3.  **Approval & Placement**: Menunggu verifikasi berkas dan pengumuman kelompok/DPL.
4.  **Field Activity**: 
    - Absensi harian berbasis **Geofencing** (radius menyesuaikan jenis KKN).
    - Pengisian logbook dan unggah foto kegiatan secara *real-time* via mobile.
5.  **Finalization**: Unggah laporan akhir, melihat rincian nilai, dan mengunduh E-Sertifikat.
    - **Integritas Sertifikat**: Sertifikat dilengkapi dengan **QR Code unik**. Jika di-scan, akan mengarah ke halaman verifikasi publik yang menampilkan keabsahan data mahasiswa tersebut (Nama, NIM, Nilai, dan Judul Laporan).

**Manfaat**: Proses pendaftaran menjadi lebih transparan, mahasiswa tahu persis syarat apa yang kurang, dan proses administrasi menjadi lebih cepat. Sertifikat digital juga menjadi lebih kredibel dan sulit dipalsukan.

## Status Implementasi (Update 2026-04-27)

### Fase 1: Fondasi (Database & Model) - ✅ SELESAI
1.  **Migrasi Skema**: Telah dibuat migrasi `2026_04_27_234334_refactor_kkn_dynamic_config.php` yang menambahkan:
    -   `jenis_kkn.requirements_config` (JSON) untuk Hybrid Requirements.
    -   `jenis_kkn.attendance_config` (JSON) untuk Aturan Absensi.
    -   `periode.settings_override` (JSON) untuk fleksibilitas instance.
2.  **Pembaruan Model**: Model `JenisKkn` dan `Periode` telah diperbarui dengan `$fillable` dan `$casts` yang sesuai untuk menangani data JSON secara otomatis.

**Langkah Selanjutnya**: Implementasi **Admin Requirement Builder (Backend Logic)** untuk mulai memanfaatkan kolom JSON tersebut dalam validasi pendaftaran.

------

KRITIK & SARAN SIBERMAS — Sistem Informasi KKN UIN Saizu
1. ARSITEKTUR & CODEBASE
... (sisanya tetap sama)
