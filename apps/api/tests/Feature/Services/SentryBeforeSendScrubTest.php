<?php

declare(strict_types=1);

use App\Sentry\BeforeSendScrub;

/**
 * Regression: config/sentry.php `before_send` harus tetap melakukan scrubbing
 * dan dropping health-check noise SETELAH dipindah dari closure ke class
 * invokable (supaya `php artisan config:cache` tidak gagal serialize).
 *
 * Test pakai fake event object untuk menghindari hard dependency pada package
 * sentry/sentry (belum terpasang di project). Scrub class di-duck-type.
 */

/**
 * Fake Sentry event. Cukup implement getRequest()/setRequest() supaya
 * BeforeSendScrub bisa bekerja di atas instance ini (duck typing).
 */
function makeFakeEvent(array $request): object
{
    return new class($request)
    {
        public function __construct(private array $request) {}

        public function getRequest(): array
        {
            return $this->request;
        }

        public function setRequest(array $request): void
        {
            $this->request = $request;
        }
    };
}

it('drops health check requests (returns null)', function () {
    $event = makeFakeEvent(['url' => 'https://api.example.com/api/health']);
    expect((new BeforeSendScrub)($event))->toBeNull();
});

it('drops readiness probe requests', function () {
    $event = makeFakeEvent(['url' => 'https://api.example.com/api/ready']);
    expect((new BeforeSendScrub)($event))->toBeNull();
});

it('drops /up built-in Laravel health', function () {
    $event = makeFakeEvent(['url' => 'https://api.example.com/up']);
    expect((new BeforeSendScrub)($event))->toBeNull();
});

it('scrubs password, token, cookie, and authorization header from request', function () {
    $event = makeFakeEvent([
        'url' => 'https://api.example.com/api/v1/auth/login',
        'data' => [
            'username' => 'student1',
            'password' => 'verysecret',
            'captcha_answer' => '42',
        ],
        'headers' => [
            'Authorization' => 'Bearer leaked-token',
            'Cookie' => 'sibermas_token=leaked',
            'X-Forwarded-For' => '1.2.3.4', // non-sensitive, should pass through
        ],
        'cookies' => [
            'sibermas_token' => 'should-not-leak',
        ],
        'query_string' => [
            'api_key' => 'leaked',
            'page' => '1',
        ],
    ]);

    $result = (new BeforeSendScrub)($event);
    expect($result)->not->toBeNull();

    $request = $result->getRequest();

    // Scrubbed
    expect($request['data']['password'])->toBe('[Filtered]');
    expect($request['data']['captcha_answer'])->toBe('[Filtered]');
    expect($request['headers']['Authorization'])->toBe('[Filtered]');
    expect($request['headers']['Cookie'])->toBe('[Filtered]');
    expect($request['cookies']['sibermas_token'])->toBe('[Filtered]');
    expect($request['query_string']['api_key'])->toBe('[Filtered]');

    // Non-sensitive pass-through
    expect($request['data']['username'])->toBe('student1');
    expect($request['headers']['X-Forwarded-For'])->toBe('1.2.3.4');
    expect($request['query_string']['page'])->toBe('1');
});

it('scrubs nested arrays recursively', function () {
    $event = makeFakeEvent([
        'url' => 'https://api.example.com/api/v1/submit',
        'data' => [
            'user' => [
                'name' => 'Test',
                'nim' => '1234567890',  // nested PII
            ],
            'payload' => [
                'nested' => [
                    'token' => 'deep-leak', // double-nested PII
                ],
            ],
        ],
    ]);

    $result = (new BeforeSendScrub)($event);
    $request = $result->getRequest();

    expect($request['data']['user']['name'])->toBe('Test');
    expect($request['data']['user']['nim'])->toBe('[Filtered]');
    expect($request['data']['payload']['nested']['token'])->toBe('[Filtered]');
});

it('is resilient to events without request data', function () {
    // Event yang tidak punya getRequest harus pass-through tanpa error.
    $eventWithoutRequest = new class
    {
        // sengaja no getRequest / setRequest
    };

    $result = (new BeforeSendScrub)($eventWithoutRequest);
    expect($result)->toBe($eventWithoutRequest);
});

it('config sentry.before_send references the class name string (cacheable)', function () {
    $config = require __DIR__.'/../../../config/sentry.php';
    expect($config['before_send'])->toBe(BeforeSendScrub::class);
    expect(is_string($config['before_send']))->toBeTrue();
});

it('artisan config cache berhasil (regression: closure sudah hilang)', function () {
    // Hapus dulu cache kalau ada
    \Illuminate\Support\Facades\Artisan::call('config:clear');
    $exitCode = \Illuminate\Support\Facades\Artisan::call('config:cache');
    expect($exitCode)->toBe(0);

    // Clean up supaya test lain tidak bawa-bawa cached config
    \Illuminate\Support\Facades\Artisan::call('config:clear');
});
