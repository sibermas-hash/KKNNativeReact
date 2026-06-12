<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\GroupLeaderVote;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class GroupLeaderVoteController extends Controller
{
    use ApiResponse;

    public function show(Request $request): JsonResponse
    {
        $participant = $this->currentParticipant($request);
        if (! $participant) {
            return $this->error('NO_LIVE_GROUP', 'Anda belum memiliki kelompok live untuk voting ketua.', 422);
        }

        $this->electIfWindowClosed($participant->kelompok_id);

        return $this->success($this->payload($participant->fresh(['kelompok', 'mahasiswa'])));
    }

    public function vote(Request $request): JsonResponse
    {
        $data = $request->validate([
            'candidate_peserta_id' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        $participant = $this->currentParticipant($request);
        if (! $participant) {
            return $this->error('NO_LIVE_GROUP', 'Anda belum memiliki kelompok live untuk voting ketua.', 422);
        }

        $window = $this->window($participant);
        if (! $window['open']) {
            return $this->error('VOTING_CLOSED', 'Voting ketua kelompok sudah ditutup.', 422);
        }

        $candidate = PesertaKkn::withoutGlobalScope('isolasi_periode')
            ->whereKey((int) $data['candidate_peserta_id'])
            ->where('kelompok_id', $participant->kelompok_id)
            ->where('status', 'approved')
            ->where('placement_is_live', true)
            ->first();

        if (! $candidate) {
            return $this->error('INVALID_CANDIDATE', 'Kandidat harus anggota kelompok live Anda.', 422);
        }

        GroupLeaderVote::query()->updateOrCreate(
            ['kelompok_id' => $participant->kelompok_id, 'voter_peserta_id' => $participant->id],
            ['candidate_peserta_id' => $candidate->id, 'voted_at' => now()]
        );

        return $this->success($this->payload($participant->fresh(['kelompok', 'mahasiswa'])), 'Suara ketua kelompok tersimpan. Anda masih bisa mengubah pilihan selama voting aktif.');
    }

    private function currentParticipant(Request $request): ?PesertaKkn
    {
        $mahasiswaId = $request->user()?->mahasiswa?->id;
        if (! $mahasiswaId) {
            return null;
        }

        return PesertaKkn::withoutGlobalScope('isolasi_periode')
            ->with(['kelompok', 'mahasiswa'])
            ->where('mahasiswa_id', $mahasiswaId)
            ->where('status', 'approved')
            ->whereNotNull('kelompok_id')
            ->where('placement_is_live', true)
            ->latest('placement_published_at')
            ->latest('updated_at')
            ->first();
    }

    private function payload(PesertaKkn $participant): array
    {
        $members = PesertaKkn::withoutGlobalScope('isolasi_periode')
            ->with('mahasiswa:id,nim,nama')
            ->where('kelompok_id', $participant->kelompok_id)
            ->where('status', 'approved')
            ->where('placement_is_live', true)
            ->orderBy('id')
            ->get();

        $votes = GroupLeaderVote::query()
            ->where('kelompok_id', $participant->kelompok_id)
            ->select('candidate_peserta_id', DB::raw('COUNT(*) as total'))
            ->groupBy('candidate_peserta_id')
            ->pluck('total', 'candidate_peserta_id')
            ->map(fn ($v) => (int) $v)
            ->all();

        $myVote = GroupLeaderVote::query()
            ->where('kelompok_id', $participant->kelompok_id)
            ->where('voter_peserta_id', $participant->id)
            ->value('candidate_peserta_id');

        $leader = $members->first(fn (PesertaKkn $p) => strtolower((string) $p->role) === 'ketua');
        $window = $this->window($participant);

        return [
            'kelompok_id' => $participant->kelompok_id,
            'voting' => $window,
            'my_vote' => $myVote ? (int) $myVote : null,
            'leader' => $leader ? $this->memberPayload($leader, $votes) : null,
            'candidates' => $members->map(fn (PesertaKkn $p) => $this->memberPayload($p, $votes))->values()->all(),
        ];
    }

    private function memberPayload(PesertaKkn $p, array $votes): array
    {
        return [
            'peserta_id' => $p->id,
            'mahasiswa_id' => $p->mahasiswa_id,
            'nim' => $p->mahasiswa?->nim,
            'nama' => $p->mahasiswa?->nama,
            'role' => $p->role,
            'votes' => $votes[$p->id] ?? 0,
        ];
    }

    private function window(PesertaKkn $participant): array
    {
        $starts = $participant->placement_published_at ?? $participant->joined_group_at ?? $participant->updated_at;
        $ends = $starts ? $starts->copy()->addDays(7) : now()->subSecond();
        $open = now()->betweenIncluded($starts, $ends) && strtolower((string) $participant->role) !== 'ketua';

        return [
            'starts_at' => $starts?->toIso8601String(),
            'ends_at' => $ends->toIso8601String(),
            'open' => $open,
        ];
    }

    private function electIfWindowClosed(int $kelompokId): void
    {
        $members = PesertaKkn::withoutGlobalScope('isolasi_periode')
            ->where('kelompok_id', $kelompokId)
            ->where('status', 'approved')
            ->where('placement_is_live', true)
            ->get();

        if ($members->contains(fn (PesertaKkn $p) => strtolower((string) $p->role) === 'ketua')) {
            return;
        }

        $first = $members->first();
        if (! $first) {
            return;
        }

        $window = $this->window($first);
        if ($window['open']) {
            return;
        }

        $top = GroupLeaderVote::query()
            ->where('kelompok_id', $kelompokId)
            ->select('candidate_peserta_id', DB::raw('COUNT(*) as total'))
            ->groupBy('candidate_peserta_id')
            ->orderByDesc('total')
            ->get();

        if ($top->isEmpty()) {
            return;
        }

        $max = (int) $top->first()->total;
        $winners = $top->filter(fn ($row) => (int) $row->total === $max)->pluck('candidate_peserta_id')->all();
        if (count($winners) !== 1) {
            return; // seri: admin/DPL tentukan manual.
        }

        DB::transaction(function () use ($kelompokId, $winners) {
            PesertaKkn::withoutGlobalScope('isolasi_periode')
                ->where('kelompok_id', $kelompokId)
                ->where('role', 'Ketua')
                ->update(['role' => 'Anggota']);
            PesertaKkn::withoutGlobalScope('isolasi_periode')
                ->whereKey((int) $winners[0])
                ->update(['role' => 'Ketua']);
        });
    }
}
