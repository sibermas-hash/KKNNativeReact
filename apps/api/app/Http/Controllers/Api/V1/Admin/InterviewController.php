<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exports\InterviewResultExport;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\InterviewParticipant;
use App\Models\KKN\InterviewSchedule;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Notifications\KKN\InterviewResultNotification;
use App\Notifications\KKN\InterviewScheduledNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Maatwebsite\Excel\Facades\Excel;

class InterviewController extends Controller
{
    use ApiResponse;

    private function facultyScopeId(): ?int
    {
        $user = auth()->user();

        return $user?->hasRole('faculty_admin') && $user->fakultas_id
            ? (int) $user->fakultas_id
            : null;
    }

    private function scopePesertaByFaculty($query): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    private function ensureParticipantInFacultyScope(InterviewParticipant $participant): void
    {
        if ($facultyId = $this->facultyScopeId()) {
            $participant->loadMissing('pesertaKkn.mahasiswa');
            abort_unless($participant->pesertaKkn?->mahasiswa?->fakultas_id === $facultyId, 403, 'Anda tidak memiliki akses ke peserta ini.');
        }
    }

    /**
     * List interview schedules with participant counts.
     */
    public function index(Request $request): JsonResponse
    {
        $query = InterviewSchedule::with(['periode.jenisKkn', 'creator'])
            ->withCount(['participants', 'participants as pending_count' => fn ($q) => $q->where('result', 'pending'), 'participants as passed_count' => fn ($q) => $q->where('result', 'passed'), 'participants as failed_count' => fn ($q) => $q->where('result', 'failed')])
            ->when($request->input('periode_id'), fn ($q, $v) => $q->where('periode_id', $v))
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->orderByDesc('interview_date')
            ->orderBy('interview_time_start');

        $paginated = $query->paginate($request->integer('per_page', 20));

        return $this->success([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * Create a new interview schedule.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_id' => ['required', 'exists:periode,id'],
            'interview_date' => ['required', 'date', 'after_or_equal:today'],
            'interview_time_start' => ['required', 'date_format:H:i'],
            'interview_time_end' => ['required', 'date_format:H:i', 'after:interview_time_start'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $schedule = InterviewSchedule::create([
            ...$validated,
            'created_by' => auth()->id(),
        ]);

        $schedule->load(['periode.jenisKkn', 'creator']);

        return $this->success($schedule, 'Jadwal wawancara berhasil dibuat.', 201);
    }

    /**
     * Show schedule detail with participants.
     */
    public function show(InterviewSchedule $interview): JsonResponse
    {
        $interview->load([
            'periode.jenisKkn',
            'creator',
            'participants.pesertaKkn.mahasiswa.prodi',
            'participants.pesertaKkn.mahasiswa.fakultas',
            'participants.processedBy',
        ]);

        return $this->success($interview);
    }

    /**
     * Update schedule.
     */
    public function update(Request $request, InterviewSchedule $interview): JsonResponse
    {
        $validated = $request->validate([
            'interview_date' => ['sometimes', 'date'],
            'interview_time_start' => ['sometimes', 'date_format:H:i'],
            'interview_time_end' => ['sometimes', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $interview->update($validated);
        $interview->load(['periode.jenisKkn', 'creator']);

        return $this->success($interview, 'Jadwal wawancara diperbarui.');
    }

    /**
     * Delete schedule (cascade deletes participants).
     */
    public function destroy(InterviewSchedule $interview): JsonResponse
    {
        $interview->delete();

        return $this->success(null, 'Jadwal wawancara dihapus.');
    }

    /**
     * Assign peserta KKN to interview schedule.
     */
    public function assignParticipants(Request $request, InterviewSchedule $interview): JsonResponse
    {
        $validated = $request->validate([
            'peserta_kkn_ids' => ['required', 'array', 'min:1'],
            'peserta_kkn_ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        $assigned = 0;
        $skipped = 0;

        foreach ($validated['peserta_kkn_ids'] as $pesertaId) {
            $peserta = PesertaKkn::with('mahasiswa.user')
                ->where('id', $pesertaId)
                ->where('periode_id', $interview->periode_id)
                ->whereIn('status', ['approved', 'document_verified']);

            $this->scopePesertaByFaculty($peserta);

            $peserta = $peserta->first();

            if (! $peserta) {
                $skipped++;

                continue;
            }

            $exists = InterviewParticipant::whereHas('schedule', fn ($q) => $q->where('periode_id', $interview->periode_id))
                ->where('peserta_kkn_id', $pesertaId)
                ->exists();

            if ($exists) {
                $skipped++;

                continue;
            }

            InterviewParticipant::create([
                'interview_schedule_id' => $interview->id,
                'peserta_kkn_id' => $pesertaId,
                'result' => 'pending',
            ]);

            $peserta->update(['status' => 'interview_scheduled']);

            if ($peserta?->mahasiswa?->user) {
                $peserta->mahasiswa->user->notify(new InterviewScheduledNotification($interview));
            }

            $assigned++;
        }

        return $this->success(
            ['assigned' => $assigned, 'skipped' => $skipped],
            "{$assigned} peserta ditambahkan ke jadwal wawancara."
        );
    }

    /**
     * Remove participant from schedule.
     */
    public function removeParticipant(InterviewSchedule $interview, InterviewParticipant $participant): JsonResponse
    {
        if ($participant->interview_schedule_id !== $interview->id) {
            return $this->error('Peserta tidak ditemukan di jadwal ini.', 404);
        }

        $this->ensureParticipantInFacultyScope($participant);

        // Revert status if still interview_scheduled
        PesertaKkn::where('id', $participant->peserta_kkn_id)
            ->where('status', 'interview_scheduled')
            ->update(['status' => 'approved']);

        $participant->delete();

        return $this->success(null, 'Peserta dihapus dari jadwal wawancara.');
    }

    /**
     * Record interview result for a participant.
     */
    public function recordResult(Request $request, InterviewSchedule $interview, InterviewParticipant $participant): JsonResponse
    {
        if ($participant->interview_schedule_id !== $interview->id) {
            return $this->error('Peserta tidak ditemukan di jadwal ini.', 404);
        }

        $this->ensureParticipantInFacultyScope($participant);

        $validated = $request->validate([
            'result' => ['required', Rule::in(['passed', 'failed'])],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $participant->update([
            'result' => $validated['result'],
            'notes' => $validated['notes'] ?? $participant->notes,
            'processed_by' => auth()->id(),
            'processed_at' => now(),
        ]);

        // Auto-update peserta KKN status based on result
        $newStatus = $validated['result'] === 'passed' ? 'interview_passed' : 'interview_failed';
        PesertaKkn::where('id', $participant->peserta_kkn_id)
            ->whereIn('status', ['interview_scheduled', 'approved', 'document_verified'])
            ->update(['status' => $newStatus]);

        // If failed: auto-transfer to KKN Reguler (no re-registration needed)
        if ($validated['result'] === 'failed') {
            $regulerPeriode = Periode::whereHas('jenisKkn', fn ($q) => $q->where('requires_interview', false))
                ->where('periode', $interview->periode?->periode ?? 58)
                ->whereHas('jenisKkn', fn ($q) => $q->where('name', 'ilike', '%reguler%'))
                ->first();

            if ($regulerPeriode) {
                PesertaKkn::where('id', $participant->peserta_kkn_id)
                    ->update([
                        'periode_id' => $regulerPeriode->id,
                        'status' => 'approved',
                        'kelompok_id' => null,
                    ]);
            }
        }

        // Notify student of result
        $peserta = PesertaKkn::with('mahasiswa.user')->find($participant->peserta_kkn_id);
        if ($peserta?->mahasiswa?->user) {
            $peserta->mahasiswa->user->notify(new InterviewResultNotification($participant->fresh()));
        }

        return $this->success($participant->fresh()->load(['pesertaKkn.mahasiswa', 'processedBy']), 'Hasil wawancara disimpan.');
    }

    /**
     * Bulk record results.
     */
    public function bulkRecordResult(Request $request, InterviewSchedule $interview): JsonResponse
    {
        $validated = $request->validate([
            'results' => ['required', 'array', 'min:1'],
            'results.*.participant_id' => ['required', 'integer', 'exists:interview_participants,id'],
            'results.*.result' => ['required', Rule::in(['passed', 'failed'])],
            'results.*.notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $processed = 0;

        DB::transaction(function () use ($validated, $interview, &$processed) {
            foreach ($validated['results'] as $item) {
                $participant = InterviewParticipant::where('id', $item['participant_id'])
                    ->where('interview_schedule_id', $interview->id)
                    ->first();

                if (! $participant) {
                    continue;
                }

                if ($this->facultyScopeId()) {
                    $participant->loadMissing('pesertaKkn.mahasiswa');
                    if ($participant->pesertaKkn?->mahasiswa?->fakultas_id !== $this->facultyScopeId()) {
                        continue;
                    }
                }

                $participant->update([
                    'result' => $item['result'],
                    'notes' => $item['notes'] ?? $participant->notes,
                    'processed_by' => auth()->id(),
                    'processed_at' => now(),
                ]);

                // Auto-update peserta status
                $newStatus = $item['result'] === 'passed' ? 'interview_passed' : 'interview_failed';
                PesertaKkn::where('id', $participant->peserta_kkn_id)
                    ->whereIn('status', ['interview_scheduled', 'approved', 'document_verified'])
                    ->update(['status' => $newStatus]);

                // If failed: auto-transfer to KKN Reguler
                if ($item['result'] === 'failed') {
                    $regulerPeriode = Periode::whereHas('jenisKkn', fn ($q) => $q->where('requires_interview', false))
                        ->where('periode', $interview->periode?->periode ?? 58)
                        ->whereHas('jenisKkn', fn ($q) => $q->where('name', 'ilike', '%reguler%'))
                        ->first();

                    if ($regulerPeriode) {
                        PesertaKkn::where('id', $participant->peserta_kkn_id)
                            ->update([
                                'periode_id' => $regulerPeriode->id,
                                'status' => 'approved',
                                'kelompok_id' => null,
                            ]);
                    }
                }

                // Notify student
                $peserta = PesertaKkn::with('mahasiswa.user')->find($participant->peserta_kkn_id);
                if ($peserta?->mahasiswa?->user) {
                    $peserta->mahasiswa->user->notify(new InterviewResultNotification($participant->fresh()));
                }

                $processed++;
            }
        });

        return $this->success(['processed' => $processed], "{$processed} hasil wawancara disimpan.");
    }

    /**
     * Get available peserta for assignment (approved/document_verified, not yet assigned to any interview in same periode).
     */
    public function availablePeserta(Request $request, InterviewSchedule $interview): JsonResponse
    {
        $alreadyAssigned = InterviewParticipant::whereHas('schedule', fn ($q) => $q->where('periode_id', $interview->periode_id))
            ->pluck('peserta_kkn_id');

        $query = PesertaKkn::with(['mahasiswa.prodi', 'mahasiswa.fakultas'])
            ->where('periode_id', $interview->periode_id)
            ->whereIn('status', ['approved', 'document_verified'])
            ->whereNotIn('id', $alreadyAssigned)
            ->when($request->input('search'), function ($q, $search) {
                $term = trim((string) $search);
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $term);
                $q->whereHas('mahasiswa', function ($m) use ($term, $escaped) {
                    $m->where('nama', 'ilike', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', $term)) {
                        $m->orWhere('nim_bidx', Mahasiswa::computeBlindIndex($term));
                    }
                });
            });

        $this->scopePesertaByFaculty($query);

        $paginated = $query->paginate($request->integer('per_page', 50));

        return $this->success([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
        ]);
    }

    /**
     * List all peserta with status interview_scheduled (waiting for interview).
     */
    public function pesertaWawancara(Request $request): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.prodi', 'mahasiswa.fakultas', 'periode.jenisKkn'])
            ->where('status', 'interview_scheduled')
            ->when($request->input('angkatan'), fn ($q, $a) => $q->whereHas('periode', fn ($p) => $p->where('periode', $a)))
            ->when($request->input('search'), function ($q, $search) {
                $term = trim((string) $search);
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $term);
                $q->whereHas('mahasiswa', function ($m) use ($term, $escaped) {
                    $m->where('nama', 'ilike', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', $term)) {
                        $m->orWhere('nim_bidx', Mahasiswa::computeBlindIndex($term));
                    }
                });
            })
            ->orderBy('id');

        $this->scopePesertaByFaculty($query);

        $perPage = $request->integer('per_page', 100);

        return $this->success(['data' => $query->paginate($perPage)->items()]);
    }

    /**
     * Export interview results to XLSX.
     */
    public function export(Request $request)
    {
        $scheduleId = $request->input('schedule_id') ? (int) $request->input('schedule_id') : null;
        $periodeId = $request->input('periode_id') ? (int) $request->input('periode_id') : null;

        $filename = 'hasil-wawancara-'.now()->format('Y-m-d').'.xlsx';

        return Excel::download(new InterviewResultExport($scheduleId, $periodeId), $filename);
    }
}
