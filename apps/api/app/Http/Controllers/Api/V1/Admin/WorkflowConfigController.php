<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\Periode;
use App\Services\KKN\KknWorkflowService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WorkflowConfigController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly KknWorkflowService $workflowService) {}

    public function showJenis(JenisKkn $jenisKkn): JsonResponse
    {
        $config = $jenisKkn->requirements_config ?? [];
        return $this->success([
            'scope' => 'jenis_kkn',
            'id' => $jenisKkn->id,
            'code' => $jenisKkn->code,
            'name' => $jenisKkn->name,
            'workflow' => $config['workflow'] ?? $this->defaultSteps($jenisKkn->placement_mode),
            'effective' => array_merge($this->workflowService->defaultWorkflow($jenisKkn->placement_mode), $this->workflowService->extractWorkflow($config)),
        ]);
    }

    public function updateJenis(Request $request, JenisKkn $jenisKkn): JsonResponse
    {
        $workflow = $this->validatedWorkflow($request);
        $config = $jenisKkn->requirements_config ?? [];
        $config['workflow'] = $workflow;
        $jenisKkn->update(['requirements_config' => $config]);
        return $this->showJenis($jenisKkn->refresh());
    }

    public function showPeriode(Periode $periode): JsonResponse
    {
        $periode->loadMissing('jenisKkn');
        $jenisConfig = $periode->jenisKkn?->requirements_config ?? [];
        $override = $periode->settings_override ?? [];
        return $this->success([
            'scope' => 'periode',
            'id' => $periode->id,
            'name' => $periode->name,
            'jenis_kkn' => $periode->jenisKkn?->only(['id', 'code', 'name']),
            'workflow' => $override['workflow'] ?? null,
            'base_workflow' => $jenisConfig['workflow'] ?? $this->defaultSteps($periode->placement_mode ?: $periode->jenisKkn?->placement_mode),
            'effective' => array_merge(
                $this->workflowService->defaultWorkflow($periode->placement_mode ?: $periode->jenisKkn?->placement_mode),
                $this->workflowService->extractWorkflow($jenisConfig),
                $this->workflowService->extractWorkflow($override),
            ),
        ]);
    }

    public function updatePeriode(Request $request, Periode $periode): JsonResponse
    {
        $workflow = $this->validatedWorkflow($request);
        $override = $periode->settings_override ?? [];
        $override['workflow'] = $workflow;
        $periode->update(['settings_override' => $override]);
        return $this->showPeriode($periode->refresh());
    }

    public function resetPeriode(Periode $periode): JsonResponse
    {
        $override = $periode->settings_override ?? [];
        unset($override['workflow']);
        $periode->update(['settings_override' => $override]);
        return $this->showPeriode($periode->refresh());
    }

    private function validatedWorkflow(Request $request): array
    {
        $data = $request->validate([
            'workflow' => ['required', 'array'],
            'workflow.steps' => ['nullable', 'array'],
            'workflow.steps.*.key' => ['required_with:workflow.steps', 'string', 'max:80'],
            'workflow.steps.*.label' => ['nullable', 'string', 'max:120'],
            'workflow.steps.*.enabled' => ['nullable', 'boolean'],
            'workflow.steps.*.required' => ['nullable', 'boolean'],
            'workflow.steps.*.actor' => ['nullable', 'string', 'max:50'],
            'workflow.steps.*.mode' => ['nullable', 'string', 'max:80'],
            'workflow.steps.*.depends_on' => ['nullable', 'array'],
            'workflow.steps.*.depends_on.*' => ['string', 'max:80'],
            'workflow.require_documents' => ['nullable', 'boolean'],
            'workflow.require_admin_approval' => ['nullable', 'boolean'],
            'workflow.require_group' => ['nullable', 'boolean'],
            'workflow.require_leader' => ['nullable', 'boolean'],
            'workflow.require_dpl' => ['nullable', 'boolean'],
            'workflow.enable_work_program' => ['nullable', 'boolean'],
            'workflow.enable_daily_report' => ['nullable', 'boolean'],
            'workflow.enable_certificate' => ['nullable', 'boolean'],
        ]);

        return $data['workflow'];
    }

    private function defaultSteps(?string $placementMode = null): array
    {
        return [
            'version' => 1,
            'steps' => [
                ['key' => 'registration', 'label' => 'Pendaftaran', 'enabled' => true, 'required' => true, 'actor' => 'student', 'mode' => 'open'],
                ['key' => 'documents', 'label' => 'Upload Dokumen', 'enabled' => true, 'required' => true, 'actor' => 'student', 'depends_on' => ['registration']],
                ['key' => 'approval', 'label' => 'Review Admin', 'enabled' => true, 'required' => true, 'actor' => 'admin', 'depends_on' => ['documents']],
                ['key' => 'placement', 'label' => 'Plotting Kelompok/Lokasi', 'enabled' => $placementMode !== 'self_determined', 'required' => $placementMode !== 'self_determined', 'actor' => 'admin', 'mode' => $placementMode ?: 'manual_admin', 'depends_on' => ['approval']],
                ['key' => 'leader', 'label' => 'Penetapan Ketua', 'enabled' => true, 'required' => true, 'actor' => 'admin', 'depends_on' => ['placement']],
                ['key' => 'dpl', 'label' => 'Penetapan DPL', 'enabled' => true, 'required' => true, 'actor' => 'admin', 'depends_on' => ['placement']],
                ['key' => 'work_program', 'label' => 'Program Kerja', 'enabled' => true, 'required' => false, 'actor' => 'leader', 'depends_on' => ['leader', 'dpl']],
                ['key' => 'daily_report', 'label' => 'Laporan Harian', 'enabled' => true, 'required' => true, 'actor' => 'member', 'depends_on' => ['work_program']],
                ['key' => 'certificate', 'label' => 'Sertifikat', 'enabled' => true, 'required' => true, 'actor' => 'system', 'depends_on' => ['daily_report']],
            ],
        ];
    }
}
