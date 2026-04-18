<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Controllers\Admin\ActivityAuditController;
use App\Http\Controllers\Admin\AnnouncementController;
use App\Http\Controllers\Admin\CertificateConfigController;
use App\Http\Controllers\Admin\DatabaseSyncController;
use App\Http\Controllers\Admin\DownloadController;
use App\Http\Controllers\Admin\DplAssignmentController;
use App\Http\Controllers\Admin\DplSyncController;
use App\Http\Controllers\Admin\EligibilityController;
use App\Http\Controllers\Admin\EvaluasiController;
use App\Http\Controllers\Admin\FakultasController;
use App\Http\Controllers\Admin\GeneratorNilaiController;
use App\Http\Controllers\Admin\GradeController;
use App\Http\Controllers\Admin\KegiatanKknController;
use App\Http\Controllers\Admin\KelompokKknController;
use App\Http\Controllers\Admin\KknRequirementController;
use App\Http\Controllers\Admin\KonfigurasiPenilaianController;
use App\Http\Controllers\Admin\LaporanAkhirController;
use App\Http\Controllers\Admin\LogAuditController;
use App\Http\Controllers\Admin\LokasiController;
use App\Http\Controllers\Admin\PeriodeController;
use App\Http\Controllers\Admin\PesertaKknController;
use App\Http\Controllers\Admin\ProdiController;
use App\Http\Controllers\Admin\ProgramKerjaController;
use App\Http\Controllers\Admin\PublicContentController;
use App\Http\Controllers\Admin\RekapitulasiController;
use App\Http\Controllers\Admin\RekapNilaiController;
use App\Http\Controllers\Admin\StudentSyncController;
use App\Http\Controllers\Admin\StudentTransferController;
use App\Http\Controllers\Admin\SystemSettingController;
use App\Http\Controllers\Admin\TahunAkademikController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\YudisiumController;
use App\Http\Controllers\WorkshopController;
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
        TahunAkademikController::class,
        PeriodeController::class,
        FakultasController::class,
        ProdiController::class,
        LokasiController::class,
    ];

    /**
     * List of controllers that require 'manage-users' permission
     */
    protected array $userManagementControllers = [
        UserController::class,
        StudentSyncController::class,
        DplSyncController::class,
    ];

    /**
     * List of controllers that require 'manage-grades' permission
     */
    protected array $gradeManagementControllers = [
        GradeController::class,
        GeneratorNilaiController::class,
        KonfigurasiPenilaianController::class,
    ];

    /**
     * List of controllers that require 'manage-participants' permission
     */
    protected array $participantControllers = [
        PesertaKknController::class,
        StudentTransferController::class,
    ];

    /**
     * List of controllers that require 'manage-groups' permission
     */
    protected array $groupControllers = [
        KelompokKknController::class,
    ];

    /**
     * List of controllers that require 'manage-dpl' permission
     */
    protected array $dplControllers = [
        DplAssignmentController::class,
    ];

    /**
     * List of controllers that require 'manage-content' permission
     */
    protected array $contentControllers = [
        AnnouncementController::class,
        DownloadController::class,
        PublicContentController::class,
    ];

    /**
     * List of controllers that require 'view-audit-logs' permission
     */
    protected array $auditControllers = [
        LogAuditController::class,
        ActivityAuditController::class,
    ];

    /**
     * List of controllers that require 'manage-reports' permission
     */
    protected array $reportControllers = [
        RekapNilaiController::class,
        RekapitulasiController::class,
    ];

    /**
     * List of controllers that require 'manage-settings' permission
     */
    protected array $settingControllers = [
        CertificateConfigController::class,
        SystemSettingController::class,
        KonfigurasiPenilaianController::class,
    ];

    /**
     * List of controllers that require 'manage-database-sync' permission
     */
    protected array $databaseSyncControllers = [
        DatabaseSyncController::class,
    ];

    /**
     * List of controllers that require 'manage-workshops' permission
     */
    protected array $workshopControllers = [
        WorkshopController::class,
    ];

    /**
     * List of controllers that require 'manage-kkn-operations' permission
     */
    protected array $kknOperationsControllers = [
        EvaluasiController::class,
        KegiatanKknController::class,
        ProgramKerjaController::class,
        LaporanAkhirController::class,
        YudisiumController::class,
    ];

    /**
     * List of controllers that require 'manage-eligibility' permission
     */
    protected array $eligibilityControllers = [
        EligibilityController::class,
    ];

    /**
     * List of controllers that require 'manage-requirements' permission
     */
    protected array $requirementControllers = [
        KknRequirementController::class,
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

        if (in_array($controllerClass, $this->reportControllers)) {
            return 'manage-reports';
        }

        if (in_array($controllerClass, $this->settingControllers)) {
            return 'manage-settings';
        }

        if (in_array($controllerClass, $this->databaseSyncControllers)) {
            return 'manage-database-sync';
        }

        if (in_array($controllerClass, $this->workshopControllers)) {
            return 'manage-workshops';
        }

        if (in_array($controllerClass, $this->kknOperationsControllers)) {
            return 'manage-kkn-operations';
        }

        if (in_array($controllerClass, $this->eligibilityControllers)) {
            return 'manage-eligibility';
        }

        if (in_array($controllerClass, $this->requirementControllers)) {
            return 'manage-requirements';
        }

        return null;
    }

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $route = $request->route();

        if (! $route) {
            return $next($request);
        }

        $controller = $route->getController();
        if (! $controller) {
            return $next($request);
        }
        $controllerClass = get_class($controller);

        // Only apply to admin controllers
        if (! str_starts_with($controllerClass, 'App\\Http\\Controllers\\Admin\\')) {
            return $next($request);
        }

        $user = $request->user();

        // Ensure user is authenticated
        if (! $user) {
            if ($request->expectsJson()) {
                abort(401, 'Unauthenticated.');
            }
            return redirect()->guest(route('login'));
        }

        // Check if user has any admin role
        if (! $user->hasAnyRole(['superadmin', 'faculty_admin', 'admin'])) {
            abort(403, 'Unauthorized access to admin area.');
        }

        // Check for specific permission if required
        $requiredPermission = $this->getRequiredPermissionForController($controllerClass);

        if ($requiredPermission) {
            // Superadmin bypasses all permission checks
            if (! $user->hasRole('superadmin')) {
                Gate::authorize($requiredPermission);
            }
        }

        return $next($request);
    }
}
