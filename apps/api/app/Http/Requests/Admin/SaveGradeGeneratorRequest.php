<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class SaveGradeGeneratorRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'scores' => ['required', 'array'],
            'scores.*.user_id' => ['required', 'exists:users,id'],
            'scores.*.discipline' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.attitude' => ['nullable', 'numeric', 'between:0,100'],
            'evidence_file' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }
}
