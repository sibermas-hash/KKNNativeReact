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

class GradeController extends Controller
{
    public function __construct(
        private GradingService $gradingService
    ) {}
    public function index()
    {
        Gate::authorize('manage-grades');
        $this->authorize('viewAny', NilaiKkn::class);

        $groups = KelompokKkn::with(['dpl.user:id,name'])->orderBy('code')->get(['id','code','nama_kelompok','dpl_id']);
        return Inertia::render('Admin/Grades/Index', [
            'groups' => $groups,
        ]);
    }

    public function students(KelompokKkn $group)
    {
        Gate::authorize('manage-grades');
        $this->authorize('viewAny', NilaiKkn::class);
        $students = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama', 'mahasiswa.user:id,username,email,name'])
            ->where('kelompok_id', $group->id)
            ->where('status', 'approved')
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
            'kelompok_id' => ['required','exists:kelompok_kkn,id'],
            'student_id' => ['required','exists:users,id'],
            'execution_score' => ['nullable','numeric','between:0,100'],
            'article_score' => ['nullable','numeric','between:0,100'],
            'discipline_score' => ['nullable','numeric','between:0,100'],
            'attitude_score' => ['nullable','numeric','between:0,100'],
        ]);

        $score = NilaiKkn::updateOrCreate(
            [
                'user_id' => $data['student_id'],
                'kelompok_id' => $data['kelompok_id'],
            ],
            [
                'execution_score' => $data['execution_score'],
                'article_score' => $data['article_score'],
                'discipline_score' => $data['discipline_score'],
                'attitude_score' => $data['attitude_score'],
                'admin_graded_by' => auth()->id(),
                'admin_graded_at' => now(),
            ]
        );

        $this->gradingService->calculateFinalGrade($score);

        return back()->with('success', 'Nilai berhasil disimpan');
    }
}
