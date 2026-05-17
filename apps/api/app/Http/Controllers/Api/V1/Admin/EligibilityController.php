<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Mahasiswa;
use App\Services\AuditService;
use App\Services\EligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
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
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : ($request->integer('faculty_id') ?: null);
        $showEligible = $request->boolean('show_eligible', true);
        $search = $request->string('search')->trim()->toString();
        $issueKey = $request->string('issue')->trim()->toString();
        $perPage = 20;
        $page = $request->integer('page', 1);

        // Check if eligibility cache exists
        $cacheExists = Mahasiswa::whereNotNull('eligibility_computed_at')->exists();

        if (! $cacheExists) {
            // Fallback: compute on-the-fly (slow, first-time only)
            $periodeId = $request->integer('period_id') ?: null;
            $result = $this->eligibilityService->getEligibleStudents($periodeId, $facultyId);

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
                ],
            ]);
        }

        // FAST PATH: Query from cached eligibility columns with DB-level pagination
        $query = Mahasiswa::with(['prodi.fakultas', 'fakultas'])
            ->where('is_eligible', $showEligible)
            ->whereNotNull('eligibility_computed_at');

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
            $query->where('eligibility_issues', 'like', '%"key":"'.$issueKey.'"%');
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
        $students = $paginated->getCollection()->map(function (Mahasiswa $m) {
            $issues = json_decode($m->eligibility_issues ?? '[]', true);

            // Reconstruct checks from cached issues
            $allCheckKeys = ['no_prior_completion', 'min_sks', 'min_semester', 'min_gpa', 'ukt_payment', 'bta_ppi', 'program_prodi', 'personal_status'];
            $failedKeys = array_column($issues, 'key');
            $checks = [];

            foreach ($allCheckKeys as $key) {
                $failedIssue = collect($issues)->firstWhere('key', $key);
                if ($failedIssue) {
                    $checks[$key] = ['passed' => false, 'key' => $key, 'message' => $failedIssue['message']];
                } else {
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
                'has_dispensasi' => false,
            ];
        });

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
            ],
        ]);
    }

    /**
     * Get a human-readable passed message for a check key (cached mode).
     */
    private function getPassedMessage(string $key, Mahasiswa $m): string
    {
        return match ($key) {
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
        $facultyId = $user->hasRole('faculty_admin') ? $user->fakultas_id : ($request->integer('fakultas_id') ?: null);

        $result = $this->eligibilityService->getEligibleStudents($periodeId, $facultyId);
        $spreadsheet = new Spreadsheet;

        // Sheet 1: Eligible
        $sheet1 = $spreadsheet->getActiveSheet()->setTitle('Mahasiswa Eligible');
        $headers = ['No', 'NIM', 'Nama', 'Fakultas', 'Prodi', 'SKS', 'IPK', 'BTA-PPI', 'Surat Sehat', 'Izin Ortu'];
        $col = 'A';
        foreach ($headers as $h) {
            $sheet1->setCellValue("{$col}1", $h);
            $col++;
        }
        $sheet1->getStyle('A1:J1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => '22C55E']],
        ]);
        $row = 2;
        foreach ($result['eligible'] as $i => $s) {
            $sheet1->fromArray([
                $i + 1, $s['nim'], $s['nama'], $s['fakultas_nama'] ?? '-', $s['prodi_nama'] ?? '-',
                $s['sks_completed'] ?? 0, $s['gpa'] ? number_format($s['gpa'], 2) : '-',
                $s['is_bta_ppi_passed'] ? 'LULUS' : 'BELUM',
                $s['has_health_certificate'] ? 'YA' : 'TIDAK',
                $s['has_parent_permission'] ? 'YA' : 'TIDAK',
            ], null, "A{$row}");
            $row++;
        }

        // Sheet 2: Not Eligible
        $sheet2 = $spreadsheet->createSheet()->setTitle('Tidak Eligible');
        $sheet2->fromArray(['No', 'NIM', 'Nama', 'Fakultas', 'Prodi', 'SKS', 'IPK', 'BTA-PPI', 'Issues'], null, 'A1');
        $sheet2->getStyle('A1:I1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'color' => ['rgb' => 'EF4444']],
        ]);
        $row = 2;
        foreach ($result['not_eligible'] as $i => $s) {
            $sheet2->fromArray([
                $i + 1, $s['nim'], $s['nama'], $s['fakultas_nama'] ?? '-', $s['prodi_nama'] ?? '-',
                $s['sks_completed'] ?? 0, $s['gpa'] ? number_format($s['gpa'], 2) : '-',
                $s['is_bta_ppi_passed'] ? 'LULUS' : 'BELUM',
                implode('; ', array_column($s['issues'], 'message')),
            ], null, "A{$row}");
            $row++;
        }

        foreach (range('A', 'J') as $c) {
            $sheet1->getColumnDimension($c)->setAutoSize(true);
            $sheet2->getColumnDimension($c)->setAutoSize(true);
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
