<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TestAiCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:test 
                            {--model=default : Model to test (default|cheapest|smartest|gemini-2.5-flash|gemini-2.5-pro|gemini-2.5-flash-lite)}
                            {--prompt="Test prompt dari terminal" : Prompt untuk AI}
                            {--provider=gemini : AI Provider (gemini|openai|anthropic|etc)}
                            {--detail : Show detailed response}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Test AI connection dan pilih model dari terminal';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🤖 Portal KKN - AI Testing Tool');
        $this->line('');

        $model = $this->option('model');
        $prompt = $this->option('prompt');
        $provider = $this->option('provider');
        $isVerbose = $this->option('detail');

        $this->line("📊 Configuration:");
        $this->line("  Provider: <fg=blue>{$provider}</>");
        $this->line("  Model: <fg=green>{$model}</>");
        $this->line("  Prompt: <fg=cyan>{$prompt}</>");
        $this->line('');

        // Validate API key exists
        if (! $this->validateApiKey($provider)) {
            $this->error("❌ No API key configured for provider: {$provider}");
            $this->info("Setup via: /admin/pengaturan-sistem → Monitor Intelegensi");
            return 1;
        }

        $this->info('🔄 Testing connection...');

        try {
            $response = $this->testAiConnection($provider, $model, $prompt, $isVerbose);

            if ($response) {
                $this->success('✅ AI Connection Success!');
                $this->line('');
                $this->line("📝 Response:");
                $this->line($response);
                return 0;
            }

            $this->error('❌ Failed to get response from AI');
            return 1;
        } catch (\Exception $e) {
            $this->error("❌ Error: {$e->getMessage()}");

            if ($isVerbose) {
                $this->line('');
                $this->line('Stack Trace:');
                $this->line($e->getTraceAsString());
            }

            return 1;
        }
    }

    /**
     * Validate API key exists for provider
     */
    private function validateApiKey(string $provider): bool
    {
        // Try from database first
        try {
            $key = \DB::table('system_settings')
                ->where('config_key', "{$provider}_api_key")
                ->value('value');

            if ($key) {
                return true;
            }
        } catch (\Exception $e) {
            // Database not ready
        }

        // Try from .env
        $envKey = strtoupper($provider).'_API_KEY';
        return ! empty(env($envKey));
    }

    /**
     * Test AI connection via Laravel AI facade
     */
    private function testAiConnection(string $provider, string $model, string $prompt, bool $verbose): ?string
    {
        try {
            // Use provider if specified
            if ($provider !== 'gemini') {
                $ai = app('laravel-ai')->provider($provider);
            } else {
                $ai = app('laravel-ai');
            }

            // Use model if not default
            if ($model !== 'default') {
                $ai = $ai->model($model);
            }

            $response = $ai->generate($prompt);

            if ($verbose) {
                $this->line('');
                $this->line('📋 Full Response:');
                $this->line(json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
            }

            return $response;
        } catch (\Exception $e) {
            throw $e;
        }
    }
}
