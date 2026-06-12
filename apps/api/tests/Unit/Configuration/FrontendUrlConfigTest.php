<?php

describe('frontend URL configuration', function () {
    beforeEach(function () {
        $this->originalEnv = [
            'APP_ENV' => getenv('APP_ENV'),
            'APP_URL' => getenv('APP_URL'),
            'APP_FRONTEND_URL' => getenv('APP_FRONTEND_URL'),
            'FRONTEND_URL' => getenv('FRONTEND_URL'),
            'CORS_ALLOWED_ORIGINS' => getenv('CORS_ALLOWED_ORIGINS'),
        ];
    });

    afterEach(function () {
        foreach ($this->originalEnv as $key => $value) {
            if ($value === false) {
                putenv($key);
                unset($_ENV[$key], $_SERVER[$key]);

                continue;
            }

            putenv($key.'='.$value);
            $_ENV[$key] = $value;
            $_SERVER[$key] = $value;
        }
    });

    it('strips the API path from APP_URL when APP_FRONTEND_URL is not set', function () {
        putenv('APP_FRONTEND_URL');
        putenv('FRONTEND_URL');
        putenv('APP_URL=https://sibermas.uinsaizu.ac.id/api');
        $_ENV['APP_URL'] = 'https://sibermas.uinsaizu.ac.id/api';
        $_SERVER['APP_URL'] = 'https://sibermas.uinsaizu.ac.id/api';
        unset($_ENV['APP_FRONTEND_URL'], $_SERVER['APP_FRONTEND_URL'], $_ENV['FRONTEND_URL'], $_SERVER['FRONTEND_URL']);

        $config = require dirname(__DIR__, 3).'/config/app.php';

        expect($config['frontend_url'])->toBe('https://sibermas.uinsaizu.ac.id');
    });

    it('does not default CORS origins to localhost in production', function () {
        putenv('APP_ENV=production');
        putenv('APP_FRONTEND_URL=https://sibermas.uinsaizu.ac.id');
        putenv('APP_URL=https://sibermas.uinsaizu.ac.id/api');
        putenv('CORS_ALLOWED_ORIGINS');
        $_ENV['APP_ENV'] = 'production';
        $_ENV['APP_FRONTEND_URL'] = 'https://sibermas.uinsaizu.ac.id';
        $_ENV['APP_URL'] = 'https://sibermas.uinsaizu.ac.id/api';
        $_SERVER['APP_ENV'] = 'production';
        $_SERVER['APP_FRONTEND_URL'] = 'https://sibermas.uinsaizu.ac.id';
        $_SERVER['APP_URL'] = 'https://sibermas.uinsaizu.ac.id/api';
        unset($_ENV['CORS_ALLOWED_ORIGINS'], $_SERVER['CORS_ALLOWED_ORIGINS']);

        $config = require dirname(__DIR__, 3).'/config/cors.php';

        expect($config['allowed_origins'])->toBe(['https://sibermas.uinsaizu.ac.id']);
    });
});
