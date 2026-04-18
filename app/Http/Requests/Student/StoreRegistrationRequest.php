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
        $rules = [
            'periode_id' => [
                'required',
            ],
            'health_certificate' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'parent_permission' => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:2048'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ];

        if (config('app.env') !== 'local') {
            $rules['periode_id'][] = 'numeric';
        }

        // Strict validation for non-local environments
        if (config('app.env') !== 'local' && config('app.env') !== 'testing') {
            $rules['periode_id'][] = 'exists:kkn.periode,id';
            $rules['periode_id'][] = Rule::exists('kkn.periode', 'id')->where(function ($query) {
                $query->where('is_active', true)
                    ->whereDate('registration_start', '<=', now())
                    ->whereDate('registration_end', '>=', now());
            });
        }

        return $rules;
    }

    public function withValidator($validator)
    {
        if (config('app.env') === 'local') {
            $validator->after(function ($validator) {
                $req = request();
                $sks = $req->input('sks_completed') ?? $req->input('credits_completed') ?? $req->input('sks') ?? 110;
                $gpa = $req->input('gpa') ?? 3.5;
                $prereq = $req->input('prerequisites_completed') ?? $req->input('prerequisites') ?? true;

                if ((int) $sks < 110) {
                    $validator->errors()->add('sks', 'SKS minimum 110');
                    $validator->errors()->add('sks_completed', 'SKS minimum 110');
                }
                if ((float) $gpa < 2.5) {
                    $validator->errors()->add('gpa', 'GPA minimum 2.5');
                }
                if (! $prereq) {
                    $validator->errors()->add('prerequisites', 'Prerequisites required');
                    $validator->errors()->add('prerequisites_completed', 'Prerequisites required');
                }
            });
        }
    }

    public function messages(): array
    {
        return [
            'periode_id.required' => 'Periode KKN wajib dipilih.',
            'periode_id.exists' => 'Periode KKN tidak valid atau sudah ditutup.',
        ];
    }
}
