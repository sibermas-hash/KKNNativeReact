<?php

declare(strict_types=1);

namespace App\Console\Commands\KKN;

use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Notifications\KknActivityNotification;
use Illuminate\Console\Command;

class CheckStudentDisciplineCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kkn:check-discipline';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Cek otomatis kedisiplinan mahasiswa (bolos logbook 3 hari) sesuai Panduan KKN 56';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai pengecekan kedisiplinan logbook...');

        // 1. Dapatkan periode yang sedang berjalan (hari ini di antara start_date dan end_date)
        $activePeriods = Periode::where('is_active', true)
            ->whereDate('start_date', '<=', now())
            ->whereDate('end_date', '>=', now())
            ->get();

        if ($activePeriods->isEmpty()) {
            $this->warn('Tidak ada periode KKN yang aktif berjalan hari ini.');

            return;
        }

        $thresholdDate = now()->subDays(3)->startOfDay();
        $foundCount = 0;

        foreach ($activePeriods as $period) {
            $this->info("Mengecek periode: {$period->name}");

            // 2. Cari mahasiswa yang terdaftar di periode ini (status approved)
            $participants = PesertaKkn::where('period_id', $period->id)
                ->where('status', 'approved')
                ->with(['mahasiswa.user', 'kelompok.dpl.user'])
                ->get();

            foreach ($participants as $participant) {
                // 3. Cek apakah ada logbook dalam 3 hari terakhir
                $hasRecentLog = KegiatanKkn::where('mahasiswa_id', $participant->mahasiswa_id)
                    ->whereDate('date', '>=', $thresholdDate)
                    ->exists();

                if (! $hasRecentLog) {
                    $this->warn("Mahasiswa bolos: {$participant->mahasiswa->nama} ({$participant->mahasiswa->nim})");
                    $foundCount++;

                    // 4. Kirim notifikasi ke DPL
                    $dplUser = $participant->kelompok?->dpl?->user;
                    if ($dplUser) {
                        $dplUser->notify(new KknActivityNotification([
                            'type' => 'warning',
                            'title' => 'Peringatan Kedisiplinan',
                            'message' => "Mahasiswa {$participant->mahasiswa->nama} tidak mengisi logbook selama 3 hari berturut-turut.",
                            'icon' => 'exclamation-triangle',
                            'action' => route('dpl.kelompok.show', $participant->kelompok_id),
                        ]));
                    }

                    // 5. Kirim notifikasi ke Mahasiswa
                    if ($participant->mahasiswa->user) {
                        $participant->mahasiswa->user->notify(new KknActivityNotification([
                            'type' => 'danger',
                            'title' => 'Peringatan Kritis!',
                            'message' => 'Anda tidak mengisi logbook selama 3 hari. Sesuai Panduan KKN 56, meninggalkan lokasi > 3 hari tanpa keterangan dianggap mengundurkan diri.',
                            'icon' => 'shield-exclamation',
                            'action' => route('student.laporan-harian.index'),
                        ]));
                    }
                }
            }
        }

        $this->info("Pengecekan selesai. Ditemukan {$foundCount} mahasiswa bermasalah.");
    }
}
