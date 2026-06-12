<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * C-003 fix.
 *
 * Mass-certificate ZIPs were previously written to the public disk with a
 * predictable filename (`Sertifikat_KKN_Periode_{id}_{YmdHis}.zip`) and the
 * URL returned to the admin was also the canonical public URL — anyone who
 * guessed or intercepted the URL could download every student's certificate.
 *
 * Now:
 *   - ZIPs live on the PRIVATE `local` disk under a UUID filename.
 *   - Download URL is a temporarySignedRoute bound to this controller.
 *   - Signed routes expire in 2 hours.
 *   - Controller additionally checks that the signed `admin` query param
 *     matches the currently authenticated user (so admins can't share URLs).
 *   - Token → path mapping lives in cache; the URL never exposes the path.
 */
class BulkCertificateDownloadController extends Controller
{
    public function download(Request $request, string $token): BinaryFileResponse
    {
        // Signature is verified by the `signed` middleware on the route, so
        // if we got here the URL was legitimately issued. We still double-check
        // the admin id + token match, to defend against URL sharing.
        $signedAdminId = (int) $request->query('admin');

        /** @var User|null $user */
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        if ($user->id !== $signedAdminId) {
            abort(403, 'Signed link is bound to a different administrator.');
        }

        if (! $user->hasAnyRole(['superadmin', 'admin'])) {
            abort(403);
        }

        $cacheEntry = Cache::get('cert_bulk_download:'.$token);
        if (! is_array($cacheEntry) || empty($cacheEntry['path'])) {
            abort(404, 'Unduhan kedaluwarsa atau tidak tersedia.');
        }

        if ((int) ($cacheEntry['admin_id'] ?? 0) !== $user->id) {
            abort(403);
        }

        $relativePath = $cacheEntry['path'];
        $disk = Storage::disk('local');

        if (! $disk->exists($relativePath)) {
            abort(404, 'File tidak ditemukan.');
        }

        $fullPath = $disk->path($relativePath);
        $filename = $cacheEntry['filename'] ?? basename($relativePath);

        return response()->download($fullPath, $filename, [
            'Content-Type' => 'application/zip',
            'Cache-Control' => 'private, no-store',
        ]);
    }
}
