<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Student;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\ChatConversation;
use App\Models\KKN\ChatMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\URL;

/**
 * Student/Dosen chat dengan Superadmin (PRD_CHAT_SYSTEM.md).
 *
 * Endpoint ini juga dipakai dosen — role middleware di route layer yang
 * membatasi akses (role:student|dosen|dpl).
 *
 * Audit R12-D3-002 fix: tambahkan `use ApiResponse` trait. Sebelumnya
 * method `$this->success/forbidden/created/badRequest` dipanggil tapi
 * trait tidak di-use → undefined method fatal error saat endpoint
 * dipanggil (tidak ke-test karena chat flow tidak punya test coverage).
 */
class ChatController extends Controller
{
    use ApiResponse;

    /**
     * GET /student/chat — daftar percakapan user sendiri
     */
    public function index(Request $request): JsonResponse
    {
        $conversations = ChatConversation::where('user_id', $request->user()->id)
            ->with(['messages' => fn ($q) => $q->latest()->limit(1)])
            ->withCount(['messages as unread_count' => fn ($q) => $q
                ->where('is_read', false)
                ->where('sender_id', '!=', $request->user()->id),
            ])
            ->orderByDesc('last_message_at')
            ->paginate(20);

        $conversations->getCollection()->transform(fn (ChatConversation $c) => [
            'id' => $c->id,
            'subject' => $c->subject,
            'status' => $c->status,
            'priority' => $c->priority,
            'last_message_at' => $c->last_message_at?->toIso8601String(),
            'closed_at' => $c->closed_at?->toIso8601String(),
            'created_at' => $c->created_at?->toIso8601String(),
            'last_message' => $c->messages->first() ? [
                'body' => mb_substr($c->messages->first()->body, 0, 120),
                'sender_id' => $c->messages->first()->sender_id,
                'is_read' => $c->messages->first()->is_read,
            ] : null,
            'unread_count' => (int) $c->getAttribute('unread_count'),
        ]);

        return $this->success([
            'data' => $conversations->items(),
            'meta' => [
                'current_page' => $conversations->currentPage(),
                'last_page' => $conversations->lastPage(),
                'per_page' => $conversations->perPage(),
                'total' => $conversations->total(),
            ],
        ]);
    }

    /**
     * POST /student/chat — buat percakapan baru
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'message' => ['required', 'string', 'max:2000'],
            'priority' => ['nullable', 'in:normal,urgent'],
        ]);

        $userId = $request->user()->id;

        $conversation = DB::transaction(function () use ($data, $userId) {
            $conv = ChatConversation::create([
                'user_id' => $userId,
                'subject' => $data['subject'],
                'status' => 'open',
                'priority' => $data['priority'] ?? 'normal',
                'last_message_at' => now(),
            ]);

            ChatMessage::create([
                'conversation_id' => $conv->id,
                'sender_id' => $userId,
                'body' => $data['message'],
            ]);

            return $conv;
        });

        return $this->created([
            'id' => $conversation->id,
            'subject' => $conversation->subject,
            'status' => $conversation->status,
        ], 'Percakapan berhasil dibuat.');
    }

    /**
     * GET /student/chat/{conversation} — detail + semua pesan
     */
    public function show(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            return $this->forbidden('Anda tidak memiliki akses ke percakapan ini.');
        }

        // Mark admin messages as read
        $conversation->messages()
            ->where('sender_id', '!=', $request->user()->id)
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
                    'is_self' => $m->sender_id === $request->user()->id,
                ],
                'body' => $m->body,
                'attachment_url' => $m->attachment_path ? URL::temporarySignedRoute(
                    'api.v1.files.chat-attachment',
                    now()->addMinutes(30),
                    ['message' => $m->id],
                ) : null,
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
            'messages' => $messages,
        ]);
    }

    /**
     * POST /student/chat/{conversation}/messages — kirim pesan
     */
    public function sendMessage(Request $request, ChatConversation $conversation): JsonResponse
    {
        if ($conversation->user_id !== $request->user()->id) {
            return $this->forbidden('Anda tidak memiliki akses ke percakapan ini.');
        }

        if ($conversation->status === 'closed') {
            return $this->badRequest('Percakapan sudah ditutup. Silakan buat percakapan baru.');
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
                'status' => 'open', // jika admin sudah reply, user kirim lagi → balik open
            ]);

            return $msg;
        });

        return $this->created([
            'id' => $message->id,
            'body' => $message->body,
            'attachment_url' => $attachmentPath ? URL::temporarySignedRoute(
                'api.v1.files.chat-attachment',
                now()->addMinutes(30),
                ['message' => $message->id],
            ) : null,
            'created_at' => $message->created_at?->toIso8601String(),
        ], 'Pesan terkirim.');
    }
}
