<?php

namespace App\Notifications\KKN;

use App\Models\KKN\PesertaKkn;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class NewRegistrationForAdminNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PesertaKkn $registration,
        public string $studentName,
        public string $periodName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Pendaftaran Baru: {$this->studentName} — SIM-KKN UIN SAIZU")
            ->greeting("Halo, {$notifiable->name}")
            ->line("Ada pendaftaran KKN baru yang menunggu verifikasi Anda.")
            ->line("**Mahasiswa:** {$this->studentName}")
            ->line("**Periode:** {$this->periodName}")
            ->action('Review Pendaftaran', url('/admin/peserta-kkn'))
            ->line('Silakan periksa kelengkapan dokumen dan persyaratan mahasiswa tersebut.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'new_registration',
            'registration_id' => $this->registration->id,
            'student_name' => $this->studentName,
            'period_name' => $this->periodName,
            'message' => "Pendaftaran baru dari {$this->studentName} untuk {$this->periodName}.",
        ];
    }
}
