# SIBERMAS KKN - Project Documentation

**Sistem Informasi Kuliah Kerja Nyata (KKN)**
**UIN Prof. K.H. Saifuddin Zuhri Purwokerto**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Tech Stack](#tech-stack)
4. [Getting Started](#getting-started)
5. [Project Structure](#project-structure)
6. [Features](#features)
7. [Documentation Index](#documentation-index)
8. [Support](#support)

---

## Project Overview

SIBERMAS KKN adalah sistem informasi berbasis web dan mobile yang mengelola seluruh siklus KKN mahasiswa UIN SAIZU, mulai dari pendaftaran hingga penerbitan sertifikat.

### Vision
Menyediakan sistem KKN yang transparan, efisien, dan terintegrasi untuk mahasiswa, dosen pembimbing lapangan (DPL), dan administrator.

### Scope
- Pendaftaran dan verifikasi mahasiswa
- Pembagian kelompok dan penugasan DPL
- Pemantauan attendance berbasis GPS
- Pelaporan kegiatan harian dan akhir
- Evaluasi dan perhitungan nilai
- Generate dan verifikasi sertifikat

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                             │
├──────────────┬──────────────┬───────────────┬──────────────┤
│  Web App    │   Mobile     │   Admin       │   DPL        │
│  (Next.js)  │  (Expo)     │   Portal      │   Portal     │
└──────┬──────┴──────┬──────┴───────┬──────┴───────┬──────┘
       │              │              │               │
       └──────────────┴──────┬───────┴───────────────┘
                             │
                    ┌────────▼────────┐
                    │   API Gateway   │
                    │   (Laravel 13)  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
 ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
 │ PostgreSQL  │     │   Redis     │     │    S3/GCS   │
 │  Database   │     │   Cache     │     │   Storage   │
 └─────────────┘     └─────────────┘     └─────────────┘
```

### Key Design Patterns

| Pattern | Usage |
|---------|-------|
| **Repository** | Data access abstraction |
| **Service Layer** | Business logic encapsulation |
| **Middleware** | Cross-cutting concerns (auth, rate-limit) |
| **RBAC** | Role-based access control |
| **SoftDeletes** | Data recovery and audit trail |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Backend** | Laravel | 13.x |
| **Language** | PHP | 8.4 |
| **Database** | PostgreSQL | 16 |
| **Cache** | Redis | 7 |
| **Frontend** | Next.js | 15.x |
| **Language** | TypeScript | 5.x |
| **Mobile** | Expo | 53 |
| **Mobile** | React Native | 0.79 |
| **Testing** | Pest PHP | 2.x |
| **Testing** | Vitest | 1.x |
| **CI/CD** | GitHub Actions | - |

---

## Getting Started

### Prerequisites

```bash
# Required software
PHP 8.4+
Composer 2.x
Node.js 20+
pnpm 8.x
PostgreSQL 16+
Redis 7+
```

### Installation

```bash
# 1. Clone repository
git clone https://github.com/your-org/sibermas.git
cd sibermas

# 2. Install dependencies
composer install
pnpm install

# 3. Setup environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env.local

# 4. Generate keys
cd apps/api && php artisan key:generate

# 5. Run migrations
php artisan migrate

# 6. Start development servers
cd ../web && pnpm dev
```

### Quick Links

| Task | Command |
|------|---------|
| Run API | `cd apps/api && php artisan serve` |
| Run Web | `cd apps/web && pnpm dev` |
| Run Tests | `cd apps/api && php artisan test` |
| Run Lint | `cd apps/api && ./vendor/bin/pint --test` |

---

## Project Structure

```
sibermas/
├── apps/
│   ├── api/                    # Laravel Backend
│   │   ├── app/
│   │   │   ├── Console/        # Artisan commands
│   │   │   ├── Http/
│   │   │   │   ├── Controllers/  # API controllers
│   │   │   │   ├── Middleware/   # Auth, RBAC, security
│   │   │   │   └── Traits/       # ApiResponse, etc.
│   │   │   ├── Models/          # Eloquent models
│   │   │   ├── Services/        # Business logic
│   │   │   └── Jobs/            # Queue jobs
│   │   ├── config/              # Laravel config
│   │   ├── database/
│   │   │   ├── migrations/      # DB migrations
│   │   │   └── seeders/         # DB seeders
│   │   ├── routes/              # Route definitions
│   │   └── tests/               # Pest tests
│   │
│   ├── web/                    # Next.js Frontend
│   │   ├── src/
│   │   │   ├── app/            # Pages (App Router)
│   │   │   ├── components/      # React components
│   │   │   ├── lib/            # Utilities
│   │   │   └── stores/         # Zustand stores
│   │   ├── public/             # Static assets
│   │   └── tests/              # Vitest tests
│   │
│   └── mobile/                 # Expo Mobile App
│       ├── app/                # Expo Router pages
│       ├── components/         # Mobile components
│       └── lib/                # Utilities
│
├── packages/                   # Shared TypeScript packages
│   ├── api-client/            # Axios API client
│   ├── constants/             # Shared constants
│   ├── hooks/                 # React hooks
│   ├── schemas/               # Zod schemas
│   └── shared-types/          # TypeScript types
│
├── .github/
│   └── workflows/             # CI/CD pipelines
│
├── docs/                      # Documentation
├── scripts/                   # Deployment scripts
└── turbo.json                # Turborepo config
```

---

## Features

### 1. Authentication & Authorization
- [x] Username/password login
- [x] TOTP 2FA (Google Authenticator)
- [x] Session management
- [x] Role-based access (Super Admin, Admin, Faculty Admin, DPL, Student)
- [x] API key authentication

### 2. Registration & Placement
- [x] Student eligibility checking (SKS, GPA)
- [x] Document upload and verification
- [x] Group allocation
- [x] DPL assignment
- [x] Real-time slot management

### 3. Attendance Monitoring
- [x] GPS-based attendance with geofencing
- [x] Speed anomaly detection
- [x] Mock location detection
- [x] Duplicate submission prevention
- [x] Daily and session-based attendance

### 4. Program & Reporting
- [x] Daily activity logging
- [x] Photo upload with watermarking
- [x] Program proposal and tracking
- [x] Final report submission
- [x] DPL approval workflow

### 5. Evaluation & Grading
- [x] Multi-component grading
- [x] DPL evaluation
- [x] Attendance weighting
- [x] Report quality scoring
- [x] Final grade calculation

### 6. Certificate Management
- [x] PDF certificate generation
- [x] QR code verification
- [x] Public verification endpoint
- [x] Batch generation

### 7. Communication
- [x] Chat system (student-DPL)
- [x] Announcement broadcasting
- [x] Push notifications (mobile)
- [x] Telegram alerts

### 8. AI Integration (SumoPod)
- [x] AI chat assistant
- [x] Automatic attendance analysis
- [x] Report quality scoring
- [x] Fallback tiers for reliability

---

## Documentation Index

| Document | Description | Size |
|----------|-------------|------|
| **[README.md](./README.md)** | Project overview and quick start | 9KB |
| **[AUDIT_STATUS.md](./AUDIT_STATUS.md)** | Audit history, scores, and findings tracker | 6KB |
| **[WEB_API_AUDIT.md](./WEB_API_AUDIT.md)** | Web + API security audit (Round 14) | 12KB |
| **[FULL_AUDIT_REPORT.md](./FULL_AUDIT_REPORT.md)** | Comprehensive security & quality audit | 15KB |
| **[HACKER_AUDIT.md](./HACKER_AUDIT.md)** | Hacker-mode strict audit (127 issues) | 20KB |
| **[SECURITY.md](./SECURITY.md)** | Security guidelines and hardening | 10KB |
| **[QUICK_START.md](./QUICK_START.md)** | Development setup guide | 5KB |
| **[RBAC.md](./RBAC.md)** | Role-based access control documentation | 15KB |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Deployment procedures (FreeBSD) | 9KB |
| [API.md](./API.md) | API documentation | 8KB |
| [TESTING.md](./TESTING.md) | Testing guidelines (Pest/Vitest) | 9KB |
| [BUSINESS_LOGIC.md](./BUSINESS_LOGIC.md) | KKN business rules & flows | 17KB |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Common issues and solutions | 10KB |

---

## Audit Status Summary

**HACKER-MODE Score:** 45/100 (Round 15) - NOT PRODUCTION READY
**Critical Issues:** 18 (5 require immediate action)
**High Issues:** 24
**Medium Issues:** 45
**Low Issues:** 40

### Critical Actions Required
1. ROTATE all exposed secrets in .env (CRIT-001 to CRIT-005)
2. Remove .env from git history (CRIT-006)
3. Add .env to .gitignore (CRIT-008)
4. Replace prompt() with custom modal (CRIT-010)
5. Fix N+1 queries in Chat/Dashboard/Group controllers (CRIT-012 to CRIT-014)

See [HACKER_AUDIT.md](./HACKER_AUDIT.md) for full details.

---

## Support

- **Documentation:** [docs/](.)
- **Issues:** [GitHub Issues](https://github.com/your-org/sibermas/issues)
- **Email:** support@sibermas.uinsaizu.ac.id

---

## License

Proprietary - UIN Prof. K.H. Saifuddin Zuhri Purwokerto