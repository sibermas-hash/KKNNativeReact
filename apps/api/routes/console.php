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

// Daily Database Backup at 02:00 WIB (retain last 7 days)
Schedule::command('db:backup --keep=7')->dailyAt('02:00');

// Deadline Reminders (H-3, H-1, hari terakhir) at 08:00 WIB
Schedule::command('kkn:send-deadline-reminders')->dailyAt('08:00');

// Daily Logbook Reminder at 20:00 WIB
Schedule::command('kkn:send-logbook-reminders')->dailyAt('20:00');

// PRD 9.1: Campus Data Integration Schedules
// Delta Sync (Perubahan minor) setiap hari pukul 02:00 WIB
Schedule::command('sync:master-data --type=all --source=api --delta')->dailyAt('02:00');

// Full Sync (Safety net) setiap Sabtu pukul 03:00 WIB
Schedule::command('sync:master-data --type=all --source=api')->saturdays()->at('03:00');
