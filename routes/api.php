<?php

use App\Http\Controllers\Api\MasterWebhookController;
use Illuminate\Support\Facades\Route;

// Master API webhook trigger (event-driven sync)
Route::post('/webhooks/master', [MasterWebhookController::class, 'handle']);

