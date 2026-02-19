<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\DB;

abstract class TestCase extends BaseTestCase
{
    /**
     * Share the default SQLite PDO with the 'kkn' connection so that
     * models using $connection = 'kkn' see the same in-memory database.
     */
    protected function beforeRefreshingDatabase()
    {
        $this->shareKknConnection();
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->shareKknConnection();
    }

    private function shareKknConnection(): void
    {
        if (config('database.connections.kkn.driver') === 'sqlite') {
            $defaultPdo = DB::connection()->getPdo();
            DB::connection('kkn')->setPdo($defaultPdo);
            DB::connection('kkn')->setReadPdo($defaultPdo);
        }
    }
}
