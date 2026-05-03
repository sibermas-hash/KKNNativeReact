<?php

declare(strict_types=1);

namespace App\Http\Requests\Auth;

use Illuminate\Auth\Events\Lockout;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class LoginRequest extends FormRequest
{
    private function loginIdentifier(): string
    {
        return trim((string) $this->input('login'));
    }

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'remember' => ['nullable', 'boolean'],
            'captcha_answer' => ['required', 'numeric', 'min:0', 'max:999'],
        ];
    }

    public function authenticate(): void
    {
        \Log::info('=== AUTHENTICATE DEBUG ===', [
            'credentials' => $this->credentials(),
            'session_id' => $this->session()->getId(),
            'csrf_token' => $this->session()->token(),
            '_token' => $this->input('_token'),
        ]);

        $this->ensureIsNotRateLimited();

        if (! Auth::attempt($this->credentials(), $this->boolean('remember'))) {
            RateLimiter::hit($this->throttleKey());

            \Log::warning('Auth attempt failed', ['credentials' => $this->credentials()]);

            throw ValidationException::withMessages([
                'login' => __('auth.failed'),
            ]);
        }

        RateLimiter::clear($this->throttleKey());
    }

    protected function credentials(): array
    {
        $loginValue = $this->loginIdentifier();

        // Determine if the input is an email or username
        $field = filter_var($loginValue, FILTER_VALIDATE_EMAIL) ? 'email' : 'username';

        return [
            $field => $loginValue,
            'password' => $this->input('password'),
            'is_active' => true,
        ];
    }

    protected function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), 3)) {
            return;
        }

        event(new Lockout($this));

        $seconds = RateLimiter::availableIn($this->throttleKey());

        throw ValidationException::withMessages([
            'login' => trans('auth.throttle', [
                'seconds' => $seconds,
                'minutes' => ceil($seconds / 60),
            ]),
        ]);
    }

    protected function throttleKey(): string
    {
        return Str::transliterate(Str::lower($this->loginIdentifier()).'|'.$this->ip());
    }
}
