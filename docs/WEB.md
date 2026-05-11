# 🌐 SIBERMAS Web Documentation

**Tanggal:** 11 Mei 2026  
**Versi:** 1.0  
**Status:** ⚠️ STALE - LIHAT AUDIT_CODEBASE_2026-05-11/04-frontend.md

> Dokumen ini berisi beberapa klaim lama. Gunakan `docs/AUDIT_CODEBASE_2026-05-11/04-frontend.md` sebagai source of truth frontend terbaru.

Dokumen ini merupakan sumber kebenaran (_single source of truth_) untuk SIBERMAS Web (Next.js).

---

## 📋 Daftar Isi

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Pages Overview](#3-pages-overview)
4. [Authentication](#4-authentication)
5. [Security](#5-security)
6. [API Integration](#6-api-integration)
7. [Build & Deployment](#7-build--deployment)
8. [Configuration](#8-configuration)

---

## 1. Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.3.4 | React framework |
| React | 19.1.0 | UI library |
| TypeScript | 5.8.0 | Type safety |
| Tailwind CSS | 4.1.0 | Styling |
| Zustand | 5.0.0 | State management |
| TanStack Query | 5.75.0 | Server state |
| React Hook Form | 7.55.0 | Form handling |
| Zod | 3.24.0 | Validation |
| Radix UI | - | Component primitives |
| Framer Motion | 11.0.0 | Animations |
| Sentry | 10.51.0 | Error tracking |

### 1.1 Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| Vitest | 4.1.5 | Testing |
| ESLint | 9.0.0 | Linting |
| Sentry | 10.51.0 | Error tracking |

---

## 2. Project Structure

```
apps/web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (admin)/           # Admin route group
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── peserta/
│   │   │       ├── kelompok/
│   │   │       ├── nilai/
│   │   │       └── ...
│   │   ├── (auth)/           # Auth route group
│   │   │   ├── login/
│   │   │   ├── ganti-password/
│   │   │   └── ...
│   │   ├── (dosen)/         # Dosen route group
│   │   ├── (student)/       # Student route group
│   │   ├── layout.tsx       # Root layout
│   │   ├── page.tsx         # Home page
│   │   └── middleware.ts    # Edge middleware
│   ├── components/          # Reusable components
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── common/
│   │   ├── mahasiswa/
│   │   └── ...
│   ├── lib/                # Utilities
│   │   ├── api.ts          # Axios client
│   │   ├── server-api.ts   # Server-side API
│   │   ├── utils.ts       # Helpers
│   │   └── sanitize.ts   # HTML sanitizer
│   ├── stores/            # Zustand stores
│   │   └── index.ts      # Auth + Period stores
│   ├── providers/         # React providers
│   └── types/            # TypeScript types
├── public/                # Static assets
├── next.config.ts         # Next.js config
├── package.json
└── tsconfig.json
```

---

## 3. Pages Overview

### 3.1 Total: 102 Pages

| Route Group | Pages | Description |
|------------|------|-------------|
| `/admin/*` | ~50 | Admin panel |
| `/mahasiswa/*` | ~25 | Student dashboard |
| `/dosen/*` | ~20 | Dosen/DPL pages |
| `/auth/*` | ~6 | Login, password reset |
| Public | ~5 | Landing, berita, lokasi |

### 3.2 Public Routes

| Path | Description |
|------|-------------|
| `/` | Landing page |
| `/berita` | News list |
| `/berita/[slug]` | News detail |
| `/lokasi` | Location map |
| `/unduhan` | Downloads |
| `/verify-certificate/[token]` | Certificate verification |

### 3.3 Auth Routes

| Path | Description |
|------|-------------|
| `/login` | Login page |
| `/login/2fa` | 2FA verification |
| `/ganti-password` | Password change |
| `/lupa-password` | Forgot password |
| `/atur-ulang-password` | Reset password |

### 3.4 Admin Routes

| Path | Description |
|------|-------------|
| `/admin/dashboard` | Admin dashboard |
| `/admin/peserta` | Participant management |
| `/admin/kelompok` | Group management |
| `/admin/nilai` | Grade management |
| `/admin/pengguna` | User management |
| `/admin/periode` | Period management |
| `/admin/jenis-kkn` | KKN type management |
| `/admin/laporan` | Reports |
| `/admin/dispensasi` | Dispensations |
| `/admin/evaluasi` | Evaluations |
| `/admin/dosen` | Dosen management |
| `/admin/chat` | Admin chat |
| `/admin/activity-log` | Activity logs |
| `/admin/database-sync` | SIAKAD sync |
| `/admin/avatar-moderation` | Avatar moderation |
| `/admin/audit-log` | Audit logs |

### 3.5 Student Routes

| Path | Description |
|------|-------------|
| `/mahasiswa` | Student dashboard |
| `/mahasiswa/pendaftaran` | Registration |
| `/mahasiswa/laporan-harian` | Daily reports |
| `/mahasiswa/laporan-akhir` | Final report |
| `/mahasiswa/logbook` | Logbook |
| `/mahasiswa/izin` | Permission requests |
| `/mahasiswa/posko` | Camp info |
| `/mahasiswa/program-kerja` | Work programs |
| `/mahasiswa/rekapitulasi` | Recapitulation |
| `/mahasiswa/sertifikat` | Certificate |
| `/mahasiswa/chat` | Chat |
| `/mahasiswa/evaluasi-dpl` | DPL evaluation |
| `/mahasiswa/poster` | Poster |

### 3.6 Dosen/DPL Routes

| Path | Description |
|------|-------------|
| `/dosen` | Dosen dashboard |
| `/dosen/dashboard` | Dashboard |
| `/dosen/kelompok` | My groups |
| `/dosen/laporan-harian` | Daily reports |
| `/dosen/laporan-akhir` | Final reports |
| `/dosen/evaluasi` | Evaluations |
| `/dosen/izin` | Permission requests |
| `/dosen/monitoring` | Monitoring |
| `/dosen/workshops` | Workshops |
| `/dosen/evaluasi-dpl` | DPL evaluation |

---

## 4. Authentication

### 4.1 Auth Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Edge Middleware                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │  PROTECTED_PREFIXES = [                           │   │
│  │    '/admin', '/mahasiswa', '/dosen', '/profil',    │   │
│  │    '/ganti-password', '/notifikasi'             │   │
│  │  ]                                            │   │
│  └──────────────────────────────────────────────────┘   │
│                         │                              │
│         ┌──────────────┴──────────────┐              │
│         ▼                             ▼              │
│  ┌─────────────┐              ┌─────────────┐            │
│  │ No Token  │              │ Has Token  │            │
│  └────┬────┘              └────┬────┘            │
│       │                      │                              │
│       ▼                      ▼                              │
│  /login?redirect=    NextResponse.next()             │
│       (with redirect param)                          │
└─────────────────────────────────────────────────────┘
```

### 4.2 Cookies

| Cookie | HttpOnly | Secure | SameSite | Purpose |
|--------|----------|--------|----------|---------|
| `sibermas_token` | ✅ | ✅ | Strict | Auth token |
| `sibermas_role` | ❌ | ❌ | Strict | Deprecated |

### 4.3 Token Verification

```typescript
// src/middleware.ts:36
function hasAuthToken(request: NextRequest): boolean {
  // Only trust the HttpOnly cookie
  return Boolean(request.cookies.get('sibermas_token')?.value);
}
```

### 4.4 Client-Side State

```typescript
// src/stores/index.ts
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}
```

---

## 5. Security

### 5.1 Headers (next.config.ts:72-137)

```typescript
{
  source: '/:path*',
  headers: [
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
    { key: 'Content-Security-Policy', value: csp },
  ],
}
```

### 5.2 CSP Configuration

```
default-src 'self'
script-src 'self' 'unsafe-inline'      # Next.js hydration
style-src 'self' 'unsafe-inline'        # Framer Motion
img-src 'self' data: blob: https:
font-src 'self' data:
connect-src apiUrl sentryOrigin
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
object-src 'none'
```

### 5.3 Security Features

| Feature | Status | Implementation |
|--------|--------|---------------|
| X-Frame-Options DENY | ✅ | next.config.ts |
| X-Content-Type-Options | ✅ | nosniff |
| Referrer-Policy | ✅ | strict-origin-when-cross-origin |
| DNS Prefetch Control | ✅ | on |
| Permissions-Policy | ✅ | camera/mic/geolocation |
| CSP | ✅ | Report-only mode |
| HTTPS Only | ✅ | Backend enforces |

### 5.4 Sentry Integration

| File | Purpose |
|------|---------|
| `sentry.client.config.ts` | Client errors |
| `sentry.server.config.ts` | Server errors |
| `sentry.edge.config.ts` | Edge/middleware errors |

---

## 6. API Integration

### 6.1 Axios Client

```typescript
// src/lib/api.ts
import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

### 6.2 Auth API

```typescript
// src/lib/api.ts
export const authApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});
```

### 6.3 API Error Handling

```typescript
interface ApiError {
  code: string;
  message: string;
}

// Error codes dari backend:
// - UNAUTHORIZED → redirect to /login
// - PASSWORD_CHANGE_REQUIRED → redirect to /ganti-password
// - PROFILE_INCOMPLETE → redirect to /profil
// - FORBIDDEN → show 403 page
// - PHASE_BLOCKED → show phase blocked page
```

### 6.4 API Rewrite (next.config.ts:62-69)

```typescript
async rewrites() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return [];
  return [
    { source: '/api/clear-session', destination: '/api/clear-session' },
    { source: '/api/:path*', destination: `${apiUrl}/:path*` },
  ];
}
```

---

## 7. Build & Deployment

### 7.1 Build Commands

```bash
# Development
npm run dev

# Production build
npm run build

# Start production
npm run start

# Lint
npm run lint

# TypeScript check
npm run type-check

# Tests
npm run test
```

### 7.2 Build Output

```
Mode: standalone (ideal for Docker)
Pages: 102
First Load JS: 103 kB shared
```

### 7.3 Environment Variables

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SENTRY_DSN=
ANALYZE=false
```

### 7.4 Production Checklist

- [ ] Set `NEXT_PUBLIC_API_URL` to production API
- [ ] Set `NEXT_PUBLIC_SENTRY_DSN` for error tracking
- [ ] Set `APP_ENV=production`
- [ ] Configure `SANCTUM_STATEFUL_DOMAINS`
- [ ] Configure `CORS_ALLOWED_ORIGINS`
- [ ] Test CSP in report-only mode
- [ ] Verify HTTPS enforcement

---

## 8. Configuration

### 8.1 next.config.ts

```typescript
const nextConfig: NextConfig = {
  output: 'standalone',
  eslint: { ignoreDuringBuilds: true },
  serverExternalPackages: ['canvas', 'jsdom', 'isomorphic-dompurify'],
  devIndicators: false,
  compress: true,
  reactStrictMode: true,
  poweredByHeader: false,
  generateEtags: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
  },
};
```

### 8.2 Optimized Packages

```typescript
experimental: {
  optimizePackageImports: [
    'lucide-react',
    '@tanstack/react-query',
    'clsx',
    'zod',
    'react-hook-form',
    '@hookform/resolvers',
    'recharts',
    '@radix-ui/react-*', // all Radix components
  ],
}
```

### 8.3 Transpiled Packages

```typescript
transpilePackages: [
  '@sibermas/shared-types',
  '@sibermas/api-client',
  '@sibermas/schemas',
  '@sibermas/hooks',
  '@sibermas/constants',
  'framer-motion',
]
```

---

## 📊 Audit Summary

| Dimensi | Score | Status |
|--------|-------|--------|
| **Build** | 10/10 | ✅ 102 pages |
| **Security** | 9/10 | ⚠️ CSP report-only |
| **TypeScript** | 9/10 | ⚠️ Any types |
| **Testing** | 8/10 | ⚠️ Coverage |
| **Performance** | 9/10 | ✅ Optimized |
| **Code Quality** | 8/10 | ⚠️ Unused vars |

### Issues

1. **CSP** - Report-only mode, perlu 1-2 minggu observe
2. **TypeScript any** - ~80 instances
3. **Unused variables** - ~50 instances
4. **Test coverage** - Perlu expand

---

## 🔗 Referensi

- Package: `apps/web/package.json`
- Config: `apps/web/next.config.ts`
- Middleware: `apps/web/src/middleware.ts`
- API Client: `apps/web/src/lib/api.ts`
- Stores: `apps/web/src/stores/index.ts`

---

**Document Version:** 1.0  
**Last Updated:** 11 Mei 2026  
**Author:** SIBERMAS Development Team
