<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class TotpController extends Controller
{
    public function status(Request $request): JsonResponse
    {
        $user = $request->user();
        return response()->json(['success' => true, 'data' => [
            'enabled' => filled($user?->two_factor_secret),
            'recovery_codes_count' => $this->recoveryCodeCount($user?->two_factor_recovery_codes),
        ]]);
    }

    public function setup(Request $request): JsonResponse
    {
        return response()->json(['success' => true, 'data' => ['secret' => Str::upper(Str::random(32)), 'otpauth_url' => null]]);
    }

    public function confirm(Request $request): JsonResponse
    {
        $data = $request->validate(['secret' => ['required','string','min:16'], 'code' => ['nullable','string']]);
        $request->user()?->forceFill([
            'two_factor_secret' => Crypt::encryptString($data['secret']),
            'two_factor_recovery_codes' => json_encode($this->generateRecoveryCodes()),
        ])->save();
        return response()->json(['success' => true, 'message' => '2FA diaktifkan.', 'data' => ['enabled' => true]]);
    }

    public function disable(Request $request): JsonResponse
    {
        $request->user()?->forceFill(['two_factor_secret' => null, 'two_factor_recovery_codes' => null])->save();
        return response()->json(['success' => true, 'message' => '2FA dinonaktifkan.', 'data' => ['enabled' => false]]);
    }

    public function regenerateRecovery(Request $request): JsonResponse
    {
        $codes = $this->generateRecoveryCodes();
        $request->user()?->forceFill(['two_factor_recovery_codes' => json_encode($codes)])->save();
        return response()->json(['success' => true, 'data' => ['recovery_codes' => $codes]]);
    }

    private function generateRecoveryCodes(): array
    {
        return collect(range(1, 8))->map(fn () => Str::upper(Str::random(10).'-'.Str::random(10)))->all();
    }

    private function recoveryCodeCount(mixed $codes): int
    {
        if (!$codes) return 0;
        if (is_array($codes)) return count($codes);
        $decoded = json_decode((string) $codes, true);
        return is_array($decoded) ? count($decoded) : 0;
    }
}