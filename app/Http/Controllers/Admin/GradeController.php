<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use App\Models\KknScore;
use App\Models\Registration;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class GradeController extends Controller
{
    public function index()
    {
        $groups = Group::with(['lecturer.user:id,name'])->orderBy('code')->get(['id','code','name','lecturer_id']);
        return Inertia::render('Admin/Grades/Index', [
            'groups' => $groups,
        ]);
    }

    public function students(Group $group)
    {
        $students = Registration::with(['student:id,user_id,nim,name', 'student.user:id,username,email,name'])
            ->where('group_id', $group->id)
            ->where('status', 'approved')
            ->get()
            ->map(function ($reg) use ($group) {
                $user = $reg->student->user;
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'nim' => $reg->student->nim,
                    'group_id' => $group->id,
                ];
            });

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'group_id' => ['required','exists:groups,id'],
            'student_id' => ['required','exists:users,id'],
            'execution_score' => ['nullable','numeric','between:0,100'],
            'article_score' => ['nullable','numeric','between:0,100'],
            'discipline_score' => ['nullable','numeric','between:0,100'],
            'attitude_score' => ['nullable','numeric','between:0,100'],
        ]);

        $weights = [
            'execution_score' => 0.40,
            'article_score' => 0.30,
            'discipline_score' => 0.15,
            'attitude_score' => 0.15,
        ];

        $dplWeighted = ($data['execution_score'] ?? 0) * $weights['execution_score']
            + ($data['article_score'] ?? 0) * $weights['article_score'];
        $villageWeighted = ($data['discipline_score'] ?? 0) * $weights['discipline_score']
            + ($data['attitude_score'] ?? 0) * $weights['attitude_score'];
        $total = round($dplWeighted + $villageWeighted, 2);

        $letter = null;
        if ($total >= 85) {
            $letter = 'A';
        } elseif ($total >= 75) {
            $letter = 'B';
        } elseif ($total >= 65) {
            $letter = 'C';
        } else {
            $letter = 'D';
        }

        DB::transaction(function () use ($data, $dplWeighted, $villageWeighted, $total, $letter) {
            KknScore::updateOrCreate(
                [
                    'student_id' => $data['student_id'],
                    'group_id' => $data['group_id'],
                ],
                [
                    'execution_score' => $data['execution_score'],
                    'article_score' => $data['article_score'],
                    'discipline_score' => $data['discipline_score'],
                    'attitude_score' => $data['attitude_score'],
                    'dpl_weighted_score' => round($dplWeighted, 2),
                    'village_weighted_score' => round($villageWeighted, 2),
                    'total_score' => $total,
                    'letter_grade' => $letter,
                ]
            );
        });

        return back()->with('success', 'Nilai berhasil disimpan');
    }
}
