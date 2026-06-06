# KKN UIN SAIZU Portal (SIBERMAS)

Sistem Informasi KKN untuk UIN Prof. K.H. Saifuddin Zuhri Purwokerto.

**Platform:** FreeBSD 14.x · Monorepo (pnpm) · Laravel 13 · Next.js 15

---

## 📚 Dokumentasi Lengkap

| Dokumen | Isi |
|---------|-----|
| [`docs/DEPLOY_FREEBSD.md`](docs/DEPLOY_FREEBSD.md) | Jalur paling sederhana: single-server FreeBSD native + `deploy-freebsd-simple.sh` |
| [`docs/DEPLOY_APACHE24_NGINX.md`](docs/DEPLOY_APACHE24_NGINX.md) | Profile Apache24 backend + Nginx frontend + `rc.d` tanpa Supervisor |
| [`docs/FREEBSD_AUDIT.md`](docs/FREEBSD_AUDIT.md) | Audit deploy FreeBSD dan keputusan simplifikasi |
| [`docs/JAILS_MIGRATION.md`](docs/JAILS_MIGRATION.md) | Migrasi lanjutan ke FreeBSD Jails |
| [`docs/SCALING_5000.md`](docs/SCALING_5000.md) | Scaling untuk 5000 concurrent users — PHP-FPM 200, Next.js cluster ×4, pgbouncer, PostgreSQL tuning, sysctl |

---

## 🏗️ Arsitektur

### Production sederhana: Single-Server Native

```
Internet (80/443)
      |
    Nginx
   /     \
Next.js  Laravel API
:3000    PHP-FPM socket
   \     /
PostgreSQL + Redis lokal
```

Ini jalur utama untuk deploy awal dan maintenance harian.

### Opsi lanjutan: Multi-Jails VNET

```
                  Internet (port 80/443)
                         |
          [Jail: nginx-proxy] 10.0.0.10
                nginx reverse proxy
               /                  \
              /                    \
  [Jail: web] 10.0.0.11     [Jail: api] 10.0.0.12
  Next.js ×4 (cluster)      Nginx :8080 → PHP-FPM (socket)
  :3000,3001,3002,3003       Queue workers (10+4+2)
              \                    /
               \                  /
          [Jail: data-services] 10.0.0.13
          PostgreSQL 18 + pgbouncer :6432
          Redis 8
```

---

## 🚀 Quick Start

### Setup Single-Server Native

```bash
# Di server FreeBSD sebagai root:
git clone https://github.com/putrihati-cmd/KKNNATIVE.git \
  /usr/local/www/apache24/data/Sibermas2026
cd /usr/local/www/apache24/data/Sibermas2026

sh scripts/preflight-freebsd.sh
sh install-freebsd.sh
KKN_SUPERADMIN_PASSWORD='<strong-password-from-secret-manager>' bash deploy-freebsd-simple.sh
```

### Deploy Ulang

```bash
cd /usr/local/www/apache24/data/Sibermas2026
git pull origin main
bash deploy-freebsd-simple.sh
```

---

## 🗂️ Struktur Project

```
├── apps/
│   ├── api/              # Laravel 13 backend
│   │   ├── supervisord.conf           # Legacy single-server / referensi worker
│   │   ├── supervisord.jail-api.conf  # Jails: queue workers (10+4+2)
│   │   └── .env.production.example    # Template production env
│   └── web/              # Next.js 15 frontend
│       ├── supervisord.jail-web.conf  # Jails: cluster ×4 instances
│       └── next.config.ts             # Standalone build for FreeBSD
├── packages/             # Shared TS packages (5 packages)
├── conf/                 # FreeBSD config files
│   ├── rc.d/sibermas_web         # Native single-host Next.js service
│   ├── rc.d/sibermas_queue       # Native single-host queue workers
│   ├── php-fpm.sibermas.conf   # PHP-FPM pool single-server sederhana
│   ├── php-fpm.www.conf         # max_children=200
│   ├── php-opcache.ini          # 256MB OPcache
│   ├── nginx-api-jail.conf      # API jail Nginx :8080 → php-fpm socket
│   ├── nginx-scaling.conf       # 8192 connections, upstream cluster
│   ├── postgresql-scaling.conf  # 8GB shared_buffers, 300 conn
│   ├── pgbouncer.ini            # Connection pooler
│   ├── supervisord-web-cluster.conf  # Next.js ×4
│   └── sysctl-scaling.conf      # Kernel tuning (maxfiles, TCP, shm)
├── scripts/
│   ├── backup.sh         # Database + storage backup
│   ├── restore.sh        # Restore from backup
│   └── ci-guard.mjs      # CI security guard
├── docs/
│   ├── FREEBSD_AUDIT.md      # Audit + simplifikasi deploy FreeBSD
│   ├── JAILS_MIGRATION.md    # Panduan migrasi jails (1165 baris)
│   ├── SCALING_5000.md       # Panduan scaling 5000 user
│   └── DEPLOY_FREEBSD.md     # Deploy single-server native
├── deploy-atomic.sh      # Atomic zero-downtime deploy
├── deploy-freebsd-simple.sh # Deploy/redeploy single-server native
├── jail_setup.sh         # Auto-setup jail + bridge + paket
├── install-freebsd.sh    # Install single-server native
├── remote-deploy.sh      # Remote deploy via SSH key
└── nginx-freebsd.conf    # Template Nginx config
```

---

## 📱 Mobile Responsif

Semua halaman admin, dosen, dan mahasiswa sudah responsif:
- **Sidebar:** Mobile overlay + hamburger, desktop fixed (✅)
- **Tabel:** Card layout di mobile untuk tabel lebar (✅)
- **Form:** `grid-cols-1 sm:grid-cols-2` untuk semua form modal (✅)
- **Search:** `w-full sm:w-64` (✅)
- **Captcha:** `w-20 sm:w-24` (✅)

---

## 🔧 Scaling (5000 Concurrent Users)

| Komponen | Single-Server | 5000 Users |
|----------|--------------|------------|
| PHP-FPM | max_children=50 | max_children=200 |
| Next.js | 1 instance | 4 instance (cluster) |
| Queue | 4 workers | 16 workers (10+4+2) |
| PostgreSQL | 100 connections | 300 + pgbouncer |
| RAM | 8 GB | 32 GB |
| CPU | 4 core | 8+ core |

Detail: [`docs/SCALING_5000.md`](docs/SCALING_5000.md)

---

## 🔥 Perintah Penting

```bash
# Native single-host
service sibermas_web restart
service sibermas_queue restart
service nginx reload

# Jails
jexec api supervisorctl restart workers:*   # Restart queue
jexec web supervisorctl restart sibermas-web # Restart Next.js
jexec nginx-proxy service nginx reload      # Reload nginx
service jail start <name>                    # Start jail

# Logs
jexec api tail -f /var/log/sibermas/worker-default.log
jexec web tail -f /var/log/sibermas/web.log

# Status
jexec api supervisorctl status
curl -s https://sibermas.uinsaizu.ac.id/api/health | jq .
```

---

## 👥 Kontribusi

1. Fork repository
2. Buat branch: `git checkout -b fitur-xxx`
3. Commit: `git commit -m "feat: ..."`
4. Push: `git push origin fitur-xxx`
5. Buat Pull Request
