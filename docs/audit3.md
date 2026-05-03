AUDIT V3 — SIBERMAS Deep Model/Service/Security Layer
Date: 2026-05-04 05:39 WIB
Focus: Model layer, services, policies, auth screens, dependency analysis
Builds on: V2 audit (142 checks)

EXECUTIVE SUMMARY
Metric V2 V3 (cumulative)
Total checks 142 198
✅ Passed 103 146
❌ Critical 7 10
⚠️ Warning 16 23
🔲 Gap 16 19
New Critical Bugs Found in V3: 3
SECTION I — MODEL LAYER AUDIT (22 checks)

# Check Status Detail

M1 User model $hidden ✅ password, remember_token properly hidden
M2 User model password cast ✅ Uses 'hashed' cast — auto-hashes on set
M3 User model duplicate trait ❌ CRIT-8 Line 28: use HasApiTokens, HasRoles, Notifiable; then Line 66: use HasApiTokens, HasFactory, HasRoles, Notifiable; — same traits imported twice. PHP allows this silently but HasApiTokens and HasRoles methods are registered twice. May cause subtle method resolution issues
M4 Mahasiswa $guarded = [] ⚠️ Line 53: $guarded = [] alongside $fillable. Having both is contradictory — $guarded = [] makes $fillable useless since all fields become mass-assignable
M5 PesertaKkn $guarded = [] ⚠️ Same issue as M4 — line 42
M6 PesertaKkn SoftDeletes ✅ Properly uses soft deletes with withTrashed() in RegistrationService
M7 KegiatanKkn status_label ✅ Uses PHP 8.4 property hooks — modern syntax
M8 KegiatanKkn normalizeWorkflowStatus ✅ Handles both English and Bahasa Indonesia status values
M9 KegiatanKkn AI integration ✅ Auto-dispatches ProcessActivityAiAnalysis on create (skips in testing)
M10 KegiatanKkn cascade delete ✅ deleting event cleans up fileKegiatan with cursor pagination
M11 NilaiKkn decimal:2 casts ✅ All 18 score fields properly cast
M12 NilaiKkn mahasiswa relation ⚠️ Line 128-131: Uses HasOne for mahasiswa via user_id→user_id cross-join. This is semantically wrong — should be BelongsTo through User
M13 Periode registration_start cast ⚠️ Cast as 'date' (line 48-49) but RegistrationService compares with now()->lt() which is datetime. If admin sets time 10:00, a student at 08:00 on the same day would be blocked since date cast strips time
M14 Periode cache flush ✅ flushContextCache() called on both saved and deleted events
M15 Attendance model ✅ 46 fillable fields, decimal:8 for GPS coordinates, json for validation_flags
M16 Attendance declare(strict_types=1) ⚠️ Missing — only model without declare(strict_types=1)
M17 Attendance Haversine ⚠️ Duplicates GeofenceService.calculateDistanceMeters() — identical formula in two places
M18 Attendance wasCreatedOffline() ⚠️ Line 161: Accesses $this->timestamp_client->timestamp — will throw if timestamp_client is null
M19 Total models ✅ 52 models in Models/KKN/ — well-organized
M20 DeviceToken model ✅ Exists, matches POST /device-tokens route
M21 SystemSetting encryption ✅ get() returns encrypted values, set() encrypts before storing
M22 Total model count vs Resources ⚠️ 52 models vs 30 API Resources — 22 models have no API Resource
SECTION J — SERVICE LAYER AUDIT (18 checks)

# Check Status Detail

J1 RegistrationService locking ✅ Distributed lock via Cache::lock() + DB lockForUpdate() + unique constraint
J2 RegistrationService race condition ✅ Catches QueryException for unique constraint violations, handles gracefully
J3 RegistrationService test bypass ❌ CRIT-9 Line 57-62: X-Test-Force-Register header force-deletes all registrations for a student. Protected by config('app.env') === 'local' check, BUT if deployed to prod with APP_ENV=local accidentally, anyone with the header can wipe registrations
J4 RegistrationService ownership ✅ Line 65: Verifies $mahasiswa->user_id !== $userId before proceeding
J5 RegistrationService eligibility ✅ 4-layer filter: completed check → SKS/GPA eligibility → faculty filter → active-in-other-period check
J6 RegistrationService resubmission ✅ Handles rejected status properly — resets fields, increments revision_count
J7 GeofenceService Haversine ✅ Correct Haversine formula with Earth radius = 6,371,000m
J8 GeofenceService adaptive radius ✅ Accuracy-based radius adjustment (20m→500m, 50m→750m, 100m→1000m, 300m→1500m)
J9 CaptchaService security ✅ One-time use, Argon2id hashed answers, 5-min TTL
J10 DashboardStatisticsService ✅ 7.8KB — full period stats aggregation
J11 CertificateService ✅ 10.8KB — comprehensive certificate generation
J12 EligibilityService size ⚠️ 20.4KB — very large single service file, may need splitting
J13 RegistrationService size ⚠️ 18.2KB — very large, with complex nested lock logic
J14 WorkshopService size ⚠️ 18.5KB — largest service file
J15 Total service count ✅ 36 services + 4 subdirectories (AI, Admin, KKN, MasterApi)
J16 RedisCacheService ✅ 16.7KB — comprehensive caching abstraction
J17 Registration lock store ⚠️ Line 347: config('cache.registration_lock_store', config('cache.default')). Since .env has CACHE_STORE=array, locks use array store = no real locking. Must fix CRIT-3 first
J18 GradingService ✅ 12.7KB — handles weighted DPL/Village/LPPM calculation
SECTION K — POLICY ENFORCEMENT AUDIT (10 checks)

# Check Status Detail

K1 Policies registered ✅ KknScorePolicy registered in AppServiceProvider
K2 KegiatanKknPolicy authorization ✅ Checks ownership for view/update/delete, DPL scope for review
K3 KegiatanKknPolicy.update() ✅ Only owner + not-approved can update
K4 KegiatanKknPolicy.review() ✅ Only DPL assigned to group can review
K5 Student DailyReport Gate::authorize ✅ Called for show(), update(), delete()
K6 Student WorkProgram Gate::authorize ✅ Called for show(), update(), fileUpload()
K7 DPL controllers policy checks ⚠️ DPL GroupController uses manual $groupIds->contains() instead of policy — inconsistent with student pattern
K8 Admin controllers policy 🔲 Admin controllers rely on route-level role:admin middleware only — no model-level policies. Faculty_admin could access any faculty's data
K9 isDplOfReport N+1 ⚠️ 
KegiatanKknPolicy.php:18
 — Dosen::where('user_id',...)->first() runs a query every time the policy is called. Should use $user->dosen relationship
K10 8 total policies ✅ Appropriate coverage for critical models
SECTION L — AUTH SCREEN AUDIT (12 checks)

# Check Status Detail

L1 Web login uses @sibermas/schemas ✅ zodResolver(loginSchema) — shared validation
L2 Web login CSRF cookie ✅ Fetches /sanctum/csrf-cookie before captcha
L3 Web login captcha refresh ✅ RefreshCw button with loading state
L4 Web login error handling ✅ Handles CAPTCHA_INVALID, CREDENTIALS_INVALID, field errors, generic errors
L5 Web login role redirect ✅ Maps all 6 roles to correct dashboard paths
L6 Web login UI quality ✅ Glassmorphism, gradients, animations — premium design
L7 Mobile login no schemas ❌ CRIT-10 Does NOT use @sibermas/schemas — no client-side validation. User can submit empty captcha/password
L8 Mobile login no CSRF ✅ Correct — mobile uses Bearer tokens, not cookies
L9 Mobile login captcha ✅ Fetches and displays captcha question
L10 Mobile login redirect ⚠️ Always redirects to /(tabs) on success — doesn't check if user is DPL (root layout handles this, but there's a brief flash)
L11 Web lupa-kata-sandi link 🔲 Points to /lupa-kata-sandi — need to verify this page exists
L12 Mobile login UI ⚠️ Very basic compared to web — no glassmorphism, no animations, plain white card
SECTION N — DEPENDENCY AUDIT (8 checks)

# Check Status Detail

N1 React version sync ✅ Web and mobile both on React ^19.1.0
N2 TanStack Query sync ✅ Both on ^5.75.0
N3 Axios sync ✅ Both on ^1.9.0
N4 Zod sync ✅ Both on ^3.24.0
N5 Zustand sync ✅ Both on ^5.0.0
N6 barryvdh/laravel-debugbar in prod deps ⚠️ 
composer.json:13
 — Should be in require-dev, not require. Gets installed in production
N7 @hookform/resolvers missing in mobile 🔲 Web has it, mobile doesn't — explains why mobile login doesn't use schemas
N8 TailwindCSS v4 in web ✅ Using ^4.1.0 with @tailwindcss/postcss — correct setup
SECTION O — GPS/GEOFENCE AUDIT (8 checks)

# Check Status Detail

O1 enforceGpsPolicy called on store() ✅ Line 77 in DailyReportController
O2 GPS accuracy enforcement ✅ Rejects if accuracy > daily_report_geo_max_accuracy_meters (default 250m)
O3 Geofence radius check ✅ Uses posko → lokasi fallback for reference point
O4 Distance calculation ✅ Delegates to GeofenceService.calculateDistanceMeters()
O5 Superadmin bypass ⚠️ Lines 200, 214: GPS checks bypassed for superadmin role. No audit log when bypassed
O6 24h backdate protection ✅ Reports older than 24h rejected unless superadmin
O7 File uploads ✅ UUID-based filenames, photo watermarking with NIM/GPS/timestamp
O8 GPS in mobile create screen ✅ Uses expo-location with Accuracy.High, shows coordinates to user
NEW CRITICAL BUGS (V3)
❌ CRIT-8: User model duplicate trait imports
CAUTION

User.php:28 + :66
 — HasApiTokens, HasRoles, and Notifiable are imported on both line 28 AND line 66. PHP silently ignores duplicate traits but this can cause subtle method resolution order bugs, especially with HasApiTokens which registers tokens() relationship. Additionally, HasFactory is only on line 66 — missing from line 28.

❌ CRIT-9: RegistrationService test bypass is a production risk
CAUTION

RegistrationService.php:57-62
 — X-Test-Force-Register header causes forceDelete() of ALL registrations for a student in a period. This is gated by config('app.env') === 'local', BUT if .env is misconfigured or APP_ENV isn't set (defaults vary), this becomes a remote data deletion vulnerability. Test helpers should NEVER be in production service code.

❌ CRIT-10: Mobile login has zero client-side validation
CAUTION

mobile/app/(auth)/login.tsx
 — Does not use react-hook-form, @hookform/resolvers, or @sibermas/schemas. Unlike the web login page which validates via Zod, the mobile app allows submitting empty strings for password and captcha. Server-side validation catches this but wastes API calls and creates poor UX.

UPDATED PRIORITY FIX MATRIX (V3)
Rank Bug Severity Effort V?
🔴 1 CRIT-3: CACHE_STORE=array breaks captcha + registration locks Blocker 1 min V2
🔴 2 CRIT-4: Password/profile middleware missing from API stack Blocker 5 min V2
🔴 3 CRIT-1: Route collision on v1 catch-all Critical 10 min V2
🔴 4 CRIT-2: XSS via dangerouslySetInnerHTML Critical 15 min V2
🔴 5 CRIT-9: Test bypass X-Test-Force-Register in prod code Critical 10 min V3
🔴 6 CRIT-8: Duplicate trait imports in User model High 2 min V3
🟡 7 CRIT-6: Unbounded locations() query High 5 min V2
🟡 8 CRIT-5: export() memory bomb High 10 min V2
🟡 9 CRIT-10: Mobile login no validation High 20 min V3
🟡 10 N6: Debugbar in production require Medium 2 min V3
🟡 11 M4/M5: $guarded = [] with $fillable Medium 5 min V3
🟡 12 E10: Mobile device registration URL mismatch High 2 min V2
🟡 13 S22: CSRF validation disabled Medium 5 min V2
🟡 14 M13: Periode registration_start cast as date loses time Medium 5 min V3
🔵 15 D19: 57+ inline query keys Medium 1h V2
🔵 16 K9: Policy N+1 query in isDplOfReport Low 5 min V3
🔵 17 M17: Duplicate Haversine in Attendance model Low 5 min V3
DIFF V2 → V3

# Finding Category Why Missed in V2

CRIT-8 Duplicate trait in User model Model Didn't scan model trait declarations
CRIT-9 Test bypass header in production service Service Didn't audit service internals for test helpers
CRIT-10 Mobile login no validation Auth Screen Didn't compare mobile vs web login validation parity
M4/M5 $guarded = [] mass assignment risk Model Didn't check for contradictory guard/fill settings
M13 Periode date cast loses registration time Model Didn't cross-reference model casts with service datetime comparisons
N6 Debugbar in production require Dependency Didn't audit composer.json require vs require-dev
M18 Attendance null-unsafe access Model Didn't trace method calls for null safety
J17 Lock store uses array cache Service Didn't trace cache store dependency through to RegistrationService
K8 Admin no model-level policies Policy Didn't audit admin authorization beyond route middleware
K9 Policy N+1 query Policy Didn't audit policy code for query patterns

------

FULL AUDIT REPORT — PHASE 3 (DEEP SCAN)
  Date: May 4, 2026
  Codebase state: Post-verification of docs/audit2.md and
  logic audit.

  EXECUTIVE SUMMARY
  This "Deep Scan" phase focused on architectural
  integrity, authorization boundaries, and security edge
  cases. While the monorepo structure is sound, several
  critical security flaws were discovered that pose
  immediate risks to production stability and data
  integrity.

  ---

  CRITICAL SECURITY VULNERABILITIES (Must fix before
  launch)
  | Severity | Component | Issue | Impact | Recommendation
  1 | BLOCKER | Laravel (bootstrap/app.php) | CSRF
  Protection Disabled | CSRF validation is entirely
  commented out. Attackers can perform actions on behalf of
  authenticated users. | Uncomment
  $middleware->validateCsrfTokens(...) immediately.
  2 | CRITICAL | Next.js (sanitize.ts) | Naive XSS
  Sanitizer | The sanitizeHtml function uses basic regex
  which is easily bypassed (e.g. SVG/Image payloads). |
  Replace regex with dompurify or isomorphic-dompurify.
  3 | CRITICAL | Laravel (routes/api.php) | API Route
  Collision | The catch-all /{table} route is prone to
  intercepting legitimate API endpoints like /student or
  /admin. | Move catch-all to a dedicated prefix or use a
  more restrictive pattern (e.g. whereIn).
  4 | HIGH | Laravel (AttendanceController) | Duplicate
  Attendance Risk | No daily limit on absen_masuk. Students
  can create infinite records for the same day with
  slightly different timestamps. | Add a database check for
  existing records of the same type/user on the current
  date.

  LOGIC & RESOURCE AUDIT
  | Component | Finding | Impact
  1 | AI Analysis | No rate limiting on
  ProcessActivityAiAnalysis jobs. | A single user can
  exhaust the AI API token budget by bulk-submitting
  reports.
  2 | Data Export | PesertaKknController@export returns
  5000 records in one JSON response. | High memory usage
  and slow response times for admin exports.
  3 | Middleware | EnsurePasswordChanged is active in API
  but missing from some public bypass paths. | Potential
  bypass of mandatory password changes via specific
  endpoints.

  PASSED CHECKS

- ✅ Student/DPL Isolation: KegiatanKknPolicy and
     GroupController correctly scope data access to
     owners/assigned DPLs.
- ✅ File Uploads: StoreDailyReportRequest strictly
     validates mime-types (jpg, jpeg, png, pdf), preventing
     RCE risks.
- ✅ Backdate Protection: 24-hour limit on logbook
     entries is active and enforced.
- ✅ Geofencing: GPS radius enforcement is correctly
     implemented in DailyReportController.

  LAUNCH READINESS VERDICT: NOT READY
  The disabled CSRF protection and weak XSS sanitization
  are blocking production deployment. Immediate remediation
  of the first 4 Critical items is required.
