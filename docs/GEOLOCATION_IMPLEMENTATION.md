# 📍 Geolocation & Attendance Implementation Guide

**Tanggal:** April 20, 2026  
**Status:** ✅ Implementasi Lengkap (Tanpa PWA)  
**Arsitektur:** Web App Only → Native App Migration Later

---

## 📋 Overview

Sistem geolocation untuk KKN diimplementasikan dengan fokus **web app modern tanpa PWA**, mendukung:

- ✅ GPS capture dengan multi-layer validation
- ✅ Photo evidence dengan watermark & EXIF extraction
- ✅ Offline storage via IndexedDB
- ✅ Automatic & manual sync mechanism
- ✅ Fraud detection & anomaly flagging
- ✅ Dispensasi lokasi workflow
- ✅ DPL verification dashboard
- ✅ Easy migration to native app later

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React)                      │
├─────────────────────────────────────────────────────────┤
│  GeolocationCapture Component                           │
│  ├─ GPS capture (navigator.geolocation)                │
│  ├─ Photo capture (getUserMedia + Canvas)              │
│  └─ Watermark with NIM + Timestamp                     │
│                                                          │
│  IndexedDB Service                                       │
│  ├─ gps_capture store                                   │
│  ├─ photo_capture store                                 │
│  └─ pending_attendance store (offline)                  │
│                                                          │
│  AttendanceSyncService                                   │
│  ├─ Auto-sync on online event                          │
│  ├─ Manual sync button                                  │
│  └─ Exponential backoff retry logic                    │
│                                                          │
│  AttendanceSyncMonitor Component                        │
│  └─ Display pending records & sync status              │
└─────────────────────────────────────────────────────────┘
           ↓ HTTP/REST API ↓
┌─────────────────────────────────────────────────────────┐
│                    Backend (Laravel)                     │
├─────────────────────────────────────────────────────────┤
│  API Routes (/api/attendance/*)                         │
│  ├─ POST /  (create attendance)                         │
│  ├─ GET /   (list attendance)                           │
│  ├─ GET /{id} (show single)                            │
│  ├─ GET /sync-status (check pending)                   │
│  └─ POST /retry-sync (manual trigger)                  │
│                                                          │
│  AttendanceController                                    │
│  ├─ store() - create with validation                    │
│  ├─ index() - list with filters                         │
│  ├─ show() - detail view                               │
│  └─ Photo handling (base64 → compress → save)           │
│                                                          │
│  AttendanceValidationService                             │
│  ├─ Geofence validation                                │
│  ├─ Timestamp validation                               │
│  ├─ Duplicate detection                                │
│  └─ Dispensation checking                              │
│                                                          │
│  FraudDetectionService                                  │
│  ├─ Velocity anomaly (impossible travel)               │
│  ├─ GPS spoofing patterns                              │
│  ├─ Device fingerprinting                              │
│  └─ Behavioral analysis                                │
└─────────────────────────────────────────────────────────┘
           ↓ Database Layer ↓
┌─────────────────────────────────────────────────────────┐
│                   PostgreSQL Tables                      │
├─────────────────────────────────────────────────────────┤
│  attendances                  (core attendance records) │
│  attendance_photos            (photo evidence)          │
│  location_dispensations       (dispensasi workflow)     │
│  attendance_sync_logs         (offline sync tracking)   │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Database Schema

### 1. `attendances` Table
```sql
- id (PK)
- user_id (FK → users)
- peserta_kkn_id (FK)
- kelompok_id (FK)
- periode_id (FK)

-- GPS Data
- latitude, longitude (decimal)
- accuracy_meters, altitude_meters
- heading_degrees, speed_mps

-- Timestamps (Multi-layer)
- timestamp_client (when user captured)
- timestamp_server (when server received)
- timestamp_gps (GPS device time)

-- Status & Validation
- activity_type (absen_masuk/keluar/logbook/workshop/meeting)
- status (pending_verification/verified/rejected/flagged_anomaly/dispensation_approved)
- is_within_geofence (boolean)
- distance_from_posko (meters)
- validation_flags (JSON array of issues)

-- Device & Network
- device_signature (fingerprint)
- ip_address, user_agent

-- Audit
- verified_by_user_id (FK)
- verified_at, verification_notes
```

### 2. `attendance_photos` Table
```sql
- id (PK)
- attendance_id (FK)
- path, filename (storage location)
- file_size_bytes, mime_type

-- EXIF Data
- exif_data (JSON)
- exif_latitude, exif_longitude, exif_timestamp

-- Processing
- photo_type (selfie/location_proof/etc)
- watermark_text
- facial_features (JSON if face detected)
- qr_data (if QR scanned)

-- Verification
- status (pending_review/verified/rejected/requires_manual_review)
- rejection_reason, reviewed_by_user_id, reviewed_at
```

### 3. `location_dispensations` Table
```sql
- id (PK)
- attendance_id (FK, nullable)
- user_id, peserta_kkn_id, kelompok_id, periode_id (FKs)

-- Request Details
- type (accuracy_poor/signal_lost/sick/emergency/etc)
- reason_description, evidence_file_path

-- Approval Flow
- status (pending_dpl_review/pending_lppm_review/approved/rejected)
- dpl_user_id, dpl_reviewed_at, dpl_decision
- lppm_user_id, lppm_reviewed_at, lppm_decision
- dpl_notes

-- Effective Period
- dispensation_date (which date applies)
- valid_from, valid_until (if temporary)

-- Alternative Verification
- alternative_verification (manual_qr/photo_witness/dpl_visit/none)
- verification_method_notes
```

### 4. `attendance_sync_logs` Table
```sql
- id (PK)
- user_id, attendance_id (FKs)

-- Sync Details
- action (create/update/delete)
- status (pending/success/failed/retry_pending/manual_intervention_needed)
- sync_method (manual_button/auto_online_event/scheduled_retry/api_call)
- was_offline_at_creation (boolean)

-- Attempt Tracking
- attempt_number, first_attempt_at, last_attempt_at
- total_retry_seconds, last_http_status_code
- last_error_message, last_error_details (JSON)

-- Retry Strategy
- retry_strategy (immediate/exponential_backoff/fixed_interval/manual)
- next_retry_scheduled_at

-- Client Environment
- browser_name, browser_version, os_name, is_mobile
- request_payload, response_payload (JSON)
```

---

## 🔧 Installation & Setup

### 1. Run Migrations
```bash
php artisan migrate

# Or specific migration
php artisan migrate --path=database/migrations/2026_04_20_120000_create_attendances_table.php
```

### 2. Clear Config Cache (if exists)
```bash
php artisan config:clear
php artisan cache:clear
```

### 3. Install Frontend Dependencies (if needed)
```bash
npm install axios
# IndexedDB is built-in, no package needed
```

### 4. Verify Backend
```bash
# Test API endpoint
curl -X GET http://localhost:8000/api/attendance \
  -H "Authorization: Bearer {your_token}"
```

---

## 🎯 Frontend Integration

### Step 1: Add Routes to Student Dashboard
Edit `resources/js/Pages/Student/Dashboard.tsx`:

```tsx
import GeolocationCapture from '@/Components/Geolocation/GeolocationCapture';
import AttendanceSyncMonitor from '@/Components/Geolocation/AttendanceSyncMonitor';

export default function DashboardPage() {
    return (
        <AppLayout title="Dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* ... existing content ... */}

                {/* Geolocation Section */}
                <div className="lg:col-span-2">
                    <GeolocationCapture
                        onSuccess={() => {
                            // Refresh data
                            console.log('Attendance submitted');
                        }}
                    />
                </div>

                <div>
                    <AttendanceSyncMonitor />
                </div>
            </div>
        </AppLayout>
    );
}
```

### Step 2: Initialize Sync Service
Edit `resources/js/app.tsx`:

```tsx
import { createAttendanceSyncService } from '@/Services/AttendanceSyncService';

// Initialize after auth check
if (auth.user && auth.token) {
    const syncService = createAttendanceSyncService(auth.token);
    syncService.initializeListeners();
    
    // Make available globally
    (window as any).__attendanceSyncService__ = syncService;
}
```

### Step 3: Add to HTML Layout
Edit `resources/views/app.blade.php`:

```blade
<body>
    @inertia
    
    {{-- Store auth data for frontend access --}}
    <script>
        window.__user__ = @json(auth()->user());
        window.__token__ = @json(Auth::user()?->currentAccessToken()?->token);
    </script>
</body>
```

---

## 🚀 Key Features Implementation

### ✅ Offline Storage (IndexedDB)
```tsx
import { indexedDBService } from '@/Services/IndexedDBService';

// Save GPS data
await indexedDBService.save('gps_capture', {
    latitude: 37.7749,
    longitude: -122.4194,
    accuracy: 25,
    timestamp: new Date().toISOString(),
});

// Get all pending attendance
const pending = await indexedDBService.getAll('pending_attendance');
```

### ✅ Auto-Sync on Online
```tsx
// Automatically triggered when online event detected
window.addEventListener('online', async () => {
    const { success, failed } = await syncService.syncPendingData();
    console.log(`Synced: ${success} success, ${failed} failed`);
});
```

### ✅ Manual Sync Button
```tsx
<button onClick={() => syncService.syncPendingData()}>
    🔄 Sinkronisasi Sekarang
</button>
```

### ✅ Geofence Validation
Server-side di `AttendanceValidationService`:
```php
$distance = $attendance->calculateDistanceFromPosko();
$allowedRadius = $posko->radius_meters ?? 500; // Default 500m

if ($distance > $allowedRadius) {
    $flags[] = [
        'type' => 'outside_geofence',
        'message' => "Distance: {$distance}m (allowed: {$allowedRadius}m)"
    ];
}
```

### ✅ Fraud Detection
Server-side di `FraudDetectionService`:
```php
- Velocity check (impossible travel)
- GPS spoofing patterns (repeated exact coords)
- Device fingerprinting (same device, different users)
- Behavioral patterns (unusual timing)
```

### ✅ Photo Processing
```tsx
// Capture with watermark
addWatermark(canvas2D, {
    user: auth.user.name,
    timestamp: now(),
    location: `${lat}, ${lng}`
});

// Compress before upload
const compressed = canvas.toDataURL('image/jpeg', 0.8);

// EXIF extraction happens server-side
```

### ✅ Dispensasi Workflow
```php
// Create dispensation request
LocationDispensation::create([
    'user_id' => $user->id,
    'type' => 'signal_lost',
    'reason_description' => 'Lokasi tanpa signal',
    'status' => 'pending_dpl_review'
]);

// DPL approval
$dispensation->approveByDpl($dpl, 'Disetujui');

// Use in attendance validation
$dispensation = LocationDispensation::where('user_id', $user_id)
    ->where('dispensation_date', today())
    ->active()
    ->first();

if ($dispensation) {
    $attendance->status = 'dispensation_approved';
}
```

---

## 📊 API Endpoints Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/attendance` | Create attendance |
| GET | `/api/attendance` | List user's attendance |
| GET | `/api/attendance/{id}` | Show single attendance |
| GET | `/api/attendance/sync-status` | Check pending syncs |
| POST | `/api/attendance/retry-sync` | Manual sync trigger |

### POST `/api/attendance`
```json
{
  "latitude": -7.2575,
  "longitude": 110.4268,
  "accuracy_meters": 25,
  "altitude_meters": 100,
  "heading_degrees": 45,
  "speed_mps": 0,
  "timestamp_client": "2024-04-20T08:30:00.000Z",
  "timestamp_gps": "2024-04-20T08:30:00.000Z",
  "activity_type": "absen_masuk",
  "proof_photo_base64": "data:image/jpeg;base64,...",
  "device_signature": "abc123...",
  "user_agent": "Mozilla/5.0..."
}
```

Response:
```json
{
  "success": true,
  "message": "✅ Absensi berhasil diverifikasi",
  "data": {
    "attendance_id": 123,
    "status": "verified",
    "is_within_geofence": true,
    "distance_from_posko": 45.5,
    "validation_message": "✅ Lokasi valid",
    "fraud_risk_score": 10
  }
}
```

---

## 🔐 Security Considerations

1. **Device Fingerprinting**: Detect multiple users from same device
2. **Velocity Checks**: Flag impossible travel distances
3. **Timestamp Validation**: Multi-layer timestamp consistency
4. **IP Tracking**: Log IP changes for anomaly detection
5. **Photo Validation**: EXIF comparison with GPS data
6. **Rate Limiting**: Prevent multiple submissions per hour
7. **Manual Review**: High-risk submissions flagged for DPL review

---

## 🧪 Testing Checklist

- [ ] GPS capture works (both emulator & real device)
- [ ] Photo capture with camera & upload
- [ ] Offline data saves to IndexedDB
- [ ] Auto-sync when online event fires
- [ ] Manual sync button works
- [ ] Geofence validation correct
- [ ] Fraud detection flags high-risk submissions
- [ ] Dispensasi workflow end-to-end
- [ ] DPL can verify/reject submissions
- [ ] Sync logs track attempts & retries

---

## 🚀 Migration to Native (Future)

When ready to develop mobile app:

1. **Logic Transfer**: Service layer (validation, fraud detection) = 100% reusable
2. **Storage Migration**: IndexedDB → SQLite/Realm (logic same)
3. **GPS API**: Native geolocation API (interface same)
4. **Photo**: Native camera (interface same)
5. **Sync**: Native background sync (logic same)
6. **Backend**: No changes (same REST API)

---

## 📝 Next Steps

1. **Run migrations**: `php artisan migrate`
2. **Test API** with Postman/Insomnia
3. **Integrate frontend** components into student dashboard
4. **Setup DPL dashboard** for verification
5. **User testing** with students & DPLs
6. **Monitor fraud metrics** and adjust thresholds

---

**Created:** April 20, 2026  
**Status:** Ready for Testing ✅
