<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class AdminGradingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'group_id' => 'required|exists:kelompok_kkn,id',
            'administration_score' => 'required|numeric|min:0|max:100',
        ];
    }
}
