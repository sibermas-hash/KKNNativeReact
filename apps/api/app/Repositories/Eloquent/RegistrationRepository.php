<?php

declare(strict_types=1);

namespace App\Repositories\Eloquent;

use App\Models\KKN\PesertaKkn;
use App\Repositories\Contracts\RegistrationRepositoryInterface;

class RegistrationRepository implements RegistrationRepositoryInterface
{
    public function findForMahasiswaPeriode(int $mahasiswaId, int $periodeId): ?PesertaKkn
    {
        return PesertaKkn::query()
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('periode_id', $periodeId)
            ->first();
    }

    public function create(array $data): PesertaKkn
    {
        return PesertaKkn::create($data);
    }
}
