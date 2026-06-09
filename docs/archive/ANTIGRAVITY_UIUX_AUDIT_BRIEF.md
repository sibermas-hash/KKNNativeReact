# Antigravity / Gemini UI-UX Audit Brief — SIBERMAS

## Role
Anda adalah Senior UI/UX QA + Frontend Reviewer untuk aplikasi SIBERMAS KKN UIN SAIZU.

Audit refactor tema universal lintas role (public, auth, student, dosen/DPL, admin, external), layout pendukung, halaman refactor spesifik, dan backend terkait. Fokus utama: konsistensi theme token/background/surface lintas seluruh aplikasi, visual consistency, responsiveness, data consistency, stale header/sidebar, form UX, dan regression dari perubahan terakhir.

---

## Live Site

```txt
https://sibermas.uinsaizu.ac.id
```

## Test User Context

Mahasiswa contoh:

```txt
Nama: RETYAN NAYLA TRIYANA
NIM: 234110301072
Status registration: approved
Expected period/header: KKN REGULER ANGKATAN 2026/2027
```

Expected sidebar untuk mahasiswa approved tanpa kelompok:

```txt
DASHBOARD
STATUS PENDAFTARAN
PROFIL
```

Tidak boleh tampil:

```txt
DAFTAR KKN
POSKO
```

POSKO hanya boleh muncul jika student sudah punya `registration.group` / `kelompok`.

---

## Historical Bugs / Regression Targets

Pastikan bug berikut tidak muncul lagi:

```txt
1. Header stale: tampil KKN TEMATIK / SIBERMAS / Pra-Pendaftaran padahal user approved Reguler.
2. Sidebar stale: DAFTAR KKN masih tampil untuk user approved.
3. /profil masih menampilkan copy peta:
   "Peta dinonaktifkan sementara. Cukup isi alamat tertulis sesuai KTP..."
   Copy ini harus sudah hilang.
4. Theme switcher tidak full-layout / background tidak meng-cover area utama.
5. Header long period name berpotensi overflow di mobile.
6. React Query cache dashboard lintas user/session berpotensi stale.
```

---

## Universal Theme Scope

Ini bukan audit 1 role saja. Refactor theme bersifat universal. Verifikasi semua shell/layout utama memakai sistem tema yang sama, tanpa regress role tertentu.

Role/scope yang wajib dicek:

```txt
- Public/home/landing
- Auth/login
- Student/mahasiswa
- Lecturer/dosen/DPL
- Admin
- External
```

Theme expectations:

```txt
- Theme token konsisten: background, surface, surface-strong, border, text, muted, primary, accent, warning, danger.
- Background/gradasi/partikel mencakup full viewport, bukan hanya card/container.
- Header/sidebar/card/input/button membaca CSS vars theme, bukan hard-coded slate/teal berlebihan.
- Theme switcher state persist jika memang didesain persist.
- Ganti theme tidak merusak contrast/spacing/focus.
- Semua role tetap readable di SIBERMAS, Ocean, Forest, Midnight, Rose.
```

Tambahkan audit route lintas role bila akses tersedia:

```txt
/                      public home
/login                 auth
/profil                shared/student profile
/mahasiswa             student dashboard
/dosen                 lecturer shell if available
/dosen/beranda-dpl     DPL dashboard
/admin                 admin shell if available
/external              external shell if available
```

Untuk setiap role/layout, cek:

```txt
- visual continuity dari login → dashboard role
- no white/gray dead-zone after theme change
- no unreadable contrast in Midnight/Rose/etc
- active nav/CTA color consistent
- modal/dropdown/toast/notification follow theme enough
```

## Pages to Audit — Student

### 1. Profil

Route:

```txt
/profil
```

File:

```txt
apps/web/src/app/(student)/profil/page.tsx
```

Audit:

```txt
- Theme switcher visible: SIBERMAS, Ocean, Forest, Midnight, Rose.
- Theme applies to page surface/background/cards/forms.
- No old map note/copy.
- Address KTP section clear without map reference.
- Edit Profil button state OK.
- Disabled/read-only fields visually clear.
- Upload Foto Formal HD copy consistent: JPG/PNG, max 2 MB.
- No duplicate Keluar/logout in profile hero.
- Avatar/photo area not overflow.
- Mobile spacing OK.
```

### 2. Dashboard Mahasiswa

Route:

```txt
/mahasiswa
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/page.tsx
```

Audit:

```txt
- Header period correct: KKN REGULER ANGKATAN 2026/2027.
- Dashboard cards align, not cramped.
- Status approved reflected correctly.
- No stale Tematik/upcoming state.
- CTA visibility matches status.
- Loading/error/empty states usable.
```

### 3. Laporan Akhir

Route:

```txt
/mahasiswa/laporan-akhir
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/laporan-akhir/page.tsx
```

Audit:

```txt
- Upload area clear.
- Status/submission state readable.
- Button hierarchy clear.
- Error/empty state clear.
- Mobile upload/input not overflow.
```

### 4. Logbook / Laporan Harian — Daftar

Route:

```txt
/mahasiswa/laporan-harian
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/laporan-harian/page.tsx
```

Audit:

```txt
- List cards/table readable.
- Date/status/action alignment.
- Empty state helpful.
- Long activity text wraps correctly.
- Mobile cards not overflow.
```

### 5. Logbook / Laporan Harian — Form Tambah

Route:

```txt
/mahasiswa/laporan-harian/buat
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/laporan-harian/buat/page.tsx
```

Audit:

```txt
- Form grouping clear.
- Labels/placeholders helpful.
- Date/time inputs usable.
- Validation states visible.
- Save/cancel buttons clear.
- Mobile form fields comfortable.
```

### 6. Logbook / Laporan Harian — Form Edit

Route:

```txt
/mahasiswa/laporan-harian/[id]/edit
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/laporan-harian/[id]/edit/page.tsx
```

Audit:

```txt
- Existing data loads clearly.
- Edit/save/cancel semantics clear.
- Missing/invalid id state handled.
- Same UX quality as create form.
```

### 7. Posko

Route:

```txt
/mahasiswa/posko
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/posko/page.tsx
```

Audit:

```txt
- Page access should be blocked/hidden for RETYAN if no group.
- If accessible, geospatial input clear.
- Coordinate labels clear: lat/lng.
- Map/location controls do not overflow.
- Empty/no group state helpful.
```

### 8. Poster Potensi Desa

Route:

```txt
/mahasiswa/poster
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/poster/page.tsx
```

Audit:

```txt
- Upload poster peta potensi clear.
- File type/size requirements visible.
- Preview/status states clear.
- Failure states actionable.
- Mobile upload card OK.
```

### 9. Evaluasi Nilai

Route:

```txt
/mahasiswa/evaluasi
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/evaluasi/page.tsx
```

Audit:

```txt
- Tabel bobot nilai/kriteria readable.
- Numeric weights align.
- Responsive table/card behavior OK.
- Empty/no nilai state clear.
- Contrast sufficient.
```

### 10. Izin

Route:

```txt
/mahasiswa/izin
```

File:

```txt
apps/web/src/app/(student)/mahasiswa/izin/page.tsx
```

Audit:

```txt
- Form permohonan izin clear.
- Date range/time inputs clear.
- Reason textarea clear.
- Submit state/loading/validation visible.
- List/status of prior izin readable if present.
```

---

## Dosen DPL

### 11. Dashboard DPL

Route:

```txt
/dosen/beranda-dpl
```

File:

```txt
apps/web/src/app/(dosen)/dosen/beranda-dpl/page.tsx
```

Audit:

```txt
- Statistik kelompok visually clear.
- Panel "Atensi Khusus" prominent but not alarming if empty.
- Menu navigasi dosen clear.
- Header period consistent.
- Loading/error/empty states clear.
- Mobile/tablet layout usable.
```

---

## Layout Files

### Student Layout

File:

```txt
apps/web/src/app/(student)/layout.tsx
```

Audit code + live:

```txt
- Dynamic theme background covers entire main layout.
- Header/sidebar use theme vars consistently.
- Header title does not overflow; should use min-w-0/truncate if needed.
- Sidebar nav visibility uses registration/group correctly.
- Dashboard query should not stale across users.
- Query key ideally scoped by user id.
- After registration/cancel/profile updates, dashboard query should invalidate/refetch.
```

### External Layout

File:

```txt
apps/web/src/app/(external)/external/layout.tsx
```

Audit:

```txt
- Dynamic background/theme applied full viewport.
- No dead zones / mismatched background.
- Public/external pages still readable.
```

---

## Backend Files

### Admin Peserta KKN List

File:

```txt
apps/api/app/Http/Controllers/Api/V1/Admin/PesertaKknListController.php
```

Audit:

```txt
- API response fields match frontend expectations.
- Pagination/filter/search stable.
- Period isolation correct.
- No N+1 or missing eager loads for displayed data.
```

### Admin Rekap Nilai

File:

```txt
apps/api/app/Http/Controllers/Api/V1/Admin/RekapNilaiController.php
```

Audit:

```txt
- Data shape matches evaluasi/rekap UI.
- Numeric score/weight fields clear.
- Export/summary fields consistent.
```

### Student Dashboard

File:

```txt
apps/api/app/Http/Controllers/Api/V1/Student/DashboardController.php
```

Audit:

```txt
- For RETYAN, dashboard returns approved registration for KKN Reguler Angkatan 2026/2027.
- Must not be hidden by global period isolation selecting Tematik.
- Response includes registration.period.current_phase/name for header/sidebar.
- Response stable after hard refresh, login, clear-session.
```

---

## Visual QA Checklist

For each page, inspect at least:

```txt
Desktop: 1280×720 or wider
Tablet-ish: 768×1024
Mobile-ish: 390×844
```

Checklist:

```txt
- No horizontal overflow.
- Header visible/sticky and not covering content.
- Sidebar open/close works on mobile.
- Active nav item correct.
- Theme switcher accessible and visual changes apply.
- Cards align; no awkward gaps.
- Typography hierarchy clear.
- Buttons target size adequate.
- Focus states visible enough.
- Loading state not blank/black screen.
- Error state has action/copy.
- Empty state helpful.
- Long Indonesian text wraps naturally.
- Dates labeled clearly.
- File upload constraints visible.
```

---

## Data Consistency Assertions

For RETYAN user, verify:

```txt
Header period == KKN REGULER ANGKATAN 2026/2027
Sidebar phase == Seleksi & Plotting / placement if registration period current_phase placement
Main status == Disetujui / approved
Daftar KKN hidden
Status Pendaftaran visible
Posko hidden unless group exists
```

If any page shows:

```txt
KKN TEMATIK
Pra-Pendaftaran
SIBERMAS fallback as header after login
DAFTAR KKN for approved user
```

Mark as:

```txt
Severity: P1 regression
```

---

## Suggested Output Format

For each route/file:

```txt
## [Route] — [File]
Status: PASS / WARNING / FAIL
Severity: P0/P1/P2/P3

Visual findings:
- ...

UX findings:
- ...

Data consistency:
- ...

Responsive risk:
- ...

Code/API notes:
- ...

Suggested fix:
- ...
```

End with:

```txt
# Top 10 Fixes by Impact
1. ...

# Quick Wins (< 1 hour)
- ...

# Regression Checklist After Patch
- ...

# Screenshots / Evidence
- attach or list screenshots per failing page
```

---

## Known Current Observations Before This Audit

Already verified live recently:

```txt
/profil theme switcher visible in header and profile hero.
/profil old map note removed.
/mahasiswa/cek-pendaftaran header correct after fresh login.
remote-deploy.sh succeeded; health checks OK.
```

But still suspected:

```txt
Header/sidebar cache bug can recur due to static dashboard query key.
Recommended frontend hardening:
- queryKey: [...QUERY_KEYS.student.dashboard, user?.id]
- invalidate QUERY_KEYS.student.dashboard after register/cancel/profile-affecting mutations
- avoid falling back to global activePeriod before dashboard query resolves for student layout
```

---

## Priority

Highest priority:

```txt
P1: Any wrong period/header/sidebar/nav visibility.
P1: Any form impossible to use/save.
P2: Mobile overflow or header cramped.
P2: Theme not applying full layout.
P3: Copy clarity, spacing polish, tooltip/truncation.
```

---

## Notes

Use the repo files for code review and live site for visual inspection. Prefer screenshots for each WARNING/FAIL. Keep recommendations concrete and patchable.
