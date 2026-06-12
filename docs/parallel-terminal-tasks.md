# Parallel Hermes Tasks — KKNNativeReact

Repo lokal: `/Users/macm4/Documents/KKNReac`
Remote: `https://github.com/sibermas-hash/KKNNativeReact.git`

## Aturan global semua terminal

- Frontend-only.
- Jangan sentuh Laravel/API/DB/server/mobile.
- Jangan push kecuali diminta Terminal 1.
- Buat branch masing-masing.
- Jangan ubah `src/shared/api/client.ts` tanpa koordinasi Terminal 1.
- Jangan ubah global style besar tanpa koordinasi Terminal 1.
- Wajib `npm run build` sebelum selesai.
- Output akhir wajib isi:
  - branch
  - files changed
  - build result
  - endpoints used
  - blockers/gaps
  - instruksi merge

---

## Terminal 1 — Integrator / Owner

Branch: `main` atau `integration/*`

Tugas:
- Koordinasi semua terminal.
- Review branch terminal 2–10.
- Resolve conflict.
- Jaga arsitektur frontend-only.
- Pastikan API contract tidak berubah.
- Jalankan build final.
- Push hanya setelah semua aman.

Checklist:
```bash
cd /Users/macm4/Documents/KKNReac
git status --short
npm run build
```

Jangan:
- Jangan coding fitur besar sambil terminal lain aktif kecuali fondasi integrasi.

---

## Terminal 2 — Auth + Login Parity

Branch: `feat/auth-login-parity`

Prompt:
```txt
Anda Terminal 2. Kerja di /Users/macm4/Documents/KKNReac.

Task: migrasi auth/login dari SIBERMAS Next lama ke SPA baru.

Scope:
- Audit legacy:
  /usr/local/www/sibermas/current/apps/web/src/app/(auth)/login/page.tsx
  dan komponen/lib terkait.
- Implement LoginPage SPA sedekat mungkin dengan legacy.
- Support identifier/email/username, password, captcha jika ada, 2FA challenge/redirect jika ada.
- Gunakan src/shared/api/client.ts.
- Jangan ubah backend/API.
- Jangan simpan credential.

Files likely:
- src/features/auth/LoginPage.tsx
- src/shared/auth/auth.tsx
- src/app/App.tsx minimal jika perlu

Verification:
- npm run build
- Catat endpoint login/captcha/me dan payload.

Output akhir:
- Ringkasan perubahan
- Build status
- Gap/risiko
```

---

## Terminal 3 — Student Dashboard + Profile Gate

Branch: `feat/student-dashboard-profile`

Prompt:
```txt
Anda Terminal 3. Kerja di /Users/macm4/Documents/KKNReac.

Task: port dashboard mahasiswa + profile completion gate.

Audit legacy:
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/profil* jika ada

Implement:
- status pendaftaran/KKN
- jenis KKN
- periode
- phase
- kelompok/DPL jika ada
- nilai/grade jika ada
- KKN selesai: Reguler 51–57 + Magang FTIK
- profile completion blocker sesuai legacy

Jangan:
- Jangan port laporan/sertifikat detail.
- Jangan ubah API.

Files likely:
- src/features/mahasiswa/StudentDashboard.tsx
- src/features/mahasiswa/ProfilePage.tsx

Verification:
- npm run build
- Catat endpoint dashboard/profile.
```

---

## Terminal 4 — Sertifikat & Nilai Mahasiswa

Branch: `feat/student-certificate-grade`

Prompt:
```txt
Anda Terminal 4. Kerja di /Users/macm4/Documents/KKNReac.

Task: port halaman Sertifikat & Nilai mahasiswa.

Audit legacy:
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/sertifikat/page.tsx

Implement:
- list sertifikat
- nilai/grade
- valid/revoked state jika ada
- download PDF via endpoint legacy
- support KKN selesai cert row tanpa kelompok_id
- blob/arraybuffer handling jika download

Jangan:
- Jangan generate PDF frontend.
- Jangan ubah API.

Files likely:
- src/features/mahasiswa/CertificatePage.tsx
- src/shared/api/download.ts jika perlu

Verification:
- npm run build
- Catat endpoint download + filename handling.
```

---

## Terminal 5 — Laporan Harian + Upload Compression

Branch: `feat/student-daily-reports`

Prompt:
```txt
Anda Terminal 5. Kerja di /Users/macm4/Documents/KKNReac.

Task: port laporan harian mahasiswa, fokus upload foto.

Audit legacy:
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/laporan-harian/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/laporan-harian/buat/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/laporan-harian/[id]/edit/page.tsx

Implement:
- list laporan harian
- create form
- edit form
- FormData/payload sesuai legacy
- preview image
- client-side image compression:
  - max width 1600px
  - quality ~0.72
  - target 300–600KB jika memungkinkan

Jangan:
- Jangan upload real tanpa izin.
- Jangan ubah API.

Files likely:
- src/features/mahasiswa/reports/DailyReportsPage.tsx
- src/features/mahasiswa/reports/DailyReportForm.tsx
- src/shared/utils/imageCompression.ts

Verification:
- npm run build
- Catat endpoint/payload.
```

---

## Terminal 6 — Laporan Akhir + Program Kerja

Branch: `feat/student-final-reports-work-programs`

Prompt:
```txt
Anda Terminal 6. Kerja di /Users/macm4/Documents/KKNReac.

Task: port laporan akhir + program kerja mahasiswa.

Audit legacy:
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/laporan-akhir/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/program-kerja/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/program-kerja/buat/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/program-kerja/[id]/page.tsx

Implement:
- laporan akhir status/upload/list sesuai legacy
- program kerja list/detail/create
- validation ringan dengan zod bila jelas
- loading/error/empty state

Jangan:
- Jangan upload real tanpa izin.
- Jangan ubah API.

Files likely:
- src/features/mahasiswa/final-report/*
- src/features/mahasiswa/work-programs/*

Verification:
- npm run build
- Catat endpoint/payload.
```

---

## Terminal 7 — Posko, Poster, Izin

Branch: `feat/student-posko-poster-leave`

Prompt:
```txt
Anda Terminal 7. Kerja di /Users/macm4/Documents/KKNReac.

Task: port fitur mahasiswa posko, poster, izin.

Audit legacy:
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/posko/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/poster/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/izin/page.tsx
- /usr/local/www/sibermas/current/apps/web/src/app/(student)/mahasiswa/izin/buat/page.tsx

Implement:
- posko page
- poster page
- izin list
- create izin form
- upload handling jika legacy pakai attachment
- responsive cards/forms

Jangan:
- Jangan ubah API.

Files likely:
- src/features/mahasiswa/posko/*
- src/features/mahasiswa/poster/*
- src/features/mahasiswa/leave/*

Verification:
- npm run build
- Catat endpoint/payload.
```

---

## Terminal 8 — Layout, Navigation, Route Shell

Branch: `feat/layout-navigation-shell`

Prompt:
```txt
Anda Terminal 8. Kerja di /Users/macm4/Documents/KKNReac.

Task: bangun layout/navigation SPA scalable.

Implement:
- AppShell
- StudentLayout
- AdminLayout placeholder
- DosenLayout placeholder
- ExternalLayout placeholder
- mobile responsive sidebar
- topbar user menu/logout
- central route config
- role-based nav visibility
- phase-based disabled state hook placeholder

Jangan:
- Jangan port business pages.
- Jangan ubah API client.
- Jangan ubah LoginPage kecuali link minimal.

Files likely:
- src/app/App.tsx
- src/app/routes.ts
- src/layouts/*
- src/shared/components/*
- src/shared/navigation/*

Verification:
- npm run build
- Dokumentasikan cara terminal lain menambahkan route/page.
```

---

## Terminal 9 — Shared UI Components + Form Primitives

Branch: `feat/ui-primitives`

Prompt:
```txt
Anda Terminal 9. Kerja di /Users/macm4/Documents/KKNReac.

Task: buat UI primitives konsisten.

Implement components:
- Button
- Input
- Textarea
- Select
- Card
- Badge
- Alert
- Spinner
- EmptyState
- ErrorState
- Modal/Dialog sederhana
- DataTable wrapper ringan jika sempat

Use:
- Tailwind
- clsx
- tailwind-merge

Jangan:
- Jangan import Next.
- Jangan ubah halaman besar kecuali demo kecil.
- Jangan sentuh API.

Files:
- src/shared/components/ui/*
- src/shared/utils/cn.ts

Verification:
- npm run build
- Dokumentasikan contoh import.
```

---

## Terminal 10 — Legacy Audit Map + Endpoint Inventory

Branch: `docs/legacy-endpoint-inventory`

Prompt:
```txt
Anda Terminal 10. Kerja di /Users/macm4/Documents/KKNReac.

Task: buat inventory migrasi dari Next lama ke SPA baru. Dokumentasi saja.

Audit:
- /usr/local/www/sibermas/current/apps/web/src/app
- /usr/local/www/sibermas/current/apps/web/src/lib
- /usr/local/www/sibermas/current/packages/api-client jika ada

Buat:
- docs/migration-inventory.md

Isi minimal:
- daftar semua route mahasiswa
- file legacy sumber
- endpoint API yang dipanggil
- method
- payload ringkas jika terlihat
- status port: todo/in-progress/done
- risiko/gap

Prioritas:
1. mahasiswa
2. dosen
3. admin jika sempat

Jangan:
- Jangan ubah app source kecuali docs.

Verification:
- npm run build
- Output route paling berisiko.
```

---

## Template final report tiap terminal

```txt
Terminal: X
Branch:
Status: done/blocked/partial
Build: pass/fail

Files changed:
- ...

Endpoints used:
- METHOD /api/v1/...

Summary:
- ...

Blockers/gaps:
- ...

Merge notes for Terminal 1:
- ...
```
