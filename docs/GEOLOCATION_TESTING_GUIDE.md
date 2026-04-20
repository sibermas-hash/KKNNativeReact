# 🧪 Geolocation Full Testing Guide

**Date:** April 20, 2026  
**Status:** Ready for Testing  
**Version:** 1.0

---

## 📋 Test Categories

1. **Database Tests** - Schema & data integrity
2. **Backend Unit Tests** - Service logic
3. **Backend Feature Tests** - API endpoints
4. **Frontend Component Tests** - React components
5. **Frontend Service Tests** - IndexedDB & Sync
6. **Manual Testing** - End-to-end user scenarios

---

## 🗄️ DATABASE TESTS

### Test 1.1: Migrations Run Successfully
```bash
# Run all migrations
php artisan migrate

# Check tables exist
php artisan tinker
>>> DB::table('attendances')->count()
>>> DB::table('attendance_photos')->count()
>>> DB::table('location_dispensations')->count()
>>> DB::table('attendance_sync_logs')->count()
```

**Expected:** All tables created successfully, count() returns 0

### Test 1.2: Column Types & Constraints
```bash
php artisan tinker

# Check attendances table structure
>>> Schema::getColumns('attendances')
>>> Schema::getIndexes('attendances')

# Should have:
# - Numeric columns: latitude, longitude, accuracy_meters
# - String columns: activity_type, status
# - DateTime columns: timestamp_client, timestamp_server, timestamp_gps
# - Indexes: on (user_id, periode_id, created_at), (status, created_at)
```

**Expected:** All columns present with correct types

---

## 🧪 BACKEND UNIT TESTS

### Test 2.1: Run AttendanceValidationService Tests
```bash
php artisan test tests/Unit/Services/AttendanceValidationServiceTest.php

# Expected Tests:
# ✓ test_validate_good_attendance
# ✓ test_validate_poor_accuracy
# ✓ test_validate_outside_geofence
# ✓ test_validate_timestamp_mismatch
# ✓ test_validate_speed_anomaly
# ✓ test_validation_message_verified
# ✓ test_haversine_distance_calculation
```

**Command:**
```bash
php artisan test tests/Unit/Services/AttendanceValidationServiceTest.php --testdox
```

### Test 2.2: Run FraudDetectionService Tests
```bash
php artisan test tests/Unit/Services/FraudDetectionServiceTest.php

# Expected Tests:
# ✓ test_clean_attendance_low_risk
# ✓ test_detect_velocity_anomaly
# ✓ test_detect_repeated_exact_location
# ✓ test_detect_round_number_coordinates
# ✓ test_detect_shared_device_signature
# ✓ test_risk_level_classification
# ✓ test_manual_review_trigger
# ✓ test_no_false_positives_clean_data
```

**Command:**
```bash
php artisan test tests/Unit/Services/FraudDetectionServiceTest.php --testdox
```

---

## 🔌 BACKEND API TESTS

### Test 3.1: Run AttendanceController Tests
```bash
php artisan test tests/Feature/Api/AttendanceControllerTest.php

# Expected Tests:
# ✓ test_create_attendance_success
# ✓ test_create_attendance_invalid_coordinates
# ✓ test_create_attendance_not_participant
# ✓ test_list_attendance
# ✓ test_show_attendance
# ✓ test_show_attendance_unauthorized
# ✓ test_get_sync_status
# ✓ test_create_attendance_with_photo
# ✓ test_create_attendance_different_activity_types
# ✓ test_list_attendance_filter_by_activity
# ✓ test_duplicate_attendance_detection
```

**Command:**
```bash
php artisan test tests/Feature/Api/AttendanceControllerTest.php --testdox
```

### Test 3.2: Manual API Testing with Postman

#### Create Attendance (Basic)
```bash
curl -X POST http://localhost:8000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "altitude_meters": 100,
    "heading_degrees": 45,
    "speed_mps": 0,
    "timestamp_client": "2024-04-20T08:30:00.000Z",
    "timestamp_gps": "2024-04-20T08:30:00.000Z",
    "activity_type": "absen_masuk",
    "device_signature": "test_device_123",
    "user_agent": "Mozilla/5.0 (iPhone...)"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "✅ Absensi berhasil diverifikasi",
  "data": {
    "attendance_id": 1,
    "status": "verified",
    "is_within_geofence": true,
    "distance_from_posko": 45.5,
    "validation_message": "✅ Lokasi valid",
    "fraud_risk_score": 10,
    "requires_manual_review": false
  }
}
```

#### Create Attendance with Photo
```bash
# First, create a test image
php artisan tinker
>>> $base64 = base64_encode(file_get_contents(storage_path('test-image.jpg')));
>>> echo $base64;

# Then use in curl
curl -X POST http://localhost:8000/api/attendance \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "latitude": -7.2575,
    "longitude": 110.4268,
    "accuracy_meters": 25,
    "timestamp_client": "2024-04-20T08:30:00.000Z",
    "activity_type": "absen_masuk",
    "proof_photo_base64": "data:image/jpeg;base64,YOUR_BASE64_HERE"
  }'
```

#### List Attendance
```bash
curl -X GET "http://localhost:8000/api/attendance" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Get Sync Status
```bash
curl -X GET "http://localhost:8000/api/attendance/sync-status" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Retry Sync
```bash
curl -X POST "http://localhost:8000/api/attendance/retry-sync" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 FRONTEND COMPONENT TESTS

### Test 4.1: Run Jest Tests
```bash
# Run all frontend tests
npm run test

# Run specific test file
npm run test -- resources/js/Components/__tests__/GeolocationCapture.test.tsx

# Watch mode
npm run test -- --watch
```

**Expected Output:**
```
PASS  resources/js/Components/__tests__/GeolocationCapture.test.tsx
  GeolocationCapture Component
    ✓ renders geolocation capture form (45ms)
    ✓ GPS capture button calls navigator.geolocation (52ms)
    ✓ displays GPS coordinates after capture (68ms)
    ✓ displays accuracy status indicator (40ms)
    ✓ displays error message on GPS failure (35ms)
    ✓ allows selecting different activity types (28ms)
    ✓ shows camera button (15ms)
    ✓ submit button disabled without GPS (20ms)
    ✓ submit button enabled after GPS capture (55ms)
    ✓ displays online status (12ms)
    ✓ submits attendance via API when online (78ms)

Test Suites: 1 passed, 1 total
Tests:       11 passed, 11 total
```

---

## 🧙 MANUAL TESTING

### Test 5.1: Student Dashboard Integration

**Steps:**
1. Login as student
2. Navigate to dashboard
3. Should see "Absensi Kehadiran" component
4. Should see "Sinkronisasi Data Offline" monitor (if pending)

**Verification:**
- [ ] Component loads without errors
- [ ] Activity type dropdown appears
- [ ] GPS capture button visible
- [ ] Camera button visible

### Test 5.2: GPS Capture Workflow

**Steps:**
```
1. Click "📍 Ambil Lokasi Saat Ini"
2. Allow location access (browser prompt)
3. Wait for GPS data
4. Check accuracy indicator
5. Verify coordinates displayed
```

**Verification:**
- [ ] GPS permission request appears
- [ ] Coordinates captured (valid lat/lng)
- [ ] Accuracy indicator shows (🟢 Sangat Akurat / 🟡 Baik / 🟠 Cukup / 🔴 Buruk)
- [ ] Submit button enabled

### Test 5.3: Photo Capture Workflow

**Steps:**
```
1. Click "📷 Buka Kamera"
2. Allow camera access
3. Click "📸 Ambil Foto"
4. Verify photo preview
5. Can retake with "Ambil Foto Ulang"
```

**Verification:**
- [ ] Camera opens
- [ ] Photo captured and displayed
- [ ] Watermark with NIM + timestamp visible
- [ ] Can switch camera (if available)

### Test 5.4: Photo Upload Workflow

**Steps:**
```
1. Click "📷 Buka Kamera"
2. Click "📁 Upload dari File"
3. Select image from device
4. Verify preview
```

**Verification:**
- [ ] File picker opens
- [ ] Image selected and displayed
- [ ] Can replace with another image

### Test 5.5: Submission Workflow (Online)

**Steps:**
```
1. Capture GPS (✓)
2. Capture/upload photo (✓)
3. Select activity type
4. Click "Kirim Absensi"
5. Wait for response
```

**Verification:**
- [ ] Success message appears
- [ ] "✅ Absensi berhasil..." or "⚠️ Perlu verifikasi manual"
- [ ] Form resets
- [ ] Sync monitor updates (if applicable)

### Test 5.6: Offline Submission Workflow

**Steps:**
```
1. Disable network (Dev Tools → Network → Offline)
2. Capture GPS & photo
3. Click "Kirim Absensi"
4. Should see offline indicator
5. Message: "Data tersimpan secara lokal"
6. Data saved to IndexedDB
```

**Verification (Browser DevTools):**
- [ ] Application → IndexedDB → KknAttendance
- [ ] pending_attendance store has record
- [ ] Record status = "pending"

### Test 5.7: Auto-Sync Workflow

**Steps:**
```
1. Submit offline (Test 5.6)
2. Monitor shows pending count
3. Enable network (Dev Tools → Network → Online)
4. Auto-sync triggers automatically
5. Pending count decreases
```

**Verification:**
- [ ] "📊 X data menunggu sinkronisasi" appears
- [ ] After going online, auto-sync happens
- [ ] Monitor updates showing synced count
- [ ] IndexedDB record status = "synced"

### Test 5.8: Manual Sync Button

**Steps:**
```
1. Submit offline (Test 5.6)
2. Go online
3. Click "🔄 Sinkronisasi Sekarang"
4. Observe sync progress
```

**Verification:**
- [ ] Button changes to "Sinkronisasi..."
- [ ] After sync: status updates
- [ ] Success notification or error message

### Test 5.9: Geofence Validation

**Steps:**
```
1. Have known Posko location (e.g., Yogyakarta center)
2. Capture GPS very close to Posko (<500m)
3. Submit attendance
4. Check response: "is_within_geofence": true
```

Then:
```
1. Use GPS spoofing (or different location)
2. Capture GPS far from Posko (>500m)
3. Submit attendance
4. Check response: "is_within_geofence": false
5. Should have geofence flag
```

**Verification (Backend):**
```bash
php artisan tinker
>>> $attendance = Attendance::latest()->first();
>>> $attendance->is_within_geofence
>>> $attendance->distance_from_posko
>>> $attendance->validation_flags
```

### Test 5.10: Fraud Detection

**Test Scenario A: Velocity Anomaly**
```
1. Create two attendances 5 seconds apart
2. First at Yogyakarta (-7.2575, 110.4268)
3. Second at Jakarta (-6.1751, 106.8650) ~500km away
4. Should flag as impossible velocity
```

**Test Scenario B: Device Fingerprinting**
```
1. Get device signature from first attendance
2. Create attendance from different user with same device signature
3. Check if flagged
```

**Test Scenario C: Repeated Exact Location**
```
1. Create 5 attendances at exact same coordinates
2. Last one should flag as suspicious repetition
```

**Verification (Backend):**
```bash
php artisan tinker
>>> $attendance = Attendance::latest()->first();
>>> $attendance->validation_flags
>>> // Should see fraud indicators
```

---

## 📊 Testing Checklist

### Database
- [ ] All 4 migrations run successfully
- [ ] All tables created with correct columns
- [ ] Indexes created
- [ ] Relationships working

### Backend Services
- [ ] AttendanceValidationService tests pass (7/7)
- [ ] FraudDetectionService tests pass (8/8)
- [ ] Geofence calculation accurate
- [ ] Timestamp validation works
- [ ] Duplicate detection works
- [ ] Fraud scoring works

### Backend API
- [ ] AttendanceController tests pass (11/11)
- [ ] Create attendance: 201 response
- [ ] List attendance: 200 response with pagination
- [ ] Show attendance: 200 response
- [ ] Invalid coordinates: 422 response
- [ ] Unauthorized access: 403 response
- [ ] Sync status endpoint works
- [ ] Photo upload & storage works
- [ ] EXIF extraction works

### Frontend Components
- [ ] GeolocationCapture renders
- [ ] GPS button works (mock)
- [ ] Camera button works
- [ ] Activity type selector works
- [ ] Coordinates display correctly
- [ ] Accuracy indicator shows
- [ ] Error messages display
- [ ] Submit button enable/disable works
- [ ] Online/offline indicator works

### Frontend Services
- [ ] IndexedDB service CRUD works
- [ ] Sync service retries with backoff
- [ ] Auto-sync on online event
- [ ] Manual sync button works
- [ ] Pending records tracked

### End-to-End Flows
- [ ] GPS capture → Photo upload → Submit (online)
- [ ] GPS capture → Submit offline → Auto-sync (online)
- [ ] GPS capture → Submit offline → Manual sync
- [ ] Geofence validation correct
- [ ] Fraud detection flags high-risk
- [ ] Dispensasi workflow works
- [ ] DPL can verify submissions

---

## 🚀 Run All Tests

### Backend All Tests
```bash
php artisan test
```

### Backend Specific Test Suite
```bash
php artisan test tests/Unit/Services/ --testdox
php artisan test tests/Feature/Api/ --testdox
```

### Frontend All Tests
```bash
npm run test
```

### Coverage Report
```bash
# Backend
php artisan test --coverage

# Frontend
npm run test -- --coverage
```

---

## ✅ Sign-off

**Tester Name:** _________________________

**Date:** _________________________

**Overall Status:**
- [ ] All Unit Tests PASS
- [ ] All API Tests PASS
- [ ] All Component Tests PASS
- [ ] All Manual Tests PASS
- [ ] Ready for Production

**Issues Found:**
```
(List any issues here)
```

**Notes:**
```
(Additional notes)
```

---

**Document Version:** 1.0  
**Last Updated:** April 20, 2026  
**Next Review:** April 27, 2026
