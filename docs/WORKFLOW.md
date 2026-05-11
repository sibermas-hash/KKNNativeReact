# 📋 SIBERMAS KKN Workflow Documentation

**Tanggal:** 11 Mei 2026  
**Versi:** 1.0  
**Status:** ✅ Production Ready

Dokumen ini menjelaskan alur kerja (workflow) sistem KKN UIN SAIZU berdasarkan fase dan role.

---

## 📋 Daftar Isi

1. [Fase KKN](#1-fase-kkn)
2. [Workflow per Fase](#2-workflow-per-fase)
3. [Jobdesc per Role](#3-jobdesc-per-role)
4. [API Routes](#4-api-routes)
5. [State Diagram](#5-state-diagram)

---

## 1. Fase KKN

Sistem KKN memiliki **6 fase** yang dikontrol melalui middleware `EnsurePhase`:

| # | Fase | Kode | Deskripsi | Durasi |
|---|------|------|----------|-------|
| 1 | Pra-Pendaftaran | `upcoming` | Masa persiapan sebelum daftar dibuka | - |
| 2 | Pendaftaran | `registration` | Masa pendaftaran peserta | ±2 minggu |
| 3 | Seleksi & Plotting | `placement` | Seleksi dan penempatan kelompok | ±1 minggu |
| 4 | Pelaksanaan | `execution` | Masa kerja lapangan | 30-50 hari |
| 5 | Penilaian | `grading` | Masa penilaian dan LPJ | ±2 minggu |
| 6 | Selesai | `finished` | KKN selesai, sertifikat issued | - |

### 1.1 Fase Flow

```
upcoming → registration → placement → execution → grading → finished
    │           │           │           │           │
    │           │           │           │           └── 📜 Certificate issued
    │           │           │           └── 👨‍🏫 DPL grading
    │           │           └── 📍 GPS check + Daily Report
    │           └── 👥 Kelompok assignment
    └── 📢 Announcement
```

---

## 2. Workflow per Fase

### 2.1 Fase: upcoming (Pra-Pendaftaran)

| Aktivitas | Student | Dosen | DPL | Admin | Faculty Admin | Superadmin |
|----------|---------|-------|-----|------|------------|----------|
| Lihat info KKN | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Lihat pengumuman | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Daftar sebagai DPL | - | ✅ | - | - | - | ✅ |
| Setup periode | - | - | - | ✅ | - | ✅ |
| Setup jenis KKN | - | - | - | ✅ | - | ✅ |
| Kelola lokasi | - | - | - | ✅ | - | ✅ |
| Kelola workshop | - | - | - | ✅ | - | ✅ |

### 2.2 Fase: registration (Pendaftaran)

| Aktivitas | Student | Dosen | DPL | Admin | Faculty Admin | Superadmin |
|----------|---------|-------|-----|------|------------|----------|
| **Daftar KKN** | ✅ | - | - | - | - | - |
| Upload dokumen | ✅ | - | - | - | - | - |
| Lihat status daftar | ✅ | - | - | ✅ | ✅ | ✅ |
| Lihat eligible periods | ✅ | - | - | - | - | - |
| Validasi kelayakan | - | - | - | ✅ | ✅ | ✅ |
| Approve/Reject peserta | - | - | - | ✅ | ⚠️ R | ✅ |
| Kelola kelompok | - | - | - | ✅ | ⚠️ R | ✅ |
| Import peserta | - | - | - | ✅ | - | ✅ |

> ⚠️ R = READ-ONLY (diblokir di controller level)

### 2.3 Fase: placement (Seleksi & Plotting)

| Aktivitas | Student | Dosen | DPL | Admin | Faculty Admin | Superadmin |
|----------|---------|-------|-----|------|------------|----------|
| Lihat kelompok | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Submit foto avatar | ✅ | - | - | - | - | - |
| Avatar moderation | - | - | AI | ✅ | - | ✅ |
| Assign ke kelompok | - | - | - | ✅ | ⚠️ R | ✅ |
| Assign DPL | - | - | - | ✅ | ⚠️ R | ✅ |
| Setup posko | ✅ | - | - | - | - | - |
| Input coordinate | ✅ | - | - | - | - | - |

### 2.4 Fase: execution (Pelaksanaan)

| Aktivitas | Student | Dosen | DPL | Admin | Faculty Admin | Superadmin |
|----------|---------|-------|-----|------|------------|----------|
| Daily report | ✅ | - | - | - | - | - |
| GPS anti-spoofing | ✅ | - | - | - | - | - |
| Logbook entries | ✅ | - | - | - | - | - |
| Izin meninggalkan | ✅ | - | - | - | - | - |
| Dispensasi | - | - | - | ✅ | ⚠️ R | ✅ |
| View logbook | - | - | ✅ | ✅ | ✅ | ✅ |
| View daily report | - | - | ✅ | ✅ | ✅ | ✅ |
| Bimbingan | - | - | ✅ | - | - | - |
| View posko | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| Update work program | ✅ | - | - | - | - | - |
| Upload kegiatan | ✅ | - | - | - | - | - |

### 2.5 Fase: grading (Penilaian)

| Aktivitas | Student | Dosen | DPL | Admin | Faculty Admin | Superadmin |
|----------|---------|-------|-----|------|------------|----------|
| Submit final report | ✅ | - | - | - | - | - |
| Submit poster | ✅ | - | - | - | - | - |
| Nilai peserta | - | - | ✅ | - | - | - |
| Generate nilai | - | - | - | ✅ | ⚠️ R | ✅ |
| View rekapitulasi | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| View grades | - | - | ✅ | ✅ | ✅ | ✅ |
| Download nilai | - | - | - | ✅ | ⚠️ R | ✅ |

### 2.6 Fase: finished (Selesai)

| Aktivitas | Student | Dosen | DPL | Admin | Faculty Admin | Superadmin |
|----------|---------|-------|-----|------|------------|----------|
| Download sertifikat | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| View final grades | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| View rekapitulasi | ✅ | - | ✅ | ✅ | ✅ | ✅ |
| Export laporan | - | - | - | ✅ | ⚠️ R | ✅ |
| Yudisium | - | - | - | ✅ | - | ✅ |

---

## 3. Jobdesc per Role

### 3.1 superadmin

| Atribut | Nilai |
|---------|-------|
| **Role** | superadmin |
| **Access Level** | 100% |
| **Fase Coverage** | ALL |
| **Permissions** | 25 (all) |

#### Jobdesc:
1. System-wide administration
2. Manage system settings
3. AI key rotation management
4. User management (CRUD)
5. Periode management (setup, switch phase)
6. Master data management
7. Audit logs access
8. Export all reports
9. Yudisium ceremony management

---

### 3.2 admin

| Atribut | Nilai |
|---------|-------|
| **Role** | admin |
| **Access Level** | 99% (tanpa manage-settings) |
| **Fase Coverage** | ALL |
| **Permissions** | 24 |

#### Jobdesc:
1. KKN operations management
2. Participant management (CRUD)
3. Group/kelompok management
4. DPL assignment
5. Grade management
6. Report management
7. Announcement management
8. Workshop management
9. Sync data from SIAKAD
10. Eligibility management

---

### 3.3 faculty_admin

| Atribut | Nilai |
|---------|-------|
| **Role** | faculty_admin |
| **Access Level** | 28% (READ-ONLY) |
| **Fase Coverage** | ALL |
| **Permissions** | 7 |

#### Jobdesc:
1. View participants di faculty-nya (READ-ONLY)
2. View grades di faculty-nya (READ-ONLY)
3. View reports di faculty-nya (READ-ONLY)
4. View audit logs (READ-ONLY)
5. View kelompok di faculty-nya
6. View DPL di faculty-nya

#### 🔒 Restrictions:
- ❌ Cannot POST/CREATE new participants
- ❌ Cannot PATCH/UPDATE any data
- ❌ Cannot DELETE any data
- ❌ Cannot manage grades
- Blocked at controller level (PesertaKknController, GradeController, dll)

---

### 3.4 dosen

| Atribut | Nilai |
|---------|-------|
| **Role** | dosen |
| **Access Level** | 4% |
| **Fase Coverage** | upcoming + registration + grading + finished |
| **Permissions** | 1 (access-dosen-panel) |

#### Jobdesc:
1. Register as DPL for KKN
2. Access dosen dashboard
3. View workshops
4. Register for workshops
5. Download workshop certificates

#### Catatan:
- Untuk akses DPL ke peserta, harus daftar sebagai DPL terlebih dahulu
- Setelah approved sebagai DPL, dapat mengakses fitur DPL

---

### 3.5 dpl

| Atribut | Nilai |
|---------|-------|
| **Role** | dpl |
| **Access Level** | 4% + pivot |
| **Fase Coverage** | placement + execution + grading |
| **Permissions** | 1 (access-dosen-panel) |

#### Jobdesc:
1. View assigned groups (via dpl_kelompok pivot)
2. Monitor daily reports
3. View logbook entries
4. Conduct bimbingan sessions
5. Evaluate participants
6. Submit grades
7. Approve final reports

#### Akses Pivot:
- Hanya dapat mengakses peserta di kelompok yang sudah di-assign
- Role dalam kelompok: `ketua` atau `anggota`

---

### 3.6 student

| Atribut | Nilai |
|---------|-------|
| **Role** | student |
| **Access Level** | 0% (no admin permission) |
| **Fase Coverage** | ALL |
| **Permissions** | 0 (via API routes) |

#### Jobdesc:
1. Register for KKN (fase: registration)
2. Upload registration documents
3. Select kelompok
4. Submit avatar for moderation
5. Submit daily reports (fase: execution)
6. Fill logbook
7. Request izin meninggalkan
8. Update posko info
9. Submit work programs
10. Submit final report
11. Submit poster
12. Download certificate

---

## 4. API Routes

### 4.1 Student Routes (`/api/v1/student/*`)

| Method | Endpoint | Fase | Middleware |
|--------|----------|------|-----------|
| GET | /dashboard | ALL | auth:sanctum, role:student |
| GET | /registration/status | ALL | auth:sanctum, role:student |
| GET | /registration/form | ALL | auth:sanctum, role:student |
| DELETE | /registration/{periode} | registration | auth:sanctum, role:student |
| GET | /kkn-daftar | registration | phase:registration |
| GET | /kkn-daftar/{periode}/kelompok | registration | phase:registration, throttle:10,1 |
| GET | /posko | execution | phase:execution,grading |
| POST | /posko | execution | phase:execution |
| GET | /rekapitulasi | ALL | auth:sanctum |
| POST | /daily-report | execution | phase:execution |
| GET | /logbook | execution | phase:execution |
| POST | /logbook | execution | phase:execution |
| GET | /izin | execution | phase:execution |
| POST | /izin | execution | phase:execution |
| GET | /work-programs | execution | phase:execution |
| POST | /work-programs | execution | phase:execution |
| GET | /final-report | grading | phase:grading |
| POST | /final-report | grading | phase:grading |
| GET | /poster | grading | phase:grading |
| POST | /poster | grading | phase:grading |
| GET | /certificate | finished | phase:finished |

### 4.2 Admin Routes (`/api/v1/admin/*`)

| Method | Endpoint | Permission | Roles |
|--------|----------|-----------|-------|
| GET | /dashboard | - | superadmin, admin, faculty_admin |
| POST | /dashboard/switch-phase | manage-kkn-operations | superadmin, admin |
| GET | /periode | manage-kkn-operations | superadmin, admin |
| POST | /periode | manage-kkn-operations | superadmin, admin |
| GET | /peserta-kkn | view-participants | superadmin, admin, faculty_admin |
| POST | /peserta-kkn | manage-participants | superadmin, admin |
| PATCH | /peserta-kkn/{id} | manage-participants | superadmin, admin |
| DELETE | /peserta-kkn/{id} | manage-participants | superadmin, admin |
| GET | /kelompok-kkn | manage-groups | superadmin, admin, faculty_admin |
| POST | /kelompok-kkn | manage-groups | superadmin, admin |
| GET | /nilai | view-grades | superadmin, admin, faculty_admin |
| POST | /nilai | manage-grades | superadmin, admin |
| GET | /users | manage-users | superadmin, admin |
| POST | /users | manage-users | superadmin, admin |
| GET | /announcements | manage-announcements | superadmin, admin, faculty_admin |
| GET | /reports | view-reports | superadmin, admin, faculty_admin |
| GET | /audit-logs | view-audit-logs | superadmin, admin, faculty_admin |

### 4.3 Dosen/DPL Routes

#### Dosen (`/api/v1/dosen/*`)

| Method | Endpoint | Fase |
|--------|----------|------|
| GET | /dashboard | ALL |
| GET | /workshops | ALL |
| POST | /workshops/{id}/register | ALL |
| GET | /available-periods | upcoming |
| POST | /daftar-dpl | upcoming |

#### DPL (`/api/v1/dpl/*`)

| Method | Endpoint | Fase |
|--------|----------|------|
| GET | /dashboard | ALL |
| GET | /groups | placement+ |
| GET | /groups/{id} | placement+ |
| GET | /logbook/{pesertaId} | execution |
| POST | /bimbingan | execution |
| GET | /evaluations | grading |
| POST | /evaluations | grading |

---

## 5. State Diagram

### 5.1 Participant State Machine

```
┌──────────────────┐
│   NOT_REGISTERED │ (initial state)
└────────┬────────┘
         │ student submits registration
         ▼
┌──────────────────┐
│    PENDING      │ ◄─── admin reviews
└────────┬────────┘        │
         │ approved         │ rejected
         ▼                ▼
┌──────────────────┐   ┌─────────────────┐
│    APPROVED      │   │   REJECTED      │
└────────┬────────┘   └─────────────────┘
         │
         │ admin assigns to kelompok
         ▼
┌──────────────────┐
│    PLACED        │
└────────┬────────┘
         │ phase = execution
         ▼
┌──────────────────┐
│    ACTIVE        │ ◄─── daily reports +
└────────┬────────┘        │ logbook entries
         ��� phase = grading│
         ▼                ▼
┌──────────────────┐   ┌─────────────────┐
│   COMPLETED      │   │   DROPPED       │
│   (has certificate)│  │  (left early)  │
└──────────────────┘   └─────────────────┘
```

### 5.2 Roles State

```
student ──[register]──> pending ──[approve]──> placed ──[execute]──> completed
                      ▲                   │
                      │                   ▼
                      │            ┌──────────────┐
                      └────────────┤  REJECTED    │
                                   └──────────────┘
```

---

## 📊 Summary

| Role | Fase Coverage | Permissions | Access |
|------|---------------|------------|--------|
| superadmin | ALL | 25 | 100% |
| admin | ALL | 24 | 99% |
| faculty_admin | ALL | 7 | 28% (R/O) |
| dosen | ALL | 1 | 4% |
| dpl | placement+ | 1 | 4% |
| student | ALL | 0 | API only |

---

## 🔗 Referensi

- Middleware: `apps/api/app/Http/Middleware/EnsurePhase.php`
- Routes: `apps/api/routes/api/v1-*.php`
- RBAC: `docs/RBAC.md`

---

**Document Version:** 1.0  
**Last Updated:** 11 Mei 2026  
**Author:** SIBERMAS Development Team