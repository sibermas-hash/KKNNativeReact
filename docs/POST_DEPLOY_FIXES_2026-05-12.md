# Post-Deploy Fix Notes — 2026-05-12

Tindak lanjut dari laporan production (Telegram bot diam, 403 di dashboard
admin baru, 503 dari Nginx saat sinkronisasi, IPK anomali dari SIAKAD, log
permission bentrok antara CLI vs FPM). Semua sudah di-fix di codebase;
dokumen ini berisi langkah re-deploy dan cara verifikasi.

## Ringkasan Perubahan

| # | Masalah Server | Status | Intervensi |
|---|---|---|---|
| 1 | Admin baru (`admineududsuper`) kena 403 di dashboard | ✅ Fixed | Whitelist endpoint profil + 2FA grace period |
| 2 | Error 503 saat sync ribuan mahasiswa | ✅ Fixed | `--chunk-size` + `--chunk-sleep-ms` di `sync:master-data` |
| 3 | Bot Telegram tidak kabar saat 403/503 | ✅ Working-as-designed | Penjelasan di bawah + alert IPK anomali |
| 4 | IPK anomali SIAKAD (7.6, 8.9, 9.0, 11.05) | ✅ Visible | Stats tracking + Telegram alert otomatis saat clamp ratio >1% |
| 5 | Log `Permission denied` antara www vs CLI | ✅ Fixed | `permission: 0664` di logging channel + `umask=002` di supervisor |
| 6 | JS `TypeError: Cannot read properties of undefined (reading 'call')` | ⚠️ Clean rebuild | Instruksi di bawah |
| 7 | Nginx `/_next/static/` belum langsung dari disk | ✅ Sudah ada di template | Pastikan config di server sudah render ulang |

---

## Fix #1 — Admin baru kena 403 di Dashboard

### Root cause
Middleware `EnforceTwoFactor` memblokir SEMUA endpoint kecuali 5 rute `2fa.*`
+ auth. Ketika admin baru login untuk pertama kali, request ke
`/api/v1/profile/*` dan `/api/v1/period-context` (yang dipanggil oleh layout
Next.js) dibalas 403. Halaman jadi blank karena provider gagal fetch user
context.

### Yang diubah

**`apps/api/app/Http/Middleware/EnforceTwoFactor.php`**:

1. Whitelist diperluas jadi 12 rute — mencakup profil (show/update/avatar/
   password/notification-preferences), period-context, dan 2FA lengkap. Ini
   memastikan halaman `/admin/pengaturan/keamanan` dan `/profil` tetap
   bisa dirender untuk user yang belum setup 2FA.

2. **Grace period** berbasis config — akun privileged yang baru di-create
   mendapat window N jam selama tidak ada endpoint yang diblokir sama
   sekali. Setiap request dalam grace window di-log `warning` supaya tim
   ops tetap visible.

3. Response 403 sekarang menyertakan `setup_url: "/admin/pengaturan/keamanan"`
   supaya frontend bisa redirect otomatis.

**`apps/api/config/auth.php`** + **`.env.example`** + **`.env.production.example`**:

```
# .env — strict steady state
AUTH_2FA_GRACE_HOURS=0

# .env.production — recommended for first launch
AUTH_2FA_GRACE_HOURS=24
```

### Action item operator

1. Tambah `AUTH_2FA_GRACE_HOURS=24` ke `.env` production **sebelum**
   re-deploy. Setelah 1 minggu operasional (semua admin sudah enroll 2FA),
   ubah ke `0`.
2. `php artisan config:cache` — wajib, karena nilai env dibaca dari cache.
3. Minta admin baru login ulang. Mereka harusnya langsung sampai ke
   dashboard, lalu klik menu Profil → Keamanan untuk scan QR.

### Test manual

```bash
# Simulasi admin baru
php artisan tinker
>>> $u = User::where('username', 'admineududsuper')->first();
>>> $u->two_factor_secret; // null
>>> $u->hasTwoFactorEnabled(); // false
>>> $u->requiresTwoFactor(); // true
>>> config('auth.two_factor.grace_period_hours'); // 24
>>> $u->created_at->addHours(24)->isFuture(); // true → grace aktif
```

Request dari client (pakai Sanctum cookie):

```bash
curl -b cookies.txt https://sibermas.uinsaizu.ac.id/api/v1/profile
# Harus 200, bukan 403
```

---

## Fix #2 — 503 saat sync 12k+ mahasiswa

### Root cause
Sync SIAKAD mass processing (yield generator + transaction per row + PII
encryption HMAC per field) saturasi CPU 2-4 core. PHP-FPM kehabisan worker,
Node merespon lambat, Nginx upstream timeout → balas 503 untuk file `.js`
Next.js.

### Yang diubah

**`apps/api/app/Console/Commands/SyncMasterData.php`**:

Dua option baru di signature:

```
--chunk-size=200       Jumlah record per chunk sebelum sleep
--chunk-sleep-ms=0     Milliseconds jeda antar chunk
```

Implementasi `maybeThrottleChunk()` dipanggil tiap loop iteration di
`processStudentsSync` dan `processLecturersSync`. Default 0ms (zero
overhead di run kecil), naikkan saat full sync.

### Pakai

```bash
# Full sync manual di production (jangan lupa backup dulu!)
cd /usr/local/www/apache24/data/Sibermas2026/apps/api

# Safe untuk server 2-core: jeda 300ms tiap 100 rows
#   → throughput: ~200-300 records/detik, CPU jauh lebih adem
php artisan sync:master-data \
  --type=mahasiswa \
  --source=api \
  --chunk-size=100 \
  --chunk-sleep-ms=300

# Server 4-core bisa lebih agresif
php artisan sync:master-data \
  --type=all \
  --source=api \
  --chunk-size=200 \
  --chunk-sleep-ms=150
```

Kalau frontend tetap lambat selama sync, naikkan `--chunk-sleep-ms` atau
turunkan `--chunk-size`.

### Nginx optimasi statis (sudah ada di template)

Periksa `/usr/local/etc/nginx/nginx.conf` di server — harus ada blok:

```nginx
location /_next/static/ {
    alias __APP_DIR__/apps/web/.next/standalone/apps/web/.next/static/;
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

(Path `__APP_DIR__` sudah di-render jadi `/usr/local/www/apache24/data/Sibermas2026`
oleh `install-freebsd.sh`.) Kalau blok ini **tidak** ada, artinya server
masih pakai nginx config lama. Render ulang:

```bash
sed "s|__APP_DIR__|/usr/local/www/apache24/data/Sibermas2026|g; \
     s|__WEB_DOMAIN__|sibermas.uinsaizu.ac.id|g; \
     s|__CERT_BASE__|sibermas.uinsaizu.ac.id|g" \
  nginx-freebsd.conf > /usr/local/etc/nginx/nginx.conf
nginx -t && service nginx reload
```

---

## Fix #3 — Kenapa Telegram Bot "Diam" saat 403/503

**Ini by design, bukan bug.** Bot di-wire dari `ErrorAlertService` yang
hanya dipanggil di dua tempat:

1. `bootstrap/app.php::withExceptions` → catch-all di atas 500 (unhandled
   throwable).
2. `schedule monitoring:health-check` → probe infrastruktur.

Kenapa 403/503 tidak trigger:

- **403 Forbidden** = kebijakan keamanan yang dikembalikan oleh controller
  / middleware via `return response(...)`. Tidak ada exception → tidak ada
  handler catch. **Tidak perlu alert** — itu respons normal dari lapisan
  RBAC.
- **503 Service Unavailable** = dikembalikan Nginx karena upstream timeout,
  **request tidak pernah sampai ke Laravel**. Laravel tidak tahu ada error
  → tidak bisa kirim alert.

### Enhancement baru: alert IPK anomali

Biar bot _tetap_ bermanfaat selama sync, **`MasterDataSanitizer::maybeAlertOps()`**
sekarang kirim Telegram kalau >1% data dari SIAKAD punya GPA di luar
[0, 4.0]. Threshold: min 50 row sample agar tidak noise.

Sample pesan yang dikirim:

> ⚠️ *SIBERMAS*
>
> *Data anomaly terdeteksi pada sync:master-data*
>
> Rasio GPA out-of-range: **2.15%** (269/12500).
>
> Sample record (NIM → IPK mentah):
> - `210110001` → `11.05`
> - `210110042` → `7.62`
> - `210110115` → `8.90`
>
> Semua nilai sudah di-clamp ke [0, 4.0] di lokal. Mohon koordinasi
> dengan Admin SIAKAD untuk memperbaiki data sumber agar statistik
> KKN akurat.

### Monitor 503 secara eksternal

Untuk deteksi 503 (yang Laravel tidak lihat), ada 2 opsi:

1. **Uptime monitor eksternal** — contoh UptimeRobot / Healthchecks.io
   ping `GET /api/health` tiap menit. Kalau dapat 503, kirim Telegram
   notif sendiri. Gratis ~50 monitor.
2. **Nginx log watcher** — jalankan `monitoring:health-check` lebih
   sering (sekarang 5 menit), atau tambah cron yang tail
   `/var/log/nginx/sibermas-error.log` dan pattern-match `upstream timed
   out`.

---

## Fix #4 — Data anomali IPK SIAKAD

### Root cause
SIAKAD return IPK mentah tanpa validasi kisaran (mis. 7.6, 8.9, 11.05).
Lokal SIBERMAS sudah clamp ke [0, 4.0] di `MasterDataSanitizer::gpa()`,
tapi tidak ada surface ke ops — 269 baris salah terkubur di log file.

### Yang diubah

**`apps/api/app/Services/MasterApi/MasterDataSanitizer.php`**:

- Tambah per-run counter: `gpa_processed`, `gpa_clamped`, `gpa_samples`
  (max 10 sample NIM → raw value), `nik_processed`, `nik_invalid`.
- `resetStats()` / `getStats()` / `maybeAlertOps()` helper.
- `SyncMasterData::handle()` sekarang `resetStats()` sebelum sync dan
  `maybeAlertOps()` setelah — lihat detail di Fix #3.

### Pakai programatik

```php
use App\Services\MasterApi\MasterDataSanitizer;

MasterDataSanitizer::resetStats();
// ... run sync or import ...
$stats = MasterDataSanitizer::getStats();
// [
//   'gpa_processed' => 12500,
//   'gpa_clamped' => 269,
//   'gpa_clamp_ratio' => 0.0215,
//   'gpa_samples' => [['id' => '210110001', 'raw' => 11.05], ...],
//   'nik_processed' => 12500,
//   'nik_invalid' => 40,
// ]
MasterDataSanitizer::maybeAlertOps('sync:master-data');
```

### Action item koordinasi dengan SIAKAD IT

Setelah Telegram alert masuk, minta IT SIAKAD cek kolom di source DB
(`ipk`, `gpa`, `total_sks`) — nilai di luar range menunjukkan bug di
kalkulator IPK atau corrupt migration di sumber. SIBERMAS tidak boleh
**memperbaiki** data SIAKAD, cukup surfacenya.

---

## Fix #5 — Log `Permission denied` antara www vs CLI

### Root cause
File `laravel-YYYY-MM-DD.log` di-create dengan `umask 022` default → owner
`rw-`, group `r--`, other `r--`. Kalau file pertama dibuat oleh user CLI
(mis. root saat `php artisan migrate`), lalu FPM worker (user `www`) coba
tulis → `Permission denied`. Sebaliknya juga sama.

### Yang diubah

**`apps/api/config/logging.php`**:

```php
'daily' => [
    // ...
    'permission' => 0o664,  // group-writable
],
'single' => [
    // ...
    'permission' => 0o664,
],
```

Monolog akan `chmod 0664` setelah file create.

**`apps/api/supervisord.conf`**:

```ini
[program:sibermas-worker-default]
user=www
umask=002                     ; ← new
environment=UMASK="0002"      ; ← new
```

Diterapkan di 4 program (3 worker + web).

### Action item operator

1. Pastikan group `www` di FreeBSD mencakup user yang menjalankan artisan
   (mis. deploy user). `pw groupmod www -m deploy` jika belum.
2. Fix file yang sudah terlanjur salah perm:
   ```bash
   chown -R www:www /usr/local/www/apache24/data/Sibermas2026/apps/api/storage
   find /usr/local/www/apache24/data/Sibermas2026/apps/api/storage/logs -type f -exec chmod 0664 {} \;
   find /usr/local/www/apache24/data/Sibermas2026/apps/api/storage       -type d -exec chmod 2775 {} \;
   ```
   Mode `2775` pada direktori = setgid bit, supaya file yang di-create
   inherit group `www` otomatis.
3. Restart supervisor agar umask baru ter-apply:
   ```bash
   supervisorctl reread && supervisorctl update
   supervisorctl restart workers:*
   ```

---

## Fix #6 — JS TypeError `Cannot read properties of undefined (reading 'call')`

**Diagnosa:** build manifest tidak sinkron dengan chunk file. Biasanya
terjadi setelah `git pull` yang mengubah dependency tapi `.next/` tidak
dibersihkan, ATAU setelah pnpm install yang mengubah layout `node_modules`
(simlink vs hoisted).

**Fix codebase sudah ada** di commit sebelumnya:
- `.npmrc` → `node-linker=hoisted`
- `apps/web/next.config.ts` → `outputFileTracingRoot: path.join(__dirname, '../../')` + `experimental.externalDir: true`

### Action item re-deploy bersih

```bash
cd /usr/local/www/apache24/data/Sibermas2026

# 1. Pull code terbaru
git pull origin main

# 2. BUSANG build artifacts
rm -rf apps/web/.next
rm -rf apps/web/node_modules/.cache

# 3. (Opsional, kalau pnpm install sebelumnya salah) reinstall
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install --frozen-lockfile

# 4. Rebuild web + copy static/public ke standalone
pnpm --filter web build
cp -r apps/web/.next/static   apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public         apps/web/.next/standalone/apps/web/public

# 5. Fix ownership
chown -R www:www apps/web/.next

# 6. Restart web
supervisorctl restart sibermas-web

# 7. Verifikasi — buka di browser DevTools Network tab, clear cache + reload.
#    Tidak boleh ada 404 dari /_next/static/*.js
```

### Verifikasi di nginx

Pastikan path static benar-benar ada:

```bash
ls -la /usr/local/www/apache24/data/Sibermas2026/apps/web/.next/standalone/apps/web/.next/static/chunks/
# → harus isi banyak file .js dengan hash
```

Kalau kosong, langkah 4 belum jalan (lupa copy ke standalone).

---

## Checklist Re-deploy 2026-05-12

Jalankan di server production, dalam urutan:

- [ ] `cd /usr/local/www/apache24/data/Sibermas2026 && git pull origin main`
- [ ] Edit `apps/api/.env` — set `AUTH_2FA_GRACE_HOURS=24` (first launch)
- [ ] `cd apps/api && php artisan config:clear && php artisan config:cache`
- [ ] `php artisan route:cache`
- [ ] **Fix log perms** (sekali saja):
  ```
  chown -R www:www storage
  find storage/logs -type f -exec chmod 0664 {} \;
  find storage       -type d -exec chmod 2775 {} \;
  ```
- [ ] `cd .. && rm -rf apps/web/.next`
- [ ] (Opsional, kalau JS TypeError masih muncul) `rm -rf node_modules apps/*/node_modules packages/*/node_modules && pnpm install --frozen-lockfile`
- [ ] `pnpm --filter web build`
- [ ] `cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static`
- [ ] `cp -r apps/web/public apps/web/.next/standalone/apps/web/public`
- [ ] `chown -R www:www apps/web/.next`
- [ ] **Verifikasi Nginx config**: `grep -n '_next/static' /usr/local/etc/nginx/nginx.conf` → harus muncul
- [ ] `supervisorctl reread && supervisorctl update`
- [ ] `supervisorctl restart all`
- [ ] `curl -sSf https://sibermas.uinsaizu.ac.id/api/health | jq .`
- [ ] Login sebagai admin baru, pastikan bisa reach dashboard + /admin/pengaturan/keamanan
- [ ] **Sync test (off-peak!):**
  ```
  cd apps/api
  php artisan sync:master-data --type=mahasiswa --source=api --delta \
    --chunk-size=100 --chunk-sleep-ms=300
  ```
- [ ] Monitor `/var/log/sibermas/*.log` 5 menit — tidak boleh ada fatal

---

## Rollback Plan

Kalau ada regresi setelah deploy:

```bash
cd /usr/local/www/apache24/data/Sibermas2026
git log --oneline -5            # cari commit sebelum fix ini
git checkout <prev-commit>
cd apps/api && php artisan config:cache && php artisan route:cache
cd .. && pnpm --filter web build
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public       apps/web/.next/standalone/apps/web/public
supervisorctl restart all
```

Database tidak ada migration baru di cycle ini, jadi rollback aman tanpa
`migrate:rollback`.
