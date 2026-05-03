<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AccountActivatedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public string $name,
        public string $username,
        public string $roleLabel,
        public ?string $tempPassword = null
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject('Akses SIBERMAS Anda Telah Aktif')
            ->greeting("Assalamu'alaikum, {$this->name}")
            ->line("Akun Anda sebagai **{$this->roleLabel}** pada portal SIBERMAS telah diaktifkan oleh Administrator.")
            ->line('Berikut adalah detail login Anda:')
            ->line("- **Username:** {$this->username}")
            ->line('- **URL Login:** '.url('/login'));

        if ($this->tempPassword) {
            $mail->line("- **Password Sementara:** {$this->tempPassword}")
                ->line('Segera ganti kata sandi Anda setelah berhasil login untuk keamanan akun.');
        } else {
            $mail->line('Silakan gunakan kata sandi yang telah ditentukan atau yang disinkronkan dari database pusat.');
        }

        return $mail
            ->action('Login ke SIBERMAS', url('/login'))
            ->line('Jika Anda mengalami kesulitan saat login, silakan hubungi tim dukungan LPPM UIN SAIZU.');
    }

    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'account_activated',
            'message' => "Akun SIBERMAS Anda sebagai {$this->roleLabel} telah aktif.",
            'username' => $this->username,
        ];
    }
}
