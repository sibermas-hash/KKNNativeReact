<?php

declare(strict_types=1);

namespace App\Events\Chat;

use App\Models\KKN\ChatMessage;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ChatMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public ChatMessage $message)
    {
        $this->message->loadMissing('sender:id,name,username');
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('chat.'.$this->message->conversation_id)];
    }

    public function broadcastAs(): string
    {
        return 'message.sent';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->message->id,
            'conversation_id' => $this->message->conversation_id,
            'sender' => [
                'id' => $this->message->sender_id,
                'name' => $this->message->sender?->name,
                'username' => $this->message->sender?->username,
            ],
            'body' => $this->message->body,
            'attachment_name' => $this->message->attachment_name,
            'is_read' => $this->message->is_read,
            'created_at' => $this->message->created_at?->toIso8601String(),
        ];
    }
}
