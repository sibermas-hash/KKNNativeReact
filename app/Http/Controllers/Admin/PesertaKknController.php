<?php

namespace App\Http\Controllers\Admin;

use App\Exports\BpjsParticipantExport;
use App\Http\Controllers\Controller;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\PesertaKkn;
use App\Services\AutomaticGroupPlacementService;
use App\Services\GroupSelectionService;
use App\Services\KKN\KknRequirementService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Inertia\Inertia;
use Inertia\Response;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

use Illuminate\Support\Facades\Storage;
use App\Traits\HandlesPagination;

class PesertaKknController extends Controller
{
    use HandlesPagination;

    private function documentDownloadUrl(?string $path): ?string
    {
        if (blank($path)) {
            return null;
        }

        if (filter_var($path, FILTER_VALIDATE_URL)) {
            return $path;
        }

        return route('admin.pendaftaran.berkas.unduh', ['path' => $path]);
    }

    private function registrationDocuments(PesertaKkn $pesertaKkn): array
    {
        $existingDocuments = collect($pesertaKkn->dokumen ?? [])
            ->map(function ($doc) {
                $path = $doc->file_path;

                return [
                    'id' => $doc->id,
                    'document_type' => $doc->document_type ?: 'Dokumen',
                    'file_name' => $doc->file_name ?: ($path ? basename($path) : null),
                    'file_path' => $this->documentDownloadUrl($path),
                    'status' => $doc->status ?: 'document_submitted',
                ];
            });

        $fallbackDocuments = collect([
            [
                'id' => 'health-certificate',
                'document_type' => 'Surat sehat',
                'file_name' => $pesertaKkn->mahasiswa?->health_certificate_path
                    ? basename($pesertaKkn->mahasiswa->health_certificate_path)
                    : null,
                'file_path' => $this->documentDownloadUrl($pesertaKkn->mahasiswa?->health_certificate_path),
                'status' => 'document_submitted',
                'storage_path' => $pesertaKkn->mahasiswa?->health_certificate_path,
            ],
            [
                'id' => 'parent-permission',
                'document_type' => 'Surat izin orang tua',
                'file_name' => $pesertaKkn->mahasiswa?->parent_permission_path
                    ? basename($pesertaKkn->mahasiswa->parent_permission_path)
                    : null,
                'file_path' => $this->documentDownloadUrl($pesertaKkn->mahasiswa?->parent_permission_path),
                'status' => 'document_submitted',
                'storage_path' => $pesertaKkn->mahasiswa?->parent_permission_path,
            ],
        ])
            ->filter(fn (array $doc) => filled($doc['storage_path']))
            ->reject(function (array $doc) use ($existingDocuments) {
                return $existingDocuments->contains(function (array $existing) use ($doc) {
                    return $existing['file_path'] === $doc['file_path']
                        || $existing['file_name'] === $doc['file_name'];
                });
            })
            ->map(fn (array $doc) => collect($doc)->except('storage_path')->all());

        return $existingDocuments
            ->concat($fallbackDocuments)
            ->values()
            ->all();
    }

    private function validateAssignedGroupForReview(
        PesertaKkn $pesertaKkn,
        GroupSelectionService $groupSelectionService,
        string $errorKey = 'kelompok_id'
    ): void {
        if (! $pesertaKkn->kelompok_id) {
            return;
        }

        $pesertaKkn->loadMissing('mahasiswa');

        if (! $pesertaKkn->mahasiswa) {
            throw ValidationException::withMessages([
                $errorKey => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
            ]);
        }

        $kelompok = KelompokKkn::query()
            ->whereKey($pesertaKkn->kelompok_id)
            ->where('period_id', $pesertaKkn->period_id)
            ->where('status', 'active')
            ->lockForUpdate()
            ->first();

        if (! $kelompok) {
            throw ValidationException::withMessages([
                $errorKey => 'Kelompok yang dipilih sudah tidak aktif atau tidak berada pada periode pendaftaran yang sama.',
            ]);
        }

        try {
            $groupSelectionService->validateGroupAcceptance($kelompok, $pesertaKkn->mahasiswa, $pesertaKkn->id);
        } catch (ValidationException $exception) {
            $message = collect($exception->errors())->flatten()->first() ?: 'Kelompok yang dipilih tidak valid.';

            throw ValidationException::withMessages([
                $errorKey => $message,
            ]);
        }
    }

    private function prepareGroupPlacementForApproval(
        PesertaKkn $registration,
        GroupSelectionService $groupSelectionService,
        AutomaticGroupPlacementService $automaticGroupPlacementService,
        string $errorKey = 'kelompok_id',
    ): PesertaKkn {
        $registration->loadMissing(['mahasiswa', 'periode']);

        if (! $registration->mahasiswa) {
            throw ValidationException::withMessages([
                $errorKey => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
            ]);
        }

        if ($registration->periode?->usesAutomaticPlacementAfterApproval() && ! $registration->kelompok_id) {
            try {
                $group = $automaticGroupPlacementService->selectGroupForStudent(
                    $registration->mahasiswa,
                    (int) $registration->period_id,
                );
            } catch (ValidationException $exception) {
                $message = collect($exception->errors())->flatten()->first()
                    ?: 'Belum ada kelompok yang valid untuk penempatan otomatis.';

                throw ValidationException::withMessages([
                    $errorKey => $message,
                ]);
            }

            return $groupSelectionService->assignGroup($registration, $registration->mahasiswa, $group->id);
        }

        $this->validateAssignedGroupForReview($registration, $groupSelectionService, $errorKey);

        return $registration;
    }

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
        $status = $approvedOnly ? 'approved' : $this->normalizeStatus($request->input('status'));

        $query = PesertaKkn::with([
            'mahasiswa:id,user_id,nim,nama,faculty_id,program_id,nik,mother_name,gpa,is_bta_ppi_passed,sks_completed,health_certificate_path,parent_permission_path',
            'mahasiswa.user:id,name,email,address,phone',
            'mahasiswa.fakultas:id,code,nama',
            'mahasiswa.prodi:id,code,nama,faculty_id',
            'mahasiswa.prodi.fakultas:id,code,nama',
            'periode:id,periode,name,program_type,program_subtype,registration_mode,placement_mode,start_date,end_date',
            'kelompok:id,period_id,nama_kelompok,code',
        ])
            ->when($request->input('search'), fn ($query, $search) => $query->search($search))
            ->when($status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->input('period_id'), fn ($query, $periodId) => $query->where('period_id', $periodId));

        // Use centralized Faculty Scoping service
        return \App\Services\KKN\FacultyScopeService::apply($query, 'mahasiswa.faculty_id');
    }

    /**
     * Download registration documents from local storage.
     */
    public function downloadDocument(Request $request): BinaryFileResponse
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

        // SECURITY: Additional path traversal prevention
        // Resolve the actual path and verify it's within expected directories
        $storageRoot = Storage::disk('local')->path('');
        $fullPath = realpath($storageRoot . '/' . $path);

        if (!$fullPath) {
            abort(404, 'Dokumen tidak ditemukan.');
        }

        // Verify the resolved path is still within allowed directories
        $allowedPrefixes = ['health-certificates', 'parent-permissions'];
        $isAllowed = false;
        foreach ($allowedPrefixes as $prefix) {
            if (str_starts_with($fullPath, realpath($storageRoot . '/' . $prefix))) {
                $isAllowed = true;
                break;
            }
        }

        if (!$isAllowed) {
            abort(403, 'Akses ditolak: Path traversal terdeteksi.');
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

        return response()->download(Storage::disk('local')->path($path));
    }

    public function index(Request $request, KknRequirementService $kknRequirementService): Response
    {
        $registrations = $this->registrationQuery($request)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        // Map data to match React frontend expectations
        $registrations->through(function (PesertaKkn $reg) use ($kknRequirementService) {
            $mahasiswa = $reg->mahasiswa;
            $periode = $reg->periode;
            
            $issues = [];
            if ($mahasiswa && $periode) {
                $issues = $kknRequirementService->validate($mahasiswa, $periode);
            }
            
            $isEligible = empty($issues);

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

        $statsQuery = PesertaKkn::query()
            ->selectRaw('mahasiswa.faculty_id, COUNT(*) as count')
            ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
            ->leftJoin('fakultas', 'mahasiswa.faculty_id', '=', 'fakultas.id')
            ->selectRaw('COALESCE(fakultas.nama, \'Tidak Diketahui\') as faculty_name')
            ->groupBy('mahasiswa.faculty_id', 'fakultas.nama')
            ->orderByDesc('count');

        // Apply centralized scoping to stats query
        $statsQuery = \App\Services\KKN\FacultyScopeService::apply($statsQuery, 'mahasiswa.faculty_id');

        $scopedTotalQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query(), 'mahasiswa.faculty_id');
        $scopedPendingQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query()->where('status', 'pending'), 'mahasiswa.faculty_id');
        $scopedApprovedQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query()->where('status', 'approved'), 'mahasiswa.faculty_id');
        $scopedRejectedQuery = \App\Services\KKN\FacultyScopeService::apply(PesertaKkn::query()->where('status', 'rejected'), 'mahasiswa.faculty_id');

        $stats = [
            'total' => $scopedTotalQuery->count(),
            'pending' => $scopedPendingQuery->count(),
            'approved' => $scopedApprovedQuery->count(),
            'rejected' => $scopedRejectedQuery->count(),
            'by_faculty' => $statsQuery
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
    public function bulkApprove(
        Request $request,
        GroupSelectionService $groupSelectionService,
        AutomaticGroupPlacementService $automaticGroupPlacementService,
    ): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        $count = \Illuminate\Support\Facades\DB::transaction(function () use (
            $validated,
            $groupSelectionService,
            $automaticGroupPlacementService,
        ) {
            // FIX C8: Add faculty scoping for faculty_admin users
            $registrations = PesertaKkn::query()
                ->with('mahasiswa')
                ->whereIn('id', $validated['ids'])
                ->where('status', 'pending')
                ->when(auth()->user()->hasRole('faculty_admin'), function ($query) {
                    $query->whereHas('mahasiswa', function ($q) {
                        $q->where('faculty_id', auth()->user()->faculty_id);
                    });
                })
                ->lockForUpdate()
                ->get();

            /** @var PesertaKkn $registration */
            foreach ($registrations as $registration) {
                $this->prepareGroupPlacementForApproval(
                    $registration,
                    $groupSelectionService,
                    $automaticGroupPlacementService,
                    'ids'
                );
            }

            /** @var PesertaKkn $registration */
            foreach ($registrations as $registration) {
                $registration->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);
            }

            return $registrations->count();
        });

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

        // WRAP IN TRANSACTION for atomicity with row-level locking
        $count = \Illuminate\Support\Facades\DB::transaction(function () use ($validated) {
            // FIX C8: Add faculty scoping for faculty_admin users
            $affected = PesertaKkn::whereIn('id', $validated['ids'])
                ->where('status', 'pending')
                ->when(auth()->user()->hasRole('faculty_admin'), function ($query) {
                    $query->whereHas('mahasiswa', function ($q) {
                        $q->where('faculty_id', auth()->user()->faculty_id);
                    });
                })
                ->lockForUpdate()
                ->update([
                    'status' => 'rejected',
                    'rejection_reason' => $validated['notes'],
                    'last_rejected_at' => now(),
                    'last_rejected_by' => auth()->id(),
                ]);

            return $affected;
        });

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

        // SECURITY: Use Laravel's storage path instead of system temp directory
        // This prevents race conditions and orphaned temp files
        $exportDir = storage_path('framework/cache/exports');
        if (!is_dir($exportDir)) {
            mkdir($exportDir, 0750, true); // Restrictive permissions
        }

        $tempFile = $exportDir . '/' . \Illuminate\Support\Str::uuid() . '.xlsx';
        try {
            $writer->save($tempFile);
            return response()->download($tempFile, $filename)->deleteFileAfterSend(true);
        } catch (\Throwable $e) {
            // Clean up on error
            if (file_exists($tempFile)) {
                unlink($tempFile);
            }
            \Illuminate\Support\Facades\Log::error('Export failed', ['exception' => $e]);
            abort(500, 'Gagal mengekspor data.');
        }
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

    public function show(PesertaKkn $pesertaKkn, KknRequirementService $kknRequirementService): Response
    {
        $pesertaKkn->load('mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'dokumen', 'rejector');

        $registration = $pesertaKkn->toArray();
        $registration['dokumen'] = $this->registrationDocuments($pesertaKkn);
        if ($pesertaKkn->periode) {
            $registration['periode'] = array_merge($registration['periode'] ?? [], [
                'registration_mode' => $pesertaKkn->periode->registration_mode,
                'placement_mode' => $pesertaKkn->periode->placement_mode,
                'program_type' => $pesertaKkn->periode->program_type,
                'program_subtype' => $pesertaKkn->periode->program_subtype,
                'governance' => $pesertaKkn->periode->governance(),
                'guide' => $kknRequirementService->describe($pesertaKkn->periode),
            ]);
        }

        return Inertia::render('Admin/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(
        PesertaKkn $pesertaKkn,
        GroupSelectionService $groupSelectionService,
        AutomaticGroupPlacementService $automaticGroupPlacementService,
    ): RedirectResponse
    {
        \Illuminate\Support\Facades\DB::transaction(function () use ($pesertaKkn, $groupSelectionService, $automaticGroupPlacementService) {
            $registration = PesertaKkn::query()
                ->with(['mahasiswa', 'periode'])
                ->lockForUpdate()
                ->findOrFail($pesertaKkn->id);

            $registration = $this->prepareGroupPlacementForApproval(
                $registration,
                $groupSelectionService,
                $automaticGroupPlacementService,
            );

            $registration->update([
                'status' => 'approved',
                'approved_at' => now(),
                'approved_by' => auth()->id(),
            ]);
        });

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

    public function assignGroup(Request $request, PesertaKkn $pesertaKkn, GroupSelectionService $groupSelectionService): RedirectResponse
    {
        $validated = $request->validate([
            'kelompok_id' => ['required', 'integer'],
        ]);

        \Illuminate\Support\Facades\DB::transaction(function () use ($pesertaKkn, $validated, $groupSelectionService) {
            $registration = PesertaKkn::query()
                ->with('mahasiswa')
                ->lockForUpdate()
                ->findOrFail($pesertaKkn->id);

            if (! $registration->mahasiswa) {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Data mahasiswa pada pendaftaran ini tidak ditemukan.',
                ]);
            }

            if ($registration->status !== 'approved') {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Mahasiswa hanya dapat dipindahkan ke kelompok setelah pendaftaran disetujui admin.',
                ]);
            }

            $kelompok = KelompokKkn::query()
                ->whereKey($validated['kelompok_id'])
                ->where('period_id', $registration->period_id)
                ->where('status', 'active')
                ->lockForUpdate()
                ->first();

            if (! $kelompok) {
                throw ValidationException::withMessages([
                    'kelompok_id' => 'Kelompok tujuan tidak ditemukan pada periode yang sama atau statusnya tidak aktif.',
                ]);
            }

            $excludeRegistrationId = $registration->kelompok_id === $kelompok->id
                ? $registration->id
                : null;

            $groupSelectionService->validateGroupAcceptance($kelompok, $registration->mahasiswa, $excludeRegistrationId);

            $groupSelectionService->assignGroup($registration, $registration->mahasiswa, $kelompok->id);
            $registration->update(['role' => 'Anggota']);
        });

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

        // FIX C16: Add faculty scope verification for faculty_admin users
        if (auth()->user()->hasRole('faculty_admin')) {
            $studentFacultyId = $registration->mahasiswa?->faculty_id;
            if ($studentFacultyId !== auth()->user()->faculty_id) {
                return redirect()->back()->withErrors(['error' => 'Anda hanya dapat mengubah ketua kelompok untuk mahasiswa di fakultas Anda.']);
            }
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
