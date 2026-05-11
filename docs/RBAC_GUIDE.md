# SIBERMAS RBAC & Job Description Guide

Dokumen ini mendefinisikan struktur Role-Based Access Control (RBAC) pada sistem SIBERMAS KKN UIN SAIZU, memastikan setiap entitas memiliki wewenang yang sesuai dengan tanggung jawab operasionalnya.

---

## 1. Matriks Otoritas & Tanggung Jawab

| Role | Entitas | Lingkup Data | Job Description Utama |
| :--- | :--- | :--- | :--- |
| **Superadmin** | LPPM Pusat (IT) | Seluruh Sistem | Konfigurasi sistem, manajemen API Key AI, manajemen user, bypass validasi akademik (*Force Mode*), audit trail. |
| **Admin** | LPPM Pusat (Ops) | Seluruh Sistem | Manajemen pendaftaran, plotting kelompok otomatis/manual, verifikasi dokumen, manajemen DPL, penerbitan sertifikat massal. |
| **Faculty Admin** | Staf Fakultas | Per-Fakultas | **Monitoring Read-Only**. Memantau status pendaftaran dan nilai mahasiswa di lingkup fakultas terkait. |
| **DPL** | Dosen Pembimbing | Per-Kelompok | Bimbingan mahasiswa, verifikasi laporan harian (logbook), penilaian kinerja mahasiswa, validasi data posko. |
| **Dosen** | Akun Dosen Umum | Personal | Pendaftaran calon DPL, manajemen profil dosen, akses materi workshop. |
| **Student** | Mahasiswa | Personal | Pendaftaran KKN, unggah berkas, pengisian logbook (GPS-locked), bimbingan online, unduh sertifikat. |

---

## 2. Detail Kontrol Akses (Security Guards)

### 2.1. Proteksi Middleware Admin
Setiap request ke endpoint `/admin/*` divalidasi oleh `EnsureAdminAuthorization`. Sistem mencocokkan Controller yang diakses dengan izin spesifik:
- **Contoh:** Akses ke `PesertaKknController` memerlukan permission `manage-participants`.
- **Security Note:** Role `faculty_admin` memiliki izin `view-participants` namun **tidak memiliki** izin `manage-participants`, sehingga aksi mutasi (Create/Update/Delete) otomatis ditolak (403).

### 2.2. Data Scoping (Multi-Tenancy Fakultas)
Untuk mencegah kebocoran data antar fakultas, sistem menerapkan *automatic query scoping*:
```php
// Terimplementasi pada level model & service
if ($user->hasRole('faculty_admin')) {
    $query->where('fakultas_id', $user->fakultas_id);
}
```
Ini memastikan Admin Fakultas Syariah tidak bisa melihat data mahasiswa Fakultas Tarbiyah.

### 2.3. Integritas Penilaian (Grading Guard)
- **DPL:** Hanya bisa memberi nilai untuk mahasiswa di kelompok dampingannya.
- **Admin:** Dapat memberikan nilai/koreksi jika terjadi sengketa atau kendala teknis pada DPL.
- **Student:** **Read-Only**. Hanya bisa melihat hasil akhir setelah nilai difinalisasi dan fase `grading` berakhir.

---

## 3. Alur Kerja (Workflow Alignment)

### A. Alur Pendaftaran (Reguler)
1. **Student** mendaftar (Syarat SKS/IPK di-check otomatis oleh sistem).
2. **Admin** melakukan `bulkApprove` (Sistem memvalidasi ulang kelayakan akademik).
3. **Admin** menjalankan *Auto-Placement* (Sistem memplot kelompok berdasarkan kuota dan aturan Anti-Nepotisme).

### B. Alur Pelaksanaan
1. **DPL** memverifikasi kehadiran dan logbook mahasiswa (GPS Check).
2. **Ketua Kelompok** (Role khusus dalam `peserta_kkn`) mengelola data Posko dan Laporan Akhir Kelompok.
3. **DPL** memberikan penilaian akhir berdasarkan keaktifan harian.

### C. Alur Kelulusan
1. **Admin** melakukan yudisium massal.
2. **Student** mengunduh Sertifikat Digital (Bentuk PDF Biner) melalui portal.

---

## 4. Audit & Akuntabilitas
Seluruh aksi sensitif yang dilakukan oleh role dengan otoritas tinggi (`superadmin`, `admin`, `dpl`) dicatat dalam tabel `log_audits`.
- **Informasi yang dicatat:** Timestamp, User ID, Action, Model Affected, Old Values, New Values, dan IP Address.

---
*Dibuat oleh Tim Auditor SIBERMAS - Minggu, 10 Mei 2026*
