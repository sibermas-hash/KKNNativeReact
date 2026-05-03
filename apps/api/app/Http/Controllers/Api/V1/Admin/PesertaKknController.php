<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PesertaKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PesertaKknController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok', 'periode'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('search'), fn ($q, $s) => $q->whereHas('mahasiswa', fn ($q2) => $q2->where('nama', 'like', "%{$s}%")->orWhere('nim', 'like', "%{$s}%")))
            ->orderByDesc('created_at');
        return $this->successCollection(PesertaKknResource::collection($query->paginate(min((int) $request->input('per_page', 25), 100))));
    }

    public function show(PesertaKkn $pesertaKkn): JsonResponse
    {
        $pesertaKkn->load(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok.lokasi', 'periode', 'dokumen']);
        return $this->success(new PesertaKknResource($pesertaKkn));
    }

    public function approve(PesertaKkn $pesertaKkn): JsonResponse
    {
        $pesertaKkn->update(['status' => 'approved', 'approved_at' => now(), 'approved_by' => auth()->id()]);
        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Pendaftaran disetujui.');
    }

    public function reject(Request $request, PesertaKkn $pesertaKkn): JsonResponse
    {
        $request->validate(['rejection_reason' => ['required', 'string', 'max:500']]);
        $pesertaKkn->update(['status' => 'rejected', 'last_rejected_at' => now(), 'last_rejected_by' => auth()->id(), 'rejection_reason' => $request->input('rejection_reason')]);
        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Pendaftaran ditolak.');
    }

    public function assignGroup(Request $request, PesertaKkn $pesertaKkn): JsonResponse
    {
        $request->validate(['kelompok_id' => ['required', 'exists:kelompok_kkn,id']]);
        $pesertaKkn->update(['kelompok_id' => $request->input('kelompok_id'), 'joined_group_at' => now()]);
        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Peserta berhasil ditugaskan ke kelompok.');
    }

    public function makeLeader(PesertaKkn $pesertaKkn): JsonResponse
    {
        $pesertaKkn->update(['role' => 'Ketua']);
        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Peserta dijadikan ketua.');
    }

    public function makeKorcam(PesertaKkn $pesertaKkn): JsonResponse
    {
        $pesertaKkn->update(['role' => 'Korcam']);
        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Peserta dijadikan korcam.');
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']]);
        $count = PesertaKkn::whereIn('id', $request->input('ids'))->where('status', 'pending')->update(['status' => 'approved', 'approved_at' => now(), 'approved_by' => auth()->id()]);
        return $this->success(['approved_count' => $count], "{$count} pendaftaran berhasil disetujui.");
    }

    public function bulkReject(Request $request): JsonResponse
    {
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer'], 'rejection_reason' => ['required', 'string', 'max:500']]);
        $count = PesertaKkn::whereIn('id', $request->input('ids'))->where('status', 'pending')->update(['status' => 'rejected', 'last_rejected_at' => now(), 'last_rejected_by' => auth()->id(), 'rejection_reason' => $request->input('rejection_reason')]);
        return $this->success(['rejected_count' => $count], "{$count} pendaftaran ditolak.");
    }

    public function export(): JsonResponse
    {
        $data = [];
        PesertaKkn::with(['mahasiswa.user', 'kelompok', 'periode'])
            ->orderByDesc('created_at')
            ->limit(5000)
            ->chunk(500, function ($chunk) use (&$data) {
                foreach ($chunk as $item) {
                    $data[] = (new PesertaKknResource($item))->resolve(request());
                }
            });

        return $this->success($data, 'Export berhasil. ' . count($data) . ' data diekspor.');
    }
}
