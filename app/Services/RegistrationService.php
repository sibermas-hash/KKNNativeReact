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

    public function register(Mahasiswa $mahasiswa, int $periodeId, ?string $notes): PesertaKkn
    {
        $existing = $this->registrations->findForMahasiswaPeriode($mahasiswa->id, $periodeId);

        if ($existing) {
            throw ValidationException::withMessages([
                'period_id' => 'Anda sudah terdaftar pada periode ini.',
            ]);
        }

        return $this->registrations->create([
            'mahasiswa_id' => $mahasiswa->id,
            'period_id' => $periodeId,
            'notes' => $notes,
            'status' => 'pending',
        ]);
    }
}
