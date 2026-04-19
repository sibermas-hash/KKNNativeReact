<?php

declare(strict_types=1);

namespace App\Console\Commands;

use Illuminate\Console\Command;

class ListAiModelsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:list {--provider= : Filter by provider}';

    /**
     * The description of the console command.
     *
     * @var string
     */
    protected $description = 'List all available AI providers dan models';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🤖 Available AI Providers & Models');
        $this->line('');

        $providers = config('ai.providers', []);
        $filterProvider = $this->option('provider');

        if (empty($providers)) {
            $this->error('No AI providers configured');
            return 1;
        }

        $this->displayProviders($providers, $filterProvider);

        return 0;
    }

    /**
     * Display all providers and their models
     */
    private function displayProviders(array $providers, ?string $filter): void
    {
        $count = 0;

        foreach ($providers as $name => $config) {
            // Filter if specified
            if ($filter && $name !== $filter) {
                continue;
            }

            $count++;

            // Check if API key is configured
            $hasKey = ! empty($config['key'] ?? null);
            $status = $hasKey ? '✅' : '❌';

            $this->line("<fg=green>{$name}</> <fg=gray>({$config['driver']})</> {$status}");

            // Display models if available
            if (isset($config['models']['text'])) {
                $this->displayModels($config['models']['text']);
            }

            $this->line('');
        }

        if ($count === 0) {
            $this->error("No providers found matching: {$filter}");
        } else {
            $this->info("Total providers: {$count}");
        }
    }

    /**
     * Display available models for a provider
     */
    private function displayModels(array $models): void
    {
        $this->line('  Models:');

        if (isset($models['default'])) {
            $this->line("    • <fg=cyan>default</> → {$models['default']} ⭐ (PRIMARY)");
        }

        if (isset($models['cheapest'])) {
            $this->line("    • <fg=yellow>cheapest</> → {$models['cheapest']} 💰");
        }

        if (isset($models['smartest'])) {
            $this->line("    • <fg=blue>smartest</> → {$models['smartest']} 🧠");
        }

        // Show other models if available
        $other = array_diff_key($models, ['default' => null, 'cheapest' => null, 'smartest' => null]);
        foreach ($other as $key => $value) {
            $this->line("    • <fg=gray>{$key}</> → {$value}");
        }
    }
}
