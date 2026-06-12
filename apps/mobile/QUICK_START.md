# 🚀 Quick Start Guide - Test the GAP Features NOW!

## ⚡ GET STARTED IN 5 MINUTES

---

## 📋 PREREQUISITES CHECKLIST

- [ ] PHP 8.4.20 installed
- [ ] Node.js LTS installed
- [ ] pnpm installed
- [ ] Expo 53 installed
- [ ] Expo Go app on mobile device
- [ ] Mobile device connected to same network

---

## 🎯 STEP 1: START BACKEND SERVER

```bash
# Open terminal 1
cd apps/api
php artisan serve
```

**Expected output:**
```
INFO  Server running on [http://127.0.0.1:8000]
```

**Don't close this terminal!**

---

## 🎯 STEP 2: START MOBILE DEVELOPMENT SERVER

```bash
# Open terminal 2
cd apps/mobile
pnpm run dev
```

**Expected output (after 30-60 seconds):**
```
Starting development...

Metro waiting on exp://...

› Scan the QR code above with Expo Go (Android)

Or press 'w' to open the URL in a browser

› Press the key to open a PDF with instructions.
```

**Don't close this terminal!**

---

## 🎯 STEP 3: OPEN EXPO GO ON YOUR DEVICE

### For Android:
1. Make sure you have **Expo Go** installed from Play Store
2. Open Expo Go app
3. Tap the **Scan QR Code** button
4. Scan the QR code displayed in terminal

### For iOS:
1. Make sure you have **Expo Go** installed from App Store
2. Open Expo Go app
3. Tap the **Scan QR Code** button
4. Scan the QR code displayed in terminal

---

## 🎯 STEP 4: VERIFY APP LOADS

The app should load and show:
- ✅ Navigation bar at the bottom (8 tabs)
- ✅ Login screen (if not authenticated)
- ✅ Or dashboard screen (if already authenticated)

---

## 🎯 STEP 5: LOG IN (IF NEEDED)

1. Enter your credentials
2. Tap "Login"
3. Wait for authentication
4. Dashboard should appear

---

## ✨ STEP 6: TEST ALL FEATURES!

### Navigate to 8 New Tabs:

#### 1. 📊 Dashboard (index)
- [ ] View overall KKN status
- [ ] Check statistics
- [ ] Verify data loads

#### 2. 🎓 Pembekalan (workshops) - NEW
- [ ] Tap "Pembekalan" tab
- [ ] View workshop list
- [ ] Tap on a workshop
- [ ] View workshop details
- [ ] Try attendance submission (if scheduled)

#### 3. 📍 Posko - NEW
- [ ] Tap "Posko" tab
- [ ] View posko data
- [ ] Try creating/updating posko
- [ ] Test location picker

#### 4. 🏠 Domisili - NEW
- [ ] Tap "Domisili" tab
- [ ] View domisili data
- [ ] Try filling address form
- [ ] Test GPS capture
- [ ] Try taking photo

#### 5. 📝 Pendaftaran (registration) - NEW
- [ ] Tap "Pendaftaran" tab
- [ ] View document checklist
- [ ] Try uploading documents
- [ ] Test QR code scanner

#### 6. 📋 Laporan (reports)
- [ ] Tap "Laporan" tab
- [ ] View reports list
- [ ] Try accessing final report
- [ ] Test final report submission

#### 7. 🎯 Kegiatan (activities)
- [ ] Tap "Kegiatan" tab
- [ ] View activities list
- [ ] Test existing features

#### 8. 👤 Profil (profile)
- [ ] Tap "Profil" tab
- [ ] View profile data
- [ ] Test existing features

---

## 🐛 TROUBLESHOOTING

### Q: App doesn't load on device
**A:** Check these:
- [ ] Are both terminals still running?
- [ ] Is backend accessible at http://localhost:8000?
- [ ] Is device on the same network?
- [ ] Is Expo Go app running?
- [ ] Have you scanned the QR code correctly?

### Q: Expo "Network request failed" error
**A:**
```bash
# Terminal 2 - Stop mobile server
Ctrl+C

# Restart with network config
pnpm run dev --web
# Or try: pnpm run dev --tunnel
```

### Q: Backend API errors
**A:**
```bash
# Terminal 1 - Check backend status
curl http://localhost:8000/api/v1/student/dashboard

# Expected: JSON response or auth error

# If error:
cd apps/api
php artisan route:list
# Check if all routes are registered
```

### Q: "File not found" error
**A:** Check that files exist:
```bash
# Navigate to mobile folder
cd apps/mobile

# Check all feature folders exist
ls app/\(tabs\)/workshops
ls app/\(tabs\)/posko
ls app/\(tabs\)/domisili
ls app/\(tabs\)/registration
ls app/\(tabs\)/reports

# Check export files exist
ls app/\(tabs\)/workshops/index.ts
ls app/\(tabs\)/posko/index.ts
ls app/\(tabs\)/domisili/index.ts
ls app/\(tabs\)/registration/index.ts
ls app/\(tabs\)/reports/index.ts
```

### Q: Navigation errors
**A:** Check _layout.tsx
```bash
# Verify navigation is configured
cat apps/mobile/app/\(tabs\)/_layout.tsx

# Should have 8 Tabs.Screen entries
# Should have logical name properties
```

### Q: Cannot start server (port conflict)
**A:**
```bash
# Terminal 1 - Check port 8000
lsof -i :8000
# Kill the process if blocking

# Terminal 2 - Check other ports
lsof -i :19000
lsof -i :19001
lsof -i :19002
# Kill processes if blocking

# Try using the Windows key 'k' to kill process
# Or: pnpm run dev --port 19002
```

### Q: Import errors
**A:**
```bash
# Check if exports exist
cd apps/mobile

# Test TypeScript compilation
npx tsc --noEmit

# Check expo config
cat app.config.ts
```

---

## 📊 SUCCESS INDICATORS

### ✅ When Everything Works:

**Terminal 1 (Backend):**
```
INFO  Server running on [http://127.0.0.1:8000]
No errors visible
```

**Terminal 2 (Mobile):**
```
Starting development...

Metro waiting on exp://...

› Ready! You can now open Expo Go
› Scan the QR code above
```

**Mobile Device:**
- ✅ 8 tabs visible at bottom
- ✅ Screens load without errors
- ✅ Data fetching shows loading states
- ✅ Forms submit successfully
- ✅ Error messages appear when needed
- ✅ No red error screens

---

## 🎯 FULL TESTING GUIDE

For comprehensive testing, see:
`apps/mobile/FEATURE_TESTING.md`

**Quick Testing Path:**
1. Navigate to each tab (1 minute)
2. Verify data loads (1 minute)
3. Test submission forms (5 minutes)
4. Test error scenarios (5 minutes)
5. Test navigation (2 minutes)
6. Test permissions (3 minutes)

**Total Quick Test:** ~17 minutes

---

## 💡 TIPS FOR SUCCESS

### Do This:
- ✅ Keep both terminals running
- ✅ Use same network connection
- ✅ Login with test account first
- ✅ Start with simple features
- ✅ Test one feature at a time
- ✅ Document any issues found

### Don't Do This:
- ❌ Close terminals during testing
- ❌ Skip error testing
- ❌ Test all features at once
- ❌ Ignore permission prompts
- ❌ Use production credentials
- ❌ Forget to check console logs

---

## 📱 SCREENSHOTS (Expected UI)

### Expected Views:

**Dashboard Tab:**
```
SIBERMAS
📊 Dashboard
[Statistics cards]
[Recent activities]
[KKN status]
```

**Pembekalan Tab:**
```
KKN Pembekalan
🎓
[Workshop List]
- Workshop 1 (Scheduled)
- Workshop 2 (Attended ✓)
```

**Posko Tab:**
```
Posko Kelompok
📍
[Posko Form Fields]
Nama: ________________
Alamat: ________________
[Pilih dari Peta] 🗺️
[Simpan] [Edit]
```

**Domisili Tab:**
```
Domisili KKN
🏠
[Address Form]
Alamat: ________________
Kabupaten: ________________
[GPS Capture] 📍
[Unggah Foto] 📸
[Simpan] [Edit]
```

**Pendaftaran Tab:**
```
Pendaftaran KKN
📝
[Document Checklist]
- Surat Persetujuan (Wajib) [Upload]
- Surat Pernyataan (Wajib) [Uploaded ✓]
- ... (5 more docs)
[Upload All]
```

**Laporan Tab:**
```
Laporan KKN
📋
[Final Report Section]
Judul: ________________
Abstrak: ________________
[Unggah PDF] 📄
[Buat Kirim] [Edit]
```

**Kegiatan Tab (Existing):**
```
Kegiatan Harian
🎯
[Activity List]
- Activity 1
- Activity 2
[Add New]
```

**Profil Tab (Existing):**
```
Profil Mahasiswa
👤
[Profile Info]
Name: ________________
NIM: ________________
[Keluar]
```

---

## 🎉 SUCCESS! YOU'RE TESTING THE APP!

### Next Steps:

1. ✅ **Test Each Feature** (Using Feature Testing Guide)
2. ✅ **Document Any Issues** (Write in this file)
3. ✅ **Report Findings** (Share with team)
4. ✅ **Prepare for Production** (Follow Production Checklist)

---

## 📞 GETTING HELP

If you encounter issues:

1. **Check Logs:**
   - Terminal 1: Backend logs
   - Terminal 2: Mobile logs
   - Device: Expo Go logs

2. **Try This:**
   - Restart servers
   - Clear app cache
   - Scan QR code again
   - Check network connection

3. **Read Documentation:**
   - `/apps/mobile/FEATURE_TESTING.md`
   - `/docs/GAP_FEATURES_PROGRESS.md`
   - `/docs/MOBILE_DEVELOPMENT.md`

4. **Common Solutions:**
   - Restart both terminals
   - Reinstall Expo Go app
   - Update pnpm packages
   - Clear browser cache

---

## ✅ CHECKLIST BEFORE PROCEEDING

- [ ] Backend server running on port 8000
- [ ] Mobile dev server running
- [ ] Expo Go app can scan QR code
- [ ] App loads successfully on device
- [ ] All 8 tabs visible
- [ ] No immediate errors
- [ ] Data fetching works
- [ ] Forms are testable
- [ ] Ready for full testing

---

**Created:** May 5, 2026
**Purpose:** Quick start for testing GAP features
**Status:** ✅ Ready to Use
**Support:** See /apps/mobile/FEATURE_TESTING.md

🚀 **START TESTING NOW!** 🚀
