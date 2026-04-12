<?php

namespace App\Notifications\KKN;

use App\Models\KKN\PesertaKkn;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PesertaKkn $registration,
        public string $periodName,
        public ?string $groupName = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('✅ Pendaftaran KKN Disetujui — SIM-KKN UIN SAIZU')
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Selamat! Pendaftaran Anda untuk **{$this->periodName}** telah **disetujui**.");

        if ($this->groupName) {
            $mail->line("Anda telah ditempatkan di kelompok: **{$this->groupName}**.");
        } else {
            $mail->line('Penempatan kelompok akan ditentukan oleh sistem setelah seluruh pendaftaran diproses.');
        }

        return $mail
            ->action('Lihat Detail Pendaftaran', url('/student/dashboard'))
            ->line('Silakan pantau informasi selanjutnya melalui portal SIM-KKN.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'registration_approved',
            'registration_id' => $this->registration->id,
            'period_name' => $this->periodName,
            'group_name' => $this->groupName,
            'message' => "Pendaftaran {$this->periodName} telah disetujui." . ($this->groupName ? " Kelompok: {$this->groupName}" : ''),
        ];
    }
}
