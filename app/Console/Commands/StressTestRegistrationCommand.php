<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\AntrianKkn;
use App\Models\KKN\Fakultas;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Lokasi;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Prodi;
use App\Models\KKN\SystemSetting;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schema;
use Spatie\Permission\Models\Role;
use Symfony\Component\Process\Process;

class StressTestRegistrationCommand extends Command
{
    protected $signature = 'kkn:stress-registration
        {--students=60 : Jumlah mahasiswa yang ikut simulasi}
        {--capacity=40 : Kapasitas kelompok target}
        {--parallel=20 : Jumlah worker paralel}
        {--lock-wait=3 : Waktu tunggu lock pendaftaran dalam detik}
        {--lock-ttl=5 : Masa hidup lock pendaftaran dalam detik}
        {--male-ratio=20 : Minimum persentase laki-laki}
        {--male-target=30 : Target persentase laki-laki}
        {--cleanup : Hapus data simulasi setelah selesai}';

    protected $description = 'Simulasi lokal rebutan kelompok untuk menguji lock, kapasitas, dan fairness pendaftaran.';

    public function handle(): int
    {
        $studentsCount = max(1, (int) $this->option('students'));
        $capacity = max(1, (int) $this->option('capacity'));
        $parallel = max(1, min($studentsCount, (int) $this->option('parallel')));
        $lockWait = max(1, (int) $this->option('lock-wait'));
        $lockTtl = max($lockWait + 1, (int) $this->option('lock-ttl'));
        $maleRatio = max(0, min(100, (int) $this->option('male-ratio')));
        $maleTarget = max($maleRatio, min(100, (int) $this->option('male-target')));
        $cleanup = (bool) $this->option('cleanup');

        $this->ensureStressEnvironmentReady();

        $this->components->info('Menyiapkan data simulasi rebutan kelompok...');

        Role::firstOrCreate(['name' => 'student', 'guard_name' => 'web']);
        SystemSetting::set('min_sks_registration', '0');
        SystemSetting::set('registration_lock_wait_seconds', (string) $lockWait);
        SystemSetting::set('registration_lock_ttl_seconds', (string) $lockTtl);
        SystemSetting::set('group_male_min_ratio', (string) $maleRatio);
        SystemSetting::set('group_male_target_ratio', (string) $maleTarget);

        $runToken = now()->format('Ymd_His').'_'.str()->lower(str()->random(6));

        $faculty = Fakultas::factory()->create([
            'nama' => "Fakultas Stress {$runToken}",
        ]);
        $program = Prodi::factory()->create([
            'faculty_id' => $faculty->id,
            'nama' => "Prodi Stress {$runToken}",
        ]);
        $location = Lokasi::factory()->create([
            'village_name' => "Desa Stress {$runToken}",
            'district_name' => 'Kecamatan Simulasi',
            'regency_name' => 'Kabupaten Uji Beban',
        ]);
        $period = Periode::factory()->active()->create([
            'name' => "Periode Stress {$runToken}",
            'registration_start' => now()->subDay()->toDateString(),
            'registration_end' => now()->addDay()->toDateString(),
        ]);
        $group = KelompokKkn::factory()->create([
            'period_id' => $period->id,
            'location_id' => $location->id,
            'nama_kelompok' => "Kelompok Stress {$runToken}",
            'status' => 'active',
            'capacity' => $capacity,
        ]);

        $students = collect();
        for ($i = 1; $i <= $studentsCount; $i++) {
            $user = User::factory()->create([
                'username' => "stress_{$runToken}_{$i}",
                'email' => "stress_{$runToken}_{$i}@example.test",
            ]);
            $user->assignRole('student');

            $student = Mahasiswa::factory()->create([
                'user_id' => $user->id,
                'faculty_id' => $faculty->id,
                'program_id' => $program->id,
                'gender' => 'L',
            ]);

            $students->push($student);
        }

        $this->line("Periode: {$period->id} | Kelompok: {$group->id} | Mahasiswa uji: {$studentsCount} | Paralel: {$parallel}");
        $this->line("Lock wait: {$lockWait} detik | Lock TTL: {$lockTtl} detik");

        $startedAt = microtime(true);
        $results = $this->runWorkers($students, $period->id, $group->id, $parallel);
        $elapsed = microtime(true) - $startedAt;

        $successCount = $results->where('status', 'success')->count();
        $validationCount = $results->where('status', 'validation_error')->count();
        $runtimeCount = $results->where('status', 'runtime_error')->count();
        $lockTimeoutCount = $results->filter(fn (array $result) => str_contains((string) ($result['message'] ?? ''), 'lonjakan pendaftaran'))->count();
        $fullGroupCount = $results->filter(fn (array $result) => str_contains((string) ($result['message'] ?? ''), 'Kelompok sudah penuh'))->count();

        $registeredCount = PesertaKkn::query()
            ->where('period_id', $period->id)
            ->where('kelompok_id', $group->id)
            ->whereIn('status', ['pending', 'document_submitted', 'approved'])
            ->count();

        $maxDuration = (float) $results->max('duration_ms');
        $avgDuration = round((float) $results->avg('duration_ms'), 2);

        $this->newLine();
        $this->components->twoColumnDetail('Total permintaan', (string) $studentsCount);
        $this->components->twoColumnDetail('Berhasil masuk kelompok', (string) $successCount);
        $this->components->twoColumnDetail('Gagal validasi', (string) $validationCount);
        $this->components->twoColumnDetail('Gagal runtime', (string) $runtimeCount);
        $this->components->twoColumnDetail('Mentok lock timeout', (string) $lockTimeoutCount);
        $this->components->twoColumnDetail('Mentok kelompok penuh', (string) $fullGroupCount);
        $this->components->twoColumnDetail('Isi kelompok akhir', "{$registeredCount} / {$capacity}");
        $this->components->twoColumnDetail('Durasi total', round($elapsed, 2).' detik');
        $this->components->twoColumnDetail('Rata-rata per worker', $avgDuration.' ms');
        $this->components->twoColumnDetail('Puncak durasi worker', round($maxDuration, 2).' ms');
        $this->components->twoColumnDetail('Throughput kasar', round($studentsCount / max($elapsed, 0.001), 2).' req/detik');

        if ($registeredCount > $capacity) {
            $this->components->error("Oversubscribe terdeteksi: {$registeredCount} melebihi kapasitas {$capacity}.");
        } else {
            $this->components->info('Tidak ada oversubscribe. Lock dan cek kapasitas menahan slot dengan benar.');
        }

        $topMessages = $results
            ->pluck('message')
            ->filter()
            ->countBy()
            ->sortDesc()
            ->take(5);

        if ($topMessages->isNotEmpty()) {
            $this->newLine();
            $this->line('Ringkasan hasil teratas:');
            foreach ($topMessages as $message => $count) {
                $this->line("- {$count}x {$message}");
            }
        }

        if ($cleanup) {
            $this->cleanupSimulationData($students, $group, $period, $location, $program, $faculty);
            $this->newLine();
            $this->components->info('Data simulasi sudah dibersihkan kembali.');
        }

        return $runtimeCount === 0 && $registeredCount <= $capacity
            ? Command::SUCCESS
            : Command::FAILURE;
    }

    private function runWorkers(Collection $students, int $periodId, int $groupId, int $parallel): Collection
    {
        $pendingIds = $students->pluck('id')->values()->all();
        $running = [];
        $results = collect();

        while ($pendingIds !== [] || $running !== []) {
            while (count($running) < $parallel && $pendingIds !== []) {
                $studentId = array_shift($pendingIds);
                $process = new Process([
                    PHP_BINARY,
                    base_path('artisan'),
                    'kkn:stress-registration-worker',
                    (string) $studentId,
                    (string) $periodId,
                    (string) $groupId,
                ], base_path(), null, null, 120);

                $process->start();
                $running[$studentId] = $process;
            }

            foreach ($running as $studentId => $process) {
                if ($process->isRunning()) {
                    continue;
                }

                $results->push($this->parseWorkerOutput($studentId, $process));
                unset($running[$studentId]);
            }

            usleep(20_000);
        }

        return $results;
    }

    private function parseWorkerOutput(int $studentId, Process $process): array
    {
        $output = trim($process->getOutput());
        $fallback = [
            'student_id' => $studentId,
            'status' => 'runtime_error',
            'message' => $process->getErrorOutput() ?: 'Worker tidak mengembalikan hasil yang bisa dibaca.',
            'duration_ms' => null,
        ];

        if ($output === '') {
            return $fallback;
        }

        $decoded = json_decode($output, true);

        return is_array($decoded) ? $decoded : $fallback;
    }

    private function cleanupSimulationData(
        Collection $students,
        KelompokKkn $group,
        Periode $period,
        Lokasi $location,
        Prodi $program,
        Fakultas $faculty,
    ): void {
        PesertaKkn::query()->where('period_id', $period->id)->delete();

        $studentIds = $students->pluck('id');
        $userIds = $students->pluck('user_id');

        AntrianKkn::query()->where('period_id', $period->id)->whereIn('mahasiswa_id', $studentIds)->delete();
        Mahasiswa::query()->whereIn('id', $studentIds)->delete();
        User::query()->whereIn('id', $userIds)->delete();

        $group->delete();
        $period->delete();
        $location->delete();
        $program->delete();
        $faculty->delete();
    }

    private function ensureStressEnvironmentReady(): void
    {
        $defaultConnection = (string) config('database.default');
        $defaultDatabase = (string) config("database.connections.{$defaultConnection}.database");
        $kknDatabase = (string) config('database.connections.kkn.database');

        $defaultReady = Schema::connection($defaultConnection)->hasTable('users');
        $kknReady = Schema::connection('kkn')->hasTable('periode')
            && Schema::connection('kkn')->hasTable('kelompok_kkn')
            && Schema::connection('kkn')->hasTable('peserta_kkn');

        if ($defaultReady && $kknReady) {
            return;
        }

        $isSafeEphemeralDatabase = str_contains($defaultDatabase, '_test') || str_contains($kknDatabase, '_test');

        if (! $isSafeEphemeralDatabase) {
            $this->fail('Database target untuk stress test belum siap. Jalankan migrasi terlebih dahulu pada database yang aman untuk pengujian.');
        }

        $this->components->warn('Schema database uji belum lengkap. Menjalankan migrasi otomatis terlebih dahulu...');
        Artisan::call('migrate', ['--force' => true]);
        $this->output->write(Artisan::output());
    }
}
