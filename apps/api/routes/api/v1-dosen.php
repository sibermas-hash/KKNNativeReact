<?php

use App\Http\Controllers\Api\V1\Dosen\DashboardController as DosenDashboardController;
use App\Http\Controllers\Api\V1\Dosen\DplRegistrationController;
use App\Http\Controllers\Api\V1\Dosen\WorkshopController as DosenWorkshopController;
use App\Http\Controllers\Api\V1\Dpl\BimbinganController;
use App\Http\Controllers\Api\V1\Dpl\DailyReportController;
use App\Http\Controllers\Api\V1\Dpl\DashboardController as DplDashboardController;
use App\Http\Controllers\Api\V1\Dpl\EvaluationController;
use App\Http\Controllers\Api\V1\Dpl\FinalReportController;
use App\Http\Controllers\Api\V1\Dpl\GroupController;
use App\Http\Controllers\Api\V1\Dpl\IzinController;
use App\Http\Controllers\Api\V1\Dpl\LogbookPdfController;
use App\Http\Controllers\Api\V1\Dpl\MonitoringController;
use App\Http\Controllers\Api\V1\Dpl\ParticipantFeedbackController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dosen/DPL API Routes
|--------------------------------------------------------------------------
*/

// Dosen routes (all dosen can access)
Route::prefix('dosen')
    ->middleware(['auth:sanctum', 'role:dosen|dpl', 'not_locked'])
    ->group(function () {
        Route::get('/dashboard', [DosenDashboardController::class, 'index'])->name('api.v1.dosen.dashboard');

        // Workshop — semua dosen bisa akses
        Route::get('/workshops', [DosenWorkshopController::class, 'index'])->name('api.v1.dosen.workshops.index');
        Route::post('/workshops/{workshopId}/register', [DosenWorkshopController::class, 'register'])->name('api.v1.dosen.workshops.register');
        Route::get('/workshops/my-certificates', [DosenWorkshopController::class, 'myCertificates'])->name('api.v1.dosen.workshops.certificates');
        Route::get('/workshops/{participant}/certificate', [DosenWorkshopController::class, 'downloadCertificate'])
            ->middleware('signed')
            ->name('api.v1.dosen.workshops.certificate.download');

        // Pendaftaran DPL
        Route::get('/dpl-eligibility', [DplRegistrationController::class, 'eligibility'])->name('api.v1.dosen.dpl-eligibility');
        Route::get('/available-periods', [DplRegistrationController::class, 'availablePeriods'])->name('api.v1.dosen.available-periods');
        Route::post('/daftar-dpl', [DplRegistrationController::class, 'store'])->name('api.v1.dosen.daftar-dpl');
    });

// DPL routes (only approved DPL can access)
Route::prefix('dpl')
    ->middleware(['auth:sanctum', 'role:dpl', 'not_locked'])
    ->group(function () {
        // Dashboard
        Route::get('/dashboard', [DplDashboardController::class, 'index'])->name('api.v1.dpl.dashboard');

        // Groups
        Route::get('/groups', [GroupController::class, 'index'])->name('api.v1.dpl.groups.index');
        Route::get('/groups/{group}', [GroupController::class, 'show'])->name('api.v1.dpl.groups.show');

        // ─── PHASE: EXECUTION & GRADING ───────────────────────
        Route::middleware(['phase:execution,grading'])->group(function () {
            // Daily Reports
            Route::get('/daily-reports', [DailyReportController::class, 'index'])->name('api.v1.dpl.daily-reports.index');
            Route::get('/daily-reports/{dailyReport}', [DailyReportController::class, 'show'])->name('api.v1.dpl.daily-reports.show');
            Route::patch('/daily-reports/{dailyReport}/approve', [DailyReportController::class, 'approve'])->name('api.v1.dpl.daily-reports.approve');
            Route::patch('/daily-reports/{dailyReport}/revision', [DailyReportController::class, 'revision'])->name('api.v1.dpl.daily-reports.revision');
            Route::post('/daily-reports/batch-approve', [DailyReportController::class, 'batchApprove'])->name('api.v1.dpl.daily-reports.batch-approve');
            Route::get('/daily-reports/file/{fileKegiatan}/download', [DailyReportController::class, 'downloadFile'])->name('api.v1.dpl.daily-reports.files.download');
            Route::get('/daily-reports/file/{fileKegiatan}/preview', [DailyReportController::class, 'previewFile'])->name('api.v1.dpl.daily-reports.files.preview');

            // Monitoring
            Route::get('/monitoring', [MonitoringController::class, 'index'])->name('api.v1.dpl.monitoring.index');
            Route::get('/monitoring/buat', [MonitoringController::class, 'create'])->name('api.v1.dpl.monitoring.create');
            Route::post('/monitoring', [MonitoringController::class, 'store'])->name('api.v1.dpl.monitoring.store');

            // Leave Requests
            Route::get('/leave-requests', [IzinController::class, 'index'])->name('api.v1.dpl.leave-requests.index');
            Route::patch('/leave-requests/{izin}/approve', [IzinController::class, 'approve'])->name('api.v1.dpl.leave-requests.approve');
            Route::patch('/leave-requests/{izin}/reject', [IzinController::class, 'reject'])->name('api.v1.dpl.leave-requests.reject');
        });

        // ─── PHASE: GRADING & FINISHED ────────────────────────
        Route::middleware(['phase:grading,finished'])->group(function () {
            // Evaluations
            Route::get('/evaluations', [EvaluationController::class, 'index'])->name('api.v1.dpl.evaluations.index');
            Route::post('/evaluations', [EvaluationController::class, 'store'])->name('api.v1.dpl.evaluations.store');
            Route::post('/evaluations/validate-import', [EvaluationController::class, 'validateImport'])->name('api.v1.dpl.evaluations.validate-import');
            Route::post('/evaluations/import', [EvaluationController::class, 'import'])->name('api.v1.dpl.evaluations.import');

            // Final Reports
            Route::get('/final-reports', [FinalReportController::class, 'index'])->name('api.v1.dpl.final-reports.index');
            Route::get('/final-reports/{report}', [FinalReportController::class, 'show'])->name('api.v1.dpl.final-reports.show');
            Route::patch('/final-reports/{report}/approve', [FinalReportController::class, 'approve'])->name('api.v1.dpl.final-reports.approve');
            Route::patch('/final-reports/{report}/revision', [FinalReportController::class, 'revision'])->name('api.v1.dpl.final-reports.revision');
            Route::get('/final-reports/{report}/download', [FinalReportController::class, 'download'])->name('api.v1.dpl.final-reports.download');

            // Participant Feedback
            Route::get('/feedback', [ParticipantFeedbackController::class, 'index'])->name('api.v1.dpl.feedback.index');
        });

        // Logbook PDF per-mahasiswa (akses diperiksa di controller, harus DPL kelompok ybs)
        Route::get('/logbook/{mahasiswa}/pdf', [LogbookPdfController::class, 'download'])
            ->middleware('throttle:20,1')
            ->name('api.v1.dpl.logbook.pdf');

        // Sistem Bimbingan Online (R6) — DPL schedule + notulensi
        Route::prefix('bimbingan')->group(function () {
            Route::get('/', [BimbinganController::class, 'index'])->name('api.v1.dpl.bimbingan.index');
            Route::post('/', [BimbinganController::class, 'store'])->middleware('throttle:30,1')->name('api.v1.dpl.bimbingan.store');
            Route::get('/kelompok/{kelompok}/progress', [BimbinganController::class, 'progressForKelompok'])->name('api.v1.dpl.bimbingan.progress');
            Route::get('/{session}', [BimbinganController::class, 'show'])->name('api.v1.dpl.bimbingan.show');
            Route::patch('/{session}', [BimbinganController::class, 'update'])->name('api.v1.dpl.bimbingan.update');
            Route::patch('/{session}/complete', [BimbinganController::class, 'complete'])->name('api.v1.dpl.bimbingan.complete');
            Route::patch('/{session}/cancel', [BimbinganController::class, 'cancel'])->name('api.v1.dpl.bimbingan.cancel');
            Route::post('/{session}/attendance', [BimbinganController::class, 'markAttendance'])->name('api.v1.dpl.bimbingan.attendance');
        });
    });
