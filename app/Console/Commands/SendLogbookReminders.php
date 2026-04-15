<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Notifications\KKN\DailyLogbookReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendLogbookReminders extends Command
{
    protected $signature = 'kkn:send-logbook-reminders';

    protected $description = 'Send daily logbook reminder emails to active KKN participants who have not filled their logbook today';

    public function handle(): int
    {
        $activePeriods = Periode::where('is_active', true)
            ->whereNotNull('start_date')
            ->whereNotNull('end_date')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->get();

        if ($activePeriods->isEmpty()) {
            $this->info('No active KKN periods in execution phase. Skipping.');

            return self::SUCCESS;
        }

        $totalSent = 0;

        foreach ($activePeriods as $period) {
            // Get approved participants who have NOT submitted a logbook today
            $lazyParticipants = PesertaKkn::where('period_id', $period->id)
                ->where('status', 'approved')
                ->whereHas('mahasiswa.user')
                ->whereDoesntHave('mahasiswa.kegiatan', function ($query) {
                    $query->whereDate('date', today());
                })
                ->with(['mahasiswa.user'])
                ->lazy(100);

            foreach ($lazyParticipants as $peserta) {
                $user = $peserta->mahasiswa?->user;
                if (! $user) {
                    continue;
                }

                // Count consecutive missed days
                $lastActivity = DB::connection('kkn')
                    ->table('kegiatan_kkn')
                    ->where('mahasiswa_id', $peserta->mahasiswa_id)
                    ->max('date');

                $missedDays = $lastActivity
                    ? max(1, (int) now()->diffInDays($lastActivity))
                    : 1;

                $user->notify(new DailyLogbookReminderNotification(
                    $period->name,
                    $missedDays,
                ));

                $totalSent++;
            }
        }

        $this->info("Sent {$totalSent} logbook reminder(s) across {$activePeriods->count()} active period(s).");

        return self::SUCCESS;
    }
}
