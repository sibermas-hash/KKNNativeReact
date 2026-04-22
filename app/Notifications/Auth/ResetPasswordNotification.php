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
        $url = url(route('password.reset', [
            'token' => $this->token,
            'email' => $notifiable->getEmailForPasswordReset(),
        ], false));

        return (new MailMessage)
            ->subject(Lang::get('Atur Ulang Kata Sandi - SIBERDAYA'))
            ->greeting('Halo, '.$notifiable->name.'!')
            ->line(Lang::get('Anda menerima email ini karena kami menerima permintaan atur ulang kata sandi untuk akun Anda.'))
            ->action(Lang::get('Atur Ulang Kata Sandi'), $url)
            ->line(Lang::get('Tautan atur ulang kata sandi ini akan kedaluwarsa dalam :count menit.', ['count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire')]))
            ->line(Lang::get('Jika Anda tidak merasa melakukan permintaan ini, abaikan saja email ini.'))
            ->salutation('Salam hangat, Tim LPPM UIN SAIZU');
    }
}
