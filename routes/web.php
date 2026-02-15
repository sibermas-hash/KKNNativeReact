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



    Route::prefix('admin')->middleware('role:admin|superadmin')->name('admin.')->group(function () {
        Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');

        // Grades manual input
        Route::get('grades', [Admin\GradeController::class, 'index'])->name('grades.index');
        Route::post('grades', [Admin\GradeController::class, 'store'])->name('grades.store');
        Route::get('groups/{group}/students', [Admin\GradeController::class, 'students'])->name('groups.students');

        // Master Data
        Route::resource('academic-years', Admin\TahunAkademikController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['academic-years' => 'tahunAkademik']);
        Route::resource('periods', Admin\PeriodeController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['periods' => 'periode']);
        Route::resource('faculties', Admin\FakultasController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['faculties' => 'fakultas']);
        Route::resource('programs', Admin\ProdiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['programs' => 'prodi']);
        Route::resource('locations', Admin\LokasiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['locations' => 'lokasi']);

        // Groups
        Route::resource('groups', Admin\KelompokKknController::class)
            ->only(['index', 'show', 'store', 'update', 'destroy'])
            ->parameters(['groups' => 'kelompokKkn']);

        // Users & Roles
        Route::get('users', [Admin\UserController::class, 'index'])->name('users.index');
        Route::get('users/create', [Admin\UserController::class, 'create'])->name('users.create');
        Route::post('users', [Admin\UserController::class, 'store'])->name('users.store');
        Route::patch('users/{user}/toggle-active', [Admin\UserController::class, 'toggleActive'])->name('users.toggle-active');

        // Specialized User Management
        Route::get('dpl', [Admin\UserController::class, 'dosenIndex'])->name('dpl.index');
        Route::get('mahasiswa', [Admin\UserController::class, 'mahasiswaIndex'])->name('mahasiswa.index');

        // DPL Assignment
        Route::get('dpl/assignment', [Admin\DplAssignmentController::class, 'index'])->name('dpl.assignment');
        Route::post('dpl/assign-period', [Admin\DplAssignmentController::class, 'assignToPeriod'])->name('dpl.assign-period');
        Route::post('dpl/assign-group/{group}', [Admin\DplAssignmentController::class, 'assignToGroup'])->name('dpl.assign-group');
        Route::patch('dpl/remove-period/{dplPeriod}', [Admin\DplAssignmentController::class, 'removeDplFromPeriod'])->name('dpl.remove-period');
        Route::get('api/available-dpl', [Admin\DplAssignmentController::class, 'getAvailableDpl'])->name('api.available-dpl');

        // Student Transfer
        Route::get('peserta/transfer', [Admin\StudentTransferController::class, 'index'])->name('peserta.transfer.index');
        Route::post('peserta/transfer', [Admin\StudentTransferController::class, 'transfer'])->name('peserta.transfer');
        Route::get('api/transfer-targets', [Admin\StudentTransferController::class, 'getTransferTargets'])->name('api.transfer-targets');

        // Registrations
        Route::get('registrations', [Admin\PesertaKknController::class, 'index'])->name('registrations.index');
        Route::get('registrations/{pesertaKkn}', [Admin\PesertaKknController::class, 'show'])->name('registrations.show');
        Route::patch('registrations/{pesertaKkn}/approve', [Admin\PesertaKknController::class, 'approve'])->name('registrations.approve');
        Route::patch('registrations/{pesertaKkn}/reject', [Admin\PesertaKknController::class, 'reject'])->name('registrations.reject');
        Route::patch('registrations/{pesertaKkn}/assign-group', [Admin\PesertaKknController::class, 'assignGroup'])->name('registrations.assign-group');

        // Advanced Activity Management (God Mode Global)
        Route::get('reports', [App\Http\Controllers\ReportController::class, 'index'])->name('reports.index');
        Route::get('reports/daily', [Admin\KegiatanKknController::class, 'index'])->name('reports.daily.index');
        Route::get('reports/work-programs', [Admin\ProgramKerjaController::class, 'index'])->name('reports.work-programs.index');
        Route::get('reports/final', [Admin\LaporanAkhirController::class, 'index'])->name('reports.final.index');
        
        // Grading Configuration
        Route::get('grading-settings', [Admin\KonfigurasiPenilaianController::class, 'index'])->name('grading-settings.index');
        Route::post('grading-settings', [Admin\KonfigurasiPenilaianController::class, 'update'])->name('grading-settings.update');
        Route::get('grade-generator', [Admin\GeneratorNilaiController::class, 'index'])->name('grade-generator.index');
        Route::get('grade-generator/groups/all/students', [Admin\GeneratorNilaiController::class, 'studentsAll'])->name('grade-generator.students-all');
        Route::get('grade-generator/groups/{kelompokKkn}/students', [Admin\GeneratorNilaiController::class, 'students'])->name('grade-generator.students');
        Route::post('grade-generator/scores', [Admin\GeneratorNilaiController::class, 'saveScores'])->name('grade-generator.save-scores');
        Route::get('grade-generator/export/{id}', [Admin\GeneratorNilaiController::class, 'exportExcel'])->name('grade-generator.export');
        Route::get('grade-generator/export-pdf/{id}', [Admin\GeneratorNilaiController::class, 'exportPdf'])->name('grade-generator.export-pdf');
        Route::get('grade-generator/export-zip', [Admin\GeneratorNilaiController::class, 'exportZip'])->name('grade-generator.export-zip');


        // Rekap Nilai
        Route::get('rekap-nilai', [Admin\RekapNilaiController::class, 'index'])->name('rekap-nilai.index');
        Route::get('rekap-nilai/export', [Admin\RekapNilaiController::class, 'export'])->name('rekap-nilai.export');
        Route::get('rekap-nilai/bulk-certificates', [Admin\RekapNilaiController::class, 'bulkCertificates'])->name('rekap-nilai.bulk-certificates');
        Route::post('rekap-nilai/finalize-mass', [Admin\RekapNilaiController::class, 'finalizeMass'])->name('rekap-nilai.finalize-mass');
        Route::get('rekap-nilai/{score}/certificate', [Admin\RekapNilaiController::class, 'downloadCertificate'])->name('rekap-nilai.certificate');

        // Audit Log
        Route::get('audit-log', [Admin\LogAuditController::class, 'index'])->name('audit-log.index');
        Route::get('audit-log/{logAudit}', [Admin\LogAuditController::class, 'show'])->name('audit-log.show');

        // Report Exports
        Route::get('export/daily-reports/group/{groupId}', [App\Http\Controllers\ReportExportController::class, 'downloadGroupDailyReports'])->name('export.daily-reports.group');
        Route::get('export/daily-reports/student/{studentId}', [App\Http\Controllers\ReportExportController::class, 'downloadStudentDailyReports'])->name('export.daily-reports.student');

        // Evaluations
        Route::get('evaluations', [Admin\EvaluasiController::class, 'index'])->name('evaluations.index');

        // Workshops
        Route::get('workshops', [App\Http\Controllers\WorkshopController::class, 'index'])->name('workshops.index');
        Route::post('workshops', [App\Http\Controllers\WorkshopController::class, 'store'])->name('workshops.store');

        // Proposals
        Route::get('proposals', [App\Http\Controllers\ProposalController::class, 'index'])->name('proposals.index');
        Route::post('proposals/{id}/review', [App\Http\Controllers\ProposalController::class, 'review'])->name('proposals.review');
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
