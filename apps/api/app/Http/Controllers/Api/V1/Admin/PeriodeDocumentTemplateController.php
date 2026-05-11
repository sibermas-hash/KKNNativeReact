<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\Periode;
use App\Models\KKN\PeriodeDocumentTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PeriodeDocumentTemplateController extends Controller
{
    use ApiResponse;

    public function index(Periode $periode): JsonResponse
    {
        $periode->load([
            'jenisKkn.documentRequirements.defaultTemplate',
            'documentTemplates.requirement',
            'documentTemplates.template',
        ]);

        $assignments = $periode->documentTemplates->keyBy('jenis_kkn_document_requirement_id');
        $requirements = $periode->jenisKkn?->documentRequirements ?? collect();

        return $this->success([
            'requirements' => $requirements->map(function ($requirement) use ($assignments) {
                $assignment = $assignments->get($requirement->id);
                $template = $assignment?->template;

                return [
                    'id' => $requirement->id,
                    'document_key' => $requirement->document_key,
                    'document_label' => $requirement->document_label,
                    'description' => $requirement->description,
                    'is_required' => $requirement->is_required,
                    'sort_order' => $requirement->sort_order,
                    'template_count' => DocumentTemplate::query()->where('document_key', $requirement->document_key)->count(),
                    'active_template' => $template ? [
                        'id' => $template->id,
                        'name' => $template->name,
                        'file_name' => $template->file_name,
                        'download_url' => route('api.v1.admin.document-templates.download', $template),
                    ] : ($requirement->defaultTemplate ? [
                        'id' => $requirement->defaultTemplate->id,
                        'name' => $requirement->defaultTemplate->name,
                        'file_name' => $requirement->defaultTemplate->file_name,
                        'download_url' => route('api.v1.admin.document-templates.download', $requirement->defaultTemplate),
                        'is_default' => true,
                    ] : null),
                ];
            })->values(),
        ]);
    }

    public function assign(Request $request, Periode $periode): JsonResponse
    {
        $validated = $request->validate([
            'jenis_kkn_document_requirement_id' => ['required', 'exists:jenis_kkn_document_requirements,id'],
            'document_template_id' => ['required', 'exists:document_templates,id'],
        ]);

        $assignment = PeriodeDocumentTemplate::updateOrCreate(
            [
                'periode_id' => $periode->id,
                'jenis_kkn_document_requirement_id' => $validated['jenis_kkn_document_requirement_id'],
            ],
            [
                'document_template_id' => $validated['document_template_id'],
            ]
        );

        return $this->success(['assignment' => $assignment->load(['requirement', 'template'])], 'Template periode berhasil ditetapkan.');
    }

    public function destroy(Periode $periode, PeriodeDocumentTemplate $periodDocumentTemplate): JsonResponse
    {
        abort_if($periodDocumentTemplate->periode_id !== $periode->id, 404);
        $periodDocumentTemplate->delete();

        return $this->noContent('Override template periode berhasil dihapus.');
    }
}
