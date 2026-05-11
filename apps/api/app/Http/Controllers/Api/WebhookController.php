<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Helpers\PasswordHelper;
use App\Http\Controllers\Controller;
use App\Models\KKN\Dosen;
use App\Models\KKN\Fakultas;
use App\Models\KKN\Mahasiswa;
use App\Models\User;
use App\Models\WebhookEvent;
use App\Services\MasterApi\SiakadRecordFilter;
use App\Services\StudentSyncService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Password;

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
        // H-009 fix: webhook_id is now REQUIRED (was nullable). It's used to
        // suppress duplicate deliveries within the retention window below.
        $validated = $request->validate([
            'event' => ['required', 'string', 'in:'.implode(',', self::ALLOWED_EVENTS)],
            'webhook_id' => ['required', 'string', 'max:100'],
            'data' => ['required', 'array'],
            'data.payload' => ['required', 'array'],
        ]);

        $event = $validated['event'];
        $data = $validated['data']['payload'];
        $webhookId = $validated['webhook_id'];

        // R-004 fix: DB-backed state machine idempotency.
        // Replaces Cache::add which couldn't distinguish "retry-during-processing"
        // from "retry-after-completion".
        $existing = WebhookEvent::where('webhook_id', $webhookId)->first();

        if (! $existing) {
            try {
                $record = WebhookEvent::create([
                    'webhook_id' => $webhookId,
                    'event' => $event,
                    'state' => WebhookEvent::STATE_PROCESSING,
                ]);
            } catch (UniqueConstraintViolationException $e) {
                // R-010 fix: concurrent delivery raced us to the insert. Treat
                // it as an existing row so we emit the correct 200/503 response
                // instead of bubbling a 500.
                $existing = WebhookEvent::where('webhook_id', $webhookId)->first();
                if (! $existing) {
                    throw $e;
                }
            }
        }

        if ($existing) {
            if ($existing->state === WebhookEvent::STATE_DONE) {
                Log::info('Webhook duplicate ignored (already processed)', [
                    'webhook_id' => $webhookId, 'event' => $event,
                ]);

                return response()->json(['status' => 'duplicate_ignored', 'webhook_id' => $webhookId]);
            }

            if ($existing->state === WebhookEvent::STATE_PROCESSING && ! $existing->isStale()) {
                // Fresh processing row — another worker is actively handling
                // this delivery. Tell SIAKAD to retry after a delay.
                Log::info('Webhook retry arrived mid-processing', [
                    'webhook_id' => $webhookId, 'event' => $event,
                ]);

                return response()
                    ->json(['status' => 'processing', 'webhook_id' => $webhookId], 503)
                    ->header('Retry-After', '30');
            }

            // Either state='failed' or state='processing' but stale (worker died).
            // Fall through and re-attempt by flipping state back to processing.
            $existing->update([
                'state' => WebhookEvent::STATE_PROCESSING,
                'retry_count' => ($existing->retry_count ?? 0) + 1,
                'error_message' => null,
            ]);
            $record = $existing;
        }

        Log::info("Webhook received for event: {$event}", ['webhook_id' => $webhookId]);

        try {
            if (str_starts_with($event, 'mahasiswa.')) {
                $this->syncMahasiswa($event, $data);
            } elseif (str_starts_with($event, 'dosen.')) {
                $this->syncDosen($event, $data);
            }

            $record->update([
                'state' => WebhookEvent::STATE_DONE,
                'processed_at' => now(),
            ]);

            return response()->json(['status' => 'processed']);
        } catch (\Exception $e) {
            // Record the failure so ops can see it AND the next delivery can
            // re-attempt (state flips to 'failed' → picked up on next retry).
            $record->update([
                'state' => WebhookEvent::STATE_FAILED,
                'error_message' => substr($e->getMessage(), 0, 1000),
            ]);

            Log::error("Webhook processing failed for {$event}", [
                'webhook_id' => $webhookId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'payload' => $data,
            ]);

            return response()->json(['status' => 'error', 'message' => 'Processing failed'], 500);
        }
    }

    protected function syncMahasiswa(string $event, array $data): void
    {
        if (empty($data['nim'])) {
            return;
        }

        if (str_ends_with($event, '.deleted')) {
            $mahasiswa = Mahasiswa::whereBlind('nim', (string) $data['nim'])->first();
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
            $dosen = Dosen::whereBlind('nip', (string) $data['nip'])->first();
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

        // Pre-DB filter (config/siakad_filters.php) — delete events still go
        // through so we can deactivate rows that later become ineligible.
        $decision = app(SiakadRecordFilter::class)->shouldSyncLecturer($data);
        if ($decision['action'] !== SiakadRecordFilter::SYNC) {
            Log::info('SIAKAD dosen webhook filtered out', [
                'nip' => $data['nip'],
                'reason' => $decision['reason'],
                'detail' => $decision['details'],
            ]);

            return;
        }

        DB::transaction(function () use ($data) {
            $nip = $data['nip'];
            $facultyId = null;
            $organizationMasterId = $this->normalizeMasterId($data['organization_id'] ?? $data['fakultas_id'] ?? null);
            if ($organizationMasterId !== null) {
                $facultyId = Fakultas::where('master_id', $organizationMasterId)->first()?->id;
            }

            // Load the existing dosen (if any) so we can respect field-locks
            // that the admin / dosen has set manually. Locked fields MUST NOT
            // be overwritten by the SIAKAD payload.
            $existingDosen = Dosen::whereBlind('nip', (string) $nip)->first();

            $username = (string) $nip;
            $incomingEmail = $this->normalizeMasterEmail($data['email'] ?? null);

            $user = User::firstOrNew(['username' => $username]);
            $isNewUser = ! $user->exists;

            if ($isNewUser) {
                $user->email = ! empty($incomingEmail) ? $incomingEmail : null;
                // C-002 fix: random unguessable default. The user NEVER logs in
                // with this password — they receive a reset link on their
                // SIAKAD email (below) and set their own password.
                $user->password = Hash::make(PasswordHelper::generateSecureDefault());
                $user->must_change_password = true;
            } elseif (empty($user->email) && ! empty($incomingEmail)) {
                $user->email = $incomingEmail;
            }

            // User::name may be locked (admin/user corrected a SIAKAD typo).
            $userUpdates = ['username' => $username, 'name' => $data['nama'] ?? $data['name'] ?? 'Unknown'];
            if (! $isNewUser) {
                $userUpdates = $user->filterLockedFields($userUpdates);
            }
            foreach ($userUpdates as $field => $value) {
                $user->{$field} = $value;
            }
            // Username is the stable identity key — always persist even when
            // name was filtered out above.
            if (! isset($userUpdates['username'])) {
                $user->username = $username;
            }
            $user->save();

            if (! $user->hasRole('dosen')) {
                $user->assignRole('dosen');
            }

            $dosenUpdates = [
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
            ];

            // Respect per-dosen field locks on EXISTING records.
            if ($existingDosen) {
                $dosenUpdates = $existingDosen->filterLockedFields($dosenUpdates);
            }

            Dosen::updateOrCreate(
                ['nip' => $nip],
                $dosenUpdates
            );

            if ($user && ! $user->is_active) {
                $user->update(['is_active' => true]);
            }

            // R-001 fix (audit): Dispatch the password-reset link AFTER the
            // transaction commits. If we fired it inside the transaction and
            // the transaction rolled back, we'd email a ghost user; also, the
            // notification would queue from within the transaction and run
            // against not-yet-committed rows on DB-queue drivers.
            if ($isNewUser) {
                if (! empty($user->email)) {
                    $userEmail = $user->email;
                    DB::afterCommit(function () use ($userEmail, $nip) {
                        try {
                            Password::sendResetLink(['email' => $userEmail]);
                            Log::info('Dosen password-reset link dispatched', ['nip' => $nip, 'email' => $userEmail]);
                        } catch (\Throwable $e) {
                            Log::warning('Failed to send initial reset link for new dosen', [
                                'nip' => $nip, 'error' => $e->getMessage(),
                            ]);
                        }
                    });
                } else {
                    Log::warning('New dosen has no email; manual password provisioning required', ['nip' => $nip]);
                }
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

    private function normalizeMasterEmail(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $email = trim((string) $value);
        if ($email === '' || str_ends_with(strtolower($email), '@kkn.local')) {
            return null;
        }

        return filter_var($email, FILTER_VALIDATE_EMAIL) ? $email : null;
    }
}
