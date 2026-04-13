<?php

declare(strict_types=1);

namespace App\Services\AI;

use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use function Laravel\Ai\agent;

class SelfHealerService
{
    public function attemptFix(\Throwable $e): bool
    {
        $filePath = $e->getFile();
        if (!str_contains($filePath, '/app/') || !File::exists($filePath)) return false;

        try {
            $response = agent(
                instructions: "Anda adalah sistem Self-Healing. Berikan HANYA kode PHP lengkap yang sudah diperbaiki, tanpa penjelasan, tanpa markdown.",
            )->prompt(
                prompt: "Error: {$e->getMessage()} di baris {$e->getLine()}. File: " . File::get($filePath),
                provider: 'alibaba',
                model: 'qwen-plus'
            );

            $newCode = trim($response->text);
            $newCode = preg_replace('/^```php\s+/i', '', $newCode);
            $newCode = preg_replace('/\s+```$/', '', $newCode);

            // Validasi: Jangan timpa jika AI tidak memberikan kode PHP yang valid
            if (str_contains($newCode, '<?php') && strlen($newCode) > 50) {
                File::put($filePath, $newCode);
                Log::info("🩺 AI Healed: {$filePath}");
                return true;
            }
        } catch (\Exception $ex) {
            Log::error("Healer Error: " . $ex->getMessage());
        }
        return false;
    }
}
