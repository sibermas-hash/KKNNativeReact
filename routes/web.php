<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
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
Route::get('/', [\App\Http\Controllers\HomeController::class, 'index'])->name('home');
Route::get('/profil', [\App\Http\Controllers\HomeController::class, 'about'])->name('public.about');
Route::get('/skema-kkn', [\App\Http\Controllers\HomeController::class, 'schemes'])->name('public.schemes');
Route::get('/warta', [\App\Http\Controllers\HomeController::class, 'announcements'])->name('public.announcements');
Route::get('/repositori', [\App\Http\Controllers\HomeController::class, 'downloads'])->name('public.downloads');
Route::get('/cari-lokasi', [\App\Http\Controllers\HomeController::class, 'locations'])->name('public.locations');

// Health Check Endpoint
Route::get('/health', [\App\Http\Controllers\HealthController::class, 'check'])->name('health');
Route::get('/health/detailed', [\App\Http\Controllers\HealthController::class, 'detailed'])->name('health.detailed');

// Public certificate verification
Route::get('/certificates/verify/{token}', [\App\Http\Controllers\CertificateController::class, 'verify'])
    ->name('public.certificate.verify')
    ->middleware('throttle:20,1');

// Authenticated routes
Route::middleware(['auth', 'kkn.throttle'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Profil Saya
    Route::get('/profil-saya', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/profil-saya', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profil-saya/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::post('/profil-saya/kata-sandi', [ProfileController::class, 'updatePassword'])->name('profile.password');

    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::post('/ai/assistant', [App\Http\Controllers\AiAssistantController::class, 'chat'])->name('ai.assistant');

    // Load role-based routes from separate files
    require __DIR__.'/admin.php';
    require __DIR__.'/dpl.php';
    require __DIR__.'/student.php';

    // Shared global routes (with role-based access)
    Route::get('/reports/{report}/download', [App\Http\Controllers\ReportController::class, 'download'])
        ->name('reports.download')
        ->middleware('role:superadmin|dpl|student');
});
