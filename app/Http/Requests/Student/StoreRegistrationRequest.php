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
        $today = now()->toDateString();

        return [
            'period_id' => [
                'required',
                Rule::exists('periods', 'id')->where(function ($query) use ($today) {
                    $query->where('is_active', true)
                        ->whereDate('registration_start', '<=', $today)
                        ->whereDate('registration_end', '>=', $today);
                }),
            ],
            'kelompok_id' => [
                'nullable',
                Rule::exists('kelompok_kkn', 'id')->where(function ($query) {
                    $query->where('period_id', $this->period_id);
                }),
            ],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];
    }
}