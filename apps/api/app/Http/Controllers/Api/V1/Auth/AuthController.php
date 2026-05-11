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

        if (str_contains($loginValue, '@')) {
            throw ValidationException::withMessages([
                'login' => 'Gunakan NIM, NIP, atau username. Email tidak dapat digunakan untuk login.',
            ]);
        }

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

        $credentials = [
            'username' => $loginValue,
            'password' => $request->input('password'),
            'is_active' => true,
        ];

        // Attempt authentication
        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
            RateLimiter::hit($throttleKey);

            \App\Services\ActivityLogger::log('login', 'failed', null, [
                'attempted_username' => $loginValue,
                'reason' => 'invalid_credentials',
            ]);

            return $this->error(
                'CREDENTIALS_INVALID',
                'NIM/NIP/username atau kata sandi salah.',
                422
            );
        }

        RateLimiter::clear($throttleKey);

        /** @var User $user */
        $user = Auth::user();

        // Detect mobile platform
        $isMobile = $request->header('X-App-Type') === 'mobile';

        // 2FA challenge — if user has TOTP enabled, don't issue token yet.
        // Instead, generate a short-lived challenge token (5 min) that the
        // client must present along with the 6-digit code to /auth/2fa-verify.
        if ($user->hasTwoFactorEnabled()) {
            // Log the first-factor success separately from full login
            \App\Services\ActivityLogger::log('login', 'success', $user->id, [
                'method' => $isMobile ? 'mobile' : 'web',
                'stage' => 'first_factor',
            ]);

            $challengeToken = \Illuminate\Support\Str::random(64);
            \Illuminate\Support\Facades\Cache::put(
                "2fa-challenge:{$challengeToken}",
                ['user_id' => $user->id, 'is_mobile' => $isMobile, 'remember' => $request->boolean('remember')],
                now()->addMinutes(5)
            );

            // Logout the Laravel auth user — they're not fully authenticated yet
            Auth::guard('web')->logout();

            return $this->error(
                'TWO_FACTOR_REQUIRED',
                'Masukkan kode 2FA untuk menyelesaikan login.',
                423,
                ['challenge_token' => $challengeToken, 'expires_in' => 300]
            );
        }

        \App\Services\ActivityLogger::log('login', 'success', $user->id, [
            'method' => $isMobile ? 'mobile' : 'web',
        ]);

        if ($isMobile) {
            // Mobile: return Bearer token
            $token = $user->createToken('mobile')->plainTextToken;

            return $this->success([
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $this->buildUserData($user),
            ], 'Login berhasil.');
        }

        // Web: Sanctum session auth (cookie-based) or token if no session
        if ($request->hasSession()) {
            $request->session()->regenerate();

            return $this->success([
                'user' => $this->buildUserData($user),
            ], 'Login berhasil.');
        }

        // Fallback: token-based (Next.js SPA via API) — set HttpOnly cookie
        $token = $user->createToken('web')->plainTextToken;
        // M-007 fix: in production force Secure flag even if $request->secure()
        // somehow returns false (e.g. misconfigured reverse proxy not forwarding
        // X-Forwarded-Proto). Better to break cookies on accidental HTTP than
        // to send the bearer token in the clear.
        $isSecure = app()->environment('production') ? true : $request->secure();
        $expiry = 60 * 60 * 24 * 7; // 7 days


        return $this->success([
            'user' => $this->buildUserData($user),
        ], 'Login berhasil.')
            ->withCookie(cookie('sibermas_token', $token, $expiry / 60, '/', null, $isSecure, true, false, 'Strict'));
    }

    /**
     * POST /api/v1/auth/2fa-verify
     *
     * Second factor of login flow. Client presents the challenge_token
     * (from first-factor login 423 response) + 6-digit TOTP code.
     * On success: issue the real Sanctum token & cookies (same as regular login).
     */
    public function twoFactorVerify(Request $request): JsonResponse
    {
        $data = $request->validate([
            'challenge_token' => ['required', 'string', 'size:64'],
            'code' => ['required', 'string', 'min:6', 'max:20'], // 6 digits or recovery code (SHORT-SHORT)
        ]);

        // R11 fix: per-challenge-token throttle. Attacker dengan IP rotator masih
        // tunduk pada 5 attempts / TTL 5 menit per specific challenge token. Burn
        // token setelah 5× gagal — paksa user login ulang.
        $throttleKey = "2fa-verify:{$data['challenge_token']}";
        $attempts = \Illuminate\Support\Facades\Cache::get($throttleKey, 0);
        if ($attempts >= 5) {
            \Illuminate\Support\Facades\Cache::forget("2fa-challenge:{$data['challenge_token']}");
            \Illuminate\Support\Facades\Cache::forget($throttleKey);
            return $this->error(
                'TWO_FACTOR_CHALLENGE_EXPIRED',
                'Terlalu banyak percobaan 2FA. Silakan login ulang.',
                429
            );
        }

        $challenge = \Illuminate\Support\Facades\Cache::get("2fa-challenge:{$data['challenge_token']}");

        if (!$challenge || !isset($challenge['user_id'])) {
            return $this->error('TWO_FACTOR_CHALLENGE_EXPIRED', 'Sesi 2FA kedaluwarsa. Silakan login ulang.', 401);
        }

        $user = User::find($challenge['user_id']);
        if (!$user || !$user->hasTwoFactorEnabled()) {
            return $this->error('TWO_FACTOR_INVALID', 'User tidak valid atau 2FA tidak aktif.', 401);
        }

        $code = trim($data['code']);
        $isValidCode = false;
        $usedRecovery = false;

        // Try TOTP first (6 digits)
        if (preg_match('/^[0-9]{6}$/', $code)) {
            $g2fa = new \PragmaRX\Google2FA\Google2FA();
            $isValidCode = $g2fa->verifyKey($user->two_factor_secret, $code);
        }

        // Try recovery code (format XXXX-XXXX)
        if (!$isValidCode && $user->two_factor_recovery_codes) {
            $codes = $user->two_factor_recovery_codes;
            foreach ($codes as $i => $hashed) {
                if (\Illuminate\Support\Facades\Hash::check($code, $hashed)) {
                    $isValidCode = true;
                    $usedRecovery = true;
                    // Remove used recovery code
                    unset($codes[$i]);
                    $user->update(['two_factor_recovery_codes' => array_values($codes)]);
                    break;
                }
            }
        }

        if (!$isValidCode) {
            // Increment per-challenge-token throttle counter (TTL 5 min, same as challenge)
            \Illuminate\Support\Facades\Cache::put(
                $throttleKey,
                $attempts + 1,
                now()->addMinutes(5)
            );

            \App\Services\ActivityLogger::log('2fa_verify', 'failed', $user->id, [
                'reason' => 'invalid_code',
                'attempts' => $attempts + 1,
            ]);
            return $this->error('TWO_FACTOR_INVALID', 'Kode 2FA tidak valid.', 422);
        }

        // Success! Burn the challenge + throttle counter, issue real token
        \Illuminate\Support\Facades\Cache::forget("2fa-challenge:{$data['challenge_token']}");
        \Illuminate\Support\Facades\Cache::forget($throttleKey);

        \App\Services\ActivityLogger::log('2fa_verify', 'success', $user->id, [
            'used_recovery_code' => $usedRecovery,
            'recovery_codes_remaining' => $user->two_factor_recovery_codes ? count($user->two_factor_recovery_codes) : 0,
        ]);

        Auth::login($user, (bool) ($challenge['remember'] ?? false));
        $isMobile = (bool) ($challenge['is_mobile'] ?? false);

        if ($isMobile) {
            $token = $user->createToken('mobile')->plainTextToken;
            return $this->success([
                'token' => $token,
                'token_type' => 'Bearer',
                'user' => $this->buildUserData($user),
                'recovery_code_used' => $usedRecovery,
            ], 'Login berhasil.');
        }

        if ($request->hasSession()) {
            $request->session()->regenerate();
            return $this->success([
                'user' => $this->buildUserData($user),
                'recovery_code_used' => $usedRecovery,
            ], 'Login berhasil.');
        }

        $token = $user->createToken('web')->plainTextToken;
        $isSecure = app()->environment('production') ? true : $request->secure();
        $expiry = 60 * 60 * 24 * 7;

        return $this->success([
            'user' => $this->buildUserData($user),
            'recovery_code_used' => $usedRecovery,
        ], 'Login berhasil.')
            ->withCookie(cookie('sibermas_token', $token, $expiry / 60, '/', null, $isSecure, true, false, 'Strict'));
    }

    /**
     * POST /api/v1/auth/logout
     * Logout user. Handles both token and session auth.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            \App\Services\ActivityLogger::log('logout', 'success', $user->id);
        }

        if ($request->header('X-App-Type') === 'mobile' && $user) {
            // Mobile: revoke only the current token
            $user->currentAccessToken()->delete();
        } else {
            // Web: revoke all web Sanctum tokens
            if ($user) {
                $user->tokens()->where('name', 'web')->delete();
            }
            Auth::guard('web')->logout();
        }

        return $this->noContent('Logout berhasil.')
            ->withoutCookie('sibermas_token');
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
     *
     * Security: Returns the same success response regardless of whether the email
     * exists in the database. This prevents user/email enumeration (audit H-003).
     * Laravel logs the actual status internally via Password::sendResetLink.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        // Fire-and-forget; we don't leak the actual status to the caller.
        Password::sendResetLink($request->only('email'));

        return $this->noContent(
            'Jika email terdaftar, tautan pengaturan ulang kata sandi akan dikirim dalam beberapa menit.'
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
     * Uses once() to prevent duplicate PeriodContextService calls within the same request.
     */
    private function buildUserData(User $user): array
    {
        // Eager load relationships to prevent N+1
        $user->loadMissing(['mahasiswa', 'fakultas']);

        // once() caches per-request — prevents duplicate DB hits if called multiple times
        $activePeriod = once(fn () => $this->periodContextService->getActivePeriodData());
        $availablePeriods = once(fn () => $this->periodContextService->getAvailablePeriods());

        $data = [
            'id' => $user->id,
            'username' => $user->username,
            'name' => $user->name,
            'email' => $user->email,
            'avatar_url' => $user->avatar ? asset('storage/'.$user->avatar) : null,
            'avatar_moderation_status' => $user->avatar_moderation_status,
            'avatar_moderation_reason' => $user->avatar_moderation_reason,
            'two_factor_enabled' => $user->hasTwoFactorEnabled(),
            'two_factor_required' => $user->requiresTwoFactor(),
            'nim' => $user->mahasiswa?->nim,
            'password_changed_at' => $user->password_changed_at?->toIso8601String(),
            'must_change_password' => $user->hasRole('superadmin') ? false : $user->must_change_password,
            'profile_complete' => $user->hasRole('superadmin') || $this->isProfileComplete($user),
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

    private function isProfileComplete(User $user): bool
    {
        $user->loadMissing(['mahasiswa', 'dosen']);

        // Dosen/DPL: always considered complete — data kepegawaian diisi bertahap
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
            && filled($user->address_lat)
            && filled($user->address_lng)
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
