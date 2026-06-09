<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exports\BiodataPesertaExport;
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
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Maatwebsite\Excel\Facades\Excel;

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

    public function summary(Request $request): JsonResponse
    {
        $query = PesertaKkn::query()->whereNull('deleted_at');
        $this->scopeByFaculty($query);

        $counts = (clone $query)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $total = (int) $counts->sum();
        $review = (int) (($counts['pending'] ?? 0) + ($counts['document_submitted'] ?? 0) + ($counts['interview_scheduled'] ?? 0));
        $approved = (int) ($counts['approved'] ?? 0);
        $rejected = (int) ($counts['rejected'] ?? 0);

        return $this->success([
            'total' => $total,
            'review' => $review,
            'approved' => $approved,
            'rejected' => $rejected,
            'by_status' => $counts,
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        $sort = (string) $request->input('sort', 'created_at');
        $direction = strtolower((string) $request->input('direction', 'desc')) === 'asc' ? 'asc' : 'desc';

        // baseQuery: SEMUA filter KECUALI status / status_group.
        // Dipakai untuk menghitung stats per-status agar kartu statistik
        // tetap menampilkan jumlah seluruh status (bukan 0 saat memfilter
        // ke satu status yang kebetulan kosong).
        $baseQuery = PesertaKkn::query()
            ->when($request->input('entry_scheme'), fn ($q, $s) => $q->where('entry_scheme', $s))
            ->when($request->input('origin_type'), fn ($q, $s) => $q->whereHas('mahasiswa', fn ($m) => $m->where('origin_type', $s)))
            ->when($request->input('fakultas_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('fakultas_id', $id)))
            ->when($request->input('prodi_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('prodi_id', $id)))
            ->when($request->input('external_university_id'), fn ($q, $id) => $q->whereHas('mahasiswa', fn ($m) => $m->where('external_university_id', $id)))
            ->when($request->input('periode_id'), fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('jenis_kkn_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('jenis_kkn_id', $id)))
            ->when($request->input('search'), function ($q, $s) {
                // nim encrypted at rest — LIKE impossible; exact-NIM via bidx.
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->whereHas('mahasiswa', function ($q2) use ($escaped, $s) {
                    $q2->where('nama', 'like', "%{$escaped}%")
                        ->orWhere('external_nim', 'like', "%{$escaped}%");
                    if (preg_match('/^\d{6,20}$/', trim($s))) {
                        $q2->orWhere('nim_bidx', Mahasiswa::computeBlindIndex(trim($s)));
                    }
                });
            });

        $this->scopeByFaculty($baseQuery);

        // Stats dihitung dari baseQuery TANPA filter status → angka kartu benar.
        $statusCounts = (clone $baseQuery)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $stats = [
            'total' => (int) $statusCounts->sum(),
            'reviewable' => (int) (($statusCounts['pending'] ?? 0) + ($statusCounts['document_submitted'] ?? 0) + ($statusCounts['document_verified'] ?? 0)),
            'pending' => (int) ($statusCounts['pending'] ?? 0),
            'document_submitted' => (int) ($statusCounts['document_submitted'] ?? 0),
            'document_verified' => (int) ($statusCounts['document_verified'] ?? 0),
            'approved' => (int) ($statusCounts['approved'] ?? 0),
            'rejected' => (int) ($statusCounts['rejected'] ?? 0),
            'interview_scheduled' => (int) ($statusCounts['interview_scheduled'] ?? 0),
            'interview_passed' => (int) ($statusCounts['interview_passed'] ?? 0),
            'interview_failed' => (int) ($statusCounts['interview_failed'] ?? 0),
            'by_status' => $statusCounts,
        ];

        // Query list: terapkan filter status / status_group di atas baseQuery.
        $query = (clone $baseQuery)
            ->when($request->input('status'), fn ($q, $s) => $q->where('status', $s))
            ->when($request->input('status_group') === 'unprocessed', fn ($q) => $q->whereIn('status', ['pending', 'document_submitted']))
            ->when($request->input('status_group') === 'processed', fn ($q) => $q->whereIn('status', ['approved', 'rejected', 'interview_scheduled']))
            ->with(['mahasiswa.user', 'mahasiswa.fakultas', 'mahasiswa.prodi', 'mahasiswa.externalUniversity', 'kelompok', 'periode.jenisKkn', 'dokumen', 'collaborationLetter']);

        if ($sort === 'first_uploaded_at') {
            $query->leftJoinSub(
                DokumenPesertaKkn::query()
                    ->select('peserta_kkn_id', DB::raw('MIN(uploaded_at) as first_uploaded_at'))
                    ->groupBy('peserta_kkn_id'),
                'doc_first_uploads',
                'doc_first_uploads.peserta_kkn_id',
                '=',
                'peserta_kkn.id'
            )
                ->select('peserta_kkn.*')
                ->orderByRaw('doc_first_uploads.first_uploaded_at IS NULL')
                ->orderBy('doc_first_uploads.first_uploaded_at', $direction);
        } else {
            $query->orderBy('peserta_kkn.created_at', $direction);
        }

        $response = $this->successCollection(PesertaKknResource::collection($query->paginate(min((int) $request->input('per_page', 25), 100))));
        $payload = $response->getData(true);
        $payload['stats'] = $stats;

        return response()->json($payload, $response->getStatusCode());
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

        // Audit R9-008 fix: re-run eligibility before flipping status=approved.
        // Previously admin bypass ini memungkinkan mahasiswa yang kehilangan
        // syarat akademik setelah daftar (misal SKS turun via SIAKAD sync)
        // tetap lolos approval. Superadmin boleh bypass lewat flag ?force=1
        // untuk edge-case valid (contoh: dispensasi manual).
        $force = (bool) request()->boolean('force');
        if (! $force || ! auth()->user()?->hasRole('superadmin')) {
            $eligibility = $this->checkApprovalEligibility($pesertaKkn);
            if (! $eligibility['eligible']) {
                return $this->error(
                    'VALIDATION_ERROR',
                    'Mahasiswa tidak memenuhi syarat approval: '.$eligibility['first_message'],
                    422,
                );
            }
        }

        $pesertaKkn->update(['status' => 'approved', 'approved_at' => now(), 'approved_by' => auth()->id()]);

        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Pendaftaran disetujui.');
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
        $pesertaKkn->update(['status' => 'rejected', 'last_rejected_at' => now(), 'last_rejected_by' => auth()->id(), 'rejection_reason' => $request->input('rejection_reason')]);

        return $this->success(new PesertaKknResource($pesertaKkn->refresh()), 'Pendaftaran ditolak.');
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
        $batchId = 'manual:'.$pesertaKkn->periode_id.':'.now()->format('YmdHis').':'.Str::random(8);

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
                    'placement_is_live' => false,
                    'placement_published_at' => null,
                    'placement_published_by' => null,
                    'placement_batch_id' => $batchId,
                ]);
            } else {
                // Normal path: full validation via service.
                $pesertaKkn = app(GroupSelectionService::class)->assignGroup(
                    $pesertaKkn,
                    $pesertaKkn->mahasiswa,
                    (int) $validated['kelompok_id'],
                );

                $pesertaKkn->update([
                    'placement_is_live' => false,
                    'placement_published_at' => null,
                    'placement_published_by' => null,
                    'placement_batch_id' => $batchId,
                ]);
            }
        } catch (ValidationException $e) {
            $firstMessage = collect($e->errors())->flatten()->first() ?? 'Penugasan kelompok gagal.';

            return $this->error('VALIDATION_ERROR', (string) $firstMessage, 422);
        }

        return $this->success(
            ['peserta' => new PesertaKknResource($pesertaKkn->refresh()), 'placement_batch_id' => $batchId],
            'Peserta berhasil ditugaskan ke kelompok sebagai draft. Hasil belum tampil ke mahasiswa sampai Super Admin publish Live/Real.',
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

        $force = (bool) $request->boolean('force');
        $isSuperadmin = (bool) auth()->user()?->hasRole('superadmin');

        $query = PesertaKkn::with(['mahasiswa.prodi.fakultas', 'mahasiswa.fakultas', 'periode.jenisKkn'])
            ->whereIn('id', $request->input('ids'))
            ->where('status', 'pending');
        $this->scopeByFaculty($query);

        $approved = 0;
        $skipped = [];
        $auditQueue = [];

        // Audit fix (2026-05-12): bulk approve sebelumnya loop `cursor()` tanpa
        // transaction/lock — dua admin bulk-approve bersamaan bisa double-update.
        // Sekarang tiap peserta di-lock via `lockForUpdate()` dan status
        // di-re-check setelah lock didapat (double-check locking). Audit log
        // di-queue dan dispatch setelah semua row selesai untuk hindari
        // overhead per-iterasi.
        foreach ($query->cursor() as $peserta) {
            /** @var PesertaKkn $peserta */
            $result = DB::transaction(function () use ($peserta, $force, $isSuperadmin) {
                // Lock baris — kalau request lain approve duluan, kita lihat
                // status baru dan skip.
                $locked = PesertaKkn::whereKey($peserta->id)->lockForUpdate()->first();

                if ($locked === null || $locked->status !== 'pending') {
                    return [
                        'status' => 'race_skip',
                        'id' => $peserta->id,
                        'nim' => $peserta->mahasiswa?->nim,
                        'nama' => $peserta->mahasiswa?->nama,
                        'reason' => 'Sudah di-proses oleh request lain',
                    ];
                }

                $forceBypass = false;
                $bypassedReasons = null;

                if (! ($force && $isSuperadmin)) {
                    $eligibility = $this->checkApprovalEligibility($peserta);
                    if (! $eligibility['eligible']) {
                        return [
                            'status' => 'ineligible',
                            'id' => $peserta->id,
                            'nim' => $peserta->mahasiswa?->nim,
                            'nama' => $peserta->mahasiswa?->nama,
                            'reason' => $eligibility['first_message'],
                        ];
                    }
                } else {
                    $eligibility = $this->checkApprovalEligibility($peserta);
                    if (! $eligibility['eligible']) {
                        $forceBypass = true;
                        $bypassedReasons = $eligibility['messages'] ?? [$eligibility['first_message'] ?? 'unknown'];
                    }
                }

                $locked->update([
                    'status' => 'approved',
                    'approved_at' => now(),
                    'approved_by' => auth()->id(),
                ]);

                return [
                    'status' => 'approved',
                    'peserta_id' => $locked->id,
                    'nim' => $peserta->mahasiswa?->nim,
                    'force_bypass' => $forceBypass,
                    'bypassed_reasons' => $bypassedReasons,
                ];
            });

            if (($result['status'] ?? null) === 'approved') {
                $approved++;
                if (! empty($result['force_bypass'])) {
                    $auditQueue[] = $result;
                }
            } else {
                $skipped[] = [
                    'id' => $result['id'] ?? $peserta->id,
                    'nim' => $result['nim'] ?? $peserta->mahasiswa?->nim,
                    'nama' => $result['nama'] ?? $peserta->mahasiswa?->nama,
                    'reason' => $result['reason'] ?? 'unknown',
                ];
            }
        }

        // R13-API-005: force-approve audit log — dispatch di luar transaction
        // supaya tidak menahan koneksi DB saat Redis/queue call.
        foreach ($auditQueue as $entry) {
            AuditService::log(
                'FORCE_APPROVE',
                "Superadmin force-approved peserta id={$entry['peserta_id']} (NIM {$entry['nim']}) melewati pengecekan eligibility",
                PesertaKkn::find($entry['peserta_id']),
                null,
                ['skipped_eligibility' => $entry['bypassed_reasons']],
            );
        }

        $message = "{$approved} pendaftaran berhasil disetujui.";
        if ($skipped !== []) {
            $message .= ' '.count($skipped).' dilewati karena tidak memenuhi syarat atau sudah di-proses.';
        }

        return $this->success([
            'approved_count' => $approved,
            'skipped_count' => count($skipped),
            'skipped' => $skipped,
        ], $message);
    }

    public function bulkReject(Request $request): JsonResponse
    {
        if (auth()->user()?->hasRole('faculty_admin')) {
            return $this->error('FORBIDDEN', 'Admin fakultas hanya memiliki akses baca (read-only).', 403);
        }
        $request->validate(['ids' => ['required', 'array'], 'ids.*' => ['integer'], 'rejection_reason' => ['required', 'string', 'max:500']]);
        $query = PesertaKkn::whereIn('id', $request->input('ids'))->where('status', 'pending');
        $this->scopeByFaculty($query);
        $count = $query->update(['status' => 'rejected', 'last_rejected_at' => now(), 'last_rejected_by' => auth()->id(), 'rejection_reason' => $request->input('rejection_reason')]);

        return $this->success(['rejected_count' => $count], "{$count} pendaftaran ditolak.");
    }

    public function export(): JsonResponse
    {
        $query = PesertaKkn::with(['mahasiswa.user', 'kelompok', 'periode'])->orderByDesc('created_at')->limit(5000);
        $this->scopeByFaculty($query);

        $data = $query->cursor()
            ->map(fn ($item) => (new PesertaKknResource($item))->resolve(request()))
            ->values()
            ->all();

        return $this->success($data, 'Export berhasil. '.count($data).' data diekspor.');
    }

    public function exportBiodata(Request $request)
    {
        $periodeId = $request->input('periode_id');

        $query = PesertaKkn::with([
            'mahasiswa:id,user_id,nim,nama,nik,mother_name,gpa,sks_completed,fakultas_id,prodi_id,birth_place,birth_date,gender,shirt_size,phone,alamat,marital_status,batch_year,semester,status_bta_ppi,status_aktif,is_paid_ukt,is_eligible,eligibility_issues,eligibility_computed_at,master_id,master_synced_at',
            'mahasiswa.user:id,username,name,email,phone,address,address_village_name,address_district_name,address_regency_name,address_postal_code,address_lat,address_lng,address_verified_at,address_registered_at',
            'mahasiswa.fakultas:id,nama',
            'mahasiswa.prodi:id,nama',
            'kelompok:id,nama_kelompok,code',
            'periode:id,name',
        ])
            ->when($periodeId, fn ($q, $id) => $q->where('periode_id', $id))
            ->when($request->input('jenis_kkn_id'), fn ($q, $id) => $q->whereHas('periode', fn ($p) => $p->where('jenis_kkn_id', $id)))
            ->when($request->input('status'), fn ($q, $status) => $q->where('status', $status))
            ->when($request->input('status_group') === 'unprocessed', fn ($q) => $q->whereIn('status', ['pending', 'document_submitted']))
            ->when($request->input('status_group') === 'processed', fn ($q) => $q->whereIn('status', ['approved', 'rejected', 'interview_scheduled']))
            ->when(! $request->filled('status') && ! $request->filled('status_group'), fn ($q) => $q->where('status', 'approved'))
            ->when($request->input('search'), function ($q, $s) {
                $escaped = str_replace(['%', '_'], ['\\%', '\\_'], $s);
                $q->whereHas('mahasiswa', fn ($m) => $m->where('nama', 'ILIKE', "%{$escaped}%"));
            })
            ->orderBy('id');

        $this->scopeByFaculty($query);

        $recordCount = (clone $query)->count();

        // PII audit trail (R11 audit-pendaftaran fix)
        ActivityLogger::log('pii_export', 'success', $request->user()?->id, [
            'export_type' => 'biodata',
            'periode_id' => $periodeId ? (int) $periodeId : null,
            'record_count' => $recordCount,
            'faculty_scope' => $this->getFacultyScope(),
        ]);

        return Excel::download(new BiodataPesertaExport($query), 'biodata-peserta-kkn-'.now()->format('Ymd-His').'.xlsx');
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

        // Faculty admin scoping: verify the document belongs to a student in their faculty
        $facultyId = $this->getFacultyScope();
        if ($facultyId) {
            $ownsDocument = DokumenPesertaKkn::where('file_path', $path)
                ->whereHas('pesertaKkn.mahasiswa', fn ($q) => $q->where('fakultas_id', $facultyId))
                ->exists();

            if (! $ownsDocument) {
                // Also check legacy paths on mahasiswa table
                $ownsLegacy = Mahasiswa::where('fakultas_id', $facultyId)
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
