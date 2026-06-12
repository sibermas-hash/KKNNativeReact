<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\KKN\NilaiKkn;
use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ScorePublished extends Notification implements ShouldQueue
{
    use Queueable, ResolvesNotificationChannels;

    public function __construct(
        public NilaiKkn $score
    ) {}

    /**
     * Get the notification's delivery channels.
     */
    public function via(object $notifiable): array
    {
        return $this->preferredChannels($notifiable, ['database', 'mail', WaGatewayChannel::class]);
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $letterGrade = $this->score->letter_grade ?? 'Tidak Ada';
        $totalScore = $this->score->total_score ?? 0;

        return (new MailMessage)
            ->subject('Nilai KKN Telah Dirilis - SIBERMAS')
            ->greeting("Assalamu'alaikum ".$notifiable->name)
            ->line('Nilai KKN Anda telah dirilis dan difinalisasi.')
            ->line('Silakan login untuk melihat detail nilai Anda.')
            ->action('Lihat Nilai', url('/student/evaluations'))
            ->line('Terima kasih atas partisipasi Anda dalam program KKN.')
            ->salutation("Wassalamu'alaikum, Tim LPPM UIN SAIZU");
    }

    public function toWaGateway(object $notifiable): string
    {
        return '🎓 *Nilai KKN Dirilis*

Nilai akhir: '.($this->score->total_score ?? 0).' ('.($this->score->letter_grade ?? '-').')

Buka: '.url('/student/evaluations');
    }

    /**
     * Get the array representation for database notification.
     */
    public function toArray(object $notifiable): array
    {
        return [
            'title' => 'Nilai KKN Dirilis',
            'message' => 'Nilai KKN Anda telah difinalisasi. Nilai akhir: '.
                ($this->score->total_score ?? 0).
                ' ('.($this->score->letter_grade ?? '-').')',
            'url' => '/student/evaluations',
            'icon' => 'academic-cap',
            'type' => 'success',
        ];
    }
}
