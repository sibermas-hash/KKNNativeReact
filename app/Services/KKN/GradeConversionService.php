<?php

namespace App\Services\KKN;

class GradeConversionService
{
    /**
     * Map numerical score (0-100) to Letter Grade and Index.
     * Based on DOKUMENTASI_SISTEM_KKN.md Section 4.6.
     */
    public static function convert(float $score): array
    {
        return match (true) {
            $score >= 86 => ['grade' => 'A',  'index' => 4.0],
            $score >= 81 => ['grade' => 'A-', 'index' => 3.6],
            $score >= 76 => ['grade' => 'B+', 'index' => 3.3],
            $score >= 71 => ['grade' => 'B',  'index' => 3.0],
            $score >= 66 => ['grade' => 'B-', 'index' => 2.6],
            $score >= 61 => ['grade' => 'C+', 'index' => 2.3],
            $score >= 56 => ['grade' => 'C',  'index' => 2.0],
            $score >= 42 => ['grade' => 'D',  'index' => 1.0],
            default      => ['grade' => 'E',  'index' => 0.0],
        };
    }

    /**
     * Check if a score meets the minimum passing criteria (C).
     */
    public static function isPassing(float $score): bool
    {
        return $score >= 56;
    }
}
