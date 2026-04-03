<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period_id' => [
                'required',
                'exists:periode,id',
                Rule::exists('periode', 'id')->where(function ($query) {
                    $query->where('is_active', true)
                        ->whereDate('registration_start', '<=', now())
                        ->whereDate('registration_end', '>=', now());
                }),
            ],
            'kelompok_id' => [
                'nullable',
                Rule::exists('kelompok_kkn', 'id')->where(function ($query) {
                    $query->where('period_id', $this->period_id)
                        ->where('status', 'active');
                }),
            ],
            'health_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'parent_permission' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
