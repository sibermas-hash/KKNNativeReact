<?php

namespace App\Notifications\KKN;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyLogbookReminderNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $periodName,
        public int $missedDays = 1,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('⏰ Pengingat: Isi Logbook Harian KKN — SIM-KKN UIN SAIZU')
            ->greeting("Assalamu'alaikum, {$notifiable->name}");

        if ($this->missedDays >= 3) {
            $mail->error()
                ->line("⚠️ **PERINGATAN:** Anda sudah **{$this->missedDays} hari** tidak mengisi logbook.")
                ->line('Berdasarkan regulasi akademik, ketidakhadiran pengisian logbook selama 3 hari berturut-turut tanpa izin berakibat pada **pemberhentian status peserta KKN**.');
        } elseif ($this->missedDays >= 2) {
            $mail->line("Anda belum mengisi logbook harian selama **{$this->missedDays} hari**.")
                ->line('Jika tidak segera diisi, status keikutsertaan KKN Anda dapat terpengaruh.');
        } else {
            $mail->line('Jangan lupa untuk mengisi logbook kegiatan harian KKN Anda hari ini.')
                ->line('Logbook harian penting untuk dokumentasi dan penilaian kegiatan KKN.');
        }

        return $mail
            ->action('Isi Logbook Sekarang', url('/student/daily-reports'))
            ->line("Periode: {$this->periodName}");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'daily_logbook_reminder',
            'period_name' => $this->periodName,
            'missed_days' => $this->missedDays,
            'message' => $this->missedDays >= 2
                ? "⚠️ Anda belum mengisi logbook {$this->missedDays} hari. Segera isi untuk menghindari sanksi."
                : 'Jangan lupa mengisi logbook harian KKN Anda hari ini.',
        ];
    }
}
