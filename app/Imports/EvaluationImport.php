<?php

namespace App\Imports;

use App\Models\Evaluation;
use App\Models\EvaluationItem;
use App\Models\Student;
use App\Models\Group;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\ToCollection;
use Illuminate\Support\Facades\DB;

class EvaluationImport implements ToCollection
{
    protected $groupId;
    protected $lecturerId;

    public function __construct($groupId, $lecturerId)
    {
        $this->groupId = $groupId;
        $this->lecturerId = $lecturerId;
    }

    public function collection(Collection $rows)
    {
        // Skip header rows (start from row 8 as per template.xlsx structure)
        // Row 1: Kelompok
        // Row 2-5: Detail Lokasi/DPL
        // Row 7: Table Headers
        // Row 8: First Student Data
        
        $dataRows = $rows->slice(7);

        foreach ($dataRows as $row) {
            $nim = $row[2] ?? null; // Column C: NIM
            $scoreDiscipline = $row[5] ?? null; // Column F: Nilai Kedisiplinan
            $scoreAttitude = $row[6] ?? null; // Column G: Nilai Sikap

            if (!$nim) continue;

            $student = Student::where('nim', $nim)->first();
            if (!$student) continue;

            DB::transaction(function () use ($student, $scoreDiscipline, $scoreAttitude) {
                // Delete existing evaluation for this student/group/evaluator if exists
                Evaluation::where([
                    'student_id' => $student->id,
                    'group_id' => $this->groupId,
                    'evaluator_id' => $this->lecturerId,
                    'evaluator_type' => 'dpl'
                ])->delete();

                $evaluation = Evaluation::create([
                    'student_id' => $student->id,
                    'group_id' => $this->groupId,
                    'evaluator_id' => $this->lecturerId,
                    'evaluator_type' => 'dpl',
                    'evaluated_at' => now(),
                ]);

                $totalScore = 0;

                // Criterion 1: Kedisiplinan (50%)
                if ($scoreDiscipline !== null) {
                    EvaluationItem::create([
                        'evaluation_id' => $evaluation->id,
                        'criterion' => 'Kedisiplinan',
                        'score' => $scoreDiscipline,
                        'weight' => 50,
                    ]);
                    $totalScore += $scoreDiscipline * 0.5;
                }

                // Criterion 2: Sikap (50%)
                if ($scoreAttitude !== null) {
                    EvaluationItem::create([
                        'evaluation_id' => $evaluation->id,
                        'criterion' => 'Sikap',
                        'score' => $scoreAttitude,
                        'weight' => 50,
                    ]);
                    $totalScore += $scoreAttitude * 0.5;
                }

                $grade = $this->calculateGrade($totalScore);

                $evaluation->update([
                    'total_score' => $totalScore,
                    'grade' => $grade,
                ]);
            });
        }
    }

    private function calculateGrade($score)
    {
        if ($score >= 85) return 'A';
        if ($score >= 75) return 'B';
        if ($score >= 65) return 'C';
        if ($score >= 55) return 'D';
        return 'E';
    }
}
