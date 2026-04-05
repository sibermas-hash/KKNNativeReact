<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

use App\Services\GradingService;
use Inertia\Inertia;

class GradeController extends Controller
{
    public function __construct(
        private GradingService $gradingService
    ) {}
    public function index()
    {
        Gate::authorize('access-admin-panel');
        $this->authorize('viewAny', NilaiKkn::class);
        
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $groups = KelompokKkn::with(['dpl.user:id,name'])
            ->when($facultyId, function ($query, $id) {
                $query->whereHas('peserta.mahasiswa', fn($q) => $q->where('faculty_id', $id));
            })
            ->orderBy('code')
            ->get(['id','code','nama_kelompok','dpl_id']);

        return Inertia::render('Admin/Grades/Index', [
            'groups' => $groups,
        ]);
    }

    public function students(KelompokKkn $group)
    {
        Gate::authorize('manage-grades');
        $this->authorize('viewAny', NilaiKkn::class);
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $students = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama', 'mahasiswa.user:id,username,email,name'])
            ->where('kelompok_id', $group->id)
            ->where('status', 'approved')
            ->when($facultyId, fn($q) => $q->whereHas('mahasiswa', fn($m) => $m->where('faculty_id', $facultyId)))
            ->get()
            ->map(function ($reg) use ($group) {
                $user = $reg->mahasiswa->user;
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'username' => $user->username,
                    'nim' => $reg->mahasiswa->nim,
                    'kelompok_id' => $group->id,
                ];
            });

        return response()->json($students);
    }

    public function store(Request $request)
    {
        $this->authorize('create', NilaiKkn::class);

        $data = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'scores' => ['required', 'array'],
            'scores.*.student_id' => ['required', 'exists:users,id'],
            'scores.*.execution_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.article_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.discipline_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.attitude_score' => ['nullable', 'numeric', 'between:0,100'],
        ]);

        DB::transaction(function () use ($data) {
            foreach ($data['scores'] as $row) {
                $score = NilaiKkn::updateOrCreate(
                    [
                        'user_id' => $row['student_id'],
                        'kelompok_id' => $data['kelompok_id'],
                    ],
                    [
                        'execution_score' => $row['execution_score'] ?? null,
                        'article_score' => $row['article_score'] ?? null,
                        'discipline_score' => $row['discipline_score'] ?? null,
                        'attitude_score' => $row['attitude_score'] ?? null,
                        'admin_graded_by' => auth()->id(),
                        'admin_graded_at' => now(),
                    ]
                );

                $this->gradingService->calculateFinalGrade($score);
            }
        });

        return back()->with('success', 'Seluruh nilai berhasil disimpan');
    }
}
