<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\PesertaKkn;
use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesNotificationChannels;

    public function __construct(
        public PesertaKkn $registration,
        public string $periodName,
        public string $reason,
    ) {}

    public function via(object $notifiable): array
    {
        return $this->preferredChannels($notifiable, ['mail', 'database', WaGatewayChannel::class]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->error()
            ->subject('Pendaftaran KKN Ditolak — SIBERMAS')
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Pendaftaran Anda untuk **{$this->periodName}** belum dapat disetujui.")
            ->line("**Alasan:** {$this->reason}")
            ->line('Anda dapat memperbaiki data atau dokumen yang diminta, lalu mengajukan ulang melalui portal SIBERMAS.')
            ->action('Perbaiki & Ajukan Ulang', url('/student/registration'))
            ->line('Jika ada pertanyaan, silakan hubungi kantor LPPM.');
    }

    public function toWaGateway(object $notifiable): string
    {
        return '❌ *Pendaftaran KKN Ditolak*

Periode: '.$this->periodName.'
Alasan: '.$this->reason.'

Silakan perbaiki data/dokumen lalu ajukan ulang.
Buka: '.url('/student/registration');
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
