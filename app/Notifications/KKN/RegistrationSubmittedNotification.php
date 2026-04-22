<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\PesertaKkn;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class RegistrationSubmittedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public PesertaKkn $registration,
        public string $periodName,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Pendaftaran KKN Berhasil Diajukan — SIBERDAYA')
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line("Pendaftaran Anda untuk **{$this->periodName}** telah berhasil diajukan.")
            ->line('Status saat ini: **Menunggu Verifikasi Admin**')
            ->line('Tim LPPM akan meninjau kelengkapan dokumen dan persyaratan Anda. Anda akan menerima email kembali setelah proses verifikasi selesai.')
            ->action('Pantau Status Pendaftaran', url('/student/dashboard'))
            ->line('Terima kasih telah mendaftar SIBERDAYA.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'registration_submitted',
            'registration_id' => $this->registration->id,
            'period_name' => $this->periodName,
            'message' => "Pendaftaran {$this->periodName} berhasil diajukan. Menunggu verifikasi admin.",
        ];
    }
}
