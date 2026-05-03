<?php

use App\Http\Controllers\Api\V1\Student\CertificateController;
use App\Http\Controllers\Api\V1\Student\DailyReportController;
use App\Http\Controllers\Api\V1\Student\DashboardController;
use App\Http\Controllers\Api\V1\Student\DplEvaluationController;
use App\Http\Controllers\Api\V1\Student\FinalReportController;
use App\Http\Controllers\Api\V1\Student\IzinController;
use App\Http\Controllers\Api\V1\Student\RegistrationController;
use App\Http\Controllers\Api\V1\Student\WorkProgramController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Student API Routes (/api/v1/student/*)
|--------------------------------------------------------------------------
*/

Route::prefix('student')
    ->middleware(['auth:sanctum', 'role:student'])
    ->group(function () {

        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.v1.student.dashboard');
        Route::patch('/peserta-kkn/{pesertaKkn}/notification-shown', [DashboardController::class, 'markNotificationShown'])->name('api.v1.student.notification-shown');

        // Registration
        Route::get('/registration/form', [RegistrationController::class, 'form'])->name('api.v1.student.registration.form');
        Route::post('/registration', [RegistrationController::class, 'store'])->name('api.v1.student.registration.store');
        Route::get('/registration/status', [RegistrationController::class, 'status'])->name('api.v1.student.registration.status');
        Route::delete('/registration/{periode}', [RegistrationController::class, 'leave'])->name('api.v1.student.registration.leave');

        // Daily Reports
        Route::get('/daily-reports', [DailyReportController::class, 'index'])->name('api.v1.student.daily-reports.index');
        Route::post('/daily-reports', [DailyReportController::class, 'store'])->name('api.v1.student.daily-reports.store');
        Route::get('/daily-reports/{dailyReport}', [DailyReportController::class, 'show'])->name('api.v1.student.daily-reports.show');
        Route::put('/daily-reports/{dailyReport}', [DailyReportController::class, 'update'])->name('api.v1.student.daily-reports.update');
        Route::delete('/daily-reports/{dailyReport}', [DailyReportController::class, 'destroy'])->name('api.v1.student.daily-reports.destroy');

        // Work Programs
        Route::get('/work-programs', [WorkProgramController::class, 'index'])->name('api.v1.student.work-programs.index');
        Route::post('/work-programs', [WorkProgramController::class, 'store'])->name('api.v1.student.work-programs.store');
        Route::get('/work-programs/{programKerja}', [WorkProgramController::class, 'show'])->name('api.v1.student.work-programs.show');
        Route::post('/work-programs/{programKerja}/proposal', [WorkProgramController::class, 'uploadProposal'])->name('api.v1.student.work-programs.proposal');
        Route::get('/work-programs/{programKerja}/proposal/{proposal}/download', [WorkProgramController::class, 'downloadProposal'])->name('api.v1.student.work-programs.proposal.download');

        // Leave Requests
        Route::get('/leave-requests', [IzinController::class, 'index'])->name('api.v1.student.leave-requests.index');
        Route::post('/leave-requests', [IzinController::class, 'store'])->name('api.v1.student.leave-requests.store');

        // Final Report
        Route::get('/final-report', [FinalReportController::class, 'index'])->name('api.v1.student.final-report.index');
        Route::post('/final-report', [FinalReportController::class, 'store'])->name('api.v1.student.final-report.store');

        // Certificates
        Route::get('/certificates', [CertificateController::class, 'index'])->name('api.v1.student.certificates.index');
        Route::get('/certificates/{sertifikat}/download', [CertificateController::class, 'download'])->name('api.v1.student.certificates.download');

        // DPL Evaluation
        Route::get('/dpl-evaluation/form', [DplEvaluationController::class, 'index'])->name('api.v1.student.dpl-evaluation.index');
        Route::post('/dpl-evaluation', [DplEvaluationController::class, 'store'])->name('api.v1.student.dpl-evaluation.store');
    });
