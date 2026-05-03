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
        if (! $user || ! $user->hasRole('student') || (config('app.env') === 'local' && $request->wantsJson())) {
            return $next($request);
        }

        $mahasiswa = $user->mahasiswa;

        $isComplete = $mahasiswa
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

        $routeName = $request->route()?->getName();
        $allowedRoutes = [
            'profile.show',
            'profile.update',
            'profile.password',
            'profile.password-change',
            'profile.avatar',
            'profile.check-nik',
            'logout',
        ];

        if ($isComplete || in_array($routeName, $allowedRoutes)) {
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

        return redirect()
            ->route('profile.show')
            ->with('warning', 'Mohon lengkapi seluruh data profil Anda (Biodata, Domisili, dan Foto Profil) sebelum dapat mengakses fitur KKN.');
    }
}
