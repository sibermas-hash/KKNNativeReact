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
        $request->session()->put('captcha_answer', $captcha['answer']);

        return Inertia::render('Auth/Login', [
            'captcha_question' => $captcha['question'],
        ]);
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        // Validate captcha
        $userAnswer = (int)$request->input('captcha_answer');
        $correctAnswer = (int)$request->session()->get('captcha_answer');

        if ($userAnswer !== $correctAnswer) {
            // Regenerate captcha for next attempt
            $captcha = $this->generateCaptcha();
            $request->session()->put('captcha_answer', $captcha['answer']);

            return back()->withErrors([
                'captcha_answer' => 'Jawaban verifikasi keamanan salah.',
            ])->with('captcha_question', $captcha['question']);
        }

        $request->authenticate();
        $request->session()->regenerate();

        // Clean up captcha from session
        $request->session()->forget('captcha_answer');

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
}