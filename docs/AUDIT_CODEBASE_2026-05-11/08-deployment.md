# 08 — Deployment & Operations

## Platform Target

**FreeBSD 14.x** sebagai target production. Ini pilihan yang tidak lazim untuk Laravel SaaS — kemungkinan mengikuti infrastructure existing UIN Saizu.

**Alternatif**: README juga menyebut Docker, tapi `docker-compose.yml` tidak ada di repo. **M-NEW-004** — README misleading.

## Stack Production

```
┌─────────────────────────────────────────────────────────┐
│                      Cloudflare                         │
│  (Trusted proxy, IP ranges di bootstrap/app.php)        │
└──────────────────────────┬──────────────────────────────┘
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Nginx (FreeBSD port)                   │
│  /usr/local/etc/nginx/nginx.conf                        │
│  • TLS 1.2/1.3, HSTS, OCSP stapling                     │
│  • Rate limit zones (api 60r/s, auth 5r/m)              │
│  • Proxy web: 127.0.0.1:3000 (Next.js)                  │
│  • FastCGI api: /var/run/php84-fpm.sock                 │
└───────┬──────────────────────────┬──────────────────────┘
        ▼                          ▼
┌──────────────────┐     ┌───────────────────────────────┐
│   Next.js 15     │     │  Laravel 13 (PHP-FPM)         │
│   (standalone)   │     │  /usr/local/www/sibermas      │
│   node server.js │     │  /apps/api                    │
│   port 3000      │     └──────────────┬────────────────┘
└──────────────────┘                    │
                                        ▼
                          ┌─────────────────────────┐
                          │  Supervisor managed:    │
                          │  • Horizon              │
                          │  • queue:work default   │
                          │  • queue:work low       │
                          │  • queue:work long      │
                          │  • next.js web          │
                          └─────┬───────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
         ┌──────────┐    ┌──────────┐    ┌──────────────┐
         │PostgreSQL│    │  Redis   │    │ Storage disk │
         │    16    │    │    7     │    │ (public/     │
         │          │    │          │    │  private)    │
         └──────────┘    └──────────┘    └──────────────┘
```

## Installation — FreeBSD

### Automated (`install-freebsd.sh`)

```bash
# Run as root
sh install-freebsd.sh

# Dengan domain custom
WEB_DOMAIN=staging.example.com \
  API_DOMAIN=api.staging.example.com \
  CERT_BASE=staging.example.com \
  sh install-freebsd.sh
```

Skrip melakukan:
1. `pkg update -f`
2. Install php84, postgresql16, redis, nginx, node22, supervisor, composer, git
3. `sysrc` enable layanan
4. `service postgresql initdb` + start
5. Generate random DB password ke `${APP_DIR}/.db_password.initial`
6. Create database + user
7. Clone repo ke `/usr/local/www/sibermas`
8. Composer install --no-dev
9. Copy .env + generate APP_KEY
10. Migrate + storage:link
11. config:cache + route:cache
12. pnpm install + build
13. Set permissions (`www:www` untuk storage, bootstrap/cache)
14. Render nginx config dari template
15. Start nginx + supervisord

## Supervisor Configuration

`apps/api/supervisord.conf`:

| Program | Queue | Procs | Tries | Max time |
|---|---|---|---|---|
| `sibermas-horizon` | Dashboard | 1 | - | - |
| `sibermas-worker-default` | default, critical, high | 2 | 3 | 3600s |
| `sibermas-worker-low` | low | 1 | 3 | 3600s |
| `sibermas-worker-long` | long | 1 | 1 | 7200s |
| `sibermas-web` | Next.js standalone | 1 | - | - |

Logs di `/var/log/sibermas/`.

## Nginx Configuration

`nginx-freebsd.conf` (template dengan placeholder):

### Security Headers
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(self)` (R13-OPS-014)

### Rate Limit Zones
```
limit_req_zone  $binary_remote_addr  zone=api_limit:10m   rate=60r/s;
limit_req_zone  $binary_remote_addr  zone=auth_limit:10m  rate=5r/m;
limit_conn_zone $binary_remote_addr  zone=conn_limit:10m;
```

### Apply
- `/api/v1/auth/{login,forgot-password,reset-password}`: `auth_limit` burst 3 nodelay
- `/api/`: `api_limit` burst 50 nodelay + `conn_limit 20`
- `/` (web): `conn_limit 50`

### TLS
- Protocols: TLSv1.2 + TLSv1.3 (no 1.0/1.1)
- Ciphers: `HIGH:!aNULL:!MD5`
- `ssl_stapling on` + verify
- Let's Encrypt: `/usr/local/etc/letsencrypt/live/{domain}/`

## Backup

`scripts/backup.sh`:
- `pg_dump --format=custom` compressed dengan verifikasi
- `tar` compress `storage/app/public`
- Env metadata snapshot (versi, user count, DB size)
- Retention: 7 hari (auto-delete older)
- Crontab: `0 2 * * * /usr/local/www/sibermas/scripts/backup.sh`

`scripts/restore.sh` exist — tidak di-audit secara mendalam.

## Environment Variables

### Backend (`apps/api/.env`)
Documented via `.env.example` + `.env.production.example`.

**Required secrets** (must be rotated regularly):
- `APP_KEY` (Laravel encryption key)
- `APP_BLIND_INDEX_KEY` (PII blind index HMAC) — **rotation requires bidx rebuild**
- `DB_PASSWORD`
- `REDIS_PASSWORD`
- `MASTER_API_TOKEN` (SIAKAD)
- `MASTER_WEBHOOK_SECRET`
- `API_ADMIN_SECRET`
- `KKN_SUPERADMIN_PASSWORD` (boot-time only)
- `GEMINI_API_KEY`, `AI_PRIMARY_KEY`, `AI_FALLBACK_KEY`, `AI_TERTIARY_KEY`
- `SENTRY_LARAVEL_DSN`
- `TELEGRAM_BOT_TOKEN`

**Must be set** di production:
- `APP_ENV=production`
- `APP_DEBUG=false`
- `DEBUGBAR_ENABLED=false`
- `AUTH_TEST_AUTO_LOGIN_ENABLED=false` (double check!)
- `CORS_ALLOWED_ORIGINS=https://sibermas.uinsaizu.ac.id,https://api.sibermas.uinsaizu.ac.id`
- `SANCTUM_STATEFUL_DOMAINS=sibermas.uinsaizu.ac.id`
- `FRONTEND_URL=https://sibermas.uinsaizu.ac.id`
- `DB_SSLMODE=require` (uncomment!)

### Frontend (`apps/web/.env.production`)
```
NEXT_PUBLIC_API_URL=https://api.sibermas.uinsaizu.ac.id/api/v1
NEXT_PUBLIC_APP_URL=https://sibermas.uinsaizu.ac.id
NEXT_PUBLIC_SENTRY_DSN=...
```

### Mobile (EAS secret / CI var)
```
EXPO_PUBLIC_API_URL=https://api.sibermas.uinsaizu.ac.id/api/v1
EXPO_PUBLIC_SENTRY_DSN=...
EXPO_PUBLIC_SENTRY_ENV=production
EXPO_PUBLIC_APP_VERSION=1.0.0
```

## Observability

### Sentry
- Backend: `config/sentry.php` dengan PII scrubbing + health endpoint ignore
- Frontend: `sentry.client/server/edge.config.ts` dengan header scrub
- Mobile: `lib/sentry.ts` dengan 401 suppression

### Laravel Horizon
Dashboard di `/horizon`. Accessible ke siapa? Policy perlu dicek di `app/Providers/HorizonServiceProvider` (tidak kelihatan di audit — konfirmasi).

### Health Endpoints
- `GET /up` — Laravel built-in
- `GET /api/health` — public, basic
- `GET /api/ready` — public, DB+cache+storage
- `GET /api/health/detailed` — **superadmin-only**, returns telemetry

### Telegram Alerts
`TelegramAlertService` fires pada critical events. Configured via `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`. No-op jika kosong.

### Activity Logging
- `ActivityLogger::log($action, $status, $userId, $metadata)` untuk security events
- `user_activity_logs` table + `AuditObserver` pada model domain-critical

### Missing
- ❌ Metrics endpoint (Prometheus `/metrics`)
- ❌ Dashboard Grafana / Datadog
- ❌ APM dengan distributed tracing (hanya Sentry traces 10%)
- ❌ Slow query log collection
- ❌ Queue depth dashboard eksternal (Horizon OK internally)

## CI/CD

### GitHub Actions (`.github/workflows/ci.yml`)

```yaml
on: push branches [main, develop], pull_request branches [main, develop]

jobs:
  build-test:       # Node/pnpm (web + packages)
    - lint
    - type-check
    - build
    - test (vitest)
    - pnpm audit --audit-level=high || true   # NOT blocking
  backend-test:     # PHP (apps/api)
    services: postgres, redis
    - composer install
    - key:generate, migrate, test (pest), pint --test
    - composer audit
```

### Missing
- ❌ Dedicated CD workflow (deploy on tag / merge to main)
- ❌ Artifact upload / GitHub release
- ❌ PR preview deployment (Vercel / Railway)
- ❌ Production deploy automation (tetap manual via ssh + install script)

## Deployment Strategies

**Current**: Manual deploy via SSH + install script atau `git pull` + `composer install --no-dev` + `pnpm build` + `supervisorctl restart`.

**Missing**:
- ❌ Blue/green deployment
- ❌ Canary / gradual rollout
- ❌ Auto-rollback pada health check failure
- ❌ Database migration safety net (transaction wrap + dry-run)
- ❌ Zero-downtime strategy formal

## Disaster Recovery

**Partial:**
- ✅ Daily cron backup (pg_dump + storage tar)
- ✅ 7-day retention
- ❌ **Tidak ada DR runbook**
- ❌ Backup offsite / S3 sync (tidak terdokumentasi)
- ❌ RTO/RPO target tidak ditetapkan
- ❌ Backup restore test rutin tidak ada

## Scaling Considerations

Current = single FreeBSD box. Scaling opsi:

1. **Vertical**: bump CPU/RAM — murah, sampai ~10k concurrent users.
2. **Horizontal web**: multiple Next.js instance di load balancer — stateless, mudah.
3. **Horizontal API**: beberapa Laravel worker di belakang LB — perhatikan session sticky.
4. **DB replica**: PostgreSQL streaming replication untuk read scale.
5. **Redis cluster**: untuk cache + queue scale.
6. **Storage**: migrasi ke S3/MinIO untuk file besar.

Saat peak KKN (pendaftaran + submit laporan akhir), expect ~5000 concurrent student. Current config seharusnya cukup dengan CPU yang adequate.

## Rekomendasi Deployment

### P0
1. **README rewrite** — remove Inertia.js, remove Docker claim yang belum ada.
2. **Audit path** — konfirmasi `/horizon` dashboard tidak public-accessible di production.

### P1
1. **Cloudflare IP auto-update** — script/cron untuk sync IP list ke `bootstrap/app.php` trust proxies (M-NEW-007).
2. **DR runbook** — tulis SOP restore dari `pg_dump` + storage tar. Test setiap quarter.
3. **Deploy automation** — GitHub Actions workflow yang SSH deploy otomatis pada tag release.
4. **Backup offsite** — sync `/var/backups/sibermas/` ke S3/MinIO harian.

### P2
1. **Prometheus `/metrics` endpoint** — expose Laravel + Next.js metrics (request rate, latency, queue depth).
2. **Grafana dashboard** untuk sistem operasional.
3. **Blue/green deployment** via Nginx upstream switching.
4. **Migration safety** — dry-run via `php artisan migrate --pretend` di CI sebelum apply.

### P3
1. **Infrastructure as Code** — Terraform/Ansible untuk reproducible FreeBSD provisioning.
2. **Load testing** via k6 atau Locust pada staging.
3. **Chaos engineering** — periodic test Redis/DB connection failure.
