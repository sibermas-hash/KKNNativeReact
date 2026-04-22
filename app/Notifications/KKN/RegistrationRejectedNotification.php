<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\PesertaKkn;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PesertaKkn $registration,
        public string $periodName,
        public string $reason,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->error()
            ->subject('Pendaftaran KKN Ditolak — SIBERDAYA')
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Pendaftaran Anda untuk **{$this->periodName}** belum dapat disetujui.")
            ->line("**Alasan:** {$this->reason}")
            ->line('Anda dapat memperbaiki data atau dokumen yang diminta, lalu mengajukan ulang melalui portal SIBERDAYA.')
            ->action('Perbaiki & Ajukan Ulang', url('/student/registration'))
            ->line('Jika ada pertanyaan, silakan hubungi kantor LPPM.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'registration_rejected',
            'registration_id' => $this->registration->id,
            'period_name' => $this->periodName,
            'reason' => $this->reason,
            'message' => "Pendaftaran {$this->periodName} ditolak. Alasan: {$this->reason}",
        ];
    }
}
