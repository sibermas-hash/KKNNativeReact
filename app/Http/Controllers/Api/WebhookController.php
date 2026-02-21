<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Dosen;

class WebhookController extends Controller
{
    private const ALLOWED_EVENTS = [
        'mahasiswa.created',
        'mahasiswa.updated',
        'mahasiswa.deleted',
        'dosen.created',
        'dosen.updated',
        'dosen.deleted',
    ];

    public function handle(Request $request)
    {
        $validated = $request->validate([
            'event' => ['required', 'string', 'in:' . implode(',', self::ALLOWED_EVENTS)],
            'webhook_id' => ['nullable', 'string', 'max:100'],
            'data' => ['required', 'array'],
            'data.payload' => ['required', 'array'],
        ]);

        $event = $validated['event'];
        $data = $validated['data']['payload'];

        Log::info("Webhook received for event: {$event}", ['webhook_id' => $validated['webhook_id'] ?? 'N/A']);

        // Format is {entity}.{action}, e.g., 'mahasiswa.created'
        if (str_starts_with($event, 'mahasiswa.')) {
            $this->syncMahasiswa($event, $data);
        } elseif (str_starts_with($event, 'dosen.')) {
            $this->syncDosen($event, $data);
        }

        return response()->json(['status' => 'processed']);
    }

    protected function syncMahasiswa(string $event, array $data): void
    {
        if (empty($data['nim'])) return;

        if (str_ends_with($event, '.deleted')) {
            Mahasiswa::where('nim', $data['nim'])->delete();
            return;
        }

        // Map Master Data to Local Data
        Mahasiswa::updateOrCreate(
            ['nim' => $data['nim']],
            [
                'nama' => $data['nama'] ?? null,
                'prodi_id' => $this->resolveProdi($data['prodi_id'] ?? null),
                'fakultas_id' => $this->resolveFakultas($data['fakultas_id'] ?? null),
                'angkatan' => $data['angkatan'] ?? date('Y'),
                'jenis_kelamin' => $data['jenis_kelamin'] ?? 'L',
                'no_hp' => $data['no_hp'] ?? null,
            ]
        );
    }

    protected function syncDosen(string $event, array $data): void
    {
        // Similar logic for Dosen
    }

    // Helper to map IDs if master uses different IDs than local
    protected function resolveProdi($masterId) { return $masterId; } // Simple pass-through for now
    protected function resolveFakultas($masterId) { return $masterId; }
}
