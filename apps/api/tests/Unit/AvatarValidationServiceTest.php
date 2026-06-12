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

    $image = imagecreatetruecolor(400, 600);
    for ($y = 0; $y < 600; $y++) {
        for ($x = 0; $x < 400; $x++) {
            $shade = 140 + (($x + $y) % 80);
            imagesetpixel($image, $x, $y, imagecolorallocate($image, $shade, 0, 0));
        }
    }
    imagejpeg($image, $absolutePath, 100);
    imagedestroy($image);

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
        'reason' => 'Foto memenuhi ketentuan berdasarkan verifikasi AI.',
        'requires_manual_review' => false,
    ]);

    Http::assertSent(fn ($request) => $request->url() === 'https://gateway-tertiary.example/v1/chat/completions'
        && $request['model'] === 'gateway-tertiary-model');
});
