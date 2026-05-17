<?php

declare(strict_types=1);

use App\Services\AvatarValidationService;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

uses(TestCase::class);

function seedAvatarFixture(string $relativePath): string
{
    $absolutePath = storage_path('app/public/'.$relativePath);
    $directory = dirname($absolutePath);

    if (! is_dir($directory)) {
        mkdir($directory, 0777, true);
    }

    file_put_contents(
        $absolutePath,
        base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAukB9p+6jW8AAAAASUVORK5CYII=')
    );

    return $absolutePath;
}

afterEach(function () {
    @unlink(storage_path('app/public/tests/avatar-validation.png'));
});

it('uses tertiary rizquna tier when earlier tiers fail', function () {
    config([
        'ai.failover.primary.url' => 'https://gateway-primary.example/v1',
        'ai.failover.primary.key' => 'primary-key',
        'ai.failover.primary.model' => 'gateway-primary-model',
        'ai.failover.fallback.url' => 'https://gateway-fallback.example/v1',
        'ai.failover.fallback.key' => 'fallback-key',
        'ai.failover.fallback.model' => 'gateway-fallback-model',
        'ai.failover.tertiary.url' => 'https://gateway-tertiary.example/v1',
        'ai.failover.tertiary.key' => 'tertiary-key',
        'ai.failover.tertiary.model' => 'gateway-tertiary-model',
    ]);

    seedAvatarFixture('tests/avatar-validation.png');

    Http::fake([
        'https://gateway-primary.example/v1/chat/completions' => Http::response(['error' => 'rate limited'], 429),
        'https://gateway-fallback.example/v1/chat/completions' => Http::response(['error' => 'forbidden'], 403),
        'https://gateway-tertiary.example/v1/chat/completions' => Http::response([
            'choices' => [[
                'message' => [
                    'content' => json_encode([
                        'is_valid' => true,
                        'reason' => null,
                    ], JSON_THROW_ON_ERROR),
                ],
            ]],
        ], 200),
        '*' => Http::response(['error' => 'unexpected request'], 599),
    ]);

    $result = app(AvatarValidationService::class)->validateAvatar('tests/avatar-validation.png');

    expect($result)->toBe([
        'is_valid' => true,
        'reason' => null,
        'requires_manual_review' => false,
    ]);

    Http::assertSentCount(3);
    Http::assertSent(fn ($request) => $request->url() === 'https://gateway-tertiary.example/v1/chat/completions'
        && $request['model'] === 'gateway-tertiary-model');
});
