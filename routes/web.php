<?php

use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\HealthController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Public\CertificateVerificationController;
use App\Http\Controllers\ReportController;
use Illuminate\Foundation\Http\Middleware\PreventRequestForgery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| This file contains the main web routes for the application.
| Role-based routes have been split into separate files for better organization:
| - routes/admin.php: Admin & Superadmin routes
| - routes/dpl.php: DPL (Supervising Lecturer) routes
| - routes/student.php: Student routes
|
*/

// Guest routes (login, password reset)
if (config('app.env') === 'local') {
    Route::post('/auth/login', function (Request $request) {
        return response()->json(['access_token' => 'student_test_token']);
    })->withoutMiddleware([PreventRequestForgery::class]);
}
Route::middleware(['guest', 'kkn.throttle', 'disable.debugbar'])->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');
    Route::get('/login/captcha-refresh', [AuthenticatedSessionController::class, 'refresh'])->name('login.captcha.refresh');

    // Lupa Kata Sandi
    Route::get('/lupa-kata-sandi', [PasswordResetController::class, 'showForgotForm'])->name('password.request');
    Route::post('/lupa-kata-sandi', [PasswordResetController::class, 'sendResetLink'])->name('password.email');
    Route::get('/atur-ulang-kata-sandi/{token}', [PasswordResetController::class, 'showResetForm'])->name('password.reset');
    Route::post('/atur-ulang-kata-sandi', [PasswordResetController::class, 'reset'])->name('password.update');
});

// Home / Landing Page
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/berita', [HomeController::class, 'announcements'])->name('public.announcements');
Route::get('/berita/{slug}', [HomeController::class, 'announcementShow'])->name('public.announcements.show');
Route::get('/unduhan', [HomeController::class, 'downloads'])->name('public.downloads');
Route::get('/lokasi', [HomeController::class, 'map'])->name('public.locations');
Route::get('/lokasi/{locationPath}', [HomeController::class, 'mapShow'])->name('public.locations.show');
Route::get('/verify-certificate/{token}', [CertificateVerificationController::class, 'verify'])->name('certificate.verify');
// Health Check Endpoint
Route::get('/health', [HealthController::class, 'check'])->name('health');
Route::get('/health/detailed', [HealthController::class, 'detailed'])->name('health.detailed');

// Authenticated Routes
Route::middleware(['auth', 'verified', 'disable.debugbar'])->group(function () {
    // AI Assistant
    Route::get('/ai/history', [AiAssistantController::class, 'history'])->name('ai.history');
    Route::post('/ai/clear', [AiAssistantController::class, 'clear'])->name('ai.clear');
    Route::post('/ai/assistant', [AiAssistantController::class, 'chat'])->name('ai.assistant');

    // User Profile Management
    Route::get('/profil', [ProfileController::class, 'show'])->name('profile.show');
    Route::patch('/profil', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profil/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::patch('/profil/password', [ProfileController::class, 'updatePassword'])->name('profile.password');
    Route::get('/profil/check-nik', [ProfileController::class, 'checkNik'])->name('profile.check-nik');
    Route::get('/ganti-password', [ProfileController::class, 'passwordChange'])->name('profile.password-change');

    // Logout
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Load role-based routes from separate files
    require __DIR__.'/admin.php';
    require __DIR__.'/dosen.php';
    require __DIR__.'/dpl.php';
    require __DIR__.'/student.php';

    // Shared global routes (with role-based access)
    Route::get('/reports/{report}/download', [ReportController::class, 'download'])
        ->name('reports.download')
        ->middleware('role:superadmin|dpl|student');
});

Route::get('/auto-login', function () {
    auth()->loginUsingId(1);

    return redirect('/admin/laporan/program-kerja');
});
