<?php

use App\Services\TelegramAlertService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

describe('Telegram Alert Service', function () {

    beforeEach(function () {
        // Reset any cached dedup state
        Cache::flush();
    });

    it('is a no-op when not configured', function () {
        config(['services.telegram.bot_token' => '', 'services.telegram.chat_id' => '']);

        $service = new TelegramAlertService;

        expect($service->isConfigured())->toBeFalse();
        expect($service->send('test'))->toBeFalse();
    });

    it('sends message when configured', function () {
        config(['services.telegram.bot_token' => 'fake-token-123', 'services.telegram.chat_id' => '-100123']);

        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => true, 'result' => ['message_id' => 1]], 200),
        ]);

        $service = new TelegramAlertService;

        expect($service->isConfigured())->toBeTrue();
        expect($service->send('hello world'))->toBeTrue();

        Http::assertSent(function ($request) {
            return str_contains($request->url(), 'api.telegram.org/botfake-token-123/sendMessage')
                && $request['chat_id'] === '-100123'
                && str_contains($request['text'], 'hello world');
        });
    });

    it('returns false on upstream failure and does not throw', function () {
        config(['services.telegram.bot_token' => 'fake-token', 'services.telegram.chat_id' => '-100']);

        Http::fake([
            'api.telegram.org/*' => Http::response(['ok' => false, 'description' => 'bot blocked'], 403),
        ]);

        $service = new TelegramAlertService;

        expect($service->send('hi'))->toBeFalse();
    });

    it('renders health issue alert with structured context', function () {
        config(['services.telegram.bot_token' => 'fake-token', 'services.telegram.chat_id' => '-100']);

        $captured = null;
        Http::fake([
            'api.telegram.org/*' => function ($request) use (&$captured) {
                $captured = $request['text'];

                return Http::response(['ok' => true], 200);
            },
        ]);

        $service = new TelegramAlertService;
        $ok = $service->alertHealthIssue('DB latency too high', [
            'latency_ms' => 2500,
            'db' => 'kknprod',
        ]);

        expect($ok)->toBeTrue();
        expect($captured)->toContain('DB latency too high');
        expect($captured)->toContain('latency_ms');
        expect($captured)->toContain('2500');
    });
});
