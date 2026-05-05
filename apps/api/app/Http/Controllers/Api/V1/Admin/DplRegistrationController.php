<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DplRegistration;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DplRegistrationController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = DplRegistration::with(['dosen.user', 'dosen.fakultas'])
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->orderByDesc('created_at');

        return $this->success([
            'registrations' => $query->paginate($request->input('per_page', 25))->items(),
        ]);
    }

    public function approve(DplRegistration $registration): JsonResponse
    {
        $registration->update(['status' => 'active', 'approved_at' => now(), 'approved_by' => auth()->id()]);
        return $this->noContent('DPL disetujui.');
    }

    public function reject(Request $request, DplRegistration $registration): JsonResponse
    {
        $request->validate(['rejection_reason' => ['required', 'string', 'max:500']]);
        $registration->update(['status' => 'rejected', 'rejection_reason' => $request->input('rejection_reason')]);
        return $this->noContent('DPL ditolak.');
    }
}
