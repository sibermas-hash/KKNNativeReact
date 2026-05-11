<?php

declare(strict_types=1);

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\FcmChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Generic "something happened" notification with dynamic title/message.
 *
 * This is the canonical example of how to fire a notification across all
 * three channels (in_app via `database`, email via `mail`, push via
 * `fcm`). Channel selection is driven by the user's notification
 * preferences — `via()` filters out channels the user has opted out of.
 *
 * Real notification classes (LaporanApproved, WorkshopReminder, dll.)
 * should follow this pattern:
 *   - Constructor takes the domain data (report id, workshop id, etc.)
 *   - via($notifiable) filters channels by user preference
 *   - toDatabase / toMail / toFcm render the channel-specific payload
 *     from the same domain data
 */
class GenericNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly string $title,
        public readonly string $message,
        public readonly string $priority = 'info',
        public readonly ?string $action = null,
        public readonly ?string $type = null,
    ) {}

    /**
     * Filter channels based on the user's per-channel preferences. A user
     * who has disabled `push` in /profil won't receive the FCM dispatch
     * even when the notification class declares it here.
     */
    public function via(mixed $notifiable): array
    {
        $channels = [];

        if (! $notifiable instanceof User) {
            // Non-user notifiables (if any) get the database channel only.
            return ['database'];
        }

        if ($notifiable->wantsNotificationVia('database')) {
            $channels[] = 'database';
        }

        // Email fan-out — only when we actually have an email on file.
        if ($notifiable->wantsNotificationVia('mail') && ! empty($notifiable->email)) {
            $channels[] = 'mail';
        }

        if ($notifiable->wantsNotificationVia('fcm')) {
            $channels[] = FcmChannel::class;
        }

        return $channels;
    }

    public function toDatabase(mixed $notifiable): array
    {
        return [
            'type' => $this->type ?? 'info',
            'title' => $this->title,
            'message' => $this->message,
            'priority' => $this->priority,
            'action' => $this->action,
            'icon' => 'bell',
        ];
    }

    public function toMail(mixed $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->line($this->message);

        if ($this->action) {
            $mail->action('Buka SIBERMAS', url($this->action));
        }

        return $mail;
    }

    public function toFcm(mixed $notifiable): array
    {
        return [
            'title' => $this->title,
            'body' => $this->message,
            'click_action' => $this->action,
            'data' => [
                'priority' => $this->priority,
                'type' => $this->type ?? 'info',
            ],
        ];
    }
}
