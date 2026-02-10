<?php

namespace App\Services;

use App\Models\KknScore;
use App\Models\User;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateService
{
    /**
     * Generate PDF certificate for a specific student score
     */
    public function generateForStudent(KknScore $score)
    {
        $score->load([
            'student.student',
            'group.period',
            'group.location',
            'group.lecturer.user',
        ]);

        // Logic Anti-Halu: Cek progres dokumen wajib (Laporan Akhir)
        $finalReport = \App\Models\FinalReport::where('student_id', $score->student_id)
            ->where('group_id', $score->group_id)
            ->first();

        abort_if(!$finalReport || $finalReport->status !== 'approved', 403, 'Sertifikat belum tersedia. Laporan akhir belum disetujui DPL.');

        // Logic Minimal Grade 'B' (>= 70)
        abort_if($score->total_score < 70, 403, 'Sertifikat hanya diberikan kepada mahasiswa dengan nilai minimal B.');

        $studentModel = $score->student->student;
        $location = $score->group->location;

        $verificationToken = strtoupper(substr(md5("CERT-{$score->id}-{$score->student_id}"), 0, 12));
        $verificationUrl = url("/verify-certificate/{$verificationToken}");

        $data = [
            'name' => $score->student->name,
            'nim' => $studentModel?->nim ?? '-',
            'period' => $score->group->period->name,
            'location' => trim(($location->village_name ?? '') . ', ' . ($location->address ?? '')),
            'score' => $score->total_score,
            'grade' => $score->letter_grade,
            'date' => now()->format('d F Y'),
            'certificate_no' => 'KKN/' . $score->group->period->id . '/' . $verificationToken,
            'qr_url' => "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=" . urlencode($verificationUrl) . "&choe=UTF-8",
        ];

        return Pdf::loadView('reports.certificate', $data)
            ->setPaper('a4', 'landscape');
    }
}
