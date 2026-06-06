<?php

declare(strict_types=1);

namespace App\Http\Middleware;

use App\Http\Controllers\Api\V1\Admin\ActivityAuditController;
use App\Http\Controllers\Api\V1\Admin\AiHealthController;
use App\Http\Controllers\Api\V1\Admin\AutoPlottingController;
use App\Http\Controllers\Api\V1\Admin\CountdownSettingController;
use App\Http\Controllers\Api\V1\Admin\InterviewController;
use App\Http\Controllers\Api\V1\Admin\LegacyKknTrackingController;
use App\Http\Controllers\Api\V1\Admin\PesertaKknListController;
use App\Http\Controllers\Api\V1\Admin\TransferPesertaController;

use App\Http\Controllers\Api\V1\Admin\AnnouncementController;
use App\Http\Controllers\Api\V1\Admin\AvatarModerationController;
use App\Http\Controllers\Api\V1\Admin\BulkCertificateDownloadController;
use App\Http\Controllers\Api\V1\Admin\CertificateConfigController;
use App\Http\Controllers\Api\V1\Admin\CollaborationLetterController;
use App\Http\Controllers\Api\V1\Admin\ComprehensiveReportController;
use App\Http\Controllers\Api\V1\Admin\DashboardController;
use App\Http\Controllers\Api\V1\Admin\DatabaseSyncController;
use App\Http\Controllers\Api\V1\Admin\DataImportController;
use App\Http\Controllers\Api\V1\Admin\DispensasiController;
use App\Http\Controllers\Api\V1\Admin\DocumentTemplateController;
use App\Http\Controllers\Api\V1\Admin\DownloadController;
use App\Http\Controllers\Api\V1\Admin\DplAssignmentController;
use App\Http\Controllers\Api\V1\Admin\DplCalibrationController;
use App\Http\Controllers\Api\V1\Admin\DplParticipantEvaluationController;
use App\Http\Controllers\Api\V1\Admin\DplRegistrationController;
use App\Http\Controllers\Api\V1\Admin\DplSyncController;
use App\Http\Controllers\Api\V1\Admin\EligibilityController;
use App\Http\Controllers\Api\V1\Admin\EvaluasiController;
use App\Http\Controllers\Api\V1\Admin\ExternalParticipantController;
use App\Http\Controllers\Api\V1\Admin\ExternalUniversityController;
use App\Http\Controllers\Api\V1\Admin\FakultasController;
use App\Http\Controllers\Api\V1\Admin\GeneratorNilaiController;
use App\Http\Controllers\Api\V1\Admin\GradeController;
use App\Http\Controllers\Api\V1\Admin\JenisKknController;
use App\Http\Controllers\Api\V1\Admin\JenisKknDocumentRequirementController;
use App\Http\Controllers\Api\V1\Admin\KegiatanKknAdminController;
use App\Http\Controllers\Api\V1\Admin\KelompokKknAdminController;
use App\Http\Controllers\Api\V1\Admin\KknRequirementController;
use App\Http\Controllers\Api\V1\Admin\KonfigurasiPenilaianController;
use App\Http\Controllers\Api\V1\Admin\LaporanAkhirAdminController;
use App\Http\Controllers\Api\V1\Admin\LogAuditController;
use App\Http\Controllers\Api\V1\Admin\LogbookPdfController;
use App\Http\Controllers\Api\V1\Admin\LokasiController;
use App\Http\Controllers\Api\V1\Admin\MonitoringController;
use App\Http\Controllers\Api\V1\Admin\NotificationBroadcastController;
use App\Http\Controllers\Api\V1\Admin\PeriodeController;
use App\Http\Controllers\Api\V1\Admin\PeriodeDocumentTemplateController;
use App\Http\Controllers\Api\V1\Admin\PesertaKknController;
use App\Http\Controllers\Api\V1\Admin\PlaygroundController;
use App\Http\Controllers\Api\V1\Admin\ProdiController;
use App\Http\Controllers\Api\V1\Admin\ProfileChangeRequestController;
use App\Http\Controllers\Api\V1\Admin\ProfileLockController;
use App\Http\Controllers\Api\V1\Admin\ProgramKerjaController;
use App\Http\Controllers\Api\V1\Admin\PublicContentController;
use App\Http\Controllers\Api\V1\Admin\RekapitulasiController;
use App\Http\Controllers\Api\V1\Admin\RekapNilaiController;
use App\Http\Controllers\Api\V1\Admin\ReportExportController;
use App\Http\Controllers\Api\V1\Admin\SiakadSyncAdminController;
use App\Http\Controllers\Api\V1\Admin\StudentSyncController;
use App\Http\Controllers\Api\V1\Admin\StudentTransferController;
use App\Http\Controllers\Api\V1\Admin\SystemSettingController;
use App\Http\Controllers\Api\V1\Admin\TahunAkademikController;
use App\Http\Controllers\Api\V1\Admin\UserActivityController;
use App\Http\Controllers\Api\V1\Admin\UserController;
use App\Http\Controllers\Api\V1\Admin\WaGatewayAdminController;
use App\Http\Controllers\Api\V1\Admin\WorkshopController;
use App\Http\Controllers\Api\V1\Admin\YudisiumController;
use Closure;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure every admin controller has an explicit authorization gate.
 *
 * H-001 fix: Deny by default.
 * Previously, any controller not listed in one of the many permission arrays
 * silently passed with only the top-level role check. A new admin controller
 * added to routes/api/v1-admin.php without being mapped here would therefore
 * be accessible to faculty_admin without the intended per-feature permission.
 *
 * Now: every admin controller MUST appear in {@see self::PERMISSION_MAP}.
 * Unmapped controllers are hard-rejected with a 500-level error, surfacing the
 * misconfiguration immediately rather than leaking a privilege.
 *
 * An architecture-level test (tests/Feature/Security/AdminAuthorizationMapTest)
 * enforces coverage on CI.
 */
class EnsureAdminAuthorization
{
    /**
     * Permission map: fully-qualified controller class => gate ability name.
     *
     * If you add a new admin controller, you MUST add it here. CI will fail
     * until you do (see tests/Feature/Security/AdminAuthorizationMapTest).
     */
    public const PERMISSION_MAP = [
        // Dashboard / landing — all admin roles
        DashboardController::class => 'access-admin-panel',

        // Master data
        TahunAkademikController::class => 'manage-master-data',
        PeriodeController::class => 'manage-master-data',
        PeriodeDocumentTemplateController::class => 'manage-master-data',
        FakultasController::class => 'manage-master-data',
        ProdiController::class => 'manage-master-data',
        LokasiController::class => 'manage-master-data',
        JenisKknController::class => 'manage-master-data',
        JenisKknDocumentRequirementController::class => 'manage-master-data',
        DocumentTemplateController::class => 'manage-master-data',

        // Users
        UserController::class => 'manage-users',
        ProfileChangeRequestController::class => 'manage-users',
        ProfileLockController::class => 'manage-users',
        StudentSyncController::class => 'manage-users',
        DplSyncController::class => 'manage-users',

        // Grades
        GradeController::class => 'view-grades',
        GeneratorNilaiController::class => 'view-grades',
        KonfigurasiPenilaianController::class => 'view-grades',
        BulkCertificateDownloadController::class => 'view-grades',
        DplCalibrationController::class => 'view-grades',

        // Participants (view-only for faculty_admin; mutating methods
        // must re-check 'manage-participants' at the controller level)
        PesertaKknController::class => 'view-participants',
        StudentTransferController::class => 'view-participants',
        ExternalParticipantController::class => 'manage-participants',
        ExternalUniversityController::class => 'manage-participants',
        CollaborationLetterController::class => 'manage-participants',

        // Groups
        KelompokKknAdminController::class => 'manage-groups',

        // DPL
        DplAssignmentController::class => 'manage-dpl',
        DplRegistrationController::class => 'manage-dpl',

        // Content
        AnnouncementController::class => 'manage-content',
        DownloadController::class => 'manage-content',
        PublicContentController::class => 'manage-content',
        NotificationBroadcastController::class => 'manage-content',

        // Audit
        LogAuditController::class => 'view-audit-logs',
        ActivityAuditController::class => 'view-audit-logs',
        UserActivityController::class => 'view-audit-logs',

        // Avatar moderation
        AvatarModerationController::class => 'manage-users',

        // Chat Konsultasi (PRD_CHAT_SYSTEM.md)


        // Reports
        RekapNilaiController::class => 'manage-reports',
        RekapitulasiController::class => 'manage-reports',
        ReportExportController::class => 'manage-reports',
        ComprehensiveReportController::class => 'manage-reports',
        LogbookPdfController::class => 'manage-reports',
        MonitoringController::class => 'manage-settings',

        // Settings
        CertificateConfigController::class => 'manage-settings',
        SystemSettingController::class => 'manage-settings',
        WaGatewayAdminController::class => 'manage-settings',
        PlaygroundController::class => 'manage-settings',

        // Database sync / imports
        DatabaseSyncController::class => 'manage-database-sync',
        DataImportController::class => 'manage-database-sync',
        SiakadSyncAdminController::class => 'manage-database-sync',

        // Workshops
        WorkshopController::class => 'manage-workshops',

        // KKN operations
        EvaluasiController::class => 'manage-kkn-operations',
        DplParticipantEvaluationController::class => 'manage-kkn-operations',
        KegiatanKknAdminController::class => 'manage-kkn-operations',
        ProgramKerjaController::class => 'manage-kkn-operations',
        LaporanAkhirAdminController::class => 'manage-kkn-operations',
        YudisiumController::class => 'manage-kkn-operations',
        DispensasiController::class => 'manage-kkn-operations',

        AiHealthController::class => 'manage-settings',
        CountdownSettingController::class => 'manage-settings',
        AutoPlottingController::class => 'manage-groups',
        InterviewController::class => 'manage-participants',
        LegacyKknTrackingController::class => 'manage-reports',
        PesertaKknListController::class => 'view-participants',
        TransferPesertaController::class => 'manage-participants',

        // Eligibility / requirements
        EligibilityController::class => 'manage-eligibility',
        KknRequirementController::class => 'manage-requirements',
    ];

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
            // R-003 follow-up: if an admin-prefixed route has no controller
            // (i.e., is a closure), it's invisible to PERMISSION_MAP. Block it
            // so admin routes cannot bypass the per-feature permission gate.
            if (str_contains($request->path(), 'api/v1/admin/')) {
                Log::error('Closure route under /admin blocked by EnsureAdminAuthorization', [
                    'uri' => $request->path(),
                    'user_id' => $request->user()?->id,
                ]);

                abort(500, 'Admin route authorization is not configured.');
            }

            return $next($request);
        }

        $controllerClass = get_class($controller);

        // Only apply to admin controllers.
        if (! str_starts_with($controllerClass, 'App\\Http\\Controllers\\Api\\V1\\Admin\\')) {
            return $next($request);
        }

        $user = $request->user();

        // Ensure user is authenticated.
        if (! $user) {
            throw new AuthenticationException('Unauthenticated.', [], url('/login'));
        }

        // Require an admin-ish role first.
        if (! $user->hasAnyRole(['superadmin', 'faculty_admin', 'admin'])) {
            abort(403, 'Unauthorized access to admin area.');
        }

        // Deny-by-default: an admin controller that is NOT in the permission
        // map is a misconfiguration, not an excuse to grant access — even for
        // superadmin. Superadmin may bypass permissions, never map coverage.
        if (! array_key_exists($controllerClass, self::PERMISSION_MAP)) {
            Log::error('EnsureAdminAuthorization: controller missing from PERMISSION_MAP', [
                'controller' => $controllerClass,
                'user_id' => $user->id,
                'route' => $route->getName() ?? $request->path(),
            ]);
            abort(500, 'Authorization misconfiguration. Please contact the administrator.');
        }

        // Superadmin bypasses specific permission checks only after coverage is verified.
        if ($user->hasRole('superadmin')) {
            return $next($request);
        }

        $requiredPermission = self::PERMISSION_MAP[$controllerClass];
        Gate::authorize($requiredPermission);

        return $next($request);
    }
}
