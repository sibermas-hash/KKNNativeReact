# Backend Documentation — KKN UIN SAIZU API

> Laravel 13 · PHP 8.4 · PostgreSQL 16 · Redis 7  
> Last updated: 2026-05-07

---

## 1. Tech Stack & Dependencies

### Runtime
| Komponen | Versi |
|---|---|
| PHP | ^8.4 |
| Laravel Framework | ^13.0 |
| PostgreSQL | 16 |
| Redis | 7 |

### Production Dependencies (`require`)

| Package | Versi | Kegunaan |
|---|---|---|
| `laravel/sanctum` | ^4.0 | Token-based API authentication |
| `spatie/laravel-permission` | ^7.3 | RBAC (roles & permissions) |
| `laravel/ai` | ^0.5.1 | AI integration (Laravel native) |
| `prism-php/prism` | ^0.100 | LLM abstraction layer |
| `laravel/mcp` | ^0.6.5 | Model Context Protocol |
| `laravel/boost` | ^2.4 | Laravel performance utilities |
| `barryvdh/laravel-dompdf` | ^3.1.2 | PDF generation (sertifikat, laporan) |
| `maatwebsite/excel` | ^3.1.68 | Excel export (rekap nilai, data) |
| `phpoffice/phpword` | ^1.4.0 | Word document generation |
| `intervention/image` | ^3.11 | Image processing (watermark foto) |
| `predis/predis` | ^2.3 | Redis client |
| `league/flysystem-aws-s3-v3` | ^3.32 | S3-compatible file storage |
| `spatie/laravel-backup` | ^10.0 | Database & file backup |
| `knuckleswtf/scribe` | ^5.9 | API documentation generator |

### Dev Dependencies (`require-dev`)

| Package | Kegunaan |
|---|---|
| `pestphp/pest` ^4.0 | Testing framework |
| `pestphp/pest-plugin-laravel` ^4.1 | Laravel-specific test helpers |
| `laravel/pint` ^1.18 | Code style fixer (PSR-12) |
| `nunomaduro/collision` ^8.1 | Better error reporting |
| `laravel/pail` ^1.2 | Real-time log viewer |

### NPM Scripts
```bash
composer test          # pest --no-coverage
composer test:filter   # pest --filter=<name>
composer lint          # pint (check)
composer lint:fix      # pint --fix
```

---

## 2. Struktur Direktori

```
apps/api/
├── app/
│   ├── Console/
│   ├── Enums/                        # PHP 8.1+ backed enums (KknType, dll.)
│   ├── Events/
│   ├── Exceptions/
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── Api/
│   │   │       └── V1/
│   │   │           ├── Auth/         # AuthController
│   │   │           ├── Admin/        # ~35 controller admin
│   │   │           ├── Student/      # ~14 controller mahasiswa
│   │   │           ├── Dpl/          # ~8 controller DPL
│   │   │           ├── Dosen/        # ~3 controller dosen
│   │   │           ├── ProfileController.php
│   │   │           ├── PeriodContextController.php
│   │   │           └── PublicController.php
│   │   ├── Middleware/               # 15+ middleware
│   │   ├── Requests/                 # Form Request validation
│   │   ├── Resources/                # API Resources (JSON transformers)
│   │   └── Traits/
│   │       └── ApiResponse.php       # Standar envelope JSON
│   ├── Jobs/                         # Queue jobs (12 jobs)
│   ├── Models/
│   │   ├── User.php                  # Auth user (Sanctum)
│   │   └── KKN/                      # ~55 domain models
│   ├── Repositories/
│   │   └── Contracts/                # Repository interfaces
│   ├── Services/                     # Business logic layer
│   │   ├── AI/                       # AI services (3 services)
│   │   ├── Admin/                    # Admin-specific services (2)
│   │   ├── KKN/                      # KKN domain services (14)
│   │   └── MasterApi/                # SIAKAD integration (5 services)
│   └── Traits/
│       └── ScopedByPeriode.php       # Eloquent scope helper
├── bootstrap/
├── config/
├── database/
│   ├── migrations/
│   ├── factories/
│   └── seeders/
├── routes/
│   ├── api.php                       # API routes (versioned)
│   └── web.php
├── storage/
├── tests/
│   ├── Feature/
│   └── Unit/
├── composer.json
└── BACKEND.md
```

---

## 3. Controller Conventions

### Namespace & Lokasi

Semua controller API berada di `App\Http\Controllers\Api\V1\{Role}\` dan dikelompokkan berdasarkan peran pengguna:

```
Api/V1/Admin/     → endpoint admin & superadmin
Api/V1/Student/   → endpoint mahasiswa
Api/V1/Dpl/       → endpoint DPL (Dosen Pembimbing Lapangan)
Api/V1/Dosen/     → endpoint dosen umum
Api/V1/Auth/      → autentikasi (login, logout, refresh)
```

### Anatomi Controller

```php
<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\SomeService;
use Illuminate\Http\JsonResponse;

class ExampleController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SomeService $service
    ) {}

    public function index(): JsonResponse
    {
        $data = $this->service->getAll();
        return $this->success($data);
    }

    public function store(StoreRequest $request): JsonResponse
    {
        $result = $this->service->create($request->validated());
        return $this->created($result, 'Data berhasil dibuat.');
    }
}
```

### Aturan Umum

- Semua file menggunakan `declare(strict_types=1)`.
- Controller **tidak** mengandung business logic — hanya menerima request, memanggil service, dan mengembalikan response.
- Validasi dilakukan via **Form Request** (`app/Http/Requests/`), bukan di controller.
- Dependency injection via constructor (constructor promotion PHP 8.x).
- Semua method mengembalikan `JsonResponse` menggunakan trait `ApiResponse`.
- Resource transformation menggunakan **API Resources** (`app/Http/Resources/`).

---

## 4. Service Layer Pattern

Services berisi seluruh business logic dan berada di `app/Services/`. Dikelompokkan dalam subdirektori berdasarkan domain:

```
Services/
├── RegistrationService.php           # Pendaftaran mahasiswa (distributed lock)
├── EligibilityService.php            # Cek kelayakan akademik
├── GradingService.php                # Kalkulasi nilai
├── CertificateService.php            # Generate sertifikat PDF
├── WorkshopService.php               # Manajemen workshop & absensi QR
├── PeriodContextService.php          # Resolusi periode aktif
├── StudentSyncService.php            # Sinkronisasi data mahasiswa dari SIAKAD
├── GroupSelectionService.php         # Pemilihan kelompok KKN
├── DashboardStatisticsService.php    # Statistik dashboard admin
├── GradeExportService.php            # Export nilai ke Excel/PDF
├── RedisCacheService.php             # Cache management terpusat
├── GeofenceService.php               # Validasi GPS geofencing
├── PhotoWatermarkService.php         # Watermark foto absensi
├── IzinService.php                   # Manajemen izin meninggalkan
├── AuditService.php                  # Audit trail
├── AI/
│   ├── LogbookAnalyzer.php           # Analisis logbook dengan AI
│   ├── CodeGuardianService.php       # Code quality AI
│   └── SelfHealerService.php        # Self-healing AI
├── KKN/
│   ├── RegistrationApprovalService.php   # Alur approval pendaftaran
│   ├── DplParticipantEvaluationService.php # Evaluasi peserta oleh DPL
│   ├── NilaiAkhirService.php             # Kalkulasi nilai akhir
│   ├── PeriodeGovernanceService.php      # Governance rules periode
│   ├── AttendanceValidationService.php   # Validasi absensi harian
│   ├── FraudDetectionService.php         # Deteksi kecurangan GPS/foto
│   ├── KknRequirementService.php         # Syarat-syarat KKN
│   ├── PlacementService.php              # Penempatan kelompok
│   └── ...
├── MasterApi/
│   ├── MasterApiClient.php           # HTTP client ke SIAKAD
│   ├── CircuitBreakerService.php     # Circuit breaker pattern
│   ├── MasterApiTokenService.php     # Token management SIAKAD
│   ├── FallbackCacheService.php      # Cache fallback saat SIAKAD down
│   └── EntityMapperService.php       # Mapping entitas SIAKAD → lokal
└── Admin/
    ├── PeriodeService.php            # CRUD & lifecycle periode
    └── DplAssignmentService.php      # Penugasan DPL ke kelompok
```

### Pola Penggunaan Service

```php
// Di controller: inject via constructor
public function __construct(
    private readonly RegistrationService $registrationService
) {}

// Di service: inject dependencies lain
public function __construct(
    private readonly RegistrationRepositoryInterface $registrations,
    private readonly GroupSelectionService $groupSelectionService,
) {}
```

### Distributed Locking (RegistrationService)

Untuk operasi kritis (pendaftaran), service menggunakan distributed lock Redis + DB transaction:

```php
// 1. Acquire cache-based distributed lock (per student + period)
// 2. Start DB transaction
// 3. Lock Periode row with lockForUpdate()
// 4. Run validations inside the lock
// 5. Create/update records
// 6. Commit transaction
// 7. Release cache lock
```

---

## 5. Model Relationships Overview

Semua domain model berada di `App\Models\KKN\` dan menggunakan `declare(strict_types=1)`.

### Hierarki Utama

```
TahunAkademik
└── Periode (KKN period)
    ├── JenisKkn (tipe: reguler, tematik, nusantara, dll.)
    ├── KelompokKkn (kelompok mahasiswa)
    │   ├── PesertaKkn (mahasiswa dalam kelompok)
    │   │   ├── Mahasiswa → User
    │   │   ├── DokumenPesertaKkn
    │   │   ├── Attendance (absensi harian + GPS)
    │   │   │   └── AttendancePhoto
    │   │   └── LocationDispensation
    │   ├── KegiatanKkn (laporan harian)
    │   │   └── FileKegiatanKkn
    │   ├── ProgramKerja
    │   ├── LaporanAkhir
    │   └── PoskoKelompok
    ├── DplPeriod (DPL yang bertugas di periode ini)
    │   └── Dosen → User
    └── DplKecamatanAssignment
```

### Model Penting

**`Periode`** — Inti sistem, menyimpan `current_phase` dan mengatur seluruh lifecycle KKN.
- Relations: `tahunAkademik`, `jenisKkn`, `kelompok`, `peserta`, `dplPeriods`, `dplKecamatanAssignments`
- Cache: flush otomatis saat `saved`/`deleted` via model boot
- Governance: `PeriodeGovernanceService::applyGovernanceToModel()` dipanggil saat `saving`

**`PesertaKkn`** — Registrasi mahasiswa ke periode KKN.
- Relations: `mahasiswa`, `periode`, `kelompok`, `dokumen`, `attendances`, `locationDispensations`
- Traits: `ScopedByPeriode`, `SoftDeletes`
- Scopes: `scopeKetua()`, `scopeSearch()`

**`KelompokKkn`** — Kelompok KKN.
- Relations: `periode`, `lokasi`, `peserta`, `dosen` (pivot dengan role)

**`Mahasiswa`** — Data akademik mahasiswa (disinkronisasi dari SIAKAD).
- Relations: `user`, `fakultas`, `prodi`, `pesertaKkn`

**`NilaiKkn`** — Nilai akhir mahasiswa.
- Relations: `user`, `kelompok`, `periode`

**`Attendance`** — Absensi harian dengan validasi GPS.
- Relations: `pesertaKkn`, `photos`

**`Workshop`** — Workshop/pembekalan KKN.
- Relations: `pesertaWorkshop`

### Trait `ScopedByPeriode`

Digunakan oleh model yang perlu di-scope ke periode aktif secara otomatis:

```php
use App\Traits\ScopedByPeriode;

class PesertaKkn extends Model
{
    use ScopedByPeriode;
    // Menambahkan scope: ->forPeriod($periodeId)
}
```

---

## 6. Middleware Stack

### Daftar Middleware

| Middleware | Alias | Fungsi |
|---|---|---|
| `EnsurePhase` | `phase` | Blokir akses berdasarkan fase KKN aktif |
| `EnsureAdminAuthorization` | — | Otorisasi granular untuk admin |
| `EnsureUserIsActive` | — | Cek status aktif user |
| `EnsureProfileCompleted` | — | Paksa lengkapi profil sebelum akses |
| `EnsurePasswordChanged` | — | Paksa ganti password default |
| `HandleActivePeriod` | — | Inject periode aktif ke request |
| `CheckPeriodLock` | — | Blokir akses jika periode terkunci |
| `ValidateApiKey` | — | Validasi API key untuk integrasi eksternal |
| `VerifyWebhookSignature` | — | Verifikasi HMAC signature webhook |
| `KknThrottleMiddleware` | — | Rate limiting kustom per role |
| `SecurityHeaders` | — | Tambah security headers (HSTS, X-Frame, dll.) |
| `CspHeaders` | — | Content Security Policy headers |
| `TestAutoLogin` | — | Auto-login untuk testing (non-production) |

### Urutan Middleware di Route API

```
sanctum (auth)
→ EnsureUserIsActive
→ EnsurePasswordChanged
→ EnsureProfileCompleted
→ HandleActivePeriod
→ [role middleware: role:admin / role:mahasiswa / role:dpl]
→ EnsurePhase (jika diperlukan)
→ CheckPeriodLock (jika diperlukan)
```

### Auth Middleware

Menggunakan **Laravel Sanctum** (`auth:sanctum`) untuk token-based authentication. Token disimpan di tabel `personal_access_tokens`.

### Role Middleware

Menggunakan **Spatie Laravel Permission** (`role:admin`, `role:mahasiswa`, dll.). Roles yang tersedia:
- `superadmin` — akses penuh
- `admin` — manajemen KKN
- `faculty_admin` — manajemen per fakultas
- `dpl` — Dosen Pembimbing Lapangan
- `dosen` — dosen umum
- `mahasiswa` — peserta KKN

---

## 7. ApiResponse Trait

Lokasi: `app/Http/Traits/ApiResponse.php`

Semua controller menggunakan trait ini untuk konsistensi envelope JSON.

### Format Response Sukses

```json
{
  "success": true,
  "message": "OK",
  "data": { ... }
}
```

### Format Response Error

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Pesan error",
    "errors": { ... }
  }
}
```

### Format Response Koleksi (Paginated)

```json
{
  "success": true,
  "message": "OK",
  "data": [ ... ],
  "meta": {
    "current_page": 1,
    "last_page": 5,
    "per_page": 15,
    "total": 75,
    "from": 1,
    "to": 15
  },
  "links": {
    "first": "...",
    "last": "...",
    "prev": null,
    "next": "..."
  }
}
```

### Method yang Tersedia

| Method | HTTP Code | Kegunaan |
|---|---|---|
| `success($data, $message, $code)` | 200 | Response sukses umum |
| `successResource($resource, $message)` | 200 | Response dengan API Resource |
| `successCollection($collection, $message)` | 200 | Response koleksi + pagination |
| `created($data, $message)` | 201 | Resource berhasil dibuat |
| `noContent($message)` | 200 | Sukses tanpa data |
| `badRequest($message, $errors)` | 400 | Request tidak valid |
| `unauthorized($message)` | 401 | Tidak terotentikasi |
| `forbidden($message)` | 403 | Akses ditolak |
| `notFound($message)` | 404 | Data tidak ditemukan |
| `validationError($errors, $message)` | 422 | Validasi gagal |
| `rateLimited($message)` | 429 | Rate limit tercapai |
| `serverError($message)` | 500 | Internal server error |

### Contoh Penggunaan

```php
use App\Http\Traits\ApiResponse;

class MyController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $items = MyResource::collection(Item::paginate(15));
        return $this->successCollection($items, 'Data berhasil diambil.');
    }

    public function show(int $id): JsonResponse
    {
        $item = Item::find($id);
        if (!$item) return $this->notFound('Item tidak ditemukan.');
        return $this->success(new ItemResource($item));
    }

    public function store(StoreItemRequest $request): JsonResponse
    {
        $item = $this->itemService->create($request->validated());
        return $this->created(new ItemResource($item));
    }
}
```

---

## 8. Phase System Implementation

### Fase KKN

Periode KKN memiliki 6 fase yang tersimpan di kolom `current_phase` pada tabel `periode`:

| Fase | Label | Deskripsi |
|---|---|---|
| `upcoming` | Pra-Pendaftaran | Periode belum dibuka |
| `registration` | Masa Pendaftaran | Mahasiswa dapat mendaftar |
| `placement` | Seleksi & Plotting | Admin memproses penempatan |
| `execution` | Pelaksanaan KKN | Mahasiswa aktif di lapangan |
| `grading` | Masa Penilaian | DPL & admin menilai |
| `finished` | KKN Selesai | Periode telah berakhir |

### EnsurePhase Middleware

Middleware `EnsurePhase` (alias: `phase`) memblokir akses endpoint berdasarkan fase aktif.

**Cara pakai di routes:**

```php
// Hanya bisa diakses saat fase registration
Route::post('daftar', [RegistrationController::class, 'store'])
    ->middleware('phase:registration');

// Bisa diakses saat execution atau grading
Route::post('laporan-harian', [DailyReportController::class, 'store'])
    ->middleware('phase:execution,grading');

// Bisa diakses saat grading atau finished
Route::get('nilai', [GradeController::class, 'index'])
    ->middleware('phase:grading,finished');
```

**Bypass otomatis:** User dengan role `superadmin`, `admin`, atau `faculty_admin` selalu melewati pengecekan fase.

**Response saat diblokir (API):**

```json
{
  "success": false,
  "error": {
    "code": "PHASE_BLOCKED",
    "message": "Pendaftaran KKN sudah ditutup. Fase saat ini: Pelaksanaan KKN.",
    "current_phase": "execution"
  }
}
```

### PeriodContextService

Service yang menyediakan konteks periode aktif ke seluruh aplikasi:

```php
// Mendapatkan ID periode aktif
$periodId = $this->periodContextService->getActivePeriodId();

// Fallback ke periode default
$periodId = $periodId ?? $this->periodContextService->getDefaultPeriodId();
```

### PeriodeGovernanceService

Menerapkan aturan governance saat periode disimpan (via model boot `saving`):

```php
// Dipanggil otomatis saat Periode::save()
PeriodeGovernanceService::applyGovernanceToModel($period);

// Mendapatkan blueprint governance untuk periode
$blueprint = $period->governance();
```

### Cache Periode

`Periode::getActivePeriod()` menggunakan cache Redis 24 jam. Cache di-flush otomatis saat model `saved` atau `deleted`:

```php
// Cache keys yang di-flush:
// - active_period
// - default_periode_id
// - available_periods
```

---

## 9. Cara Menambah Endpoint Baru

### Langkah-langkah

**1. Buat Form Request (validasi)**

```bash
php artisan make:request Api/V1/StoreMyResourceRequest
```

```php
// app/Http/Requests/Api/V1/StoreMyResourceRequest.php
class StoreMyResourceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // otorisasi di middleware/policy
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
        ];
    }
}
```

**2. Buat API Resource (transformer)**

```bash
php artisan make:resource Api/V1/MyResourceResource
```

**3. Buat Service (business logic)**

```php
// app/Services/MyResourceService.php
declare(strict_types=1);

namespace App\Services;

class MyResourceService
{
    public function create(array $data): MyModel
    {
        return DB::transaction(function () use ($data) {
            return MyModel::create($data);
        });
    }
}
```

**4. Buat Controller**

```php
// app/Http/Controllers/Api/V1/{Role}/MyResourceController.php
declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreMyResourceRequest;
use App\Http\Resources\Api\V1\MyResourceResource;
use App\Http\Traits\ApiResponse;
use App\Services\MyResourceService;
use Illuminate\Http\JsonResponse;

class MyResourceController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly MyResourceService $service
    ) {}

    public function index(): JsonResponse
    {
        $items = MyModel::paginate(15);
        return $this->successCollection(MyResourceResource::collection($items));
    }

    public function store(StoreMyResourceRequest $request): JsonResponse
    {
        $item = $this->service->create($request->validated());
        return $this->created(new MyResourceResource($item));
    }
}
```

**5. Daftarkan Route**

```php
// routes/api.php — di dalam group yang sesuai
Route::middleware(['auth:sanctum', 'role:admin'])
    ->prefix('v1/admin')
    ->group(function () {
        Route::apiResource('my-resource', Admin\MyResourceController::class);

        // Dengan phase guard:
        Route::post('my-resource', [Admin\MyResourceController::class, 'store'])
            ->middleware('phase:registration');
    });
```

**6. Tulis Test**

```php
// tests/Feature/Api/V1/Admin/MyResourceTest.php
it('admin can create my resource', function () {
    $admin = User::factory()->create()->assignRole('admin');

    $response = $this->actingAs($admin)
        ->postJson('/api/v1/admin/my-resource', [
            'name' => 'Test Resource',
            'periode_id' => Periode::factory()->create()->id,
        ]);

    $response->assertStatus(201)
        ->assertJsonPath('success', true);
});
```

**7. Jalankan verifikasi**

```bash
php artisan test --filter=MyResource
composer lint
```

---

## 10. Queue Jobs

Semua jobs berada di `app/Jobs/` dan menggunakan Laravel Queue dengan Redis sebagai driver.

### Daftar Jobs

| Job | Fungsi |
|---|---|
| `SyncMahasiswaJob` | Sinkronisasi data satu mahasiswa dari SIAKAD |
| `SyncAllMahasiswaJob` | Sinkronisasi massal semua mahasiswa |
| `SyncDosenJob` | Sinkronisasi data satu dosen dari SIAKAD |
| `SyncAllDosenJob` | Sinkronisasi massal semua dosen |
| `SyncFacultyJob` | Sinkronisasi data fakultas dari SIAKAD |
| `SyncProgramJob` | Sinkronisasi data program studi dari SIAKAD |
| `SyncMasterDataJob` | Sinkronisasi master data (dispatcher) |
| `GenerateMassCertificatesJob` | Generate sertifikat massal untuk satu periode |
| `GenerateBulkCertificatesJob` | Generate sertifikat untuk batch mahasiswa |
| `FinalizeMassScoresJob` | Finalisasi nilai massal satu periode |
| `ProcessActivityAiAnalysis` | Analisis AI untuk laporan kegiatan |
| `ProcessAuditLog` | Proses dan simpan audit log secara async |

### Cara Dispatch Job

```php
use App\Jobs\SyncMahasiswaJob;
use App\Jobs\GenerateMassCertificatesJob;

// Dispatch ke default queue
SyncMahasiswaJob::dispatch($mahasiswaId);

// Dispatch ke queue tertentu
GenerateMassCertificatesJob::dispatch($periodeId)
    ->onQueue('certificates');

// Dispatch dengan delay
SyncMahasiswaJob::dispatch($mahasiswaId)
    ->delay(now()->addMinutes(5));
```

### Queue Configuration

```bash
# Jalankan worker (development)
php artisan queue:work redis --queue=default,certificates,sync

# Jalankan via Supervisor (production)
# Lihat supervisord.conf di root project
```

### Menambah Job Baru

```bash
php artisan make:job MyNewJob
```

```php
// app/Jobs/MyNewJob.php
declare(strict_types=1);

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class MyNewJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $timeout = 120;

    public function __construct(
        private readonly int $periodeId
    ) {}

    public function handle(): void
    {
        // Business logic di sini
        // Gunakan service jika kompleks: app(MyService::class)->process($this->periodeId)
    }

    public function failed(\Throwable $exception): void
    {
        // Handle failure: log, notify, dll.
        \Log::error('MyNewJob failed', [
            'periode_id' => $this->periodeId,
            'error' => $exception->getMessage(),
        ]);
    }
}
```

---

## Referensi Cepat

```bash
# Generate API docs (Scribe)
php artisan scribe:generate

# Clear all caches
php artisan optimize:clear

# Run migrations
php artisan migrate

# Run seeders
php artisan db:seed

# Check routes
php artisan route:list --path=api/v1

# Run tests
php artisan test

# Code style
./vendor/bin/pint
```
