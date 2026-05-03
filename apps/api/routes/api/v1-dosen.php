<?php

use App\Http\Controllers\Api\V1\Dpl\DailyReportController;
use App\Http\Controllers\Api\V1\Dpl\DashboardController as DplDashboardController;
use App\Http\Controllers\Api\V1\Dpl\EvaluationController;
use App\Http\Controllers\Api\V1\Dpl\FinalReportController;
use App\Http\Controllers\Api\V1\Dpl\GroupController;
use App\Http\Controllers\Api\V1\Dpl\IzinController;
use App\Http\Controllers\Api\V1\Dpl\MonitoringController;
use App\Http\Controllers\Api\V1\Dpl\ParticipantFeedbackController;
use App\Http\Controllers\Api\V1\Dosen\DashboardController as DosenDashboardController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dosen/DPL API Routes
|--------------------------------------------------------------------------
*/

// Dosen routes (all dosen can access)
Route::prefix('dosen')
    ->middleware(['auth:sanctum', 'role:dosen|dpl|superadmin'])
    ->group(function () {
        Route::get('/dashboard', [DosenDashboardController::class, 'index'])->name('api.v1.dosen.dashboard');
    });

// DPL routes (only approved DPL can access)
Route::prefix('dpl')
    ->middleware(['auth:sanctum', 'role:dpl|superadmin'])
    ->group(function () {
        // Dashboard
        Route::get('/dashboard', [DplDashboardController::class, 'index'])->name('api.v1.dpl.dashboard');

        // Groups
        Route::get('/groups', [GroupController::class, 'index'])->name('api.v1.dpl.groups.index');
        Route::get('/groups/{group}', [GroupController::class, 'show'])->name('api.v1.dpl.groups.show');

        // Daily Reports
        Route::get('/daily-reports', [DailyReportController::class, 'index'])->name('api.v1.dpl.daily-reports.index');
        Route::get('/daily-reports/{dailyReport}', [DailyReportController::class, 'show'])->name('api.v1.dpl.daily-reports.show');
        Route::patch('/daily-reports/{dailyReport}/approve', [DailyReportController::class, 'approve'])->name('api.v1.dpl.daily-reports.approve');
        Route::patch('/daily-reports/{dailyReport}/revision', [DailyReportController::class, 'revision'])->name('api.v1.dpl.daily-reports.revision');
        Route::post('/daily-reports/batch-approve', [DailyReportController::class, 'batchApprove'])->name('api.v1.dpl.daily-reports.batch-approve');

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

        // Monitoring
        Route::get('/monitoring', [MonitoringController::class, 'index'])->name('api.v1.dpl.monitoring.index');
        Route::post('/monitoring', [MonitoringController::class, 'store'])->name('api.v1.dpl.monitoring.store');

        // Leave Requests
        Route::get('/leave-requests', [IzinController::class, 'index'])->name('api.v1.dpl.leave-requests.index');
        Route::patch('/leave-requests/{izin}/approve', [IzinController::class, 'approve'])->name('api.v1.dpl.leave-requests.approve');
        Route::patch('/leave-requests/{izin}/reject', [IzinController::class, 'reject'])->name('api.v1.dpl.leave-requests.reject');

        // Participant Feedback
        Route::get('/feedback', [ParticipantFeedbackController::class, 'index'])->name('api.v1.dpl.feedback.index');
    });
