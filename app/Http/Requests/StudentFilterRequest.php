<?php

declare(strict_types=1);

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StudentFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'string', 'in:pending,approved,rejected,transferred,completed'],
            'faculty_id' => ['nullable', 'integer', 'exists:fakultas,id'],
            'program_id' => ['nullable', 'integer'],
            'group_id' => ['nullable', 'integer', 'exists:kelompok_kkn,id'],
            'gender' => ['nullable', 'string', 'in:L,P'],
            'has_group' => ['nullable', 'boolean'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date', 'after_or_equal:date_from'],
            'sort_by' => ['nullable', 'string', 'in:name,nim,status,registration_date,group'],
            'sort_order' => ['nullable', 'string', 'in:asc,desc'],
            'per_page' => ['nullable', 'integer', 'min:10', 'max:100'],
        ];
    }

    /**
     * Sanitize search input before validation.
     */
    protected function prepareForValidation(): void
    {
        if ($this->has('search')) {
            $this->merge([
                'search' => strip_tags(trim($this->search)),
            ]);
        }
    }

    /**
     * Get pagination value with default.
     */
    public function perPage(): int
    {
        return $this->validated('per_page') ?? 20;
    }
}
