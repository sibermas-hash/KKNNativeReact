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
     * List of controllers that require 'manage-grades' permission
     */
    protected array $gradeManagementControllers = [
        \App\Http\Controllers\Admin\GradeController::class,
        \App\Http\Controllers\Admin\GeneratorNilaiController::class,
        \App\Http\Controllers\Admin\KonfigurasiPenilaianController::class,
    ];

    /**
     * List of controllers that require 'manage-participants' permission
     */
    protected array $participantControllers = [
        \App\Http\Controllers\Admin\PesertaKknController::class,
        \App\Http\Controllers\Admin\StudentTransferController::class,
    ];

    /**
     * List of controllers that require 'manage-groups' permission
     */
    protected array $groupControllers = [
        \App\Http\Controllers\Admin\KelompokKknController::class,
    ];

    /**
     * List of controllers that require 'manage-dpl' permission
     */
    protected array $dplControllers = [
        \App\Http\Controllers\Admin\DplAssignmentController::class,
    ];

    /**
     * List of controllers that require 'manage-content' permission
     */
    protected array $contentControllers = [
        \App\Http\Controllers\Admin\AnnouncementController::class,
        \App\Http\Controllers\Admin\DownloadController::class,
        \App\Http\Controllers\Admin\PublicContentController::class,
    ];

    /**
     * List of controllers that require 'view-audit-logs' permission
     */
    protected array $auditControllers = [
        \App\Http\Controllers\Admin\LogAuditController::class,
    ];

    /**
     * Permission map for specific controllers
     */
    protected function getRequiredPermissionForController(string $controllerClass): ?string
    {
        if (in_array($controllerClass, $this->masterDataControllers)) {
            return 'manage-master-data';
        }

        if (in_array($controllerClass, $this->userManagementControllers)) {
            return 'manage-users';
        }

        if (in_array($controllerClass, $this->gradeManagementControllers)) {
            return 'manage-grades';
        }

        if (in_array($controllerClass, $this->participantControllers)) {
            return 'manage-participants';
        }

        if (in_array($controllerClass, $this->groupControllers)) {
            return 'manage-groups';
        }

        if (in_array($controllerClass, $this->dplControllers)) {
            return 'manage-dpl';
        }

        if (in_array($controllerClass, $this->contentControllers)) {
            return 'manage-content';
        }

        if (in_array($controllerClass, $this->auditControllers)) {
            return 'view-audit-logs';
        }

        return null;
    }

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

        // Only apply to admin controllers
        if (!str_starts_with($controllerClass, 'App\\Http\\Controllers\\Admin\\')) {
            return $next($request);
        }

        $user = $request->user();

        // Ensure user is authenticated
        if (!$user) {
            abort(401, 'Authentication required.');
        }

        // Check if user has any admin role
        if (!$user->hasAnyRole(['superadmin', 'faculty_admin', 'admin'])) {
            abort(403, 'Unauthorized access to admin area.');
        }

        // Check for specific permission if required
        $requiredPermission = $this->getRequiredPermissionForController($controllerClass);

        if ($requiredPermission) {
            // Superadmin bypasses all permission checks
            if (!$user->hasRole('superadmin')) {
                Gate::authorize($requiredPermission);
            }
        }

        return $next($request);
    }
}
