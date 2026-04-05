<?php

namespace App\Http\Middleware;

use App\Models\KKN\PesertaKkn;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $studentRegistrationLocked = false;

        if ($user?->hasRole('student') && $user->mahasiswa) {
            $studentRegistrationLocked = PesertaKkn::query()
                ->where('mahasiswa_id', $user->mahasiswa->id)
                ->where('status', 'approved')
                ->whereNotNull('kelompok_id')
                ->latest('approved_at')
                ->exists();
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'username' => $user->username,
                    'name' => $user->name,
                    'email' => $user->email,
                    'must_change_password' => $user->must_change_password,
                    'student_registration_locked' => $studentRegistrationLocked,
                    'faculty' => $user->fakultas ? [
                        'id' => $user->fakultas->id,
                        'name' => $user->fakultas->nama,
                    ] : null,
                    'roles' => $user->getRoleNames()->toArray(),
                    'permissions' => $user->getPermissionsViaRoles()->pluck('name')->unique()->values(),
                ] : null,
            ],
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
                'warning' => $request->session()->get('warning'),
                'info' => $request->session()->get('info'),
            ],
        ];
    }
}
