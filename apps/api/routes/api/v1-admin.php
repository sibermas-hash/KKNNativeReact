<?php

use App\Http\Controllers\Api\V1\Admin\AnnouncementController;
use App\Http\Controllers\Api\V1\Admin\CertificateConfigController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DplAssignmentController;
use App\Http\Controllers\Api\V1\Admin\DplParticipantEvaluationController;
use App\Http\Controllers\Api\V1\Admin\DplRegistrationController;
use App\Http\Controllers\Api\V1\Admin\DownloadController;
use App\Http\Controllers\Api\V1\Admin\EligibilityController;
use App\Http\Controllers\Api\V1\Admin\FakultasController;
use App\Http\Controllers\Api\V1\Admin\GradeController;
use App\Http\Controllers\Api\V1\Admin\GeneratorNilaiController;
use App\Http\Controllers\Api\V1\Admin\JenisKknController;
use App\Http\Controllers\Api\V1\Admin\KegiatanKknAdminController;
use App\Http\Controllers\Api\V1\Admin\KknRequirementController;
use App\Http\Controllers\Api\V1\Admin\KonfigurasiPenilaianController;
use App\Http\Controllers\Api\V1\Admin\LaporanAkhirAdminController;
use App\Http\Controllers\Api\V1\Admin\LokasiController;
use App\Http\Controllers\Api\V1\Admin\LogAuditController;
use App\Http\Controllers\Api\V1\Admin\DispensasiController;
use App\Http\Controllers\Api\V1\Admin\KelompokKknAdminController;
use App\Http\Controllers\Api\V1\Admin\PeriodeController;
use App\Http\Controllers\Api\V1\Admin\ProdiController;
use App\Http\Controllers\Api\V1\Admin\RekapitulasiController;
use App\Http\Controllers\Api\V1\Admin\RekapNilaiController;
use App\Http\Controllers\Api\V1\Admin\StudentTransferController;
use App\Http\Controllers\Api\V1\Admin\SystemSettingController;
use App\Http\Controllers\Api\V1\Admin\TahunAkademikController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Admin\PesertaKknController;
use App\Http\Controllers\Api\V1\Admin\YudisiumController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:superadmin|admin|faculty_admin'])
    ->group(function () {

        // Dashboard
        Route::get('/hub', [DashboardController::class, 'hub']);
        Route::get('/dashboard', [DashboardController::class, 'index']);
        Route::post('/dashboard/switch-phase', [DashboardController::class, 'switchPhase']);

        // Periode
        Route::get('/periode/export', [PeriodeController::class, 'export']);
        Route::post('/periode/{periode}/duplicate', [PeriodeController::class, 'duplicate']);
        Route::apiResource('periode', PeriodeController::class);

        // Master Data
        Route::apiResource('tahun-akademik', TahunAkademikController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('jenis-kkn', JenisKknController::class);
        Route::apiResource('fakultas', FakultasController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('prodi', ProdiController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('lokasi', LokasiController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::post('/lokasi/import', [LokasiController::class, 'import']);
        Route::get('/lokasi/export', [LokasiController::class, 'export']);

        // Requirements
        Route::apiResource('kkn-requirements', KknRequirementController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::patch('/kkn-requirements/{requirement}/toggle', [KknRequirementController::class, 'toggle']);

        // Registrations — static routes BEFORE dynamic {param} routes
        Route::get('/pendaftaran/export', [PesertaKknController::class, 'export']);
        Route::post('/pendaftaran/bulk-approve', [PesertaKknController::class, 'bulkApprove']);
        Route::post('/pendaftaran/bulk-reject', [PesertaKknController::class, 'bulkReject']);
        Route::get('/pendaftaran', [PesertaKknController::class, 'index']);
        Route::get('/pendaftaran/{pesertaKkn}', [PesertaKknController::class, 'show']);
        Route::patch('/pendaftaran/{pesertaKkn}/approve', [PesertaKknController::class, 'approve']);
        Route::patch('/pendaftaran/{pesertaKkn}/reject', [PesertaKknController::class, 'reject']);
        Route::patch('/pendaftaran/{pesertaKkn}/assign-group', [PesertaKknController::class, 'assignGroup']);
        Route::post('/pendaftaran/{pesertaKkn}/make-leader', [PesertaKknController::class, 'makeLeader']);
        Route::post('/pendaftaran/{pesertaKkn}/make-korcam', [PesertaKknController::class, 'makeKorcam']);

        // Groups
        Route::apiResource('kelompok', KelompokKknAdminController::class)->only(['index', 'show', 'store', 'update', 'destroy']);
        Route::post('/kelompok/import', [KelompokKknAdminController::class, 'import']);

        // DPL Registration
        Route::get('/dosen/pendaftaran-dpl', [DplRegistrationController::class, 'index']);
        Route::patch('/dosen/pendaftaran-dpl/{registration}/setujui', [DplRegistrationController::class, 'approve']);
        Route::patch('/dosen/pendaftaran-dpl/{registration}/tolak', [DplRegistrationController::class, 'reject']);

        // Student Transfer
        Route::post('/peserta/pindah', [StudentTransferController::class, 'transfer']);

        // Eligibility
        Route::get('/audit-kualifikasi', [EligibilityController::class, 'index']);

        // Rekapitulasi
        Route::get('/rekapitulasi', [RekapitulasiController::class, 'index']);

        // Generator Nilai
        Route::get('/generator-nilai', [GeneratorNilaiController::class, 'index']);
        Route::get('/generator-nilai/kelompok/{kelompokKkn}/mahasiswa', [GeneratorNilaiController::class, 'students']);
        Route::post('/generator-nilai/skor', [GeneratorNilaiController::class, 'saveScores']);

        // Evaluasi DPL
        Route::get('/evaluasi-dpl', [DplParticipantEvaluationController::class, 'index']);
        Route::get('/dosen/penugasan', [DplAssignmentController::class, 'index']);
        Route::post('/dosen/tugaskan-periode', [DplAssignmentController::class, 'assignToPeriod']);
        Route::post('/dosen/tugaskan-kelompok/{group}', [DplAssignmentController::class, 'assignToGroup']);
        Route::post('/dosen/tugaskan-wilayah', [DplAssignmentController::class, 'assignDistrictCoordinator']);
        Route::post('/dosen/import', [DplAssignmentController::class, 'import']);
        Route::patch('/dosen/lepas-periode/{dplPeriod}', [DplAssignmentController::class, 'removeDplFromPeriod']);
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
        Route::post('/grade-reports/finalize-mass', [RekapNilaiController::class, 'finalizeMass']);
        Route::get('/grade-reports/export', [RekapNilaiController::class, 'export']);

        Route::get('/laporan/harian', [KegiatanKknAdminController::class, 'index']);
        Route::get('/laporan/harian/{dailyReport}', [KegiatanKknAdminController::class, 'show']);
        Route::get('/laporan/akhir', [LaporanAkhirAdminController::class, 'index']);
        Route::get('/laporan/akhir/{report}', [LaporanAkhirAdminController::class, 'show']);
        Route::patch('/laporan/akhir/{report}/status', [LaporanAkhirAdminController::class, 'updateStatus']);

        Route::get('/konfigurasi-penilaian', [KonfigurasiPenilaianController::class, 'index']);
        Route::patch('/konfigurasi-penilaian', [KonfigurasiPenilaianController::class, 'update']);

        Route::get('/yudisium', [YudisiumController::class, 'index']);
        Route::post('/yudisium/proses', [YudisiumController::class, 'proses']);

        // Content
        Route::apiResource('warta-utama', AnnouncementController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::get('/warta-utama/{announcement}/preview', [AnnouncementController::class, 'preview']);
        Route::apiResource('unduhan', DownloadController::class)->only(['index', 'store', 'update', 'destroy']);

        // Users
        Route::get('/pengguna', [UserController::class, 'index']);
        Route::post('/pengguna', [UserController::class, 'store']);
        Route::patch('/pengguna/{user}/ubah-status', [UserController::class, 'toggleActive']);
        Route::post('/pengguna/{user}/reset-password', [UserController::class, 'resetTemporaryPassword']);
        Route::get('/mahasiswa', [UserController::class, 'mahasiswaIndex']);
        Route::get('/mahasiswa/{mahasiswa}', [UserController::class, 'mahasiswaShow']);
        Route::get('/dosen', [UserController::class, 'dosenIndex']);

        // System
        Route::get('/pengaturan/sertifikat', [CertificateConfigController::class, 'index']);
        Route::post('/pengaturan/sertifikat', [CertificateConfigController::class, 'update']);
        Route::get('/pengaturan/sistem', [SystemSettingController::class, 'index']);
        Route::patch('/pengaturan/sistem', [SystemSettingController::class, 'update']);
        Route::get('/pengaturan/sistem/ai/config', [SystemSettingController::class, 'getAiConfig']);
        Route::post('/pengaturan/sistem/ai/test', [SystemSettingController::class, 'testAiConnection']);
        Route::patch('/pengaturan/sistem/ai/update', [SystemSettingController::class, 'updateAiSettings']);
        Route::delete('/pengaturan/sistem/ai/key', [SystemSettingController::class, 'removeAiKey']);
        Route::get('/audit-log', [LogAuditController::class, 'index']);
        Route::get('/audit-log/{auditLog}', [LogAuditController::class, 'show']);
    });
