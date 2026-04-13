<?php

namespace App\Notifications\KKN;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DplRemovedFromPeriodNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $periodName,
        public string $reason = '',
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("Pencabutan Penugasan DPL — SIM-KKN UIN SAIZU")
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Penugasan Anda sebagai Dosen Pembimbing Lapangan (DPL) pada periode **{$this->periodName}** telah dicabut.");

        if ($this->reason) {
            $mail->line("Alasan: {$this->reason}");
        }

        return $mail
            ->line('Jika Anda memiliki pertanyaan, silakan hubungi LPPM.')
            ->action('Buka Portal SIM-KKN', url('/'))
            ->line('Terima kasih atas kontribusi Anda.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'dpl_removed_from_period',
            'period_name' => $this->periodName,
            'reason' => $this->reason,
            'message' => "Penugasan DPL Anda pada periode {$this->periodName} telah dicabut.",
        ];
    }
}
