<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DispensasiKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Services\AuditService;
use App\Services\EligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class EligibilityController extends Controller
{
    use ApiResponse;

    public function __construct(private EligibilityService $eligibilityService) {}

    public function index(Request $request): JsonResponse
    {
        $user = auth()->user();
        $periodeId = $request->integer('period_id') ?: null;
        $requestedFacultyId = $request->integer('faculty_id') ?: ($request->integer('fakultas_id') ?: null);
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : $requestedFacultyId;
        $showEligible = $request->boolean('show_eligible', true);
        $search = $request->string('search')->trim()->toString();
        $issueKey = $request->string('issue')->trim()->toString();
        $perPage = 20;
        $page = $request->integer('page', 1);

        // Only use cached path when the scoped dataset is fully cached.
        $cacheComplete = $this->canUseEligibilityCache($facultyId, $periodeId);

        if (! $cacheComplete) {
            // Fallback: compute on-the-fly (slow, first-time only)
            $result = $this->eligibilityService->getEligibleStudents($periodeId, $facultyId);
            $issueFilters = $this->buildIssueFilterOptions(collect($result['not_eligible']));

            $studentsToShow = $showEligible ? $result['eligible'] : $result['not_eligible'];

            if ($search !== '') {
                $lower = strtolower($search);
                $studentsToShow = $studentsToShow->filter(fn ($s) => str_contains(strtolower($s['nim'] ?? ''), $lower) ||
                    str_contains(strtolower($s['nama'] ?? ''), $lower)
                )->values();
            }

            if ($issueKey !== '') {
                $studentsToShow = $studentsToShow->filter(fn ($s) => collect($s['issues'] ?? [])->contains('key', $issueKey))->values();
            }

            $total = $studentsToShow->count();
            $students = $studentsToShow->slice(($page - 1) * $perPage, $perPage)->values();

            return $this->success([
                'students' => $students,
                'pagination' => [
                    'current_page' => $page,
                    'per_page' => $perPage,
                    'total' => $total,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                ],
                'stats' => [
                    'total' => $result['total'],
                    'eligible_count' => $result['eligible_count'],
                    'not_eligible_count' => $result['not_eligible_count'],
                    'eligibility_rate' => $result['eligibility_rate'],
                    'registered_count' => \App\Models\KKN\Mahasiswa::where('is_eligible', true)->whereHas('peserta')->count(),
                    'not_registered_count' => \App\Models\KKN\Mahasiswa::where('is_eligible', true)->whereDoesntHave('peserta')->count(),
                ],
                'issue_filters' => $issueFilters,
            ]);
        }

        // FAST PATH: Query from cached eligibility columns with DB-level pagination
        $query = Mahasiswa::with(['prodi.fakultas', 'fakultas'])
            ->where('is_eligible', $showEligible)
            ->whereNotNull('eligibility_computed_at');

        // Filter by registration status
        $regFilter = $request->string('registration_status')->trim()->toString();
        if ($regFilter === 'registered') {
            $query->whereHas('peserta');
        } elseif ($regFilter === 'not_registered') {
            $query->whereDoesntHave('peserta');
        }

        if ($facultyId) {
            $query->where('fakultas_id', $facultyId);
        }

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('nim', 'ilike', "%{$search}%")
                  ->orWhere('nama', 'ilike', "%{$search}%");
            });
        }

        if ($issueKey !== '') {
            $query->whereRaw('eligibility_issues @> ?::jsonb', [json_encode([['key' => $issueKey]])]);
        }

        $query->orderBy('nama');

        // Stats: fast aggregate counts from cache
        $statsQuery = Mahasiswa::whereNotNull('eligibility_computed_at');
        if ($facultyId) {
            $statsQuery->where('fakultas_id', $facultyId);
        }
        $totalAll = $statsQuery->count();
        $eligibleCount = (clone $statsQuery)->where('is_eligible', true)->count();
        $notEligibleCount = $totalAll - $eligibleCount;

        // Paginate
        $paginated = $query->paginate($perPage, ['*'], 'page', $page);

        // Transform to expected format
        $students = $this->transformCachedStudents($paginated->getCollection(), $periodeId);

        return $this->success([
            'students' => $students->values(),
            'pagination' => [
                'current_page' => $paginated->currentPage(),
                'per_page' => $paginated->perPage(),
                'total' => $paginated->total(),
                'last_page' => $paginated->lastPage(),
            ],
            'stats' => [
                'total' => $totalAll,
                'eligible_count' => $eligibleCount,
                'not_eligible_count' => $notEligibleCount,
                'eligibility_rate' => $totalAll > 0 ? round(($eligibleCount / $totalAll) * 100, 1) : 0,
                'registered_count' => (clone $statsQuery)->where('is_eligible', true)->whereHas('peserta')->count(),
                'not_registered_count' => (clone $statsQuery)->where('is_eligible', true)->whereDoesntHave('peserta')->count(),
            ],
            'issue_filters' => $this->buildIssueFilterOptions($this->transformCachedStudents($this->getCachedIssueRows($facultyId), $periodeId)),
        ]);
    }

    /**
     * Get a human-readable passed message for a check key (cached mode).
     */
    private function getPassedMessage(string $key, Mahasiswa $m): string
    {
        return match ($key) {
            'status_aktif' => 'Status akademik aktif',
            'no_prior_completion' => 'Belum pernah lulus KKN',
            'min_sks' => 'SKS mencukupi (' . ($m->sks_completed ?? 0) . ')',
            'min_semester' => 'Semester mencukupi (' . ($m->semester ?? 0) . ')',
            'min_gpa' => 'IPK mencukupi (' . ($m->gpa ? number_format((float) $m->gpa, 2) : '-') . ')',
            'ukt_payment' => $m->is_paid_ukt ? 'UKT sudah lunas' : 'UKT belum lunas',
            'bta_ppi' => 'Lulus BTA-PPI',
            'program_prodi' => 'Program studi sesuai',
            'personal_status' => 'Lolos kriteria umum',
            default => 'OK',
        };
    }

    private function getIssueFilterLabel(string $key, ?string $message = null): string
    {
        return match ($key) {
            'status_aktif' => 'Status akademik tidak aktif',
            'min_sks' => 'SKS kurang',
            'min_semester' => 'Semester kurang',
            'min_gpa' => 'IPK kurang',
            'ukt_payment' => 'UKT belum lunas',
            'bta_ppi' => 'BTA-PPI belum lulus',
            'program_prodi' => 'Prodi tidak sesuai',
            'personal_status' => 'Syarat personal',
            'no_prior_completion' => 'Sudah pernah KKN',
            'documents' => 'Dokumen belum lengkap',
            default => $message && trim($message) !== '' ? trim($message) : Str::headline(str_replace('_', ' ', $key)),
        };
    }

    private function buildIssueFilterOptions(Collection $students): array
    {
        $labels = [
            'status_aktif' => $this->getIssueFilterLabel('status_aktif'),
            'min_sks' => $this->getIssueFilterLabel('min_sks'),
            'min_semester' => $this->getIssueFilterLabel('min_semester'),
            'min_gpa' => $this->getIssueFilterLabel('min_gpa'),
            'ukt_payment' => $this->getIssueFilterLabel('ukt_payment'),
            'bta_ppi' => $this->getIssueFilterLabel('bta_ppi'),
            'program_prodi' => $this->getIssueFilterLabel('program_prodi'),
            'personal_status' => $this->getIssueFilterLabel('personal_status'),
            'no_prior_completion' => $this->getIssueFilterLabel('no_prior_completion'),
        ];

        foreach ($students as $student) {
            foreach (($student['issues'] ?? []) as $issue) {
                $key = (string) ($issue['key'] ?? '');
                if ($key === '' || array_key_exists($key, $labels)) {
                    continue;
                }

                $labels[$key] = $this->getIssueFilterLabel($key, $issue['message'] ?? null);
            }
        }

        return collect($labels)
            ->map(fn (string $label, string $value) => ['value' => $value, 'label' => $label])
            ->values()
            ->all();
    }

    private function canUseEligibilityCache(?int $facultyId, ?int $periodeId): bool
    {
        return $this->isEligibilityCacheComplete($facultyId) && $this->isEligibilityCacheFresh($facultyId, $periodeId);
    }

    /**
     * Cached eligibility data is only safe when the whole scoped dataset has been computed.
     */
    private function isEligibilityCacheComplete(?int $facultyId): bool
    {
        $query = Mahasiswa::query();

        if ($facultyId) {
            $query->where('fakultas_id', $facultyId);
        }

        $total = (clone $query)->count();
        $cached = (clone $query)->whereNotNull('eligibility_computed_at')->count();

        return $total === 0 || $total === $cached;
    }

    private function isEligibilityCacheFresh(?int $facultyId, ?int $periodeId): bool
    {
        $query = Mahasiswa::query();

        if ($facultyId) {
            $query->where('fakultas_id', $facultyId);
        }

        // Use MAX (most recent computation) — if data changed after the latest recompute,
        // cache is stale. Using MIN was too aggressive: any mahasiswa update after the
        // earliest-computed row would invalidate the entire cache.
        $latestCacheAt = (clone $query)->whereNotNull('eligibility_computed_at')->max('eligibility_computed_at');
        $cacheTimestamp = $latestCacheAt ? strtotime((string) $latestCacheAt) : false;
        if ($cacheTimestamp === false) {
            return false;
        }

        // NOTE: We do NOT check mahasiswa.updated_at here because computing
        // eligibility itself updates the row (is_eligible, eligibility_issues,
        // eligibility_computed_at) which bumps updated_at. Instead we only
        // check external triggers: periode, settings, dispensasi, completions.

        $periode = $periodeId
            ? Periode::with('jenisKkn')->find($periodeId)
            : Periode::getActivePeriod()?->loadMissing('jenisKkn');

        if ($periode !== null) {
            if ($this->isNewerThanCache($periode->updated_at, $cacheTimestamp)) {
                return false;
            }

            if ($this->isNewerThanCache($periode->jenisKkn?->updated_at, $cacheTimestamp)) {
                return false;
            }
        }

        if ($this->isNewerThanCache(SystemSetting::query()->max('updated_at'), $cacheTimestamp)) {
            return false;
        }

        if ($this->isNewerThanCache(PesertaKkn::query()->where('status', 'completed')->max('updated_at'), $cacheTimestamp)) {
            return false;
        }

        $dispensasiUpdatedAt = DispensasiKkn::query()
            ->when($periode?->id, function ($dispensasiQuery, int $effectivePeriodeId) {
                $dispensasiQuery->where(function ($nested) use ($effectivePeriodeId) {
                    $nested->whereNull('periode_id')
                        ->orWhere('periode_id', $effectivePeriodeId);
                });
            })
            ->max('updated_at');

        return ! $this->isNewerThanCache($dispensasiUpdatedAt, $cacheTimestamp);
    }

    private function isNewerThanCache(mixed $value, int $cacheTimestamp): bool
    {
        if ($value === null) {
            return false;
        }

        $timestamp = strtotime((string) $value);

        return $timestamp !== false && $timestamp > $cacheTimestamp;
    }

    private function getCachedIssueRows(?int $facultyId): Collection
    {
        $query = Mahasiswa::query()
            ->select(['id', 'nim', 'nama', 'fakultas_id', 'prodi_id', 'sks_completed', 'gpa', 'status_bta_ppi', 'health_certificate_path', 'parent_permission_path', 'eligibility_issues', 'is_eligible'])
            ->with(['prodi.fakultas', 'fakultas'])
            ->whereNotNull('eligibility_computed_at')
            ->where('is_eligible', false);

        if ($facultyId) {
            $query->where('fakultas_id', $facultyId);
        }

        return $query->orderBy('nama')->get();
    }

    /**
     * Transform cached mahasiswa rows to the frontend payload shape.
     */
    private function transformCachedStudents(Collection $mahasiswa, ?int $periodeId): Collection
    {
        $effectivePeriodeId = $periodeId ?: Periode::getActivePeriod()?->id;
        $nims = $mahasiswa->pluck('nim')->filter()->unique()->values();

        $dispensasiNims = DispensasiKkn::query()
            ->whereIn('nim', $nims)
            ->where(function ($query) use ($effectivePeriodeId) {
                $query->whereNull('periode_id');
                if ($effectivePeriodeId !== null) {
                    $query->orWhere('periode_id', $effectivePeriodeId);
                }
            })
            ->pluck('nim')
            ->unique()
            ->flip();

        return $mahasiswa->map(function (Mahasiswa $m) use ($dispensasiNims) {
            $issues = json_decode($m->eligibility_issues ?? '[]', true);

            // Reconstruct checks from cached issues
            $allCheckKeys = ['status_aktif', 'no_prior_completion', 'min_sks', 'min_semester', 'min_gpa', 'ukt_payment', 'bta_ppi', 'program_prodi', 'personal_status'];
            $checks = [];

            foreach ($issues as $issue) {
                $key = (string) ($issue['key'] ?? '');
                if ($key === '') {
                    continue;
                }

                $checks[$key] = [
                    'passed' => false,
                    'key' => $key,
                    'message' => $issue['message'] ?? $this->getIssueFilterLabel($key),
                ];
            }

            foreach ($allCheckKeys as $key) {
                if (! isset($checks[$key])) {
                    $checks[$key] = ['passed' => true, 'key' => $key, 'message' => $this->getPassedMessage($key, $m)];
                }
            }

            return [
                'mahasiswa_id' => $m->id,
                'nim' => $m->nim,
                'nama' => $m->nama,
                'prodi_nama' => $m->prodi?->nama,
                'fakultas_nama' => $m->fakultas?->nama ?? $m->prodi?->fakultas?->nama,
                'sks_completed' => $m->sks_completed,
                'gpa' => $m->gpa,
                'is_bta_ppi_passed' => in_array(strtoupper(trim($m->status_bta_ppi ?? '')), ['LULUS', 'PASSED', 'SUCCESS']),
                'has_health_certificate' => ! empty($m->health_certificate_path),
                'has_parent_permission' => ! empty($m->parent_permission_path),
                'checks' => $checks,
                'is_eligible' => $m->is_eligible,
                'issues' => $issues,
                'issue_count' => count($issues),
                'has_dispensasi' => $dispensasiNims->has($m->nim),
            ];
        });
    }


    public function checkStudent(Mahasiswa $mahasiswa, Request $request): JsonResponse
    {
        $periodeId = $request->integer('periode_id') ?: null;
        $result = $this->eligibilityService->checkEligibility($mahasiswa, $periodeId);

        return $this->success($result);
    }

    public function export(Request $request)
    {
        $user = auth()->user();
        $periodeId = $request->integer('periode_id') ?: null;
        $requestedFacultyId = $request->integer('fakultas_id') ?: ($request->integer('faculty_id') ?: null);
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : $requestedFacultyId;
        $search = $request->string('search')->trim()->toString();
        $issueKey = $request->string('issue')->trim()->toString();
        $showEligible = $request->has('show_eligible') ? $request->boolean('show_eligible') : null;

        if ($this->canUseEligibilityCache($facultyId, $periodeId)) {
            $baseQuery = Mahasiswa::with(['prodi.fakultas', 'fakultas'])
                ->whereNotNull('eligibility_computed_at');

            if ($facultyId) {
                $baseQuery->where('fakultas_id', $facultyId);
            }

            if ($search !== '') {
                $baseQuery->where(function ($query) use ($search) {
                    $query->where('nim', 'ilike', "%{$search}%")
                        ->orWhere('nama', 'ilike', "%{$search}%");
                });
            }

            if ($issueKey !== '') {
                $baseQuery->whereRaw('eligibility_issues @> ?::jsonb', [json_encode([['key' => $issueKey]])]);
            }

            $eligibleRows = $showEligible === false
                ? collect()
                : (clone $baseQuery)->where('is_eligible', true)->orderBy('nama')->get();
            $notEligibleRows = $showEligible === true
                ? collect()
                : (clone $baseQuery)->where('is_eligible', false)->orderBy('nama')->get();

            $result = [
                'eligible' => $this->transformCachedStudents($eligibleRows, $periodeId)->values(),
                'not_eligible' => $this->transformCachedStudents($notEligibleRows, $periodeId)->values(),
            ];
        } else {
            $computed = $this->eligibilityService->getEligibleStudents($periodeId, $facultyId);
            $eligible = collect($computed['eligible']);
            $notEligible = collect($computed['not_eligible']);

            if ($search !== '') {
                $needle = strtolower($search);
                $eligible = $eligible->filter(fn (array $student) => str_contains(strtolower((string) ($student['nim'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($student['nama'] ?? '')), $needle))->values();
                $notEligible = $notEligible->filter(fn (array $student) => str_contains(strtolower((string) ($student['nim'] ?? '')), $needle)
                    || str_contains(strtolower((string) ($student['nama'] ?? '')), $needle))->values();
            }

            if ($issueKey !== '') {
                $eligible = $eligible->filter(fn (array $student) => collect($student['issues'] ?? [])->contains('key', $issueKey))->values();
                $notEligible = $notEligible->filter(fn (array $student) => collect($student['issues'] ?? [])->contains('key', $issueKey))->values();
            }

            $result = [
                'eligible' => $showEligible === false ? collect() : $eligible->values(),
                'not_eligible' => $showEligible === true ? collect() : $notEligible->values(),
            ];
        }
        $spreadsheet = new Spreadsheet;

        $createdSheet = false;

        if (count($result['eligible']) > 0 || $showEligible === true || $showEligible === null) {
            $sheet1 = $spreadsheet->getActiveSheet()->setTitle('Mahasiswa Eligible');
            $headers = ['No', 'NIM', 'Nama', 'Fakultas', 'Prodi', 'SKS', 'IPK', 'BTA-PPI', 'Surat Sehat', 'Izin Ortu'];
            $col = 'A';
            foreach ($headers as $header) {
                $sheet1->setCellValue("{$col}1", $header);
                $col++;
            }
            $sheet1->getStyle('A1:J1')->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '22C55E']],
            ]);
            $row = 2;
            foreach ($result['eligible'] as $i => $student) {
                $sheet1->fromArray([
                    $i + 1, $student['nim'], $student['nama'], $student['fakultas_nama'] ?? '-', $student['prodi_nama'] ?? '-',
                    $student['sks_completed'] ?? 0, $student['gpa'] ? number_format($student['gpa'], 2) : '-',
                    $student['is_bta_ppi_passed'] ? 'LULUS' : 'BELUM',
                    $student['has_health_certificate'] ? 'YA' : 'TIDAK',
                    $student['has_parent_permission'] ? 'YA' : 'TIDAK',
                ], null, "A{$row}");
                $row++;
            }

            foreach (range('A', 'J') as $column) {
                $sheet1->getColumnDimension($column)->setAutoSize(true);
            }
            $createdSheet = true;
        }

        if (count($result['not_eligible']) > 0 || $showEligible === false || $showEligible === null) {
            $sheet2 = $createdSheet
                ? $spreadsheet->createSheet()->setTitle('Tidak Eligible')
                : $spreadsheet->getActiveSheet()->setTitle('Tidak Eligible');
            $sheet2->fromArray(['No', 'NIM', 'Nama', 'Fakultas', 'Prodi', 'SKS', 'IPK', 'BTA-PPI', 'Issues'], null, 'A1');
            $sheet2->getStyle('A1:I1')->applyFromArray([
                'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
                'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'EF4444']],
            ]);
            $row = 2;
            foreach ($result['not_eligible'] as $i => $student) {
                $sheet2->fromArray([
                    $i + 1, $student['nim'], $student['nama'], $student['fakultas_nama'] ?? '-', $student['prodi_nama'] ?? '-',
                    $student['sks_completed'] ?? 0, $student['gpa'] ? number_format($student['gpa'], 2) : '-',
                    $student['is_bta_ppi_passed'] ? 'LULUS' : 'BELUM',
                    implode('; ', array_column($student['issues'], 'message')),
                ], null, "A{$row}");
                $row++;
            }

            foreach (range('A', 'I') as $column) {
                $sheet2->getColumnDimension($column)->setAutoSize(true);
            }
        }

        $exportDir = storage_path('framework/cache/exports');
        if (! is_dir($exportDir)) {
            mkdir($exportDir, 0750, true);
        }

        $tempFile = $exportDir.'/'.Str::uuid().'.xlsx';
        (new Xlsx($spreadsheet))->save($tempFile);

        return response()->download($tempFile, 'Eligibility_KKN_'.date('Y-m-d').'.xlsx')->deleteFileAfterSend(true);
    }

    /**
     * Bulk update SKS mahasiswa dari data SIAKAD (superadmin only).
     *
     * Audit fix (2026-05-12):
     *   - Kolom target sebelumnya `sks_lulus` yang sudah di-drop di migration
     *     2026_04_29_030000_sync_duplicate_sks_columns.php (merge ke
     *     `sks_completed`). Sekarang tulis ke `sks_completed` + lock field
     *     supaya sync SIAKAD berikutnya tidak timpa.
     *   - Tambah audit log.
     */
    public function bulkUpdateSks(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'updates' => ['required', 'array'],
            'updates.*.mahasiswa_id' => ['required', 'exists:mahasiswa,id'],
            'updates.*.sks_completed' => ['required', 'integer', 'min:0', 'max:250'],
        ]);

        $updated = 0;
        $affectedIds = [];
        foreach ($validated['updates'] as $item) {
            $mahasiswa = Mahasiswa::find($item['mahasiswa_id']);
            if ($mahasiswa === null) {
                continue;
            }
            $mahasiswa->sks_completed = (int) $item['sks_completed'];
            $mahasiswa->save();
            $mahasiswa->lockFields(['sks_completed']);
            $affectedIds[] = $mahasiswa->id;
            $updated++;
        }

        if ($updated > 0) {
            AuditService::log(
                'BULK_UPDATE_SKS',
                "Superadmin bulk update SKS untuk {$updated} mahasiswa",
                null,
                null,
                ['mahasiswa_ids' => $affectedIds, 'count' => $updated],
            );
        }

        return $this->success(['updated' => $updated], "{$updated} data SKS berhasil diperbarui.");
    }
}
