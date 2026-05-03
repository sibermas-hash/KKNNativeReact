You are a senior software engineer. Your job is to complete all remaining
work that can be done WITHOUT a running server or manual browser testing.
Read MIGRATION_DOCUMENTATION.md first to understand what has already been
built, then work through each task below.

---

## CRITICAL RULE

Read every file before touching it.
Do not rewrite working code.
Do not assume something is broken — verify first.
If you find a bug while working, fix it and document it.
If you are unsure whether a change is safe, STOP and ask.

---

## CONTEXT

Project: SIBERMAS — KKN management system, UIN SAIZU
Stack: Laravel 13 API + Next.js 15 + React Native Expo (Turborepo monorepo)
Server: FreeBSD
Documentation: MIGRATION_DOCUMENTATION.md (source of truth for what was built)

---

## TASK 1 — EXPAND PEST TESTS (29 → 50+ tests)

Current state: 29 tests across 5 files.
Read each existing test file first to understand the pattern before adding.

Target test files and what to add:

tests/Feature/Api/V1/Auth/AuthTest.php
Add if not already present:

- captcha generates UUID (not sequential integer)
- captcha answer stored as Argon2id hash in Redis (not plaintext)
- captcha key deleted from Redis after successful verify (one-time use)
- captcha key deleted from Redis after failed verify (one-time use)
- captcha returns 422 CAPTCHA_INVALID after TTL expires
- login with X-App-Type: mobile header returns Bearer token (not cookie)
- login without X-App-Type header returns cookie session (not token)
- login returns CREDENTIALS_INVALID (not separate user/password errors)
- logout invalidates Bearer token
- logout invalidates session
- GET /auth/user returns 401 when unauthenticated
- GET /auth/user returns UserResource with roles and permissions when authenticated
- forgot password sends email
- reset password uses Argon2id (verify Hash::info() on new hash)

tests/Feature/Api/V1/Student/StudentTest.php
Add if not already present:

- unauthenticated request returns 401 JSON envelope
- student cannot access dpl routes (returns 403)
- student cannot access admin routes (returns 403)
- GET /student/dashboard returns correct envelope structure
- GET /student/daily-reports returns paginated response with meta
- POST /student/daily-reports creates record and returns 201
- POST /student/daily-reports with missing fields returns 422 with errors object
- PUT /student/daily-reports/{id} updates only own report (not others)
- GET /student/certificates returns certificate list
- GET /student/registration/status returns current status

tests/Feature/Api/V1/Dpl/DplTest.php
Add if not already present:

- unauthenticated request returns 401 JSON envelope
- dpl cannot access admin routes (returns 403)
- GET /dpl/dashboard returns correct envelope
- GET /dpl/groups returns only groups assigned to this DPL
- GET /dpl/daily-reports returns only reports from assigned groups
- PATCH /dpl/leave-requests/{id} approve/reject works correctly

tests/Feature/Api/V1/Admin/AdminTest.php
Add if not already present:

- unauthenticated request returns 401 JSON envelope
- non-admin cannot access admin routes (returns 403)
- GET /admin/dashboard returns stats envelope
- GET /admin/registrations returns paginated response
- GET /admin/users returns paginated response with correct Resource fields
- POST /admin/users creates user with Argon2id hashed password

tests/Feature/Api/V1/PublicTest.php
Add if not already present:

- GET /api/v1/public/announcements returns list
- GET /api/v1/public/announcements/{slug} returns single announcement
- GET /api/v1/public/locations returns list
- GET /api/v1/verify-certificate/{token} returns valid/invalid status
- All public endpoints accessible without authentication
- All public endpoints respect rate limiting

New test file — tests/Feature/Api/V1/ApiResponseEnvelopeTest.php
Test the envelope contract itself:

- Every success response has: success=true, message, data
- Every error response has: success=false, error.code, error.message
- Validation errors (422) have error.errors object with field names
- 404 routes return envelope (not Laravel default HTML 404)
- 500 errors return envelope (not stack trace)
- Unauthenticated API routes return 401 envelope (not redirect to /login)

New test file — tests/Feature/Api/V1/PerformanceTest.php
Test critical query correctness (not speed):

- GET /student/daily-reports does NOT trigger N+1
  (use DB::enableQueryLog() + assert query count)
- GET /dpl/groups does NOT trigger N+1
- GET /admin/registrations does NOT trigger N+1
- GET /admin/dashboard uses cache (assert Cache::has() after first call)
- Period context is cached after first call

Rules for all tests:

- Use existing test helpers and factories already in the codebase
- Never hardcode IDs or credentials — use factories
- Every test must be independent (no shared state between tests)
- Follow PSR-12
- Run php artisan test --filter=NewTestName after each file to verify it passes

---

## TASK 2 — SSG/ISR PUBLIC PAGES (Next.js)

Read apps/web/src/app/ structure first.
Identify which public pages currently fetch data client-side.

Pages that MUST be server components with ISR:

- app/(public)/page.tsx (Home) → revalidate: 3600
- app/(public)/berita/page.tsx (Announcements list) → revalidate: 1800
- app/(public)/berita/[slug]/page.tsx (Announcement detail) → revalidate: 1800
- app/(public)/unduhan/page.tsx (Downloads) → revalidate: 3600
- app/(public)/lokasi/page.tsx (Locations map) → revalidate: 86400
- app/(public)/verify-certificate/[token]/page.tsx → no cache (always fresh)

For each page:

- If already a server component with revalidate → leave it, note it as correct
- If using client-side fetch → convert to server component
- Fetch data directly from Laravel API using fetch() with next: { revalidate }
- No TanStack Query on these pages (server components cannot use hooks)
- Add generateMetadata() for SEO (title, description, og:image)
- Add error.tsx and loading.tsx per route segment if missing

---

## TASK 3 — CI/CD GITHUB ACTIONS (FreeBSD-aware)

Create .github/workflows/ in the monorepo root.

File: .github/workflows/api.yml
Trigger: push to main or develop, changes in apps/api/**
Jobs:

- test: PHP 8.4, install composer deps, run php artisan test
- lint: run vendor/bin/pint --test (Laravel Pint)
Note: CI runs on ubuntu-latest (GitHub hosted runner)
FreeBSD is the production server — not the CI environment
Make this distinction clear in comments

File: .github/workflows/web.yml  
Trigger: push to main or develop, changes in apps/web/**or packages/**
Jobs:

- type-check: pnpm install, pnpm --filter web type-check
- lint: pnpm --filter web lint
- build: pnpm --filter web build

File: .github/workflows/mobile.yml
Trigger: push to main, changes in apps/mobile/**or packages/**
Jobs:

- type-check: pnpm install, pnpm --filter mobile type-check
- lint: pnpm --filter mobile lint
Note: EAS Build is separate (manual trigger, not in CI)
Add comment explaining EAS Build process

File: .github/workflows/packages.yml
Trigger: changes in packages/**
Jobs:

- build-all: build all 5 shared packages in dependency order
- type-check-all: TypeScript check across all packages

Rules:

- Use pnpm caching in all JS workflows
- Use composer caching in PHP workflow
- All workflows must reference correct paths for monorepo structure
- Add workflow_dispatch for manual trigger on all workflows

---

## TASK 4 — PUSH NOTIFICATION SETUP (Expo — Scaffold Only)

This task is scaffold only — full testing requires a device.
Do not implement business logic — only the infrastructure.

In apps/mobile/:

Create lib/notifications.ts:

- registerForPushNotifications(): requests permission, gets Expo push token,
  returns token string or null if denied
- handleNotificationReceived(notification): logs notification data
- handleNotificationResponse(response): handles user tapping notification
- setupNotificationChannels(): Android notification channels
  (reports, announcements, grades)

Update apps/mobile/app/_layout.tsx:

- On app start: call registerForPushNotifications()
- If token obtained: POST to /api/v1/notifications/register-device
  with { token, platform: 'ios'|'android', device_id }
- Set up notification listeners (addNotificationReceivedListener,
  addNotificationResponseReceivedListener)

In apps/api/ — verify these exist, create if missing:

- POST /api/v1/notifications/register-device endpoint
- DeviceToken model or table to store Expo push tokens
- NotificationService with sendToUser(userId, title, body, data) method
  using Expo's push API (<https://exp.host/--/api/v2/push/send>)

---

## OUTPUT FORMAT

After completing each task:

TASK [N] — [NAME]
Status: Complete / Partial / Skipped (with reason)

Files created:

- path/to/file — what it contains

Files modified:

- path/to/file — what changed and why

Bugs found and fixed:

- Description of bug, file, line, fix applied

Skipped (already correct):

- What was already properly implemented

Flagged for manual verification:

- Anything that requires a running server or device to verify

At the end: Summary table of all 4 tasks with status and test counts.
