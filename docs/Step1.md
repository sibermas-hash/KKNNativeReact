You are a senior full-stack architect and DevOps engineer. Your task is to implement a full migration of an existing Laravel + Inertia.js + React (TypeScript) application to a new target architecture. Study the entire codebase thoroughly before making any changes.

---

## PROJECT CONTEXT

- Live URL: sibermas.uinsaizu.ac.id
- System: KKN (Kuliah Kerja Nyata) management portal — UIN SAIZU
- Current stack: Laravel + Inertia.js + React 19 + TypeScript
- Server OS: FreeBSD
  - ALL shell commands must be FreeBSD-compatible
  - Package manager: pkg (NOT apt, NOT yum, NOT brew)
  - Service management: service {name} start|stop|restart
  - Enable on boot: sysrc {name}_enable="YES"
  - PHP config path: /usr/local/etc/php.ini
  - Redis config path: /usr/local/etc/redis.conf
  - Never use systemctl, never use /proc/*, never use Linux-only syntax

---

## FINAL TARGET ARCHITECTURE

### Backend

- Laravel — pure JSON REST API only
- No Inertia::render(), no Blade for app pages
- API versioning: /api/v1/
- Authentication: Laravel Sanctum
  - Web SPA (Next.js): cookie-based session auth (withCredentials)
  - Mobile (React Native): Bearer token auth
  - Single login endpoint — detect platform via X-App-Type: mobile header
  - Web → set cookie session
  - Mobile → return Bearer token
- Password hashing: Argon2id exclusively (config/hashing.php driver: argon2id)
- Captcha: stateless, Redis-backed, math question, Argon2id-hashed answer, one-time-use, 5-minute TTL
- Caching: Redis (local, FreeBSD)
- SHA256/HMAC-SHA256: used ONLY for certificate tokens, file checksums, API signatures — NEVER for passwords

### Frontend — Web

- Framework: Next.js (App Router) — SPA mode
- Users: ALL (Admin, Dosen, DPL, Mahasiswa)
- Public pages (Home, Berita, Lokasi, Verify Sertifikat): Next.js Server Components, SSG/ISR for SEO
- Portal pages (Student, Dosen, DPL, Admin): Client Components, TanStack Query
- State: Zustand (auth store, period store)
- Forms: React Hook Form + Zod
- HTTP client: Axios (centralized, cookie-based Sanctum)

### Frontend — Mobile

- Framework: React Native (Expo SDK)
- Users: Mahasiswa + Dosen/DPL ONLY (Admin: web only)
- Features: GPS native, native camera, offline queue, push notifications (Expo Push)
- Auth: Bearer token stored in expo-secure-store
- HTTP client: same shared Axios instance, Authorization: Bearer header

### Monorepo Structure (Turborepo)

monorepo/
├── apps/
│   ├── web/              → Next.js SPA (semua user)
│   └── mobile/           → React Native Expo (Mahasiswa + Dosen only)
│
└── packages/
├── shared-types/     → TypeScript interfaces (User, Periode, KelompokKkn, dll)
├── api-client/       → Axios instance + semua API call functions
│                        web: withCredentials cookie
│                        mobile: Bearer token injection
├── schemas/          → Zod validation schemas (shared form validation)
├── hooks/            → Shared React hooks (useAuth, useDailyReports, dll)
└── constants/        → Phase names, role maps, status labels

### Platform Scope

| Feature | Next.js Web | React Native |
|---|---|---|
| Admin portal | ✅ Full | ❌ |
| Dosen/DPL portal | ✅ Full | ✅ |
| Mahasiswa portal | ✅ Full | ✅ |
| GPS laporan harian | ⚠️ Browser | ✅ Native |
| Native camera | ⚠️ File picker | ✅ expo-camera |
| Offline sync | ⚠️ SW | ✅ AsyncStorage + Queue |
| Push notification | ⚠️ Web Push | ✅ Expo Push |
| Export Excel/PDF | ✅ | ❌ |
| Tabel admin kompleks | ✅ | ❌ |

---

## MIGRATION ORDER — DO NOT SKIP AHEAD

Phase 1 → Laravel JSON API (foundation)
Phase 2 → Next.js SPA: Auth + Student portal
Phase 3 → Next.js SPA: Dosen/DPL portal
Phase 4 → Next.js SPA: Admin portal
Phase 5 → React Native: Mahasiswa app
Phase 6 → React Native: Dosen/DPL app
Phase 7 → Cleanup (remove Inertia)

Each phase must be fully complete and tested before the next begins.

---

## PHASE 1 — BACKEND JSON API FOUNDATION

### Step 1.1 — FreeBSD Environment Verification

Verify and fix the following. Output exact FreeBSD commands for anything missing:

- Redis installed and running: pkg install redis, sysrc redis_enable="YES", service redis start
- PHP extensions enabled in /usr/local/etc/php.ini: redis, bcmath, intl, gd, exif, pcntl
- Laravel .env: REDIS_HOST=127.0.0.1, REDIS_PORT=6379, CACHE_DRIVER=redis, SESSION_DRIVER=redis, QUEUE_DRIVER=redis
- config/hashing.php: driver set to argon2id, memory=65536, threads=2, time=4
- SANCTUM_STATEFUL_DOMAINS includes sibermas.uinsaizu.ac.id and localhost
- config/cors.php: allowed_origins includes production domain and <http://localhost:3000>
- Supervisor for queues: pkg install py39-supervisor, sysrc supervisord_enable="YES"

### Step 1.2 — Global API Response Envelope

Implement a single consistent JSON structure for ALL API responses:

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {},
  "meta": {}
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "...",
    "errors": {}
  }
}
```

Error code map:

- 400 → BAD_REQUEST
- 401 → UNAUTHORIZED
- 403 → FORBIDDEN
- 404 → NOT_FOUND
- 422 → VALIDATION_ERROR
- 429 → RATE_LIMITED
- 500 → SERVER_ERROR
- Custom → CAPTCHA_INVALID, CREDENTIALS_INVALID, PHASE_BLOCKED, PROFILE_INCOMPLETE

Update app/Exceptions/Handler.php to return this envelope automatically for all routes matching /api/*. Use $request->expectsJson() check to avoid breaking existing Inertia responses during transition.

### Step 1.3 — Captcha Service (Redis + Argon2id)

Create app/Services/CaptchaService.php:

- generate(): random math question (addition or subtraction, integers 1–20), hash answer with Hash::make() (Argon2id), store in Redis key captcha:{uuid} with 300s TTL, return captcha_id (UUID v4), question string, expires_at
- verify(string $captchaId, string $answer): bool — get hash from Redis, Hash::check(), delete key immediately (one-time use), return result
- Captcha answer is NEVER stored in plaintext — always Argon2id hash
- Captcha IDs are UUID v4 — never sequential integers

Endpoints:

- GET /api/v1/auth/captcha → public, throttle:10,1 → returns captcha_id, question, expires_at
- CaptchaRequest form request: validates captcha_id (required, string) and captcha_answer (required, string) before login proceeds

### Step 1.4 — Sanctum Authentication API

Create app/Http/Controllers/Api/V1/Auth/AuthController.php:

Methods:

- captcha(): delegates to CaptchaService::generate()
- login(): validate captcha first via CaptchaService::verify() → return CAPTCHA_INVALID if fails → validate credentials → return CREDENTIALS_INVALID if fails (do not reveal which field is wrong) → detect X-App-Type: mobile header → if mobile: return Bearer token via createToken() + UserResource → if web: start Sanctum session, return UserResource with roles, permissions, active_phase, active_period
- logout(): if token auth → $request->user()->currentAccessToken()->delete() → if session auth → Auth::guard('web')->logout()
- user(): GET /api/v1/auth/user → returns UserResource for authenticated user
- forgotPassword(): POST /api/v1/auth/lupa-kata-sandi → sends reset link
- resetPassword(): POST /api/v1/auth/atur-ulang-kata-sandi → Argon2id hash new password

### Step 1.5 — API Resources

Create all resource classes in app/Http/Resources/Api/V1/. Each resource must have explicit toArray() — no wildcard merges. Resources:

- UserResource: id, username, name, email, avatar_url, nim, roles[], permissions[], faculty, must_change_password, active_phase, active_period
- MahasiswaResource: nim, nama, nik, gpa, semester, faculty, prodi, profile_completion_percent, photo_url
- DosenResource: nip, nama, phone, jabatan, fakultas, photo_url
- PeriodeResource: id, periode, name, start_date, end_date, kuota, current_phase, phase_label, is_active, jenis_kkn
- JenisKknResource: id, code, name, registration_mode, placement_mode, attendance_config
- KelompokKknResource: id, nama_kelompok, code, capacity, status, location, dpl, member_count, members[]
- PesertaKknResource: id, status, role, registration_date, notes, mahasiswa, kelompok
- KegiatanKknResource: id, date, title, activity, status, lat, lng, ai_analysis, attachments[], created_at
- ProgramKerjaResource: id, title, description, sdg_goals[], status, budget, proposals[], created_at
- LaporanAkhirResource: id, title, abstract, status, score, file_url, submitted_at
- NilaiKknResource: id, all score components, total_score, letter_grade, is_finalized
- EvaluasiResource: id, evaluator_type, total_score, grade, evaluated_at
- LokasiResource: id, village_name, district_name, full_name, lat, lng, capacity, is_active
- SertifikatKknResource: id, certificate_number, verification_token, scores, issued_at, download_url
- AnnouncementResource: id, title, slug, excerpt, content, published_at, thumbnail_url
- AttendanceResource: id, check_in, check_out, lat, lng, photo_url, method
- PeriodContextResource: active_period, available_periods[], current_phase, phase_label

### Step 1.6 — Period Context Endpoint

Create GET /api/v1/period-context (auth:sanctum):

- Returns PeriodContextResource
- Replaces HandleInertiaRequests shared data: activePeriod, availablePeriods, active_phase
- Cache result in Redis: cache key period-context:{userId} with 60s TTL
- Invalidate cache when active period changes

### Step 1.7 — Student API Routes + Controllers

Refactor all Student controllers with dual-return pattern:

```php
public function index(Request $request): Response|JsonResponse
{
    $data = // ... existing query unchanged ...

    if ($request->expectsJson()) {
        return StudentResource::collection($data);
    }

    return Inertia::render('Student/Page', ['data' => $data]); // unchanged
}
```

Controllers to refactor: DashboardController, RegistrationController, DailyReportController, WorkProgramController, FinalReportController, IzinController, PoskoController, CertificateController, DplParticipantEvaluationController, DomisiliController, RekapitulasiController, KknDaftarController

Add to routes/api.php under prefix /api/v1/student with middleware auth:sanctum, role:student:

- GET /dashboard
- GET /registration/form, POST /registration, GET /registration/status
- GET /daily-reports, POST /daily-reports, GET /daily-reports/{id}, PUT /daily-reports/{id}, DELETE /daily-reports/{id}
- GET /work-programs, POST /work-programs, GET /work-programs/{id}
- GET /leave-requests, POST /leave-requests
- GET /final-report, POST /final-report
- GET /certificates
- GET /evaluations
- GET /dpl-evaluation/form, POST /dpl-evaluation
- GET /rekapitulasi, POST /rekapitulasi
- GET|POST /posko
- GET|POST /domisili
- GET /period-context

### Step 1.8 — Dosen/DPL API Routes + Controllers

Refactor with same dual-return pattern.

DPL routes under /api/v1/dpl with middleware auth:sanctum, role:dpl:

- GET /dashboard
- GET /groups, GET /groups/{id}
- GET /daily-reports, GET /daily-reports/{id}
- GET /evaluations, POST /evaluations, POST /evaluations/validate-import
- GET /final-reports, GET /final-reports/{id}
- GET /monitoring, POST /monitoring
- GET /leave-requests, PATCH /leave-requests/{id}
- GET /feedback

Dosen routes under /api/v1/dosen with middleware auth:sanctum, role:dosen|dpl:

- GET /dashboard

### Step 1.9 — Admin API Routes + Controllers

Refactor all 37 Admin controllers with dual-return pattern.
Add all routes under /api/v1/admin with middleware auth:sanctum, role:superadmin|admin|faculty_admin.
Preserve all existing admin functionality — map every Inertia prop to API Resource fields.

### Step 1.10 — Middleware Updates

Ensure all existing middleware return JSON when accessed via API:

- EnsurePhaseAccess → return 403 JSON with code PHASE_BLOCKED
- EnsureProfileCompleted → return 403 JSON with code PROFILE_INCOMPLETE
- EnsureAdminAuthorization → return 403 JSON with code FORBIDDEN
- EnsurePasswordChanged → return 403 JSON with code PASSWORD_CHANGE_REQUIRED
- All middleware must check $request->expectsJson() to avoid breaking Inertia

### Step 1.11 — API Tests (Pest)

Write Pest tests for ALL Phase 1 endpoints before proceeding to Phase 2:

Auth tests:

- captcha generates valid UUID, question string, expires_at
- captcha key exists in Redis after generation
- captcha answer is Argon2id hashed in Redis (verify Hash::info())
- captcha is deleted from Redis after verify (one-time use)
- expired captcha returns CAPTCHA_INVALID
- login with correct captcha + correct credentials → web: returns cookie session + UserResource
- login with correct captcha + correct credentials + X-App-Type: mobile → returns Bearer token + UserResource
- login with wrong captcha → returns 422 CAPTCHA_INVALID
- login with wrong credentials → returns 422 CREDENTIALS_INVALID
- logout invalidates session/token
- GET /auth/user while authenticated → returns UserResource
- GET /auth/user while unauthenticated → returns 401 UNAUTHORIZED

Student tests:

- All CRUD endpoints return correct envelope structure
- All endpoints return correct Resource fields
- Unauthenticated → 401
- Wrong role → 403
- Validation errors → 422 with errors object

---

## PHASE 2 — NEXT.JS SPA: STUDENT PORTAL

Do not begin until all Phase 1 Pest tests pass.

### Step 2.1 — Monorepo Setup (Turborepo)

Initialize Turborepo monorepo:
monorepo/
├── turbo.json
├── package.json (workspace root)
├── apps/
│   ├── web/        → Next.js
│   └── mobile/     → React Native Expo (scaffold only, implement in Phase 5)
└── packages/
├── shared-types/
├── api-client/
├── schemas/
├── hooks/
└── constants/

Create packages/shared-types/: extract all TypeScript interfaces from resources/js/types/index.ts + resources/js/types/models.ts. Export: User, Mahasiswa, Dosen, Periode, JenisKkn, KelompokKkn, PesertaKkn, KegiatanKkn, ProgramKerja, LaporanAkhir, NilaiKkn, Evaluasi, Lokasi, SertifikatKkn, Announcement, Attendance, PeriodContext, ApiResponse<T>, PaginatedResponse<T>

Create packages/api-client/:

```typescript
// Dual-mode Axios instance
// Web: withCredentials: true, no Authorization header
// Mobile: Authorization: Bearer {token} from SecureStore, no credentials
```

- createWebClient(): Axios instance with withCredentials, XSRF handling, base /api/v1
- createMobileClient(getToken: () => Promise<string>): Axios instance with Bearer token injection
- Both share identical endpoint functions (getStudentDashboard, createDailyReport, etc.)
- 401 interceptor: web → redirect /login, mobile → emit logout event
- 422 interceptor: extract and return errors object to caller
- Response interceptor: unwrap envelope, return data directly

Create packages/schemas/: Zod schemas for all forms (loginSchema, dailyReportSchema, workProgramSchema, registrationSchema, evaluationSchema, etc.)

Create packages/hooks/: useAuth, usePeriodContext, useDailyReports, useWorkPrograms, useRegistration, useCertificates (all use TanStack Query)

Create packages/constants/: PHASE_LABELS (Bahasa Indonesia), ROLE_MAP, STATUS_LABELS, QUERY_KEYS (all query key constants — never inline strings)

### Step 2.2 — Next.js Project Setup

Initialize Next.js in apps/web/:

- App Router, TypeScript strict: true, Tailwind CSS
- Dependencies: axios, @tanstack/react-query, @tanstack/react-query-devtools, zustand, react-hook-form, zod, react-hot-toast, @hookform/resolvers
- Reference shared packages via workspace: protocol
- next.config.ts: configure rewrites if needed for /api proxy in dev

Create Zustand stores:

```typescript
// authStore: user, isAuthenticated, activePhase, setUser, clearUser, fetchUser
// periodStore: activePeriod, availablePeriods, currentPhase, fetchPeriodContext
// uiStore: sidebarOpen, toasts
```

### Step 2.3 — Layout Structure (App Router)

apps/web/app/
├── (public)/
│   ├── layout.tsx              → PublicLayout (navbar, footer)
│   ├── page.tsx                → Home (SSG)
│   ├── berita/
│   │   ├── page.tsx            → Announcements (ISR 1 hour)
│   │   └── [slug]/page.tsx     → AnnouncementDetail (ISR)
│   ├── unduhan/page.tsx        → Downloads (SSG)
│   ├── lokasi/page.tsx         → LocationsMap (SSG)
│   └── verify-certificate/[token]/page.tsx → CertVerify
│
├── (auth)/
│   ├── layout.tsx              → GuestLayout (redirect if authed)
│   ├── login/page.tsx
│   ├── lupa-kata-sandi/page.tsx
│   └── atur-ulang-kata-sandi/[token]/page.tsx
│
├── (student)/
│   ├── layout.tsx              → StudentLayout (requires role:student)
│   └── mahasiswa/...
│
├── (dosen)/
│   ├── layout.tsx              → DosenLayout (requires role:dosen|dpl)
│   └── dosen/...
│
└── (admin)/
├── layout.tsx              → AdminLayout (requires role admin)
└── admin/...

Each protected layout:

1. On mount: call GET /api/v1/auth/user → populate authStore
2. If 401: redirect to /login
3. If wrong role: redirect to correct portal
4. Wrap children with QueryClientProvider + Toaster

### Step 2.4 — Auth Pages

Implement as client components using shared schemas and api-client:

/login:

- On mount: fetch captcha from GET /api/v1/auth/captcha
- Display math question
- Auto re-fetch captcha: on wrong captcha answer, on expiry (countdown timer)
- Form: username, password, captcha_answer (hidden captcha_id)
- On success: populate authStore, redirect by role (/mahasiswa, /dosen, /admin)

/lupa-kata-sandi:

- Form: email
- POST /api/v1/auth/lupa-kata-sandi

/atur-ulang-kata-sandi/[token]:

- Form: email, password, password_confirmation
- POST /api/v1/auth/atur-ulang-kata-sandi

/profil:

- GET /api/v1/profile → display current profile
- PATCH /api/v1/profile → update profile
- Avatar upload → PATCH /api/v1/profile/avatar (multipart)

/ganti-password:

- Form: current_password, password, password_confirmation
- PATCH /api/v1/profile/password

All forms: React Hook Form + Zod (from packages/schemas), 422 errors mapped to fields

### Step 2.5 — Student Portal Pages

Implement as client components in (student)/mahasiswa/. Each page must:

- Use TanStack Query useQuery / useMutation (from packages/hooks or inline)
- Use QUERY_KEYS constants (never inline strings)
- Show Skeleton loading state (not spinner)
- Show toast on mutation success/error (react-hot-toast)
- Invalidate queries on successful mutation
- All forms: React Hook Form + Zod

Pages in order:

1. /mahasiswa → Dashboard: stats cards, group info, announcements, registration status, active phase banner
2. /mahasiswa/daftar → KKN options: available periods + jenis KKN list
3. /mahasiswa/pendaftaran → Registration form: multi-step, document upload
4. /mahasiswa/pendaftaran/[id]/dokumen → Document upload
5. /mahasiswa/cek-pendaftaran → Registration status with timeline
6. /mahasiswa/laporan-harian → Daily reports list: paginated table, filter by date/status
7. /mahasiswa/laporan-harian/buat → Create report: title, activity, date, GPS coordinates (browser geolocation API), photo upload
8. /mahasiswa/laporan-harian/[id]/edit → Edit report
9. /mahasiswa/program-kerja → Work programs list
10. /mahasiswa/program-kerja/buat → Create work program
11. /mahasiswa/program-kerja/[id] → Work program detail + proposals
12. /mahasiswa/izin → Leave requests list
13. /mahasiswa/izin/buat → Create leave request
14. /mahasiswa/posko → Posko edit
15. /mahasiswa/domisili → Domisili edit
16. /mahasiswa/laporan-akhir → Final report form + file upload
17. /mahasiswa/evaluasi-dpl → DPL evaluation form
18. /mahasiswa/rekapitulasi → Rekapitulasi view + submit
19. /mahasiswa/sertifikat → Certificate view + download link
20. /mahasiswa/workshops → Workshops list + certificates

---

## PHASE 3 — NEXT.JS SPA: DOSEN/DPL PORTAL

Do not begin until Phase 2 is complete and tested end-to-end in browser.

### Dosen

- /dosen → Dashboard

### DPL (in order)

1. /dosen/beranda-dpl → DPL Dashboard: groups summary, pending reports count, pending izin
2. /dosen/kelompok → Groups list
3. /dosen/kelompok/[id] → Group detail: members, location, stats
4. /dosen/laporan-harian → Daily reports list: filter by group/mahasiswa/date/status
5. /dosen/laporan-harian/[id] → Report detail: approve/reject action
6. /dosen/evaluasi → Evaluation form: bulk entry per mahasiswa
7. /dosen/evaluasi/preview-impor → Import preview
8. /dosen/laporan-akhir → Final reports list
9. /dosen/laporan-akhir/[id] → Final report detail: score input
10. /dosen/monitoring → Monitoring visits list
11. /dosen/monitoring/buat → Create monitoring: GPS check-in (browser)
12. /dosen/izin → Leave request approvals: approve/reject

---

## PHASE 4 — NEXT.JS SPA: ADMIN PORTAL

Do not begin until Phase 3 is complete. Implement module by module:

Module 1 — Dashboard + Hub: /admin, /admin/dashboard
Module 2 — Master Data: /admin/tahun-akademik, /admin/jenis-kkn, /admin/jenis-kkn/[id], /admin/periode, /admin/periode/[id], /admin/lokasi, /admin/fakultas, /admin/prodi
Module 3 — Operational: /admin/pendaftaran, /admin/pendaftaran/[id], /admin/kelompok, /admin/kelompok/[id], /admin/dosen/pendaftaran-dpl, /admin/dosen/penugasan, /admin/peserta/pindah
Module 4 — Academic: /admin/nilai, /admin/generator-nilai, /admin/evaluasi, /admin/evaluasi-dpl, /admin/audit-kualifikasi, /admin/dispensasi, /admin/yudisium, /admin/rekapitulasi, /admin/laporan
Module 5 — Content: /admin/warta-utama, /admin/unduhan, /admin/konten-publik/profil, /admin/konten-publik/skema
Module 6 — Users: /admin/pengguna, /admin/pengguna/buat, /admin/mahasiswa, /admin/mahasiswa/[id], /admin/dosen, /admin/dosen/[id]
Module 7 — System: /admin/pengaturan/sertifikat, /admin/pengaturan/sistem, /admin/konfigurasi-penilaian, /admin/audit-log, /admin/audit-log/[id], /admin/database-sync, /admin/database-sync/[id]

---

## PHASE 5 — REACT NATIVE: MAHASISWA APP

Do not begin until Phase 2–4 are complete.

### Step 5.1 — Expo Setup

Initialize in apps/mobile/:

- Expo SDK (latest stable), TypeScript strict: true
- Dependencies: axios, @tanstack/react-query, zustand, react-hook-form, zod, expo-secure-store, expo-location, expo-camera, expo-image-picker, expo-notifications, expo-file-system, @react-navigation/native, @react-navigation/native-stack, @react-navigation/bottom-tabs
- Reference packages/shared-types, packages/api-client, packages/schemas, packages/hooks, packages/constants via workspace
- Configure api-client mobile instance: Bearer token from SecureStore injected via interceptor

### Step 5.2 — Auth + Navigation Structure

RootStack
├── AuthStack (not authenticated)
│   ├── LoginScreen (captcha + credentials)
│   ├── ForgotPasswordScreen
│   └── ResetPasswordScreen
│
└── StudentTabNavigator (role: student)
├── DashboardTab → DashboardScreen
├── ReportsTab
│   ├── DailyReportsListScreen
│   ├── DailyReportCreateScreen (GPS + camera)
│   └── DailyReportEditScreen
├── ActivitiesTab
│   ├── WorkProgramsListScreen
│   ├── WorkProgramDetailScreen
│   ├── IzinListScreen
│   └── IzinCreateScreen
└── ProfileTab
├── ProfileScreen
├── CertificateScreen
├── EvaluasiDplScreen
└── SettingsScreen

Token storage:

- On login success: store token in expo-secure-store key auth_token
- On app start: read token → if exists populate authStore → navigate to app
- On logout: delete token → navigate to AuthStack
- On 401: delete token → navigate to AuthStack

### Step 5.3 — Mahasiswa Mobile Screens

Implement each screen:

1. DashboardScreen: stats, group info, phase banner, announcements
2. DailyReportsListScreen: paginated list, pull-to-refresh
3. DailyReportCreateScreen: title, activity, date, GPS (expo-location), photo (expo-camera/expo-image-picker), submit with offline queue fallback
4. DailyReportEditScreen: same as create, pre-filled
5. WorkProgramsListScreen: list with status badges
6. WorkProgramDetailScreen: detail + proposals
7. IzinListScreen: list with status
8. IzinCreateScreen: type, dates, reason, document upload
9. ProfileScreen: view + edit via PATCH /api/v1/profile
10. CertificateScreen: view score components + download/share PDF
11. EvaluasiDplScreen: form to evaluate DPL

Offline queue for daily reports:

- If no network: save to AsyncStorage queue key offline_queue_reports
- Background sync: when network restored, process queue, upload in order
- Show queue badge on Reports tab

Push notifications:

- Register device token via POST /api/v1/notifications/register-device
- Handle foreground + background notifications
- Notification types: laporan approved/rejected, izin approved/rejected, pengumuman baru

---

## PHASE 6 — REACT NATIVE: DOSEN/DPL APP

Do not begin until Phase 5 is complete and tested on device.

### Navigation

RootStack
├── AuthStack (same as student, shared LoginScreen)
│
└── DplTabNavigator (role: dpl|dosen)
├── DashboardTab → DplDashboardScreen
├── GroupsTab
│   ├── GroupsListScreen
│   └── GroupDetailScreen
├── ReportsTab
│   ├── DplDailyReportsListScreen
│   └── DplDailyReportDetailScreen (approve/reject)
└── ProfileTab
├── ProfileScreen
└── SettingsScreen

### Screens

1. DplDashboardScreen: groups summary, pending reports, pending izin, monitoring schedule
2. GroupsListScreen: kelompok binaan list
3. GroupDetailScreen: members, location map, stats
4. DplDailyReportsListScreen: filter by group/date/status, pull-to-refresh
5. DplDailyReportDetailScreen: full detail, approve/reject action with note
6. EvaluationScreen: per-mahasiswa score input
7. MonitoringCreateScreen: create monitoring visit, GPS check-in (expo-location)
8. IzinApprovalListScreen: pending leave requests, approve/reject
9. ProfileScreen: view + edit profile

---

## PHASE 7 — CLEANUP

Only after ALL phases are complete, all tests pass, all portals verified in production:

Backend cleanup:

- composer remove inertiajs/inertia-laravel
- composer remove tightenco/ziggy
- Delete app/Http/Middleware/HandleInertiaRequests.php
- Delete app/Http/Middleware/HandleActivePeriod.php (or remove Inertia::share calls)
- Remove all Inertia::render() calls from all controllers (now return JSON only)
- Remove all redirect()->with() flash patterns (now return JSON message)
- Remove Inertia from bootstrap/app.php middleware
- Update routes/web.php: keep only public routes that still serve HTML (if any SSR needed), remove all Inertia page routes
- Run: grep -r "Inertia" app/ resources/ — must return zero results
- Run all Pest tests — all must pass

Frontend cleanup (in apps/web/):

- npm remove @inertiajs/react
- Remove createInertiaApp from entry point
- Remove all import from '@inertiajs/react' references
- Remove <Head> imports from @inertiajs/react
- Remove all usePage() calls — replaced by authStore/periodStore
- Remove all useForm() from @inertiajs/react — replaced by React Hook Form
- Remove all router.visit/get/post from @inertiajs/react
- Remove ziggy-js
- Remove all route() helper calls
- Run TypeScript compiler — zero errors
- Run ESLint — zero errors
- Run Next.js build — zero warnings

---

## GLOBAL RULES — APPLY THROUGHOUT ALL PHASES

### FreeBSD

- pkg for packages, service for runtime, sysrc for boot config
- Never suggest systemctl, apt, yum, snap, or Linux-only paths
- If a package has a different name on FreeBSD, use the correct name
- Supervisor: py39-supervisor (not supervisord from pip)
- Node.js: node20 or node22 via pkg or nvm
- When in doubt about FreeBSD compatibility of an npm package, check if it has native bindings and note it

### Security

- Argon2id: ALL user passwords, ALL captcha answer hashes
- SHA256 / HMAC-SHA256: certificate tokens, file checksums, API signatures — nothing else
- Captcha: UUID v4 IDs, Argon2id answer hash, one-time-use (deleted after verify), 5-minute Redis TTL
- Never store plaintext passwords or captcha answers anywhere
- CORS: explicitly list allowed origins — no wildcard in production
- Rate limiting: 10/min on auth endpoints, 60/min on public endpoints
- All API errors: never reveal internals, use consistent codes

### Code Quality

- TypeScript strict: true across all packages and apps — no any types
- PHP PSR-12 throughout
- API Resource toArray() must explicitly list every field — no wildcard includes
- All query keys defined in packages/constants/QUERY_KEYS — never inline strings
- All Zod schemas in packages/schemas — never inline validation
- All API endpoint functions in packages/api-client — never inline axios calls in components
- No hardcoded URLs — environment variables only

### Do NOT

- Do not remove Inertia responses from controllers until Phase 7
- Do not change database migrations or models
- Do not break existing passing Pest tests
- Do not use SHA256 for passwords
- Do not store captcha answers in plaintext
- Do not use Linux-only commands on the FreeBSD server
- Do not skip writing Pest tests for Phase 1 before starting Phase 2
- Do not install npm packages with Linux-only native bindings without flagging

---

## OUTPUT FORMAT PER STEP

For every step:

1. List all files to be created or modified
2. Implement the changes
3. Explain what was done and why
4. Note any FreeBSD-specific consideration
5. Note any security decision (hashing, token handling)

For every phase completion:

- Output a checklist of completed items
- List what must be verified manually in the browser/device
- Confirm all tests pass before stating phase is complete

If any ambiguity is found (model relationships, conflicting controller logic, unclear business rules): STOP and ask before proceeding.

---

Begin with Phase 1, Step 1.1 — FreeBSD Environment Verification.
