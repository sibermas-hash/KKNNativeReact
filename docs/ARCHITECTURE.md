# SIBERMAS Architecture Guide

Complete system architecture overview for SIBERMAS (KKN Management System).

## 🏗️ High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                         SIBERMAS SYSTEM                                │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌───────────┐  ┌───────────┐  ┌─────────────────────────────────┐ │
│  │ Next.js   │  │ React     │  │ Mobile API (Bearer Auth)         │ │
│  │ Web App   │  │ Native    │  │                                 │ │
│  │           │  │ (iOS/And) │  │                                 │ │
│  └─────┬─────┘  └─────┬─────┘  └─────────────────┬───────────────┘ │
│        │             │                         │                 │
│        │ HTTP/S      │ HTTP/S                  │ HTTP/S           │
│        └─────────────┴─────────────────────────┘                 │
│                             │                                       │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │                    Laravel 13 API Backend                        ││
│  │  ┌───────────────────────────────────────────────────────────────┐││
│  │  │ HTTP Routes → Controllers → Services → Database             │││
│  │  │ Auth (Sanctum) • RBAC (Spatie) • AI (Laravel AI)             │││
│  │  └───────────────────────────────────────────────────────────────┘││
│  └─────────────────────────────────────────────────────────────────┘│
│                                                                       │
│  ┌────────┐  ┌──────┐  ┌───────┐  ┌────────┐                         │
│  │PostgreSQL│ │Redis │ │AWS S3│ │SIAKAD │                         │
│  └────────┘  └──────┘  └───────┘  └────────┘                         │
└───────────────────────────────────────────────────────────────────────┘
```

## 📦 Monorepo Structure

```
kknuinsaizu/
├── apps/
│   ├── api/              # Laravel 13 Backend (JSON API)
│   ├── web/              # Next.js 15 Frontend
│   └── mobile/           # Expo 53 Mobile App
├── packages/
│   ├── shared-types/     # TypeScript interfaces
│   ├── api-client/       # Axios instances & endpoints
│   ├── schemas/          # Zod validation schemas
│   ├── hooks/            # Custom React hooks
│   └── constants/        # Query keys & constants
└── docs/                 # Documentation
```

### Backend Structure

```
apps/api/
├── app/
│   ├── Http/
│   │   ├── Controllers/Api/V1/
│   │   │   ├── Auth/ (1 controller)
│   │   │   ├── Student/ (8 controllers)
│   │   │   ├── Dpl/ (8 controllers)
│   │   │   ├── Dosen/ (1 controller)
│   │   │   └── Admin/ (24 controllers)
│   │   ├── Resources/Api/V1/ (30 resources)
│   │   └── Middleware/ (15 middleware)
│   ├── Models/KKN/ (52 models)
│   ├── Services/ (39+ services)
│   │   ├── AI/ (AI-powered services)
│   │   ├── MasterApi/ (SIAKAD integration)
│   │   └── KKN/ (KKN-specific services)
│   └── Traits/ApiResponse.php
├── routes/
│   ├── api/v1-student.php (24 routes)
│   ├── api/v1-dosen.php (23 routes)
│   └── api/v1-admin.php (105 routes)
└── database/migrations/ (154 migrations)
```

### Frontend Structure

```
apps/web/
├── src/app/
│   ├── (auth)/login/page.tsx
│   ├── (student)/mahasiswa/ (19 pages)
│   ├── (dosen)/dosen/ (13 pages)
│   ├── (admin)/admin/ (27 pages)
│   ├── berita/ (2 pages)
│   ├── unduhan/page.tsx
│   └── verify-certificate/[token]/page.tsx
├── src/components/ui/ (shared components)
├── src/lib/api.ts (Web API client)
├── src/stores/index.ts (Auth store - Zustand)
└── src/providers/index.tsx (App providers)
```

### Mobile Structure

```
apps/mobile/
├── app/
│   ├── (auth)/login.tsx
│   ├── (tabs)/ (4 student tabs)
│   └── (dpl-tabs)/ (4 DPL tabs)
├── lib/api.ts (Mobile API client with SecureStore)
├── stores/index.ts (Auth store)
└── app.config.ts
```

## 🔐 Authentication System

### Authentication Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Client     │────▶│   Captcha    │────▶│  Auth (Sanctum)│
│  (Web/Mobile)│     │   Service    │     │  (Cookie/Token)│
└──────────────┘     └──────────────┘     └──────────────┘
```

**Web (Cookie-based):**
1. GET /captcha → Generate CAPTCHA
2. POST /login → Verify CAPTCHA → Create session
3. Response → Set laravel_session cookie

**Mobile (Bearer Token):**
1. GET /captcha → Generate CAPTCHA
2. POST /login + X-App-Type: mobile → Create token
3. Response → Return Bearer token (stored in SecureStore)

### Role Hierarchy

```
superadmin (Full access)
├── admin (Operational)
│   └── faculty_admin (Faculty-scoped)
├── dosen (Lecturer)
│   └── dpl (Field supervisor)
└── student (KKN participant)
```

## 📊 Database Schema

### Core Tables

**users** - User accounts
- id, username, name, email, password, avatar
- is_active, must_change_password

**mahasiswa** - Student data
- id, user_id, nim, fakultas_id, prodi_id
- sks, ipk

**periode_kkn** - KKN periods
- id, nama, tahun_akademik, fase_pembukaan
- tanggal_mulai, tanggal_selesai, status_periode

**kelompok_kkn** - KKN groups
- id, nama, lokasi_id, dpl_id, periode_kkn_id

**peserta_kkn** - Participants
- id, mahasiswa_id, kelompok_kkn_id, periode_kkn_id, status

**kegiatan_kkn** - Daily reports
- id, peserta_kkn_id, program_kerja_id, tanggal
- judul, deskripsi, latitude, longitude, status

## 🔄 Data Flow

### Daily Report Submission Flow

```
┌──────────┐   POST /v1/student/reports   ┌──────────────┐
│ Student  │────────────────────────────▶│ Controller   │
│ (Next.js)│  {GPS coords, photos, desc}  │ Validation   │
└──────────┘                              └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   Database    │
                                        │ PostgreSQL    │
                                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │    Queue     │
                                        │ AI Analysis  │
                                        └──────┬───────┘
                                               │
                                               ▼
                                        ┌──────────────┐
                                        │   DPL        │
                                        │ Notification │
                                        └──────────────┘
```

### Period Phase Transitions

```
CLOSED → OPENING → KEGIATAN → LAPORAN → CLOSED
  ↓          ↓          ↓          ↓        ↓
Inactive  Registration  Activity  Final    Archived
          Phase       Phase     Report    Graded
```

## 🔒 Security Architecture

### Security Layers

1. **Network Level**
   - HTTPS only (SSL/TLS)
   - OWASP security headers
   - CSP headers

2. **Authentication Layer**
   - CAPTCHA verification (Redis, Argon2id)
   - Rate limiting (10 req/min auth, 60 req/min API)
   - Token expiration (30 days)

3. **Authorization Layer**
   - RBAC (Spatie Permission)
   - Phase validation
   - Profile validation

4. **Input Validation**
   - Form Request validation
   - File upload validation (magic bytes)
   - X-CRSF protection
   - SQL injection prevention

5. **Output Security**
   - XSS prevention (DOMPurify)
   - Response envelope format
   - Error handling

### CAPTCHA Flow

```
Request → Generate UUID → Store hash (Argon2id) → Return quiz
User answers → Hash answer → Compare hash → Match/No match
```

### Geofence Enforcement

```
Report coords → Get posko GPS → Calculate distance (Haversine)
Distance ≤ 100m? → Yes: Save / No: Reject
```

## 🚀 Performance Optimization

### Caching Strategy

**Redis Cache Layers:**
- Period Context (1 hour)
- User Data (30 minutes)
- Reference Data (24 hours)
- Statistics (5 minutes)
- CAPTCHA (5 minutes)

### Database Optimization

**Techniques:**
- Eager loading (prevent N+1)
- Query scopes
- Database indexes
- Connection pooling

### Frontend Optimization

**TanStack Query:**
- Automatic caching (30s staleTime)
- Background refetching
- Optimistic updates

## 🔌 Integration Points

### SIAKAD API Integration

```php
$siaKadService = app(MasterApiService::class);
$students = $siaKadService->yieldSyncMahasiswa('2026-05-01T00:00:00Z');
```

### AI Integration

```php
$analyzer = new LogbookAnalyzer();
$analysis = $analyzer->analyzeEntry($kegiatan);
// Returns: relevance, sentiment, DPL suggestions
```

### Queue Jobs

```php
ProcessActivityAiAnalysis::dispatch($report->id);
GenerateBulkCertificatesJob::dispatch($period->id);
SyncAllMahasiswaJob::dispatch();
```

## 🧪 Testing Architecture

### Test Pyramid

```
    E2E (5%) - Playwright
    /        \
 Integration (20%) - Vitest/PHP
  /   |      \
Unit (70%) - Pest
```

### Test Coverage

- Pest: 29 tests (Auth, Student, DPL, Admin, Public)
- Vitest: Frontend component tests
- Playwright: End-to-end flows

## 📱 Mobile Architecture

### Native Features

- **Camera** - Capture photos for reports
- **GPS** - Geotag reports
- **Notifications** - Reminders & alerts
- **SecureStore** - Secure token storage

### Offline Mode (Future)

- Local SQLite for offline storage
- Queue failed uploads
- Auto-sync when online

## 📊 Monitoring & Logging

### Health Checks

```bash
GET /api/health
Response: {"status": "ok", "service": "SIBERMAS API", "version": "1.0.0"}
```

### Laravel Telescope

- Request tracking
- Query monitoring
- Job monitoring
- Exception tracking

### Queue Monitoring

```bash
php artisan queue:monitor
php artisan queue:failed
```

## 🚀 Deployment Architecture

### Production Stack

```
DNS → CDN (Static/Frontend) → Nginx → App Servers (PHP-FPM/Next.js)
                                       │
                                       ▼
                            Redis (Cache/Queue/Sessions)
                                       │
                                       ▼
                            PostgreSQL (Primary DB)
                                       │
                                       ▼
                            AWS S3 (Storage)
```

## 📝 Key Metrics

### System Stats

| Metric | Count |
|--------|-------|
| API Endpoints | 163 |
| Controllers | 35 |
| Resources | 30 |
| Web Pages | 66 |
| Mobile Screens | 8 |
| Database Migrations | 154 |
| Pest Tests | 29 |
| Services | 39+ |

### API Endpoint Distribution

| Group | Routes |
|-------|--------|
| Auth | 7 |
| Student | 24 |
| Dosen | 1 |
| DPL | 22 |
| Admin | 105 |
| Public | 4 |

## 🔄 Data Sync

### SIAKAD Sync

**Full Sync:**
- All students and lecturers

**Delta Sync:**
- Since parameter: `?since=2026-05-01T00:00:00Z`

**Fallback:**
- Database fallback if API fails

---

**Version:** 1.0.0  
**Last Updated:** May 5, 2026  
**Maintained by:** Tim IT UIN Saizu
