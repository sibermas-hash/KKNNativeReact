<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Models\KKN\Periode;
use App\Models\User;
use App\Services\PeriodContextService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsurePhase Middleware — Kunci Otomatis Fitur Berdasarkan Fase KKN
 *
 * Middleware ini memeriksa current_phase dari periode aktif dan hanya mengizinkan
 * akses jika fase saat ini termasuk dalam daftar fase yang diperbolehkan.
 *
 * Cara pakai di routes:
 *   Route::get('pendaftaran', ...)->middleware('phase:registration');
 *   Route::get('kegiatan', ...)->middleware('phase:execution,grading');
 *   Route::get('nilai', ...)->middleware('phase:grading,finished');
 *
 * Jika fase tidak cocok, pengguna dialihkan kembali dengan pesan yang ramah.
 */
class EnsurePhase
{
    public function __construct(
        private PeriodContextService $contextService
    ) {}

    public function handle(Request $request, Closure $next, string ...$allowedPhases): Response
    {
        // SECURITY: Admin/Superadmin always bypass — they manage phases.
        // Non-admins NEVER bypass phase checks regardless of environment.
        /** @var User|null $user */
        $user = auth()->user();

        if ($user?->hasAnyRole(['superadmin', 'admin'])) {
            return $next($request);
        }

        // Ambil periode aktif
        $periodId = $this->contextService->getActivePeriodId()
            ?? $this->contextService->getDefaultPeriodId();

        if (! $periodId) {
            return $this->blocked($request, 'Tidak ada periode KKN yang aktif saat ini.', 'inactive');
        }

        $period = Periode::find($periodId);
        if (! $period) {
            return $this->blocked($request, 'Periode KKN tidak ditemukan.', 'inactive');
        }

        $currentPhase = $period->current_phase ?? 'upcoming';

        // Cek apakah fase saat ini termasuk dalam daftar yang diizinkan
        if (! in_array($currentPhase, $allowedPhases, true)) {
            $message = $this->getBlockedMessage($currentPhase, $allowedPhases);

            return $this->blocked($request, $message, $currentPhase);
        }

        return $next($request);
    }

    /**
     * Kembalikan respons "akses diblokir" yang ramah pengguna.
     */
    private function blocked(Request $request, string $message, string $currentPhase): Response
    {
        // API: return JSON envelope
        if ($request->is('api/*') || $request->expectsJson()) {
            return response()->json([
                'success' => false,
                'error' => [
                    'code' => 'PHASE_BLOCKED',
                    'message' => $message,
                    'current_phase' => $currentPhase,
                ],
            ], 403);
        }

        // Web: redirect with error message
        $backUrl = $request->headers->get('referer', '/');

        return redirect($backUrl)->with('error', $message);
    }

    /**
     * Pesan yang ramah untuk setiap situasi fase yang diblokir.
     */
    private function getBlockedMessage(string $currentPhase, array $allowedPhases): string
    {
        $phaseLabels = [
            'upcoming' => 'Pra-Pendaftaran',
            'registration' => 'Masa Pendaftaran',
            'placement' => 'Seleksi & Plotting',
            'execution' => 'Pelaksanaan KKN',
            'grading' => 'Masa Penilaian',
            'finished' => 'KKN Selesai',
        ];

        $currentLabel = $phaseLabels[$currentPhase] ?? $currentPhase;

        // Tentukan pesan berdasarkan fitur yang ingin diakses
        if (in_array('registration', $allowedPhases)) {
            if ($currentPhase === 'upcoming') {
                return 'Pendaftaran KKN belum dibuka. Fase saat ini: '.$currentLabel.'. Silakan tunggu pengumuman dari LPPM.';
            }

            return 'Pendaftaran KKN sudah ditutup. Fase saat ini: '.$currentLabel.'.';
        }

        if (in_array('execution', $allowedPhases)) {
            if (in_array($currentPhase, ['upcoming', 'registration', 'placement'])) {
                return 'Fitur laporan harian belum tersedia. Fase pelaksanaan KKN belum dimulai. Fase saat ini: '.$currentLabel.'.';
            }

            return 'Fitur laporan harian sudah ditutup. Fase saat ini: '.$currentLabel.'.';
        }

        if (in_array('grading', $allowedPhases)) {
            return 'Fitur penilaian belum tersedia. Fase saat ini: '.$currentLabel.'.';
        }

        $allowed = array_map(fn ($p) => $phaseLabels[$p] ?? $p, $allowedPhases);

        return 'Fitur ini hanya tersedia pada fase: '.implode(', ', $allowed).'. Fase saat ini: '.$currentLabel.'.';
    }
}
