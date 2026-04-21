<?php

use App\Http\Controllers\Dosen;
use App\Http\Controllers\Dpl;
use App\Http\Controllers\WorkshopController;
use App\Http\Middleware\EnsurePasswordChanged;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Dosen Routes (Portal Dosen & DPL)
|--------------------------------------------------------------------------
|
| Semua rute dosen berada di bawah prefix /dosen.
| - Fitur dasar (dashboard, workshop) → role:dosen
| - Fitur DPL (kelompok, logbook, evaluasi) → role:dosen + role:dpl
|
| Alur rekrutmen DPL:
| Dosen → Workshop → Lulus → Daftar DPL → Admin Approve → DPL Aktif
|
*/

// ═══════════════════════════════════════════════════════════
// AKSES DOSEN (semua dosen yang sudah login)
// ═══════════════════════════════════════════════════════════
Route::middleware([
    'auth',
    'role:dosen|superadmin',
    EnsurePasswordChanged::class,
])->prefix('dosen')->name('dosen.')->group(function () {

    // Dashboard Dosen (mendeteksi otomatis: jika DPL → tampilan DPL)
    Route::get('/', [Dosen\DashboardController::class, 'index'])->name('dashboard');

    // Workshop & Pembekalan (semua dosen boleh akses)
    Route::prefix('workshops')->name('workshops.')->group(function () {
        Route::get('/', [WorkshopController::class, 'index'])->name('index');
        Route::post('/{workshop}/register', [WorkshopController::class, 'register'])->name('register');
        Route::get('/my-certificates', [WorkshopController::class, 'myCertificates'])->name('my-certificates');
        Route::get('/{participant}/certificate', [WorkshopController::class, 'downloadCertificate'])->name('certificate');
    });

    // Pendaftaran DPL (dosen yang sudah lulus workshop)
    Route::post('daftar-dpl', [Dosen\DplRegistrationController::class, 'store'])->name('dpl-registration.store');

    // ═══════════════════════════════════════════════════════════
    // AKSES DPL (hanya dosen yang sudah di-approve sebagai DPL)
    // ═══════════════════════════════════════════════════════════
    Route::middleware(['role:dpl'])->group(function () {

        // Dashboard DPL (dengan data kelompok bimbingan)
        Route::get('beranda-dpl', [Dpl\DashboardController::class, 'index'])->name('dpl.dashboard');
        Route::get('kelompok', [Dpl\GroupController::class, 'index'])->name('kelompok.index');
        Route::get('kelompok/{group}', [Dpl\GroupController::class, 'show'])->name('kelompok.show');

        // ─── FASE: PELAKSANAAN (execution) ────────────────────
        Route::middleware(['phase:execution,grading'])->group(function () {
            // Review Laporan Harian Mahasiswa
            Route::get('laporan-harian', [Dpl\DailyReportController::class, 'index'])->name('daily-reports.index');
            Route::get('laporan-harian/{dailyReport}', [Dpl\DailyReportController::class, 'show'])->name('daily-reports.show');
            Route::get('laporan-harian/berkas/{fileKegiatan}', [Dpl\DailyReportController::class, 'downloadFile'])->name('daily-reports.files.download');
            Route::get('laporan-harian/berkas/{fileKegiatan}/preview', [Dpl\DailyReportController::class, 'previewFile'])->name('daily-reports.files.preview');
            Route::post('laporan-harian/setujui-semua', [Dpl\DailyReportController::class, 'batchApprove'])->name('daily-reports.approve-all');
            Route::patch('laporan-harian/{dailyReport}/setujui', [Dpl\DailyReportController::class, 'approve'])->name('daily-reports.approve');
            Route::patch('laporan-harian/{dailyReport}/revisi', [Dpl\DailyReportController::class, 'revision'])->name('daily-reports.revision');

            // Monitoring DPL
            Route::get('monitoring', [Dpl\MonitoringController::class, 'index'])->name('monitoring.index');
            Route::get('monitoring/buat', [Dpl\MonitoringController::class, 'create'])->name('monitoring.create');
            Route::post('monitoring', [Dpl\MonitoringController::class, 'store'])->name('monitoring.store');

            // Izin Meninggalkan Lokasi
            Route::get('izin', [Dpl\IzinController::class, 'index'])->name('izin.index');
            Route::patch('izin/{izin}/setujui', [Dpl\IzinController::class, 'approve'])->name('izin.approve');
            Route::patch('izin/{izin}/tolak', [Dpl\IzinController::class, 'reject'])->name('izin.reject');
        });

        // ─── FASE: PENILAIAN (grading) ────────────────────────
        Route::middleware(['phase:grading,finished'])->group(function () {
            // Input & Impor Nilai
            Route::get('evaluasi', [Dpl\EvaluationController::class, 'index'])->name('evaluations.index');
            Route::post('evaluasi/validasi-impor', [Dpl\EvaluationController::class, 'validateImport'])->name('evaluations.validate-import');
            Route::post('evaluasi/impor', [Dpl\EvaluationController::class, 'import'])->name('evaluations.import');
            Route::get('evaluasi/buat', [Dpl\EvaluationController::class, 'create'])->name('evaluations.create');
            Route::post('evaluasi', [Dpl\EvaluationController::class, 'store'])->name('evaluations.store');

            // Review Laporan Akhir
            Route::get('laporan-akhir', [Dpl\FinalReportController::class, 'index'])->name('final-reports.index');
            Route::get('laporan-akhir/{report}', [Dpl\FinalReportController::class, 'show'])->name('final-reports.show');
            Route::get('laporan-akhir/{report}/unduh', [Dpl\FinalReportController::class, 'download'])->name('final-reports.download');
            Route::patch('laporan-akhir/{report}/setujui', [Dpl\FinalReportController::class, 'approve'])->name('final-reports.approve');
            Route::patch('laporan-akhir/{report}/revisi', [Dpl\FinalReportController::class, 'revision'])->name('final-reports.revision');
            Route::get('umpan-balik-peserta', [Dpl\ParticipantFeedbackController::class, 'index'])->name('feedback-dpl.index');
        });
    });
});
