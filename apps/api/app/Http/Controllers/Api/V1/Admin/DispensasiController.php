<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DispensasiKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DispensasiController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $d = DispensasiKkn::with(['mahasiswa.user'])->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))->orderByDesc('created_at')->paginate(25);
        return $this->success(['dispensasi' => $d->items(), 'meta' => ['current_page' => $d->currentPage(), 'last_page' => $d->lastPage(), 'total' => $d->total()]]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate(['mahasiswa_id' => ['required', 'exists:mahasiswa,id'], 'periode_id' => ['required', 'exists:periode,id'], 'reason' => ['required', 'string', 'max:1000'], 'requirement_type' => ['required', 'string', 'max:100']]);
        return $this->created(['id' => DispensasiKkn::create(array_merge($validated, ['granted_by' => auth()->id()]))->id], 'Dispensasi berhasil diberikan.');
    }

    public function destroy(DispensasiKkn $dispensasi): JsonResponse
    {
        $dispensasi->delete();
        return $this->noContent('Dispensasi berhasil dihapus.');
    }
}
