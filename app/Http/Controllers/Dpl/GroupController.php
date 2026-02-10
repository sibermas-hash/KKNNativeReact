<?php

namespace App\Http\Controllers\Dpl;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Inertia\Inertia;
use Inertia\Response;

class GroupController extends Controller
{
    public function index(): Response
    {
        $lecturer = auth()->user()->lecturer;

        $groups = $lecturer
            ? Group::where('lecturer_id', $lecturer->id)
                ->with('period', 'location')
                ->withCount('registrations', 'dailyReports', 'workPrograms')
                ->get()
            : collect();

        return Inertia::render('Dpl/Groups/Index', [
            'groups' => $groups,
        ]);
    }

    public function show(Group $group): Response
    {
        $lecturer = auth()->user()->lecturer;
        abort_if(!$lecturer || $group->lecturer_id !== $lecturer->id, 403);

        $group->load([
            'period', 'location',
            'registrations.student.faculty',
            'registrations.student.program',
            'workPrograms',
        ]);

        return Inertia::render('Dpl/Groups/Show', [
            'group' => $group,
        ]);
    }
}
