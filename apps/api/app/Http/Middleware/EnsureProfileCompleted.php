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

        if ($user->hasRole('superadmin')) {
            return $next($request);
        }

        // Bypass auth routes — user must be able to fetch their own data
        if ($request->is('api/v1/auth/*') || $request->is('api/v1/profile*') || $request->is('api/v1/period-context')) {
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
            && filled($user->address)
            && filled($user->address_village_name)
            && filled($user->address_district_name)
            && filled($user->address_regency_name)
            && filled($user->address_postal_code)
            && filled($user->address_verified_at);

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
