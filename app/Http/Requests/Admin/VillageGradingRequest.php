<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class VillageGradingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; 
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'group_id' => 'required|exists:groups,id',
            'discipline_score' => 'required|numeric|min:0|max:100',
            'attitude_score' => 'required|numeric|min:0|max:100',
        ];
    }
}
