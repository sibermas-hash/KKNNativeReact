<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DplAssignedToGroupNotification extends Notification implements ShouldQueue
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
            ->subject("Penugasan DPL: Kelompok {$this->groupName} — SIBERMAS")
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Anda telah ditugaskan sebagai Dosen Pembimbing Lapangan (DPL) untuk kelompok **{$this->groupName}** pada periode **{$this->periodName}**.");

        if ($this->locationName) {
            $mail->line("Lokasi: **{$this->locationName}**.");
        }

        return $mail
            ->line('Silakan login ke portal untuk melihat daftar anggota kelompok dan jadwal kegiatan.')
            ->action('Lihat Kelompok Bimbingan', url('/dpl/dashboard'))
            ->line('Terima kasih atas dedikasi Anda.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'dpl_assigned_to_group',
            'group_name' => $this->groupName,
            'period_name' => $this->periodName,
            'location_name' => $this->locationName,
            'message' => "Anda ditugaskan sebagai DPL kelompok {$this->groupName} ({$this->periodName}).",
        ];
    }
}
