# Security Guidelines - SIBERMAS KKN

**Last Updated:** 2026-05-11
**Version:** 1.3
**Classification:** INTERNAL

> Catatan: dokumen ini berisi histori hardening. Untuk status keamanan terbaru, gunakan `docs/AUDIT_CODEBASE_2026-05-11/06-security.md` dan `09-findings.md`.

---

## Table of Contents

1. [Critical Security Issues](#critical-security-issues)
2. [Secrets Management](#secrets-management)
3. [Authentication & Authorization](#authentication--authorization)
4. [Transport Security](#transport-security)
5. [Session Management](#session-management)
6. [API Security](#api-security)
7. [Content Security Policy](#content-security-policy)
8. [Database Security](#database-security)
9. [Rate Limiting](#rate-limiting)
10. [Monitoring & Logging](#monitoring--logging)
11. [Security Checklist](#security-checklist)

---

## Critical Security Issues

> ⚠️ **MUST FIX BEFORE PRODUCTION DEPLOYMENT**

### C-004: Hardcoded Secrets in .env

**File:** `apps/api/.env`

The following secrets MUST be rotated before production:

```env
# CRITICAL - Rotate immediately
MASTER_API_TOKEN=           # SIAKAD API credential
GEMINI_API_KEY=            # Google AI credential
AI_PRIMARY_KEY=            # SumoPod primary
AI_FALLBACK_KEY=           # SumoPod fallback (MUST be different)
AI_TERTIARY_KEY=           # SumoPod tertiary (MUST be different)
TELEGRAM_BOT_TOKEN=        # Telegram bot
MAIL_PASSWORD=             # Gmail app password
DB_PASSWORD=               # Database password
REDIS_PASSWORD=            # Redis password
APP_BLIND_INDEX_KEY=       # PII encryption key
```

**Action:**
1. Generate new secrets using: `openssl rand -base64 32`
2. Store in secure vault (HashiCorp Vault, AWS Secrets Manager)
3. Inject via environment variables at runtime

---

### C-005: AI Failover Keys Identical

**File:** `apps/api/.env`

All 3 SumoPod tiers use the same API key, defeating failover purpose.

```env
AI_PRIMARY_KEY=same_key
AI_FALLBACK_KEY=same_key
AI_TERTIARY_KEY=same_key
```

**Action:** Generate 3 different API keys for each tier.

---

### C-008: Secure Cookie Flag Bypassable

**File:** `apps/api/config/session.php:68`

```php
'secure' => env('SESSION_SECURE_COOKIE', null),
```

**Problem:** `null` in production means Laravel auto-detects, which can be wrong behind proxies.

**Action:** Set `SESSION_SECURE_COOKIE=true` explicitly in production `.env`:

```env
SESSION_SECURE_COOKIE=true
```

---

### C-010: TestAutoLogin Bypass Risk

**File:** `apps/api/app/Http/Middleware/TestAutoLogin.php`

```php
$isTesting = app()->environment('local', 'testing');
```

**Risk:** If `AUTH_TEST_AUTO_LOGIN_ENABLED=true` is set in production AND environment detection fails, test login bypass activates.

**Action:** Ensure `AUTH_TEST_AUTO_LOGIN_ENABLED=false` in production.

---

## Secrets Management

### Environment Variables Checklist

Never commit secrets to version control.

```
# apps/api/.env (DO NOT COMMIT)
APP_KEY=base64:xxxxx
DB_PASSWORD=strong_random_password
REDIS_PASSWORD=strong_random_password
SESSION_SECURE_COOKIE=true
```

### Rotation Schedule

| Secret Type | Rotation Frequency | Last Rotated |
|-------------|------------------|--------------|
| API Keys (AI) | Monthly | [ ] Not done |
| Database Password | Quarterly | [ ] Not done |
| Redis Password | Quarterly | [ ] Not done |
| APP_KEY | Yearly | [ ] Not done |
| Telegram Token | Monthly | [ ] Not done |
| Mail Password | Monthly | [ ] Not done |

### Generate Secure Secrets

```bash
# API keys
openssl rand -base64 32

# Database passwords
openssl rand -base64 64 | head -c 32

# Redis passwords
openssl rand -base64 32
```

---

## Authentication & Authorization

### Multi-Factor Authentication (MFA)

TOTP-based 2FA is implemented:

```php
// apps/api/app/Models/User.php
$user->TwoFactorEnabled;        // Boolean
$user->TwoFactorSecret;        // Encrypted TOTP secret
$user->TwoFactorConfirmed;     // Confirmed setup
```

**Setup:** Google Authenticator or compatible app.

**⚠️ NOTE:** TotpController (C-001) is missing ApiResponse trait - fix immediately.

### Role-Based Access Control (RBAC)

| Role | Permissions | Users |
|------|-------------|-------|
| Super Admin | Full system access | IT Staff |
| Admin | KKN management | KKN Coordinator |
| Faculty Admin | Faculty-level management | Faculty Staff |
| DPL | Supervision & evaluation | Lecturers |
| Student | Own data only | KKN Participants |

### RBAC Middleware

```php
// apps/api/app/Http/Middleware/EnsureAdminAuthorization.php
// Deny-by-default approach - unmapped controllers get 500 error
```

**Strengths:**
- PERMISSION_MAP covers all 60+ admin controllers
- Superadmin bypass for emergency access
- Logs missing controllers for discoverability

---

## Transport Security

### TLS Configuration

**Minimum:** TLS 1.2
**Recommended:** TLS 1.3

```nginx
# nginx-freebsd.conf
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
ssl_prefer_server_ciphers on;
```

### HSTS Header

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";
```

---

## Session Management

### Session Configuration

```php
// apps/api/config/session.php
'session' => [
    'driver' => 'redis',           // Recommended
    'lifetime' => 120,             // 2 hours
    'expire_on_close' => false,
    'encrypt' => true,
    'cookie' => 'sibermas_session',
    'path' => '/',
    'domain' => '.uinsaizu.ac.id',
    'secure' => env('SESSION_SECURE_COOKIE', true),  // MUST be true
    'http_only' => true,
    'same_site' => 'strict',      // Recommended
]
```

### ⚠️ Production Checklist

- [ ] `SESSION_SECURE_COOKIE=true` set explicitly
- [ ] `SESSION_DRIVER=redis` (not database)
- [ ] `SESSION_LIFETIME=120` (2 hours max)
- [ ] `SAME_SITE=strict` or `lax`

---

## API Security

### Rate Limiting Tiers

```php
// apps/api/config/rate-limiting.php
'login' => Limit::perMinutes(5, 15)->by('ip'),
'auth_challenge' => Limit::perMinute(10),
'public' => Limit::perMinute(60),
'api.authenticated' => Limit::perMinute(100),
```

### Critical Endpoints Protection

```php
// Critical endpoints with stricter limits
$limiter->limit('critical', 5, 1);  // 5 attempts per minute
```

### CORS Configuration

```php
// apps/api/config/cors.php
// ⚠️ PRODUCTION: Set explicitly, don't rely on defaults
'allowed_origins' => explode(',', env(
    'CORS_ALLOWED_ORIGINS',
    'https://sibermas.uinsaizu.ac.id'
)),
'max_age' => 7200,  // 2 hours (NOT 0!)
```

---

## Content Security Policy

### Current CSP (Report-Only Mode)

```typescript
// apps/web/next.config.ts
const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // ⚠️ Remove unsafe-eval
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://api.sibermas.uinsaizu.ac.id",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
].join('; ');
```

### ⚠️ Before Production

1. Remove `unsafe-eval` from script-src
2. Implement nonce-based CSP
3. Promote from Report-Only to Enforcing

---

## Database Security

### ⚠️ CRITICAL: Enable SSL

```env
# apps/api/.env
DB_SSLMODE=require    # NOT 'disable'!
```

### Soft Deletes

⚠️ **C-003: 61 out of 66 models are missing SoftDeletes**

Enable soft deletes for audit trail preservation:

```php
// apps/api/app/Models/KKN/Attendance.php
use Illuminate\Database\Eloquent\SoftDeletes;

class Attendance extends Model
{
    use SoftDeletes;  // Adds deleted_at column
}
```

### Required Models Missing SoftDeletes

```
AbsensiHarian, Attendance, PesertaKkn, Laporan, LaporanAkhir,
SertifikatKkn, Announcement, DokumenPesertaKkn, Workshop,
Evaluasi, ProgramKerja, ProposalProgramKerja, dll.
```

---

## Rate Limiting

### Configuration

```php
// apps/api/config/rate-limiting.php
return [
    'login' => Limit::perMinutes(5, 15)->by('ip'),
    'password_reset' => Limit::perHours(3, 24)->by('ip'),
    'registration' => Limit::perHours(10, 1)->by('ip'),
    'public' => Limit::perMinute(60),
    'api.authenticated' => Limit::perMinute(100),
    'api.admin' => Limit::perMinute(300),
];
```

### Monitoring

Alerts trigger when:
- Login failures > 5/minute
- Rate limit hits > 80% capacity
- Suspicious patterns detected

---

## Monitoring & Logging

### Sentry Integration

```typescript
// apps/web/sentry.client.config.ts
Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NODE_ENV,
});
```

### Audit Trail Events

```php
// Logged events:
- Authentication (login, logout, failed attempts)
- Authorization failures
- Data modifications (create, update, delete)
- API key usage
- Admin actions
- Rate limit violations
```

### Telegram Alerts

```php
// apps/api/app/Services/TelegramAlertService.php
// Health check failures
// Attendance anomalies
// Security events
```

---

## Security Checklist

### Pre-Deployment (MUST COMPLETE)

- [ ] **C-004**: Rotate all hardcoded secrets
- [ ] **C-005**: Generate 3 different AI API keys
- [ ] **C-006**: Add /notifikasi to middleware matcher
- [ ] **C-007**: Remove unsafe-eval from CSP
- [ ] **C-008**: Set SESSION_SECURE_COOKIE=true
- [ ] **C-009**: Set DB_SSLMODE=require
- [ ] **C-010**: Verify AUTH_TEST_AUTO_LOGIN_ENABLED=false
- [ ] **C-003**: Add SoftDeletes to 61 models
- [ ] **C-001**: Add ApiResponse trait to TotpController
- [ ] **C-002**: Add ApiResponse trait to NotificationController

### Post-Deployment

- [ ] Verify SSL certificates valid
- [ ] Test 2FA flow end-to-end
- [ ] Verify rate limiting active
- [ ] Check Sentry receiving events
- [ ] Verify Telegram alerts working
- [ ] Test session timeout behavior
- [ ] Verify CSP blocking invalid scripts

---

## Security Contact

- **Email:** security@sibermas.uinsaizu.ac.id
- **Incident Response:** emergency@sibermas.uinsaizu.ac.id
- **GitHub Security:** [Report Vulnerability](https://github.com/your-org/sibermas/security/advisories/new)
