<?php

declare(strict_types=1);

namespace Tests\Feature\Http;

beforeEach(function () {
    // Skip database for basic route tests
});

describe('Health Endpoint Tests', function () {
    it('returns basic health status', function () {
        $response = $this->get('/health');

        $response->assertStatus(200);
        $response->assertJsonStructure([
            'status',
            'timestamp',
        ]);
    });

    it('returns detailed health check', function () {
        $response = $this->get('/health/detailed');

        $response->assertJsonStructure([
            'status',
            'timestamp',
            'version',
            'environment',
            'debug',
            'checks' => [
                'database',
                'cache',
                'queue',
                'storage',
                'api_external',
            ],
        ]);
    });
});
