# Post-Deploy Fix Notes — 2026-05-11

Tiga masalah yang dilaporkan dari production FreeBSD sudah di-fix. Dokumen
ini menjelaskan apa yang berubah dan langkah re-deploy.

## Ringkasan

| # | Masalah | Status | File yang berubah |
|---|---|---|---|
| 1 | `config:cache` gagal serialize (scribe + sentry closure) | ✅ Fixed | `config/scribe.php`, `config/sentry.php`, `app/Sentry/BeforeSendScrub.php` |
| 2 | Next.js standalone "Cannot find module" di FreeBSD | ✅ Mitigated | `.npmrc` (new), `apps/web/next.config.ts` |
| 3 | CORS guard error message terlalu ringkas | ✅ Improved | `apps/api/app/Providers/AppServiceProvider.php` |

---

## Fix #1 — Closure di file `config/` (non-serializable)

### Problem
```
LogicException: Your configuration files could not be serialized because
the value at "scribe.filename_modifier" is non-serializable.
```

Setelah scribe di-fix, muncul masalah sama di `sentry.before_send`.

### Root cause
Laravel men-cache config via `var_export()` yang **tidak bisa** merepresentasikan
closure/anonymous function. Semua file di `config/` HARUS data statis
(array/string/int/bool/null/class-string).

### Yang diubah

**`apps/api/config/scribe.php`**:
```php
// Sebelum
'filename_modifier' => function (string $filename) {
    return str_replace(' ', '-', strtolower($filename));
},

// Sesudah
'filename_modifier' => null,  // pakai default Scribe
```

**`apps/api/config/sentry.php`**: closure `before_send` dipindah ke class
invokable.

**`apps/api/app/Sentry/BeforeSendScrub.php`** (baru): class dengan `__invoke()`
yang melakukan:
- Drop health-check events (/health, /ready, /up) → return null
- Scrub PII dari body/query/cookies/headers (password, token, nik, nim,
  authorization, cookie, captcha_answer, dll)

```php
// config/sentry.php
'before_send' => \App\Sentry\BeforeSendScrub::class,  // class-string OK di-serialize
```

### Test regresi
- `tests/Feature/Services/SentryBeforeSendScrubTest.php` (8 test):
  - drop health check → null
  - scrub sensitive keys
  - recursive scrub nested arrays
  - `php artisan config:cache` exit 0

### Verifikasi di production

```bash
cd apps/api
php artisan config:clear
php artisan config:cache
# → INFO  Configuration cached successfully.
```

---

## Fix #2 — Next.js standalone `Cannot find module '../../lib/get-network-host'`

### Problem
Deploy FreeBSD + standalone build meledak dengan:
```
Error: Cannot find module '../../lib/get-network-host'
```

### Root cause
pnpm default memakai `node-linker=isolated` — dependency di-symlink dari
`node_modules/.pnpm/<pkg>@<ver>/`. Next.js standalone tracer tidak selalu
ikut meng-copy file **di luar dependency yang di-import eksplisit**, terutama
untuk internal module lookup via `require('../../lib/...')` di runtime
code.

Pada monorepo pnpm, ini lebih parah karena symlink bertumpuk lintas workspace.

### Yang diubah

**`.npmrc`** (file baru, di root repo):
```ini
node-linker=hoisted
link-workspace-packages=true
public-hoist-pattern[]=*react*
public-hoist-pattern[]=*next*
public-hoist-pattern[]=*typescript*
public-hoist-pattern[]=@types/*
```

Memaksa pnpm membuat `node_modules` datar (flat) seperti npm/yarn classic.
Ini meng-eliminasi symlink resolution ambiguity saat Next.js tracer walk
dependency graph.

**`apps/web/next.config.ts`**:
```ts
experimental: {
  externalDir: true,   // izinkan resolve ke packages/* di monorepo
  optimizePackageImports: [...],
}
```

Tambahan safety net — memberitahu Next.js bahwa `apps/web` punya source di
luar direktorinya (workspace packages di `packages/*`).

### Re-deploy langkah-langkah

```bash
# 1. Pull code baru
cd /usr/local/www/sibermas
git pull

# 2. BUSANG DULU node_modules existing (karena struktur pnpm berubah)
rm -rf node_modules apps/*/node_modules packages/*/node_modules

# 3. Reinstall — kini pakai .npmrc baru (node-linker=hoisted)
pnpm install --frozen-lockfile

# 4. Rebuild frontend
pnpm --filter web build

# 5. Restart process
sudo supervisorctl restart sibermas-web

# 6. Verifikasi — tail log jangan ada "Cannot find module"
tail -f /var/log/sibermas/web.log
```

### Fallback kalau masih gagal

Kalau environment FreeBSD masih error meski `.npmrc` sudah dipasang, **drop
mode standalone** dan jalankan Next.js dengan `pnpm start`:

Edit `apps/web/next.config.ts`:
```ts
// output: 'standalone',   // disable
```

Edit `apps/api/supervisord.conf`:
```ini
[program:sibermas-web]
command=/usr/local/bin/pnpm --filter web start
directory=/usr/local/www/sibermas
environment=NODE_ENV="production",PORT="3000",HOSTNAME="127.0.0.1"
```

Trade-off: boot time sedikit lebih lama (~2 detik) dan butuh `pnpm` di PATH
runtime, tapi modul resolution pakai loader Node.js standar (lebih tahan
banting vs standalone copy).

---

## Fix #3 — CORS boot guard error message

### Problem
Aplikasi throw `RuntimeException` saat production boot kalau
`CORS_ALLOWED_ORIGINS` mengandung `localhost` atau `127.0.0.1` bersama
`supports_credentials=true`.

Ini **sesuai desain** (lihat finding H-011), tapi pesan error awal kurang
jelas — operator deployer kadang bingung kenapa aplikasi tidak mau boot.

### Yang diubah

**`apps/api/app/Providers/AppServiceProvider.php::assertSafeCorsInProduction`**:

- Regex detection sekarang menangkap **semua variasi port** (bukan hanya
  `:3000`, `:8000`). Termasuk `http://localhost:4200`, `0.0.0.0`, `[::1]`.
- Pesan error lebih informatif: menampilkan seluruh `CORS_ALLOWED_ORIGINS`
  yang terbaca + contoh config yang benar.

Contoh pesan error sekarang:
```
Unsafe CORS configuration detected in production.
Forbidden origin(s) found with supports_credentials=true: [http://localhost:3000].
Origins saat ini: [https://sibermas.uinsaizu.ac.id, http://localhost:3000].
Set CORS_ALLOWED_ORIGINS di .env.production hanya ke host publik, contohnya:
"https://sibermas.uinsaizu.ac.id,https://api.sibermas.uinsaizu.ac.id".
Jangan sertakan origin development (localhost, 127.0.0.1) di production
saat supports_credentials=true — ini mencegah kebocoran cookie sesi ke
origin dev.
```

### Action item untuk operator

Edit `.env` production:
```bash
# ❌ SALAH — akan gagal boot
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://sibermas.uinsaizu.ac.id

# ✅ BENAR — hanya origin publik
CORS_ALLOWED_ORIGINS=https://sibermas.uinsaizu.ac.id,https://api.sibermas.uinsaizu.ac.id
```

Restart backend setelah update:
```bash
sudo supervisorctl restart sibermas-horizon sibermas-worker-default \
  sibermas-worker-low sibermas-worker-long
```

---

## Checklist Re-deploy

Setelah pull code ini, operator WAJIB:

- [ ] `rm -rf node_modules apps/*/node_modules packages/*/node_modules`
- [ ] `pnpm install --frozen-lockfile` (pakai `.npmrc` baru)
- [ ] `pnpm --filter web build` (Next standalone dengan externalDir)
- [ ] `cd apps/api && composer install --no-dev --optimize-autoloader`
- [ ] `php artisan config:clear && php artisan config:cache` — **harus lolos**
- [ ] `php artisan route:cache` — cek 0 error
- [ ] Edit `.env` — pastikan `CORS_ALLOWED_ORIGINS` hanya host publik
- [ ] `sudo supervisorctl restart all` (semua program)
- [ ] `curl -sSf https://api.sibermas.uinsaizu.ac.id/api/health` — harus 200
- [ ] `curl -sSf https://sibermas.uinsaizu.ac.id/` — harus 200 dengan Next.js
- [ ] Tail `/var/log/sibermas/*.log` — tidak ada error fatal dalam 5 menit

## Test Coverage

| Area | File | Tests |
|---|---|---|
| Sentry scrub + config:cache regression | `tests/Feature/Services/SentryBeforeSendScrubTest.php` | 8 |

Full suite: **521/521 passed** (1247 assertions), durasi 52s.
