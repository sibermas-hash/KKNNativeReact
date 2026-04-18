# Prompt untuk Claude.ai - Concise Version

Copy ini ke claude.ai:

---

```
Saya mau fixing 4 issues di proyek Laravel KKN UIN SAIZU ini:

## Issue 1 — Student login redirect ke /admin (Application Bug)
File: app/Http/Middleware/RedirectIfAuthenticated.php atau AuthController

Redirect saat ini hardcoded ke /admin, padahal student harusnya ke /mahasiswa.
Cek role user dan redirect sesuai role:
- mahasiswa → /mahasiswa
- dpl → /dpl
- admin → /admin

## Issue 2 — bpjs_profile.is_complete tidak ada di test data
File: database/factories/BpjsProfileFactory.php

Tambahkan field 'is_complete' => false di definition(), dan state complete(): static

## Issue 3 — biodata_profile.is_complete tidak ada
File: database/factories/BiodataProfileFactory.php

Sama seperti Issue 2, tambahkan field 'is_complete' => false

## Issue 4 — DashboardStatistics test failures
File: tests/Unit/Services/DashboardStatisticsServiceTest.php

Test untuk summary_stats_counts_work_programs dan summary_stats_counts_final_reports gagal.
Cek diff expected vs actual value, likely test expectations outdated.

## Issue 5 — CertificateService exception message mismatch
File: tests/Unit/Services/CertificateServiceTest.php

Exception message expected vs actual tidak match.
Samakan pesan atau perbaiki service nya.

Bantuan yang dibutuhkan:
1. Analisa root cause per issue
2. Kasih kode fix konkret per file
3. Kalau perlu, kasih migration untuk kolom is_complete

Cek juga AGENTS.md di root untuk konteks tambahan.
```

---

## Quick Fix Commands

```bash
# Cek test yang gagal
php artisan test --filter "StudentRegistrationFlowTest|StudentBiodataTest" --verbose

# Setelah fix factory, jalankan ulang
php artisan test --filter "StudentRegistrationFlowTest|StudentBiodataTest"
```

---

## Expected Result

Setelah fix:

- 37 failures → 0
- Pass rate: 88.4% → 100%

Dokumen lengkap: docs/QA_TESTING_REPORT.md
