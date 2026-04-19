<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Helpers\PasswordHelper;
use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use App\Services\StudentSyncService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
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

    public function __construct(
        private StudentSyncService $studentSync
    ) {}

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

        try {
            if (str_starts_with($event, 'mahasiswa.')) {
                $this->syncMahasiswa($event, $data);
            } elseif (str_starts_with($event, 'dosen.')) {
                $this->syncDosen($event, $data);
            }

            return response()->json(['status' => 'processed']);
        } catch (\Exception $e) {
            Log::error("Webhook processing failed for {$event}", [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $data,
            ]);

            return response()->json(['status' => 'error', 'message' => $e->getMessage()], 500);
        }
    }

    protected function syncMahasiswa(string $event, array $data): void
    {
        if (empty($data['nim'])) {
            return;
        }

        if (str_ends_with($event, '.deleted')) {
            $mahasiswa = Mahasiswa::where('nim', $data['nim'])->first();
            if ($mahasiswa) {
                DB::transaction(function () use ($mahasiswa) {
                    $mahasiswa->update(['master_synced_at' => null]);

                    if ($mahasiswa->user_id) {
                        $user = User::find($mahasiswa->user_id);
                        if ($user) {
                            $user->update(['is_active' => false]);
                        }
                    }
                });

                Log::info('Mahasiswa soft-deactivated via webhook', ['nim' => $data['nim']]);
            }

            return;
        }

        $this->studentSync->upsertStudent($data);
    }

    protected function syncDosen(string $event, array $data): void
    {
        if (empty($data['nip'])) {
            return;
        }

        if (str_ends_with($event, '.deleted')) {
            $dosen = Dosen::where('nip', $data['nip'])->first();
            if ($dosen) {
                DB::transaction(function () use ($dosen) {
                    $dosen->update(['master_synced_at' => null]);

                    if ($dosen->user_id) {
                        $user = User::find($dosen->user_id);
                        if ($user) {
                            $user->update(['is_active' => false]);
                        }
                    }
                });

                Log::info('Dosen soft-deactivated via webhook', ['nip' => $data['nip']]);
            }

            return;
        }

        DB::transaction(function () use ($data) {
            $nip = $data['nip'];
            $facultyId = null;
            $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? $data['fakultas_id'] ?? null);
            if ($organizationMasterId !== null) {
                $facultyId = Fakultas::where('master_id', $organizationMasterId)->first()?->id;
            }

            $username = (string) $nip;
            $incomingEmail = $data['email'] ?? null;
            $fallbackEmail = $username.'@kkn.local';

            $user = User::firstOrNew(['username' => $username]);
            $isNewUser = ! $user->exists;

            if ($isNewUser) {
                $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
                $birthDate = $data['birth_date'] ?? $data['tanggal_lahir'] ?? null;
                $user->password = Hash::make(
                    PasswordHelper::fromBirthDate($birthDate, $username)
                );
            } elseif (empty($user->email)) {
                $user->email = ! empty($incomingEmail) ? $incomingEmail : $fallbackEmail;
            }

            $user->username = $username;
            $user->name = $data['nama'] ?? $data['name'] ?? 'Unknown';
            $user->save();

            if (! $user->hasRole('dpl')) {
                $user->assignRole('dosen');
            }

            Dosen::updateOrCreate(
                ['nip' => $nip],
                [
                    'user_id' => $user->id,
                    'nama' => $data['nama'] ?? $data['name'] ?? 'Unknown',
                    'fakultas_id' => $facultyId,
                    'phone' => $data['phone'] ?? $data['telepon'] ?? $data['no_hp'] ?? null,
                    'gender' => $data['gender'] ?? $data['jenis_kelamin'] ?? 'L',
                    'birth_date' => $data['birth_date'] ?? $data['tanggal_lahir'] ?? null,
                    'is_cpns' => str_contains(strtoupper($data['status_pegawai'] ?? $data['employment_status'] ?? ''), 'CPNS'),
                    'is_tugas_belajar' => str_contains(strtoupper($data['status_aktif'] ?? $data['active_status'] ?? 'AKTIF'), 'TUGAS BELAJAR'),
                    'master_id' => $this->normalizeMasterId($data['id'] ?? $data['master_id'] ?? null),
                    'master_synced_at' => now(),
                ]
            );

            if ($user && ! $user->is_active) {
                $user->update(['is_active' => true]);
            }
        });
    }

    private function normalizeMasterId(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $normalized = trim((string) $value);

        return $normalized === '' ? null : $normalized;
    }
}
