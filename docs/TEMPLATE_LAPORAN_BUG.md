# Template Laporan Bug

Gunakan template ini untuk semua bug yang ditemukan saat alpha testing, beta testing, bug bash, atau uji harian.

## Format Singkat

```md
# [Severity] Judul Singkat

## Ringkasan
- ID:
- Tanggal:
- Pelapor:
- Role yang dipakai:
- Lingkungan:
- Browser / Device:
- Build / Commit:

## Langkah Reproduksi
1.
2.
3.

## Hasil Aktual

## Hasil yang Diharapkan

## Dampak Bisnis

## Bukti
- Screenshot:
- Video:
- Log:

## Catatan Teknis

## Status
- New / Triaged / In Progress / Ready to Retest / Closed
```

## Template Lengkap

### 1. Identitas Bug

- `ID Bug`:
- `Judul`:
- `Severity`: Blocker / Critical / Major / Minor / Trivial
- `Priority`: High / Medium / Low
- `Tanggal`:
- `Pelapor`:
- `Modul`: Login / Profil / Pendaftaran / Kelompok / DPL / Laporan / Nilai / Sertifikat / Lainnya

### 2. Konteks

- `Role yang dipakai`:
- `Akun yang dipakai`:
- `Lingkungan`: local / staging / production
- `Browser / Device`:
- `Build / Commit / Branch`:

### 3. Langkah Reproduksi

Tuliskan langkah secara urut dan spesifik.

1.
2.
3.
4.

### 4. Hasil Aktual

Tuliskan apa yang benar-benar terjadi.

Contoh:
- tombol tidak merespons
- muncul error 500
- data tersimpan ganda
- user diarahkan ke halaman yang salah

### 5. Hasil yang Diharapkan

Tuliskan perilaku yang seharusnya terjadi.

### 6. Dampak

Pilih salah satu atau lebih:
- user tidak bisa lanjut
- data salah
- hak akses bocor
- alur kerja melambat
- membingungkan pengguna

### 7. Bukti

Lampirkan bila ada:
- screenshot
- video rekaman singkat
- potongan log
- response API

### 8. Catatan Teknis

Bagian ini bisa diisi developer/QA:
- file atau endpoint yang dicurigai
- error log terkait
- dugaan akar masalah

### 9. Status

Gunakan status yang konsisten:
- `New`
- `Triaged`
- `In Progress`
- `Ready to Retest`
- `Closed`
- `Won't Fix`

## Contoh Laporan

```md
# [Critical] Admin gagal approve pendaftaran

## Ringkasan
- ID: BUG-REG-014
- Tanggal: 2026-04-17
- Pelapor: QA Internal
- Role yang dipakai: admin
- Lingkungan: staging
- Browser / Device: Chrome macOS
- Build / Commit: 1a2b3c4

## Langkah Reproduksi
1. Login sebagai admin
2. Buka halaman pendaftaran
3. Buka detail pendaftaran mahasiswa berstatus pending
4. Klik tombol approve

## Hasil Aktual
Muncul error 500 dan status pendaftaran tidak berubah.

## Hasil yang Diharapkan
Status berubah menjadi approved dan halaman kembali ke detail pendaftaran.

## Dampak Bisnis
Admin tidak bisa memproses peserta baru.

## Bukti
- Screenshot: ada
- Log: storage/logs/laravel.log

## Catatan Teknis
Diduga service approval gagal saat memeriksa kelompok otomatis.

## Status
- New
```

## Aturan Penulisan yang Baik

- satu bug satu laporan
- jangan gunakan judul umum seperti `error halaman`
- selalu tulis langkah reproduksi
- selalu tulis hasil aktual dan hasil yang diharapkan
- jangan menulis `kadang-kadang error` tanpa bukti konteks
