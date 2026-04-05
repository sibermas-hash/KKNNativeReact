<?php

namespace App\Http\Requests\Dpl;

use Illuminate\Foundation\Http\FormRequest;

class ImportEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'data' => ['required', 'array'],
            'data.*.id' => ['required', 'exists:mahasiswa,id'],
            'data.*.final_report_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.execution_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'data.*.article_score' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
