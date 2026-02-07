<?php

namespace App\Repositories\Eloquent;

use App\Models\Registration;
use App\Repositories\Contracts\RegistrationRepositoryInterface;

class RegistrationRepository implements RegistrationRepositoryInterface
{
    public function findForStudentPeriod(int $studentId, int $periodId): ?Registration
    {
        return Registration::query()
            ->where('student_id', $studentId)
            ->where('period_id', $periodId)
            ->first();
    }

    public function create(array $data): Registration
    {
        return Registration::create($data);
    }
}
