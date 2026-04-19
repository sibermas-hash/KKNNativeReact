<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Services\KKN\FacultyScopeService;
use App\Services\KKN\KknRequirementService;
use App\Services\KKN\RegistrationApprovalService;
use App\Services\KKN\RegistrationExportService;
use App\Traits\HandlesPagination;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class PesertaKknController extends Controller
{
    use HandlesPagination;

    public function __construct(
        private readonly RegistrationApprovalService $registrationService
    ) {}

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
            'mahasiswa:id,user_id,nim,nama,fakultas_id,prodi_id,nik,mother_name,gpa,status_bta_ppi,sks_completed,health_certificate_path,parent_permission_path',
            'mahasiswa.user:id,name,email,address,phone',
            'mahasiswa.fakultas:id,code,nama',
            'mahasiswa.prodi:id,code,nama,fakultas_id',
            'mahasiswa.prodi.fakultas:id,code,nama',
            'periode:id,periode,name,program_type,program_subtype,registration_mode,placement_mode,start_date,end_date',
            'kelompok:id,periode_id,nama_kelompok,code',
            'dokumen:id,peserta_kkn_id,document_type',
        ])
            ->when($request->input('search'), fn ($query, $search) => $query->search($search))
            ->when($status, fn ($query, $value) => $query->where('status', $value))
            ->when($request->input('periode_id'), fn ($query, $periodId) => $query->where('periode_id', $periodId));

        // Use centralized Faculty Scoping service
        return FacultyScopeService::apply($query, 'mahasiswa.fakultas_id');
    }

    /**
     * Download registration documents from local storage.
     */
    public function downloadDocument(
        Request $request,
        RegistrationApprovalService $approvalService
    ): mixed {
        $path = $request->input('path');
        $user = auth()->user();

        // The service now handles security checks and returns either a download or a redirect
        return $approvalService->downloadDocument($path, $user);
    }

    public function index(Request $request, KknRequirementService $kknRequirementService): Response
    {
        $registrations = $this->registrationQuery($request)
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Operational/Registrations/Index', [
            'registrations' => Inertia::defer(function () use ($registrations, $kknRequirementService) {
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
                            'phone' => $reg->mahasiswa?->user?->phone,
                            'wa_link' => $reg->mahasiswa?->user?->phone
                                ? 'https://wa.me/'.preg_replace('/^0/', '62', preg_replace('/[^0-9]/', '', $reg->mahasiswa->user->phone))
                                : null,
                            'faculty' => $reg->mahasiswa?->fakultas ? ['name' => $reg->mahasiswa->fakultas->nama] : null,
                            'program' => $reg->mahasiswa?->prodi ? ['name' => $reg->mahasiswa->prodi->nama] : null,
                        ],
                        'period' => $reg->periode ? ['name' => $reg->periode->name, 'id' => $reg->periode->id] : ['name' => '-', 'id' => null],
                        'group' => $reg->kelompok ? ['name' => $reg->kelompok->nama_kelompok] : null,
                        'documents' => [
                            'health_cert' => ! empty($mahasiswa?->health_certificate_path),
                            'parent_permit' => ! empty($mahasiswa?->parent_permission_path),
                            'krs' => $reg->dokumen->contains('document_type', 'krs'),
                            'pembayaran' => $reg->dokumen->contains('document_type', 'pembayaran') || $reg->dokumen->contains('document_type', 'payment'),
                            'asuransi' => $reg->dokumen->contains('document_type', 'asuransi'),
                        ],
                    ];
                });

                return $this->formatPaginator($registrations);
            }),
            'filters' => [
                'search' => $request->input('search'),
                'status' => $this->normalizeStatus($request->input('status')),
                'periode_id' => $request->input('periode_id'),
            ],
            'stats' => Inertia::defer(function () {
                $statsQuery = FacultyScopeService::apply(
                    PesertaKkn::query()
                        ->selectRaw('mahasiswa.fakultas_id, COUNT(*) as count')
                        ->join('mahasiswa', 'peserta_kkn.mahasiswa_id', '=', 'mahasiswa.id')
                        ->leftJoin('fakultas', 'mahasiswa.fakultas_id', '=', 'fakultas.id')
                        ->selectRaw('COALESCE(fakultas.nama, \'Tidak Diketahui\') as faculty_name')
                        ->groupBy('mahasiswa.fakultas_id', 'fakultas.nama')
                        ->orderByDesc('count'),
                    'mahasiswa.fakultas_id'
                );

                return [
                    'total' => FacultyScopeService::apply(PesertaKkn::query(), 'mahasiswa.fakultas_id')->count(),
                    'pending' => FacultyScopeService::apply(PesertaKkn::query()->where('status', 'pending'), 'mahasiswa.fakultas_id')->count(),
                    'approved' => FacultyScopeService::apply(PesertaKkn::query()->where('status', 'approved'), 'mahasiswa.fakultas_id')->count(),
                    'rejected' => FacultyScopeService::apply(PesertaKkn::query()->where('status', 'rejected'), 'mahasiswa.fakultas_id')->count(),
                    'by_faculty' => $statsQuery->get()->map(fn ($row) => [
                        'faculty_name' => $row->faculty_name,
                        'count' => $row->count,
                    ]),
                ];
            }),
            'byTypeStats' => Inertia::defer(fn () => PesertaKkn::query()
                ->join('periode', 'peserta_kkn.periode_id', '=', 'periode.id')
                ->selectRaw('periode.id as periode_id, periode.name as period_name, periode.program_type, periode.kuota')
                ->selectRaw('COUNT(*) as total_pendaftar')
                ->selectRaw("SUM(CASE WHEN peserta_kkn.status = 'pending' THEN 1 ELSE 0 END) as pending")
                ->selectRaw("SUM(CASE WHEN peserta_kkn.status = 'approved' THEN 1 ELSE 0 END) as approved")
                ->selectRaw("SUM(CASE WHEN peserta_kkn.status = 'rejected' THEN 1 ELSE 0 END) as rejected")
                ->groupBy('periode.id', 'periode.name', 'periode.program_type', 'periode.kuota')
                ->orderBy('periode.id')
                ->get()
                ->map(fn ($row) => [
                    'periode_id' => $row->periode_id,
                    'jenis' => $row->period_name,
                    'program_type' => $row->program_type,
                    'kuota' => (int) $row->kuota,
                    'pendaftar' => (int) $row->total_pendaftar,
                    'pending' => (int) $row->pending,
                    'setuju' => (int) $row->approved,
                    'tolak' => (int) $row->rejected,
                ])
            ),
            'periods' => Inertia::defer(fn () => Periode::orderByDesc('is_active')->orderByDesc('periode')->get(['id', 'name', 'periode'])),
        ]);
    }

    /**
     * Bulk approve registrations
     */
    public function bulkApprove(
        Request $request,
    ): RedirectResponse {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
        ]);

        $count = $this->registrationService->bulkApprove(
            $validated['ids'],
            auth()->id(),
            auth()->user()->hasRole('faculty_admin'),
            auth()->user()->fakultas_id,
        );

        return redirect()->back()->with('success', "{$count} pendaftaran berhasil disetujui.");
    }

    /**
     * Bulk reject registrations
     */
    public function bulkReject(
        Request $request,
    ): RedirectResponse {
        $validated = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['required', 'integer', 'exists:peserta_kkn,id'],
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $count = $this->registrationService->bulkReject(
            $validated['ids'],
            $validated['notes'],
            auth()->id(),
            auth()->user()->hasRole('faculty_admin'),
            auth()->user()->fakultas_id,
        );

        return redirect()->back()->with('success', "{$count} pendaftaran ditolak.");
    }

    /**
     * Export registrations to Excel
     */
    public function export(
        Request $request,
        RegistrationExportService $exportService
    ): BinaryFileResponse {
        $query = $this->registrationQuery($request)
            ->orderByDesc('created_at');

        return $exportService->exportToExcel($query);
    }

    /**
     * Ekspor biodata lengkap peserta KKN yang sudah disetujui
     * untuk keperluan pendaftaran BPJS Ketenagakerjaan oleh admin LPPM.
     */
    public function exportBiodata(
        Request $request,
        RegistrationExportService $exportService
    ): BinaryFileResponse {
        $query = $this->registrationQuery($request, approvedOnly: true)
            ->orderBy('approved_at')
            ->orderBy('created_at');

        return $exportService->exportBiodata($query);
    }

    /**
     * Ekspor data peserta khusus untuk format pendaftaran BPJS Ketenagakerjaan.
     */
    public function exportBpjs(
        Request $request,
        RegistrationExportService $exportService
    ): BinaryFileResponse {
        $query = $this->registrationQuery($request, approvedOnly: true)
            ->orderBy('approved_at')
            ->orderBy('created_at');

        return $exportService->exportBpjs($query);
    }

    private function registrationDocuments(PesertaKkn $pesertaKkn): array
    {
        $documents = [];

        $typeLabels = [
            'krs' => 'KRS (Kartu Rencana Studi)',
            'pembayaran' => 'Bukti Pembayaran UKT/SPP',
            'payment' => 'Bukti Pembayaran UKT/SPP',
            'asuransi' => 'Bukti Asuransi',
            'health_certificate' => 'Surat Keterangan Sehat',
            'parent_permission' => 'Surat Izin Orang Tua',
            'photo' => 'Pas Foto',
            'ktp' => 'Kartu Tanda Mahasiswa (KTM)',
            'surat_pernyataan' => 'Surat Pernyataan',
            'surat_rekomendasi' => 'Surat Rekomendasi Prodi',
        ];

        // Include uploaded documents from dokumen relation
        foreach ($pesertaKkn->dokumen as $doc) {
            $docType = $doc->document_type;
            $documents[] = [
                'id' => $doc->id,
                'document_type' => $typeLabels[$docType] ?? (ucwords(str_replace('_', ' ', $docType)) ?: 'Berkas'),
                'file_name' => $doc->file_name,
                'file_path' => $doc->file_path,
                'status' => $doc->status,
            ];
        }

        // Include health certificate and parent permission from mahasiswa
        $mahasiswa = $pesertaKkn->mahasiswa;
        if ($mahasiswa?->health_certificate_path) {
            $documents[] = [
                'id' => 0,
                'document_type' => 'Surat Keterangan Sehat',
                'file_name' => basename($mahasiswa->health_certificate_path),
                'file_path' => $mahasiswa->health_certificate_path,
                'status' => 'uploaded',
            ];
        }
        if ($mahasiswa?->parent_permission_path) {
            $documents[] = [
                'id' => 0,
                'document_type' => 'Surat Izin Orang Tua',
                'file_name' => basename($mahasiswa->parent_permission_path),
                'file_path' => $mahasiswa->parent_permission_path,
                'status' => 'uploaded',
            ];
        }

        return $documents;
    }

    public function show(PesertaKkn $pesertaKkn, KknRequirementService $kknRequirementService): Response
    {
        $pesertaKkn->load('mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'periode', 'kelompok', 'dokumen', 'rejector');

        $registration = $pesertaKkn->toArray();
        
        $mahasiswa = $pesertaKkn->mahasiswa;
        $btaStatus = strtoupper(trim($mahasiswa?->status_bta_ppi ?? ''));
        $registration['mahasiswa']['is_bta_ppi_passed'] = in_array($btaStatus, ['LULUS', 'PASSED', 'SUCCESS']);
        
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

        return Inertia::render('Admin/Operational/Registrations/Show', [
            'registration' => $registration,
        ]);
    }

    public function approve(
        PesertaKkn $pesertaKkn,
    ): RedirectResponse {
        $this->registrationService->approve($pesertaKkn, auth()->id());

        return redirect()->back()->with('success', 'Pendaftaran berhasil disetujui.');
    }

    public function reject(
        Request $request,
        PesertaKkn $pesertaKkn,
    ): RedirectResponse {
        $validated = $request->validate([
            'notes' => ['required', 'string', 'max:1000'],
        ]);

        $this->registrationService->reject($pesertaKkn, $validated['notes'], auth()->id());

        return redirect()->back()->with('success', 'Pendaftaran ditolak.');
    }

    public function assignGroup(
        Request $request,
        PesertaKkn $pesertaKkn,
    ): RedirectResponse {
        $validated = $request->validate([
            'kelompok_id' => ['required', 'integer'],
        ]);

        $this->registrationService->assignGroup($pesertaKkn, $validated['kelompok_id']);

        return redirect()->back()->with('success', 'Mahasiswa berhasil ditempatkan ke kelompok.');
    }

    public function makeLeader(
        PesertaKkn $registration,
    ): RedirectResponse {
        // Faculty scope verification
        if (auth()->user()->hasRole('faculty_admin')) {
            $studentFacultyId = $registration->mahasiswa?->fakultas_id;
            if ($studentFacultyId !== auth()->user()->fakultas_id) {
                return redirect()->back()->withErrors(['error' => 'Anda hanya dapat mengubah ketua kelompok untuk mahasiswa di fakultas Anda.']);
            }
        }

        try {
            $this->registrationService->makeLeader($registration);
        } catch (ValidationException $e) {
            return redirect()->back()->withErrors(['error' => $e->getMessage()]);
        }

        return redirect()->back()->with('success', "{$registration->mahasiswa->nama} kini resmi menjadi Ketua Kelompok.");
    }
}
