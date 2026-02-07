<?php

namespace App\Repositories\Contracts;

use App\Models\Registration;

interface RegistrationRepositoryInterface
{
    public function findForStudentPeriod(int $studentId, int $periodId): ?Registration;

    public function create(array $data): Registration;
}
