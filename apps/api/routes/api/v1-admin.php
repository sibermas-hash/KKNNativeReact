<?php

use App\Http\Controllers\Api\V1\Admin\ActivityAuditController;
use App\Http\Controllers\Api\V1\Admin\AiHealthController;
use App\Http\Controllers\Api\V1\Admin\AnnouncementController;
use App\Http\Controllers\Api\V1\Admin\AutoPlottingController;
use App\Http\Controllers\Api\V1\Admin\AvatarModerationController;
use App\Http\Controllers\Api\V1\Admin\BulkCertificateDownloadController;
use App\Http\Controllers\Api\V1\Admin\CertificateConfigController;
use App\Http\Controllers\Api\V1\Admin\CertificateManagementController;
use App\Http\Controllers\Api\V1\Admin\CollaborationLetterController;
use App\Http\Controllers\Api\V1\Admin\ComprehensiveReportController;
use App\Http\Controllers\Api\V1\Admin\CountdownSettingController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DatabaseSyncController;
use App\Http\Controllers\Api\V1\Admin\DataImportController;
use App\Http\Controllers\Api\V1\Admin\DispensasiController;
use App\Http\Controllers\Api\V1\Admin\DocumentTemplateController;
use App\Http\Controllers\Api\V1\Admin\DownloadController;
use App\Http\Controllers\Api\V1\Admin\DplAssignmentController;
use App\Http\Controllers\Api\V1\Admin\DplCalibrationController;
use App\Http\Controllers\Api\V1\Admin\DplParticipantEvaluationController;
use App\Http\Controllers\Api\V1\Admin\DplRegistrationController;
use App\Http\Controllers\Api\V1\Admin\DplSyncController;
use App\Http\Controllers\Api\V1\Admin\EligibilityController;
use App\Http\Controllers\Api\V1\Admin\EvaluasiController;
use App\Http\Controllers\Api\V1\Admin\ExternalParticipantController;
use App\Http\Controllers\Api\V1\Admin\ExternalUniversityController;
use App\Http\Controllers\Api\V1\Admin\FakultasController;
use App\Http\Controllers\Api\V1\Admin\GeneratorNilaiController;
use App\Http\Controllers\Api\V1\Admin\GradeController;
use App\Http\Controllers\Api\V1\Admin\InterviewController;
use App\Http\Controllers\Api\V1\Admin\JenisKknController;
use App\Http\Controllers\Api\V1\Admin\JenisKknDocumentRequirementController;
use App\Http\Controllers\Api\V1\Admin\KegiatanKknAdminController;
use App\Http\Controllers\Api\V1\Admin\KelompokKknAdminController;
use App\Http\Controllers\Api\V1\Admin\KknRequirementController;
use App\Http\Controllers\Api\V1\Admin\KonfigurasiPenilaianController;
use App\Http\Controllers\Api\V1\Admin\LaporanAkhirAdminController;
use App\Http\Controllers\Api\V1\Admin\LegacyKknTrackingController;
use App\Http\Controllers\Api\V1\Admin\LogAuditController;
use App\Http\Controllers\Api\V1\Admin\LogbookPdfController;
use App\Http\Controllers\Api\V1\Admin\LokasiController;
use App\Http\Controllers\Api\V1\Admin\MonitoringController;
use App\Http\Controllers\Api\V1\Admin\NotificationBroadcastController;
use App\Http\Controllers\Api\V1\Admin\PeriodeController;
use App\Http\Controllers\Api\V1\Admin\PeriodeDocumentTemplateController;
use App\Http\Controllers\Api\V1\Admin\PesertaKknController;
use App\Http\Controllers\Api\V1\Admin\PesertaKknListController;
use App\Http\Controllers\Api\V1\Admin\PlaygroundController;
use App\Http\Controllers\Api\V1\Admin\ProdiController;
use App\Http\Controllers\Api\V1\Admin\ProfileChangeRequestController;
use App\Http\Controllers\Api\V1\Admin\ProfileLockController;
use App\Http\Controllers\Api\V1\Admin\ProgramKerjaController;
use App\Http\Controllers\Api\V1\Admin\PublicContentController;
use App\Http\Controllers\Api\V1\Admin\RekapitulasiController;
use App\Http\Controllers\Api\V1\Admin\RekapNilaiController;
use App\Http\Controllers\Api\V1\Admin\ReportExportController;
use App\Http\Controllers\Api\V1\Admin\SiakadSyncAdminController;
use App\Http\Controllers\Api\V1\Admin\StudentSyncController;
use App\Http\Controllers\Api\V1\Admin\StudentTransferController;
use App\Http\Controllers\Api\V1\Admin\SystemSettingController;
use App\Http\Controllers\Api\V1\Admin\TahunAkademikController;
use App\Http\Controllers\Api\V1\Admin\TransferPesertaController;
use App\Http\Controllers\Api\V1\Admin\UserActivityController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Admin\WaGatewayAdminController;
use App\Http\Controllers\Api\V1\Admin\WorkshopController;
use App\Http\Controllers\Api\V1\Admin\YudisiumController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:superadmin|admin|faculty_admin', 'not_locked', 'admin.auth'])
    ->group(function () {

        // Dashboard
        Route::get('/hub', [DashboardController::class, 'hub']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::post('/dashboard/switch-phase', [DashboardController::class, 'switchPhase']);

        Route::get('/ai-health', [AiHealthController::class, 'show']);

        // Periode
        Route::get('/periode/export', [PeriodeController::class, 'export']);
        Route::post('/periode/{periode}/duplicate', [PeriodeController::class, 'duplicate']);
        Route::apiResource('periode', PeriodeController::class);
        Route::get('/periode/{periode}/document-templates', [PeriodeDocumentTemplateController::class, 'index']);
        Route::post('/periode/{periode}/document-templates', [PeriodeDocumentTemplateController::class, 'assign']);
        Route::delete('/periode/{periode}/document-templates/{periodDocumentTemplate}', [PeriodeDocumentTemplateController::class, 'destroy']);

        // Countdown Settings
        Route::get('/periode/{periode}/countdown', [CountdownSettingController::class, 'show']);
        Route::post('/periode/{periode}/countdown', [CountdownSettingController::class, 'store']);

        // Master Data
        Route::apiResource('tahun-akademik', TahunAkademikController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('jenis-kkn', JenisKknController::class);
        Route::get('/jenis-kkn/{jenisKkn}/document-requirements', [JenisKknDocumentRequirementController::class, 'index']);
        Route::post('/jenis-kkn/{jenisKkn}/document-requirements', [JenisKknDocumentRequirementController::class, 'store']);
        Route::put('/jenis-kkn/{jenisKkn}/document-requirements/{requirement}', [JenisKknDocumentRequirementController::class, 'update']);
        Route::delete('/jenis-kkn/{jenisKkn}/document-requirements/{requirement}', [JenisKknDocumentRequirementController::class, 'destroy']);
        Route::get('/fakultas', [FakultasController::class, 'index']);
        Route::middleware('role:superadmin')->group(function () {
            Route::post('/fakultas', [FakultasController::class, 'store']);
            Route::put('/fakultas/{fakultas}', [FakultasController::class, 'update']);
            Route::patch('/fakultas/{fakultas}', [FakultasController::class, 'update']);
            Route::delete('/fakultas/{fakultas}', [FakultasController::class, 'destroy']);
        });
        Route::get('/prodi', [ProdiController::class, 'index']);
        Route::middleware('role:superadmin')->group(function () {
            Route::post('/prodi', [ProdiController::class, 'store']);
            Route::put('/prodi/{prodi}', [ProdiController::class, 'update']);
            Route::patch('/prodi/{prodi}', [ProdiController::class, 'update']);
            Route::delete('/prodi/{prodi}', [ProdiController::class, 'destroy']);
        });
        Route::post('/lokasi/selection', [LokasiController::class, 'updateSelection']);
        Route::apiResource('lokasi', LokasiController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('/lokasi/import', [LokasiController::class, 'import']);
        Route::get('/lokasi/export', [LokasiController::class, 'export']);

        // Requirements
        Route::apiResource('kkn-requirements', KknRequirementController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::patch('/kkn-requirements/{requirement}/toggle', [KknRequirementController::class, 'toggle']);
        Route::get('/document-templates', [DocumentTemplateController::class, 'index']);
        Route::post('/document-templates', [DocumentTemplateController::class, 'store']);
        Route::patch('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'update']);
        Route::delete('/document-templates/{documentTemplate}', [DocumentTemplateController::class, 'destroy']);
        Route::get('/document-templates/{documentTemplate}/download', [DocumentTemplateController::class, 'download'])->name('api.v1.admin.document-templates.download');

        // External collaboration
        Route::apiResource('external-universities', ExternalUniversityController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/collaboration-letters', [CollaborationLetterController::class, 'index']);
        Route::get('/collaboration-letters/{letter}', [CollaborationLetterController::class, 'show']);
        Route::post('/collaboration-letters/{letter}/verify', [CollaborationLetterController::class, 'verify']);
        Route::post('/collaboration-letters/{letter}/reject', [CollaborationLetterController::class, 'reject']);
        Route::patch('/collaboration-letters/{letter}', [CollaborationLetterController::class, 'update']);

        // External participants
        Route::get('/peserta-eksternal/template', [ExternalParticipantController::class, 'template']);
        Route::get('/peserta-eksternal/batches', [ExternalParticipantController::class, 'batches']);
        Route::post('/peserta-eksternal/batches', [ExternalParticipantController::class, 'storeBatch']);
        Route::post('/peserta-eksternal/import', [ExternalParticipantController::class, 'import'])->middleware('throttle:5,1');
        Route::get('/peserta-eksternal/export', [ExternalParticipantController::class, 'export']);
        Route::post('/peserta-eksternal/bulk-assign', [ExternalParticipantController::class, 'bulkAssign']);
        Route::get('/peserta-eksternal', [ExternalParticipantController::class, 'index']);
        Route::get('/pendaftaran/export', [PesertaKknController::class, 'export']);
        Route::get('/pendaftaran/export-biodata', [PesertaKknController::class, 'exportBiodata']);
        Route::get('/pendaftaran/export-bpjs', [PesertaKknController::class, 'exportBpjs']);
        Route::get('/pendaftaran/berkas/unduh', [PesertaKknController::class, 'downloadDocument']);
        Route::post('/pendaftaran/bulk-approve', [PesertaKknController::class, 'bulkApprove'])->middleware('throttle:10,1');
        Route::post('/pendaftaran/bulk-reject', [PesertaKknController::class, 'bulkReject'])->middleware('throttle:10,1');
        Route::get('/pendaftaran/stats', [PesertaKknController::class, 'stats']);
        Route::get('/pendaftaran', [PesertaKknController::class, 'index']);
        Route::get('/pendaftaran/{pesertaKkn}', [PesertaKknController::class, 'show']);
        Route::patch('/pendaftaran/{pesertaKkn}/approve', [PesertaKknController::class, 'approve']);
        Route::patch('/pendaftaran/{pesertaKkn}/reject', [PesertaKknController::class, 'reject']);

        // Wawancara / Interview
        Route::get('/peserta-kkn/export', [PesertaKknListController::class, 'export']);
        Route::get('/peserta-kkn/export-pdf', [PesertaKknListController::class, 'exportPdf']);
        Route::get('/peserta-kkn', [PesertaKknListController::class, 'index']);
        Route::get('/peserta-wawancara', [InterviewController::class, 'pesertaWawancara']);

        Route::get('/transfer-peserta', [TransferPesertaController::class, 'index']);
        Route::get('/transfer-peserta/periodes', [TransferPesertaController::class, 'periodes']);
        Route::post('/transfer-peserta', [TransferPesertaController::class, 'transfer']);
        Route::get('/transfer-peserta/placement-candidates', [TransferPesertaController::class, 'placementCandidates']);
        Route::get('/transfer-peserta/placement-groups', [TransferPesertaController::class, 'placementGroups']);
        Route::post('/transfer-peserta/placement', [TransferPesertaController::class, 'movePlacement']);

        Route::prefix('wawancara')->group(function () {
            Route::get('/', [InterviewController::class, 'index']);
            Route::post('/', [InterviewController::class, 'store']);
            Route::get('/export', [InterviewController::class, 'export']);
            Route::get('/{interview}', [InterviewController::class, 'show']);
            Route::patch('/{interview}', [InterviewController::class, 'update']);
            Route::delete('/{interview}', [InterviewController::class, 'destroy']);
            Route::get('/{interview}/available-peserta', [InterviewController::class, 'availablePeserta']);
            Route::post('/{interview}/assign', [InterviewController::class, 'assignParticipants']);
            Route::delete('/{interview}/participants/{participant}', [InterviewController::class, 'removeParticipant']);
            Route::patch('/{interview}/participants/{participant}/result', [InterviewController::class, 'recordResult']);
            Route::post('/{interview}/bulk-result', [InterviewController::class, 'bulkRecordResult']);
        });

        Route::patch('/pendaftaran/{pesertaKkn}/assign-group', [PesertaKknController::class, 'assignGroup']);
        Route::post('/pendaftaran/{pesertaKkn}/make-leader', [PesertaKknController::class, 'makeLeader']);
        // Korcam is a DPL role (not mahasiswa) — managed via DPL assignment, not here

        // Auto Plotting
        Route::post('/plotting-otomatis/simulate', [AutoPlottingController::class, 'simulate']);
        Route::post('/plotting-otomatis/apply', [AutoPlottingController::class, 'apply']);
        Route::post('/plotting-otomatis/publish', [AutoPlottingController::class, 'publish']);
        Route::post('/plotting-otomatis/external-kebumen/preview', [AutoPlottingController::class, 'externalKebumenPreview']);
        Route::post('/plotting-otomatis/external-kebumen/apply', [AutoPlottingController::class, 'externalKebumenApply']);

        // Groups
        Route::apiResource('kelompok', KelompokKknAdminController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
        Route::post('/kelompok/import', [KelompokKknAdminController::class, 'import']);
        Route::get('/kelompok/{kelompok}/mahasiswa', [KelompokKknAdminController::class, 'mahasiswaList']);

        // DPL Registration
        Route::get('/dosen/pendaftaran-dpl', [DplRegistrationController::class, 'index']);
        Route::patch('/dosen/pendaftaran-dpl/{dplPeriod}/setujui', [DplRegistrationController::class, 'approve']);
        Route::patch('/dosen/pendaftaran-dpl/{dplPeriod}/tolak', [DplRegistrationController::class, 'reject']);
        Route::post('/dosen/pendaftaran-dpl/bulk-approve', [DplRegistrationController::class, 'bulkApprove'])->name('api.v1.admin.dpl-registration.bulk-approve');
        Route::post('/dosen/pendaftaran-dpl/bulk-reject', [DplRegistrationController::class, 'bulkReject'])->name('api.v1.admin.dpl-registration.bulk-reject');

        // Sync Mahasiswa & Dosen (superadmin only)
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/mahasiswa/sinkron', [StudentSyncController::class, 'index']);
            Route::post('/mahasiswa/sinkron', [StudentSyncController::class, 'sync']);
            Route::get('/dosen/sinkron', [DplSyncController::class, 'index']);
            Route::post('/dosen/sinkron', [DplSyncController::class, 'sync']);
        });

        // Workshop Management
        Route::get('/workshops', [WorkshopController::class, 'index']);
        Route::post('/workshops', [WorkshopController::class, 'store']);
        Route::patch('/workshops/{workshop}', [WorkshopController::class, 'update']);
        Route::patch('/workshops/{workshop}/cancel', [WorkshopController::class, 'cancel']);
        Route::post('/workshops/{workshopId}/mark-attendance', [WorkshopController::class, 'markAttendance']);
        Route::post('/workshops/{workshopId}/import-attendance', [WorkshopController::class, 'importAttendance']);
        Route::get('/workshops/{workshop}/participants/export', [WorkshopController::class, 'exportParticipants']);
        Route::get('/workshops/{workshop}/certificate-template', [WorkshopController::class, 'downloadCertificateTemplate']);
        Route::post('/workshops/{workshopId}/import-peserta', [WorkshopController::class, 'importPeserta']);
        Route::get('/workshops/template-peserta', [WorkshopController::class, 'downloadPesertaTemplate']);
        Route::post('/workshops/import-metodologi-pkm', [WorkshopController::class, 'importMetodologiPkm']);

        // Program Kerja
        Route::get('/laporan/program-kerja', [ProgramKerjaController::class, 'index']);

        // Student Transfer (menggunakan StudentTransferService dengan validasi bisnis)
        Route::post('/peserta/pindah', [StudentTransferController::class, 'transfer']);
        Route::get('/peserta/transfer-targets', [StudentTransferController::class, 'getTransferTargets']);

        // Eligibility
        Route::get('/audit-kualifikasi', [EligibilityController::class, 'index']);
        Route::get('/audit-kualifikasi/export', [EligibilityController::class, 'export']);
        Route::get('/audit-kualifikasi/{mahasiswa}/periksa', [EligibilityController::class, 'checkStudent']);
        Route::post('/audit-kualifikasi/bulk-update-sks', [EligibilityController::class, 'bulkUpdateSks']);

        // Rekapitulasi
        Route::get('/rekapitulasi', [RekapitulasiController::class, 'index']);

        // Legacy KKN Tracking
        Route::middleware('role:superadmin')->prefix('legacy-kkn')->group(function () {
            Route::get('/summary', [LegacyKknTrackingController::class, 'summary']);
            Route::get('/export', [LegacyKknTrackingController::class, 'export']);
            Route::get('/', [LegacyKknTrackingController::class, 'index']);
        });

        // Generator Nilai
        Route::get('/generator-nilai', [GeneratorNilaiController::class, 'index']);
        Route::get('/generator-nilai/kelompok/semua/mahasiswa', [GeneratorNilaiController::class, 'studentsAll']);
        Route::get('/generator-nilai/kelompok/{kelompokKkn}/mahasiswa', [GeneratorNilaiController::class, 'students']);
        Route::post('/generator-nilai/skor', [GeneratorNilaiController::class, 'saveScores']);
        Route::get('/generator-nilai/ekspor/{kelompokKkn}', [GeneratorNilaiController::class, 'exportExcel']);
        Route::get('/generator-nilai/ekspor-pdf/{kelompokKkn}', [GeneratorNilaiController::class, 'exportPdf']);
        Route::get('/generator-nilai/ekspor-zip', [GeneratorNilaiController::class, 'exportZip']);

        // Evaluasi DPL
        Route::get('/evaluasi-dpl', [DplParticipantEvaluationController::class, 'index']);
        Route::get('/evaluasi-dpl/export', [DplParticipantEvaluationController::class, 'export']);
        Route::get('/evaluasi-dpl/{dosen}', [DplParticipantEvaluationController::class, 'show']);
        Route::get('/dosen/penugasan', [DplAssignmentController::class, 'index']);
        Route::post('/dosen/tugaskan-periode', [DplAssignmentController::class, 'assignToPeriod']);
        Route::post('/dosen/tugaskan-kelompok/{group}', [DplAssignmentController::class, 'assignToGroup']);
        Route::post('/dosen/tugaskan-wilayah', [DplAssignmentController::class, 'assignDistrictCoordinator']);
        Route::post('/dosen/import', [DplAssignmentController::class, 'import']);
        Route::patch('/dosen/lepas-periode/{dplPeriod}', [DplAssignmentController::class, 'removeDplFromPeriod']);
        Route::patch('/dosen/lepas-wilayah/{districtCoordinator}', [DplAssignmentController::class, 'removeDistrictCoordinator']);
        Route::get('/available-dpl', [DplAssignmentController::class, 'getAvailableDpl']);

        // Dispensasi
        Route::get('/dispensasi', [DispensasiController::class, 'index']);
        Route::post('/dispensasi', [DispensasiController::class, 'store']);
        Route::delete('/dispensasi/{dispensasi}', [DispensasiController::class, 'destroy']);

        // Academic
        Route::get('/nilai', [GradeController::class, 'index']);
        Route::post('/nilai', [GradeController::class, 'store']);
        Route::get('/grade-reports', [RekapNilaiController::class, 'index']);
        Route::patch('/grade-reports/{score}/finalize', [RekapNilaiController::class, 'finalize']);
        Route::post('/grade-reports/finalize-mass', [RekapNilaiController::class, 'finalizeMass'])->middleware('throttle:10,1');
        Route::get('/grade-reports/export', [RekapNilaiController::class, 'export']);
        Route::get('/grade-reports/export-ledger', [RekapNilaiController::class, 'exportLedger']);
        Route::get('/grade-reports/certificate-progress', [RekapNilaiController::class, 'getCertificateProgress']);
        Route::get('/grade-reports/finalisasi-progres', [RekapNilaiController::class, 'getFinalizeProgress']);
        Route::get('/grade-reports/{score}/certificate-word', [RekapNilaiController::class, 'downloadWordCertificate']);
        Route::get('/grade-reports/{score}/sertifikat', [RekapNilaiController::class, 'downloadCertificate']);
        Route::get('/grade-reports/{score}/preview-sertifikat', [RekapNilaiController::class, 'previewCertificate']);
        Route::post('/grade-reports/sertifikat-massal', [RekapNilaiController::class, 'bulkCertificates']);
        Route::get('/grade-reports/bulk-download', [RekapNilaiController::class, 'bulkDownload']);

        Route::get('/laporan/harian', [KegiatanKknAdminController::class, 'index']);
        Route::get('/laporan/harian/{dailyReport}', [KegiatanKknAdminController::class, 'show']);
        Route::patch('/laporan/harian/{dailyReport}/approve', [KegiatanKknAdminController::class, 'approve']);
        Route::patch('/laporan/harian/{dailyReport}/revision', [KegiatanKknAdminController::class, 'revision']);
        Route::get('/laporan/harian/file/{fileKegiatan}/download', [KegiatanKknAdminController::class, 'downloadFile']);
        Route::get('/laporan/harian/file/{fileKegiatan}/preview', [KegiatanKknAdminController::class, 'previewFile']);
        Route::get('/laporan/akhir', [LaporanAkhirAdminController::class, 'index']);
        Route::get('/laporan/akhir/{report}', [LaporanAkhirAdminController::class, 'show']);
        Route::patch('/laporan/akhir/{report}/status', [LaporanAkhirAdminController::class, 'updateStatus']);
        Route::get('/laporan/akhir/{report}/unduh', [LaporanAkhirAdminController::class, 'download']);

        Route::middleware('role:superadmin')->group(function () {
            Route::get('/konfigurasi-penilaian', [KonfigurasiPenilaianController::class, 'index']);
            Route::patch('/konfigurasi-penilaian', [KonfigurasiPenilaianController::class, 'update']);
        });

        Route::get('/yudisium', [YudisiumController::class, 'index']);
        Route::post('/yudisium/proses', [YudisiumController::class, 'proses']);

        // Content
        Route::apiResource('warta-utama', AnnouncementController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['warta-utama' => 'announcement']);
        Route::get('/warta-utama/{announcement}/preview', [AnnouncementController::class, 'preview']);
        Route::apiResource('unduhan', DownloadController::class)->only(['index', 'store', 'update', 'destroy']);

        // Users (superadmin only — manage users, roles, passwords)
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/online-users', [UserController::class, 'onlineUsers']);
            Route::get('/pengguna', [UserController::class, 'index']);
            Route::post('/pengguna', [UserController::class, 'store']);
            Route::get('/pengguna/{user}', [UserController::class, 'show']);
            Route::patch('/pengguna/{user}', [UserController::class, 'update']);
            Route::patch('/pengguna/{user}/ubah-status', [UserController::class, 'toggleActive']);
            Route::patch('/pengguna/{user}/role', [UserController::class, 'updateRole']);
            Route::post('/pengguna/{user}/reset-password', [UserController::class, 'resetTemporaryPassword']);
        });
        Route::get('/mahasiswa', [UserController::class, 'mahasiswaIndex']);
        Route::get('/mahasiswa/{mahasiswa}', [UserController::class, 'mahasiswaShow']);
        Route::get('/dosen', [UserController::class, 'dosenIndex']);

        // Avatar moderation (superadmin only — Layer 4 of PRD_AVATAR_VALIDATION.md)
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/avatar-moderation', [AvatarModerationController::class, 'index']);
            Route::patch('/avatar-moderation/{user}/approve', [AvatarModerationController::class, 'approve']);
            Route::patch('/avatar-moderation/{user}/reject', [AvatarModerationController::class, 'reject']);
        });

        // User Activity Log (superadmin only — PRD_USER_ACTIVITY_LOG.md)
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/activity-log', [UserActivityController::class, 'index']);
            Route::get('/activity-log/stats', [UserActivityController::class, 'stats']);
            Route::get('/activity-log/user/{user}', [UserActivityController::class, 'userHistory']);
        });

        // AI Playground (superadmin only — PRD_AI_PLAYGROUND.md)
        // Certificate Management (Admin/Superadmin)
        Route::prefix('sertifikat')->group(function () {
            Route::get('/', [CertificateManagementController::class, 'index']);
            Route::post('/', [CertificateManagementController::class, 'update']);
            Route::post('/upload-background', [CertificateManagementController::class, 'uploadBackground']);
            Route::post('/regenerate', [CertificateManagementController::class, 'regenerate']);
            Route::post('/zip', [CertificateManagementController::class, 'zip']);
            Route::get('/{sertifikat}/preview', [CertificateManagementController::class, 'preview']);
            Route::get('/{sertifikat}/download', [CertificateManagementController::class, 'download']);
        });

        Route::middleware('role:superadmin')->prefix('playground')->group(function () {
            Route::get('/models', [PlaygroundController::class, 'models']);
            Route::post('/chat', [PlaygroundController::class, 'chat'])
                ->middleware('throttle:10,1');
        });

        // Comprehensive Report (LP2M executive summary PDF)
        Route::get('/report/comprehensive/{periode}', [ComprehensiveReportController::class, 'download'])
            ->middleware('throttle:10,1');

        // Logbook PDF per-mahasiswa (admin audit)
        Route::get('/mahasiswa/{mahasiswa}/logbook', [LogbookPdfController::class, 'download'])
            ->middleware('throttle:20,1');

        // Ops Monitoring Dashboard (superadmin only)
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/monitoring/overview', [MonitoringController::class, 'overview'])->middleware('throttle:30,1');
            Route::get('/monitoring/alerts', [MonitoringController::class, 'alerts'])->middleware('throttle:30,1');
            Route::post('/monitoring/trigger-check', [MonitoringController::class, 'triggerCheck'])->middleware('throttle:5,1');
        });

        // System (superadmin only)
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/pengaturan/sertifikat', [CertificateConfigController::class, 'index']);
            Route::post('/pengaturan/sertifikat', [CertificateConfigController::class, 'update']);
            Route::get('/pengaturan/sistem', [SystemSettingController::class, 'index']);
            Route::patch('/pengaturan/sistem', [SystemSettingController::class, 'update']);
            Route::get('/pengaturan/sistem/ai/config', [SystemSettingController::class, 'getAiConfig']);
            Route::post('/pengaturan/sistem/ai/test', [SystemSettingController::class, 'testAiConnection']);
            Route::patch('/pengaturan/sistem/ai/update', [SystemSettingController::class, 'updateAiSettings']);
            Route::delete('/pengaturan/sistem/ai/key', [SystemSettingController::class, 'removeAiKey']);
            Route::get('/pengaturan/notifikasi/wa', [WaGatewayAdminController::class, 'show']);
            Route::patch('/pengaturan/notifikasi/wa', [WaGatewayAdminController::class, 'update']);
            Route::post('/pengaturan/notifikasi/wa/test', [WaGatewayAdminController::class, 'test'])->middleware('throttle:3,1');
        });
        Route::middleware('role:superadmin')->group(function () {
            Route::get('/audit-log', [LogAuditController::class, 'index']);
            Route::get('/audit-log/{auditLog}', [LogAuditController::class, 'show']);
        });

        // Data Import (superadmin only)
        Route::middleware('role:superadmin')->group(function () {
            Route::post('/import/dosen-data', [DataImportController::class, 'importDosenData']);
            Route::post('/import/nilai-kkn-historis', [DataImportController::class, 'importNilaiKknHistoris']);
        });

        // Database Sync Monitor (superadmin only)
        Route::middleware('role:superadmin')->prefix('database-sync')->group(function () {
            Route::get('/', [DatabaseSyncController::class, 'index']);
            Route::get('/health', [DatabaseSyncController::class, 'health']);
            Route::get('/statistics', [DatabaseSyncController::class, 'statistics']);
            Route::post('/retry', [DatabaseSyncController::class, 'retry']);
            Route::post('/retry/{log}', [DatabaseSyncController::class, 'retryLog']);
            Route::post('/cleanup', [DatabaseSyncController::class, 'cleanup']);
            Route::post('/test-connection', [DatabaseSyncController::class, 'testConnection']);
            Route::post('/manual', [DatabaseSyncController::class, 'manualSync']);
            Route::get('/logs/{log}', [DatabaseSyncController::class, 'show']);
        });

        // Activity / Quality Audit
        Route::get('/auditor-aktivitas', [ActivityAuditController::class, 'index']);

        // Konten Publik
        Route::prefix('konten-publik')->group(function () {
            Route::get('/profil', [PublicContentController::class, 'profile']);
            Route::patch('/profil', [PublicContentController::class, 'updateProfile']);
            Route::get('/skema', [PublicContentController::class, 'schemes']);
            Route::patch('/skema', [PublicContentController::class, 'updateSchemes']);
        });

        // Export PDF Laporan Harian
        Route::prefix('ekspor')->group(function () {
            Route::get('/laporan-harian/mahasiswa/{studentId}', [ReportExportController::class, 'downloadStudentDailyReports']);
            Route::get('/laporan-harian/kelompok/{groupId}', [ReportExportController::class, 'downloadGroupDailyReports']);
        });

        // Evaluasi (admin view)
        Route::get('/evaluasi', [EvaluasiController::class, 'index']);

        // DPL Calibration Report
        Route::get('/dpl-calibration/{periode}', [DplCalibrationController::class, 'show']);

        // Legacy alias
        Route::get('/rekap-nilai', [RekapNilaiController::class, 'index']);

        // Profile Change Requests (superadmin only)
        Route::middleware('role:superadmin')->prefix('profile-change-requests')->group(function () {
            Route::get('/', [ProfileChangeRequestController::class, 'index']);
            Route::match(['patch', 'post'], '/approve-all', [ProfileChangeRequestController::class, 'approveAll']);
            Route::match(['patch', 'post'], '/{profileChangeRequest}/approve', [ProfileChangeRequestController::class, 'approve']);
            Route::match(['patch', 'post'], '/{profileChangeRequest}/reject', [ProfileChangeRequestController::class, 'reject']);
        });

        // Field-lock inspection (any admin may view)
        Route::get('/mahasiswa/{mahasiswa}/locks', [ProfileLockController::class, 'showMahasiswa']);
        Route::get('/dosen/{dosen}/locks', [ProfileLockController::class, 'showDosen']);

        // Superadmin-only field-lock management + manual SIAKAD sync.
        // The parent admin group already authenticates; we tighten these further
        // to superadmin because releasing a lock or triggering a mass sync touches
        // data integrity at a level faculty admins should not have.
        Route::middleware('role:superadmin')->group(function () {
            Route::patch('/mahasiswa/{mahasiswa}/unlock-field', [ProfileLockController::class, 'unlockMahasiswaField']);
            Route::patch('/dosen/{dosen}/unlock-field', [ProfileLockController::class, 'unlockDosenField']);

            Route::prefix('sync')->group(function () {
                Route::post('/backup', [SiakadSyncAdminController::class, 'backup']);
                Route::post('/run-with-backup', [SiakadSyncAdminController::class, 'runWithBackup']);
            });

            // Broadcast notifications across all 3 channels (database, mail, fcm)
            // using per-user preferences. See NotificationBroadcastController.
            Route::post('/notifications/broadcast', [NotificationBroadcastController::class, 'broadcast'])
                ->middleware('throttle:5,1');
        });
    });

// C-003 fix: Bulk certificate download.
// Outside the big admin.auth group on purpose — this route has its OWN
// authorization model: `signed` middleware validates the URL signature,
// the controller enforces auth:sanctum + admin role + originating-admin match,
// and downloads must work even on locked periods.
Route::get('/admin/certificates/bulk-download/{token}', [BulkCertificateDownloadController::class, 'download'])
    ->middleware(['signed', 'auth:sanctum'])
    ->name('admin.certificates.bulk-download');
