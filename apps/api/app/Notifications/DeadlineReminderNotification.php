<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\KKN\Periode;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class DeadlineReminderNotification extends Notification
{
    use Queueable;

    public function __construct(
        private readonly Periode $periode,
        private readonly string $label,
    ) {}

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $periodeName = $this->periode->name;
        $deadline = $this->periode->registration_end?->format('d M Y H:i');

        return [
            'title' => "⏰ Pengingat Deadline Pendaftaran ({$this->label})",
            'message' => "Pendaftaran {$periodeName} akan ditutup pada {$deadline}. Segera selesaikan pendaftaran Anda!",
            'type' => 'deadline_reminder',
            'periode_id' => $this->periode->id,
            'label' => $this->label,
            'action_url' => '/mahasiswa/pendaftaran',
        ];
    }
}
