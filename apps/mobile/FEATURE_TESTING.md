# Feature Integration Testing Guide

This document provides guidelines for testing the 5 GAP features in the SIBERMAS KKN mobile app.

---

## 📋 Testing Checklist

### Feature 1: Workshop Attendance

#### Test Cases:
- [ ] **View Workshops List**
  - Navigate to "Pembekalan" tab
  - Verify workshops are listed
  - Check for workshop details: title, date, time, location
  - Verify status indicators: scheduled (belum), attended (sudah absen)

- [ ] **View Workshop Details**
  - Tap on a workshop from the list
  - Verify detail view shows: title, date, time, location, geofence radius
  - Check if active token is displayed (only during scheduled time)
  - Verify GPS coordinates are shown

- [ ] **Mark Attendance**
  - Ensure workshop status is "scheduled"
  - Enter 6-digit attendance token
  - Allow GPS permissions
  - Verify GPS location is captured
  - Submit attendance
  - Check success message appears
  - Verify attendance status changes to "attended"
  - Navigate back to list and see updated status

- [ ] **Attendance with Photo Evidence** (Waitlist)
  - If status is "pending_verification"
  - Verify prompt to upload photo evidence
  - Take photo using camera
  - Upload photo
  - Check success message

- [ ] **View Attendance Score**
  - If attendance has been approved/graded
  - Verify score is displayed
  - Check if score >= passing score (70)
  - Verify "PASS" or "FAIL" status

#### Error Handling:
- [ ] Invalid 6-digit token
- [ ] GPS not enabled
- [ ] Location outside radius
- [ ] Device already used by another user
- [ ] Network timeout

---

### Feature 2: Posko Management

#### Test Cases:
- [ ] **View Current Posko**
  - Navigate to "Posko" tab
  - Verify posko details are displayed
  - Check: nama, alamat, koordinat, radius, jenis, kontak, phone
  - Verify Google Maps link is clickable

- [ ] **Create New Posko**
  - Verify "Tambah Posko" button exists
  - Fill in form:
    - Nama posko
    - Alamat lengkap
    - Latitude/Longitude coordinates
    - Radius (meters)
    - Jenis posko
    - Kontak person
    - Nomor telepon
  - Submit form
  - Verify data is saved
  - Check posko details are updated

- [ ] **Edit Existing Posko**
  - Verify "Edit Posko" button appears
  - Tap edit button
  - Modify form fields
  - Save changes
  - Verify updates are saved

- [ ] **Location Integration**
  - Try picking location from map
  - Check if coordinates are auto-filled
  - Verify Google Maps link is clickable

#### Error Handling:
- [ ] Required fields missing
- [ ] Invalid coordinates
- [ ] Invalid phone format
- [ ] Save failure

---

### Feature 3: Domisili

#### Test Cases:
- [ ] **View Current Domisili**
  - Navigate to "Domisili" tab
  - Verify all address fields are displayed
  - Check: alamat, provinsi, kabupaten, kecamatan, kelurahan, kode pos
  - Verify detailed info: no. rumah, RT, RW
  - Check if GPS coordinates are shown
  - Verify house photo is displayed

- [ ] **Fill Domisili Form**
  - Tap "Isi Data Domisili" (if no data exists)
  - Fill in section by section:
    - Alamat singkat
    - Provinsi (optional)
    - Kabupaten/Kota (required)
    - Kecamatan
    - Kelurahan/Desa
    - Kode Pos
  - Fill detailed info:
    - No. Rumah
    - RT (001 format)
    - RW (001 format)
  - Fill GPS:
    - Manually enter latitude/longitude OR
    - Pick from map
  - Take house photo
  - Submit form
  - Verify data is saved

- [ ] **Edit Existing Domisili**
  - Verify "Edit Domisili" button exists
  - Tap edit button
  - Modify form fields
  - Save changes
  - Verify updates are saved

#### Error Handling:
- [ ] Required fields missing
- [ ] Invalid kode pos (not 5 digits)
- [ ] Invalid GPS coordinates
- [ ] Camera permission denied

---

### Feature 4: Registration Documents

#### Test Cases:
- [ ] **View Document Checklist**
  - Navigate to "Pendaftaran" tab
  - Verify all documents are listed
  - Check status indicators: Required (Wajib), Optional, Uploaded, Pending

- [ ] **Upload Required Documents**
  - Verify required documents are marked "Wajib"
  - Tap "Upload" for required document:
    - Surat Persetujuan (PDF)
    - Surat Pernyataan (PDF)
    -_Transkrip Nilai (PDF)
  - Pick file from device
  - Verify file appears as "Uploaded"

- [ ] **Upload Optional Documents**
  - Upload optional documents:
    - Surat Bebas Tunggakan
    - Surat Kesehatan
    - Surat Izin Orangtua
    - Pas Foto (JPG)
  - Verify optional documents can be skipped

- [ ] **Scan QR Code**
  - Tap "Scan QR" for any document
  - Allow camera permission
  - Scan QR code
  - Verify QR code is read

- [ ] **Batch Upload**
  - Upload multiple documents
  - Tap "Upload Semua Dokumen"
  - Verify all documents upload successfully
  - Check overall status

- [ ] **View Upload Status**
  - Check "Status Upload" section
  - Verify each document shows status
  - Verify total uploaded count

#### Error Handling:
- [ ] File type not allowed (e.g., doc for PDF)
- [ ] File size too large (limit 10MB)
- [ ] Camera permission denied
- [ ] Network timeout
- [ ] Required documents missing when trying to submit

---

### Feature 5: Final Report

#### Test Cases:
- [ ] **View Report Dashboard**
  - Navigate to "Laporan" tab
  - Verify report status is displayed
  - Check if report exists (Draft, Submitted, Approved, Rejected)
  - Verify DPL feedback is shown (if any)

- [ ] **Create Final Report** (Draft)
  - If report doesn't exist:
    - Tap "Buat Laporan Akhir"
    - Fill in each section:
      - Judul Laporan (required)
      - Abstrak (required)
      - Bab 1: Pendahuluan
      - Bab 2: Metodologi
      - Bab 3: Pembahasan
      - Bab 4: Penutup
      - Daftar Pustaka
      - Lampiran
    - Upload PDF file:
      - Pick PDF file from device
      - Verify file size is within limit (10MB)
    - Preview report
    - Tap "Kirim Laporan"
    - Confirm submission

- [ ] **View Submitted Report**
  - If report exists:
    - Read-only view of all sections
    - Show DPL feedback (if any)
    - Show score (if graded)
    - Show approval status
    - Show timestamp of submission/approval

- [ ] **Edit Report** (Only if Draft/Rejected)
  - Tap "Edit Laporan" (if status is draft or rejected)
  - Modify any section
  - Update PDF file if needed
  - Save changes or submit

- [ ] **View Scores & Timeline**
  - If report is approved:
    - Check final score (/100)
    - Verify if score >= passing score (70)
    - Check approval status: PASS/FAIL
    - View timeline: submitted date, approved date

#### Error Handling:
- [ ] Required fields missing (judul, abstrak)
- [ ] PDF file not uploaded
- [ ] File size too large
- [ ] Invalid PDF format
- [ ] Report status locked (already submitted)

---

## 🔧 Integration Testing Steps

### Step 1: Environment Setup
1. Start backend server: `cd apps/api && php artisan serve`
2. Start mobile dev server: `cd apps/mobile && pnpm run dev`
3. Open Expo Go on device
4. Scan QR code

### Step 2: Authentication
1. Log in with valid credentials
2. Verify auth token is stored in MMKV
3. Check dashboard loads successfully

### Step 3: Feature Testing (Sequential)
1. Test Workshop Attendance first (depends on time-based token)
2. Test Posko Management (independent)
3. Test Domisili (independent)
4. Test Registration Documents (independent)
5. Test Final Report (independent)

### Step 4: Cross-Feature Testing
1. Verify all tabs are accessible
2. Test navigation between screens
3. Verify app state persists
4. Test offline/online scenarios

### Step 5: Error Scenarios
1. Force network failure
2. Test with invalid data
3. Test with missing permissions
4. Test with concurrent requests

---

## 📊 Test Results Template

```
Feature: [Feature Name]
Date: [Date]
Tester: [Name]

Test Cases:
[✓] Passed  [✗] Failed  [?] Skipped

Issues Found:
1. [Issue description]
   - Expected: [What should happen]
   - Actual: [What actually happened]
   - Severity: [Critical/Major/Minor]

Recommendations:
1. [Recommendation]
2. [Recommendation]

Notes:
[Any additional notes]
```

---

## 🚀 Production Readiness Checklist

- [ ] All test cases pass
- [ ] No critical issues
- [ ] Error handling is comprehensive
- [ ] Loading states work correctly
- [ ] User feedback is clear
- [ ] API responses are validated
- [ ] Offline scenarios are handled
- [ ] Performance is acceptable
- [ ] UI/UX is polished
- [ ] Documentation is complete
