You are a senior monorepo architect. Your task is to set up a Turborepo
monorepo for an existing project. Read the entire current codebase structure
before doing anything. Do not assume — verify first.

---

## CRITICAL RULE

Do NOT scaffold blindly. Before creating any file or folder:

1. Read the current project structure completely
2. Understand what already exists
3. Move existing code into the monorepo structure — do not duplicate
4. If something already exists and works, keep it — only restructure
5. If you are unsure where something belongs, STOP and ask

---

## PROJECT CONTEXT

Project name: sibermas (KKN management system — UIN SAIZU)
Live URL: sibermas.uinsaizu.ac.id
Server OS: FreeBSD
Current state: Laravel + Inertia.js + React 19 + TypeScript (existing, live)
Target state: Turborepo monorepo containing Laravel API + Next.js + React Native Expo

All shell commands must be FreeBSD-compatible:

- Package manager: pkg (NOT apt, NOT yum)
- Service: service {name} start|stop|restart
- Boot config: sysrc {name}_enable="YES"
- Node.js: verify via node --version before assuming version
- Never use systemctl, never use Linux-only paths

---

## TARGET MONOREPO STRUCTURE

After setup, the repo must look exactly like this:

sibermas/
├── turbo.json
├── package.json                    ← workspace root (no app code here)
├── .gitignore                      ← covers all apps + packages
├── .env.example                    ← documents all required env vars
│
├── apps/
│   ├── api/                        ← existing Laravel app moved here
│   ├── web/                        ← Next.js (scaffold only in this task)
│   └── mobile/                     ← React Native Expo (scaffold only)
│
└── packages/
    ├── shared-types/               ← TypeScript interfaces
    ├── api-client/                 ← Axios instances + endpoint functions
    ├── schemas/                    ← Zod validation schemas
    ├── hooks/                      ← shared React hooks
    └── constants/                  ← query keys, labels, maps, config

---

## STEP-BY-STEP TASKS

### Step 1 — Read Current Structure

Before anything else:

- Map the full current directory tree
- Identify where the Laravel app currently lives (root level or subfolder)
- Identify any existing package.json files and their workspace configs
- Identify any existing tsconfig.json files
- Identify any existing .gitignore files
- Identify any existing .env files
- Report your findings clearly before proceeding

### Step 2 — Initialize Monorepo Root

Create the root package.json as a workspace root:

- name: sibermas-monorepo
- private: true
- packageManager: pnpm (preferred) or npm workspaces — choose based on
  what is already installed and available on FreeBSD
- workspaces: ["apps/*", "packages/*"]
- scripts: dev, build, lint, test — all delegated to Turborepo
- No application dependencies at root level

Verify pnpm or npm is available:

- Check: pnpm --version or npm --version
- If pnpm is not installed: pkg install node npm, then npm install -g pnpm
- Use whichever is available and appropriate for FreeBSD

### Step 3 — Create turbo.json

Configure Turborepo pipeline:

- build: depends on upstream builds (^build), outputs dist/**and .next/**
- dev: persistent: true, no cache
- lint: no upstream dependency, cache enabled
- test: depends on build, cache enabled
- type-check: cache enabled

### Step 4 — Move Laravel into apps/api/

Read the current Laravel app location first.
If Laravel is at root level → move all Laravel files into apps/api/
If Laravel is already in a subfolder → move or symlink appropriately

After moving:

- Verify composer.json is intact at apps/api/composer.json
- Verify apps/api/.env or apps/api/.env.example exists
- Verify apps/api/artisan is executable
- Add apps/api to .gitignore exclusions: apps/api/vendor/, apps/api/storage/logs/
- Do NOT add a package.json to apps/api — Laravel has no Node dependency
- Confirm: php artisan --version still works from apps/api/

### Step 5 — Scaffold apps/web/ (Next.js)

Create a minimal Next.js scaffold — do NOT build pages yet,
that is done in a separate phase.

Requirements:

- Next.js App Router
- TypeScript with strict: true
- Tailwind CSS
- ESLint
- Dependencies to install: axios, @tanstack/react-query,
  @tanstack/react-query-devtools, zustand, react-hook-form,
  zod, @hookform/resolvers, react-hot-toast
- next.config.ts: configure transpilePackages for all @sibermas/* packages
- tsconfig.json: include path aliases for @sibermas/* packages via workspace
- Create only: app/layout.tsx, app/page.tsx (placeholder),
  app/not-found.tsx — nothing else

### Step 6 — Scaffold apps/mobile/ (React Native Expo)

Create a minimal Expo scaffold — do NOT build screens yet.

Requirements:

- Expo SDK (latest stable at time of execution)
- TypeScript with strict: true
- Expo Router (file-based navigation)
- Dependencies to install: axios, @tanstack/react-query, zustand,
  react-hook-form, zod, @hookform/resolvers, expo-secure-store,
  expo-router, @react-navigation/native
- app.config.ts: set name, slug, version, bundle identifiers
- tsconfig.json: include path aliases for @sibermas/* packages
- Create only: app/_layout.tsx, app/index.tsx (placeholder) — nothing else
- Verify all packages are compatible with FreeBSD development environment
  (flag any package with Linux-only native bindings)

### Step 7 — Create packages/shared-types/

Extract all existing TypeScript interfaces from the current codebase.
Look in: resources/js/types/, anywhere .d.ts or interface definitions exist.

Create these type files based on what you find:

- models.ts: User, Mahasiswa, Dosen, Periode, JenisKkn, KelompokKkn,
  PesertaKkn, KegiatanKkn, ProgramKerja, LaporanAkhir, NilaiKkn,
  Evaluasi, Lokasi, SertifikatKkn, Announcement, Attendance,
  PeriodContext, DplPeriod
- api.ts: ApiResponse<T>, PaginatedResponse<T>, ApiError, PaginationMeta
- index.ts: re-export everything

Rules:

- Base every interface on the actual models and API Resources in the codebase
- Do not invent fields — only include what actually exists
- If a field exists in the model but you are unsure of the type, use unknown
  and add a comment flagging it for review
- package.json: name @sibermas/shared-types, main: src/index.ts
- tsconfig.json: strict true, module ESNext, no emit (types only)

### Step 8 — Create packages/api-client/

Create the Axios-based API client with dual-mode support.

Structure:

- src/web.ts: createWebClient() — withCredentials: true, XSRF token handling,
  base URL from NEXT_PUBLIC_API_URL env var
- src/mobile.ts: createMobileClient(getToken) — Bearer token injection,
  base URL from Expo Constants extra.apiUrl
- src/interceptors.ts: shared interceptor logic
  - 401: emit logout event (do not hardcode redirect — let the app handle it)
  - 422: extract and return errors object
  - Response: unwrap envelope (extract data from { success, data, meta })
- src/endpoints/: one file per domain
  - auth.ts: captcha, login, logout, user, forgotPassword, resetPassword
  - student.ts: dashboard, dailyReports, workPrograms, registration,
    certificates, leaveRequests, finalReport, evaluation
  - dosen.ts: dashboard
  - dpl.ts: dashboard, groups, dailyReports, evaluations,
    finalReports, monitoring, leaveRequests
  - admin.ts: dashboard, users, mahasiswa, dosen, periods,
    registrations, groups, grades, reports, settings
  - profile.ts: getProfile, updateProfile, changePassword, updateAvatar
- src/index.ts: re-export all endpoint modules + client factories

Rules:

- All endpoint functions must be typed using @sibermas/shared-types
- No hardcoded URLs anywhere — always use env vars
- No axios calls outside of this package — all components
  must import from here
- package.json: name @sibermas/api-client,
  peerDependencies: axios, @sibermas/shared-types

### Step 9 — Create packages/schemas/

Create Zod schemas for all forms. Base these on the actual
form fields found in the existing React components in resources/js/Pages/.

Read the existing forms first, then create:

- auth.ts: loginSchema (username, password, captcha_id, captcha_answer),
  forgotPasswordSchema, resetPasswordSchema, changePasswordSchema
- daily-report.ts: createDailyReportSchema, editDailyReportSchema
- work-program.ts: createWorkProgramSchema
- registration.ts: registrationSchema (match actual form fields in codebase)
- evaluation.ts: evaluationSchema, bulkEvaluationSchema
- profile.ts: updateProfileSchema, avatarSchema
- leave-request.ts: createLeaveRequestSchema
- index.ts: re-export all schemas

Rules:

- Every schema must match the actual API validation rules in Laravel FormRequests
- Read the existing FormRequest classes in app/Http/Requests/ before
  writing any schema
- Error messages should be in Bahasa Indonesia (to match existing UX)
- package.json: name @sibermas/schemas, peerDependencies: zod

### Step 10 — Create packages/hooks/

Create shared TanStack Query hooks. These must reference
@sibermas/api-client endpoint functions and @sibermas/constants query keys.

Hooks to create:

- useAuth.ts: useCurrentUser, useLogin, useLogout, useForgotPassword
- usePeriodContext.ts: usePeriodContext (GET /api/v1/period-context)
- useDailyReports.ts: useDailyReports, useDailyReport,
  useCreateDailyReport, useUpdateDailyReport
- useWorkPrograms.ts: useWorkPrograms, useWorkProgram, useCreateWorkProgram
- useRegistration.ts: useRegistrationForm, useSubmitRegistration,
  useRegistrationStatus
- useCertificates.ts: useCertificates
- useLeaveRequests.ts: useLeaveRequests, useCreateLeaveRequest
- index.ts: re-export all hooks

Rules:

- Every hook uses query keys from @sibermas/constants — never inline strings
- staleTime must be set appropriately per data type:
  - Period context: 60 seconds
  - Student own data: 30 seconds
  - Daily reports list: 10 seconds
  - Reference data (lokasi, jenis KKN, fakultas): 1 hour
- All mutation hooks invalidate relevant queries on success
- package.json: name @sibermas/hooks,
  peerDependencies: @tanstack/react-query, @sibermas/api-client,
  @sibermas/shared-types, @sibermas/constants

### Step 11 — Create packages/constants/

Create all shared constants. These must reflect actual data
from the codebase — read models, migrations, and existing
frontend constants before writing.

Files:

- queryKeys.ts: QUERY_KEYS object with all TanStack Query key constants
  (every key used in packages/hooks must be defined here)
- phases.ts: PHASE_LABELS map (Bahasa Indonesia phase names,
  match what is in HandleInertiaRequests or existing constants)
- roles.ts: ROLE_MAP, ROLE_LABELS, ROLE_REDIRECT_MAP
  (which role redirects to which portal on login)
- status.ts: STATUS_LABELS for PesertaKkn status, KegiatanKkn status,
  LaporanAkhir status, NilaiKkn status — match actual enum/const values
  in the Laravel codebase
- index.ts: re-export everything
- package.json: name @sibermas/constants

### Step 12 — Configure Cross-Package TypeScript

At root level, create tsconfig.base.json:

- strict: true
- moduleResolution: bundler
- jsx: preserve
- paths for all @sibermas/* packages pointing to their src/index.ts

Each package and app tsconfig.json must extend this base config.
Verify there are no circular dependencies between packages.

### Step 13 — Update Root .gitignore

Consolidate all .gitignore rules into one root file covering:

- apps/api/: vendor/, storage/logs/, .env, bootstrap/cache/
- apps/web/: .next/, node_modules/, .env.local
- apps/mobile/: node_modules/, .expo/, dist/
- packages/*/: node_modules/, dist/
- Root: node_modules/, .turbo/

### Step 14 — Create .env.example

Document all required environment variables for all apps:

apps/api/ variables:

- APP_*, DB_*, REDIS_*, CACHE_DRIVER, SESSION_DRIVER, QUEUE_CONNECTION
- SANCTUM_STATEFUL_DOMAINS
- All existing Laravel env vars already in apps/api/.env.example

apps/web/ variables:

- NEXT_PUBLIC_API_URL (pointing to Laravel API)
- NEXT_PUBLIC_APP_NAME

apps/mobile/ variables:

- EXPO_PUBLIC_API_URL
- EXPO_PUBLIC_APP_NAME

### Step 15 — Verify Everything Works

Run these checks in order. Fix any failures before moving on:

1. From apps/api/: php artisan --version (Laravel intact)
2. From apps/api/: php artisan route:list (routes intact)
3. From root: pnpm install (all packages resolve)
4. From root: pnpm --filter @sibermas/shared-types build
5. From root: pnpm --filter @sibermas/api-client build
6. From root: pnpm --filter @sibermas/schemas build
7. From root: pnpm --filter @sibermas/hooks build
8. From root: pnpm --filter @sibermas/constants build
9. From root: pnpm --filter web build (Next.js build passes)
10. From root: pnpm --filter mobile build (Expo export passes)
11. TypeScript: zero errors across all packages
12. No circular dependencies between packages

---

## OUTPUT FORMAT PER STEP

For each step:

1. What you found (before making changes)
2. What you created or modified
3. Why (brief reasoning tied to actual codebase findings)
4. Any FreeBSD-specific consideration applied
5. Any decision you made that the team should review

At the end of all steps, output:

- Full final directory tree
- List of all package names and their interdependencies
- Any items flagged for team review
- Confirmation that all 12 verification checks passed

---

## ABSOLUTE RULES

- Never overwrite existing working code without explicit justification
- Never invent types, fields, or constants — always derive from the codebase
- Never hardcode URLs, credentials, or environment-specific values
- Never install a package without checking FreeBSD compatibility first
- If the current structure already partially matches the target,
  work with it — do not tear down and rebuild unnecessarily
- If any step fails verification, fix it before proceeding to the next step
- When in doubt about where existing code belongs in the new structure:
  STOP and ask

---

Begin with Step 1. Read and map the full current directory structure first.
Report your findings before making any changes.
