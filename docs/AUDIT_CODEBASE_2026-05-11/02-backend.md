# 02 — Backend (Laravel 13)

## Direktori Struktur

```
apps/api/app/
├── Ai/                 # AI tooling
├── Console/
├── Constants/
├── Contracts/
├── Enums/
├── Exports/            # Excel exports
├── Helpers/
├── Http/
│   ├── Controllers/
│   │   ├── Api/
│   │   │   ├── V1/
│   │   │   │   ├── Admin/          # 58 controllers
│   │   │   │   ├── Auth/           # AuthController
│   │   │   │   ├── Dosen/          # 5 controllers
│   │   │   │   ├── Dpl/            # 10 controllers
│   │   │   │   ├── Student/        # 17 controllers
│   │   │   │   ├── PublicController.php
│   │   │   │   ├── ProfileController.php
│   │   │   │   ├── TotpController.php
│   │   │   │   ├── PrivateFileController.php
│   │   │   │   └── PeriodContextController.php
│   │   │   ├── NotificationController.php
│   │   │   ├── NotificationStreamController.php
│   │   │   ├── RegistrationController.php
│   │   │   ├── AdminKeyController.php
│   │   │   ├── WebhookController.php
│   │   │   ├── AttendanceController.php
│   │   │   └── PublicDataController.php
│   │   ├── HealthController.php
│   │   └── AiAssistantController.php
│   ├── Middleware/     # 15 file
│   ├── Requests/
│   ├── Resources/Api/V1/   # 37 resource classes
│   └── Traits/
├── Imports/            # 11 Excel import classes
├── Jobs/               # 16 queued jobs
├── Logging/
├── Mail/
├── Mcp/                # Model Context Protocol
├── Models/
│   ├── KKN/            # 62 model domain (ns: App\Models\KKN)
│   ├── Master/
│   ├── ApiKey.php
│   ├── ProfileChangeRequest.php
│   ├── Project.php
│   ├── User.php
│   └── WebhookEvent.php
├── Notifications/      # 9 notification classes
├── Observers/
├── Policies/           # 8 policies
├── Providers/          # 6 providers
├── Repositories/
├── Services/           # 48 service files + 8 subdirs
│   ├── AI/
│   ├── Admin/
│   ├── KKN/            # Domain-specific services
│   └── MasterApi/
└── Traits/
```

## Routing

### Route Files
- `routes/api.php` — entry untuk seluruh API
- `routes/api/v1-admin.php` — 25 KB, include via `require`
- `routes/api/v1-dosen.php` — 8 KB
- `routes/api/v1-student.php` — 9 KB
- `routes/web.php` — catch-all + password reset redirect ke Next.js
- `routes/ai.php` — MCP endpoint (guarded admin+superadmin)
- `routes/console.php`

### Pola Routing
- Prefix `/api/v1` untuk mayoritas endpoint baru.
- Legacy prefix tanpa `v1` untuk `/api/register`, `/api/notifications`, `/api/attendance`, `/api/log-error`, `/api/server-time`.
- Public data API via API key: `/api/v1/data/{table}` dengan middleware `api.key`.

### Middleware Stack

#### Web stack (append)
```php
HandleActivePeriod
CspHeaders
SecurityHeaders
EnsurePasswordChanged
EnsureUserIsActive
```

#### API stack (prepend + append)
```php
// prepend
AuthenticateWithCookieToken  // baca sibermas_token cookie → Authorization bearer

// append
EnsurePasswordChanged
EnsureProfileCompleted
EnsureUserIsActive
throttle:authenticated       // named limiter role-scaled
```

#### Aliases kustom
```php
'role'              => Spatie RoleMiddleware
'permission'        => Spatie PermissionMiddleware
'role_or_permission'=> Spatie RoleOrPermissionMiddleware
'throttle'          => KknThrottleMiddleware (custom)
'kkn.throttle'      => KknThrottleMiddleware
'api.key'           => ValidateApiKey
'phase'             => EnsurePhase
'not_locked'        => CheckPeriodLock
'admin.auth'        => EnsureAdminAuthorization
'disable.debugbar'  => DisableDebugbar
'restrict.debugbar' => RestrictDebugbarAccess
```

## Middleware Detail

### EnsureAdminAuthorization (deny-by-default)
- File: `app/Http/Middleware/EnsureAdminAuthorization.php`
- Maintainer kontrak: setiap controller di namespace `App\Http\Controllers\Api\V1\Admin\` **harus** terdaftar di `PERMISSION_MAP`.
- Controller tidak terdaftar → `abort(500)` (misconfiguration, bukan privilege leak).
- Arch test `AdminAuthorizationMapTest.php` enforce coverage di CI.
- Superadmin bypass specific permission check (tetapi tidak bypass mapping check).

### VerifyWebhookSignature
- HMAC-SHA256 `sha256=<hex>` di header `X-Hub-Signature`.
- `X-Webhook-Timestamp` **wajib** — menolak replay (H-009 fix).
- Window default 600 detik (`MASTER_WEBHOOK_WINDOW_SECONDS`).
- Payload = `"{timestamp}.{body}"`, dibandingkan via `hash_equals` (constant-time).

### TestAutoLogin
- Aktif **hanya** di `local` & `testing` (hard-gate, H-002 fix).
- Butuh: config `auth.test_auto_login_enabled=true` **DAN** header `X-Test-Mode: enabled`.
- Login via header `X-Test-Login: <username>` (bukan lagi bearer sniffing).

### KknThrottleMiddleware
- Extend `ThrottleRequests`. Override per-route: `password.email` 3/hr, `password.update` 5/hr, bulk/mass 5/hr.
- Login form longgar (300/min), login submit ketat (10/min).
- Signature = `hash('xxh128', user_id_or_guest | route_name | ip)`.

### EnsurePhase
- Parameter multi-fase: `phase:registration,execution,grading`.
- Superadmin + admin bypass. Selain itu tolak dengan `PHASE_BLOCKED` code + pesan dalam Bahasa Indonesia.

### AuthenticateWithCookieToken
- Read `sibermas_token` cookie, forward ke `Authorization: Bearer` jika header tidak ada.
- Memungkinkan Sanctum bearer-token auth via cookie (HttpOnly SPA pattern).

## Authentication Flow

### Login (`POST /api/v1/auth/login`)
1. Validasi input (`login`, `password`, `captcha_id`, `captcha_answer`, `remember`).
2. Verifikasi captcha (math captcha service).
3. Reject kalau input berisi `@` (email bukan username).
4. Rate limit by `login|ip` (5 attempts).
5. `Auth::attempt` dengan `is_active=true`.
6. Cek `hasTwoFactorEnabled()` — jika ya, generate challenge token + cache 5 menit + logout, return 423 `TWO_FACTOR_REQUIRED`.
7. Detect platform via `X-App-Type: mobile` → issue Bearer token vs HttpOnly cookie.
8. Cookie: `sibermas_token`, `path=/`, `SameSite=Strict`, `HttpOnly`, `Secure` (forced true di production).

### 2FA Verify (`POST /api/v1/auth/2fa-verify`)
1. Validasi `challenge_token` (64 char) + `code`.
2. Per-token throttle: 5 attempts, burn challenge setelahnya.
3. TOTP 6-digit via `Google2FA::verifyKey` atau recovery code hash.
4. Success: login user, clear cache, issue token seperti normal login.

### Forgot Password
- `noContent()` terlepas ada/tidaknya email di DB (H-003 enumeration prevention).
- Rate limit 5 attempts/min di route, plus 3/hour di `KknThrottleMiddleware`.

## RBAC Implementation

### Policies
```
AdminOperationPolicy  # cross-cutting admin gate
BasePolicy
IzinPolicy
KknScorePolicy
PeriodPolicy
KegiatanKknPolicy
AuditLogPolicy
EvaluasiPolicy
```

### Gates Registered (AppServiceProvider)
```php
Gate::before(fn($user) => $user->hasRole('superadmin') ? true : null);

// Panel access
'access-admin-panel', 'access-dosen-panel', 'access-dpl-panel', 'access-student-panel'
'view-reports'

// Admin operation gates (21 total)
'manage-master-data', 'manage-groups', 'manage-settings', 'sync-data',
'manageDplAssignment', 'manage-participants', 'view-participants',
'transfer-students', 'manage-users', 'manage-grades', 'view-grades',
'manage-content', 'view-audit-logs', 'manage-dpl', 'manage-reports',
'manage-kkn-operations', 'manage-eligibility', 'manage-requirements',
'manage-workshops', 'manage-database-sync'
```

### Policy Registration (non-default namespace)
Explicit registration untuk model di `App\Models\KKN\`:
```php
Gate::policy(NilaiKkn::class, KknScorePolicy::class);
Gate::policy(KegiatanKkn::class, KegiatanKknPolicy::class);
// ...dst
```

## Rate Limiter Tiers (AppServiceProvider)

| Tier | Limit | Key | Use case |
|---|---|---|---|
| `public` | 30/min | IP | Anonymous read endpoint |
| `auth_challenge` | 10/min | IP | Login, captcha, 2FA |
| `authenticated` | role-scaled | `user:{id}` | Default api group |
| `bulk` | 5/min (30 untuk superadmin) | user or IP | Destructive bulk op |
| `file_upload` | 10/min (60 untuk superadmin) | user or IP | Multipart uploads |

Role scaling untuk `authenticated`:
- superadmin → `Limit::none()` (unlimited)
- admin / faculty_admin → 120/min
- dpl / dosen → 60/min
- student → 60/min
- unknown role → 30/min (guest)

## Error Envelope (bootstrap/app.php)

Semua exception API mapped ke format konsisten:

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED|FORBIDDEN|VALIDATION_ERROR|NOT_FOUND|METHOD_NOT_ALLOWED|RATE_LIMITED|PHASE_BLOCKED|SERVER_ERROR",
    "message": "..."
  }
}
```

Rate limit response mempertahankan headers `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

## Service Layer Highlights

| Service | Ukuran | Fungsi |
|---|---|---|
| `EligibilityService` | 22 KB | Audit kelulusan syarat KKN |
| `WorkshopService` | 21 KB | Workshop + peserta + QR + sertifikat |
| `DplParticipantEvaluationService` | 21 KB | DPL menilai peserta |
| `RegistrationService` | 19 KB | Flow pendaftaran |
| `RegistrationApprovalService` | 19 KB | Approval flow |
| `RegistrationDocumentService` | 18 KB | Upload + validate dokumen |
| `RedisCacheService` | 17 KB | Wrapper caching patterns |
| `GroupSelectionService` | 16 KB | Penempatan kelompok |
| `GradingService` | 13 KB | Komposisi nilai akhir |
| `PeriodeGovernanceService` | 13 KB | Transisi fase periode |
| `CertificateService` | 12 KB | Generate sertifikat PDF+Word |
| `StudentSyncService` | 12 KB | Sync mahasiswa dari SIAKAD |

### SIAKAD Integration
- `MasterApiClient` — HTTP client
- `CircuitBreakerService` — threshold 5, timeout 300s
- `SiakadRecordFilter` — pre-DB filter (whitelist by config)
- `EntityMapperService` — DTO mapping
- `FallbackCacheService` — cache saat circuit open
- `MasterDataSanitizer` — normalize payload

### AI Services
- 3-tier failover: primary (Gemini 2.5 Pro via SumoPod) → fallback (Gemini Flash) → tertiary (GPT-4o).
- `AvatarValidationService` — vision LLM validate foto profil.
- `LogbookAnalyzer` — AI analyze laporan harian.

## Scheduler (bootstrap/app.php)

```php
$schedule->command('kkn:auto-sync-phase')->hourly();
$schedule->command('kkn:check-discipline')->dailyAt('23:00');
$schedule->command('certificates:prune-exports')->hourly();
$schedule->command('webhooks:prune')->dailyAt('02:30');
// master:webhook:sync DISABLED (admin-triggered with backup)
```

## Health Endpoints

- `/up` — Laravel built-in liveness
- `/health` — basic (DB + cache ping)
- `/ready` — DB + cache + storage writability
- `/health/detailed` — **superadmin-only** (M-006 fix). Mengembalikan Redis version, DB table count, queue depth, external API status, storage writability.
