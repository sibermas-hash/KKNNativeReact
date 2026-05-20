<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\CaptchaService;
use App\Services\MasterLoginProvisioningService;
use App\Services\PeriodContextService;
use App\Services\WhatsAppGatewayService;
use Illuminate\Auth\Events\Lockout;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly CaptchaService $captchaService,
        private readonly PeriodContextService $periodContextService,
        private readonly MasterLoginProvisioningService $masterLoginProvisioning,
        private readonly WhatsAppGatewayService $whatsAppGateway,
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

        $credentials = [
            'username' => $loginValue,
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

        ActivityLogger::log('login', 'success', $user->id, [
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
        $attempts = Cache::get($throttleKey, 0);
        if ($attempts >= 5) {
            Cache::forget("2fa-challenge:{$data['challenge_token']}");
            Cache::forget($throttleKey);

            return $this->error(
                'TWO_FACTOR_CHALLENGE_EXPIRED',
                'Terlalu banyak percobaan 2FA. Silakan login ulang.',
                429
            );
        }

        $challenge = Cache::get("2fa-challenge:{$data['challenge_token']}");

        if (! $challenge || ! isset($challenge['user_id'])) {
            return $this->error('TWO_FACTOR_CHALLENGE_EXPIRED', 'Sesi 2FA kedaluwarsa. Silakan login ulang.', 401);
        }

        $user = User::find($challenge['user_id']);
        if (! $user || ! $user->hasTwoFactorEnabled()) {
            return $this->error('TWO_FACTOR_INVALID', 'User tidak valid atau 2FA tidak aktif.', 401);
        }

        $code = trim($data['code']);
        $isValidCode = false;
        $usedRecovery = false;

        // Try TOTP first (6 digits)
        if (preg_match('/^[0-9]{6}$/', $code)) {
            $g2fa = new Google2FA;
            $isValidCode = $g2fa->verifyKey($user->two_factor_secret, $code);
        }

        // Try recovery code (format XXXX-XXXX)
        if (! $isValidCode && $user->two_factor_recovery_codes) {
            $codes = $user->two_factor_recovery_codes;
            foreach ($codes as $i => $hashed) {
                if (Hash::check($code, $hashed)) {
                    $isValidCode = true;
                    $usedRecovery = true;
                    // Remove used recovery code
                    unset($codes[$i]);
                    $user->update(['two_factor_recovery_codes' => array_values($codes)]);
                    break;
                }
            }
        }

        if (! $isValidCode) {
            // Increment per-challenge-token throttle counter (TTL 5 min, same as challenge)
            Cache::put(
                $throttleKey,
                $attempts + 1,
                now()->addMinutes(5)
            );

            ActivityLogger::log('2fa_verify', 'failed', $user->id, [
                'reason' => 'invalid_code',
                'attempts' => $attempts + 1,
            ]);

            return $this->error('TWO_FACTOR_INVALID', 'Kode 2FA tidak valid.', 422);
        }

        // Success! Burn the challenge + throttle counter, issue real token
        Cache::forget("2fa-challenge:{$data['challenge_token']}");
        Cache::forget($throttleKey);

        ActivityLogger::log('2fa_verify', 'success', $user->id, [
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
            ActivityLogger::log('logout', 'success', $user->id);
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



    public function recoveryLookup(Request $request): JsonResponse
    {
        $data = $request->validate(['identifier' => ['required', 'string', 'max:255']]);
        $identifier = trim($data['identifier']);
        $rateKey = 'recovery-lookup:'.sha1($request->ip().'|'.mb_strtolower($identifier));
        if (RateLimiter::tooManyAttempts($rateKey, 5)) {
            throw ValidationException::withMessages(['identifier' => ['Terlalu banyak percobaan. Coba lagi beberapa menit.']]);
        }
        RateLimiter::hit($rateKey, 15 * 60);

        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('username', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user) {
            $mahasiswaUserId = DB::table('mahasiswa')
                ->where('nim', $identifier)
                ->orWhere('phone', $identifier)
                ->value('user_id');
            if ($mahasiswaUserId) $user = User::find($mahasiswaUserId);
        }

        if (! $user) {
            return $this->success(['found' => false, 'recovery_token' => null, 'methods' => []], 'Jika akun ditemukan, opsi pemulihan akan tersedia.');
        }

        $phone = $this->whatsAppGateway->normalizePhone($user->phone ?: DB::table('mahasiswa')->where('user_id', $user->id)->value('phone'));
        $email = $user->email;
        $methods = [];
        if ($phone) $methods[] = ['type' => 'whatsapp', 'label' => 'WhatsApp '.$this->maskPhone($phone)];
        if ($email) $methods[] = ['type' => 'email', 'label' => 'Email '.$this->maskEmail($email)];

        if ($methods === []) {
            return $this->success(['found' => false, 'recovery_token' => null, 'methods' => []], 'Jika akun ditemukan, opsi pemulihan akan tersedia.');
        }

        $token = Str::random(48);
        Cache::put('password-recovery:'.$token, [
            'user_id' => $user->id,
            'phone' => $phone,
            'email' => $email,
            'otp_hash' => null,
            'method' => null,
            'verified' => false,
            'attempts' => 0,
        ], now()->addMinutes(15));

        return $this->success([
            'found' => true,
            'recovery_token' => $token,
            'masked_name' => $this->maskName((string) $user->name),
            'methods' => $methods,
        ], 'Akun ditemukan. Pilih metode pemulihan.');
    }

    public function recoverySendCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recovery_token' => ['required', 'string'],
            'method' => ['required', 'in:whatsapp,email'],
        ]);
        $key = 'password-recovery:'.$data['recovery_token'];
        $payload = Cache::get($key);
        if (! is_array($payload) || empty($payload['user_id'])) {
            throw ValidationException::withMessages(['recovery_token' => ['Sesi pemulihan tidak valid atau kedaluwarsa.']]);
        }

        $cooldownKey = 'recovery-send:'.$data['recovery_token'];
        if (Cache::has($cooldownKey)) {
            throw ValidationException::withMessages(['method' => ['Tunggu 60 detik sebelum mengirim ulang kode.']]);
        }

        $otp = (string) random_int(100000, 999999);
        if ($data['method'] === 'whatsapp') {
            if (empty($payload['phone'])) throw ValidationException::withMessages(['method' => ['Nomor WhatsApp tidak tersedia.']]);
            $send = $this->whatsAppGateway->sendOtp((string) $payload['phone'], $otp);
            if (! ($send['ok'] ?? false)) throw ValidationException::withMessages(['method' => ['Gagal mengirim OTP WhatsApp.']]);
        } else {
            // Email fallback keeps existing link-based channel; code email can be added later.
            $user = User::find($payload['user_id']);
            if (! $user || ! $user->email) throw ValidationException::withMessages(['method' => ['Email tidak tersedia.']]);
            Password::sendResetLink(['email' => $user->email]);
            $payload['method'] = 'email';
            Cache::put($key, $payload, now()->addMinutes(15));
            Cache::put($cooldownKey, true, now()->addSeconds(60));
            return $this->success(['channel' => 'email', 'expires_in' => 3600], 'Tautan pemulihan telah dikirim ke email.');
        }

        $payload['otp_hash'] = Hash::make($otp);
        $payload['method'] = $data['method'];
        $payload['verified'] = false;
        $payload['attempts'] = 0;
        Cache::put($key, $payload, now()->addMinutes(15));
        Cache::put($cooldownKey, true, now()->addSeconds(60));

        return $this->success(['channel' => $data['method'], 'expires_in' => 300], 'Kode OTP telah dikirim.');
    }

    public function recoveryVerifyCode(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recovery_token' => ['required', 'string'],
            'otp' => ['required', 'digits:6'],
        ]);
        $key = 'password-recovery:'.$data['recovery_token'];
        $payload = Cache::get($key);
        if (! is_array($payload) || empty($payload['otp_hash'])) {
            throw ValidationException::withMessages(['otp' => ['Kode tidak valid atau kedaluwarsa.']]);
        }
        if ((int) ($payload['attempts'] ?? 0) >= 5) {
            Cache::forget($key);
            throw ValidationException::withMessages(['otp' => ['Terlalu banyak percobaan. Minta kode baru.']]);
        }
        if (! Hash::check($data['otp'], $payload['otp_hash'])) {
            $payload['attempts'] = ((int) ($payload['attempts'] ?? 0)) + 1;
            Cache::put($key, $payload, now()->addMinutes(15));
            throw ValidationException::withMessages(['otp' => ['Kode OTP salah.']]);
        }
        $payload['verified'] = true;
        $verificationToken = Str::random(48);
        $payload['verification_token_hash'] = Hash::make($verificationToken);
        Cache::put($key, $payload, now()->addMinutes(10));
        return $this->success(['verification_token' => $verificationToken], 'Kode berhasil diverifikasi.');
    }

    public function recoveryResetPassword(Request $request): JsonResponse
    {
        $data = $request->validate([
            'recovery_token' => ['required', 'string'],
            'verification_token' => ['required', 'string'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);
        $key = 'password-recovery:'.$data['recovery_token'];
        $payload = Cache::get($key);
        if (! is_array($payload) || empty($payload['verified']) || empty($payload['verification_token_hash']) || ! Hash::check($data['verification_token'], $payload['verification_token_hash'])) {
            throw ValidationException::withMessages(['verification_token' => ['Sesi verifikasi tidak valid atau kedaluwarsa.']]);
        }
        $user = User::find($payload['user_id']);
        if (! $user) throw ValidationException::withMessages(['verification_token' => ['Akun tidak ditemukan.']]);
        $user->forceFill([
            'password' => Hash::make($data['password']),
            'password_changed_at' => now(),
            'must_change_password' => false,
        ])->save();
        Cache::forget($key);
        event(new PasswordReset($user));
        return $this->noContent('Kata sandi berhasil diatur ulang.');
    }

    private function maskPhone(string $phone): string
    {
        return substr($phone, 0, 5).'****'.substr($phone, -3);
    }

    private function maskEmail(string $email): string
    {
        [$name, $domain] = array_pad(explode('@', $email, 2), 2, '');
        return substr($name, 0, 1).'***@'.$domain;
    }

    private function maskName(string $name): string
    {
        $parts = preg_split('/\s+/', trim($name)) ?: [];
        $masked = array_map(fn ($p) => mb_substr($p, 0, 1).str_repeat('*', max(2, min(6, mb_strlen($p) - 1))), $parts);
        return implode(' ', array_slice($masked, 0, 3));
    }

    /**
     * POST /api/v1/auth/wa/request-otp
     * Request WhatsApp OTP for password reset.
     */
    public function requestWhatsAppOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'identifier' => ['required', 'string', 'max:255'],
        ]);

        $identifier = trim($data['identifier']);
        $rateKey = 'wa-otp-request:'.sha1($request->ip().'|'.mb_strtolower($identifier));

        if (RateLimiter::tooManyAttempts($rateKey, 3)) {
            throw ValidationException::withMessages([
                'identifier' => ['Terlalu banyak permintaan OTP. Coba lagi beberapa menit.'],
            ]);
        }
        RateLimiter::hit($rateKey, 15 * 60);

        $user = User::query()
            ->where('email', $identifier)
            ->orWhere('username', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (! $user) {
            $mahasiswaUserId = DB::table('mahasiswa')
                ->where('nim', $identifier)
                ->orWhere('phone', $identifier)
                ->value('user_id');
            if ($mahasiswaUserId) {
                $user = User::find($mahasiswaUserId);
            }
        }

        // Anti-enumeration: generic success even if not found/no phone.
        if (! $user) {
            return $this->noContent('Jika data ditemukan, kode OTP akan dikirim melalui WhatsApp.');
        }

        $phone = $user->phone ?: DB::table('mahasiswa')->where('user_id', $user->id)->value('phone');
        $phone = $this->whatsAppGateway->normalizePhone($phone);
        if (! $phone) {
            return $this->noContent('Jika data ditemukan, kode OTP akan dikirim melalui WhatsApp.');
        }

        $otp = (string) random_int(100000, 999999);
        $token = Str::random(48);
        Cache::put('wa-password-reset:'.$token, [
            'user_id' => $user->id,
            'otp_hash' => Hash::make($otp),
            'phone' => $phone,
            'attempts' => 0,
        ], now()->addMinutes(5));

        $send = $this->whatsAppGateway->sendOtp($phone, $otp);
        if (! ($send['ok'] ?? false)) {
            Cache::forget('wa-password-reset:'.$token);
            throw ValidationException::withMessages([
                'identifier' => ['Gagal mengirim OTP WhatsApp. Silakan coba lagi nanti.'],
            ]);
        }

        return $this->success([
            'reset_token' => $token,
            'expires_in' => 300,
            'masked_phone' => substr($phone, 0, 5).'****'.substr($phone, -3),
        ], 'Kode OTP WhatsApp telah dikirim.');
    }

    /**
     * POST /api/v1/auth/wa/reset-password
     * Reset password using WhatsApp OTP.
     */
    public function resetPasswordWithWhatsAppOtp(Request $request): JsonResponse
    {
        $data = $request->validate([
            'reset_token' => ['required', 'string'],
            'otp' => ['required', 'digits:6'],
            'password' => ['required', 'confirmed', PasswordRule::defaults()],
        ]);

        $key = 'wa-password-reset:'.$data['reset_token'];
        $payload = Cache::get($key);

        if (! is_array($payload) || empty($payload['user_id']) || empty($payload['otp_hash'])) {
            throw ValidationException::withMessages([
                'otp' => ['OTP tidak valid atau sudah kedaluwarsa.'],
            ]);
        }

        $attempts = (int) ($payload['attempts'] ?? 0);
        if ($attempts >= 5) {
            Cache::forget($key);
            throw ValidationException::withMessages([
                'otp' => ['Terlalu banyak percobaan. Silakan minta OTP baru.'],
            ]);
        }

        if (! Hash::check($data['otp'], $payload['otp_hash'])) {
            $payload['attempts'] = $attempts + 1;
            Cache::put($key, $payload, now()->addMinutes(5));
            throw ValidationException::withMessages([
                'otp' => ['Kode OTP salah.'],
            ]);
        }

        /** @var User|null $user */
        $user = User::find($payload['user_id']);
        if (! $user) {
            Cache::forget($key);
            throw ValidationException::withMessages([
                'otp' => ['Akun tidak ditemukan.'],
            ]);
        }

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'password_changed_at' => now(),
            'must_change_password' => false,
        ])->save();

        Cache::forget($key);
        event(new PasswordReset($user));

        return $this->noContent('Kata sandi berhasil diatur ulang.');
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
