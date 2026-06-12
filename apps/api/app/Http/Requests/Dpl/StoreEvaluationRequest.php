<?php

declare(strict_types=1);

namespace App\Http\Requests\Dpl;

use Illuminate\Foundation\Http\FormRequest;

class StoreEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => ['required', 'exists:mahasiswa,id'],
            'group_id' => ['required', 'exists:kelompok_kkn,id'],
            'evaluator_type' => ['required', 'in:dpl'],
            'notes' => ['nullable', 'string'],
            'items' => ['required', 'array', 'size:3'],
            'items.*.criterion' => ['required', 'string'],
            'items.*.score' => ['required', 'numeric', 'min:0', 'max:100'],
            'items.*.weight' => ['required', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
