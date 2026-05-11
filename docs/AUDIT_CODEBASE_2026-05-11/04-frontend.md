# 04 — Frontend (Next.js 15)

## Overview

- **Framework**: Next.js 15.3 dengan App Router
- **React**: 19.1 (concurrent features aktif, `suppressHydrationWarning` di root)
- **TypeScript**: 5.8
- **Styling**: Tailwind CSS 4 + Radix UI primitives + tailwind-variants
- **Build**: `output: 'standalone'` untuk deployment ke Node standalone server

## Struktur Direktori

```
apps/web/src/
├── __tests__/smoke.test.tsx     # Hanya 1 test file
├── middleware.ts                 # Edge middleware (auth gate)
├── app/
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── error.tsx, not-found.tsx, loading.tsx
│   ├── globals.css
│   ├── (admin)/
│   │   ├── layout.tsx, error.tsx
│   │   └── admin/               # 43 route groups
│   ├── (dosen)/
│   │   └── dosen/               # 13 route groups
│   ├── (student)/
│   │   ├── mahasiswa/           # 17 route groups
│   │   └── profil/
│   ├── (auth)/
│   │   ├── login/{page, 2fa/page}
│   │   ├── lupa-kata-sandi
│   │   ├── atur-ulang-kata-sandi
│   │   └── ganti-password
│   ├── api/
│   │   └── clear-session/       # Next.js route handler (cookie clear util)
│   ├── berita/[slug]
│   ├── lokasi
│   ├── unduhan
│   ├── support
│   ├── verify-certificate/[token]
│   ├── notifikasi
│   └── phase-blocked
├── components/
│   ├── public/                  # Landing, hero, footer, navbar
│   ├── profile/                 # 2FA card, address map picker, notification prefs
│   ├── admin/                   # Stats widget
│   ├── ui/                      # Shared — command palette, notification bell, etc.
│   └── providers/
├── lib/
│   ├── api.ts                   # Client (axios wrapper dari @sibermas/api-client)
│   ├── server-api.ts            # Server-side fetch helpers
│   ├── sanitize.ts              # isomorphic-dompurify wrapper
│   ├── notify.ts                # Toast
│   ├── theme-config.ts
│   └── utils.ts
├── providers/
├── stores/                      # Zustand
└── types/
```

## Edge Middleware (`middleware.ts`)

Audit fix **C-004** menghapus semua cookie-based authorization client-side. Middleware sekarang:

1. Check presence `sibermas_token` (HttpOnly cookie) untuk path protected: `/admin`, `/mahasiswa`, `/dosen`, `/profil`, `/ganti-password`, `/notifikasi`.
2. Jika tidak ada token + path protected → redirect `/login?redirect=<path>`.
3. Jika ada token + di auth page → redirect ke `/`.

**Tidak** ada role check di edge — fully delegated ke Laravel backend. Backend mengembalikan `UNAUTHORIZED` / `FORBIDDEN` / `PASSWORD_CHANGE_REQUIRED` / `PROFILE_INCOMPLETE` envelope, client side react accordingly.

## Content Security Policy

Dikonfigurasi di `next.config.ts` via `headers()`:

```
default-src 'self'
script-src 'self' 'unsafe-inline' ['unsafe-eval' di dev]
style-src 'self' 'unsafe-inline'
img-src 'self' data: blob: https:
font-src 'self' data:
connect-src 'self' <apiUrlOrigin> <sentryOrigin>
frame-ancestors 'none'
base-uri 'self'
form-action 'self'
object-src 'none'
```

**Mode**: enforcing (bukan report-only).

**Keterbatasan terdokumentasi**:
- `'unsafe-inline'` di script-src masih diperlukan untuk Next.js hydration bootstrap.
- `'unsafe-inline'` di style-src diperlukan framer-motion + sebagian Radix primitives.
- Migrasi ke nonce-based CSP tertulis sebagai future work.

## Cache Policy (next.config.ts `headers()`)

| Path | Cache-Control |
|---|---|
| `/_next/static/:path*` | `public, max-age=31536000, immutable` |
| `/_next/static/media/:path*` | `public, max-age=31536000, immutable` |
| `/images/:path*` | `public, max-age=86400, stale-while-revalidate=604800` |

Security headers diaktifkan global:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-DNS-Prefetch-Control: on`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

## API Client

### `lib/api.ts` (client-side)
```typescript
import { createWebClient, authEndpoints, studentEndpoints, ... } from '@sibermas/api-client';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const api = createWebClient(getBaseUrl());
export const authApi = authEndpoints(api);
export const studentApi = studentEndpoints(api);
// ... singleton instance per role
```

### `lib/server-api.ts` (server-side RSC)
- `fetchApi<T>(path)` — unauthenticated, `{next: {revalidate: 60}}` cache.
- `fetchApiAuth<T>(path)` — forward `sibermas_token` cookie sebagai Bearer, `{cache: 'no-store'}`.
- Guard `NEXT_PHASE === 'phase-production-build'` → return null (prevent build-time API calls).

### Rewrite Proxy
`next.config.ts` `rewrites()`:
```js
{ source: '/api/clear-session', destination: '/api/clear-session' }  // Next.js internal
{ source: '/api/:path*', destination: `${apiUrl}/:path*` }            // Proxy ke Laravel
```

## Sanitization (`lib/sanitize.ts`)

`isomorphic-dompurify` dengan:
- Allowed tags: p, br, strong, em, u, s, a, ul, ol, li, h1–h6, blockquote, pre, code, img, figure, figcaption, table (full), div, span, hr.
- Allowed attrs: href, target, rel, src, alt, width, height.
- `ALLOW_DATA_ATTR: false`.
- afterSanitizeAttributes hook:
  - `<a target="_blank">` → force `rel="noopener noreferrer"` (FM-11).
  - Blokir protocol selain http/https/mailto/#/relative.
  - `<img src>` dengan `data:` / external → stripped (FH-03, pixel tracking).

## Sentry Integration

`sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`:
- DSN via `NEXT_PUBLIC_SENTRY_DSN`, no-op kalau kosong.
- `tracesSampleRate=0.1`, `replaysOnErrorSampleRate=1.0`.
- `beforeSend` strips `Cookie`, `Authorization` headers (R13-FE-007).
- `sendDefaultPii=false` di server.

## Komponen Notable

- `profile/two-factor-card.tsx` (11 KB) — setup/confirm/disable TOTP + recovery codes
- `profile/address-map-picker.tsx` (12 KB) — MapLibre integration untuk pick alamat lat/lng
- `profile/notification-preferences-card.tsx` — in_app/email/push toggle
- `ui/notification-bell.tsx` (14 KB) — bell dengan SSE `/notifications/stream`
- `ui/command-palette.tsx` — cmdk-based palette
- `admin/activity-stats-widget.tsx`

## Form Stack

- `react-hook-form@7.55` untuk form state
- `@hookform/resolvers@5` bridging ke Zod
- Schema definition di `@sibermas/schemas` package
- Shared types di `@sibermas/shared-types`

## Bundle Analysis

`@next/bundle-analyzer` aktif via `ANALYZE=true pnpm build`. `optimizePackageImports` di next.config untuk lucide-react, @tanstack/react-query, recharts, beberapa Radix.

## Testing

**Kritis undercovered** — hanya 1 file: `src/__tests__/smoke.test.tsx` yang hanya memverifikasi render heading + paragraph sederhana.

### Vitest Config
- Environment: jsdom
- Setup: `vitest.setup.ts`
- Coverage provider: v8
- No threshold enforced.

## Temuan Frontend

| ID | Severity | Temuan |
|---|---|---|
| M-NEW-001 | Medium | Test coverage nyaris 0 |
| M-NEW-008 | Medium | CSP masih `unsafe-inline` — roadmap nonce-based |
| M-NEW-009 | Medium | CSP enforcing tanpa report-only phase |
| L-NEW-003 | Low | `tsconfig.tsbuildinfo` (488 KB) sebaiknya di-gitignore |

## Rekomendasi

1. **Tambah test coverage untuk kritikal paths**:
   - Login flow (termasuk 2FA, forgot password, reset password)
   - Registrasi mahasiswa (form validation, document upload)
   - Input laporan harian (GPS mock, date validation)
   - Evaluasi DPL submission
   - Admin table filter + sort + pagination
   - Target: 30–40% line coverage dalam 6 minggu, gate di vitest.config.ts
2. **CSP nonce migration** — gunakan `headers()` middleware untuk inject nonce; hapus `'unsafe-inline'`.
3. **Report-only rollout** untuk CSP strict — jalankan paralel 1-2 minggu sebelum enforce.
4. **Bundle size budget** — set threshold di CI, fail PR kalau naik >10%.
5. **Hapus `.turbo/cache/` dan `.next/` dari git working tree**; pastikan ignore aktif.
