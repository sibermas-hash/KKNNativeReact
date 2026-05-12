# SIBERMAS — FreeBSD Jails Migration

**Versi Runtime:**
| Komponen | Versi |
|----------|-------|
| FreeBSD | 14.x |
| Node.js | 24.14.1 (`node24`) |
| PHP | 8.4.19 (`php84`) |
| PostgreSQL | 18.3 (`postgresql18-server`)  |
| Redis | 8.6.2 (`redis`) |
| Laravel | 13.x |
| Next.js | 15.x |

## Architecture (Multi-Jails VNET — Recommended)

```
                  Internet (port 80/443)
                         |
                   [Jail: nginx-proxy]
                   nginx reverse proxy
                  /                  \
                 /                    \
     [Jail: web]                       [Jail: api]
     Node.js Next.js                   Nginx :8080
     :3000 (internal)                     │
     standalone server               PHP-FPM (Unix socket)
                                          Queue workers
                                          Artisan scheduler
                 \                    /
                  \                  /
             [Jail: data-services]
             PostgreSQL 18 :5432
             Redis 8       :6379
```

## Rekomendasi: Multi-Jails VNET (Production)

**Pilihan: Multi-Jails VNET** — 4 jail terpisah dengan Virtual Network Stack.

### Kelebihan:
- Isolasi penuh — tiap jail punya lo0, firewall (pf), routing sendiri
- Kegagalan satu jail tidak berdampak ke jail lain
- Port binding bebas (tidak konflik antar jail atau dengan host)
- Skalabilitas horizontal di masa depan

### Kekurangan:
- Overhead resource sedikit lebih besar
- Setup bridge + epair + NAT memakan waktu
- Troubleshooting lebih kompleks

### Alternatif: Single Fat Jail

Untuk server dengan resource terbatas (≤4GB RAM), pertimbangkan **satu jail besar**
yang berisi semua service (Nginx, Node.js, PHP-FPM, PostgreSQL, Redis, Supervisor).

Kelebihan:
- Setup lebih sederhana (satu jail.conf, satu fstab)
- Overhead kernel minimal (satu instance jail)
- Komunikasi antar service bisa pakai Unix socket atau localhost

Kekurangan:
- Tidak ada isolasi antar service — kalau Node.js crash karena OOM, DB ikut kena
- Tidak bisa scale per-service
- Tidak ada segmentasi network

**Rekomendasi:** Gunakan Multi-Jails VNET untuk production. Gunakan
`jail_setup.sh --fat` untuk quickstart Single Fat Jail.

## Jail Network

- nginx-proxy: 10.0.0.10 (public-facing, maps ports 80/443)
- web:         10.0.0.11
- api:         10.0.0.12
- data:        10.0.0.13

## Networking: VNET vs Shared IP

Two approaches exist for jail networking — choose based on your isolation needs:

### VNET (Virtual Network Stack)

```
pros:
  - Each jail has its own lo0, netisr, and firewall (pf)
  - Full root/jail isolation — jail cannot see host interfaces
  - Can bind any port inside without conflicting with host
  - Closest to VM-level networking behavior

cons:
  - Requires bridge + epair setup (tricky to configure)
  - Slightly more overhead per jail
  - Need to configure IP forwarding + NAT on host for egress

setup:
    # Host: create bridge + epair for each jail
    sysrc cloned_interfaces+="bridge0"
    service netif cloneup
    ifconfig bridge0 addm em0
    ifconfig bridge0 10.0.0.1/24 up
    echo 'net.link.bridge.pfil_onlyip=0' >> /etc/sysctl.conf

    # Jail config uses vnet.interface + epair:
    api {
        vnet;
        vnet.interface = "epair1b";
        $ip = "10.0.0.12";
        ...
    }

    # pf.conf: NAT for jail egress
    nat on egress from 10.0.0.0/24 to any -> (egress)
    rdr on egress proto tcp to port { 80 443 } -> 10.0.0.10
```

### Shared IP (IP Alias)

```
pros:
  - Simpler — just alias an IP onto host interface
  - No bridge/NAT configuration
  - Lighter weight

cons:
  - Jail shares host's network stack — can't bind port 80 if
    host nginx already uses it (use different ports per jail)
  - Less isolation — jail can see host interfaces
  - Requires careful port allocation to avoid conflicts

setup (jail.conf):
    nginx-proxy {
        ip4.addr = "em0|10.0.0.10";
        interface = em0;
        ...
    }
    # Each jail aliases its IP onto the host's physical NIC
```

### Recommendation for SIBERMAS

Use **VNET** for production (better isolation + ports don't conflict).
Use **Shared IP** for staging/testing (simpler to debug).

## Jail Configuration

### Host: `/etc/jail.conf`

```
exec.start  = "/bin/sh /etc/rc";
exec.stop   = "/bin/sh /etc/rc.shutdown";
exec.clean;
mount.devfs;

path = /usr/local/jails/$name;

# ─── Multi-Jails VNET Configuration ──────────────────────────────

nginx-proxy {
    $ip     = "10.0.0.10";
    $bridge = "jailnet";
    vnet;
    vnet.interface = "epair0b";
    ip4.addr = $ip;
    allow.raw_sockets;
    mount.fstab = "/etc/jails.fstab.nginx-proxy";
    exec.prestart  = "ifconfig epair0a up";
    exec.poststart = "ifconfig $bridge addm epair0a";
    exec.poststop  = "ifconfig epair0a destroy";
}

web {
    $ip     = "10.0.0.11";
    $bridge = "jailnet";
    vnet;
    vnet.interface = "epair1b";
    ip4.addr = $ip;
    mount.fstab = "/etc/jails.fstab.web";
    exec.prestart  = "ifconfig epair1a up";
    exec.poststart = "ifconfig $bridge addm epair1a";
    exec.poststop  = "ifconfig epair1a destroy";
}

api {
    $ip     = "10.0.0.12";
    $bridge = "jailnet";
    vnet;
    vnet.interface = "epair2b";
    ip4.addr = $ip;
    mount.fstab = "/etc/jails.fstab.api";
    exec.prestart  = "ifconfig epair2a up";
    exec.poststart = "ifconfig $bridge addm epair2a";
    exec.poststop  = "ifconfig epair2a destroy";
}

data-services {
    $ip     = "10.0.0.13";
    $bridge = "jailnet";
    vnet;
    vnet.interface = "epair3b";
    ip4.addr = $ip;
    mount.fstab = "/etc/jails.fstab.data";
    exec.prestart  = "ifconfig epair3a up";
    exec.poststart = "ifconfig $bridge addm epair3a";
    exec.poststop  = "ifconfig epair3a destroy";
}
```

### Host: Bridge Network

```sh
# Create bridge interface (once)
sysrc cloned_interfaces+="bridge0"
service netif cloneup

# Attach host network + jail ips
ifconfig bridge0 addm em0
ifconfig bridge0 10.0.0.1/24 up
echo 'net.link.bridge.pfil_onlyip=0' >> /etc/sysctl.conf
```

### Host: Packet Filter (pf.conf)

```
# NAT — route jails to internet
nat on egress from 10.0.0.0/24 to any -> (egress)

# Forward ports to nginx-proxy jail
rdr on egress proto tcp to port { 80 443 } -> 10.0.0.10

# Allow SSH to host
pass in proto tcp to port 1977
```

## Setup Per Jail

### 1. Jail: data-services (PostgreSQL + Redis)

**Install:**
```sh
pkg install -y postgresql18-server postgresql18-client redis
sysrc postgresql_enable="YES"
sysrc redis_enable="YES"
```

**PostgreSQL** (`/var/db/postgres/data18/postgresql.conf`):
```
listen_addresses = '10.0.0.13'
port = 5432
```

**pg_hba.conf** (`/var/db/postgres/data18/pg_hba.conf`):
```
host    kkn_production    kkn_app    10.0.0.0/24    md5
```

**Redis** (`/usr/local/etc/redis.conf`):
```
bind 10.0.0.13
port 6379
requirepass <strong-password>
```

**Start:**
```sh
service postgresql initdb
service postgresql start
service redis start

# Create database
echo "CREATE USER kkn_app WITH PASSWORD '<db-pass>';" | su -l postgres -c psql
echo "CREATE DATABASE kkn_production OWNER kkn_app;" | su -l postgres -c psql
```

---

### 2. Jail: api (Nginx + PHP-FPM + Queue Workers)

Arsitektur two-nginx: api jail menjalankan Nginx sendiri untuk serve PHP via FastCGI
ke PHP-FPM (Unix socket). nginx-proxy jail cukup proxy HTTP ke api jail port 8080.
Ini menghindari masalah FastCGI cross-jail (PHP-FPM tidak speak HTTP).

**Install:**
```sh
pkg install -y php84 php84-extensions php84-pdo php84-pdo_pgsql \
  php84-pgsql php84-mbstring php84-xml php84-curl php84-zip \
  php84-gd php84-intl php84-bcmath php84-redis php84-opcache \
  php84-tokenizer php84-fileinfo php84-ctype php84-dom \
  php84-session php84-simplexml php84-xmlwriter php84-xmlreader \
  php84-openssl php84-filter php84-sodium php84-pcntl php84-posix \
  composer nginx py311-supervisor git curl bash
sysrc nginx_enable="YES"
sysrc php_fpm_enable="YES"
sysrc supervisord_enable="YES"
```

**PHP-FPM pool** (`/usr/local/etc/php-fpm.d/www.conf`):
```ini
; Gunakan Unix socket (lebih cepat), Nginx di api jail yang handle FastCGI
listen = /var/run/php-fpm.sock
listen.owner = www
listen.group = www
listen.mode = 0660
user = www
group = www
pm = dynamic
pm.max_children = 50
pm.start_servers = 5
pm.min_spare_servers = 3
pm.max_spare_servers = 8
```

**Nginx config** (`/usr/local/etc/nginx/nginx.conf` di api jail):
```nginx
user www;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       /usr/local/etc/nginx/mime.types;
    default_type  application/octet-stream;
    sendfile      on;
    keepalive_timeout 65;

    access_log /var/log/nginx/access.log;

    server {
        listen 8080;  # internal, hanya dari nginx-proxy jail (10.0.0.10)
        root /usr/local/www/sibermas/api/public;

        index index.php;

        # Security: block dotfiles
        location ~ /\. {
            deny all;
        }

        # Static files langsung dari disk
        location /storage/ {
            try_files $uri $uri/ =404;
            expires 30d;
        }

        # Laravel entry point
        location / {
            try_files $uri $uri/ /index.php?$query_string;
        }

        # PHP-FPM via Unix socket
        location ~ \.php$ {
            fastcgi_pass unix:/var/run/php-fpm.sock;
            fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
            include fastcgi_params;
            fastcgi_read_timeout 300;
            fastcgi_buffers 16 16k;
            fastcgi_buffer_size 32k;
            fastcgi_pass_header Authorization;
            fastcgi_param HTTP_AUTHORIZATION $http_authorization;
            fastcgi_param HTTP_X_XSRF_TOKEN $http_x_xsrf_token;
        }

        access_log /var/log/nginx/sibermas-access.log;
        error_log  /var/log/nginx/sibermas-error.log;
    }
}
```

**App directory:**
```sh
mkdir -p /usr/local/www/sibermas/api
# Mount repo's apps/api here (via nullfs from host or git clone)
```

**Cron** (via `/etc/crontab`):
```
* * * * * www /usr/local/bin/php /usr/local/www/sibermas/api/artisan schedule:run 2>&1
```

**Supervisor config** (`/usr/local/etc/supervisord.d/sibermas-api.conf`):
```
[program:sibermas-worker-default]
process_name=%(program_name)s_%(process_num)02d
command=/usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:work --queue=default,critical,high --sleep=3 --tries=3 --max-time=3600
directory=/usr/local/www/sibermas/api
autostart=true
autorestart=true
user=www
numprocs=2
umask=002
environment=UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/worker-default.log
stopwaitsecs=3600

[program:sibermas-worker-low]
process_name=%(program_name)s_%(process_num)02d
command=/usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:work --queue=low --sleep=5 --tries=3 --max-time=3600
directory=/usr/local/www/sibermas/api
autostart=true
autorestart=true
user=www
numprocs=1
umask=002
environment=UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/worker-low.log
stopwaitsecs=3600

[program:sibermas-worker-long]
process_name=%(program_name)s
command=/usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:work --queue=long --sleep=10 --tries=1 --max-time=7200
directory=/usr/local/www/sibermas/api
autostart=true
autorestart=true
user=www
numprocs=1
umask=002
environment=UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/worker-long.log
stopwaitsecs=3600

[group:workers]
programs=sibermas-worker-default,sibermas-worker-low,sibermas-worker-long
priority=999
```

---

### 3. Jail: web (Next.js Standalone)

**Install:**
```sh
pkg install -y node24 npm-node24 git curl bash
```

**App directory:**
```sh
mkdir -p /usr/local/www/sibermas/web
# Mount repo's apps/web/.next/standalone here (via nullfs from host)
```

**Supervisor config** (`/usr/local/etc/supervisord.d/sibermas-web.conf`):
```
[program:sibermas-web]
process_name=%(program_name)s
command=/usr/local/bin/node /usr/local/www/sibermas/web/server.js
directory=/usr/local/www/sibermas/web
autostart=true
autorestart=true
user=www
umask=002
environment=NODE_ENV="production",PORT="3000",HOSTNAME="0.0.0.0",UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/web.log
stopwaitsecs=30
```

---

### 4. Jail: nginx-proxy (Reverse Proxy + SSL)

Arsitektur two-nginx: nginx-proxy jail cukup proxy HTTP ke api jail port 8080.
Api jail menjalankan Nginx sendiri yang fastcgi_pass ke PHP-FPM via Unix socket.
Ini lebih aman dan sederhana daripada FastCGI cross-jail.

**Install:**
```sh
pkg install -y nginx py311-certbot curl
sysrc nginx_enable="YES"
```

**Nginx config** (`/usr/local/etc/nginx/nginx.conf`):

```nginx
user www;
worker_processes auto;
worker_rlimit_nofile 65536;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 4096;
    multi_accept on;
    use kqueue;
}

http {
    include       /usr/local/etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    sendfile on;
    keepalive_timeout 65;
    client_max_body_size 50M;
    gzip on;
    gzip_types text/plain text/css application/json application/javascript
               text/xml application/xml image/svg+xml;

    # Rate-limit
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=60r/s;
    limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

    server {
        listen 80;
        server_name sibermas.uinsaizu.ac.id;
        return 301 https://$host$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name sibermas.uinsaizu.ac.id;

        ssl_certificate     /usr/local/etc/letsencrypt/live/sibermas.uinsaizu.ac.id/fullchain.pem;
        ssl_certificate_key /usr/local/etc/letsencrypt/live/sibermas.uinsaizu.ac.id/privkey.pem;
        ssl_protocols       TLSv1.2 TLSv1.3;
        ssl_ciphers         HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_stapling        on;
        ssl_stapling_verify on;

        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=(self)" always;

        # API → api jail (port 8080 = Nginx + PHP-FPM via Unix socket)
        location ^~ /api/ {
            limit_req zone=api_limit burst=50 nodelay;
            limit_conn conn_limit 20;

            proxy_pass http://10.0.0.12:8080/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_read_timeout 120s;
            proxy_send_timeout 60s;
            proxy_set_header X-Forwarded-Prefix /api;
        }

        # API storage files → api jail Nginx
        location /storage/ {
            proxy_pass http://10.0.0.12:8080;
            proxy_set_header Host $host;
            expires 30d;
        }

        # Next.js static files → web jail
        location /_next/static/ {
            proxy_pass http://10.0.0.11:3000;
            proxy_http_version 1.1;
            expires 1y;
            add_header Cache-Control "public, immutable";
            add_header X-Content-Type-Options "nosniff" always;
            access_log off;
        }

        # Public images → web jail
        location /images/ {
            proxy_pass http://10.0.0.11:3000;
            expires 7d;
        }

        location = /favicon.ico {
            proxy_pass http://10.0.0.11:3000;
            access_log off;
        }

        location = /robots.txt {
            proxy_pass http://10.0.0.11:3000;
            access_log off;
        }

        # Everything else → Next.js
        location / {
            limit_conn conn_limit 50;
            proxy_pass http://10.0.0.11:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 60s;
            proxy_send_timeout 60s;
        }

        access_log /var/log/nginx/sibermas-access.log main;
        error_log  /var/log/nginx/sibermas-error.log;
    }
}
```

**SSL certificate:**
```sh
pkg install -y py311-certbot
certbot certonly --webroot \
  -w /usr/local/www/sibermas/api/public \
  -d sibermas.uinsaizu.ac.id \
  --cert-name sibermas.uinsaizu.ac.id \
  -m admin@uinsaizu.ac.id --agree-tos -n
```

---

## NullFS Mounts — Key Considerations

NullFS enables read-only (ro) or read-write (rw) mounting of host directories
into jails. This is critical for both disk efficiency and build speed.

### What to mount

| Host Directory | Jail Mount Point | Mode | Purpose |
|---------------|------------------|------|---------|
| `releases/current/apps/web/.next/standalone` | web: `/usr/local/www/sibermas/web` | ro | Next.js runtime (no writes) |
| `releases/current/apps/api` | api: `/usr/local/www/sibermas/api` | rw | Laravel + storage (writes logs, cache, uploads) |
| `releases/current/node_modules` | web: `/node_modules` | ro | Avoid re-installing per jail |
| `releases/current/apps/web/node_modules` | both: `.` | ro | Symlink-friendly sharing |
| `releases/current/apps/api/vendor` | api: `./vendor` | ro | Composer deps (built once) |

### Performance tip

Mount `node_modules` and `.next/cache` read-only from the host into the web
jail. This avoids duplicating the entire dependency tree across jails.
The build runs on the host (or CI), jails only need the runtime output:

```
# /etc/jails.fstab.web
/usr/local/www/sibermas/releases/current/apps/web/.next/standalone  \
    /usr/local/jails/web/usr/local/www/sibermas/web  nullfs  ro  0  0

/usr/local/www/sibermas/releases/current/node_modules  \
    /usr/local/jails/web/usr/local/node_modules  nullfs  ro  0  0
```

## Data Persistence — NullFS Storage Strategy

Agar `storage/app/public/` (user uploads, laporan, foto KKN) tetap bisa dibackup
dari host, mount direktori storage secara terpisah dengan mode `rw`:

### Host → API Jail: `storage/app/public`

```
# /etc/jails.fstab.api
/usr/local/www/sibermas/releases/current/apps/api  /usr/local/jails/api/usr/local/www/sibermas/api  nullfs  rw  0  0

# Mount storage terpisah agar persist antar release
/usr/local/www/sibermas/shared/storage  /usr/local/jails/api/usr/local/www/sibermas/api/storage  nullfs  rw  0  0
```

Lalu di release directory, `storage/` adalah symlink:

```sh
# Di dalam release, storage → shared location
cd /usr/local/www/sibermas/releases/current/apps/api
rm -rf storage
ln -sf /usr/local/www/sibermas/shared/storage storage
```

### Host → Data Services Jail: DB + Redis

```
# /etc/jails.fstab.data
/usr/local/jails/data/var/db/postgres  /usr/local/jails/data/var/db/postgres  nullfs  rw  0  0
/usr/local/jails/data/var/db/redis     /usr/local/jails/data/var/db/redis     nullfs  rw  0  0
```

Data PostgreSQL dan Redis tetap di dalam jail filesystem, bukan nullfs dari host.
Backup DB via `pg_dump` dari host (bukan file-copy).

### Data Migration: pg_dump Native → pg_restore ke Jail

```sh
# Step 1: Dump dari native PostgreSQL
pg_dump --host=127.0.0.1 --port=5432 --username=kkn_app \
  --format=custom --no-owner --no-privileges \
  --file=/tmp/kkn_production_$(date +%Y%m%d).dump \
  kkn_production

# Step 2: Copy dump ke data-services jail
cp /tmp/kkn_production_*.dump /usr/local/jails/data/tmp/

# Step 3: Restore di dalam jail
jexec data-services
pg_restore --host=10.0.0.13 --port=5432 --username=kkn_app \
  --dbname=kkn_production --no-owner --no-privileges \
  --clean --if-exists /tmp/kkn_production_*.dump
exit

# Alternatif: restore via psql pipe (lebih cepat untuk dump plain)
jexec data-services su -l postgres -c \
  "psql kkn_production < /tmp/dump_plain.sql"
```

### Backup Script untuk Jails Mode

Adaptasi `scripts/backup.sh`: akses DB via TCP ke `10.0.0.13:5432`:

```sh
# Backup dari host ke data-services jail
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  --host=10.0.0.13 --port=5432 --username=kkn_app \
  --format=custom --no-owner --no-privileges \
  --file=/var/backups/sibermas/db_$(date +%Y%m%d_%H%M%S).dump \
  kkn_production
```

---

## Turborepo Workaround (FreeBSD)

Turborepo tidak punya binary native untuk FreeBSD x64 di registry npm.
Workaround: skip download binary Rust turborepo dan gunakan fallback Go
turborepo (v1.x) atau build manual.

### Opsi 1: Skip download (recommended)

```sh
# Set sebelum install/turbo command
export TURBO_INSTALL_SKIP_DOWNLOAD=1
export TURBO_BINARY_PATH=/usr/local/bin/turbo

# Install Go-based turbo (v1.x) di host/jail
# (Turborepo v1 kompatibel dengan Go runtime di FreeBSD)
sudo pkg install -y turbo  # jika tersedia di pkg
# atau install via npm dengan native build skip:
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile
```

### Opsi 2: Build pnpm turbo di host, copy .turbo ke jail

```sh
# Di build server / CI (macOS / Linux):
pnpm build
# Hasil build ada di .turbo/ cache

# Rsync hasil build + node_modules ke host FreeBSD
rsync -avz --delete \
  --exclude='.turbo/cache' \
  --exclude='apps/web/node_modules' \
  . turbo@freebsd-host:/usr/local/www/sibermas/releases/current/

# Di host FreeBSD, skip turbo download dan gunakan cache yang sudah ada
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile --production
```

### Opsi 3: Manual pnpm build per-app (No Turbo)

```sh
# Skip turbo, build langsung via pnpm --filter
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm install --frozen-lockfile

# Build packages dulu
pnpm --filter @sibermas/shared-types build
pnpm --filter @sibermas/schemas build
pnpm --filter @sibermas/constants build
pnpm --filter @sibermas/api-client build
pnpm --filter @sibermas/hooks build

# Build web
pnpm --filter web build

# Build turboless di package.json scripts:
# "build:freebsd": "pnpm --filter @sibermas/shared-types build && ..."
```

### Recommended package.json script (apps/web is the only build needed in prod):

Sudah ada di root `package.json`:
```json
{
  "build:web": "pnpm --filter web build"
}
```

Gunakan untuk FreeBSD:
```sh
TURBO_INSTALL_SKIP_DOWNLOAD=1 pnpm run build:web
```

---

## NullFS Mounts — Key Considerations

NullFS enables read-only (ro) or read-write (rw) mounting of host directories
into jails. This is critical for both disk efficiency and build speed.

### What to mount

| Host Directory | Jail Mount Point | Mode | Purpose |
|---------------|------------------|------|---------|
| `releases/current/apps/web/.next/standalone/apps/web` | web: `/usr/local/www/sibermas/web` | ro | Next.js runtime (no writes) |
| `releases/current/apps/api` | api: `/usr/local/www/sibermas/api` | rw | Laravel + storage (writes logs, cache, uploads) |
| `shared/storage` | api: `/usr/local/www/sibermas/api/storage` | rw | User uploads persist antar release |
| `releases/current/apps/api/vendor` | api: `./vendor` | ro | Composer deps (built once) |
| `releases/current/node_modules` | (optional, only for non-standalone mode) | ro | |

### Watch out

- **nullfs + `union`**: Do NOT use nullfs with union mounts for
  writeable directories — union has known issues with file deletion.
  Use `rw` nullfs directly for writeable mounts (like Laravel storage).
- **File locking**: nullfs does NOT propagate `flock()` across jails
  reliably. Not an issue for SIBERMAS (no cross-jail file locking needed).
- **SELinux/mac_bsdextended**: If enabled, may block nullfs access
  between jails. Ensure `mac_bsdextended` rules allow it, or disable.
- **Shared storage symlink**: Set up `storage/` → `shared/storage` symlink
  di setiap release agar file upload persist saat rollback.

---

## Internal Networking Between Jails

All cross-jail communication uses TCP/IP on the 10.0.0.0/24 bridge:

| From | To | Port | Protocol | Purpose |
|------|----|------|----------|---------|
| api | data-services | 5432 | TCP | PostgreSQL |
| api | data-services | 6379 | TCP | Redis |
| nginx-proxy | web | 3000 | HTTP | Next.js reverse proxy |
| nginx-proxy | api | 8080 | HTTP | Nginx (api jail) → PHP-FPM internally |
| nginx-proxy | api | 80/443 | HTTP | API health check |

### Things to configure

**PostgreSQL** (in data-services jail):
```
listen_addresses = '10.0.0.13'          # in postgresql.conf
host  kkn_production  kkn_app  10.0.0.0/24  md5  # in pg_hba.conf
```

**Redis** (in data-services jail):
```
bind 10.0.0.13                          # in redis.conf
```

**PHP-FPM** (in api jail):
```
listen = /var/run/php-fpm.sock          # Unix socket (lebih cepat)
listen.owner = www
listen.group = www
listen.mode = 0660
```
Nginx di api jail yang akan fastcgi_pass ke socket ini. nginx-proxy jail
cukup proxy HTTP ke api jail port 8080 (Nginx).

**Next.js** (in web jail):
```
HOSTNAME="0.0.0.0"                      # bind all interfaces
PORT="3000"
```

### Troubleshooting

If cross-jail connections fail:
```
# Verify jail can reach each other
jexec api ping -c2 10.0.0.13

# Check listening ports inside each jail
jexec data-services sockstat -l | grep -E '(5432|6379)'

# Check pf firewall on host — may be blocking bridge traffic
# (bridge traffic should NOT pass through pf by default,
#  unless net.link.bridge.pfil_onlyip=1 is set)
sysctl net.link.bridge.pfil_onlyip
# → should be 0 for jail-to-jail traffic to bypass pf
```

---

## Dev-to-Prod Parity

Ensure **identical versions** on dev machine and all jails to avoid
subtle bugs from native extension differences:

| Component | Dev (macOS) | Prod (Jails) | File |
|-----------|-------------|--------------|------|
| PHP | 8.4.19 | `php84` | `.tool-versions` or docs |
| Node.js | 24.14.1 | `node24` | `package.json engines` |
| PostgreSQL | 18.3 | `postgresql18-server` | `.env` |
| Redis | 8.6.2 | `redis` | `.env` |
| Composer | latest | `composer` | `apps/api/composer.json` |

### Why this matters

Native PHP extensions like `bcrypt` (hashing), `redis` (session/cache),
and `pdo_pgsql` (database) may produce different results or behave
differently across versions. Specifically:

- **Argon2id hashing** (configured in `.env`):
  `php84` must support `sodium` extension for Argon2id.
- **Redis serialization**: `phpredis` extension version must match
  between dev and prod — serialization format changed between
  phpredis 5.x and 6.x.
- **Sharp (Next.js image)** (`apps/web/package.json`):
  macOS builds for ARM64; FreeBSD jail runs x64. Use
  `npm rebuild sharp` inside the jail if image optimization fails.

### Automation

Add a version check script (`scripts/check-versions.sh`) that runs
during deploy:

```sh
#!/bin/sh
echo "PHP:  $(php -v | head -1)"
echo "Node: $(node -v)"
echo "npm:  $(npm -v)"
echo "PSQL: $(psql --version)"
echo "Redis: $(redis-cli --version)"
```

Each jail needs access to the codebase. Use nullfs mounts from the host:

**`/etc/jails.fstab.web`**:
```
; Mount standalone/apps/web (bukan standalone root) supaya server.js
; langsung di /usr/local/www/sibermas/web/server.js — bukan
; /usr/local/www/sibermas/web/apps/web/server.js
/usr/local/www/sibermas/releases/current/apps/web/.next/standalone/apps/web  /usr/local/jails/web/usr/local/www/sibermas/web  nullfs  ro  0  0
```

Verifikasi struktur mount:
```sh
# Di dalam web jail, seharusnya:
# /usr/local/www/sibermas/web/server.js       ← entry point
# /usr/local/www/sibermas/web/.next/static/   ← static assets
# /usr/local/www/sibermas/web/public/         ← public assets
```

**`/etc/jails.fstab.api`**:
```
/usr/local/www/sibermas/releases/current/apps/api  /usr/local/jails/api/usr/local/www/sibermas/api  nullfs  rw  0  0
```

**`/etc/jails.fstab.data`**:
```
# Data-services jail — DB data tetap di dalam jail, backup via pg_dump
# Tidak perlu nullfs mount untuk PostgreSQL/Redis data.
# (Hanya untuk shared storage jika ada akses cross-jail)
```

Alternatif: mount seluruh `releases/current` ke setiap jail lalu pake symlink.

---

## Host: Deploy Flow

```sh
# On host or CI runner (macOS/Linux):
git clone https://github.com/anomalyco/kknuinsaizu.git /usr/local/www/sibermas/releases/$(date +%Y%m%d_%H%M%S)
cd /usr/local/www/sibermas/releases/latest
pnpm install --frozen-lockfile
pnpm build:web
cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static
cp -r apps/web/public apps/web/.next/standalone/apps/web/public

# API env
cd apps/api
composer install --no-dev --optimize-autoloader
cp .env.production.jail .env
# edit DB_HOST=10.0.0.13, REDIS_HOST=10.0.0.13
php artisan key:generate
php artisan migrate --force
php artisan config:cache
php artisan route:cache

# Fix permissions
chown -R www:www apps/api/storage apps/api/bootstrap/cache apps/web/.next

# Switch symlink
ln -sfn /usr/local/www/sibermas/releases/latest /usr/local/www/sibermas/releases/current

# Restart services (via SSH to each jail, atau jexec dari host)
# Opsi A: SSH ke setiap jail (wajib SSH server aktif di tiap jail)
ssh 10.0.0.12 supervisorctl restart workers:*
ssh 10.0.0.12 service nginx reload        # api jail Nginx
ssh 10.0.0.11 supervisorctl restart sibermas-web
ssh 10.0.0.10 service nginx reload        # nginx-proxy jail

# Opsi B: jexec dari host (tidak butuh SSH di jail)
jexec api supervisorctl restart workers:*
jexec api service nginx reload
jexec web supervisorctl restart sibermas-web
jexec nginx-proxy service nginx reload
```

---

## Environment Files

### `apps/api/.env.production.jail`

Copy from `.env.production.example` with these overrides:
```
APP_URL=https://sibermas.uinsaizu.ac.id/api
DB_HOST=10.0.0.13
REDIS_HOST=10.0.0.13
REDIS_PASSWORD=<redis-password>
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
```

### `apps/web/.env.production.jail`

Copy from `.env.production.example` with these overrides:
```
NEXT_PUBLIC_API_URL=https://sibermas.uinsaizu.ac.id/api/v1
NEXT_PUBLIC_APP_URL=https://sibermas.uinsaizu.ac.id
```

---

## Migration Steps (from single-server to jails)

### Phase 1: Host Preparation

```sh
# 1a. Buat bridge network + jail directories
sysrc cloned_interfaces+="bridge0"
service netif cloneup
ifconfig bridge0 addm em0
ifconfig bridge0 10.0.0.1/24 up
echo 'net.link.bridge.pfil_onlyip=0' >> /etc/sysctl.conf

# 1b. Buat direktori untuk semua jail
for jail in nginx-proxy web api data-services; do
  mkdir -p /usr/local/jails/$jail
  # Bootstrap base jail (FreeBSD 14.x base)
  bsdinstall jail /usr/local/jails/$jail
  # Atau pakai tar base:
  # tar -xzf /usr/freebsd-dist/base.txz -C /usr/local/jails/$jail
done

# 1c. Setup pf.conf
cat >> /etc/pf.conf << 'EOPF'
# NAT untuk jail egress
nat on egress from 10.0.0.0/24 to any -> (egress)
# Forward port 80/443 ke nginx-proxy
rdr on egress proto tcp to port { 80 443 } -> 10.0.0.10
EOPF
service pf restart
```

### Phase 2: Data Services

```sh
# 2a. Setup fstab untuk data-services jail
cat > /etc/jails.fstab.data << 'EOF'
/usr/local/jails/data/var/db/postgres  /usr/local/jails/data/var/db/postgres  nullfs  rw  0  0
/usr/local/jails/data/var/db/redis     /usr/local/jails/data/var/db/redis     nullfs  rw  0  0
EOF

# 2b. Install di dalam jail (jalankan via jexec)
service jail start data-services
jexec data-services pkg install -y postgresql18-server postgresql18-client redis
jexec data-services sysrc postgresql_enable="YES"
jexec data-services sysrc redis_enable="YES"
jexec data-services service postgresql initdb
# ... konfigurasi postgresql.conf, pg_hba.conf, redis.conf
jexec data-services service postgresql start
jexec data-services service redis start

# 2c. Migrate database
pg_dump --host=127.0.0.1 --port=5432 --username=kkn_app \
  --format=custom --no-owner --no-privileges \
  --file=/tmp/db_pre_migration.dump kkn_production

# Copy dump ke jail
cp /tmp/db_pre_migration.dump /usr/local/jails/data/tmp/

# Restore di dalam jail
jexec data-services pg_restore --host=10.0.0.13 --port=5432 \
  --username=kkn_app --dbname=kkn_production \
  --no-owner --no-privileges /tmp/db_pre_migration.dump
```

### Phase 3: API Jail (Nginx + PHP-FPM + Workers)

```sh
service jail start api
jexec api pkg install -y php84 php84-extensions php84-pdo php84-pdo_pgsql \
  php84-pgsql php84-mbstring php84-xml php84-curl php84-zip php84-gd \
  php84-intl php84-bcmath php84-redis php84-opcache php84-tokenizer \
  php84-fileinfo php84-ctype php84-dom php84-session php84-simplexml \
  php84-xmlwriter php84-xmlreader php84-openssl php84-filter php84-sodium \
  php84-pcntl php84-posix composer nginx py311-supervisor git curl bash

jexec api sysrc nginx_enable="YES"
jexec api sysrc php_fpm_enable="YES"
jexec api sysrc supervisord_enable="YES"
# ... copy konfigurasi PHP-FPM + Nginx + Supervisor
jexec api service php-fpm start
jexec api service nginx start
jexec api service supervisord start
```

### Phase 4: Web Jail (Next.js)

```sh
service jail start web
jexec web pkg install -y node24 npm-node24 git curl bash
# ... copy supervisor config
jexec web service supervisord start
```

### Phase 5: Nginx-Proxy Jail

```sh
service jail start nginx-proxy
jexec nginx-proxy pkg install -y nginx py311-certbot curl
jexec nginx-proxy sysrc nginx_enable="YES"
# ... copy nginx config, issue SSL cert
certbot certonly --webroot -w /usr/local/www/sibermas/api/public \
  -d sibermas.uinsaizu.ac.id --cert-name sibermas.uinsaizu.ac.id \
  -m admin@uinsaizu.ac.id --agree-tos -n
jexec nginx-proxy service nginx start
```

### Phase 6: Deploy Code

```sh
# Build di host (atau CI), deploy ke nullfs mount
# Lihat bagian "Host: Deploy Flow" di atas
```

### Phase 7: Final Switch

```sh
# Matikan service di native (host)
service nginx stop
service supervisord stop
# ... atau stop service lama

# Switch DNS (jika perlu)

# Verifikasi
curl -sf https://sibermas.uinsaizu.ac.id/api/health
curl -sf https://sibermas.uinsaizu.ac.id/
```

## Verification Checklist (Pasca-Migrasi)

Jalankan checklist ini setelah semua jail aktif dan aplikasi terdeploy:

### 1. Network Connectivity

```sh
# Dari host: semua jail harus reachable
jexec api ping -c2 10.0.0.13          # → data-services
jexec web ping -c2 10.0.0.12           # → api
jexec nginx-proxy ping -c2 10.0.0.11   # → web

# Dari host: jail harus bisa internet
jexec api ping -c2 8.8.8.8
jexec api drill google.com             # atau dig/host

# Dari host: port forwarding test
curl -sI http://10.0.0.10:80          # → harus redirect atau response
```

### 2. Layanan dalam Jail

```sh
# data-services jail
jexec data-services sockstat -l | grep -E '(5432|6379)'
# → postgres :5432, redis :6379 harus LISTEN

# api jail
jexec api sockstat -l | grep -E '(:8080|php-fpm)'
# → nginx :8080, php-fpm socket harus LISTEN

# web jail
jexec web sockstat -4l | grep 3000
# → node :3000 harus LISTEN

# nginx-proxy jail
jexec nginx-proxy sockstat -4l | grep -E '(:80|:443)'
# → nginx :80 (dan :443 jika SSL) harus LISTEN
```

### 3. Supervisor Status

```sh
# Di api jail
jexec api supervisorctl status
# → workers:* semua RUNNING

# Di web jail
jexec web supervisorctl status
# → sibermas-web RUNNING
```

### 4. Health Check Aplikasi

```sh
# Dari luar (atau dari nginx-proxy jail)
curl -sf https://sibermas.uinsaizu.ac.id/api/health | jq .
# → {"status":"ok","database":true,"redis":true,...}

curl -sf -o /dev/null -w "%{http_code}" https://sibermas.uinsaizu.ac.id/
# → 200

curl -sf -o /dev/null -w "%{http_code}" https://sibermas.uinsaizu.ac.id/api/v1/
# → 200 (atau 401 — itu wajar, berarti Laravel responses)

# Test static assets (dilayani web jail)
curl -sf -o /dev/null -w "%{http_code}" \
  https://sibermas.uinsaizu.ac.id/_next/static/chunks/framework-*.js
# → 200
```

### 5. Database & Cache

```sh
# PostgreSQL di data-services jail
jexec data-services psql -U kkn_app -d kkn_production -c "SELECT count(*) FROM users;"
# → jumlah user harus match dengan native sebelumnya

# Redis
jexec api redis-cli -h 10.0.0.13 ping
# → PONG
```

### 6. Queue Workers

```sh
# Dispatch test job
jexec api /usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:monitor

# Cek log worker
jexec api tail -50 /var/log/sibermas/worker-default.log
# → tidak ada error FATAL
```

### 7. File Upload & Storage

```sh
# Test upload via API
curl -sf -X POST https://sibermas.uinsaizu.ac.id/api/v1/...
# → file harus tersimpan di shared storage

# Verifikasi storage mount di host
ls -la /usr/local/www/sibermas/shared/storage/app/public/
# → file upload harus ada
```

### 8. Logging

```sh
# Cek centralized log jika sudah di-setup
for jail in api web nginx-proxy; do
  echo "=== $jail ==="
  jexec "$jail" tail -3 /var/log/sibermas/*.log 2>/dev/null || echo "(no logs yet)"
done
```

### 9. SSL Certificate

```sh
# Di nginx-proxy jail
jexec nginx-proxy openssl s_client -connect localhost:443 -servername sibermas.uinsaizu.ac.id \
  </dev/null 2>/dev/null | openssl x509 -noout -dates
# → notBefore / notAfter harus valid
```

### 10. Performance Baseline

```sh
# Dari host atau client eksternal
# API response time
time curl -sf https://sibermas.uinsaizu.ac.id/api/health

# Page load (approximate)
time curl -sf -o /dev/null https://sibermas.uinsaizu.ac.id/

# Bandwidth test
dd if=/dev/zero bs=1M count=10 | curl -sf -X POST --data-binary @- \
  https://sibermas.uinsaizu.ac.id/api/v1/... -o /dev/null -w "Speed: %{speed_download}\n"
```

---

## Rollback Plan

If something goes wrong:

```sh
# Rollback ke single-server native:
# 1. Hentikan service jail
service jail onestop nginx-proxy web api data-services

# 2. Restore service native
service nginx start
service php-fpm start
service supervisord start

# 3. Pastikan semua jalan
service nginx status
service php-fpm status
supervisorctl status

# 4. Ganti DNS kembali jika sudah di-switch

# 5. Verifikasi
curl -sf http://127.0.0.1:8000/api/health
curl -sf http://127.0.0.1:3000/
```

Files yang perlu di-backup sebelum migrasi:
1. `/usr/local/etc/nginx/nginx.conf` → backup di `/usr/local/etc/nginx/nginx.conf.bak`
2. Aplikasi lama di `/usr/local/www/apache24/data/Sibermas2026`
3. Database dump: `pg_dump --format=custom ...`
4. SSL certificate di `/usr/local/etc/letsencrypt/`

---

## Summary File Mapping

| File (repo) | Deploy ke (jail) | Fungsi |
|-------------|------------------|--------|
| `jail_setup.sh` | Host (root) | Auto-setup jail + bridge + pkg |
| `docs/JAILS_MIGRATION.md` | — | Dokumentasi migrasi lengkap |
| `apps/api/supervisord.jail-api.conf` | api jail `/usr/local/etc/supervisord.d/sibermas.conf` | Queue workers |
| `apps/web/supervisord.jail-web.conf` | web jail `/usr/local/etc/supervisord.d/sibermas-web.conf` | Next.js server |
| `apps/api/.env.production.jail` | api jail `.env` | Environment dengan DB_HOST=10.0.0.13 |
| `apps/web/.env.production.jail` | web jail `.env` | Environment dengan API URL publik |
| `deploy-atomic.sh` | Host (deploy user) | Atomic zero-downtime deploy |
| `remote-deploy.sh` | Host (deploy user) | Remote deploy via SSH |
| `ci.yml` | GitHub Actions | CI/CD dengan step jails-aware |
