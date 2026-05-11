# 01 — Arsitektur

## Overview

SIBERMAS adalah monorepo Turborepo dengan pnpm workspaces yang mengelola 3 aplikasi dan 5 shared packages:

```
kknuinsaizu/
├── apps/
│   ├── api/       # Laravel 13 (PHP 8.4) — backend API
│   ├── web/       # Next.js 15 (React 19) — SPA untuk admin/dpl/mahasiswa
│   └── mobile/    # Expo 53 / RN 0.79 — aplikasi mobile mahasiswa + DPL
├── packages/
│   ├── shared-types/   # TypeScript types lintas app
│   ├── schemas/        # Zod schemas validasi
│   ├── api-client/     # Axios-based clients (web + mobile variants)
│   ├── hooks/          # React hooks reusable
│   └── constants/      # Konstanta runtime
├── scripts/            # backup.sh, restore.sh
├── docs/               # Dokumentasi
├── nginx-freebsd.conf  # Template Nginx production
├── install-freebsd.sh  # Installer otomatis FreeBSD
├── turbo.json          # Pipeline Turborepo
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Keputusan Arsitektur Utama

### Decoupled SPA + API
- **Bukan** Inertia.js (meskipun README menyebutkan — tidak akurat).
- Web app adalah Next.js 15 App Router standalone yang memanggil Laravel API via `NEXT_PUBLIC_API_URL`.
- Auth via Sanctum HttpOnly cookie (`sibermas_token`).
- Mobile menggunakan Bearer token yang disimpan di `expo-secure-store`.

### Route Proxy
`apps/web/next.config.ts` memiliki `rewrites()` yang memproxy `/api/:path*` → `NEXT_PUBLIC_API_URL/:path*`. Endpoint Next.js internal (`/api/clear-session`) di-exclude explicit.

### Package Sharing
Semua lintas-app TypeScript sharing lewat `@sibermas/*` path mapping di `tsconfig.base.json`. `transpilePackages` di next.config untuk server-side rendering.

## Tech Stack Ringkas

### Backend
- PHP 8.4, Laravel 13
- Database: PostgreSQL 16
- Cache/Queue: Redis 7 (`phpredis` / `predis`)
- Auth: Laravel Sanctum 4
- RBAC: Spatie Permission 7
- 2FA: PragmaRX Google2FA + bacon-qr-code
- AI: Prism PHP + Laravel AI (Gemini + OpenAI kompatibel via SumoPod)
- MCP: Laravel MCP 0.6
- Excel: Maatwebsite/Excel 3.1
- PDF: barryvdh/laravel-dompdf, phpoffice/phpword
- Image: intervention/image 3
- Storage: league/flysystem-aws-s3-v3
- Backup: spatie/laravel-backup
- API Docs: knuckleswtf/scribe
- Test: Pest 4, Pint, Larastan 3.9

### Frontend (Web)
- Next.js 15, React 19, TypeScript 5.8
- Tailwind CSS 4, Radix UI primitives, CVA, tailwind-variants
- State: TanStack Query 5.75, Zustand 5
- Forms: react-hook-form 7.55 + @hookform/resolvers + Zod
- Sanitization: isomorphic-dompurify
- Map: MapLibre GL 5.24
- Animation: framer-motion 11, lenis 1.1
- Observability: @sentry/nextjs 10.51
- Test: Vitest 4.1 + @testing-library/react 16 + jsdom 29

### Mobile
- Expo 53, React Native 0.79
- expo-router 5.1 (typed routes)
- State: Zustand + TanStack Query
- Secure storage: expo-secure-store
- Offline: @react-native-async-storage + @react-native-community/netinfo
- Camera/Media: expo-camera, expo-image-picker, expo-location
- Push: expo-notifications
- Observability: @sentry/react-native 6.14

## Role Pengguna

6 role yang dikelola via Spatie Permission:

| Role | Deskripsi | Panel |
|---|---|---|
| `superadmin` | Akses penuh, god-mode (Gate::before bypass) | Admin |
| `admin` | Admin LP2M, semua kecuali `manage-settings` | Admin |
| `faculty_admin` | Read-only khusus data fakultasnya | Admin (limited) |
| `dosen` | Dosen biasa, akses panel dosen | Dosen |
| `dpl` | Dosen Pembimbing Lapangan | Dosen/DPL |
| `student` | Mahasiswa peserta KKN | Student/Mahasiswa |

## Alur Data Utama

```
Mahasiswa / DPL / Admin (Web atau Mobile)
           │
           ├── Sanctum HttpOnly cookie / Bearer token
           ▼
      Laravel API (apps/api)
           │
           ├── Auth middleware → role → admin.auth → Gate
           ├── Service layer (60+ classes)
           ├── Redis cache + queues (Horizon)
           ├── PostgreSQL (199 migrasi)
           ├── SIAKAD Master API (dengan circuit breaker)
           ├── AI (3-tier failover via SumoPod)
           └── Sentry + Telegram alerts
```

## Fase KKN

Sistem mengunci akses fitur berdasarkan fase periode aktif (middleware `phase:...`):

1. `upcoming` — pra-pendaftaran
2. `registration` — masa pendaftaran
3. `placement` — seleksi & plotting kelompok
4. `execution` — pelaksanaan KKN (laporan harian aktif)
5. `grading` — masa penilaian
6. `finished` — KKN selesai

Admin & superadmin bypass pengecekan fase. Lainnya terkunci sesuai daftar fase yang diizinkan per route.
