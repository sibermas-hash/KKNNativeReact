# 06 — Security Posture

## Hasil Ringkas

Postur keamanan **kuat secara baseline**. Jejak audit histori (H-001..H-012, M-006/7, C-001..C-004, R-001..R-013) jelas di kode — finding dikomentari dan di-fix di tempatnya. Yang tersisa: gap implementasi 2FA enforcement dan signed URL untuk private files.

## Kategori Kontrol

### 1. Authentication

**Strong:**
- Password hashing: **argon2id** (bukan bcrypt default)
  - `ARGON_MEMORY=65536`, `ARGON_THREADS=2`, `ARGON_TIME=4`
- Session encryption: `SESSION_ENCRYPT=true`
- Session cookie: `SESSION_SECURE_COOKIE=true`, `SESSION_SAME_SITE=lax`, `SESSION_HTTP_ONLY=true`
- Sanctum:
  - `SANCTUM_TOKEN_PREFIX=sibermas_` (GitHub secret scanning integration)
  - `SANCTUM_TOKEN_EXPIRATION=10080` (7 hari, turun dari 30 hari default — H-004)
- Rate limit login: 5/15min per `user|ip`
- Captcha wajib di login (math captcha)
- `forgotPassword` tidak leak enumeration (H-003)
- Lockout event fired setelah exceed limit

**Weak:**
- ⚠️ 2FA **tidak dienforce** di middleware untuk role privileged (C-NEW-001)
- Password policy: min 8, mixed case, numbers, symbols — OK tapi tidak ada check HIBP breach

### 2. Authorization

**Strong:**
- Spatie Permission sebagai RBAC layer
- Triple gate untuk admin route:
  ```
  auth:sanctum → role:superadmin|admin|faculty_admin → admin.auth → Gate::authorize
  ```
- Deny-by-default `EnsureAdminAuthorization::PERMISSION_MAP` (H-001)
- Arch test `AdminAuthorizationMapTest` enforce coverage di CI
- `Gate::before` hanya untuk superadmin (admin tetap through policy untuk faculty scoping)
- 8 policies dengan `superAdminBypass` pattern
- Faculty admin read-only (`view-*` permissions saja)

**Catatan:**
- Closure routes di prefix `/admin` di-log sebagai warning (belum hardened, tapi documented)

### 3. CSRF & XSS

**Strong:**
- CSRF protection aktif untuk web routes
- `validateCsrfTokens(except: ['api/*', 'webhooks/*'])` — API pakai bearer/signature instead
- Next.js:
  - `isomorphic-dompurify` sanitization dengan hardened allowlist
  - Block `data:`, `javascript:` protocols
  - `rel="noopener noreferrer"` auto-applied untuk `target="_blank"`
- CSP enforcing

**Weak:**
- CSP masih `'unsafe-inline'` untuk script/style (M-NEW-008)
- Belum ada report-only rollout untuk strict CSP (M-NEW-009)

### 4. SQL Injection

**Strong:**
- Eloquent ORM + parameterized queries di seluruh codebase
- Raw queries hanya untuk PostgreSQL-specific features (partial unique index, CHECK constraints) di migrasi — no user input
- `hash_equals` digunakan untuk timing-safe comparison di webhook signature & admin secret

### 5. CORS

**Strong:**
- `config/cors.php`:
  - `allowed_methods`: explicit list (no wildcard)
  - `allowed_origins`: dari env `CORS_ALLOWED_ORIGINS`, comma-separated
  - `allowed_headers`: explicit list
  - `supports_credentials: true`
- `AppServiceProvider::assertSafeCorsInProduction()` — production boot throw `RuntimeException` kalau allowed_origins berisi `*`, `null`, atau localhost variants (H-011)
- Sanctum `SANCTUM_STATEFUL_DOMAINS` production default empty (H-012)

**Weak:**
- Non-production fallback stateful domains include `.localhost,.test` — H-NEW-004 (staging could accidentally trust these)

### 6. Rate Limiting

**Strong, multi-layer:**
- **Nginx layer** (`nginx-freebsd.conf`):
  - `limit_req_zone api_limit`: 60r/s, burst 50
  - `limit_req_zone auth_limit`: 5r/m burst 3 (login/forgot/reset)
  - `limit_conn_zone conn_limit`: 50/IP web, 20/IP api
- **Laravel layer**:
  - Named tier limiters (public 30, auth_challenge 10, authenticated role-scaled, bulk 5, file_upload 10)
  - Per-route overrides via `KknThrottleMiddleware`
  - Critical endpoint dict (password.email 3/hr, password.update 5/hr, bulk/mass 5/hr)

**Configuration file**: `config/rate-limiting.php` dengan structure per-endpoint class.

### 7. Session Management

**Strong:**
- Session driver: Redis
- Session encryption aktif
- `SESSION_LIFETIME=120` (2 jam idle)
- HttpOnly + Secure + SameSite Strict untuk `sibermas_token`
- Logout clears token + cookie

**Weak:**
- Tidak ada active session viewer / "log out all devices" endpoint
- Tidak ada token rotation/refresh pattern — token valid 7 hari statis

### 8. File Upload & Private Files

**Strong:**
- Validation per-endpoint (mime, size)
- Private disk untuk attendance photos & workshop certificates
- Per-record authorization di `PrivateFileController`

**Weak:**
- ⚠️ Private files tanpa signed URL / TTL (C-NEW-002)
- Enumerable integer IDs — bisa brute-force jika auth leak

### 9. Webhook Security

**Strong:**
- HMAC-SHA256 signature di `X-Hub-Signature`
- Timestamp **wajib** di `X-Webhook-Timestamp` + window 600s (replay protection, H-009)
- Constant-time comparison
- DB-backed idempotency (`WebhookEvent` state machine)
- Race handling pada unique constraint violation

### 10. Secrets Management

**Strong:**
- `.gitignore` blocks `.env*`, private keys, credentials
- API key hashed (tidak plaintext) — `AdminKeyController::store` hanya echo sekali via email, disimpan hashed
- Sentry `before_send` scrub: password, token, NIK, NIM, NIP, authorization, cookie, captcha
- `debugbar.sql_bindings=false` (H-006 — jangan ship plaintext password ke Sentry)

**Weak:**
- Tidak ada secret manager (Vault, AWS Secrets Manager, Doppler)
- Tidak ada SOP rotasi key (`APP_KEY`, `APP_BLIND_INDEX_KEY`, `MASTER_WEBHOOK_SECRET`)
- `APP_BLIND_INDEX_KEY` rotation akan meng-orphan semua `*_bidx` kolom — perlu runbook

### 11. PII Protection

**Strong (Phase 2-3 migration):**
- **Encrypted at rest**: phone, address, village_name, district_name, regency_name, postal_code, NIK, mother_name, birth_place, gender (some tables), two_factor_secret, two_factor_recovery_codes
- **Blind index**: `nim_bidx`, `nip_bidx` via HMAC-SHA256(APP_BLIND_INDEX_KEY)
- Email intentionally plaintext (auth guard lookup) — trade-off documented

**Weak:**
- `nama` pada `mahasiswa` dan `dosen` masih plaintext — sebagian OK (public), tapi jika ada case sensitif perlu review
- Tidak ada log redaction verification (spot check Sentry dashboard diperlukan)

### 12. Logging

**Strong:**
- `LOG_CHANNEL=stack`, `LOG_STACK=daily`, `LOG_LEVEL=info`
- Sentry integration:
  - `sample_rate` production 0.2 (L-003)
  - `before_send` filter health checks + scrub PII
  - `excluded_paths`: `/health`, `/ready`, `/horizon*`
- Frontend error logging endpoint `/api/log-error` requires auth (H-005)
- `ActivityLogger::log` untuk login, 2fa_verify, logout — observability untuk security events

### 13. Transport

**Strong:**
- HSTS `max-age=31536000; includeSubDomains; preload` di production
- Force HTTPS: `URL::forceScheme('https')` di production
- TLS 1.2 + 1.3 only di Nginx (no TLS 1.0/1.1)
- OCSP stapling enabled
- `upgrade-insecure-requests` di CSP

### 14. 3rd-party Dependencies

**Weak:**
- `pnpm audit --audit-level=high || true` — tidak blocking (H-NEW-001)
- `composer audit` di CI tanpa explicit fail
- Tidak ada SBOM generation (syft/cyclonedx)
- Tidak ada Snyk/Dependabot PR automation
- `laravel/boost`, `laravel/mcp`, `laravel/ai` di dependencies production — attack surface tambahan (H-NEW-005)

## Temuan Security Detail

Lihat [`09-findings.md`](./09-findings.md) untuk daftar lengkap dengan severity, repro, dan remediation.

## Compliance Notes

Sistem ini memproses PII mahasiswa (NIM, NIK, alamat, foto wajah, koordinat GPS, nilai akademik). Beberapa pertimbangan:

1. **UU PDP 2022 (Indonesia)** — right to erasure: sudah didukung via soft-delete + encryption, tapi workflow formal belum ada.
2. **Data retention** — tidak ada policy formal (misal: hapus peserta KKN 5 tahun setelah graduation). Worth menambahkan.
3. **Audit log retention** — no TTL set. Bisa grow tak terbatas.
4. **Export data pribadi** — user tidak punya endpoint "download my data" (GDPR-style). Worth menambahkan untuk UU PDP compliance.

## Rekomendasi Prioritas Security

1. **P0**: `EnforceTwoFactor` middleware untuk role privileged
2. **P0**: Signed URL + TTL untuk `/api/v1/files/*` endpoints
3. **P0**: `pnpm audit` dan `composer audit` blocking di CI
4. **P1**: Sanctum stateful domains non-production fallback empty
5. **P1**: CSP nonce migration
6. **P1**: SOP rotasi `APP_BLIND_INDEX_KEY`
7. **P2**: "Log out all devices" endpoint
8. **P2**: Token rotation/refresh pattern
9. **P2**: Data retention + audit log TTL policy
10. **P3**: SBOM generation + Dependabot
11. **P3**: HIBP breach check pada password registration
