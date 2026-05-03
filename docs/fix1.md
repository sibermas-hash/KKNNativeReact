You are a senior software engineer. Your job is to fix all issues found
in the audit report below. Work through each fix in priority order.

Read the AUDIT REPORT completely first.
Read every file before modifying it.
Do not fix what is already marked ✅ in the audit.
Do not rewrite working code — only fix what is broken or incomplete.
If a fix could break something else, STOP and ask first.

---

## SOURCE OF TRUTH

- MIGRATION_DOCUMENTATION.md — what was built
- AUDIT REPORT (below) — what is broken
- The actual codebase — what actually exists

---

## AUDIT REPORT SUMMARY

Total checks: 87
✅ Passed: 58
❌ Bugs: 6
⚠️ Warnings: 8  
🔲 Gaps: 15

---

## FIX 1 — CRITICAL: Remove Old Inertia Controllers

Priority: MUST fix first. Everything downstream depends on this.

Problem:
134 Inertia::render() calls still exist in old controllers alongside
the new API V1 controllers. If Inertia package is fully removed,
these will crash. They also create confusion about which controller
handles which route.

What to do:

1. Read routes/web.php to understand which old controllers are still
   actively referenced by web routes
2. Read routes/api.php to confirm all routes now point to
   Api/V1/* controllers
3. For each old controller that has a direct Api/V1 equivalent:
   - Verify the V1 controller exists and is complete
   - Delete the old controller
4. For any old controller that has NO V1 equivalent yet:
   - Do NOT delete it
   - Add a class-level comment: // LEGACY: pending migration to Api/V1
   - Do NOT modify its logic
5. After deletions: run php artisan route:list to verify no broken routes
6. Document: list of deleted controllers, list of remaining legacy ones

Old controllers to check (examples — verify against actual codebase):

- app/Http/Controllers/Student/*→ compare with app/Http/Controllers/Api/V1/Student/*
- app/Http/Controllers/Dpl/*→ compare with app/Http/Controllers/Api/V1/Dpl/*
- app/Http/Controllers/Dosen/*→ compare with app/Http/Controllers/Api/V1/Dosen/*
- app/Http/Controllers/Admin/*→ compare with app/Http/Controllers/Api/V1/Admin/*
- app/Http/Controllers/Auth/*→ compare with app/Http/Controllers/Api/V1/Auth/*

---

## FIX 2 — CRITICAL: Remove Last Inertia Reference in Middleware

Priority: CRITICAL. Inertia::render in middleware will crash entire app.

File: app/Http/Middleware/EnsurePhase.php line 86

Problem:
Inertia::render('PhaseBlocked') is still called for non-API requests.
The Inertia package has been removed from composer. This will crash.

What to do:

1. Read the full EnsurePhase.php file
2. Find every place Inertia is referenced
3. Replace Inertia::render('PhaseBlocked') with one of:
   - If request is web (non-API): redirect to a plain URL with query param
     return redirect('/phase-blocked');
   - If request is API: already returns JSON (confirmed ✅ in audit)
4. Remove the Inertia use statement from the top of the file
5. Verify no other middleware files import Inertia (grep -r "use Inertia" app/Http/Middleware/)

---

## FIX 3 — CRITICAL: Old Auth Controller Still Uses Session Captcha

Priority: HIGH. Login will be inconsistent between old and new routes.

File: app/Http/Controllers/Auth/AuthenticatedSessionController.php

Problem:
Old login controller uses session-based captcha instead of
the new Redis-backed CaptchaService. Two different login flows exist.

What to do:

1. Check routes/web.php — is the old login route still active?
2. Check routes/api.php — is POST /api/v1/auth/login active and complete?
3. If the API login is complete and tested:
   - Check if any web route still needs the old login controller
   - If web.php only has public routes remaining (after Fix 5):
     the old auth controller is no longer needed
   - Mark it LEGACY or delete it depending on Fix 5 outcome
4. Do NOT modify the new AuthController — it was marked ✅ in the audit

---

## FIX 4 — CRITICAL: Clean Up Old Web Routes

Priority: HIGH. 86 web routes conflict with or duplicate API routes.

File: routes/web.php

Problem:
86 web routes are still active. Most point to old Inertia controllers.
With Inertia removed, these will crash. They also conflict with the
intention of serving everything through the API.

What to do:

1. Read the entire routes/web.php file
2. Categorize every route into one of:

   KEEP — Public routes that serve HTML (no auth required, no Inertia):
   - Home page (if served as static HTML or redirects to Next.js)
   - Any route that Next.js cannot handle (e.g. file downloads via Laravel)
   - Certificate verification if it needs server-side rendering
   - OAuth callbacks if any

   REMOVE — Routes now handled by API + Next.js:
   - All auth routes (login, logout, password reset) → handled by API
   - All student routes → handled by API + Next.js
   - All DPL/dosen routes → handled by API + Next.js
   - All admin routes → handled by API + Next.js

   REDIRECT — Routes that should redirect to Next.js:
   - If users might have old bookmarks to /mahasiswa/*
     → redirect to Next.js equivalent

3. Make the changes — keep only what MUST stay in web.php
4. Run php artisan route:list --path=web to verify remaining routes
5. Run php artisan route:list --path=api to verify API routes are intact

---

## FIX 5 — HIGH: Verify and Create Missing Public API Endpoints

Priority: HIGH. Public pages in Next.js cannot render without these.

Problem from audit Gap #15:
/api/v1/public/announcements, /api/v1/public/locations
may not exist in V1 API.

What to do:

1. Check routes/api.php for /api/v1/public/* routes
2. Check if PublicController exists in app/Http/Controllers/Api/V1/
3. If missing, create:
   - app/Http/Controllers/Api/V1/PublicController.php with:
     - announcements(): paginated, published only, no auth required
     - announcementBySlug(string $slug): single announcement, no auth
     - locations(): all active locations, no auth required
     - downloads(): active downloads, no auth required
     - verifyCertificate(string $token): certificate lookup, no auth
   - Routes: GET /api/v1/public/* — no auth middleware, throttle:60,1
   - Use existing Resource classes (AnnouncementResource, LokasiResource, etc.)
4. If already exists — verify it works correctly and mark as done

---

## FIX 6 — WARNING: Implement Missing Controller Logic

Priority: MEDIUM. Placeholder responses will confuse frontend.

Issue 1 — RekapitulasiController returns empty array:
File: app/Http/Controllers/Api/V1/Admin/RekapitulasiController.php

- Read the existing Student RekapitulasiController for reference logic
- Implement or add a clear TODO comment with expected data structure
- Do NOT return empty [] silently — return proper response with message

Issue 2 — EvaluationController validateImport() returns placeholder:
File: app/Http/Controllers/Api/V1/Dpl/EvaluationController.php

- Check if old Dpl/EvaluationController has working import logic
- If yes: port the logic to the V1 controller
- If no: return proper 501 Not Implemented response with message
  return $this->error('NOT_IMPLEMENTED', 'Fitur ini belum tersedia', 501);

Issue 3 — MonitoringController missing GPS validation:
File: app/Http/Controllers/Api/V1/Dpl/MonitoringController.php

- Read how DailyReportController handles GPS validation
- Apply the same geofence check pattern to MonitoringController::store()

Issue 4 — DashboardController switchPhase() missing Gate:
File: app/Http/Controllers/Api/V1/Admin/DashboardController.php

- Add Gate::authorize('switch-phase') or at minimum verify
  the role middleware already restricts to superadmin only
- If role middleware is sufficient, add a comment explaining why

---

## FIX 7 — GAP: Expand Pest Tests (29 → 50+)

Read all existing test files first. Do not duplicate existing tests.

Add to tests/Feature/Api/V1/Auth/AuthTest.php:

- Captcha UUID is not sequential integer
- Captcha Redis key deleted after successful verify (one-time use)
- Captcha Redis key deleted after failed verify (one-time use)  
- Login with X-App-Type: mobile returns Bearer token in response body
- Login without mobile header returns no token in response body
- Login error message does not reveal which field is wrong
- Logout deletes Bearer token from database
- Reset password uses Argon2id (assert Hash::info[$hash]('algo') === PASSWORD_ARGON2ID)

Add to tests/Feature/Api/V1/Student/StudentTest.php:

- Student cannot access /api/v1/dpl/* (403)
- Student cannot access /api/v1/admin/* (403)
- Daily reports list returns paginated meta (current_page, last_page, per_page, total)
- Create daily report returns 201 with KegiatanKknResource structure
- Create daily report with missing fields returns 422 with errors object
- Student can only edit own daily report (not another student's)

Add to tests/Feature/Api/V1/Dpl/DplTest.php:

- DPL cannot access /api/v1/admin/* (403)
- DPL only sees groups assigned to them
- DPL only sees daily reports from their assigned groups
- Approve leave request changes status correctly

Add to tests/Feature/Api/V1/Admin/AdminTest.php:

- Non-admin cannot access /api/v1/admin/* (403)
- Admin dashboard returns stats with correct structure
- Create user stores password as Argon2id (not plaintext, not SHA256)

New file — tests/Feature/Api/V1/ApiResponseEnvelopeTest.php:

- Success response always has: success=true, message, data
- Error response always has: success=false, error.code, error.message
- 422 response has error.errors with field-level messages
- Accessing nonexistent /api/v1/route returns 404 JSON envelope (not HTML)
- Unauthenticated /api/v1/student/* returns 401 JSON (not redirect)
- Authenticated request returns no stack trace on 500

New file — tests/Feature/Api/V1/PerformanceTest.php:

- GET /api/v1/student/daily-reports: assert DB query count < 5
  (use DB::enableQueryLog() before, DB::getQueryLog() after)
- GET /api/v1/dpl/groups: assert DB query count < 5
- GET /api/v1/admin/registrations: assert DB query count < 10
- Period context is in cache after first call
  (call endpoint, then assert Cache::has('period-context:...')

After writing all tests:

- Run php artisan test and confirm all pass
- Report final test count

---

## FIX 8 — GAP: Convert Public Pages to SSG/ISR

Files: apps/web/src/app/(public)/

For each public page — read it first, then convert if needed:

app/(public)/page.tsx (Home):

- Remove 'use client' directive
- Convert to async server component
- Use fetch() with next: { revalidate: 3600 }
- Add export async function generateMetadata()

app/(public)/berita/page.tsx:

- Same pattern, revalidate: 1800
- Add generateMetadata()

app/(public)/berita/[slug]/page.tsx:

- Same pattern, revalidate: 1800
- Add generateStaticParams() if announcements list is available
- Add generateMetadata() with og:title, og:description from slug data

app/(public)/unduhan/page.tsx:

- revalidate: 3600
- Add generateMetadata()

app/(public)/lokasi/page.tsx:

- revalidate: 86400 (locations rarely change)
- Add generateMetadata()

app/(public)/verify-certificate/[token]/page.tsx:

- NO revalidate (always fresh)
- Fetch at request time: fetch(url, { cache: 'no-store' })
- Add generateMetadata() with generic title

For each converted page:

- Create loading.tsx sibling (simple skeleton)
- Create error.tsx sibling (user-friendly error message in Bahasa Indonesia)

---

## FIX 9 — GAP: Create CI/CD GitHub Actions

Create .github/workflows/ at monorepo root.

.github/workflows/api.yml:

- Name: "Backend API Tests"
- Trigger: push/PR to main or develop, paths: apps/api/**
- Runner: ubuntu-latest (NOT FreeBSD — GitHub runners are Linux)
- Comment at top:

  # CI runs on ubuntu-latest. Production server is FreeBSD

  # FreeBSD deployment is handled manually via ssh + service commands

- Jobs:
  - setup: PHP 8.4, PostgreSQL service, Redis service
  - deps: composer install with cache
  - test: php artisan test --parallel
  - lint: vendor/bin/pint --test (if pint is in composer.json)
- Add workflow_dispatch for manual trigger

.github/workflows/web.yml:

- Name: "Next.js Web Build"
- Trigger: push/PR to main or develop, paths: apps/web/**, packages/**
- Runner: ubuntu-latest
- Jobs:
  - setup: Node.js (match version in package.json engines), pnpm cache
  - deps: pnpm install --frozen-lockfile
  - type-check: pnpm --filter web tsc --noEmit
  - lint: pnpm --filter web lint
  - build: pnpm --filter web build
- Add workflow_dispatch

.github/workflows/mobile.yml:

- Name: "React Native Type Check"
- Trigger: push/PR to main, paths: apps/mobile/**, packages/**
- Runner: ubuntu-latest
- Jobs:
  - setup: Node.js, pnpm cache
  - deps: pnpm install --frozen-lockfile
  - type-check: pnpm --filter mobile tsc --noEmit
  - lint: pnpm --filter mobile lint
- Add comment:

  # APK/IPA builds use EAS Build (Expo Application Services)

  # Run manually: cd apps/mobile && npx eas build --platform android

- Add workflow_dispatch

.github/workflows/packages.yml:

- Name: "Shared Packages Build"
- Trigger: push/PR to main or develop, paths: packages/**
- Runner: ubuntu-latest
- Jobs:
  - build all 5 packages in correct dependency order:
    1. shared-types (no deps)
    2. constants (no deps)
    3. schemas (depends on shared-types)
    4. api-client (depends on shared-types)
    5. hooks (depends on api-client, shared-types, constants)
  - type-check all packages
- Add workflow_dispatch

---

## FIX 10 — GAP: Push Notification Scaffold

This is scaffold only. Do not implement business logic.
Full testing requires a physical device.

Create apps/mobile/lib/notifications.ts:

- registerForPushNotifications():
  - Check if device is physical (Expo.isDevice)
  - Request notification permission
  - Get Expo push token
  - Return token string or null
- setupNotificationChannels():
  - Android only
  - Create channels: 'reports' (daily report updates),
    'announcements' (new announcements), 'grades' (grade updates)
- handleNotificationReceived(notification): console.log for now
- handleNotificationResponse(response):
  - Extract data.screen from notification
  - Log for now — navigation will be wired in a later phase

Update apps/mobile/app/_layout.tsx:

- On mount: call registerForPushNotifications()
- If token returned: POST to /api/v1/notifications/register-device
- Set up addNotificationReceivedListener
- Set up addNotificationResponseReceivedListener
- Clean up listeners on unmount

Verify in apps/api/ — create if missing:

- POST /api/v1/notifications/register-device
  Body: { token, platform: 'ios'|'android', device_id }
  Auth: auth:sanctum
  Logic: upsert device token for current user
  Response: { success: true, message: 'Device registered' }
- Create DeviceToken model + migration if not exists:
  Table: device_tokens
  Columns: id, user_id (FK), token (string), platform (enum),
           device_id (string), created_at, updated_at

---

## FIX 11 — GAP: Mobile GPS Integration

File: apps/mobile/app/(tabs)/ — find the daily report create screen

Problem: expo-location is in package.json but not used in any screen.

What to do:

1. Find the daily report create screen (likely DailyReportCreateScreen
   or similar in (tabs)/)
2. Add GPS integration:
   - Request location permission on screen mount
   - Add "Get Current Location" button
   - On press: call Location.getCurrentPositionAsync()
   - Store lat/lng in form state
   - Display coordinates to user for confirmation
   - Include coordinates in form submission
3. Handle permission denied gracefully:
   - Show message in Bahasa Indonesia
   - Allow manual coordinate entry as fallback
4. Do NOT add geofence validation on mobile —
   server-side validation already exists in DailyReportController

---

## VERIFICATION CHECKLIST

After all fixes, verify:

Backend:
□ grep -r "Inertia::" app/ → zero results (except any LEGACY marked files)
□ grep -r "use Inertia" app/Http/Middleware/ → zero results
□ php artisan route:list → no broken controller references
□ php artisan test → all tests pass, count 50+
□ php artisan config:cache → no errors
□ php artisan route:cache → no errors

Frontend:
□ pnpm --filter web build → zero errors
□ pnpm --filter web tsc --noEmit → zero TypeScript errors
□ pnpm --filter mobile tsc --noEmit → zero TypeScript errors
□ Public pages have no 'use client' directive
□ Public pages have generateMetadata() export
□ Public pages have loading.tsx and error.tsx siblings

CI/CD:
□ .github/workflows/ has 4 files (api, web, mobile, packages)
□ All workflows have workflow_dispatch

---

## OUTPUT FORMAT PER FIX

FIX [N] — [NAME]
Status: Complete / Partial / Skipped (reason)

Files deleted: (list)
Files created: (list with brief description)
Files modified: (list with what changed)

Bugs resolved: (reference audit bug number)
Gaps resolved: (reference audit gap number)

Remaining issues: (anything that needs manual verification or team decision)

---

## FINAL SUMMARY TABLE

After all fixes, output:

| Fix | Status | Bugs Resolved | Gaps Resolved | Notes |
|-----|--------|---------------|---------------|-------|
| 1 — Remove old controllers | | #1, #4 | #1 | |
| 2 — Middleware Inertia | | #2 | | |
| 3 — Old auth controller | | #3 | | |
| 4 — Clean web routes | | #5, #6 | #2 | |
| 5 — Public API endpoints | | | #15 | |
| 6 — Controller placeholders | | | | |
| 7 — Tests 50+ | | | #7, #8, #9 | |
| 8 — SSG/ISR public pages | | | #3, #10, #11 | |
| 9 — CI/CD | | | #4 | |
| 10 — Push notif scaffold | | | #5, #6 | |
| 11 — Mobile GPS | | | #13 | |

Then output updated counts:

- Remaining ❌ bugs: N
- Remaining ⚠️ warnings: N
- Remaining 🔲 gaps: N
- Total Pest tests: N
- TypeScript errors: N

---

Begin with Fix 1. Read the old controllers directory
and the Api/V1 controllers directory before doing anything.
Report what you find before making any deletions.
