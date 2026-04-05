<?php

namespace App\Http\Requests\Student;

use Illuminate\Foundation\Http\FormRequest;

class StoreDailyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // We keep SOP and ownership checks in the controller
    }

    public function rules(): array
    {
        $rules = [
            'date' => ['required', 'date'],
            'title' => ['required', 'string', 'max:200'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'output' => ['nullable', 'string'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'gps_accuracy' => ['nullable', 'numeric', 'min:0', 'max:5000'],
            'captured_at' => ['required', 'date'],
            'location_source' => ['required', 'in:gps'],
            'location_name' => ['required', 'string', 'max:255'],
        ];

        if ($this->isMethod('POST')) {
            $rules['files.*'] = ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'];
        }

        return $rules;
    }
}
