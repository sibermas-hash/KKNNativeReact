<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Auth\CaptchaRequest;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use App\Services\CaptchaService;
use App\Services\PeriodContextService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CaptchaService $captchaService,
        private readonly PeriodContextService $periodContextService,
    ) {}

    /**
     * GET /api/v1/auth/captcha
     * Generate a new math captcha. Public endpoint.
     */
    public function captcha(): JsonResponse
    {
        $captcha = $this->captchaService->generate();

        return $this->success($captcha, 'CAPTCHA berhasil dibuat.');
    }

    /**
     * POST /api/v1/auth/login
     * Authenticate user. Detects platform via X-App-Type header.
     */
    public function login(Request $request): JsonResponse
    {
        $request->validate([
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'captcha_id' => ['required', 'string'],
            'captcha_answer' => ['required', 'string', 'max:10'],
            'remember' => ['nullable', 'boolean'],
        ]);

        // Verify captcha first
        if (! $this->captchaService->verify($request->input('captcha_id'), $request->input('captcha_answer'))) {
            throw ValidationException::withMessages([
                'captcha_answer' => 'Verifikasi keamanan kedaluwarsa atau salah.',
            ]);
        }

        // Rate limiting
        $loginValue = trim($request->input('login'));
        $throttleKey = Str::transliterate(Str::lower($loginValue).'|'.$request->ip());

        if (RateLimiter::tooManyAttempts($throttleKey, 5)) {
            event(new Lockout($request));
            $seconds = RateLimiter::availableIn($throttleKey);

            throw ValidationException::withMessages([
                'login' => trans('auth.throttle', [
                    'seconds' => $seconds,
                    'minutes' => ceil($seconds / 60),
                ]),
            ]);
        }

        // Determine credentials
        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        $credentials = [
            $field => $loginValue,
            'password' => $request->input('password'),
            'is_active' => true,
        ];

        // Attempt authentication
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);

            return $this->error(
                'CREDENTIALS_INVALID',
                'Username/email atau kata sandi salah.',
                422
            );
        }

        RateLimiter::clear($throttleKey);

        /** @var User $user */
        $user = Auth::user();

        // Detect mobile platform
        $isMobile = $request->header('X-App-Type') === 'mobile';

        if ($isMobile) {
            // Mobile: return Bearer token
            $token = $user->createToken('mobile')->plainTextToken;

            return $this->success([
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $this->buildUserData($user),
            ], 'Login berhasil.');
        }

        // Web: Sanctum session auth (cookie-based)
        $request->session()->regenerate();

        return $this->success([
            'user' => $this->buildUserData($user),
        ], 'Login berhasil.');
    }

    /**
     * POST /api/v1/auth/logout
     * Logout user. Handles both token and session auth.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($request->header('X-App-Type') === 'mobile' && $user) {
            // Mobile: revoke current access token
            $user->currentAccessToken()->delete();
        } else {
            // Web: logout session
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        return $this->noContent('Logout berhasil.');
    }

    /**
     * GET /api/v1/auth/user
     * Returns the authenticated user's data.
     */
    public function user(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        if (! $user) {
            return $this->unauthorized();
        }

        return $this->success($this->buildUserData($user));
    }

    /**
     * POST /api/v1/auth/forgot-password
     * Send password reset link.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $status = Password::sendResetLink(
            $request->only('email')
        );

        if ($status === Password::RESET_LINK_SENT) {
            return $this->noContent('Tautan pengaturan ulang kata sandi telah dikirim ke email Anda.');
        }

        return $this->error(
            'VALIDATION_ERROR',
            'Gagal mengirim tautan pengaturan ulang. Pastikan email yang Anda masukkan benar.',
            422
        );
    }

    /**
     * POST /api/v1/auth/reset-password
     * Reset password using token.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'email' => ['required', 'email'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                    'password_changed_at' => now(),
                ])->save();

                event(new PasswordReset($user));
            }
        );

        if ($status === Password::PASSWORD_RESET) {
            return $this->noContent('Kata sandi berhasil diatur ulang.');
        }

        return $this->error(
            'VALIDATION_ERROR',
            'Token pengaturan ulang tidak valid atau sudah kedaluwarsa.',
            422
        );
    }

    /**
     * Build the standard user data array for API responses.
     */
    private function buildUserData(User $user): array
    {
        // Eager load relationships to prevent N+1
        $user->loadMissing(['mahasiswa', 'fakultas']);

        $activePeriod = $this->periodContextService->getActivePeriodData();
        $availablePeriods = $this->periodContextService->getAvailablePeriods();

        $data = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar ? asset('storage/'.$user->avatar) : null,
            'nim' => $user->mahasiswa?->nim,
            'must_change_password' => $user->must_change_password,
            'roles' => $user->getRoleNames()->toArray(),
            'permissions' => $user->getPermissionsViaRoles()->pluck('name')->unique()->values()->toArray(),
            'faculty' => $user->fakultas ? [
                'id' => $user->fakultas->id,
                'name' => $user->fakultas->nama,
            ] : null,
            'active_phase' => $activePeriod['current_phase'] ?? 'upcoming',
            'active_period' => $activePeriod,
            'available_periods' => $availablePeriods,
        ];

        // Add registration status for students (single query for both status and lock)
        if ($user->hasRole('student') && $user->mahasiswa) {
            $latestRegistration = \App\Models\KKN\PesertaKkn::query()
                ->where('mahasiswa_id', $user->mahasiswa->id)
                ->latest()
                ->first();

            $rawStatus = $latestRegistration?->status;
            $data['student_registration_status'] = match ($rawStatus) {
                'approved', 'disetujui', 'verifikasi_pusat', 'completed' => 'approved',
                'pending', 'menunggu', 'document_submitted', 'document_verified' => 'pending',
                'rejected', 'ditolak', 'gugur' => 'rejected',
                default => $rawStatus ?? 'none',
            };

            // Use the same result to check lock status (no second query)
            $data['student_registration_locked'] = $latestRegistration
                && $latestRegistration->status === 'approved'
                && $latestRegistration->kelompok_id !== null;
        }

        return $data;
    }
}
