import re

with open('app/Http/Controllers/Admin/SystemSettingController.php', 'r') as f:
    content = f.read()

new_methods = """
    public function testAiConnection(Request $request)
    {
        $request->validate([
            'gemini_api_key' => 'required|string',
        ]);

        $apiKey = $request->input('gemini_api_key');

        try {
            $response = \\Illuminate\\Support\\Facades\\Http::timeout(10)
                ->post("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={$apiKey}", [
                    'contents' => [
                        [
                            'parts' => [
                                ['text' => 'ping']
                            ]
                        ]
                    ]
                ]);

            if ($response->successful()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Koneksi API berhasil.',
                    'model' => 'gemini-1.5-flash',
                ]);
            }

            return response()->json([
                'success' => false,
                'message' => 'API Key tidak valid atau permintaan ditolak oleh Google AI.',
                'error_code' => 'API_REJECTED'
            ]);
        } catch (\\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungi server Google AI: ' . $e->getMessage(),
                'error_code' => 'NETWORK_ERROR'
            ]);
        }
    }

    public function updateAiSettings(Request $request)
    {
        $request->validate([
            'gemini_api_key' => 'nullable|string',
            'ai_enabled' => 'required|in:0,1,true,false',
        ]);

        $apiKeySetting = SystemSetting::where('config_key', 'gemini_api_key')->first();
        if ($apiKeySetting && $request->filled('gemini_api_key')) {
            $apiKeySetting->update([
                'value' => \\Illuminate\\Support\\Facades\\Crypt::encryptString($request->input('gemini_api_key'))
            ]);
            \\Illuminate\\Support\\Facades\\Cache::forget("system_setting_gemini_api_key");
        }

        $enabledSetting = SystemSetting::where('config_key', 'ai_enabled')->first();
        if ($enabledSetting) {
            $val = in_array($request->input('ai_enabled'), [1, '1', true, 'true'], true) ? '1' : '0';
            $enabledSetting->update(['value' => $val]);
            \\Illuminate\\Support\\Facades\\Cache::forget("system_setting_ai_enabled");
        }

        return redirect()->back()->with('success', 'Konfigurasi AI berhasil diperbarui.');
    }
"""

# Insert right before the last closing brace.
content = re.sub(r"}\s*$", new_methods + "\n}\n", content)

with open('app/Http/Controllers/Admin/SystemSettingController.php', 'w') as f:
    f.write(content)
print("Methods injected successfully.")
