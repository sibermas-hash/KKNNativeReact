<?php

namespace App\Console\Commands;

use App\Models\KKN\AbsensiHarian;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\KegiatanKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Notifications\KknActivityNotification;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class CekAbsensiHarian extends Command
{
    protected $signature = 'kkn:cek-absensi {--date= : Tanggal yang dicek (default: kemarin)}';
    protected $description = 'Cek absensi harian mahasiswa KKN dan catat yang tidak mengisi logbook atau izin';

    public function handle(): int
    {
        $date = $this->option('date') ? now()->parse($this->option('date')) : now()->subDay();
        $this->info("Mengecek absensi untuk tanggal: {$date->format('Y-m-d')}");

        // Ambil semua periode yang sedang berjalan
        $activePeriods = Periode::where('status', 'berjalan')
            ->where('tanggal_mulai', '<=', $date)
            ->where('tanggal_selesai', '>=', $date)
            ->get();

        if ($activePeriods->isEmpty()) {
            $this->warn('Tidak ada periode KKN yang berjalan pada tanggal ini.');
            return self::SUCCESS;
        }

        $totalChecked = 0;
        $totalAbsent = 0;
        $totalWithoutInfo = 0;

        foreach ($activePeriods as $period) {
            $this->info("\nMemeriksa periode: {$period->name}");

            // Ambil semua mahasiswa yang terdaftar aktif di periode ini
            $mahasiswaIds = \App\Models\KKN\PesertaKkn::where('periode_id', $period->id)
                ->where('status', 'approved')
                ->pluck('mahasiswa_id');

            foreach ($mahasiswaIds as $mahasiswaId) {
                $totalChecked++;
                $mahasiswa = Mahasiswa::find($mahasiswaId);
                if (!$mahasiswa) continue;

                $kelompokId = \App\Models\KKN\PesertaKkn::where('mahasiswa_id', $mahasiswaId)
                    ->where('periode_id', $period->id)
                    ->value('kelompok_id');

                // Cek apakah sudah ada absensi untuk tanggal ini
                $existingAbsensi = AbsensiHarian::where('mahasiswa_id', $mahasiswaId)
                    ->where('tanggal', $date)
                    ->first();

                if ($existingAbsensi) {
                    $this->line("  ✓ {$mahasiswa->nama}: Sudah tercatat ({$existingAbsensi->status})");
                    continue;
                }

                // Cek apakah ada logbook hari ini
                $hasLogbook = KegiatanKkn::where('mahasiswa_id', $mahasiswaId)
                    ->whereDate('tanggal', $date)
                    ->exists();

                // Cek apakah ada izin yang disetujui untuk hari ini
                $hasApprovedIzin = IzinMeninggalkan::where('mahasiswa_id', $mahasiswaId)
                    ->where('status', 'disetujui')
                    ->where('tanggal_mulai', '<=', $date)
                    ->where('tanggal_kembali', '>=', $date)
                    ->exists();

                // Tentukan status absensi
                if ($hasLogbook) {
                    $status = 'hadir';
                } elseif ($hasApprovedIzin) {
                    $status = 'izin';
                    $izinId = IzinMeninggalkan::where('mahasiswa_id', $mahasiswaId)
                        ->where('status', 'disetujui')
                        ->where('tanggal_mulai', '<=', $date)
                        ->where('tanggal_kembali', '>=', $date)
                        ->value('id');
                } else {
                    $status = 'tanpa_keterangan';
                    $totalWithoutInfo++;
                }

                // Catat absensi
                AbsensiHarian::create([
                    'mahasiswa_id' => $mahasiswaId,
                    'kelompok_id' => $kelompokId,
                    'tanggal' => $date,
                    'status' => $status,
                    'izin_id' => $status === 'izin' ? ($izinId ?? null) : null,
                ]);

                if ($status === 'tanpa_keterangan') {
                    $totalAbsent++;
                    $this->warn("  ✗ {$mahasiswa->nama}: Tanpa keterangan");

                    // Cek akumulasi hari tanpa keterangan
                    $daysWithoutInfo = AbsensiHarian::where('mahasiswa_id', $mahasiswaId)
                        ->where('status', 'tanpa_keterangan')
                        ->count();

                    if ($daysWithoutInfo >= 3) {
                        $this->error("  ⚠ {$mahasiswa->nama}: {$daysWithoutInfo} hari tanpa keterangan! (Batas: 3 hari)");

                        // Notifikasi ke LPPM/Admin
                        if ($mahasiswa->user) {
                            // Notifikasi ke mahasiswa
                            $mahasiswa->user->notify(new KknActivityNotification([
                                'type' => 'danger',
                                'title' => 'Peringatan Absensi',
                                'message' => "Anda telah {$daysWithoutInfo} hari tanpa keterangan. Jika mencapai 3 hari, Anda akan dianggap mengundurkan diri dari KKN.",
                                'icon' => 'exclamation-triangle',
                                'url' => route('student.dashboard'),
                            ]));
                        }
                    }
                }
            }
        }

        $this->newLine();
        $this->info("═══════════════════════════════════════");
        $this->info("REKAP ABSENSI HARIAN");
        $this->info("═══════════════════════════════════════");
        $this->line("Total dicek: {$totalChecked}");
        $this->line("Tanpa keterangan: {$totalWithoutInfo}");
        $this->info("═══════════════════════════════════════");

        return self::SUCCESS;
    }
}
