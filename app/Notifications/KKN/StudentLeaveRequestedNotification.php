<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\IzinMeninggalkan;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentLeaveRequestedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public IzinMeninggalkan $izin
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mhsName = $this->izin->mahasiswa->nama;
        $mulai = $this->izin->tanggal_mulai->format('d M Y');
        $kembali = $this->izin->tanggal_kembali->format('d M Y');

        return (new MailMessage)
            ->subject("Permohonan Izin Meninggalkan Lokasi KKN: {$mhsName}")
            ->greeting('Halo, Bapak/Ibu DPL')
            ->line("Mahasiswa bimbingan Anda, **{$mhsName}**, mengajukan izin untuk meninggalkan lokasi KKN.")
            ->line("- **Mulai:** {$mulai}")
            ->line("- **Kembali:** {$kembali}")
            ->line("- **Durasi:** {$this->izin->durasi_hari} hari")
            ->line("- **Alasan:** {$this->izin->alasan}")
            ->action('Review Permohonan Izin', url('/dpl/permintaan-izin'))
            ->line('Silakan tinjau alasan dan bukti pendukung (jika ada) melalui portal SIBERDAYA.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'leave_request',
            'izin_id' => $this->izin->id,
            'message' => "{$this->izin->mahasiswa->nama} mengajukan izin selama {$this->izin->durasi_hari} hari.",
        ];
    }
}
