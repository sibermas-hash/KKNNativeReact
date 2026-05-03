You are a senior code auditor. Your job is to validate the entire
SIBERMAS migration — verify that every component built by the AI agent
is correct, complete, and consistent. You are looking for bugs,
missing pieces, inconsistencies, and deviations from the spec.

Read MIGRATION_DOCUMENTATION.md as the source of truth.
Read the actual codebase. Compare the two. Report everything you find.

Do NOT fix anything in this audit pass.
Your job is ONLY to read, verify, and report.
Fixes come after the audit report is reviewed.

---

## AUDIT SCOPE

### Audit 1 — API Contract Consistency

For every API endpoint listed in MIGRATION_DOCUMENTATION.md:

- Does the route actually exist in routes/api.php (or sub-files)?
- Does the controller method actually exist?
- Does the controller method return the correct Resource class?
- Does the response use the ApiResponse trait correctly?
- Is the middleware correct (auth:sanctum, correct role)?

Report format per endpoint:
✅ GET /api/v1/student/dashboard — route exists, controller exists,
   returns correct resource, correct middleware
❌ GET /api/v1/student/certificates — route exists, controller exists,
   BUG: returns raw array instead of SertifikatKknResource
⚠️ POST /api/v1/dpl/evaluations — route exists, controller exists,
   MISSING: no rate limiting middleware

---

### Audit 2 — API Resource Completeness

For every Resource class in app/Http/Resources/Api/V1/:

- Does toArray() explicitly list all fields? (no wildcard merges)
- Do the field names match what the frontend TypeScript interfaces expect?
- Are relationships conditionally loaded? (whenLoaded, not always)
- Are there any fields that expose sensitive data? (passwords, tokens)

Report each resource with ✅ / ❌ / ⚠️

---

### Audit 3 — Authentication & Security

Check AuthController:

- Is captcha verified BEFORE credential check? (order matters)
- Is Hash::check() used for captcha (not ==)?
- Is the captcha Redis key deleted immediately after verification?
- Does login NOT reveal which field is wrong (user vs password)?
- Does mobile detection use X-App-Type header correctly?
- Does web login set correct Sanctum cookie?
- Does mobile login return Bearer token?

Check all middleware:

- Does every protected middleware return JSON (not redirect) for API routes?
- Does EnsurePhase return PHASE_BLOCKED code?
- Does EnsureProfileCompleted return PROFILE_INCOMPLETE code?
- Does EnsurePasswordChanged return PASSWORD_CHANGE_REQUIRED code?

Check config/hashing.php:

- Driver is argon2id?
- Memory, threads, time configured?

Check for any place where:

- Password or captcha answer is stored in plaintext
- SHA256 is used for passwords (must never happen)
- Token or secret is hardcoded in code

---

### Audit 4 — Frontend TypeScript Integrity

In apps/web/:

- Run mental TypeScript check on key files:
  - stores/index.ts: does authStore match UserResource fields?
  - lib/api.ts: does the Axios instance have correct interceptors?
  - All layout files: do they correctly check role before rendering?
  - Login page: does it fetch captcha and handle expiry?

Check for:

- Any component that calls axios directly (should use api-client package)
- Any hardcoded API URLs (should use env vars)
- Any inline query key strings (should use QUERY_KEYS constants)
- Any useEffect + useState used for server data
  (should use TanStack Query)
- Any page missing loading skeleton
- Any mutation missing onError handling

In apps/mobile/:

- Does auth store use expo-secure-store for token?
- Does api.ts inject Bearer token from secure store?
- Does _layout.tsx handle unauthenticated state correctly?

---

### Audit 5 — Shared Packages Integrity

packages/shared-types/:

- Does every interface in models.ts have a corresponding
  Laravel model in app/Models/KKN/?
- Are there any fields typed as any? (must be zero)
- Does ApiResponse<T> and PaginatedResponse<T> match the
  actual envelope format from ApiResponse.php trait?

packages/api-client/:

- Does every endpoint function exist for every route in the API?
- Are there routes in api.php with no corresponding
  function in api-client?
- Are there api-client functions calling non-existent routes?
- Does the web client use withCredentials: true?
- Does the mobile client inject Bearer token?

packages/schemas/:

- Does every Zod schema match the corresponding
  Laravel FormRequest validation rules?
- Are error messages in Bahasa Indonesia?
- Are there forms in apps/web/ or apps/mobile/ that have
  no corresponding schema?

packages/hooks/:

- Does every hook use QUERY_KEYS constants (not inline strings)?
- Is staleTime set on every useQuery call?
- Do all mutation hooks call queryClient.invalidateQueries on success?

packages/constants/:

- Are ALL query keys used in packages/hooks/ defined in QUERY_KEYS?
- Are there query keys used in apps/web/ or apps/mobile/ that
  are not in the constants package?

---

### Audit 6 — Database & Migration Integrity

Check the performance indexes migration:

- Do all indexed columns actually exist in their respective tables?
- Are there any duplicate indexes (column already had an index)?
- Are there N+1 risks that were identified but NOT fixed?

Check all API controllers that return collections:

- Is paginate() used? (not get() for potentially large datasets)
- Is with() used for all relationships accessed in the Resource?
- Are there any raw DB::select() calls without proper bindings?

---

### Audit 7 — Test Coverage Gaps

Read all test files. For each test:

- Does it actually test what it claims to test?
- Is the assertion specific enough? (not just assertStatus(200))
- Is the response envelope structure verified?

Find what is NOT tested:

- List all API endpoints with zero test coverage
- List all business rules with zero test coverage
  (registration race condition, captcha one-time use,
   role-based access, phase blocking, profile completion)

---

### Audit 8 — Monorepo & Build Integrity

Check turbo.json:

- Are all apps and packages included in the pipeline?
- Are build dependencies correct (^build for downstream packages)?

Check each package.json in packages/*:

- Is the name @sibermas/{name}?
- Are peerDependencies correct?
- Is main pointing to the correct entry file?

Check apps/web/next.config.ts:

- Are all @sibermas/* packages in transpilePackages?

Check apps/mobile/app.config.ts:

- Are bundle identifiers set correctly?
- Is apiUrl in extra config?

Check tsconfig.base.json:

- Is strict: true?
- Are path aliases correct for all packages?
- Does each app/package extend tsconfig.base.json?

---

### Audit 9 — Inertia Removal Verification

Verify Inertia is completely removed:

- grep -r "Inertia::" app/ → must return zero results
- grep -r "inertia" composer.json → must return zero results
- grep -r "@inertiajs" package.json → must return zero results
- grep -r "from '@inertiajs" apps/web/src/ → must return zero results
- grep -r "usePage()" apps/web/src/ → must return zero results
- grep -r "useForm()" apps/web/src/ → must return zero results
  (Inertia useForm, not React Hook Form)
- grep -r "router.visit" apps/web/src/ → must return zero results
- grep -r "ziggy" apps/api/ → must return zero results
- grep -r "route()" apps/web/src/ → must return zero results
  (Ziggy route helper)
- HandleInertiaRequests.php → must not exist

Report each grep result clearly.

---

### Audit 10 — Remaining Gaps from Documentation

Section 17 of MIGRATION_DOCUMENTATION.md lists 6 remaining gaps.
For each gap, verify current implementation status:

1. Mobile GPS native (expo-location)
   - Is expo-location in apps/mobile/package.json?
   - Is it called in the daily report create screen?
   - Is location permission requested?

2. Mobile offline queue
   - Is there any offline queue implementation in apps/mobile/?
   - Is AsyncStorage used for queuing?
   - Is there a sync mechanism?

3. Push notifications
   - Is expo-notifications in package.json?
   - Is registerForPushNotifications() implemented?
   - Is there a device token registration API endpoint?

4. Pest tests (50+)
   - What is the current test count?

5. CI/CD GitHub Actions
   - Does .github/workflows/ exist?
   - Are all 4 workflow files present?

6. Public SSR (SSG/ISR)
   - Are public pages server components?
   - Do they use revalidate?
   - Do they have generateMetadata()?

---

## FINAL AUDIT REPORT FORMAT

Produce a structured report with this format:

## AUDIT REPORT — SIBERMAS MIGRATION VALIDATION

Date: [today]
Auditor: AI Code Auditor

### SUMMARY

Total checks performed: N
✅ Passed: N
❌ Failed (bugs): N  
⚠️ Warnings (incomplete/suboptimal): N
🔲 Not implemented (gaps): N

### CRITICAL BUGS (must fix before launch)

For each: File, Line/Method, Description, Expected vs Actual, Suggested fix

### WARNINGS (should fix before launch)

For each: File, Description, Recommendation

### GAPS (incomplete features)

For each: Feature, Current state, What is missing

### PASSED (correctly implemented)

Grouped summary by audit section

### RECOMMENDED FIX ORDER

Prioritized list of what to fix first based on:

1. Security issues
2. Data integrity issues
3. User-facing bugs
4. Missing functionality
5. Code quality issues

---

Do NOT make any code changes during this audit.
Read only. Report everything. Be specific — file names,
method names, line references where possible.
Vague findings like "some components may have issues"
are not acceptable — be precise or say you could not determine.
