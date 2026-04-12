# 📚 Services Documentation

**KKN UIN SAIZU - Business Logic Layer**

Dokumentasi lengkap untuk semua Service classes yang mengelola business logic aplikasi.

---

## 📋 Daftar Isi

1. [Overview Arsitektur](#overview-arsitektur)
2. [Core Services](#core-services)
3. [KKN Domain Services](#kkn-domain-services)
4. [Integration Services](#integration-services)
5. [Utility Services](#utility-services)
6. [Service Dependencies](#service-dependencies)
7. [Best Practices](#best-practices)

---

## Overview Arsitektur

### Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                  Controllers Layer                       │
│            (HTTP Request Handling)                       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Services Layer                         │
│            (Business Logic Core)                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │  • Transaction Management                        │   │
│  │  • Business Validation                           │   │
│  │  • Cross-Model Operations                        │   │
│  │  • External API Integration                      │   │
│  └──────────────────────────────────────────────────┘   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                  Repository Layer                        │
│            (Data Access Abstraction)                     │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│                   Models Layer                           │
│            (Eloquent ORM)                                │
└─────────────────────────────────────────────────────────┘
```

### Service Conventions

- **Location:** `app/Services/` dan `app/Services/KKN/`
- **Naming:** `{Domain}Service.php`
- **Visibility:** Public methods untuk API, private untuk internal logic
- **Transaction:** Gunakan `DB::transaction()` untuk operasi multi-model
- **Logging:** Gunakan `AuditService` untuk audit trail
- **Error Handling:** Throw exceptions dengan pesan yang jelas

---

## Core Services

### 1. GradingService

**File:** `app/Services/GradingService.php`

**Tanggung Jawab:**
- Mengelola perhitungan dan finalisasi nilai KKN
- Submit nilai dari DPL dan Desa/Mitra
- Calculate weighted scores sesuai konfigurasi
- Finalisasi massal nilai

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `submitDPLScores()` | userId, groupId, scores[], dplId | NilaiKkn | Submit nilai DPL (relevansi, ketercapaian, inovasi, administrasi, artikel) |
| `submitVillageHeadScores()` | userId, groupId, scores[], villageHeadId | NilaiKkn | Submit nilai Desa (interaksi, disiplin, kinerja) |
| `calculateFinalGrade()` | NilaiKkn $score | void | Hitung skor akhir dengan weighting |
| `determineLetterGrade()` | float $totalScore | string | Konversi ke grade huruf (A-E) |
| `finalizeAll()` | int $periodId | int | Finalisasi massal semua nilai |
| `dispatchMassFinalization()` | int $periodId | void | Dispatch background job |

**Business Rules:**
```php
// Weighting KKN 56
DPL (40%): relevansi(20%), ketercapaian(20%), inovasi(20%), administrasi(20%), artikel(20%)
Desa (20%): interaksi(30%), disiplin(40%), kinerja(30%)
LPPM (40%): workshop(50%), administrasi(50%)
```

**Dependencies:**
- `NilaiKkn` Model
- `GradeConversionService`
- `EligibilityService`
- `AuditService`

---

### 2. RegistrationService

**File:** `app/Services/RegistrationService.php`

**Tanggung Jawab:**
- Pendaftaran KKN dengan distributed locking
- Validasi eligibility mahasiswa
- Assignment ke kelompok
- Handle race conditions

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `register()` | Mahasiswa, periodeId, kelompokId, notes, userId | PesertaKkn | Proses pendaftaran dengan locking |
| `leaveGroup()` | Mahasiswa, periodeId | PesertaKkn | Leave kelompok |
| `registrationSummaryForPeriod()` | PesertaKkn, AntrianKkn | array | Summary pendaftaran |

**Distributed Locking Strategy:**
```php
// Lock keys
- student: "registration:student:{mahasiswaId}:period:{periodeId}"
- group: "registration:group:{periodeId}:{kelompokId}"

// TTL: 8 detik (configurable)
// Wait: 6 detik (configurable)
```

**Validation Flow:**
1. ✅ Cek kepemilikan (userId match)
2. ✅ Cek periode aktif
3. ✅ Cek LULUS KKN sebelumnya (global filter)
4. ✅ Cek requirements akademik (dynamic filter)
5. ✅ Cek dokumen (Sehat & Izin Orang Tua)
6. ✅ Cek fakultas (jika dibatasi)
7. ✅ Cek pendaftaran aktif di periode lain

**Dependencies:**
- `RegistrationRepositoryInterface`
- `GroupSelectionService`
- `RegistrationPortalService`
- `PesertaKkn`, `KelompokKkn`, `Periode`, `Mahasiswa`

---

### 3. EligibilityService

**File:** `app/Services/EligibilityService.php`

**Tanggung Jawab:**
- Validasi eligibility mahasiswa untuk KKN
- Evaluasi requirements akademik
- Cek SKS dan GPA

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `checkEligibility()` | Mahasiswa, periodeId | array | Cek eligibility lengkap |
| `evaluateRequirements()` | Mahasiswa | array | Evaluasi semua requirements |

**Requirements:**
- SKS minimum (biasanya 100 SKS)
- GPA minimum (biasanya 2.00)
- Tidak sedang cuti
- Belum lulus KKN sebelumnya

---

### 4. GroupSelectionService

**File:** `app/Services/GroupSelectionService.php`

**Tanggung Jawab:**
- Manajemen antrian pemilihan kelompok
- Assignment mahasiswa ke kelompok
- Handle penalty dan batasan pindah

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `ensureQueue()` | Mahasiswa, periodeId | AntrianKkn | Pastikan antrian ada |
| `assignGroup()` | PesertaKkn, Mahasiswa, kelompokId | PesertaKkn | Assign ke kelompok |
| `leaveGroup()` | PesertaKkn, Mahasiswa | PesertaKkn | Leave kelompok |
| `maxGroupMoves()` | void | int | Max pindah kelompok |

**Business Rules:**
- Max pindah kelompok: 3 kali
- Penalty system untuk pindah
- First-come-first-served

---

### 5. AutomaticGroupPlacementService

**File:** `app/Services/AutomaticGroupPlacementService.php`

**Tanggung Jawab:**
- Auto-placement mahasiswa ke kelompok
- Algoritma berdasarkan fakultas dan preferensi
- Handle sisa mahasiswa yang belum terpilih

**Algoritma:**
1. Group by fakultas
2. Match dengan kapasitas kelompok
3. Prioritaskan early registration
4. Auto-fill empty slots

---

### 6. DplAssignmentService

**File:** `app/Services/DplAssignmentService.php`

**Tanggung Jawab:**
- Assignment DPL ke kelompok
- Manage beban DPL (max groups)
- Assignment berdasarkan kecamatan

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `assignDplToGroup()` | dosenId, kelompokId | DplKelompok | Assign DPL |
| `getDplWorkload()` | periodeId | array | Workload DPL |
| `assignDistrict()` | dosenId, periodeId, districtId | void | Assign kecamatan |

---

### 7. WorkshopService

**File:** `app/Services/WorkshopService.php`

**Tanggung Jawab:**
- Manajemen workshop KKN
- Attendance dengan QR code
- Certificate generation

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `createWorkshop()` | array $data | Workshop | Buat workshop |
| `registerParticipant()` | workshopId, userId | WorkshopParticipant | Register peserta |
| `checkInWithQr()` | workshopId, userId, qrCode | bool | Check-in QR |
| `generateCertificate()` | participantId | string | Generate sertifikat |

---

### 8. CertificateService

**File:** `app/Services/CertificateService.php`

**Tanggung Jawab:**
- Generate sertifikat KKN
- Template management
- Bulk generation

**Features:**
- PDF generation dengan DomPDF
- Dynamic template
- QR code verification
- Bulk export

---

### 9. YudisiumService

**File:** `app/Services/YudisiumService.php`

**Tanggung Jawab:**
- Proses yudisium KKN
- Verifikasi kelulusan
- Generate transcript

---

### 10. AuditService

**File:** `app/Services/AuditService.php`

**Tanggung Jawab:**
- Audit logging untuk semua operasi kritis
- Track user activities
- Compliance & security

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `log()` | event, description, subject, causer, properties | AuditLog | Log audit trail |
| `getLogsForSubject()` | Model $subject | Collection | Audit logs untuk subject |
| `getLogsForUser()` | int $userId | Collection | Audit logs user |

**Usage:**
```php
AuditService::log(
    'UPDATE_SCORE',
    'Admin mengupdate nilai mahasiswa',
    $score,
    $user,
    ['old_score' => 80, 'new_score' => 85]
);
```

---

## KKN Domain Services

### 11. DailyReportCompilationService

**File:** `app/Services/DailyReportCompilationService.php`

**Tanggung Jawab:**
- Kompilasi laporan harian
- Validasi aktivitas
- Generate rekapitulasi

---

### 12. LogbookService

**File:** `app/Services/LogbookService.php`

**Tanggung Jawab:**
- Manajemen logbook KKN
- Export ke PDF
- Template management

---

### 13. ReportManagementService

**File:** `app/Services/ReportManagementService.php`

**Tanggung Jawab:**
- Manajemen laporan akhir
- Review workflow
- Version control

---

### 14. GradeExportService

**File:** `app/Services/GradeExportService.php`

**Tanggung Jawab:**
- Export nilai ke Excel/PDF
- Format transkrip
- Bulk export

**Formats:**
- Excel (Maatwebsite)
- PDF (DomPDF)
- CSV

---

### 15. GradeSuggestionService

**File:** `app/Services/GradeSuggestionService.php`

**Tanggung Jawab:**
- Suggestion grading berdasarkan aktivitas
- Analisis pattern
- Recommendation engine

---

### 16. IzinService

**File:** `app/Services/IzinService.php`

**Tanggung Jawab:**
- Manajemen izin meninggalkan lokasi
- Approval workflow
- Tracking

**Methods:**
- `requestIzin()` - Request izin
- `approve()` - Approve request
- `reject()` - Reject request

---

### 17. StudentSyncService

**File:** `app/Services/StudentSyncService.php`

**Tanggung Jawab:**
- Sync mahasiswa dari master API
- Incremental sync
- Conflict resolution

**Sync Strategy:**
```php
// Incremental sync dengan 'since' parameter
GET /sync/mahasiswa?since=2026-04-01T00:00:00Z

// Full sync (fallback)
GET /sync/mahasiswa
```

---

### 18. StudentTransferService

**File:** `app/Services/StudentTransferService.php`

**Tanggung Jawab:**
- Transfer mahasiswa antar prodi
- History tracking
- Credit transfer

---

### 19. DplProvisioningService

**File:** `app/Services/DplProvisioningService.php`

**Tanggung Jawab:**
- Provisioning DPL untuk periode baru
- Setup initial assignments
- Capacity planning

---

### 20. DplScopeService

**File:** `app/Services/DplScopeService.php`

**Tanggung Jawab:**
- Scope management untuk DPL
- District assignment
- Workload balancing

---

### 21. PeriodContextService

**File:** `app/Services/PeriodContextService.php`

**Tanggung Jawab:**
- Manage active period context
- Period switching
- Validation

---

### 22. QualityAuditService

**File:** `app/Services/QualityAuditService.php`

**Tanggung Jawab:**
- Quality assurance
- Audit metrics
- Compliance checking

---

### 23. DashboardStatisticsService

**File:** `app/Services/DashboardStatisticsService.php`

**Tanggung Jawab:**
- Statistics untuk dashboard
- Real-time metrics
- Cached aggregations

**Metrics:**
- Total students per status
- Grade distribution
- DPL workload
- SDG distribution
- Report counts

**Caching:**
- TTL: 5 menit
- Key: `dashboard:period:{periodId}:faculty:{facultyId}`

---

### 24. RedisCacheService

**File:** `app/Services/RedisCacheService.php`

**Tanggung Jawab:**
- Cache management dengan Redis
- Key versioning
- Invalidation patterns

---

### 25. DocumentEncryptionService

**File:** `app/Services/DocumentEncryptionService.php`

**Tanggung Jawab:**
- Enkripsi dokumen sensitif
- Secure storage
- Key rotation

---

### 26. RegistrationPortalService

**File:** `app/Services/RegistrationPortalService.php`

**Tanggung Jawab:**
- Portal pendaftaran
- Snapshot management
- Cache invalidation

---

### 27. AbcdReportingService

**File:** `app/Services/KKN/AbcdReportingService.php`

**Tanggung Jawab:**
- Reporting dengan metode ABCD
  - **A** (Assessment): Pengkajian masalah
  - **B** (Planning): Perencanaan program
  - **C** (Implementation): Pelaksanaan
  - **D** (Evaluation): Evaluasi
- Stage tracking
- Impact measurement

---

### 28. FacultyScopeService

**File:** `app/Services/KKN/FacultyScopeService.php`

**Tanggung Jawab:**
- Scope management per fakultas
- Quota management
- Faculty-specific rules

---

### 29. GradeConversionService

**File:** `app/Services/KKN/GradeConversionService.php`

**Tanggung Jawab:**
- Konversi skor ke grade
- Configuration-based
- Grade boundaries

**Grade Boundaries:**
```php
A: 85-100
B: 70-84
C: 55-69
D: 40-54
E: 0-39
```

---

### 30. NilaiAkhirService

**File:** `app/Services/KKN/NilaiAkhirService.php`

**Tanggung Jawab:**
- Kalkulasi nilai akhir
- Weighted scoring
- Component aggregation

---

### 31. KknRequirementService

**File:** `app/Services/KKN/KknRequirementService.php`

**Tanggung Jawab:**
- Requirement management
- Dynamic rules
- Validation engine

---

### 32. IntelligenceService

**File:** `app/Services/KKN/IntelligenceService.php`

**Tanggung Jawab:**
- Analytics & intelligence
- Pattern recognition
- Predictive insights

---

## Integration Services

### 33. MasterApiService

**File:** `app/Services/MasterApiService.php`

**Tanggung Jawab:**
- Integrasi dengan Master API (SIKAD)
- JWT authentication
- Sync dosen, mahasiswa, faculties

**Configuration:**
```php
// Config: services.master_api
url: https://sikad.uinsaizu.ac.id/api
client_id: kkn_system
client_secret: ***
token: *** (static fallback)
cache_minutes: 60
```

**Methods Utama:**

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `getToken()` | void | string|null | Get JWT token |
| `get()` | endpoint, params | array | Authenticated GET |
| `getSyncDosen()` | since | array | Sync dosen |
| `getSyncMahasiswa()` | since | array | Sync mahasiswa |
| `getAllEmployees()` | void | array | All lecturers |
| `getAllStudents()` | void | array | All students |
| `getEmployeesByNipList()` | nipList | array | Filter by NIP |
| `getStudentsByNimList()` | nimList | array | Filter by NIM |
| `getAllOrganizations()` | void | array | Faculties/Prodi |
| `healthCheck()` | void | array | Health status |

**Error Handling:**
- Retry logic untuk transient errors
- Fallback ke cached data
- Logging ke error channel

**Rate Limiting:**
- Cache token: 55 menit (refresh sebelum expire)
- Request timeout: 30 detik
- SSL verify: disabled di local

---

## Utility Services

### 34. AutomaticGroupPlacementService (KKN)

**File:** `app/Services/KKN/AutomaticGroupPlacementService.php`

---

### 35. DocumentEncryptionService

**File:** `app/Services/DocumentEncryptionService.php`

**Tanggung Jawab:**
- Enkripsi dokumen sensitif
- Algorithm: AES-256
- Key rotation

---

## Service Dependencies

### Dependency Graph

```
GradingService
├── GradeConversionService
├── EligibilityService
└── AuditService

RegistrationService
├── RegistrationRepositoryInterface
├── GroupSelectionService
└── RegistrationPortalService

MasterApiService
└── SystemSetting (for config)

DashboardStatisticsService
└── Cache (Redis)
```

### Service Providers

Services diregister di `AppServiceProvider` atau dedicated provider:

```php
// AppServiceProvider.php
public function register(): void
{
    $this->app->singleton(GradingService::class);
    $this->app->singleton(RegistrationService::class);
    $this->app->singleton(MasterApiService::class);
}
```

---

## Best Practices

### 1. Transaction Management

Selalu gunakan transaction untuk operasi multi-model:

```php
public function updateScores(array $data): NilaiKkn
{
    return DB::transaction(function () use ($data) {
        $score = NilaiKkn::updateOrCreate(...);
        $this->calculateFinalGrade($score);
        return $score->fresh();
    });
}
```

### 2. Error Handling

Throw exceptions dengan pesan yang jelas:

```php
if (!$mahasiswa) {
    throw ValidationException::withMessages([
        'mahasiswa_id' => 'Mahasiswa tidak ditemukan.',
    ]);
}
```

### 3. Logging

Gunakan AuditService untuk operasi kritis:

```php
AuditService::log(
    'UPDATE_SCORE',
    'Admin mengupdate nilai',
    $score,
    $user,
    ['old' => 80, 'new' => 85]
);
```

### 4. Caching

Implement caching untuk expensive operations:

```php
public function getStatistics(int $periodId): array
{
    return Cache::remember(
        "stats:{$periodId}",
        300,
        fn() => $this->calculateStatistics($periodId)
    );
}
```

### 5. Repository Pattern

Gunakan repository untuk data access:

```php
public function __construct(
    private readonly RegistrationRepositoryInterface $repo
) {}
```

### 6. Single Responsibility

Setiap service punya satu tanggung jawab utama:

```php
// ❌ BAD: Too many responsibilities
class GodService {
    public function registerStudent() {}
    public function calculateGrade() {}
    public function sendEmail() {}
}

// ✅ GOOD: Separated concerns
class RegistrationService {
    public function register() {}
}

class GradingService {
    public function calculateGrade() {}
}

class NotificationService {
    public function sendEmail() {}
}
```

### 7. Dependency Injection

Inject dependencies, jangan instantiate manual:

```php
// ❌ BAD
public function process()
{
    $service = new MasterApiService();
}

// ✅ GOOD
public function __construct(
    private readonly MasterApiService $api
) {}

public function process()
{
    $this->api->get('/endpoint');
}
```

---

## Testing Services

### Unit Test Example

```php
it('calculates final grade correctly', function () {
    $score = NilaiKkn::factory()->create([
        'dpl_relevansi_score' => 80,
        'dpl_ketercapaian_score' => 85,
        // ...
    ]);

    $service = app(GradingService::class);
    $service->calculateFinalGrade($score);

    expect($score->fresh()->total_score)->toBeFloat();
});
```

### Feature Test Example

```php
it('allows student to register for KKN', function () {
    $student = Mahasiswa::factory()->create();
    $period = Periode::factory()->active()->create();

    $response = $this->actingAs($student->user)
        ->post('/kkn/register', [
            'period_id' => $period->id,
        ]);

    $response->assertRedirect();
    $this->assertDatabaseHas('peserta_kkn', [
        'mahasiswa_id' => $student->id,
        'status' => 'pending',
    ]);
});
```

---

## Performance Considerations

### 1. N+1 Query Prevention

```php
// ❌ BAD: N+1 queries
$scores = NilaiKkn::all();
foreach ($scores as $score) {
    echo $score->mahasiswa->name;
}

// ✅ GOOD: Eager loading
$scores = NilaiKkn::with('mahasiswa')->get();
```

### 2. Chunking untuk Large Datasets

```php
NilaiKkn::query()
    ->where('period_id', $periodId)
    ->chunkById(100, function ($scores) {
        foreach ($scores as $score) {
            $this->process($score);
        }
    });
```

### 3. Cache Invalidation

```php
public function update($id, $data)
{
    $record = Model::findOrFail($id);
    $record->update($data);
    
    // Invalidate cache
    Cache::tags(['model:'.$id])->flush();
}
```

---

## Security Considerations

### 1. Authorization

```php
public function approveIzin(int $izinId)
{
    $izin = Izin::findOrFail($izinId);
    
    // Check authorization
    if (auth()->id() !== $izin->mahasiswa->user_id) {
        throw new AuthorizationException();
    }
}
```

### 2. Input Validation

```php
public function register($data)
{
    $validated = Validator::make($data, [
        'nim' => 'required|exists:mahasiswa,nim',
        'period_id' => 'required|exists:periode,id',
    ])->validate();
}
```

### 3. Audit Trail

```php
public function delete($id)
{
    $record = Model::findOrFail($id);
    
    AuditService::log(
        'DELETE_RECORD',
        'Menghapus data',
        $record,
        auth()->user()
    );
    
    $record->delete();
}
```

---

**Dokumentasi ini dibuat untuk memudahkan maintenance dan onboarding developer baru.**

**Last Updated:** 2026-04-10
