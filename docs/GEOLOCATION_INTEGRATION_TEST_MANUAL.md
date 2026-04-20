# 🧪 Geolocation System - Comprehensive Integration Testing

**Status:** Production Ready (Manual Testing Required)  
**Date:** April 20, 2026  
**Version:** 1.0

---

## 📋 Pre-Testing Checklist

### Environment Setup
```bash
# 1. Run migrations
php artisan migrate

# 2. Seed database
php artisan db:seed

# 3. Start Laravel server
php artisan serve

# 4. Start frontend dev server (in new terminal)
npm run dev

# 5. Access application
# http://localhost:8000
```

---

## 🗄️ DATABASE VERIFICATION

### Test 1: Migration Verification
```bash
php artisan tinker
```

```php
// Check all tables exist
DB::table('attendances')->count()
DB::table('attendance_photos')->count()
DB::table('location_dispensations')->count()
DB::table('attendance_sync_logs')->count()

// Expected: All return 0 initially

// Check columns
Schema::getColumns('attendances')
Schema::getColumns('attendance_photos')
Schema::getColumns('location_dispensations')
Schema::getColumns('attendance_sync_logs')

// Expected: All columns present with correct types
```

### Test 2: Relationships Verification
```php
// In php artisan tinker

// Create test data
$user = User::factory()->create();
$periode = Periode::factory()->create();
$kelompok = KelompokKkn::factory()->create();
$peserta = PesertaKkn::factory()->create([
    'user_id' => $user->id,
    'periode_id' => $periode->id,
    'kelompok_id' => $kelompok->id,
]);

// Create attendance
$attendance = Attendance::create([
    'user_id' => $user->id,
    'peserta_kkn_id' => $peserta->id,
    'kelompok_id' => $kelompok->id,
    'periode_id' => $periode->id,
    'latitude' => -7.2575,
    'longitude' => 110.4268,
    'accuracy_meters' => 25,
    'timestamp_client' => now(),
    'timestamp_server' => now(),
    'activity_type' => 'absen_masuk',
    'status' => 'verified',
]);

// Verify relationships
$attendance->user; // ✓ Should return User object
$attendance->pesertaKkn; // ✓ Should return PesertaKkn object
$attendance->kelompok; // ✓ Should return KelompokKkn object
$attendance->periode; // ✓ Should return Periode object
$attendance->photos; // ✓ Should return empty collection (initially)
$attendance->syncLogs; // ✓ Should return empty collection (initially)
```

---

## 🔌 API ENDPOINT TESTING

### Test 3: Create Attendance (Basic)

**Using cURL:**
```bash
curl -X POST http://localhost:8000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SANCTUM_TOKEN" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "altitude_meters": 100,
    "heading_degrees": 45,
    "speed_mps": 0,
    "timestamp_client": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "timestamp_gps": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "activity_type": "absen_masuk",
    "device_signature": "device_abc123",
    "user_agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6)"
  }'
```

**Expected Response (Success):**
```json
{
  "success": true,
  "message": "✅ Absensi berhasil diverifikasi",
  "data": {
    "attendance_id": 1,
    "status": "verified",
    "is_within_geofence": true,
    "distance_from_posko": 45.5,
    "validation_message": "✅ Lokasi valid dan akurat (25m)",
    "fraud_risk_score": 8,
    "requires_manual_review": false,
    "sync_status": "completed"
  }
}
```

### Test 4: Create Attendance with Photo

**Steps:**
```bash
# 1. Create test image
php -r "
\$img = imagecreate(100, 100);
\$black = imagecolorallocate(\$img, 0, 0, 0);
\$white = imagecolorallocate(\$img, 255, 255, 255);
imagefilledrectangle(\$img, 0, 0, 100, 100, \$white);
imagestring(\$img, 2, 10, 10, 'TEST', \$black);
imagejpeg(\$img, 'test-image.jpg');
"

# 2. Get base64
BASE64=$(base64 -i test-image.jpg | tr -d '\n')

# 3. Send request
curl -X POST http://localhost:8000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "timestamp_client": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "activity_type": "absen_masuk",
    "proof_photo_base64": "data:image/jpeg;base64,'$BASE64'"
  }'
```

**Expected Response:**
- Photo stored to `storage/attendance_photos/`
- EXIF metadata extracted
- AttendancePhoto record created with status "pending_review"

### Test 5: List Attendance

```bash
curl -X GET "http://localhost:8000/api/attendance?page=1&per_page=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "latitude": -7.2575,
        "longitude": 110.4268,
        "activity_type": "absen_masuk",
        "status": "verified",
        "created_at": "2024-04-20T08:30:00.000Z"
      }
    ],
    "pagination": {
      "total": 1,
      "per_page": 10,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

### Test 6: Get Attendance Detail

```bash
curl -X GET "http://localhost:8000/api/attendance/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
- Complete attendance record
- Related photos array
- Related sync logs array

### Test 7: Get Sync Status

```bash
curl -X GET "http://localhost:8000/api/attendance/sync-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "sync_stats": {
    "total": 5,
    "successful": 3,
    "failed": 1,
    "pending_retry": 1,
    "needs_manual": 0
  },
  "pending_retries_count": 1,
  "pending_retries": [
    {
      "attendance_id": 2,
      "attempt_number": 2,
      "last_error": "timeout",
      "last_attempt_at": "2024-04-20T08:45:00.000Z",
      "next_retry_at": "2024-04-20T08:50:00.000Z"
    }
  ]
}
```

### Test 8: Retry Failed Sync

```bash
curl -X POST "http://localhost:8000/api/attendance/retry-sync" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 VALIDATION LOGIC TESTING

### Test 9: Geofence Validation

**Test Case A: Inside Geofence**
```bash
curl -X POST http://localhost:8000/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "timestamp_client": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "activity_type": "absen_masuk"
  }'

# Expected: "is_within_geofence": true
```

**Test Case B: Outside Geofence**
```bash
curl -X POST http://localhost:8000/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -7.0000,
    "longitude": 110.5000,
    "accuracy_meters": 25,
    "timestamp_client": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "activity_type": "absen_masuk"
  }'

# Expected: "is_within_geofence": false, status: "flagged_anomaly"
```

### Test 10: Accuracy Validation

**Poor Accuracy Detection:**
```bash
curl -X POST http://localhost:8000/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 150,
    "timestamp_client": "'$(date -u +%Y-%m-%dT%H:%M:%S.000Z)'",
    "activity_type": "absen_masuk"
  }'

# Expected: validation_flags contains accuracy_poor warning
```

### Test 11: Duplicate Detection

```bash
# First submission (success)
curl -X POST http://localhost:8000/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "timestamp_client": "2024-04-20T08:30:00.000Z",
    "activity_type": "absen_masuk"
  }'

# Second submission within 60 seconds at same location (should be flagged)
curl -X POST http://localhost:8000/api/attendance \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "timestamp_client": "2024-04-20T08:30:30.000Z",
    "activity_type": "absen_masuk"
  }'

# Expected: status: "flagged_anomaly", has duplicate_submission flag
```

---

## 🔍 FRAUD DETECTION TESTING

### Test 12: Velocity Anomaly (Impossible Travel)

**Scenario:** Create two attendances at impossible distance apart

```bash
# First attendance: Yogyakarta
php artisan tinker
>>> $att1 = Attendance::create([
    'user_id' => 1,
    'latitude' => -7.2575,
    'longitude' => 110.4268,
    'timestamp_client' => now()->subSeconds(30),
    'activity_type' => 'absen_masuk',
]);

# Second attendance: Jakarta (500km away) - 30 seconds later
>>> $att2 = Attendance::create([
    'user_id' => 1,
    'latitude' => -6.1751,
    'longitude' => 106.8650,
    'timestamp_client' => now(),
    'activity_type' => 'absen_keluar',
]);

# Check fraud detection
>>> $service = new FraudDetectionService();
>>> $result = $service->analyze($att2);
>>> $result['risk_score'] // Should be >= 60
>>> $result['risk_level'] // Should be 'high' or 'critical'
>>> $result['indicators'] // Should contain 'impossible_velocity'
```

### Test 13: Device Fingerprinting

```bash
php artisan tinker

# Create attendance from user A with device X
>>> $att1 = Attendance::create([
    'user_id' => 1,
    'device_signature' => 'device_xyz',
    'latitude' => -7.2575,
    'longitude' => 110.4268,
    'timestamp_client' => now()->subDays(5),
]);

# Create attendance from user B with same device X
>>> $att2 = Attendance::create([
    'user_id' => 2,
    'device_signature' => 'device_xyz',
    'latitude' => -6.1751,
    'longitude' => 106.8650,
    'timestamp_client' => now()->subDays(3),
]);

# Create attendance from user A with same device X again
>>> $att3 = Attendance::create([
    'user_id' => 1,
    'device_signature' => 'device_xyz',
    'latitude' => -7.2575,
    'longitude' => 110.4268,
    'timestamp_client' => now(),
]);

# Check fraud detection for $att3
>>> $service = new FraudDetectionService();
>>> $result = $service->analyze($att3);
>>> $result['risk_score'] // Should be >= 25
>>> $result['indicators'] // Should contain 'shared_device_signature'
```

### Test 14: Spoofing Detection (Repeated Exact Coordinates)

```php
php artisan tinker

// Create 5 attendances at exact same coordinates within 7 days
$coords = ['latitude' => -7.2575, 'longitude' => 110.4268];

for ($i = 0; $i < 4; $i++) {
    Attendance::create([
        'user_id' => 1,
        'latitude' => $coords['latitude'],
        'longitude' => $coords['longitude'],
        'timestamp_client' => now()->subDays($i),
        'activity_type' => 'absen_masuk',
    ]);
}

// Create 5th attendance
$latest = Attendance::create([
    'user_id' => 1,
    'latitude' => $coords['latitude'],
    'longitude' => $coords['longitude'],
    'timestamp_client' => now(),
    'activity_type' => 'absen_masuk',
]);

// Check fraud detection
$service = new FraudDetectionService();
$result = $service->analyze($latest);

// Expected:
// - $result['risk_score'] >= 15
// - $result['indicators'] contains 'repeated_exact_location'
```

---

## 🎨 FRONTEND COMPONENT TESTING

### Test 15: Browser DevTools Inspection

**Navigate to Student Dashboard:**
1. Login as student
2. Open browser DevTools (F12)
3. Go to Student Dashboard
4. Component should render

**Check in Console:**
```javascript
// Check if component mounted
document.querySelector('[data-test="geolocation-capture"]')

// Check IndexedDB
let dbRequest = indexedDB.open('KknAttendance');
dbRequest.onsuccess = () => {
    let db = dbRequest.result;
    let stores = db.objectStoreNames; // Should have 4 stores
}
```

### Test 16: GPS Capture - Browser Location Permission

**Steps:**
1. Open DevTools → Console
2. Click "📍 Ambil Lokasi Saat Ini" button
3. Browser should ask for location permission
4. Grant permission
5. Coordinates should populate

**Verify:**
```javascript
// Should show in console
navigator.geolocation.getCurrentPosition((pos) => {
    console.log('Latitude:', pos.coords.latitude);
    console.log('Longitude:', pos.coords.longitude);
    console.log('Accuracy:', pos.coords.accuracy);
});
```

### Test 17: Camera Access

**Steps:**
1. Click "📷 Buka Kamera"
2. Browser should ask for camera permission
3. Grant permission
4. Video stream should appear
5. Click "📸 Ambil Foto"
6. Photo should display with watermark

### Test 18: IndexedDB Storage Verification

**Open DevTools → Application → IndexedDB:**

1. **KknAttendance DB should exist**
2. **4 object stores:**
   - `gps_capture` - GPS readings
   - `photo_capture` - Photos
   - `pending_attendance` - Pending submissions
   - `sync_logs` - Sync history

**Verify stores have data after submission:**
```javascript
// In DevTools Console
let db;
let req = indexedDB.open('KknAttendance');

req.onsuccess = () => {
    db = req.result;
    
    // Get pending attendances
    let tx = db.transaction(['pending_attendance'], 'readonly');
    let store = tx.objectStore('pending_attendance');
    let getReq = store.getAll();
    
    getReq.onsuccess = () => {
        console.log('Pending records:', getReq.result);
    }
}
```

---

## 🌐 OFFLINE/ONLINE TESTING

### Test 19: Offline Submission

**Steps:**
1. Go to DevTools → Network
2. Set throttling to "Offline"
3. Capture GPS
4. Submit attendance
5. Should see message: "Data tersimpan secara lokal"

**Verify IndexedDB:**
```javascript
// Check pending_attendance store
let req = indexedDB.open('KknAttendance');
req.onsuccess = () => {
    let db = req.result;
    let tx = db.transaction(['pending_attendance'], 'readonly');
    let store = tx.objectStore('pending_attendance');
    let getAllReq = store.getAll();
    
    getAllReq.onsuccess = () => {
        console.log('Records in offline storage:', getAllReq.result);
        // Each record should have status: "pending"
    }
}
```

### Test 20: Auto-Sync on Online

**Steps:**
1. Submit attendance while offline (Test 19)
2. Note: "X data menunggu sinkronisasi"
3. Go to DevTools → Network → Online
4. Auto-sync should trigger automatically
5. Monitor should update to show synced

**Verify:**
```javascript
// Check sync_logs store
let req = indexedDB.open('KknAttendance');
req.onsuccess = () => {
    let db = req.result;
    let tx = db.transaction(['sync_logs'], 'readonly');
    let store = tx.objectStore('sync_logs');
    let getReq = store.getAll();
    
    getReq.onsuccess = () => {
        console.log('Sync history:', getReq.result);
        // Should show successful sync entries
    }
}
```

### Test 21: Manual Sync Button

**Steps:**
1. Submit attendance offline
2. Go online
3. Click "🔄 Sinkronisasi Sekarang"
4. Button should show "Sinkronisasi..."
5. After completion: status should update

---

## ✅ COMPREHENSIVE CHECKLIST

### Database ✓
- [ ] All 4 migrations run successfully
- [ ] All tables created
- [ ] All indexes created
- [ ] Relationships verified

### API Endpoints ✓
- [ ] POST /api/attendance - Create (status 201)
- [ ] GET /api/attendance - List (status 200)
- [ ] GET /api/attendance/{id} - Show (status 200)
- [ ] GET /api/attendance/sync-status - Sync status (status 200)
- [ ] POST /api/attendance/retry-sync - Retry (status 200)
- [ ] Error handling (invalid coordinates, unauthorized, etc.)

### Validation ✓
- [ ] Geofence validation (inside/outside)
- [ ] Accuracy validation (flags poor accuracy)
- [ ] Timestamp validation (checks consistency)
- [ ] Duplicate detection (flags duplicates)

### Fraud Detection ✓
- [ ] Velocity anomaly (impossible travel)
- [ ] Device fingerprinting (shared devices)
- [ ] Spoofing detection (repeated exact location)
- [ ] Risk scoring (0-100 scale)
- [ ] Manual review threshold (60+)

### Frontend Components ✓
- [ ] Component renders on dashboard
- [ ] GPS capture button works
- [ ] Camera access works
- [ ] Photo capture and watermark
- [ ] Activity type selection
- [ ] Submit button enable/disable
- [ ] Error message display

### Offline/Sync ✓
- [ ] IndexedDB storage works
- [ ] Offline submission (data saved locally)
- [ ] Auto-sync on online (automatic)
- [ ] Manual sync button (manual trigger)
- [ ] Sync status display (shows pending count)
- [ ] Retry logic (exponential backoff)

### Integration ✓
- [ ] End-to-end GPS capture → Photo → Submit (online)
- [ ] End-to-end GPS capture → Submit → Sync (offline)
- [ ] Photo EXIF extraction
- [ ] Device fingerprinting collection
- [ ] Watermark on photos

---

## 🎓 Manual Testing Scenarios

### Scenario 1: Student Happy Path (Online)
```
1. Student logs in
2. Navigates to dashboard
3. Clicks "📍 Ambil Lokasi Saat Ini"
4. Grants GPS permission
5. Selects activity "📍 Absen Masuk"
6. Clicks "📷 Buka Kamera"
7. Grants camera permission
8. Clicks "📸 Ambil Foto"
9. Reviews watermarked photo
10. Clicks "Kirim Absensi"
11. Sees ✅ "Absensi berhasil" message
12. Record appears in sync monitor as "Successful"

Expected: Student can complete full flow in ~30 seconds
```

### Scenario 2: Student Offline Flow
```
1. Network OFF (DevTools)
2. Student follows steps 1-10 from Scenario 1
3. Sees "Data tersimpan secara lokal"
4. Network ON
5. Auto-sync triggers
6. Sees "✅ Absensi tersinkronisasi"

Expected: Data eventually reaches server after going online
```

### Scenario 3: DPL Verification
```
1. Login as DPL
2. Navigate to "Verifikasi Absensi" (not yet built, but API ready)
3. Should see pending attendances list
4. Can see photos, GPS coordinates, validation flags
5. Can approve/reject submissions
6. Manual review flag triggered for high fraud risk

Expected: DPL can easily identify and verify suspicious submissions
```

### Scenario 4: High Fraud Risk Scenario
```
1. Create attendance 500km away from previous
2. Same timestamp (impossible travel)
3. Poor GPS accuracy (> 100m)
4. Shared device with multiple users

Expected: Submission marked for manual review, not auto-approved
```

---

## 📊 Success Metrics

| Category | Target | Status |
|----------|--------|--------|
| API Response Time | < 500ms | TBD |
| Sync Success Rate | > 99% | TBD |
| Geofence Accuracy | ±10m | TBD |
| Fraud Detection | > 80% precision | TBD |
| Offline Storage | Unlimited (IndexedDB) | TBD |
| Mobile Performance | < 2s load | TBD |

---

## 🚀 Sign-off

**Tester:** _________________________  
**Date:** _________________________  
**Overall Result:** ✅ PASS / ⚠️ NEEDS FIXES / ❌ FAIL

**Issues Found:**
```
(List any issues)
```

**Next Steps:**
- [ ] Deploy to production
- [ ] Begin DPL testing
- [ ] Monitor fraud metrics
- [ ] Collect user feedback

---

**Document Version:** 1.0  
**Last Updated:** April 20, 2026  
**Next Review:** April 27, 2026
