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

        // Hanya berlaku untuk role student
        if (! $user || ! $user->hasRole('student')) {
            return $next($request);
        }

        // Bypass auth routes — user must be able to fetch their own data
        if ($request->is('api/v1/auth/*') || $request->is('api/v1/profile*') || $request->is('api/v1/period-context')) {
            return $next($request);
        }

        $mahasiswa = $user->mahasiswa;

        $isComplete = once(function () use ($user, $mahasiswa) {
            return $mahasiswa
                && filled($mahasiswa->nik)
                && filled($mahasiswa->mother_name)
                && filled($mahasiswa->birth_place)
                && filled($mahasiswa->birth_date)
                && filled($mahasiswa->gender)
                && filled($mahasiswa->shirt_size)
                && filled($user->phone)
                && filled($user->address)
                && filled($user->domicile_village_name)
                && filled($user->domicile_district_name)
                && filled($user->domicile_regency_name)
                && filled($user->address_verified_at)
                && filled($user->avatar);
        });

        if ($isComplete) {
            return $next($request);
        }

        // API: return JSON envelope
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PROFILE_INCOMPLETE',
                    'message' => 'Mohon lengkapi seluruh data profil Anda (Biodata, Domisili, dan Foto Profil) sebelum dapat mengakses fitur KKN.',
                ],
            ], 403);
        }

        return redirect('/profil');
    }
}
