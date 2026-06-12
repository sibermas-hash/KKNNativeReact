<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\Admin\SystemSettingController;
use App\Models\KKN\SystemSetting;
use App\Providers\AiConfigServiceProvider;
use App\Services\AI\HasAiFailover;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

uses(TestCase::class);

function makeAiTierProbe(): object
{
    return new class
    {
        use HasAiFailover;

        /**
         * @return array<string, array{label: string, url: string, key: string, model: string}>
         */
        public function tierMap(?string $preferredModel = null, bool $forcePreferredModel = false): array
        {
            return $this->loadAiTierMap($preferredModel, $forcePreferredModel);
        }
    };
}

beforeEach(function () {
    Cache::flush();

    $this->sqliteDbPath = '/tmp/sibermas-ai-runtime-config-test.sqlite';
    @unlink($this->sqliteDbPath);
    touch($this->sqliteDbPath);

    config([
        'app.key' => 'base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        'app.cipher' => 'AES-256-CBC',
        'database.default' => 'sqlite',
        'database.connections.sqlite' => [
            'driver' => 'sqlite',
            'database' => $this->sqliteDbPath,
            'prefix' => '',
            'foreign_key_constraints' => true,
        ],
        'ai.default' => 'rizquna',
        'ai.default_for_images' => 'rizquna',
        'ai.default_for_audio' => 'rizquna',
        'ai.default_for_transcription' => 'rizquna',
        'ai.default_for_embeddings' => 'rizquna',
        'ai.default_for_reranking' => 'rizquna',
        'ai.providers.rizquna.key' => 'env-rizquna-key',
        'ai.providers.rizquna.url' => 'https://env-router.example/v1',
        'ai.providers.rizquna.models.text.default' => 'ag/env-default',
        'ai.providers.rizquna.models.vision.default' => 'ag/env-vision',
        'ai.providers.rizquna.models.code.default' => 'cx/env-code',
        'ai.failover.primary.url' => 'https://env-primary.example/v1',
        'ai.failover.primary.key' => 'env-primary-key',
        'ai.failover.primary.model' => 'ag/env-primary',
        'ai.failover.fallback.url' => 'https://env-fallback.example/v1',
        'ai.failover.fallback.key' => 'env-fallback-key',
        'ai.failover.fallback.model' => 'ag/env-fallback',
        'ai.failover.tertiary.url' => 'https://env-tertiary.example/v1',
        'ai.failover.tertiary.key' => 'env-tertiary-key',
        'ai.failover.tertiary.model' => 'ag/env-tertiary',
        'ai.routing.assistant.model' => 'ag/env-assistant',
        'ai.routing.assistant.timeout' => 10,
        'ai.routing.analysis.model' => 'ag/env-analysis',
        'ai.routing.activity_reviewer.model' => 'ag/env-activity',
        'ai.routing.digest.model' => 'ag/env-digest',
        'ai.routing.digest.timeout' => 30,
        'ai.routing.digest.temperature' => 0.3,
        'ai.routing.digest.max_tokens' => 300,
        'ai.routing.alerting.model' => 'ag/env-alert',
        'ai.routing.alerting.timeout' => 15,
        'ai.routing.alerting.temperature' => 0.2,
        'ai.routing.alerting.max_tokens' => 200,
    ]);

    DB::purge('sqlite');
    app('db')->setDefaultConnection('sqlite');

    Schema::connection('sqlite')->create('system_settings', function (Blueprint $table): void {
        $table->id();
        $table->string('config_key')->unique();
        $table->string('label');
        $table->text('value')->nullable();
        $table->string('type')->default('text');
        $table->string('group')->default('general');
        $table->timestamps();
    });
});

afterEach(function () {
    Cache::flush();
    DB::purge('sqlite');
    @unlink($this->sqliteDbPath);
});

it('loads database AI overrides in console runtime without corrupting scalar config values', function () {
    SystemSetting::set('ai_provider', 'openai');
    SystemSetting::set('rizquna_api_key', 'db-rizquna-key');
    SystemSetting::set('rizquna_url', 'https://db-router.example/v1');
    SystemSetting::set('ai_model', 'ag/db-general');
    SystemSetting::set('ai_primary_key', 'db-primary-key');
    SystemSetting::set('ai_primary_model', 'ag/db-primary');
    SystemSetting::set('ai_fallback_key', null);

    Cache::forget(AiConfigServiceProvider::RUNTIME_CONFIG_CACHE_KEY);
    (new AiConfigServiceProvider(app()))->boot();

    expect(config('ai.default'))->toBe('openai');
    expect(config('ai.default_for_images'))->toBe('openai');
    expect(config('ai.providers.rizquna.key'))->toBe('db-rizquna-key');
    expect(config('ai.providers.rizquna.key'))->not->toBeArray();
    expect(config('ai.providers.rizquna.url'))->toBe('https://db-router.example/v1');
    expect(config('ai.routing.assistant.model'))->toBe('ag/db-general');
    expect(config('ai.failover.primary.key'))->toBe('db-primary-key');
    expect(config('ai.failover.primary.key'))->not->toBeArray();
    expect(config('ai.failover.primary.model'))->toBe('ag/db-primary');
    expect(config('ai.failover.fallback.key'))->toBe('');
});

it('invalidates cached AI runtime config and tags AI settings with the ai_settings group', function () {
    Cache::put(AiConfigServiceProvider::RUNTIME_CONFIG_CACHE_KEY, ['ai.providers.rizquna.key' => 'stale'], 3600);

    SystemSetting::set('rizquna_api_key', 'fresh-key');

    expect(Cache::has(AiConfigServiceProvider::RUNTIME_CONFIG_CACHE_KEY))->toBeFalse();
    expect(SystemSetting::where('config_key', 'rizquna_api_key')->value('group'))->toBe('ai_settings');
});

it('resolves failover tiers from system settings and can force a task-specific model', function () {
    config([
        'ai.providers.rizquna.key' => null,
        'ai.failover.primary.key' => null,
        'ai.failover.fallback.key' => null,
        'ai.failover.tertiary.key' => null,
    ]);

    SystemSetting::set('rizquna_url', 'https://db-router.example/v1');
    SystemSetting::set('rizquna_api_key', 'db-default-key');
    SystemSetting::set('ai_primary_url', 'https://db-primary.example/v1');
    SystemSetting::set('ai_primary_key', 'db-primary-key');
    SystemSetting::set('ai_fallback_key', 'db-fallback-key');
    SystemSetting::set('ai_tertiary_key', null);

    $tiers = makeAiTierProbe()->tierMap('ag/db-digest', true);

    expect($tiers['primary'])->toMatchArray([
        'label' => 'primary-gateway',
        'url' => 'https://db-primary.example/v1',
        'key' => 'db-primary-key',
        'model' => 'ag/db-digest',
    ]);

    expect($tiers['fallback']['key'])->toBe('db-fallback-key');
    expect($tiers['fallback']['model'])->toBe('ag/db-digest');
    expect($tiers['tertiary']['key'])->toBe('');
});

it('tests AI connectivity against the first configured tier instead of returning a false green', function () {
    config([
        'ai.providers.rizquna.key' => null,
        'ai.failover.primary.key' => null,
        'ai.failover.fallback.key' => null,
        'ai.failover.tertiary.key' => null,
    ]);

    SystemSetting::set('ai_primary_url', 'https://router-test.example/v1');
    SystemSetting::set('ai_primary_key', 'test-key');
    SystemSetting::set('ai_model', 'ag/db-assistant');

    Http::fake([
        'https://router-test.example/v1/chat/completions' => Http::response([
            'choices' => [[
                'message' => [
                    'content' => 'pong',
                ],
            ]],
        ], 200),
    ]);

    $response = app(SystemSettingController::class)->testAiConnection();
    $payload = $response->getData(true);

    expect($response->getStatusCode())->toBe(200);
    expect($payload['data'])->toMatchArray([
        'connected' => true,
        'tier_used' => 'primary',
        'model_used' => 'ag/db-assistant',
    ]);

    Http::assertSent(fn ($request) => $request->url() === 'https://router-test.example/v1/chat/completions'
        && $request['model'] === 'ag/db-assistant');
});

it('returns 503 when no AI key is configured anywhere', function () {
    config([
        'ai.providers.rizquna.key' => null,
        'ai.failover.primary.key' => null,
        'ai.failover.fallback.key' => null,
        'ai.failover.tertiary.key' => null,
    ]);

    $response = app(SystemSettingController::class)->testAiConnection();
    $payload = $response->getData(true);

    expect($response->getStatusCode())->toBe(503);
    expect($payload['success'])->toBeFalse();
    expect($payload['error']['code'])->toBe('AI_UNAVAILABLE');
});
