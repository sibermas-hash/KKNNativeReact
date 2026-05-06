<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Helpers\PasswordHelper;
use App\Models\KKN\Dosen;
use App\Models\KKN\Mahasiswa;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetDefaultPasswords extends Command
{
    protected $signature = 'users:reset-default-password
                            {--role=all : Target role: mahasiswa, dosen, or all}
                            {--force : Reset even users who have already changed their password}';

    protected $description = 'Reset password default mahasiswa & dosen ke DDMMYYYY berdasarkan tanggal lahir';

    public function handle(): int
    {
        $role = $this->option('role');
        $force = $this->option('force');

        if (in_array($role, ['mahasiswa', 'all'])) {
            $this->resetMahasiswa($force);
        }

        if (in_array($role, ['dosen', 'all'])) {
            $this->resetDosen($force);
        }

        return self::SUCCESS;
    }

    private function resetMahasiswa(bool $force): void
    {
        $this->info('Mereset password mahasiswa...');

        $query = Mahasiswa::with('user')->whereHas('user');
        if (! $force) {
            $query->whereHas('user', fn ($q) => $q->where('must_change_password', true));
        }

        $total = 0;
        $skipped = 0;

        $query->chunkById(100, function ($rows) use (&$total, &$skipped) {
            foreach ($rows as $mahasiswa) {
                $user = $mahasiswa->user;
                if (! $user) {
                    continue;
                }

                $password = PasswordHelper::fromBirthDate(
                    $mahasiswa->birth_date ? (string) $mahasiswa->birth_date : null,
                    $mahasiswa->nim
                );

                if ($password === $mahasiswa->nim) {
                    $skipped++;
                }

                $user->password = Hash::make($password);
                $user->must_change_password = true;
                $user->save();
                $total++;
            }
        });

        $this->info("  ✓ {$total} mahasiswa direset" . ($skipped ? " ({$skipped} fallback ke NIM karena tidak ada tanggal lahir)" : ''));
    }

    private function resetDosen(bool $force): void
    {
        $this->info('Mereset password dosen...');

        $query = Dosen::with('user')->whereHas('user');
        if (! $force) {
            $query->whereHas('user', fn ($q) => $q->where('must_change_password', true));
        }

        $total = 0;
        $skipped = 0;

        $query->chunkById(100, function ($rows) use (&$total, &$skipped) {
            foreach ($rows as $dosen) {
                $user = $dosen->user;
                if (! $user) {
                    continue;
                }

                $password = PasswordHelper::fromBirthDate(
                    $dosen->birth_date ? (string) $dosen->birth_date : null,
                    $dosen->nip
                );

                if ($password === $dosen->nip) {
                    $skipped++;
                }

                $user->password = Hash::make($password);
                $user->must_change_password = true;
                $user->save();
                $total++;
            }
        });

        $this->info("  ✓ {$total} dosen direset" . ($skipped ? " ({$skipped} fallback ke NIP karena tidak ada tanggal lahir)" : ''));
    }
}
