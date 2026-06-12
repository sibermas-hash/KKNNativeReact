<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\KKN\AttendancePhoto;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\PesertaWorkshop;
use App\Models\Mahasiswa;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * Audit X-002 + X-003 fix.
 *
 * Attendance photos (GPS-stamped selfies) and individual workshop
 * certificates (with NIM + grade) used to live on the `public` disk —
 * world-readable to anyone who guessed the path. This controller serves
 * them from the PRIVATE `local` disk with proper authentication and
 * per-type authorization.
 *
 * Every endpoint here:
 *   - requires `auth:sanctum`
 *   - checks the caller is entitled to THIS file (owner, group member,
 *     supervising DPL, or admin with explicit scope)
 *   - streams directly from the private disk so paths never leak
 */
class PrivateFileController extends Controller
{
    /**
     * GET /api/v1/files/attendance-photos/{photo}
     *
     * Allowed to:
     *   - the mahasiswa who took the photo
     *   - DPL supervising the mahasiswa's group
     *   - superadmin / admin
     *   - faculty_admin only for same-faculty mahasiswa
     */
    public function attendancePhoto(Request $request, AttendancePhoto $photo): BinaryFileResponse
    {
        $user = $request->user();

        $photo->loadMissing('attendance.mahasiswa.user', 'attendance.kelompok.dpl.user');

        $ownerUserId = $photo->attendance?->mahasiswa?->user_id;
        $supervisingDplUserId = $photo->attendance?->kelompok?->dpl?->user_id;
        $facultyAllowed = $this->facultyAdminCanAccessMahasiswa($user, $photo->attendance?->mahasiswa);

        $authorized = $user->hasAnyRole(['superadmin', 'admin'])
            || $facultyAllowed
            || ($ownerUserId && $user->id === $ownerUserId)
            || ($supervisingDplUserId && $user->id === $supervisingDplUserId);

        if (! $authorized) {
            abort(403, 'Anda tidak berhak mengakses foto absensi ini.');
        }

        return $this->streamFromLocal(
            (string) $photo->path,
            $photo->filename ?: basename($photo->path),
            $photo->mime_type ?: 'image/jpeg',
        );
    }

    /**
     * GET /api/v1/files/workshop-certificates/{participant}
     *
     * Allowed to:
     *   - the dosen who owns the certificate
     *   - superadmin / admin
     */
    public function workshopCertificate(Request $request, PesertaWorkshop $participant): BinaryFileResponse
    {
        $user = $request->user();
        $participant->loadMissing('dosen.user');

        $ownerUserId = $participant->dosen?->user_id;

        $authorized = $user->hasAnyRole(['superadmin', 'admin'])
            || ($ownerUserId && $user->id === $ownerUserId);

        if (! $authorized) {
            abort(403, 'Anda tidak berhak mengakses sertifikat ini.');
        }

        if (empty($participant->certificate_path)) {
            abort(404, 'Sertifikat belum tersedia.');
        }

        return $this->streamFromLocal(
            (string) $participant->certificate_path,
            basename($participant->certificate_path),
            'application/pdf',
        );
    }

    /**
     * GET /api/v1/files/leave-evidence/{izin}
     */
    public function leaveEvidence(Request $request, IzinMeninggalkan $izin): BinaryFileResponse
    {
        $user = $request->user();
        $izin->loadMissing('mahasiswa.user', 'kelompok.dpl.user');

        $ownerUserId = $izin->mahasiswa?->user_id;
        $supervisingDplUserId = $izin->kelompok?->dpl?->user_id;
        $facultyAllowed = $this->facultyAdminCanAccessMahasiswa($user, $izin->mahasiswa);

        $authorized = $user->hasAnyRole(['superadmin', 'admin'])
            || $facultyAllowed
            || ($ownerUserId && $user->id === $ownerUserId)
            || ($supervisingDplUserId && $user->id === $supervisingDplUserId);

        if (! $authorized) {
            abort(403, 'Anda tidak berhak mengakses bukti izin ini.');
        }

        if (empty($izin->file_bukti)) {
            abort(404, 'Bukti izin tidak ditemukan.');
        }

        return $this->streamFromLocal(
            (string) $izin->file_bukti,
            basename((string) $izin->file_bukti),
            'application/octet-stream',
        );
    }

    private function streamFromLocal(string $relativePath, string $downloadName, string $mimeType): BinaryFileResponse
    {
        // Hardening: reject paths that try to traverse outside the disk root.
        if (str_contains($relativePath, '..')) {
            abort(400, 'Invalid path.');
        }

        $disk = Storage::disk('local');
        if (! $disk->exists($relativePath)) {
            abort(404, 'File tidak ditemukan.');
        }

        return response()->download($disk->path($relativePath), $downloadName, [
            'Content-Type' => $mimeType,
            'Cache-Control' => 'private, no-store',
        ]);
    }

    private function facultyAdminCanAccessMahasiswa($user, ?Mahasiswa $mahasiswa): bool
    {
        return $user->hasRole('faculty_admin')
            && $user->fakultas_id
            && $mahasiswa?->fakultas_id
            && (int) $user->fakultas_id === (int) $mahasiswa->fakultas_id;
    }
}
