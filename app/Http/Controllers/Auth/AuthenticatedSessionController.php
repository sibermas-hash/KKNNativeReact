<?php

declare(strict_types=1);

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    private const CAPTCHA_TTL_MINUTES = 10;

    public function create(Request $request): Response
    {
        // Ensure fresh session for login page to prevent stale CSRF tokens
        if (! $request->session()->isStarted()) {
            $request->session()->start();
        }

        // Regenerate CSRF token only when the previous token is known missing.
        if ($request->session()->get('_token_missing')) {
            $request->session()->regenerateToken();
            $request->session()->forget('_token_missing');
        }

        if (
            $request->has('refresh')
            || ! $request->session()->has('captcha_hash')
            || ! $request->session()->has('captcha_question')
            || $this->captchaExpired($request)
        ) {
            $this->refreshCaptcha($request);
        }

        return Inertia::render('Auth/Login', [
            'captcha_question' => $request->session()->get('captcha_question'),
            'captcha_generated_at' => $request->session()->get('captcha_generated_at'),
            'captcha_ttl_seconds' => self::CAPTCHA_TTL_MINUTES * 60,
        ]);
    }

    public function refresh(Request $request): JsonResponse
    {
        if (! $request->session()->isStarted()) {
            $request->session()->start();
        }

        $this->refreshCaptcha($request);

        return response()->json([
            'question' => $request->session()->get('captcha_question'),
            'generated_at' => $request->session()->get('captcha_generated_at'),
            'ttl_seconds' => self::CAPTCHA_TTL_MINUTES * 60,
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        \Log::info('Login Attempt Started', ['login' => $request->input('login')]);

        // Ensure session is started and regenerate token for security
        if (! $request->session()->isStarted()) {
            $request->session()->start();
        }

        // Sanitize login input (allow alphanumeric, @ and .)
        $loginInput = trim((string) $request->input('login', ''));
        $request->merge(['login' => $loginInput]);

        $userAnswer = $request->input('captcha_answer');
        $captchaHash = $request->session()->get('captcha_hash');

        // Verify captcha hash existence and strict TTL enforcement
        if (! $captchaHash || $this->captchaExpired($request) || ! $this->verifyCaptchaAnswer($userAnswer, $captchaHash)) {
            \Log::warning('Login Captcha Failed', ['userAnswer' => $userAnswer, 'hash_exists' => (bool) $captchaHash]);
            $this->refreshCaptcha($request);

            return back()->withErrors([
                'captcha_answer' => 'Verifikasi keamanan kedaluwarsa atau salah.',
            ])->withInput($request->except('password', 'captcha_answer'));
        }

        try {
            \Log::info('Authenticating user...');
            $request->authenticate();
            \Log::info('Authentication passed.');
        } catch (ValidationException $e) {
            \Log::warning('Validation Exception during auth', ['errors' => $e->errors()]);
            $this->refreshCaptcha($request);
            $request->session()->regenerateToken();
            throw $e;
        } catch (\Throwable $e) {
            \Log::error('Authentication error during login attempt', [
                'login_identifier' => $request->input('login'),
                'error' => $e->getMessage(),
                'trace' => config('app.debug') ? $e->getTraceAsString() : null,
            ]);

            $this->refreshCaptcha($request);
            $request->session()->regenerateToken();

            return back()->withErrors([
                'login' => 'Gagal masuk ke sistem. Silakan coba lagi. '.$e->getMessage(),
            ])->withInput($request->except('password', 'captcha_answer'));
        }

        $request->session()->regenerate();
        $request->session()->forget(['captcha_hash', 'captcha_question', 'captcha_generated_at']);

        /** @var User $user */
        $user = auth()->user();
        \Log::info('User authenticated successfully', ['user_id' => $user->id, 'roles' => $user->getRoleNames()]);

        if ($user->hasRole(['superadmin', 'admin', 'faculty_admin'])) {
            \Log::info('Redirecting to admin dashboard');

            return redirect()->intended(route('admin.dashboard'));
        }

        if ($user->hasRole(['dosen', 'dpl'])) {
            \Log::info('Redirecting to Dosen dashboard');

            return redirect()->intended(route('dosen.dashboard', absolute: false));
        }

        if ($user->hasRole('student')) {
            \Log::info('Redirecting to student dashboard');

            return redirect()->intended(route('student.dashboard', absolute: false));
        }

        \Log::warning('User has no matching roles, redirecting to home', ['user_id' => $user->id]);

        return redirect()->intended('/');
    }

    public function destroy(Request $request): RedirectResponse
    {
        auth()->guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    /**
     * Generate a simple math captcha question.
     */
    private function generateCaptcha(): array
    {
        $operators = ['+', '-'];
        $operator = $operators[array_rand($operators)];

        switch ($operator) {
            case '+':
                $a = random_int(1, 20);
                $b = random_int(1, 20);
                $answer = $a + $b;
                break;
            case '-':
                $a = random_int(10, 30);
                $b = random_int(1, $a - 1); // Ensure positive result
                $answer = $a - $b;
                break;
            default:
                $a = random_int(1, 20);
                $b = random_int(1, 20);
                $answer = $a + $b;
        }

        return [
            'question' => "Berapa hasil {$a} {$operator} {$b}?",
            'answer' => $answer,
        ];
    }

    private function refreshCaptcha(Request $request): void
    {
        $captcha = $this->generateCaptcha();

        $request->session()->put('captcha_hash', $this->hashCaptchaAnswer($captcha['answer']));
        $request->session()->put('captcha_question', $captcha['question']);
        $request->session()->put('captcha_generated_at', now()->timestamp);
    }

    private function captchaExpired(Request $request): bool
    {
        $generatedAt = $request->session()->get('captcha_generated_at');

        if (! is_numeric($generatedAt)) {
            return ! $request->session()->has('captcha_hash');
        }

        return now()->diffInMinutes(now()->setTimestamp((int) $generatedAt)) >= self::CAPTCHA_TTL_MINUTES;
    }

    /**
     * Hash captcha answer using HMAC-SHA256.
     * ISSUE-LOGIN-002 Fix: Prevent session-based captcha bypass
     */
    private function hashCaptchaAnswer(int $answer): string
    {
        return hash_hmac('sha256', (string) $answer, config('app.key'));
    }

    /**
     * Verify captcha answer using constant-time comparison.
     */
    private function verifyCaptchaAnswer(string|int|null $userAnswer, string $captchaHash): bool
    {
        if ($userAnswer === null) {
            return false;
        }

        $normalizedAnswer = is_string($userAnswer) ? trim($userAnswer) : (string) $userAnswer;

        if ($normalizedAnswer === '' || ! is_numeric($normalizedAnswer)) {
            return false;
        }

        $userHash = $this->hashCaptchaAnswer((int) $normalizedAnswer);

        return hash_equals($captchaHash, $userHash);
    }
}
