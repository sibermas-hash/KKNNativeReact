<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureProfileCompleted
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($user->hasAnyRole(['superadmin', 'admin', 'faculty_admin', 'external_lppm_admin'])) {
            return $next($request);
        }

        // Bypass auth + security onboarding routes — user must be able to
        // fetch profile data and complete 2FA setup from the profile page.
        if (
            $request->is('api/v1/auth/*')
            || $request->is('api/v1/profile*')
            || $request->is('api/v1/2fa*')
            || $request->is('api/v1/period-context')
        ) {
            return $next($request);
        }

        $isComplete = $this->isComplete($user);

        if ($isComplete) {
            return $next($request);
        }

        // API: return JSON envelope
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PROFILE_INCOMPLETE',
                    'message' => 'Mohon lengkapi seluruh data profil Anda (Biodata, Alamat Asli, dan Foto Profil) sebelum dapat mengakses fitur KKN.',
                ],
            ], 403);
        }

        return redirect('/profil');
    }

    private function isComplete($user): bool
    {
        $user->loadMissing(['mahasiswa', 'dosen']);

        // Dosen/DPL: bypass profile completeness — data kepegawaian diisi bertahap
        if ($user->hasRole('dosen') || $user->hasRole('dpl')) {
            return true;
        }

        // Mahasiswa: full address + biodata required
        $baseComplete = filled($user->avatar)
            && filled($user->phone)
            && filled($user->address);

        if (! $baseComplete) {
            return false;
        }

        if ($user->mahasiswa) {
            return filled($user->mahasiswa->nik)
                && filled($user->mahasiswa->mother_name)
                && filled($user->mahasiswa->birth_place)
                && filled($user->mahasiswa->birth_date)
                && filled($user->mahasiswa->gender)
                && filled($user->mahasiswa->shirt_size);
        }

        return true;
    }
}
