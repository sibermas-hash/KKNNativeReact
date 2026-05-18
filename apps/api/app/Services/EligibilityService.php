<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\DispensasiKkn;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use App\Models\KKN\SystemSetting;
use App\Services\KKN\RegistrationDocumentService;

class EligibilityService
{
    /**
     * Local cache to prevent N+1 queries for the same metadata during a single request.
     */
    protected ?Periode $activePeriod = null;

    protected ?array $cachedSettings = null;

    /**
     * Process dynamic requirements based on JSON configuration
     */
    private function processDynamicChecks(Mahasiswa $mahasiswa, ?Periode $periode, array &$checks): void
    {
        $config = $periode?->jenisKkn?->requirements_config ?? [];

        if (empty($config) || ! is_array($config)) {
            return;
        }

        foreach ($config as $rule) {
            // requirements_config also stores scalar settings like min_sks/min_gpa.
            // Only entries shaped as dynamic-rule arrays should be processed here.
            if (! is_array($rule)) {
                continue;
            }

            $key = $rule['key'] ?? str_replace(' ', '_', strtolower((string) ($rule['name'] ?? 'requirement')));
            $type = $rule['type'] ?? 'upload';

            if ($type === 'db_check') {
                $field = $rule['field'] ?? null;
                $minValue = $rule['min_value'] ?? null;
                $expectedValue = $rule['expected_value'] ?? null;

                if ($field) {
                    $actualValue = $mahasiswa->{$field};
                    $passed = true;
                    $message = $rule['name'];

                    if ($minValue !== null) {
                        $passed = (float) $actualValue >= (float) $minValue;
                        $message .= $passed
                            ? " mencukupi ({$actualValue}/{$minValue})"
                            : " tidak mencukupi ({$actualValue}/{$minValue})";
                    } elseif ($expectedValue !== null) {
                        // Normalized string comparison
                        $passed = strtoupper(trim((string) $actualValue)) === strtoupper(trim((string) $expectedValue));
                        $message .= $passed ? ' Terverifikasi' : ' Belum terpenuhi';
                    } else {
                        // Boolean check by default if no min/expected value
                        $passed = (bool) $actualValue;
                        $message .= $passed ? ' Terverifikasi' : ' Belum terpenuhi';
                    }

                    $checks[$key] = [
                        'passed' => $passed,
                        'key' => $key,
                        'message' => $message,
                        'type' => 'db_check',
                    ];
                }
            }
            // For 'upload' type, the validation is handled by checkDocuments() or manually by admin later
        }
    }

    /**
     * Check if a student is eligible to register for KKN
     */
    public function checkEligibility(Mahasiswa $mahasiswa, ?int $periodeId = null, array $preloadedData = [], string $context = 'registration'): array
    {
        // Real eligibility checks only — no testing backdoor.
        // Tests should mock EligibilityService::checkEligibility() directly.

        // 1. Resolve Periode (Use preloaded -> then cached -> then DB)
        $periode = $preloadedData['periode']
            ?? ($periodeId ? Periode::with('jenisKkn')->find($periodeId) : $this->getActivePeriod());

        // 2. Resolve Settings
        $settings = $preloadedData['settings'] ?? $this->getSettings();

        // 3. Build checks — audit mode hanya cek persyaratan akademik
        $checks = [];

        // Check status_aktif — hanya mahasiswa AKTIF yang eligible
        $statusAktif = strtoupper(trim($mahasiswa->status_aktif ?? ""));
        if ($statusAktif !== "" && $statusAktif !== "AKTIF") {
            $checks["status_aktif"] = [
                "passed" => false,
                "key" => "status_aktif",
                "message" => "Status akademik: " . $statusAktif . ". Hanya mahasiswa AKTIF yang dapat mendaftar KKN.",
            ];
        } else {
            $checks["status_aktif"] = ["passed" => true, "key" => "status_aktif", "message" => "Status akademik aktif"];
        }

        // Cek operasional: hanya untuk konteks pendaftaran
        if ($context === 'registration') {
            $checks['registration_window'] = $this->checkRegistrationWindow($periode);
        }

        $checks['no_prior_completion'] = $this->checkNoPriorCompletion($mahasiswa, $preloadedData['completed_ids'] ?? null);

        // 3a. Process Dynamic JSON Requirements (New Approach)
        $this->processDynamicChecks($mahasiswa, $periode, $checks);

        // 3b. Legacy Checks (Hanya berjalan jika belum ada di dynamic checks untuk kompatibilitas)
        if (! isset($checks['min_sks'])) {
            $checks['min_sks'] = $this->checkMinimumSKS($mahasiswa, $periode, $settings);
        }
        if (! isset($checks['min_semester'])) {
            $checks['min_semester'] = $this->checkMinimumSemester($mahasiswa, $periode, $settings);
        }
        if (! isset($checks['min_gpa'])) {
            $checks['min_gpa'] = $this->checkMinimumGPA($mahasiswa, $periode, $settings);
        }
        if (! isset($checks['ukt_payment'])) {
            $checks['ukt_payment'] = $this->checkUkt($mahasiswa);
        }
        if (! isset($checks['bta_ppi'])) {
            $checks['bta_ppi'] = $this->checkBtaPpi($mahasiswa, $periode);
        }

        $checks['program_prodi'] = $this->checkProgramProdiRestriction($mahasiswa, $periode);
        $checks['personal_status'] = $this->checkPersonalStatusMandate($mahasiswa, $periode);

        // Alur semua jenis KKN: mahasiswa daftar → upload dokumen → superadmin periksa → approve/tolak.
        // Pada pendaftaran, dokumen hanya diinformasikan (tidak blok daftar).
        // Pada approval, dokumen wajib harus lengkap sebelum disetujui.
        if (in_array($context, ['registration', 'approval'], true)) {
            $documentContext = $preloadedData;
            $documentContext['context'] = $context;
            $checks['documents'] = $this->checkDocuments($mahasiswa, $periode, $documentContext);
        }
        if ($context === 'registration') {
            $checks['no_active_registration'] = $this->checkNoActiveRegistration($mahasiswa, $periodeId, $preloadedData['active_reg_ids'] ?? null);
        }

        // Apply dispensasi bypass — override failed checks if student has active dispensasi
        $bypassed = $preloadedData['dispensations'][$mahasiswa->nim]
            ?? DispensasiKkn::getBypassedRequirements($mahasiswa->nim, $periode?->id);

        $hasDispensasi = ! empty($bypassed);

        if ($hasDispensasi) {
            foreach ($bypassed as $key) {
                if (isset($checks[$key]) && ! $checks[$key]['passed']) {
                    $checks[$key]['passed'] = true;
                    $checks[$key]['message'] = ($checks[$key]['message'] ?? '').' (DISPENSASI)';
                    $checks[$key]['dispensasi'] = true;
                }
            }
        }

        $issues = array_filter($checks, fn ($check) => ! $check['passed']);

        return [
            'mahasiswa_id' => $mahasiswa->id,
            'nim' => $mahasiswa->nim,
            'nama' => $mahasiswa->nama,
            'prodi_nama' => $mahasiswa->prodi?->nama ?? null,
            'fakultas_nama' => $mahasiswa->fakultas?->nama ?? $mahasiswa->prodi?->fakultas?->nama ?? null,
            'sks_completed' => $mahasiswa->sks_completed,
            'gpa' => $mahasiswa->gpa,
            'is_bta_ppi_passed' => in_array(strtoupper(trim($mahasiswa->status_bta_ppi ?? '')), ['LULUS', 'PASSED', 'SUCCESS']),
            'has_health_certificate' => ! empty($mahasiswa->health_certificate_path),
            'has_parent_permission' => ! empty($mahasiswa->parent_permission_path),
            'checks' => $checks,
            'is_eligible' => empty($issues),
            'issues' => array_values($issues),
            'issue_count' => count($issues),
            'has_dispensasi' => $hasDispensasi,
        ];
    }

    /**
     * Check registration window
     */
    private function checkRegistrationWindow(?Periode $periode): array
    {
        if (! $periode) {
            return ['passed' => false, 'key' => 'registration_window', 'message' => 'Tidak ada periode KKN aktif'];
        }

        $now = now();
        $withinWindow = $now->between($periode->registration_start, $periode->registration_end);

        return [
            'passed' => $withinWindow,
            'key' => 'registration_window',
            'message' => $withinWindow
                ? 'Dalam jadwal registrasi'
                : 'Di luar jadwal registrasi',
            'registration_start' => $periode->registration_start?->format('d M Y H:i'),
            'registration_end' => $periode->registration_end?->format('d M Y H:i'),
        ];
    }

    /**
     * Check no prior KKN completion
     */
    private function checkNoPriorCompletion(Mahasiswa $mahasiswa, ?array $preloadedIds = null): array
    {
        $hasCompleted = $preloadedIds
            ? isset($preloadedIds[$mahasiswa->id])
            : PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->where('status', 'completed')
                ->exists();

        return [
            'passed' => ! $hasCompleted,
            'key' => 'no_prior_completion',
            'message' => $hasCompleted
                ? 'Sudah lulus KKN sebelumnya'
                : 'Belum pernah lulus KKN',
        ];
    }

    /**
     * Check minimum SKS requirement
     */
    private function checkMinimumSKS(Mahasiswa $mahasiswa, ?Periode $periode, array $settings): array
    {
        // Prioritaskan dari Master Data Jenis KKN (jika ada)
        $minSks = (int) ($periode?->jenisKkn?->min_sks
                ?? $settings['min_sks_registration']
                ?? 100);

        $hasEnoughSks = ($mahasiswa->sks_completed ?? 0) >= $minSks;

        return [
            'passed' => $hasEnoughSks,
            'key' => 'min_sks',
            'message' => $hasEnoughSks
                ? "SKS mencukupi ({$mahasiswa->sks_completed}/{$minSks})"
                : "[SKS requirement failure] - SKS tidak mencukupi ({$mahasiswa->sks_completed}/{$minSks})",
            'current_sks' => $mahasiswa->sks_completed,
            'required_sks' => $minSks,
        ];
    }

    /**
     * Check minimum semester requirement
     */
    private function checkMinimumSemester(Mahasiswa $mahasiswa, ?Periode $periode, array $settings): array
    {
        $minSemester = (int) ($periode?->jenisKkn?->min_semester
                ?? $settings['min_semester_registration']
                ?? 6);
        $currentSemester = (int) ($mahasiswa->semester ?? 0);

        // Skip check jika mahasiswa sudah lulus (semester tidak reliable untuk status LULUS)
        if (in_array(strtoupper(trim($mahasiswa->status_aktif ?? '')), ['LULUS', 'GRADUATED'])) {
            return [
                'passed' => true,
                'key' => 'min_semester',
                'message' => 'Mahasiswa sudah lulus (semester tidak dicek)',
                'current_semester' => $currentSemester,
                'required_semester' => $minSemester,
                'skipped' => true,
            ];
        }

        $hasEnoughSemester = $currentSemester >= $minSemester;

        return [
            'passed' => $hasEnoughSemester,
            'key' => 'min_semester',
            'message' => $hasEnoughSemester
                ? "Semester mencukupi ({$currentSemester}/{$minSemester})"
                : "[Semester requirement failure] - Semester tidak mencukupi ({$currentSemester}/{$minSemester})",
            'current_semester' => $currentSemester,
            'required_semester' => $minSemester,
        ];
    }

    /**
     * Check minimum GPA requirement
     */
    private function checkMinimumGPA(Mahasiswa $mahasiswa, ?Periode $periode, array $settings): array
    {
        // Prioritaskan dari Master Data Jenis KKN (jika ada)
        $minGpa = $periode?->jenisKkn ? (float) $periode->jenisKkn->min_gpa : null;

        if ($minGpa === null || $minGpa <= 0) {
            $enableGpa = filter_var($settings['enable_gpa_requirement'] ?? false, FILTER_VALIDATE_BOOLEAN);

            if (! $enableGpa) {
                return [
                    'passed' => true,
                    'key' => 'min_gpa',
                    'message' => 'Validasi IPK tidak diaktifkan',
                    'enabled' => false,
                ];
            }

            $minGpa = (float) ($settings['min_gpa_registration'] ?? 2.00);
        }

        $studentGpa = (float) ($mahasiswa->gpa ?? 0);
        $hasEnoughGpa = $studentGpa >= $minGpa;

        return [
            'passed' => $hasEnoughGpa,
            'key' => 'min_gpa',
            'message' => $hasEnoughGpa
                ? "IPK mencukupi ({$studentGpa}/{$minGpa})"
                : "[GPA requirement failure] - IPK tidak mencukupi ({$studentGpa}/{$minGpa})",
            'current_gpa' => $studentGpa,
            'required_gpa' => $minGpa,
            'enabled' => true,
        ];
    }

    /**
     * Check UKT payment status
     */
    private function checkUkt(Mahasiswa $mahasiswa): array
    {
        $paid = (bool) $mahasiswa->is_paid_ukt;

        return [
            'passed' => $paid,
            'key' => 'ukt_payment',
            'message' => $paid ? 'UKT sudah lunas' : '[Financial requirement failure] - UKT semester ini belum lunas atau tidak terdata.',
        ];
    }

    /**
     * Check BTA-PPI certification (Data-driven from Jenis KKN)
     */
    private function checkBtaPpi(Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        $required = $periode?->jenisKkn ? (bool) $periode->jenisKkn->require_bta_ppi : true;

        if (! $required) {
            return [
                'passed' => true,
                'key' => 'bta_ppi',
                'message' => 'Lulus BTA-PPI tidak diwajibkan untuk skema ini.',
                'required' => false,
            ];
        }

        $passed = in_array(strtoupper(trim($mahasiswa->status_bta_ppi ?? '')), ['LULUS', 'PASSED', 'SUCCESS']);

        return [
            'passed' => $passed,
            'key' => 'bta_ppi',
            'message' => $passed ? 'Lulus BTA-PPI' : '[Prerequisite failure] - Belum lulus BTA/PPI.',
            'required' => true,
        ];
    }

    /**
     * Restriction check for specific programs (Data-driven from Jenis KKN)
     */
    private function checkProgramProdiRestriction(Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        if (! $periode || ! $periode->jenisKkn) {
            return ['passed' => true, 'key' => 'program_prodi', 'message' => 'N/A'];
        }

        $specificProdiIds = $periode->jenisKkn->specific_prodi_ids;

        if (empty($specificProdiIds) || ! is_array($specificProdiIds)) {
            return ['passed' => true, 'key' => 'program_prodi', 'message' => 'Terbuka untuk semua program studi'];
        }

        $studentProdiId = $mahasiswa->prodi_id;
        $isAllowed = in_array((int) $studentProdiId, array_map('intval', $specificProdiIds));

        $allowedLabel = $periode->jenisKkn->requirements_config['specific_prodi_note']
            ?? 'Skema ini dibatasi untuk program studi tertentu.';

        return [
            'passed' => $isAllowed,
            'key' => 'program_prodi',
            'message' => $isAllowed ? 'Program studi sesuai' : $allowedLabel,
            'reason' => 'Pembatasan khusus program studi sesuai Edaran.',
            'allowed_prodi_ids' => array_map('intval', $specificProdiIds),
        ];
    }

    /**
     * Enforce personal status requirements: marital status + parent permission.
     *
     * Audit R11-JENIS-005 fix: sebelumnya hanya notice (selalu passed=true).
     * Sekarang benar-benar block kalau JenisKkn config require tapi mahasiswa
     * tidak memenuhi:
     *   - require_not_married: mahasiswa.marital_status harus 'belum_menikah'.
     *     Kalau field null (legacy record), treat as 'belum_menikah' default.
     *   - require_parent_permission: mahasiswa.parent_permission_path harus
     *     terisi (dokumen izin ortu di-upload).
     */
    private function checkPersonalStatusMandate(Mahasiswa $mahasiswa, ?Periode $periode): array
    {
        if (! $periode || ! $periode->jenisKkn) {
            return ['passed' => true, 'key' => 'personal_status', 'message' => 'N/A'];
        }

        $jkkn = $periode->jenisKkn;
        $failures = [];

        if ($jkkn->require_not_married) {
            $status = strtolower((string) ($mahasiswa->marital_status ?? 'belum_menikah'));
            if (! in_array($status, ['belum_menikah', 'single', ''], true)) {
                $failures[] = 'Status pernikahan: program ini mewajibkan belum menikah.';
            }
        }

        // Dokumen izin orang tua/wali adalah berkas administratif.
        // Tidak boleh menjadi filter kelayakan otomatis sebelum admin LPPM/Superadmin memvalidasi.
        // Requirement dokumen tetap muncul di halaman upload dokumen setelah pendaftaran.

        if ($failures === []) {
            $notices = [];
            if ($jkkn->require_not_married) {
                $notices[] = 'Belum Menikah';
            }
            if ($jkkn->require_parent_permission) {
                $notices[] = 'Izin Orang Tua/Wali wajib diunggah setelah pendaftaran';
            }

            return [
                'passed' => true,
                'key' => 'personal_status',
                'message' => $notices === [] ? 'Lolos kriteria umum' : 'SYARAT KHUSUS terpenuhi: '.implode(', ', $notices),
            ];
        }

        return [
            'passed' => false,
            'key' => 'personal_status',
            'message' => implode(' ', $failures),
        ];
    }

    /**
     * Check required documents (Data-driven from Jenis KKN)
     */
    private function checkDocuments(Mahasiswa $mahasiswa, ?Periode $periode, array $preloadedData = []): array
    {
        if (! $periode) {
            return [
                'passed' => true,
                'key' => 'documents',
                'message' => 'Tidak ada dokumen yang perlu diverifikasi.',
                'details' => [],
                'missing_documents' => [],
            ];
        }

        $documentService = app(RegistrationDocumentService::class);
        $requirements = $documentService->requirementsForPeriod($periode);
        $existing = $documentService->existingDocuments($mahasiswa, $periode);

        $missingDocuments = collect($requirements)
            ->filter(function (array $requirement) use ($existing) {
                $field = (string) $requirement['field'];

                return ($requirement['required'] ?? false) === true
                    && ! (bool) ($existing[$field]['exists'] ?? false);
            })
            ->pluck('label')
            ->values()
            ->all();

        // Mahasiswa tetap boleh daftar dulu. Approval/admin wajib memeriksa kelengkapan dokumen.
        // Context approval akan memblokir jika dokumen wajib belum diunggah.
        $blockDocuments = (($preloadedData['context'] ?? null) === 'approval')
            || in_array(request()?->route()?->getName(), ['api.v1.admin.peserta-kkn.approve', 'api.v1.admin.peserta-kkn.bulk-approve'], true)
            || (app()->bound('kkn.eligibility_context') && app('kkn.eligibility_context') === 'approval');
        $passed = ! $blockDocuments || $missingDocuments === [];

        return [
            'passed' => $passed,
            'key' => 'documents',
            'message' => $missingDocuments === []
                ? 'Dokumen persyaratan sudah diunggah; menunggu validasi admin jika diperlukan.'
                : ($blockDocuments
                    ? 'Dokumen wajib belum lengkap: '.implode(', ', $missingDocuments)
                    : 'Dokumen persyaratan dapat diunggah setelah pendaftaran. Validasi dilakukan admin LPPM/Superadmin.'),
            'details' => collect($requirements)->mapWithKeys(function (array $requirement) use ($existing) {
                $field = (string) $requirement['field'];

                return [
                    $field => [
                        'required' => (bool) ($requirement['required'] ?? false),
                        'exists' => (bool) ($existing[$field]['exists'] ?? false),
                        'label' => $requirement['label'],
                    ],
                ];
            })->all(),
            'missing_documents' => $missingDocuments,
        ];
    }

    /**
     * Check no active registration in other periods
     */
    private function checkNoActiveRegistration(Mahasiswa $mahasiswa, ?int $currentPeriodeId = null, ?array $preloadedIds = null): array
    {
        $hasActive = $preloadedIds
            ? isset($preloadedIds[$mahasiswa->id])
            : PesertaKkn::where('mahasiswa_id', $mahasiswa->id)
                ->whereIn('status', ['pending', 'approved', 'document_submitted'])
                ->when($currentPeriodeId, fn ($q) => $q->where('periode_id', '!=', $currentPeriodeId))
                ->exists();

        return [
            'passed' => ! $hasActive,
            'key' => 'no_active_registration',
            'message' => $hasActive
                ? 'Masih memiliki pendaftaran aktif di periode lain'
                : 'Tidak ada pendaftaran aktif',
        ];
    }

    /**
     * Get metadata for active period (Cached)
     */
    private function getActivePeriod(): ?Periode
    {
        if ($this->activePeriod === null) {
            $this->activePeriod = Periode::getActivePeriod();
        }

        return $this->activePeriod;
    }

    /**
     * Get system settings (Cached)
     */
    private function getSettings(): array
    {
        if ($this->cachedSettings === null) {
            $this->cachedSettings = SystemSetting::pluck('value', 'config_key')->toArray();
        }

        return $this->cachedSettings;
    }

    /**
     * Get all eligible students for a period
     */
    public function getEligibleStudents(?int $periodeId = null, ?int $facultyId = null, string $context = 'audit'): array
    {
        $periode = $periodeId ? Periode::with('jenisKkn')->find($periodeId) : $this->getActivePeriod();
        $settings = $this->getSettings();

        // Optimized Query with eager loading
        $query = Mahasiswa::with(['user', 'prodi.fakultas', 'fakultas']);

        if ($facultyId) {
            $query->where('fakultas_id', $facultyId);
        }

        // For large datasets, consider using chunking or cursor, but for now we optimize memory via eager load
        $students = $query->get();
        $studentIds = $students->pluck('id')->toArray();
        $studentNims = $students->pluck('nim')->toArray();

        // BATCH PRE-LOADING: Core optimization to avoid N+1 queries in the loop below
        $completedIds = PesertaKkn::whereIn('mahasiswa_id', $studentIds)
            ->where('status', 'completed')
            ->pluck('mahasiswa_id')
            ->toArray();

        $activeRegIds = PesertaKkn::whereIn('mahasiswa_id', $studentIds)
            ->whereIn('status', ['pending', 'approved', 'document_submitted'])
            ->when($periodeId, fn ($q) => $q->where('periode_id', '!=', $periodeId))
            ->pluck('mahasiswa_id')
            ->toArray();

        $dispensations = DispensasiKkn::whereIn('nim', $studentNims)
            ->where(function ($q) use ($periodeId) {
                $q->whereNull('periode_id')->orWhere('periode_id', $periodeId);
            })
            ->get()
            ->groupBy('nim')
            ->map(fn ($items) => $items->flatMap(fn ($i) => $i->bypassed_requirements ?? [])->filter()->unique()->values()->toArray())
            ->toArray();

        $preloadedData = [
            'periode' => $periode,
            'completed_ids' => array_flip($completedIds),
            'active_reg_ids' => array_flip($activeRegIds),
            'dispensations' => $dispensations,
            'settings' => $settings,
            'context' => $context,
        ];

        $eligible = [];
        $notEligible = [];

        foreach ($students as $student) {
            $result = $this->checkEligibility($student, $periodeId, $preloadedData, $context);
            if ($result['is_eligible']) {
                $eligible[] = $result;
            } else {
                $notEligible[] = $result;
            }
        }

        return [
            'eligible' => collect($eligible)->sortBy('nama')->values(),
            'not_eligible' => collect($notEligible)->sortBy('nama')->values(),
            'total' => $students->count(),
            'eligible_count' => count($eligible),
            'not_eligible_count' => count($notEligible),
            'eligibility_rate' => $students->count() > 0
                ? round((count($eligible) / $students->count()) * 100, 1)
                : 0,
        ];
    }
}
