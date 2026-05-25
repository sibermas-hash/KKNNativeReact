<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\User;
use App\Services\IzinService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class IzinController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly IzinService $izinService,
    ) {}

    public function index(): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;

        if (! $mahasiswa) {
            return $this->success(['izin' => [], 'akumulasi_tanpa_keterangan' => 0]);
        }

        $izin = IzinMeninggalkan::where('mahasiswa_id', $mahasiswa->id)
            ->with(['kelompok'])
            ->orderByDesc('created_at')
            ->get();

        return $this->success([
            'izin' => $izin->map(fn ($i) => [
                'id' => $i->id,
                'tanggal_mulai' => $i->tanggal_mulai?->toDateString(),
                'tanggal_kembali' => $i->tanggal_kembali?->toDateString(),
                'durasi_hari' => $i->durasi_hari,
                'alasan' => $i->alasan,
                'status' => $i->status,
                'catatan_dpl' => $i->catatan_dpl,
                'file_url' => $i->file_bukti ? route('api.v1.files.leave-evidence', $i) : null,
                'created_at' => $i->created_at?->toIso8601String(),
            ]),
            'akumulasi_tanpa_keterangan' => $this->izinService->hitungAkumulasiTanpaKeterangan($mahasiswa->id),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = auth()->user();
        $mahasiswa = $user?->mahasiswa;
        $registration = $mahasiswa?->peserta()->where('status', 'approved')->first();

        if (! $registration?->kelompok_id) {
            return $this->forbidden('Anda belum ditempatkan di kelompok.');
        }

        $request->validate([
            'tanggal_mulai' => ['required', 'date', 'after_or_equal:today'],
            'tanggal_kembali' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'alasan' => ['required', 'string', 'max:1000'],
            'file_bukti' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ]);

        if ($request->hasFile('file_bukti')) {
            $path = $request->file('file_bukti')->store('evidence/perizinan', config('filesystems.default'));
            $request->merge(['file_bukti' => $path]);
        }

        $izin = $this->izinService->ajukanIzin($user, $request->only('tanggal_mulai', 'tanggal_kembali', 'alasan', 'file_bukti'));

        return $this->created([
            'id' => $izin->id,
            'status' => $izin->status,
        ], 'Permohonan izin berhasil diajukan.');
    }
}
