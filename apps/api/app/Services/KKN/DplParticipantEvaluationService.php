<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\KKN\Dosen;
use App\Models\KKN\EvaluasiDplPeserta;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DplParticipantEvaluationService
{
    public const CRITERIA = [
        ['key' => 'kehadiran_pembimbingan', 'label' => 'Kehadiran Pembimbingan', 'weight' => 20],
        ['key' => 'responsivitas', 'label' => 'Responsivitas DPL', 'weight' => 20],
        ['key' => 'kejelasan_arahan', 'label' => 'Kejelasan Arahan', 'weight' => 20],
        ['key' => 'dukungan_penyelesaian_masalah', 'label' => 'Dukungan Penyelesaian Masalah', 'weight' => 20],
        ['key' => 'sikap_pembimbingan', 'label' => 'Sikap Pembimbingan', 'weight' => 20],
    ];

    public const RECOMMENDATIONS = [
        'sangat_direkomendasikan' => 'Sangat Direkomendasikan',
        'direkomendasikan' => 'Direkomendasikan',
        'cukup' => 'Cukup',
        'tidak_direkomendasikan' => 'Tidak Direkomendasikan',
    ];

    public function resolveStudentContext(User $user): array
    {
        $mahasiswa = $user->mahasiswa;

        if (! $mahasiswa) {
            return [
                'eligible' => false,
                'reason' => 'Data mahasiswa tidak ditemukan pada akun Anda.',
                'mahasiswa' => null,
                'registration' => null,
                'group' => null,
                'dpl' => null,
                'existingEvaluation' => null,
            ];
        }

        $registration = $mahasiswa->peserta()
            ->where('status', 'approved')
            ->with([
                'periode:id,name,current_phase',
                'kelompok:id,periode_id,location_id,nama_kelompok,code',
                'kelompok.lokasi:id,village_name,district_name,regency_name',
                'kelompok.dosen.user:id,name',
            ])
            ->latest('approved_at')
            ->latest('id')
            ->first();

        if (! $registration) {
            return [
                'eligible' => false,
                'reason' => 'Anda belum memiliki pendaftaran KKN yang disetujui.',
                'mahasiswa' => $mahasiswa,
                'registration' => null,
                'group' => null,
                'dpl' => null,
                'existingEvaluation' => null,
            ];
        }

        $group = $registration->kelompok;
        if (! $group) {
            return [
                'eligible' => false,
                'reason' => 'Anda belum ditempatkan ke kelompok KKN.',
                'mahasiswa' => $mahasiswa,
                'registration' => $registration,
                'group' => null,
                'dpl' => null,
                'existingEvaluation' => null,
            ];
        }

        $dpl = $group->ketuaDpl;
        if (! $dpl) {
            return [
                'eligible' => false,
                'reason' => 'Kelompok Anda belum memiliki DPL aktif untuk dinilai.',
                'mahasiswa' => $mahasiswa,
                'registration' => $registration,
                'group' => $group,
                'dpl' => null,
                'existingEvaluation' => null,
            ];
        }

        $existingEvaluation = EvaluasiDplPeserta::query()
            ->with('items')
            ->where('periode_id', $registration->periode_id)
            ->where('kelompok_id', $group->id)
            ->where('mahasiswa_id', $mahasiswa->id)
            ->where('dosen_id', $dpl->id)
            ->first();

        return [
            'eligible' => true,
            'reason' => null,
            'mahasiswa' => $mahasiswa,
            'registration' => $registration,
            'group' => $group,
            'dpl' => $dpl,
            'existingEvaluation' => $existingEvaluation,
        ];
    }

    public function store(User $user, array $data): EvaluasiDplPeserta
    {
        $context = $this->resolveStudentContext($user);

        if (! $context['eligible']) {
            throw ValidationException::withMessages([
                'evaluation' => $context['reason'] ?? 'Anda belum memenuhi syarat untuk menilai DPL.',
            ]);
        }

        if ($context['existingEvaluation']) {
            throw ValidationException::withMessages([
                'evaluation' => 'Anda sudah mengirim evaluasi untuk DPL pada periode ini.',
            ]);
        }

        $scores = collect(self::CRITERIA)->map(function (array $criterion) use ($data) {
            return [
                'criterion_key' => $criterion['key'],
                'criterion_label' => $criterion['label'],
                'weight' => $criterion['weight'],
                'score' => (int) ($data['scores'][$criterion['key']] ?? 0),
            ];
        });

        $totalScore = round(
            $scores->sum(fn (array $item) => $item['score'] * $item['weight']) / 100,
            2
        );

        /** @var EvaluasiDplPeserta $evaluation */
        $evaluation = DB::transaction(function () use ($context, $data, $scores, $totalScore) {
            $evaluation = EvaluasiDplPeserta::create([
                'periode_id' => $context['registration']->periode_id,
                'kelompok_id' => $context['group']->id,
                'mahasiswa_id' => $context['mahasiswa']->id,
                'dosen_id' => $context['dpl']->id,
                'total_score' => $totalScore,
                'recommendation' => $data['recommendation'],
                'notes' => filled($data['notes'] ?? null) ? trim((string) $data['notes']) : null,
                'is_anonymous_to_dpl' => true,
                'submitted_at' => now(),
            ]);

            $evaluation->items()->createMany(
                $scores->map(fn (array $item) => [
                    'criterion_key' => $item['criterion_key'],
                    'criterion_label' => $item['criterion_label'],
                    'score' => $item['score'],
                    'weight' => $item['weight'],
                ])->all()
            );

            return $evaluation->load('items');
        });

        return $evaluation;
    }

    public function adminOverview(User $user, array $filters = []): array
    {
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : null;
        $periodId = $this->normalizePeriodId($filters['period_id'] ?? null);
        $search = trim((string) ($filters['search'] ?? ''));
        $recommendation = $filters['recommendation'] ?? null;

        $responses = $this->baseQuery($facultyId)
            ->with([
                'dosen.user:id,name',
                'dosen.fakultas:id,nama',
                'kelompok:id,nama_kelompok,code',
                'periode:id,name',
                'items',
                'mahasiswa.user:id,name',
            ])
            ->when($periodId, fn (Builder $query) => $query->where('periode_id', $periodId))
            ->when($recommendation, fn (Builder $query) => $query->where('recommendation', $recommendation))
            ->when($search !== '', function (Builder $query) use ($search) {
                $query->where(function (Builder $inner) use ($search) {
                    $inner->whereHas('dosen', fn (Builder $dosen) => $dosen
                        ->where('nama', 'like', "%{$search}%")
                        ->orWhere('nip', 'like', "%{$search}%"))
                        ->orWhereHas('dosen.user', fn (Builder $u) => $u->where('name', 'like', "%{$search}%"))
                        ->orWhereHas('kelompok', fn (Builder $kelompok) => $kelompok
                            ->where('nama_kelompok', 'like', "%{$search}%")
                            ->orWhere('code', 'like', "%{$search}%"));
                });
            })
            ->orderByDesc('submitted_at')
            ->get();

        $eligibleCounts = $this->eligibleParticipantCounts($facultyId, $periodId);
        $summaries = $this->buildAdminSummaries($responses, $eligibleCounts);

        return [
            'filters' => [
                'period_id' => $periodId,
                'search' => $search,
                'recommendation' => $recommendation,
            ],
            'periods' => Periode::query()->orderByDesc('id')->get(['id', 'name']),
            'recommendationOptions' => $this->recommendationOptions(),
            'stats' => [
                'total_responses' => $responses->count(),
                'average_score' => round((float) $responses->avg('total_score'), 2),
                'dpl_count' => $summaries->count(),
                'average_response_rate' => round((float) $summaries->avg('response_rate'), 2),
            ],
            'summaries' => $summaries->values()->all(),
        ];
    }

    public function adminDetail(User $user, Dosen $dosen, ?int $periodId = null): array
    {
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : null;
        $responses = $this->baseQuery($facultyId)
            ->with([
                'dosen.user:id,name',
                'dosen.fakultas:id,nama',
                'mahasiswa.user:id,name',
                'kelompok:id,nama_kelompok,code',
                'periode:id,name',
                'items',
            ])
            ->where('dosen_id', $dosen->id)
            ->when($periodId, fn (Builder $query) => $query->where('periode_id', $periodId))
            ->orderByDesc('submitted_at')
            ->get();

        if ($responses->isEmpty()) {
            abort(404, 'Belum ada evaluasi peserta untuk DPL ini.');
        }

        $eligibleCounts = $this->eligibleParticipantCounts($facultyId, $periodId);
        $summary = $this->buildAdminSummaries($responses, $eligibleCounts)->first();

        return [
            'periods' => Periode::query()
                ->whereIn('id', $responses->pluck('periode_id')->unique()->values())
                ->orderByDesc('id')
                ->get(['id', 'name']),
            'selectedPeriodId' => $periodId,
            'summary' => $summary,
            'responses' => $responses->map(fn (EvaluasiDplPeserta $evaluation) => [
                'id' => $evaluation->id,
                'student_name' => $evaluation->mahasiswa?->nama ?? $evaluation->mahasiswa?->user?->name ?? '-',
                'student_nim' => $evaluation->mahasiswa?->nim ?? '-',
                'group_name' => $evaluation->kelompok?->nama_kelompok ?? $evaluation->kelompok?->code ?? '-',
                'period_name' => $evaluation->periode?->name ?? '-',
                'recommendation' => self::RECOMMENDATIONS[$evaluation->recommendation] ?? $evaluation->recommendation,
                'total_score' => (float) $evaluation->total_score,
                'notes' => $evaluation->notes,
                'submitted_at' => optional($evaluation->submitted_at)->format('d M Y H:i'),
                'items' => $evaluation->items->map(fn ($item) => [
                    'criterion_key' => $item->criterion_key,
                    'criterion_label' => $item->criterion_label,
                    'score' => $item->score,
                    'weight' => $item->weight,
                ])->values(),
            ])->values(),
        ];
    }

    public function dplFeedback(User $user, ?int $periodId = null): array
    {
        $dosen = $user->dosen;

        if (! $dosen) {
            return [
                'summary' => null,
                'comments' => [],
                'periods' => [],
                'selectedPeriodId' => $periodId,
            ];
        }

        $responses = EvaluasiDplPeserta::query()
            ->with(['kelompok:id,nama_kelompok,code', 'periode:id,name', 'items'])
            ->where('dosen_id', $dosen->id)
            ->when($periodId, fn (Builder $query) => $query->where('periode_id', $periodId))
            ->orderByDesc('submitted_at')
            ->get();

        $eligibleCounts = $this->eligibleParticipantCounts(null, $periodId);
        $summary = $this->buildAdminSummaries($responses, $eligibleCounts)->first();

        return [
            'summary' => $summary,
            'comments' => $responses
                ->filter(fn (EvaluasiDplPeserta $evaluation) => filled($evaluation->notes))
                ->map(fn (EvaluasiDplPeserta $evaluation) => [
                    'id' => $evaluation->id,
                    'group_name' => $evaluation->kelompok?->nama_kelompok ?? $evaluation->kelompok?->code ?? '-',
                    'period_name' => $evaluation->periode?->name ?? '-',
                    'recommendation' => self::RECOMMENDATIONS[$evaluation->recommendation] ?? $evaluation->recommendation,
                    'notes' => $evaluation->notes,
                    'submitted_at' => optional($evaluation->submitted_at)->format('d M Y'),
                ])
                ->values(),
            'periods' => Periode::query()
                ->whereIn('id', $responses->pluck('periode_id')->unique()->values())
                ->orderByDesc('id')
                ->get(['id', 'name']),
            'selectedPeriodId' => $periodId,
        ];
    }

    public function exportAdminOverview(User $user, array $filters = [])
    {
        $payload = $this->adminOverview($user, $filters);

        return response()->streamDownload(function () use ($payload) {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, [
                'Nama DPL',
                'NIP',
                'Fakultas',
                'Jumlah Respon',
                'Peserta Eligible',
                'Response Rate (%)',
                'Rata-rata Skor',
                'Sangat Direkomendasikan',
                'Direkomendasikan',
                'Cukup',
                'Tidak Direkomendasikan',
            ]);

            foreach ($payload['summaries'] as $summary) {
                fputcsv($handle, [
                    $summary['dosen_name'],
                    $summary['nip'],
                    $summary['faculty_name'],
                    $summary['response_count'],
                    $summary['eligible_count'],
                    $summary['response_rate'],
                    $summary['average_score'],
                    $summary['recommendations']['sangat_direkomendasikan'] ?? 0,
                    $summary['recommendations']['direkomendasikan'] ?? 0,
                    $summary['recommendations']['cukup'] ?? 0,
                    $summary['recommendations']['tidak_direkomendasikan'] ?? 0,
                ]);
            }

            fclose($handle);
        }, 'evaluasi-dpl-peserta.csv', [
            'Content-Type' => 'text/csv',
        ]);
    }

    public function criteria(): array
    {
        return self::CRITERIA;
    }

    public function recommendationOptions(): array
    {
        return collect(self::RECOMMENDATIONS)
            ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->all();
    }

    protected function baseQuery(?int $facultyId = null): Builder
    {
        return EvaluasiDplPeserta::query()
            ->when($facultyId, fn (Builder $query) => $query->whereHas('mahasiswa', fn (Builder $m) => $m->where('fakultas_id', $facultyId)));
    }

    protected function eligibleParticipantCounts(?int $facultyId = null, ?int $periodId = null): Collection
    {
        return PesertaKkn::query()
            ->join('kelompok_kkn', 'kelompok_kkn.id', '=', 'peserta_kkn.kelompok_id')
            ->join('dpl_kelompok', function ($join) {
                $join->on('dpl_kelompok.kelompok_kkn_id', '=', 'kelompok_kkn.id')
                    ->where('dpl_kelompok.role', '=', 'Ketua');
            })
            ->join('mahasiswa', 'mahasiswa.id', '=', 'peserta_kkn.mahasiswa_id')
            ->where('peserta_kkn.status', 'approved')
            ->when($periodId, fn ($query) => $query->where('peserta_kkn.periode_id', $periodId))
            ->when($facultyId, fn ($query) => $query->where('mahasiswa.fakultas_id', $facultyId))
            ->groupBy('dpl_kelompok.dosen_id')
            ->select('dpl_kelompok.dosen_id', DB::raw('count(*) as total'))
            ->pluck('total', 'dpl_kelompok.dosen_id');
    }

    protected function buildAdminSummaries(Collection $responses, Collection $eligibleCounts): Collection
    {
        return $responses
            ->groupBy('dosen_id')
            ->map(function (Collection $grouped, int|string $dosenId) use ($eligibleCounts) {
                /** @var EvaluasiDplPeserta $first */
                $first = $grouped->first();
                $latestSubmittedAt = $grouped
                    ->sortByDesc(fn (EvaluasiDplPeserta $evaluation) => $evaluation->submitted_at?->timestamp ?? 0)
                    ->first()
                    ?->submitted_at;
                $totalEligible = (int) ($eligibleCounts->get($dosenId) ?? $grouped->count());
                $recommendations = collect(array_keys(self::RECOMMENDATIONS))
                    ->mapWithKeys(fn (string $key) => [$key => $grouped->where('recommendation', $key)->count()]);

                return [
                    'dosen_id' => (int) $dosenId,
                    'dosen_name' => $first->dosen?->nama ?? $first->dosen?->user?->name ?? '-',
                    'nip' => $first->dosen?->nip ?? '-',
                    'faculty_name' => $first->dosen?->fakultas?->nama ?? '-',
                    'response_count' => $grouped->count(),
                    'eligible_count' => $totalEligible,
                    'response_rate' => $totalEligible > 0
                        ? round(($grouped->count() / $totalEligible) * 100, 2)
                        : 0.0,
                    'average_score' => round((float) $grouped->avg('total_score'), 2),
                    'group_count' => $grouped->pluck('kelompok_id')->unique()->count(),
                    'recommendations' => $recommendations->all(),
                    'criterion_averages' => collect(self::CRITERIA)->map(fn (array $criterion) => [
                        'key' => $criterion['key'],
                        'label' => $criterion['label'],
                        'average' => round(
                            (float) $grouped
                                ->flatMap(fn (EvaluasiDplPeserta $evaluation) => $evaluation->items)
                                ->where('criterion_key', $criterion['key'])
                                ->avg('score'),
                            2
                        ),
                    ])->values()->all(),
                    'latest_submitted_at' => $latestSubmittedAt?->format('d M Y H:i'),
                ];
            })
            ->sortByDesc('average_score')
            ->values();
    }

    protected function normalizePeriodId(mixed $periodId): ?int
    {
        if ($periodId === null || $periodId === '') {
            return null;
        }

        return (int) $periodId;
    }
}
