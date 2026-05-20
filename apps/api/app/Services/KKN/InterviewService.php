<?php

namespace App\Services\KKN;

use App\Models\KKN\InterviewParticipant;
use App\Models\KKN\InterviewSchedule;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\Periode;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InterviewService
{
    private const SELECTIVE_CODES = ['NUSANTARA', 'INTERNASIONAL', 'KOLABORASI_PTKIN'];

    public function isSelectiveRegistration(PesertaKkn $peserta): bool
    {
        $code = $peserta->periode?->jenisKkn?->code;
        return in_array($code, self::SELECTIVE_CODES, true);
    }

    public function scheduleForPeriode(Periode $periode, array $data, int $createdBy): InterviewSchedule
    {
        return DB::transaction(function () use ($periode, $data, $createdBy) {
            $schedule = InterviewSchedule::create([
                'periode_id' => $periode->id,
                'interview_date' => $data['interview_date'],
                'interview_time_start' => $data['interview_time_start'],
                'interview_time_end' => $data['interview_time_end'],
                'location' => $data['location'] ?? null,
                'notes' => $data['notes'] ?? null,
                'created_by' => $createdBy,
            ]);

            $participants = PesertaKkn::query()
                ->where('periode_id', $periode->id)
                ->where('status', 'approved')
                ->pluck('id');

            foreach ($participants as $pesertaId) {
                InterviewParticipant::firstOrCreate([
                    'interview_schedule_id' => $schedule->id,
                    'peserta_kkn_id' => $pesertaId,
                ]);
            }

            PesertaKkn::query()
                ->whereIn('id', $participants)
                ->update(['status' => 'interview_scheduled']);

            return $schedule->load(['periode.jenisKkn', 'participants.pesertaKkn.mahasiswa']);
        });
    }

    public function syncParticipants(InterviewSchedule $schedule): int
    {
        return DB::transaction(function () use ($schedule) {
            $peserta = PesertaKkn::query()
                ->where('periode_id', $schedule->periode_id)
                ->where('status', 'approved')
                ->get();

            foreach ($peserta as $item) {
                InterviewParticipant::firstOrCreate(
                    [
                        'interview_schedule_id' => $schedule->id,
                        'peserta_kkn_id' => $item->id,
                    ],
                    ['result' => 'pending']
                );
            }

            PesertaKkn::whereIn('id', $peserta->pluck('id'))->update(['status' => 'interview_scheduled']);

            return $peserta->count();
        });
    }
    public function pass(PesertaKkn $peserta, int $processedBy, ?string $notes = null): void
    {
        DB::transaction(function () use ($peserta, $processedBy, $notes) {
            $participant = $this->participantFor($peserta);
            $participant->update([
                'result' => 'passed',
                'notes' => $notes,
                'processed_by' => $processedBy,
                'processed_at' => now(),
            ]);

            $peserta->update(['status' => 'approved']);
        });
    }

    public function fail(PesertaKkn $peserta, int $processedBy, ?string $notes = null): array
    {
        return DB::transaction(function () use ($peserta, $processedBy, $notes) {
            $participant = $this->participantFor($peserta);
            $participant->update([
                'result' => 'failed',
                'notes' => $notes,
                'processed_by' => $processedBy,
                'processed_at' => now(),
            ]);

            $target = $this->bestFallbackPeriode();
            $fromPeriodeId = $peserta->periode_id;

            $peserta->update([
                'status' => 'pending',
                'periode_id' => $target->id,
                'kelompok_id' => null,
                'notes' => trim(($peserta->notes ? $peserta->notes."\n" : '').'Dipindah otomatis karena gagal wawancara. Menunggu konfirmasi mahasiswa.'),
            ]);

            DB::table('registration_histories')->insert([
                'peserta_kkn_id' => $peserta->id,
                'from_periode_id' => $fromPeriodeId,
                'to_periode_id' => $target->id,
                'reason' => 'Gagal wawancara; dipindah ke KKN dengan sisa kuota terbanyak, menunggu konfirmasi mahasiswa.',
                'processed_by' => $processedBy,
                'processed_at' => now(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            return ['target_periode' => $target->load('jenisKkn')];
        });
    }

    private function participantFor(PesertaKkn $peserta): InterviewParticipant
    {
        $participant = InterviewParticipant::query()
            ->where('peserta_kkn_id', $peserta->id)
            ->latest('id')
            ->first();

        if (! $participant) {
            throw ValidationException::withMessages([
                'interview' => 'Peserta belum memiliki jadwal wawancara.',
            ]);
        }

        return $participant;
    }

    private function bestFallbackPeriode(): Periode
    {
        $periode = Periode::query()
            ->select('periode.*')
            ->join('jenis_kkn', 'jenis_kkn.id', '=', 'periode.jenis_kkn_id')
            ->leftJoin('peserta_kkn', function ($join) {
                $join->on('peserta_kkn.periode_id', '=', 'periode.id')
                    ->whereNull('peserta_kkn.deleted_at')
                    ->where('peserta_kkn.status', '!=', 'cancelled');
            })
            ->where('periode.is_active', true)
            ->whereNotIn('jenis_kkn.code', self::SELECTIVE_CODES)
            ->whereNotNull('periode.kuota')
            ->groupBy('periode.id')
            ->orderByRaw('(periode.kuota - COUNT(peserta_kkn.id)) DESC')
            ->first();

        if (! $periode) {
            throw ValidationException::withMessages([
                'periode' => 'Tidak ada periode KKN alternatif yang tersedia.',
            ]);
        }

        return $periode;
    }
}
