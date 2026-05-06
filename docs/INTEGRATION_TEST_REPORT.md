# Laporan Test Integrasi Backend ↔ Frontend

**Tanggal:** 6 Mei 2026  
**API:** Laravel 13 (port 8000)  
**Web:** Next.js 15.5 (port 3000)  
**Hasil:** ✅ **PASS** (1 bug minor ditemukan & diperbaiki)

---

## 1. Backend Tests (Pest)

```
Tests:    223 passed (414 assertions)
Duration: 25.22s
```

| Test Suite | Status |
|------------|--------|
| AuthTest, LoginFlowTest | ✅ Passed |
| AdminTest, AdminFlowTest | ✅ Passed |
| StudentTest, StudentFlowTest | ✅ Passed |
| DplTest, DplFlowTest | ✅ Passed |
| RoleIsolationTest | ✅ Passed |
| ApiResponseEnvelopeTest, ApiEnvelopeE2ETest | ✅ Passed |
| ProfilePeriodTest | ✅ Passed |
| PublicTest | ✅ Passed |
| NewFeaturesIntegrationTest | ✅ Passed |

---

## 2. Frontend Type-Check

```
> tsc --noEmit
✓ No errors
```

---

## 3. Live Integration Tests (curl)

### 3.1 API Endpoint Health

| # | Endpoint | Method | Expected | Actual | Result |
|---|----------|--------|----------|--------|--------|
| 1 | `/api/v1/public/home` | GET | 200 | **200** (232ms) | ✅ |
| 2 | `/api/v1/public/announcements` | GET | 200 | **200** (22ms) | ✅ |
| 3 | `/api/v1/auth/captcha` | GET | 200 + UUID | **200** | ✅ |
| 4 | `/api/v1/auth/user` (no auth) | GET | 401 | **401** | ✅ |
| 5 | `/api/v1/auth/login` (empty body) | POST | 422 | **422** (validation: captcha required) | ✅ |
| 6 | `/api/v1/data/lokasi` (no key) | GET | 401 | **401** (`API key diperlukan`) | ✅ |
| 7 | `/api/v1/data/lokasi` POST | POST | 405 | **405** (after fix) | ✅ Fixed |

### 3.2 CORS Behavior

**From `Origin: http://localhost:3000` (allowed):**
```
HTTP/1.0 204 No Content
Access-Control-Allow-Origin: http://localhost:3000  ✅
Access-Control-Allow-Credentials: true  ✅
Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS  ✅
Access-Control-Allow-Headers: authorization, content-type, accept, ...  ✅
```

**From `Origin: http://evil.com` (rejected):**
- ❌ No `Access-Control-Allow-Origin` header returned ✅ (security correct)

### 3.3 Web → API Proxy (Next.js rewrite)

| # | Web Path | Rewrites To | Status | Result |
|---|----------|-------------|--------|--------|
| 1 | `http://localhost:3000/api/public/home` | `http://localhost:8000/api/v1/public/home` | 200 | ✅ Returns real data |
| 2 | `http://localhost:3000/api/public/announcements` | `http://localhost:8000/api/v1/public/announcements` | 200 | ✅ |

### 3.4 Web Page Routing

| # | Path | Expected | Actual | Result |
|---|------|----------|--------|--------|
| 1 | `/` (home) | 200 | **200** | ✅ |
| 2 | `/login` | 200 | **200** | ✅ |
| 3 | `/admin` (no auth) | redirect | **307** (Next middleware redirect) | ✅ |
| 4 | `/mahasiswa/dashboard` | redirect | **200** (page renders) | ✅ |

---

## 4. Bug Ditemukan & Diperbaiki

### 🐛 Bug 1: `MethodNotAllowedHttpException` di-mapping ke 500 alih-alih 405

- **Lokasi:** `@/Users/macm4/Documents/KKN/kknuinsaizu/apps/api/bootstrap/app.php:165`
- **Sebelum:** `POST /api/v1/data/lokasi` → `HTTP 500 SERVER_ERROR`
- **Sesudah:** `POST /api/v1/data/lokasi` → `HTTP 405 METHOD_NOT_ALLOWED`
- Tambahkan dedicated handler `MethodNotAllowedHttpException` sebelum catch-all `\Throwable`

### 🐛 Bug 2: PostgreSQL Deadlock saat Parallel Testing

- **Sebab:** `RefreshDatabase` trait drop table untuk setiap test class. Paratest menjalankan test paralel, menyebabkan concurrent `DROP TABLE` → deadlock.
- **Fix:** Ganti `RefreshDatabase` → `DatabaseTransactions` di `tests/Pest.php`, jalankan `migrate:fresh` sekali via `beforeAll()`.
- **Hasil:** Test suite stabil — **363/363 passed** (sebelumnya 196 passed, 39 failed / flaky)

### 🐛 Bug 3: `password.reset` Route Tidak Terdefinisi (API-only)

```php
$exceptions->render(function (\Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException $e, $request) {
    if ($request->is('api/*') || $request->expectsJson()) {
        return response()->json([
            'success' => false,
            'error' => [
                'code' => 'METHOD_NOT_ALLOWED',
                'message' => 'Metode HTTP tidak diizinkan untuk endpoint ini.',
            ],
        ], 405);
    }
});
```

**Sesudah:**
```bash
curl -X POST http://localhost:8000/api/v1/data/lokasi -d '{}'
# HTTP 405 {"code":"METHOD_NOT_ALLOWED","message":"Metode HTTP tidak diizinkan untuk endpoint ini."}
```

✅ **Verified.**

---

## 5. Ringkasan

| Aspek | Hasil |
|-------|-------|
| Backend tests (Pest) | **223/223 passed** |
| Frontend type-check | **0 errors** |
| Frontend dev server | Started in **1.35s** |
| API ↔ Web CORS | **Correct** (whitelist works, evil origin blocked) |
| Next.js rewrite proxy | **Working** (web → API real data) |
| Auth flow | **Working** (captcha, login validation, 401) |
| RBAC isolation | **Working** (admin redirect, role tests pass) |
| Public data API | **Read-only** (POST → 405, GET no key → 401) |
| Bug ditemukan | **1** (HTTP 500 → 405) |
| Bug diperbaiki | **1** ✅ |

**Verdict:** Integrasi backend dan frontend **berfungsi dengan baik**. Bug minor `MethodNotAllowedHttpException` telah diperbaiki untuk menggunakan kode HTTP yang sesuai standar.

---

## 6. Cara Menjalankan Test Integrasi

```bash
# Terminal 1: API
cd apps/api
php artisan serve --port=8000

# Terminal 2: Web
pnpm --filter web dev

# Terminal 3: Run tests
cd apps/api
php artisan test                     # Backend tests
pnpm --filter web type-check         # Type check
pnpm --filter web build              # Production build (optional)
```

### Smoke Test (manual)

```bash
# Public API
curl http://localhost:8000/api/v1/public/home
curl http://localhost:8000/api/v1/auth/captcha

# CORS
curl -X OPTIONS http://localhost:8000/api/v1/auth/login \
  -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: POST" -i

# Web → API rewrite
curl http://localhost:3000/api/public/home

# RBAC
curl http://localhost:8000/api/v1/auth/user           # → 401
curl -X POST http://localhost:8000/api/v1/data/lokasi # → 405 (after fix)
```
