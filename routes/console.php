<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;
Schedule::command('audit:prune')->daily();

// Daily Attendance Check (at 23:45 WIB)
Schedule::command('kkn:cek-absensi')->dailyAt('23:45');

// Automatic Dismissal Check (at 23:59 WIB)
Schedule::command('kkn:cek-gugur')->dailyAt('23:59');

// Periodic ABCD Stage Evaluation
Schedule::command('kkn:advance-abcd')->everySixHours();

// Daily Database Backup at 2 AM (retain last 7)
Schedule::command('backup:run --only-db --keep=7')->dailyAt('02:00');

// Daily Logbook Reminder at 20:00 WIB
Schedule::command('kkn:send-logbook-reminders')->dailyAt('20:00');
