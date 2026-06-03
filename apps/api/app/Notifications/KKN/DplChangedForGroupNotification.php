<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Audit R11-GROUP-017 fix: notifikasi saat DPL kelompok berubah mid-KKN.
 * Sebelumnya hanya DPL lama + DPL baru dapat notifikasi; mahasiswa
 * anggota kelompok tidak tahu DPL-nya ganti dan berisiko kehilangan
 * koordinasi.
 */
class DplChangedForGroupNotification extends Notification implements ShouldQueue
{
    use Queueable, ResolvesNotificationChannels;

    public function __construct(
        public string $groupName,
        public string $periodName,
        public string $newDplName,
        public ?string $previousDplName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return $this->preferredChannels($notifiable, ['mail', 'database', WaGatewayChannel::class]);
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Perubahan DPL Kelompok {$this->groupName} — SIBERMAS")
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Terdapat perubahan Dosen Pembimbing Lapangan (DPL) untuk kelompok KKN Anda (**{$this->groupName}** — {$this->periodName}).");

        if ($this->previousDplName) {
            $mail->line("DPL sebelumnya: **{$this->previousDplName}**.");
        }

        return $mail
            ->line("DPL baru: **{$this->newDplName}**.")
            ->line('Silakan koordinasikan kembali agenda bimbingan dan jalur komunikasi dengan DPL baru Anda.')
            ->action('Lihat Dashboard', url('/mahasiswa'))
            ->line('Terima kasih.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'dpl_changed_for_group',
            'group_name' => $this->groupName,
            'period_name' => $this->periodName,
            'new_dpl_name' => $this->newDplName,
            'previous_dpl_name' => $this->previousDplName,
            'message' => "DPL kelompok {$this->groupName} berubah dari "
                .($this->previousDplName ? $this->previousDplName.' ke ' : 'belum ditentukan menjadi ')
                .$this->newDplName.'.',
        ];
    }
}
