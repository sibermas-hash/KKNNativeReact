# Frontend Documentation — KKN UIN SAIZU (apps/web)

> Next.js 15 App Router · React 19 · TypeScript · Tailwind CSS 4

---

## 1. Tech Stack & Dependencies

### Core Framework
| Package | Version | Keterangan |
|---|---|---|
| `next` | ^15.3.4 | App Router, standalone output |
| `react` / `react-dom` | ^19.1.0 | React 19 |
| `typescript` | ^5.8.0 | Strict typing |
| `tailwindcss` | ^4.1.0 | Utility-first CSS |

### State & Data Fetching
| Package | Keterangan |
|---|---|
| `zustand` ^5 | Global state (auth, period) |
| `@tanstack/react-query` ^5 | Server state, caching, mutations |
| `axios` ^1.9 | HTTP client (dipakai oleh `@sibermas/api-client`) |

### UI & Animasi
| Package | Keterangan |
|---|---|
| `@radix-ui/*` | Headless UI primitives (accordion, dialog, select, dll.) |
| `framer-motion` ^11 | Animasi deklaratif |
| `gsap` + `@gsap/react` ^3.12 | Animasi kompleks / scroll |
| `lenis` ^1.1 | Smooth scroll |
| `lucide-react` ^0.487 | Icon set |
| `sonner` ^2 | Toast notifications |
| `recharts` ^3.8 | Chart/grafik |
| `cmdk` ^1.1 | Command palette |

### Form & Validasi
| Package | Keterangan |
|---|---|
| `react-hook-form` ^7.55 | Form state management |
| `@hookform/resolvers` ^5 | Integrasi Zod dengan RHF |
| `zod` ^3.24 | Schema validation |

### Workspace Packages (`@sibermas/*`)
| Package | Keterangan |
|---|---|
| `@sibermas/api-client` | Axios client + semua endpoint definitions |
| `@sibermas/shared-types` | TypeScript types (User, Period, dll.) |
| `@sibermas/schemas` | Zod schemas bersama |
| `@sibermas/hooks` | Custom hooks bersama |
| `@sibermas/constants` | Konstanta bersama |

### Lainnya
- `@sentry/nextjs` — error monitoring
- `isomorphic-dompurify` — sanitasi HTML (SSR-safe)
- `date-fns` — manipulasi tanggal
- `class-variance-authority` + `clsx` + `tailwind-merge` — class utilities

---

## 2. Struktur Direktori

```
apps/web/
├── next.config.ts
├── package.json
└── src/
    ├── app/                    # Next.js App Router
    │   ├── layout.tsx          # Root layout
    │   ├── page.tsx            # Landing page (/)
    │   ├── globals.css         # Global styles
    │   ├── loading.tsx         # Root loading UI
    │   ├── error.tsx           # Root error boundary
    │   ├── not-found.tsx       # 404 page
    │   ├── (auth)/             # Route group: halaman autentikasi
    │   ├── (admin)/            # Route group: dashboard admin
    │   ├── (dosen)/            # Route group: dashboard dosen/DPL
    │   ├── (student)/          # Route group: dashboard mahasiswa
    │   ├── berita/             # Halaman publik berita
    │   ├── lokasi/             # Halaman publik lokasi KKN
    │   ├── unduhan/            # Halaman publik unduhan
    │   ├── verify-certificate/ # Verifikasi sertifikat publik
    │   └── phase-blocked/      # Halaman blokir fase KKN
    ├── components/
    │   ├── ui/                 # Komponen UI generik
    │   ├── public/             # Komponen halaman publik
    │   └── providers/          # Provider komponen (smooth scroll)
    ├── lib/
    │   ├── api.ts              # API client singleton
    │   ├── server-api.ts       # API client untuk Server Components
    │   ├── student-api.ts      # Helper API khusus mahasiswa
    │   └── sanitize.ts         # HTML sanitization helper
    ├── stores/
    │   └── index.ts            # Zustand stores (auth + period)
    ├── providers/
    │   └── index.tsx           # Root Providers component
    └── types/
        └── dompurify.d.ts      # Type declaration tambahan
```

---

## 3. Route Groups & Layouts

### Route Groups

Next.js App Router menggunakan folder `(nama)` sebagai route group — folder ini **tidak masuk ke URL**.

| Group | URL Prefix | Layout | Akses |
|---|---|---|---|
| `(auth)` | `/login`, `/lupa-kata-sandi`, dll. | Tidak ada layout khusus | Publik (redirect jika sudah login) |
| `(admin)` | `/admin/*` | `(admin)/layout.tsx` | Role: superadmin, admin, faculty_admin |
| `(dosen)` | `/dosen/*` | `(dosen)/layout.tsx` | Role: dosen/DPL |
| `(student)` | `/mahasiswa/*`, `/profil` | `(student)/layout.tsx` | Role: mahasiswa |

### Halaman Publik (tanpa route group)

| Path | Keterangan |
|---|---|
| `/` | Landing page |
| `/berita` | Daftar berita |
| `/berita/[slug]` | Detail berita |
| `/lokasi` | Peta lokasi KKN |
| `/unduhan` | File unduhan publik |
| `/verify-certificate/[token]` | Verifikasi sertifikat |
| `/phase-blocked` | Halaman blokir fase |

### Halaman Auth

| Path | Keterangan |
|---|---|
| `/login` | Login dengan NIM/email + password |
| `/lupa-kata-sandi` | Request reset password |
| `/atur-ulang-kata-sandi` | Reset password via token |
| `/ganti-password` | Ganti password (wajib setelah login pertama) |

### Halaman Admin (`/admin/*`)

| Path | Keterangan |
|---|---|
| `/admin` | Dashboard utama admin |
| `/admin/mahasiswa` | Manajemen data mahasiswa |
| `/admin/dosen` | Manajemen data dosen |
| `/admin/pengguna` | Manajemen akun pengguna |
| `/admin/kelompok` | Manajemen kelompok KKN |
| `/admin/periode` | Manajemen periode KKN |
| `/admin/tahun-akademik` | Manajemen tahun akademik |
| `/admin/jenis-kkn` | Jenis/tipe KKN |
| `/admin/pendaftaran` | Manajemen pendaftaran |
| `/admin/laporan` | Laporan kegiatan |
| `/admin/nilai` | Manajemen nilai |
| `/admin/evaluasi` | Evaluasi peserta |
| `/admin/evaluasi-dpl` | Evaluasi DPL |
| `/admin/lokasi` | Manajemen lokasi |
| `/admin/fakultas` | Manajemen fakultas |
| `/admin/prodi` | Manajemen program studi |
| `/admin/akademik` | Data akademik |
| `/admin/workshops` | Manajemen workshop |
| `/admin/dispensasi` | Manajemen dispensasi |
| `/admin/yudisium` | Yudisium |
| `/admin/rekapitulasi` | Rekapitulasi data |
| `/admin/audit-log` | Log audit sistem |
| `/admin/audit-kualifikasi` | Audit kualifikasi peserta |
| `/admin/generator-nilai` | Generator nilai otomatis |
| `/admin/database-sync` | Sinkronisasi database SIAKAD |
| `/admin/konten-publik` | Manajemen konten publik |
| `/admin/warta-utama` | Warta/berita utama |
| `/admin/unduhan` | Manajemen file unduhan |
| `/admin/pengaturan` | Pengaturan sistem |
| `/admin/profile-change-requests` | Permintaan ubah profil |
| `/admin/peserta` | Data peserta KKN |

### Halaman Dosen (`/dosen/*`)

| Path | Keterangan |
|---|---|
| `/dosen` | Dashboard dosen |
| `/dosen/beranda-dpl` | Beranda DPL |
| `/dosen/kelompok` | Kelompok binaan |
| `/dosen/monitoring` | Monitoring kegiatan |
| `/dosen/laporan-harian` | Review laporan harian |
| `/dosen/laporan-akhir` | Review laporan akhir |
| `/dosen/evaluasi` | Evaluasi mahasiswa |
| `/dosen/izin` | Manajemen izin |
| `/dosen/umpan-balik-peserta` | Umpan balik peserta |
| `/dosen/workshops` | Workshop |
| `/dosen/daftar-dpl` | Daftar DPL |

### Halaman Mahasiswa (`/mahasiswa/*`)

| Path | Keterangan |
|---|---|
| `/mahasiswa` | Dashboard mahasiswa |
| `/mahasiswa/pendaftaran` | Pendaftaran KKN |
| `/mahasiswa/cek-pendaftaran` | Cek status pendaftaran |
| `/mahasiswa/laporan-harian` | Input laporan harian |
| `/mahasiswa/program-kerja` | Program kerja |
| `/mahasiswa/laporan-akhir` | Laporan akhir |
| `/mahasiswa/evaluasi` | Evaluasi diri |
| `/mahasiswa/evaluasi-dpl` | Evaluasi DPL |
| `/mahasiswa/izin` | Pengajuan izin |
| `/mahasiswa/domisili` | Data domisili |
| `/mahasiswa/posko` | Info posko |
| `/mahasiswa/rekapitulasi` | Rekapitulasi kehadiran |
| `/mahasiswa/sertifikat` | Sertifikat KKN |
| `/mahasiswa/poster` | Poster kegiatan |
| `/profil` | Profil pengguna |

---

## 4. Auth Flow

### Gambaran Umum

```
Browser Request
      │
      ▼
middleware.ts  ──── cek cookie sibermas_token
      │
      ├─ Tidak ada token + route protected → redirect /login?redirect=<path>
      │
      ├─ Ada token + pwdChanged=0 + bukan public/allowed → redirect /ganti-password
      │
      ├─ Ada token + halaman auth → redirect /
      │
      └─ Lanjut → NextResponse.next()
                        │
                        ▼
              Providers (client-side)
                        │
                        ├─ initAuthToken() → baca cookie, set axios header
                        ├─ useAuthStore.fetchUser() → GET /api/v1/auth/user
                        └─ usePeriodStore.fetchPeriodContext() → GET /api/v1/period-context
```

### Cookie

| Cookie | Nilai | Keterangan |
|---|---|---|
| `sibermas_token` | JWT string | Token autentikasi, 7 hari, SameSite=Strict |
| `sibermas_pwd_changed` | `"0"` atau `"1"` | Flag apakah password sudah pernah diganti |

Cookie di-set dari client-side via `setAuthToken()` dan `setPasswordChangedCookie()` di `stores/index.ts`.

### Alur Login

1. User submit form di `/login`
2. `authApi.login()` → POST ke backend → dapat `token` + data user
3. `setAuthToken(token)` → tulis cookie `sibermas_token` + set `axios.defaults.headers`
4. `setPasswordChangedCookie(user.password_changed_at)` → tulis cookie `sibermas_pwd_changed`
5. Redirect ke dashboard sesuai role

### Alur Logout

1. Event `auth:logout` di-dispatch (bisa dari interceptor axios saat 401)
2. `useAuthStore.clearUser()` → hapus cookie, hapus axios header, reset state
3. Redirect ke `/login`

### Custom Events (window)

| Event | Trigger | Handler |
|---|---|---|
| `auth:logout` | Token expired / 401 | Hapus session, redirect login |
| `auth:require_password_change` | `password_changed_at` null | Redirect `/ganti-password` |
| `auth:profile_incomplete` | `must_change_password` true | Redirect `/profil` |

---

## 5. State Management (Zustand)

Semua store ada di `src/stores/index.ts`.

### `useAuthStore`

```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasFetched: boolean;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  fetchUser: () => Promise<void>;
}
```

- `fetchUser()` hanya berjalan sekali (guard `hasFetched`)
- Dipanggil di `Providers` saat ada cookie token
- Setelah fetch, men-dispatch custom event jika perlu ganti password

### `usePeriodStore`

```typescript
interface PeriodState {
  activePeriod: Period | null;
  availablePeriods: Period[];
  currentPhase: string;       // 'upcoming' | 'registration' | 'active' | 'ended'
  isLoading: boolean;
  hasFetched: boolean;
  fetchPeriodContext: () => Promise<void>;
}
```

- Menyimpan periode KKN aktif dan fase saat ini
- Digunakan layout-layout role untuk menampilkan info periode

### Helper Functions (diekspor dari stores)

```typescript
setAuthToken(token: string | null)       // tulis/hapus cookie + axios header
setPasswordChangedCookie(value: string | null)  // tulis cookie sibermas_pwd_changed
initAuthToken()                          // baca cookie saat init, set axios header
```

---

## 6. API Client

### Inisialisasi (`src/lib/api.ts`)

```typescript
import { createWebClient, authEndpoints, studentEndpoints, ... } from '@sibermas/api-client';

export const api = createWebClient(process.env.NEXT_PUBLIC_API_URL);

// Singleton instances — gunakan ini di komponen/hooks
export const authApi = authEndpoints(api);
export const studentApi = studentEndpoints(api);
export const adminApi = adminEndpoints(api);
export const dplApi = dplEndpoints(api);
export const dosenApi = dosenEndpoints(api);
export const profileApi = profileEndpoints(api);
export const publicApi = publicEndpoints(api);
export const periodContextApi = periodContextEndpoints(api);
export const notificationsApi = notificationsEndpoints(api);
```

### Penggunaan di Komponen

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';

// Query
const { data, isLoading } = useQuery({
  queryKey: ['laporan-harian'],
  queryFn: () => studentApi.getLaporanHarian(),
});

// Mutation
const mutation = useMutation({
  mutationFn: (payload) => studentApi.createLaporan(payload),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['laporan-harian'] }),
});
```

### Server Components (`src/lib/server-api.ts`)

Untuk Server Components yang perlu fetch data di server, gunakan `server-api.ts` yang membaca token dari cookies server-side.

### API Proxy (Next.js Rewrites)

Request ke `/api/*` di-rewrite ke `NEXT_PUBLIC_API_URL/*` via `next.config.ts`:

```typescript
rewrites: [{ source: '/api/:path*', destination: `${apiUrl}/:path*` }]
```

---

## 7. Komponen Shared

### `src/components/ui/`

| File | Keterangan |
|---|---|
| `shared.tsx` | Komponen UI generik: loading states, empty states, error cards, badge, dll. |
| `motion-effects.tsx` | Wrapper animasi Framer Motion: FadeIn, SlideUp, StaggerChildren, dll. |
| `command-palette.tsx` | Command palette global (cmdk) untuk navigasi cepat |
| `particle-background.tsx` | Background animasi partikel (canvas/GSAP) |

### `src/components/public/`

| File | Keterangan |
|---|---|
| `navbar.tsx` | Navigasi bar halaman publik |
| `footer.tsx` | Footer halaman publik |
| `home-content.tsx` | Konten utama landing page |
| `hero-title.tsx` | Animasi judul hero section |
| `showcase-3d.tsx` | Showcase 3D effect |
| `lazy.tsx` | Lazy-load wrapper untuk komponen berat |

### `src/components/providers/`

| File | Keterangan |
|---|---|
| `smooth-scroll.tsx` | Provider Lenis smooth scroll |

### Radix UI Primitives

Komponen Radix UI digunakan langsung dari package (tidak di-wrap ulang di folder `components/ui/`). Import langsung dari `@radix-ui/react-*`.

---

## 8. Cara Menambah Halaman Baru

### Halaman Publik

1. Buat folder di `src/app/<nama-halaman>/`
2. Buat `page.tsx` (Server Component by default)
3. Tambahkan `loading.tsx` dan `error.tsx` jika perlu
4. Tidak perlu update middleware (publik tidak diproteksi)

```
src/app/pengumuman/
├── page.tsx
├── loading.tsx
└── error.tsx
```

### Halaman Terproteksi (contoh: halaman mahasiswa baru)

1. Buat folder di route group yang sesuai:
   - Admin → `src/app/(admin)/admin/<nama>/`
   - Dosen → `src/app/(dosen)/dosen/<nama>/`
   - Mahasiswa → `src/app/(student)/mahasiswa/<nama>/`

2. Buat `page.tsx`:

```typescript
// src/app/(student)/mahasiswa/nama-halaman/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { studentApi } from '@/lib/api';

export default function NamaHalamanPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['nama-halaman'],
    queryFn: () => studentApi.getSomething(),
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{/* konten */}</div>;
}
```

3. Middleware sudah otomatis memproteksi path `/mahasiswa/*`, `/admin/*`, `/dosen/*` — tidak perlu konfigurasi tambahan.

4. Tambahkan link navigasi di layout yang sesuai (`(student)/layout.tsx`, dll.).

### Halaman dengan Dynamic Route

```
src/app/(admin)/admin/kelompok/[id]/
└── page.tsx   # params.id tersedia
```

```typescript
export default function KelompokDetailPage({ params }: { params: { id: string } }) {
  // gunakan params.id
}
```

---

## 9. Environment Variables

Buat file `.env.local` di `apps/web/`:

```env
# URL API backend Laravel (wajib)
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

# Sentry (opsional, untuk error monitoring)
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

### Catatan

- Variabel dengan prefix `NEXT_PUBLIC_` tersedia di client-side (browser).
- Variabel tanpa prefix hanya tersedia di server-side (Server Components, API routes, `next.config.ts`).
- `NEXT_PUBLIC_API_URL` digunakan oleh `src/lib/api.ts` untuk menentukan base URL axios client.
- Jika `NEXT_PUBLIC_API_URL` tidak di-set, fallback ke `http://localhost:8000/api/v1`.

### Konfigurasi Next.js Terkait

`next.config.ts` mengatur:
- `output: 'standalone'` — untuk deployment Docker/server
- `transpilePackages` — workspace packages `@sibermas/*` di-transpile oleh Next.js
- Security headers otomatis di semua route (`X-Frame-Options`, `X-Content-Type-Options`, dll.)
- Cache headers untuk static assets (`/_next/static/*` → immutable 1 tahun)
- Image optimization: format AVIF + WebP, TTL 1 jam

---

## Ringkasan Arsitektur

```
Browser
  │
  ├─ middleware.ts          ← cek cookie, proteksi route, password lock
  │
  ├─ app/layout.tsx         ← root layout, mount <Providers>
  │     └─ Providers        ← QueryClient + Tooltip + SmoothScroll + Toaster
  │           └─ initAuthToken() + fetchUser() + fetchPeriodContext()
  │
  ├─ Route Groups
  │     ├─ (auth)           ← halaman login/reset password
  │     ├─ (admin)          ← dashboard admin dengan sidebar
  │     ├─ (dosen)          ← dashboard dosen/DPL
  │     └─ (student)        ← dashboard mahasiswa
  │
  ├─ Zustand Stores         ← useAuthStore, usePeriodStore
  │
  └─ API Client             ← @sibermas/api-client via axios
        └─ authApi, studentApi, adminApi, dplApi, dosenApi, ...
```
