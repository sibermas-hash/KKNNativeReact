<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Models\KKN\SystemSetting;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;

class ConfigureAiCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:config 
                            {action : Action to perform (set|get|remove|list)}
                            {--provider=gemini : Provider name}
                            {--key= : API key value (for set action)}
                            {--force : Skip confirmation}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'Manage AI configuration dari CLI';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $action = $this->argument('action');
        $provider = $this->option('provider');

        return match ($action) {
            'set' => $this->setApiKey($provider),
            'get' => $this->getApiKey($provider),
            'remove' => $this->removeApiKey($provider),
            'list' => $this->listAllKeys(),
            default => $this->invalidAction($action),
        };
    }

    /**
     * Set API key for provider
     */
    private function setApiKey(string $provider): int
    {
        $configKey = "{$provider}_api_key";

        // Get key value
        $apiKey = $this->option('key');

        if (! $apiKey) {
            $apiKey = $this->secret("Enter API key for {$provider}");
        }

        if (! $apiKey) {
            $this->error('API key is required');
            return 1;
        }

        // Confirm before setting
        if (! $this->option('force')) {
            $this->line("");
            $this->line("Provider: <fg=blue>{$provider}</>");
            $this->line("Config Key: <fg=blue>{$configKey}</>");
            $this->line("Key Length: <fg=blue>" . strlen($apiKey) . " chars</>");

            if (! $this->confirm('Proceed to save?')) {
                $this->info('Cancelled');
                return 0;
            }
        }

        try {
            // Find or create setting
            $setting = SystemSetting::firstOrCreate(
                ['config_key' => $configKey],
                [
                    'group' => 'ai_settings',
                    'type' => 'password',
                    'label' => ucfirst($provider).' API Key',
                ]
            );

            // Encrypt and save
            $encrypted = Crypt::encryptString($apiKey);
            $setting->update(['value' => $encrypted]);

            // Invalidate cache
            Cache::forget('ai_provider_config');

            $this->success("✅ API key saved for {$provider}");
            $this->line("Config Key: {$configKey}");
            $this->line("Encrypted: Yes ✓");
            $this->line("Cache invalidated: Yes ✓");

            return 0;
        } catch (\Exception $e) {
            $this->error("Error saving API key: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Get API key for provider
     */
    private function getApiKey(string $provider): int
    {
        $configKey = "{$provider}_api_key";

        try {
            $setting = SystemSetting::where('config_key', $configKey)->first();

            if (! $setting || ! $setting->value) {
                $this->warn("No API key configured for: {$provider}");
                return 1;
            }

            $decrypted = Crypt::decryptString($setting->value);
            $masked = str_repeat('*', max(0, strlen($decrypted) - 4)) . substr($decrypted, -4);

            $this->line('');
            $this->info("API Key for: {$provider}");
            $this->line("Masked: {$masked}");
            $this->line("Length: " . strlen($decrypted) . " chars");
            $this->line("Stored: " . $setting->updated_at->diffForHumans());

            return 0;
        } catch (\Exception $e) {
            $this->error("Error retrieving API key: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Remove API key for provider
     */
    private function removeApiKey(string $provider): int
    {
        $configKey = "{$provider}_api_key";

        try {
            $setting = SystemSetting::where('config_key', $configKey)->first();

            if (! $setting) {
                $this->warn("No API key found for: {$provider}");
                return 1;
            }

            if (! $this->option('force')) {
                if (! $this->confirm("Remove API key for {$provider}?")) {
                    $this->info('Cancelled');
                    return 0;
                }
            }

            $setting->delete();
            Cache::forget('ai_provider_config');

            $this->success("✅ API key removed for {$provider}");

            return 0;
        } catch (\Exception $e) {
            $this->error("Error removing API key: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * List all API keys
     */
    private function listAllKeys(): int
    {
        try {
            $settings = SystemSetting::where('config_key', 'like', '%_api_key')
                ->orWhere('group', 'ai_settings')
                ->get();

            if ($settings->isEmpty()) {
                $this->warn('No AI settings configured');
                return 0;
            }

            $this->info('Configured AI Settings:');
            $this->line('');

            foreach ($settings as $setting) {
                $isSecret = str_ends_with($setting->config_key, '_api_key');

                if ($isSecret && $setting->value) {
                    try {
                        $decrypted = Crypt::decryptString($setting->value);
                        $display = str_repeat('*', max(0, strlen($decrypted) - 4)) . substr($decrypted, -4);
                    } catch (\Exception $e) {
                        $display = '(decryption error)';
                    }
                } else {
                    $display = $setting->value ?? '(empty)';
                }

                $type = match ($setting->type) {
                    'password' => '🔐',
                    'text' => '📝',
                    default => '🔧',
                };

                $this->line("{$type} <fg=blue>{$setting->config_key}</> → {$display}");
            }

            return 0;
        } catch (\Exception $e) {
            $this->error("Error listing settings: {$e->getMessage()}");
            return 1;
        }
    }

    /**
     * Handle invalid action
     */
    private function invalidAction(string $action): int
    {
        $this->error("Invalid action: {$action}");
        $this->info('Valid actions: set, get, remove, list');
        return 1;
    }
}
