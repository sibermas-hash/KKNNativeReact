<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Mahasiswa;
use App\Services\EligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EligibilityController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $search = $request->input('search');

        $query = Mahasiswa::with(['user', 'fakultas', 'prodi'])
            ->when($search, fn ($q, $s) => $q->where('nama', 'like', "%{$s}%")->orWhere('nim', 'like', "%{$s}%"));

        $students = $query->paginate($request->input('per_page', 25));

        return $this->success([
            'students' => $students->items(),
            'meta' => [
                'current_page' => $students->currentPage(),
                'last_page' => $students->lastPage(),
                'total' => $students->total(),
            ],
        ]);
    }
}
