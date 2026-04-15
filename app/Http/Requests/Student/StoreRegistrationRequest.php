<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRegistrationRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow if user is authenticated - actual authorization is handled by middleware
        return $this->user() !== null;
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
            'health_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'parent_permission' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
