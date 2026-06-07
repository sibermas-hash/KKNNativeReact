<?php

use App\Http\Controllers\Api\V1\Student\BimbinganController;
use App\Http\Controllers\Api\V1\Student\CertificateController;
use App\Http\Controllers\Api\V1\Student\DailyReportController;
use App\Http\Controllers\Api\V1\Student\DashboardController;
use App\Http\Controllers\Api\V1\Student\DplEvaluationController;
use App\Http\Controllers\Api\V1\Student\FinalReportController;
use App\Http\Controllers\Api\V1\Student\InterviewController;
use App\Http\Controllers\Api\V1\Student\IzinController;
use App\Http\Controllers\Api\V1\Student\KknDaftarController;
use App\Http\Controllers\Api\V1\Student\KknStatementController;
use App\Http\Controllers\Api\V1\Student\LogbookPdfController;
use App\Http\Controllers\Api\V1\Student\PoskoController;
use App\Http\Controllers\Api\V1\Student\PosterController;
use App\Http\Controllers\Api\V1\Student\RegistrationController;
use App\Http\Controllers\Api\V1\Student\RegistrationDocumentController;
use App\Http\Controllers\Api\V1\Student\RekapitulasiController;
use App\Http\Controllers\Api\V1\Student\WorkProgramController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Student API Routes (/api/v1/student/*)
|--------------------------------------------------------------------------
|
| Fase: upcoming → registration → placement → execution → grading → finished
| Middleware 'phase' mengunci akses otomatis berdasarkan fase aktif.
|
*/

Route::prefix('student')
    ->middleware(['auth:sanctum', 'role:student', 'not_locked'])
    ->group(function () {

        // ─── SELALU TERSEDIA ─────────────────────────────────────────
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('api.v1.student.dashboard');
        Route::patch('/peserta-kkn/{pesertaKkn}/notification-shown', [DashboardController::class, 'markNotificationShown'])->name('api.v1.student.notification-shown');

        Route::get('/registration/status', [RegistrationController::class, 'status'])->name('api.v1.student.registration.status');
        Route::get('/registration/form', [RegistrationController::class, 'form'])->name('api.v1.student.registration.form');
        Route::delete('/registration/{periode}', [RegistrationController::class, 'leave'])->name('api.v1.student.registration.leave');
        Route::post('/registration/{periode}/leave', [RegistrationController::class, 'leave'])->name('api.v1.student.registration.leave.post');

        // Halaman pemilihan periode KKN
        Route::get('/kkn-daftar', [KknDaftarController::class, 'index'])->name('api.v1.student.kkn-daftar');
        Route::get('/kkn-daftar/{periode}/kelompok', [KknDaftarController::class, 'groups'])->name('api.v1.student.kkn-daftar.groups');
        Route::get('/kkn-statement/{periode}', [KknStatementController::class, 'show'])->name('api.v1.student.kkn-statement.show');
        Route::post('/kkn-statement/{periode}/agree', [KknStatementController::class, 'agree'])->name('api.v1.student.kkn-statement.agree');

        // Posko — tersedia setelah placement
        Route::get('/posko', [PoskoController::class, 'show'])->name('api.v1.student.posko.show');
        Route::post('/posko', [PoskoController::class, 'store'])->name('api.v1.student.posko.store');
        Route::get('/posko/{posko}/photo', [PoskoController::class, 'photo'])->name('api.v1.student.posko.photo');

        // Rekapitulasi — selalu tersedia (sesuai codebase lama)
        Route::get('/rekapitulasi', [RekapitulasiController::class, 'index'])->name('api.v1.student.rekapitulasi.index');
        Route::post('/rekapitulasi', [RekapitulasiController::class, 'store'])->name('api.v1.student.rekapitulasi.store');
        Route::put('/rekapitulasi/{rekapitulasi}', [RekapitulasiController::class, 'update'])->name('api.v1.student.rekapitulasi.update');
        Route::delete('/rekapitulasi/{rekapitulasi}', [RekapitulasiController::class, 'destroy'])->name('api.v1.student.rekapitulasi.destroy');

        // ─── FASE: PENDAFTARAN ────────────────────────────────────────
        Route::middleware('phase:registration')->group(function () {
            Route::post('/registration', [RegistrationController::class, 'store'])->name('api.v1.student.registration.store');
        });

        // Document upload tersedia di phase registration DAN placement.
        // Alasan: mahasiswa yang ditolak (status=rejected) saat phase sudah
        // placement tetap perlu bisa resubmit dokumen (R11 audit REG-001).
        Route::middleware('phase:registration,placement')->group(function () {
            Route::post('/registration/{id}/documents', [RegistrationDocumentController::class, 'store'])->name('api.v1.student.registration.documents');
            Route::get('/registration/{id}/documents/{documentKey}/template', [RegistrationDocumentController::class, 'downloadTemplate'])->name('api.v1.student.registration.documents.template');
        });

        // ─── FASE: PELAKSANAAN ────────────────────────────────────────
        Route::middleware('phase:execution,grading')->group(function () {
            // Laporan Harian
            Route::get('/daily-reports', [DailyReportController::class, 'index'])->name('api.v1.student.daily-reports.index');
            Route::post('/daily-reports', [DailyReportController::class, 'store'])->name('api.v1.student.daily-reports.store');
            Route::get('/daily-reports/{dailyReport}', [DailyReportController::class, 'show'])->name('api.v1.student.daily-reports.show');
            Route::put('/daily-reports/{dailyReport}', [DailyReportController::class, 'update'])->name('api.v1.student.daily-reports.update');
            Route::delete('/daily-reports/{dailyReport}', [DailyReportController::class, 'destroy'])->name('api.v1.student.daily-reports.destroy');

            // Program Kerja
            Route::get('/work-programs', [WorkProgramController::class, 'index'])->name('api.v1.student.work-programs.index');
            Route::post('/work-programs', [WorkProgramController::class, 'store'])->name('api.v1.student.work-programs.store');
            Route::get('/work-programs/{programKerja}', [WorkProgramController::class, 'show'])->name('api.v1.student.work-programs.show');
            Route::post('/work-programs/{programKerja}/proposal', [WorkProgramController::class, 'uploadProposal'])->name('api.v1.student.work-programs.proposal');
            Route::get('/work-programs/{programKerja}/proposal/{proposal}/download', [WorkProgramController::class, 'downloadProposal'])->name('api.v1.student.work-programs.proposal.download');

            // Poster Potensi Desa
            Route::get('/poster-potensi-desa', [PosterController::class, 'index'])->name('api.v1.student.poster.index');
            Route::post('/poster-potensi-desa', [PosterController::class, 'store'])->name('api.v1.student.poster.store');

            // Izin Meninggalkan Lokasi
            Route::get('/leave-requests', [IzinController::class, 'index'])->name('api.v1.student.leave-requests.index');
            Route::post('/leave-requests', [IzinController::class, 'store'])->name('api.v1.student.leave-requests.store');
        });

        // ─── FASE: PENILAIAN ──────────────────────────────────────────
        Route::middleware('phase:grading,finished')->group(function () {
            // Laporan Akhir
            Route::get('/final-report', [FinalReportController::class, 'index'])->name('api.v1.student.final-report.index');
            Route::post('/final-report', [FinalReportController::class, 'store'])->name('api.v1.student.final-report.store');
            Route::get('/final-report/{laporanAkhir}/preview', [FinalReportController::class, 'preview'])->name('api.v1.student.final-report.preview');

            // Evaluasi DPL
            Route::get('/dpl-evaluation/form', [DplEvaluationController::class, 'index'])->name('api.v1.student.dpl-evaluation.index');
            Route::post('/dpl-evaluation', [DplEvaluationController::class, 'store'])->name('api.v1.student.dpl-evaluation.store');

            // Sertifikat
            Route::get('/certificates', [CertificateController::class, 'index'])->name('api.v1.student.certificates.index');
            Route::get('/certificates/{sertifikat}/download', [CertificateController::class, 'download'])->name('api.v1.student.certificates.download');
        });

        // Logbook PDF (tersedia di fase execution + grading)
        Route::get('/logbook/pdf', [LogbookPdfController::class, 'download'])
            ->middleware('throttle:10,1')
            ->name('api.v1.student.logbook.pdf');

        // Sistem Bimbingan Online — mahasiswa sisi (R6)
        Route::prefix('bimbingan')->group(function () {
            Route::get('/', [BimbinganController::class, 'index'])->name('api.v1.student.bimbingan.index');
            Route::get('/progress', [BimbinganController::class, 'progress'])->name('api.v1.student.bimbingan.progress');
            Route::get('/{session}', [BimbinganController::class, 'show'])->name('api.v1.student.bimbingan.show');
        });

        // Wawancara
        Route::get('/wawancara', [InterviewController::class, 'index'])->name('api.v1.student.wawancara.index');

    });
