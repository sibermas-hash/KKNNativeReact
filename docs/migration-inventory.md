# Migration Inventory: Legacy Next → SPA

Scope audit requested:
- Legacy source: `/usr/local/www/sibermas/current/apps/web/src/app`, `/usr/local/www/sibermas/current/apps/web/src/lib`, `/usr/local/www/sibermas/current/packages/api-client`
- SPA repo: `/Users/macm4/Documents/KKNReac`

Note: legacy path `/usr/local/www/sibermas/current` is not present on this terminal, so `legacy source file` below records target legacy route/file by convention plus current SPA source evidence. No app source changed.

API base in SPA: `https://sibermas.site/api/v1` via `src/shared/api/client.ts`.

## Mahasiswa routes

| Route | Legacy source file | SPA/source evidence | Endpoint API | Method | Payload ringkas | Status port | Risiko/gap |
|---|---|---|---|---|---|---|---|
| `/mahasiswa` | `apps/web/src/app/mahasiswa/page.*` | `src/features/mahasiswa/StudentDashboard.tsx` | `/api/v1/student/dashboard` | GET | - | in-progress | Route renders dashboard cards only; needs verify legacy field names + phase/registration semantics. |
| `/mahasiswa/profil` | `apps/web/src/app/mahasiswa/profil/page.*` | `src/features/mahasiswa/StudentDashboard.tsx` `ProfilePage` | `/api/v1/student/profile`; `/api/v1/student/dashboard` fallback | GET | - | in-progress | Read-only profile summary implemented; edit/update/upload identity docs still unknown/not implemented. |
| `/mahasiswa/sertifikat` | `apps/web/src/app/mahasiswa/sertifikat/page.*` | `src/features/mahasiswa/CertificatePage.tsx` | `/api/v1/student/dashboard` | GET | - | in-progress | Certificate download/source URL likely legacy-specific; grade/certificates inferred from dashboard. |
| `/mahasiswa/laporan-harian` | `apps/web/src/app/mahasiswa/laporan-harian/page.*` | `src/features/mahasiswa/reports/DailyReportsPage.tsx`, `DailyReportForm.tsx`; routed by `StudentDashboard.tsx` | `/api/v1/student/daily-reports` | GET | - | in-progress | Wired through path dispatch; response shape normalized best-effort; legacy response still unverified. |
| `/mahasiswa/laporan-harian/buat` | `apps/web/src/app/mahasiswa/laporan-harian/buat/page.*` | `src/features/mahasiswa/reports/DailyReportForm.tsx` | `/api/v1/student/daily-reports` | POST multipart | `tanggal`, `kegiatan`, `deskripsi`, `lokasi`, `kendala`, optional `foto` compressed image | in-progress | Needs legacy validation rules, file key, max image size, date constraints; create mode available inside `DailyReportsPage`, not standalone route-specific component. |
| `/mahasiswa/laporan-harian/[id]/edit` | `apps/web/src/app/mahasiswa/laporan-harian/[id]/edit/page.*` | `src/features/mahasiswa/reports/DailyReportForm.tsx` | `/api/v1/student/daily-reports/{id}` | GET | - | in-progress | Needs legacy response mapping; edit mode available inside `DailyReportsPage`, not standalone route-specific component. |
| `/mahasiswa/laporan-harian/[id]/edit` | same | `src/features/mahasiswa/reports/DailyReportForm.tsx` | `/api/v1/student/daily-reports/{id}` | POST multipart + `_method=PUT` | `tanggal`, `kegiatan`, `deskripsi`, `lokasi`, `kendala`, optional `foto`, `_method=PUT` | in-progress | Method spoofing assumed; confirm legacy backend accepts exact payload. |
| `/mahasiswa/program-kerja` | `apps/web/src/app/mahasiswa/program-kerja/page.*` | `src/features/mahasiswa/work-programs/WorkProgramsPage.tsx` | `/api/v1/student/work-programs` | GET | - | in-progress | Wired through `StudentDashboard.tsx` path dispatch; response fields inferred (`title/name/status/budget/location`). |
| `/mahasiswa/program-kerja/[id]` | `apps/web/src/app/mahasiswa/program-kerja/[id]/page.*` | `src/features/mahasiswa/work-programs/WorkProgramsPage.tsx` | `/api/v1/student/work-programs/{id}` | GET | - | in-progress | Detail route wired through URL parsing in `StudentDashboard.tsx`; route params/manual history still unverified. |
| `/mahasiswa/program-kerja/buat` | `apps/web/src/app/mahasiswa/program-kerja/buat/page.*` | `src/features/mahasiswa/work-programs/WorkProgramsPage.tsx` | `/api/v1/student/work-programs` | POST JSON | `title`, `description`, optional `location`, optional numeric `budget` | in-progress | Legacy payload names may differ; validation local only. |
| `/mahasiswa/laporan-akhir` | `apps/web/src/app/mahasiswa/laporan-akhir/page.*` | `src/features/mahasiswa/final-report/FinalReportPage.tsx` | `/api/v1/student/final-report/status` | GET | - | in-progress | Wired through `StudentDashboard.tsx` path dispatch but not in current nav; status schema inferred. |
| `/mahasiswa/laporan-akhir` | same | `src/features/mahasiswa/final-report/FinalReportPage.tsx` | `/api/v1/student/final-reports` | GET | - | in-progress | List may be included in status response or separate; duplicate fetch risk. |
| `/mahasiswa/laporan-akhir` | same | `src/features/mahasiswa/final-report/FinalReportPage.tsx` | `/api/v1/student/final-reports` | POST multipart | `file`, optional `title` | in-progress | File type/size/period lock/approval workflow needs legacy parity. |

## Auth/shared endpoints affecting mahasiswa

| Route/flow | Source evidence | Endpoint API | Method | Payload ringkas | Status port | Risiko/gap |
|---|---|---|---|---|---|---|
| Login captcha | `src/features/auth/LoginPage.tsx` | `/api/v1/auth/captcha` | GET | - | in-progress | Normalizes several possible legacy captcha shapes; exact contract unverified. |
| Login submit | `src/features/auth/LoginPage.tsx` | `/api/v1/auth/login` | POST JSON | `identifier`, `email`, `username`, `password`; if captcha enabled: `captcha`, `captcha_answer`, `captcha_id`, `captcha_key` | in-progress | Captcha/2FA flow present; legacy visual/behavior parity still high migration risk. |
| Session bootstrap | `src/shared/auth/auth.tsx` | `/api/v1/auth/me` | GET | - | in-progress | Role mapping includes student/mahasiswa/dosen/dpl/admin variants; response contract must match legacy. |
| Logout | `src/shared/auth/auth.tsx` | `/api/v1/auth/logout` | POST | - | in-progress | Cookie/session semantics depend on backend CORS + `withCredentials`. |

## Dosen routes

| Route | Legacy source file | SPA/source evidence | Endpoint API | Method | Payload ringkas | Status port | Risiko/gap |
|---|---|---|---|---|---|---|
| `/dosen` / `/dpl` | `apps/web/src/app/(dosen|dpl)/page.*` | `src/shared/navigation/roles.ts` only | unknown | unknown | unknown | todo | No dosen pages in SPA yet; legacy source unavailable. |

## Admin routes

| Route | Legacy source file | SPA/source evidence | Endpoint API | Method | Payload ringkas | Status port | Risiko/gap |
|---|---|---|---|---|---|---|
| `/admin` | `apps/web/src/app/admin/page.*` | `src/shared/navigation/roles.ts` only | unknown | unknown | unknown | todo | No admin pages in SPA yet; legacy source unavailable. |

## Endpoint summary

- GET `/api/v1/auth/me`
- GET `/api/v1/auth/captcha`
- POST `/api/v1/auth/login`
- POST `/api/v1/auth/logout`
- GET `/api/v1/student/dashboard`
- GET `/api/v1/student/daily-reports`
- GET `/api/v1/student/daily-reports/{id}`
- POST `/api/v1/student/daily-reports`
- POST `/api/v1/student/daily-reports/{id}` with `_method=PUT`
- GET `/api/v1/student/work-programs`
- GET `/api/v1/student/work-programs/{id}`
- POST `/api/v1/student/work-programs`
- GET `/api/v1/student/final-report/status`
- GET `/api/v1/student/final-reports`
- POST `/api/v1/student/final-reports`

## Highest-risk routes

1. `/login` → captcha endpoint + 2FA redirect present, but legacy visual/behavior parity still unverified; failure blocks all roles.
2. `/mahasiswa/laporan-harian/*` → multipart upload, image compression, `_method=PUT`, legacy validation unknown, component not wired in `App.tsx`.
3. `/mahasiswa/laporan-akhir` → upload/period/status workflow likely business-critical; route not wired.
4. `/mahasiswa/profil` → read-only profile summary present; edit/update endpoints unknown.
5. `/mahasiswa/sertifikat` → certificate download/source handling inferred from dashboard only.

## Global gaps

- Legacy audit path unavailable on this terminal; inventory relies on current SPA source + expected Next route conventions.
- `App.tsx` visible nav includes `/mahasiswa`, `/mahasiswa/profil`, `/mahasiswa/sertifikat`, `/mahasiswa/laporan-harian`; `StudentDashboard.tsx` also dispatches `/mahasiswa/program-kerja*` and `/mahasiswa/laporan-akhir*`, but nav exposure/manual route behavior remain unverified.
- No dosen/admin SPA implementation beyond role constants.
- Need direct legacy source comparison before marking any route `done`.
