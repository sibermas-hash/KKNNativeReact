<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\KKN\DocumentTemplate;
use App\Models\KKN\JenisKkn;
use App\Models\KKN\JenisKknDocumentRequirement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\DB;

class JenisKknDocumentRequirementController extends Controller
{
    use ApiResponse;

    public function index(JenisKkn $jenisKkn): JsonResponse
    {
        $jenisKkn->load('documentRequirements.defaultTemplate');

        return $this->success([
            'requirements' => $jenisKkn->documentRequirements->map(fn (JenisKknDocumentRequirement $requirement) => $this->serialize($requirement))->values(),
        ]);
    }

    public function store(Request $request, JenisKkn $jenisKkn): JsonResponse
    {
        $validated = $request->validate([
            'document_key' => [
                'required',
                'string',
                'max:120',
                Rule::unique('jenis_kkn_document_requirements', 'document_key')
                    ->where(fn ($query) => $query->where('jenis_kkn_id', $jenisKkn->id)),
            ],
            'document_label' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_required' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'default_template_id' => ['nullable', 'exists:document_templates,id'],
            'template_file' => ['nullable', 'file', 'mimes:doc,docx,pdf,xls,xlsx', 'max:10240'],
        ], [
            'document_key.unique' => 'Kunci dokumen sudah digunakan pada jenis KKN ini.',
        ]);

        // If file uploaded, create DocumentTemplate automatically
        $templateId = $validated['default_template_id'] ?? null;
        if ($request->hasFile('template_file')) {
            $templateId = $this->createTemplateFromUpload(
                $request->file('template_file'),
                $validated['document_key'],
                $validated['document_label'],
            );
        }

        $requirement = $jenisKkn->documentRequirements()->create([
            'document_key' => $validated['document_key'],
            'document_label' => $validated['document_label'],
            'description' => $validated['description'] ?? null,
            'is_required' => $validated['is_required'] ?? true,
            'sort_order' => $validated['sort_order'] ?? 0,
            'default_template_id' => $templateId,
        ]);

        $requirement->load('defaultTemplate');

        return $this->created(['requirement' => $this->serialize($requirement)], 'Dokumen tambahan berhasil ditambahkan.');
    }

    public function update(Request $request, JenisKkn $jenisKkn, JenisKknDocumentRequirement $requirement): JsonResponse
    {
        abort_if($requirement->jenis_kkn_id !== $jenisKkn->id, 404);

        $validated = $request->validate([
            'document_key' => [
                'sometimes',
                'string',
                'max:120',
                Rule::unique('jenis_kkn_document_requirements', 'document_key')
                    ->where(fn ($query) => $query->where('jenis_kkn_id', $jenisKkn->id))
                    ->ignore($requirement->id),
            ],
            'document_label' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_required' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
            'default_template_id' => ['nullable', 'exists:document_templates,id'],
            'template_file' => ['nullable', 'file', 'mimes:doc,docx,pdf,xls,xlsx', 'max:10240'],
        ], [
            'document_key.unique' => 'Kunci dokumen sudah digunakan pada jenis KKN ini.',
        ]);

        // If file uploaded, create/replace DocumentTemplate
        if ($request->hasFile('template_file')) {
            $validated['default_template_id'] = $this->createTemplateFromUpload(
                $request->file('template_file'),
                $validated['document_key'] ?? $requirement->document_key,
                $validated['document_label'] ?? $requirement->document_label,
            );
        }

        unset($validated['template_file']);
        $requirement->update($validated);
        $requirement->load('defaultTemplate');

        return $this->success(['requirement' => $this->serialize($requirement)], 'Dokumen tambahan berhasil diperbarui.');
    }

    public function destroy(JenisKkn $jenisKkn, JenisKknDocumentRequirement $requirement): JsonResponse
    {
        abort_if($requirement->jenis_kkn_id !== $jenisKkn->id, 404);

        DB::transaction(function () use ($requirement): void {
            $requirement->periodTemplates()->delete();
            $requirement->delete();
        });

        return $this->success(null, 'Dokumen tambahan berhasil dihapus.');
    }

    private function createTemplateFromUpload($file, string $documentKey, string $label): int
    {
        $path = $file->store('document-templates', 'local');

        $template = DocumentTemplate::create([
            'document_key' => $documentKey,
            'name' => "Template {$label}",
            'description' => "Template untuk {$label}",
            'file_path' => $path,
            'file_name' => $file->getClientOriginalName(),
            'mime_type' => $file->getMimeType(),
            'file_size' => $file->getSize(),
            'uploaded_by' => auth()->id(),
            'is_active' => true,
        ]);

        return $template->id;
    }

    private function serialize(JenisKknDocumentRequirement $requirement): array
    {
        return [
            'id' => $requirement->id,
            'document_key' => $requirement->document_key,
            'document_label' => $requirement->document_label,
            'description' => $requirement->description,
            'is_required' => $requirement->is_required,
            'sort_order' => $requirement->sort_order,
            'default_template_id' => $requirement->default_template_id,
            'default_template' => $requirement->defaultTemplate ? [
                'id' => $requirement->defaultTemplate->id,
                'name' => $requirement->defaultTemplate->name,
                'file_name' => $requirement->defaultTemplate->file_name,
                'download_url' => route('api.v1.admin.document-templates.download', $requirement->defaultTemplate),
            ] : null,
        ];
    }
}
