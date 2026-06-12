# SIBERMAS2026 Handoff Notes

Last updated: 2026-05-18

## Safety
- Never store/display passwords, API keys, tokens, connection strings. Redact as `[REDACTED]`.
- Do not broad-replace `superadmin` role string; it is a DB/app role, not always a URL slug.

## Server
- SSH: `ssh -p 1977 kampelmas@172.16.2.70`
- OS: FreeBSD
- Project root: `/usr/local/www/apache24/data/Sibermas2026`
- Web: `/usr/local/www/apache24/data/Sibermas2026/apps/web`
- API: `/usr/local/www/apache24/data/Sibermas2026/apps/api`
- DB: PostgreSQL `kknnative` on `127.0.0.1:5432`
- Timezone: Asia/Jakarta (WIB)
- `kampelmas` has passwordless sudo.

## Services
- nginx: public 80/443
- Next.js standalone: `sibermas_web` on `127.0.0.1:3000`, runs as `www`
- Laravel API via Apache: `127.0.0.1:8080`

## Role Slugs (current final state after rollback)
- `superadmin`, `admin`, `faculty_admin` → `/admin`
- `dosen`, `dpl` → `/dosen`
- `student` → `/mahasiswa`
- `/superadmin` should be 404 unless user explicitly reopens slug migration.
- Backend/admin API paths stay `/api/v1/admin/...`.

## Build / Deploy Web
Run from `apps/web`:

```sh
cd /usr/local/www/apache24/data/Sibermas2026/apps/web
sudo chown -R kampelmas:www .next 2>/dev/null || true
rm -rf .next
pnpm build
sudo chown -R www:www .next
sudo chmod -R a+rX .next
sudo service sibermas_web restart
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3000/login
```

Expected `/login` = `200`.

## Known Build/Runtime Issues
- FreeBSD SWC bug: `eslint.ignoreDuringBuilds: true` already set in `next.config.ts`.
- If `server.js is not readable`, fix ownership/permissions on `.next`.
- If `EADDRINUSE 127.0.0.1:3000`, stop service and kill stale Next process, then restart.
- If `Failed to find Server Action`, likely stale browser/build mismatch; clean build and restart.
- If `Cannot find module '../server/request-meta'`, likely broken/incomplete standalone; clean rebuild.

## Validation Commands
All pages (no 404):

```sh
/usr/local/bin/python3.11 /tmp/full_page_audit2.py
/usr/local/bin/python3.11 /tmp/link_audit.py
```

If scripts missing, recreate by walking `apps/web/src/app/**/page.tsx` and curl each normalized route against `http://127.0.0.1:3000`.

Service/route smoke test:

```sh
sudo service sibermas_web status
for p in / /login /admin /admin/ops/dashboard /admin/ops/pendaftaran /admin/sys/pengguna /dosen /mahasiswa /superadmin; do
  code=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000$p)
  echo "$code $p"
done
```

Expected:
- `/`, `/login` → 200
- protected dashboards → 308 auth redirect
- `/superadmin` → 404

## Current fixes applied in this session
- Slug migration attempt `/admin`→`/superadmin` was rolled back by user request.
- Current live route slug is `/admin` for superadmin/admin/faculty_admin.
- Added/fixed 2FA page(s):
  - `/login/2fa`
  - `/login-2fa` (compat)
- Login 2FA redirect should use `/login/2fa`.
- Full route/link audit after adding 2FA had 0 bad links before last clean build was started.

## KKN / DB snapshot from session
- Users ~10,605
- Mahasiswa ~10,295
- Dosen ~308
- Peserta KKN increased >1,700 during registration day
- Active periods: 7
- Countdown settings enabled: 7

## Important app notes
- `countdown_settings` table exists.
- JSON dates may convert to UTC; server `now()` is WIB.
- `PeriodContextService` caches period 1h; run `php artisan cache:clear` after direct period DB changes.
- PostgreSQL rejects `lockForUpdate()->count()` in aggregates.
- Controllers using API response helpers need `use ApiResponse` trait.
- Client-only providers belong in Providers, not `layout.tsx`.
