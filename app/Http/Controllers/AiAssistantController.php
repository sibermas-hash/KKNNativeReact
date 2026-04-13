<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use function Laravel\Ai\agent;

class AiAssistantController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        try {
            $response = agent(
                instructions: "Anda adalah 'Saizu Assistant'. Bantu user sistem KKN UIN Saizu dengan ramah.",
                provider: 'alibaba'
            )->prompt($validated['message']);

            return response()->json(['answer' => $response->text]);
        } catch (\Exception $e) {
            return response()->json(['answer' => 'Maaf, otak saya sedang panas. Coba lagi nanti.'], 500);
        }
    }
}
