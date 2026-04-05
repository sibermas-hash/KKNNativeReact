<?php

namespace App\Http\Requests\Dpl;

use Illuminate\Foundation\Http\FormRequest;

class ValidateEvaluationImportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // We keep authorization logic in controller for now as per current structure
    }

    public function rules(): array
    {
        return [
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'file' => ['required', 'file', 'mimes:xlsx,xls'],
        ];
    }
}
