<?php

namespace App\Console\Commands\KKN;

use App\Models\KKN\AbsensiHarian;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\PesertaKkn;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CekGugurOtomatis extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'kkn:cek-gugur';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Cek mahasiswa yang tidak mengisi logbook selama 3 hari berturut-turut tanpa izin (Status: Gugur)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai pengecekan status pendaftaran mahasiswa...');

        // 1. Get all active (approved) participants from active periods only
        $participants = PesertaKkn::where('status', 'approved')
            ->whereHas('periode', fn($q) => $q->where('is_active', true))
            ->with(['mahasiswa'])
            ->get();

        $gugurCount = 0;

        foreach ($participants as $peserta) {
            $mahasiswa = $peserta->mahasiswa;
            if (!$mahasiswa) continue;

            // 2. Check last 3 days of recorded attendance
            $last3Days = AbsensiHarian::where('mahasiswa_id', $mahasiswa->id)
                ->orderBy('tanggal', 'desc')
                ->take(3)
                ->get();
            
            // Only evaluate if we have at least 3 days of records
            if ($last3Days->count() < 3) continue;

            // Rule: All 3 must be 'tanpa_keterangan'
            $allAbsent = $last3Days->every(fn($record) => $record->status === 'tanpa_keterangan');
            if (!$allAbsent) continue;

            // Verify dates are truly consecutive (not just any 3 random records)
            $dates = $last3Days->pluck('tanggal')->sort()->values();
            $isConsecutive = $dates[0]->diffInDays($dates[1]) === 1
                && $dates[1]->diffInDays($dates[2]) === 1;

            if (!$isConsecutive) continue;

            // 3. Rule: 3 consecutive days missing = gugur
            PesertaKkn::where('id', $peserta->id)->update([
                'status' => 'gugur',
                'rejection_reason' => 'Dinyatakan gugur oleh sistem (Alpa 3 hari berturut-turut).',
                'last_rejected_at' => now(),
            ]);
            
            $this->warn("Mahasiswa NIM {$mahasiswa->nim} ({$mahasiswa->nama}) dinyatakan GUGUR (Alpa 3 hari berturut-turut).");
            $gugurCount++;
        }

        $this->info("Pengecekan selesai. Total mahasiswa gugur: {$gugurCount}");
    }
}
