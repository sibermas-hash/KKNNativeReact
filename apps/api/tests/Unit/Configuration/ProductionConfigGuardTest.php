<?php

use Illuminate\Container\Container;

describe('production configuration guards', function () {
    beforeEach(function () {
        $this->originalEnv = [
            'APP_URL' => getenv('APP_URL'),
            'APP_FRONTEND_URL' => getenv('APP_FRONTEND_URL'),
            'FRONTEND_URL' => getenv('FRONTEND_URL'),
            'SCRIBE_BASE_URL' => getenv('SCRIBE_BASE_URL'),
        ];
        $this->originalContainer = Container::getInstance();
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

        Container::setInstance($this->originalContainer);
    });

    it('keeps DB_PASSWORD blank in the production env template', function () {
        $contents = file_get_contents(dirname(__DIR__, 3).'/.env.production.example');

        expect($contents)->not->toBeFalse();

        preg_match('/^DB_PASSWORD=(.*)$/m', (string) $contents, $matches);
        $valueWithoutComment = trim(explode('#', $matches[1] ?? '', 2)[0]);

        expect($valueWithoutComment)->toBe('');
    });

    it('uses the public site origin for Scribe base URLs on path-based production deploys', function () {
        putenv('APP_URL=https://sibermas.uinsaizu.ac.id/api');
        putenv('APP_FRONTEND_URL=https://sibermas.uinsaizu.ac.id');
        putenv('FRONTEND_URL');
        putenv('SCRIBE_BASE_URL');

        $_ENV['APP_URL'] = 'https://sibermas.uinsaizu.ac.id/api';
        $_SERVER['APP_URL'] = 'https://sibermas.uinsaizu.ac.id/api';
        $_ENV['APP_FRONTEND_URL'] = 'https://sibermas.uinsaizu.ac.id';
        $_SERVER['APP_FRONTEND_URL'] = 'https://sibermas.uinsaizu.ac.id';
        unset($_ENV['FRONTEND_URL'], $_SERVER['FRONTEND_URL'], $_ENV['SCRIBE_BASE_URL'], $_SERVER['SCRIBE_BASE_URL']);

        $basePath = dirname(__DIR__, 3);
        $container = new class($basePath) extends Container
        {
            public function __construct(private readonly string $basePath) {}

            public function resourcePath($path = ''): string
            {
                return $this->basePath.'/resources'.($path !== '' ? DIRECTORY_SEPARATOR.ltrim($path, DIRECTORY_SEPARATOR) : '');
            }

            public function publicPath($path = ''): string
            {
                return $this->basePath.'/public'.($path !== '' ? DIRECTORY_SEPARATOR.ltrim($path, DIRECTORY_SEPARATOR) : '');
            }
        };

        Container::setInstance($container);

        $config = require $basePath.'/config/scribe.php';

        expect($config['try_it_out']['base_url'])->toBe('https://sibermas.uinsaizu.ac.id');
        expect($config['postman']['collection_base_url'])->toBe('https://sibermas.uinsaizu.ac.id');
        expect($config['custom']['static']['baseUrl'])->toBe('https://sibermas.uinsaizu.ac.id');
    });
});
