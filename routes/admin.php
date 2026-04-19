<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Admin\PublicContentController;
use App\Http\Controllers\CertificateController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportExportController;
use App\Http\Controllers\WorkshopController;
use App\Http\Middleware\EnsureAdminAuthorization;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Admin Routes (Superadmin + Faculty Admin)
|--------------------------------------------------------------------------
*/

Route::middleware([
    'role:superadmin|faculty_admin|admin',
    EnsureAdminAuthorization::class,
])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::post('/dashboard/switch-phase', [Admin\DashboardController::class, 'switchPhase'])->name('dashboard.switch-phase');

    // TEMPORARY: Dev route to seed dummy data for stabilization testing
    if (app()->environment('local')) {
        Route::get('/dev/seed-dummy', function () {
            if (! auth()->user()->hasRole('superadmin')) {
                abort(403);
            }
            Artisan::call('db:seed', ['--class' => 'DummyKKN56Seeder']);

            return 'Dummy data seeded successfully! Dashboard should now show statistics.';
        })->name('dev.seed-dummy');
    }

    // Grade & Score Management (Consolidated)
    // Canonical routes: grade-reports
    Route::get('grade-reports', [Admin\RekapNilaiController::class, 'index'])->name('grade-reports.index');
    Route::get('grade-reports/ekspor', [Admin\RekapNilaiController::class, 'export'])->name('grade-reports.ekspor');
    Route::get('grade-reports/ekspor-ledger', [Admin\RekapNilaiController::class, 'exportLedger'])->name('grade-reports.ekspor-ledger');
    Route::patch('grade-reports/{score}/finalisasi', [Admin\RekapNilaiController::class, 'finalize'])->name('grade-reports.finalisasi');
    Route::post('grade-reports/finalisasi-massal', [Admin\RekapNilaiController::class, 'finalizeMass'])
        ->name('grade-reports.finalisasi-massal');
    Route::get('grade-reports/finalisasi-progres', [Admin\RekapNilaiController::class, 'getFinalizeProgress'])
        ->name('grade-reports.finalisasi-progres');

    Route::post('grade-reports/sertifikat-massal', [Admin\RekapNilaiController::class, 'bulkCertificates'])
        ->name('grade-reports.sertifikat-massal');
    Route::get('grade-reports/progres-sertifikat', [Admin\RekapNilaiController::class, 'getCertificateProgress'])
        ->name('grade-reports.progres-sertifikat');
    Route::get('certificates/bulk-download', [CertificateController::class, 'downloadMass'])
        ->middleware('throttle:2,60')
        ->name('certificates.bulk-download');

    // Backward compatibility: keep legacy rekap-nilai URLs alive as real endpoints.
    Route::get('rekap-nilai', [Admin\RekapNilaiController::class, 'index'])->name('rekap-nilai.index');
    Route::get('rekap-nilai/ekspor', [Admin\RekapNilaiController::class, 'export'])->name('rekap-nilai.ekspor');
    Route::get('rekap-nilai/ekspor-ledger', [Admin\RekapNilaiController::class, 'exportLedger'])->name('rekap-nilai.ekspor-ledger');
    Route::patch('rekap-nilai/{score}/finalisasi', [Admin\RekapNilaiController::class, 'finalize'])->name('rekap-nilai.finalisasi');
    Route::post('rekap-nilai/finalisasi-massal', [Admin\RekapNilaiController::class, 'finalizeMass'])->name('rekap-nilai.finalisasi-massal');
    Route::get('rekap-nilai/finalisasi-progres', [Admin\RekapNilaiController::class, 'getFinalizeProgress'])->name('rekap-nilai.finalisasi-progres');
    Route::post('rekap-nilai/sertifikat-massal', [Admin\RekapNilaiController::class, 'bulkCertificates'])->name('rekap-nilai.sertifikat-massal');
    Route::get('rekap-nilai/progres-sertifikat', [Admin\RekapNilaiController::class, 'getCertificateProgress'])->name('rekap-nilai.progres-sertifikat');

    // Yudisium
    Route::get('yudisium', [Admin\YudisiumController::class, 'index'])->name('yudisium.index');
    Route::post('yudisium/proses', [Admin\YudisiumController::class, 'proses'])->name('yudisium.proses');

    // Data Management
    // AI Systems Monitor (Merged into System Settings)

    Route::get('pendaftaran', [Admin\PesertaKknController::class, 'index'])->name('pendaftaran.index');
    Route::get('pendaftaran/ekspor', [Admin\PesertaKknController::class, 'export'])->name('pendaftaran.ekspor');
    Route::get('pendaftaran/ekspor-biodata', [Admin\PesertaKknController::class, 'exportBiodata'])->name('pendaftaran.ekspor-biodata');
    Route::get('pendaftaran/ekspor-bpjs', [Admin\PesertaKknController::class, 'exportBpjs'])->name('pendaftaran.ekspor-bpjs');
    Route::get('pendaftaran/berkas/unduh', [Admin\PesertaKknController::class, 'downloadDocument'])->name('pendaftaran.berkas.unduh');
    Route::get('pendaftaran/{pesertaKkn}', [Admin\PesertaKknController::class, 'show'])->name('pendaftaran.show');

    Route::get('kelompok', [Admin\KelompokKknController::class, 'index'])->name('kelompok.index');
    Route::get('kelompok/template', [Admin\KelompokKknController::class, 'downloadTemplate'])->name('kelompok.template');
    Route::get('kelompok/{kelompokKkn}', [Admin\KelompokKknController::class, 'show'])->name('kelompok.show');

    Route::get('nilai', [Admin\GradeController::class, 'index'])->name('nilai.index');
    Route::get('kelompok/{group}/mahasiswa', [Admin\GradeController::class, 'students'])->name('kelompok.mahasiswa');

    Route::get('laporan/harian', [Admin\KegiatanKknController::class, 'index'])->name('laporan.harian.index');
    Route::get('laporan/program-kerja', [Admin\ProgramKerjaController::class, 'index'])->name('laporan.program-kerja.index');
    Route::get('laporan/akhir', [Admin\LaporanAkhirController::class, 'index'])->name('laporan.akhir.index');
    Route::get('laporan/akhir/{report}', [Admin\LaporanAkhirController::class, 'show'])->name('laporan.akhir.show');
    Route::get('laporan/akhir/{report}/unduh', [Admin\LaporanAkhirController::class, 'download'])->name('laporan.akhir.unduh');
    Route::get('evaluasi', [Admin\EvaluasiController::class, 'index'])->name('evaluasi.index');

    // Audit Kualifikasi (Cek Kelayakan)
    Route::get('audit-kualifikasi', [Admin\EligibilityController::class, 'index'])->name('cek-kelayakan.index');
    Route::get('audit-kualifikasi/ekspor', [Admin\EligibilityController::class, 'export'])->name('cek-kelayakan.ekspor');
    Route::get('audit-kualifikasi/{mahasiswa}/periksa', [Admin\EligibilityController::class, 'checkStudent'])->name('cek-kelayakan.check');

    // Dispensasi KKN (Bypass Syarat Pendaftaran)
    Route::get('dispensasi', [Admin\DispensasiController::class, 'index'])->name('dispensasi.index');
    Route::post('dispensasi', [Admin\DispensasiController::class, 'store'])->name('dispensasi.store');
    Route::delete('dispensasi/{dispensasi}', [Admin\DispensasiController::class, 'destroy'])->name('dispensasi.destroy');

    // Workshop Management - DIHIDMATKAN SEMENTARA (tabel belum ada)
    // Route::prefix('workshops')->name('workshops.')->group(function () {
    //     Route::get('/', [\App\Http\Controllers\WorkshopController::class, 'index'])->name('index');
    // });
});

/*
|--------------------------------------------------------------------------
| SUPERADMIN ONLY (Sensitive operations)
|--------------------------------------------------------------------------
*/
Route::middleware(['role:superadmin|admin'])->prefix('admin')->name('admin.')->group(function () {

    // Periods & Academic Years
    Route::get('periode/ekspor', [Admin\PeriodeController::class, 'export'])->name('periode.ekspor');
    Route::post('periode/{periode}/duplikasi', [Admin\PeriodeController::class, 'duplicate'])->name('periode.duplicate');
    Route::resource('periode', Admin\PeriodeController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::get('periods', [Admin\PeriodeController::class, 'index'])->name('periods.index');

    // Master Data
    Route::resource('tahun-akademik', Admin\TahunAkademikController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Jenis KKN (Program Types)
    Route::resource('jenis-kkn', Admin\JenisKknController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);

    // Faculties & Programs
    Route::resource('fakultas', Admin\FakultasController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::resource('prodi', Admin\ProdiController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Requirements
    Route::patch('kkn-requirements/{requirement}/toggle', [Admin\KknRequirementController::class, 'toggle'])->name('kkn-requirements.toggle');
    Route::resource('kkn-requirements', Admin\KknRequirementController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Locations
    Route::get('locations/export', [Admin\LokasiController::class, 'export'])->name('locations.export');
    Route::post('lokasi/impor', [Admin\LokasiController::class, 'import'])->name('lokasi.import');
    Route::get('locations', [Admin\LokasiController::class, 'index'])->name('locations.index');
    Route::resource('lokasi', Admin\LokasiController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Workshop Management
    Route::prefix('workshops')->name('workshops.')->group(function () {
        Route::get('/', [WorkshopController::class, 'index'])->name('index');
        Route::post('/', [WorkshopController::class, 'store'])->name('store');
        Route::patch('/{workshop}', [WorkshopController::class, 'update'])->name('update');
        Route::patch('/{workshop}/cancel', [WorkshopController::class, 'cancel'])->name('cancel');
        Route::post('/{workshop}/mark-attendance', [WorkshopController::class, 'markAttendance'])->name('mark-attendance');
    });

    // User & Staff Management
    Route::get('pengguna', [Admin\UserController::class, 'index'])->name('pengguna.index');
    Route::get('pengguna/buat', [Admin\UserController::class, 'create'])->name('pengguna.create');
    Route::post('pengguna', [Admin\UserController::class, 'store'])->name('pengguna.store');
    Route::patch('pengguna/{user}/ubah-status', [Admin\UserController::class, 'toggleActive'])->name('pengguna.ubah-status');
    Route::post('pengguna/{user}/reset-password-sementara', [Admin\UserController::class, 'resetTemporaryPassword'])->name('pengguna.reset-password');

    // Personel Sync & Assignment
    Route::get('mahasiswa', [Admin\UserController::class, 'mahasiswaIndex'])->name('mahasiswa.index');
    Route::get('mahasiswa/sinkron', [Admin\StudentSyncController::class, 'index'])->name('mahasiswa.sinkron');
    Route::post('mahasiswa/sinkron', [Admin\StudentSyncController::class, 'sync'])->name('mahasiswa.sinkron.store');
    Route::get('mahasiswa/{mahasiswa}', [Admin\UserController::class, 'mahasiswaShow'])->name('mahasiswa.show');

    Route::get('dosen', [Admin\UserController::class, 'dosenIndex'])->name('dpl.index');
    Route::get('dosen/sinkron', [Admin\DplSyncController::class, 'index'])->name('dpl.sinkron');
    Route::post('dosen/sinkron', [Admin\DplSyncController::class, 'sync'])->name('dpl.sinkron.store');
    Route::get('dpl/sync', [Admin\DplSyncController::class, 'index'])->name('dpl.sync');
    Route::get('dosen/penugasan', [Admin\DplAssignmentController::class, 'index'])->name('dpl.penugasan');
    Route::redirect('dpl/assignment', 'admin/dosen/penugasan', 301)->name('dpl.assignment');
    Route::post('dosen/tugaskan-periode', [Admin\DplAssignmentController::class, 'assignToPeriod'])->name('dpl.tugaskan-periode');
    Route::post('dosen/tugaskan-kelompok/{group}', [Admin\DplAssignmentController::class, 'assignToGroup'])->name('dpl.tugaskan-kelompok');
    Route::post('dosen/tugaskan-wilayah', [Admin\DplAssignmentController::class, 'assignDistrictCoordinator'])->name('dpl.tugaskan-wilayah');
    Route::post('dosen/impor', [Admin\DplAssignmentController::class, 'import'])->name('dpl.impor');
    Route::patch('dosen/lepas-periode/{dplPeriod}', [Admin\DplAssignmentController::class, 'removeDplFromPeriod'])->name('dpl.lepas-periode');
    Route::patch('dosen/lepas-wilayah/{districtCoordinator}', [Admin\DplAssignmentController::class, 'removeDistrictCoordinator'])->name('dpl.lepas-wilayah');

    // Participant Operations
    Route::get('peserta/pindah', [Admin\StudentTransferController::class, 'index'])->name('peserta.pindah.index');
    Route::post('peserta/pindah', [Admin\StudentTransferController::class, 'transfer'])->name('peserta.pindah');
    Route::post('pendaftaran/setuju-massal', [Admin\PesertaKknController::class, 'bulkApprove'])->name('pendaftaran.setuju-massal');
    Route::post('pendaftaran/tolak-massal', [Admin\PesertaKknController::class, 'bulkReject'])->name('pendaftaran.tolak-massal');
    Route::patch('pendaftaran/{pesertaKkn}/setujui', [Admin\PesertaKknController::class, 'approve'])->name('pendaftaran.setujui');
    Route::patch('pendaftaran/{pesertaKkn}/tolak', [Admin\PesertaKknController::class, 'reject'])->name('pendaftaran.tolak');
    Route::patch('pendaftaran/{pesertaKkn}/tugaskan-kelompok', [Admin\PesertaKknController::class, 'assignGroup'])->name('pendaftaran.tugaskan-kelompok');
    Route::post('pendaftaran/{registration}/jadikan-ketua', [Admin\PesertaKknController::class, 'makeLeader'])->name('pendaftaran.jadikan-ketua');

    // Groups CRUD
    Route::post('kelompok/impor', [Admin\KelompokKknController::class, 'import'])->name('kelompok.import');
    Route::resource('kelompok', Admin\KelompokKknController::class)
        ->only(['store', 'update', 'destroy']);

    Route::get('rekapitulasi', [Admin\RekapitulasiController::class, 'index'])->name('rekapitulasi.index');

    // Public Content Management
    Route::resource('unduhan', Admin\DownloadController::class)
        ->only(['index', 'create', 'store', 'update', 'destroy']);
    Route::get('warta-utama', [Admin\AnnouncementController::class, 'index'])->name('warta-utama.index');
    Route::post('warta-utama', [Admin\AnnouncementController::class, 'store'])->name('warta-utama.store');
    Route::patch('warta-utama/{announcement}', [Admin\AnnouncementController::class, 'update'])->name('warta-utama.update');
    Route::delete('warta-utama/{announcement}', [Admin\AnnouncementController::class, 'destroy'])->name('warta-utama.destroy');
    Route::prefix('konten-publik')->name('konten.')->group(function () {
        Route::get('profil', [PublicContentController::class, 'profile'])->name('profil.index');
        Route::patch('profil', [PublicContentController::class, 'updateProfile'])->name('profil.update');
        Route::get('skema', [PublicContentController::class, 'schemes'])->name('skema.index');
        Route::patch('skema', [PublicContentController::class, 'updateSchemes'])->name('skema.update');
    });

    // Database Sync Monitoring
    Route::get('database-sync', [Admin\DatabaseSyncController::class, 'index'])->name('database-sync.index');
    Route::get('database-sync/health', [Admin\DatabaseSyncController::class, 'health'])->name('database-sync.health');
    Route::get('database-sync/statistics', [Admin\DatabaseSyncController::class, 'statistics'])->name('database-sync.statistics');
    Route::post('database-sync/retry', [Admin\DatabaseSyncController::class, 'retry'])->name('database-sync.retry');
    Route::post('database-sync/retry/{log}', [Admin\DatabaseSyncController::class, 'retryLog'])->name('database-sync.retry-log');
    Route::post('database-sync/cleanup', [Admin\DatabaseSyncController::class, 'cleanup'])->name('database-sync.cleanup');
    Route::post('database-sync/test-connection', [Admin\DatabaseSyncController::class, 'testConnection'])->name('database-sync.test-connection');
    Route::post('database-sync/manual', [Admin\DatabaseSyncController::class, 'manualSync'])->name('database-sync.manual');
    Route::get('database-sync/logs/{log}', [Admin\DatabaseSyncController::class, 'show'])->name('database-sync.logs.show');

    // Eligibility write operations
    Route::post('audit-kualifikasi/bulk-update-sks', [Admin\EligibilityController::class, 'bulkUpdateSks'])->name('cek-kelayakan.bulk-update-sks');

    // Grading write operations
    Route::post('nilai', [Admin\GradeController::class, 'store'])->name('nilai.store');
    Route::get('konfigurasi-penilaian', [Admin\KonfigurasiPenilaianController::class, 'index'])->name('konfigurasi-penilaian.index');
    Route::patch('konfigurasi-penilaian', [Admin\KonfigurasiPenilaianController::class, 'update'])->name('konfigurasi-penilaian.update');

    // Settings
    Route::prefix('pengaturan')->name('pengaturan.')->group(function () {
        Route::get('sertifikat', [Admin\CertificateConfigController::class, 'index'])->name('sertifikat.index');
        Route::patch('sertifikat', [Admin\CertificateConfigController::class, 'update'])->name('sertifikat.update');
        Route::get('sistem', [Admin\SystemSettingController::class, 'index'])->name('sistem');
        Route::patch('sistem', [Admin\SystemSettingController::class, 'update'])->name('sistem.update');
        Route::post('sistem/ai/test', [Admin\SystemSettingController::class, 'testAiConnection'])->name('sistem.ai.test');
        Route::patch('sistem/ai/update', [Admin\SystemSettingController::class, 'updateAiSettings'])->name('sistem.ai.update');
        Route::delete('sistem/ai/key', [Admin\SystemSettingController::class, 'removeAiKey'])->name('sistem.ai.remove');
    });

    Route::get('audit-log', [Admin\LogAuditController::class, 'index'])->name('audit-log.index');
    Route::get('audit-log/{auditLog}', [Admin\LogAuditController::class, 'show'])->name('audit-log.show');

    Route::get('api/available-dpl', [Admin\DplAssignmentController::class, 'getAvailableDpl'])->name('api.available-dpl');
    Route::get('api/transfer-targets', [Admin\StudentTransferController::class, 'getTransferTargets'])->name('api.transfer-targets');
});

/*
|--------------------------------------------------------------------------
| SHARED ADMIN AREA (Admin & DPL)
|--------------------------------------------------------------------------
*/
Route::middleware(['role:superadmin|dpl|admin'])->prefix('admin')->name('admin.')->group(function () {
    // Laporan Aktivitas
    Route::get('laporan', [ReportController::class, 'index'])->name('laporan.index');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('laporan/harian/ekspor-pdf/{studentId}', [ReportExportController::class, 'downloadStudentDailyReports'])->name('laporan.harian.export-pdf');
    Route::get('auditor-aktivitas', [Admin\ActivityAuditController::class, 'index'])->name('activity-audit.index');
    Route::get('laporan/{report}/unduh', [ReportController::class, 'download'])->name('laporan.unduh');

    // Grade Generator & Exports
    Route::get('generator-nilai', [Admin\GeneratorNilaiController::class, 'index'])->name('generator-nilai.index');
    Route::get('generator-nilai/kelompok/semua/mahasiswa', [Admin\GeneratorNilaiController::class, 'studentsAll'])->name('generator-nilai.students-all');
    Route::get('generator-nilai/kelompok/{kelompokKkn}/mahasiswa', [Admin\GeneratorNilaiController::class, 'students'])->name('generator-nilai.students');
    Route::post('generator-nilai/skor', [Admin\GeneratorNilaiController::class, 'saveScores'])->name('generator-nilai.save-scores');
    Route::get('generator-nilai/ekspor/{id}', [Admin\GeneratorNilaiController::class, 'exportExcel'])->name('generator-nilai.export');
    Route::get('generator-nilai/ekspor-pdf/{id}', [Admin\GeneratorNilaiController::class, 'exportPdf'])->name('generator-nilai.export-pdf');
    Route::get('generator-nilai/ekspor-zip', [Admin\GeneratorNilaiController::class, 'exportZip'])->name('generator-nilai.export-zip');

    // Advanced Exports
    Route::get('ekspor/laporan-harian/kelompok/{groupId}', [ReportExportController::class, 'downloadGroupDailyReports'])->name('export.laporan-harian.kelompok');
    Route::get('ekspor/laporan-harian/mahasiswa/{studentId}', [ReportExportController::class, 'downloadStudentDailyReports'])->name('export.laporan-harian.mahasiswa');
});
