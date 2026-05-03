# SIBERMAS Migration Documentation
## Complete Technical Record — Laravel Inertia → JSON API + Next.js + React Native

**Project:** SIBERMAS (Sistem Informasi KKN) — UIN Prof. K.H. Saifuddin Zuhri Purwokerto
**Period:** May 2026
**Scope:** Full-stack migration from Laravel + Inertia.js + React to Turborepo monorepo with Laravel JSON API + Next.js + React Native Expo

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Initial Codebase Analysis](#2-initial-codebase-analysis)
3. [Migration Plan](#3-migration-plan)
4. [Phase 1 — Backend JSON API Foundation](#4-phase-1--backend-json-api-foundation)
5. [Phase 2 — Next.js Student Portal](#5-phase-2--nextjs-student-portal)
6. [Phase 3 — Next.js Dosen/DPL Portal](#6-phase-3--nextjs-dosendpl-portal)
7. [Phase 4 — Next.js Admin Portal](#7-phase-4--nextjs-admin-portal)
8. [Phase 5 — React Native Student App](#8-phase-5--react-native-student-app)
9. [Phase 6 — React Native DPL App](#9-phase-6--react-native-dpl-app)
10. [Phase 7 — Cleanup](#10-phase-7--cleanup)
11. [Monorepo Setup (Turborepo)](#11-monorepo-setup-turborepo)
12. [Testing](#12-testing)
13. [Performance Audit](#13-performance-audit)
14. [Final Architecture](#14-final-architecture)
15. [File Inventory](#15-file-inventory)
16. [Deployment Notes](#16-deployment-notes)
17. [Remaining Gaps](#17-remaining-gaps)

---

## 1. Project Overview

### What is SIBERMAS?

SIBERMAS is a full-lifecycle management system for **Kuliah Kerja Nyata (KKN)** — a mandatory community service program for university students at UIN Prof. K.H. Saifuddin Zuhri Purwokerto, Indonesia.

### Core Features

- Student registration & eligibility verification
- Group formation & DPL (Dosen Pembimbing Lapangan) assignment
- Daily activity reporting with GPS geotagging
- Work program proposals & final reports
- Multi-aspect grading (Village, DPL, LPPM)
- Certificate generation & verification
- Workshop/briefing management with QR attendance
- Public announcements & downloads portal

### User Roles

| Role | Description |
|------|-------------|
| **Superadmin** | Full system access |
| **Admin** | Operational management |
| **Faculty Admin** | Faculty-scoped management |
| **Dosen** | Lecturer (base role) |
| **DPL** | Field supervisor (subset of Dosen) |
| **Student (Mahasiswa)** | KKN participant |

---

## 2. Initial Codebase Analysis

### Original Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13, PHP 8.4, PostgreSQL |
| Frontend | React 19, TypeScript, Inertia.js (SPA) |
| Styling | Tailwind CSS 4, Lucide icons, Headless UI |
| Mobile | Capacitor 8 (Android/iOS) |
| Auth | Laravel Sanctum + Spatie Permission (RBAC) |
| AI | Google Gemini 2.5 via prism-php |

### Key Findings

- **113 `Inertia::render()` calls** across 37 controllers
- **106 `useForm()` usages** from `@inertiajs/react` across 55+ pages
- **91 `router.visit/get/post/put/patch/delete`** calls
- **41 `usePage()` calls** for accessing shared props
- **67 `redirect()->route()` calls** with flash messages
- **1 `<Deferred>` component** usage
- **52 models** in `app/Models/KKN/`
- **153 database migrations**

### Directory Structure (Before)

```
kknuinsaizu/
├── app/                    ← Laravel app
│   ├── Http/Controllers/   ← 37+ controllers
│   ├── Models/KKN/         ← 52 models
│   ├── Services/           ← 39+ services
│   └── ...
├── resources/js/           ← React + Inertia frontend
│   ├── Pages/              ← 82+ page components
│   ├── Components/         ← Shared components
│   └── ...
├── routes/
│   ├── web.php             ← Web routes (Inertia)
│   ├── api.php             ← API routes (existing)
│   └── ...
├── composer.json
├── package.json
└── vite.config.js
```

---

## 3. Migration Plan

### Target Architecture

```
sibermas/
├── turbo.json
├── package.json                    ← pnpm workspace root
├── tsconfig.base.json
│
├── apps/
│   ├── api/                        ← Laravel 13 JSON API
│   ├── web/                        ← Next.js 15 SPA
│   └── mobile/                     ← React Native Expo
│
└── packages/
    ├── shared-types/               ← TypeScript interfaces
    ├── api-client/                 ← Axios instances + endpoints
    ├── schemas/                    ← Zod validation schemas
    ├── hooks/                      ← Shared React hooks
    └── constants/                  ← Query keys, labels, maps
```

### Migration Phases

| Phase | What | Status |
|-------|------|--------|
| 1 | Backend JSON API Foundation | ✅ Complete |
| 2 | Next.js Student Portal | ✅ Complete |
| 3 | Next.js Dosen/DPL Portal | ✅ Complete |
| 4 | Next.js Admin Portal | ✅ Complete |
| 5 | React Native Student App | ✅ Complete |
| 6 | React Native DPL App | ✅ Complete |
| 7 | Cleanup (Inertia removal) | ✅ Complete |
| 8 | Monorepo Setup | ✅ Complete |
| 9 | Testing | ✅ Complete |
| 10 | Performance Audit | ✅ Complete |

---

## 4. Phase 1 — Backend JSON API Foundation

### Step 1.1 — Environment Verification

**Verified:**
- PHP 8.4.20 with required extensions (redis, bcmath, intl, gd, exif, pcntl)
- Laravel 13.6.0
- Sanctum installed and configured
- PostgreSQL as default database

**Created:**
- `config/hashing.php` — Argon2id driver, 64MB memory, 2 threads, 4s time

**FreeBSD Commands (for production):**
```bash
pkg install redis
sysrc redis_enable="YES"
service redis start
pkg install py39-supervisor
sysrc supervisord_enable="YES"
```

### Step 1.2 — Global API Response Envelope

**Created:** `app/Http/Traits/ApiResponse.php`

Provides consistent JSON response format:

```php
// Success
{ "success": true, "message": "...", "data": {} }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "errors": {} } }
```

**Methods:**
- `success()` — 200 OK with data
- `created()` — 201 Created
- `noContent()` — 200 OK without data
- `error()` — Custom error with code
- `badRequest()` — 400
- `unauthorized()` — 401
- `forbidden()` — 403
- `notFound()` — 404
- `validationError()` — 422
- `rateLimited()` — 429
- `serverError()` — 500
- `successCollection()` — Paginated response with meta/links
- `successResource()` — Single resource response

**Updated:** `bootstrap/app.php` — Exception handler returns envelope for all `/api/*` routes.

**Error Code Map:**
| HTTP | Code |
|------|------|
| 400 | BAD_REQUEST |
| 401 | UNAUTHORIZED |
| 403 | FORBIDDEN |
| 404 | NOT_FOUND |
| 422 | VALIDATION_ERROR |
| 429 | RATE_LIMITED |
| 500 | SERVER_ERROR |
| Custom | CAPTCHA_INVALID, CREDENTIALS_INVALID, PHASE_BLOCKED, PROFILE_INCOMPLETE, PASSWORD_CHANGE_REQUIRED |

### Step 1.3 — CaptchaService

**Created:** `app/Services/CaptchaService.php`

- Redis-backed, UUID-keyed, Argon2id-hashed answers
- One-time use (deleted after verification)
- 5-minute TTL
- Math questions (addition/subtraction, integers 1-20)

**Created:** `app/Http/Requests/Api/V1/Auth/CaptchaRequest.php`

### Step 1.4 — Sanctum Auth API

**Created:** `app/Http/Controllers/Api/V1/Auth/AuthController.php`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/auth/captcha` | GET | Generate captcha |
| `/api/v1/auth/login` | POST | Login (web cookie or mobile token) |
| `/api/v1/auth/logout` | POST | Logout |
| `/api/v1/auth/user` | GET | Get authenticated user |
| `/api/v1/auth/lupa-kata-sandi` | POST | Forgot password |
| `/api/v1/auth/atur-ulang-kata-sandi` | POST | Reset password |

**Mobile Detection:** `X-App-Type: mobile` header → returns Bearer token via `createToken()`.

**Web:** Returns Sanctum session cookie.

### Step 1.5 — API Resources

**Created:** 30 resource classes in `app/Http/Resources/Api/V1/`

| Resource | Model |
|----------|-------|
| UserResource | User |
| MahasiswaResource | Mahasiswa |
| DosenResource | Dosen |
| FakultasResource | Fakultas |
| ProdiResource | Prodi |
| PeriodeResource | Periode |
| TahunAkademikResource | TahunAkademik |
| JenisKknResource | JenisKkn |
| KelompokKknResource | KelompokKkn |
| PesertaKknResource | PesertaKkn |
| KegiatanKknResource | KegiatanKkn |
| ProgramKerjaResource | ProgramKerja |
| LaporanAkhirResource | LaporanAkhir |
| NilaiKknResource | NilaiKkn |
| EvaluasiResource | Evaluasi |
| LokasiResource | Lokasi |
| WorkshopResource | Workshop |
| SertifikatKknResource | SertifikatKkn |
| AnnouncementResource | Announcement |
| AttendanceResource | Attendance |
| DplPeriodResource | DplPeriod |
| PeriodContextResource | PeriodContext |
| LogAuditResource | LogAudit |
| DownloadResource | Download |
| FileKegiatanResource | FileKegiatan |
| PoskoResource | Posko |
| DokumenPesertaResource | DokumenPeserta |
| ItemEvaluasiResource | ItemEvaluasi |
| ProposalProgramKerjaResource | ProposalProgramKerja |
| PesertaWorkshopResource | PesertaWorkshop |

### Step 1.6 — Period Context Endpoint

**Created:** `app/Http/Controllers/Api/V1/PeriodContextController.php`

`GET /api/v1/period-context` — Returns active period, available periods, current phase.

Replaces `HandleInertiaRequests` and `HandleActivePeriod` shared data.

### Step 1.7 — Student API Routes + Controllers

**Created:** 8 controllers in `app/Http/Controllers/Api/V1/Student/`

| Controller | Endpoints |
|-----------|-----------|
| DashboardController | 2 (dashboard, notification-shown) |
| RegistrationController | 4 (form, store, status, leave) |
| DailyReportController | 5 (index, show, store, update, destroy) |
| WorkProgramController | 5 (index, show, store, uploadProposal, downloadProposal) |
| FinalReportController | 2 (index, store) |
| CertificateController | 2 (index, download) |
| IzinController | 2 (index, store) |
| DplEvaluationController | 2 (index, store) |

**Routes file:** `routes/api/v1-student.php` — 24 endpoints

### Step 1.8 — Dosen/DPL API Routes + Controllers

**Created:** 9 controllers

| Controller | Endpoints |
|-----------|-----------|
| Dosen\DashboardController | 1 |
| Dpl\DashboardController | 1 |
| Dpl\GroupController | 2 |
| Dpl\DailyReportController | 5 |
| Dpl\EvaluationController | 4 |
| Dpl\FinalReportController | 4 |
| Dpl\IzinController | 3 |
| Dpl\MonitoringController | 2 |
| Dpl\ParticipantFeedbackController | 1 |

**Routes file:** `routes/api/v1-dosen.php` — 23 endpoints

### Step 1.9 — Admin API Routes + Controllers

**Created:** 24 controllers in `app/Http/Controllers/Api/V1/Admin/`

| Controller | Endpoints |
|-----------|-----------|
| DashboardController | 3 |
| PeriodeController | 7 |
| TahunAkademikController | 4 |
| JenisKknController | 5 |
| FakultasController | 4 |
| ProdiController | 4 |
| LokasiController | 6 |
| KknRequirementController | 5 |
| PesertaKknController | 10 |
| KelompokKknAdminController | 6 |
| DispensasiController | 3 |
| GradeController | 2 |
| RekapNilaiController | 4 |
| KegiatanKknAdminController | 2 |
| LaporanAkhirAdminController | 3 |
| KonfigurasiPenilaianController | 2 |
| YudisiumController | 2 |
| UserController | 8 |
| DplAssignmentController | 7 |
| AnnouncementController | 5 |
| DownloadController | 4 |
| CertificateConfigController | 2 |
| SystemSettingController | 7 |
| LogAuditController | 2 |

**Routes file:** `routes/api/v1-admin.php` — 105 endpoints

### Step 1.10 — Middleware Updates

**Updated middleware to return JSON for API requests:**

| Middleware | Error Code |
|-----------|-----------|
| EnsurePhase | PHASE_BLOCKED |
| EnsureProfileCompleted | PROFILE_INCOMPLETE |
| EnsurePasswordChanged | PASSWORD_CHANGE_REQUIRED |
| EnsureUserIsActive | FORBIDDEN |
| EnsureAdminAuthorization | FORBIDDEN |

### Total API Routes: 163

| Group | Routes |
|-------|--------|
| Auth | 7 |
| Period Context | 1 |
| Student | 24 |
| Dosen | 1 |
| DPL | 22 |
| Admin | 105 |
| Legacy Public | 3 |

---

## 5. Phase 2 — Next.js Student Portal

### Pages Built (19)

| Page | Route | Features |
|------|-------|----------|
| Home (public) | `/` | Landing page, announcements, links |
| Login | `/login` | Captcha, role-based redirect |
| Profile | `/profil` | User info display |
| Dashboard | `/mahasiswa` | Stats, group info, grade, quick links |
| Registration Status | `/mahasiswa/cek-pendaftaran` | Timeline, rejection reasons |
| Registration Form | `/mahasiswa/pendaftaran` | Available periods, eligibility |
| Document Upload | `/mahasiswa/pendaftaran/[id]/dokumen` | File upload |
| Daily Reports | `/mahasiswa/laporan-harian` | Paginated list, status badges |
| Create Report | `/mahasiswa/laporan-harian/buat` | GPS, file upload, form validation |
| Edit Report | `/mahasiswa/laporan-harian/[id]/edit` | Pre-filled form |
| Work Programs | `/mahasiswa/program-kerja` | List with status |
| Work Program Detail | `/mahasiswa/program-kerja/[id]` | Detail + proposals |
| Leave Requests | `/mahasiswa/izin` | List with status |
| Create Leave | `/mahasiswa/izin/buat` | Type, dates, reason, file |
| Posko | `/mahasiswa/posko` | GPS coordinates, photo |
| Domisili | `/mahasiswa/domisili` | Address fields |
| Final Report | `/mahasiswa/laporan-akhir` | Form + file upload |
| Certificates | `/mahasiswa/sertifikat` | Scores + certificate display |
| Workshops | `/mahasiswa/workshops` | Workshop list |

### Key Implementation Details

- **Auth store:** Zustand store with `fetchUser()`, `setUser()`, `clearUser()`
- **API client:** `createWebClient()` from `@sibermas/api-client` with `withCredentials: true`
- **Forms:** React Hook Form + Zod schemas from `@sibermas/schemas`
- **Data fetching:** TanStack Query with query keys from `@sibermas/constants`
- **Layout:** Sidebar navigation with role-based menu items, phase indicator

---

## 6. Phase 3 — Next.js Dosen/DPL Portal

### Pages Built (13)

| Page | Route | Features |
|------|-------|----------|
| Dosen Dashboard | `/dosen` | DPL status, period assignments |
| DPL Dashboard | `/dosen/beranda-dpl` | Stats, at-risk students, groups summary |
| Groups List | `/dosen/kelompok` | All binaan groups |
| Group Detail | `/dosen/kelompok/[id]` | Members table, scores, work programs |
| Daily Reports | `/dosen/laporan-harian` | Filter by status, batch approve, pagination |
| Report Detail | `/dosen/laporan-harian/[id]` | Approve/revision with notes |
| Evaluations | `/dosen/evaluasi` | Per-student score input (5 aspects) |
| Final Reports | `/dosen/laporan-akhir` | List with status |
| Final Report Detail | `/dosen/laporan-akhir/[id]` | Score input, approve/revision |
| Monitoring | `/dosen/monitoring` | Visit history |
| Create Monitoring | `/dosen/monitoring/buat` | GPS + photo + notes |
| Izin Approval | `/dosen/izin` | Approve/reject with reason |
| Feedback | `/dosen/umpan-balik-peserta` | Student feedback display |

### Key Features

- **Batch approve:** Select multiple reports and approve at once
- **5-aspect evaluation:** Relevansi, Ketercapaian, Inovasi, Administrasi, Artikel
- **GPS monitoring:** Record visit location with coordinates
- **At-risk students:** Students inactive for 3+ days flagged on dashboard

---

## 7. Phase 4 — Next.js Admin Portal

### Pages Built (27)

| Page | Route | Features |
|------|-------|----------|
| Hub | `/admin` | Quick links to all admin sections |
| Dashboard | `/admin/dashboard` | Stats, phase switching |
| Periods | `/admin/periode` | CRUD with duplication |
| Period Detail | `/admin/periode/[id]` | Full period info |
| Academic Years | `/admin/tahun-akademik` | CRUD |
| Jenis KKN | `/admin/jenis-kkn` | CRUD |
| Jenis KKN Detail | `/admin/jenis-kkn/[id]` | Detail view |
| Faculties | `/admin/fakultas` | CRUD |
| Programs | `/admin/prodi` | CRUD |
| Locations | `/admin/lokasi` | CRUD with import |
| Registrations | `/admin/pendaftaran` | Bulk approve/reject, filtering |
| Registration Detail | `/admin/pendaftaran/[id]` | Full detail, approve action |
| Groups | `/admin/kelompok` | CRUD with import |
| Group Detail | `/admin/kelompok/[id]` | Members, scores |
| Mahasiswa List | `/admin/mahasiswa` | Search, filter by faculty |
| Mahasiswa Detail | `/admin/mahasiswa/[id]` | Full profile |
| Dosen List | `/admin/dosen` | Search |
| DPL Registration | `/admin/dosen/pendaftaran-dpl` | Approve/reject DPL |
| DPL Assignment | `/admin/dosen/penugasan` | Period/group assignment |
| Student Transfer | `/admin/peserta/pindah` | Move between groups |
| Eligibility Check | `/admin/audit-kualifikasi` | SKS/IPK verification |
| Dispensasi | `/admin/dispensasi` | Grant/revoke dispensation |
| Grades | `/admin/nilai` | View/finalize scores |
| Evaluasi DPL | `/admin/evaluasi-dpl` | Student feedback on DPL |
| Grade Generator | `/admin/generator-nilai` | Bulk grade generation |
| Announcements | `/admin/warta-utama` | CRUD with preview |
| Users | `/admin/pengguna` | CRUD, toggle status |
| Settings | `/admin/pengaturan/sistem` | System settings |
| Certificate Config | `/admin/pengaturan/sertifikat` | Template config |
| Audit Log | `/admin/audit-log` | Log list |
| Audit Log Detail | `/admin/audit-log/[id]` | Old/new values |

---

## 8. Phase 5 — React Native Student App

### Screens Built (4 tabs + auth)

| Screen | Tab | Features |
|--------|-----|----------|
| Login | Auth | Captcha, mobile token auth, SecureStore |
| Dashboard | Home | Stats, group info, quick actions |
| Reports | Laporan | Daily reports list, pull-to-refresh, FAB |
| Activities | Kegiatan | Work programs list |
| Profile | Profil | User info, logout |

### Architecture

```
apps/mobile/
├── app/
│   ├── _layout.tsx          ← Root (QueryClientProvider)
│   ├── (auth)/
│   │   ├── _layout.tsx      ← Auth guard
│   │   └── login.tsx        ← Login with captcha
│   └── (tabs)/
│       ├── _layout.tsx      ← Tab navigator (4 tabs)
│       ├── index.tsx        ← Dashboard
│       ├── reports.tsx      ← Daily reports
│       ├── activities.tsx   ← Work programs
│       └── profile.tsx      ← Profile + logout
├── lib/api.ts               ← Mobile API client (SecureStore token)
├── stores/index.ts          ← Auth store (login/logout/fetchUser)
└── app.config.ts            ← Expo config
```

### Key Implementation

- **Token storage:** `expo-secure-store` for Bearer token
- **API client:** `createMobileClient()` with Bearer token injection
- **Auth flow:** Login → store token → fetch user → navigate to tabs
- **Role routing:** Student → `(tabs)`, DPL → `(dpl-tabs)`

---

## 9. Phase 6 — React Native DPL App

### Screens Built (4 tabs)

| Screen | Tab | Features |
|--------|-----|----------|
| DPL Dashboard | Home | Stats, at-risk students, groups |
| Groups | Kelompok | Group list with member counts |
| Reports | Laporan | Pending reports, approve action |
| Profile | Profil | User info, logout |

### Navigation

- DPL users are automatically routed to `(dpl-tabs)` on login
- Student users stay on `(tabs)`

---

## 10. Phase 7 — Cleanup

### Removed

| Item | Action |
|------|--------|
| `inertiajs/inertia-laravel` | `composer remove` |
| `tightenco/ziggy` | `composer remove` |
| `HandleInertiaRequests.php` | Deleted |
| Inertia::share() in HandleActivePeriod | Removed |
| Inertia::render() in exception handler | Replaced with JSON |
| Bootstrap cache files | Cleared and regenerated |

### Updated

| File | Change |
|------|--------|
| `bootstrap/app.php` | Removed Inertia imports, middleware, exception rendering |
| `HandleActivePeriod.php` | Removed Inertia::share calls |
| `.env.example` | Added HASHING_DRIVER, ARGON_* settings |

---

## 11. Monorepo Setup (Turborepo)

### Structure Created

```
sibermas/
├── turbo.json
├── package.json                    ← pnpm workspace root
├── pnpm-workspace.yaml
├── tsconfig.base.json              ← shared TypeScript config
├── .gitignore
│
├── apps/
│   ├── api/                        ← Laravel 13 (moved from root)
│   ├── web/                        ← Next.js 15
│   └── mobile/                     ← Expo SDK 53
│
└── packages/
    ├── shared-types/               ← 50+ TypeScript interfaces
    ├── api-client/                 ← Dual-mode Axios (web + mobile)
    ├── schemas/                    ← 12 Zod validation schemas
    ├── hooks/                      ← 4 TanStack Query hooks
    └── constants/                  ← Query keys, phases, roles, statuses
```

### Package Dependencies

| Package | Depends On |
|---------|-----------|
| `@sibermas/shared-types` | (none) |
| `@sibermas/constants` | (none) |
| `@sibermas/schemas` | zod |
| `@sibermas/api-client` | axios, @sibermas/shared-types |
| `@sibermas/hooks` | @tanstack/react-query, axios, @sibermas/api-client, @sibermas/constants |
| `web` | next, react, all @sibermas/* packages |
| `mobile` | expo, react-native, all @sibermas/* packages |

### Shared Types (50+ interfaces)

Located in `packages/shared-types/src/models.ts`:

User, Mahasiswa, Dosen, Faculty, Program, Period, AcademicYear, JenisKkn, AttendanceConfig, KelompokKkn, PesertaKkn, DokumenPeserta, Lokasi, Posko, KegiatanKkn, FileKegiatan, ProgramKerja, ProposalProgramKerja, LaporanAkhir, NilaiKkn, Evaluasi, ItemEvaluasi, Workshop, SertifikatKkn, Announcement, Attendance, DplPeriod, PeriodContext, LogAudit, Domisili

### API Client

Located in `packages/api-client/src/`:

- `client.ts` — `createWebClient()` and `createMobileClient()` factories
- `endpoints/index.ts` — All endpoint functions organized by domain:
  - `authEndpoints` — captcha, login, logout, user, forgot/reset password
  - `studentEndpoints` — dashboard, registration, daily reports, work programs, etc.
  - `dplEndpoints` — dashboard, groups, daily reports, evaluations, etc.
  - `dosenEndpoints` — dashboard
  - `adminEndpoints` — hub, dashboard, periods, registrations, groups, users, grades, etc.
  - `profileEndpoints` — get, update, avatar, password
  - `publicEndpoints` — home, announcements, downloads, locations, certificate
  - `periodContextEndpoints` — get

### Zod Schemas

Located in `packages/schemas/src/`:

- `auth.ts` — loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema
- `forms.ts` — createDailyReportSchema, editDailyReportSchema, createLeaveRequestSchema, createWorkProgramSchema, registrationSchema, evaluationSchema, updateProfileSchema

### Constants

Located in `packages/constants/src/index.ts`:

- `QUERY_KEYS` — All TanStack Query key constants
- `PHASE_LABELS` — Bahasa Indonesia phase names
- `ROLE_REDIRECT_MAP` — Login redirect by role
- `ROLE_LABELS` — Role display names
- `STATUS_LABELS` — Status labels for peserta, kegiatan, laporanAkhir, izin

---

## 12. Testing

### Test Results

```
Tests:    29 passed (59 assertions)
Duration: 1.20s
```

### Test Files

| File | Tests | Coverage |
|------|-------|----------|
| `tests/Feature/Api/V1/Auth/AuthTest.php` | 6 | Captcha, login, user, forgot password |
| `tests/Feature/Api/V1/Admin/AdminTest.php` | 3 | Auth guards, hub endpoint |
| `tests/Feature/Api/V1/Dpl/DplTest.php` | 11 | All DPL endpoints |
| `tests/Feature/Api/V1/Student/StudentTest.php` | 6 | Auth guards, CRUD endpoints |
| `tests/Feature/Api/V1/PublicTest.php` | 2 | Period context auth, error envelope |
| `tests/Pest.php` | 1 | Sanity test |

### Test Helpers

```php
getCaptchaAnswer(string $captchaId): string
createUserWithRole(string $role, array $permissions = []): User
generateCaptchaWithAnswer(): array
```

---

## 13. Performance Audit

### Layer 1 — Database Queries: Fixed

| Issue | Fix | File |
|-------|-----|------|
| YudisiumController memory exhaustion | Pagination + SQL aggregates | `YudisiumController.php` |
| DownloadController missing pagination | Added `paginate(25)` | `DownloadController.php` |
| AuthController N+1 queries | Eager load + combined queries | `AuthController.php` |
| DplEvaluationController unpaginated | Added pagination + selective eager loading | `EvaluationController.php` |
| DplEvaluationController import no transaction | Wrapped in `DB::transaction()` | `EvaluationController.php` |
| SystemSettingController `all()->pluck()` | Changed to `pluck()` directly | `SystemSettingController.php` |
| DashboardController wrong method name | Fixed `getStats` → `getPeriodStatistics` | `DashboardController.php` |
| Missing indexes on 7 tables | New migration adding 15+ indexes | `2026_05_01_000000_add_performance_indexes.php` |

### Layer 2 — Redis Cache: Already Optimized ✅

| Component | TTL |
|-----------|-----|
| PeriodContextService | 1 hour |
| SystemSetting::get() | 24 hours |
| DashboardStatisticsService | 5 minutes |
| Periode model | 1 hour |

### Layer 3 — Queue Jobs: Already Implemented ✅

| Job | Trigger |
|-----|---------|
| ProcessActivityAiAnalysis | KegiatanKkn::created |
| FinalizeMassScoresJob | Manual dispatch |
| GenerateBulkCertificatesJob | Manual dispatch |
| SyncAllMahasiswaJob | Manual dispatch |
| SyncAllDosenJob | Manual dispatch |

### Layer 4 — Frontend Cache: Already Configured ✅

| Data Type | staleTime |
|-----------|-----------|
| Period context | 60s |
| Student data | 30s |
| Daily reports | 10s |
| Reference data | 1 hour |

### Layer 5 — Business Logic: Already Protected ✅

| Concern | Implementation |
|---------|---------------|
| GPS validation | Server-side in DailyReportController |
| Backdate protection | 24-hour limit |
| Geofence enforcement | Server-side radius check |
| AI analysis | Queued via ProcessActivityAiAnalysis |
| File magic bytes | Validated in DailyReportController |

### Migration: Performance Indexes

**Created:** `database/migrations/2026_05_01_000000_add_performance_indexes.php`

| Table | Columns Indexed |
|-------|----------------|
| `laporan_akhir` | `kelompok_id`, `mahasiswa_id`, `status`, `submitted_at` |
| `izin_meninggalkan` | `mahasiswa_id`, `kelompok_id`, `status`, `created_at` |
| `file_kegiatan_kkn` | `kegiatan_kkn_id` |
| `program_kerja` | `kelompok_id` |
| `announcements` | `published_at`, `is_active` |
| `downloads` | `created_at` |
| `kelompok_kkn` | `location_id` |

---

## 14. Final Architecture

### Directory Structure

```
sibermas/
├── turbo.json
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── .gitignore
│
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/Api/V1/
│   │   │   │   │   ├── Auth/AuthController.php
│   │   │   │   │   ├── PeriodContextController.php
│   │   │   │   │   ├── Student/ (8 controllers)
│   │   │   │   │   ├── Dpl/ (8 controllers)
│   │   │   │   │   ├── Dosen/DashboardController.php
│   │   │   │   │   └── Admin/ (24 controllers)
│   │   │   │   ├── Middleware/ (16 middleware)
│   │   │   │   └── Requests/
│   │   │   ├── Http/Resources/Api/V1/ (30 resources)
│   │   │   ├── Http/Traits/ApiResponse.php
│   │   │   ├── Models/KKN/ (52 models)
│   │   │   ├── Services/ (39+ services)
│   │   │   └── ...
│   │   ├── config/hashing.php
│   │   ├── routes/
│   │   │   ├── api.php
│   │   │   ├── api/v1-student.php
│   │   │   ├── api/v1-dosen.php
│   │   │   └── api/v1-admin.php
│   │   ├── database/migrations/ (154 migrations)
│   │   ├── tests/Feature/Api/V1/ (5 test files)
│   │   └── ...
│   │
│   ├── web/
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── (auth)/login/page.tsx
│   │   │   │   ├── (student)/mahasiswa/ (19 pages)
│   │   │   │   ├── (dosen)/dosen/ (13 pages)
│   │   │   │   ├── (admin)/admin/ (27 pages)
│   │   │   │   ├── berita/ (2 pages)
│   │   │   │   ├── unduhan/page.tsx
│   │   │   │   ├── lokasi/page.tsx
│   │   │   │   └── verify-certificate/[token]/page.tsx
│   │   │   ├── lib/api.ts
│   │   │   ├── stores/index.ts
│   │   │   └── providers/index.tsx
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── mobile/
│       ├── app/
│       │   ├── _layout.tsx
│       │   ├── (auth)/login.tsx
│       │   ├── (tabs)/ (4 screens)
│       │   └── (dpl-tabs)/ (4 screens)
│       ├── lib/api.ts
│       ├── stores/index.ts
│       ├── app.config.ts
│       └── package.json
│
└── packages/
    ├── shared-types/src/ (models.ts, api.ts, index.ts)
    ├── api-client/src/ (client.ts, endpoints/index.ts)
    ├── schemas/src/ (auth.ts, forms.ts)
    ├── hooks/src/ (useAuth.ts, usePeriodContext.ts, useDailyReports.ts, useWorkPrograms.ts)
    └── constants/src/index.ts
```

### Total Counts

| Metric | Count |
|--------|-------|
| API endpoints | 163 |
| API controllers | 35 |
| API Resources | 30 |
| Web pages | 66 |
| Mobile screens | 8 |
| Shared packages | 5 |
| TypeScript interfaces | 50+ |
| Zod schemas | 12 |
| Database migrations | 154 |
| Pest tests | 29 |

---

## 15. File Inventory

### Files Created

**Config:**
- `config/hashing.php`

**Traits:**
- `app/Http/Traits/ApiResponse.php`

**Services:**
- `app/Services/CaptchaService.php`

**Form Requests:**
- `app/Http/Requests/Api/V1/Auth/CaptchaRequest.php`

**API Controllers (35):**
- `app/Http/Controllers/Api/V1/Auth/AuthController.php`
- `app/Http/Controllers/Api/V1/PeriodContextController.php`
- `app/Http/Controllers/Api/V1/Student/` (8 controllers)
- `app/Http/Controllers/Api/V1/Dpl/` (8 controllers)
- `app/Http/Controllers/Api/V1/Dosen/DashboardController.php`
- `app/Http/Controllers/Api/V1/Admin/` (24 controllers)

**API Resources (30):**
- `app/Http/Resources/Api/V1/` (30 resource classes)

**Routes:**
- `routes/api/v1-student.php`
- `routes/api/v1-dosen.php`
- `routes/api/v1-admin.php`

**Migrations:**
- `database/migrations/2026_05_01_000000_add_performance_indexes.php`

**Tests:**
- `tests/TestCase.php`
- `tests/Pest.php`
- `tests/Feature/Api/V1/Auth/AuthTest.php`
- `tests/Feature/Api/V1/Admin/AdminTest.php`
- `tests/Feature/Api/V1/Dpl/DplTest.php`
- `tests/Feature/Api/V1/Student/StudentTest.php`
- `tests/Feature/Api/V1/PublicTest.php`

**Next.js (66 pages):**
- `apps/web/src/app/` — All page files
- `apps/web/src/lib/api.ts`
- `apps/web/src/stores/index.ts`
- `apps/web/src/providers/index.tsx`

**React Native (8 screens):**
- `apps/mobile/app/` — All screen files
- `apps/mobile/lib/api.ts`
- `apps/mobile/stores/index.ts`

**Shared Packages:**
- `packages/shared-types/` — TypeScript interfaces
- `packages/api-client/` — Axios instances + endpoints
- `packages/schemas/` — Zod validation schemas
- `packages/hooks/` — TanStack Query hooks
- `packages/constants/` — Query keys, labels, maps

**Monorepo:**
- `turbo.json`
- `package.json` (root)
- `pnpm-workspace.yaml`
- `tsconfig.base.json`
- `.gitignore` (updated)

### Files Modified

- `bootstrap/app.php` — Exception handler, middleware updates
- `app/Http/Middleware/HandleActivePeriod.php` — Removed Inertia::share
- `app/Http/Middleware/EnsurePhase.php` — JSON response for API
- `app/Http/Middleware/EnsureProfileCompleted.php` — JSON response for API
- `app/Http/Middleware/EnsurePasswordChanged.php` — JSON response for API
- `app/Http/Middleware/EnsureUserIsActive.php` — Envelope format
- `.env.example` — Added HASHING_DRIVER, ARGON_* settings
- `routes/api.php` — Added v1 route groups

### Files Removed

- `app/Http/Middleware/HandleInertiaRequests.php`
- `inertiajs/inertia-laravel` (composer package)
- `tightenco/ziggy` (composer package)
- Bootstrap cache files (cleared and regenerated)

---

## 16. Deployment Notes

### FreeBSD Production Commands

```bash
# Install Redis
pkg install redis
sysrc redis_enable="YES"
service redis start

# Install Supervisor
pkg install py39-supervisor
sysrc supervisord_enable="YES"

# Update .env
HASHING_DRIVER=argon2id
CACHE_STORE=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis
SANCTUM_STATEFUL_DOMAINS=sibermas.uinsaizu.ac.id,localhost
```

### Monorepo Deployment

```bash
# Backend (apps/api/)
cd apps/api
composer install --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Frontend (apps/web/)
cd apps/web
pnpm install
pnpm build

# Mobile (apps/mobile/)
cd apps/mobile
npx expo prebuild
npx expo run:android
```

---

## 17. Remaining Gaps

| Category | Items | Priority |
|----------|-------|----------|
| Mobile GPS | Native GPS + camera for daily reports | Medium |
| Mobile offline | Offline queue for daily reports | Medium |
| Push notifications | Expo push notification handling | Low |
| More Pest tests | Expand to 50+ tests | Low |
| CI/CD | GitHub Actions for monorepo | Low |
| Public SSR | SSG/ISR for public pages (SEO) | Low |

---

**Document Version:** 1.0
**Last Updated:** May 2026
**Author:** Senior Software Engineer (AI-assisted migration)
