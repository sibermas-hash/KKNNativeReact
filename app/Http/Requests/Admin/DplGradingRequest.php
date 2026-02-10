<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class DplGradingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Checked in controller
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'group_id' => 'required|exists:groups,id',
            'final_report_score' => 'required|numeric|min:0|max:100',
            'execution_score' => 'required|numeric|min:0|max:100',
            'article_score' => 'required|numeric|min:0|max:100',
        ];
    }
}
