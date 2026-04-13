<?php

declare(strict_types=1);

namespace App\Services\AI;

use App\Models\KKN\KegiatanKkn;
use Laravel\Ai\Ai;
use function Laravel\Ai\agent;
use Illuminate\Support\Facades\Log;

class LogbookAnalyzer
{
    /**
     * Analyze a single student logbook entry using Qwen (Alibaba).
     * 
     * @param KegiatanKkn $kegiatan
     * @return array
     */
    public function analyzeEntry(KegiatanKkn $kegiatan): array
    {
        try {
            // Laravel 13 AI SDK Native Call
            $analysis = agent()
                ->prompt(
                    prompt: "Analisis laporan harian KKN berikut. Deskripsi: '{$kegiatan->deskripsi_kegiatan}'. Program Kerja: '{$kegiatan->program_kerja_name}'. 
                    Berikan JSON berisi: 
                    1. 'relevansi' (skor 1-10 antara deskripsi dan proker), 
                    2. 'sentiment' (positif/netral/negatif/kendala), 
                    3. 'saran_dpl' (satu kalimat saran singkat untuk DPL).",
                    provider: 'alibaba'
                )
                ->json();

            return $analysis;
        } catch (\Exception $e) {
            Log::error('AI Analysis failed', ['id' => $kegiatan->id, 'error' => $e->getMessage()]);
            return [
                'relevansi' => 0,
                'sentiment' => 'error',
                'saran_dpl' => 'Gagal menganalisis laporan via AI.'
            ];
        }
    }
}
