<?php

declare(strict_types=1);

namespace App\Console\Commands\KKN;

use App\Models\KKN\AbsensiHarian;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\PesertaKkn;
use Carbon\Carbon;
use Illuminate\Console\Command;

class CekAbsensi extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kkn:cek-absensi {date? : Date to check in YYYY-MM-DD format}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Generate daily attendance status based on logbooks and approved leaves.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $date = $this->argument('date') ?: Carbon::today()->toDateString();
        $this->info("Processing attendance for: {$date}");

        $activeParticipants = PesertaKkn::where('status', 'approved')
            ->whereHas('periode', fn ($q) => $q->where('is_active', true))
            ->with(['mahasiswa', 'kelompok'])
            ->get();

        $count = 0;

        foreach ($activeParticipants as $peserta) {
            if (! $peserta->mahasiswa_id || ! $peserta->kelompok_id) {
                continue;
            }

            $status = 'tanpa_keterangan';
            $izinId = null;

            // 1. Check for logbook
            $hasLogbook = KegiatanKkn::where('mahasiswa_id', $peserta->mahasiswa_id)
                ->where('date', $date)
                ->exists();

            if ($hasLogbook) {
                $status = 'hadir';
            } else {
                // 2. Check for approved leave
                $leave = IzinMeninggalkan::where('mahasiswa_id', $peserta->mahasiswa_id)
                    ->where('status', 'disetujui')
                    ->where('tanggal_mulai', '<=', $date)
                    ->where('tanggal_kembali', '>=', $date)
                    ->first();

                if ($leave) {
                    $status = 'izin';
                    $izinId = $leave->id;
                }
            }

            // 3. Record status
            AbsensiHarian::updateOrCreate(
                [
                    'mahasiswa_id' => $peserta->mahasiswa_id,
                    'tanggal' => $date,
                ],
                [
                    'kelompok_id' => $peserta->kelompok_id,
                    'status' => $status,
                    'izin_id' => $izinId,
                ]
            );
            $count++;
        }

        $this->info("Completed. Processed {$count} records.");
    }
}
