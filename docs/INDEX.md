# SIBERMAS KKN UIN SAIZU - DOCUMENTATION INDEX

**Tanggal:** 11 Mei 2026
**Versi:** 3.0
**Status:** SIAP DEPLOY (setelah secret rotation)

---

## Source of Truth

**[AUDIT_CODEBASE_2026-05-11/](./AUDIT_CODEBASE_2026-05-11/README.md)** — Audit komprehensif terbaru.

| File | Isi |
|---|---|
| [README.md](./AUDIT_CODEBASE_2026-05-11/README.md) | Indeks audit + panduan navigasi |
| [00-executive-summary.md](./AUDIT_CODEBASE_2026-05-11/00-executive-summary.md) | Verdict + matriks status |
| [01-arsitektur.md](./AUDIT_CODEBASE_2026-05-11/01-arsitektur.md) | Monorepo, tech stack, role pengguna |
| [02-backend.md](./AUDIT_CODEBASE_2026-05-11/02-backend.md) | Laravel controllers, middleware, services, auth |
| [03-database.md](./AUDIT_CODEBASE_2026-05-11/03-database.md) | Skema, migrasi, PII encryption, integrity |
| [04-frontend.md](./AUDIT_CODEBASE_2026-05-11/04-frontend.md) | Next.js routing, CSP, sanitization, komponen |
| [05-mobile.md](./AUDIT_CODEBASE_2026-05-11/05-mobile.md) | Expo auth flow, offline queue, push |
| [06-security.md](./AUDIT_CODEBASE_2026-05-11/06-security.md) | Postur keamanan end-to-end |
| [07-testing.md](./AUDIT_CODEBASE_2026-05-11/07-testing.md) | Coverage backend/frontend/mobile + CI |
| [08-deployment.md](./AUDIT_CODEBASE_2026-05-11/08-deployment.md) | FreeBSD deploy, nginx, supervisor, backup |
| [09-findings.md](./AUDIT_CODEBASE_2026-05-11/09-findings.md) | Seluruh temuan + severity + fix |
| [10-action-plan.md](./AUDIT_CODEBASE_2026-05-11/10-action-plan.md) | Roadmap P0-P3 dengan effort estimate |

---

## Dokumen Aktif

| Dokumen | Deskripsi |
|---|---|
| **[MASTER.md](MASTER.md)** | Overview sistem (perlu update minor) |
| **[README.md](README.md)** | Project overview |
| **[RBAC.md](RBAC.md)** | Roles, Permissions, Middleware |
| **[WORKFLOW.md](WORKFLOW.md)** | KKN Workflow, 6 phases, API routes |
| **[WEB.md](WEB.md)** | Next.js 15 frontend docs |
| **[SECURITY.md](SECURITY.md)** | Security guidelines |
| **[QUICK_START.md](QUICK_START.md)** | Panduan cepat mulai |
| **[RBAC_GUIDE.md](RBAC_GUIDE.md)** | RBAC configuration guide |
| **[adr/ADR-001](adr/ADR-001-no-encryption-for-nilai-scores.md)** | Architecture Decision Record |

---

## Quick Reference

### Development

```bash
# Install
pnpm install
cd apps/api && composer install

# Setup
cd apps/api && cp .env.example .env && php artisan key:generate && php artisan migrate --seed

# Run
pnpm --filter web dev            # Web (port 3000)
cd apps/api && php artisan serve  # API (port 8000)
```

### Testing

```bash
cd apps/api && composer test       # Backend (Pest)
pnpm --filter web test             # Frontend (Vitest)
pnpm --filter web type-check       # TypeScript
pnpm --filter web build            # Production build
```

### Deploy

```bash
cd apps/api && composer install --no-dev --optimize-autoloader
cd apps/api && php artisan migrate --force
cd apps/api && php artisan config:cache && php artisan route:cache
pnpm install && pnpm build
supervisorctl restart all
```

---

**Last Updated:** 11 Mei 2026
**Author:** SIBERMAS Development Team
