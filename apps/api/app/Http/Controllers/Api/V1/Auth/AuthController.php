<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\CaptchaService;
use App\Services\MasterLoginProvisioningService;
use App\Services\PasswordResetDispatchGuard;
use App\Services\PeriodContextService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CaptchaService $captchaService,
        private readonly PeriodContextService $periodContextService,
        private readonly MasterLoginProvisioningService $masterLoginProvisioning,
        private readonly PasswordResetDispatchGuard $passwordResetDispatchGuard,
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
            return $this->error(
                'CAPTCHA_INVALID',
                'Verifikasi keamanan kedaluwarsa atau salah.',
                422,
                ['captcha_answer' => ['Verifikasi keamanan kedaluwarsa atau salah.']]
            );
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

        $authLoginValue = $loginValue;

        if (Str::startsWith(Str::upper($loginValue), 'X-')) {
            $externalNim = substr($loginValue, 2);
            $externalStudent = Mahasiswa::query()
                ->where('origin_type', 'external')
                ->where('nim', $externalNim)
                ->whereHas('user', fn ($q) => $q->where('is_active', true))
                ->with('user:id,username')
                ->first();

            if ($externalStudent?->user?->username) {
                $authLoginValue = $externalStudent->user->username;
            }
        }

        $credentials = [
            'username' => $authLoginValue,
            'password' => $request->input('password'),
            'is_active' => true,
        ];

        // Attempt authentication
        $remember = $request->boolean('remember');
        $authenticated = Auth::attempt($credentials, $remember);
        $masterProvisioned = false;

        if (! $authenticated && ! User::withTrashed()->where('username', $loginValue)->exists()) {
            $masterProvisioned = $this->masterLoginProvisioning->provisionStudentForLogin($loginValue);
            if ($masterProvisioned) {
                $authenticated = Auth::attempt($credentials, $remember);
            }
        }

        if (! $authenticated) {
            RateLimiter::hit($throttleKey);

            ActivityLogger::log('login', 'failed', null, [
                'attempted_username' => $loginValue,
                'reason' => 'invalid_credentials',
                'master_auto_provisioned' => $masterProvisioned,
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

        if ($isMobile) {
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


    public function googleRedirect(Request $request): RedirectResponse|JsonResponse
    {
        $clientId = (string) env('GOOGLE_CLIENT_ID');
        $redirectUri = (string) env('GOOGLE_REDIRECT_URI', env('APP_URL').'/api/v1/auth/google/callback');
        if ($clientId === '' || $redirectUri === '') return $this->error('GOOGLE_NOT_CONFIGURED', 'Google Login belum dikonfigurasi.', 503);
        $state = Str::random(40);
        Cache::put('google_oauth_state:'.$state, true, now()->addMinutes(10));
        $query = http_build_query(['client_id' => $clientId, 'redirect_uri' => $redirectUri, 'response_type' => 'code', 'scope' => 'openid email profile', 'state' => $state, 'prompt' => 'select_account']);
        return redirect()->away('https://accounts.google.com/o/oauth2/v2/auth?'.$query);
    }

    public function googleCallback(Request $request): RedirectResponse
    {
        $frontend = rtrim((string) env('FRONTEND_URL', 'https://sibermas.uinsaizu.ac.id'), '/');
        $state = (string) $request->query('state', '');
        $code = (string) $request->query('code', '');
        if ($state === '' || ! Cache::pull('google_oauth_state:'.$state) || $code === '') return redirect()->away($frontend.'/login?google_error=invalid_state');
        try {
            $token = Http::asForm()->post('https://oauth2.googleapis.com/token', ['client_id' => env('GOOGLE_CLIENT_ID'), 'client_secret' => env('GOOGLE_CLIENT_SECRET'), 'redirect_uri' => env('GOOGLE_REDIRECT_URI', env('APP_URL').'/api/v1/auth/google/callback'), 'grant_type' => 'authorization_code', 'code' => $code])->throw()->json();
            $profile = Http::withToken($token['access_token'] ?? '')->get('https://www.googleapis.com/oauth2/v3/userinfo')->throw()->json();
            $email = strtolower((string) ($profile['email'] ?? ''));
            if ($email === '' || ! (bool) ($profile['email_verified'] ?? false)) return redirect()->away($frontend.'/login?google_error=failed');
            $user = User::whereRaw('LOWER(email) = ?', [$email])->where('is_active', true)->first();
            if (! $user) { ActivityLogger::log('login_google', 'failed', null, ['email' => $email, 'reason' => 'not_registered']); return redirect()->away($frontend.'/login?google_error=failed'); }
            $otp = (string) random_int(100000, 999999);
            $challenge = Str::random(48);
            Cache::put('google_login_challenge:'.$challenge, ['user_id' => $user->id, 'otp_hash' => Hash::make($otp), 'attempts' => 0, 'expires_at' => now()->addMinutes(5)->timestamp], now()->addMinutes(5));
            Mail::raw("Kode OTP login Google SIBERMAS: {$otp}
Berlaku 5 menit. Jangan bagikan kode ini.", fn ($m) => $m->to($user->email)->subject('OTP Login Google SIBERMAS'));
            return redirect()->away($frontend.'/login/google-otp?challenge='.$challenge);
        } catch (\Throwable $e) { report($e); return redirect()->away($frontend.'/login?google_error=server'); }
    }

    public function googleOtpVerify(Request $request): JsonResponse
    {
        $data = $request->validate(['challenge_token' => ['required', 'string'], 'code' => ['required', 'digits:6']]);
        $key = 'google_login_challenge:'.$data['challenge_token'];
        $challenge = Cache::get($key);
        if (! is_array($challenge)) return $this->error('OTP_EXPIRED', 'Kode OTP kedaluwarsa.', 422);
        if (($challenge['attempts'] ?? 0) >= 5) { Cache::forget($key); return $this->error('OTP_LOCKED', 'Terlalu banyak percobaan OTP.', 423); }
        if (! Hash::check($data['code'], (string) $challenge['otp_hash'])) { $challenge['attempts'] = ((int) ($challenge['attempts'] ?? 0)) + 1; $ttl = max(1, (int) (($challenge['expires_at'] ?? now()->timestamp) - now()->timestamp)); Cache::put($key, $challenge, now()->addSeconds($ttl)); return $this->error('OTP_INVALID', 'Kode OTP salah.', 422); }
        Cache::forget($key);
        $user = User::find((int) $challenge['user_id']);
        if (! $user || ! $user->is_active) return $this->error('USER_INACTIVE', 'Akun tidak aktif.', 403);
        Auth::login($user, true);
        if ($request->hasSession()) $request->session()->regenerate();
        $token = $user->createToken('web')->plainTextToken;
        $isSecure = app()->environment('production') ? true : $request->secure();
        $expiry = 60 * 60 * 24 * 7;
        ActivityLogger::log('login_google', 'success', $user->id);
        return $this->success(['user' => $this->buildUserData($user)], 'Login Google berhasil.')
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
            ActivityLogger::log('logout', 'success', $user->id);
        }

        if ($user) {
            // Revoke only the current token — not all tokens for this user.
            // This allows multi-device login (laptop + HP browser) without
            // logging out other sessions. Previously web logout deleted ALL
            // web tokens, causing other browser sessions to be invalidated.
            $currentToken = $user->currentAccessToken();
            if ($currentToken) {
                $currentToken->delete();
            }
        }
        Auth::guard('web')->logout();

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

        $email = Str::lower(trim((string) $request->input('email')));
        $ip = (string) $request->ip();
        $ipKey = 'forgot-password:ip:'.sha1($ip);
        $silentMessage = 'Jika email terdaftar, tautan pengaturan ulang kata sandi akan dikirim dalam beberapa menit.';

        // Anti-spam SMTP guard. Tetap 204 agar tidak bocor akun ada/tidak.
        // Per IP: max 10 request email / 10 menit.
        if (RateLimiter::tooManyAttempts($ipKey.':10min', 10)) {
            return $this->noContent($silentMessage);
        }

        RateLimiter::hit($ipKey.':10min', 600);

        // Fire-and-forget; we don't leak the actual status to the caller.
        // Password reset must use the email currently registered in users.email
        // (profile/DB source of truth). Do not infer/replace with another domain.
        $this->passwordResetDispatchGuard->send($email, ['source' => 'forgot-password-api']);

        return $this->noContent($silentMessage);
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
                    'password' => $password,
                    'password_changed_at' => now(),
                    'must_change_password' => false,
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
            $latestRegistration = PesertaKkn::query()
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

        // Mahasiswa: core address + biodata required
        // Note: address_lat, address_lng, address_verified_at, and address_postal_code
        // are auto-filled by map picker / geocoding. If the map fails to load on
        // the student's device these stay NULL and the student has no way to fix it.
        // Only require fields the student can always fill manually.
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
