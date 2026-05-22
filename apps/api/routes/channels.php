<?php

use App\Models\KKN\ChatConversation;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('chat.{conversationId}', function ($user, int $conversationId) {
    if ($user->hasAnyRole(['superadmin', 'admin', 'faculty_admin'])) {
        return ['id' => $user->id, 'name' => $user->name, 'role' => 'admin'];
    }

    return ChatConversation::query()
        ->whereKey($conversationId)
        ->where('user_id', $user->id)
        ->exists()
            ? ['id' => $user->id, 'name' => $user->name, 'role' => 'user']
            : false;
});
