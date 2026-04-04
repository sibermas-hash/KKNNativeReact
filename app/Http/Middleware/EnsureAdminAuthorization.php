<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure all admin controllers have authorization.
 * This middleware adds defense-in-depth beyond route-level role middleware.
 */
class EnsureAdminAuthorization
{
    /**
     * List of controllers that require 'manage-master-data' permission
     */
    protected array $masterDataControllers = [
        \App\Http\Controllers\Admin\TahunAkademikController::class,
        \App\Http\Controllers\Admin\PeriodeController::class,
        \App\Http\Controllers\Admin\FakultasController::class,
        \App\Http\Controllers\Admin\ProdiController::class,
        \App\Http\Controllers\Admin\LokasiController::class,
    ];

    /**
     * List of controllers that require 'manage-users' permission
     */
    protected array $userManagementControllers = [
        \App\Http\Controllers\Admin\UserController::class,
        \App\Http\Controllers\Admin\StudentSyncController::class,
        \App\Http\Controllers\Admin\DplSyncController::class,
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();
        
        if (!$route) {
            return $next($request);
        }

        $controller = $route->getController();
        $controllerClass = get_class($controller);

        // Check if controller requires master data authorization
        if (in_array($controllerClass, $this->masterDataControllers)) {
            Gate::authorize('manage-master-data');
        }

        // Check if controller requires user management authorization
        if (in_array($controllerClass, $this->userManagementControllers)) {
            Gate::authorize('manage-users');
        }

        // For other admin controllers, ensure user has at least one admin role
        if (str_starts_with($controllerClass, 'App\\Http\\Controllers\\Admin\\')) {
            $user = $request->user();
            if (!$user || !$user->hasAnyRole(['superadmin', 'faculty_admin', 'dpl'])) {
                abort(403, 'Unauthorized access to admin area.');
            }
        }

        return $next($request);
    }
}
