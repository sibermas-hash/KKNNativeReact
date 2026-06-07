<?php

declare(strict_types=1);

namespace App\Notifications\Concerns;

use App\Models\User;
use App\Notifications\Channels\WaGatewayChannel;

trait ResolvesNotificationChannels
{
    /**
     * Resolve notification channels from user preferences.
     *
     * @param  array<int, string|class-string>  $declared
     * @return array<int, string|class-string>
     */
    protected function preferredChannels(mixed $notifiable, array $declared): array
    {
        if (! $notifiable instanceof User) {
            return $declared;
        }

        $channels = [];

        foreach ($declared as $channel) {
            if ($channel === database) {
                if ($notifiable->wantsNotificationVia(database)) {
                    $channels[] = $channel;
                }

                continue;
            }

            if ($channel === mail) {
                if ($notifiable->wantsNotificationVia(mail) && ! empty($notifiable->email)) {
                    $channels[] = $channel;
                }

                continue;
            }

            if ($channel === WaGatewayChannel::class) {
                if ($notifiable->wantsNotificationVia(wa) && ! empty($notifiable->phone)) {
                    $channels[] = $channel;
                }

                continue;
            }

            $channels[] = $channel;
        }

        return $channels;
    }
}
