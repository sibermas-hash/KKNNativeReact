<?php

declare(strict_types=1);

namespace App\Services\KKN;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class FacultyScopeService
{
    /**
     * Apply faculty scoping to a query builder if the authenticated user
     * is a Faculty Admin.
     */
    public static function apply(Builder $query, string $facultyIdColumn = 'fakultas_id'): Builder
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return $query;
        }

        if ($user->hasRole('faculty_admin') && $user->fakultas_id) {
            // Check if column is a relationship path (e.g. mahasiswa.fakultas_id or peserta.mahasiswa.fakultas_id)
            if (str_contains($facultyIdColumn, '.')) {
                $parts = explode('.', $facultyIdColumn);
                $column = array_pop($parts); // Last segment is the actual column
                $relationPath = implode('.', $parts); // Everything before is the relationship chain

                return $query->whereHas($relationPath, function ($q) use ($column, $user) {
                    $q->where($column, $user->fakultas_id);
                });
            }

            return $query->where($facultyIdColumn, $user->fakultas_id);
        }

        // Global admin or other roles see everything (default)
        return $query;
    }

    /**
     * Check if a specific resource belongs to the current user's faculty.
     */
    public static function isAuthorised(int $resourceFacultyId): bool
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (! $user) {
            return false;
        }

        // Global admin can access any faculty
        if ($user->hasRole('superadmin')) {
            return true;
        }

        if ($user->hasRole('faculty_admin')) {
            return $user->fakultas_id === $resourceFacultyId;
        }

        return false;
    }
}
