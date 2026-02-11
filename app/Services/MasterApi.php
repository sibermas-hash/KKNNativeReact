<?php

namespace App\Services;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class MasterApi
{
    protected function client(): PendingRequest
    {
        return Http::baseUrl(config('masterapi.base'))
            ->withToken(config('masterapi.token'))
            ->timeout(config('masterapi.timeout', 10))
            ->retry(2, 200);
    }

    public function getDpls(): array
    {
        if (! $this->isReady()) {
            return [];
        }

        return $this->client()->get('/dpls')->json('data', []);
    }

    public function getGroups(): array
    {
        if (! $this->isReady()) {
            return [];
        }

        return $this->client()->get('/groups')->json('data', []);
    }

    public function getStudents(): array
    {
        if (! $this->isReady()) {
            return [];
        }

        return $this->client()->get('/students')->json('data', []);
    }

    public function getGrades(): array
    {
        if (! $this->isReady()) {
            return [];
        }

        return $this->client()->get('/grades')->json('data', []);
    }

    protected function isReady(): bool
    {
        return filled(config('masterapi.base')) && filled(config('masterapi.token'));
    }
}
