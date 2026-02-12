<?php

namespace App\Repositories\Contracts;

use App\Models\KKN\PesertaKkn;

interface RegistrationRepositoryInterface
{
    public function findForMahasiswaPeriode(int $mahasiswaId, int $periodeId): ?PesertaKkn;

    public function create(array $data): PesertaKkn;
}
