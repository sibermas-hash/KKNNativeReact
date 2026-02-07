<?php

namespace App\Services;

use App\Models\Registration;
use App\Models\Student;
use App\Repositories\Contracts\RegistrationRepositoryInterface;
use Illuminate\Validation\ValidationException;

class RegistrationService
{
    public function __construct(
        private readonly RegistrationRepositoryInterface $registrations
    ) {
    }

    public function register(Student $student, int $periodId, ?string $notes): Registration
    {
        $existing = $this->registrations->findForStudentPeriod($student->id, $periodId);

        if ($existing) {
            throw ValidationException::withMessages([
                'period_id' => 'Anda sudah terdaftar pada periode ini.',
            ]);
        }

        return $this->registrations->create([
            'student_id' => $student->id,
            'period_id' => $periodId,
            'notes' => $notes,
            'status' => 'pending',
        ]);
    }
}
