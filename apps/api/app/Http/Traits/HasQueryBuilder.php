<?php

declare(strict_types=1);

namespace App\Http\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * Trait to easily integrate Spatie QueryBuilder into any controller.
 *
 * Usage in controller:
 *   use HasQueryBuilder;
 *
 *   public function index(Request $request) {
 *       $query = $this->buildQuery(
 *           model: PesertaKkn::class,
 *           request: $request,
 *           allowedFilters: ['status', 'periode_id', AllowedFilter::partial('search', 'mahasiswa.nama')],
 *           allowedSorts: ['created_at', 'status'],
 *           allowedIncludes: ['mahasiswa', 'kelompok', 'periode'],
 *           defaultSort: '-created_at',
 *       );
 *       return $this->successCollection(Resource::collection($query->paginate()));
 *   }
 */
trait HasQueryBuilder
{
    /**
     * Build a Spatie QueryBuilder instance with common defaults.
     *
     * @param  class-string|Builder  $model  Eloquent model class or existing query builder
     * @param  array  $allowedFilters  Filters allowed from ?filter[key]=value
     * @param  array  $allowedSorts  Sorts allowed from ?sort=key or ?sort=-key
     * @param  array  $allowedIncludes  Relations allowed from ?include=relation
     * @param  array  $allowedFields  Fields allowed from ?fields[resource]=field1,field2
     * @param  string  $defaultSort  Default sort if none specified
     * @param  int  $defaultPerPage  Default items per page
     * @param  int  $maxPerPage  Maximum items per page
     */
    protected function buildQuery(
        string|Builder $model,
        Request $request,
        array $allowedFilters = [],
        array $allowedSorts = [],
        array $allowedIncludes = [],
        array $allowedFields = [],
        string $defaultSort = '-created_at',
        int $defaultPerPage = 25,
        int $maxPerPage = 100,
    ): QueryBuilder {
        $builder = $model instanceof Builder
            ? QueryBuilder::for($model, $request)
            : QueryBuilder::for($model, $request);

        if (! empty($allowedFilters)) {
            $builder->allowedFilters(...$allowedFilters);
        }

        if (! empty($allowedSorts)) {
            $builder->allowedSorts(...$allowedSorts);
        } else {
            $builder->allowedSorts('created_at', 'updated_at');
        }

        if (! empty($allowedIncludes)) {
            $builder->allowedIncludes(...$allowedIncludes);
        }

        if (! empty($allowedFields)) {
            $builder->allowedFields(...$allowedFields);
        }

        $builder->defaultSort($defaultSort);

        return $builder;
    }

    /**
     * Get validated per_page value from request.
     */
    protected function getPerPage(Request $request, int $default = 25, int $max = 100): int
    {
        return min((int) $request->input('per_page', $default), $max);
    }
}
