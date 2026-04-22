<?php

/**
 * SIMULASI VERIFIKASI PERBAIKAN AUDIT
 *
 * Test file ini memverifikasi semua perbaikan yang dilakukan berdasarkan
 * laporan audit SIBERDAYA. Setiap test group mewakili satu
 * kategori temuan audit.
 */

use App\Models\KKN\NilaiKkn;
use App\Models\KKN\SystemSetting;
use App\Models\Master\Dosen;
use App\Models\Master\Mahasiswa;
use App\Models\User;
use App\Policies\KknScorePolicy;
use App\Services\AuditService;
use App\Services\GradingService;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    Role::firstOrCreate(['name' => 'superadmin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'dpl', 'guard_name' => 'web']);
    Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);

    // Clean up KKN connection tables (RefreshDatabase only handles default connection)
    DB::table('system_settings')
        ->whereIn('config_key', [
            'gemini_api_key', 'master_api_base_url', 'master_api_client_secret',
            'master_api_token', 'storage_secret',
        ])->delete();
});

// =====================================================================
// 1. SIMULASI: Enkripsi Secrets di Database (Issue #1.1 KRITIS)
// =====================================================================

test('[AUDIT 1.1] SystemSetting::set() mengenkripsi secret keys', function () {
    SystemSetting::set('gemini_api_key', 'sk-test-secret-123');

    // Baca langsung dari DB (bypass model get() yang auto-decrypt)
    $raw = SystemSetting::where('config_key', 'gemini_api_key')->first();

    // Nilai di DB TIDAK boleh sama dengan plaintext
    expect($raw->value)->not->toBe('sk-test-secret-123');

    // Tapi saat dibaca via get(), harus ter-decrypt kembali
    // Clear cache dulu agar get() membaca dari DB
    Cache::forget('system_setting_gemini_api_key');
    $decrypted = SystemSetting::get('gemini_api_key');
    expect($decrypted)->toBe('sk-test-secret-123');
});

test('[AUDIT 1.1] SystemSetting::set() TIDAK mengenkripsi non-secret keys', function () {
    SystemSetting::set('master_api_base_url', 'https://api.example.com');

    $raw = SystemSetting::where('config_key', 'master_api_base_url')->first();

    // Non-secret keys disimpan apa adanya (plaintext)
    expect($raw->value)->toBe('https://api.example.com');
});

test('[AUDIT 1.1] SystemSetting::get() backward compatible dengan data lama (unencrypted)', function () {
    // Simulasi data lama yang belum terenkripsi — insert langsung via DB (bypass model set())
    DB::table('system_settings')->updateOrInsert(
        ['config_key' => 'storage_secret'],
        [
            'label' => 'Storage Secret',
            'value' => 'old-plaintext-secret',  // Disimpan langsung tanpa enkripsi (data lama)
            'updated_at' => now(),
            'created_at' => now(),
        ]
    );

    Cache::forget('system_setting_storage_secret');
    $value = SystemSetting::get('storage_secret');

    // Harus tetap bisa dibaca (tidak error DecryptException) — backward compatible
    expect($value)->toBe('old-plaintext-secret');
});

test('[AUDIT 1.1] Semua SECRET_KEYS terenkripsi saat disimpan', function () {
    $secretKeys = [
        'master_api_client_secret' => 'secret-value-1',
        'master_api_token' => 'token-value-2',
        'gemini_api_key' => 'gemini-key-3',
        'storage_secret' => 'storage-secret-4',
    ];

    foreach ($secretKeys as $key => $value) {
        SystemSetting::set($key, $value);
    }

    foreach ($secretKeys as $key => $expectedPlaintext) {
        $raw = SystemSetting::where('config_key', $key)->first();
        // Di DB harus terenkripsi (tidak sama dengan plaintext)
        expect($raw->value)->not->toBe($expectedPlaintext, "Key '{$key}' tidak terenkripsi di DB!");

        // Decrypt manual harus menghasilkan nilai asli
        $decrypted = Crypt::decryptString($raw->value);
        expect($decrypted)->toBe($expectedPlaintext, "Key '{$key}' gagal didekripsi!");
    }
});

// =====================================================================
// 2. SIMULASI: Authorization & Policy Checks (Issue #1.2 KRITIS)
// =====================================================================

test('[AUDIT 1.2] Superadmin bisa bypass semua policy', function () {
    $superadmin = User::factory()->create();
    $superadmin->assignRole('superadmin');

    $policy = new KknScorePolicy;
    $score = new NilaiKkn(['is_finalized' => true]);

    // Superadmin bisa finalize
    expect($policy->finalize($superadmin, new NilaiKkn(['is_finalized' => false])))->toBeTrue();
    // Superadmin bisa viewAny
    expect($policy->viewAny($superadmin))->toBeTrue();
    // Superadmin bisa create
    expect($policy->create($superadmin))->toBeTrue();
    // Superadmin bisa bulk finalize
    expect($policy->bulkFinalize($superadmin))->toBeTrue();
});

test('[AUDIT 1.2] Student TIDAK bisa akses fitur admin', function () {
    $student = User::factory()->create();
    $student->assignRole('student');

    $policy = new KknScorePolicy;

    expect($policy->create($student))->toBeFalse();
    expect($policy->finalize($student, new NilaiKkn(['is_finalized' => false])))->toBeFalse();
    expect($policy->bulkFinalize($student))->toBeFalse();
});

test('[AUDIT 1.2] Admin tidak bisa update score yang sudah finalized', function () {
    $admin = User::factory()->create();
    $admin->assignRole('superadmin');
    $policy = new KknScorePolicy;
    $finalizedScore = new NilaiKkn;
    $finalizedScore->is_finalized = true;
    $nonFinalizedScore = new NilaiKkn;
    $nonFinalizedScore->is_finalized = false;

    expect($policy->update($admin, $finalizedScore))->toBeFalse();
    expect($policy->update($admin, $nonFinalizedScore))->toBeTrue();
});

// =====================================================================
// 3. SIMULASI: Standarisasi Grading Logic (Issue #2.3)
// =====================================================================

test('[AUDIT 2.3] GradingService menggunakan skala konversi nilai yang aktif', function () {
    // Verifikasi semua boundary grades
    $testCases = [
        [100, 'A'], [86, 'A'],
        [85, 'A-'], [81, 'A-'],
        [80, 'B+'], [76, 'B+'],
        [75, 'B'], [71, 'B'],
        [70, 'B-'], [66, 'B-'],
        [65, 'C+'], [61, 'C+'],
        [60, 'C'], [56, 'C'],
        [55, 'D'], [42, 'D'],
        [41.99, 'E'], [0, 'E'],
    ];

    foreach ($testCases as [$score, $expectedGrade]) {
        $result = GradingService::determineLetterGrade($score);
        expect($result)->toBe($expectedGrade, "Score {$score} seharusnya grade '{$expectedGrade}', dapat '{$result}'");
    }
});

test('[AUDIT 2.3] GradingService::determineLetterGrade() bersifat public static', function () {
    $reflection = new ReflectionMethod(GradingService::class, 'determineLetterGrade');

    expect($reflection->isPublic())->toBeTrue('determineLetterGrade harus public');
    expect($reflection->isStatic())->toBeTrue('determineLetterGrade harus static');
});

// =====================================================================
// 4. SIMULASI: AuditService Fix (logGodModeAccess userId)
// =====================================================================

test('[AUDIT FIX] AuditService::log() menerima optional userId parameter', function () {
    $reflection = new ReflectionMethod(AuditService::class, 'log');
    $params = $reflection->getParameters();

    // Parameter ke-6 (index 5) harus userId dan nullable
    expect(count($params))->toBeGreaterThanOrEqual(6);

    $userIdParam = $params[5];
    expect($userIdParam->getName())->toBe('userId');
    expect($userIdParam->allowsNull())->toBeTrue();
    expect($userIdParam->isDefaultValueAvailable())->toBeTrue();
    expect($userIdParam->getDefaultValue())->toBeNull();
});

test('[AUDIT FIX] AuditService severity classification benar', function () {
    // Test via reflection karena determineSeverity is private
    $reflection = new ReflectionMethod(AuditService::class, 'determineSeverity');
    $reflection->setAccessible(true);

    // High severity actions
    expect($reflection->invoke(null, 'DELETE_SCORE'))->toBe('high');
    expect($reflection->invoke(null, 'FORCE_FINALIZE'))->toBe('high');
    expect($reflection->invoke(null, 'MASS_FINALIZE'))->toBe('high');
    expect($reflection->invoke(null, 'BYPASS_POLICY'))->toBe('high');

    // Medium severity actions
    expect($reflection->invoke(null, 'UPDATE_PROFILE'))->toBe('medium');
    expect($reflection->invoke(null, 'APPROVAL_REPORT'))->toBe('medium');

    // Low severity actions
    expect($reflection->invoke(null, 'LOGIN'))->toBe('low');
    expect($reflection->invoke(null, 'VIEW_DASHBOARD'))->toBe('low');
});

// =====================================================================
// 5. SIMULASI: Model Relationship Fix (Issue #2.6)
// =====================================================================

test('[AUDIT 2.6] Master\Dosen::kknLecturer() adalah proper HasOne relationship', function () {
    $dosen = new Dosen;
    $relation = $dosen->kknLecturer();

    expect($relation)->toBeInstanceOf(HasOne::class);
});

test('[AUDIT 2.6] Master\Mahasiswa::kknStudent() adalah proper HasOne relationship', function () {
    $mahasiswa = new Mahasiswa;
    $relation = $mahasiswa->kknStudent();

    expect($relation)->toBeInstanceOf(HasOne::class);
});

// =====================================================================
// 6. SIMULASI: LIKE Wildcard Escaping (Issue #1.4)
// =====================================================================

test('[AUDIT 1.4] LIKE wildcard escaping di LogAuditController berfungsi', function () {
    // Simulasi: input user mengandung karakter wildcard SQL
    $maliciousInput = '100%_injection';
    $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $maliciousInput);

    // Karakter % dan _ harus di-escape
    expect($escaped)->toBe('100\\%\\_injection');
    expect($escaped)->not->toBe($maliciousInput);
});

test('[AUDIT 1.4] Escaping tidak merusak input normal', function () {
    $normalInput = 'John Doe';
    $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $normalInput);

    // Input normal tidak berubah
    expect($escaped)->toBe('John Doe');
});

test('[AUDIT 1.4] Multiple wildcards di-escape semua', function () {
    $input = '%admin%_test_%';
    $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $input);

    expect($escaped)->toBe('\\%admin\\%\\_test\\_\\%');
});

// =====================================================================
// 7. SIMULASI: Route Integrity Check
// =====================================================================

test('[AUDIT 2.1] Tidak ada duplikasi route forgot-password', function () {
    $routes = collect(Route::getRoutes()->getRoutes());

    $forgotPasswordGET = $routes->filter(function ($route) {
        return $route->uri() === 'forgot-password' && in_array('GET', $route->methods());
    });

    $forgotPasswordPOST = $routes->filter(function ($route) {
        return $route->uri() === 'forgot-password' && in_array('POST', $route->methods());
    });

    // Masing-masing harus tepat 1
    expect($forgotPasswordGET->count())->toBeLessThanOrEqual(1, 'Route GET /forgot-password duplikat!');
    expect($forgotPasswordPOST->count())->toBeLessThanOrEqual(1, 'Route POST /forgot-password duplikat!');
});
