<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Dpl;

use App\Http\Controllers\Controller;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\Periode;
use App\Services\LogbookPdfService;
use App\Services\PeriodContextService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * DPL: download logbook PDF untuk mahasiswa di kelompoknya.
 *
 * GET /api/v1/dpl/logbook/{mahasiswa}/pdf
 *
 * Security: cek bahwa mahasiswa berada di kelompok yang di-DPL-kan oleh user ini.
 */
class LogbookPdfController extends Controller
{
    public function __construct(
        private readonly LogbookPdfService $service,
        private readonly PeriodContextService $periodContext,
    ) {}

    public function download(Request $request, Mahasiswa $mahasiswa): Response
    {
        $user = $request->user();
        $dosen = $user?->dosen;
        abort_unless($dosen, 403, 'Akun ini bukan DPL.');

        // Tentukan periode
        $periodeId = $request->integer('periode');
        if ($periodeId > 0) {
            $periode = Periode::findOrFail($periodeId);
        } else {
            $activePeriode = $this->periodContext->getActivePeriod();
            abort_unless($activePeriode, 404, 'Tidak ada periode aktif.');
            $periode = $activePeriode;
        }

        // Cek akses: mahasiswa harus peserta di kelompok yang DPL-nya = $dosen
        $peserta = $mahasiswa->peserta()
            ->where('periode_id', $periode->id)
            ->with('kelompok.dosen')
            ->first();

        abort_unless($peserta && $peserta->kelompok, 404, 'Mahasiswa belum ditempatkan.');

        $isDplOfGroup = $peserta->kelompok->dosen->contains(fn ($d) => $d->id === $dosen->id);
        abort_unless($isDplOfGroup, 403, 'Anda bukan DPL kelompok ini.');

        $pdf = $this->service->generate($mahasiswa, $periode);

        $filename = sprintf('logbook-kkn-%s-%s.pdf', $mahasiswa->nim ?? 'mhs', now()->format('Ymd'));

        return $pdf->download($filename);
    }
}
