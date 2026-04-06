<?php

use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\PasswordResetController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\Admin;
use App\Http\Controllers\Dpl;
use App\Http\Controllers\Student;
use App\Http\Controllers\Admin\PublicContentController;
use Illuminate\Support\Facades\Route;

// Guest routes
Route::middleware(['guest', 'kkn.throttle', 'disable.debugbar'])->group(function () {
    Route::get('/login', [AuthenticatedSessionController::class , 'create'])->name('login');
    Route::post('/login', [AuthenticatedSessionController::class , 'store'])->name('login.store');
    Route::get('/login/captcha-refresh', [AuthenticatedSessionController::class, 'refresh'])->name('login.captcha.refresh');

    // Lupa Kata Sandi
    Route::get('/lupa-kata-sandi', [PasswordResetController::class , 'showForgotForm'])->name('password.request');
    Route::post('/lupa-kata-sandi', [PasswordResetController::class , 'sendResetLink'])->name('password.email');
    Route::get('/atur-ulang-kata-sandi/{token}', [PasswordResetController::class , 'showResetForm'])->name('password.reset');
    Route::post('/atur-ulang-kata-sandi', [PasswordResetController::class , 'reset'])->name('password.update');
});

// Home / Landing Page
Route::get('/', [\App\Http\Controllers\HomeController::class, 'index'])->name('home');
Route::get('/profil', [\App\Http\Controllers\HomeController::class, 'about'])->name('public.about');
Route::get('/skema-kkn', [\App\Http\Controllers\HomeController::class, 'schemes'])->name('public.schemes');
Route::get('/warta', [\App\Http\Controllers\HomeController::class, 'announcements'])->name('public.announcements');
Route::get('/repositori', [\App\Http\Controllers\HomeController::class, 'downloads'])->name('public.downloads');
Route::get('/cari-lokasi', [\App\Http\Controllers\HomeController::class, 'locations'])->name('public.locations');

// Authenticated routes
Route::middleware(['auth', 'kkn.throttle'])->group(function () {
    Route::post('/logout', [AuthenticatedSessionController::class , 'destroy'])->name('logout');

    // Profil Saya
    Route::get('/profil-saya', [ProfileController::class , 'show'])->name('profile.show');
    Route::put('/profil-saya', [ProfileController::class , 'update'])->name('profile.update');
    Route::post('/profil-saya/avatar', [ProfileController::class , 'updateAvatar'])->name('profile.avatar');
    Route::post('/profil-saya/kata-sandi', [ProfileController::class , 'updatePassword'])->name('profile.password');

    Route::get('/dashboard', [DashboardController::class , 'index'])->name('dashboard');

    Route::middleware(['role:superadmin|faculty_admin|admin'])->prefix('admin')->name('admin.')->group(function () {
        // Grade & Score Management
        Route::get('grade-reports', [Admin\RekapNilaiController::class , 'index'])->name('grade-reports.index');
        Route::get('grade-reports/ekspor', [Admin\RekapNilaiController::class , 'export'])->name('grade-reports.ekspor');
        Route::get('grade-reports/ekspor-ledger', [Admin\RekapNilaiController::class , 'exportLedger'])->name('grade-reports.ekspor-ledger');
        Route::patch('grade-reports/{score}/finalisasi', [Admin\RekapNilaiController::class , 'finalize'])->name('grade-reports.finalisasi');
        Route::post('grade-reports/finalisasi-massal', [Admin\RekapNilaiController::class , 'finalizeMass'])->name('grade-reports.finalisasi-massal');
        Route::get('grade-recap', [Admin\RekapNilaiController::class , 'index'])->name('grade-recap.index');
        Route::get('grade-recap/export', [Admin\RekapNilaiController::class , 'export'])->name('grade-recap.export');
        Route::get('grade-recap/export-ledger', [Admin\RekapNilaiController::class , 'exportLedger'])->name('grade-recap.export-ledger');
        Route::patch('grade-recap/{score}/finalize', [Admin\RekapNilaiController::class , 'finalize'])->name('grade-recap.finalize');
        Route::post('grade-recap/finalize-bulk', [Admin\RekapNilaiController::class , 'finalizeMass'])->name('grade-recap.finalize-bulk');
        Route::get('rekap-nilai', [Admin\RekapNilaiController::class , 'index'])->name('rekap-nilai.index');
        Route::get('rekap-nilai/ekspor', [Admin\RekapNilaiController::class , 'export'])->name('rekap-nilai.ekspor');
        Route::get('rekap-nilai/ekspor-ledger', [Admin\RekapNilaiController::class , 'exportLedger'])->name('rekap-nilai.ekspor-ledger');
        Route::patch('rekap-nilai/{score}/finalisasi', [Admin\RekapNilaiController::class , 'finalize'])->name('rekap-nilai.finalisasi');
        Route::post('rekap-nilai/finalisasi-massal', [Admin\RekapNilaiController::class , 'finalizeMass'])->name('rekap-nilai.finalisasi-massal');
    });

    // ==========================================
    // ADMIN AREA (Superadmin + Faculty Admin)
    // ==========================================
    Route::middleware(['role:superadmin|faculty_admin|admin'])->prefix('admin')->name('admin.')->group(function () {
        // Dashboard (faculty_admin see their faculty-scoped dashboard)
        Route::get('/', [Admin\DashboardController::class , 'index'])->name('dashboard');

        // Read-only data that faculty_admin should access
        Route::get('pendaftaran', [Admin\PesertaKknController::class , 'index'])->name('pendaftaran.index');
        Route::get('pendaftaran/ekspor', [Admin\PesertaKknController::class , 'export'])->name('pendaftaran.ekspor');
        Route::get('pendaftaran/ekspor-bpjs', [Admin\PesertaKknController::class , 'exportBpjs'])->name('pendaftaran.ekspor-bpjs');
        Route::get('pendaftaran/berkas/unduh', [Admin\PesertaKknController::class, 'downloadDocument'])->name('pendaftaran.berkas.unduh');
        Route::get('pendaftaran/{pesertaKkn}', [Admin\PesertaKknController::class , 'show'])->name('pendaftaran.show');

        Route::get('kelompok', [Admin\KelompokKknController::class , 'index'])->name('kelompok.index');
        Route::get('kelompok/template', [Admin\KelompokKknController::class, 'downloadTemplate'])->name('kelompok.template');
        Route::get('kelompok/{kelompokKkn}', [Admin\KelompokKknController::class , 'show'])->name('kelompok.show');

        Route::get('nilai', [Admin\GradeController::class , 'index'])->name('nilai.index');
        Route::get('kelompok/{group}/mahasiswa', [Admin\GradeController::class , 'students'])->name('kelompok.mahasiswa');

        Route::get('laporan/harian', [Admin\KegiatanKknController::class , 'index'])->name('laporan.harian.index');
        Route::get('laporan/program-kerja', [Admin\ProgramKerjaController::class , 'index'])->name('laporan.program-kerja.index');
        Route::get('laporan/akhir', [Admin\LaporanAkhirController::class , 'index'])->name('laporan.akhir.index');
        Route::get('evaluasi', [Admin\EvaluasiController::class , 'index'])->name('evaluasi.index');

        Route::get('cek-kelayakan', [Admin\EligibilityController::class , 'index'])->name('cek-kelayakan.index');
        Route::get('cek-kelayakan/ekspor', [Admin\EligibilityController::class , 'export'])->name('cek-kelayakan.ekspor');
        Route::get('cek-kelayakan/{mahasiswa}/periksa', [Admin\EligibilityController::class , 'checkStudent'])->name('cek-kelayakan.check');
    });

    // ==========================================
    // SUPERADMIN ONLY (Sensitive operations)
    // ==========================================
    Route::middleware(['role:superadmin|admin'])->prefix('admin')->name('admin.')->group(function () {
        Route::get('pratinjau-taktis', Admin\TacticalDashboardController::class)->name('pratinjau-taktis');

        // Master Data (CRUD)
        Route::get('periode/ekspor', [Admin\PeriodeController::class, 'export'])->name('periode.ekspor');
        Route::post('periode/{periode}/duplikasi', [Admin\PeriodeController::class , 'duplicate'])->name('periode.duplicate');
        Route::post('periods/{periode}/duplicate', [Admin\PeriodeController::class , 'duplicate'])->name('periods.duplicate');
        
        Route::resource('tahun-akademik', Admin\TahunAkademikController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['tahun-akademik' => 'tahunAkademik']);
        Route::resource('academic-years', Admin\TahunAkademikController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['academic-years' => 'tahunAkademik'])
            ->names('academic-years');
            
        Route::resource('periode', Admin\PeriodeController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['periode' => 'periode']);
        Route::resource('periods', Admin\PeriodeController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['periods' => 'periode'])
            ->names('periods');
            
        Route::resource('fakultas', Admin\FakultasController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['fakultas' => 'fakultas']);
        Route::resource('faculties', Admin\FakultasController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['faculties' => 'fakultas'])
            ->names('faculties');
            
        Route::resource('prodi', Admin\ProdiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['prodi' => 'prodi']);
        Route::resource('programs', Admin\ProdiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['programs' => 'program'])
            ->names('programs');

        // KKN Requirements (Dynamic Engine)
        Route::patch('kkn-requirements/{requirement}/toggle', [Admin\KknRequirementController::class, 'toggle'])->name('kkn-requirements.toggle');
        Route::resource('kkn-requirements', Admin\KknRequirementController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['kkn-requirements' => 'requirement']);

        Route::post('lokasi/impor', [Admin\LokasiController::class, 'import'])->name('lokasi.import');
        Route::post('locations/import', [Admin\LokasiController::class, 'import'])->name('locations.import');
        Route::resource('lokasi', Admin\LokasiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['lokasi' => 'lokasi']);
        Route::resource('locations', Admin\LokasiController::class)
            ->only(['index', 'store', 'update', 'destroy'])
            ->parameters(['locations' => 'lokasi'])
            ->names('locations');

        // User & Staff Management
        Route::get('pengguna', [Admin\UserController::class , 'index'])->name('pengguna.index');
        Route::get('pengguna/buat', [Admin\UserController::class , 'create'])->name('pengguna.create');
        Route::post('pengguna', [Admin\UserController::class , 'store'])->name('pengguna.store');
        Route::patch('pengguna/{user}/toggle-status', [Admin\UserController::class , 'toggleActive'])->name('pengguna.toggle-status');
        Route::patch('pengguna/{user}/ubah-status', [Admin\UserController::class , 'toggleActive'])->name('pengguna.ubah-status');
        Route::post('pengguna/{user}/reset-password-sementara', [Admin\UserController::class , 'resetTemporaryPassword'])->name('pengguna.reset-password');
        
        // Personel: Mahasiswa
        Route::get('mahasiswa', [Admin\UserController::class , 'mahasiswaIndex'])->name('mahasiswa.index');
        Route::get('mahasiswa/sinkron', [Admin\StudentSyncController::class, 'index'])->name('mahasiswa.sinkron');
        Route::post('mahasiswa/sinkron', [Admin\StudentSyncController::class, 'sync'])->name('mahasiswa.sinkron.store');

        // Personel: Dosen (DPL)
        Route::get('dosen', [Admin\UserController::class , 'dosenIndex'])->name('dpl.index');
        Route::get('dosen/sinkron', [Admin\DplSyncController::class, 'index'])->name('dpl.sinkron');
        Route::post('dosen/sinkron', [Admin\DplSyncController::class, 'sync'])->name('dpl.sinkron.store');
        Route::get('dosen/penugasan', [Admin\DplAssignmentController::class , 'index'])->name('dpl.penugasan');
        Route::post('dosen/tugaskan-periode', [Admin\DplAssignmentController::class , 'assignToPeriod'])->name('dpl.tugaskan-periode');
        Route::post('dosen/tugaskan-kelompok/{group}', [Admin\DplAssignmentController::class , 'assignToGroup'])->name('dpl.tugaskan-kelompok');
        Route::post('dosen/tugaskan-wilayah', [Admin\DplAssignmentController::class , 'assignDistrictCoordinator'])->name('dpl.tugaskan-wilayah');
        Route::post('dosen/impor', [Admin\DplAssignmentController::class , 'import'])->name('dpl.impor');
        Route::patch('dosen/lepas-periode/{dplPeriod}', [Admin\DplAssignmentController::class , 'removeDplFromPeriod'])->name('dpl.lepas-periode');
        Route::patch('dosen/lepas-wilayah/{districtCoordinator}', [Admin\DplAssignmentController::class , 'removeDistrictCoordinator'])->name('dpl.lepas-wilayah');
        Route::get('dpl/sync', [Admin\DplSyncController::class, 'index'])->name('dpl.sync');
        Route::post('dpl/sync', [Admin\DplSyncController::class, 'sync'])->name('dpl.sync.store');
        Route::get('dpl/assignment', [Admin\DplAssignmentController::class , 'index'])->name('dpl.assignment');
        Route::get('dosen/penugasan', [Admin\DplAssignmentController::class , 'index'])->name('dosen.penugasan');
        Route::get('dpl/penugasan', [Admin\DplAssignmentController::class , 'index'])->name('dpl.penugasan');
        Route::post('dpl/assign-period', [Admin\DplAssignmentController::class , 'assignToPeriod'])->name('dpl.assign-period');
        Route::post('dpl/assign-group/{group}', [Admin\DplAssignmentController::class , 'assignToGroup'])->name('dpl.assign-group');
        Route::post('dpl/assign-district', [Admin\DplAssignmentController::class , 'assignDistrictCoordinator'])->name('dpl.assign-district');

        // Participant Operations
        Route::get('peserta/pindah', [Admin\StudentTransferController::class , 'index'])->name('peserta.pindah.index');
        Route::post('peserta/pindah', [Admin\StudentTransferController::class , 'transfer'])->name('peserta.pindah');
        Route::post('pendaftaran/setuju-massal', [Admin\PesertaKknController::class , 'bulkApprove'])->name('pendaftaran.setuju-massal');
        Route::post('pendaftaran/tolak-massal', [Admin\PesertaKknController::class , 'bulkReject'])->name('pendaftaran.tolak-massal');
        Route::patch('pendaftaran/{pesertaKkn}/setujui', [Admin\PesertaKknController::class , 'approve'])->name('pendaftaran.setujui');
        Route::patch('pendaftaran/{pesertaKkn}/tolak', [Admin\PesertaKknController::class , 'reject'])->name('pendaftaran.tolak');
        Route::patch('pendaftaran/{pesertaKkn}/tugaskan-kelompok', [Admin\PesertaKknController::class , 'assignGroup'])->name('pendaftaran.tugaskan-kelompok');
        Route::post('pendaftaran/{registration}/jadikan-ketua', [Admin\PesertaKknController::class , 'makeLeader'])->name('pendaftaran.jadikan-ketua');

        // Groups CRUD
        Route::post('kelompok/impor', [Admin\KelompokKknController::class, 'import'])->name('kelompok.import');
        Route::resource('kelompok', Admin\KelompokKknController::class)
            ->only(['store', 'update', 'destroy'])
            ->parameters(['kelompok' => 'kelompokKkn']);

        // Public Content Management
        Route::resource('warta-utama', Admin\AnnouncementController::class)->except(['create', 'edit', 'show']);
        Route::resource('unduhan', Admin\DownloadController::class);
        Route::prefix('konten-publik')->name('konten.')->group(function () {
            Route::get('profil', [PublicContentController::class, 'profile'])->name('profil.index');
            Route::post('profil', [PublicContentController::class, 'updateProfile'])->name('profil.update');
            Route::get('skema', [PublicContentController::class, 'schemes'])->name('skema.index');
            Route::post('skema', [PublicContentController::class, 'updateSchemes'])->name('skema.update');
        });

        // Eligibility write operations
        Route::post('cek-kelayakan/bulk-update-sks', [Admin\EligibilityController::class , 'bulkUpdateSks'])->name('cek-kelayakan.bulk-update-sks');

        // Grading write operations
        Route::post('nilai', [Admin\GradeController::class , 'store'])->name('nilai.store');
        Route::get('konfigurasi-penilaian', [Admin\KonfigurasiPenilaianController::class , 'index'])->name('konfigurasi-penilaian.index');
        Route::post('konfigurasi-penilaian', [Admin\KonfigurasiPenilaianController::class , 'update'])->name('konfigurasi-penilaian.update');
        Route::get('grading-settings', [Admin\KonfigurasiPenilaianController::class , 'index'])->name('grading-settings.index');
        Route::post('grading-settings', [Admin\KonfigurasiPenilaianController::class , 'update'])->name('grading-settings.update');

        // Settings
        Route::prefix('pengaturan')->name('pengaturan.')->group(function () {
            Route::get('sertifikat', [Admin\CertificateConfigController::class , 'index'])->name('sertifikat.index');
            Route::post('sertifikat', [Admin\CertificateConfigController::class , 'update'])->name('sertifikat.update');
            Route::get('sistem', [Admin\SystemSettingController::class , 'index'])->name('sistem.index');
            Route::post('sistem', [Admin\SystemSettingController::class , 'update'])->name('sistem.update');
        });

        Route::get('audit-log', [Admin\LogAuditController::class , 'index'])->name('audit-log.index');
        Route::get('audit-log/{auditLog}', [Admin\LogAuditController::class , 'show'])->name('audit-log.show');
        
        // Workshop Management (Full Admin Control)
        Route::get('workshop', [Admin\WorkshopController::class , 'index'])->name('workshop.index');
        Route::get('workshops', [Admin\WorkshopController::class , 'index'])->name('workshops.index');
        Route::post('workshop', [Admin\WorkshopController::class , 'store'])->name('workshop.store');
        Route::patch('workshop/{workshop}', [Admin\WorkshopController::class , 'update'])->name('workshop.update');
        Route::patch('workshop/{workshop}/cancel', [Admin\WorkshopController::class , 'destroy'])->name('workshop.cancel');
        Route::post('workshop/{workshop}/attendance', [Admin\WorkshopController::class , 'bulkAttendance'])->name('workshop.bulk-attendance');
        Route::post('workshop/{workshop}/import-absensi', [Admin\WorkshopController::class , 'importAttendance'])->name('workshop.import-absensi');
        Route::post('workshop/{workshop}/preview-absensi', [Admin\WorkshopController::class , 'previewAttendance'])->name('workshop.preview-absensi');
        Route::get('api/available-dpl', [Admin\DplAssignmentController::class , 'getAvailableDpl'])->name('api.available-dpl');
        Route::get('api/transfer-targets', [Admin\StudentTransferController::class , 'getTransferTargets'])->name('api.transfer-targets');
    });

    // ==========================================
    // SHARED ADMIN AREA (Admin & DPL)
    // ==========================================
    Route::middleware(['role:superadmin|dpl|admin'])->prefix('admin')->name('admin.')->group(function () {
        // Laporan Aktivitas
        Route::get('laporan', [App\Http\Controllers\ReportController::class , 'index'])->name('laporan.index');
        Route::get('reports', [App\Http\Controllers\ReportController::class , 'index'])->name('reports.index');
        Route::get('laporan/harian', [Admin\KegiatanKknController::class , 'index'])->name('laporan.harian.index');
        Route::get('laporan/harian/ekspor-pdf/{studentId}', [App\Http\Controllers\ReportExportController::class , 'downloadStudentDailyReports'])->name('laporan.harian.export-pdf');
        Route::get('laporan/program-kerja', [Admin\ProgramKerjaController::class , 'index'])->name('laporan.program-kerja.index');
        Route::get('laporan/akhir', [Admin\LaporanAkhirController::class , 'index'])->name('laporan.akhir.index');
        Route::get('auditor-aktivitas', [Admin\ActivityAuditController::class , 'index'])->name('activity-audit.index');
        Route::get('laporan/{report}/unduh', [App\Http\Controllers\ReportController::class , 'download'])->name('laporan.unduh');
        Route::get('reports/{report}/download', [App\Http\Controllers\ReportController::class , 'download'])->name('reports.download');

        // Grade Generator & Exports
        Route::get('generator-nilai', [Admin\GeneratorNilaiController::class , 'index'])->name('generator-nilai.index');
        Route::get('generator-nilai/kelompok/semua/mahasiswa', [Admin\GeneratorNilaiController::class , 'studentsAll'])->name('generator-nilai.students-all');
        Route::get('generator-nilai/kelompok/{kelompokKkn}/mahasiswa', [Admin\GeneratorNilaiController::class , 'students'])->name('generator-nilai.students');
        Route::post('generator-nilai/skor', [Admin\GeneratorNilaiController::class , 'saveScores'])->name('generator-nilai.save-scores');
        Route::get('generator-nilai/ekspor/{id}', [Admin\GeneratorNilaiController::class , 'exportExcel'])->name('generator-nilai.export');
        Route::get('generator-nilai/ekspor-pdf/{id}', [Admin\GeneratorNilaiController::class , 'exportPdf'])->name('generator-nilai.export-pdf');
        Route::get('generator-nilai/ekspor-zip', [Admin\GeneratorNilaiController::class , 'exportZip'])->name('generator-nilai.export-zip');

        // Advanced Exports
        Route::get('ekspor/laporan-harian/kelompok/{groupId}', [App\Http\Controllers\ReportExportController::class , 'downloadGroupDailyReports'])->name('export.laporan-harian.kelompok');
        Route::get('ekspor/laporan-harian/mahasiswa/{studentId}', [App\Http\Controllers\ReportExportController::class , 'downloadStudentDailyReports'])->name('export.laporan-harian.mahasiswa');
    });

    // ==========================================
    // AREA DPL
    // ==========================================
    Route::middleware(['role:dpl'])->prefix('dpl')->name('dpl.')->group(function () {
        Route::get('/', [Dpl\DashboardController::class , 'index'])->name('dashboard');
        Route::get('kelompok', [Dpl\GroupController::class , 'index'])->name('groups.index');
        Route::get('kelompok/{group}', [Dpl\GroupController::class , 'show'])->name('groups.show');
        Route::get('laporan-harian', [Dpl\DailyReportController::class , 'index'])->name('daily-reports.index');
        Route::get('laporan-harian/{dailyReport}', [Dpl\DailyReportController::class , 'show'])->name('daily-reports.show');
        Route::get('laporan-harian/berkas/{fileKegiatan}', [Dpl\DailyReportController::class , 'downloadFile'])->name('daily-reports.files.download');
        Route::post('laporan-harian/setujui-semua', [Dpl\DailyReportController::class , 'batchApprove'])->name('daily-reports.approve-all');
        Route::patch('laporan-harian/{dailyReport}/setujui', [Dpl\DailyReportController::class , 'approve'])->name('daily-reports.approve');
        Route::patch('laporan-harian/{dailyReport}/revisi', [Dpl\DailyReportController::class , 'revision'])->name('daily-reports.revision');
        Route::patch('laporan-harian/{dailyReport}/tolak', [Dpl\DailyReportController::class , 'revision'])->name('daily-reports.reject');
        Route::get('evaluasi', [Dpl\EvaluationController::class , 'index'])->name('evaluations.index');
        Route::post('evaluasi/validasi-impor', [Dpl\EvaluationController::class , 'validateImport'])->name('evaluations.validate-import');
        Route::post('evaluasi/impor', [Dpl\EvaluationController::class , 'import'])->name('evaluations.import');
        Route::get('evaluasi/buat', [Dpl\EvaluationController::class , 'create'])->name('evaluations.create');
        Route::post('evaluasi', [Dpl\EvaluationController::class , 'store'])->name('evaluations.store');
        Route::get('laporan-akhir', [Dpl\FinalReportController::class , 'index'])->name('final-reports.index');
        Route::get('laporan-akhir/{report}', [Dpl\FinalReportController::class , 'show'])->name('final-reports.show');
        Route::get('laporan-akhir/{report}/unduh', [Dpl\FinalReportController::class , 'download'])->name('final-reports.download');
        Route::patch('laporan-akhir/{report}/setujui', [Dpl\FinalReportController::class , 'approve'])->name('final-reports.approve');
        Route::patch('laporan-akhir/{report}/revisi', [Dpl\FinalReportController::class , 'revision'])->name('final-reports.revision');
    });

    // ==========================================
    // STUDENT AREA (Student Only)
    // ==========================================
    Route::middleware(['role:student'])->prefix('mahasiswa')->name('student.')->group(function () {
        Route::get('/', [Student\DashboardController::class , 'index'])->name('dashboard');
        Route::get('pendaftaran', [Student\RegistrationController::class , 'create'])->name('registration.create');
        Route::post('pendaftaran', [Student\RegistrationController::class , 'store'])->name('registration.store');
        Route::delete('pendaftaran/{periode}/kelompok', [Student\RegistrationController::class, 'leave'])->name('registration.leave');
        Route::get('posko', [Student\PoskoController::class, 'edit'])->name('posko.edit');
        Route::post('posko', [Student\PoskoController::class, 'store'])->name('posko.store');

        Route::resource('laporan-harian', Student\DailyReportController::class)
            ->only(['index', 'create', 'store', 'edit', 'update', 'destroy'])
            ->parameters(['laporan-harian' => 'dailyReport']);
        Route::get('laporan-harian/unduh-rekap', [App\Http\Controllers\ReportExportController::class , 'downloadMyDailyReports'])->name('daily-reports.download-compilation');

        Route::get('program-kerja', [Student\WorkProgramController::class , 'index'])->name('work-programs.index');
        Route::get('program-kerja/buat', [Student\WorkProgramController::class , 'create'])->name('work-programs.create');
        Route::post('program-kerja', [Student\WorkProgramController::class , 'store'])->name('work-programs.store');

        Route::get('laporan-akhir', [Student\FinalReportController::class , 'create'])->name('final-report.create');
        Route::post('laporan-akhir', [Student\FinalReportController::class , 'store'])->name('final-report.store');
        Route::get('evaluasi', [Student\EvaluationController::class , 'index'])->name('evaluations.index');

        // Additional Shared Student routes
        Route::get('laporan-umum', [App\Http\Controllers\ReportController::class , 'index'])->name('reports.index');
        Route::post('laporan-umum/unggah', [App\Http\Controllers\ReportController::class , 'upload'])->name('reports.upload');
        Route::get('workshop', [App\Http\Controllers\WorkshopController::class , 'index'])->name('workshops.index');
        Route::post('workshop/{workshop}/daftar', [App\Http\Controllers\WorkshopController::class , 'register'])->name('workshops.register');
    });

    // protected global routes (with role-based access)
    Route::get('/reports/{report}/download', [App\Http\Controllers\ReportController::class, 'download'])
        ->name('reports.download')
        ->middleware('role:superadmin|dpl|student');
    Route::get('/posko/{posko}/photo', [Student\PoskoController::class, 'photo'])
        ->name('posko.photo')
        ->middleware('role:superadmin|dpl|student');
    Route::get('/scores/{score}/evidence', [\App\Http\Controllers\ReportController::class, 'showEvidence'])
        ->name('scores.evidence')
        ->middleware('role:superadmin|dpl');
    Route::get('/certificates/{score}/download', [App\Http\Controllers\CertificateController::class , 'download'])
        ->name('certificates.download')
        ->middleware('role:superadmin|dpl|student');
    Route::get('/admin/certificates/bulk-download', [App\Http\Controllers\CertificateController::class , 'downloadMass'])
        ->name('admin.certificates.bulk-download')
        ->middleware('role:superadmin');
});
