<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\KKN\AbsensiHarian;
use App\Models\KKN\IzinMeninggalkan;
use App\Models\KKN\Mahasiswa;
use App\Models\KKN\PesertaKkn;
use App\Models\User;
use App\Notifications\KknActivityNotification;
use Illuminate\Support\Facades\DB;

class IzinService
{
    /**
     * Mahasiswa mengajukan izin meninggalkan lokasi KKN
     */
    public function ajukanIzin(User $mahasiswa, array $data): IzinMeninggalkan
    {
        $mahasiswaModel = Mahasiswa::where('user_id', $mahasiswa->id)->firstOrFail();

        // Cek apakah mahasiswa sedang dalam KKN aktif
        $peserta = PesertaKkn::where('mahasiswa_id', $mahasiswaModel->id)
            ->where('status', 'approved')
            ->firstOrFail();

        $tanggalMulai = now()->parse($data['tanggal_mulai']);
        $tanggalKembali = now()->parse($data['tanggal_kembali']);
        $durasi = $tanggalMulai->diffInDays($tanggalKembali) + 1;

        return DB::transaction(function () use ($mahasiswaModel, $peserta, $tanggalMulai, $tanggalKembali, $durasi, $data) {
            $izin = IzinMeninggalkan::create([
                'mahasiswa_id' => $mahasiswaModel->id,
                'kelompok_id' => $peserta->kelompok_id,
                'tanggal_mulai' => $tanggalMulai,
                'tanggal_kembali' => $tanggalKembali,
                'durasi_hari' => $durasi,
                'alasan' => $data['alasan'],
                'file_bukti' => $data['file_bukti'] ?? null,
                'status' => 'menunggu',
            ]);

            // Notifikasi ke DPL
            $kelompok = $peserta->kelompok()->with('dpl.user')->first();
            if ($kelompok?->dpl?->user) {
                $kelompok->dpl->user->notify(new \App\Notifications\KKN\StudentLeaveRequestedNotification($izin));
            }

            return $izin;
        });
    }

    /**
     * DPL menyetujui permohonan izin
     */
    public function setujuiIzin(User $dpl, IzinMeninggalkan $izin): void
    {
        DB::transaction(function () use ($dpl, $izin) {
            $izin->update([
                'status' => 'disetujui',
                'diproses_oleh' => $dpl->id,
                'diproses_pada' => now(),
            ]);

            // Update absensi untuk rentang tanggal izin
            $this->updateAbsensiUntukIzin($izin);

            // Notifikasi ke mahasiswa
            if ($izin->mahasiswa?->user) {
                $izin->mahasiswa->user->notify(new KknActivityNotification([
                    'type' => 'success',
                    'title' => 'Izin Disetujui',
                    'message' => "Permohonan izin Anda tanggal {$izin->tanggal_mulai->format('d/m')} s/d {$izin->tanggal_kembali->format('d/m')} telah disetujui.",
                    'icon' => 'checkmark-circle',
                    'action' => route('student.izin.index'),
                ]));
            }
        });
    }

    /**
     * DPL menolak permohonan izin
     */
    public function tolakIzin(User $dpl, IzinMeninggalkan $izin, string $catatan): void
    {
        $izin->update([
            'status' => 'ditolak',
            'diproses_oleh' => $dpl->id,
            'diproses_pada' => now(),
            'catatan_dpl' => $catatan,
        ]);

        // Notifikasi ke mahasiswa
        if ($izin->mahasiswa?->user) {
            $izin->mahasiswa->user->notify(new KknActivityNotification([
                'type' => 'danger',
                'title' => 'Izin Ditolak',
                'message' => "Permohonan izin Anda ditolak. Catatan: {$catatan}",
                'icon' => 'close-circle',
                'action' => route('student.izin.index'),
            ]));
        }
    }

    /**
     * Update absensi untuk rentang tanggal izin yang disetujui
     */
    private function updateAbsensiUntukIzin(IzinMeninggalkan $izin): void
    {
        $tanggal = $izin->tanggal_mulai->copy();
        $end = $izin->tanggal_kembali->copy();

        while ($tanggal <= $end) {
            AbsensiHarian::updateOrCreate(
                [
                    'mahasiswa_id' => $izin->mahasiswa_id,
                    'kelompok_id' => $izin->kelompok_id,
                    'tanggal' => $tanggal,
                ],
                [
                    'status' => 'izin',
                    'izin_id' => $izin->id,
                ]
            );

            $tanggal->addDay();
        }
    }

    /**
     * Hitung akumulasi hari tanpa keterangan untuk mahasiswa
     */
    public function hitungAkumulasiTanpaKeterangan(int $mahasiswaId): int
    {
        return AbsensiHarian::where('mahasiswa_id', $mahasiswaId)
            ->where('status', 'tanpa_keterangan')
            ->count();
    }
}
