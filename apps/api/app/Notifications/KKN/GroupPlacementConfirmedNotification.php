<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class GroupPlacementConfirmedNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesNotificationChannels;

    public function __construct(
        public string $groupName,
        public string $periodName,
        public ?string $locationName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return $this->preferredChannels($notifiable, ['mail', 'database', WaGatewayChannel::class]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Penempatan Kelompok KKN Dikonfirmasi — SIBERMAS')
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Anda telah ditempatkan di kelompok **{$this->groupName}** untuk periode **{$this->periodName}**.");

        if ($this->locationName) {
            $mail->line("Lokasi penempatan: **{$this->locationName}**.");
        }

        return $mail
            ->line('Harap mempersiapkan diri dan memantau informasi selanjutnya melalui portal.')
            ->action('Lihat Kelompok Saya', url('/student/dashboard'))
            ->line('Terima kasih dan semoga sukses melaksanakan KKN.');
    }

    public function toWaGateway(object $notifiable): string
    {
        return '📍 *Penempatan Kelompok KKN Dikonfirmasi*

Kelompok: '.$this->groupName.'
Periode: '.$this->periodName.($this->locationName ? '
Lokasi: '.$this->locationName : '').'

Buka: '.url('/student/dashboard');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'group_placement_confirmed',
            'group_name' => $this->groupName,
            'period_name' => $this->periodName,
            'location_name' => $this->locationName,
            'message' => "Anda ditempatkan di kelompok {$this->groupName}".($this->locationName ? " di {$this->locationName}" : '').'.',
        ];
    }
}
