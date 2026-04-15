<?php

use App\Http\Controllers\ReportController;
use App\Http\Controllers\Student;
use App\Http\Middleware\EnsurePasswordChanged;
use App\Http\Middleware\EnsureProfileCompleted;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Student Routes (Mahasiswa)
|--------------------------------------------------------------------------
|
| Setiap grup rute dilindungi oleh middleware 'phase' yang otomatis
| mengunci akses berdasarkan fase KKN yang aktif di Dashboard Admin.
|
| Fase: upcoming → registration → placement → execution → grading → finished
|
*/

Route::middleware([
    'role:student',
    EnsurePasswordChanged::class,
    EnsureProfileCompleted::class,
])->prefix('mahasiswa')->name('student.')->group(function () {

    // ─── SELALU TERSEDIA ──────────────────────────────────────────────
    // Dashboard & info posko bisa diakses di semua fase
    Route::get('/', [Student\DashboardController::class, 'index'])->name('dashboard');

    Route::get('posko', [Student\PoskoController::class, 'edit'])->name('posko.index');
    Route::post('posko', [Student\PoskoController::class, 'store'])->name('posko.store');
    Route::get('posko/edit', [Student\PoskoController::class, 'edit'])->name('posko.edit');
    Route::get('posko/foto/{posko}', [Student\PoskoController::class, 'photo'])->name('posko.photo');
    Route::get('posko/{kelompok}', [Student\PoskoController::class, 'edit'])->name('posko.show');

    Route::get('rekapitulasi', [Student\RekapitulasiController::class, 'index'])->name('rekapitulasi.index');
    Route::post('rekapitulasi', [Student\RekapitulasiController::class, 'store'])->name('rekapitulasi.store');
    Route::get('reports', [ReportController::class, 'index'])->name('reports.index');
    Route::post('reports/upload', [ReportController::class, 'upload'])->name('reports.upload');

    // Workshop & Pembekalan dilakukan secara manual oleh LPPM (Tidak ada rute di portal)

    // ─── FASE: PENDAFTARAN ────────────────────────────────────────────
    // Hanya terbuka saat admin klik "Buka Pendaftaran"
    Route::middleware(['phase:registration'])->group(function () {
        Route::get('pendaftaran', [Student\RegistrationController::class, 'create'])->name('registration.create');
        Route::post('pendaftaran', [Student\RegistrationController::class, 'store'])
            ->middleware('throttle:5,1')
            ->name('registration.store');
    });

    // Kompatibilitas alur lama "keluar dari pendaftaran/kelompok".
    // Guard bisnis tetap ditangani di controller/service.
    Route::delete('pendaftaran/{periode}', [Student\RegistrationController::class, 'leave'])
        ->name('registration.leave');

    // ─── FASE: PELAKSANAAN KKN ────────────────────────────────────────
    // Terbuka saat admin klik "Terjun Lapangan" s/d "Buka Penilaian"
    Route::middleware(['phase:execution,grading'])->group(function () {
        // Laporan Harian
        Route::prefix('laporan-harian')->name('laporan-harian.')->group(function () {
            Route::get('/', [Student\DailyReportController::class, 'index'])->name('index');
            Route::get('buat', [Student\DailyReportController::class, 'create'])->name('create');
            Route::post('/', [Student\DailyReportController::class, 'store'])->name('store');
            Route::get('{dailyReport}/edit', [Student\DailyReportController::class, 'edit'])->name('edit');
            Route::match(['put', 'patch'], '{dailyReport}', [Student\DailyReportController::class, 'update'])->name('update');
            Route::delete('{dailyReport}', [Student\DailyReportController::class, 'destroy'])->name('destroy');
        });

        // Program Kerja
        Route::prefix('program-kerja')->name('program-kerja.')->group(function () {
            Route::get('/', [Student\WorkProgramController::class, 'index'])->name('index');
            Route::get('buat', [Student\WorkProgramController::class, 'create'])->name('create');
            Route::post('/', [Student\WorkProgramController::class, 'store'])->name('store');
        });

        // Poster Potensi Desa
        Route::get('poster-potensi-desa', [Student\PosterController::class, 'index'])->name('poster.index');
        Route::post('poster-potensi-desa', [Student\PosterController::class, 'store'])->name('poster.store');

        // Izin Meninggalkan Lokasi
        Route::get('izin', [Student\IzinController::class, 'index'])->name('izin.index');
        Route::get('izin/buat', [Student\IzinController::class, 'create'])->name('izin.create');
        Route::post('izin', [Student\IzinController::class, 'store'])->name('izin.store');
    });

    // ─── FASE: PENILAIAN ──────────────────────────────────────────────
    // Terbuka saat admin klik "Buka Penilaian" s/d "Selesaikan KKN"
    Route::middleware(['phase:grading,finished'])->group(function () {
        // Laporan Akhir
        Route::prefix('laporan-akhir')->name('laporan-akhir.')->group(function () {
            Route::get('/', [Student\FinalReportController::class, 'create'])->name('index');
            Route::get('buat', [Student\FinalReportController::class, 'create'])->name('create');
            Route::post('/', [Student\FinalReportController::class, 'store'])->name('store');
        });

        // Evaluasi (Pending Implementation)
        // Route::get('evaluasi', [Student\EvaluationController::class , 'index'])->name('evaluasi.index');
        // Route::post('evaluasi', [Student\EvaluationController::class , 'store'])->name('evaluasi.store');

        // Sertifikat KKN
        Route::get('sertifikat', [Student\CertificateController::class, 'index'])->name('certificate.index');
        Route::get('sertifikat/{score}/download', [Student\CertificateController::class, 'download'])->name('certificate.download');
    });

    // ─── BELUM DIIMPLEMENTASIKAN ──────────────────────────────────────
    // Rute di bawah menunggu file controller dibuat
    // Route::get('profil-kelayakan', [Student\EligibilityController::class , 'index'])->name('eligibility.index');
    // Route::get('nilai', [Student\NilaiController::class, 'index'])->name('nilai.index');
});
