<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\AuditService;
use App\Services\AutomaticGroupPlacementService;
use App\Services\GroupSelectionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Service for handling registration approval workflow.
 * Extracted from PesertaKknController to reduce controller bloat.
 */
class RegistrationApprovalService
{
    public function __construct(
        private readonly GroupSelectionService $groupSelectionService,
        private readonly AutomaticGroupPlacementService $automaticGroupPlacementService,
    ) {}

    /**
     * Prepare group placement for approval with validation.
     */
    public function prepareForApproval(PesertaKkn $registration): PesertaKkn
    {
        $registration->loadMissing(['mahasiswa', 'periode']);

        if (! $registration->mahasiswa) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
            ]);
        }

        if ($registration->periode?->usesAutomaticPlacementAfterApproval() && ! $registration->kelompok_id) {
            return $this->autoPlaceGroup($registration);
        }

        $this->validateAssignedGroup($registration);

        return $registration;
    }

    /**
     * Approve a single registration.
     */
    public function approve(PesertaKkn $registration, int $approvedBy): void
    {
        DB::transaction(function () use ($registration, $approvedBy) {
            $prepared = $this->prepareForApproval($registration);

            $prepared->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $approvedBy,
            ]);

            AuditService::log(
                'REGISTRATION_APPROVAL',
                "Pendaftaran disetujui untuk Mahasiswa ID {$registration->mahasiswa_id}",
                $registration
            );
        });
    }

    /**
     * Bulk approve registrations with batch stability.
     */
    public function bulkApprove(array $ids, int $approvedBy, bool $isFacultyAdmin = false, ?int $facultyId = null): int
    {
        $totalCount = 0;
        $batchSize = 25; // Smaller batches for high-concurrency environments

        $idBatches = array_chunk($ids, $batchSize);

        foreach ($idBatches as $batchIds) {
            $batchCount = DB::transaction(function () use ($batchIds, $approvedBy, $isFacultyAdmin, $facultyId) {
                $registrations = PesertaKkn::query()
                    ->with(['mahasiswa', 'periode'])
                    ->whereIn('id', $batchIds)
                    ->where('status', 'pending')
                    ->when($isFacultyAdmin, function ($query) use ($facultyId) {
                        $query->whereHas('mahasiswa', fn ($q) => $q->where('faculty_id', $facultyId));
                    })
                    ->lockForUpdate()
                    ->get();

                foreach ($registrations as $registration) {
                    // This handles auto-placement if enabled
                    $prepared = $this->prepareForApproval($registration);

                    $prepared->update([
                        'status' => 'approved',
                        'approved_at' => now(),
                        'approved_by' => $approvedBy,
                    ]);

                    AuditService::log(
                        'BULK_REGISTRATION_APPROVAL',
                        "Pendaftaran disetujui secara massal untuk Mahasiswa ID {$registration->mahasiswa_id}",
                        $registration
                    );
                }

                return $registrations->count();
            });

            $totalCount += $batchCount;
        }

        return $totalCount;
    }

    /**
     * Bulk reject registrations with batch stability.
     */
    public function bulkReject(array $ids, string $reason, int $rejectedBy, bool $isFacultyAdmin = false, ?int $facultyId = null): int
    {
        $totalCount = 0;
        $batchSize = 50;

        $idBatches = array_chunk($ids, $batchSize);

        foreach ($idBatches as $batchIds) {
            $batchCount = DB::transaction(function () use ($batchIds, $reason, $rejectedBy, $isFacultyAdmin, $facultyId) {
                $registrations = PesertaKkn::query()
                    ->whereIn('id', $batchIds)
                    ->where('status', 'pending')
                    ->when($isFacultyAdmin, function ($query) use ($facultyId) {
                        $query->whereHas('mahasiswa', fn ($q) => $q->where('faculty_id', $facultyId));
                    })
                    ->lockForUpdate()
                    ->get();

                foreach ($registrations as $registration) {
                    $registration->update([
                        'status' => 'rejected',
                        'rejection_reason' => $reason,
                        'last_rejected_at' => now(),
                        'last_rejected_by' => $rejectedBy,
                    ]);

                    AuditService::log(
                        'BULK_REGISTRATION_REJECTION',
                        "Pendaftaran ditolak secara massal. Alasan: {$reason}",
                        $registration
                    );
                }

                return $registrations->count();
            });

            $totalCount += $batchCount;
        }

        return $totalCount;
    }

    /**
     * Assign group to approved registration.
     */
    public function assignGroup(PesertaKkn $registration, int $kelompokId, string $role = 'Anggota'): void
    {
        DB::transaction(function () use ($registration, $kelompokId, $role) {
            $registration->loadMissing('mahasiswa');

            if (! $registration->mahasiswa) {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
                ]);
            }

            if ($registration->status !== 'approved') {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Mahasiswa hanya dapat dipindahkan ke kelompok setelah pendaftaran disetujui admin.',
                ]);
            }

            $kelompok = KelompokKkn::query()
                ->whereKey($kelompokId)
                ->where('period_id', $registration->period_id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (! $kelompok) {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Kelompok tujuan tidak ditemukan pada periode yang sama atau statusnya tidak aktif.',
                ]);
            }

            $excludeRegistrationId = $registration->kelompok_id === $kelompok->id
                ? $registration->id
                : null;

            $this->groupSelectionService->validateGroupAcceptance(
                $kelompok,
                $registration->mahasiswa,
                $excludeRegistrationId
            );

            $this->groupSelectionService->assignGroup(
                $registration,
                $registration->mahasiswa,
                $kelompok->id
            );

            $registration->update(['role' => $role]);

            AuditService::log(
                'GROUP_ASSIGNMENT',
                "Mahasiswa dipindahkan ke kelompok ID {$kelompokId} sebagai {$role}",
                $registration
            );
        });
    }

    /**
     * Make a student the group leader.
     */
    public function makeLeader(PesertaKkn $registration): void
    {
        if (! $registration->kelompok_id) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Mahasiswa harus ditempatkan di kelompok terlebih dahulu.',
            ]);
        }

        if ($registration->status !== 'approved') {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Hanya mahasiswa yang sudah disetujui yang dapat menjadi ketua kelompok.',
            ]);
        }

        DB::transaction(function () use ($registration) {
            // Reset all other members in the same group to 'Anggota'
            PesertaKkn::where('kelompok_id', $registration->kelompok_id)
                ->where('id', '!=', $registration->id)
                ->update(['role' => 'Anggota']);

            // Set this student as 'Ketua'
            $registration->update(['role' => 'Ketua']);

            AuditService::log(
                'GROUP_LEADER_ASSIGN',
                'Mahasiswa diangkat menjadi Ketua Kelompok',
                $registration
            );
        });
    }

    /**
     * Download registration document with security checks.
     */
    public function downloadDocument(string $path, ?object $user = null): string
    {
        if (blank($path) || ! Storage::disk('local')->exists($path)) {
            throw ValidationException::withMessages([
                'path' => 'Dokumen tidak ditemukan.',
            ]);
        }

        // Security check: Only allow specific folders
        if (! str_starts_with($path, 'health-certificates/') && ! str_starts_with($path, 'parent-permissions/')) {
            throw ValidationException::withMessages([
                'path' => 'Akses folder ditolak.',
            ]);
        }

        // Path traversal prevention
        $storageRoot = Storage::disk('local')->path('');
        $fullPath = realpath($storageRoot.'/'.$path);

        if (! $fullPath) {
            throw ValidationException::withMessages([
                'path' => 'Dokumen tidak ditemukan.',
            ]);
        }

        // Verify the resolved path is within allowed directories
        $allowedPrefixes = ['health-certificates', 'parent-permissions'];
        $isAllowed = false;
        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($fullPath, realpath($storageRoot.'/'.$prefix))) {
                $isAllowed = true;
                break;
            }
        }

        if (! $isAllowed) {
            throw ValidationException::withMessages([
                'path' => 'Akses ditolak: Path traversal terdeteksi.',
            ]);
        }

        return $fullPath;
    }

    /**
     * Auto-place student into a group.
     */
    private function autoPlaceGroup(PesertaKkn $registration): PesertaKkn
    {
        try {
            $group = $this->automaticGroupPlacementService->selectGroupForStudent(
                $registration->mahasiswa,
                (int) $registration->period_id,
            );
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first()
                ?: 'Belum ada kelompok yang valid untuk penempatan otomatis.';

            throw ValidationException::withMessages([
                'kelompok_id' => $message,
            ]);
        }

        return $this->groupSelectionService->assignGroup(
            $registration,
            $registration->mahasiswa,
            $group->id
        );
    }

    /**
     * Validate an already assigned group.
     */
    private function validateAssignedGroup(PesertaKkn $registration): void
    {
        if (! $registration->kelompok_id) {
            return;
        }

        $kelompok = KelompokKkn::query()
            ->whereKey($registration->kelompok_id)
            ->where('period_id', $registration->period_id)
            ->where('status', 'active')
            ->lockForUpdate()
            ->first();

        if (! $kelompok) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Kelompok yang dipilih sudah tidak aktif atau tidak berada pada periode pendaftaran yang sama.',
            ]);
        }

        try {
            $this->groupSelectionService->validateGroupAcceptance(
                $kelompok,
                $registration->mahasiswa,
                $registration->id
            );
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first()
                ?: 'Kelompok yang dipilih tidak valid.';

            throw ValidationException::withMessages([
                'kelompok_id' => $message,
            ]);
        }
    }
}
