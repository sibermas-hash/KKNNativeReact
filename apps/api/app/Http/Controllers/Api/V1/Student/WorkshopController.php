<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Workshop;
use Illuminate\Http\JsonResponse;

class WorkshopController extends Controller
{
    use ApiResponse;

    public function index(): JsonResponse
    {
        $user = auth()->user();
        $registration = $user->mahasiswa?->peserta()->where('status', 'approved')->first();

        $workshops = Workshop::when($registration?->periode_id, fn ($q) => $q->where('periode_id', $registration->periode_id))
            ->orderByDesc('workshop_date')
            ->get();

        return $this->success([
            'workshops' => $workshops->map(fn ($w) => [
                'id' => $w->id,
                'title' => $w->title,
                'description' => $w->description,
                'location' => $w->location,
                'speaker' => $w->speaker,
                'workshop_date' => $w->workshop_date?->toDateString(),
                'start_time' => $w->start_time,
                'end_time' => $w->end_time,
                'status' => $w->status,
            ]),
        ]);
    }
}
