<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Services\AuditService;
use App\Services\AutomaticGroupPlacementService;
use App\Services\EligibilityService;
use App\Services\GroupSelectionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
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
        private readonly EligibilityService $eligibilityService,
    ) {}

    /**
     * Prepare group placement for approval with validation.
     * Note: Group placement is now OPTIONAL during approval.
     * If auto-placement is configured and groups exist, it will attempt placement.
     * If no groups exist yet, approval proceeds without a group (plotting phase later).
     */
    public function prepareForApproval(PesertaKkn $registration): PesertaKkn
    {
        $registration->loadMissing(['mahasiswa', 'periode']);

        if (! $registration->mahasiswa) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
            ]);
        }

        // If student already has a group assigned, validate it
        if ($registration->kelompok_id) {
            $this->validateAssignedGroup($registration);

            return $registration;
        }

        // If auto-placement is configured, TRY to place — but don't block approval if no groups exist
        if ($registration->periode?->usesAutomaticPlacementAfterApproval()) {
            try {
                return $this->autoPlaceGroup($registration);
            } catch (ValidationException $exception) {
                $message = collect($exception->errors())->flatten()->first();

                if ($message !== AutomaticGroupPlacementService::NO_ELIGIBLE_GROUP_MESSAGE) {
                    throw $exception;
                }

                // No groups available yet — that's OK, plotting happens later
                Log::info("Auto-placement skipped for registration #{$registration->id}: kelompok belum tersedia. Akan di-plot manual nanti.");
            }
        }

        return $registration;
    }

    /**
     * Approve a single registration.
     *
     * Approval is decoupled from group placement:
     * - FASE VERIFIKASI: Admin validates academic eligibility → status becomes 'approved'
     * - FASE PLOTTING: Admin assigns groups later (manual or bulk) → kelompok_id gets filled
     */
    public function approve(PesertaKkn $registration, int $approvedBy): void
    {
        DB::transaction(function () use ($registration, $approvedBy) {
            $registration->loadMissing(['mahasiswa', 'periode']);

            if (! $registration->mahasiswa) {
                throw ValidationException::withMessages([
                    'status' => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
                ]);
            }

            // SECURITY GATE: Verify Academic Eligibility before final approval
            // Context 'approval' skips registration-window and active-registration checks
            $eligibility = $this->eligibilityService->checkEligibility(
                $registration->mahasiswa,
                $registration->periode_id,
                [],
                'approval'
            );
            if (! $eligibility['is_eligible']) {
                $reasons = collect($eligibility['issues'])->pluck('message')->implode(', ');
                throw ValidationException::withMessages([
                    'status' => "Pendaftaran tidak dapat disetujui karena mahasiswa tidak memenuhi syarat akademik: {$reasons}",
                ]);
            }

            // Try group placement (best-effort, non-blocking)
            $prepared = $this->prepareForApproval($registration);

            $prepared->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => $approvedBy,
                'notification_shown' => false,
            ]);

            // Load and mark/archive all documents
            $registration->load('dokumen');
            $this->markAndArchiveDocuments($registration, $approvedBy);

            AuditService::log(
                'REGISTRATION_APPROVAL',
                "Pendaftaran disetujui untuk Mahasiswa ID {$registration->mahasiswa_id}"
                    .($prepared->kelompok_id ? " (Auto-placed ke kelompok #{$prepared->kelompok_id})" : ' (Belum di-plot ke kelompok)'),
                $registration
            );
        });
    }

    /**
     * Mark and archive all registration documents.
     */
    private function markAndArchiveDocuments(PesertaKkn $registration, int $userId): void
    {
        foreach ($registration->dokumen as $doc) {
            $doc->update([
                'is_verified' => true,
                'is_archived' => true,
                'verified_at' => now(),
                'archived_at' => now(),
                'verified_by' => $userId,
                'archived_by' => $userId,
            ]);
        }
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
                    ->with(['mahasiswa', 'periode', 'dokumen'])
                    ->whereIn('id', $batchIds)
                    ->whereIn('status', ['pending', 'document_submitted'])
                    ->when($isFacultyAdmin, function ($query) use ($facultyId) {
                        $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
                    })
                    ->lockForUpdate()
                    ->get();

                foreach ($registrations as $registration) {
                    // SECURITY GATE: Verify Academic Eligibility before final approval
                    $eligibility = $this->eligibilityService->checkEligibility($registration->mahasiswa, $registration->periode_id, [], 'approval');
                    if (! $eligibility['is_eligible']) {
                        continue; // Skip ineligible students in bulk action
                    }

                    // This handles auto-placement if enabled
                    $prepared = $this->prepareForApproval($registration);

                    $prepared->update([
                        'status' => 'approved',
                        'approved_at' => now(),
                        'approved_by' => $approvedBy,
                    ]);

                    // Mark and archive all documents
                    $this->markAndArchiveDocuments($registration, $approvedBy);

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
                    ->with(['dokumen'])
                    ->whereIn('id', $batchIds)
                    ->where('status', 'pending')
                    ->when($isFacultyAdmin, function ($query) use ($facultyId) {
                        $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
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

                    // Archive documents (for audit trail)
                    $this->archiveDocuments($registration, $rejectedBy);

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
     * Reject a single registration.
     */
    public function reject(PesertaKkn $registration, string $reason, int $rejectedBy): void
    {
        // R-05 fix: guard against rejecting non-pending registrations
        if (! in_array($registration->status, ['pending', 'document_submitted', 'document_verified'])) {
            throw ValidationException::withMessages([
                'status' => "Pendaftaran dengan status '{$registration->status}' tidak dapat ditolak.",
            ]);
        }

        DB::transaction(function () use ($registration, $reason, $rejectedBy) {
            $registration->update([
                'status' => 'rejected',
                'rejection_reason' => $reason,
                'last_rejected_at' => now(),
                'last_rejected_by' => $rejectedBy,
            ]);

            // Load and archive documents even when rejected (for audit trail)
            $registration->load('dokumen');
            $this->archiveDocuments($registration, $rejectedBy);

            AuditService::log(
                'REGISTRATION_REJECTION',
                "Pendaftaran ditolak. Alasan: {$reason}",
                $registration
            );
        });
    }

    /**
     * Archive documents without marking as verified (for rejected registrations).
     */
    private function archiveDocuments(PesertaKkn $registration, int $userId): void
    {
        foreach ($registration->dokumen as $doc) {
            $doc->update([
                'is_archived' => true,
                'archived_at' => now(),
                'archived_by' => $userId,
            ]);
        }
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
                ->where('periode_id', $registration->periode_id)
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
     * Make a student the Koordinator Kecamatan (Korcam).
     */
    public function makeKorcam(PesertaKkn $registration): void
    {
        if (! $registration->kelompok_id) {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Mahasiswa harus ditempatkan di kelompok terlebih dahulu.',
            ]);
        }

        if ($registration->status !== 'approved') {
            throw ValidationException::withMessages([
                'kelompok_id' => 'Hanya mahasiswa yang sudah disetujui yang dapat menjadi Korcam.',
            ]);
        }

        DB::transaction(function () use ($registration) {
            // Reset all other members in the same group to 'Anggota'
            PesertaKkn::where('kelompok_id', $registration->kelompok_id)
                ->where('id', '!=', $registration->id)
                ->update(['role' => 'Anggota']);

            // Set this student as 'Korcam'
            $registration->update(['role' => 'Korcam']);

            AuditService::log(
                'GROUP_KORCAM_ASSIGN',
                'Mahasiswa diangkat menjadi Koordinator Kecamatan (Korcam)',
                $registration
            );
        });
    }

    /**
     * Download registration document with security checks.
     * Supports both local and cloud storage.
     */
    public function downloadDocument(string $path, ?object $user = null): mixed
    {
        $disk = Storage::disk(config('filesystems.default'));

        if (blank($path) || ! $disk->exists($path)) {
            throw ValidationException::withMessages([
                'path' => 'Dokumen tidak ditemukan.',
            ]);
        }

        // Security check: Only allow specific folders
        $allowedFolders = ['health-certificates/', 'parent-permissions/', 'documents/'];
        if (app()->environment('local')) {
            $allowedFolders[] = 'dummy/';
        }

        $isAllowed = false;
        foreach ($allowedFolders as $folder) {
            if (str_starts_with($path, $folder)) {
                $isAllowed = true;
                break;
            }
        }

        if (! $isAllowed) {
            throw ValidationException::withMessages([
                'path' => 'Akses folder ditolak.',
            ]);
        }

        // Ownership check for non-admin users
        if ($user && ! $user->hasAnyRole(['superadmin', 'faculty_admin'])) {
            $mahasiswa = Mahasiswa::where('user_id', $user->id)->first();
            if (! $mahasiswa || ($mahasiswa->health_certificate_path !== $path && $mahasiswa->parent_permission_path !== $path)) {
                abort(403, 'Anda tidak memiliki hak akses untuk file ini.');
            }
        }

        // If local disk, we can perform path traversal checks more strictly
        if (config('filesystems.default') === 'local') {
            $storageRoot = $disk->path('');
            $fullPath = realpath($storageRoot.'/'.$path);

            if (! $fullPath || ! str_starts_with($fullPath, realpath($storageRoot))) {
                throw ValidationException::withMessages([
                    'path' => 'Akses ditolak: Path traversal terdeteksi.',
                ]);
            }

            return response()->file($fullPath);
        }

        // For Cloud/S3, redirect to a temporary secure URL (Presigned URL)
        // This is the most efficient way as it offloads the download to the provider
        return redirect()->away($disk->temporaryUrl($path, now()->addMinutes(30)));
    }

    /**
     * Auto-place student into a group.
     */
    private function autoPlaceGroup(PesertaKkn $registration): PesertaKkn
    {
        try {
            $group = $this->automaticGroupPlacementService->selectGroupForStudent(
                $registration->mahasiswa,
                (int) $registration->periode_id,
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
            ->where('periode_id', $registration->periode_id)
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
