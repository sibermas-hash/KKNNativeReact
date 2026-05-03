You are a senior software engineer. Three separate AI agents
audited the SIBERMAS codebase and produced three audit reports.
Your job is to:

1. Verify every conflicting finding by reading the actual file
2. Fix everything that is confirmed as broken
3. Report what you verified and what you found

Read all three audit reports completely before touching any file.
Do NOT fix something based on one agent's report alone —
verify by reading the actual file first.
Do NOT modify anything that is already working correctly.

---

## THE THREE AUDIT REPORTS

Agent 1 findings (summary):

- Certificate verify URL mismatch in api-client
- SANCTUM_STATEFUL_DOMAINS missing from .env.example
- 3 dead controllers with Inertia references
- 10+ inline query key strings in web pages
- CACHE/SESSION/QUEUE defaults to database not redis
- next.config.ts missing standalone output
- Dead rekapitulasi functions in api-client

Agent 2 findings (summary):

- api.yml CI installs --no-dev breaking Pest tests
- SANCTUM_STATEFUL_DOMAINS missing
- HomeController has use Inertia\Inertia (fatal error risk)
- WorkshopController uses route() helper (Ziggy removed)
- CACHE/SESSION/QUEUE defaults wrong
- api-client response interceptor does NOT auto-unwrap envelope
- turbo.json test task depends on build not ^build
- next.config.ts missing standalone
- Supervisor config missing

Agent 3 findings (summary):

- api-client response interceptor returns full envelope (bug)
- PesertaKknController uses get() not paginate() (memory risk)
- Captcha test gets 500 in CI (missing Redis in test env)
- PublicDataController missing ApiResponse trait
- 66 endpoints missing api-client functions
- 6 missing TypeScript interfaces
- Mobile offline queue not implemented
- Deployment configs incomplete

---

## STEP 1 — VERIFY CONFLICTS FIRST

Before fixing anything, read these specific files and
report what you actually find:

1. Read packages/api-client/src/client.ts
   CONFLICT: Agent 2 and 3 say response interceptor returns
   full envelope. Agent 1 says it works correctly.
   → What does handleResponse() or the response interceptor
     actually return? response.data or response.data.data?

2. Read apps/api/app/Http/Controllers/Api/V1/Admin/PesertaKknController.php
   CONFLICT: Agent 3 says index() uses get(). Agent 1 says
   all list endpoints use paginate().
   → Does index() use paginate() or get()?

3. Read tests/Feature/Api/V1/Auth/AuthTest.php
   CONFLICT: Agent 1 and 3 say 52 tests total.
   Agent 2 says ~30.
   → What is the actual test count across all test files?
   Run: grep -c 'function test\|it(' tests/Feature -r

4. Read apps/web/src/app/(public)/berita/page.tsx
   CONFLICT: Agent 1 and 3 say generateMetadata + revalidate
   exist. Agent 2 says not confirmed.
   → Does the file have export const revalidate and
     export async function generateMetadata()?

5. Read .github/workflows/api.yml
   CONFLICT: Agent 2 says --no-dev breaks Pest.
   Others did not check.
   → Does the test job use composer install --no-dev?

6. Read apps/api/app/Http/Controllers/HomeController.php
   CONFLICT: All agents agree Inertia references exist.
   → Is this file referenced in any route file?
   Check routes/api.php and all v1 route files.

7. Read packages/api-client/src/endpoints/index.ts
   Look for: certificate verify URL and rekapitulasi functions
   CONFLICT: Agent 1 says URL is wrong (/public/certificates/verify/)
   → What is the actual URL used?

Report your findings from all 7 checks before proceeding to fixes.

---

## STEP 2 — CONFIRMED FIXES (all 3 agents agree)

These are confirmed by multiple agents. Fix without
additional verification:

### FIX A — .env.example Deployment Variables

File: apps/api/.env.example

Add if missing:
SANCTUM_STATEFUL_DOMAINS=sibermas.uinsaizu.ac.id,localhost,localhost:3000

Change defaults (add production-ready values as comments):

# Development default (change to redis in production)

CACHE_STORE=database

# CACHE_STORE=redis

# Development default (change to redis in production)  

SESSION_DRIVER=database

# SESSION_DRIVER=redis

# Development default (change to redis in production)

QUEUE_CONNECTION=database

# QUEUE_CONNECTION=redis

Add if missing:

# Server-side API URL (used by Next.js server components)

API_URL=<http://localhost:8000>

# Client-side API URL (used by Next.js client components and mobile)

NEXT_PUBLIC_API_URL=<http://localhost:8000>

### FIX B — Delete Dead Legacy Controllers

Read each file first, confirm not referenced in any route, then delete:

1. app/Http/Controllers/HomeController.php
   - Confirm: grep -r "HomeController" routes/
   - If zero matches → delete

2. app/Http/Controllers/WorkshopController.php
   - Confirm: grep -r "WorkshopController" routes/
   - If zero matches → delete

3. app/Http/Controllers/Public/CertificateVerificationController.php
   - Confirm: grep -r "CertificateVerificationController" routes/
   - If zero matches → delete

After deleting: run php artisan route:list
→ must show no broken controller references

### FIX C — next.config.ts Standalone Output

File: apps/web/next.config.ts

Add to the config object:
output: 'standalone'

This is required for FreeBSD deployment where
node .next/standalone/server.js is used instead of next start.

Note: after adding standalone, the deployment command changes:

- Before: cd apps/web && pnpm start
- After: node apps/web/.next/standalone/server.js

### FIX D — Create Supervisor Config

Create: apps/api/supervisord.conf

Content must be FreeBSD-compatible:
[unix_http_server]
file=/var/run/supervisor.sock

[supervisord]
logfile=/var/log/supervisord.log
pidfile=/var/run/supervisord.pid

[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface

[supervisorctl]
serverurl=unix:///var/run/supervisor.sock

[program:sibermas-worker]
command=php /path/to/apps/api/artisan queue:work redis --sleep=3 --tries=3 --max-time=3600
directory=/path/to/apps/api
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=2
process_name=%(program_name)s_%(process_num)02d
stdout_logfile=/var/log/sibermas-worker.log
stderr_logfile=/var/log/sibermas-worker-error.log

[program:sibermas-horizon]
command=php /path/to/apps/api/artisan horizon
directory=/path/to/apps/api
autostart=true
autorestart=true
stdout_logfile=/var/log/sibermas-horizon.log
stderr_logfile=/var/log/sibermas-horizon-error.log

Add comment at top explaining FreeBSD setup:

# FreeBSD setup

# pkg install py39-supervisor

# sysrc supervisord_enable="YES"  

# service supervisord start

# supervisorctl reread && supervisorctl update

---

## STEP 3 — CONDITIONAL FIXES (based on Step 1 findings)

Apply each fix ONLY IF Step 1 verification confirms the issue:

### FIX E — api-client Response Interceptor

ONLY FIX IF Step 1 check #1 confirms interceptor returns full envelope.

File: packages/api-client/src/client.ts

The interceptor must return response.data.data for success responses,
not response.data (the full envelope).

BUT: check all consumers first.
If apps/web stores and hooks are already doing res.data to unwrap,
and you change the interceptor to auto-unwrap,
all consumers will break (double unwrap).

Correct approach:

1. Read 3 consumers of the api-client in apps/web/src/
2. Check if they access res.data or res (expecting auto-unwrap)
3. Pick ONE consistent pattern and apply it everywhere
4. Document the decision clearly in the client.ts file

### FIX F — PesertaKknController Pagination

ONLY FIX IF Step 1 check #2 confirms get() is used.

File: apps/api/app/Http/Controllers/Api/V1/Admin/PesertaKknController.php

Change index() to use paginate(25) instead of get()
Also check: are with() eager loads present?
If not, add them based on what PesertaKknResource accesses.

### FIX G — CI Workflow --no-dev Bug

ONLY FIX IF Step 1 check #5 confirms --no-dev is present.

File: .github/workflows/api.yml

In the test job, change:
composer install --no-dev
to:
composer install --prefer-dist --no-interaction

Keep --no-dev ONLY in the deploy job (not test job).
Pest and PHPUnit are dev dependencies — tests require them.

### FIX H — Certificate Verify URL

ONLY FIX IF Step 1 check #7 confirms URL mismatch.

File: packages/api-client/src/endpoints/index.ts

Check what the actual route is in routes/api.php:

- Is it GET /api/v1/public/verify-certificate/{token}?
- Or GET /api/v1/public/certificates/verify/{token}?

Fix the api-client function to match the actual route.

### FIX I — Inline Query Keys

ONLY FIX IF Step 1 or direct reading finds inline strings.

For each file using inline query key strings like
['student', 'workshops'] or ['dpl', 'daily-reports']:

Replace with QUERY_KEYS constants from @sibermas/constants.
Read packages/constants/src/index.ts first to see what keys exist.
If a needed key is missing from QUERY_KEYS, add it there first.

---

## STEP 4 — GAPS (implement what is missing)

### GAP A — Mobile Offline Queue

This is the only remaining Gap #2 from MIGRATION_DOCUMENTATION.md.

Create apps/mobile/lib/offline-queue.ts:

Data structure stored in AsyncStorage key 'offline_daily_reports':
Array of queued items, each with:

- id: uuid (generated client-side)
- payload: the form data for the daily report
- created_at: ISO string
- retry_count: number (max 3)

Functions to implement:

- addToQueue(payload): saves item to AsyncStorage queue
- getQueue(): returns all queued items
- removeFromQueue(id): removes item by id
- processQueue(apiClient): attempts to submit all queued items,
  removes successfully submitted items, increments retry_count on failure,
  removes items with retry_count >= 3

Network monitoring:

- Use @react-native-community/netinfo to detect online/offline
- When network state changes to online: call processQueue()
- Show queue badge count on the Reports tab when queue is not empty

Update apps/mobile/app/(tabs)/reports/create.tsx:

- On submit: check network state
- If offline: call addToQueue(formData) instead of API call
  Show message: "Laporan tersimpan. Akan dikirim saat ada koneksi."
- If online: submit normally via API

Add to apps/mobile/package.json:
@react-native-community/netinfo

Update apps/mobile/app.config.ts:
Add @react-native-community/netinfo to plugins if needed.

### GAP B — Captcha Test Redis in CI

ONLY if Step 1 check #5 confirms the CI has a Redis service:

File: .github/workflows/api.yml

In the test job services section, add Redis:
services:
  redis:
    image: redis:7
    ports:
      - 6379:6379
    options: >-
      --health-cmd "redis-cli ping"
      --health-interval 10s
      --health-timeout 5s
      --health-retries 5

Also add to the test job env:
REDIS_HOST: 127.0.0.1
REDIS_PORT: 6379
CACHE_STORE: redis
SESSION_DRIVER: redis

---

## STEP 5 — FINAL VERIFICATION

After all fixes, run these checks:

Backend:
□ php artisan test → report exact test count and pass/fail
□ php artisan route:list → no missing controller errors
□ grep -r "Inertia" app/Http/Controllers/ → must return zero
□ php artisan config:cache → no errors
□ php artisan route:cache → no errors

Frontend:
□ pnpm --filter web tsc --noEmit → zero TypeScript errors
□ pnpm --filter web build → successful, report output mode
□ pnpm --filter mobile tsc --noEmit → zero TypeScript errors
□ pnpm --filter @sibermas/api-client build → successful

---

## FINAL REPORT FORMAT

Produce this after completing all steps:

STEP 1 — CONFLICT RESOLUTION
For each of the 7 conflicts: what you found, which agent was correct

STEP 2-4 — FIXES APPLIED
For each fix: status, files changed, what changed

CONSOLIDATED STATUS TABLE

| Item | Agent 1 | Agent 2 | Agent 3 | Actual | Fixed |
|------|---------|---------|---------|--------|-------|
| Test count | 52 | 30 | 52 | ? | - |
| Envelope unwrap | ✅ | ⚠️ | ❌ | ? | ? |
| PesertaKkn paginate | ✅ | - | ❌ | ? | ? |
| SANCTUM in .env | ❌ | ❌ | ❌ | ❌ | ✅ |
| CI --no-dev | - | ❌ | - | ? | ? |
| Dead controllers | ⚠️ | ❌ | ⚠️ | ? | ? |
| Offline queue | ❌ | ❌ | ❌ | ❌ | ? |
| Standalone output | ⚠️ | ⚠️ | ❌ | ? | ? |
| Supervisor config | ❌ | ⚠️ | ❌ | ❌ | ? |
| Certificate URL | ❌ | - | - | ? | ? |
| Inline query keys | ⚠️ | - | ⚠️ | ? | ? |

LAUNCH READINESS VERDICT

- Remaining ❌ critical bugs: N
- Remaining ⚠️ warnings: N  
- Remaining 🔲 gaps: N
- Total Pest tests: N
- TypeScript errors: N
- READY FOR MANUAL TESTING: Yes / No

---

Begin with Step 1.
Read all 7 conflicting files first.
Report findings before making any changes.
