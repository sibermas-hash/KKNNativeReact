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
    Route::prefix('grade-reports')->name('grade-reports.')->group(function () {
        Route::get('/', [Admin\RekapNilaiController::class, 'index'])->name('index');
        Route::get('ekspor', [Admin\RekapNilaiController::class, 'export'])->name('ekspor');
        Route::get('ekspor-ledger', [Admin\RekapNilaiController::class, 'exportLedger'])->name('ekspor-ledger');
        
        Route::prefix('{score}')->group(function () {
            Route::patch('finalisasi', [Admin\RekapNilaiController::class, 'finalize'])->name('finalisasi');
        });

        Route::post('finalisasi-massal', [Admin\RekapNilaiController::class, 'finalizeMass'])
            ->middleware('throttle:5,60')
            ->name('finalisasi-massal');
        Route::get('finalisasi-progres', [Admin\RekapNilaiController::class, 'getFinalizeProgress'])->name('finalisasi-progres');
        Route::post('sertifikat-massal', [Admin\RekapNilaiController::class, 'bulkCertificates'])
            ->middleware('throttle:5,60')
            ->name('sertifikat-massal');
        Route::get('progres-sertifikat', [Admin\RekapNilaiController::class, 'getCertificateProgress'])->name('progres-sertifikat');
    });
    Route::get('certificates/bulk-download', [CertificateController::class, 'downloadMass'])
        ->middleware('throttle:2,60')
        ->name('certificates.bulk-download');

    // Backward compatibility: keep legacy rekap-nilai URLs alive as real endpoints.
    Route::prefix('rekap-nilai')->name('rekap-nilai.')->group(function () {
        Route::get('/', [Admin\RekapNilaiController::class, 'index'])->name('index');
        Route::get('ekspor', [Admin\RekapNilaiController::class, 'export'])->name('ekspor');
        Route::get('ekspor-ledger', [Admin\RekapNilaiController::class, 'exportLedger'])->name('ekspor-ledger');
        Route::patch('{score}/finalisasi', [Admin\RekapNilaiController::class, 'finalize'])->name('finalisasi');
        Route::post('finalisasi-massal', [Admin\RekapNilaiController::class, 'finalizeMass'])
            ->middleware('throttle:5,60')
            ->name('finalisasi-massal');
        Route::get('finalisasi-progres', [Admin\RekapNilaiController::class, 'getFinalizeProgress'])->name('finalisasi-progres');
        Route::post('sertifikat-massal', [Admin\RekapNilaiController::class, 'bulkCertificates'])
            ->middleware('throttle:5,60')
            ->name('sertifikat-massal');
        Route::get('progres-sertifikat', [Admin\RekapNilaiController::class, 'getCertificateProgress'])->name('progres-sertifikat');
    });

    // Yudisium
    Route::get('yudisium', [Admin\YudisiumController::class, 'index'])->name('yudisium.index');
    Route::post('yudisium/proses', [Admin\YudisiumController::class, 'proses'])->name('yudisium.proses');

    // Data Management
    // AI Systems Monitor (Merged into System Settings)

    Route::prefix('pendaftaran')->name('pendaftaran.')->group(function () {
        Route::get('/', [Admin\PesertaKknController::class, 'index'])->name('index');
        Route::get('ekspor', [Admin\PesertaKknController::class, 'export'])->name('ekspor');
        Route::get('ekspor-biodata', [Admin\PesertaKknController::class, 'exportBiodata'])->name('ekspor-biodata');
        Route::get('ekspor-bpjs', [Admin\PesertaKknController::class, 'exportBpjs'])->name('ekspor-bpjs');
        Route::get('berkas/unduh', [Admin\PesertaKknController::class, 'downloadDocument'])->name('berkas.unduh');
        Route::get('{pesertaKkn}', [Admin\PesertaKknController::class, 'show'])->name('show');
    });

    Route::prefix('kelompok')->name('kelompok.')->group(function () {
        Route::get('/', [Admin\KelompokKknController::class, 'index'])->name('index');
        Route::get('template', [Admin\KelompokKknController::class, 'downloadTemplate'])->name('template');
        Route::get('{kelompokKkn}', [Admin\KelompokKknController::class, 'show'])->name('show');
        Route::get('{group}/mahasiswa', [Admin\GradeController::class, 'students'])->name('mahasiswa');
    });

    Route::get('nilai', [Admin\GradeController::class, 'index'])->name('nilai.index');

    Route::prefix('laporan')->name('laporan.')->group(function () {
        Route::get('harian', [Admin\KegiatanKknController::class, 'index'])->name('harian.index');
        Route::get('program-kerja', [Admin\ProgramKerjaController::class, 'index'])->name('program-kerja.index');
        Route::prefix('akhir')->name('akhir.')->group(function () {
            Route::get('/', [Admin\LaporanAkhirController::class, 'index'])->name('index');
            Route::get('{report}', [Admin\LaporanAkhirController::class, 'show'])->name('show');
            Route::get('{report}/unduh', [Admin\LaporanAkhirController::class, 'download'])->name('unduh');
        });
    });

    Route::get('evaluasi', [Admin\EvaluasiController::class, 'index'])->name('evaluasi.index');
    
    Route::prefix('evaluasi-dpl')->name('evaluasi-dpl.')->group(function () {
        Route::get('/', [Admin\DplParticipantEvaluationController::class, 'index'])->name('index');
        Route::get('ekspor', [Admin\DplParticipantEvaluationController::class, 'export'])->name('export');
        Route::get('{dosen}', [Admin\DplParticipantEvaluationController::class, 'show'])->name('show');
    });

    // Audit Kualifikasi (Cek Kelayakan)
    Route::prefix('audit-kualifikasi')->name('cek-kelayakan.')->group(function () {
        Route::get('/', [Admin\EligibilityController::class, 'index'])->name('index');
        Route::get('ekspor', [Admin\EligibilityController::class, 'export'])->name('ekspor');
        Route::get('{mahasiswa}/periksa', [Admin\EligibilityController::class, 'checkStudent'])->name('check');
    });

    // Dispensasi KKN (Bypass Syarat Pendaftaran)
    Route::prefix('dispensasi')->name('dispensasi.')->group(function () {
        Route::get('/', [Admin\DispensasiController::class, 'index'])->name('index');
        Route::post('/', [Admin\DispensasiController::class, 'store'])->name('store');
        Route::delete('{dispensasi}', [Admin\DispensasiController::class, 'destroy'])->name('destroy');
    });

    // Workshop Management - DIHIDMATKAN SEMENTARA (tabel belum ada)
    // Route::prefix('workshops')->name('workshops.')->group(function () {
    //     Route::get('/', [\App\Http\Controllers\WorkshopController::class, 'index'])->name('index');
    // });
});

/*
|--------------------------------------------------------------------------
| ADMIN & SUPERADMIN (Operational - except sensitive system settings)
|--------------------------------------------------------------------------
*/
Route::middleware(['role:superadmin|admin'])->prefix('admin')->name('admin.')->group(function () {

    // Periods & Academic Years
    Route::prefix('periode')->name('periode.')->group(function () {
        Route::get('ekspor', [Admin\PeriodeController::class, 'export'])->name('ekspor');
        Route::post('{periode}/duplikasi', [Admin\PeriodeController::class, 'duplicate'])->name('duplicate');
    });
    
    Route::resource('periode', Admin\PeriodeController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    
    Route::get('periods', [Admin\PeriodeController::class, 'index'])->name('periods.index');

    // Master Data
    Route::resource('tahun-akademik', Admin\TahunAkademikController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::resource('jenis-kkn', Admin\JenisKknController::class)
        ->only(['index', 'show', 'store', 'update', 'destroy']);
    Route::resource('fakultas', Admin\FakultasController::class)
        ->only(['index', 'store', 'update', 'destroy']);
    Route::resource('prodi', Admin\ProdiController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Requirements
    Route::patch('kkn-requirements/{requirement}/toggle', [Admin\KknRequirementController::class, 'toggle'])->name('kkn-requirements.toggle');
    Route::resource('kkn-requirements', Admin\KknRequirementController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Locations
    Route::prefix('lokasi')->name('lokasi.')->group(function () {
        Route::get('template', [Admin\LokasiController::class, 'downloadTemplate'])->name('template');
        Route::post('impor', [Admin\LokasiController::class, 'import'])->name('import');
    });

    Route::prefix('locations')->name('locations.')->group(function () {
        Route::get('/', [Admin\LokasiController::class, 'index'])->name('index');
        Route::get('export', [Admin\LokasiController::class, 'export'])->name('export');
        Route::post('/', [Admin\LokasiController::class, 'store'])->name('store');
        Route::put('{lokasi}', [Admin\LokasiController::class, 'update'])->name('update');
        Route::delete('{lokasi}', [Admin\LokasiController::class, 'destroy'])->name('destroy');
    });

    Route::resource('lokasi', Admin\LokasiController::class)
        ->only(['index', 'store', 'update', 'destroy']);

    // Workshop Management
    Route::prefix('workshops')->name('workshops.')->middleware('not_locked')->group(function () {
        Route::get('/', [WorkshopController::class, 'index'])->name('index');
        Route::post('/', [WorkshopController::class, 'store'])->name('store');
        Route::patch('/{workshop}', [WorkshopController::class, 'update'])->name('update');
        Route::patch('/{workshop}/cancel', [WorkshopController::class, 'cancel'])->name('cancel');
        Route::post('/{workshop}/mark-attendance', [WorkshopController::class, 'markAttendance'])->name('mark-attendance');
        Route::get('/{workshop}/participants/export', [WorkshopController::class, 'exportParticipants'])->name('participants.export');
        Route::get('/{workshop}/certificate-template', [WorkshopController::class, 'downloadCertificateTemplate'])->name('certificate-template');
    });

    // Participant Operations (accessible by admin)
    Route::middleware('not_locked')->group(function () {
        Route::prefix('peserta')->name('peserta.')->group(function () {
            Route::get('pindah', [Admin\StudentTransferController::class, 'index'])->name('pindah.index');
            Route::post('pindah', [Admin\StudentTransferController::class, 'transfer'])->name('pindah');
        });

        Route::prefix('pendaftaran')->name('pendaftaran.')->group(function () {
            // Bulk Actions
            Route::post('setuju-massal', [Admin\PesertaKknController::class, 'bulkApprove'])
                ->middleware('throttle:10,60')
                ->name('setuju-massal');
            Route::post('tolak-massal', [Admin\PesertaKknController::class, 'bulkReject'])
                ->middleware('throttle:10,60')
                ->name('tolak-massal');
            
            // Individual Actions
            Route::prefix('{pesertaKkn}')->group(function () {
                Route::patch('setujui', [Admin\PesertaKknController::class, 'approve'])->name('setujui');
                Route::patch('tolak', [Admin\PesertaKknController::class, 'reject'])->name('tolak');
                Route::patch('tugaskan-kelompok', [Admin\PesertaKknController::class, 'assignGroup'])->name('tugaskan-kelompok');
            });

            // Role Assignments
            Route::prefix('{registration}')->group(function () {
                Route::post('jadikan-ketua', [Admin\PesertaKknController::class, 'makeLeader'])->name('jadikan-ketua');
                Route::post('jadikan-korcam', [Admin\PesertaKknController::class, 'makeKorcam'])->name('jadikan-korcam');
            });
        });

        // Groups CRUD
        Route::prefix('kelompok')->name('kelompok.')->group(function () {
            Route::post('impor', [Admin\KelompokKknController::class, 'import'])->name('import');
        });
        Route::resource('kelompok', Admin\KelompokKknController::class)
            ->only(['store', 'update', 'destroy']);
    });

    Route::get('rekapitulasi', [Admin\RekapitulasiController::class, 'index'])->name('rekapitulasi.index');

    // Public Content Management
    Route::resource('unduhan', Admin\DownloadController::class)
        ->only(['index', 'create', 'store', 'update', 'destroy']);
    Route::get('warta-utama', [Admin\AnnouncementController::class, 'index'])->name('warta-utama.index');
    Route::post('warta-utama', [Admin\AnnouncementController::class, 'store'])->name('warta-utama.store');
    Route::patch('warta-utama/{announcement}', [Admin\AnnouncementController::class, 'update'])->name('warta-utama.update');

    // Settings
    Route::prefix('pengaturan')->name('pengaturan.')->group(function () {
        Route::get('sertifikat', [Admin\CertificateConfigController::class, 'index'])->name('sertifikat.index');
        Route::post('sertifikat', [Admin\CertificateConfigController::class, 'update'])->name('sertifikat.update');
        Route::get('sistem', [Admin\SystemSettingController::class, 'index'])->name('sistem');
        Route::patch('sistem', [Admin\SystemSettingController::class, 'update'])->name('sistem.update');
        Route::get('sistem/ai/config', [Admin\SystemSettingController::class, 'getAiConfig'])->name('sistem.ai.config');
        Route::post('sistem/ai/test', [Admin\SystemSettingController::class, 'testAiConnection'])->name('sistem.ai.test');
        Route::patch('sistem/ai/update', [Admin\SystemSettingController::class, 'updateAiSettings'])->name('sistem.ai.update');
        Route::delete('sistem/ai/key', [Admin\SystemSettingController::class, 'removeAiKey'])->name('sistem.ai.remove');
    });

    Route::get('konfigurasi-penilaian', [Admin\KonfigurasiPenilaianController::class, 'index'])->name('konfigurasi-penilaian.index');
    Route::patch('konfigurasi-penilaian', [Admin\KonfigurasiPenilaianController::class, 'update'])->name('konfigurasi-penilaian.update');

    Route::get('audit-log', [Admin\LogAuditController::class, 'index'])->name('audit-log.index');
    Route::get('audit-log/{auditLog}', [Admin\LogAuditController::class, 'show'])->name('audit-log.show');
});

/*
|--------------------------------------------------------------------------
| SUPERADMIN ONLY (Sensitive operations - user management, sync, role delegation)
|--------------------------------------------------------------------------
*/
Route::middleware(['role:superadmin'])->prefix('admin')->name('admin.')->group(function () {

    // User & Staff Management
    Route::get('pengguna', [Admin\UserController::class, 'index'])->name('pengguna.index');
    Route::get('pengguna/buat', [Admin\UserController::class, 'create'])->name('pengguna.create');
    Route::post('pengguna', [Admin\UserController::class, 'store'])->name('pengguna.store');
    Route::patch('pengguna/{user}/ubah-status', [Admin\UserController::class, 'toggleActive'])->name('pengguna.ubah-status');
    Route::post('pengguna/{user}/reset-password-sementara', [Admin\UserController::class, 'resetTemporaryPassword'])->name('pengguna.reset-password');

    // Personel Sync & Assignment
    Route::middleware('not_locked')->group(function () {
        
        // Mahasiswa Context
        Route::prefix('mahasiswa')->name('mahasiswa.')->group(function () {
            Route::get('/', [Admin\UserController::class, 'mahasiswaIndex'])->name('index');
            Route::get('sinkron', [Admin\StudentSyncController::class, 'index'])->name('sinkron');
            Route::post('sinkron', [Admin\StudentSyncController::class, 'sync'])->name('sinkron.store');
            Route::get('{mahasiswa}', [Admin\UserController::class, 'mahasiswaShow'])->name('show');
        });

        // Dosen & DPL Context
        Route::prefix('dosen')->name('dpl.')->group(function () {
            Route::get('/', [Admin\UserController::class, 'dosenIndex'])->name('index');
            
            Route::get('sinkron', [Admin\DplSyncController::class, 'index'])->name('sinkron');
            Route::post('sinkron', [Admin\DplSyncController::class, 'sync'])->name('sinkron.store');
            
            // DPL Registration
            Route::prefix('pendaftaran-dpl')->group(function () {
                Route::get('/', [Admin\DplRegistrationController::class, 'index'])->name('pendaftaran');
                Route::post('setujui-massal', [Admin\DplRegistrationController::class, 'bulkApprove'])
                    ->middleware('throttle:10,60')
                    ->name('pendaftaran.setujui-massal');
                Route::post('tolak-massal', [Admin\DplRegistrationController::class, 'bulkReject'])
                    ->middleware('throttle:10,60')
                    ->name('pendaftaran.tolak-massal');
                Route::patch('{registration}/setujui', [Admin\DplRegistrationController::class, 'approve'])->name('pendaftaran.setujui');
                Route::patch('{registration}/tolak', [Admin\DplRegistrationController::class, 'reject'])->name('pendaftaran.tolak');
            });

            // DPL Assignment (Plotting)
            Route::prefix('penugasan')->group(function () {
                Route::get('/', [Admin\DplAssignmentController::class, 'index'])->name('penugasan');
            });
            Route::post('tugaskan-periode', [Admin\DplAssignmentController::class, 'assignToPeriod'])->name('tugaskan-periode');
            Route::post('tugaskan-kelompok/{group}', [Admin\DplAssignmentController::class, 'assignToGroup'])->name('tugaskan-kelompok');
            Route::post('tugaskan-wilayah', [Admin\DplAssignmentController::class, 'assignDistrictCoordinator'])->name('tugaskan-wilayah');
            Route::post('impor', [Admin\DplAssignmentController::class, 'import'])->name('impor');
            Route::patch('lepas-periode/{dplPeriod}', [Admin\DplAssignmentController::class, 'removeDplFromPeriod'])->name('lepas-periode');
            Route::patch('lepas-wilayah/{districtCoordinator}', [Admin\DplAssignmentController::class, 'removeDistrictCoordinator'])->name('lepas-wilayah');
        });

        // Legacy / Alias Routes
        Route::get('dpl/sync', [Admin\DplSyncController::class, 'index'])->name('dpl.sync');
        Route::redirect('dpl/assignment', 'admin/dosen/penugasan', 301)->name('dpl.assignment');

        // Participant Operations
        Route::prefix('peserta')->name('peserta.')->group(function () {
            Route::get('pindah', [Admin\StudentTransferController::class, 'index'])->name('pindah.index');
            Route::post('pindah', [Admin\StudentTransferController::class, 'transfer'])->name('pindah');
        });

        Route::prefix('pendaftaran')->name('pendaftaran.')->group(function () {
            // Bulk Actions
            Route::post('setuju-massal', [Admin\PesertaKknController::class, 'bulkApprove'])->name('setuju-massal');
            Route::post('tolak-massal', [Admin\PesertaKknController::class, 'bulkReject'])->name('tolak-massal');
            
            // Individual Actions
            Route::prefix('{pesertaKkn}')->group(function () {
                Route::patch('setujui', [Admin\PesertaKknController::class, 'approve'])->name('setujui');
                Route::patch('tolak', [Admin\PesertaKknController::class, 'reject'])->name('tolak');
                Route::patch('tugaskan-kelompok', [Admin\PesertaKknController::class, 'assignGroup'])->name('tugaskan-kelompok');
            });

            // Role Assignments
            Route::prefix('{registration}')->group(function () {
                Route::post('jadikan-ketua', [Admin\PesertaKknController::class, 'makeLeader'])->name('jadikan-ketua');
                Route::post('jadikan-korcam', [Admin\PesertaKknController::class, 'makeKorcam'])->name('jadikan-korcam');
            });
        });

        // Groups CRUD
        Route::prefix('kelompok')->name('kelompok.')->group(function () {
            Route::post('impor', [Admin\KelompokKknController::class, 'import'])->name('import');
        });
        Route::resource('kelompok', Admin\KelompokKknController::class)
            ->only(['store', 'update', 'destroy']);
    });

    Route::get('rekapitulasi', [Admin\RekapitulasiController::class, 'index'])->name('rekapitulasi.index');

    // Public Content Management
    Route::resource('unduhan', Admin\DownloadController::class)
        ->only(['index', 'create', 'store', 'update', 'destroy']);

    Route::prefix('warta-utama')->name('warta-utama.')->group(function () {
        Route::get('/', [Admin\AnnouncementController::class, 'index'])->name('index');
        Route::post('/', [Admin\AnnouncementController::class, 'store'])->name('store');
        Route::prefix('{announcement}')->group(function () {
            Route::patch('/', [Admin\AnnouncementController::class, 'update'])->name('update');
            Route::delete('/', [Admin\AnnouncementController::class, 'destroy'])->name('destroy');
        });
    });

    Route::prefix('konten-publik')->name('konten.')->group(function () {
        Route::get('profil', [PublicContentController::class, 'profile'])->name('profil.index');
        Route::patch('profil', [PublicContentController::class, 'updateProfile'])->name('profil.update');
        Route::get('skema', [PublicContentController::class, 'schemes'])->name('skema.index');
        Route::patch('skema', [PublicContentController::class, 'updateSchemes'])->name('skema.update');
    });

    // Database Sync Monitoring
    Route::prefix('database-sync')->name('database-sync.')->group(function () {
        Route::get('/', [Admin\DatabaseSyncController::class, 'index'])->name('index');
        Route::get('health', [Admin\DatabaseSyncController::class, 'health'])->name('health');
        Route::get('statistics', [Admin\DatabaseSyncController::class, 'statistics'])->name('statistics');
        Route::post('retry', [Admin\DatabaseSyncController::class, 'retry'])->name('retry');
        Route::post('retry/{log}', [Admin\DatabaseSyncController::class, 'retryLog'])->name('retry-log');
        Route::post('cleanup', [Admin\DatabaseSyncController::class, 'cleanup'])->name('cleanup');
        Route::post('test-connection', [Admin\DatabaseSyncController::class, 'testConnection'])->name('test-connection');
        Route::post('manual', [Admin\DatabaseSyncController::class, 'manualSync'])->name('manual');
        Route::get('logs/{log}', [Admin\DatabaseSyncController::class, 'show'])->name('logs.show');
    });

    // Eligibility write operations
    Route::post('audit-kualifikasi/bulk-update-sks', [Admin\EligibilityController::class, 'bulkUpdateSks'])->name('cek-kelayakan.bulk-update-sks');

    // Grading write operations
    Route::post('nilai', [Admin\GradeController::class, 'store'])->name('nilai.store');

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
    Route::prefix('generator-nilai')->name('generator-nilai.')->group(function () {
        Route::get('/', [Admin\GeneratorNilaiController::class, 'index'])->name('index');
        Route::get('kelompok/semua/mahasiswa', [Admin\GeneratorNilaiController::class, 'studentsAll'])->name('students-all');
        Route::get('kelompok/{kelompokKkn}/mahasiswa', [Admin\GeneratorNilaiController::class, 'students'])->name('students');
        Route::post('skor', [Admin\GeneratorNilaiController::class, 'saveScores'])->name('save-scores');
        Route::get('ekspor/{id}', [Admin\GeneratorNilaiController::class, 'exportExcel'])->name('export');
        Route::get('ekspor-pdf/{id}', [Admin\GeneratorNilaiController::class, 'exportPdf'])->name('export-pdf');
        Route::get('ekspor-zip', [Admin\GeneratorNilaiController::class, 'exportZip'])->name('export-zip');
    });

    // Advanced Exports
    Route::prefix('ekspor')->name('export.')->group(function () {
        Route::get('laporan-harian/kelompok/{groupId}', [ReportExportController::class, 'downloadGroupDailyReports'])->name('laporan-harian.kelompok');
        Route::get('laporan-harian/mahasiswa/{studentId}', [ReportExportController::class, 'downloadStudentDailyReports'])->name('laporan-harian.mahasiswa');
    });
});
