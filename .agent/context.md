# KKN UIN SAIZU — Project Context for AI Assistant

> **Last Updated:** 2026-02-15
> **Maintained by:** Tholib (tholib_server)
> **Repo:** https://github.com/putrihati-cmd/kknuinsaizu
> **Local/Staging:** http://localhost:8000
> **Production:** DECOMMISSIONED (Previously infiatin.cloud)
> **Server Path:** /var/www/kknuinsaizu

---

## 1. What Is This Project?

Sistem Informasi KKN (Kuliah Kerja Nyata) UIN Prof. K.H. Saifuddin Zuhri Purwokerto.
A full-stack web application managing the entire KKN lifecycle: student registration, group assignment, DPL (supervising lecturer) management, daily reports, evaluations, grading, and certificates.

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Backend | Laravel 11, PHP 8.2 |
| Frontend | React 18 + TypeScript, Inertia.js |
| Styling | Vanilla CSS, clsx utility |
| Icons | @heroicons/react/24/outline |
| Auth | Spatie Laravel Permission (roles: `superadmin`, `admin`, `dpl`, `student`) |
| Database | MySQL, connection name: `kkn` |
| Server | Ubuntu, Nginx, path: `/var/www/kknuinsaizu` |
| Domain | localhost:8000 (Development) |
| Server | Local-First (Mac mini) |

## 3. Custom UI Components

All in `resources/js/Components/ui/`:

| Component | Props/Notes |
|---|---|
| `Button` | `variant` (ghost, etc), `size` (sm, etc), `loading`, `onClick` |
| `Badge` | `variant` (success, warning, danger, info), `className` |
| `StatusBadge` | Status-aware badge |
| `Modal` | **`open`** (NOT `show`), `onClose`, `title?`, `maxWidth?` |
| `ConfirmDialog` | Confirmation dialog |
| `FormInput` | Standard input with label/error |
| `FormSelect` | **Requires `options: {value, label}[]`** + `placeholder`, `label`, `error`. Does NOT accept children `<option>` |
| `FormTextarea` | `label`, `error`, extends textarea attrs |
| `DataTable` | Data table component |
| `Pagination` | Pagination component |

> ⚠️ **CRITICAL API NOTES:**
> - Modal uses `open` prop, NOT `show`
> - FormSelect uses `options` array, NOT inline `<option>` children

## 4. Project Structure

```
app/
├── Http/
│   ├── Controllers/
│   │   ├── Admin/          (20 controllers: Dashboard, Groups, Users, DPL Assignment, etc.)
│   │   ├── Dpl/            (DPL panel: Dashboard, Groups, DailyReports, Evaluations)
│   │   ├── Student/        (Student panel: Dashboard, Registration, Reports, etc.)
│   │   ├── Auth/           (Login, Password Reset)
│   │   ├── Api/            (Notifications)
│   │   └── *.php           (Shared: Report, Workshop, Proposal, Certificate, Profile)
│   ├── Middleware/
│   │   ├── HandleActivePeriod.php   (Period context: URL > Session > Default)
│   │   ├── HandleInertiaRequests.php
│   │   ├── CspHeaders.php
│   │   └── KknThrottleMiddleware.php
│   └── Requests/
│       └── StudentFilterRequest.php
├── Models/KKN/             (27 Eloquent models, all use connection 'kkn')
├── Services/               (14 service classes)
├── Policies/               (5 policies: Base, Period, KknScore, AuditLog, Proposal)
└── Providers/
    └── AuthServiceProvider.php  (Policy mappings + Gates)

resources/js/
├── Components/
│   ├── ui/                 (10 reusable UI components — see Section 3)
│   ├── Sidebar.tsx         (Role-based navigation: admin/dpl/student)
│   ├── PeriodSelector.tsx  (Active period dropdown in header)
│   └── Layout/
│       └── BellDropdown.tsx
├── Contexts/
│   └── ToastContext.tsx
├── Layouts/
│   └── AppLayout.tsx       (Main layout: sidebar + header + PeriodSelector)
├── Pages/
│   ├── Admin/              (30 pages — see Section 6)
│   ├── Dpl/                (DPL pages)
│   ├── Student/            (Student pages)
│   ├── Auth/               (Login, ForgotPassword, ResetPassword)
│   └── Profile/            (Profile page)
└── types/
    └── index.ts            (TypeScript interfaces: User, Student, Period, Group, etc.)

routes/
└── web.php                 (214 lines: admin 39-141, dpl 144-166, student 169-202)
```

## 5. Database Models (27 models in `app/Models/KKN/`)

| Model | Table | Key Features |
|---|---|---|
| `TahunAkademik` | `tahun_akademik` | Academic year |
| `Periode` | `periode` | SoftDeletes, `dplPeriods()` relation |
| `Fakultas` | `fakultas` | Faculty |
| `Prodi` | `prodi` | Study program |
| `Lokasi` | `lokasi` | KKN location |
| `Dosen` | `dosen` | DPL, `dplPeriods()`, `canTakeMoreGroups()`, `scopeAvailableForPeriod()` |
| `Mahasiswa` | `mahasiswa` | Student data |
| `KelompokKkn` | `kelompok_kkn` | SoftDeletes, `dplPeriod()` relation |
| `PesertaKkn` | `peserta_kkn` | SoftDeletes, scopes: byPeriod, byAngkatan, byJenisKkn, byStatus, etc. |
| `DplPeriod` | `dpl_periods` | Pivot: DPL ↔ Period, `hasCapacity()`, `getRemainingSlots()` |
| `RegistrationHistory` | `registration_histories` | Transfer audit trail |
| `DokumenPesertaKkn` | `dokumen_peserta_kkn` | Registration documents |
| `KegiatanKkn` | `kegiatan_kkn` | Daily activities |
| `FileKegiatanKkn` | `file_kegiatan_kkn` | Activity file attachments |
| `ProgramKerja` | `program_kerja` | Work programs |
| `LaporanAkhir` | `laporan_akhir` | SoftDeletes, final reports |
| `Laporan` | `laporan` | Generic reports |
| `NilaiKkn` | `nilai_kkn` | Grades/scores |
| `KonfigurasiPenilaian` | `konfigurasi_penilaian` | Grading config |
| `Evaluasi` | `evaluasi` | Evaluations |
| `ItemEvaluasi` | `item_evaluasi` | Evaluation items |
| `LogAudit` | `log_audit` | Audit logs |
| `ProfilUser` | `profil_user` | User profiles |
| `Workshop` | `workshop` | Workshops |
| `PesertaWorkshop` | `peserta_workshop` | Workshop participants |
| `Proposal` | `proposal` | Proposals |
| `ProposalProgramKerja` | `proposal_program_kerja` | Proposal work programs |

## 6. Admin Pages (30 .tsx files)

```
Pages/Admin/
├── Dashboard.tsx              - Main dashboard with stats, SDG distribution, recent registrations
├── AcademicYears/Index.tsx    - CRUD tahun akademik
├── Periods/Index.tsx          - CRUD periode KKN
├── Faculties/Index.tsx        - CRUD fakultas
├── Programs/Index.tsx         - CRUD prodi
├── Locations/Index.tsx        - CRUD lokasi
├── Groups/Index.tsx           - List kelompok
├── Groups/Show.tsx            - Detail kelompok
├── Users/Index.tsx            - List all users
├── Users/Form.tsx             - Create/edit user
├── Users/DosenIndex.tsx       - List dosen/DPL
├── Users/MahasiswaIndex.tsx   - List mahasiswa
├── Registrations/Index.tsx    - Pendaftaran KKN
├── Registrations/Show.tsx     - Detail pendaftaran
├── DailyReports/Index.tsx     - Laporan harian
├── WorkPrograms/Index.tsx     - Program kerja
├── FinalReports/Index.tsx     - Laporan akhir
├── Evaluations/Index.tsx      - Evaluasi & nilai
├── Grades/Index.tsx           - Input nilai manual
├── Grading/Index.tsx          - Generator nilai
├── Grading/Settings.tsx       - Pengaturan nilai
├── GradeGenerator/Index.tsx   - Generator nilai v2
├── RekapNilai/Index.tsx       - Rekap nilai + sertifikat
├── AuditLog/Index.tsx         - List audit log
├── AuditLog/Show.tsx          - Detail audit log
├── Reports/Index.tsx          - Reports overview
├── Workshops/Index.tsx        - Workshop management
├── Proposals/Index.tsx        - Proposal management
├── Dpl/Assignment.tsx         - DPL period assignment (NEW)
└── Peserta/Transfer.tsx       - Student transfer (NEW)
```

## 7. Sidebar Navigation (Current State)

The sidebar in `resources/js/Components/Sidebar.tsx` has 4 groups for admin:

- **Utama:** Dashboard
- **Master Data:** Tahun Akademik, Periode, Fakultas, Prodi, Lokasi, Dosen, Mahasiswa
- **Kelola KKN:** Kelompok, Pengguna, Pendaftaran
- **Aktivitas Global:** Laporan Harian, Program Kerja, Laporan Akhir, Evaluasi, Workshop, Proposal, Generator Nilai, Rekap Nilai, Log Audit, Pengaturan Nilai

**⚠️ MISSING sidebar links:**
- `/admin/dpl/assignment` (Penugasan DPL) — page exists, no sidebar link
- `/admin/peserta/transfer` (Transfer Peserta) — page exists, no sidebar link

**⚠️ BUG:** Line 210 has debug output: `DEBUG: {JSON.stringify(roles)}` — should be removed.

## 8. Key Services

| Service | Purpose |
|---|---|
| `PeriodContextService` | Active period state via session/cache |
| `DashboardStatisticsService` | Period-scoped cached dashboard stats |
| `StudentTransferService` | Transfer validation & execution with audit trail |
| `AuditService` | God-mode bypass logging |
| `CertificateService` | Certificate PDF generation |
| `GradingService` | Grade calculation |
| `RegistrationService` | Student registration |
| `ReportManagementService` | Report management |

## 9. Recent Architecture Changes (Multi-Angkatan)

4 new migrations were added:
1. `2026_02_15_000001_create_dpl_periods_table` — DPL ↔ Period pivot
2. `2026_02_15_000002_create_registration_histories_table` — Transfer audit trail
3. `2026_02_15_000003_add_dpl_period_id_and_soft_deletes` — FK + soft deletes
4. `2026_02_15_000004_add_performance_indexes` — Composite indexes

Seeder to run: `php artisan db:seed --class=MigrateDplPeriodDataSeeder`

## 10. Deployment

```bash
### Environment Access
fokus pada localhost untuk pengembangan saat ini.
# On server
cd /var/www/kknuinsaizu
git pull origin main
php artisan migrate --force
npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## 11. Known Issues / TODO

- [ ] Sidebar missing links for DPL Assignment and Student Transfer
- [ ] Sidebar has DEBUG output on line 210
- [ ] Dashboard could use more visualizations (charts, trends)
- [ ] Some admin pages may not be fully period-scoped
- [ ] `npm run build` needed on server after frontend changes
- [ ] Run `MigrateDplPeriodDataSeeder` on server
- [ ] Comprehensive prompt for full dashboard overhaul saved at `PROMPT_SUPERADMIN_DASHBOARD.md`
