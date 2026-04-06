<?php

namespace App\Http\Controllers\Admin;

use App\Exports\BpjsParticipantExport;
use App\Http\Controllers\Controller;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;
use App\Traits\HandlesPagination;

class PesertaKknController extends Controller
{
    use HandlesPagination;

    private function normalizeStatus(?string $status): ?string
    {
        if ($status === null || $status === '') {
            return null;
        }

        return match ($status) {
            'menunggu' => 'pending',
            'disetujui' => 'approved',
            'ditolak' => 'rejected',
            default => $status,
        };
    }

    private function registrationQuery(Request $request, bool $approvedOnly = false)
    {
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;
        $status = $approvedOnly ? 'approved' : $this->normalizeStatus($request->input('status'));

        return PesertaKkn::with([
            'mahasiswa.user',
            'mahasiswa.fakultas',
            'mahasiswa.prodi.fakultas',
            'periode',
            'kelompok',
        ])
            ->when($request->input('search'), fn ($query, $search) => $query->search($search))
            ->when($status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->input('period_id'), fn ($query, $periodId) => $query->where('period_id', $periodId))
            ->when($facultyId, function ($query, $id) {
                $query->whereHas('mahasiswa', fn ($studentQuery) => $studentQuery->where('faculty_id', $id));
            });
    }

    /**
     * Download registration documents from local storage.
     */
    public function downloadDocument(Request $request): StreamedResponse
    {
        $path = $request->input('path');
        $user = auth()->user();
        
        if (!$path || !Storage::disk('local')->exists($path)) {
            abort(404, 'Dokumen tidak ditemukan.');
        }

        // Security check: Only allow specific folders
        if (!str_starts_with($path, 'health-certificates/') && !str_starts_with($path, 'parent-permissions/')) {
            abort(403, 'Akses folder ditolak.');
        }

        // Ownership check: If not admin, must be the owner of the document
        if (!$user->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
            $mahasiswa = \App\Models\KKN\Mahasiswa::where('user_id', $user->id)->first();
            
            if (!$mahasiswa) {
                abort(403, 'Akses identitas ditolak.');
            }

            $isOwner = ($mahasiswa->health_certificate_path === $path) || ($mahasiswa->parent_permission_path === $path);
            
            if (!$isOwner) {
                abort(403, 'Anda tidak memiliki hak akses untuk mendownload dokumen ini.');
            }
        }

        return Storage::disk('local')->download($path);
    }

    public function index(Request $request): Response
    {
        $user = auth()->user();
        $isFacultyAdmin = $user?->hasRole('faculty_admin');
        $facultyId = $isFacultyAdmin ? $user?->faculty_id : null;

        $registrations = $this->registrationQuery($request)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        // Map data to match React frontend expectations
        $registrations->through(function ($reg) {
            $mahasiswa = $reg->mahasiswa;
            $minSks = (int) \App\Models\KKN\SystemSetting::get('min_sks_registration', 100);
            $sksOk = ($mahasiswa?->sks_completed ?? 0) >= $minSks;
            $btaOk = (bool) $mahasiswa?->is_bta_ppi_passed;
            $docsOk = !empty($mahasiswa?->health_certificate_path) && !empty($mahasiswa?->parent_permission_path);
            $isEligible = $sksOk && $btaOk && $docsOk;

            // Build issue list for tooltip
            $issues = [];
            if (!$sksOk) {
                $issues[] = "SKS kurang (" . ($mahasiswa?->sks_completed ?? 0) . "/{$minSks})";
            }
            if (!$btaOk) {
                $issues[] = 'Belum lulus BTA-PPI';
            }
            if (!$docsOk) {
                $missing = [];
                if (empty($mahasiswa?->health_certificate_path)) $missing[] = 'Surat sehat';
                if (empty($mahasiswa?->parent_permission_path)) $missing[] = 'Surat izin ortu';
                $issues[] = 'Dokumen belum lengkap: ' . implode(', ', $missing);
            }

            return [
                'id' => $reg->id,
                'status' => $reg->status,
                'registration_date' => $reg->registration_date,
                'notes' => $reg->notes,
                'rejection_reason' => $reg->rejection_reason,
                'revision_count' => (int) ($reg->revision_count ?? 0),
                'resubmitted_at' => $reg->resubmitted_at?->toIso8601String(),
                'is_eligible' => $isEligible,
                'eligibility_issues' => $issues,
                'student' => [
                    'nim' => $reg->mahasiswa?->nim,
                    'name' => $reg->mahasiswa?->nama ?? $reg->mahasiswa?->user?->name ?? '-',
                    'faculty' => $reg->mahasiswa?->fakultas ? ['name' => $reg->mahasiswa->fakultas->nama] : null,
                    'program' => $reg->mahasiswa?->prodi ? ['name' => $reg->mahasiswa->prodi->nama] : null,
                ],
                'period' => $reg->periode ? ['name' => $reg->periode->name, 'id' => $reg->periode->id] : ['name' => '-', 'id' => null],
                'group' => $reg->kelompok ? ['name' => $reg->kelompok->nama_kelompok] : null,
            ];
        });

        // Statistics - OPTIMIZED: Use database-level aggregation
        $byFacultyQuery = PesertaKkn::query()
            ->selectRaw('mahasiswa.faculty_id, COUNT(*) as count')
            ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
            ->leftJoin('fakultas', 'mahasiswa.faculty_id', '=', 'fakultas.id')
            ->selectRaw('COALESCE(fakultas.nama, \'Tidak Diketahui\') as faculty_name')
            ->when($facultyId, fn ($query, $id) => $query->where('mahasiswa.faculty_id', $id))
            ->groupBy('mahasiswa.faculty_id', 'fakultas.nama')
            ->orderByDesc('count');

        $stats = [
            'total' => PesertaKkn::when($facultyId, fn($q) => $q->whereHas('mahasiswa', fn($m) => $m->where('faculty_id', $facultyId)))->count(),
            'pending' => PesertaKkn::where('status', 'pending')->when($facultyId, fn($q) => $q->whereHas('mahasiswa', fn($m) => $m->where('faculty_id', $facultyId)))->count(),
            'approved' => PesertaKkn::where('status', 'approved')->when($facultyId, fn($q) => $q->whereHas('mahasiswa', fn($m) => $m->where('faculty_id', $facultyId)))->count(),
            'rejected' => PesertaKkn::where('status', 'rejected')->when($facultyId, fn($q) => $q->whereHas('mahasiswa', fn($m) => $m->where('faculty_id', $facultyId)))->count(),
            'by_faculty' => $byFacultyQuery
                ->get()
                ->map(function ($row) {
                    return [
                        'faculty_name' => $row->faculty_name,
                        'count' => $row->count,
                    ];
                }),
        ];

        return Inertia::render('Admin/Registrations/Index', [
            'registrations' => $this->formatPaginator($registrations),
            'filters' => [
                'search' => $request->input('search'),
                'status' => $this->normalizeStatus($request->input('status')),
                'period_id' => $request->input('period_id'),
            ],
            'stats' => $stats,
        ]);
    }

    /**
     * Bulk approve registrations
     */
    public function bulkApprove(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        // WRAP IN TRANSACTION for atomicity
        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            PesertaKkn::whereIn('id', $validated['ids'])
                ->where('status', 'pending')
                ->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);
        });

        $count = count($validated['ids']);
        return redirect()->back()->with('success', "{$count} pendaftaran berhasil disetujui.");
    }

    /**
     * Bulk reject registrations
     */
    public function bulkReject(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        // WRAP IN TRANSACTION for atomicity
        \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            PesertaKkn::whereIn('id', $validated['ids'])
                ->where('status', 'pending')
                ->update([
                    'status' => 'rejected',
                    'rejection_reason' => $validated['notes'],
                    'last_rejected_at' => now(),
                    'last_rejected_by' => auth()->id(),
                ]);
        });

        $count = count($validated['ids']);
        return redirect()->back()->with('success', "{$count} pendaftaran ditolak.");
    }

    /**
     * Export registrations to Excel
     */
    public function export(Request $request): BinaryFileResponse
    {
        $registrations = $this->registrationQuery($request)
            ->orderByDesc('created_at')
            ->get();

        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        // Header
        $headers = ['No', 'NIM', 'Nama', 'Fakultas', 'Program Studi', 'Periode', 'Kelompok', 'Status', 'Tanggal Daftar'];
        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue("{$col}1", $header);
            $col++;
        }

        // Styling header
        $headerStyle = [
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID, 'color' => ['rgb' => '2563EB']],
        ];
        $sheet->getStyle('A1:I1')->applyFromArray($headerStyle);

        // Data
        $row = 2;
        foreach ($registrations as $index => $reg) {
            $sheet->setCellValue("A{$row}", $index + 1);
            $sheet->setCellValue("B{$row}", $reg->mahasiswa?->nim ?? '-');
            $sheet->setCellValue("C{$row}", $reg->mahasiswa?->nama ?? '-');
            $sheet->setCellValue("D{$row}", $reg->mahasiswa?->fakultas?->nama ?? '-');
            $sheet->setCellValue("E{$row}", $reg->mahasiswa?->prodi?->nama ?? '-');
            $sheet->setCellValue("F{$row}", $reg->periode?->name ?? '-');
            $sheet->setCellValue("G{$row}", $reg->kelompok?->nama_kelompok ?? 'Belum ada');
            $sheet->setCellValue("H{$row}", ucfirst($reg->status));
            $sheet->setCellValue("I{$row}", $reg->created_at->format('d M Y H:i'));

            // Color code status
            $statusColor = [
                'pending' => 'FFA500',
                'approved' => '22C55E',
                'rejected' => 'EF4444',
            ][$reg->status] ?? '000000';

            $sheet->getStyle("H{$row}")->getFont()->getColor()->setRGB($statusColor);
            $row++;
        }

        // Auto-size columns
        foreach (range('A', 'I') as $col) {
            $sheet->getColumnDimension($col)->setAutoSize(true);
        }

        $filename = 'data-pendaftaran-kkn-' . date('Y-m-d-His') . '.xlsx';
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'kkn_export_');
        $writer->save($tempFile . '.xlsx');
        $finalFile = $tempFile . '.xlsx';

        return response()->download($finalFile, $filename)->deleteFileAfterSend(true);
    }

    public function exportBpjs(Request $request): BinaryFileResponse
    {
        $registrations = $this->registrationQuery($request, approvedOnly: true)
            ->orderBy('approved_at')
            ->orderBy('created_at')
            ->get();

        return Excel::download(
            new BpjsParticipantExport($registrations),
            'peserta-bpjs-kkn.xlsx'
        );
    }

    public function show(PesertaKkn $pesertaKkn): Response
    {
        $pesertaKkn->load('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'dokumen', 'rejector');

        return Inertia::render('Admin/Registrations/Show', [
            'registration' => $pesertaKkn,
        ]);
    }

    public function approve(PesertaKkn $pesertaKkn): RedirectResponse
    {
        // Proteksi: Cek Kapasitas Kelompok jika mahasiswa sudah diplot ke kelompok
        if ($pesertaKkn->kelompok_id) {
            $kelompok = $pesertaKkn->kelompok()->withCount(['peserta' => function ($q) {
                $q->where('status', 'approved');
            }])->first();

            if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
                return redirect()->back()->withErrors(['error' => "Gagal menyetujui. Kelompok {$kelompok->nama_kelompok} sudah mencapai batas maksimal kapasitas ({$kelompok->capacity})."]);
            }
        }

        $pesertaKkn->update([
            'status' => 'approved',
            'approved_at' => now(),
            'approved_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function reject(Request $request, PesertaKkn $pesertaKkn): RedirectResponse
    {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $pesertaKkn->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['notes'],
            'last_rejected_at' => now(),
            'last_rejected_by' => auth()->id(),
        ]);

        return redirect()->back()->with('success', 'Pendaftaran ditolak.');
    }

    public function assignGroup(Request $request, PesertaKkn $pesertaKkn): RedirectResponse
    {
        $validated = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
        ]);

        // Proteksi: Cek Kapasitas Kelompok Tujuan
        $kelompok = \App\Models\KKN\KelompokKkn::withCount(['peserta' => function ($q) {
            $q->where('status', 'approved');
        }])->find($validated['kelompok_id']);

        if ($kelompok && $kelompok->peserta_count >= $kelompok->capacity) {
            return redirect()->back()->withErrors(['error' => "Gagal menempatkan. Kelompok tujuan {$kelompok->nama_kelompok} sudah penuh."]);
        }

        $pesertaKkn->update([
            'kelompok_id' => $validated['kelompok_id'],
            'role' => 'Anggota', // Reset to Anggota when moving group
        ]);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }

    public function makeLeader(PesertaKkn $registration): RedirectResponse
    {
        // Fix: Validate student is approved and in a group
        if (!$registration->kelompok_id) {
            return redirect()->back()->withErrors(['error' => 'Mahasiswa harus ditempatkan di kelompok terlebih dahulu.']);
        }

        if ($registration->status !== 'approved') {
            return redirect()->back()->withErrors(['error' => 'Hanya mahasiswa yang sudah disetujui yang dapat menjadi ketua kelompok.']);
        }

        // WRAP IN TRANSACTION: Ensure atomicity
        \Illuminate\Support\Facades\DB::transaction(function () use ($registration) {
            // Reset all other members in the SAME group to 'Anggota'
            PesertaKkn::where('kelompok_id', $registration->kelompok_id)
                ->where('id', '!=', $registration->id)
                ->update(['role' => 'Anggota']);

            // Set this student as 'Ketua'
            $registration->update(['role' => 'Ketua']);
        });

        return redirect()->back()->with('success', "{$registration->mahasiswa->nama} kini resmi menjadi Ketua Kelompok.");
    }
}
