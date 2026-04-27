# Workflows SIBERMAS

## 1. Workflow Pendaftaran KKN

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           PENDAFTARAN KKN MAHASISWA                                  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
    │ Mahasantri │     │   Portal    │     │  Sistem     │     │    Database      │
    │           │     │  Registrasi │     │   Validasi  │     │                  │
    └─────┬─────┘     └──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
          │                   │                    │                    │
          │  1. Buka halaman │                    │                    │
          │     registrasi   │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │  2. Isi formulir │                    │                    │
          │     & upload      │                    │                    │
          │     dokumen      │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │                   │ 3. Submit data   │                    │
          │                   │─────────────────▶│                    │
          │                   │                    │                    │
          │                   │                    │ 4. Validasi data   │
          │                   │                    │    & cek kelayakan  │
          │                   │                    │───────────────────▶│
          │                   │                    │                    │
          │                   │                    │ 5. Simpan ke        │
          │                   │                    │    antrian_kkn      │
          │                   │                    │    /peserta_kkn     │
          │                   │                    │───────────────────▶│
          │                   │                    │                    │
          │     6. Notifikasi │                    │                    │
          │     (email/SMS)  │                    │                    │
          │◀─────────────────│                    │                    │
          │                   │                    │                    │
          ▼                   ▼                    ▼                    ▼
```

### Tahap Pendaftaran:
1. **Input Data**: Mahasiswa mengisi formulir registrasi
2. **Upload Dokumen**: Upload dokumen persyaratan (KTP, KK, foto, dll)
3. **Validasi Sistem**: Sistem cek kelayakan otomatis
4. **Verifikasi Admin**: Admin memverifikasi data
5. **Penempatan Kelompok**: Sistem/Badmin menempatkan ke kelompok
6. **Notifikasi**: Mahasiswa mendapat notifikasi hasil

---

## 2. Workflow Absensi Harian

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           ABSENSI HARIAN KKN                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
    │ Mahasantri │     │ Mobile App  │     │   Sistem   │     │    Database      │
    │           │     │   (GPS)     │     │   Validasi │     │                  │
    └─────┬─────┘     └──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
          │                   │                    │                    │
          │ 1. Buka fitur │                    │                    │
          │    absensi    │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │ 2. Ambil lokasi│                    │                    │
          │    GPS terkini │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │                   │ 3. Validasi    │                    │
          │                   │    lokasi &     │                    │
          │                   │    waktu        │                    │
          │                   │────────────────▶│                    │
          │                   │                    │                    │
          │                   │                    │ 4. Simpan absensi │
          │                   │                    │    ke attendance  │
          │                   │                    │───────────────────▶│
          │                   │                    │                    │
          │     5. Konfirmasi│                    │                    │
          │     berhasil    │                    │                    │
          │◀────────────────│                    │                    │
          │                   │                    │                    │
          ▼                   ▼                    ▼                    ▼
```

### Fitur:
- **GPS Location**: Validasi lokasi absensi
- **Foto Bukti**: Upload foto saat absensi
- **Waktu Real-time**: Validasi waktu absensi
- **Offline Support**: Simpan offline, sync saat online

---

## 3. Workflow Penilaian

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          PENILAIAN KKN                                             │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
    │   DPL    │     │   Sistem    │     │  Admin     │     │    Database      │
    │           │     │   Hitung    │     │  Finalize  │     │                  │
    └─────┬─────┘     └──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
          │                   │                    │                    │
          │ 1. Input evaluasi│                    │                    │
          │    peserta      │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │                   │ 2. Simpan ke    │                    │
          │                   │    evaluasi_dpl  │                    │
          │                   │────────────────▶│                    │
          │                   │                    │                    │
          │                   │                    │ 3. Hitung nilai  │
          │                   │                    │    akhir & grade │
          │                   │                    │◀─────────────────│
          │                   │                    │                    │
          │                   │                    │ 4. Generate nilai │
          │                   │                    │    ke nilai_kkn  │
          │                   │                    │──────────────────▶│
          │                   │                    │                    │
          │     5. Review    │                    │                    │
          │     nilai akhir │                    │                    │
          │◀────────────────│                    │                    │
          │                   │                    │                    │
          ▼                   ▼                    ▼                    ▼
```

### Tahapan Penilaian:
1. **Evaluasi DPL**: DPL menilai peserta
2. **Evaluasi Diri**: Mahasiswa evaluasi diri
3. **Laporan Aktivitas**: Program kerja & laporan
4. **Hitung Nilai**: Sistem kalkulasi dengan config
5. **Finalisasi Admin**: Admin finalize nilai
6. **Generate Sertifikat**: Setelah nilai final

---

## 4. Workflow Sertifikat

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                         GENERATE SERTIFIKAT KKN                                   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
    │   Admin  │     │   Sistem    │     │   PDF      │     │    Database      │
    │           │     │   Generate  │     │  Generator │     │                  │
    └─────┬─────┘     └──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
          │                   │                    │                    │
          │ 1. Pilih peserta │                    │                    │
          │    untuk generate│                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │                   │ 2. Validasi:      │                    │
          │                   │    - Nilai final  │                    │
          │                   │    - Laporan ok  │                    │
          │                   │────────────────▶│                    │
          │                   │                    │                    │
          │                   │                    │ 3. Generate PDF  │
          │                   │                    │    & simpan      │
          │                   │                    │──────────────────▶│
          │                   │                    │                    │
          │                   │                    │ 4. Simpan ke     │
          │                   │                    │    sertifikat_kkn │
          │                   │                    │◀─────────────────│
          │     5. Download │                    │                    │
          │     PDF/Word    │                    │                    │
          │◀────────────────│                    │                    │
          │                   │                    │                    │
          ▼                   ▼                    ▼                    ▼
```

### Endpoint:
- **PDF**: `/admin/sertifikat/{id}/download`
- **Word**: `/admin/sertifikat-word/{id}`
- **Preview**: `/admin/preview-sertifikat/{id}`
- **Verifikasi**: `/verify-certificate/{token}`

---

## 5. Workflow Sinkronisasi Data Master

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                    SINKRONISASI DATA MASTER (SIKAD)                                 │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
    │   SIKAD  │     │   External  │     │   Master   │     │    Database      │
    │  (External│     │     API     │     │    Sync    │     │    SIBERMAS     │
    │  System)  │     │   Client   │     │   Service  │     │                  │
    └─────┬─────┘     └──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
          │                   │                    │                    │
          │ 1. Perubahan    │                    │                    │
          │    data master │                    │                    │
          │◀────────────────│                    │                    │
          │                   │                    │                    │
          │ 2. Kirim webhook│                    │                    │
          │    / pull API  │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │                   │ 3. Proses data  │                    │
          │                   │    & mapping    │                    │
          │                   │────────────────▶│                    │
          │                   │                    │                    │
          │                   │                    │ 4. Update/Create  │
          │                   │                    │    di database   │
          │                   │                    │◀─────────────────│
          │                   │                    │                    │
          │     5. Response│                    │                    │
          │◀────────────────│                    │                    │
          │                   │                    │                    │
          ▼                   ▼                    ▼                    ▼
```

### Data yang Disinkronkan:
- **Dosen**: Data DPL baru/perubahan
- **Mahasiswa**: Data mahasiswa baru/perubahan
- **Prodi**: Data program studi
- **Fakultas**: Data fakultas
- **Periode**: Data periode akademik

---

## 6. User Roles & Access Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                              USER ROLES & ACCESS                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────┐
                    │           PUBLIC USER              │
                    │  - Lihat pengumuman                │
                    │  - Download file                  │
                    │  - Verifikasi sertifikat           │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────┴───────────────────┐
                    │          MAHASISWA                │
                    │  - Registrasi KKN                │
                    │  - Submit laporan               │
                    │  - Absensi harian               │
                    │  - Download sertifikat           │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────┴───────────────────┐
                    │             DPL                   │
                    │  - Monitoring kelompok           │
                    │  - Evaluasi peserta              │
                    │  - Approval izin                 │
                    └──────────────┬───────────────────┘
                                   │
                    ┌──────────────┴───────────────────┐
                    │            ADMIN                   │
                    │  - Full access                   │
                    │  - Manage all modules            │
                    │  - Generate certificates         │
                    │  - Reports & exports            │
                    └──────────────────────────────────┘
```

---

## 7. API Workflow (Mobile App)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                           MOBILE APP WORKFLOW                                        │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────────┐
    │ Mobile  │     │  Capacitor  │     │    REST   │     │    Laravel       │
    │   App   │     │   Bridge    │     │    API    │     │    Backend       │
    └─────┬─────┘     └──────┬───────┘     └──────┬──────┘     └────────┬─────────┘
          │                   │                    │                    │
          │ 1. User action │                    │                    │
          │    (absensi,   │                    │                    │
          │    laporan)    │                    │                    │
          │────────────────▶│                    │                    │
          │                   │                    │                    │
          │                   │ 2. Request API │                    │
          │                   │────────────────▶│                    │
          │                   │                    │                    │
          │                   │                    │ 3. Process &    │
          │                   │                    │    Validate     │
          │                   │                    │────────────────▶│
          │                   │                    │                    │
          │                   │                    │ 4. Response     │
          │                   │                    │◀────────────────│
          │                   │                    │                    │
          │     5. Update UI│                    │                    │
          │◀────────────────│                    │                    │
          │                   │                    │                    │
          ▼                   ▼                    ▼                    ▼
```

---

## 8. Offline Sync Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          OFFLINE SYNC FLOW                                         │
└─────────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────────────────────────────────────────────────────┐
    │                    MOBILE APP                            │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
    │  │  IndexedDB │  │   Queue    │  │  Sync      │    │
    │  │  (Local)   │  │  Pending   │  │  Service   │    │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
    └─────────┼─────────────────┼─────────────────┼────────────┘
              │                 │                 │
              │ 1. Save local │                 │
              │    when offline│                 │
              │◀───────────────│                 │
              │                 │                 │
              │                 │ 2. Detect     │
              │                 │    online     │
              │                 │◀──────────────│
              │                 │                 │
              │                 │                 │ 3. Sync to
              │                 │                 │    server
              │                 │                 │◀───────────
              │                 │                 │
              │                 │                 │ 4. Resolve
              │                 │                 │    conflicts
              │                 │                 │◀───────────
              │                 │                 │
              │ 5. Update     │                 │
              │    local      │                 │
              │◀─────────────┴─────────────────┘
              │
              ▼
```

---

## Summary

| Workflow | Trigger | Output |
|----------|---------|---------|
| Pendaftaran | User Submit | PesertaKkn record |
| Absensi | User GPS check-in | Attendance record |
| Penilaian | Admin finalize | NilaiKkn record |
| Sertifikat | Generate action | PDF/Word file |
| Sinkronisasi | Scheduler/Webhook | Updated records |
| Mobile API | User action | JSON response |
| Offline Sync | Network restore | Synced data |
