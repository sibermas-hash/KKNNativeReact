<?php

declare(strict_types=1);

namespace App\Mcp\Tools;

use App\Models\KKN\PesertaKkn;
use Illuminate\Support\Facades\DB;
use Laravel\Mcp\Attributes\AsMcpTool;

class GetStudentStats
{
    /**
     * Get real-time KKN registration statistics for AI analysis.
     *
     * @param  int  $periodId  ID of the period to analyze.
     */
    #[AsMcpTool(description: 'Fetch registration statistics for a specific KKN period.')]
    public function handle(int $periodId): array
    {
        return [
            'total_registrants' => PesertaKkn::where('periode_id', $periodId)->count(),
            'approved' => PesertaKkn::where('periode_id', $periodId)->where('status', 'approved')->count(),
            'pending' => PesertaKkn::where('periode_id', $periodId)->where('status', 'pending')->count(),
            'faculty_distribution' => PesertaKkn::where('periode_id', $periodId)
                ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                ->join('fakultas', 'mahasiswa.faculty_id', '=', 'fakultas.id')
                ->select('fakultas.nama as faculty', DB::raw('count(*) as count'))
                ->groupBy('fakultas.nama')
                ->get()
                ->toArray(),
        ];
    }
}
