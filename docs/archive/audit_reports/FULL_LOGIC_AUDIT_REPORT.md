# 🔍 FULL LOGIC AUDIT REPORT - KKN Portal UIN Saizu

**Audit Date:** April 7, 2026  
**Auditor:** Qwen Code AI Assistant  
**Scope:** Complete business logic, security, authorization, and data integrity analysis

---

## 📊 EXECUTIVE SUMMARY

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 CRITICAL | **18** | Requires immediate attention |
| 🟡 WARNING | **25** | Should be fixed soon |
| 🔵 INFO | **28** | Best practices & improvements |

**Overall Assessment:** The application has a solid architectural foundation but contains several critical logic errors, race conditions, and security vulnerabilities that need immediate remediation before production deployment.

---

## 🎯 CRITICAL FINDINGS

### C1. Dual Grading Formula Inconsistency
**Severity:** 🔴 CRITICAL  
**Files:** `app/Services/GradingService.php` vs `app/Services/KKN/NilaiAkhirService.php`

**Issue:** Two completely different grading formulas exist:

**GradingService:**
- Komponen A (DPL): `final_report * 30% + execution * 40% + article * 30%`
- Komponen B (Village): `attitude * 50% + discipline * 50%`
- Komponen C (LPPM): `workshop * 50% + admin * 50%`
- Final: `A * 40% + B * 20% + C * 40%`

**NilaiAkhirService:**
- DPL: `AVG(article, final_report)` — **missing execution_score**
- Village: `AVG(discipline, attitude, execution)` — **execution_score here instead!**
- LPPM: `AVG(workshop, admin)`
- Final: `DPL * 40% + Village * 20% + LPPM * 40%`

**Impact:** Students receive different grades depending on which service is used.

**Fix:** Unify to a single service. Remove `NilaiAkhirService` or align formulas.

---

### C2. Race Condition in Group Capacity Checks
**Severity:** 🔴 CRITICAL  
**Files:** `app/Services/GroupSelectionService.php` (lines 56-82), `app/Services/RegistrationService.php`

**Issue:** TOCTOU (Time-of-Check-Time-of-Use) vulnerability:
```php
// Check capacity
$activeParticipants = PesertaKkn::where('kelompok_id', $group->id)
    ->whereIn('status', ['approved'])
    ->get(); // Load ALL into memory

if ($activeParticipants->count() >= $group->capacity) {
    throw new Exception('Group full');
}

// Gap: another transaction can fill the last seat here

$registration->kelompok_id = $group->id;
$registration->save(); // No re-check!
```

**Fix:** Use `SELECT ... FOR UPDATE` on the peserta_kkn table and re-validate capacity immediately before INSERT.

---

### C3. Eligibility Check Logic Error
**Severity:** 🔴 CRITICAL  
**File:** `app/Services/EligibilityService.php` (lines 156-163)

**Issue:** Checks ALL periods including current one:
```php
$hasActive = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
    ->whereIn('status', ['pending', 'approved'])
    ->exists(); // Missing: ->where('period_id', '!=', $currentPeriodId)
```

**Impact:** Students with existing registration for the SAME period are incorrectly marked as ineligible.

**Fix:** Add `->where('period_id', '!=', $periodeId)` filter.

---

### C4. Inconsistent Grade Scale Thresholds
**Severity:** 🔴 CRITICAL  
**Files:** `app/Services/GradingService.php` (lines 13-22) vs `app/Services/KKN/GradeConversionService.php`

**GradingService::GRADE_SCALE:**
- A: 85-100, A-: 80-84.99, B+: 75-79.99, B: 70-74.99

**GradeConversionService:**
- A: ≥86, A-: ≥81, B+: ≥76, B: ≥71

**Example:** Score of 83 = `A-` in GradingService but `B+` in GradeConversionService.

**Impact:** Wrong letter grades assigned to students.

**Fix:** Delete unused `GRADE_SCALE` constant and standardize on `GradeConversionService`.

---

### C5. execution_score in Wrong Component
**Severity:** 🔴 CRITICAL  
**File:** `app/Services/KKN/NilaiAkhirService.php` (lines 39-43)

**Issue:**
```php
$villageAvg = $this->calculateAverage([
    $nilai->discipline_score,
    $nilai->attitude_score,
    $nilai->execution_score,  // ❌ WRONG: This is a DPL component!
]);
```

**Business Rule:** execution_score (pelaksanaan program kerja) should be assessed by DPL, not Village/Mitra.

**Fix:** Move `execution_score` to DPL component calculation.

---

### C6. Mass Finalization Job - No Transaction
**Severity:** 🔴 CRITICAL  
**File:** `app/Jobs/FinalizeMassScoresJob.php` (lines 50-72)

**Issue:**
```php
$scores->each(function ($score) {
    try {
        $score->is_finalized = true;
        $score->save(); // Individual implicit transaction
    } catch (\Exception $e) {
        Log::error(...);
        // ❌ Failed counter NOT incremented here!
    }
});
```

**Problems:**
1. No wrapping transaction — partial finalization on failure
2. Failed records in catch block not counted
3. Chunk without `chunkById()` — can skip/duplicate records
4. No row-level locking (`lockForUpdate()`)

**Fix:** Wrap in transaction, use `chunkById()`, increment failed counter in catch block.

---

### C7. Authorization Bypass in Daily Report View
**Severity:** 🔴 CRITICAL  
**File:** `app/Http/Controllers/Dpl/DailyReportController.php` (lines 85-96)

**Issue:** `show()` method has NO ownership check:
```php
public function show(DailyReport $report)
{
    // ❌ Any authenticated user can view ANY report by ID
    return Inertia::render('Dpl/DailyReports/Show', compact('report'));
}
```

**Impact:** Information disclosure — students can view other students' reports.

**Fix:** Add authorization check:
```php
$this->authorize('view', $report);
// OR
if (!$report->belongs_to_current_user()) abort(403);
```

---

### C8. Bulk Operations Bypass Faculty Scoping
**Severity:** 🔴 CRITICAL  
**File:** `app/Http/Controllers/Admin/PesertaKknController.php` (lines 331-390)

**Issue:** `bulkApprove()` and `bulkReject()` query `PesertaKkn::query()` directly without `FacultyScopeService::apply()`:
```php
$registrations = PesertaKkn::query()
    ->whereIn('id', $validated['ids'])
    ->where('status', 'pending')
    ->lockForUpdate()
    ->get();
    // ❌ Missing: ->whereHas('mahasiswa', fn($q) => $q->where('faculty_id', $user->faculty_id))
```

**Impact:** `faculty_admin` can approve/reject registrations outside their faculty.

**Fix:** Apply faculty scoping to queries.

---

### C9. Registration Window Validation Inconsistency
**Severity:** 🔴 CRITICAL  
**Files:** `app/Services/RegistrationService.php` (lines 33-38) vs form request

**Issue:** String comparison vs Carbon `between()`:
```php
// RegistrationService.php - WRONG
$today = now()->toDateString(); // "2025-04-07"
if ($today < $periode->registration_start) { // "2025-04-07 08:00:00"
    // String comparison can produce incorrect results!
}

// EligibilityService.php - CORRECT
if (!now()->between($periode->registration_start, $periode->registration_end)) {
    // Proper datetime comparison
}
```

**Impact:** Students may register outside the intended window.

**Fix:** Use `now()->between()` consistently.

---

### C10. Missing Registration Ownership Verification
**Severity:** 🔴 CRITICAL  
**File:** `app/Services/RegistrationService.php` (lines 25-163)

**Issue:** `register()` accepts `Mahasiswa $mahasiswa` parameter with NO verification that the authenticated user owns this mahasiswa record.

**Impact:** Account takeover — register on behalf of any student.

**Fix:** Add ownership check:
```php
if ($mahasiswa->user_id !== auth()->id()) {
    throw new AuthorizationException();
}
```

---

### C11. Webhook Signature Timing Attack
**Severity:** 🔴 CRITICAL  
**File:** `app/Http/Middleware/VerifyWebhookSignature.php` (lines 42-46)

**Issue:**
```php
if ($signature !== $expectedSignature) { // ❌ Vulnerable to timing attack
    abort(403, 'Invalid signature');
}
```

**Fix:** Use `hash_equals($signature, $expectedSignature)`.

---

### C12. Race Condition in Registration Lock
**Severity:** 🔴 CRITICAL  
**File:** `app/Services/RegistrationService.php` (lines 27-30)

**Issue:** Lock acquired AFTER data read:
```php
public function register(...) {
    return $this->withRegistrationLocks(function () use (...) {
        // Cache lock acquired here
        $periode = Periode::lockForUpdate()->findOrFail($periodeId);
        // ❌ But business logic checks happen BEFORE any DB write
        // Multiple concurrent requests can pass checks simultaneously
    });
}
```

**Fix:** Move all validation inside the lock scope or use database-level constraints.

---

### C13. Column Name Mismatch - period_id vs periode_id
**Severity:** 🔴 CRITICAL  
**File:** `app/Services/GradingService.php` (lines 192, 246)

**Issue:**
```php
// Line 192 - WRONG
$query->where('periode_id', $periodId);

// Line 246 - CORRECT
fn($q) => $q->where('period_id', $periodId)
```

**Impact:** `finalizeAll()` will fail to find any records.

**Fix:** Standardize on `period_id` (actual column name).

---

### C14. Missing Database Unique Constraint
**Severity:** 🔴 CRITICAL  
**File:** Registration flow

**Issue:** No database-level unique index on `(mahasiswa_id, period_id)` in `peserta_kkn` table. Race condition between SELECT and INSERT can create duplicate registrations.

**Fix:** Add unique index:
```php
$table->unique(['mahasiswa_id', 'period_id']);
```

---

### C15. Silent Exception Swallowing in Job
**Severity:** 🔴 CRITICAL  
**File:** `app/Jobs/FinalizeMassScoresJob.php` (lines 68-70)

**Issue:** Exceptions caught and logged but job reports success:
```php
} catch (\Exception $e) {
    Log::error("Failed: {$e->getMessage()}");
    // ❌ $failed counter NOT incremented!
}
// Audit log reports wrong $failed count
```

**Fix:** Increment `$failed` in catch block.

---

### C16. Leader Assignment Missing Authorization
**Severity:** 🔴 CRITICAL  
**File:** `app/Http/Controllers/Admin/PesertaKknController.php` (lines 632-656)

**Issue:** `makeLeader()` uses route model binding without verifying admin has faculty scope over the student.

**Impact:** Any admin can make any student a leader, even outside their faculty.

**Fix:** Add faculty scope verification.

---

### C17. Admin Bypass Grading Period Window
**Severity:** 🔴 CRITICAL  
**File:** `app/Http/Controllers/Admin/GeneratorNilaiController.php` (lines 136-145)

**Issue:**
```php
if (auth()->user()->hasRole('dpl')) {
    // Check grading period window
}
// ❌ Admins bypass grading window entirely
```

**Impact:** Admins can enter grades outside the designated grading period.

**Fix:** Apply period check to all roles (or document as intentional).

---

### C18. Duplicate Group Assignment Logic Error
**Severity:** 🔴 CRITICAL  
**File:** `app/Services/RegistrationService.php` (lines 104-109)

**Issue:** When `$kelompokId` is null, method returns early without checking if student already has `kelompok_id` set:
```php
if (!$kelompokId) {
    $existing->status = 'pending';
    $existing->antrian_status = $existing->kelompok_id ? 'on_queue' : 'belum_pilih_kelompok';
    $existing->save();
    return; // ❌ Preserves existing kelompok_id silently
}
```

**Impact:** Re-registration with null group preserves old group assignment unexpectedly.

**Fix:** Explicitly handle the null case or document intended behavior.

---

## 🟡 WARNING FINDINGS

### W1. Performance: Load ALL Students Into Memory
**File:** `app/Services/EligibilityService.php` (lines 170-191)

```php
$students = $query->get(); // ❌ No pagination - can be thousands
foreach ($students as $student) {
    $this->checkEligibility($student); // 7+ queries per student
}
```

**Fix:** Use chunking or pagination.

---

### W2. Cache Invalidation Mismatch
**File:** `app/Services/GradingService.php` (lines 119-122)

Cache key uses type value but fallback logic causes cross-contamination:
```php
$cacheKey = 'grading_configs_' . $kknType->value;
// If TERAPANKAN has no configs, it loads REGULER but caches under 'grading_configs_TERAPANKAN'
// Updating REGULER config does NOT invalidate TERAPANKAN cache
```

**Fix:** Use same cache key for fallback or invalidate all dependent caches.

---

### W3. No Score Range Validation in Service
**File:** `app/Services/GradingService.php` (lines 29-105)

Service methods accept `float` with no range validation:
```php
public function submitDPLScores(..., float $finalReportScore, ...) {
    // ❌ Can accept -10 or 150
}
```

**Fix:** Add validation: `abort_if($score < 0 || $score > 100, 422)`.

---

### W4. Missing Columns in Fillable
**File:** `app/Http/Controllers/Admin/RekapNilaiController.php` (lines 243-248)

References `admin_locked_at` and `admin_locked_by` which are NOT in `NilaiKkn::$fillable`.

**Fix:** Add to fillable or verify columns exist in database.

---

### W5. No DB Locking on Finalization
**File:** `app/Http/Controllers/Admin/RekapNilaiController.php` (lines 123-155)

```php
if ($score->is_finalized) abort(409);
$score->update(['is_finalized' => true]); // ❌ Race condition between check and update
```

**Fix:** Use `lockForUpdate()` or optimistic locking.

---

### W6. Unused Group Load (Code Smell)
**File:** `app/Services/GroupSelectionService.php` (lines 108-111)

```php
KelompokKkn::query()
    ->whereKey($registration->kelompok_id)
    ->lockForUpdate()
    ->first(); // ❌ Result not assigned - looks like a bug
```

**Fix:** Assign to variable or comment intent.

---

### W7. Registration Validation Mismatch
**File:** Form request vs Service

Form request uses `whereDate()` but service uses string comparison — can produce different results for same period.

**Fix:** Standardize on Carbon `between()`.

---

### W8. Reject Missing Status Validation
**File:** `app/Http/Controllers/Admin/PesertaKknController.php` (lines 573-583)

Can reject `approved` or `completed` registrations (should only reject `pending`).

**Fix:** Add `->where('status', 'pending')` check.

---

### W9. API Key No IP Rate Limiting
**File:** `app/Http/Middleware/ValidateApiKey.php`

Tracks failures per key but not per IP — distributed brute force possible.

**Fix:** Add IP-based rate limiting.

---

### W10. EnsureAdminAuthorization Faculty Scope Issue
**File:** `app/Http/Middleware/EnsureAdminAuthorization.php`

`faculty_admin` with null `faculty_id` gets empty results silently.

**Fix:** Validate `faculty_id` is present.

---

### W11. API Routes No Global Auth
**File:** `routes/api.php`

Each route adds `auth:sanctum` individually — risk of accidental exposure if developer forgets.

**Fix:** Add global auth middleware group.

---

### W12. Overly Permissive Password Reset Middleware
**File:** `app/Http/Middleware/EnsurePasswordChanged.php` (lines 22-38)

Allows ALL POST requests through when `must_change_password` is true.

**Fix:** Whitelist specific routes only.

---

### W13. Registration Lock Timeout Info Leak
**File:** `app/Services/RegistrationService.php` (lines 216-232)

Error messages reveal group capacity status — can enumerate system state.

**Fix:** Return generic error message.

---

### W14. Document Download Path Traversal Risk
**File:** `app/Http/Controllers/Admin/PesertaKknController.php` (lines 203-237)

`realpath()` can fail with symlinks — `allowedPrefixes` check can be bypassed.

**Fix:** Use strict path validation.

---

### W15. API Key Permissions Additive Only
**File:** `app/Http/Middleware/ValidateApiKey.php` (lines 40-42)

Defaults to `read` permission — write operations not enforced if not specified.

**Fix:** Require explicit permissions on all routes.

---

### W16. Potential Null Pointer in studentsAll
**File:** `app/Http/Controllers/Admin/GeneratorNilaiController.php` (line 111)

```php
$userIds = $registrations->flatten()->pluck('mahasiswa.user_id')
// ❌ If mahasiswa relationship is null, this throws error
```

**Fix:** Add `->filter()` before `pluck()`.

---

### W17. Orphaned Temp Files on Error
**Files:** GeneratorNilaiController, RekapNilaiController

ZIP files created but not cleaned up if exception occurs.

**Fix:** Use try-finally or register shutdown function.

---

### W18. Cache TTL Too Low
**File:** `app/Services/RegistrationPortalService.php` (line 21)

`DEFAULT_SNAPSHOT_TTL_SECONDS = 3` — causes frequent cache misses.

**Fix:** Increase to 30-60 seconds.

---

### W19. Duplicate Participant Count Check
**File:** `app/Services/GroupSelectionService.php`

Capacity check and INSERT are separate queries — TOCTOU window.

**Fix:** Combine into single atomic operation.

---

### W20. Migration Missing: Unique Constraint
**Database:** `peserta_kkn` table

No unique constraint on `(mahasiswa_id, period_id)`.

**Fix:** Add migration with unique index.

---

### W21. Notification Class Inconsistency
Multiple files use different notification classes (`ScorePublished` vs `KknActivityNotification`).

**Fix:** Standardize on single notification class.

---

### W22. No Audit Trail in NilaiAkhirService
**File:** `app/Services/KKN/NilaiAkhirService.php`

Finalizes scores without audit logging.

**Fix:** Add `AuditService::log()` call.

---

### W23. Bypass Laporan Akhir Approval Check
**File:** `app/Services/KKN/NilaiAkhirService.php` (line 57)

Sets `is_finalized = true` without checking report approval.

**Fix:** Add approval check before finalization.

---

### W24. Repeated Computation in Quota Methods
**File:** `app/Services/GroupSelectionService.php`

`maleMinimumPercent()`, `maleTargetRatio()`, etc. called repeatedly — should cache.

**Fix:** Cache computed values.

---

### W25. Download Document Redundant Check
**File:** `app/Http/Controllers/Admin/PesertaKknController.php` (lines 203-218)

`realpath` called after `Storage::exists()` — redundant.

**Fix:** Remove `realpath` or consolidate checks.

---

## 🔵 INFO FINDINGS

### I1. Dead Code: GRADE_SCALE Constant
**File:** `app/Services/GradingService.php` (lines 13-22)

Constant defined but never used — `determineLetterGrade()` delegates to `GradeConversionService`.

**Fix:** Remove constant.

---

### I2. Eligibility Message Not Specific
**File:** `app/Services/EligibilityService.php` (line 60)

Returns "Di luar jadwal registrasi" — doesn't distinguish "belum dibuka" vs "sudah ditutup".

**Fix:** Return specific messages.

---

### I3. Unused kelompok_id Validation
**File:** `StoreRegistrationRequest` validates `kelompok_id` but controller always passes `null`.

**Fix:** Remove validation or implement feature.

---

### I4. RegistrationService Queries Periode Twice
**File:** `app/Services/RegistrationService.php` (lines 30, 111)

Performance: Should reuse locked Periode instance.

---

### I5. AuditObserver Performance Risk
**File:** `app/Observers/AuditObserver.php`

Captures all events on registered models — can cause write amplification.

**Fix:** Selective model registration or async processing.

---

### I6. No Rate Limiting on Exports
**File:** Export endpoints

Can trigger repeated exports causing resource exhaustion.

**Fix:** Add rate limiting.

---

### I7. Address Self-Verification
**File:** `app/Http/Controllers/ProfileController.php`

Users can set `address_verified: true` themselves — no actual verification.

**Fix:** Remove self-verification or add OTP/email confirmation.

---

### I8. MahasiswaPolicy Missing Scope
**File:** `app/Policies/MahasiswaPolicy.php`

`faculty_admin` can list ALL students, not just their faculty.

**Fix:** Add faculty filter.

---

### I9. HomeController Fallback Data Uses ID 0
**File:** `app/Http/Controllers/HomeController.php` (lines 218-265)

Fallback data with `id => 0` can cause lookup confusion.

**Fix:** Use null or UUIDs.

---

### I10. CertificateController No Rate Limiting
Can be triggered repeatedly — resource exhaustion risk.

---

### I11. ReportController Missing Ownership Check
`download()` only checks existence, not ownership.

---

### I12. Webhook Nonce Not Implemented
No replay protection within 5-minute tolerance window.

---

### I13. Password Hashing Uses Bcrypt Default
Consider argon2id for stronger hashing.

---

### I14. Sanctum Token Abilities Not Used
No fine-grained scopes beyond API key permissions.

---

### I15. AdminPolicy and DplPolicy Are Stubs
Only check role membership — no resource-level logic.

---

### I16. AppServiceProvider Breeze Prefix
Ensure no conflicts with custom auth routes.

---

### I17. AuditObserver Generic Naming
`Str::headline` may not match table names — harder to correlate.

---

### I18. API No Versioning
No API versioning — future breaking changes will be difficult.

---

### I19. KKN Throttle Uniform Limits
All routes get same limits — destructive operations should be stricter.

---

### I20. Active Period Middleware Info Disclosure
API requests get 403 with internal details.

**Fix:** Return generic message.

---

### I21. LocationPolicy Delete Without Verification
`faculty_admin` can delete locations with associated groups.

**Fix:** Add foreign key check.

---

### I22. StudentEvaluationPolicy Over-Broad Access
DPL can see ALL students including pending/left.

**Fix:** Filter by `approved` status.

---

### I23. No Unique Constraint Enforcement
Duplicate registrations possible if race condition occurs.

---

### I24. Registration Lock Defaults Too Short
8s TTL / 6s wait — frequent timeouts under load.

---

### I25. Download Document No Rate Limiting
Can enumerate documents by brute force.

---

### I26. Export No Rate Limiting
Resource exhaustion via repeated exports.

---

### I27. Profile Address Verification Bypass
Self-verification allows fake addresses.

---

### I28. Error Messages Reveal System State
Group names and capacity exposed in error messages.

---

## ✅ RECOMMENDED FIXES (Priority Order)

1. **Unify grading formula** — Delete `NilaiAkhirService` or align with `GradingService`
2. **Add ownership verification** — DailyReportController, RegistrationService
3. **Fix faculty scoping** — Bulk approve/reject operations
4. **Add database unique constraint** — `(mahasiswa_id, period_id)` on `peserta_kkn`
5. **Use `hash_equals()`** — Webhook signature comparison
6. **Wrap mass finalization in transaction** — Use `chunkById()`, track failures
7. **Fix column name mismatch** — `periode_id` → `period_id`
8. **Add row-level locking** — Group capacity checks, finalization
9. **Standardize grade scale** — Remove dead `GRADE_SCALE` constant
10. **Fix eligibility check** — Exclude current period
11. **Move execution_score** — From Village to DPL component
12. **Add score range validation** — All grading service methods
13. **Use Carbon `between()`** — Registration window validation
14. **Add API global auth** — Middleware group on all API routes
15. **Redact sensitive data** — Audit logs (PII, passwords)
16. **Add rate limiting** — Exports, downloads, certificates
17. **Fix race conditions** — Capacity checks, group assignment
18. **Remove self-verification** — Address verification in profile
19. **Clean up temp files** — try-finally on ZIP generation
20. **Increase cache TTL** — Registration portal snapshot

---

## 📋 NEXT STEPS

### Immediate (Before Production)
- Fix all **CRITICAL** issues (C1-C18)
- Add database migrations for unique constraints
- Write tests for grading calculations
- Penetration testing on authorization flows

### Short Term (Within 1 Month)
- Fix all **WARNING** issues (W1-W25)
- Implement comprehensive test coverage
- Add monitoring and alerting for race conditions
- Performance optimization (N+1 queries, memory usage)

### Long Term (Within 3 Months)
- Address **INFO** improvements (I1-I28)
- Implement API versioning
- Add comprehensive audit trail
- Security training for development team

---

## 🧪 TESTING RECOMMENDATIONS

1. **Unit Tests:**
   - Grading calculation with known inputs/outputs
   - Eligibility checks for edge cases
   - Group selection with concurrent requests

2. **Integration Tests:**
   - Registration flow with distributed locking
   - Mass finalization job with failures
   - Faculty scoping for all admin operations

3. **Security Tests:**
   - Authorization bypass attempts
   - Race condition exploitation
   - API key brute force
   - Webhook signature forgery

4. **Load Tests:**
   - Concurrent registration (100+ simultaneous)
   - Mass grade finalization (1000+ records)
   - Export generation under load

---

**END OF AUDIT REPORT**

*This audit was performed through static code analysis. Dynamic testing and penetration testing are recommended for comprehensive security validation.*
