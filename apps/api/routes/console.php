<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

use Illuminate\Support\Facades\Schedule;

Schedule::command('audit:prune')->daily();
Schedule::command('activity-logs:prune --days=180')->daily();

// Daily Attendance Check (at 23:45 WIB)
Schedule::command('kkn:cek-absensi')->dailyAt('23:45');

// Automatic Dismissal Check (at 23:59 WIB)
Schedule::command('kkn:cek-gugur')->dailyAt('23:59');

// Periodic ABCD Stage Evaluation
Schedule::command('kkn:advance-abcd')->everySixHours();

// Daily Database Backup at 02:00 WIB (retain last 7 days)

// Deadline Reminders (H-3, H-1, hari terakhir) at 08:00 WIB
Schedule::command('kkn:send-deadline-reminders')->dailyAt('08:00');

// Daily Logbook Reminder at 20:00 WIB
Schedule::command('kkn:send-logbook-reminders')->dailyAt('20:00');

// Ops Monitoring — probe infra setiap 5 menit, Telegram alert on issue
Schedule::command('monitoring:health-check')->everyFiveMinutes()->withoutOverlapping();

// Daily heartbeat di Telegram jam 08:00 WIB (1×/hari via dedup 12h di command)
Schedule::command('monitoring:health-check --heartbeat')->dailyAt('08:00');


// Auto-cleanup stale data every 6 hours (tokens, sessions, cache, old logs)
Schedule::command('cleanup:stale-data --quiet-log')->everySixHours()->withoutOverlapping();

// Recompute eligibility cache daily at 04:00 WIB
Schedule::command('audit:recompute-eligibility')->dailyAt('04:00')->withoutOverlapping();

// PRD 9.1: Campus Data Integration Schedules
// DISABLED 2026-05: Per ops decision, SIAKAD sync is now run manually
// from the superadmin dashboard (POST /api/v1/admin/sync/run-with-backup)
// with a pg_dump backup in front. The scheduled runs below would silently
// bypass the backup step and could overwrite admin-locked fields in the
// rare case of a SIAKAD data regression — unacceptable once the overlay /
// manual-edit model was introduced.
//
// Re-enable ONLY when (a) the backup step is folded into the command itself,
// and (b) the field-lock registry is battle-tested in production.
//
// Delta Sync (Perubahan minor) setiap hari pukul 02:00 WIB
// Schedule::command('sync:master-data --type=all --source=api --delta')->dailyAt('02:00');

// Full Sync (Safety net) setiap Sabtu pukul 03:00 WIB
// Schedule::command('sync:master-data --type=all --source=api')->saturdays()->at('03:00');

// Auto-sync periode phase (upcoming→registration→placement→...→finished)
// Runs every 5 minutes to catch registration_start triggers promptly.
Schedule::command('kkn:auto-sync-phase')->everyFiveMinutes()->withoutOverlapping();

// Cache warmup every 6 hours to keep master data hot
Schedule::command("cache:warmup")->everySixHours()->withoutOverlapping();

// Pulse metrics aggregation every minute
Schedule::command("pulse:check")->everyMinute()->withoutOverlapping();
