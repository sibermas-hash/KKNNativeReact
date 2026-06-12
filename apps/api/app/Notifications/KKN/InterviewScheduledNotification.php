<?php

declare(strict_types=1);

namespace App\Notifications\KKN;

use App\Models\KKN\InterviewSchedule;
use App\Notifications\Channels\FcmChannel;
use App\Notifications\Channels\WaGatewayChannel;
use App\Notifications\Concerns\ResolvesNotificationChannels;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InterviewScheduledNotification extends Notification
{
    use Queueable, ResolvesNotificationChannels;

    public function __construct(
        private readonly InterviewSchedule $schedule,
    ) {}

    public function via(object $notifiable): array
    {
        return $this->preferredChannels($notifiable, ['database', 'mail', FcmChannel::class, WaGatewayChannel::class]);
    }

    public function toDatabase(object $notifiable): array
    {
        return [
            'title' => 'Jadwal Wawancara KKN',
            'message' => "Anda dijadwalkan wawancara pada {$this->schedule->interview_date->format('d M Y')} pukul {$this->schedule->interview_time_start->format('H:i')} - {$this->schedule->interview_time_end->format('H:i')}".($this->schedule->location ? " di {$this->schedule->location}" : ''),
            'type' => 'interview_scheduled',
            'priority' => 'high',
            'action' => '/mahasiswa/wawancara',
            'data' => [
                'schedule_id' => $this->schedule->id,
                'date' => $this->schedule->interview_date->toDateString(),
                'time_start' => $this->schedule->interview_time_start->format('H:i'),
                'time_end' => $this->schedule->interview_time_end->format('H:i'),
                'location' => $this->schedule->location,
            ],
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Jadwal Wawancara KKN')
            ->greeting("Assalamu'alaikum, {$notifiable->name}")
            ->line('Anda dijadwalkan untuk wawancara KKN:')
            ->line("📅 Tanggal: {$this->schedule->interview_date->format('d M Y')}")
            ->line("🕐 Waktu: {$this->schedule->interview_time_start->format('H:i')} - {$this->schedule->interview_time_end->format('H:i')}")
            ->line('📍 Lokasi: '.($this->schedule->location ?? 'Akan diinformasikan'))
            ->line($this->schedule->notes ? "📝 Catatan: {$this->schedule->notes}" : '')
            ->action('Lihat Detail', url('/mahasiswa/wawancara'))
            ->line('Harap hadir tepat waktu. Terima kasih.');
    }

    public function toFcm(object $notifiable): array
    {
        return [
            'title' => 'Jadwal Wawancara KKN',
            'body' => "Wawancara {$this->schedule->interview_date->format('d M Y')} pukul {$this->schedule->interview_time_start->format('H:i')}".($this->schedule->location ? " di {$this->schedule->location}" : ''),
            'data' => [
                'type' => 'interview_scheduled',
                'action' => '/mahasiswa/wawancara',
                'schedule_id' => (string) $this->schedule->id,
            ],
        ];
    }
}
