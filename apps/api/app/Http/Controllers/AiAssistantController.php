<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\KKN\AiChatHistory;
use App\Models\KKN\KelompokKkn;
use App\Models\KKN\Periode;
use App\Models\KKN\PesertaKkn;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

use function Laravel\Ai\agent;

class AiAssistantController extends Controller
{
    /**
     * Get chat history for the current user.
     */
    public function history()
    {
        $history = AiChatHistory::where('user_id', Auth::id())
            ->orderBy('created_at', 'asc')
            ->get(['role', 'message as text']);

        return response()->json($history);
    }

    /**
     * Process chat and store in database.
     */
    public function chat(Request $request)
    {
        $validated = $request->validate(['message' => 'required|string']);
        $user = Auth::user();

        // 1. Simpan pesan User ke DB
        AiChatHistory::create([
            'user_id' => $user->id,
            'role' => 'user',
            'message' => $validated['message'],
        ]);

        try {
            // Ambil 5 pesan terakhir untuk konteks (Long-term Memory)
            $context = AiChatHistory::where('user_id', $user->id)
                ->orderBy('created_at', 'desc')
                ->take(6)
                ->get()
                ->reverse()
                ->map(fn ($h) => ['role' => $h->role, 'content' => $h->message])
                ->toArray();

            $activePeriod = Periode::where('is_active', true)->first()?->name ?? 'None';
            $stats = "Periode: {$activePeriod}, Mahasiswa: ".PesertaKkn::count().', Kelompok: '.KelompokKkn::count();

            $response = agent(
                instructions: "Anda adalah asisten AI KKN UIN Saizu. Gunakan data statistik jika perlu: {$stats}. Jawab singkat. Anda ingat percakapan sebelumnya jika ada."
            )->prompt(
                prompt: $validated['message'],
                provider: (string) config('ai.routing.assistant.provider', config('ai.default', 'rizquna')),
                model: (string) config('ai.routing.assistant.model', 'ag/gemini-3-flash')
            );

            // 2. Simpan jawaban AI ke DB
            AiChatHistory::create([
                'user_id' => $user->id,
                'role' => 'assistant',
                'message' => $response->text,
            ]);

            return response()->json(['answer' => $response->text]);
        } catch (\Exception $e) {
            Log::error('AI Agent Failure: '.$e->getMessage(), [
                'exception' => $e,
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'answer' => 'Maaf Admin, sistem asisten sedang dalam pemeliharaan atau mengalami kendala teknis. Mohon coba beberapa saat lagi.',
            ], 500);
        }
    }

    /**
     * Clear permanent chat memory.
     */
    public function clear()
    {
        AiChatHistory::where('user_id', Auth::id())->delete();

        return response()->json(['status' => 'Memory Cleared']);
    }
}
