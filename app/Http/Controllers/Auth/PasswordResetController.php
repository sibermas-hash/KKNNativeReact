<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\KKN\SystemSetting;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;
use Inertia\Inertia;
use Inertia\Response;

class PasswordResetController extends Controller
{
    private function supportWhatsappNumber(): ?string
    {
        $raw = (string) (SystemSetting::get('support_whatsapp_number', env('SUPPORT_WHATSAPP_NUMBER', '')) ?? '');
        $digits = preg_replace('/\D+/', '', $raw ?? '');

        if (! $digits) {
            return null;
        }

        if (str_starts_with($digits, '0')) {
            return '62'.substr($digits, 1);
        }

        if (str_starts_with($digits, '8')) {
            return '62'.$digits;
        }

        return $digits;
    }

    private function supportWhatsappLink(): ?string
    {
        $number = $this->supportWhatsappNumber();

        if (! $number) {
            return null;
        }

        $message = rawurlencode('Halo admin, saya membutuhkan bantuan reset password akun KKN. Berikut identitas saya:');

        return "https://wa.me/{$number}?text={$message}";
    }

    /**
     * Show the forgot password form.
     */
    public function showForgotForm(): Response
    {
        return Inertia::render('Auth/ForgotPassword', [
            'status' => session('status'),
            'support_contact_label' => SystemSetting::get('support_contact_label', 'Admin KKN / LPPM'),
            'support_whatsapp_number' => $this->supportWhatsappNumber(),
            'support_whatsapp_link' => $this->supportWhatsappLink(),
        ]);
    }

    /**
     * Redirect users to the admin-assisted reset channel.
     */
    public function sendResetLink(Request $request): RedirectResponse
    {
        return back()->with('status', 'Reset password dilakukan melalui admin. Hubungi admin melalui WhatsApp dengan menyertakan username, NIM, atau NIP Anda.');
    }

    /**
     * Show the password reset form.
     */
    public function showResetForm(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ResetPassword', [
            'token' => $token,
            'email' => $request->email,
        ]);
    }

    /**
     * Reset the user's password.
     */
    public function reset(Request $request): RedirectResponse
    {
        $request->validate([
            'token' => ['required'],
            'email' => ['required', 'email'],
            'password' => ['required', PasswordRule::min(8)->mixedCase()->numbers()->symbols(), 'confirmed'],
        ]);

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->setRememberToken(Str::random(60));

                $user->save();

                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
            ? redirect()->route('login')->with('status', __($status))
            : back()->withErrors(['email' => [__($status)]]);
    }
}
