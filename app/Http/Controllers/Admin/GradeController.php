<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\AuditService;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
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

        $groups = KelompokKkn::with(['dosen.user:id,name', 'periode'])
            ->when($facultyId, function ($query, $id) {
                $query->whereHas('peserta.mahasiswa', fn ($q) => $q->where('faculty_id', $id));
            })
            ->when(request('jenis_kkn_id'), function ($query, $jenisId) {
                $query->whereHas('periode', fn ($q) => $q->where('jenis_kkn_id', $jenisId));
            })
            ->orderBy('code')
            ->get(['id', 'code', 'nama_kelompok', 'dpl_id', 'period_id']);

        $jenisKknOptions = JenisKkn::dropdownOptions();

        return Inertia::render('Admin/Academic/Grades/Index', [
            'groups' => $groups,
            'jenisKknOptions' => $jenisKknOptions,
            'filters' => request()->only('jenis_kkn_id'),
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
            ->when($facultyId, fn ($q) => $q->whereHas('mahasiswa', fn ($m) => $m->where('faculty_id', $facultyId)))
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
            // Desa
            'scores.*.desa_interaksi_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.desa_disiplin_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.desa_kinerja_score' => ['nullable', 'numeric', 'between:0,100'],
            // DPL
            'scores.*.dpl_relevansi_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.dpl_ketercapaian_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.dpl_inovasi_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.dpl_administrasi_score' => ['nullable', 'numeric', 'between:0,100'],
            'scores.*.dpl_artikel_score' => ['nullable', 'numeric', 'between:0,100'],
            // LPPM
            'scores.*.administration_score' => ['nullable', 'numeric', 'between:0,100'],
        ]);

        // Validate that all students belong to the specified kelompok
        $studentIds = collect($data['scores'])->pluck('student_id')->unique();
        $validStudentIds = PesertaKkn::where('kelompok_id', $data['kelompok_id'])
            ->where('status', 'approved')
            ->whereHas('mahasiswa', fn ($q) => $q->whereIn('user_id', $studentIds))
            ->pluck('mahasiswa.user_id');

        $invalidIds = $studentIds->diff($validStudentIds);
        if ($invalidIds->isNotEmpty()) {
            throw ValidationException::withMessages([
                'scores' => 'One or more students do not belong to the selected kelompok.',
            ]);
        }

        DB::transaction(function () use ($data) {
            foreach ($data['scores'] as $row) {
                $score = NilaiKkn::updateOrCreate(
                    [
                        'user_id' => $row['student_id'],
                        'kelompok_id' => $data['kelompok_id'],
                    ],
                    [
                        'desa_interaksi_score' => $row['desa_interaksi_score'] ?? null,
                        'desa_disiplin_score' => $row['desa_disiplin_score'] ?? null,
                        'desa_kinerja_score' => $row['desa_kinerja_score'] ?? null,
                        'dpl_relevansi_score' => $row['dpl_relevansi_score'] ?? null,
                        'dpl_ketercapaian_score' => $row['dpl_ketercapaian_score'] ?? null,
                        'dpl_inovasi_score' => $row['dpl_inovasi_score'] ?? null,
                        'dpl_administrasi_score' => $row['dpl_administrasi_score'] ?? null,
                        'dpl_artikel_score' => $row['dpl_artikel_score'] ?? null,
                        'administration_score' => $row['administration_score'] ?? null,
                        'admin_graded_by' => auth()->id(),
                        'admin_graded_at' => now(),
                    ]
                );

                $this->gradingService->calculateFinalGrade($score);

                AuditService::log(
                    'UPDATE_SCORE_ADMIN',
                    "Admin mengupdate nilai mahasiswa ID {$row['student_id']}",
                    $score,
                    null,
                    $row
                );
            }
        });

        return back()->with('success', 'Seluruh parameter nilai berhasil disimpan dan disinkronisasi.');
    }
}
