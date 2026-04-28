<?php

declare(strict_types=1);

namespace App\Console\Commands\KKN;

use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Notifications\DeadlineReminderNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;

class SendDeadlineRemindersCommand extends Command
{
    protected $signature = 'kkn:send-deadline-reminders';

    protected $description = 'Kirim pengingat deadline pendaftaran KKN (H-3, H-1, hari terakhir)';

    public function handle(): int
    {
        $now = now();
        $remindDays = [3, 1, 0]; // H-3, H-1, hari terakhir

        $periodes = Periode::query()
            ->whereNotNull('registration_end')
            ->where('registration_end', '>=', $now)
            ->where('is_active', true)
            ->with('jenisKkn')
            ->get();

        if ($periodes->isEmpty()) {
            $this->info('Tidak ada periode dengan deadline mendatang.');

            return self::SUCCESS;
        }

        $totalNotified = 0;

        foreach ($periodes as $periode) {
            $daysUntilEnd = (int) $now->startOfDay()->diffInDays($periode->registration_end->startOfDay(), false);

            if (! in_array($daysUntilEnd, $remindDays, true)) {
                continue;
            }

            $label = match ($daysUntilEnd) {
                3 => 'H-3',
                1 => 'H-1',
                0 => 'HARI TERAKHIR',
                default => "H-{$daysUntilEnd}",
            };

            $this->info("📢 {$periode->name}: {$label} (deadline: {$periode->registration_end->format('d M Y')})");

            // Find eligible students who haven't registered yet
            $registeredMahasiswaIds = PesertaKkn::query()
                ->where('periode_id', $periode->id)
                ->pluck('mahasiswa_id');

            // Get active student users who haven't registered
            $eligibleUsers = User::query()
                ->whereHas('mahasiswa', function ($q) use ($registeredMahasiswaIds) {
                    $q->where('is_active', true);
                    if ($registeredMahasiswaIds->isNotEmpty()) {
                        $q->whereNotIn('id', $registeredMahasiswaIds);
                    }
                })
                ->where('is_active', true)
                ->get();

            foreach ($eligibleUsers as $user) {
                try {
                    // Use database notification (shows in app notification center)
                    $user->notify(new DeadlineReminderNotification(
                        periode: $periode,
                        label: $label,
                    ));
                    $totalNotified++;
                } catch (\Throwable $e) {
                    Log::warning("Gagal kirim notifikasi deadline ke user #{$user->id}: {$e->getMessage()}");
                }
            }

            $this->info("  → {$eligibleUsers->count()} mahasiswa dinotifikasi.");
        }

        $this->info("✅ Total {$totalNotified} notifikasi terkirim.");

        return self::SUCCESS;
    }
}
