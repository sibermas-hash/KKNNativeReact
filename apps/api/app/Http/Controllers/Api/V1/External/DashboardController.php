<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\External;

use App\Http\Controllers\Controller;
use App\Models\KKN\CollaborationLetter;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $user = $request->user()->load('externalUniversity');
        $externalUniversityId = (int) $user->external_university_id;
        abort_if($externalUniversityId <= 0, 403, 'Akun belum terhubung ke kampus luar.');

        $participantsByStatus = PesertaKkn::query()
            ->whereHas('mahasiswa', fn ($q) => $q->where('external_university_id', $externalUniversityId))
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $lettersByStatus = CollaborationLetter::query()
            ->where('external_university_id', $externalUniversityId)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        return response()->json([
            'role' => 'external_lppm_admin',
            'external_university' => $user->externalUniversity,
            'stats' => [
                'participants' => (int) $participantsByStatus->sum(),
                'participants_by_status' => $participantsByStatus,
                'letters' => (int) $lettersByStatus->sum(),
                'letters_by_status' => $lettersByStatus,
                'submitted' => (int) ($participantsByStatus['pending'] ?? 0),
                'verified' => (int) ($participantsByStatus['approved'] ?? 0),
                'rejected' => (int) ($participantsByStatus['rejected'] ?? 0),
            ],
        ]);
    }
}
