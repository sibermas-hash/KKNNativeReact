<?php

declare(strict_types=1);

namespace App\Http\Requests\Student;

use App\Enums\AbcdStage;
use App\Enums\LogbookCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class StoreDailyReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // We keep SOP and ownership checks in the controller
    }

    public function rules(): array
    {
        $rules = [
            'date' => ['required', 'date', 'before_or_equal:today'],
            'category' => ['nullable', 'string', 'max:50'],
            'title' => ['required', 'string', 'max:200'],
            'abcd_stage' => ['nullable', 'string', 'max:20'],
            'activity' => ['required', 'string'],
            'reflection' => ['nullable', 'string'],
            'social_media_link' => ['nullable', 'url', 'max:255'],
            'output' => ['nullable', 'string'],
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
            'gps_accuracy' => ['nullable', 'numeric', 'min:0', 'max:5000'],
            'is_mock_location' => ['nullable', 'boolean'],
            'captured_at' => ['required', 'date'],
            'location_source' => ['nullable', 'string', 'max:20'],
            'location_name' => ['nullable', 'string', 'max:255'],
        ];

        if ($this->isMethod('POST')) {
            $rules['files'] = ['nullable', 'array', 'max:5'];
            $rules['files.*'] = ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'];
        } else {
            $rules['files.*'] = ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'files.required' => 'Wajib mengunggah minimal 1 foto bukti kegiatan yang diambil di lokasi KKN.',
            'files.min' => 'Wajib mengunggah minimal 1 foto bukti kegiatan.',
            'files.max' => 'Maksimal 5 file per logbook.',
            'files.*.mimes' => 'Format file harus JPG, PNG, atau PDF.',
            'files.*.max' => 'Ukuran file maksimal 5MB per file.',
            'latitude.required' => 'Lokasi GPS wajib diaktifkan saat mengisi logbook.',
            'longitude.required' => 'Lokasi GPS wajib diaktifkan saat mengisi logbook.',
        ];
    }
}
