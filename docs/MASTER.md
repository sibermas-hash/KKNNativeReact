# 📘 SIBERMAS KKN UIN SAIZU - MASTER DOCUMENTATION

**Tanggal:** 11 Mei 2026  
**Versi:** 2.0  
**Status:** ⚠️ STALE - LIHAT AUDIT_CODEBASE_2026-05-11

> Dokumen ini mengandung informasi lama (misalnya Laravel 11/PHP 8.2/mobile planned). Gunakan `docs/AUDIT_CODEBASE_2026-05-11/` sebagai source of truth terbaru.

Dokumen master ini merupakan sumber kebenaran tunggal (_single source of truth_) untuk seluruh sistem SIBERMAS KKN UIN SAIZU.

---

## 📋 DAFTAR ISI

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Tech Stack](#3-tech-stack)
4. [Struktur Project](#4-struktur-project)
5. [Roles & Permissions](#5-roles--permissions)
6. [Workflow KKN](#6-workflow-kkn)
7. [Web Documentation](#7-web-documentation)
8. [API Documentation](#8-api-documentation)
9. [Security](#9-security)
10. [Audit Report](#10-audit-report)
11. [Troubleshooting](#11-troubleshooting)
12. [Deployment](#12-deployment)

---

## 1. RINGKASAN EKSEKUTIF

### 1.1 Overview

| Attribute | Value |
|-----------|-------|
| **Project Name** | SIBERMAS KKN UIN SAIZU |
| **Type** | Full-stack Web Application (Monorepo) |
| **Backend** | Laravel 11 API |
| **Frontend** | Next.js 15.3.4 |
| **Mobile** | Expo (Planned) |
| **Score Keseluruhan** | 8.7/10 (A-) |

### 1.2 Production Readiness

```
✅ SECURITY         - 9.5/10
✅ CODE QUALITY      - 8/10  
✅ TYPE SAFETY      - 8/10
✅ TESTING         - 8/10
✅ PERFORMANCE     - 9/10
✅ BUILD          - 10/10
```

### 1.3 Key Metrics

| Metric | Value |
|--------|-------|
| Total Pages Web | 102 |
| Total API Endpoints | 150+ |
| Database Tables | 40+ |
| Test Suite | 444 tests (backend) + 18 tests (web) |
| User Roles | 6 |
| KKN Phases | 6 |

---

## 2. ARSITEKTUR SISTEM

### 2.1 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SIBERMAS ARCHITECTURE                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐                │
│  │   STUDENT    │     │   DOSEN     │     │    ADMIN    │                │
│  │  (Next.js)  │     │  (Next.js) │     │  (Next.js)  │                │
│  └──────┬──────┘     └──────┬──────┘     └──────┬──────┘                │
│         │                    │                    │                         │
│         └────────────────────┼────────────────────┘                         │
│                              │                                            │
│                              ▼                                            │
│                    ┌────────────────┐                                   │
│                    │  NGINX Router  │                                   │
│                    │ (Rate Limiting) │                                   │
│                    └────────┬───────┘                                   │
│                             │                                           │
│              ┌──────────────┼──────────────┐                            │
│              │             │             │                             │
│              ▼             ▼             ▼                             │
│     ┌────────────────┐ ┌────────────────┐ ┌────────────────┐    │
│     │   Next.js Web   │ │  Laravel API   │ │   SIAKAD API   │    │
│     │  (Port 3000)   │ │  (Port 8000)   │ │  (External)    │    │
│     └────────────────┘ └───────┬────────┘ └────────────────┘    │
│                                 │                                    │
│                                 ▼                                    │
│                      ┌────────────────────┐                          │
│                      │   PostgreSQL DB     │                          │
│                      │   + Redis Cache    │                          │
│                      └────────────────────┘                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Tech Stack

#### Backend (Laravel 11)
| Component | Version |
|-----------|---------|
| PHP | 8.2+ |
| Laravel | 11.x |
| Database | PostgreSQL |
| Cache | Redis |
| Queue | Redis |
| Auth | Laravel Sanctum |
| API Docs | Swagger/Scribe |

#### Frontend (Next.js 15)
| Component | Version |
|-----------|---------|
| Node.js | 18+ |
| Next.js | 15.3.4 |
| React | 19.1.0 |
| TypeScript | 5.8.0 |
| Tailwind | 4.1.0 |
| State | Zustand |
| API Client | TanStack Query |

---

## 3. TECH STACK

### 3.1 Backend Dependencies

```json
{
  "require": {
    "php": "^8.2",
    "laravel/framework": "^11.0",
    "laravel/sanctum": "^3.3",
    "spatie/laravel-permission": "^6.0",
    "predis/predis": "^2.0",
    "barryvdh/laravel-dompdf": "^3.0",
    "league/flysystem-aws-s3-v3": "^3.0"
  }
}
```

### 3.2 Frontend Dependencies

```json
{
  "dependencies": {
    "next": "^15.3.4",
    "react": "^19.1.0",
    "typescript": "^5.8.0",
    "tailwindcss": "^4.1.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.75.0",
    "react-hook-form": "^7.55.0",
    "zod": "^3.24.0",
    "axios": "^1.9.0",
    "framer-motion": "^11.0.0"
  }
}
```

---

## 4. STRUKTUR PROJECT

### 4.1 Monorepo Structure

```
kknuinsaizu/
├── apps/
│   ├── api/              # Laravel API
│   │   ├── app/
│   │   ├── bootstrap/
│   │   ├── config/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   └── seeders/
│   │   ├── public/
│   │   ├── routes/
│   │   ├── tests/
│   │   └── artisan
│   │
│   ├── web/              # Next.js Web
│   │   ├── src/
│   │   │   ├── app/
│   │   │   ├── components/
│   │   │   ├── lib/
│   │   │   ├── stores/
│   │   │   └── types/
│   │   ├── public/
│   │   ├── next.config.ts
│   │   └── package.json
│   │
│   └── mobile/           # Expo (Planned)
���
├── packages/
│   ├── api-client/
│   ├── constants/
│   ├── hooks/
│   ├── schemas/
│   └── shared-types/
│
├── docs/
├── scripts/
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### 4.2 API Routes Structure

```
routes/
├── api.php              # Main API entry
├── api/v1-student.php   # Student endpoints
├── api/v1-admin.php    # Admin endpoints
├── api/v1-dosen.php    # Dosen/DPL endpoints
├── web.php            # Web routes
└── console.php        # Commands
```

---

## 5. ROLES & PERMISSIONS

### 5.1 User Roles (6)

| # | Role | Guard | Access Level |
|---|------|------|-------------|
| 1 | `superadmin` | web | 100% |
| 2 | `admin` | web | 99% |
| 3 | `faculty_admin` | web | 28% (READ-ONLY) |
| 4 | `dosen` | web | 4% |
| 5 | `dpl` | web | 4% |
| 6 | `student` | web | 0% (API only) |

### 5.2 Kelompok Roles (3)

| # | Role | Description |
|---|------|------------|
| 1 | `Chairman` | Chairman of KKN group |
| 2 | `Member` | Group member |
| 3 | `Coordinator` | Sub-district coordinator |

### 5.3 Permissions (25)

```php
// Master permissions
$permissions = [
    'manage-master-data',
    'manage-users',
    'sync-data',
    'manageDplAssignment',
    'view-grades',
    'manage-grades',
    'view-participants',
    'manage-participants',
    'transfer-students',
    'manage-groups',
    'manage-dpl',
    'manage-content',
    'manage-announcements',
    'view-audit-logs',
    'manage-reports',
    'view-reports',
    'manage-settings',
    'manage-database-sync',
    'manage-workshops',
    'manage-kkn-operations',
    'manage-eligibility',
    'manage-requirements',
    'access-admin-panel',
    'access-dosen-panel',
];
```

---

## 6. WORKFLOW KKN

### 6.1 KKN Phases (6)

```
upcoming → registration → placement → execution → grading → finished
    │           │           │           │           │
    │           │           │           │           └── 📜 Certificate
    │           │           │           └── 👨‍🏫 DPL Grading
    │           │           └── 📍 GPS + Daily Report
    │           └── 👥 Kelompok Assignment
    └── 📢 Announcement
```

### 6.2 Phase Details

| Phase | Code | Duration | Features |
|-------|------|----------|----------|
| Pra-Pendaftaran | `upcoming` | - | Info, pengumuman |
| Pendaftaran | `registration` | ±2 minggu | Daftar, upload dokumen |
| Seleksi & Plotting | `placement` | ±1 minggu | Kelompok assignment |
| Pelaksanaan | `execution` | 30-50 hari | Daily report, logbook |
| Penilaian | `grading` | ±2 minggu | Nilai, final report |
| Selesai | `finished` | - | Sertifikat |

### 6.3 Middleware Phase

```php
// EnsurePhase middleware
Route::get('pendaftaran', ...)->middleware('phase:registration');
Route::get('kaporan', ...)->middleware('phase:execution,grading');
Route::get('nilai', ...)->middleware('phase:grading,finished');
```

---

## 7. WEB DOCUMENTATION

### 7.1 Pages Structure (102 Pages)

| Route Group | Pages | Description |
|------------|-------|-------------|
| `/admin/*` | ~50 | Admin panel |
| `/mahasiswa/*` | ~25 | Student dashboard |
| `/dosen/*` | ~20 | Dosen/DPL pages |
| `/auth/*` | ~6 | Auth pages |
| Public | ~5 | Landing, berita |

### 7.2 Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Type check
npm run type-check

# Lint
npm run lint

# Test
npm run test
```

### 7.3 Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SENTRY_DSN=
ANALYZE=false
```

---

## 8. API DOCUMENTATION

### 8.1 API Endpoints Summary

| Category | Endpoints | Auth |
|----------|----------|------|
| Auth | 10 | Public |
| Student | 25 | Sanctum |
| Admin | 80 | Sanctum + RBAC |
| Dosen/DPL | 25 | Sanctum |
| Public | 10 | None |

### 8.2 Authentication

```php
// Sanctum SPA authentication
sanctum: true,
guards: ['web'],
```

### 8.3 Rate Limiting

```php
// Tiered rate limiting
'throttle:60,1'   // Regular users
'throttle:120,1'   // Admins
'throttle:10,1'     // Sensitive endpoints
```

---

## 9. SECURITY

### 9.1 Security Headers

```typescript
// next.config.ts
{
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Content-Security-Policy', value: csp },
  ],
}
```

### 9.2 Authentication Flow

```
User Login
    ↓
/auth/login (validate credentials)
    ↓
Generate sanctum_token (HttpOnly cookie)
    ↓
Redirect to role-based dashboard
    ↓
Middleware checks sibermas_token (HttpOnly)
    ↓
Allow/Block access
```

### 9.3 PII Encryption

| Field | Encryption |
|-------|-------------|
| NIK | AES-256-GCM |
| Address | AES-256-GCM |
| Phone | AES-256-GCM |
| Parent Info | AES-256-GCM |
| NIM (lookup) | HMAC-SHA256 (blind index) |

---

## 10. AUDIT REPORT

### 10.1 Full Audit Results

| Category | Score | Details |
|----------|-------|---------|
| Security | 9.5/10 | HttpOnly, CSRF, rate limiting |
| Code Quality | 8/10 | Pint needed (200+ files) |
| Type Safety | 8/10 | 6 PHPStan errors, 80 any types |
| Testing | 8/10 | 444 + 18 tests |
| Performance | 9/10 | Optimized, cached |
| Build | 10/10 | 102 pages |

### 10.2 Issues Found

| Issue | Severity | Fix Priority |
|-------|----------|--------------|
| PHPStan 6 errors | LOW | Post-launch |
| ESLint ~130 warnings | LOW | Post-launch |
| CSP report-only | LOW | After UAT |
| Any types ~80 | MEDIUM | Backlog |
| Test coverage gap | MEDIUM | Backlog |

### 10.3 Pass Security Checks

```
✅ SQL Injection     - Parameterized queries
✅ XSS              - Output encoding + sanitized
✅ CSRF             - Sanctum tokens
✅ Command Inj.     - No exec/shell_exec
✅ eval()           - No eval usage
✅ Auth Cookie     - HttpOnly
✅ Rate Limiting   - Multi-tier
✅ Audit Logging  - Implemented
```

---

## 11. TROUBLESHOOTING

### 11.1 Common Issues

#### Web Build Fails
```bash
# Clear .next cache
rm -rf apps/web/.next
npm run build
```

#### API 500 Error
```bash
# Clear cache
php artisan cache:clear

# Clear config
php artisan config:clear

# Rebuild cache
php artisan config:cache
```

#### Login Issues
```bash
# Check cookie settings
# Ensure SESSION_DOMAIN matches
# Ensure CORS_ALLOWED_ORIGINS includes frontend
```

### 11.2 Health Checks

```bash
# API health
curl http://localhost:8000/health

# Database connection
php artisan migrate:status

# Redis connection
php artisan tinker -> Redis::connection()
```

---

## 12. DEPLOYMENT

### 12.1 Production Checklist

- [ ] Set `APP_ENV=production`
- [ ] Set `APP_DEBUG=false`
- [ ] Generate `APP_KEY`
- [ ] Generate `APP_BLIND_INDEX_KEY`
- [ ] Configure `SANCTUM_STATEFUL_DOMAINS`
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Configure Redis credentials
- [ ] Configure Sentry DSN
- [ ] Setup HTTPS/SSL
- [ ] Configure backup
- [ ] Setup monitoring

### 12.2 Environment Variables

```bash
# .env (Production)
APP_ENV=production
APP_DEBUG=false
APP_URL=https://kkn.uinsaid.ac.id

DB_HOST=localhost
DB_DATABASE=sibermas
DB_USERNAME=sibermas_user
DB_PASSWORD=<secure>

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=<secure>

SESSION_DOMAIN=kkn.uinsaid.ac.id
SANCTUM_STATEFUL_DOMAINS=kkn.uinsaid.ac.id
CORS_ALLOWED_ORIGINS=https://kkn.uinsaid.ac.id

NEXT_PUBLIC_API_URL=https://api.kkn.uinsaid.ac.id
NEXT_PUBLIC_SENTRY_DSN=https://...
```

### 12.3 Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name kkn.uinsaid.ac.id;

    ssl_certificate /etc/ssl/certs/kkn.crt;
    ssl_certificate_key /etc/ssl/private/kkn.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 📊 QUICK REFERENCE

### Database Migration Commands
```bash
php artisan migrate
php artisan migrate:rollback
php artisan migrate:fresh --seed
php artisan db:seed --class=RoleSeeder
```

### Queue Commands
```bash
php artisan queue:work
php artisan queue:listen
php artisan queue:restart
```

### Cache Commands
```bash
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

### Useful Commands
```bash
php artisan tinker
php artisan inspire
php artisan about
php artisan test
```

---

## 🔗 REFERENCES

| Document | Location |
|----------|----------|
| RBAC Guide | docs/RBAC.md |
| Workflow | docs/WORKFLOW.md |
| Web Docs | docs/WEB.md |
| Security | docs/SECURITY.md |
| Audit Report | docs/FULL_AUDIT_REPORT_V2.md |
| Index | docs/INDEX.md |

---

**Document Version:** 2.0  
**Last Updated:** 11 Mei 2026  
**Author:** SIBERMAS Development Team  
**Classification:** INTERNAL

---

**SIAP PRODUKSI ✅**
