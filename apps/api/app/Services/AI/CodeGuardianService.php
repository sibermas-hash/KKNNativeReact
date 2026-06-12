<?php

declare(strict_types=1);

namespace App\Services\AI;

use Illuminate\Support\Facades\File;

use function Laravel\Ai\agent;

class CodeGuardianService
{
    /**
     * Scan a specific file for "rotten" code or old patterns.
     */
    public function scan(string $filePath): array
    {
        $content = File::get($filePath);

        $response = agent(
            instructions: "Anda adalah pakar audit Laravel 13. Tugas Anda adalah mendeteksi: 
            1. Penggunaan properti lama (fillable, hidden, casts) yang seharusnya menggunakan Native Attributes.
            2. Logika yang melanggar keamanan (misal: logging data sensitif).
            3. Potensi N+1 Query.
            Berikan RESPON HANYA DALAM JSON: {'issue_found': boolean, 'severity': 'low/high', 'description': '...', 'suggestion': 'kode baru'}"
        )->prompt(
            prompt: "Analisis file ini: {$content}",
            provider: (string) config('ai.routing.code.provider', config('ai.default', 'rizquna')),
            model: (string) config('ai.routing.code.model', 'cx/gpt-5.3-codex')
        );

        return json_decode($response->text, true) ?? [];
    }

    /**
     * Automatically apply fix to a file.
     */
    public function heal(string $filePath, string $newCode): bool
    {
        // Backup original file first
        File::copy($filePath, $filePath.'.bak');

        try {
            File::put($filePath, $newCode);

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
