# Diagram Relasi Database SIBERMAS

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         USERS & IDENTITY                                          │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│    ┌──────────┐         ┌─────────────┐         ┌──────────┐         ┌──────────────────┐       │
│    │  users   │────────▶│   dosen    │◀────────│ mahasiswa │◀────────│     prodi       │       │
│    └──────────┘         └──────┬──────┘         └──────┬──────┘         └────────┬─────────┘       │
│         │                       │                       │                       │                 │
│         │                       │                       │                       │                 │
│         │              ┌────────┴──────┐              │                       │                 │
│         │              │   fakultas    │◀─────────────┘                       │                 │
│         │              └────────────────┘                                      │                 │
│         │                                                                     │                 │
│         │    ┌────────────┐     ┌──────────────┐     ┌──────────────────┐                 │
│         └───▶│ profil_user │     │   tahun_akademik │     │    jenis_kkn     │                 │
│              └────────────┘     └────────────────┘     └──────────────────┘                 │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                    
                                                    │
                                                    ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         PERIODE & KELOMPOK                                       │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│    ┌─────────────────┐         ┌────────────────┐         ┌─────────────────┐                   │
│    │    periode      │────────▶│  kelompok_kkn  │◀────────│     lokasi      │                   │
│    └────────┬────────┘         └───────┬────────┘         └─────────────────┘                   │
│             │                          │                                                               │
│             │                          │                                                               │
│    ┌────────┴────────┐         ┌──────┴──────┐                                                      │
│    │   dpl_periode   │         │   peserta_kkn │                                                      │
│    └─────────────────┘         └──────┬───────┘                                                      │
│                                        │                                                              │
│                                        │                                                              │
└────────────────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                         │
                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         AKTIVITAS & KEGIATAN                                     │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│    ┌─────────────────┐         ┌────────────────┐         ┌─────────────────┐                   │
│    │   evaluasi     │────────▶│ item_evaluasi │         │   evaluasi_dpl  │                   │
│    └────────┬────────┘         └────────────────┘         │ _peserta      │                   │
│             │                                               └────────┬────────┘                   │
│             │                                                        │                            │
│    ┌────────┴────────┐         ┌────────────────┐         │                            │
│    │   nilai_kkn    │         │kegiat an_kkn  │◀────────│                            │
│    └────────┬────────┘         └───────┬────────┘         │                            │
│             │                          │                  ┌─────┴──────────┐                 │
│             │                   ┌──────┴──────┐         │item_evaluasi   │                 │
│    ┌────────┴────────┐      │program_kerja│         │_dpl_peserta   │                 │
│    │sertifikat_kkn   │      └──────┬───────┘         └─────────────────┘                   │
│    └─────────────────┘             │                                                            │
│                                   │                                                            │
└──────────────────────────────────┼──────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         ABSENSI & IZIN                                            │
├─────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                                     │
│    ┌─────────────────┐         ┌────────────────┐         ┌─────────────────┐                   │
│    │  attendance     │────────▶│attendance_photo│         │ absensi_harian  │                   │
│    └────────┬────────┘         └────────────────┘         └─────────────────┘                   │
│             │                                                                                   │
│             │               ┌─────────────────┐         ┌─────────────────┐                   │
│             └──────────────▶│  izin_meninggalkan │         │  dispensasi_kkn  │                   │
│                             └─────────────────┘         └─────────────────┘                   │
│                                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Detail Relasi per Domain

### 1. Users & Identity

```
users (1) ────── (1) dosen
  │                   │
  │                   └──── (N) dpl_periode
  │                   └──── (N) dpl_kecamatan_assignments
  │
  ├───── (1) mahasiswa
  │           │
  │           ├──── (N) peserta_kkn
  │           ├──── (N) evaluasi
  │           ├──── (N) laporan_akhir
  │           ├──── (N) kegiatan_kkn
  │           └──── (N) absensi_harian
  │
  └───── (1) profil_user
```

### 2. Academic Structure

```
fakultas (1) ──── (N) prodi
      │                  │
      │                  └──── (N) mahasiswa
      │
      └──── (N) dosen
      └──── (N) lokasi
```

### 3. Periode & Registration

```
tahun_akademik (1) ──── (N) periode

periode (1) ──── (N) kelompok_kkn
    │                    │
    │                    └──── (N) peserta_kkn
    │
    └──── (N) dpl_periode
```

### 4. Kelompok KKN

```
kelompok_kkn (1) ──── (N) peserta_kkn
        │                    │
        │                    ├──── (N) attendance
        │                    ├──── (N) activities_kkn
        │                    ├──── (N) program_kerja
        │                    └──── (N) laporan_akhir
        │
        ├──── (1) lokasi
        ├──── (1) dpl (dosen)
        └──── (1) periode
```

### 5. Penilaian

```
evaluasi (1) ──── (N) item_evaluasi

evaluasi_dpl_peserta (1) ──── (N) item_evaluasi_dpl_peserta

nilai_kkn (1) ──── (1) sertifikat_kkn

sertifikat_kkn ──── (1) user
                   ──── (1) periode
                   ──── (1) kelompok_kkn
```

---

## Foreign Key Reference

| Child Table | Parent Table | FK Column |
|-------------|--------------|-----------|
| prodi | fakultas | fakultas_id |
| mahasiswa | users | user_id |
| mahasiswa | prodi | prodi_id |
| mahasiswa | fakultas | fakultas_id |
| dosen | users | user_id |
| dosen | fakultas | fakultas_id |
| kelompok_kkn | periode | periode_id |
| kelompok_kkn | lokasi | location_id |
| kelompok_kkn | dosen | dpl_id |
| peserta_kkn | mahasiswa | mahasiswa_id |
| peserta_kkn | periode | periode_id |
| peserta_kkn | kelompok_kkn | kelompok_id |
| attendance | users | user_id |
| attendance | peserta_kkn | peserta_kkn_id |
| attendance | kelompok_kkn | kelompok_id |
| nilai_kkn | users | user_id |
| nilai_kkn | kelompok_kkn | kelompok_id |
| sertifikat_kkn | users | user_id |
| sertifikat_kkn | periode | periode_id |
| sertifikat_kkn | nilai_kkn | nilai_kkn_id |
| evaluasi | mahasiswa | mahasiswa_id |
| evaluasi | kelompok_kkn | kelompok_id |
| item_evaluasi | evaluasi | evaluasi_id |
| kegiatan_kkn | mahasiswa | mahasiswa_id |
| kegiatan_kkn | kelompok_kkn | kelompok_id |
| program_kerja | kelompok_kkn | kelompok_id |
| laporan_akhir | mahasiswa | mahasiswa_id |
| laporan_akhir | kelompok_kkn | kelompok_id |
| proposal_program_kerja | program_kerja | program_kerja_id |
