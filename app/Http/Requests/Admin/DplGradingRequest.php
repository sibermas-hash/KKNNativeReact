<?php

namespace App\Http\Requests\Admin;

use App\Models\KKN\NilaiKkn;
use Illuminate\Foundation\Http\FormRequest;

class DplGradingRequest extends FormRequest
{
    public function authorize(): bool
    {
        $score = NilaiKkn::firstOrNew([
            'user_id' => $this->input('student_id'),
            'kelompok_id' => $this->input('group_id'),
        ]);

        return $this->user()->can('update', $score);
    }

    public function rules(): array
    {
        return [
            'student_id' => 'required|exists:users,id',
            'group_id' => 'required|exists:kelompok_kkn,id',
            'final_report_score' => 'required|numeric|min:0|max:100',
            'execution_score' => 'required|numeric|min:0|max:100',
            'article_score' => 'required|numeric|min:0|max:100',
        ];
    }
}
