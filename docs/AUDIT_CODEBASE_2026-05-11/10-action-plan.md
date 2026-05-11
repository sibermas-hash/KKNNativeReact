# 10 — Action Plan

Roadmap prioritas berdasarkan temuan di [`09-findings.md`](./09-findings.md).

## Legend

| Kode | Arti |
|---|---|
| **Effort** | XS (< 2 jam), S (< 1 hari), M (1–3 hari), L (1 minggu+) |
| **Impact** | 🔴 Critical security/stability, 🟠 User-facing, 🟡 DX/maintainability, 🟢 Polish |

## Sprint 1 — P0 (Immediate)

**Target**: 1 minggu dari tanggal audit. Harus selesai sebelum deploy produksi besar.

| ID | Action | Effort | Impact | Owner | File(s) |
|---|---|---|---|---|---|
| C-NEW-001 | Implementasi `EnforceTwoFactor` middleware | S | 🔴 | Backend | `app/Http/Middleware/EnforceTwoFactor.php`, `bootstrap/app.php`, route groups admin/dosen/dpl |
| C-NEW-002 | Signed URL + TTL untuk private file endpoints | S | 🔴 | Backend | `routes/api.php`, `PrivateFileController`, frontend call sites |
| H-NEW-001 | Hapus `\|\| true` dari `pnpm audit` + composer audit blocking | XS | 🟠 | DevOps | `.github/workflows/ci.yml` |
| M-NEW-004 | Rewrite README (hapus Inertia/Docker claim salah) | XS | 🟡 | Docs | `README.md` |

## Sprint 2 — P1 (2–4 Minggu)

| ID | Action | Effort | Impact | Owner |
|---|---|---|---|---|
| H-NEW-002 | Tambah `composer stan` di CI (accept baseline, fail new errors) | S | 🟡 | DevOps |
| H-NEW-003 | Ubah fallback route → JSON 404 only | XS | 🟡 | Backend |
| H-NEW-004 | `SANCTUM_STATEFUL_DOMAINS` non-production fallback empty | XS | 🔴 | Backend |
| H-NEW-005 | Audit `laravel/boost`, `laravel/mcp` tool exposure | M | 🟠 | Backend |
| M-NEW-001 | Frontend test — login/2FA/registrasi/laporan harian paths | M | 🟠 | Frontend |
| M-NEW-003 | Konsolidasi 18 dokumen audit → CURRENT.md + archive | S | 🟡 | Docs |
| M-NEW-005 | SOP rotasi `APP_BLIND_INDEX_KEY` | S | 🔴 | Backend + Docs |
| M-NEW-007 | Automate Cloudflare IP list refresh | S | 🟡 | DevOps |

## Sprint 3 — P2 (1–2 Bulan)

| ID | Action | Effort | Impact | Owner |
|---|---|---|---|---|
| M-NEW-002 | Mobile test setup + offline queue tests | M | 🟡 | Mobile |
| M-NEW-008 | CSP nonce migration di Next.js | M | 🔴 | Frontend |
| M-NEW-009 | CSP report-only 1-2 minggu rollout | S | 🟡 | Frontend |
| (ops) | DR runbook + backup restore quarterly test | M | 🔴 | DevOps |
| (ops) | Backup offsite (S3/MinIO sync) | S | 🔴 | DevOps |
| (ops) | Deploy automation via GitHub Actions | M | 🟡 | DevOps |
| (ops) | Log out all devices endpoint | S | 🟠 | Backend |
| (security) | Data retention + audit log TTL policy | S | 🟡 | Backend + Legal |

## Sprint 4 — P3 (3+ Bulan)

| ID | Action | Effort | Impact | Owner |
|---|---|---|---|---|
| M-NEW-006 | Migration squash ke baseline | M | 🟡 | Backend |
| L-NEW-004 | Service directory refactor | M | 🟡 | Backend |
| L-NEW-007 | `LogBox.ignoreLogs` expiry tracking | XS | 🟢 | Mobile |
| (ops) | Prometheus `/metrics` endpoint + Grafana | L | 🟡 | DevOps |
| (ops) | Blue/green deployment | L | 🟠 | DevOps |
| (security) | SBOM generation (cyclonedx/syft) | S | 🟡 | DevOps |
| (security) | Dependabot PR automation | XS | 🟡 | DevOps |
| (security) | HIBP breach check pada registrasi | S | 🟡 | Backend |
| (security) | Token rotation/refresh pattern | M | 🟠 | Backend |
| (testing) | Playwright E2E test suite | L | 🟠 | Frontend/QA |
| (testing) | Load testing dengan k6 | M | 🟡 | DevOps |
| (testing) | Mutation testing dengan Infection PHP | S | 🟡 | Backend |
| (mobile) | 2FA challenge UI di mobile | M | 🔴 | Mobile |
| (mobile) | Biometric re-auth untuk sensitive actions | S | 🟠 | Mobile |

## Low Priority / Hygiene

| ID | Action |
|---|---|
| L-NEW-001 | Dokumentasikan Debugbar safety di SECURITY.md |
| L-NEW-002 | Hapus `pest_results.txt`, `route_list.txt`, `migrate_status.txt` dari working tree |
| L-NEW-003 | Tambah `apps/web/tsconfig.tsbuildinfo` ke `.gitignore` |
| L-NEW-005 | Pindahkan `config/ai-config-*.json` ke `docs/` atau `storage/` |
| L-NEW-006 | Setup periodic review untuk canvas/jsdom upgrade |

## Metrics Tracking

Saran metrik untuk evaluasi progress:

### Security
- 2FA adoption rate untuk privileged users → target **100% dalam 2 minggu** setelah enforce.
- Dependency vulnerabilities (pnpm audit + composer audit): count by severity.
- Time-to-patch setelah CVE disclosure.

### Quality
- Backend line coverage (Pest).
- Frontend line coverage (Vitest). **Baseline 0 → 30% → 50%**.
- Mobile line coverage.
- PHPStan error count (dari baseline turun).

### Operations
- Deploy frequency (target: weekly).
- Deploy success rate (target: > 95%).
- MTTR untuk P0 incidents (target: < 4 jam).
- Backup restore success (quarterly test).

### User-facing
- Login success rate.
- Rate limit hits per-tier (detect attack patterns).
- Error envelope distribution (404, 422, 500) via Sentry.

## Pengambilan Keputusan

**Siapa yang meng-approve work**:
- P0: Tech lead + security officer
- P1: Tech lead
- P2-P3: Product owner dengan engineer konsultasi

**Trigger re-audit**:
- Setiap 6 bulan, atau
- Setelah penambahan fitur besar (mis. payment integration, new role), atau
- Setelah dependency major version upgrade (Laravel 14, Next.js 16, Expo 54).

## Cara Tracking

Salin tabel di atas ke GitHub Issues/Projects sebagai epic. Format issue:

```
Title: [C-NEW-001] Implementasi EnforceTwoFactor middleware
Labels: security, backend, P0
Description: <copy dari 09-findings.md>
Checklist:
- [ ] Create middleware class
- [ ] Register alias
- [ ] Apply ke admin/dosen/dpl route groups
- [ ] Add to PERMISSION_MAP path or skip list
- [ ] Test coverage
- [ ] Update docs
Acceptance:
- User admin tanpa 2FA → 403 TWO_FACTOR_SETUP_REQUIRED kecuali setup route
- User admin dengan 2FA → normal flow
- Regression test merge ke master
```

## Komunikasi ke Stakeholder

Ringkas untuk executive:

> Codebase SIBERMAS dalam kondisi **production-ready** untuk skala kampus. Audit 2026-05-11 menemukan 2 issue critical yang harus di-fix dalam 1 minggu (2FA enforcement + signed URL private files), sejumlah medium issue terkait test coverage + dokumentasi, dan rekomendasi roadmap 3 bulan untuk operational maturity (DR, observability, deployment automation). Temuan sebelumnya dari 10+ ronde audit sudah di-resolve — kode ini sudah melalui banyak iterasi hardening.
