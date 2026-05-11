<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

/**
 * Local-dev seeder — minimal fake SIAKAD data.
 *
 * Audit follow-up: the old codebase had MasterDataSeeder / SyncFromApiSeeder
 * to bootstrap a local DB without hitting the real SIAKAD. That pattern is
 * preserved here using the current stack's idioms:
 *
 *   - `firstOrCreate` on every row so repeat runs are safe
 *   - gated to local/testing environments (hard refuse in production)
 *   - creates 2 fakultas, 3 prodi, 5 dosen, 20 mahasiswa — enough to
 *     exercise the registration → group → grading flow end-to-end
 *   - all fake users get the same password: `dev-password` (see top)
 *
 * Usage:
 *   php artisan db:seed --class=LocalDevSeeder
 *
 * This seeder is NOT included in DatabaseSeeder::run() — it must be run
 * explicitly. This prevents accidental production seeding.
 */
class LocalDevSeeder extends Seeder
{
    private const DEV_PASSWORD = 'dev-password';

    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException(
                'LocalDevSeeder refuses to run outside local/testing environments. '.
                'APP_ENV='.app()->environment()
            );
        }

        $this->command?->info('Seeding fake SIAKAD data for local development…');

        // Ensure the baseline roles exist (RoleSeeder normally does this).
        foreach (['superadmin', 'admin', 'faculty_admin', 'dosen', 'dpl', 'student'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        [$fakultas, $prodi] = $this->seedMasterData();
        $this->seedDosen($fakultas);
        $this->seedMahasiswa($fakultas, $prodi);

        $this->command?->info('LocalDevSeeder done.');
        $this->command?->line('');
        $this->command?->line('  All fake accounts use password: <options=bold>'.self::DEV_PASSWORD.'</>');
        $this->command?->line('  Student usernames: MHS000001 .. MHS000020');
        $this->command?->line('  Dosen usernames  : DSN000001 .. DSN000005');
        $this->command?->line('');
    }

    /**
     * @return array{0: Collection<int,Fakultas>, 1: Collection<int,Prodi>}
     */
    private function seedMasterData(): array
    {
        $fakultasRows = [
            ['code' => 'FTIK', 'nama' => 'Fakultas Tarbiyah dan Ilmu Keguruan', 'master_id' => 'DEV-FTIK'],
            ['code' => 'FSBA', 'nama' => 'Fakultas Syariah', 'master_id' => 'DEV-FSBA'],
        ];

        $fakultas = collect();
        foreach ($fakultasRows as $row) {
            $fakultas->push(Fakultas::firstOrCreate(
                ['code' => $row['code']],
                ['nama' => $row['nama'], 'master_id' => $row['master_id']]
            ));
        }

        $prodiRows = [
            ['code' => 'PAI', 'nama' => 'Pendidikan Agama Islam', 'fakultas_code' => 'FTIK', 'master_id' => 'DEV-PAI'],
            ['code' => 'MPI', 'nama' => 'Manajemen Pendidikan Islam', 'fakultas_code' => 'FTIK', 'master_id' => 'DEV-MPI'],
            ['code' => 'HKI', 'nama' => 'Hukum Keluarga Islam', 'fakultas_code' => 'FSBA', 'master_id' => 'DEV-HKI'],
        ];

        $prodi = collect();
        foreach ($prodiRows as $row) {
            $fId = $fakultas->firstWhere('code', $row['fakultas_code'])->id;
            $prodi->push(Prodi::firstOrCreate(
                ['code' => $row['code']],
                ['nama' => $row['nama'], 'fakultas_id' => $fId, 'master_id' => $row['master_id']]
            ));
        }

        return [$fakultas, $prodi];
    }

    private function seedDosen($fakultas): void
    {
        for ($i = 1; $i <= 5; $i++) {
            $nip = 'DSN'.str_pad((string) $i, 6, '0', STR_PAD_LEFT);
            $fId = $fakultas->random()->id;
            $name = "Dr. Dosen Dummy {$i}, M.Pd.";

            $user = User::firstOrCreate(
                ['username' => $nip],
                [
                    'name' => $name,
                    'email' => strtolower($nip).'@dev.local',
                    'password' => Hash::make(self::DEV_PASSWORD),
                    'is_active' => true,
                    'must_change_password' => false,
                    'password_changed_at' => now(),
                ]
            );
            if (! $user->hasRole('dosen')) {
                $user->assignRole('dosen');
            }

            Dosen::firstOrCreate(
                ['nip' => $nip],
                [
                    'user_id' => $user->id,
                    'nama' => $name,
                    'fakultas_id' => $fId,
                    'gender' => $i % 2 === 0 ? 'P' : 'L',
                    'birth_date' => now()->subYears(40 + $i)->toDateString(),
                    'master_id' => 'DEV-'.$nip,
                    'master_synced_at' => now(),
                ]
            );
        }
    }

    private function seedMahasiswa($fakultas, $prodi): void
    {
        for ($i = 1; $i <= 20; $i++) {
            $nim = 'MHS'.str_pad((string) $i, 6, '0', STR_PAD_LEFT);
            $name = "Mahasiswa Dummy {$i}";
            $prodiRow = $prodi->random();
            $fId = $prodiRow->fakultas_id;

            $user = User::firstOrCreate(
                ['username' => $nim],
                [
                    'name' => $name,
                    'email' => strtolower($nim).'@dev.local',
                    'password' => Hash::make(self::DEV_PASSWORD),
                    'is_active' => true,
                    'must_change_password' => false,
                    'password_changed_at' => now(),
                ]
            );
            if (! $user->hasRole('student')) {
                $user->assignRole('student');
            }

            Mahasiswa::firstOrCreate(
                ['nim' => $nim],
                [
                    'user_id' => $user->id,
                    'nama' => $name,
                    'fakultas_id' => $fId,
                    'prodi_id' => $prodiRow->id,
                    'batch_year' => now()->year - 3,
                    'gender' => $i % 2 === 0 ? 'P' : 'L',
                    'birth_date' => now()->subYears(19 + ($i % 3))->toDateString(),
                    'sks_completed' => 120 + ($i % 20),
                    'gpa' => 3.0 + (($i % 10) / 10),
                    'master_id' => 'DEV-'.$nim,
                    'master_synced_at' => now(),
                ]
            );
        }
    }
}
