<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Tests\Concerns\RefreshPostgresDatabase;

abstract class TestCase extends BaseTestCase
{
    use RefreshPostgresDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
    }
}
