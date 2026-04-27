# SIBERMAS Services Documentation

## Service Architecture

Services are located in `app/Services/KKN/` and handle business logic for each domain.

```
app/Services/KKN/
├── AbsensiService.php              - Attendance management
├── ActivityService.php             - Activity logging
├── AttendanceValidationService.php - Geofence, timestamp, speed validation (dynamic)
├── AuthenticationService.php       - Auth & JWT handling
├── CertificateService.php          - Certificate generation
├── DplAssignmentService.php        - DPL role assignment
├── DplScoreCalibrationService.php  - Z-score outlier detection for DPL grading
├── EligibilityService.php          - Student eligibility checks (dynamic)
├── EvaluationService.php           - Evaluation processing
├── ExportService.php               - Data export
├── KelompokService.php             - KKN group management
├── KknRequirementService.php       - Dynamic requirement description & validation
├── LaporanService.php              - Report handling
├── MigrationService.php            - Data migration
├── NotificationService.php         - Push notifications
├── ParticipantService.php          - KKN participant management
├── PengumumanService.php           - Announcement management
├── PeriodeGovernanceService.php    - Periode governance & mode helpers
├── PlacementService.php            - Automatic & self-determined placement
├── RegistrationDocumentService.php - Dynamic document requirements (dual-read)
├── RegistrationService.php         - Student registration
├── RequirementBuilderService.php   - Admin config validation & whitelist
└── NilaiService.php                - Score calculation
```

---

## 1. AbsensiService

**Location**: `app/Services/KKN/AbsensiService.php`

### Methods

```php
// Check in to KKN location
public function checkIn(int $userId, array $data): Attendance

// Check out from KKN location  
public function checkOut(int $userId, int $attendanceId): Attendance

// Get today's attendance for user
public function getTodayAttendance(int $userId): ?Attendance

// Get attendance history for user
public function getUserAttendanceHistory(int $userId, array $filters): Collection

// Get rekap attendance for kelompok
public function getRekapAttendance(int $kelompokId): array

// Validate check-in location (GPS)
public function validateLocation(float $lat, float $lng, int $kelompokId): bool

// Calculate attendance percentage
public function calculateAttendancePercentage(int $userId, int $periodeId): float
```

### Dependencies
- Attendance Model
- AttendancePhoto Model
- PesertaKkn Model

---

## 2. ActivityService

**Location**: `app/Services/KKN/ActivityService.php`

### Methods

```php
// Log new activity
public function logActivity(int $userId, array $data): KegiatanKkn

// Get activities by mahasiswa
public function getActivitiesByMahasiswa(int $mahasiswaId, array $filters): Collection

// Get activities by kelompok
public function getActivitiesByKelompok(int $kelompokId): Collection

// Update activity
public function updateActivity(int $activityId, array $data): KegiatanKkn

// Delete activity
public function deleteActivity(int $activityId): bool

// Get weekly activity summary
public function getWeeklySummary(int $kelompokId): array
```

### Dependencies
- KegiatanKkn Model
- PesertaKkn Model
- KelompokKkn Model

---

## 3. AuthenticationService

**Location**: `app/Services/KKN/AuthenticationService.php`

### Methods

```php
// Login user
public function login(string $email, string $password): array

// Register new student
public function register(array $data): User

// Logout user
public function logout(int $userId): bool

// Refresh access token
public function refreshToken(string $refreshToken): array

// Get current user
public function getCurrentUser(int $userId): User

// Validate token
public function validateToken(string $token): ?User

// Send password reset link
public function sendPasswordReset(string $email): bool

// Reset password
public function resetPassword(string $token, string $password): bool
```

### Dependencies
- User Model
- JwtHelper / TokenService

---

## 4. CertificateService

**Location**: `app/Services/KKN/CertificateService.php`

### Methods

```php
// Generate certificate for participant
public function generateCertificate(int $pesertaId): SertifikatKkn

// Generate PDF certificate
public function generatePdf(int $sertifikatId): string

// Generate Word certificate
public function generateWord(int $sertifikatId): string

// Preview certificate
public function preview(int $sertifikatId): array

// Verify certificate by token
public function verify(string $token): ?SertifikatKkn

// Bulk generate certificates
public function bulkGenerate(array $pesertaIds): Collection

// Get certificate template
public function getTemplate(): string
```

### Dependencies
- SertifikatKkn Model
- NilaiKkn Model
- DomPDF / PhpWord

---

## 5. DplAssignmentService

**Location**: `app/Services/KKN/DplAssignmentService.php`

### Methods

```php
// Assign DPL to kelompok
public function assignDplToKelompok(int $dosenId, int $kelompokId): DplPeriode

// Get DPL's assigned kelompok
public function getDplKelompok(int $dosenId, int $periodeId): Collection

// Remove DPL from kelompok
public function removeDplFromKelompok(int $dplPeriodeId): bool

// Get all DPL by periode
public function getDplByPeriode(int $periodeId): Collection

// Check DPL availability
public function isDplAvailable(int $dosenId, int $periodeId): bool
```

### Dependencies
- Dosen Model
- KelompokKkn Model
- DplPeriode Model

---

## 6. EvaluationService

**Location**: `app/Services/KKN/EvaluationService.php`

### Methods

```php
// Submit evaluasi for peserta
public function submitEvaluasi(int $dplId, int $pesertaId, array $data): Evaluasi

// Get evaluasi by peserta
public function getEvaluasiByPeserta(int $pesertaId): Collection

// Get evaluasi by kelompok
public function getEvaluasiByKelompok(int $kelompokId): Collection

// Update evaluasi
public function updateEvaluasi(int $evaluasiId, array $data): Evaluasi

// Calculate evaluasi score
public function calculateScore(int $pesertaId): float
```

### Dependencies
- Evaluasi Model
- ItemEvaluasi Model
- PesertaKkn Model

---

## 7. ExportService

**Location**: `app/Services/KKN/ExportService.php`

### Methods

```php
// Export peserta to Excel
public function exportPesertaExcel(array $filters): string

// Export absensi to Excel
public function exportAbsensiExcel(int $kelompokId): string

// Export nilai to Excel
public function exportNilaiExcel(int $periodeId): string

// Export laporan to PDF
public function exportLaporanPdf(int $pesertaId): string

// Export kelompok summary
public function exportKelompokSummary(int $kelompokId): string

// Generate rekap attendance
public function generateRekapAbsensi(int $periodeId): array
```

### Dependencies
- PhpSpreadsheet
- DomPDF

---

## 8. KelompokService

**Location**: `app/Services/KKN/KelompokService.php`

### Methods

```php
// Create new kelompok
public function createKelompok(array $data): KelompokKkn

// Update kelompok
public function updateKelompok(int $kelompokId, array $data): KelompokKkn

// Delete kelompok
public function deleteKelompok(int $kelompokId): bool

// Add member to kelompok
public function addMember(int $kelompokId, int $mahasiswaId): PesertaKkn

// Remove member from kelompok
public function removeMember(int $pesertaId): bool

// Get kelompok detail
public function getKelompokDetail(int $kelompokId): KelompokKkn

// Get kelompok by DPL
public function getKelompokByDpl(int $dosenId, int $periodeId): Collection

// Get kelompok by mahasiswa
public function getKelompokByMahasiswa(int $mahasiswaId): ?KelompokKkn

// Get all kelompok in periode
public function getKelompokByPeriode(int $periodeId): Collection

// Calculate kelompok statistics
public function getKelompokStats(int $kelompokId): array
```

### Dependencies
- KelompokKkn Model
- PesertaKkn Model
- Dosen Model
- Lokasi Model

---

## 9. LaporanService

**Location**: `app/Services/KKN/LaporanService.php`

### Methods

```php
// Submit laporan akhir
public function submitLaporan(int $pesertaId, array $data): LaporanAkhir

// Update laporan
public function updateLaporan(int $laporanId, array $data): LaporanAkhir

// Get laporan by peserta
public function getLaporanByPeserta(int $pesertaId): ?LaporanAkhir

// Get laporan by kelompok
public function getLaporanByKelompok(int $kelompokId): Collection

// Approve laporan
public function approveLaporan(int $laporanId, int $dplId): LaporanAkhir

// Reject laporan
public function rejectLaporan(int $laporanId, int $dplId, string $reason): LaporanAkhir

// Check laporan completeness
public function checkKelengkapan(int $pesertaId): array
```

### Dependencies
- LaporanAkhir Model
- PesertaKkn Model

---

## 10. NotificationService

**Location**: `app/Services/KKN/NotificationService.php`

### Methods

```php
// Send notification to user
public function sendToUser(int $userId, string $title, string $message, array $data = []): Notification

// Send notification to kelompok
public function sendToKelompok(int $kelompokId, string $title, string $message): int

// Send broadcast notification
public function broadcast(string $title, string $message, array $filters = []): int

// Get user notifications
public function getUserNotifications(int $userId, array $filters): Collection

// Mark notification as read
public function markAsRead(int $notificationId): bool

// Mark all as read
public function markAllAsRead(int $userId): bool

// Delete notification
public function deleteNotification(int $notificationId): bool
```

### Dependencies
- Notification Model
- Firebase Cloud Messaging (FCM)

---

## 11. ParticipantService

**Location**: `app/Services/KKN/ParticipantService.php`

### Methods

```php
// Register mahasiswa to KKN
public function register(int $mahasiswaId, array $data): PesertaKkn

// Update participant data
public function updateParticipant(int $pesertaId, array $data): PesertaKkn

// Remove participant
public function removeParticipant(int $pesertaId): bool

// Get participant detail
public function getParticipantDetail(int $pesertaId): PesertaKkn

// Get participant by user
public function getParticipantByUser(int $userId): ?PesertaKkn

// Get participants by kelompok
public function getParticipantsByKelompok(int $kelompokId): Collection

// Get participants by periode
public function getParticipantsByPeriode(int $periodeId): Collection

// Verify participant
public function verifyParticipant(int $pesertaId): PesertaKkn

// Reject participant
public function rejectParticipant(int $pesertaId, string $reason): PesertaKkn

// Calculate participant statistics
public function getParticipantStats(int $periodeId): array
```

### Dependencies
- PesertaKkn Model
- Mahasiswa Model
- KelompokKkn Model

---

## 12. PengumumanService

**Location**: `app/Services/KKN/PengumumanService.php`

### Methods

```php
// Create pengumuman
public function create(array $data): Pengumuman

// Update pengumuman
public function update(int $pengumumanId, array $data): Pengumuman

// Delete pengumuman
public function delete(int $pengumumanId): bool

// Get active pengumumans
public function getActive(int $limit = 10): Collection

// Get pengumuman by ID
public function getById(int $pengumumanId): ?Pengumuman

// Publish pengumuman
public function publish(int $pengumumanId): Pengumuman

// Archive pengumuman
public function archive(int $pengumumanId): Pengumuman
```

### Dependencies
- Pengumuman Model

---

## 13. RegistrationService

**Location**: `app/Services/KKN/RegistrationService.php`

### Methods

```php
// Process new registration
public function register(array $data): array

// Validate registration data
public function validate(array $data): array

// Check registration eligibility
public function checkEligibility(int $mahasiswaId): array

// Get registration status
public function getStatus(int $mahasiswaId): ?array

// Cancel registration
public function cancel(int $registrationId): bool

// Verify registration
public function verify(int $registrationId): PesertaKkn

// Reject registration
public function reject(int $registrationId, string $reason): bool

// Get registrations by periode
public function getRegistrationsByPeriode(int $periodeId): Collection

// Get pending registrations
public function getPendingRegistrations(): Collection
```

### Dependencies
- PesertaKkn Model
- AntrianKkn Model
- Mahasiswa Model
- Periode Model

---

## 14. NilaiService

**Location**: `app/Services/KKN/NilaiService.php`

### Methods

```php
// Calculate final nilai
public function calculateNilai(int $pesertaId): NilaiKkn

// Get nilai by peserta
public function getNilaiByPeserta(int $pesertaId): ?NilaiKkn

// Get nilai by kelompok
public function getNilaiByKelompok(int $kelompokId): Collection

// Get nilai by periode
public function getNilaiByPeriode(int $periodeId): Collection

// Update nilai
public function updateNilai(int $nilaiId, array $data): NilaiKkn

// Finalize nilai
public function finalize(int $nilaiId): NilaiKkn

// Calculate grade from score
public function calculateGrade(float $score): string

// Get score breakdown
public function getScoreBreakdown(int $pesertaId): array

// Recalculate all nilai for periode
public function recalculateAll(int $periodeId): int
```

### Dependencies
- NilaiKkn Model
- SertifikatKkn Model
- PesertaKkn Model

---

## Service Dependency Diagram

```
                    ┌─────────────────────────────────────────┐
                    │         CONTROLLERS                     │
                    └──────────────────┬──────────────────────┘
                                       │
                    ┌──────────────────▼──────────────────────┐
                    │         SERVICE LAYER                   │
                    │                                         │
    ┌───────────────┼───────────────────────────────────────┤
    │               │                                       │
    ▼               ▼                                       ▼
┌─────────┐   ┌───────────┐   ┌──────────────────┐
│Auth     │   │Registration│   │Participant       │
│Service  │   │Service    │   │Service           │
└────┬────┘   └─────┬─────┘   └────────┬─────────┘
     │              │                    │
     └──────────────┴────────────────────┘
                    │
     ┌──────────────▼──────────────┐
     │      KelompokService       │
     └──────────────┬──────────────┘
                    │
     ┌──────────────┼──────────────┐
     │              │              │
     ▼              ▼              ▼
┌─────────┐  ┌───────────┐  ┌──────────┐
│Absensi  │  │Activity   │  │Nilai      │
│Service  │  │Service    │  │Service   │
└────┬────┘  └─────┬─────┘  └────┬─────┘
     │             │             │
     └─────────────┴─────────────┘
                   │
        ┌──────────▼──────────┐
        │  CertificateService │
        └─────────────────────┘
```

---

## Usage in Controllers

```php
// Example: Using services in controller
class AbsensiController extends Controller
{
    protected AbsensiService $absensiService;
    
    public function __construct(AbsensiService $absensiService)
    {
        $this->absensiService = $absensiService;
    }
    
    public function checkIn(CheckInRequest $request)
    {
        $attendance = $this->absensiService->checkIn(
            auth()->id(),
            $request->validated()
        );
        
        return response()->success($attendance);
    }
}
```
