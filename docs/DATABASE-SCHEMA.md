# Database Schema - KKN UIN Saizu

## Referensi: EDARAN KKN 58 (2026)

**Tema:** Saizu Memberdaya: Menguatkan Umat, Menghijaukan Desa, Menggerakkan Ekonomi

**Jadwal KKN 58:**
- Sosialisasi: 11-14 Mei 2026
- Pendaftaran: 18-21 Mei 2026
- Pembekalan: 29 Juni - 3 Juli 2026
- Pelaksanaan: 16 Juli - 24 Agustus 2026
- Penarikan: 24 Agustus 2026
- Seminar Hasil: 27-28 Agustus 2026
- Yudisium: September 2026

---

## Jenis KKN (jenis_kkn)

| Code | Name | Registration | Placement | Min SKS | Min IPK |
|------|------|-------------|-----------|---------|---------|
| REGULER | KKN Reguler | open | automatic_after_approval | 100 | 0.00 |
| INTERNASIONAL | KKN Internasional | selective | host_defined | 100 | 3.25 |
| NUSantara | KKN Nusantara | selective | host_defined | 85 | 3.25 |
| KOLABORATIF | KKN Tematik Kolaboratif | proposal_based | proposal_defined | 100 | 0.00 |
| RESPONSIF | KKN Responsif | open | automatic_after_approval | 100 | 0.00 |
| KOLABORASI_PTKIN | KKN Kolaborasi PTKIN | selective | host_defined | 100 | 3.00 |
| KAMPUNG_ZAKAT | KKN Kampung Zakat | proposal_based | proposal_defined | 100 | 0.00 |

### Syarat Khusus per Jenis

1. **KKN Reguler**: 40 hari live-in, biaya sendiri
2. **KKN Kolaborasi PTKIN**: Belum menikah, izin orang tua
3. **KKN Kampung Zakat**: Mahasiswa aktif Prodi Mazawa
4. **KKN Internasional**: Belum menikah, biaya mandiri, diutamakan aktifis
5. **KKN Nusantara**: Belum menikah, karya ilmiah, diutamakan aktifis
6. **KKN Tematik Kolaboratif**: Surat kesediaan dosen
7. **KKN Responsif**: Surat keterangan dokter

---

## Periode KKN 58

| ID | Name | Jenis | Phase | Registrasi | Pelaksanaan |
|----|------|------|-------|---------|------------|
| 2 | KKN 58 Reguler | REGULER | registration | 18-21 Mei 2026 | 16 Jul - 24 Agt 2026 |
| 3 | KKN 58 Kolaborasi PTKIN | KOLABORASI_PTKIN | registration | 18-21 Mei 2026 | 16 Jul - 24 Agt 2026 |
| 4 | KKN 58 Kampung Zakat | KAMPUNG_ZAKAT | registration | 18-21 Mei 2026 | 16 Jul - 24 Agt 2026 |
| 5 | KKN 58 Nusantara | NUSANTARA | registration | 18-21 Mei 2026 | 16 Jul - 24 Agt 2026 |
| 6 | KKN 58 Tematik Kolaboratif | KOLABORATIF | registration | 18-21 Mei 2026 | 16 Jul - 24 Agt 2026 |
| 7 | KKN 58 Responsif | RESPONSIF | registration | 18-21 Mei 2026 | 16 Jul - 24 Agt 2026 |

---

## Core Tables

### Tabel Utama KKN

1. **jenis_kkn** - Master jenis KKN ( REGULER, INTERNASIONAL, etc.)
2. **periode** - Periode KKN (KKN 58, etc.)
3. **tahun_akademik** - Tahun akademik
4. **peserta_kkn** - Peserta mahasiswa
5. **kelompok_kkn** - Kelompok KKN
6. **dosen** - Dosen/DPL
7. **lokasi** - Lokasi (Desa/Kelurahan)
8. **posko_kelompok** - Posko kelompok
9. **program_kerja** - Program kerja
10. **kegiatan_kkn** - Kegiatan harian

### Tabel Pendukung

1. **absensi_harian** - Absensi daily
2. **izin_meninggalkan** - Izin keluar
3. **laporan** - Laporan akhir
4. **nilai_kkn** - Nilai KKN
5. **sertifikat_kkn** - Sertifikat
6. **dokumen_peserta_kkn** - Dokumen peserta

---

## Relationships

```
jenis_kkn 1──∞ periode
          1──∞ peserta_kkn (via periode)

periode 1──∞ peserta_kkn
        1──∞ kelompok_kkn
        1──∞ program_kerja
        1── tahun_akademik

kelompok_kkn 1──∞ peserta_kkn
           1──∞ absensi_harian
           1──∞ izin_meninggalkan
           1── lokasi (desa)
           1── dosen (DPL)
           1── periode
```