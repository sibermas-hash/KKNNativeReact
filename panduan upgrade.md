# Spesifikasi Teknis Aplikasi KKN UIN Saizu
**Versi**: 1.0  
**Platform**: Native Android (Kotlin)  
**Arsitektur**: Offline-First dengan Background Sync  
**Target**: KKN Reguler & Tematik Angkatan 56+

---

## 1. Core Features (Fase 1 - MVP)

### A. Logbook Harian Cerdas (Offline)
- **Voice-to-Text**: Input logbook via speech recognition (works offline)
- **Template Cepat**: 
  - Kategori: Shilaturrahmi | Program Unggulan | Program Pendukung | Administrasi
  - Auto-timestamp & geotag
  - Validasi: Tidak bisa backdate >24 jam
- **Reminder Lokal**: Notifikasi push jam 20:00 WIB (tidak memerlukan internet)
- **Draft Auto-save**: Simpan otomatis setiap 30 detik ke SQLite

### B. Sistem Presensi Anti-Cheat
- **Geofencing Offline**: 
  - Download boundary desa (GeoJSON) saat pertama setup
  - Radius presensi: 500m dari titik pusat desa (koordinat di-download saat pembekalan)
- **Watermark Foto**: 
  - Timestamp (tidak bisa diubah)
  - Koordinat GPS (lat, long)
  - Nama Mahasiswa & NIM
  - Jenis kegiatan (Drop-in: Masuk/Keluar/Istirahat)
- **Izin Keluar Digital**:
  - Form: Alasan, Lama izin (hari), Tujuan
  - Approval DPL via notifikasi (FCM) atau SMS fallback
  - Auto-flag merah jika 3 hari tidak presensi tanpa izin (sesuai Pasal 7 Bab IV)

### C. Manajemen Izin & Sanksi
- **Surat Izin Online**: Ganti surat keterangan manual (Bab IV hal 36)
- **Tracking Alpha**: Counter hari tidak hadir real-time
- **Panic Button**: 
  - Long-press tombol power 3x atau tombol khusus di app
  - Kirim SMS blast ke DPL + Koordinator Desan dengan lokasi terakhir

---

## 2. Manajemen Program ABCD (Fase 2)

### A. Wizard Asset Based Community Development
**Tahap 1: Discovery (Minggu 1)**
- Form identifikasi aset:
  - SDA (Sungai, Hutan, Lahan, dll) dengan foto + geotag
  - SDM (Tokoh kunci: Kades, Ustadz, Petani, dll)
  - Sosial (Lembaga adat, organisasi pemuda)
- **Success Story Mapper**: Input kisah keberhasilan masa lalu desa

**Tahap 2: Dream**
- Voting anggota: Setiap anggota input 1 impian, voting sistem mayoritas
- **Auto-generate Visi**: Template kalimat visi berdasarkan aset teridentifikasi

**Tahap 3: Design**
- **Jadwal Otomatis**: Generate tabel jadwal (Lampiran 4 & 6) berdasarkan:
  - Program Unggulan (3 program)
  - Program Pendukung (3 program)
  - Durasi 40 hari (12 Juli - 20 Agustus)
- **Penugasan Anggota**: Assign anggota ke tiap kegiatan via drag-drop

**Tahap 4: Destiny**
- Checklist progress harian per program
- Upload dokumentasi per kegiatan (max 5 foto, 1 video pendek)

**Tahap 5: Refleksi**
- Form evaluasi: Skor 1-5 untuk tiap program
- Kolom saran perbaikan (auto-summarize ke laporan akhir)

### B. Shared Media Library
- **Peer-to-Peer Sync**: Transfer foto/video antar HP anggota kelompok via WiFi Direct (tanpa internet)
- **Auto-Organize**: Folder otomatis: `/Program_Unggulan_1/Minggu_1/Kegiatan_A/`
- **Compressor**: Video 1080p → 720p (HEVC) otomatis sebelum upload ke server

---

## 3. Monitoring & Pelaporan (Fase 3)

### A. Dashboard DPL
- **Progress ABCD**: Pie chart completion per tahap tiap kelompok
- **Heatmap Presensi**: Kalender warna hijau (hadir) / merah (alpha) per mahasiswa
- **Lembar Monitoring Digital** (Ganti Lampiran 7):
  - Input: Permasalahan | Solusi | Tindak Lanjut
  - Tanda tangan digital DPL & Ketua Kelompok
  - Export PDF otomatis

### B. Auto-Generate Laporan
- **Draft Artikel Ilmiah**:
  - Pull data dari 40 logbook harian → Generate kerangka 3000-5000 kata
  - Template sesuai Panduan (Lampiran 9): Pendahuluan, Metode, Hasil, Pembahasan
  - Citation manager sederhana (APA style)
- **Rekapitulasi Keuangan** (Lampiran 6):
  - Kategori: Swadaya Mhs | Swadaya Masy | Donatur | Bantuan Pemerintah
  - Export Excel/CSV untuk di-import ke template Word LPPM

### C. Peta Potensi Desa (Lampiran 10)
- **Digital Map**: Pin lokasi aset desa di peta OSM (OpenStreetMap) offline
- **QR Code Generator**: Generate QR untuk setiap titik penting (Posko, Rumah Kades, Lokasi Program)
- **Infografis Otomatis**: Auto-layout peta + foto aset + keterangan legenda

---

## 4. Arsitektur Teknis

### A. Offline-First Architecture
[UI Layer] → [ViewModel] → [Repository] → [Local DB (Room)]
↓                    ↑
[Sync Manager] ← [WorkManager]
↓
[Remote API]
↓
[Firebase / REST API]
plain
Copy

### B. Database Lokal (Room)
**Tabel Utama:**
- `logbook` (id, nim, tanggal, kegiatan, kategori, lat, long, foto_path, sync_status, created_at)
- `presensi` (id, nim, jenis, timestamp, lat, long, foto_path, geofence_status, sync_status)
- `program_kerja` (id, kelompok_id, nama, jenis, minggu_ke, status, anggota_assign)
- `aset_desa` (id, kelompok_id, jenis, deskripsi, lat, long, foto_path, tahap_abcd)
- `sync_queue` (id, table_name, record_id, operation, retry_count, last_retry)

### C. Strategi Sinkronisasi
- **Conflict Resolution**: Last-Write-Wins (timestamp server) atau manual merge jika beda device
- **Background Sync**: 
  - WiFi only: Upload video & foto HD
  - Data seluler: Hanya logbook text & presensi (kompres foto ke 100KB)
  - Charging only: Sync besar-besaran saat malam
- **Retry Policy**: Exponential backoff (2^x menit) maksimal 5x, lalu flag "Manual Sync Required"

### D. Keamanan
- **Local Encryption**: SQLCipher untuk database lokal (PIN/biometric)
- **Photo Integrity**: Hash SHA-256 foto original disimpan, cek integritas saat upload
- **Root Detection**: Cek keamanan device, blokir jika rooted (mencegah fake GPS)

---

## 5. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Bahasa** | Kotlin (min SDK 24 / Android 7.0) |
| **UI** | Jetpack Compose (Material 3) |
| **Database** | Room (SQLite) + DataStore (Preferences) |
| **Background** | WorkManager (sync), ForegroundService (tracking) |
| **Lokasi** | FusedLocationProvider + Geofencing API |
| **Network** | Retrofit2 + OkHttp (cache strategy) |
| **Image** | Coil (loading), GPUImage (watermark), Compressor (resize) |
| **Map** | OSMDroid (OpenStreetMap offline) / Google Maps (online) |
| **DI** | Hilt |
| **Architecture** | MVVM + Repository Pattern |
| **Offline Capability** | Paging 3, SwipeRefreshLayout |

---

## 6. Roadmap Implementasi

### Sprint 1 (2 Minggu): Core Offline
- Setup project & database schema
- Implementasi Logbook offline (CRUD)
- Implementasi Presensi dengan geofencing offline
- Sinkronisasi dasar (WorkManager)

### Sprint 2 (2 Minggu): ABCD Flow
- Wizard Discovery, Dream, Design
- Jadwal otomatis generator
- Shared media library (WiFi Direct)

### Sprint 3 (2 Minggu): Monitoring & Laporan
- Dashboard DPL
- Auto-generate draft artikel
- Export PDF/Excel laporan

### Sprint 4 (1 Minggu): Polish & Security
- Enkripsi database
- Optimasi baterai (Doze mode compatibility)
- Testing di lapangan (simulasi sinyal buruk)

---

## 7. Catatan Khusus KKN Tematik (Kampung Zakat)
- **Modul Zakat**: Tambahan form pendataan mustahik (nama, alamat, kategori: Fakir/Miskin/Amil/dll)
- **Digital Wallet Integration**: API e-wallet (GoPay/OVO/Dana) untuk pembayaran zakat (opsional)
- **Laporan Zakat**: Generate laporan penerimaan & penyaluran sesuai standar BAZNAS

---

**Dokumen ini disusun berdasarkan:**  
- Pedoman KKN Angkatan 56 Tahun 2025 UIN Prof. K.H. Saifuddin Zuhri Purwokerto
- Metode Asset Based Community Development (ABCD)
- Kebutuhan spesifik wilayah Penginyongan (5 Kabupaten: Kebumen, Banjarnegara, Wonosobo, Cilacap, Purbalingga)