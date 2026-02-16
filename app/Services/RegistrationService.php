<?php

namespace App\Services;

use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Mahasiswa;
use App\Repositories\Contracts\RegistrationRepositoryInterface;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    public function __construct(
        private readonly RegistrationRepositoryInterface $registrations
    ) {
    }

    public function register(Mahasiswa $mahasiswa, int $periodeId, ?int $kelompokId, ?string $notes): PesertaKkn
    {
        $existing = $this->registrations->findForMahasiswaPeriode($mahasiswa->id, $periodeId);

        if ($existing) {
            throw ValidationException::withMessages([
                'period_id' => 'Anda sudah terdaftar pada periode ini.',
            ]);
        }

        if ($kelompokId) {
            $kelompok = \App\Models\KKN\KelompokKkn::withCount(['peserta' => function ($q) {
                $q->whereIn('status', ['pending', 'approved']);
            }])->find($kelompokId);

            if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
                throw ValidationException::withMessages([
                    'kelompok_id' => "Kelompok {$kelompok->nama_kelompok} sudah penuh.",
                ]);
            }
        }

        return $this->registrations->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $periodeId,
            'kelompok_id' => $kelompokId,
            'notes' => $notes,
            'status' => 'pending',
            'registration_date' => now(),
        ]);
    }
}