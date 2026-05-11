<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Services\ActivityLogger;
use BaconQrCode\Renderer\ImageRenderer;
use BaconQrCode\Renderer\Image\SvgImageBackEnd;
use BaconQrCode\Renderer\RendererStyle\RendererStyle;
use BaconQrCode\Writer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use PragmaRX\Google2FA\Google2FA;

/**
 * TOTP 2FA endpoints untuk admin/DPL.
 *
 * Flow:
 *   1. POST /v1/2fa/setup      → generate secret + QR code (belum aktif)
 *   2. POST /v1/2fa/confirm    → user scan QR + input 6-digit code → 2FA aktif
 *   3. POST /v1/2fa/disable    → input password + code untuk nonaktifkan
 *   4. POST /v1/2fa/recovery   → regenerate backup codes
 *
 * Login flow 2-step (AuthController):
 *   1. POST /v1/auth/login     → kalau user.hasTwoFactorEnabled() → response 423 (LOCKED)
 *                                dengan tempToken 5 menit
 *   2. POST /v1/auth/2fa-verify → user kirim tempToken + code → issue full Sanctum token
 */
class TotpController extends Controller
{
    use ApiResponse;

    private Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * POST /v1/2fa/status
     * Returns 2FA state: enabled, required, has_pending_setup.
     */
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success([
            'enabled' => $user->hasTwoFactorEnabled(),
            'required' => $user->requiresTwoFactor(),
            'has_pending_setup' => filled($user->two_factor_secret) && is_null($user->two_factor_confirmed_at),
            'confirmed_at' => $user->two_factor_confirmed_at?->toIso8601String(),
            'has_recovery_codes' => filled($user->two_factor_recovery_codes),
        ]);
    }

    /**
     * POST /v1/2fa/setup
     * Generate TOTP secret + QR code SVG. Secret disimpan tapi belum aktif
     * sampai user konfirmasi dengan first code.
     */
    public function setup(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasTwoFactorEnabled()) {
            return $this->badRequest('2FA sudah aktif. Disable dulu untuk re-setup.');
        }

        $secret = $this->google2fa->generateSecretKey();
        $issuer = config('app.name', 'SIBERMAS');
        $label = $user->email ?: $user->username;

        $otpauthUrl = $this->google2fa->getQRCodeUrl($issuer, $label, $secret);

        // Generate SVG QR code
        $renderer = new ImageRenderer(
            new RendererStyle(280),
            new SvgImageBackEnd()
        );
        $writer = new Writer($renderer);
        $qrSvg = $writer->writeString($otpauthUrl);

        // Save secret (encrypted via cast), belum confirmed
        $user->update([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
        ]);

        return $this->success([
            'secret' => $secret, // displayed for manual entry
            'qr_svg' => 'data:image/svg+xml;base64,' . base64_encode($qrSvg),
            'otpauth_url' => $otpauthUrl,
            'issuer' => $issuer,
            'account' => $label,
        ], 'Setup dimulai. Scan QR code di aplikasi authenticator.');
    }

    /**
     * POST /v1/2fa/confirm
     * User input 6-digit code untuk aktifkan 2FA + dapatkan recovery codes.
     */
    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ]);

        $user = $request->user();

        if (!$user->two_factor_secret) {
            return $this->badRequest('Setup 2FA belum dimulai.');
        }

        if ($user->hasTwoFactorEnabled()) {
            return $this->badRequest('2FA sudah aktif.');
        }

        if (!$this->google2fa->verifyKey($user->two_factor_secret, $data['code'])) {
            return $this->error('INVALID_CODE', 'Kode TOTP tidak valid.', 422);
        }

        // Generate 8 backup codes (displayed once, hashed in DB)
        $plainCodes = [];
        $hashedCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $c = strtoupper(Str::random(4) . '-' . Str::random(4));
            $plainCodes[] = $c;
            $hashedCodes[] = Hash::make($c);
        }

        $user->update([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => $hashedCodes,
        ]);

        ActivityLogger::log('2fa_enable', 'success', $user->id);

        return $this->success([
            'enabled' => true,
            'recovery_codes' => $plainCodes, // show ONCE — user must save
        ], '2FA berhasil diaktifkan. Simpan backup codes ini di tempat aman.');
    }

    /**
     * POST /v1/2fa/disable
     * Wajib konfirmasi password + code untuk mencegah session-hijack disable.
     */
    public function disable(Request $request): JsonResponse
    {
        $data = $request->validate([
            'password' => ['required', 'string'],
            'code' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ]);

        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return $this->badRequest('2FA tidak aktif.');
        }

        if ($user->requiresTwoFactor()) {
            return $this->forbidden('2FA wajib untuk role Anda (admin/DPL). Tidak bisa disable.');
        }

        if (!Hash::check($data['password'], $user->password)) {
            return $this->error('INVALID_PASSWORD', 'Password salah.', 422);
        }

        if (!$this->google2fa->verifyKey($user->two_factor_secret, $data['code'])) {
            return $this->error('INVALID_CODE', 'Kode TOTP tidak valid.', 422);
        }

        $user->update([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
        ]);

        ActivityLogger::log('2fa_disable', 'success', $user->id);

        return $this->success(['enabled' => false], '2FA dinonaktifkan.');
    }

    /**
     * POST /v1/2fa/regenerate-recovery
     * Regenerate 8 backup codes. Membutuhkan 2FA sudah aktif + code valid.
     */
    public function regenerateRecovery(Request $request): JsonResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'size:6', 'regex:/^[0-9]{6}$/'],
        ]);

        $user = $request->user();

        if (!$user->hasTwoFactorEnabled()) {
            return $this->badRequest('2FA tidak aktif.');
        }

        if (!$this->google2fa->verifyKey($user->two_factor_secret, $data['code'])) {
            return $this->error('INVALID_CODE', 'Kode TOTP tidak valid.', 422);
        }

        $plainCodes = [];
        $hashedCodes = [];
        for ($i = 0; $i < 8; $i++) {
            $c = strtoupper(Str::random(4) . '-' . Str::random(4));
            $plainCodes[] = $c;
            $hashedCodes[] = Hash::make($c);
        }

        $user->update(['two_factor_recovery_codes' => $hashedCodes]);

        return $this->success(['recovery_codes' => $plainCodes], 'Backup codes diperbarui. Simpan di tempat aman.');
    }
}
