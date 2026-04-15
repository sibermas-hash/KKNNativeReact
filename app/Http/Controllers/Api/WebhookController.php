<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Prodi;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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
            'event' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_EVENTS)],
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
        if (empty($data['nim'])) {
            return;
        }

        if (str_ends_with($event, '.deleted')) {
            $mahasiswa = Mahasiswa::where('nim', $data['nim'])->first();
            if ($mahasiswa) {
                $mahasiswa->update(['master_synced_at' => null]);

                if ($mahasiswa->user_id) {
                    $user = User::find($mahasiswa->user_id);
                    if ($user) {
                        $user->update(['is_active' => false]);
                    }
                }

                Log::info('Mahasiswa soft-deactivated via webhook', ['nim' => $data['nim']]);
            }

            return;
        }

        $mahasiswa = Mahasiswa::updateOrCreate(
            ['nim' => $data['nim']],
            [
                'nama' => $data['nama'] ?? null,
                'prodi_id' => $this->resolveProdi($data['prodi_id'] ?? null),
                'fakultas_id' => $this->resolveFakultas($data['fakultas_id'] ?? null),
                'angkatan' => $data['angkatan'] ?? date('Y'),
                'jenis_kelamin' => $data['jenis_kelamin'] ?? 'L',
                'no_hp' => $data['no_hp'] ?? null,
                'master_synced_at' => now(),
            ]
        );

        if ($mahasiswa->user_id) {
            $user = User::find($mahasiswa->user_id);
            if ($user && ! $user->is_active) {
                $user->update(['is_active' => true]);
            }
        }
    }

    protected function syncDosen(string $event, array $data): void
    {
        if (empty($data['nip'])) {
            return;
        }

        if (str_ends_with($event, '.deleted')) {
            $dosen = Dosen::where('nip', $data['nip'])->first();
            if ($dosen) {
                $dosen->update(['master_synced_at' => null]);

                if ($dosen->user_id) {
                    $user = User::find($dosen->user_id);
                    if ($user) {
                        $user->update(['is_active' => false]);
                    }
                }

                Log::info('Dosen soft-deactivated via webhook', ['nip' => $data['nip']]);
            }

            return;
        }

        $dosen = Dosen::updateOrCreate(
            ['nip' => $data['nip']],
            [
                'nama' => $data['nama'] ?? null,
                'faculty_id' => $this->resolveFakultas($data['fakultas_id'] ?? null),
                'jenis_kelamin' => $data['jenis_kelamin'] ?? 'L',
                'no_hp' => $data['no_hp'] ?? null,
                'is_active' => ($data['is_active'] ?? true) ? 1 : 0,
                'master_synced_at' => now(),
            ]
        );

        if ($dosen->user_id) {
            $user = User::find($dosen->user_id);
            if ($user && ! $user->is_active) {
                $user->update(['is_active' => true]);
            }
        }
    }

    // Helper to map IDs if master uses different IDs than local
    // Issue 11 Fix: Validate IDs exist in local database instead of pass-through
    protected function resolveProdi($masterId)
    {
        if (! $masterId) {
            return null;
        }

        return Prodi::where('master_id', (string) $masterId)->value('id');
    }

    protected function resolveFakultas($masterId)
    {
        if (! $masterId) {
            return null;
        }

        return Fakultas::where('master_id', (string) $masterId)->value('id');
    }
}
