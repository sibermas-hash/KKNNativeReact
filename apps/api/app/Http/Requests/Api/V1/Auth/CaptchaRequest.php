<?php

declare(strict_types=1);

namespace App\Http\Requests\Api\V1\Auth;

use Illuminate\Foundation\Http\FormRequest;

class CaptchaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'captcha_id' => ['required', 'string', 'uuid'],
            'captcha_answer' => ['required', 'string', 'max:10'],
        ];
    }

    public function messages(): array
    {
        return [
            'captcha_id.required' => 'CAPTCHA ID tidak ditemukan. Silakan minta CAPTCHA baru.',
            'captcha_id.uuid' => 'Format CAPTCHA ID tidak valid.',
            'captcha_answer.required' => 'Jawaban CAPTCHA wajib diisi.',
        ];
    }
}
