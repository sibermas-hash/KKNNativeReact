<?php

namespace App\Notifications\KKN;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class StudentDismissedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $mahasiswa;
    protected $reason;

    public function __construct($mahasiswa, $reason)
    {
        $this->mahasiswa = $mahasiswa;
        $this->reason = $reason;
    }

    public function via($notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable): MailMessage
    {
        return (new MailMessage)
                    ->error()
                    ->subject('🔴 Pemberitahuan Dismissal KKN - UIN SAIZU')
                    ->greeting('Halo, ' . $this->mahasiswa->nama)
                    ->line('Kami informasikan bahwa status pendaftaran KKN Anda telah diubah menjadi GUGUR.')
                    ->line('Alasan: ' . $this->reason)
                    ->line('Berdasarkan regulasi akademik, ketidakhadiran dalam pengisian logbook selama 3 hari berturut-turut tanpa izin yang sah berakibat pada pemberhentian status peserta.')
                    ->line('Silakan hubungi kantor LPPM untuk proses administrasi lebih lanjut.')
                    ->action('Buka Dashboard', url('/'))
                    ->line('Terima kasih atas perhatian Anda.');
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'dismissal',
            'mahasiswa_id' => $this->mahasiswa->id,
            'reason' => $this->reason,
            'message' => 'Status KKN Anda diubah menjadi GUGUR: ' . $this->reason
        ];
    }
}
