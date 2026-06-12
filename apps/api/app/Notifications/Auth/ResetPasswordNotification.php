<?php

namespace App\Notifications\Auth;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Lang;

class ResetPasswordNotification extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The password reset token.
     *
     * @var string
     */
    public $token;

    /**
     * Create a new notification instance.
     */
    public function __construct($token)
    {
        $this->token = $token;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $email = $notifiable->getEmailForPasswordReset();
        $frontendUrl = rtrim((string) config('app.frontend_url', config('app.url')), '/');
        $url = $frontendUrl.'/atur-ulang-kata-sandi?'.http_build_query([
            'token' => $this->token,
            'email' => $email,
        ]);
        $expireMinutes = (int) config('auth.passwords.'.config('auth.defaults.passwords').'.expire', 30);
        $displayName = trim((string) ($notifiable->name ?? '')) ?: 'Pengguna SIBERMAS';

        return (new MailMessage)
            ->subject(Lang::get('[SIBERMAS] Instruksi Pengaturan Ulang Kata Sandi'))
            ->greeting(Lang::get('Halo :name,', ['name' => $displayName]))
            ->line(Lang::get('Kami menerima permintaan pengaturan ulang kata sandi untuk akun SIBERMAS Anda.'))
            ->line(Lang::get('Klik tombol di bawah ini untuk membuat kata sandi baru.'))
            ->action(Lang::get('Atur Ulang Kata Sandi'), $url)
            ->line(Lang::get('Tautan ini berlaku selama :count menit dan hanya dapat digunakan untuk akun dengan alamat email :email.', [
                'count' => $expireMinutes,
                'email' => $email,
            ]))
            ->line(Lang::get('Jika Anda tidak meminta pengaturan ulang kata sandi, abaikan email ini. Akun Anda tetap aman selama tautan ini tidak digunakan.'))
            ->line(Lang::get('Demi keamanan, jangan bagikan email atau tautan ini kepada siapa pun, termasuk pihak yang mengaku sebagai petugas.'))
            ->salutation(Lang::get('Salam, Tim SIBERMAS UIN Saizu'));
    }
}
