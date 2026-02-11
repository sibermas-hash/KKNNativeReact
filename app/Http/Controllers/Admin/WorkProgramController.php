<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\WorkProgram;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class WorkProgramController extends Controller
{
    public function index(Request $request): Response
    {
        $status = $request->input('status');

        $workPrograms = WorkProgram::with(['group.location'])
            ->when($status, fn ($q) => $q->where('status', $status))
            ->orderByDesc('submitted_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/WorkPrograms/Index', [
            'workPrograms' => $workPrograms,
            'filters' => $request->only('status'),
        ]);
    }
}
