<?php

declare(strict_types=1);

namespace App\Notifications\Channels;

use App\Models\User;
use App\Services\WaGatewayService;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;

class WaGatewayChannel
{
    public function __construct(private readonly WaGatewayService $wa) {}

    public function send(mixed $notifiable, Notification $notification): void
    {
        if (! $notifiable instanceof User || blank($notifiable->phone)) return;
        if (! method_exists($notification, 'toWaGateway')) return;
        $message = (string) $notification->toWaGateway($notifiable);
        if ($message === '') return;
        if (! $this->wa->sendMessage((string) $notifiable->phone, $message)) {
            Log::warning('[WaGatewayChannel] send failed', ['user_id' => $notifiable->id]);
        }
    }
}
