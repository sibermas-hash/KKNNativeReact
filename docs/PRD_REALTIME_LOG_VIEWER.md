# PRD: Production Realtime Log Viewer — SIBERMAS

**Status:** Hardened Draft
**Tanggal:** 2026-05-16
**Target:** Production monitoring untuk error BE + FE + realtime user activity
**Prioritas:** High
**Estimasi:** 3–5 jam implementasi

---

## 1. Ringkasan

Fitur **Production Realtime Log Viewer** untuk dashboard admin SIBERMAS. Tujuannya: superadmin bisa melihat error backend, frontend, server gateway, dan aktivitas penting user secara langsung tanpa SSH.

Fitur ini bukan terminal mentah. UI berupa **admin dashboard log console + activity feed**: source selector, filter level, search, pause/resume, auto-scroll, warna per severity, stack trace collapse, dan realtime aktivitas user.

Scope utama dibagi dua:

- **Technical Logs:** Laravel, frontend error, nginx, php-fpm.
- **Activity Feed:** NIM baru login, gagal login, ganti password, isi/update profil, upload avatar, request perubahan profil, logout.

Final route decision:

- Public/admin page: `https://sibermas.uinsaizu.ac.id/admin/logs`
- No new subdomain required.
- No secret slug route required.
- Do not rely on obscure URL as security.
- Security uses existing admin auth stack: login + superadmin + 2FA + admin middleware + audit.

---

## 2. Scope Log Production

### 2.1 Log Yang Ditampilkan

| Source | Deskripsi | Default Path Production | Prioritas |
|---|---|---|---|
| `laravel` | Backend Laravel application log | `apps/api/storage/logs/laravel-YYYY-MM-DD.log` atau `apps/api/storage/logs/laravel.log` | P0 |
| `frontend` | Error frontend yang dikirim ke backend | Laravel channel/route `POST /api/log-error`, masuk ke Laravel log | P0 |
| `nginx_error` | Error reverse proxy / upstream / static file | `/var/log/nginx/sibermas.error.log` atau `/var/log/nginx/error.log` | P0 |
| `nginx_access` | Request production realtime | `/var/log/nginx/sibermas.access.log` atau `/var/log/nginx/access.log` | P1 |
| `php_fpm` | PHP worker error / slow process | `/var/log/php-fpm.log` atau `/var/log/php-fpm-www.log` | P1 |
| `system` | Service/system level issue | `/var/log/messages` | P2, disabled by default |

### 2.2 Tidak Ditampilkan Default

| Log | Alasan |
|---|---|
| Auth/security log OS | Risiko expose auth/server sensitive data |
| PostgreSQL raw log | Bisa berisi query sensitif; out of initial scope |
| Redis log | Jarang relevan untuk error user-facing |
| Sentry issue list | Sentry tetap tool terpisah; viewer ini raw realtime log |
| Mobile device local log | Tidak tersedia di server kecuali dikirim via API |

### 2.2.1 Realtime Activity Feed

Selain raw log, dashboard harus punya source khusus `activity_feed` untuk aktivitas user penting.

Source ini **bukan baca file log mentah**, tetapi baca dari database activity log existing agar data lebih rapi, aman, dan searchable.

Existing system yang perlu dicek/diintegrasikan:

- `apps/api/app/Http/Controllers/Api/V1/Admin/UserActivityController.php`
- Routes existing: `GET /admin/activity-log`, `/activity-log/stats`, `/activity-log/user/{user}`
- Frontend existing: `apps/web/src/app/(admin)/admin/activity-log/page.tsx`
- Model/table existing: `UserActivityLog` atau equivalent

Activity yang harus tampil realtime:

| Event Key | Label UI | Data Minimal | Severity |
|---|---|---|---|
| `auth.login.success` | Login berhasil | NIM/NIP/email masked, nama, role, IP masked, device/browser | info |
| `auth.login.failed` | Login gagal | identifier masked, reason generic, IP masked | warning |
| `auth.logout` | Logout | NIM/NIP/email masked, nama, role | info |
| `auth.password.changed` | Ganti password | NIM/NIP/email masked, nama, role | warning |
| `profile.completed` | Profil dilengkapi | NIM, nama, completion fields summary | info |
| `profile.updated` | Profil diperbarui | NIM, nama, changed field names only | info |
| `avatar.uploaded` | Avatar diupload | NIM, nama | info |
| `profile_change.requested` | Request perubahan profil | NIM, nama, requested field names only | notice |
| `profile_change.approved` | Perubahan profil disetujui | NIM, nama, approver | info |
| `profile_change.rejected` | Perubahan profil ditolak | NIM, nama, approver | warning |

Rules:

- Jangan tampilkan password lama/baru, token, cookie, raw request body.
- Untuk profil, tampilkan **nama field yang berubah saja**, bukan semua nilai sensitif.
- Untuk NIM boleh tampil full jika itu memang identifier akademik internal admin; email/IP tetap masked.
- Login gagal tidak boleh membocorkan apakah NIM/email valid. Reason harus generic.

### 2.3 Production Safety Defaults

| Source | Default State | Default Filter | Catatan |
|---|---|---|---|
| `laravel` | enabled | `critical,error,warning` | Paling aman karena sudah lewat `PiiScrubber` |
| `frontend` | enabled | `critical,error,warning` | Hanya entry FE/client error |
| `nginx_error` | enabled | `critical,error,warning` | Aman relatif, tetap sanitize |
| `nginx_access` | enabled | only `4xx/5xx` | Jangan tampilkan semua request default |
| `php_fpm` | enabled | `error,warning` | Sanitized |
| `system` | disabled | none | Enable manual via env jika benar-benar perlu |

---

## 3. Use Cases

| Actor | Kebutuhan |
|---|---|
| Superadmin | Melihat error production realtime saat deployment |
| Superadmin | Membandingkan HTTP 500 di nginx access dengan exception Laravel |
| Superadmin | Melihat frontend crash/error yang dikirim dari browser user |
| Superadmin | Melihat NIM/user yang baru login realtime |
| Superadmin | Melihat user yang baru ganti password realtime |
| Superadmin | Melihat mahasiswa yang baru melengkapi/mengubah profil realtime |
| Superadmin | Filter cepat hanya `error`, `critical`, `500`, atau keyword tertentu |
| Agent server | Membaca PRD ini lalu implementasi tanpa perlu tanya ulang scope |

---

## 4. Pendekatan Teknis

### 4.0 GitHub Reference & Integration Decision

Agent server boleh memakai referensi/library eksternal, tetapi keputusan akhir harus mengikuti security requirements PRD ini.

| Repo | URL | Kegunaan | Fit untuk SIBERMAS | Catatan |
|---|---|---|---|---|
| `opcodesio/log-viewer` | https://github.com/opcodesio/log-viewer | Laravel log viewer lengkap | Sangat cocok sebagai referensi/package backend | Support Laravel 13, search/filter/dark mode/API, bisa baca log lain seperti Nginx/Redis/Supervisor/Postgres |
| `laravel/pail` | https://github.com/laravel/pail | Tail Laravel logs dari CLI | Cocok untuk inspirasi tail/filter, bukan UI production | CLI-first, bukan dashboard admin |
| `grafana/loki` | https://github.com/grafana/loki | Full log aggregation stack | Cocok fase 2/enterprise, bukan initial integration | Butuh Loki + Alloy + Grafana, infra lebih berat |
| `amir20/dozzle` | https://github.com/amir20/dozzle | Realtime container log UI | Cocok inspirasi UX realtime, kurang cocok infra SIBERMAS | Docker/container-first, SIBERMAS FreeBSD/nginx/php-fpm |
| `allinurl/goaccess` | https://github.com/allinurl/goaccess | Nginx/access log analytics realtime | Cocok tambahan analytics nginx, bukan BE/FE error viewer utama | Sangat bagus untuk HTTP traffic metrics, bukan app exception stream |

Recommended initial path:

1. Prefer custom SIBERMAS `/admin/logs` UI + SSE backend per PRD ini.
2. Use `opcodesio/log-viewer` as primary reference for Laravel log parsing, file discovery, filtering, and UX ideas.
3. Agent server may install `opcodesio/log-viewer` if it reduces risk/time, but must not expose its default route publicly.
4. Keep final admin entrypoint inside SIBERMAS admin dashboard: `/admin/logs`.
5. Do not implement destructive features unless explicitly approved: delete log file, clear log file, download raw full log.

If agent server chooses `opcodesio/log-viewer` package:

- Disable or hide default `/log-viewer` route from public access.
- Protect every package route with existing admin middleware or do not expose route at all.
- Disable/hide delete feature.
- Disable/hide raw full download feature unless later approved.
- Ensure package config uses whitelist paths only.
- Still implement SIBERMAS-specific sanitizer before any content reaches browser.
- Still implement audit logging for stream/open/view events.
- Still keep `system` source disabled by default.
- Still keep `nginx_access` default to 4xx/5xx only.

If agent server chooses not to install package:

- Reuse design ideas only.
- Implement resolver/parser/SSE manually as described below.
- Keep implementation small and auditable.

Decision rules:

| Situation | Recommended Decision |
|---|---|
| Need fastest safe Laravel log browser | Use `opcodesio/log-viewer` internally + wrap/harden |
| Need strict control over all outputs | Manual resolver/parser/SSE implementation |
| Need long-term full observability | Plan Loki/Grafana as separate phase |
| Need nginx traffic analytics | Add GoAccess as separate ops dashboard, not core `/admin/logs` |
| Current SIBERMAS production single server | Manual SSE or hardened OPcodes; avoid Loki initially |

### 4.1 Transport: SSE

Gunakan **Server-Sent Events**.

Alasan:

| Kriteria | SSE | WebSocket/Reverb |
|---|---|---|
| Pattern existing | Sudah ada di `NotificationStreamController` | Belum ada |
| Infra tambahan | Tidak | Ya |
| Cocok untuk log read-only | Ya | Ya, tapi overkill |
| Production complexity | Rendah | Menengah-tinggi |

Referensi existing:

`apps/api/app/Http/Controllers/Api/NotificationStreamController.php`

### 4.2 High-Level Flow

```
Admin Browser
  │
  │ GET /api/v1/admin/logs/stream?source=laravel&level=error,critical&search=foo
  ▼
Laravel LogStreamController
  │
  ├─ auth:sanctum
  ├─ role:superadmin
  ├─ 2fa.enforced
  ├─ not_locked
  └─ admin.auth
  │
  ▼
Whitelisted LogSourceResolver
  │
  ├─ apps/api/storage/logs/laravel-YYYY-MM-DD.log
  ├─ /var/log/nginx/sibermas.error.log
  ├─ /var/log/nginx/sibermas.access.log
  ├─ /var/log/php-fpm.log
  └─ /var/log/messages
  │
  ▼
Tail file from EOF → parse → sanitize → SSE events
```

Activity feed uses separate endpoint/stream or same endpoint with `source=activity_feed`:

```text
Admin Browser
  │
  │ GET /api/v1/admin/logs/stream?source=activity_feed&event=auth.login.success,profile.updated
  ▼
LogStreamController / ActivityStreamController
  │
  ▼
Poll UserActivityLog table every 2s
  │
  ▼
Normalize → sanitize → SSE event: activity-entry
```

Preferred implementation:

- If `UserActivityLog` already records required events, stream from it.
- If events are missing, add logging at source actions: login, logout, password change, profile update.
- Do not parse authentication/profile events from raw Laravel log if DB activity table exists.

---

## 5. Backend Specification

### 5.1 Files Baru

| Path | Fungsi |
|---|---|
| `apps/api/app/Http/Controllers/Api/V1/Admin/LogStreamController.php` | SSE stream + daftar source |
| `apps/api/app/Services/ProductionLogSourceResolver.php` | Whitelist + resolve path log production |
| `apps/api/app/Services/ProductionLogParser.php` | Parser Laravel/nginx/php-fpm/system log |
| `apps/api/app/Services/RealtimeActivityFeedService.php` | Query/poll activity events from DB |
| `apps/api/tests/Feature/Http/Controllers/Api/V1/Admin/LogStreamControllerTest.php` | Feature tests |

### 5.2 Route

File: `apps/api/routes/api/v1-admin.php`

Tambahkan di dalam **superadmin-only group**.

```php
Route::prefix('logs')->group(function () {
    Route::get('/stream', [LogStreamController::class, 'stream'])
        ->middleware('throttle:6,1')
        ->name('admin.logs.stream');

    Route::get('/sources', [LogStreamController::class, 'sources'])
        ->middleware('throttle:30,1')
        ->name('admin.logs.sources');

    Route::get('/activity/stream', [LogStreamController::class, 'activityStream'])
        ->middleware('throttle:6,1')
        ->name('admin.logs.activity-stream');
});
```

Inherited middleware:

- `auth:sanctum`
- `role:superadmin`
- `2fa.enforced`
- `not_locked`
- `admin.auth`

### 5.3 API Contract

#### `GET /api/v1/admin/logs/sources`

Return daftar source yang tersedia dan bisa dibaca.

```json
{
  "data": [
    {
      "key": "laravel",
      "label": "Backend Laravel",
      "path": "storage/logs/laravel-2026-05-16.log",
      "exists": true,
      "readable": true,
      "size_bytes": 1048576,
      "modified_at": "2026-05-16T10:10:00+07:00"
    },
    {
      "key": "nginx_error",
      "label": "Nginx Error",
      "path": "/var/log/nginx/sibermas.error.log",
      "exists": true,
      "readable": true,
      "size_bytes": 4096,
      "modified_at": "2026-05-16T10:11:00+07:00"
    }
  ]
}
```

#### `GET /api/v1/admin/logs/stream`

Query params:

| Param | Tipe | Default | Validasi |
|---|---|---|---|
| `source` | string | `laravel` | enum dari whitelist + env enabled |
| `level` | string | all | comma-separated: `critical,error,warning,info,debug` |
| `search` | string | empty | max 100 char |
| `lines` | int | 50 | 1–100 |
| `follow` | bool | true | `true`/`false` |
| `access_status` | string | `errors_only` | `errors_only` = 4xx/5xx, `all` only if explicitly allowed |
| `event` | string | all | comma-separated activity event keys; only for `activity_feed` |

#### `GET /api/v1/admin/logs/activity/stream`

Alternative dedicated endpoint for activity feed.

Query params:

| Param | Tipe | Default | Validasi |
|---|---|---|---|
| `event` | string | all | comma-separated event keys |
| `role` | string | all | `student,dosen,admin,superadmin` |
| `search` | string | empty | NIM/name search, max 100 char |
| `since_id` | int | latest | optional cursor |
| `lines` | int | 50 | 1-100 initial entries |

### 5.4 SSE Events

```text
event: connected
data: {"source":"laravel","ttl_seconds":60,"at":"2026-05-16T10:00:00+07:00"}

event: initial
data: {"source":"laravel","entries":[...]}

event: log-entry
data: {"source":"nginx_error","timestamp":"2026-05-16T10:00:05+07:00","level":"error","message":"connect() failed (111: Connection refused) while connecting to upstream","raw":"..."}

event: heartbeat
data: {"at":"2026-05-16T10:00:14+07:00","lines_sent":42}

event: rotated
data: {"source":"laravel","reason":"file_size_shrank"}

event: close
data: {"reason":"ttl"}

event: activity-entry
data: {"event":"auth.login.success","timestamp":"2026-05-16T10:00:05+07:00","severity":"info","actor":{"id":10,"nim":"2141100001","name":"A***","role":"student"},"summary":"Mahasiswa login berhasil","metadata":{"ip":"103.***.***.10","browser":"Chrome","platform":"Android"}}
```

### 5.5 Normalized Log Entry

Semua source harus dinormalisasi ke shape yang sama.

```ts
type ProductionLogEntry = {
  source: 'laravel' | 'frontend' | 'nginx_error' | 'nginx_access' | 'php_fpm' | 'system';
  timestamp: string | null;
  level: 'critical' | 'error' | 'warning' | 'notice' | 'info' | 'debug' | 'unknown';
  message: string;
  raw: string;
  context?: Record<string, unknown>;
};
```

### 5.5.1 Normalized Activity Entry

```ts
type RealtimeActivityEntry = {
  source: 'activity_feed';
  event: 'auth.login.success' | 'auth.login.failed' | 'auth.logout' | 'auth.password.changed' | 'profile.completed' | 'profile.updated' | 'avatar.uploaded' | 'profile_change.requested' | 'profile_change.approved' | 'profile_change.rejected';
  timestamp: string;
  severity: 'info' | 'notice' | 'warning' | 'error';
  actor: {
    id: number | null;
    nim?: string | null;
    nip?: string | null;
    email?: string | null;
    name?: string | null;
    role?: string | null;
  };
  summary: string;
  metadata?: {
    ip?: string | null;
    browser?: string | null;
    platform?: string | null;
    changed_fields?: string[];
    approver_id?: number | null;
  };
};
```

Privacy constraints:

- `actor.nim` may be full for admin operational use.
- `actor.email` must be masked.
- `metadata.ip` must be masked.
- `changed_fields` contains field names only, not old/new values.
- Never include password/token/session/cookie values.

### 5.6 Source Resolver

Tidak boleh menerima path bebas dari request. Hanya whitelist.

```php
final class ProductionLogSourceResolver
{
    public function sources(): array
    {
        return [
            'laravel' => [
                'label' => 'Backend Laravel',
                'paths' => [
                    storage_path('logs/laravel-'.now()->format('Y-m-d').'.log'),
                    storage_path('logs/laravel.log'),
                ],
                'parser' => 'laravel',
                'priority' => 'P0',
            ],
            'frontend' => [
                'label' => 'Frontend Error',
                'paths' => [
                    storage_path('logs/laravel-'.now()->format('Y-m-d').'.log'),
                    storage_path('logs/laravel.log'),
                ],
                'parser' => 'laravel_frontend',
                'priority' => 'P0',
            ],
            'nginx_error' => [
                'label' => 'Nginx Error',
                'paths' => [
                    '/var/log/nginx/sibermas.error.log',
                    '/var/log/nginx/error.log',
                ],
                'parser' => 'nginx_error',
                'priority' => 'P0',
            ],
            'nginx_access' => [
                'label' => 'Nginx Access',
                'paths' => [
                    '/var/log/nginx/sibermas.access.log',
                    '/var/log/nginx/access.log',
                ],
                'parser' => 'nginx_access',
                'priority' => 'P1',
            ],
            'php_fpm' => [
                'label' => 'PHP-FPM',
                'paths' => [
                    '/var/log/php-fpm.log',
                    '/var/log/php-fpm-www.log',
                ],
                'parser' => 'php_fpm',
                'priority' => 'P1',
            ],
            'activity_feed' => [
                'label' => 'Realtime User Activity',
                'paths' => [],
                'parser' => 'database_activity_feed',
                'priority' => 'P0',
                'enabled' => (bool) env('LOG_VIEWER_ENABLE_ACTIVITY_FEED', true),
            ],
            'system' => [
                'label' => 'System Messages',
                'paths' => [
                    '/var/log/messages',
                ],
                'parser' => 'syslog',
                'priority' => 'P2',
                'enabled' => (bool) env('LOG_VIEWER_ENABLE_SYSTEM', false),
            ],
        ];
    }
}
```

All sources must respect env flags:

```php
'laravel' => env('LOG_VIEWER_ENABLE_LARAVEL', true),
'frontend' => env('LOG_VIEWER_ENABLE_FRONTEND', true),
'nginx_error' => env('LOG_VIEWER_ENABLE_NGINX_ERROR', true),
'nginx_access' => env('LOG_VIEWER_ENABLE_NGINX_ACCESS', true),
'php_fpm' => env('LOG_VIEWER_ENABLE_PHP_FPM', true),
'activity_feed' => env('LOG_VIEWER_ENABLE_ACTIVITY_FEED', true),
'system' => env('LOG_VIEWER_ENABLE_SYSTEM', false),
```

If disabled, `sources()` returns `enabled=false`; `stream()` returns `403` with message `Log source disabled`.

### 5.7 Parser Rules

| Parser | Pattern | Level Mapping |
|---|---|---|
| `laravel` | `[YYYY-MM-DD HH:mm:ss] production.ERROR: message` | Laravel level langsung |
| `laravel_frontend` | Laravel line yang mengandung `frontend`, `log-error`, `browser`, `client_error` | level dari payload/log line |
| `nginx_error` | `YYYY/MM/DD HH:mm:ss [error] pid#tid: message` | `[crit]`→critical, `[error]`→error, `[warn]`→warning |
| `nginx_access` | combined log / vhost access log | HTTP `5xx`→error, `4xx`→warning, else info. Default emit only 4xx/5xx. |
| `php_fpm` | `[date] WARNING/ERROR: message` | warning/error |
| `syslog` | `May 16 10:00:00 host service: message` | keyword-based: error/fail/panic→error, warn→warning, else info |
| `database_activity_feed` | `UserActivityLog` rows | event-based severity mapping |

### 5.9 Activity Event Instrumentation

If existing activity logging is incomplete, add/verify event logging in these flows:

| Flow | Expected hook location | Event |
|---|---|---|
| Login success | `AuthController` successful login path | `auth.login.success` |
| Login failed | `AuthController` failed login path | `auth.login.failed` |
| Logout | Auth logout path | `auth.logout` |
| Password changed | password update/reset controller/service | `auth.password.changed` |
| Profile completed | student/profile update when required fields become complete | `profile.completed` |
| Profile updated | student/profile update endpoint | `profile.updated` |
| Avatar uploaded | avatar upload endpoint/service | `avatar.uploaded` |
| Profile change requested | profile change request create path | `profile_change.requested` |
| Profile change approved/rejected | admin approval path | `profile_change.approved` / `profile_change.rejected` |

Activity log payload must be minimal:

```json
{
  "event": "profile.updated",
  "user_id": 10,
  "role": "student",
  "identifier": "2141100001",
  "changed_fields": ["phone", "address", "emergency_contact"],
  "ip": "masked or raw stored server-side only",
  "user_agent": "browser UA"
}
```

Do not store raw password, password confirmation, token, cookie, Authorization header, or full request body.

### 5.8 Frontend Error Capture

Existing telemetry:

- Next.js Sentry config exists
- Backend endpoint exists: `POST /api/log-error`
- Backend service exists: AI/Telegram error alert pipeline

Implementation requirement:

- Realtime viewer source `frontend` reads the same Laravel log, but filters frontend-client error entries only.
- If current `/api/log-error` writes to a dedicated channel/file, source resolver should prefer that file.
- If not, use Laravel log + parser filter.
- Do not depend on Sentry API for initial implementation.

Recommended future improvement:

```php
'frontend' => [
    'driver' => 'daily',
    'path' => storage_path('logs/frontend.log'),
    'level' => env('LOG_LEVEL', 'debug'),
    'days' => 14,
    'processors' => [PiiScrubber::class],
]
```

If implemented, `frontend` source should resolve:

1. `storage/logs/frontend-YYYY-MM-DD.log`
2. `storage/logs/frontend.log`
3. fallback to Laravel log with frontend filter

---

## 6. Security Requirements

| Concern | Requirement |
|---|---|
| Access | Superadmin only |
| Route | Use `/admin/logs`; no hidden slug or new domain required |
| Path traversal | Request accepts `source`, never raw path |
| Sensitive headers | Mask `Authorization`, `Cookie`, `Set-Cookie`, `X-CSRF-TOKEN`, tokens |
| PII | Re-run lightweight sanitizer before SSE output even if Monolog scrubber ran |
| Line length | Truncate raw line to 2000 chars |
| Initial load | Max 100 lines |
| Connections | Max 1 active stream per superadmin user; max 3 total streams |
| TTL | Close stream every 60s; browser reconnects |
| Audit | Write audit entry when superadmin opens source `system` or `nginx_access` |
| Query string leakage | Redact sensitive query params before display |
| Full access log | Disabled unless `LOG_VIEWER_ALLOW_FULL_ACCESS_LOG=true` |
| Activity privacy | Show NIM/event/field names only; never show password/profile sensitive values |

### 6.0 Route / Domain Decision

Use existing SIBERMAS domain and admin route:

```text
https://sibermas.uinsaizu.ac.id/admin/logs
```

Do not require:

- new Cloudflare DNS record
- new subdomain
- private domain
- secret slug such as `/logaglogog`

Security must come from middleware and audit, not URL secrecy.

Required page/API protection:

```text
auth:sanctum
role:superadmin
2fa.enforced
not_locked
admin.auth
```

Optional future hardening, not required for initial implementation:

- step-up password confirmation before opening logs
- IP allowlist
- Tailscale/VPN-only access

Sanitizer must redact:

```text
Authorization: Bearer ***
Cookie: ***
Set-Cookie: ***
token=***
password=***
key=***
code=***
signature=***
expires=***
nik=***
nim=***
email partially masked if possible
```

### 6.1 URL / Query Redaction

Before sending any line to browser, redact sensitive query parameters from raw URL strings.

Sensitive parameter names are case-insensitive:

```text
token
access_token
refresh_token
id_token
code
key
api_key
apikey
secret
password
pass
signature
sig
expires
X-Amz-Signature
X-Amz-Credential
X-Amz-Security-Token
```

Example:

```text
GET /reset-password?token=abc123&email=user@example.com
```

Must render as:

```text
GET /reset-password?token=***&email=u***@example.com
```

### 6.2 Mandatory Audit Logging

Every stream open must create an audit event.

Minimum fields:

```json
{
  "event": "production_log_viewer.opened",
  "user_id": 1,
  "source": "nginx_access",
  "level": "error,warning",
  "search_present": true,
  "access_status": "errors_only",
  "ip": "admin-ip",
  "user_agent": "browser UA",
  "created_at": "2026-05-16T10:00:00+07:00"
}
```

Do not store the raw `search` value in audit if it may contain secrets. Store `search_present=true` and optionally a safe hash.

Audit is required for all sources, not only sensitive sources.

For `activity_feed`, audit must include event filters:

```json
{
  "event": "production_log_viewer.activity_feed.opened",
  "user_id": 1,
  "source": "activity_feed",
  "event_filter": "auth.login.success,profile.updated",
  "search_present": false
}
```

### 6.3 Connection Guard

Route throttle alone is insufficient for SSE. Add cache-based lock.

Rules:

- Max 1 active stream per user.
- Max 3 active streams globally.
- Lock TTL = `LOG_STREAM_TTL + 10` seconds.
- Release lock in `finally` block when stream exits.
- If lock exists, return `429 Too Many Requests`.

Cache keys:

```text
log-viewer:user:{user_id}
log-viewer:global-count
```

### 6.4 `nginx_access` Rules

Default behavior:

- emit only HTTP status `400–599`
- map `500–599` to `error`
- map `400–499` to `warning`
- hide `2xx/3xx` lines

Full access log behavior:

- allowed only when `LOG_VIEWER_ALLOW_FULL_ACCESS_LOG=true`
- UI must show warning label: `Full access log may contain IPs and URLs`
- audit event must include `access_status=all`

### 6.5 `system` Source Rules

`system` source is disabled by default.

Enable only if:

```env
LOG_VIEWER_ENABLE_SYSTEM=true
```

Even when enabled:

- do not include auth/security logs
- only `/var/log/messages` from whitelist
- sanitize before display
- audit every open
- UI displays warning: `System logs may include service-level details`

---

## 7. Frontend Specification

### 7.1 Files Baru

```text
apps/web/src/app/(admin)/admin/logs/
├── page.tsx
└── components/
    ├── ProductionLogViewer.tsx
    ├── ProductionLogFilter.tsx
    ├── ProductionLogEntry.tsx
    └── useProductionLogStream.ts
```

### 7.2 UI Layout

```text
┌────────────────────────────────────────────────────────────────────┐
│ Production Logs                              ● Connected  42 lines │
├────────────────────────────────────────────────────────────────────┤
│ Source: [Backend Laravel ▾] Level: [Error+Critical ▾]              │
│ Search: [500 / SQLSTATE / route name____] Lines: [50]              │
│ [Pause] [Clear] [Auto-scroll ON] [Copy Visible]                    │
├────────────────────────────────────────────────────────────────────┤
│ 10:00:05 ERROR   laravel       SQLSTATE[23505] duplicate key...    │
│ 10:00:07 ERROR   frontend      TypeError: Cannot read properties...│
│ 10:00:09 ERROR   nginx_error   connect() failed upstream...        │
│ 10:00:11 WARNING nginx_access  404 GET /api/v1/foo 192.168.x.x     │
└────────────────────────────────────────────────────────────────────┘
```

### 7.3 Default View

Default saat halaman dibuka:

- Source: `laravel`
- Level: `critical,error,warning`
- Lines: `50`
- Follow: `true`
- Auto-scroll: `true`

Page path:

```text
apps/web/src/app/(admin)/admin/logs/page.tsx
```

URL:

```text
/admin/logs
```

Quick source tabs:

- `BE Laravel`
- `FE Errors`
- `Activity Feed`
- `Nginx Error`
- `Nginx Access`
- `PHP-FPM`
- `System`

If `system` disabled, show it as disabled with tooltip: `Disabled by production safety policy`.

For `nginx_access`, default badge: `4xx/5xx only`.

For `activity_feed`, default filters:

- Event: `auth.login.success`, `auth.login.failed`, `auth.password.changed`, `profile.completed`, `profile.updated`
- Role: all
- Lines: 50

### 7.3.1 Activity Feed UI

```text
┌────────────────────────────────────────────────────────────────────┐
│ Realtime Activity Feed                       ● Connected  18 events│
├────────────────────────────────────────────────────────────────────┤
│ Event: [Login + Password + Profile ▾] Role: [All ▾] Search NIM: ___│
│ [Pause] [Clear] [Auto-scroll ON]                                   │
├────────────────────────────────────────────────────────────────────┤
│ 10:00:05 INFO    LOGIN       NIM 2141100001  Ahmad F***  Android  │
│ 10:00:21 WARNING LOGIN_FAIL  identifier a***@mail.com  Chrome     │
│ 10:01:02 WARNING PASSWORD    NIM 2141100002  Siti N***            │
│ 10:01:40 INFO    PROFILE     NIM 2141100003  fields: phone,address│
└────────────────────────────────────────────────────────────────────┘
```

Activity feed row requirements:

- show event badge
- show timestamp
- show NIM/NIP when available
- show masked name/email/IP where relevant
- show changed field names only
- click row opens existing activity-log detail if available

### 7.4 UI Behavior

| Fitur | Behavior |
|---|---|
| Auto-scroll | Aktif jika user di bawah; nonaktif jika user scroll ke atas |
| Pause/resume | Pause menutup EventSource, resume membuka ulang |
| Buffer | Max 1000 entries, FIFO |
| Level colors | critical red bold, error red, warning yellow, info neutral, debug muted |
| Stack trace | Collapse default, expand click |
| Copy | Klik baris copy raw sanitized line |
| Search | Debounce 500ms, reconnect stream |
| Source switch | Close stream lama, buka source baru |
| Unavailable source | Tampilkan disabled + reason `not readable` atau `not found` |
| Disabled source | Tampilkan disabled + reason `disabled by config` |
| Sensitive source warning | Show inline warning for `nginx_access=all` and `system` |
| Activity feed | Render as event timeline, not raw terminal line |

---

## 8. Testing

### 8.1 Backend Tests

| Test | Expected |
|---|---|
| unauthenticated cannot access stream | 401 |
| non-superadmin cannot access stream | 403 |
| invalid source rejected | 422 |
| raw path rejected | 422 |
| sources returns whitelist only | no arbitrary path |
| laravel parser extracts level/message | normalized entry |
| nginx access 500 mapped to error | level error |
| nginx access 404 mapped to warning | level warning |
| sanitizer masks Authorization/Cookie/token | no secrets in SSE |
| sanitizer redacts URL query secrets | token/code/signature hidden |
| system source disabled by default | 403 stream, disabled in sources |
| nginx_access emits only 4xx/5xx by default | no 2xx/3xx entries |
| full nginx_access requires env flag | all rejected unless allowed |
| every stream creates audit event | audit row/log emitted |
| second stream same user rejected | 429 |
| activity feed streams login success | NIM appears within <=3s |
| activity feed streams password changed | event appears, password absent |
| activity feed streams profile updated | field names only, values absent |
| activity feed masks email/IP | no raw sensitive values |
| stream sends connected event | first SSE event ok |
| max initial lines enforced | <=100 |
| source not readable marked unavailable | sources endpoint reports readable=false |

### 8.2 Frontend Tests

| Test | Expected |
|---|---|
| creates EventSource URL with source/level/search | correct query |
| source switch closes previous EventSource | close called |
| pause closes stream | status paused |
| connected event updates status | connected |
| log-entry appends buffer | entries length +1 |
| buffer max 1000 | old entries dropped |
| unavailable source disabled | disabled UI |
| disabled source shows config reason | disabled UI + tooltip |
| nginx_access shows 4xx/5xx badge | badge visible |
| activity feed renders timeline rows | event badge + NIM + summary visible |
| activity feed row click links detail | opens existing activity log detail if available |
| clear empties entries | [] |

---

## 9. Ops Requirements

### 9.1 Nginx Vhost Log Naming

Untuk production, sebaiknya vhost SIBERMAS punya log file khusus.

```nginx
access_log /var/log/nginx/sibermas.access.log;
error_log  /var/log/nginx/sibermas.error.log warn;
```

Jika belum ada, fallback ke global:

```text
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### 9.2 Permission

Process PHP-FPM (`www`) harus bisa read log yang di-whitelist.

Recommended FreeBSD group approach:

```sh
pw groupadd logreaders
pw groupmod logreaders -m www
chgrp logreaders /var/log/nginx/sibermas.*.log /var/log/php-fpm*.log
chmod 640 /var/log/nginx/sibermas.*.log /var/log/php-fpm*.log
```

Do not chmod `777` log files.

Do not change `/var/log/messages` permissions unless `LOG_VIEWER_ENABLE_SYSTEM=true` is approved by operator.

### 9.4 Environment Flags

Recommended production defaults:

```env
LOG_STREAM_TTL=60
LOG_STREAM_POLL_INTERVAL=2
LOG_STREAM_MAX_USER_CONNECTIONS=1
LOG_STREAM_MAX_GLOBAL_CONNECTIONS=3

LOG_VIEWER_ENABLE_LARAVEL=true
LOG_VIEWER_ENABLE_FRONTEND=true
LOG_VIEWER_ENABLE_NGINX_ERROR=true
LOG_VIEWER_ENABLE_NGINX_ACCESS=true
LOG_VIEWER_ENABLE_PHP_FPM=true
LOG_VIEWER_ENABLE_ACTIVITY_FEED=true
LOG_VIEWER_ENABLE_SYSTEM=false

LOG_VIEWER_ALLOW_FULL_ACCESS_LOG=false
```

### 9.3 Logrotate/newsyslog

Pastikan rotation tidak memutus lama terlalu lama. Stream harus detect:

- file size shrink
- inode/path unavailable
- new daily Laravel file

Saat terdeteksi, kirim `event: rotated`, lalu client reconnect.

---

## 10. Implementation Order

1. Backend: `ProductionLogSourceResolver`
2. Backend: `ProductionLogParser`
3. Backend: `LogStreamController::sources`
4. Backend: `LogStreamController::stream`
5. Backend: routes in `v1-admin.php`
6. Backend tests
7. Frontend: `useProductionLogStream`
8. Frontend: `ProductionLogViewer` + filter UI
9. Frontend: admin page + sidebar nav
10. Manual production-like test with fake log files
11. Server ops: nginx vhost log path + read permissions

---

## 11. Acceptance Criteria

| ID | Criteria |
|---|---|
| AC-1 | Superadmin can open `/admin/logs` |
| AC-2 | Non-superadmin cannot access backend stream |
| AC-3 | Default view shows Laravel production error/warning realtime |
| AC-4 | Source can switch to FE Errors, Nginx Error, Nginx Access, PHP-FPM |
| AC-5 | New log line appears in UI within <=3 seconds |
| AC-6 | Filters by level and search work |
| AC-7 | Secrets/cookies/tokens are masked before display |
| AC-8 | Stream auto-reconnects after 60s TTL |
| AC-9 | Log rotation does not permanently break viewer |
| AC-10 | Unreadable source is shown as unavailable, not fatal error |
| AC-11 | URL query secrets are redacted before display |
| AC-12 | `system` source is disabled by default |
| AC-13 | `nginx_access` default shows only 4xx/5xx |
| AC-14 | Every stream open creates audit event |
| AC-15 | Second active stream from same user is rejected |
| AC-16 | Activity Feed shows new login NIM within <=3 seconds |
| AC-17 | Activity Feed shows password change event without password values |
| AC-18 | Activity Feed shows profile update/completion with field names only |
| AC-19 | Activity Feed search by NIM/name works |
| AC-20 | Activity Feed click-through opens existing activity-log detail when available |

---

## 12. Notes For Server Agent

- Do not implement raw path input.
- Do not expose auth/security logs by default.
- Keep `system` disabled unless operator explicitly enables it.
- Keep `nginx_access` default to 4xx/5xx only.
- Redact sensitive URL query params before SSE output.
- Audit every stream open.
- Prefer vhost-specific nginx logs: `sibermas.access.log`, `sibermas.error.log`.
- Frontend error source should use existing `/api/log-error` pipeline first.
- Activity feed should use existing `UserActivityLog`/`activity-log` system first, not raw log parsing.
- Add missing activity event instrumentation only if current system does not record login/password/profile events.
- Never display password values, token values, or full profile before/after values.
- If frontend logs are mixed into Laravel log, filter by frontend markers.
- Keep SSE implementation close to `NotificationStreamController`.
- Keep UI as dashboard-console hybrid, not raw terminal clone.
- Verify permissions on FreeBSD before declaring source available.
