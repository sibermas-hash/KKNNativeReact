<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Events\Chat\ChatMessageSent;
use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ChatConversation;
use App\Models\KKN\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * Admin chat dashboard — review + reply + close conversations.
 *
 * PRD_CHAT_SYSTEM.md. Admin bisa lihat SEMUA percakapan, filter by status,
 * reply untuk mengubah status jadi 'replied', atau close tiket.
 *
 * Audit R12-D3-003 fix: tambahkan `use ApiResponse` trait (sama dengan
 * Student\ChatController — dulunya juga tidak pakai trait).
 */
class AdminChatController extends Controller
{
    use ApiResponse;

    /**
     * GET /admin/chat — daftar semua percakapan dengan filter
     */
    public function index(Request $request): JsonResponse
    {
        $status = $request->query('status', 'all');
        $priority = $request->query('priority');

        $query = ChatConversation::query()
            ->with([
                'user:id,name,username,email',
                // R11 fix: eager load the latest single message so transform()
                // tidak fire query tambahan per conversation (N+1 → O(1)).
                'messages' => function ($q) {
                    $q->latest()->limit(1);
                },
            ])
            ->withCount(['messages as unread_count' => function ($q) {
                $q->where('is_read', false)->whereColumn('sender_id', '!=', 'chat_conversations.user_id');
            }]);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }
        if ($priority) {
            $query->where('priority', $priority);
        }

        $conversations = $query
            ->orderByRaw("CASE status WHEN 'open' THEN 0 WHEN 'replied' THEN 1 ELSE 2 END")
            ->orderByDesc('last_message_at')
            ->paginate(20);

        $conversations->getCollection()->transform(function (ChatConversation $c) {
            $lastMsg = $c->messages->first(); // eager-loaded via with() — no query

            return [
                'id' => $c->id,
                'subject' => $c->subject,
                'status' => $c->status,
                'priority' => $c->priority,
                'last_message_at' => $c->last_message_at?->toIso8601String(),
                'closed_at' => $c->closed_at?->toIso8601String(),
                'user' => $c->user ? [
                    'id' => $c->user->id,
                    'name' => $c->user->name,
                    'username' => $c->user->username,
                    'email' => $c->user->email,
                ] : null,
                'last_message_preview' => $lastMsg ? mb_substr($lastMsg->body, 0, 120) : null,
                'created_at' => $c->created_at?->toIso8601String(),
            ];
        });

        return $this->success([
            'data' => $conversations->items(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
            'summary' => [
                'open' => ChatConversation::where('status', 'open')->count(),
                'replied' => ChatConversation::where('status', 'replied')->count(),
                'closed' => ChatConversation::where('status', 'closed')->count(),
            ],
        ]);
    }

    /**
     * GET /admin/chat/{conversation} — detail + semua pesan
     */
    public function show(Request $request, ChatConversation $conversation): JsonResponse
    {
        $conversation->load('user:id,name,username,email');

        // Mark user's messages as read
        $conversation->messages()
            ->where('sender_id', $conversation->user_id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        $messages = $conversation->messages()
            ->with('sender:id,name,username')
            ->orderBy('created_at')
            ->get()
            ->map(fn (ChatMessage $m) => [
                'id' => $m->id,
                'sender' => [
                    'id' => $m->sender->id,
                    'name' => $m->sender->name,
                    'is_admin' => $m->sender_id !== $conversation->user_id,
                ],
                'body' => $m->body,
                'attachment_url' => $m->attachment_path ? asset('storage/'.$m->attachment_path) : null,
                'attachment_name' => $m->attachment_name,
                'is_read' => $m->is_read,
                'created_at' => $m->created_at?->toIso8601String(),
            ]);

        return $this->success([
            'id' => $conversation->id,
            'subject' => $conversation->subject,
            'status' => $conversation->status,
            'priority' => $conversation->priority,
            'closed_at' => $conversation->closed_at?->toIso8601String(),
            'user' => $conversation->user ? [
                'id' => $conversation->user->id,
                'name' => $conversation->user->name,
                'username' => $conversation->user->username,
                'email' => $conversation->user->email,
            ] : null,
            'messages' => $messages,
        ]);
    }

    /**
     * POST /admin/chat/{conversation}/reply — admin balas percakapan
     */
    public function reply(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->status === 'closed') {
            return $this->badRequest('Percakapan sudah ditutup.');
        }

        $data = $request->validate([
            'body' => ['required', 'string', 'max:2000'],
            'attachment' => ['nullable', 'file', 'max:5120', 'mimes:jpg,jpeg,png,pdf,doc,docx', 'mimetypes:image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        ]);

        $attachmentPath = null;
        $attachmentName = null;
        if ($request->hasFile('attachment')) {
            $file = $request->file('attachment');
            $attachmentPath = $file->store('chat-attachments', config('filesystems.default'));
            $attachmentName = mb_substr(basename($file->getClientOriginalName()), 0, 255);
        }

        $message = DB::transaction(function () use ($conversation, $request, $data, $attachmentPath, $attachmentName) {
            $msg = ChatMessage::create([
                'conversation_id' => $conversation->id,
                'sender_id' => $request->user()->id,
                'body' => $data['body'],
                'attachment_path' => $attachmentPath,
                'attachment_name' => $attachmentName,
            ]);

            $conversation->update([
                'last_message_at' => now(),
                'status' => 'replied',
            ]);

            ChatMessageSent::dispatch($msg);

            return $msg;
        });

        return $this->created([
            'id' => $message->id,
            'body' => $message->body,
            'created_at' => $message->created_at?->toIso8601String(),
        ], 'Balasan terkirim.');
    }

    /**
     * PATCH /admin/chat/{conversation}/close — tutup percakapan
     */
    public function close(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->status === 'closed') {
            return $this->badRequest('Percakapan sudah ditutup sebelumnya.');
        }

        $conversation->update([
            'status' => 'closed',
            'closed_at' => now(),
            'closed_by' => $request->user()->id,
        ]);

        return $this->success(['status' => 'closed'], 'Percakapan ditutup.');
    }
}
