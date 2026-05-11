<?php

declare(strict_types=1);

namespace App\Imports;

use App\Models\KKN\Evaluasi;
use App\Models\KKN\ItemEvaluasi;
use App\Models\KKN\Mahasiswa;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;

class EvaluationImport implements ToCollection
{
    protected $kelompokId;

    protected $lecturerId;

    public function __construct($kelompokId, $lecturerId)
    {
        $this->kelompokId = $kelompokId;
        $this->lecturerId = $lecturerId;
    }

    public function collection(Collection $rows)
    {
        // Skip header rows (start from row 8 as per template.xlsx structure)
        $dataRows = $rows->slice(7);

        foreach ($dataRows as $row) {
            $nim = $row[2] ?? null; // Column C: NIM
            $scoreDiscipline = $row[5] ?? null; // Column F: Nilai Kedisiplinan
            $scoreAttitude = $row[6] ?? null; // Column G: Nilai Sikap

            if (! $nim) {
                continue;
            }

            $mahasiswa = Mahasiswa::whereBlind('nim', (string) $nim)->first();
            if (! $mahasiswa) {
                continue;
            }

            DB::transaction(function () use ($mahasiswa, $scoreDiscipline, $scoreAttitude) {
                // Delete existing evaluation for this student/group/evaluator if exists
                Evaluasi::where([
                    'mahasiswa_id' => $mahasiswa->id,
                    'kelompok_id' => $this->kelompokId,
                    'evaluator_id' => $this->lecturerId,
                    'evaluator_type' => 'dpl',
                ])->delete();

                $evaluasi = Evaluasi::create([
                    'mahasiswa_id' => $mahasiswa->id,
                    'kelompok_id' => $this->kelompokId,
                    'evaluator_id' => $this->lecturerId,
                    'evaluator_type' => 'dpl',
                    'evaluated_at' => now(),
                ]);

                $totalScore = 0;

                // Criterion 1: Kedisiplinan (50%)
                if ($scoreDiscipline !== null) {
                    ItemEvaluasi::create([
                        'evaluation_id' => $evaluasi->id,
                        'criterion' => 'Kedisiplinan',
                        'score' => $scoreDiscipline,
                        'weight' => 50,
                    ]);
                    $totalScore += $scoreDiscipline * 0.5;
                }

                // Criterion 2: Sikap (50%)
                if ($scoreAttitude !== null) {
                    ItemEvaluasi::create([
                        'evaluation_id' => $evaluasi->id,
                        'criterion' => 'Sikap',
                        'score' => $scoreAttitude,
                        'weight' => 50,
                    ]);
                    $totalScore += $scoreAttitude * 0.5;
                }

                $grade = $this->calculateGrade($totalScore);

                $evaluasi->update([
                    'total_score' => $totalScore,
                    'grade' => $grade,
                ]);
            });
        }
    }

    private function calculateGrade($score)
    {
        if ($score >= 85) {
            return 'A';
        }
        if ($score >= 75) {
            return 'B';
        }
        if ($score >= 65) {
            return 'C';
        }
        if ($score >= 55) {
            return 'D';
        }

        return 'E';
    }
}
