<?php

namespace Tests;

use App\Http\Middleware\EnsureProfileCompleted;
use Database\Seeders\RoleSeeder;
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
        $this->withoutMiddleware(EnsureProfileCompleted::class);
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
        return RoleSeeder::class;
    }
}
