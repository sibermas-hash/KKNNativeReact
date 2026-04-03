<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController extends Controller
{
    public function create(Request $request): Response
    {
        $captcha = $this->generateCaptcha();
        $request->session()->put('captcha_hash', $this->hashCaptchaAnswer($captcha['answer']));

        return Inertia::render('Auth/Login', [
            'captcha_question' => $captcha['question'],
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        // Validate captcha using hashed comparison
        $userAnswer = $request->input('captcha_answer');
        $captchaHash = $request->session()->get('captcha_hash');

        if (!$captchaHash || !$this->verifyCaptchaAnswer($userAnswer, $captchaHash)) {
            // Regenerate captcha for next attempt
            $captcha = $this->generateCaptcha();
            $request->session()->put('captcha_hash', $this->hashCaptchaAnswer($captcha['answer']));

            return back()->withErrors([
                'captcha_answer' => 'Jawaban verifikasi keamanan salah.',
            ])->with('captcha_question', $captcha['question']);
        }

        try {
            $request->authenticate();
        } catch (\Exception $e) {
            return back()->withErrors([
                'login' => 'Gagal Otentikasi: Kredensial tidak valid.',
            ]);
        }

        $request->session()->regenerate();

        // Clean up captcha from session
        $request->session()->forget('captcha_hash');

        return redirect()->intended(route('dashboard'));
    }

    public function destroy(Request $request): RedirectResponse
    {
        auth()->guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }

    /**
     * Generate a simple math captcha question.
     */
    private function generateCaptcha(): array
    {
        $operators = ['+', '-', '×'];
        $operator = $operators[array_rand($operators)];

        switch ($operator) {
            case '+':
                $a = rand(1, 20);
                $b = rand(1, 20);
                $answer = $a + $b;
                break;
            case '-':
                $a = rand(10, 30);
                $b = rand(1, $a); // Ensure positive result
                $answer = $a - $b;
                break;
            case '×':
                $a = rand(2, 9);
                $b = rand(2, 9);
                $answer = $a * $b;
                break;
            default:
                $a = rand(1, 20);
                $b = rand(1, 20);
                $answer = $a + $b;
        }

        return [
            'question' => "{$a} {$operator} {$b} = ?",
            'answer' => $answer,
        ];
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
    private function verifyCaptchaAnswer(?string $userAnswer, string $captchaHash): bool
    {
        if ($userAnswer === null) {
            return false;
        }
        
        $userHash = $this->hashCaptchaAnswer((int) $userAnswer);
        return hash_equals($captchaHash, $userHash);
    }
}