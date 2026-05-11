# 07 — Testing

## Backend (apps/api)

### Framework Stack
- **Pest 4** sebagai test runner (wrapper Pest untuk PHPUnit)
- **Pint** untuk code style
- **Larastan 3.9** (PHPStan Laravel extension) level 5
- **PHPUnit** untuk unit + integration (transparan via Pest)

### Konfigurasi (`phpunit.xml`)
```xml
DB_CONNECTION=pgsql       # Real PostgreSQL (bukan SQLite)
BCRYPT_ROUNDS=4           # Test-only, speed up hashing
CACHE_STORE=array
MAIL_MAILER=array
QUEUE_CONNECTION=sync
SESSION_DRIVER=array
TELESCOPE_ENABLED=false
PARALLEL_TESTING=false    # Prevent PostgreSQL deadlock
```

### Test Structure (42 files total)

```
tests/
├── Pest.php                    # Bootstrap + helpers
├── TestCase.php
├── ExampleTest.php
└── Feature/
    ├── Api/
    │   ├── NotificationEndpointsTest.php
    │   ├── NotificationPreferencesAndFcmTest.php
    │   └── V1/
    │       ├── ApiEnvelopeE2ETest.php            # E2E envelope
    │       ├── ApiResponseEnvelopeTest.php
    │       ├── BimbinganTest.php
    │       ├── FrontendContractTest.php
    │       ├── FrontendContractRoleTest.php
    │       ├── LogbookPdfTest.php
    │       ├── NewFeaturesIntegrationTest.php
    │       ├── ProfilePeriodTest.php
    │       ├── PublicTest.php
    │       ├── RoleIsolationTest.php
    │       ├── Auth/
    │       │   ├── AuthTest.php
    │       │   └── LoginFlowTest.php
    │       ├── Student/
    │       │   ├── CertificateDownloadTest.php
    │       │   ├── DashboardLeaderTest.php
    │       │   ├── FinalReportLeaderGuardTest.php
    │       │   ├── PhaseGuardFacultyAdminTest.php
    │       │   ├── StudentFlowTest.php
    │       │   └── StudentTest.php
    │       ├── Dpl/
    │       │   ├── DplFlowTest.php
    │       │   └── DplTest.php
    │       └── Admin/
    │           ├── AdminFlowTest.php
    │           ├── AdminTest.php
    │           ├── ApproveEligibilityTest.php
    │           ├── ComprehensiveReportTest.php
    │           ├── GradingCacheInvalidationTest.php
    │           ├── MakeLeaderUniqueTest.php
    │           └── NotificationBroadcastTest.php
    ├── Security/
    │   ├── AdminAuthorizationMapTest.php       # Arch test
    │   ├── AdminPermissionCoverageTest.php
    │   ├── AuditTrailTest.php
    │   ├── NilaiAuditCoverageTest.php
    │   ├── SecurityRegressionTest.php          # C-001..C-004, H-001
    │   └── TieredRateLimitTest.php             # Rate limit tiers
    └── Services/
        ├── GpsAntiSpoofServiceTest.php
        ├── HometownNormalizationTest.php
        ├── MonitoringHealthCheckTest.php
        └── TelegramAlertServiceTest.php
```

### Test Helpers (`Pest.php`)

```php
// Once-per-suite migrations + role seed
beforeAll(fn () => Artisan::call('migrate:fresh') + RoleSeeder);

// Each test wraps in transaction (DatabaseTransactions)
pest()->extend(TestCase::class)
    ->use(DatabaseTransactions::class)
    ->in('Feature');

// Helpers
function createUserWithRole(string $role, array $permissions = []): User
function createActivePeriod(string $phase = 'execution'): Periode
function getCaptchaAnswer(string $captchaId): string  // Brute 0..40
function generateCaptchaWithAnswer(): array
```

### Coverage Gap

- ❌ **Coverage threshold tidak di-enforce** di CI
- ❌ `phpstan` tidak di CI (baseline 190 KB accumulated)
- ❌ Mutation testing tidak ada (Infection)

## Frontend (apps/web)

### Framework
- **Vitest 4.1** + **@testing-library/react 16** + **jsdom 29**

### Konfigurasi (`vitest.config.ts`)
```typescript
environment: 'jsdom'
globals: true
setupFiles: ['./vitest.setup.ts']
include: ['src/**/*.{test,spec}.{ts,tsx}']
coverage: { provider: 'v8', reporter: ['text', 'html'] }
```

### Test Files
**HANYA SATU**: `src/__tests__/smoke.test.tsx`

```typescript
// Smoke check: render heading + paragraph
```

Tidak ada:
- ❌ Component tests
- ❌ Hook tests
- ❌ Integration tests
- ❌ E2E (Playwright/Cypress)
- ❌ Visual regression (Chromatic/Percy)
- ❌ Accessibility audit (axe-core)
- ❌ Coverage threshold

**Gap kritis**. Sistem dengan 60+ halaman dan banyak form validation tanpa test regresi frontend = fragile.

## Mobile (apps/mobile)

**Tidak ada test framework sama sekali.**

Tidak ada:
- ❌ Jest/Vitest config
- ❌ `__tests__/` directory
- ❌ Test di package.json scripts
- ❌ Detox/Maestro E2E

Areas yang critical undertested:
1. `offlineQueue.ts` — state machine, merge logic, concurrent guard
2. Auth store — login/logout/fetchUser/role detect
3. Role routing helpers — `isStudentLikeUser`, `isDplLikeUser`, `getMobileHomeRoute`
4. API client — token injection, 401 handling
5. Push notification setup — device token registration dedupe

## CI Integration (.github/workflows/ci.yml)

### Frontend Job
```yaml
- pnpm run lint
- pnpm run type-check
- pnpm run build
- pnpm run test                      # Runs vitest
- pnpm audit --audit-level=high || true    # ⚠️ NOT BLOCKING
```

### Backend Job
```yaml
- composer install
- php artisan key:generate
- php artisan migrate --force
- php artisan test --no-coverage     # Pest
- ./vendor/bin/pint --test           # Pint lint
- composer audit                     # Composer security
```

### Missing CI Steps
- ❌ `composer stan` (PHPStan) — baseline ada tapi tidak enforced
- ❌ Pest dengan `--coverage` + threshold
- ❌ Vitest dengan coverage threshold
- ❌ Mobile build verification
- ❌ E2E smoke (Playwright)
- ❌ Lighthouse CI untuk web performance
- ❌ Bundle size regression check
- ❌ SAST (Semgrep / CodeQL)
- ❌ SBOM generation
- ❌ License compliance check

## Rekomendasi Testing

### Prioritas P0
1. Hapus `|| true` dari `pnpm audit` di CI.
2. Tambah `composer stan --memory-limit=512M` step di backend-test job.
3. Generate baseline Vitest test suite untuk auth pages (login, 2FA, reset).

### Prioritas P1
1. Setup Jest + `@testing-library/react-native` di `apps/mobile`.
2. Tambah critical test coverage web:
   - Login/2FA/forgot/reset flow
   - Registrasi mahasiswa form
   - Laporan harian form (dengan GPS mock)
   - Admin table dengan filter/sort/pagination
3. Coverage threshold:
   - Backend: fail if line coverage < 70%
   - Frontend: grow to 30% in 6 weeks, then 50%
   - Mobile: grow to 20% in 6 weeks, then 40%
4. Pest `--coverage-clover` + upload ke Codecov.

### Prioritas P2
1. Playwright E2E untuk flow end-to-end: register → daftar KKN → submit laporan → lihat nilai → download sertifikat.
2. Lighthouse CI di pipeline: performance/a11y/seo/best-practices budget.
3. Visual regression untuk pages dengan heavy styling (dashboard, landing).
4. Accessibility audit otomatis via `axe-core` di testing.

### Prioritas P3
1. Mutation testing dengan Infection PHP.
2. Detox atau Maestro E2E untuk mobile critical path.
3. Load testing (k6/Locust) untuk endpoint high-traffic (`/api/v1/public/home`, `/api/v1/student/daily-reports`).

## Contoh Test Yang Patut Ditiru

### Backend — Arch Test (`AdminAuthorizationMapTest.php`)
```php
it('maps every V1 admin controller to a permission', function () {
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator(app_path('Http/Controllers/Api/V1/Admin'))
    );
    // Compare against EnsureAdminAuthorization::PERMISSION_MAP
});
```

Pola ini excellent. **Perluas ke**:
- Setiap policy punya test di-call di minimal 1 controller
- Setiap route protected auth:sanctum tidak accept anonymous request
- Setiap route yang mutate data di-phase-guarded

### Backend — Regression Test (`SecurityRegressionTest.php`)
Enforces that past vulnerabilities don't re-appear. **Tambahkan entry baru** setiap kali fix security bug.

### Backend — Rate Limit Test (`TieredRateLimitTest.php`)
Test per-tier behavior including X-RateLimit-Limit headers, per-user keying, superadmin exemption. **Pertahankan dan expand** saat tambah tier baru.
