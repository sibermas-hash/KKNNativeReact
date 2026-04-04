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
    Route::get('/login', [AuthenticatedSessionController::class , 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class , 'store'])->name('login.store');

    // Password Reset
    Route::get('/forgot-password', [PasswordResetController::class , 'showForgotForm'])->name('password.request');
    Route::post('/forgot-password', [PasswordResetController::class , 'sendResetLink'])->name('password.email');
    Route::get('/reset-password/{token}', [PasswordResetController::class , 'showResetForm'])->name('password.reset');
    Route::post('/reset-password', [PasswordResetController::class , 'reset'])->name('password.update');
});

// Home / Landing Page
Route::get('/', [\App\Http\Controllers\HomeController::class, 'index'])->name('home');
Route::get('/profil', [\App\Http\Controllers\HomeController::class, 'about'])->name('public.about');
Route::get('/skema-kkn', [\App\Http\Controllers\HomeController::class, 'schemes'])->name('public.schemes');
Route::get('/warta', [\App\Http\Controllers\HomeController::class, 'announcements'])->name('public.announcements');
Route::get('/repositori', [\App\Http\Controllers\HomeController::class, 'downloads'])->name('public.downloads');

// Authenticated routes
Route::middleware(['auth', 'kkn.throttle'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class , 'destroy'])->name('logout');

    // Profile
    Route::get('/profile', [ProfileController::class , 'show'])->name('profile.show');
    Route::put('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::post('/profile/avatar', [ProfileController::class , 'updateAvatar'])->name('profile.avatar');
    Route::post('/profile/password', [ProfileController::class , 'updatePassword'])->name('profile.password');

    Route::get('/dashboard', [DashboardController::class , 'index'])->name('dashboard');

    Route::middleware(['role:superadmin|faculty_admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('rekap-nilai', [Admin\RekapNilaiController::class , 'index'])->name('rekap-nilai.index');
    });

    // ==========================================
    // ADMIN AREA (Superadmin Only)
    // ==========================================
    Route::middleware(['role:superadmin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('/', [Admin\DashboardController::class , 'index'])->name('dasbor');
        Route::get('tactical-preview', function () {
            return inertia('Admin/TacticalDashboard');
        })->name('tactical-preview');

        // Master Data
        Route::resource('academic-years', Admin\TahunAkademikController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['academic-years' => 'tahunAkademik']);
        Route::resource('periods', Admin\PeriodeController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['periods' => 'periode']);
        Route::post('periods/{periode}/duplicate', [Admin\PeriodeController::class , 'duplicate'])->name('periods.duplicate');
        Route::get('periods/export', [Admin\PeriodeController::class, 'export'])->name('periods.export');
        Route::resource('faculties', Admin\FakultasController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['faculties' => 'fakultas']);
        Route::resource('programs', Admin\ProdiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['programs' => 'prodi']);
        Route::post('locations/import', [Admin\LokasiController::class, 'import'])->name('locations.import');
        Route::resource('locations', Admin\LokasiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['locations' => 'lokasi']);
        Route::get('workshops', [App\Http\Controllers\WorkshopController::class , 'index'])->name('workshops.index');

        // Groups & Operations
        Route::resource('groups', Admin\KelompokKknController::class)
            ->only(['index', 'show', 'store', 'update', 'destroy'])
            ->parameters(['groups' => 'kelompokKkn']);
        Route::get('users', [Admin\UserController::class , 'index'])->name('users.index');
        Route::get('users/create', [Admin\UserController::class , 'create'])->name('users.create');
        Route::post('users', [Admin\UserController::class , 'store'])->name('users.store');
        Route::patch('users/{user}/toggle-active', [Admin\UserController::class , 'toggleActive'])->name('users.toggle-active');
        Route::get('dpl', [Admin\UserController::class , 'dosenIndex'])->name('dpl.index');
        Route::get('mahasiswa', [Admin\UserController::class , 'mahasiswaIndex'])->name('mahasiswa.index');
        Route::get('mahasiswa/sync', [Admin\StudentSyncController::class , 'index'])->name('mahasiswa.sync');
        Route::post('mahasiswa/sync', [Admin\StudentSyncController::class , 'sync'])->name('mahasiswa.sync.store');
        
        Route::get('dpl/assignment', [Admin\DplAssignmentController::class , 'index'])->name('dpl.assignment');
        Route::get('dpl/sync', [Admin\DplSyncController::class , 'index'])->name('dpl.sync');
        Route::post('dpl/sync', [Admin\DplSyncController::class , 'sync'])->name('dpl.sync.store');
        Route::post('dpl/assign-period', [Admin\DplAssignmentController::class , 'assignToPeriod'])->name('dpl.assign-period');
        Route::post('dpl/assign-group/{group}', [Admin\DplAssignmentController::class , 'assignToGroup'])->name('dpl.assign-group');
        Route::post('dpl/assign-district', [Admin\DplAssignmentController::class , 'assignDistrictCoordinator'])->name('dpl.assign-district');
        Route::post('dpl/import', [Admin\DplAssignmentController::class , 'import'])->name('dpl.import');
        Route::patch('dpl/remove-period/{dplPeriod}', [Admin\DplAssignmentController::class , 'removeDplFromPeriod'])->name('dpl.remove-period');
        Route::patch('dpl/remove-district/{districtCoordinator}', [Admin\DplAssignmentController::class , 'removeDistrictCoordinator'])->name('dpl.remove-district');
        
        Route::get('peserta/transfer', [Admin\StudentTransferController::class , 'index'])->name('peserta.transfer.index');
        Route::post('peserta/transfer', [Admin\StudentTransferController::class , 'transfer'])->name('peserta.transfer');
        
        Route::resource('announcements', Admin\AnnouncementController::class)->except(['create', 'edit', 'show']);
        Route::resource('downloads', Admin\DownloadController::class);

        Route::get('registrations', [Admin\PesertaKknController::class , 'index'])->name('registrations.index');
        Route::get('registrations/documents/download', [Admin\PesertaKknController::class, 'downloadDocument'])->name('registrations.document.download');
        Route::get('registrations/{pesertaKkn}', [Admin\PesertaKknController::class , 'show'])->name('registrations.show');
        Route::get('registrations/export', [Admin\PesertaKknController::class , 'export'])->name('registrations.export');
        Route::patch('registrations/{pesertaKkn}/approve', [Admin\PesertaKknController::class , 'approve'])->name('registrations.approve');
        Route::patch('registrations/{pesertaKkn}/reject', [Admin\PesertaKknController::class , 'reject'])->name('registrations.reject');
        Route::patch('registrations/{pesertaKkn}/assign-group', [Admin\PesertaKknController::class , 'assignGroup'])->name('registrations.assign-group');
        Route::post('registrations/{registration}/make-leader', [Admin\PesertaKknController::class , 'makeLeader'])->name('admin.registrations.make-leader');
        Route::post('registrations/bulk-approve', [Admin\PesertaKknController::class , 'bulkApprove'])->name('registrations.bulk-approve');
        Route::post('registrations/bulk-reject', [Admin\PesertaKknController::class , 'bulkReject'])->name('registrations.bulk-reject');

        // Settings
        Route::prefix('settings')->name('settings.')->group(function () {
            Route::get('certificate', [Admin\CertificateConfigController::class , 'index'])->name('certificate.index');
            Route::post('certificate', [Admin\CertificateConfigController::class , 'update'])->name('certificate.update');
            Route::get('system', [Admin\SystemSettingController::class , 'index'])->name('system.index');
            Route::post('system', [Admin\SystemSettingController::class , 'update'])->name('system.update');
        });

        // Grading Master
        Route::get('grades', [Admin\GradeController::class , 'index'])->name('grades.index');
        Route::get('groups/{group}/students', [Admin\GradeController::class , 'students'])->name('groups.students');
        Route::post('grades', [Admin\GradeController::class , 'store'])->name('grades.store');
        Route::get('grading-settings', [Admin\KonfigurasiPenilaianController::class , 'index'])->name('grading-settings.index');
        Route::post('grading-settings', [Admin\KonfigurasiPenilaianController::class , 'update'])->name('grading-settings.update');
        Route::get('rekap-nilai/export', [Admin\RekapNilaiController::class , 'export'])->name('rekap-nilai.export');
        Route::get('rekap-nilai/export/ledger', [Admin\RekapNilaiController::class , 'exportLedger'])->name('rekap-nilai.export-ledger');
        Route::post('rekap-nilai/bulk-lock', [Admin\RekapNilaiController::class , 'bulkLock'])->name('rekap-nilai.bulk-lock');
        Route::post('rekap-nilai/bulk-unlock', [Admin\RekapNilaiController::class , 'bulkUnlock'])->name('rekap-nilai.bulk-unlock');
        Route::get('rekap-nilai/bulk-certificates', [Admin\RekapNilaiController::class , 'bulkCertificates'])->name('rekap-nilai.bulk-certificates');
        Route::post('rekap-nilai/{score}/finalize', [Admin\RekapNilaiController::class , 'finalize'])->name('rekap-nilai.finalize');
        Route::post('rekap-nilai/finalize-mass', [Admin\RekapNilaiController::class , 'finalizeMass'])->name('rekap-nilai.finalize-mass');
        Route::get('rekap-nilai/finalize-progress', [Admin\RekapNilaiController::class , 'getFinalizeProgress'])->name('rekap-nilai.finalize-progress');
        Route::post('rekap-nilai/save-inline', [Admin\RekapNilaiController::class , 'saveInline'])->name('rekap-nilai.save-inline');
        Route::get('rekap-nilai/{score}/certificate', [Admin\RekapNilaiController::class , 'downloadCertificate'])->name('rekap-nilai.certificate');
        
        Route::get('audit-log', [Admin\LogAuditController::class , 'index'])->name('audit-log.index');
        Route::get('audit-log/{auditLog}', [Admin\LogAuditController::class , 'show'])->name('audit-log.show');
        Route::get('evaluations', [Admin\EvaluasiController::class , 'index'])->name('evaluations.index');
        Route::get('api/available-dpl', [Admin\DplAssignmentController::class , 'getAvailableDpl'])->name('api.available-dpl');
        Route::get('api/transfer-targets', [Admin\StudentTransferController::class , 'getTransferTargets'])->name('api.transfer-targets');
    });

    // ==========================================
    // SHARED ADMIN AREA (Admin & DPL)
    // ==========================================
    Route::middleware(['role:superadmin|dpl'])->prefix('admin')->name('admin.')->group(function () {
        // Shared Activity Reports
        Route::get('reports', [App\Http\Controllers\ReportController::class , 'index'])->name('reports.index');
        Route::get('reports/daily', [Admin\KegiatanKknController::class , 'index'])->name('reports.daily.index');
        Route::get('reports/daily/export-pdf/{studentId}', [App\Http\Controllers\ReportExportController::class , 'downloadStudentDailyReports'])->name('reports.daily.export-pdf');
        Route::get('reports/work-programs', [Admin\ProgramKerjaController::class , 'index'])->name('reports.work-programs.index');
        Route::get('reports/final', [Admin\LaporanAkhirController::class , 'index'])->name('reports.final.index');

        // Grade Generator & Exports
        Route::get('grade-generator', [Admin\GeneratorNilaiController::class , 'index'])->name('grade-generator.index');
        Route::get('grade-generator/groups/all/students', [Admin\GeneratorNilaiController::class , 'studentsAll'])->name('grade-generator.students-all');
        Route::get('grade-generator/groups/{kelompokKkn}/students', [Admin\GeneratorNilaiController::class , 'students'])->name('grade-generator.students');
        Route::post('grade-generator/scores', [Admin\GeneratorNilaiController::class , 'saveScores'])->name('grade-generator.save-scores');
        Route::get('grade-generator/export/{id}', [Admin\GeneratorNilaiController::class , 'exportExcel'])->name('grade-generator.export');
        Route::get('grade-generator/export-pdf/{id}', [Admin\GeneratorNilaiController::class , 'exportPdf'])->name('grade-generator.export-pdf');
        Route::get('grade-generator/export-zip', [Admin\GeneratorNilaiController::class , 'exportZip'])->name('grade-generator.export-zip');

        // Advanced Exports
        Route::get('export/daily-reports/group/{groupId}', [App\Http\Controllers\ReportExportController::class , 'downloadGroupDailyReports'])->name('export.daily-reports.group');
        Route::get('export/daily-reports/student/{studentId}', [App\Http\Controllers\ReportExportController::class , 'downloadStudentDailyReports'])->name('export.daily-reports.student');
        
        Route::post('workshops', [App\Http\Controllers\WorkshopController::class , 'store'])->name('workshops.store');
        Route::patch('workshops/{workshop}', [App\Http\Controllers\WorkshopController::class , 'update'])->name('workshops.update');
        Route::patch('workshops/{workshop}/cancel', [App\Http\Controllers\WorkshopController::class , 'cancel'])->name('workshops.cancel');
        Route::post('workshops/{workshop}/attendance', [App\Http\Controllers\WorkshopController::class , 'markAttendance'])->name('workshops.mark-attendance');
    });

    // ==========================================
    // DPL AREA (DPL Only)
    // ==========================================
    Route::middleware(['role:dpl'])->prefix('dpl')->name('dpl.')->group(function () {
        Route::get('/', [Dpl\DashboardController::class , 'index'])->name('dashboard');
        Route::get('groups', [Dpl\GroupController::class , 'index'])->name('groups.index');
        Route::get('groups/{group}', [Dpl\GroupController::class , 'show'])->name('groups.show');
        Route::get('daily-reports', [Dpl\DailyReportController::class , 'index'])->name('daily-reports.index');
        Route::get('daily-reports/{dailyReport}', [Dpl\DailyReportController::class , 'show'])->name('daily-reports.show');
        Route::get('daily-reports/files/{fileKegiatan}', [Dpl\DailyReportController::class , 'downloadFile'])->name('daily-reports.files.download');
        Route::post('daily-reports/approve-all', [Dpl\DailyReportController::class , 'batchApprove'])->name('daily-reports.approve-all');
        Route::patch('daily-reports/{dailyReport}/approve', [Dpl\DailyReportController::class , 'approve'])->name('daily-reports.approve');
        Route::patch('daily-reports/{dailyReport}/revision', [Dpl\DailyReportController::class , 'revision'])->name('daily-reports.revision');
        Route::patch('daily-reports/{dailyReport}/reject', [Dpl\DailyReportController::class , 'revision'])->name('daily-reports.reject');
        Route::get('evaluations', [Dpl\EvaluationController::class , 'index'])->name('evaluations.index');
        Route::post('evaluations/validate-import', [Dpl\EvaluationController::class , 'validateImport'])->name('evaluations.validate-import');
        Route::post('evaluations/import', [Dpl\EvaluationController::class , 'import'])->name('evaluations.import');
        Route::get('evaluations/create', [Dpl\EvaluationController::class , 'create'])->name('evaluations.create');
        Route::post('evaluations', [Dpl\EvaluationController::class , 'store'])->name('evaluations.store');
        Route::get('final-reports', [Dpl\FinalReportController::class , 'index'])->name('final-reports.index');
        Route::get('final-reports/{report}', [Dpl\FinalReportController::class , 'show'])->name('final-reports.show');
        Route::get('final-reports/{report}/download', [Dpl\FinalReportController::class , 'download'])->name('final-reports.download');
        Route::patch('final-reports/{report}/approve', [Dpl\FinalReportController::class , 'approve'])->name('final-reports.approve');
        Route::patch('final-reports/{report}/revision', [Dpl\FinalReportController::class , 'revision'])->name('final-reports.revision');
    });

    // ==========================================
    // STUDENT AREA (Student Only)
    // ==========================================
    Route::middleware(['role:student'])->prefix('student')->name('student.')->group(function () {
        Route::get('/', [Student\DashboardController::class , 'index'])->name('dashboard');
        Route::get('register', [Student\RegistrationController::class , 'create'])->name('registration.create');
        Route::post('register', [Student\RegistrationController::class , 'store'])->name('registration.store');
        Route::delete('register/{periode}/group', [Student\RegistrationController::class, 'leave'])->name('registration.leave');
        Route::get('posko', [Student\PoskoController::class, 'edit'])->name('posko.edit');
        Route::post('posko', [Student\PoskoController::class, 'store'])->name('posko.store');

        Route::resource('daily-reports', Student\DailyReportController::class)
            ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            ->parameters(['daily-reports' => 'dailyReport']);
        Route::get('daily-reports/download-compilation', [App\Http\Controllers\ReportExportController::class , 'downloadMyDailyReports'])->name('daily-reports.download-compilation');

        Route::get('work-programs', [Student\WorkProgramController::class , 'index'])->name('work-programs.index');
        Route::get('work-programs/create', [Student\WorkProgramController::class , 'create'])->name('work-programs.create');
        Route::post('work-programs', [Student\WorkProgramController::class , 'store'])->name('work-programs.store');

        Route::get('final-report', [Student\FinalReportController::class , 'create'])->name('final-report.create');
        Route::post('final-report', [Student\FinalReportController::class , 'store'])->name('final-report.store');
        Route::get('evaluations', [Student\EvaluationController::class , 'index'])->name('evaluations.index');

        // Additional Shared Student routes
        Route::get('reports', [App\Http\Controllers\ReportController::class , 'index'])->name('reports.index');
        Route::post('reports/upload', [App\Http\Controllers\ReportController::class , 'upload'])->name('reports.upload');
        Route::get('workshops', [App\Http\Controllers\WorkshopController::class , 'index'])->name('workshops.index');
        Route::post('workshops/{workshop}/register', [App\Http\Controllers\WorkshopController::class , 'register'])->name('workshops.register');
    });

    // protected global routes (with role-based access)
    Route::get('/reports/{report}/download', [App\Http\Controllers\ReportController::class, 'download'])
        ->name('reports.download')
        ->middleware('role:superadmin|dpl|student');
    Route::get('/posko/{posko}/photo', [Student\PoskoController::class, 'photo'])
        ->name('posko.photo')
        ->middleware('role:superadmin|dpl|student');
    Route::get('/scores/{score}/evidence', [\App\Http\Controllers\ReportController::class, 'showEvidence'])
        ->name('scores.evidence')
        ->middleware('role:superadmin|dpl');
    Route::get('/certificates/{score}/download', [App\Http\Controllers\CertificateController::class , 'download'])
        ->name('certificates.download')
        ->middleware('role:superadmin|dpl|student');
    Route::get('/admin/certificates/bulk-download', [App\Http\Controllers\CertificateController::class , 'downloadMass'])
        ->name('admin.certificates.bulk-download')
        ->middleware('role:superadmin');
});
