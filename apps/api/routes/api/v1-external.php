<?php

use App\Http\Controllers\Api\V1\Admin\PeriodeController;
use App\Http\Controllers\Api\V1\External\CollaborationLetterController;
use App\Http\Controllers\Api\V1\External\DashboardController;
use App\Http\Controllers\Api\V1\External\ParticipantController;
use Illuminate\Support\Facades\Route;

Route::prefix('external')
    ->middleware(['auth:sanctum', 'role:external_lppm_admin', 'not_locked'])
    ->group(function () {
        Route::get('/dashboard', DashboardController::class);
        Route::get('/periodes', [PeriodeController::class, 'index']);

        Route::apiResource('participants', ParticipantController::class);

        Route::post('/collaboration-letters/{letter}/submit', [CollaborationLetterController::class, 'submit']);
        Route::apiResource('collaboration-letters', CollaborationLetterController::class)
            ->parameters(['collaboration-letters' => 'letter']);
    });
