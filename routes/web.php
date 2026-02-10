<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin;
use App\Http\Controllers\Dpl;
use App\Http\Controllers\Student;
use Illuminate\Support\Facades\Route;

// Guest routes
Route::middleware(['guest', 'kkn.throttle'])->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class, 'store'])->name('login.store');

    // Password Reset
    Route::get('/forgot-password', [PasswordResetController::class, 'showForgotForm'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class, 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class, 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class, 'reset'])->name('password.update');
});

// Authenticated routes
Route::middleware(['auth', 'kkn.throttle'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');

    // Profile
    Route::get('/profile', [ProfileController::class, 'show'])->name('profile.show');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class, 'updateAvatar'])->name('profile.avatar');
    Route::post('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Root redirect based on role
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // ─── Admin ──────────────────────────────────────────────────────
    Route::prefix('admin')->middleware('role:admin')->name('admin.')->group(function () {
        Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');

        // Master Data
        Route::resource('academic-years', Admin\AcademicYearController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['academic-years' => 'academicYear']);
        Route::resource('periods', Admin\PeriodController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('faculties', Admin\FacultyController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('programs', Admin\ProgramController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::resource('locations', Admin\LocationController::class)->only(['index', 'store', 'update', 'destroy']);

        // Groups
        Route::resource('groups', Admin\GroupController::class)->only(['index', 'show', 'store', 'update', 'destroy']);

        // Users
        Route::get('users', [Admin\UserController::class, 'index'])->name('users.index');
        Route::get('users/create', [Admin\UserController::class, 'create'])->name('users.create');
        Route::post('users', [Admin\UserController::class, 'store'])->name('users.store');
        Route::patch('users/{user}/toggle-active', [Admin\UserController::class, 'toggleActive'])->name('users.toggle-active');

        // Registrations
        Route::get('registrations', [Admin\RegistrationController::class, 'index'])->name('registrations.index');
        Route::get('registrations/{registration}', [Admin\RegistrationController::class, 'show'])->name('registrations.show');
        Route::patch('registrations/{registration}/approve', [Admin\RegistrationController::class, 'approve'])->name('registrations.approve');
        Route::patch('registrations/{registration}/reject', [Admin\RegistrationController::class, 'reject'])->name('registrations.reject');
        Route::patch('registrations/{registration}/assign-group', [Admin\RegistrationController::class, 'assignGroup'])->name('registrations.assign-group');

        // Advanced Activity Management (God Mode Global)
        Route::get('reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('evaluations', [App\Http\Controllers\GradingController::class, 'index'])->name('evaluations.index');
        Route::post('evaluations/dpl', [App\Http\Controllers\GradingController::class, 'submitDPLScores'])->name('evaluations.submit-dpl');
        Route::post('evaluations/village', [App\Http\Controllers\GradingController::class, 'submitVillageScores'])->name('evaluations.submit-village');
        Route::post('evaluations/admin', [App\Http\Controllers\GradingController::class, 'submitAdminScores'])->name('evaluations.submit-admin');
        Route::get('workshops', [App\Http\Controllers\WorkshopController::class, 'index'])->name('workshops.index');
        Route::post('workshops', [App\Http\Controllers\WorkshopController::class, 'store'])->name('workshops.store');
        
        // Proposals
        Route::get('proposals', [App\Http\Controllers\ProposalController::class, 'index'])->name('proposals.index');
        Route::post('proposals/{proposal}/review', [App\Http\Controllers\ProposalController::class, 'review'])->name('proposals.review');
        
        // Grading Configuration
        Route::get('grading-settings', [Admin\GradingConfigController::class, 'index'])->name('grading-settings.index');
        Route::post('grading-settings', [Admin\GradingConfigController::class, 'update'])->name('grading-settings.update');

        // Rekap Nilai
        Route::get('rekap-nilai', [Admin\RekapNilaiController::class, 'index'])->name('rekap-nilai.index');
        Route::get('rekap-nilai/export', [Admin\RekapNilaiController::class, 'export'])->name('rekap-nilai.export');
        Route::get('rekap-nilai/bulk-certificates', [Admin\RekapNilaiController::class, 'bulkCertificates'])->name('rekap-nilai.bulk-certificates');
        Route::post('rekap-nilai/finalize-mass', [Admin\RekapNilaiController::class, 'finalizeMass'])->name('rekap-nilai.finalize-mass');
        Route::get('rekap-nilai/{score}/certificate', [Admin\RekapNilaiController::class, 'downloadCertificate'])->name('rekap-nilai.certificate');

        // Audit Log
        Route::get('audit-log', [Admin\AuditLogController::class, 'index'])->name('audit-log.index');
        Route::get('audit-log/{auditLog}', [Admin\AuditLogController::class, 'show'])->name('audit-log.show');

        // Report Exports
        Route::get('export/daily-reports/group/{groupId}', [App\Http\Controllers\ReportExportController::class, 'downloadGroupDailyReports'])->name('export.daily-reports.group');
        Route::get('export/daily-reports/student/{studentId}', [App\Http\Controllers\ReportExportController::class, 'downloadStudentDailyReports'])->name('export.daily-reports.student');
    });

    // ─── DPL (Dosen Pembimbing Lapangan) ────────────────────────────
    Route::prefix('dpl')->middleware('role:dpl')->name('dpl.')->group(function () {
        Route::get('/', [Dpl\DashboardController::class, 'index'])->name('dashboard');

        // Groups
        Route::get('groups', [Dpl\GroupController::class, 'index'])->name('groups.index');
        Route::get('groups/{group}', [Dpl\GroupController::class, 'show'])->name('groups.show');

        // Daily Reports
        Route::get('daily-reports', [Dpl\DailyReportController::class, 'index'])->name('daily-reports.index');
        Route::get('daily-reports/{dailyReport}', [Dpl\DailyReportController::class, 'show'])->name('daily-reports.show');
        Route::patch('daily-reports/{dailyReport}/approve', [Dpl\DailyReportController::class, 'approve'])->name('daily-reports.approve');
        Route::patch('daily-reports/{dailyReport}/revision', [Dpl\DailyReportController::class, 'revision'])->name('daily-reports.revision');

        // Report Exports
        Route::get('export/daily-reports/group/{groupId}', [App\Http\Controllers\ReportExportController::class, 'downloadGroupDailyReports'])->name('export.daily-reports.group');
        Route::get('export/daily-reports/student/{studentId}', [App\Http\Controllers\ReportExportController::class, 'downloadStudentDailyReports'])->name('export.daily-reports.student');

        // Evaluations
        Route::get('evaluations', [Dpl\EvaluationController::class, 'index'])->name('evaluations.index');
        Route::post('evaluations/import', [Dpl\EvaluationController::class, 'import'])->name('evaluations.import');
        Route::get('evaluations/create', [Dpl\EvaluationController::class, 'create'])->name('evaluations.create');
        Route::post('evaluations', [Dpl\EvaluationController::class, 'store'])->name('evaluations.store');
    });

    // ─── Student ────────────────────────────────────────────────────
    Route::prefix('student')->middleware('role:student')->name('student.')->group(function () {
        Route::get('/', [Student\DashboardController::class, 'index'])->name('dashboard');

        // Registration
        Route::get('register', [Student\RegistrationController::class, 'create'])->name('registration.create');
        Route::post('register', [Student\RegistrationController::class, 'store'])->name('registration.store');

        // Daily Reports
        Route::resource('daily-reports', Student\DailyReportController::class)
            ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            ->parameters(['daily-reports' => 'dailyReport']);
        Route::get('daily-reports/download-compilation', [App\Http\Controllers\ReportExportController::class, 'downloadMyDailyReports'])->name('daily-reports.download-compilation');

        // Work Programs
        Route::get('work-programs', [Student\WorkProgramController::class, 'index'])->name('work-programs.index');
        Route::get('work-programs/create', [Student\WorkProgramController::class, 'create'])->name('work-programs.create');
        Route::post('work-programs', [Student\WorkProgramController::class, 'store'])->name('work-programs.store');

        // Final Report
        Route::get('final-report', [Student\FinalReportController::class, 'create'])->name('final-report.create');
        Route::post('final-report', [Student\FinalReportController::class, 'store'])->name('final-report.store');

        // Evaluations (read-only)
        Route::get('evaluations', [Student\EvaluationController::class, 'index'])->name('evaluations.index');

        // New Activities
        Route::get('reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::post('reports/upload', [App\Http\Controllers\ReportController::class, 'upload'])->name('reports.upload');
        Route::get('workshops', [App\Http\Controllers\WorkshopController::class, 'index'])->name('workshops.index');
        Route::post('workshops/{workshop}/register', [App\Http\Controllers\WorkshopController::class, 'register'])->name('workshops.register');
        
        Route::get('proposals', [App\Http\Controllers\ProposalController::class, 'index'])->name('proposals.index');
        Route::post('proposals', [App\Http\Controllers\ProposalController::class, 'store'])->name('proposals.store');
    });

    // Notifications (Global)
    Route::prefix('api/notifications')->name('api.notifications.')->group(function () {
        Route::get('/unread', [App\Http\Controllers\Api\NotificationController::class, 'unread'])->name('unread');
        Route::post('/{id}/read', [App\Http\Controllers\Api\NotificationController::class, 'markRead'])->name('mark-read');
        Route::post('/read-all', [App\Http\Controllers\Api\NotificationController::class, 'markAllRead'])->name('mark-all-read');
    });
    // Certificates
    Route::get('/certificates/{score}/download', [App\Http\Controllers\CertificateController::class, 'download'])->name('certificates.download');
    Route::get('/admin/certificates/bulk-download', [App\Http\Controllers\CertificateController::class, 'downloadMass'])->name('admin.certificates.bulk-download');
});
