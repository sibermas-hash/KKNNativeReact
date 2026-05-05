# SIBERMAS — Panduan Instalasi & Pengembangan

**Sistem Informasi KKN UIN Prof. K.H. Saifuddin Zuhri Purwokerto**

---

## Prasyarat

| Tool | Versi |
|---|---|
| PHP | 8.4+ |
| Composer | 2.x |
| Node.js | 20+ |
| pnpm | 9+ |
| PostgreSQL | 16 |
| Redis | 7 (opsional, untuk production) |

---

## Struktur Monorepo

```
kknuinsaizu/
├── apps/
│   ├── api/        # Laravel 13 — Backend JSON API
│   ├── web/        # Next.js 15 — Frontend SPA
│   └── mobile/     # Expo + React Native — Android App
├── packages/
│   ├── api-client/     # Axios client + endpoint definitions
│   ├── schemas/        # Zod validation schemas
│   ├── shared-types/   # TypeScript type definitions
│   ├── hooks/          # React hooks bersama
│   └── constants/      # Konstanta bersama (QUERY_KEYS, dll)
└── turbo.json          # Turborepo build orchestration
```

---

## Instalasi

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd kknuinsaizu

# Install semua dependencies (monorepo)
pnpm install
```

### 2. Setup Backend (apps/api)

```bash
cd apps/api

# Copy environment
cp .env.example .env

# Generate app key
php artisan key:generate

# Jalankan migrasi + seeder
php artisan migrate --seed

# Build assets (Vite)
npm run build
```

### 3. Setup Frontend (apps/web)

```bash
cd apps/web

# Copy environment
cp .env.local.example .env.local
# Edit NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Menjalankan Lokal

```bash
# Terminal 1 — Backend
cd apps/api && php artisan serve

# Terminal 2 — Frontend
cd apps/web && pnpm dev

# Terminal 3 — Queue Worker (opsional)
cd apps/api && php artisan queue:work
```

Akses: `http://localhost:3000`

---

## Konfigurasi .env Penting

### Backend (`apps/api/.env`)

```env
APP_URL=http://localhost:8000

# Database
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=kkn
DB_USERNAME=your_username
DB_PASSWORD=your_password

# SIAKAD API (token dari Administrator SIAKAD)
MASTER_API_URL=https://api.uinsaizu.ac.id
MASTER_API_TOKEN=your_token_here

# Email (SMTP Gmail)
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password   # Google App Password, bukan password biasa
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=kkn@uinsaizu.ac.id

# AI (opsional, bisa diset via Admin Panel)
GEMINI_API_KEY=your_key
```

### Frontend (`apps/web/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## Akun Default (Setelah Seeder)

| Role | Username | Password |
|---|---|---|
| Superadmin | `superadmin` | `Admin@KKN2026!` |
| Admin | `admin` | `Admin@KKN2026!` |
| DPL | `dpl001` | `Admin@KKN2026!` |
| Mahasiswa | `20123456` | tanggal lahir (format: `ddmmyyyy`) |

> Password default wajib diganti saat login pertama.

---

## Perintah Berguna

```bash
# Backend
php artisan migrate:fresh --seed    # Reset database
php artisan test                    # Jalankan tests
php artisan route:list              # Lihat semua routes
php artisan config:cache            # Cache config (production)
php artisan route:cache             # Cache routes (production)
./vendor/bin/pint                   # Format kode PHP

# Frontend
pnpm --filter web dev               # Dev server
pnpm --filter web build             # Build production
pnpm --filter web lint              # Lint

# Monorepo
pnpm build                          # Build semua packages
pnpm lint                           # Lint semua
```

---

## Sinkronisasi Data SIAKAD

```bash
# Full sync (pertama kali)
php artisan master:sync --type=all

# Delta sync (harian, hanya data baru/berubah)
php artisan master:sync --type=mahasiswa --since=2026-05-01T00:00:00Z
php artisan master:sync --type=dosen --since=2026-05-01T00:00:00Z
```

> Jika muncul error 403 Forbidden dari SIAKAD, minta whitelist IP server ke Administrator Jaringan Kampus (diblokir Cloudflare).

---

## Mobile App (Android)

```bash
cd apps/mobile

# Install dependencies
pnpm install

# Sync ke Android
npx cap sync android

# Buka di Android Studio
npx cap open android
```

---

## Troubleshooting

**`Route [login] not defined`** — Pastikan `php artisan config:clear` sudah dijalankan.

**`403 Forbidden` dari SIAKAD API** — IP server belum di-whitelist Cloudflare. Hubungi Admin Jaringan.

**Frontend tidak bisa connect ke API** — Cek `NEXT_PUBLIC_API_URL` di `.env.local` dan pastikan backend berjalan di port yang benar.

**Queue tidak berjalan** — Jalankan `php artisan queue:work` atau setup Supervisor untuk production.
