# 09 — Findings Detail

Semua temuan audit 2026-05-11. Temuan sebelumnya (H-001..H-012, M-006/7, C-001..C-004, R-001..R-013) sudah di-fix dan tidak diulang di sini kecuali ada detail baru.

## Legend

| Severity | Definisi |
|---|---|
| 🔴 **Critical** | Harus dikerjakan sebelum production / deploy besar |
| 🟠 **High** | Harus dikerjakan dalam 2–4 minggu |
| 🟡 **Medium** | Harus dikerjakan dalam 1–2 bulan |
| 🟢 **Low** | Hygiene / technical debt, fix saat ada kapasitas |

---

## 🔴 Critical

### C-NEW-001 — 2FA enforcement tidak diberlakukan di middleware
**Area**: Backend / Security
**File**: `app/Models/User.php`, `bootstrap/app.php`

**Observasi**:
`User::requiresTwoFactor()` mengembalikan `true` untuk role `superadmin`, `admin`, `faculty_admin`, `dpl`. Tapi tidak ada middleware yang memverifikasi user sudah setup 2FA sebelum izinkan akses ke panel. User dengan role tersebut bisa login + akses semua endpoint dengan password saja.

**Dampak**:
Satu phishing sukses → attacker punya akses admin tanpa challenge kedua. 2FA secara efektif opsional.

**Repro**:
1. Create user dengan role `admin` tanpa setup 2FA.
2. Login via `/api/v1/auth/login`.
3. Langsung dapat session/bearer — tidak ada paksaan ke `/2fa/setup`.

**Fix**:
```php
// app/Http/Middleware/EnforceTwoFactor.php
class EnforceTwoFactor
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user || !$user->requiresTwoFactor() || $user->hasTwoFactorEnabled()) {
            return $next($request);
        }

        $allowedRoutes = ['api.v1.2fa.status', 'api.v1.2fa.setup',
                          'api.v1.2fa.confirm', 'api.v1.auth.logout'];
        if (in_array($request->route()?->getName(), $allowedRoutes, true)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'TWO_FACTOR_SETUP_REQUIRED',
                'message' => 'Akun Anda wajib mengaktifkan 2FA sebelum melanjutkan.',
            ],
        ], 403);
    }
}
```

Register alias dan apply ke route group admin/dosen/dpl.

**Test**:
- User dengan role admin + tanpa 2FA → any endpoint selain setup returns 403
- User dengan 2FA enabled → normal flow

---

### C-NEW-002 — Private files tanpa signed URL / TTL
**Area**: Backend / Security
**File**: `routes/api.php`, `app/Http/Controllers/Api/V1/PrivateFileController.php`

**Observasi**:
```php
Route::get('/files/attendance-photos/{photo}', ...)->middleware('auth:sanctum');
Route::get('/files/workshop-certificates/{participant}', ...)->middleware('auth:sanctum');
```

URL-nya enumerable (integer ID), hanya diproteksi bearer token auth. Tidak ada TTL. Kalau token leak (XSS, device stolen, log leak), attacker bisa enumerate semua foto absensi + sertifikat.

**Dampak**:
- Enumerable = bulk download PII possible
- No TTL = link shared 1 tahun lalu tetap hidup
- Attendance photo berisi wajah + lokasi GPS

**Fix**:
Gunakan `URL::temporarySignedRoute()`:

```php
// Endpoint generator
Route::post('/files/attendance-photos/{photo}/signed-url', function (AttendancePhoto $photo) {
    Gate::authorize('view', $photo);
    return response()->json([
        'url' => URL::temporarySignedRoute(
            'api.v1.files.attendance-photo',
            now()->addHours(2),
            ['photo' => $photo->id]
        ),
    ]);
})->middleware('auth:sanctum');

// File endpoint — no auth, signed middleware
Route::get('/files/attendance-photos/{photo}', [PrivateFileController::class, 'attendancePhoto'])
    ->middleware('signed')
    ->name('api.v1.files.attendance-photo');
```

**Test**:
- URL tanpa signature → 401
- URL expired → 403
- URL valid → file served

---

## 🟠 High

### H-NEW-001 — `pnpm audit` tidak blocking di CI
**Area**: DevOps
**File**: `.github/workflows/ci.yml`

**Observasi**:
```yaml
- name: Security audit (pnpm)
  run: pnpm audit --audit-level=high || true
```

`|| true` menelan failure. CVE high akan muncul di logs lalu diabaikan.

**Fix**:
```yaml
- name: Security audit (pnpm)
  run: pnpm audit --audit-level=high
```

Jika ada CVE yang tidak bisa di-fix segera (transient deps), tambahkan ke `.pnpm-audit-ignore.json` dengan alasan + expiry date.

---

### H-NEW-002 — PHPStan tidak di CI
**Area**: DevOps / Code Quality
**File**: `.github/workflows/ci.yml`, `apps/api/phpstan.neon`

**Observasi**:
`phpstan-baseline.neon` 190 KB menandakan akumulasi error. Tanpa CI gate, baseline hanya tumbuh.

**Fix**:
```yaml
- name: PHPStan
  run: cd apps/api && composer stan -- --memory-limit=512M
```

Baseline diperbolehkan (tidak regenerate). Tapi new error harus fail.

**Monthly ritual**: baseline pruning session — fix ~50 error paling kritis, regenerate baseline lebih kecil.

---

### H-NEW-003 — Fallback route menyembunyikan bug routing
**Area**: Backend
**File**: `routes/web.php`

**Observasi**:
```php
Route::fallback(function () {
    // API → JSON 404
    // Non-API → redirect ke $app_url + path
});
```

Redirect web path yang tidak dikenal ke `APP_URL` berisiko loop, dan menyembunyikan 404 nyata. Non-issue saat APP_URL = frontend URL berbeda, tapi masalah saat sama.

**Fix**:
```php
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'error' => ['code' => 'NOT_FOUND', 'message' => 'Endpoint tidak ditemukan.'],
    ], 404);
});
```

Laravel backend sekarang headless API only. Web path tidak perlu di-handle.

---

### H-NEW-004 — Sanctum stateful domains fallback tidak aman di non-production
**Area**: Backend / Security
**File**: `config/sanctum.php`

**Observasi**:
Kalau `APP_ENV=staging` dan `SANCTUM_STATEFUL_DOMAINS` tidak set, fallback mencakup `.localhost,.test`.

**Fix**:
```php
'stateful' => explode(',', (string) env('SANCTUM_STATEFUL_DOMAINS', env('APP_ENV') === 'local'
    ? sprintf(...)  // local-only fallback
    : '')),         // staging & production: MUST be explicit
```

---

### H-NEW-005 — Dependency `laravel/boost`, `laravel/mcp`, `laravel/ai` di production
**Area**: Backend / Security
**File**: `apps/api/composer.json`

**Observasi**:
Paket eksplorasi + AI tooling di `require` bukan `require-dev`.
- `laravel/boost` ^2.4 — early-stage Laravel tooling
- `laravel/mcp` ^0.6 — Model Context Protocol, exposing tools to LLM
- `laravel/ai` ^0.5 — general AI abstraction

`routes/ai.php` sudah di-guard `auth:sanctum + role:admin|superadmin + throttle:20,1`. Tapi mengurangi attack surface tetap bermanfaat.

**Fix**:
1. Review `app/Mcp/Servers/AppServer.php` — tool list yang di-expose. Pastikan tidak ada tool yang lintas-tenant.
2. Jika ada tool yang hanya untuk dev (code introspection), pindahkan dependency ke `require-dev`.
3. Jika AI playground tidak production feature, disable via env flag `AI_PLAYGROUND_ENABLED=false`.

---

## 🟡 Medium

### M-NEW-001 — Frontend test coverage nyaris 0
**Area**: Frontend / Testing
**File**: `apps/web/src/__tests__/`

**Fix**:
1. Target 30–40% line coverage dalam 6 minggu.
2. Prioritas test:
   - Login flow (unit + integration dengan MSW)
   - 2FA challenge
   - Registrasi mahasiswa (Zod validation + form submit)
   - Laporan harian form (date picker, GPS, photo upload)
   - Admin table (filter, sort, pagination)
3. Setup `@testing-library/user-event` + `msw` untuk API mock.
4. Gate `--coverage.thresholds.lines=30` di vitest.config.ts.

---

### M-NEW-002 — Mobile test coverage 0
**Area**: Mobile / Testing

**Fix**:
1. `pnpm --filter mobile add -D jest @testing-library/react-native jest-expo`.
2. Setup `jest.config.js` dengan `preset: 'jest-expo'`.
3. Prioritas test:
   - `offlineQueue.processQueue()` — mock API, test success, failure, concurrent guard, merge logic
   - Auth store — login, logout, fetchUser, persist
   - Role helpers — `isStudentLikeUser`, `isDplLikeUser`, `getMobileHomeRoute`

---

### M-NEW-003 — Dokumentasi audit di `docs/` redundan
**Area**: Documentation

**Observasi**:
18+ file audit dengan overlap signifikan:
```
AUDIT_FULL_SYSTEM_2026-05-11.md (19 KB)
AUDIT_RBAC_2026-05-11.md (30 KB)
AUDIT_ROUND_10_FINAL.md (4 KB)
AUDIT_STATUS.md (6 KB)
FINAL_PRODUCTION_AUDIT_REPORT.md (4 KB)
FULL_AUDIT_REPORT.md (15 KB)
FULL_AUDIT_REPORT_V2.md (11 KB)
HACKER_AUDIT.md (17 KB)
INTEGRATION_AUDIT_WEB.md (4 KB)
MASTER.md (16 KB)
MASTER_PRODUCTION_MANUAL.md (4 KB)
SECURITY_HARDENING_REPORT.md (5 KB)
WEB_API_AUDIT.md (12 KB)
```

**Fix**:
1. Konsolidasikan ke `docs/AUDIT_CODEBASE_2026-05-11/` (dokumen ini).
2. Archive semua file audit lama ke `docs/archive/`.
3. Update `docs/INDEX.md` dengan struktur bersih.
4. Dokumen hidup (CURRENT.md) untuk finding aktif; append history saja.

---

### M-NEW-004 — README inaccurate
**Area**: Documentation
**File**: `README.md`

**Fix**:
1. Ganti "Laravel 13 + Inertia.js" → "Laravel 13 backend API + Next.js 15 SPA".
2. Hapus "docker-compose up -d" karena `docker-compose.yml` tidak ada.
3. Update "Tech Stack" sesuai realita (tambahkan Next.js, Expo, Turborepo).
4. Link ke `docs/AUDIT_CODEBASE_2026-05-11/` untuk detail.

---

### M-NEW-005 — Secret manager belum ada
**Area**: Operations / Security

**Fix**:
1. Evaluasi Vault / AWS Secrets Manager / Doppler.
2. Minimal: document rotasi SOP untuk `APP_KEY`, `APP_BLIND_INDEX_KEY`, `MASTER_WEBHOOK_SECRET`.
3. Tambahkan runbook khusus `APP_BLIND_INDEX_KEY`:
   - Langkah generate new key
   - Migration rebuild semua `*_bidx` kolom
   - Cutover (both keys valid temporarily)
   - Remove old key

---

### M-NEW-006 — 199 migrasi perlu squash
**Area**: Database / Maintainability

**Fix**:
Setelah production stabil 2–3 periode KKN:
1. Backup schema: `php artisan schema:dump --prune --database=pgsql`.
2. Ini akan create `database/schema/pgsql-schema.sql` + hapus migrasi lama.
3. Sisakan incremental migrasi Mei 2026+ untuk migrations.

**Benefit**: migrate:fresh ~3× lebih cepat di test suite.

---

### M-NEW-007 — Cloudflare IP list hardcoded
**Area**: Operations
**File**: `apps/api/bootstrap/app.php`

**Fix**:
```bash
# Cron daily (di installer FreeBSD)
#!/bin/sh
curl -s https://www.cloudflare.com/ips-v4 > /tmp/cf-ips-v4
curl -s https://www.cloudflare.com/ips-v6 > /tmp/cf-ips-v6
# Regenerate config partial di config/trustedproxies.php
php /path/artisan config:cache
```

**Alternatif**: Laravel 11+ support `'*'` sentinel untuk trust all (dangerous); atau gunakan `fideloper/proxy` pattern.

---

### M-NEW-008 — CSP masih `'unsafe-inline'`
**Area**: Frontend / Security
**File**: `apps/web/next.config.ts`

**Fix**: Migrate ke nonce-based CSP:

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'nonce-${nonce}';
    ...
  `.replace(/\s{2,}/g, ' ').trim();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', cspHeader);
  return response;
}
```

Komponen inline style/script pakai `headers().get('x-nonce')` untuk inject nonce.

---

### M-NEW-009 — Tidak ada CSP report-only rollout
**Area**: Frontend / Security

**Fix**:
1. Deploy `Content-Security-Policy-Report-Only` dulu 1-2 minggu dengan `report-uri`.
2. Setup endpoint `/api/csp-report` di Laravel untuk kumpulkan violation.
3. Analisa log — adjust policy.
4. Baru switch ke enforcing.

---

## 🟢 Low

### L-NEW-001 — Debugbar cleanup
`DEBUGBAR_ENABLED=false` default. Dokumentasikan di SECURITY.md.

### L-NEW-002 — Artefak debug di working tree
`pest_results.txt`, `route_list.txt`, `migrate_status.txt` sudah di `.gitignore` tapi masih ada di working tree. Hapus fisik.

### L-NEW-003 — `tsconfig.tsbuildinfo` di gitignore
```gitignore
apps/web/tsconfig.tsbuildinfo
```

### L-NEW-004 — Service directory refactor
48 service files + subdir. Naming konsisten. Contoh bentrok:
- `DplAssignmentService.php` di root
- `Admin/DplAssignmentService.php`

Konsolidasi atau rename untuk menghindari import confusion.

### L-NEW-005 — Config files yang non-config
- `config/ai-config-example.json` (12 KB)
- `config/ai-config-schema.json` (12 KB)

Pindahkan ke `docs/examples/` atau `storage/schemas/`.

### L-NEW-006 — `serverExternalPackages` upgrade discipline
Canvas + jsdom punya memory leak historical. Setup periodic upgrade review.

### L-NEW-007 — `LogBox.ignoreLogs` perlu expiry
File: `apps/mobile/app/_layout.tsx`

```typescript
LogBox.ignoreLogs([
  'Maximum update depth exceeded',  // TODO expire 2026-09-01 (tracker: https://...)
  'Warning: Maximum update depth exceeded',
]);
```

Tambahkan deadline dan issue tracker link. Remove setelah upgrade expo-router yang fix.

---

## Finding dari Audit Sebelumnya (untuk Referensi)

Sudah fixed, tetap dicatat:

### Critical (semua resolved)
- C-001 TestAutoLogin env-based bypass
- C-002 EnsurePhase env-based bypass
- C-003 KknThrottle local env skip
- C-004 PublicDataController generic write/delete
- C-006 Nginx rate limit zones missing

### High (semua resolved)
- H-001 Admin controller permission gap → `PERMISSION_MAP` deny-by-default
- H-002 TestAutoLogin production leak
- H-003 Password reset email enumeration → no-content response
- H-004 Sanctum token 30-day expiry → 7-day
- H-005 Frontend error logging anonymous → auth required
- H-006 Debugbar SQL bindings → disabled
- H-007 Sentry PII scrub missing → added
- H-009 Webhook timestamp required + replay window
- H-011 CORS production safety assertion
- H-012 Sanctum stateful domain default empty

### Medium (semua resolved)
- M-006 `/health/detailed` public info leak → superadmin only
- M-007 Cookie Secure flag enforced in production

### Recent (R-001..R-013) — semua resolved
- R-001 Webhook password reset during transaction
- R-004 Webhook idempotency cache → DB state machine
- R-005 Export file pruning
- R-007 Admin arch test recursive
- R-010 Webhook concurrent race handling
- R13-DB-001 Identity table soft deletes
- R13-DB-004 2FA secret hidden in serialization
- R13-DB-006 user_activity_logs composite index
- R13-DB-008 chat_messages.sender_id SET NULL
- R13-DB-012 dispensasi_kkn FK
- R13-FE-001 CSP report-only guideline
- R13-FE-007 Sentry header scrub server
- R13-MOBILE-005 OfflineQueue types
- R13-OPS-014 Nginx Permissions-Policy
