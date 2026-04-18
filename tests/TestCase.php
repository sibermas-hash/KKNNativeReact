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
        
        if (method_exists($this, 'shareTestingConnections')) {
            $this->shareTestingConnections();
        }

        $this->withoutVite();
    }

    /**
     * Indicate that the default seeder should run before each test.
     */
    protected bool $seed = true;

    /**
     * Run specific seeders before each test.
     *
     * @return class-string
     */
    protected function seeder()
    {
        return \Database\Seeders\RoleSeeder::class;
    }
}
