<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use App\Services\KKN\DplParticipantEvaluationService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDplParticipantEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->hasRole('student') ?? false;
    }

    public function rules(): array
    {
        $scoreRules = [];

        foreach (DplParticipantEvaluationService::CRITERIA as $criterion) {
            $scoreRules['scores.'.$criterion['key']] = ['required', 'integer', 'between:1,5'];
        }

        return array_merge($scoreRules, [
            'recommendation' => ['required', Rule::in(array_keys(DplParticipantEvaluationService::RECOMMENDATIONS))],
            'notes' => ['nullable', 'string', 'max:2000'],
            'confirmation' => ['accepted'],
        ]);
    }

    public function messages(): array
    {
        return [
            'confirmation.accepted' => 'Konfirmasi pengiriman evaluasi wajib disetujui.',
        ];
    }
}
