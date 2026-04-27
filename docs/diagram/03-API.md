# SIBERMAS API Documentation

## Base URL
```
Production: https://kkn.uinsaizu.ac.id/api/v1
Development: http://localhost:8000/api/v1
```

## Authentication
- **Method**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer <token>`
- **Login**: POST `/auth/login`

---

## API Endpoints by Module

### 1. Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/login` | User login | Public |
| POST | `/auth/register` | Student registration | Public |
| POST | `/auth/logout` | User logout | Token |
| POST | `/auth/refresh` | Refresh token | Token |
| GET | `/auth/me` | Get current user | Token |
| POST | `/auth/forgot-password` | Request password reset | Public |
| POST | `/auth/reset-password` | Reset password | Public |

### 2. Master Data

#### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/users` | List all users | Admin |
| GET | `/users/{id}` | Get user detail | Token |
| POST | `/users` | Create user | Admin |
| PUT | `/users/{id}` | Update user | Admin |
| DELETE | `/users/{id}` | Delete user | Admin |

#### Dosen
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dosen` | List all dosen | Admin |
| GET | `/dosen/options` | Dosen options for select | Admin |
| GET | `/dosen/{id}` | Get dosen detail | Admin |
| POST | `/dosen` | Create dosen | Admin |
| PUT | `/dosen/{id}` | Update dosen | Admin |
| DELETE | `/dosen/{id}` | Delete dosen | Admin |

#### Mahasiswa
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/mahasiswa` | List all mahasiswa | Admin |
| GET | `/mahasiswa/{id}` | Get mahasiswa detail | Admin |
| POST | `/mahasiswa` | Create mahasiswa | Admin |
| PUT | `/mahasiswa/{id}` | Update mahasiswa | Admin |
| DELETE | `/mahasiswa/{id}` | Delete mahasiswa | Admin |

#### Prodi
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/prodi` | List all prodi | Public |
| GET | `/prodi/options` | Prodi options | Public |
| GET | `/prodi/{id}` | Get prodi detail | Public |
| POST | `/prodi` | Create prodi | Admin |
| PUT | `/prodi/{id}` | Update prodi | Admin |
| DELETE | `/prodi/{id}` | Delete prodi | Admin |

#### Fakultas
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/fakultas` | List all fakultas | Public |
| GET | `/fakultas/options` | Fakultas options | Public |
| GET | `/fakultas/{id}` | Get fakultas detail | Public |
| POST | `/fakultas` | Create fakultas | Admin |
| PUT | `/fakultas/{id}` | Update fakultas | Admin |
| DELETE | `/fakultas/{id}` | Delete fakultas | Admin |

#### Tahun Akademik
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/tahun-akademik` | List tahun akademik | Public |
| GET | `/tahun-akademik/options` | Options for select | Public |
| POST | `/tahun-akademik` | Create | Admin |
| PUT | `/tahun-akademik/{id}` | Update | Admin |
| DELETE | `/tahun-akademik/{id}` | Delete | Admin |

#### Periode
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/periode` | List all periode | Public |
| GET | `/periode/options` | Options for select | Public |
| GET | `/periode/{id}` | Get detail | Admin |
| POST | `/periode` | Create | Admin |
| PUT | `/periode/{id}` | Update | Admin |
| DELETE | `/tahun-akademik/{id}` | Delete | Admin |

#### Lokasi
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/lokasi` | List lokasi | Public |
| GET | `/lokasi/options` | Lokasi options | Public |
| GET | `/lokasi/{id}` | Get detail | Admin |
| POST | `/lokasi` | Create | Admin |
| PUT | `/lokasi/{id}` | Update | Admin |
| DELETE | `/lokasi/{id}` | Delete | Admin |

#### Jenis KKN
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/jenis-kkn` | List jenis KKN | Public |
| GET | `/jenis-kkn/options` | Options | Public |
| POST | `/jenis-kkn` | Create | Admin |
| PUT | `/jenis-kkn/{id}` | Update | Admin |
| DELETE | `/jenis-kkn/{id}` | Delete | Admin |

---

### 3. KKN Registration &Kelompok

#### Registration
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/pendaftaran` | List all registration | DPL/Admin |
| GET | `/pendaftaran/mahasiswa` | Get my registration | Student |
| POST | `/pendaftaran` | Register for KKN | Student |
| PUT | `/pendaftaran/{id}` | Update registration | Student |
| DELETE | `/pendaftaran/{id}` | Cancel registration | Admin |
| PUT | `/pendaftaran/{id}/verify` | Verify registration | Admin |
| PUT | `/pendaftaran/{id}/reject` | Reject registration | Admin |
| PUT | `/pendaftaran/{id}/accept` | Accept registration | Admin |

#### Kelompok KKN
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/kelompok` | List all kelompok | DPL/Admin |
| GET | `/kelompok/my` | My kelompok | Student |
| GET | `/kelompok/dpl` | DPL's kelompok | DPL |
| GET | `/kelompok/{id}` | Get detail | Token |
| POST | `/kelompok` | Create kelompok | Admin |
| PUT | `/kelompok/{id}` | Update kelompok | Admin |
| DELETE | `/kelompok/{id}` | Delete kelompok | Admin |
| PUT | `/kelompok/{id}/add-member` | Add mahasiswa | Admin |
| PUT | `/kelompok/{id}/remove-member` | Remove mahasiswa | Admin |

---

### 4. Absensi

#### Attendance
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/absensi` | List attendance | DPL/Admin |
| GET | `/absensi/peserta` | Attendances by participant | DPL |
| GET | `/absensi/rekap` | Rekap attendance | DPL/Admin |
| GET | `/absensi/harian` | Daily attendance | Token |
| POST | `/absensi/check-in` | Check in | Student |
| POST | `/absensi/check-out` | Check out | Student |
| PUT | `/absensi/{id}` | Update attendance | DPL |
| DELETE | `/absensi/{id}` | Delete attendance | Admin |

#### Attendance Photos
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/absensi-foto` | List photos | DPL |
| POST | `/absensi-foto` | Upload photo | Student |
| GET | `/absensi-foto/{id}` | Get photo | Token |
| DELETE | `/absensi-foto/{id}` | Delete photo | Admin |

#### Absensi Harian
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/absensi-harian` | List daily absensi | DPL/Admin |
| GET | `/absensi-harian/summary` | Summary for kelompok | DPL |
| GET | `/absensi-harian/rekap` | Rekap by date | Admin |
| POST | `/absensi-harian` | Create daily record | Student |
| PUT | `/absensi-harian/{id}` | Update record | Student |

---

### 5. Permissions & Dispensasi

#### Permission / Izin
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/izin` | List all izin | DPL/Admin |
| GET | `/izin/mine` | My izin requests | Student |
| GET | `/izin/{id}` | Get detail | Token |
| POST | `/izin` | Submit izin request | Student |
| PUT | `/izin/{id}` | Update request | Student |
| PUT | `/izin/{id}/approve` | Approve izin | DPL |
| PUT | `/izin/{id}/reject` | Reject izin | DPL |
| DELETE | `/izin/{id}` | Cancel request | Student |

#### Dispensasi
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dispensasi` | List all dispensasi | DPL/Admin |
| GET | `/dispensasi/mine` | My dispensasi | Student |
| GET | `/dispensasi/{id}` | Get detail | Token |
| POST | `/dispensasi` | Submit dispensasi | Student |
| PUT | `/dispensasi/{id}` | Update | Student |
| PUT | `/dispensasi/{id}/approve` | Approve | DPL |
| PUT | `/dispensasi/{id}/reject` | Reject | DPL |
| DELETE | `/dispensasi/{id}` | Cancel | Student |

---

### 6. Activities & Programs

#### Program Kerja
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/program-kerja` | List all programs | Public |
| GET | `/program-kerja/options` | Program options | Public |
| GET | `/program-kerja/kelompok/{id}` | Programs by kelompok | DPL |
| GET | `/program-kerja/{id}` | Get detail | Token |
| POST | `/program-kerja` | Create program | DPL |
| PUT | `/program-kerja/{id}` | Update | DPL |
| DELETE | `/program-kerja/{id}` | Delete | Admin |

#### Proposal Program Kerja
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/proposal` | List all proposals | DPL |
| GET | `/proposal/kelompok/{id}` | Proposals by kelompok | DPL |
| GET | `/proposal/{id}` | Get detail | Token |
| POST | `/proposal` | Submit proposal | Student |
| PUT | `/proposal/{id}` | Update proposal | Student |
| PUT | `/proposal/{id}/approve` | Approve proposal | DPL |
| PUT | `/proposal/{id}/reject` | Reject proposal | DPL |
| DELETE | `/proposal/{id}` | Delete proposal | Student |

#### Kegiatan KKN
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/kegiatan` | List all activities | DPL |
| GET | `/kegiatankkn/mahasiswa/{id}` | Activities by mahasiswa | DPL |
| GET | `/kegiatankkn/{id}` | Get detail | Token |
| POST | `/kegiatankkn` | Log activity | Student |
| PUT | `/kegiatankkn/{id}` | Update activity | Student |
| DELETE | `/kegiatankkn/{id}` | Delete activity | Student |

#### Laporan Akhir
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/laporan-akhir` | List all reports | DPL/Admin |
| GET | `/laporan-akhir/mine` | My laporan | Student |
| GET | `/laporan-akhir/{id}` | Get detail | Token |
| POST | `/laporan-akhir` | Submit laporan | Student |
| PUT | `/laporan-akhir/{id}` | Update laporan | Student |
| PUT | `/laporan-akhir/{id}/approve` | Approve laporan | DPL |
| PUT | `/laporan-akhir/{id}/reject` | Reject laporan | DPL |
| DELETE | `/laporan-akhir/{id}` | Delete laporan | Student |

---

### 7. Evaluation & Scoring

#### Evaluasi
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/evaluasi` | List all evaluasi | Admin |
| GET | `/evaluasi/peserta/{id}` | Evaluasi by peserta | DPL |
| GET | `/evaluasi/{id}` | Get detail | Token |
| POST | `/evaluasi` | Submit evaluasi | DPL |
| PUT | `/evaluasi/{id}` | Update evaluasi | DPL |

#### Item Evaluasi
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/item-evaluasi` | List items | Public |
| POST | `/item-evaluasi` | Create | Admin |
| PUT | `/item-evaluasi/{id}` | Update | Admin |
| DELETE | `/item-evaluasi/{id}` | Delete | Admin |

#### Nilai KKN
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/nilai` | List all nilai | Admin |
| GET | `/nilai/peserta/{id}` | Nilai by peserta | Student |
| GET | `/nilai/{id}` | Get detail | Token |
| POST | `/nilai` | Calculate nilai | Admin |
| PUT | `/nilai/{id}` | Update nilai | Admin |
| DELETE | `/nilai/{id}` | Delete nilai | Admin |

#### Evaluasi DPL Peserta
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/evaluasi-dpl` | List evaluasi DPL | DPL |
| GET | `/evaluasi-dpl/peserta/{id}` | By peserta | DPL |
| GET | `/evaluasi-dpl/{id}` | Get detail | Token |
| POST | `/evaluasi-dpl` | Submit evaluasi | DPL |
| PUT | `/evaluasi-dpl/{id}` | Update | DPL |

#### Item Evaluasi DPL Peserta
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/item-evaluasi-dpl` | List items | Public |
| POST | `/item-evaluasi-dpl` | Create | Admin |
| PUT | `/item-evaluasi-dpl/{id}` | Update | Admin |
| DELETE | `/item-evaluasi-dpl/{id}` | Delete | Admin |

---

### 8. Certificates

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/sertifikat` | List all sertifikat | Admin |
| GET | `/sertifikat/mine` | My sertifikat | Student |
| GET | `/sertifikat/{id}` | Get detail | Token |
| POST | `/sertifikat/generate` | Generate sertifikat | Admin |
| GET | `/sertifikat/{id}/cetak` | Print/download PDF | Token |
| GET | `/sertifikat-word/{id}` | Download Word | Token |
| GET | `/sertifikat/{id}/preview` | Preview | Admin |
| GET | `/verify/{token}` | Verify certificate | Public |
| DELETE | `/sertifikat/{id}` | Delete sertifikat | Admin |

---

### 9. Reports & Dashboard

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/dashboard/statistik` | Dashboard stats | DPL/Admin |
| GET | `/dashboard/kelompok/{id}` | Kelompok summary | DPL |
| GET | `/laporan/peserta` | Peserta report | Admin |
| GET | `/laporan/absensi` | Absensi report | DPL/Admin |
| GET | `/laporan/nilai` | Nilai report | Admin |
| GET | `/laporan/kelompok` | Kelompok report | Admin |
| GET | `/export/excel` | Export Excel | Admin |
| GET | `/export/pdf` | Export PDF | Admin |

---

### 10. Notifications

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/notifikasi` | List notifications | Token |
| GET | `/notifikasi/unread` | Unread count | Token |
| PUT | `/notifikasi/{id}/read` | Mark as read | Token |
| PUT | `/notifikasi/read-all` | Mark all read | Token |
| DELETE | `/notifikasi/{id}` | Delete notification | Token |

---

### 11. Pengumuman

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/pengumuman` | List pengumuman | Public |
| GET | `/pengumuman/{id}` | Get detail | Public |
| POST | `/pengumuman` | Create | Admin |
| PUT | `/pengumuman/{id}` | Update | Admin |
| DELETE | `/pengumuman/{id}` | Delete | Admin |

---

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "meta": {
    "current_page": 1,
    "total_page": 10,
    "total_data": 100
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": {
    "field": ["Error message"]
  }
}
```

### List Response
```json
{
  "success": true,
  "data": [...],
  "meta": {
    "current_page": 1,
    "per_page": 15,
    "total": 100,
    "last_page": 7
  }
}
```

---

## Query Parameters

| Parameter | Type | Description |
|-----------|------|--------------|
| `page` | int | Page number |
| `limit` | int | Items per page |
| `search` | string | Search keyword |
| `sort` | string | Sort field |
| `order` | asc/desc | Sort order |
| `filter[field]` | mixed | Filter by field |

---

## HTTP Status Codes

| Code | Description |
|------|--------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Server Error |