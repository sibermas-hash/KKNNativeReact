<?php

namespace App\Traits;

use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

trait HandlesPagination
{
    /**
     * Format a paginator for standard Inertia/React consumption
     */
    protected function formatPaginator(LengthAwarePaginator $paginator): array
    {
        $payload = $paginator->toArray();

        return [
            'data' => $payload['data'],
            'meta' => Arr::only($payload, [
                'current_page',
                'last_page',
                'per_page',
                'total',
                'from',
                'to',
                'links',
            ]),
        ];
    }
}
