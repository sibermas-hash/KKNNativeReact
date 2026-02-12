# 📖 Panduan Operasional Sistem KKN UIN SAIZU

Dokumen ini berisi panduan teknis untuk mengelola sistem, melakukan import data, dan menyelaraskan perubahan antara lingkungan Lokal dan Server.

---

## 1. Manajemen Akses & Role Superadmin
Satu-satunya user dengan otoritas penuh adalah:
- **Email:** `superadmin@uinsaizu.ac.id`

### Keunggulan Superadmin:
1. Akses otomatis ke semua menu Admin (Generator Nilai, Rekap, dsb).
2. Otoritas untuk melakukan Reset Data dan Sinkronisasi Master.

> [!TIP]
> Jika menu Admin tidak muncul, pastikan Anda berada di versi terbaru (**v2.1**) dengan menekan `Ctrl + F5` di browser untuk membersihkan cache.

---

## 2. Prosedur Import Data Masif (Excel)
Gunakan fitur ini jika ingin mengganti seluruh dataset (Reset Database).

### Langkah-langkah:
1. Letakkan file Excel di folder utama proyek dengan nama `data_import.xlsx`.
2. Pastikan kolom Excel sesuai urutan: `KELOMPOK`, `DESA`, `KECAMATAN`, `KABUPATEN`, `NAMA`, `NIM`, `L/P`, `No. Hp`, `DPL`.
3. Jalankan perintah berikut di Terminal:
   ```bash
   php artisan kkn:import-excel data_import.xlsx
   ```

> [!WARNING]
> Perintah ini akan **MENGHAPUS** semua data mahasiswa, dosen, dan laporan lama. Selalu lakukan backup sebelum menjalankan perintah ini.

---

## 3. Sinkronisasi Lokal ke Server
Alur kerja yang benar untuk memastikan perubahan di PC Anda muncul di server internet.

### Alur Kerja (Workflow):
1. **Di Lokal:** Lakukan perubahan kode -> `git add .` -> `git commit` -> `git push origin main`.
2. **Di Server:** Masuk melalui SSH, lalu jalankan:
   ```bash
   git fetch origin
   git reset --hard origin/main
   php artisan optimize:clear
   npm run build (jika ada perubahan UI/React)
   ```

---

## 4. Perintah Maintenance Penting
Daftar perintah Artisan yang sering digunakan untuk pemeliharaan sistem:

| Perintah | Fungsi |
| :--- | :--- |
| `php artisan master:sync` | Menarik data Dosen/Mhs dari API Master (SIKAD). |
| `php artisan kkn:import-excel` | Import data manual dari file Excel (Offline). |
| `php artisan optimize:clear` | Membersihkan cache Laravel (Wajib setelah update). |
| `php artisan migrate:status` | Mengecek apakah struktur database sudah terbaru. |

---

## 5. Tips Troubleshooting
- **Data Tidak Sinkron?** Pastikan database server dan lokal terhubung ke database yang sama di `.env`.
- **Error "Class not found"?** Jalankan `composer install` untuk memperbarui library.
- **UI Berantakan/Lama?** Jalankan `npm run build` di server untuk memperbarui asset frontend.

---
*Dibuat oleh Tim Teknis KKN UIN SAIZU - Februari 2026*
