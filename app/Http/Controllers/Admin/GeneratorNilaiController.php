<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SaveGradeGeneratorRequest;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\NilaiKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\GradeExportService;
use App\Services\GradingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class GeneratorNilaiController extends Controller
{
    public function __construct(
        private GradingService $gradingService,
        private GradeExportService $exportService
    ) {}

    /**
     * Verify the logged-in DPL is assigned to the given group as Ketua.
     */
    private function authorizeDplGroup(int $groupId): void
    {
        if (! auth()->user()->hasRole('dpl')) {
            return;
        }

        $dosen = auth()->user()->dosen;
        abort_if(! $dosen, 403, 'Data profil dosen tidak ditemukan.');

        $isAssigned = $dosen->kelompokKkn()
            ->where('kelompok_kkn.id', $groupId)
            ->wherePivot('role', 'Ketua')
            ->exists();

        abort_if(! $isAssigned, 403, 'Akses Ditolak: Anda harus menjadi Ketua DPL untuk kelompok ini agar dapat memberikan nilai.');
    }

    public function index(): Response
    {
        Gate::authorize('manage-grades');
        $periods = Periode::with('tahunAkademik')
            ->orderByDesc('id')
            ->limit(50)
            ->get()
            ->map(fn ($p) => [
                'id' => $p->id,
                'name' => 'Angkatan '.($p->name ?? '-').' ('.($p->tahunAkademik?->year ?? '-').')',
                'grading_start' => $p->grading_start?->format('Y-m-d'),
                'grading_end' => $p->grading_end?->format('Y-m-d'),
            ]);

        $query = KelompokKkn::with(['lokasi', 'dosen.user:id,name']);

        // MULTI-DPL LOGIC: Filter groups for logged-in DPL
        if (auth()->user()->hasRole('dpl')) {
            $dosenId = auth()->user()->dosen?->id;
            if ($dosenId) {
                $query->whereHas('dosen', function ($q) use ($dosenId) {
                    $q->where('dosen_id', $dosenId)
                        ->where('role', 'Ketua');
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        $groups = $query->orderBy('code')
            ->get()
            ->map(function (KelompokKkn $g) {
                $kelompokNum = preg_replace('/[^0-9]/', '', $g->code);
                $mainDpl = $g->dosen->where('pivot.role', 'Ketua')->first();

                return [
                    'id' => $g->id,
                    'periode_id' => $g->periode_id,
                    'code' => $kelompokNum,
                    'name' => 'Kelompok '.$kelompokNum,
                    'desa' => $g->lokasi?->village_name ?? '-',
                    'kecamatan' => $g->lokasi?->district_name ?? '-',
                    'kabupaten' => $g->lokasi?->regency_name ?? '-',
                    'dpl' => $mainDpl?->user?->name ?? '-',
                ];
            });

        return Inertia::render('Admin/Academic/GradeGenerator/Index', [
            'periods' => $periods,
            'groups' => $groups,
        ]);
    }

    public function students(KelompokKkn $kelompokKkn)
    {
        Gate::authorize('manage-grades');
        $this->authorizeDplGroup($kelompokKkn->id);

        return response()->json($this->getStudentsForGroup($kelompokKkn));
    }

    public function studentsAll()
    {
        Gate::authorize('manage-grades');
        abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengakses kelompok yang ditugaskan.');

        // PERBAIKAN N+1: Batch load semua data sekaligus, bukan per-group loop
        $groups = KelompokKkn::orderBy('code')->get();
        $groupIds = $groups->pluck('id')->toArray();

        // Batch load semua registrasi
        $registrations = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama'])
            ->whereIn('kelompok_id', $groupIds)
            ->whereIn('status', ['approved', 'pending'])
            ->get()
            ->groupBy('kelompok_id');

        // Batch load semua nilai
        $userIds = $registrations->flatten()->pluck('mahasiswa.user_id')->filter()->unique()->toArray();
        $scores = NilaiKkn::whereIn('kelompok_id', $groupIds)
            ->whereIn('user_id', $userIds)
            ->get()
            ->groupBy(fn ($s) => "{$s->kelompok_id}:{$s->user_id}");

        // Map sekaligus tanpa loop N+1
        $allStudents = [];
        foreach ($groups as $group) {
            $groupRegs = $registrations[$group->id] ?? collect();
            foreach ($groupRegs as $reg) {
                $userId = $reg->mahasiswa->user_id;
                $scoreKey = "{$group->id}:{$userId}";
                $score = $scores[$scoreKey]?->first();

                $allStudents[] = [
                    'user_id' => $userId,
                    'name' => $reg->mahasiswa->nama,
                    'nim' => $reg->mahasiswa->nim,
                    'group_code' => $group->code,
                    'group_name' => $group->nama_kelompok,
                    'discipline' => $score?->discipline_score ? (int) $score->discipline_score : null,
                    'attitude' => $score?->attitude_score ? (int) $score->attitude_score : null,
                ];
            }
        }

        return response()->json($allStudents);
    }

    public function saveScores(SaveGradeGeneratorRequest $request)
    {
        $data = $request->validated();

        $this->authorizeDplGroup($data['kelompok_id']);

        // FIX C17: Apply grading period window check to ALL roles, not just DPL
        $group = KelompokKkn::with('periode')->find($data['kelompok_id']);
        $period = $group?->periode;

        if ($period && $period->grading_start && $period->grading_end) {
            $now = now()->startOfDay();
            if ($now->lt($period->grading_start) || $now->gt($period->grading_end)) {
                return back()->with('error', 'Masa penilaian KKN untuk periode ini belum dibuka atau sudah berakhir.');
            }
        }

        // Handle File Upload - PROTECTED STORAGE
        $evidencePath = null;
        if ($request->hasFile('evidence_file')) {
            $file = $request->file('evidence_file');

            // VULN-010 Fix: Validate extension against allowlist using MIME type (not client-provided name)
            $allowedExtensions = ['pdf', 'jpg', 'jpeg', 'png'];
            $extension = strtolower($file->guessExtension() ?? '');

            // Normalize jpeg extension
            if ($extension === 'jpeg') {
                $extension = 'jpg';
            }

            if (! in_array($extension, $allowedExtensions)) {
                return back()->withErrors(['evidence_file' => 'Ekstensi file tidak diizinkan. Hanya PDF, JPG, dan PNG yang diperbolehkan.']);
            }

            // Store in private storage (local disk) for security
            $evidencePath = $file->storeAs(
                "evidence/{$data['kelompok_id']}",
                'blanko_'.time().".{$extension}"
            );
        }

        DB::transaction(function () use ($data, $request, $evidencePath) {
            foreach ($data['scores'] as $row) {
                $discipline = $row['discipline'] ?? null;
                $attitude = $row['attitude'] ?? null;

                if ($discipline === null && $attitude === null && ! $evidencePath) {
                    continue;
                }

                $score = NilaiKkn::firstOrNew([
                    'user_id' => $row['user_id'],
                    'kelompok_id' => $data['kelompok_id'],
                ]);

                if ($discipline !== null) {
                    $score->discipline_score = $discipline;
                }
                if ($attitude !== null) {
                    $score->attitude_score = $attitude;
                }

                if ($discipline !== null || $attitude !== null) {
                    $score->dpl_graded_by = $request->user()->id;
                    $score->dpl_graded_at = now();
                }

                if ($evidencePath) {
                    $score->evidence_file = $evidencePath;
                }

                $score->save();

                // Recalculate everything safely using Service
                $this->gradingService->calculateFinalGrade($score);
            }
        });

        return back()->with('success', 'Nilai & Bukti Blanko berhasil disimpan.');
    }

    public function exportExcel(Request $request, $id)
    {
        $periodId = $request->query('periode_id');

        if ($id !== 'all') {
            $this->authorizeDplGroup((int) $id);
        } else {
            abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengekspor kelompok yang ditugaskan.');
        }

        if ($id === 'all' && $periodId) {
            $students = $this->getStudentsForPeriod($periodId);

            return $this->exportService->exportExcel('all', $students, (int) $periodId);
        } else {
            $kelompokKkn = KelompokKkn::with(['lokasi', 'dosen.user:id,name', 'periode.tahunAkademik'])->findOrFail($id);
            $students = $this->getStudentsForGroup($kelompokKkn);

            return $this->exportService->exportExcel($kelompokKkn, $students);
        }
    }

    public function exportPdf(Request $request, $id)
    {
        $periodId = $request->query('periode_id');

        if ($id !== 'all') {
            $this->authorizeDplGroup((int) $id);
        } else {
            abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengekspor kelompok yang ditugaskan.');
        }

        if ($id === 'all' && $periodId) {
            $students = $this->getStudentsForPeriod($periodId);

            return $this->exportService->exportPdf('all', $students, (int) $periodId);
        } else {
            $kelompokKkn = KelompokKkn::with(['lokasi', 'dosen.user:id,name', 'periode.tahunAkademik'])->findOrFail($id);
            $students = $this->getStudentsForGroup($kelompokKkn);

            return $this->exportService->exportPdf($kelompokKkn, $students);
        }
    }

    public function exportZip(Request $request)
    {
        abort_if(auth()->user()->hasRole('dpl'), 403, 'DPL hanya dapat mengekspor kelompok yang ditugaskan.');

        $periodId = $request->query('periode_id');
        if (! $periodId) {
            abort(400, 'Missing periode_id');
        }

        // Use cursor for memory efficiency
        $groups = KelompokKkn::with(['lokasi', 'dosen.user:id,name', 'periode.tahunAkademik'])
            ->where('periode_id', $periodId)
            ->whereHas('dosen', function ($q) {
                if (auth()->user()->hasRole('dpl')) {
                    $dosenId = auth()->user()->dosen?->id;
                    if (! $dosenId) {
                        return;
                    }
                    $q->where('dosen_id', $dosenId)->where('role', 'Ketua');
                }
            })
            ->orderBy('code')
            ->cursor();

        return $this->exportService->exportZip($groups, function (KelompokKkn $group) {
            return $this->getStudentsForGroup($group);
        });
    }

    private function getStudentsForGroup($group): array
    {
        $registrations = PesertaKkn::with(['mahasiswa:id,user_id,nim,nama'])
            ->where('kelompok_id', $group->id)
            ->whereIn('status', ['approved', 'pending'])
            ->get();

        // Pre-load all scores for this group in one query to avoid N+1
        $userIds = $registrations->pluck('mahasiswa.user_id')->filter();
        $scores = NilaiKkn::where('kelompok_id', $group->id)
            ->whereIn('user_id', $userIds)
            ->get()
            ->keyBy('user_id');

        return $registrations->map(function ($reg) use ($scores) {
            $userId = $reg->mahasiswa->user_id;
            $score = $scores->get($userId);

            return [
                'user_id' => $userId,
                'name' => $reg->mahasiswa->nama,
                'nim' => $reg->mahasiswa->nim,
                'discipline' => $score?->discipline_score ? (int) $score->discipline_score : null,
                'attitude' => $score?->attitude_score ? (int) $score->attitude_score : null,
            ];
        })->values()->toArray();
    }

    private function getStudentsForPeriod($periodId): array
    {
        return DB::connection('kkn')->table('mahasiswa as s')
            ->join('users as u', 's.user_id', '=', 'u.id')
            ->join('peserta_kkn as r', 's.id', '=', 'r.mahasiswa_id')
            ->join('kelompok_kkn as g', 'r.kelompok_id', '=', 'g.id')
            ->leftJoin('nilai_kkn as ks', function ($join) {
                $join->on('ks.user_id', '=', 'u.id')
                    ->on('ks.kelompok_id', '=', 'g.id');
            })
            ->where('g.periode_id', $periodId)
            ->select([
                'u.id as user_id',
                'u.name',
                's.nim',
                'g.code as group_code',
                'ks.discipline_score as discipline',
                'ks.attitude_score as attitude',
            ])
            ->orderBy('g.code')
            ->orderBy('u.name')
            ->limit(50000)
            ->get()
            ->map(fn ($s) => [
                'user_id' => $s->user_id,
                'name' => $s->name,
                'nim' => $s->nim,
                'group_code' => $s->group_code,
                'discipline' => $s->discipline ? (int) $s->discipline : null,
                'attitude' => $s->attitude ? (int) $s->attitude : null,
            ])
            ->toArray();
    }
}
