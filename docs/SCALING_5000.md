# SIBERMAS — Scaling untuk 5000 Concurrent Users

**Target:** 5000 mahasiswa aktif bersamaan, ~1500 req/s peak.
**Arsitektur:** Multi-Jails VNET (4 jail) di FreeBSD 14.x.
**Server minimum:** 8 CPU core, 32GB RAM, NVMe SSD.

---

## 1. PHP-FPM (`/usr/local/etc/php-fpm.d/www.conf`)

Apply di **api jail**.

```ini
; From 50 → 200
pm = dynamic
pm.max_children = 200
pm.start_servers = 20
pm.min_spare_servers = 10
pm.max_spare_servers = 30
pm.max_requests = 1000

; Unix socket — lebih cepat dari TCP
listen = /var/run/php-fpm.sock
listen.backlog = 1024
listen.owner = www
listen.group = www
listen.mode = 0660

; Request timeout
request_terminate_timeout = 120
request_slowlog_timeout = 5
slowlog = /var/log/php-fpm-slow.log

; Status page (for monitoring)
pm.status_path = /status
```

### OPcache (`/usr/local/etc/php.ini`)

```ini
[opcache]
opcache.enable=1
opcache.memory_consumption=256
opcache.interned_strings_buffer=32
opcache.max_accelerated_files=20000
opcache.revalidate_freq=60
opcache.fast_shutdown=1
opcache.enable_cli=0
opcache.validate_timestamps=0
opcache.file_cache=/tmp/opcache
opcache.file_cache_only=0
```

### PHP-FPM systemd/rc.conf tuning

```sh
# rc.conf
php_fpm_limit_files="65536"
```

---

## 2. Nginx (`/usr/local/etc/nginx/nginx.conf`)

### nginx-proxy jail (front-end)

```nginx
worker_processes auto;
worker_rlimit_nofile 65536;

events {
    worker_connections 8192;
    multi_accept on;
    use kqueue;
}

http {
    # Upstream: web jail cluster (Next.js x4)
    upstream web_cluster {
        least_conn;
        server 10.0.0.11:3000 max_fails=3 fail_timeout=10s;
        server 10.0.0.11:3001 max_fails=3 fail_timeout=10s;
        server 10.0.0.11:3002 max_fails=3 fail_timeout=10s;
        server 10.0.0.11:3003 max_fails=3 fail_timeout=10s;
        keepalive 128;
    }

    # Upstream: api jail
    upstream api_cluster {
        server 10.0.0.12:8080 max_fails=3 fail_timeout=10s;
        keepalive 64;
    }

    # Rate-limit zones (per IP)
    limit_req_zone  $binary_remote_addr  zone=api_limit:100m  rate=120r/s;
    limit_conn_zone $binary_remote_addr  zone=conn_limit:100m;

    # Proxy buffers
    proxy_buffer_size   8k;
    proxy_buffers       64 8k;
    proxy_busy_buffers_size 16k;

    # FastCGI buffers (for api jail via proxy)
    fastcgi_buffer_size 32k;
    fastcgi_buffers     64 8k;
    fastcgi_busy_buffers_size 16k;

    # Timeouts
    proxy_connect_timeout 10s;
    proxy_read_timeout   60s;
    proxy_send_timeout   10s;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 3;
    gzip_min_length 256;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    # SSL session cache
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 4h;

    server {
        listen 80 default_server;
        listen 443 ssl http2;
        server_name sibermas.uinsaizu.ac.id;

        # API → api cluster
        location ^~ /api/ {
            limit_req zone=api_limit burst=100 nodelay;
            # No trailing slash: preserve /api prefix for Laravel routes.
            proxy_pass http://api_cluster;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Next.js static (dilayani langsung, bypass Node)
        location /_next/static/ {
            proxy_pass http://web_cluster;
            proxy_http_version 1.1;
            expires 1y;
            add_header Cache-Control "public, immutable";
            access_log off;
        }

        # Everything else → web cluster
        location / {
            proxy_pass http://web_cluster;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

---

## 3. Next.js Cluster (`/usr/local/etc/supervisord.d/sibermas-web.conf`)

Apply di **web jail**. 4 instance pada port berbeda, 1 per CPU core.

```ini
[program:sibermas-web]
process_name=%(program_name)s_%(process_num)02d
command=/usr/local/bin/node /usr/local/www/sibermas/web/server.js
directory=/usr/local/www/sibermas/web
autostart=true
autorestart=true
user=www
numprocs=4
umask=002
environment=NODE_ENV="production",PORT="%(process_num)02d",HOSTNAME="0.0.0.0",UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/web.log
stopwaitsecs=30
```

Note: Port mapping → process_num 0=3000, 1=3001, 2=3002, 3=3003.

**Atau di nginx-proxy jail, ganti upstream ports sesuai.**

---

## 4. Supervisor Queue Workers (`/usr/local/etc/supervisord.d/sibermas-api.conf`)

Apply di **api jail**. Scale dari 2+1+1 → 10+4+2.

```ini
[program:sibermas-worker-default]
process_name=%(program_name)s_%(process_num)02d
command=/usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:work --queue=default,critical,high --sleep=2 --tries=3 --max-time=3600
directory=/usr/local/www/sibermas/api
autostart=true
autorestart=true
user=www
numprocs=10
umask=002
environment=UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/worker-default.log
stopwaitsecs=3600

[program:sibermas-worker-low]
process_name=%(program_name)s_%(process_num)02d
command=/usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:work --queue=low --sleep=3 --tries=3 --max-time=3600
directory=/usr/local/www/sibermas/api
autostart=true
autorestart=true
user=www
numprocs=4
umask=002
environment=UMASK="0002"
redirect_stderr=true
stdout_logfile=/var/log/sibermas/worker-low.log
stopwaitsecs=3600

[program:sibermas-worker-long]
process_name=%(program_name)s_%(process_num)02d
command=/usr/local/bin/php /usr/local/www/sibermas/api/artisan queue:work --queue=long --sleep=5 --tries=1 --max-time=7200
directory=/usr/local/www/sibermas/api
autostart=true
autorestart=true
user=www
numprocs=2
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

## 5. PostgreSQL (`/var/db/postgres/data18/postgresql.conf`)

Apply di **data-services jail**.

```ini
# Connections
max_connections = 300
superuser_reserved_connections = 10

# Memory
shared_buffers = 8GB          # 25% of RAM
effective_cache_size = 24GB   # 75% of RAM
work_mem = 32MB               # per operation
maintenance_work_mem = 1GB
wal_buffers = 64MB

# Checkpoint tuning
checkpoint_timeout = 15min
checkpoint_completion_target = 0.9
max_wal_size = 4GB
min_wal_size = 1GB

# Parallel queries
max_parallel_workers_per_gather = 4
max_parallel_workers = 8
parallel_tuple_cost = 0.01
parallel_setup_cost = 100

# Planner
random_page_cost = 1.1        # NVMe SSD
effective_io_concurrency = 200

# Autovacuum
autovacuum_max_workers = 4
autovacuum_naptime = 30s
autovacuum_vacuum_scale_factor = 0.01
autovacuum_analyze_scale_factor = 0.005
```

### PgBouncer (`/usr/local/etc/pgbouncer.ini`)

Connection pooler — WAJIB untuk 5000 user. Mencegah PostgreSQL kehabisan koneksi.

```ini
[databases]
kkn_production = host=127.0.0.1 port=5432 dbname=kkn_production

[pgbouncer]
listen_addr = 10.0.0.13
listen_port = 6432
auth_type = md5
auth_file = /usr/local/etc/pgbouncer/userlist.txt

# Pool size — PHP-FPM 200 koneksi ÷ 2 = 100 ke DB
default_pool_size = 100
max_client_conn = 500
max_db_connections = 150

# Timeouts
server_idle_timeout = 300
client_idle_timeout = 600
query_timeout = 60

# Logging
logfile = /var/log/pgbouncer.log
pidfile = /var/run/pgbouncer.pid
```

`.env` override untuk api jail:
```
DB_HOST=10.0.0.13
DB_PORT=6432        # ← pgbouncer, bukan 5432
```

### PgBouncer userlist

```sh
# /usr/local/etc/pgbouncer/userlist.txt
"kkn_app" "<md5-hashed-password>"
# Generate: echo -n "passwordkkn_app" | md5 | awk '{print "md5"$1}'
```

---

## 6. Redis (`/usr/local/etc/redis.conf`)

Apply di **data-services jail**.

```ini
maxmemory 4gb
maxmemory-policy allkeys-lru
timeout 300
tcp-keepalive 60
```

---

## 7. Sysctl Kernel Tuning (`/etc/sysctl.conf`)

Apply di **host** dan **semua jail** (via jail config).

```ini
# Max open files
kern.maxfiles=131072
kern.maxfilesperproc=65536

# Network
net.inet.tcp.sendbuf_max=2097152
net.inet.tcp.recvbuf_max=2097152
net.inet.tcp.sendbuf_auto=1
net.inet.tcp.recvbuf_auto=1
net.inet.tcp.sendbuf_inc=16384
net.inet.tcp.recvbuf_inc=524288
net.inet.tcp.fastopen=3
net.inet.tcp.syncache.rexmtlimit=3

# Ephemeral port range
net.inet.ip.portrange.first=1024
net.inet.ip.portrange.last=65535

# Shared memory
kern.ipc.shmmax=17179869184    # 16GB
kern.ipc.shmall=4194304
```

### Jail-specific overrides (`/etc/jail.conf`)

```ini
api {
    # Allow more connections
    allow.sysvipc;
    $ip = "10.0.0.12";
    ...
}

data-services {
    # Shared memory for PostgreSQL
    allow.sysvipc;
    $ip = "10.0.0.13";
    ...
}
```

---

## 8. Monitoring & Alerting

### Health check endpoint

```php
// routes/api.php
Route::get('/health/detailed', function () {
    return [
        'php_fpm_active' => shell_exec('ps aux | grep php-fpm | wc -l'),
        'queue_size' => Queue::size('default'),
        'db_connections' => DB::select("SELECT count(*) FROM pg_stat_activity")[0]->count,
        'redis_info' => Redis::info('server')['used_memory_human'],
        'load_avg' => sys_getloadavg(),
    ];
})->middleware('throttle:60,1');
```

### Alert thresholds (Telegram bot)

```php
// config/monitoring.php
return [
    'alerts' => [
        'php_fpm_queue' => 50,          // Peringatan jika request queue > 50
        'db_connections' => 250,         // Peringatan jika koneksi DB > 250
        'queue_size' => 1000,            // Peringatan jika antrian > 1000
        'cpu_load' => 8.0,               // Peringatan jika load average > 8
        'response_time_ms' => 2000,       // Peringatan jika response > 2 detik
    ],
];
```

---

## 9. Deploy Checklist Scaling

```sh
# 1. Apply sysctl
sysctl -f /etc/sysctl.conf

# 2. PHP-FPM
cp conf/php-fpm.www.conf /usr/local/etc/php-fpm.d/www.conf
cp conf/php-opcache.ini /usr/local/etc/php/84/conf.d/opcache.ini
service php-fpm restart

# 3. PostgreSQL
cp conf/postgresql-scaling.conf /var/db/postgres/data18/postgresql.conf
service postgresql restart

# 4. PgBouncer
cp conf/pgbouncer.ini /usr/local/etc/pgbouncer.ini
service pgbouncer start
sysrc pgbouncer_enable="YES"

# 5. Nginx
cp conf/nginx-scaling.conf /usr/local/etc/nginx/nginx.conf
service nginx reload

# 6. Supervisor (Next.js cluster + queue)
cp conf/supervisord-web-cluster.conf /usr/local/etc/supervisord.d/sibermas-web.conf
cp conf/supervisord-api-scaling.conf /usr/local/etc/supervisord.d/sibermas-api.conf
supervisorctl reread && supervisorctl update
supervisorctl restart all

# 7. Verify
curl -s https://sibermas.uinsaizu.ac.id/api/health/detailed | jq .
```

---

## 10. Capacity Planning Summary

| Resource | Before | After (5000 users) |
|----------|--------|-------------------|
| **PHP-FPM workers** | 50 | 200 |
| **Next.js instances** | 1 | 4 (1 per CPU core) |
| **Queue workers** | 4 | 16 (10+4+2) |
| **Nginx connections** | 4096 | 8192 |
| **PostgreSQL connections** | 100 | 300 (+ pgbouncer) |
| **PgBouncer pool** | — | 100 ke DB, 500 client |
| **OPcache memory** | default | 256MB |
| **Redis maxmemory** | default | 4GB |
| **Shared buffers (PG)** | default | 8GB |
| **Server RAM** | 4-8GB | 32GB |
| **Server CPU** | 2-4 core | 8+ core |

---

## 11. Load Test

Sebelum go-live, lakukan load test dari luar:

```sh
# Install hey (HTTP load generator)
pkg install -y hey

# Test API endpoint
hey -n 5000 -c 200 -m GET \
  -H "Authorization: Bearer <token>" \
  https://sibermas.uinsaizu.ac.id/api/v1/profile

# Test login page (static-heavy)
hey -n 2000 -c 100 \
  https://sibermas.uinsaizu.ac.id/

# Monitor during test
watch -n1 "jexec api php-fpm-status || echo 'check php-fpm'; \
           jexec nginx-proxy tail -1 /var/log/nginx/access.log"
```

Target: p95 response time < 500ms, error rate < 0.1%.
