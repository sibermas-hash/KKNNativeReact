<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ProgramKerja;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgramKerjaController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : null;
        $status = $request->input('status');

        $query = ProgramKerja::query()
            ->with(['kelompok.lokasi'])
            ->when($facultyId, fn ($q, $id) => $q->whereHas(
                'kelompok.peserta.mahasiswa',
                fn ($q2) => $q2->where('fakultas_id', $id)
            ))
            ->when($status, fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('submitted_at');

        $paginated = $query->paginate((int) $request->input('per_page', 15));

        return $this->success([
            'data' => $paginated->items(),
            'meta' => [
                'current_page' => $paginated->currentPage(),
                'last_page' => $paginated->lastPage(),
                'total' => $paginated->total(),
            ],
            'stats' => [
                'total' => (clone $query)->count(),
                'approved' => (clone $query)->where('status', 'approved')->count(),
                'pending' => (clone $query)->where('status', 'pending')->count(),
            ],
        ]);
    }
}
