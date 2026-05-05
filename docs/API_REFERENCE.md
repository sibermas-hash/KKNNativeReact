# SIBERMAS — Referensi API

**Base URL:** `https://sibermas.uinsaizu.ac.id/api/v1` (production)  
**Base URL:** `http://localhost:8000/api/v1` (development)

**Auth:** Semua endpoint (kecuali yang ditandai `public`) memerlukan:
- **Web:** Sanctum session cookie (`withCredentials: true`)
- **Mobile:** `Authorization: Bearer <token>` + header `X-App-Type: mobile`

**Response envelope:**
```json
{ "success": true, "data": { ... }, "message": "..." }
{ "success": false, "error": { "code": "ERROR_CODE", "message": "..." } }
```

---

## Auth

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| GET | `/auth/captcha` | public | Generate CAPTCHA math |
| POST | `/auth/login` | public | Login (web/mobile) |
| POST | `/auth/logout` | ✓ | Logout + revoke token |
| GET | `/auth/user` | ✓ | Data user aktif |
| POST | `/auth/lupa-kata-sandi` | public | Kirim link reset password |
| POST | `/auth/atur-ulang-kata-sandi` | public | Reset password dengan token |

**Login request:**
```json
{
  "login": "username_atau_email",
  "password": "password",
  "captcha_id": "uuid",
  "captcha_answer": "7",
  "remember": false
}
```

**Login response (web):** `{ "success": true, "data": { "user": {...} } }`  
**Login response (mobile):** `{ "success": true, "data": { "token": "...", "user": {...} } }`

---

## Profile

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/profile` | Lihat profil |
| PATCH | `/profile` | Update profil |
| POST | `/profile/avatar` | Upload foto profil |
| PATCH | `/profile/password` | Ganti password |

---

## Student (`/student/*`)

> Middleware: `auth:sanctum` + `role:student` + `EnsurePasswordChanged` + `EnsureProfileCompleted`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/student/dashboard` | Dashboard mahasiswa |
| GET | `/student/registration/form` | Form pendaftaran KKN |
| POST | `/student/registration` | Daftar KKN |
| GET | `/student/registration/status` | Status pendaftaran |
| DELETE | `/student/registration/{periode}` | Batalkan pendaftaran |
| POST | `/student/registration/{id}/documents` | Upload dokumen pendaftaran |
| GET | `/student/daily-reports` | Daftar logbook (paginasi, filter: `status`, `search`) |
| POST | `/student/daily-reports` | Buat logbook (multipart/form-data) |
| GET | `/student/daily-reports/{id}` | Detail logbook |
| PUT | `/student/daily-reports/{id}` | Edit logbook |
| DELETE | `/student/daily-reports/{id}` | Hapus logbook |
| GET | `/student/work-programs` | Daftar program kerja |
| POST | `/student/work-programs` | Buat program kerja |
| GET | `/student/work-programs/{id}` | Detail program kerja |
| POST | `/student/work-programs/{id}/proposal` | Upload proposal |
| GET | `/student/leave-requests` | Daftar izin |
| POST | `/student/leave-requests` | Ajukan izin |
| GET | `/student/final-report` | Laporan akhir |
| POST | `/student/final-report` | Upload laporan akhir |
| GET | `/student/certificates` | Sertifikat & nilai |
| GET | `/student/certificates/{id}/download` | Download sertifikat |
| GET | `/student/dpl-evaluation/form` | Form evaluasi DPL |
| POST | `/student/dpl-evaluation` | Submit evaluasi DPL |
| GET | `/student/workshops` | Daftar workshop |
| GET | `/student/posko` | Info posko |
| POST | `/student/posko` | Update posko |
| GET | `/student/domisili` | Data domisili |
| POST | `/student/domisili` | Update domisili |

---

## DPL (`/dpl/*`)

> Middleware: `auth:sanctum` + `role:dpl|superadmin`

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/dpl/dashboard` | Dashboard DPL |
| GET | `/dpl/groups` | Kelompok binaan |
| GET | `/dpl/groups/{id}` | Detail kelompok |
| GET | `/dpl/daily-reports` | Logbook mahasiswa |
| PATCH | `/dpl/daily-reports/{id}/approve` | Setujui logbook |
| PATCH | `/dpl/daily-reports/{id}/revision` | Minta revisi logbook |
| POST | `/dpl/daily-reports/batch-approve` | Setujui massal |
| GET | `/dpl/evaluations` | Daftar evaluasi |
| POST | `/dpl/evaluations` | Input nilai evaluasi |
| GET | `/dpl/final-reports` | Laporan akhir mahasiswa |
| PATCH | `/dpl/final-reports/{id}/approve` | Setujui laporan akhir |
| PATCH | `/dpl/final-reports/{id}/revision` | Minta revisi |
| GET | `/dpl/monitoring` | Monitoring kunjungan |
| POST | `/dpl/monitoring` | Catat kunjungan |
| GET | `/dpl/leave-requests` | Permohonan izin |
| PATCH | `/dpl/leave-requests/{id}/approve` | Setujui izin |
| PATCH | `/dpl/leave-requests/{id}/reject` | Tolak izin |
| GET | `/dpl/feedback` | Umpan balik peserta |

---

## Admin (`/admin/*`)

> Middleware: `auth:sanctum` + `role:superadmin|admin|faculty_admin`

### Dashboard & Periode
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/admin/hub` | Hub admin |
| GET | `/admin/dashboard` | Statistik dashboard |
| POST | `/admin/dashboard/switch-phase` | Ganti fase KKN |
| GET/POST/PUT/DELETE | `/admin/periode` | CRUD periode |
| POST | `/admin/periode/{id}/duplicate` | Duplikat periode |

### Master Data
| Method | Endpoint | Keterangan |
|---|---|---|
| GET/POST/PUT/DELETE | `/admin/tahun-akademik` | Tahun akademik |
| GET/POST/PUT/DELETE | `/admin/jenis-kkn` | Jenis KKN |
| GET/POST/PUT/DELETE | `/admin/fakultas` | Fakultas |
| GET/POST/PUT/DELETE | `/admin/prodi` | Program studi |
| GET/POST/PUT/DELETE | `/admin/lokasi` | Lokasi KKN |

### Pendaftaran & Kelompok
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/admin/pendaftaran` | Daftar pendaftaran |
| PATCH | `/admin/pendaftaran/{id}/approve` | Setujui |
| PATCH | `/admin/pendaftaran/{id}/reject` | Tolak |
| POST | `/admin/pendaftaran/bulk-approve` | Setujui massal |
| GET/POST/PUT/DELETE | `/admin/kelompok` | CRUD kelompok |

### Pengguna
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/admin/pengguna` | Daftar pengguna |
| POST | `/admin/pengguna` | Buat pengguna |
| PATCH | `/admin/pengguna/{id}/ubah-status` | Aktif/nonaktif |
| POST | `/admin/pengguna/{id}/reset-password` | Reset password |
| GET | `/admin/mahasiswa` | Daftar mahasiswa |
| GET | `/admin/dosen` | Daftar dosen |

### Nilai & Akademik
| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/admin/nilai` | Rekap nilai |
| GET | `/admin/grade-reports` | Laporan nilai |
| PATCH | `/admin/grade-reports/{id}/finalize` | Finalisasi nilai |
| GET | `/admin/generator-nilai` | Generator nilai |
| GET | `/admin/yudisium` | Yudisium |
| GET | `/admin/rekapitulasi` | Rekapitulasi |

### Sistem
| Method | Endpoint | Keterangan |
|---|---|---|
| GET/PATCH | `/admin/pengaturan/sistem` | Pengaturan sistem |
| GET/POST | `/admin/pengaturan/sertifikat` | Konfigurasi sertifikat |
| GET | `/admin/audit-log` | Log audit |

---

## Public (tanpa auth)

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/public/home` | Data halaman utama |
| GET | `/public/announcements` | Berita/pengumuman |
| GET | `/public/announcements/{slug}` | Detail berita |
| GET | `/public/locations` | Lokasi KKN |
| GET | `/public/downloads` | Unduhan |
| GET | `/public/verify-certificate/{token}` | Verifikasi sertifikat |
| GET | `/health` | Health check |

---

## Error Codes

| Code | HTTP | Keterangan |
|---|---|---|
| `UNAUTHORIZED` | 401 | Belum login |
| `FORBIDDEN` | 403 | Tidak punya akses |
| `PASSWORD_CHANGE_REQUIRED` | 403 | Wajib ganti password |
| `PROFILE_INCOMPLETE` | 403 | Profil belum lengkap |
| `VALIDATION_ERROR` | 422 | Data tidak valid |
| `NOT_FOUND` | 404 | Data tidak ditemukan |
| `RATE_LIMITED` | 429 | Terlalu banyak request |
| `SERVER_ERROR` | 500 | Error internal |
