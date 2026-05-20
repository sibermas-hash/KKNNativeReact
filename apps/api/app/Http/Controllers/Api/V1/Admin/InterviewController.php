<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\InterviewSchedule;
use App\Models\KKN\Periode;
use App\Services\KKN\InterviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InterviewController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = InterviewSchedule::query()
            ->with(['periode.jenisKkn', 'createdBy:id,name,email', 'participants.pesertaKkn.mahasiswa.fakultas', 'participants.pesertaKkn.mahasiswa.prodi'])
            ->withCount('participants')
            ->latest('interview_date');

        if ($request->filled('periode_id')) {
            $query->where('periode_id', $request->integer('periode_id'));
        }

        return $this->success($query->paginate((int) $request->input('per_page', 15)));
    }

    public function show(InterviewSchedule $interview): JsonResponse
    {
        return $this->success($interview->load([
            'periode.jenisKkn',
            'createdBy:id,name,email',
            'participants.pesertaKkn.mahasiswa.fakultas',
            'participants.pesertaKkn.mahasiswa.prodi',
            'participants.processedBy:id,name,email',
        ]));
    }

    public function store(Request $request, InterviewService $service): JsonResponse
    {
        $data = $request->validate([
            'periode_id' => ['required', 'integer', 'exists:periode,id'],
            'interview_date' => ['required', 'date'],
            'interview_time_start' => ['required', 'date_format:H:i'],
            'interview_time_end' => ['required', 'date_format:H:i', 'after:interview_time_start'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $periode = Periode::with('jenisKkn')->findOrFail($data['periode_id']);
        $code = $periode->jenisKkn?->code;

        if (! in_array($code, ['NUSANTARA', 'INTERNASIONAL', 'KOLABORASI_PTKIN'], true)) {
            return $this->error('VALIDATION_ERROR', 'Jadwal wawancara hanya untuk KKN Nusantara, Internasional, dan Kolaborasi PTKIN.', 422);
        }

        $schedule = $service->scheduleForPeriode($periode, $data, (int) auth()->id());

        return $this->success($schedule, 'Jadwal wawancara dibuat dan peserta lulus administrasi dijadwalkan.', 201);
    }

    public function targets(InterviewService $service): JsonResponse
    {
        return $this->success($service->fallbackPeriodes());
    }

    public function pass(Request $request, int $participantId, InterviewService $service): JsonResponse
    {
        $participant = \App\Models\KKN\InterviewParticipant::with('pesertaKkn')->findOrFail($participantId);
        $data = $request->validate(['notes' => ['nullable', 'string', 'max:2000']]);
        $service->pass($participant->pesertaKkn, (int) auth()->id(), $data['notes'] ?? null);
        return $this->success($participant->refresh()->load('pesertaKkn.mahasiswa'), 'Peserta dinyatakan lulus wawancara.');
    }

    public function transfer(Request $request, int $participantId, InterviewService $service): JsonResponse
    {
        $participant = \App\Models\KKN\InterviewParticipant::with('pesertaKkn')->findOrFail($participantId);
        $data = $request->validate([
            'target_periode_id' => ['required', 'integer', 'exists:periode,id'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);
        $result = $service->fail($participant->pesertaKkn, (int) auth()->id(), $data['notes'] ?? null, (int) $data['target_periode_id']);
        return $this->success($result, 'Peserta dialihkan ke KKN tanpa wawancara dan disetujui.');
    }

    public function update(Request $request, InterviewSchedule $interview): JsonResponse
    {
        $data = $request->validate([
            'interview_date' => ['sometimes', 'required', 'date'],
            'interview_time_start' => ['sometimes', 'required', 'date_format:H:i'],
            'interview_time_end' => ['sometimes', 'required', 'date_format:H:i'],
            'location' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $interview->update($data);

        return $this->success($interview->refresh()->load(['periode.jenisKkn']), 'Jadwal wawancara diperbarui.');
    }

    public function sync(InterviewSchedule $interview, InterviewService $service): JsonResponse
    {
        $count = $service->syncParticipants($interview);

        return $this->success(
            $interview->refresh()->load(['periode.jenisKkn', 'participants.pesertaKkn.mahasiswa']),
            "Sinkronisasi selesai. {$count} peserta approved ditambahkan ke jadwal wawancara."
        );
    }
    public function destroy(InterviewSchedule $interview): JsonResponse
    {
        $interview->delete();

        return $this->success(null, 'Jadwal wawancara dihapus.');
    }
}
