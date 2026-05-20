<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exports\PesertaKknFullExport;
use App\Http\Controllers\Controller;
use App\Http\Resources\Api\V1\PesertaKknResource;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DokumenPesertaKkn;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Services\ActivityLogger;
use App\Services\AuditService;
use App\Services\EligibilityService;
use App\Services\GroupSelectionService;
use App\Services\KKN\RegistrationApprovalService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;
use Barryvdh\DomPDF\Facade\Pdf;

class PesertaKknController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly EligibilityService $eligibilityService,
    ) {}

    /**
     * Re-run eligibility check for a PesertaKkn before approving.
     * Skips `registration_window` (already past by approval time) and
     * `no_active_registration` (the record being approved IS the active one).
     *
     * Returns list of issue keys (empty if eligible), plus a user-friendly
     * message for the first failing issue.
     *
     * @return array{eligible: bool, issues: array<int, array{key: string, message: string}>, first_message: ?string}
     */
    private function checkApprovalEligibility(PesertaKkn $pesertaKkn): array
    {
        $pesertaKkn->loadMissing(['mahasiswa.prodi.fakultas', 'mahasiswa.fakultas', 'periode.jenisKkn']);
        $mahasiswa = $pesertaKkn->mahasiswa;
        if (! $mahasiswa) {
            return ['eligible' => false, 'issues' => [['key' => 'missing_profile', 'message' => 'Data mahasiswa tidak ditemukan.']], 'first_message' => 'Data mahasiswa tidak ditemukan.'];
        }

        $result = $this->eligibilityService->checkEligibility(
            $mahasiswa,
            $pesertaKkn->periode_id,
            ['periode' => $pesertaKkn->periode],
            // 'registration' context to also run document completeness check;
            // operational checks (window, active reg) filtered out below.
            'registration',
        );

        $skip = ['registration_window', 'no_active_registration'];
        $blocking = [];
        foreach ($result['checks'] as $key => $check) {
            if (! ($check['passed'] ?? true) && ! in_array($key, $skip, true)) {
                $blocking[] = ['key' => $key, 'message' => (string) ($check['message'] ?? $key)];
            }
        }

        return [
            'eligible' => $blocking === [],
            'issues' => $blocking,
            'first_message' => $blocking[0]['message'] ?? null,
        ];
    }

    /**
     * Scope query to faculty_admin's own faculty.
     * Returns null if user is superadmin/admin (no scoping needed).
     */
    private function getFacultyScope(): ?int
    {
        $user = auth()->user();
        if ($user?->hasRole('faculty_admin') && $user->fakultas_id) {
            return (int) $user->fakultas_id;
        }

        return null;
    }

    /**
     * Apply faculty scoping to a PesertaKkn query.
     */
    private function scopeByFaculty($query): void
    {
        $facultyId = $this->getFacultyScope();
        if ($facultyId) {
            $query->whereHas('mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId));
        }
    }

    /**
     * Check if current user can access a specific PesertaKkn record.
     */
    private function canAccessPeserta(PesertaKkn $pesertaKkn): bool
    {
        $facultyId = $this->getFacultyScope();
        if (! $facultyId) {
            return true; // superadmin/admin can access all
        }
        $pesertaKkn->loadMissing('mahasiswa');

        return $pesertaKkn->mahasiswa?->fakultas_id === $facultyId;
    }

    public function index(Request $request): JsonResponse
    {
        $format = strtolower((string) $request->input("format", "json"));
        $sort = (string) $request->input('sort', 'first_uploaded_at');
        $direction = strtolower((string) $request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $query = PesertaKkn::with(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok', 'periode.jenisKkn', 'dokumen'])
            ->withMin('dokumen as first_uploaded_at', 'uploaded_at')
            ->when($request->input('status_group'), function ($q, $group) {
                if ($group === 'processed') {
                    $q->whereIn('status', ['approved', 'rejected']);
                } elseif ($group === 'unprocessed') {
                    $q->whereNotIn('status', ['approved', 'rejected']);
                }
            })
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('jenis_kkn_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('jenis_kkn_id', $id)))
            ->when($request->input('search'), function ($q, $s) {
                // nim encrypted at rest — LIKE impossible; exact-NIM via bidx.
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->whereHas('mahasiswa', function ($q2) use ($escaped, $s) {
                    $q2->where('nama', 'like', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', trim($s))) {
                        $q2->orWhere('nim_bidx', Mahasiswa::computeBlindIndex(trim($s)));
                    }
                });
            })
            ->when($sort === 'first_uploaded_at', fn ($q) => $q->orderByRaw("first_uploaded_at {$direction} nulls last"))
            ->when($sort !== 'first_uploaded_at', fn ($q) => $q->orderByRaw('first_uploaded_at asc nulls last'))
            ->orderBy('created_at')
            ->orderBy('id');

        $this->scopeByFaculty($query);

        return $this->successCollection(PesertaKknResource::collection($query->paginate(min((int) $request->input('per_page', 25), 100))));
    }

    public function show(PesertaKkn $pesertaKkn): JsonResponse
    {
        if (! $this->canAccessPeserta($pesertaKkn)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke data mahasiswa ini.', 403);
        }
        $pesertaKkn->load(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok.lokasi', 'periode', 'dokumen']);

        return $this->success(new PesertaKknResource($pesertaKkn));
    }

    public function approve(PesertaKkn $pesertaKkn): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        if (! $this->canAccessPeserta($pesertaKkn)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke data mahasiswa ini.', 403);
        }

        try {
            app(RegistrationApprovalService::class)->approve($pesertaKkn, (int) auth()->id());
        } catch (ValidationException $e) {
            $firstMessage = collect($e->errors())->flatten()->first() ?? 'Pendaftaran tidak dapat disetujui.';

            return $this->error('VALIDATION_ERROR', (string) $firstMessage, 422);
        }

        return $this->success(new PesertaKknResource($pesertaKkn->refresh()->load(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok', 'periode', 'dokumen'])), 'Pendaftaran disetujui.');
    }

    public function reject(Request $request, PesertaKkn $pesertaKkn): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        if (! $this->canAccessPeserta($pesertaKkn)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke data mahasiswa ini.', 403);
        }
        $request->validate(['rejection_reason' => ['required', 'string', 'max:500']]);

        try {
            app(RegistrationApprovalService::class)->reject($pesertaKkn, (string) $request->input('rejection_reason'), (int) auth()->id());
        } catch (ValidationException $e) {
            $firstMessage = collect($e->errors())->flatten()->first() ?? 'Pendaftaran tidak dapat ditolak.';

            return $this->error('VALIDATION_ERROR', (string) $firstMessage, 422);
        }

        return $this->success(new PesertaKknResource($pesertaKkn->refresh()->load(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'kelompok', 'periode', 'dokumen'])), 'Pendaftaran ditolak.');
    }

    public function assignGroup(Request $request, PesertaKkn $pesertaKkn): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        if (! $this->canAccessPeserta($pesertaKkn)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke data mahasiswa ini.', 403);
        }

        $validated = $request->validate([
            'kelompok_id' => ['required', 'exists:kelompok_kkn,id'],
            'force' => ['sometimes', 'boolean'],
        ]);

        // Audit R11-GROUP-004/006/014 fix: sebelumnya `$pesertaKkn->update(['kelompok_id' => ...])`
        // langsung tanpa validasi apapun — admin bisa masukkan mahasiswa ke
        // kelompok yang sudah full, melanggar gender quota, slot lock, atau
        // bahkan mahasiswa yang belum approve. Sekarang panggil
        // GroupSelectionService yang sudah punya semua guard ini:
        //   - capacity check dengan lockForUpdate
        //   - slot terkunci (fakultas/prodi reservation)
        //   - gender quota minimum
        //   - cooling period + max moves (bisa di-override admin force=1)
        // Plus eksplisit cek student sudah approved.
        if (! in_array($pesertaKkn->status, ['approved'], true)) {
            return $this->error(
                'VALIDATION_ERROR',
                "Peserta harus sudah di-approve sebelum ditugaskan ke kelompok (status saat ini: {$pesertaKkn->status}).",
                422,
            );
        }

        $pesertaKkn->loadMissing('mahasiswa');
        if (! $pesertaKkn->mahasiswa) {
            return $this->error('VALIDATION_ERROR', 'Data mahasiswa peserta tidak ditemukan.', 422);
        }

        $force = (bool) ($validated['force'] ?? false);
        $isSuperadmin = (bool) auth()->user()?->hasRole('superadmin');

        try {
            if ($force && $isSuperadmin) {
                // Superadmin override: skip cooling period + max moves,
                // tapi capacity + slot + gender rules TETAP di-check.
                $group = KelompokKkn::findOrFail($validated['kelompok_id']);
                app(GroupSelectionService::class)
                    ->validateGroupAcceptance($group, $pesertaKkn->mahasiswa, $pesertaKkn->id);

                $pesertaKkn->update([
                    'kelompok_id' => $validated['kelompok_id'],
                    'joined_group_at' => now(),
                ]);
            } else {
                // Normal path: full validation via service.
                app(GroupSelectionService::class)->assignGroup(
                    $pesertaKkn,
                    $pesertaKkn->mahasiswa,
                    (int) $validated['kelompok_id'],
                );
            }
        } catch (ValidationException $e) {
            $firstMessage = collect($e->errors())->flatten()->first() ?? 'Penugasan kelompok gagal.';

            return $this->error('VALIDATION_ERROR', (string) $firstMessage, 422);
        }

        return $this->success(
            new PesertaKknResource($pesertaKkn->refresh()),
            'Peserta berhasil ditugaskan ke kelompok.',
        );
    }

    public function makeLeader(PesertaKkn $pesertaKkn): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        if (! $this->canAccessPeserta($pesertaKkn)) {
            return $this->error('FORBIDDEN', 'Anda tidak memiliki akses ke data mahasiswa ini.', 403);
        }
        if (! $pesertaKkn->kelompok_id) {
            return $this->error('VALIDATION_ERROR', 'Peserta belum ditempatkan ke kelompok.', 422);
        }

        // Audit R11-FULL-010 / R9-009 fix: dulunya `->update(['role' => 'Ketua'])`
        // tanpa reset ketua lama, sehingga satu kelompok bisa punya lebih dari
        // satu ketua. Sekarang atomic: demote semua ketua lain di kelompok
        // yang sama ke role 'Anggota' dulu, baru promote target. Kolom `role`
        // NOT NULL dengan default 'Anggota'; jangan set null. Tambahan:
        // unique partial index di DB (migration baru) sebagai double-guard.
        DB::transaction(function () use ($pesertaKkn): void {
            PesertaKkn::where('kelompok_id', $pesertaKkn->kelompok_id)
                ->where('id', '!=', $pesertaKkn->id)
                ->where('role', 'Ketua')
                ->update(['role' => 'Anggota']);

            $pesertaKkn->update(['role' => 'Ketua']);
        });

        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Peserta dijadikan ketua.');
    }

    public function bulkApprove(Request $request): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer']]);

        $approved = app(RegistrationApprovalService::class)->bulkApprove(
            $request->input('ids'),
            (int) auth()->id(),
            false,
            null,
        );

        return $this->success(['approved_count' => $approved], "{$approved} pendaftaran berhasil disetujui.");
    }

    public function bulkReject(Request $request): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer'], 'rejection_reason' => ['required', 'string', 'max:500']]);

        $count = app(RegistrationApprovalService::class)->bulkReject(
            $request->input('ids'),
            (string) $request->input('rejection_reason'),
            (int) auth()->id(),
            false,
            null,
        );

        return $this->success(['rejected_count' => $count], "{$count} pendaftaran ditolak.");
    }

    public function export(Request $request): JsonResponse|\Symfony\Component\HttpFoundation\BinaryFileResponse|\Illuminate\Http\Response
    {
        $format = strtolower((string) $request->input("format", "json"));
        $sort = (string) $request->input('sort', 'first_uploaded_at');
        $direction = strtolower((string) $request->input('direction', 'asc')) === 'desc' ? 'desc' : 'asc';
        $query = PesertaKkn::with([
            "mahasiswa:id,user_id,nim,nama,fakultas_id,prodi_id,batch_year,gender,birth_place,birth_date,sks_completed,gpa,status_bta_ppi,semester,nik,mother_name,shirt_size,is_paid_ukt,alamat,phone,status_aktif,marital_status,is_eligible,eligibility_issues",
            "mahasiswa.user:id,name,email,phone,address,is_active",
            "mahasiswa.fakultas:id,nama,code",
            "mahasiswa.prodi:id,nama,code",
            "kelompok:id,nama_kelompok,code",
            "periode:id,jenis_kkn_id,name,periode,start_date,end_date,registration_start,registration_end",
            "periode.jenisKkn:id,name,code",
        ])
            ->when($request->input("status"), fn ($q, $v) => $q->where("status", $v))
            ->when($request->input("periode_id"), fn ($q, $v) => $q->where("periode_id", $v))
            ->when($request->input("jenis_kkn_id"), fn ($q, $v) => $q->whereHas("periode", fn ($p) => $p->where("jenis_kkn_id", $v)))
            ->when($request->input("fakultas_id"), fn ($q, $v) => $q->whereHas("mahasiswa", fn ($m) => $m->where("fakultas_id", $v)))
            ->when($request->input("prodi_id"), fn ($q, $v) => $q->whereHas("mahasiswa", fn ($m) => $m->where("prodi_id", $v)))
            ->orderByDesc("created_at")
            ->limit(min((int) $request->input("limit", 10000), 50000));

        $this->scopeByFaculty($query);

        $data = $query->get()->map(fn (PesertaKkn $p) => [
            "registration_id" => $p->id,
            "status_pendaftaran" => $p->status,
            "tanggal_daftar" => $p->registration_date?->toDateTimeString(),
            "approved_at" => $p->approved_at?->toDateTimeString(),
            "nim" => $p->mahasiswa?->nim,
            "nama" => $p->mahasiswa?->nama,
            "email" => $p->mahasiswa?->user?->email,
            "phone" => $p->mahasiswa?->phone ?? $p->mahasiswa?->user?->phone,
            "alamat" => $p->mahasiswa?->alamat ?? $p->mahasiswa?->user?->address,
            "nik" => $p->mahasiswa?->nik,
            "ibu_kandung" => $p->mahasiswa?->mother_name,
            "jenis_kelamin" => $p->mahasiswa?->gender,
            "tempat_lahir" => $p->mahasiswa?->birth_place,
            "tanggal_lahir" => $p->mahasiswa?->birth_date?->toDateString(),
            "status_nikah" => $p->mahasiswa?->marital_status,
            "ukuran_kaos" => $p->mahasiswa?->shirt_size,
            "angkatan" => $p->mahasiswa?->batch_year,
            "semester" => $p->mahasiswa?->semester,
            "sks" => $p->mahasiswa?->sks_completed,
            "ipk" => $p->mahasiswa?->gpa,
            "status_bta_ppi" => $p->mahasiswa?->status_bta_ppi,
            "is_paid_ukt" => $p->mahasiswa?->is_paid_ukt,
            "status_aktif" => $p->mahasiswa?->status_aktif,
            "is_eligible" => $p->mahasiswa?->is_eligible,
            "fakultas_id" => $p->mahasiswa?->fakultas_id,
            "fakultas" => $p->mahasiswa?->fakultas?->nama,
            "prodi_id" => $p->mahasiswa?->prodi_id,
            "prodi" => $p->mahasiswa?->prodi?->nama,
            "periode_id" => $p->periode_id,
            "periode" => $p->periode?->name,
            "jenis_kkn_id" => $p->periode?->jenis_kkn_id,
            "jenis_kkn" => $p->periode?->jenisKkn?->name,
            "kelompok_id" => $p->kelompok_id,
            "kelompok" => $p->kelompok?->nama_kelompok,
            "role_kelompok" => $p->role,
        ])->values();

        ActivityLogger::log("pii_export", "success", $request->user()?->id, ["export_type" => "peserta_full_no_avatar", "format" => $format, "filters" => $request->only(["status", "periode_id", "jenis_kkn_id", "fakultas_id", "prodi_id"]), "record_count" => count($data), "faculty_scope" => $this->getFacultyScope()]);

        if (in_array($format, ["xlsx", "excel"], true)) {
            return Excel::download(new PesertaKknFullExport($data), "peserta-kkn-lengkap-".now()->format("Ymd-His").".xlsx");
        }

        if ($format === "pdf") {
            return Pdf::loadView("admin.exports.peserta_kkn_full", ["rows" => $data])->setPaper("a4", "landscape")->download("peserta-kkn-lengkap-".now()->format("Ymd-His").".pdf");
        }

        return $this->success($data, "Export data lengkap berhasil. ".count($data)." data diekspor.");
    }
    public function exportBiodata(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $query = PesertaKkn::with([
            'mahasiswa:id,nim,nama,nik,mother_name,gpa,sks_completed,fakultas_id',
            'mahasiswa.user:id,name,email,phone,address',
            'mahasiswa.fakultas:id,nama',
            'mahasiswa.prodi:id,nama',
            'kelompok:id,nama_kelompok,code',
        ])
            ->when($periodeId, fn ($q, $id) => $q->where('periode_id', $id))
            ->where('status', 'approved');

        $this->scopeByFaculty($query);

        $data = $query->get()
            ->map(fn ($p) => [
                'nim' => $p->mahasiswa?->nim,
                'nama' => $p->mahasiswa?->nama,
                'nik' => $p->mahasiswa?->nik,
                'ibu_kandung' => $p->mahasiswa?->mother_name,
                'email' => $p->mahasiswa?->user?->email,
                'phone' => $p->mahasiswa?->user?->phone,
                'alamat' => $p->mahasiswa?->user?->address,
                'fakultas' => $p->mahasiswa?->fakultas?->nama,
                'prodi' => $p->mahasiswa?->prodi?->nama,
                'ipk' => $p->mahasiswa?->gpa,
                'sks' => $p->mahasiswa?->sks_completed,
                'kelompok' => $p->kelompok?->nama_kelompok,
            ]);

        // PII audit trail (R11 audit-pendaftaran fix)
        ActivityLogger::log('pii_export', 'success', $request->user()?->id, [
            'export_type' => 'biodata',
            'periode_id' => $periodeId ? (int) $periodeId : null,
            'record_count' => count($data),
            'faculty_scope' => $this->getFacultyScope(),
        ]);

        return $this->success($data, 'Export biodata berhasil. '.count($data).' data.');
    }

    public function exportBpjs(Request $request): JsonResponse
    {
        $periodeId = $request->input('periode_id');

        $query = PesertaKkn::with([
            'mahasiswa:id,nim,nama,nik,mother_name,fakultas_id',
            'mahasiswa.user:id,name,address',
            'kelompok:id,nama_kelompok',
        ])
            ->when($periodeId, fn ($q, $id) => $q->where('periode_id', $id))
            ->where('status', 'approved');

        $this->scopeByFaculty($query);

        $data = $query->get()
            ->map(fn ($p) => [
                'nim' => $p->mahasiswa?->nim,
                'nama' => $p->mahasiswa?->nama,
                'nik' => $p->mahasiswa?->nik,
                'ibu_kandung' => $p->mahasiswa?->mother_name,
                'alamat' => $p->mahasiswa?->user?->address,
                'kelompok' => $p->kelompok?->nama_kelompok,
            ]);

        // PII audit trail (R11 audit-pendaftaran fix)
        ActivityLogger::log('pii_export', 'success', $request->user()?->id, [
            'export_type' => 'bpjs',
            'periode_id' => $periodeId ? (int) $periodeId : null,
            'record_count' => count($data),
            'faculty_scope' => $this->getFacultyScope(),
        ]);

        return $this->success($data, 'Export BPJS berhasil. '.count($data).' data.');
    }

    public function downloadDocument(Request $request)
    {
        $path = $request->input('path');

        if (! $path) {
            abort(400, 'Path dokumen tidak diberikan.');
        }

        // Prevent path traversal: reject paths containing '..' or absolute paths
        if (str_contains($path, '..') || str_starts_with($path, '/')) {
            abort(400, 'Path dokumen tidak valid.');
        }

        // Verify file exists in storage before serving
        if (! Storage::exists($path)) {
            abort(404, 'Dokumen tidak ditemukan.');
        }

        // Verify the requested path is attached to a real registration document.
        // Superadmin may access all; admin/faculty_admin must be scoped through ownership/faculty.
        $user = $request->user();
        $isSuperadmin = (bool) $user?->hasRole('superadmin');
        $facultyId = $this->getFacultyScope();

        if (! $isSuperadmin) {
            $ownsDocument = DokumenPesertaKkn::where('file_path', $path)
                ->when($facultyId, fn ($q) => $q->whereHas('pesertaKkn.mahasiswa', fn ($m) => $m->where('fakultas_id', $facultyId)))
                ->exists();

            if (! $ownsDocument) {
                $ownsLegacy = Mahasiswa::query()
                    ->when($facultyId, fn ($q) => $q->where('fakultas_id', $facultyId))
                    ->where(fn ($q) => $q->where('health_certificate_path', $path)->orWhere('parent_permission_path', $path))
                    ->exists();

                if (! $ownsLegacy) {
                    abort(403, 'Anda tidak memiliki akses ke dokumen ini.');
                }
            }
        }

        // PII audit trail (R11 audit-pendaftaran fix)
        ActivityLogger::log('pii_export', 'success', $request->user()?->id, [
            'export_type' => 'document_download',
            'file_path' => $path,
            'faculty_scope' => $this->getFacultyScope(),
        ]);

        return app(RegistrationApprovalService::class)
            ->downloadDocument($path, auth()->user());
    }
}
