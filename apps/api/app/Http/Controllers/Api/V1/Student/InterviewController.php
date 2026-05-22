<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\InterviewParticipant;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    use ApiResponse;

    /**
     * Get current student's interview schedule(s).
     */
    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $mahasiswa = $user->mahasiswa;

        if (!$mahasiswa) {
            return $this->success(['interviews' => []]);
        }

        // Get all peserta_kkn for this mahasiswa
        $pesertaIds = PesertaKkn::where('mahasiswa_id', $mahasiswa->id)->pluck('id');

        $participants = InterviewParticipant::with([
            'schedule.periode.jenisKkn',
            'schedule.creator',
        ])
            ->whereIn('peserta_kkn_id', $pesertaIds)
            ->orderByDesc('created_at')
            ->get()
            ->map(function (InterviewParticipant $p) {
                $s = $p->schedule;
                return [
                    'id' => $p->id,
                    'result' => $p->result,
                    'notes' => $p->notes,
                    'processed_at' => $p->processed_at?->toIso8601String(),
                    'schedule' => [
                        'id' => $s->id,
                        'interview_date' => $s->interview_date->toDateString(),
                        'interview_time_start' => $s->interview_time_start->format('H:i'),
                        'interview_time_end' => $s->interview_time_end->format('H:i'),
                        'location' => $s->location,
                        'notes' => $s->notes,
                        'periode' => [
                            'name' => $s->periode?->name,
                            'jenis_kkn' => $s->periode?->jenisKkn?->name,
                        ],
                    ],
                ];
            });

        return $this->success(['interviews' => $participants]);
    }
}
