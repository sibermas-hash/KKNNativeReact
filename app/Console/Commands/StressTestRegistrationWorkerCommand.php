<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\Mahasiswa;
use App\Services\RegistrationService;
use Illuminate\Console\Command;
use Illuminate\Validation\ValidationException;
use Throwable;

class StressTestRegistrationWorkerCommand extends Command
{
    protected $signature = 'kkn:stress-registration-worker
        {student_id : ID mahasiswa yang akan diproses}
        {period_id : ID periode target}
        {group_id : ID kelompok target}';

    protected $description = 'Worker internal untuk simulasi rebutan kelompok secara paralel.';

    public function handle(RegistrationService $registrationService): int
    {
        $startedAt = hrtime(true);
        $studentId = (int) $this->argument('student_id');
        $periodId = (int) $this->argument('period_id');
        $groupId = (int) $this->argument('group_id');

        try {
            $mahasiswa = Mahasiswa::query()->findOrFail($studentId);
            $registration = $registrationService->register($mahasiswa, $periodId, $groupId, 'Simulasi stress test rebutan kelompok');

            $result = [
                'student_id' => $studentId,
                'status' => 'success',
                'message' => 'Berhasil masuk kelompok.',
                'registration_id' => $registration->id,
                'group_id' => $registration->kelompok_id,
                'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ];
        } catch (ValidationException $exception) {
            $result = [
                'student_id' => $studentId,
                'status' => 'validation_error',
                'message' => collect($exception->errors())->flatten()->implode(' '),
                'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ];
        } catch (Throwable $exception) {
            $result = [
                'student_id' => $studentId,
                'status' => 'runtime_error',
                'message' => $exception->getMessage(),
                'exception' => $exception::class,
                'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ];
        }

        $this->output->write(json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));

        return Command::SUCCESS;
    }
}
