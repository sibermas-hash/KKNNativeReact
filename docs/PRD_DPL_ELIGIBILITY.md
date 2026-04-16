# 📄 PRD: Sistem Validasi Syarat DPL & Workshop KKN

**Versi:** 1.0.0  
**Tanggal:** 14 April 2026  
**Status:** Approved  
**Tujuan:** Memastikan penugasan DPL tepat sasaran sesuai kriteria administratif kampus (Bukan CPNS, Tidak Tugas Belajar, dan Lulus Workshop).

---

## 1. Pendahuluan
Sistem KKN memerlukan filter administratif otomatis untuk menyaring Dosen yang layak menjadi Pembimbing Lapangan. Hal ini bertujuan untuk menjamin stabilitas pembimbingan selama masa KKN berlangsung dan memastikan Dosen memiliki bekal kompetensi melalui Workshop.

## 2. Aturan Bisnis Utama (Business Rules)
Terdapat tiga lapisan filter (Tri-Layer Validation) yang wajib dipatuhi oleh sistem:

### **A. Kriteria Kelayakan Peserta Workshop**
Dosen hanya diperbolehkan mendaftar/mengikuti Workshop jika memenuhi kriteria berikut:
1.  **Bukan CPNS:** Kolom `is_cpns` pada database harus bernilai `false`.
2.  **Tidak Sedang Tugas Belajar:** Kolom `is_tugas_belajar` pada database harus bernilai `false`.

### **B. Kriteria Kelayakan Menjadi DPL**
Seorang Dosen hanya diperbolehkan mendaftar atau ditugaskan sebagai DPL pada suatu periode jika:
1.  **Lulus Workshop:** Dosen telah terdaftar sebagai "Lulus" atau "Hadir" dalam Workshop yang diselenggarakan oleh Admin untuk tahun akademik/periode berjalan.

---

## 3. Persyaratan Fungsional (Functional Requirements)

| ID | Fitur | Deskripsi |
| :--- | :--- | :--- |
| **FR-01** | **Workshop Eligibility Filter** | Sistem secara otomatis memblokir akses pendaftaran Workshop bagi dosen dengan status CPNS atau Tugas Belajar. |
| **FR-02** | **Workshop Management** | Admin dapat membuat event Workshop, mencatat kehadiran, dan menandai status kelulusan workshop bagi dosen peserta. |
| **FR-03** | **DPL Assignment Guard** | Backend wajib menolak (Exception) jika Admin mencoba mengaktifkan Dosen di `dpl_periods` namun dosen tersebut tidak ditemukan dalam database kelulusan Workshop. |
| **FR-04** | **Eligibility Notification** | Sistem memberikan alasan yang jelas jika seorang dosen ditolak pendaftarannya (misal: "Status CPNS tidak diperbolehkan ikut Workshop"). |

---

## 4. Alur Kerja Sistem (System Workflow)

1.  **Sync Data:** Sistem menarik data NIP dan Status (CPNS/Tugas Belajar) dari API SIKAD.
2.  **Workshop Phase:** 
    *   Admin membuka pendaftaran Workshop.
    *   Sistem memvalidasi `is_cpns == false` & `is_tugas_belajar == false`. 
    *   Hanya dosen yang lolos kriteria di atas yang dapat terdaftar sebagai peserta.
    *   Setelah pelaksanaan, Admin memfinalisasi status kelulusan peserta Workshop.
3.  **DPL Assignment Phase:**
    *   Admin memilih Dosen untuk ditugaskan ke kelompok KKN.
    *   Sistem melakukan *cross-check* ke histori Workshop.
    *   Jika kriteria "Lulus Workshop" tidak terpenuhi, proses penugasan dihentikan oleh sistem.

---

## 5. Struktur Data (Data Schema Reference)
*   **Tabel `dosen`**: Referensi kolom `is_cpns` (boolean) dan `is_tugas_belajar` (boolean).
*   **Tabel `workshops`**: Menyimpan data event pelatihan (Nama, Tanggal, Tahun Akademik).
*   **Tabel `workshop_participants`**: Menghubungkan `dosen_id` dengan `workshop_id` disertai kolom `status` (Enum: pending, hadir, lulus, tidak_lulus).

---

## 6. Implementasi Logika Backend (Technical Blueprint)
Implementasi dilakukan pada `app/Services/DplEligibilityService.php` dengan metode utama:
- `canAttendWorkshop(Dosen $dosen): bool`
- `isQualifiedForDpl(Dosen $dosen, int $periodId): bool`

---
*Dokumen ini merupakan panduan baku integrasi logika DPL. Perubahan pada aturan ini harus melalui persetujuan pengelola sistem.*
