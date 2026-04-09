<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
Schedule::command('audit:prune')->daily();

// Automatic Dismissal Check (at 23:59 WIB)
Schedule::command('kkn:cek-gugur')->dailyAt('23:59');

// Daily Attendance Check (at 23:59 WIB - check previous day)
Schedule::command('kkn:cek-absensi')->dailyAt('23:59');

// Periodic ABCD Stage Evaluation
Schedule::command('kkn:advance-abcd')->everySixHours();
